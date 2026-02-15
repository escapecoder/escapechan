package models

import (
	_ "time"
	_ "errors"
	_ "fmt"
	_ "regexp"
	_"strings"
	_ "strconv"
	_ "math/rand"
	_ "encoding/json"
	_ "unicode/utf8"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
	
	_ "github.com/frustra/bbcode"
	_ "github.com/goodsign/monday"
	_ "github.com/microcosm-cc/bluemonday"
)

type ModerPostAdditional struct {
	Board	string `json:"board"`
	Num	int `json:"num"`
	Parent	int `json:"-"`
	ModerId	int `json:"moder_id"`
	ModerName	string `gorm:"-" json:"moder_name"`
	ModerLevel	int `gorm:"-" json:"moder_level"`
	Ip	string `json:"ip"`
	IpCountryCode	string `json:"ip_country_code"`
	IpCountryName	string `json:"ip_country_name"`
	IpCityName	string `json:"ip_city_name"`
	ActivePostsOnBoard	int64 `gorm:"-" json:"active_posts_on_board"`
	ActivePostsOnSite	int64 `gorm:"-" json:"active_posts_on_site"`
	DeletedPostsOnBoard	int64 `gorm:"-" json:"deleted_posts_on_board"`
	DeletedPostsOnSite	int64 `gorm:"-" json:"deleted_posts_on_site"`
	TotalPostsOnBoard	int64 `gorm:"-" json:"total_posts_on_board"`
	TotalPostsOnSite	int64 `gorm:"-" json:"total_posts_on_site"`
	ModerHasAccess	bool `gorm:"-" json:"moder_has_access"`
}

type ModerPostAdditionals []ModerPostAdditional

func (ModerPostAdditional) TableName() string {
	return "posts"
}

func (post *ModerPostAdditional) ProcessVirtualFields() {
	var moder Moder
	
	if(post.ModerId > 0) {
		err := moder.GetById(post.ModerId)
		
		if(err == nil) {
			post.ModerName = moder.Login
			post.ModerLevel = moder.Level
		}
	}
}

func (posts ModerPostAdditionals) ProcessVirtualFields() {
	for i, post := range posts {
		post.ProcessVirtualFields()
		posts[i] = post
	}
}

func (post *ModerPostAdditional) Create() (error) {
	err := database.MySQL.Create(&post).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPostAdditional) Update() (error) {
	err := database.MySQL.Save(&post).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPostAdditional) Delete() (error) {
	err := database.MySQL.Delete(&post).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (post *ModerPostAdditional) GetByBoardNum(board string, num int) (error) {
	err := database.MySQL.First(&post, "`board` = ? AND `num` = ?", board, num).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}