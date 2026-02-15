package config

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/night-codes/go-sypexgeo"
)

func LoadEnv() {
	ex, err := os.Executable()
	
	if err != nil {
		panic(err)
	}
	
	exPath := filepath.Dir(ex)
	
	err = godotenv.Load(exPath + "/.env")
	
	if err != nil {
		panic(err)
	}
	
	sypexgeo.New(exPath + "/geo.dat");
}

func GetCategories() ([]string) {
	categories := []string {"Разное", "Политика", "Тематика", "Творчество", "Техника и софт", "Игры", "Японская культура", "Взрослым", "Юзерборды"}
	
	return categories
}

func GetCategoryName(id int) (string) {
	var categories = GetCategories()
	
	return categories[id]
}