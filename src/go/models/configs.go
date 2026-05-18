package models

import (
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

var GlobalConfig Config

type Config struct {
	ID	int `gorm:"id" json:"-"`
	PostformAnnotation	string `json:"-"`
	FooterAnnotation	string `json:"-"`
	MenuSections	string `json:"-"`
	DangerMenuSections	string `json:"-"`
	BanReasons	string `json:"-"`
	NoRknDomain	string `json:"-"`
	Spamlist	string `json:"-"`
	DisableFilesDisplaying	int `json:"-"`
	DisableFilesDisplayingForReadonly	int `json:"-"`
	DisableFilesUploading	int `json:"-"`
}

func (Config) TableName() string {
	return "configs"
}

func (config *Config) Update() (error) {
	err := database.MySQL.Save(&config).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (config *Config) Get() (error) {
	err := database.MySQL.First(&config).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func LoadConfigFromDb() {
	GlobalConfig.ID = 1
	GlobalConfig.Get()
}