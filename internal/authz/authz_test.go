package authz

import (
	"regexp"
	"testing"
)

func TestGenerateAPIKeyFormat(t *testing.T) {
	key, err := GenerateAPIKey()
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	if !regexp.MustCompile(`^mgnt_live_[0-9a-f]{32}$`).MatchString(key) {
		t.Fatalf("unexpected key format: %s", key)
	}
}
