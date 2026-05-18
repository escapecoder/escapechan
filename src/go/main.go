package main

import (
	"time"
	
	"3ch/backend/config"
	"3ch/backend/database"
	"3ch/backend/router"
	"3ch/backend/models"
	"3ch/backend/geo"
	"3ch/backend/i18n"
)

func every30seconds() {
	for range time.Tick(time.Second * 30) {
		models.RenderAllBoards()
		models.RenderNewsInFile()
	}
}

func every5seconds() {
	for range time.Tick(time.Second * 5) {
		models.ProcessAutodeletion()
	}
}

func main() {
	config.LoadEnv()
	database.Init()
	models.LoadConfigFromDb()
	geo.LoadGeoDatabase()
	i18n.LoadTranslations()
	
	go every30seconds()
	go every5seconds()
	
	router.Init()
}