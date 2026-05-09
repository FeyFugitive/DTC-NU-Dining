package scraper

import (
	"backend/internal/models"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseItems_preservesIngredientsAndAllNutrients(t *testing.T) {
	menu := models.DiningHallResponse{
		Date: "2025-01-01",
		Period: models.Periods{
			Categories: []models.Category{
				{
					Name: "Grill",
					Items: []models.Item{
						{
							Name:        "Cheeseburger",
							Description: "Classic",
							Portion:     "1 sandwich",
							Ingredients: "Beef patty, cheddar, bun",
							Nutrients: []models.Nutrient{
								{Name: "Calories", Value: "520"},
								{Name: "Protein (g)", Value: "28"},
								{Name: "Total Carbohydrates (g)", Value: "41"},
								{Name: "Total Fat (g)", Value: "26"},
								{Name: "Sodium (mg)", Value: "980"},
								{Name: "Dietary Fiber (g)", Value: "2"},
							},
						},
					},
				},
			},
		},
	}

	items, _, err := parseItems(menu, "Sargent", "Lunch")
	require.NoError(t, err)
	require.Len(t, items, 1)

	got := items[0]
	assert.Equal(t, "Cheeseburger", got.Name)
	assert.Equal(t, "1 sandwich", got.PortionSize)
	assert.Equal(t, "Beef patty, cheddar, bun", got.Ingredients)
	assert.Equal(t, "520", got.Calories)
	assert.Equal(t, "28", got.Protein)

	var decoded []models.Nutrient
	require.NoError(t, json.Unmarshal(got.Nutrients, &decoded))
	require.GreaterOrEqual(t, len(decoded), 6)
	foundSodium := false
	for _, n := range decoded {
		if n.Name == "Sodium (mg)" && n.Value == "980" {
			foundSodium = true
			break
		}
	}
	assert.True(t, foundSodium, "full nutrient list should include Sodium")
}
