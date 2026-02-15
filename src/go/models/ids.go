package models

import (
	"time"
	"strings"
	"strconv"
	"math/rand"
	"crypto/md5"
	"encoding/hex"
	
	"github.com/AvraamMavridis/randomcolor"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Id struct {
	ID	string `gorm:"id" json:"-"`
	Name	string `json:"-"`
	Ip	string `json:"-"`
	Board	string `json:"-"`
	Thread	int `json:"-"`
	Color	string `json:"-"`
}

type Ids []Id

func (Id) TableName() string {
	return "ids"
}

func (id *Id) Generate(boardSettings Board, thread int, ip string) (error) {
	var adjectives []string
	var properNames []string
	gender := rand.Intn(2)
	
	if(gender == 1) {
		adjectives = strings.Split(strings.ReplaceAll(boardSettings.MaleAdjectives, "\r\n", "\n"), "\n")
		properNames = strings.Split(strings.ReplaceAll(boardSettings.MaleProperNames, "\r\n", "\n"), "\n")
	} else {
		adjectives = strings.Split(strings.ReplaceAll(boardSettings.FemaleAdjectives, "\r\n", "\n"), "\n")
		properNames = strings.Split(strings.ReplaceAll(boardSettings.FemaleProperNames, "\r\n", "\n"), "\n")
	}
	
	rand.Seed(time.Now().Unix())
	
	adjective := adjectives[rand.Intn(len(adjectives))]
	properName := properNames[rand.Intn(len(properNames))]
	colorInHex := randomcolor.GetRandomColorInHex()
	
	id.Name = adjective + " " + properName
	id.Color = colorInHex
	id.Board = boardSettings.ID
	id.Thread = thread
	id.Ip = ip
	
	hash := md5.Sum([]byte(id.Board + "-" + strconv.Itoa(id.Thread) + "-" + id.Ip))
	id.ID = hex.EncodeToString(hash[:])
	
	err := database.MySQL.Create(&id).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (id *Id) GetById(posterId string) (error) {
	err := database.MySQL.First(&id, "`id` = ?", posterId).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (id *Id) GetByBoardThreadIp(board string, thread int, ip string) (error) {
	err := database.MySQL.First(&id, "`board` = ? AND `thread` = ? AND `ip` = ?", board, thread, ip).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}