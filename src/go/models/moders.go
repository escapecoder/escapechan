package models

import (
	"strconv"
	"regexp"
	"encoding/json"

	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Moder struct {
	ID	int `gorm:"id" json:"-"`
	Login	string `json:"-"`
	Password	string `json:"-"`
	Note	string `json:"-"`
	Permissions	string `json:"-"`
	Sessions	string `json:"-"`
	Level	int `json:"-"`
	ExposeIp	int `json:"-"`
	Timestamp	int64 `json:"-"`
	Enabled	int `json:"-"`
}

type Moders []Moder

type ModerPermission struct {
	Board	string `json:"board"`
	Thread	string `json:"thread"`
}

type ModerPermissions []ModerPermission

func (Moder) TableName() string {
	return "moders"
}

var IsAlNum = regexp.MustCompile(`^[a-z0-9]+$`).MatchString

func (moder *Moder) Create() (error) {
	err := database.MySQL.Create(&moder).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (moder *Moder) Update() (error) {
	err := database.MySQL.Save(&moder).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (moder *Moder) GetById(id int) (error) {
	err := database.MySQL.First(&moder, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (moder *Moder) GetByLogin(login string) (error) {
	err := database.MySQL.First(&moder, "`login` = ?", login).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (moder *Moder) GetBySession(session string) (error) {
	if(!IsAlNum(session)) {
		return nil
	}
	
	err := database.MySQL.First(&moder, "`sessions` LIKE ?", "%\"" + session + "\"%").Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (moder *Moder) CanModerateBoardThread(board string, num int) (bool) {
	var permissions ModerPermissions
	
	_ = json.Unmarshal([]byte(moder.Permissions), &permissions)
	
	for _, permission := range permissions {
		if(permission.Board == "all") {
			return true
		}
		
		if(len(permission.Thread) == 0 || permission.Thread == "0") {
			if(permission.Board == board) {
				return true
			}
		} else if(permission.Board == board && permission.Thread == strconv.Itoa(num)) {
			return true
		}
	}
	
	return false
}