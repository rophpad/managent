package database

import "testing"

func TestDecodeTagsNormalizesNullToEmptySlice(t *testing.T) {
	tags, err := decodeTags([]byte("null"))
	if err != nil {
		t.Fatalf("decodeTags returned an error: %v", err)
	}
	if tags == nil || len(tags) != 0 {
		t.Fatalf("decodeTags(null) = %#v, want non-nil empty slice", tags)
	}
}

func TestNormalizeTagsReturnsEmptySliceForNoTags(t *testing.T) {
	tags := normalizeTags(nil)
	if tags == nil || len(tags) != 0 {
		t.Fatalf("normalizeTags(nil) = %#v, want non-nil empty slice", tags)
	}
}
