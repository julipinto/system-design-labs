package commands

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"hospital-cqrs/internal/domain"
	"hospital-cqrs/internal/events"
	"hospital-cqrs/pkg/kafka"
)

// PrescricaoHandler handles prescription commands
type PrescricaoHandler struct {
	repo     *PrescricaoRepository
	producer *kafka.Producer
}

// NewPrescricaoHandler creates a new prescription handler
func NewPrescricaoHandler(db *sql.DB, producer *kafka.Producer) *PrescricaoHandler {
	return &PrescricaoHandler{
		repo:     NewPrescricaoRepository(db),
		producer: producer,
	}
}

// CriarPrescricao processes the create-prescription command
func (h *PrescricaoHandler) CriarPrescricao(ctx context.Context, dto domain.CriarPrescricaoDTO) (*domain.Prescricao, error) {
	// Validate that the doctor exists
	_, err := h.repo.GetMedicoByID(ctx, dto.IDMedico)
	if err != nil {
		return nil, fmt.Errorf("médico não encontrado: %w", err)
	}

	// Validate that the patient exists
	_, err = h.repo.GetPacienteByID(ctx, dto.IDPaciente)
	if err != nil {
		return nil, fmt.Errorf("paciente não encontrado: %w", err)
	}

	// Validate that the medications exist
	for _, med := range dto.Medicamentos {
		_, err := h.repo.GetMedicamentoByID(ctx, med.IDMedicamento)
		if err != nil {
			return nil, fmt.Errorf("medicamento %d não encontrado: %w", med.IDMedicamento, err)
		}
	}

	// Create prescription
	prescricao, prescricaoMedicamentos, err := h.repo.CriarPrescricao(ctx, dto)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar prescrição: %w", err)
	}

	// Create the prescription-created event
	medicamentosEvent := make([]events.MedicamentoPrescritoEvent, len(prescricaoMedicamentos))
	for i, pm := range prescricaoMedicamentos {
		medicamentosEvent[i] = events.MedicamentoPrescritoEvent{
			IDMedicamento: pm.IDMedicamento,
			Horario:       pm.Horario,
			Dosagem:       pm.Dosagem,
		}
	}

	eventData := events.PrescricaoCriadaEventData{
		IDPrescricao:   prescricao.ID,
		IDMedico:       prescricao.IDMedico,
		IDPaciente:     prescricao.IDPaciente,
		DataPrescricao: prescricao.DataPrescricao,
		Medicamentos:   medicamentosEvent,
	}

	event := events.NewPrescricaoCriadaEvent(eventData)

	// Publish event to Kafka
	eventKey := fmt.Sprintf("prescricao-%d", prescricao.ID)
	if err := h.producer.Publish(ctx, eventKey, event); err != nil {
		log.Printf("AVISO: Erro ao publicar evento, mas prescrição foi criada: %v", err)
		// Does not return an error because the prescription was created successfully
		// The event can be republished later
	}

	log.Printf("Prescrição criada com sucesso: ID %d", prescricao.ID)
	return prescricao, nil
}

// ListMedicos returns the list of doctors
func (h *PrescricaoHandler) ListMedicos(ctx context.Context) ([]domain.Medico, error) {
	return h.repo.ListMedicos(ctx)
}

// ListPacientes returns the list of patients
func (h *PrescricaoHandler) ListPacientes(ctx context.Context) ([]domain.Paciente, error) {
	return h.repo.ListPacientes(ctx)
}

// ListMedicamentos returns the list of medications
func (h *PrescricaoHandler) ListMedicamentos(ctx context.Context) ([]domain.Medicamento, error) {
	return h.repo.ListMedicamentos(ctx)
}
