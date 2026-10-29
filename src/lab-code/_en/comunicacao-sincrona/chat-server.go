package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool) // connected clients
var broadcast = make(chan Message)           // broadcast channel
var upgrader = websocket.Upgrader{}

var messages []Message // stores messages for new connections
var mutex sync.Mutex   // for concurrency control

// Message defines the message structure
type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	go handleMessages()

	log.Println("Servidor iniciado na porta :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Erro ListenAndServe: ", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	clients[ws] = true

	// Send message history
	mutex.Lock()
	for _, msg := range messages {
		ws.WriteJSON(msg)
	}
	mutex.Unlock()

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Erro: %v", err)
			delete(clients, ws)
			break
		}

		mutex.Lock()
		messages = append(messages, msg) // Add new message to the history
		mutex.Unlock()

		broadcast <- msg
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			text := fmt.Sprintf("%s: %s\n", msg.Username, msg.Message)
			err := client.WriteMessage(websocket.TextMessage, []byte(text))
			if err != nil {
				log.Printf("Erro: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
