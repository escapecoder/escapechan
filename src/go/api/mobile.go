package api

import (
	_ "os"
	_ "fmt"
	_ "time"
	_ "context"
	"slices"
	"strings"
	"strconv"
	"net/http"
	"encoding/json"
	
	"github.com/gorilla/mux"
	
	"3ch/backend/models"
	"3ch/backend/structs"
	_ "3ch/backend/utils"
	"3ch/backend/database"
)

func MobileAfter(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.MobileResponse
	var board models.Board
	var post models.Post
	//var post2 models.Post
	
	vars := mux.Vars(r)
	boardId, _ := vars["board"]
	thread, _ := strconv.Atoi(vars["thread"])
	num, _ := strconv.Atoi(vars["num"])
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil || board.ID == "onion") {
			error.Code = -2
			error.Message = "Доска не существует."
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, thread)
		
		if(err != nil) {
			error.Code = -3
			error.Message = "Тред не существует."
		} else if(post.Deleted > 0 || post.Parent > 0) {
			error.Code = -3
			error.Message = "Тред не существует."
		}
	}
	
	/*if(error.Message == "") {
		err := post2.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = "Пост не существует."
		} else if(post2.Parent != post.Num && post2.Num != post.Num) {
			error.Code = -31
			error.Message = "Пост не существует."
		}
	}*/
	
	if(error.Message == "") {
		var posts models.Posts
		var postersCount int64
		
		database.MySQL.Model(&models.Post{}).Where("board = ? AND (num = ? OR parent = ?) AND num >= ? AND deleted = 0", boardId, post.Num, post.Num, num).Order("id asc").Find(&posts)
		database.MySQL.Model(&models.Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", boardId, post.Num, post.Num).Distinct("ip").Count(&postersCount)
		
		posts.ProcessVirtualFields()
	
		for index, post := range posts {
			post.RestorePostFiles()
			post.ProcessSecrets()
			
			if(post.ForceGeo == 0) {
				if(board.EnableFlags == 0) {
					post.Icon = ""
				}
			}
			
			posts[index] = post
		}
		
		response.UniquePosters = postersCount
		response.Posts = posts
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.Marshal(response)
	w.Write(jsonResponse)
}

func MobileThread(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.MobileResponse
	var board models.Board
	var post models.Post
	
	vars := mux.Vars(r)
	boardId, _ := vars["board"]
	thread, _ := strconv.Atoi(vars["thread"])
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil || board.ID == "onion") {
			error.Code = -2
			error.Message = "Доска не существует."
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, thread)
		
		if(err != nil) {
			error.Code = -3
			error.Message = "Тред не существует."
		} else if(post.Deleted > 0 || post.Parent > 0) {
			error.Code = -3
			error.Message = "Тред не существует."
		}
	}
	
	if(error.Message == "") {
		var postsCount int64
		
		database.MySQL.Model(&models.Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", boardId, post.Num, post.Num).Count(&postsCount)
		
		thread := make(map[string]interface{})
		thread["num"] = post.Num
		thread["timestamp"] = post.Timestamp
		thread["posts"] = postsCount
		
		response.Thread = thread
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.Marshal(response)
	w.Write(jsonResponse)
}

func MobilePost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.MobileResponse
	var board models.Board
	var post models.Post
	
	vars := mux.Vars(r)
	boardId, _ := vars["board"]
	num, _ := strconv.Atoi(vars["num"])
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil || board.ID == "onion") {
			error.Code = -2
			error.Message = "Доска не существует."
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = "Пост не существует."
		} else if(post.Deleted > 0) {
			error.Code = -31
			error.Message = "Пост не существует."
		}
	}
	
	if(error.Message == "") {
		post.RestorePostFiles()
		post.ProcessSecrets()
		
		if(post.ForceGeo == 0) {
			if(board.EnableFlags == 0) {
				post.Icon = ""
			}
		}
		
		response.Post = post
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.Marshal(response)
	w.Write(jsonResponse)
}

func MobilePostWhoReacted(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.MobileResponse
	var board models.Board
	var post models.Post
	
	vars := mux.Vars(r)
	boardId, _ := vars["board"]
	num, _ := strconv.Atoi(vars["num"])
	icon := strings.TrimSpace(r.URL.Query().Get("icon"))
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil || board.ID == "onion") {
			error.Code = -2
			error.Message = "Доска не существует."
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = "Пост не существует."
		} else if(post.Deleted > 0) {
			error.Code = -31
			error.Message = "Пост не существует."
		}
	}
	
	if(error.Message == "" && !slices.Contains(board.ReactionsParsed, icon)) {
		error.Code = -4
		error.Message = "Невалидный голос."
	}
	
	if(error.Message == "") {
		var posts models.Posts
		var reactions models.Reactions
		
		database.MySQL.Model(&models.Reactions{}).Where("board = ? AND num = ? AND icon = ?", boardId, post.Num, icon).Limit(20).Order("id desc").Find(&reactions)
		
		for _, reaction := range reactions {
			var postReacted models.Post
			
			err := postReacted.GetLastByBoardIpTimestamp(boardId, reaction.Ip, reaction.Timestamp)
			
			if(err == nil) {
				if(postReacted.ForceGeo == 0) {
					if(board.EnableFlags == 0) {
						postReacted.Icon = ""
					}
				}
				
				postReacted.ProcessSecrets()
				
				posts = append(posts, postReacted);
			}
		}
		
		response.Posts = posts
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.Marshal(response)
	w.Write(jsonResponse)
}

func MobileBoardsList(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var boards models.Boards
	
	database.MySQL.Where("id != 'test' AND id != 'onion' AND id != 'modsand' AND enable_posting = 1").Order("id asc").Find(&boards)
	
	boards.ProcessVirtualFields()
	
	jsonResponse, _ := json.Marshal(boards)
	w.Write(jsonResponse)
}