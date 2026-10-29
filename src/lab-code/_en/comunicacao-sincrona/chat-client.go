package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"log"
	"os"
	"strings"

	"github.com/gorilla/websocket"
)

// Message defines the message structure used to send data to the server.
type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
}

func main() {
	flag.Parse()
	args := flag.Args()
	if len(args) < 1 {
		log.Fatal("Username é necessário como argumento.")
	}
	username := args[0]

	// Set up the WebSocket connection
	u := "ws://localhost:8080/ws"
	c, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		log.Fatal("dial:", err)
	}
	defer c.Close()

	done := make(chan struct{})

	// Start a goroutine to receive messages
	go func() {
		defer close(done)
		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				return
			}
			log.Printf("%s\n", message)
		}
	}()

	// Read terminal input and send it as a message
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		text := scanner.Text()
		// Ignore empty messages
		if strings.TrimSpace(text) == "" {
			continue
		}
		msg := Message{Username: username, Message: text}
		msgJSON, err := json.Marshal(msg)
		if err != nil {
			log.Println("error encoding message:", err)
			continue
		}
		err = c.WriteMessage(websocket.TextMessage, msgJSON)
		if err != nil {
			log.Println("write:", err)
			break
		}
	}

	<-done
}
