package scraper

import (
	"backend/internal/models"
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// itemDetailPayload unmarshals several DOC item-detail JSON shapes.
type itemDetailPayload struct {
	Ingredients         string `json:"ingredients"`
	IngredientStatement string `json:"ingredient_statement"`
	Nutrients           []models.Nutrient `json:"nutrients"`
	Item                *struct {
		Ingredients         string `json:"ingredients"`
		IngredientStatement string `json:"ingredient_statement"`
		Nutrients           []models.Nutrient `json:"nutrients"`
	} `json:"item"`
	Data *struct {
		Ingredients         string `json:"ingredients"`
		IngredientStatement string `json:"ingredient_statement"`
		Nutrients           []models.Nutrient `json:"nutrients"`
	} `json:"data"`
}

func (p itemDetailPayload) ingredientsString() string {
	if s := strings.TrimSpace(p.Ingredients); s != "" {
		return s
	}
	if s := strings.TrimSpace(p.IngredientStatement); s != "" {
		return s
	}
	if p.Item != nil {
		if s := strings.TrimSpace(p.Item.Ingredients); s != "" {
			return s
		}
		if s := strings.TrimSpace(p.Item.IngredientStatement); s != "" {
			return s
		}
	}
	if p.Data != nil {
		if s := strings.TrimSpace(p.Data.Ingredients); s != "" {
			return s
		}
		if s := strings.TrimSpace(p.Data.IngredientStatement); s != "" {
			return s
		}
	}
	return ""
}

func (p itemDetailPayload) nutrientsSlice() []models.Nutrient {
	if len(p.Nutrients) > 0 {
		return p.Nutrients
	}
	if p.Item != nil && len(p.Item.Nutrients) > 0 {
		return p.Item.Nutrients
	}
	if p.Data != nil && len(p.Data.Nutrients) > 0 {
		return p.Data.Nutrients
	}
	return nil
}

func enrichItemDetailsDisabled() bool {
	return strings.TrimSpace(os.Getenv("DOC_ENRICH_ITEM_DETAILS")) == "0"
}

func maxItemDetailFetchesPerPeriod() int {
	v := strings.TrimSpace(os.Getenv("DOC_ITEM_DETAIL_MAX"))
	if v == "" {
		return 0
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 0 {
		return 0
	}
	return n
}

func buildItemDetailURLs(base, siteID, locHash, date, periodID, itemKey string) []string {
	id := url.PathEscape(itemKey)
	periodSeg := url.PathEscape(periodID)
	qd := url.QueryEscape(date)
	qp := url.QueryEscape(periodID)

	return []string{
		fmt.Sprintf("%s/locations/%s/items/%s?date=%s&period=%s", base, locHash, id, qd, qp),
		fmt.Sprintf("%s/locations/%s/items/%s?date=%s", base, locHash, id, qd),
		fmt.Sprintf("%s/locations/%s/item/%s?date=%s&period=%s", base, locHash, id, qd, qp),
		fmt.Sprintf("%s/sites/%s/locations/%s/items/%s?date=%s&period=%s", base, url.PathEscape(siteID), locHash, id, qd, qp),
		fmt.Sprintf("%s/locations/%s/menu/%s/items/%s?date=%s", base, locHash, periodSeg, id, qd),
		fmt.Sprintf("%s/locations/%s/items/%s/nutrition?date=%s&period=%s", base, locHash, id, qd, qp),
	}
}

// enrichDailyItemsFromDetailPages fills missing ingredients (and optionally nutrients) via per-item GETs.
// Set DOC_ENRICH_ITEM_DETAILS=0 to skip. DOC_ITEM_DETAIL_MAX limits attempts per menu period (0 = unlimited).
func (s *BrowserAPIScraper) enrichDailyItemsFromDetailPages(allocCtx context.Context, locationHash, date, periodID string, items []models.DailyItem) {
	if enrichItemDetailsDisabled() {
		return
	}

	limit := maxItemDetailFetchesPerPeriod()
	attempts := 0

	for i := range items {
		if strings.TrimSpace(items[i].Ingredients) != "" {
			continue
		}
		key := strings.TrimSpace(items[i].MenuItemID)
		if key == "" {
			continue
		}
		if limit > 0 && attempts >= limit {
			log.Printf("item-detail enrich cap reached (%d) for location=%s period=%s", limit, locationHash, periodID)
			break
		}
		attempts++

		urls := buildItemDetailURLs(s.BaseURL, s.SiteID, locationHash, date, periodID, key)
		for _, u := range urls {
			var payload itemDetailPayload
			err := s.fetchJSONWithNewTab(allocCtx, u, &payload, 18*time.Second)
			if err != nil {
				continue
			}
			ing := payload.ingredientsString()
			if ing == "" {
				continue
			}
			items[i].Ingredients = ing
			if len(items[i].Nutrients) == 0 {
				if nu := payload.nutrientsSlice(); len(nu) > 0 {
					if raw, err := models.MarshalJSONArray(nu); err == nil {
						items[i].Nutrients = raw
						applyMacroNutrients(&items[i], nu)
					}
				}
			}
			log.Printf("item-detail enrich ok location=%s name=%q key=%s url=%s", locationHash, items[i].Name, key, u)
			break
		}
		time.Sleep(60 * time.Millisecond)
	}
}
