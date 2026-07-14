package authz

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

type APIKey struct {
	ID          string
	WorkspaceID string
	HashedKey   string
}

func HashKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

func GenerateAPIKey() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate api key: %w", err)
	}
	return "mng_live_" + hex.EncodeToString(buf), nil
}
