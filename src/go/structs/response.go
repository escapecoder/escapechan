package structs

import (
	"3ch/backend/models"
)

type Message struct {
	Text	string `json:"message,omitempty"`
}

type Error struct {
	Code	int `json:"code"`
	Message	string `json:"message"`
}

type Response struct {
	Result	interface{} `json:"result,omitempty"`
	Num	int `json:"num,omitempty"`
	Thread	int `json:"thread,omitempty"`
	Message	string `json:"message,omitempty"`
	RedirectUrl	string `json:"redirect_url,omitempty"`
	Error	Error `json:"error,omitempty"`
}

type SearchResults struct {
	Error Error `json:"-"`
	Board models.Board `json:"board"`
	Posts	models.Posts `json:"posts"`
}