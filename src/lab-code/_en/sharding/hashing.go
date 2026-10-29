package main

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"strings"
)

// Computes the SHA-256 hash of the tenant value and converts it to an integer
func hashTenant(tenant string) int {
	tenant = strings.ToLower(tenant) // Convert the tenant value to lowercase
	hash := sha256.New()
	hash.Write([]byte(tenant))
	hashBytes := hash.Sum(nil)
	hashInt := binary.BigEndian.Uint64(hashBytes)

	// Convert the value to a positive one in case the hashint is negative
	if int(hashInt) < 0 {
		return -int(hashInt)
	}
	return int(hashInt)
}

// Takes a tenant string and the number of shards, returning the matching shard number
func getShardByTenant(tenant string) int {
	numShards := 3

	hashValue := hashTenant(tenant)
	shard := hashValue % numShards
	return shard
}

func main() {
	// List of tenants
	tenants := []string{
		"Petshops-Souza",
		"Pizzarias-Carvalho",
		"Mecanica-Dois-Irmaos",
		"Padaria-Estrela-Filial-1",
		"Padaria-Estrela-Filial-2",
		"Padaria-Estrela-Filial-3",
		"Hortifruti-Oba",
		"Acougue-Zona-Leste",
		"Acougue-Zona-Oeste",
		"Acougue-Zona-Norte",
	}

	// Check the distribution of tenants across shards
	for _, tenant := range tenants {
		shard := getShardByTenant(tenant)
		fmt.Printf("Tenant: %s, Shard: %d\n", tenant, shard)
	}
}
