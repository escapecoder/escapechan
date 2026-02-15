package models

import (
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Report struct {
	ID	int `gorm:"id" json:"-"`
	Board	string `json:"-"`
	Num	int `json:"num"`
	Parent	int `json:"parent"`
	Processed	int `json:"-"`
	Timestamp	int64 `json:"-"`
	Ip	string `json:"-"`
	Comment	string `json:"-"`
}

type Reports []Report

func (Report) TableName() string {
	return "reports"
}

func (report *Report) Create() (error) {
	err := database.MySQL.Create(&report).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (report *Report) GetByBoardNumIp(board string, num int, ip string) (error) {
	err := database.MySQL.First(&report, "`board` = ? AND `num` = ? AND `ip` = ?", board, num, ip).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}