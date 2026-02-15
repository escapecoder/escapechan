package database

import (
	"os"
	
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/driver/mysql"
)

var MySQL *gorm.DB

func Init() {
	databaseDsn := os.Getenv("DATABASE_DSN")
	
	var err error
	
	MySQL, err = gorm.Open(mysql.Open(databaseDsn + "?parseTime=true"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	
	if err != nil {
		panic(err)
	}
}