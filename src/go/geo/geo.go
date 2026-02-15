package geo

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/night-codes/go-sypexgeo"
)

var geo sypexgeo.SxGEO

func LoadGeoDatabase() {
	ex, err := os.Executable()
	
	if err != nil {
		panic(err)
	}
	
	exPath := filepath.Dir(ex)
	
	err = godotenv.Load(exPath + "/.env")
	
	if err != nil {
		panic(err)
	}
	
	geo = sypexgeo.New(exPath + "/geo.dat");
}

func GetIpInfo(ip string) (map[string]interface{}, error) {
	info, err := geo.GetCityFull(ip)
	
	return info, err
}

func GetCountry(ip string) (string, error) {
	info, err := geo.GetCountry(ip)
	
	return info, err
}