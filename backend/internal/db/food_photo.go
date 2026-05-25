package db

import (
	"backend/internal/models"
	"errors"

	"gorm.io/gorm"
)

// GormFoodPhoto stores user-uploaded dish images keyed to a menu slot (see foodphoto.KeyFromSlot).
type GormFoodPhoto struct {
	gorm.Model
	FoodKey     string `gorm:"index;size:64;not null"`
	UserID      string `gorm:"size:128"`
	ContentType string `gorm:"size:64;not null"`
	ImageData   []byte `gorm:"type:bytea"`
}

func ListFoodPhotoMetaByKey(foodKey string) ([]models.FoodPhotoMeta, error) {
	var rows []GormFoodPhoto
	if err := DB.Model(&GormFoodPhoto{}).Select("id", "created_at").Where("food_key = ?", foodKey).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]models.FoodPhotoMeta, 0, len(rows))
	for _, r := range rows {
		out = append(out, models.FoodPhotoMeta{
			ID:        r.ID,
			CreatedAt: r.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		})
	}
	return out, nil
}

func InsertFoodPhoto(foodKey, userID, contentType string, imageData []byte) (uint, error) {
	row := GormFoodPhoto{
		FoodKey:     foodKey,
		UserID:      userID,
		ContentType: contentType,
		ImageData:   imageData,
	}
	if err := DB.Create(&row).Error; err != nil {
		return 0, err
	}
	return row.ID, nil
}

func GetFoodPhotoImage(id uint) (contentType string, data []byte, err error) {
	var row GormFoodPhoto
	if err := DB.Select("content_type", "image_data").First(&row, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, gorm.ErrRecordNotFound
		}
		return "", nil, err
	}
	return row.ContentType, row.ImageData, nil
}
