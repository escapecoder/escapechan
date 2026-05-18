package models

import (
	"time"

	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
	
	"github.com/goodsign/monday"
)

type ModerBan struct {
	ID	int `gorm:"id" json:"id"`
	IpSubnet	string `json:"ip_subnet"`
	Board	string `json:"board"`
	Reason	string `json:"reason"`
	Type	string `json:"type"`
	Moder	int `json:"moder"`
	Timestamp	int64 `json:"timestamp"`
	End	int64 `json:"end"`
	Date	string `json:"date"`
	DateEnd	string `json:"date_end"`
	Canceled	int `json:"canceled"`
	Ended	int `gorm:"-" json:"ended"`
	ModerName	string `gorm:"-" json:"moder_name"`
}

type ModerBans []ModerBan

func (ModerBan) TableName() string {
	return "bans"
}

func (ban *ModerBan) ProcessVirtualFields() {
	timestamp := time.Now().Unix()
	
	ban.Date = monday.Format(time.Unix(ban.Timestamp, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
	
	if(ban.End > 0) {
		ban.DateEnd = monday.Format(time.Unix(ban.End, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
		
		if(ban.End < timestamp) {
			ban.Ended = 1
		}
	} else {
		ban.DateEnd = "Бессрочно"
	}
	
	var moder Moder
	err := moder.GetById(ban.Moder)
	
	if(err == nil) {
		ban.ModerName = moder.Login
	}
}

func (bans ModerBans) ProcessVirtualFields() {
	for i, ban := range bans {
		ban.ProcessVirtualFields()
		bans[i] = ban
	}
}

func (ban *ModerBan) Create() (error) {
	err := database.MySQL.Create(&ban).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (ban *ModerBan) Update() (error) {
	err := database.MySQL.Save(&ban).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (ban *ModerBan) GetById(id int) (error) {
	err := database.MySQL.First(&ban, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}