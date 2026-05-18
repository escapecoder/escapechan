package models

import (
	"time"
	"strings"

	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Ban struct {
	ID	int `gorm:"id" json:"-"`
	IpSubnet	string `json:"-"`
	Board	string `json:"-"`
	Reason	string `json:"-"`
	Type	string `json:"-"`
	Moder	int `json:"-"`
	Timestamp	int64 `json:"-"`
	End	int64 `json:"-"`
	Canceled	int `json:"-"`
}

type Bans []Ban

func (Ban) TableName() string {
	return "bans"
}

func (ban *Ban) Create() (error) {
	err := database.MySQL.Create(&ban).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (ban *Ban) Update() (error) {
	err := database.MySQL.Save(&ban).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (ban *Ban) GetById(id int) (error) {
	err := database.MySQL.First(&ban, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (ban *Ban) GetActiveByIpBoardType(ip string, board string, banType string) (error) {
	timestamp := time.Now().Unix()
	
	subnet1 := ip
	subnet2 := ip
	
	if(strings.Contains(ip, ".")) {
		ipOctets := strings.Split(ip, ".")
		
		ipOctets[3] = "*"
		subnet1 = strings.Join(ipOctets, ".")
		
		ipOctets[2] = "*"
		subnet2 = strings.Join(ipOctets, ".")
	}
	
	if(board == "d") {
		err := database.MySQL.First(&ban, "(`ip_subnet` = ? OR `ip_subnet` = ? OR `ip_subnet` = ?) AND (`board` = ?) AND (`end` = 0 OR `end` >= ?) AND `type` = ? AND `canceled` = 0", ip, subnet1, subnet2, board, timestamp, banType).Error
		
		if(err != nil) {
			return err
		}
	} else {
		err := database.MySQL.First(&ban, "(`ip_subnet` = ? OR `ip_subnet` = ? OR `ip_subnet` = ?) AND (`board` = ? OR `board` = 'all') AND (`end` = 0 OR `end` >= ?) AND `type` = ? AND `canceled` = 0", ip, subnet1, subnet2, board, timestamp, banType).Error
		
		if(err != nil) {
			return err
		}
	}
	
	return nil
}