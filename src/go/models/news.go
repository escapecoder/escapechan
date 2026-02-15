package models

type NewsJson struct {
	Day []NewsItem `json:"news_day"`
	Hour []NewsItem `json:"news_hour"`
	Latest []NewsItem `json:"news_latest"`
}

type NewsItem struct {
	Num int `json:"num"`
	Date string `json:"date"`
	Subject string `json:"subject"`
	Views int `gorm:"-" json:"views"`
}

type NewsItems []NewsItem