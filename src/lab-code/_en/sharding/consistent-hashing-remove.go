package main

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// Represents a node on the hash ring.
type Node struct {
	ID   string
	Hash uint64
}

// Represents the hash ring that holds several nodes.
type ConsistentHashRing struct {
	Nodes       []Node
	NumReplicas int
}

// Creates a new hash ring.
func NewConsistentHashRing(numReplicas int) *ConsistentHashRing {
	return &ConsistentHashRing{
		Nodes:       []Node{},
		NumReplicas: numReplicas,
	}
}

// Adds a new node to the Hash Ring
func (ring *ConsistentHashRing) AddNode(nodeID string) {
	for i := 0; i < ring.NumReplicas; i++ {
		replicaID := nodeID + strconv.Itoa(i)
		hash := hashTenant(replicaID)
		ring.Nodes = append(ring.Nodes, Node{ID: nodeID, Hash: hash})
	}
	sort.Slice(ring.Nodes, func(i, j int) bool {
		return ring.Nodes[i].Hash < ring.Nodes[j].Hash
	})
}

// Removes an existing node from the Hash Ring
func (ring *ConsistentHashRing) RemoveNode(nodeID string) {
	var newNodes []Node
	for _, node := range ring.Nodes {
		if node.ID != nodeID {
			newNodes = append(newNodes, node)
		}
	}
	ring.Nodes = newNodes
	sort.Slice(ring.Nodes, func(i, j int) bool {
		return ring.Nodes[i].Hash < ring.Nodes[j].Hash
	})
}

// Returns the node where the Tenant should be allocated
func (ring *ConsistentHashRing) GetTenantNode(key string) string {
	hash := hashTenant(key)
	idx := sort.Search(len(ring.Nodes), func(i int) bool {
		return ring.Nodes[i].Hash >= hash
	})

	// If the index is out of bounds, wrap around to the first node
	if idx == len(ring.Nodes) {
		idx = 0
	}

	return ring.Nodes[idx].ID
}

// Computes the tenant hash and converts it to uint64.
func hashTenant(s string) uint64 {
	s = strings.ToLower(s)
	hash := sha256.New()
	hash.Write([]byte(s))
	hashBytes := hash.Sum(nil)
	return binary.BigEndian.Uint64(hashBytes[:8])
}

func main() {
	// Creates a new consistent hash ring with 3 replicas per node.
	ring := NewConsistentHashRing(3)

	// Add pseudo-nodes to the hash ring
	ring.AddNode("Shard-00")
	ring.AddNode("Shard-01")
	ring.AddNode("Shard-02")
	ring.AddNode("Shard-03")

	// List of Tenants
	keys := []string{
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

	// Initial distribution of Tenants across Nodes
	for _, key := range keys {
		node := ring.GetTenantNode(key)
		fmt.Printf("Tenant: %s, Node: %s\n", key, node)
	}

	// Removes a node and shows the new key distribution.
	ring.RemoveNode("Shard-02")
	fmt.Println("\nRemovendo Shard-02:\n")
	for _, key := range keys {
		node := ring.GetTenantNode(key)
		fmt.Printf("Tenant: %s, Shard: %s\n", key, node)
	}

	ring.AddNode("Shard-04")
	fmt.Println("\nAdicionando Shard-04:\n")
	for _, key := range keys {
		node := ring.GetTenantNode(key)
		fmt.Printf("Tenant: %s, Shard: %s\n", key, node)
	}

}
