package secrets

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"strings"
)

type Cipher struct {
	aead cipher.AEAD
}

func NewCipher(rawKey string) (*Cipher, error) {
	trimmed := strings.TrimSpace(rawKey)
	if trimmed == "" {
		return nil, nil
	}
	key, err := parseKey(trimmed)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &Cipher{aead: aead}, nil
}

func parseKey(raw string) ([]byte, error) {
	if len(raw) == 32 {
		return []byte(raw), nil
	}
	if decoded, err := base64.StdEncoding.DecodeString(raw); err == nil {
		if len(decoded) != 32 {
			return nil, fmt.Errorf("mcp secret key must decode to 32 bytes")
		}
		return decoded, nil
	}
	return nil, fmt.Errorf("mcp secret key must be 32 raw bytes or base64 for 32 bytes")
}

func (c *Cipher) EncryptString(value string) (string, error) {
	if c == nil {
		return "", fmt.Errorf("mcp secret key is not configured")
	}
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	sealed := c.aead.Seal(nil, nonce, []byte(value), nil)
	payload := append(nonce, sealed...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

func (c *Cipher) DecryptString(value string) (string, error) {
	if c == nil {
		return "", fmt.Errorf("mcp secret key is not configured")
	}
	payload, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return "", err
	}
	nonceSize := c.aead.NonceSize()
	if len(payload) < nonceSize {
		return "", fmt.Errorf("encrypted secret payload is too short")
	}
	plain, err := c.aead.Open(nil, payload[:nonceSize], payload[nonceSize:], nil)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}
