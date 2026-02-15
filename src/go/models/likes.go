package models

import (
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Like struct {
	ID	int `gorm:"id" json:"-"`
	Board	string `json:"-"`
	Num	int `json:"num"`
	Vote	int `json:"-"`
	Timestamp	int64 `json:"-"`
	Ip	string `json:"-"`
}

type Likes []Like

func (Like) TableName() string {
	return "likes"
}

func (like *Like) Create() (error) {
	err := database.MySQL.Create(&like).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (like *Like) GetByBoardNumIp(board string, num int, ip string) (error) {
	err := database.MySQL.First(&like, "`board` = ? AND `num` = ? AND `ip` = ?", board, num, ip).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}