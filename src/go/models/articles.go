package models

import (
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Article struct {
	ID	int `gorm:"id" json:"id"`
	Title	string `json:"title"`
	Slug	string `json:"slug"`
	Text	string `json:"text"`
	Timestamp	int64 `json:"timestamp"`
}

type Articles []Article

func (Article) TableName() string {
	return "articles"
}

func (article *Article) ProcessVirtualFields() {
	
}

func (articles Articles) ProcessVirtualFields() {
	for i, article := range articles {
		article.ProcessVirtualFields()
		articles[i] = article
	}
}

func (article *Article) Create() (error) {
	err := database.MySQL.Create(&article).Error
	
	if(err != nil) {
		return err
	} else {
		article.ProcessVirtualFields()
	}
	
	return nil
}

func (article *Article) Update() (error) {
	err := database.MySQL.Save(&article).Error
	
	if(err != nil) {
		return err
	} else {
		article.ProcessVirtualFields()
	}
	
	return nil
}

func (article *Article) Delete() (error) {
	err := database.MySQL.Delete(&article).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (article *Article) GetById(id int) (error) {
	err := database.MySQL.First(&article, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	} else {
		article.ProcessVirtualFields()
	}
	
	return nil
}