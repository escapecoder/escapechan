package models

import (
	"time"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	_"3ch/backend/utils"
	
	"github.com/goodsign/monday"
)

type ModerReport struct {
	ID	int `gorm:"id" json:"id"`
	Board	string `json:"board"`
	Num	int `json:"num"`
	Parent	int `json:"parent"`
	Processed	int `json:"processed"`
	Timestamp	int64 `json:"timestamp"`
	Ip	string `json:"ip"`
	Comment	string `json:"comment"`
	Date	string `gorm:"-" json:"date"`
	Post	ModerPost `gorm:"-" json:"post"`
}

type ModerReports []ModerReport

func (ModerReport) TableName() string {
	return "reports"
}

func (report *ModerReport) ProcessVirtualFields() {
	report.Date = monday.Format(time.Unix(report.Timestamp, 0), "02/01/2006 Mon 15:04:05", "ru_RU")
}

func (reports ModerReports) ProcessVirtualFields() {
	for i, report := range reports {
		report.ProcessVirtualFields()
		reports[i] = report
	}
}

func (report *ModerReport) Create() (error) {
	err := database.MySQL.Create(&report).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (report *ModerReport) Update() (error) {
	err := database.MySQL.Save(&report).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (report *ModerReport) Delete() (error) {
	err := database.MySQL.Delete(&report).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (report *ModerReport) GetById(id int) (error) {
	err := database.MySQL.First(&report, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}