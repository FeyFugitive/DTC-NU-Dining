package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// JSONArray stores JSON array/object text for DB columns while emitting raw JSON in HTTP responses (not base64).
type JSONArray []byte

func (j JSONArray) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("null"), nil
	}
	return []byte(j), nil
}

func (j *JSONArray) UnmarshalJSON(data []byte) error {
	if j == nil {
		return nil
	}
	*j = append((*j)[0:0], data...)
	return nil
}

func (j JSONArray) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return string(j), nil
}

func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	switch v := value.(type) {
	case []byte:
		*j = append((*j)[0:0], v...)
	case string:
		*j = append((*j)[0:0], v...)
	default:
		return fmt.Errorf("JSONArray: scan unsupported type %T", value)
	}
	return nil
}

func MarshalJSONArray(v interface{}) (JSONArray, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	return JSONArray(b), nil
}
