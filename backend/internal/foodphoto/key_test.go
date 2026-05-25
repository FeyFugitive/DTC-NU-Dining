package foodphoto

import "testing"

func TestKeyFromSlot_stable(t *testing.T) {
	a := KeyFromSlot("Apple Crisp", "Sargent Dining Commons", "2026-05-08", "Bakery", "Lunch")
	b := KeyFromSlot("Apple Crisp", "Sargent", "2026-05-08", "Bakery", "Lunch")
	if a != b {
		t.Fatalf("normalized location should match key: %q vs %q", a, b)
	}
}
