package events

import (
	"time"

	"github.com/google/uuid"
)

// TipoMovimentacao defines whether it is a credit or a debit
type TipoMovimentacao string

const (
	TipoCredito TipoMovimentacao = "credito"
	TipoDebito  TipoMovimentacao = "debito"
)

// ContaCriada is the account creation event
type ContaCriada struct {
	ContaID          uuid.UUID `json:"conta_id"`
	NomeProprietario string    `json:"nome_proprietario"`
	SaldoInicial     float64   `json:"saldo_inicial"`
	Moeda            string    `json:"moeda"`
	CriadoEm         time.Time `json:"criado_em"`
}

// ContaMovimentacao is the movement event (credit or debit)
type ContaMovimentacao struct {
	MovimentacaoID uuid.UUID        `json:"movimentacao_id"`
	ContaID        uuid.UUID        `json:"conta_id"`
	Tipo           TipoMovimentacao `json:"tipo"`
	Valor          float64          `json:"valor"`
	Descricao      string           `json:"descricao"`
	OcorridoEm     time.Time        `json:"ocorrido_em"`

	// For transfers
	ContaDestinoID *uuid.UUID `json:"conta_destino_id,omitempty"`
}

// EventEnvelope is the generic envelope for events in Kafka
type EventEnvelope struct {
	EventID   uuid.UUID         `json:"event_id"`
	EventType string            `json:"event_type"`
	Data      interface{}       `json:"data"`
	Timestamp time.Time         `json:"timestamp"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

const (
	EventTypeContaCriada       = "conta_criada"
	EventTypeContaMovimentacao = "conta_movimentacao"
)
