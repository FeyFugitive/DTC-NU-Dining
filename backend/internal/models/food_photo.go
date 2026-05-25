package models

// FoodPhotoMeta is returned by list API (no image bytes).
type FoodPhotoMeta struct {
	ID        uint   `json:"id"`
	CreatedAt string `json:"createdAt"`
}
