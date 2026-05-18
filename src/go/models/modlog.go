package models

import (
	"time"
	"strconv"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
	
	"github.com/goodsign/monday"
)

type ModlogRecord struct {
	ID	int `gorm:"id" json:"id"`
	Moder	int `json:"moder"`
	ModerName	string `gorm:"-" json:"moder_name"`
	Action	string `json:"action"`
	ActionName	string `gorm:"-" json:"action_name"`
	ActionExplanation	string `gorm:"-" json:"action_explanation"`
	Board	string `json:"board"`
	Num	int `json:"num"`
	Parent	int `json:"parent"`
	Anywhere	int `json:"anywhere"`
	Delall	int `json:"delall"`
	NewBoard	string `json:"new_board"`
	Limit	int `json:"limit"`
	BanId	int `json:"ban_id"`
	IpOrSubnet	string `json:"ip_or_subnet"`
	IpSubnet	string `json:"ip_subnet"`
	Reason	string `json:"reason"`
	Ip	string `json:"ip"`
	Timestamp	int64 `json:"-"`
	End	int64 `json:"-"`
	Date	string `gorm:"-" json:"date"`
	DateEnd	string `gorm:"-" json:"date_end"`
	Post	ModerPost `gorm:"-" json:"post"`
}

type ModlogRecords []ModlogRecord

func (ModlogRecord) TableName() string {
	return "modlog"
}

func (record *ModlogRecord) ProcessVirtualFields() {
	record.Date = monday.Format(time.Unix(record.Timestamp, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
	
	if(record.Action == "ban") {
		if(record.End > 0) {
			record.DateEnd = "до " + monday.Format(time.Unix(record.End, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
		} else {
			record.DateEnd = "бессрочно"
		}
	}
	
	var moder Moder
	err := moder.GetById(record.Moder)
	
	if(err == nil) {
		record.ModerName = moder.Login
	}
	
	if(record.Action == "endless") {
		record.ActionExplanation = "включил бесконечный тред с лимитом в " + strconv.Itoa(record.Limit) + " постов"
	}
	
	if(record.Action == "finite") {
		record.ActionExplanation = "отключил бесконечный тред"
	}
	
	if(record.Action == "move") {
		record.ActionExplanation = "перенёс тред"
	}
	
	if(record.Action == "close") {
		record.ActionExplanation = "закрыл тред"
	}
	
	if(record.Action == "open") {
		record.ActionExplanation = "открыл тред"
	}
	
	if(record.Action == "pin") {
		record.ActionExplanation = "закрепил тред"
	}
	
	if(record.Action == "unpin") {
		record.ActionExplanation = "открепил тред"
	}
	
	if(record.Action == "restore") {
		record.ActionExplanation = "восстановил пост"
	}
	
	if(record.Action == "delete") {
		record.ActionExplanation = "удалил пост"
	}
	
	if(record.Action == "unban") {
		record.ActionExplanation = "отменил бан"
	}
	
	if(record.Action == "ban") {
		if(record.IpOrSubnet == "ip") {
			record.ActionExplanation = "забанил IP"
		} else {
			record.ActionExplanation = "забанил подсеть"
		}
	}
}

func (records ModlogRecords) ProcessVirtualFields() {
	for i, record := range records {
		record.ProcessVirtualFields()
		records[i] = record
	}
}

func (record *ModlogRecord) Create() (error) {
	err := database.MySQL.Create(&record).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (record *ModlogRecord) Update() (error) {
	err := database.MySQL.Save(&record).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (record *ModlogRecord) GetById(id int) (error) {
	err := database.MySQL.First(&record, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}