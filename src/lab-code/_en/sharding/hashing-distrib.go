package main

import (
	"crypto/md5"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/binary"
	"fmt"
	"hash/fnv"
	"strings"
)

// Hash function using SHA-256
func hashSHA256(tenant string) int {
	tenant = strings.ToLower(tenant)
	hash := sha256.New()
	hash.Write([]byte(tenant))
	hashBytes := hash.Sum(nil)
	hashInt := binary.BigEndian.Uint64(hashBytes)
	return int(hashInt)
}

// Hash function using SHA-512
func hashSHA512(tenant string) int {
	tenant = strings.ToLower(tenant)
	hash := sha512.New()
	hash.Write([]byte(tenant))
	hashBytes := hash.Sum(nil)
	hashInt := binary.BigEndian.Uint64(hashBytes)
	return int(hashInt)
}

// Hash function using MD5
func hashMD5(tenant string) int {
	tenant = strings.ToLower(tenant)
	hash := md5.New()
	hash.Write([]byte(tenant))
	hashBytes := hash.Sum(nil)
	hashInt := binary.BigEndian.Uint64(hashBytes)
	return int(hashInt)
}

// Hash function using FNV-1a
func hashFNV1a(tenant string) int {
	tenant = strings.ToLower(tenant)
	hash := fnv.New64a()
	hash.Write([]byte(tenant))
	hashInt := hash.Sum64()
	return int(hashInt)
}

// Simple hash function
func hashSimple(tenant string) int {
	tenant = strings.ToLower(tenant)
	var hash int
	for _, char := range tenant {
		hash += int(char)
	}
	return hash
}

// Function to get the shard using the chosen hash
func getShardByTenant(tenant string, hashFunc func(string) int, numShards int) int {
	hashValue := hashFunc(tenant)
	shard := hashValue % numShards

	if int(shard) < 0 {
		return -int(shard)
	}
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
		"Padaria-Estrela-Filial-1",
		"Padaria-Estrela-Filial-2",
		"Padaria-Estrela-Filial-3",
		"Hortifruti-Oba",
		"Acougue-Zona-Leste",
		"Acougue-Zona-Oeste",
		"Acougue-Zona-Norte",
		"Livraria-Cultura",
		"Drogaria-Sao-Paulo",
		"Supermercado-Extra",
		"Restaurante-Fazenda",
		"Barbearia-Dois-Irmaos",
		"Salão-Beleza-Filial-1",
		"Salão-Beleza-Filial-2",
		"Auto-Peças-Sul",
		"Academia-BoaForma",
		"Escola-Livre",
		"Clínica-Medical",
		"Oficina-Mestre",
		"Padaria-Delicia",
		"Supermercado-Popular",
		"Restaurante-Maré",
		"Barber-Shop-Filial-1",
		"Barber-Shop-Filial-2",
		"Biblioteca-Publica",
		"Pet-Shop-Central",
		"Papelaria-Estudante",
		"Loja-Eletronicos",
		"Construtora-Axis",
		"Lavanderia-Prata",
		"Mercadinho-Barato",
		"Cinema-Central",
		"Loja-Roupas-Filial-1",
		"Loja-Roupas-Filial-2",
		"Café-BonsMomentos",
	}

	// Number of shards
	numShards := 5

	// Hash functions
	hashFuncs := map[string]func(string) int{
		"SHA-256":      hashSHA256,
		"SHA-512":      hashSHA512,
		"MD5":          hashMD5,
		"FNV-1a":       hashFNV1a,
		"Hash Simples": hashSimple,
	}

	// Distribution results
	distributions := make(map[string][]int)

	// Initialize the distributions
	for name := range hashFuncs {
		distributions[name] = make([]int, numShards)
	}

	// Compute the tenant distribution across shards for each hash algorithm
	for _, tenant := range tenants {
		for name, hashFunc := range hashFuncs {
			shard := getShardByTenant(tenant, hashFunc, numShards)
			distributions[name][shard]++
		}
	}

	// Show the results
	for name, dist := range distributions {
		fmt.Printf("Distribuição para %s:\n", name)
		for i, count := range dist {
			fmt.Printf("Shard %d: %d tenants\n", i, count)
		}
		fmt.Println()
	}
}
