package models

import (
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Passcode struct {
	ID	int `gorm:"id" json:"-"`
	Code	string `json:"-"`
	Sessions	string `json:"-"`
	Timestamp	int64 `json:"-"`
	Expires	int64 `json:"-"`
	Banned	int `json:"-"`
}

type Passcodes []Passcode

func (Passcode) TableName() string {
	return "passcodes"
}

func (passcode *Passcode) Create() (error) {
	err := database.MySQL.Create(&passcode).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *Passcode) Update() (error) {
	err := database.MySQL.Save(&passcode).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *Passcode) GetById(id int) (error) {
	err := database.MySQL.First(&passcode, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *Passcode) GetByCode(code string) (error) {
	err := database.MySQL.First(&passcode, "`code` = ?", code).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (passcode *Passcode) GetBySession(session string) (error) {
	if(!IsAlNum(session)) {
		return nil
	}
	
	err := database.MySQL.First(&passcode, "`sessions` LIKE ?", "%\"" + session + "\"%").Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}