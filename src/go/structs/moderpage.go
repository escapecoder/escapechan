package structs

import (
	"3ch/backend/models"
)

type ModerPage struct {
	IsCreate	int
	CurrentSection	string
	Config	models.Config
	Post	models.ModerPost
	Article	models.Article
	Articles	models.Articles
	Passcode	models.ModerPasscode
	Board	models.Board
	Boards	models.Boards
	Moder	models.Moder
	Moders	models.Moders
	CurrentModer	models.Moder
	AuthFailed	int
	BanReasons	[]string
	Categories	[]string
	SelectedPostIds	string
	CurrentPostsAction	string
	PostsToAct	int64
	PostersToBan	int64
	HasUnavailablePosts	int
	HasDifferentBoards	int
	HasOtherModers	int
	Lang	map[string]string
	LangJson	string
}

type BanReason struct {
	Value	string `json:"value"`
}

type BanReasons []BanReason