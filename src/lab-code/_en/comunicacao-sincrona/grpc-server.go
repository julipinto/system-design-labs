package main

import (
	"context"
	"fmt"
	imc "main/service/imc"
	"math"
	"net"

	"google.golang.org/grpc"
)

// Creates a service based on the given protobuf
type service struct {
	imc.IMCServiceServer
}

// Method used to calculate the BMI from the given height and weight
func (s *service) Calcular(ctx context.Context, in *imc.IMCRequest) (*imc.IMCResponse, error) {
	fmt.Println("Iniciando Calculo")
	result := (in.Weight / (in.Height * in.Height)) * 1
	result = math.Round(result*100) / 100
	return &imc.IMCResponse{Result: float64(result)}, nil
}

func main() {
	// Allocating port 50051 for the server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		fmt.Println("Falha ao servir na porta 50051:", err)
		return
	}

	// Create a gRPC server
	s := grpc.NewServer()

	// Register the calculation service on the gRPC server
	fmt.Println("Registrando o serviço de Calculo de IMC no server gRPC")
	imc.RegisterIMCServiceServer(s, &service{})

	// Start the server on the allocated port
	if err := s.Serve(lis); err != nil {
		fmt.Println("Falha criar o servidor gRPC:", err)
		return
	}
}
