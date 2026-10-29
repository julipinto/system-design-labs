package main

import (
	"fmt"
	"net"
	"net/rpc"
)

type Args struct {
	Peso float64
}

// Recommended protein intake calculation
// Based on the given weight
type Proteinas float64

func (p *Proteinas) Recomendacao(args Args, reply *float64) error {
	// Calculates the recommended protein intake and returns it in the reply object
	*reply = args.Peso * 2
	return nil
}

func main() {

	// Registering the RPC service on port 1234
	proteina := new(Proteinas)
	rpc.Register(proteina)

	ln, err := net.Listen("tcp", ":1234")
	if err != nil {
		fmt.Println("Falha ao ouvir na porta:", err)
		return
	}
	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println("Falha ao aceitar:", err)
			continue
		}
		// Serving the RPC routine
		go rpc.ServeConn(conn)
	}

}
