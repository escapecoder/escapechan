package models

import (
	_ "3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type PollVote struct {
	ID	int `gorm:"id" json:"-"`
	Board	string `json:"-"`
	Num	int `json:"num"`
	Vote	int `json:"-"`
	Timestamp	int64 `json:"-"`
	Ip	string `json:"-"`
}

type PollVotes []PollVote

func (PollVote) TableName() string {
	return "poll_votes"
}

func (pollVote *PollVote) Create() (error) {
	err := database.MySQL.Create(&pollVote).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (pollVote *PollVote) GetByBoardNumIp(board string, num int, ip string) (error) {
	err := database.MySQL.First(&pollVote, "`board` = ? AND `num` = ? AND `ip` = ?", board, num, ip).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (pollVote *PollVote) GetByBoardNumIpVote(board string, num int, ip string, vote int) (error) {
	err := database.MySQL.First(&pollVote, "`board` = ? AND `num` = ? AND `ip` = ? AND `vote` = ?", board, num, ip, vote).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}