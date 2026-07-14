package secrets

import (
	"encoding/base64"
	"testing"
)

func TestCipherRoundTripRawKey(t *testing.T) {
	cipher, err := NewCipher("0123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatalf("NewCipher() error = %v", err)
	}
	encoded, err := cipher.EncryptString("sk_live_123")
	if err != nil {
		t.Fatalf("EncryptString() error = %v", err)
	}
	decoded, err := cipher.DecryptString(encoded)
	if err != nil {
		t.Fatalf("DecryptString() error = %v", err)
	}
	if decoded != "sk_live_123" {
		t.Fatalf("DecryptString() = %q, want %q", decoded, "sk_live_123")
	}
}

func TestCipherAcceptsBase64Key(t *testing.T) {
	key := base64.StdEncoding.EncodeToString([]byte("0123456789abcdef0123456789abcdef"))
	if _, err := NewCipher(key); err != nil {
		t.Fatalf("NewCipher() error = %v", err)
	}
}
