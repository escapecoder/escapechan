package models

import (
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Reaction struct {
	ID	int `gorm:"id" json:"-"`
	Board	string `json:"-"`
	Num	int `json:"num"`
	Icon	string `json:"-"`
	Timestamp	int64 `json:"-"`
	Ip	string `json:"-"`
}

type Reactions []Reaction

func (Reaction) TableName() string {
	return "reactions"
}

func (reaction *Reaction) Create() (error) {
	err := database.MySQL.Create(&reaction).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (reaction *Reaction) GetByBoardNumIp(board string, num int, ip string) (error) {
	err := database.MySQL.First(&reaction, "`board` = ? AND `num` = ? AND `ip` = ?", board, num, ip).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (reaction *Reaction) GetByBoardNumIpIcon(board string, num int, ip string, icon string) (error) {
	err := database.MySQL.First(&reaction, "`board` = ? AND `num` = ? AND `ip` = ? AND `icon` = ?", board, num, ip, icon).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (reaction *Reaction) Update() (error) {
	err := database.MySQL.Save(&reaction).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (reaction *Reaction) Delete() (error) {
	err := database.MySQL.Delete(&reaction).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}