package events

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// DebeziumEvent represents a Debezium CDC event already "unwrapped" (ExtractNewRecordState)
// The payload comes directly with the data, no before/after envelope
type DebeziumEvent struct {
	// Table payload fields
	Data map[string]interface{}

	// Debezium metadata (injected with __ prefix)
	Op       string `json:"__op"`      // c=create, u=update, d=delete, r=read
	Deleted  string `json:"__deleted"` // "true" or "false"
	SourceMs int64  `json:"__source_ts_ms"`
}

// UnmarshalJSON custom, to capture all fields
func (e *DebeziumEvent) UnmarshalJSON(data []byte) error {
	// First, deserialize into a generic map
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	// Extract Debezium metadata
	if op, ok := raw["__op"].(string); ok {
		e.Op = op
	}
	if deleted, ok := raw["__deleted"].(string); ok {
		e.Deleted = deleted
	}
	if sourceMs, ok := raw["__source_ts_ms"].(float64); ok {
		e.SourceMs = int64(sourceMs)
	}

	// All fields (including metadata) go into Data
	e.Data = raw

	return nil
}

// CDCEventHandler processes Debezium CDC events
type CDCEventHandler struct {
	db *sql.DB
}

// NewCDCEventHandler creates a new CDC event handler
func NewCDCEventHandler(db *sql.DB) *CDCEventHandler {
	return &CDCEventHandler{db: db}
}

// HandlePrescricaoCDC processes CDC events from the Prescricoes table
func (h *CDCEventHandler) HandlePrescricaoCDC(ctx context.Context, eventData []byte) error {
	var event DebeziumEvent
	if err := json.Unmarshal(eventData, &event); err != nil {
		return fmt.Errorf("erro ao deserializar evento CDC: %w", err)
	}

	log.Printf("Evento CDC recebido: operação=%s", event.Op)

	// Process only inserts (create) and reads (snapshot)
	if event.Op != "c" && event.Op != "r" {
		log.Printf("Ignorando operação %s - processamos apenas inserções", event.Op)
		return nil
	}

	// Check whether it was deleted
	if event.Deleted == "true" {
		log.Printf("Ignorando registro deletado")
		return nil
	}

	// Extract prescription data from the unwrapped payload
	idPrescricao := int(event.Data["id"].(float64))
	idMedico := int(event.Data["id_medico"].(float64))
	idPaciente := int(event.Data["id_paciente"].(float64))

	// Parse data_prescricao - may come as microseconds (timestamp)
	var dataPrescricao time.Time
	switch v := event.Data["data_prescricao"].(type) {
	case float64:
		// Timestamp in microseconds
		dataPrescricao = time.Unix(0, int64(v)*1000)
	case string:
		// ISO 8601 string
		var err error
		dataPrescricao, err = time.Parse(time.RFC3339Nano, v)
		if err != nil {
			dataPrescricao, err = time.Parse("2006-01-02T15:04:05.999999Z07:00", v)
			if err != nil {
				return fmt.Errorf("erro ao parsear data_prescricao: %w", err)
			}
		}
	default:
		return fmt.Errorf("formato desconhecido para data_prescricao: %T", v)
	}

	log.Printf("Processando prescrição CDC: ID=%d Médico=%d Paciente=%d Data=%s",
		idPrescricao, idMedico, idPaciente, dataPrescricao.Format(time.RFC3339))

	// Fetch full data to populate the views
	medico, err := h.getMedico(ctx, idMedico)
	if err != nil {
		return fmt.Errorf("erro ao buscar médico: %w", err)
	}

	paciente, err := h.getPaciente(ctx, idPaciente)
	if err != nil {
		return fmt.Errorf("erro ao buscar paciente: %w", err)
	}

	// Fetch the prescription medications
	medicamentos, err := h.getMedicamentosPrescricao(ctx, idPrescricao)
	if err != nil {
		return fmt.Errorf("erro ao buscar medicamentos: %w", err)
	}

	// Update views for each medication
	for _, med := range medicamentos {
		// Update Pharmacy view
		if err := h.atualizarViewFarmacia(ctx, idPrescricao, dataPrescricao, paciente, med); err != nil {
			log.Printf("Erro ao atualizar view farmácia: %v", err)
		}

		// Update Medical Record view
		if err := h.atualizarViewProntuario(ctx, idPrescricao, dataPrescricao, medico, paciente, med); err != nil {
			log.Printf("Erro ao atualizar view prontuário: %v", err)
		}
	}

	log.Printf("Evento CDC processado: Views atualizadas para prescrição %d", idPrescricao)
	return nil
}

// HandlePrescricaoMedicamentoCDC processes CDC events from the Prescricao_Medicamentos table
func (h *CDCEventHandler) HandlePrescricaoMedicamentoCDC(ctx context.Context, eventData []byte) error {
	var event DebeziumEvent
	if err := json.Unmarshal(eventData, &event); err != nil {
		return fmt.Errorf("erro ao deserializar evento CDC: %w", err)
	}

	log.Printf("Evento CDC Medicamento recebido: operação=%s", event.Op)

	// Process only inserts
	if event.Op != "c" && event.Op != "r" {
		log.Printf("Ignorando operação %s - processamos apenas inserções", event.Op)
		return nil
	}

	// Check whether it was deleted
	if event.Deleted == "true" {
		log.Printf("Ignorando registro deletado")
		return nil
	}

	// Extract data from the unwrapped payload
	idPrescricao := int(event.Data["id_prescricao"].(float64))
	idMedicamento := int(event.Data["id_medicamento"].(float64))
	horario := event.Data["horario"].(string)
	dosagem := event.Data["dosagem"].(string)

	log.Printf("Processando medicamento CDC: Prescrição=%d Medicamento=%d", idPrescricao, idMedicamento)

	// Fetch prescription
	prescricao, err := h.getPrescricao(ctx, idPrescricao)
	if err != nil {
		return fmt.Errorf("erro ao buscar prescrição: %w", err)
	}

	// Fetch full data
	medico, err := h.getMedico(ctx, prescricao["id_medico"].(int))
	if err != nil {
		return fmt.Errorf("erro ao buscar médico: %w", err)
	}

	paciente, err := h.getPaciente(ctx, prescricao["id_paciente"].(int))
	if err != nil {
		return fmt.Errorf("erro ao buscar paciente: %w", err)
	}

	medicamento, err := h.getMedicamento(ctx, idMedicamento)
	if err != nil {
		return fmt.Errorf("erro ao buscar medicamento: %w", err)
	}

	// Add schedule and dosage to the medication
	medicamento["horario"] = horario
	medicamento["dosagem"] = dosagem

	dataPrescricao := prescricao["data_prescricao"].(time.Time)

	// Update views
	if err := h.atualizarViewFarmacia(ctx, idPrescricao, dataPrescricao, paciente, medicamento); err != nil {
		log.Printf("Erro ao atualizar view farmácia: %v", err)
	}

	if err := h.atualizarViewProntuario(ctx, idPrescricao, dataPrescricao, medico, paciente, medicamento); err != nil {
		log.Printf("Erro ao atualizar view prontuário: %v", err)
	}

	log.Printf("Medicamento CDC processado e views atualizadas")
	return nil
}

// getMedicamentosPrescricao fetches all medications of a prescription
func (h *CDCEventHandler) getMedicamentosPrescricao(ctx context.Context, idPrescricao int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			m.id, m.nome, m.descricao,
			pm.horario, pm.dosagem
		FROM Prescricao_Medicamentos pm
		JOIN Medicamentos m ON m.id = pm.id_medicamento
		WHERE pm.id_prescricao = $1
	`

	rows, err := h.db.QueryContext(ctx, query, idPrescricao)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medicamentos []map[string]interface{}
	for rows.Next() {
		var id int
		var nome, descricao, horario, dosagem string

		if err := rows.Scan(&id, &nome, &descricao, &horario, &dosagem); err != nil {
			return nil, err
		}

		medicamentos = append(medicamentos, map[string]interface{}{
			"id":        id,
			"nome":      nome,
			"descricao": descricao,
			"horario":   horario,
			"dosagem":   dosagem,
		})
	}

	return medicamentos, nil
}

// getPrescricao fetches a prescription by ID
func (h *CDCEventHandler) getPrescricao(ctx context.Context, id int) (map[string]interface{}, error) {
	var (
		prescricaoID   int
		idMedico       int
		idPaciente     int
		dataPrescricao time.Time
	)

	query := `SELECT id, id_medico, id_paciente, data_prescricao FROM Prescricoes WHERE id = $1`
	err := h.db.QueryRowContext(ctx, query, id).Scan(&prescricaoID, &idMedico, &idPaciente, &dataPrescricao)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":              prescricaoID,
		"id_medico":       idMedico,
		"id_paciente":     idPaciente,
		"data_prescricao": dataPrescricao,
	}, nil
}

// atualizarViewFarmacia updates the pharmacy read model
func (h *CDCEventHandler) atualizarViewFarmacia(ctx context.Context, idPrescricao int, dataPrescricao time.Time, paciente, medicamento map[string]interface{}) error {
	query := `
		INSERT INTO View_Farmacia (
			id_prescricao, data_prescricao,
			paciente_id, paciente_nome, paciente_data_nascimento,
			medicamento_id, medicamento_nome, medicamento_descricao,
			horario, dosagem
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := h.db.ExecContext(ctx, query,
		idPrescricao, dataPrescricao,
		paciente["id"], paciente["nome"], paciente["data_nascimento"],
		medicamento["id"], medicamento["nome"], medicamento["descricao"],
		medicamento["horario"], medicamento["dosagem"],
	)

	if err != nil {
		return fmt.Errorf("erro ao inserir em View_Farmacia: %w", err)
	}

	log.Printf("View Farmácia atualizada para prescrição %d", idPrescricao)
	return nil
}

// atualizarViewProntuario updates the medical record read model
func (h *CDCEventHandler) atualizarViewProntuario(ctx context.Context, idPrescricao int, dataPrescricao time.Time, medico, paciente, medicamento map[string]interface{}) error {
	query := `
		INSERT INTO View_Prontuario_Paciente (
			id_prescricao, data_prescricao,
			paciente_id, paciente_nome, paciente_data_nascimento, paciente_endereco,
			medico_id, medico_nome, medico_especialidade, medico_crm,
			medicamento_id, medicamento_nome, medicamento_descricao,
			horario, dosagem
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err := h.db.ExecContext(ctx, query,
		idPrescricao, dataPrescricao,
		paciente["id"], paciente["nome"], paciente["data_nascimento"], paciente["endereco"],
		medico["id"], medico["nome"], medico["especialidade"], medico["crm"],
		medicamento["id"], medicamento["nome"], medicamento["descricao"],
		medicamento["horario"], medicamento["dosagem"],
	)

	if err != nil {
		return fmt.Errorf("erro ao inserir em View_Prontuario_Paciente: %w", err)
	}

	log.Printf("View Prontuário atualizada para prescrição %d", idPrescricao)
	return nil
}

// Helper functions to fetch data (reused from the original handler.go)
func (h *CDCEventHandler) getMedico(ctx context.Context, id int) (map[string]interface{}, error) {
	var (
		medicoID      int
		nome          string
		especialidade string
		crm           string
	)

	query := `SELECT id, nome, especialidade, crm FROM Medicos WHERE id = $1`
	err := h.db.QueryRowContext(ctx, query, id).Scan(&medicoID, &nome, &especialidade, &crm)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":            medicoID,
		"nome":          nome,
		"especialidade": especialidade,
		"crm":           crm,
	}, nil
}

func (h *CDCEventHandler) getPaciente(ctx context.Context, id int) (map[string]interface{}, error) {
	var (
		pacienteID     int
		nome           string
		dataNascimento time.Time
		endereco       string
	)

	query := `SELECT id, nome, data_nascimento, endereco FROM Pacientes WHERE id = $1`
	err := h.db.QueryRowContext(ctx, query, id).Scan(&pacienteID, &nome, &dataNascimento, &endereco)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":              pacienteID,
		"nome":            nome,
		"data_nascimento": dataNascimento,
		"endereco":        endereco,
	}, nil
}

func (h *CDCEventHandler) getMedicamento(ctx context.Context, id int) (map[string]interface{}, error) {
	var (
		medicamentoID int
		nome          string
		descricao     string
	)

	query := `SELECT id, nome, descricao FROM Medicamentos WHERE id = $1`
	err := h.db.QueryRowContext(ctx, query, id).Scan(&medicamentoID, &nome, &descricao)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":        medicamentoID,
		"nome":      nome,
		"descricao": descricao,
	}, nil
}
