package foodphoto

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

// locationAliases mirrors frontend helper.ts normalizeHallKey.
var locationAliases = map[string][]string{
	"Elder":     {"Elder Dining Commons", "Elder"},
	"Sargent":   {"Sargent Dining Commons", "Sargent"},
	"Allison":   {"Allison Dining Commons", "Allison"},
	"Plex East": {"Foster Walker Plex East", "Plex East"},
	"Plex West": {
		"Foster Walker Plex West & Market",
		"Foster Walker Plex West",
		"Plex West",
	},
}

func NormalizeHallKey(locationFromAPI string) string {
	trimmed := strings.TrimSpace(locationFromAPI)
	lower := strings.ToLower(trimmed)
	for shortName, aliases := range locationAliases {
		if trimmed == shortName {
			return shortName
		}
		for _, a := range aliases {
			if trimmed == a || lower == strings.ToLower(a) {
				return shortName
			}
		}
	}
	return trimmed
}

func menuDateKey(date string) string {
	d := strings.TrimSpace(date)
	if len(d) >= 10 && d[4] == '-' {
		return d[:10]
	}
	return d
}

// KeyFromSlot builds a stable id for one menu slot (same inputs as /food query params).
func KeyFromSlot(name, location, date, station, meal string) string {
	parts := []string{
		strings.ToLower(strings.TrimSpace(name)),
		strings.ToLower(NormalizeHallKey(location)),
		strings.ToLower(menuDateKey(date)),
		strings.ToLower(strings.TrimSpace(station)),
		strings.ToLower(strings.TrimSpace(meal)),
	}
	sum := sha256.Sum256([]byte(strings.Join(parts, "|")))
	return hex.EncodeToString(sum[:])
}
