package models

import (
	"time"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
	
	"github.com/goodsign/monday"
)

type ModerPasscode struct {
	ID	int `gorm:"id" json:"id"`
	Code	string `json:"code"`
	Sessions	string `json:"-"`
	Timestamp	int64 `json:"timestamp"`
	Expires	int64 `json:"expires"`
	Delta	int64 `gorm:"-" json:"-"`
	Date	string `gorm:"-" json:"date"`
	DateExpires	string `gorm:"-" json:"date_expires"`
	Ended	int `gorm:"-" json:"ended"`
	Banned	int `json:"banned"`
	TgId	int `json:"tg_id"`
}

type ModerPasscodes []ModerPasscode

func (ModerPasscode) TableName() string {
	return "passcodes"
}

func (passcode *ModerPasscode) ProcessVirtualFields() {
	timestamp := time.Now().Unix()
	
	passcode.Date = monday.Format(time.Unix(passcode.Timestamp, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
	
	if(passcode.Expires > 0) {
		passcode.DateExpires = monday.Format(time.Unix(passcode.Expires, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
		
		if(passcode.Expires < timestamp) {
			passcode.Ended = 1
		}
	} else {
		passcode.DateExpires = "Бессрочно"
	}
}

func (passcodes ModerPasscodes) ProcessVirtualFields() {
	for i, passcode := range passcodes {
		passcode.ProcessVirtualFields()
		passcodes[i] = passcode
	}
}

func (passcode *ModerPasscode) Create() (error) {
	err := database.MySQL.Create(&passcode).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *ModerPasscode) Update() (error) {
	err := database.MySQL.Save(&passcode).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *ModerPasscode) GetById(id int) (error) {
	err := database.MySQL.First(&passcode, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *ModerPasscode) GetByCode(code string) (error) {
	err := database.MySQL.First(&passcode, "`code` = ?", code).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *ModerPasscode) GetBySession(session string) (error) {
	if(!IsAlNum(session)) {
		return nil
	}
	
	err := database.MySQL.First(&passcode, "`sessions` LIKE ?", "%\"" + session + "\"%").Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}