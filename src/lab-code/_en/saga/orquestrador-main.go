package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/IBM/sarama"
	_ "github.com/lib/pq"
)

// SagaState represents the possible SAGA states
type SagaState string

const (
	StatePending           SagaState = "PENDING"
	StateOrderValidated    SagaState = "ORDER_VALIDATED"
	StateStockReserved     SagaState = "STOCK_RESERVED"
	StatePaymentProcessed  SagaState = "PAYMENT_PROCESSED"
	StateDeliveryScheduled SagaState = "DELIVERY_SCHEDULED"
	StateCompleted         SagaState = "COMPLETED"
	StateFailed            SagaState = "FAILED"
	StateCompensating      SagaState = "COMPENSATING"
)

// SagaEvent represents a SAGA event
type SagaEvent struct {
	SagaID    string                 `json:"saga_id"`
	OrderID   string                 `json:"order_id"`
	State     SagaState              `json:"state"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	Error     string                 `json:"error,omitempty"`
}

// Command represents a command sent to the services
type Command struct {
	CommandID   string                 `json:"command_id"`
	SagaID      string                 `json:"saga_id"`
	OrderID     string                 `json:"order_id"`
	CommandType string                 `json:"command_type"`
	Payload     map[string]interface{} `json:"payload"`
	Timestamp   time.Time              `json:"timestamp"`
}

// Reply represents a reply from a service
type Reply struct {
	ReplyID   string                 `json:"reply_id"`
	CommandID string                 `json:"command_id"`
	SagaID    string                 `json:"saga_id"`
	Success   bool                   `json:"success"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// Orchestrator manages the SAGAs
type Orchestrator struct {
	db       *sql.DB
	producer sarama.SyncProducer
	consumer sarama.ConsumerGroup
}

func main() {
	log.Println("Iniciando Orquestrador SAGA...")

	// Connect to the database
	db, err := connectDB()
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}
	defer db.Close()

	// Initialize schema
	if err := initSchema(db); err != nil {
		log.Fatal("Erro ao inicializar schema:", err)
	}

	// Set up Kafka Producer
	producer, err := setupProducer()
	if err != nil {
		log.Fatal("Erro ao configurar producer:", err)
	}
	defer producer.Close()

	// Set up Kafka Consumer
	consumer, err := setupConsumer()
	if err != nil {
		log.Fatal("Erro ao configurar consumer:", err)
	}
	defer consumer.Close()

	orch := &Orchestrator{
		db:       db,
		producer: producer,
		consumer: consumer,
	}

	// Start consuming messages
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go orch.consumeMessages(ctx)

	// Wait for the shutdown signal
	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)
	<-sigterm

	log.Println("Encerrando Orquestrador SAGA...")
}

func connectDB() (*sql.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "orquestrador")

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return nil, err
	}

	// Try to connect with retry
	for i := 0; i < 30; i++ {
		if err = db.Ping(); err == nil {
			log.Println("Conectado ao banco de dados")
			return db, nil
		}
		log.Printf("Aguardando banco de dados... (%d/30)", i+1)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("timeout ao conectar no banco")
}

func initSchema(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS saga_events (
		id SERIAL PRIMARY KEY,
		saga_id VARCHAR(100) NOT NULL,
		order_id VARCHAR(100) NOT NULL,
		state VARCHAR(50) NOT NULL,
		data JSONB,
		error TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_saga_id ON saga_events(saga_id);
	CREATE INDEX IF NOT EXISTS idx_order_id ON saga_events(order_id);
	`

	_, err := db.Exec(schema)
	if err != nil {
		return err
	}

	log.Println("Schema do banco inicializado")
	return nil
}

func setupProducer() (sarama.SyncProducer, error) {
	brokers := []string{getEnv("KAFKA_BROKERS", "localhost:9092")}

	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, err
	}

	log.Println("Kafka Producer configurado")
	return producer, nil
}

func setupConsumer() (sarama.ConsumerGroup, error) {
	brokers := []string{getEnv("KAFKA_BROKERS", "localhost:9092")}

	config := sarama.NewConfig()
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRoundRobin()
	config.Consumer.Offsets.Initial = sarama.OffsetNewest

	consumer, err := sarama.NewConsumerGroup(brokers, "orquestrador-group", config)
	if err != nil {
		return nil, err
	}

	log.Println("Kafka Consumer configurado")
	return consumer, nil
}

// consumeMessages consumes both the SAGA start and the service replies
func (o *Orchestrator) consumeMessages(ctx context.Context) {
	topics := []string{
		"pedido-saga-pedido-processar", // SAGA start topic
		"pedidos-reply",
		"estoque-reply",
		"pagamentos-reply",
		"entregas-reply",
	}

	handler := &ConsumerHandler{orchestrator: o}

	for {
		if err := o.consumer.Consume(ctx, topics, handler); err != nil {
			log.Printf("Erro ao consumir mensagens: %v", err)
		}

		if ctx.Err() != nil {
			return
		}
	}
}

// ConsumerHandler implements sarama.ConsumerGroupHandler
type ConsumerHandler struct {
	orchestrator *Orchestrator
}

func (h *ConsumerHandler) Setup(_ sarama.ConsumerGroupSession) error   { return nil }
func (h *ConsumerHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

func (h *ConsumerHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for message := range claim.Messages() {
		topic := message.Topic

		// If it is the SAGA start topic, start a new SAGA
		if topic == "pedido-saga-pedido-processar" {
			if err := h.orchestrator.startNewSaga(message.Value); err != nil {
				log.Printf("Erro ao iniciar SAGA: %v", err)
			}
			session.MarkMessage(message, "")
			continue
		}

		// Otherwise, process the reply
		var reply Reply
		if err := json.Unmarshal(message.Value, &reply); err != nil {
			log.Printf("Erro ao deserializar reply: %v", err)
			session.MarkMessage(message, "")
			continue
		}

		log.Printf("Reply recebido: %s - Success: %t - Message: %s",
			topic, reply.Success, reply.Message)

		// Process the reply according to the state machine
		if err := h.orchestrator.processReply(topic, &reply); err != nil {
			log.Printf("Erro ao processar reply: %v", err)
		}

		session.MarkMessage(message, "")
	}
	return nil
}

// startNewSaga starts a new SAGA from the received order
func (o *Orchestrator) startNewSaga(data []byte) error {
	var orderData map[string]interface{}
	if err := json.Unmarshal(data, &orderData); err != nil {
		return err
	}

	sagaID := generateID()
	orderID, ok := orderData["order_id"].(string)
	if !ok {
		orderID = generateID()
		orderData["order_id"] = orderID
	}

	log.Printf("Iniciando nova SAGA: %s para pedido: %s", sagaID, orderID)

	// Save the initial event
	event := &SagaEvent{
		SagaID:    sagaID,
		OrderID:   orderID,
		State:     StatePending,
		Data:      orderData,
		Timestamp: time.Now(),
	}

	if err := o.saveEvent(event); err != nil {
		return err
	}

	// Start the SAGA by sending a command to validate the order
	cmd := &Command{
		CommandID:   generateID(),
		SagaID:      sagaID,
		OrderID:     orderID,
		CommandType: "VALIDATE_ORDER",
		Payload:     orderData,
		Timestamp:   time.Now(),
	}

	return o.sendCommand("pedidos-commands", cmd)
}

// processReply processes the reply and advances the state machine
func (o *Orchestrator) processReply(topic string, reply *Reply) error {
	// Fetch the current SAGA state
	currentState, err := o.getCurrentState(reply.SagaID)
	if err != nil {
		return err
	}

	log.Printf("Estado atual da SAGA %s: %s", reply.SagaID, currentState)

	// If the reply was a failure, start compensation
	if !reply.Success {
		return o.startCompensation(reply.SagaID, currentState, reply.Message)
	}

	// Advance to the next state based on the topic
	var nextState SagaState
	var nextCommand *Command

	// Extract order_id safely
	orderID := o.getOrderID(reply)

	switch topic {
	case "pedidos-reply":
		nextState = StateOrderValidated
		// Next step: reserve stock
		nextCommand = &Command{
			CommandID:   generateID(),
			SagaID:      reply.SagaID,
			OrderID:     orderID,
			CommandType: "RESERVE_STOCK",
			Payload:     reply.Data,
			Timestamp:   time.Now(),
		}
		if err := o.sendCommand("estoque-commands", nextCommand); err != nil {
			return err
		}

	case "estoque-reply":
		nextState = StateStockReserved
		// Next step: process payment
		nextCommand = &Command{
			CommandID:   generateID(),
			SagaID:      reply.SagaID,
			OrderID:     orderID,
			CommandType: "PROCESS_PAYMENT",
			Payload:     reply.Data,
			Timestamp:   time.Now(),
		}
		if err := o.sendCommand("pagamentos-commands", nextCommand); err != nil {
			return err
		}

	case "pagamentos-reply":
		nextState = StatePaymentProcessed
		// Next step: schedule delivery
		nextCommand = &Command{
			CommandID:   generateID(),
			SagaID:      reply.SagaID,
			OrderID:     orderID,
			CommandType: "SCHEDULE_DELIVERY",
			Payload:     reply.Data,
			Timestamp:   time.Now(),
		}
		if err := o.sendCommand("entregas-commands", nextCommand); err != nil {
			return err
		}

	case "entregas-reply":
		nextState = StateCompleted
		log.Printf("SAGA %s concluída com sucesso!", reply.SagaID)

		// Publish order-processed event
		if err := o.publishOrderProcessed(reply.SagaID, reply.Data); err != nil {
			log.Printf("Erro ao publicar pedido processado: %v", err)
		}
	}

	// Save the state transition event
	return o.saveEvent(&SagaEvent{
		SagaID:    reply.SagaID,
		OrderID:   orderID,
		State:     nextState,
		Data:      reply.Data,
		Timestamp: time.Now(),
	})
}

// startCompensation starts the compensation process
func (o *Orchestrator) startCompensation(sagaID string, currentState SagaState, errorMsg string) error {
	log.Printf("Iniciando compensação para SAGA %s. Motivo: %s", sagaID, errorMsg)

	// Save the compensation event
	event := &SagaEvent{
		SagaID:    sagaID,
		State:     StateCompensating,
		Error:     errorMsg,
		Timestamp: time.Now(),
	}

	if err := o.saveEvent(event); err != nil {
		return err
	}

	// Run compensations in reverse order
	switch currentState {
	case StatePaymentProcessed:
		// Cancel payment
		o.sendCompensation("pagamentos-commands", sagaID, "CANCEL_PAYMENT")
		fallthrough
	case StateStockReserved:
		// Release stock
		o.sendCompensation("estoque-commands", sagaID, "RELEASE_STOCK")
		fallthrough
	case StateOrderValidated:
		// Cancel order
		o.sendCompensation("pedidos-commands", sagaID, "CANCEL_ORDER")
	}

	// Mark SAGA as failed
	return o.saveEvent(&SagaEvent{
		SagaID:    sagaID,
		State:     StateFailed,
		Error:     errorMsg,
		Timestamp: time.Now(),
	})
}

func (o *Orchestrator) sendCompensation(topic, sagaID, commandType string) error {
	cmd := &Command{
		CommandID:   generateID(),
		SagaID:      sagaID,
		CommandType: commandType,
		Timestamp:   time.Now(),
	}
	return o.sendCommand(topic, cmd)
}

func (o *Orchestrator) sendCommand(topic string, cmd *Command) error {
	data, err := json.Marshal(cmd)
	if err != nil {
		return err
	}

	msg := &sarama.ProducerMessage{
		Topic: topic,
		Value: sarama.ByteEncoder(data),
	}

	_, _, err = o.producer.SendMessage(msg)
	if err != nil {
		return err
	}

	log.Printf("Comando enviado para %s: %s", topic, cmd.CommandType)
	return nil
}

// publishOrderProcessed publishes the successfully processed order event
func (o *Orchestrator) publishOrderProcessed(sagaID string, data map[string]interface{}) error {
	event := map[string]interface{}{
		"saga_id":   sagaID,
		"order_id":  data["order_id"],
		"status":    "COMPLETED",
		"timestamp": time.Now().Format(time.RFC3339),
		"data":      data,
	}

	eventData, err := json.Marshal(event)
	if err != nil {
		return err
	}

	msg := &sarama.ProducerMessage{
		Topic: "pedido-saga-pedido-processado",
		Value: sarama.ByteEncoder(eventData),
	}

	_, _, err = o.producer.SendMessage(msg)
	if err != nil {
		return err
	}

	log.Printf("Pedido processado publicado: SAGA %s", sagaID)
	return nil
}

func (o *Orchestrator) saveEvent(event *SagaEvent) error {
	dataJSON, _ := json.Marshal(event.Data)

	_, err := o.db.Exec(
		"INSERT INTO saga_events (saga_id, order_id, state, data, error) VALUES ($1, $2, $3, $4, $5)",
		event.SagaID, event.OrderID, event.State, dataJSON, event.Error,
	)

	if err != nil {
		return err
	}

	log.Printf("Evento salvo: SAGA %s -> %s", event.SagaID, event.State)
	return nil
}

func (o *Orchestrator) getCurrentState(sagaID string) (SagaState, error) {
	var state string
	err := o.db.QueryRow(
		"SELECT state FROM saga_events WHERE saga_id = $1 ORDER BY created_at DESC LIMIT 1",
		sagaID,
	).Scan(&state)

	if err != nil {
		return StatePending, err
	}

	return SagaState(state), nil
}

// getOrderID safely extracts the order_id from reply.Data
func (o *Orchestrator) getOrderID(reply *Reply) string {
	if reply.Data == nil {
		return ""
	}

	if orderID, ok := reply.Data["order_id"].(string); ok {
		return orderID
	}

	return ""
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
