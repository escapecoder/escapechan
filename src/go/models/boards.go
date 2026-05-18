package models

import (
	"os"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"slices"
	"math"
	"time"
	_ "errors"
	"encoding/json"
	"text/template"
	"path/filepath"
	
	"3ch/backend/i18n"
	"3ch/backend/config"
	"3ch/backend/database"
	_ "3ch/backend/utils"
)

type Board struct {
	ID	string `gorm:"id" json:"id"`
	Name	string `json:"name"`
	Info	string `json:"info"`
	InfoOuter	string `json:"info_outer"`
	DefaultName	string `json:"default_name"`
	MaleAdjectives	string `json:"-"`
	MaleProperNames	string `json:"-"`
	FemaleAdjectives	string `json:"-"`
	FemaleProperNames	string `json:"-"`
	Reactions	string `json:"-"`
	ReactionsParsed	[]string `gorm:"-" json:"reactions"`
	CategoryId	int `json:"-"`
	Category	string `gorm:"-" json:"category"`
	CurrentThreadSubject	string `gorm:"-" json:"-"`
	ActiveThreadsCount	int64 `gorm:"-" json:"-"`
	ActivePostsCount	int64 `gorm:"-" json:"-"`
	FileTypes	string `json:"-"`
	FileTypesParsed	[]string `gorm:"-" json:"file_types"`
	EnableDices	int `json:"enable_dices"`
	EnableFlags	int `json:"enable_flags"`
	EnableIcons	int `json:"enable_icons"`
	EnableLikes	int `json:"enable_likes"`
	EnableReactions	int `json:"enable_reactions"`
	EnableNames	int `json:"enable_names"`
	EnableIds	int `json:"-"`
	EnableTelegramLinking	int `json:"-"`
	EnableOekaki	int `json:"enable_oekaki"`
	EnablePosting	int `json:"enable_posting"`
	EnableSage	int `json:"enable_sage"`
	EnableShield	int `json:"enable_shield"`
	EnableSubject	int `json:"enable_subject"`
	EnableThreadTags	int `json:"enable_thread_tags"`
	EnableTrips	int `json:"enable_trips"`
	EnableOpMod	int `json:"enable_op_mod"`
	RequireFilesForOp	int `json:"-"`
	IsDanger	int `json:"-"`
	BumpLimit	int `json:"bump_limit"`
	LastNum	int `json:"last_num"`
	MaxComment	int `json:"max_comment"`
	MaxFilesSize	int `json:"max_files_size"`
	MaxFilesSizeMB	int `gorm:"-" json:"-"`
	MaxPages	int `json:"max_pages"`
	Speed	int `json:"speed"`
	Threads	int `json:"threads"`
	ThreadsPerPage	int `json:"threads_per_page"`
	UniquePosters	int `json:"unique_posters"`
	BanReasons	string `json:"-"`
	Spamlist	string `json:"-"`
	Replacements	string `json:"-"`
}

type Boards []Board

func (Board) TableName() string {
	return "boards"
}

type Thread struct {
	Posts	Posts `json:"posts"`
	ThreadNum int `json:"thread_num,omitempty"`
	PostsCount int64 `json:"posts_count"`
	SkippedPostsCount int64 `json:"-"`
	FilesCount int64 `json:"files_count"`
	SkippedFilesCount int64 `json:"-"`
}

type Threads []Thread

type BoardJson struct {
	Board	Board `json:"board"`
	IsBoard	bool `json:"is_board"`
	IsIndex	bool `json:"is_index"`
	IsClosed	int `json:"is_closed"`
	CurrentThread	int `gorm:"-" json:"current_thread"`
	PostersCount	int64 `json:"posters_count"`
	PostsCount	int `json:"posts_count"`
	FilesCount	int `gorm:"-" json:"files_count"`
	Filter	string `json:"filter,omitempty"`
	Threads	Threads `json:"threads"`
	PagesSlice	[]int `json:"-"`
	PagesCount	int `json:"-"`
	CurrentPage	int `json:"-"`
	Config	Config `json:"-"`
	Lang	map[string]string `json:"-"`
	LangJson	string `json:"-"`
	MenuSections	MenuSections `json:"-"`
	DangerMenuSections	MenuSections `json:"-"`
	ModerView	int `json:"moder_view"`
}

type BoardThreads struct {
	Board	string `json:"board"`
	Threads	[]BoardThread `json:"threads"`
}

type BoardThread struct {
	Comment	string `json:"comment"`
	Lasthit	int64 `json:"lasthit"`
	Num	int `json:"num"`
	PostsCount	int64 `gorm:"-" json:"posts_count"`
	Score	int `json:"score"`
	Subject	string `json:"subject"`
	Timestamp	int64 `json:"timestamp"`
	Views	int `json:"views"`
}

type MenuLink struct {
	Label	string `json:"label"`
	Url	string `json:"url"`
}

type MenuSection struct {
	Name	string `json:"sectionName"`
	Links	[]MenuLink `json:"links"`
	Danger	string `json:"danger"`
}

type MenuSections []MenuSection

func (board *Board) ProcessVirtualFields() {
	board.Category = config.GetCategoryName(board.CategoryId)
	
	board.FileTypesParsed = strings.Split(board.FileTypes, ",")
	
	board.ReactionsParsed = strings.Split(strings.ReplaceAll(board.Reactions, "\r\n", "\n"), "\n")
	
	board.MaxFilesSizeMB = board.MaxFilesSize / 1024
	
	board.ThreadsPerPage = 30
}

func (boards Boards) ProcessVirtualFields() {
	for i, board := range boards {
		board.ProcessVirtualFields()
		boards[i] = board
	}
}

func (board *Board) Create() (error) {
	err := database.MySQL.Create(&board).Error
	
	if(err != nil) {
		return err
	} else {
		board.ProcessVirtualFields()
	}
	
	return nil
}

func (board *Board) Update() (error) {
	err := database.MySQL.Save(&board).Error
	
	if(err != nil) {
		return err
	} else {
		board.ProcessVirtualFields()
	}
	
	return nil
}

func (board *Board) Delete() (error) {
	err := database.MySQL.Delete(&board).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (board *Board) GetById(id string) (error) {
	err := database.MySQL.First(&board, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	} else {
		board.ProcessVirtualFields()
	}
	
	return nil
}

func GetModerThreadJson(boardId string, num int, ip string) (BoardJson, error) {
	var boardJson BoardJson
	
	var board Board
	err := board.GetById(boardId)
	
	if(err != nil) {
		return boardJson, err
	}
	
	boardJson.Config = GlobalConfig
	
	_ = json.Unmarshal([]byte(GlobalConfig.MenuSections), &boardJson.MenuSections)
	_ = json.Unmarshal([]byte(GlobalConfig.DangerMenuSections), &boardJson.DangerMenuSections)
	
	boardJson.Board = board
	boardJson.CurrentThread = num
	
	var postItem Post
	err = postItem.GetByNum(num)
	
	if(err != nil || postItem.Parent > 0) {
		return boardJson, err
	}
	
	postItem.ProcessVirtualFields()
	postItem.ProcessSecrets()
	
	boardJson.Board.CurrentThreadSubject = postItem.Title
	boardJson.IsClosed = postItem.Closed
	
	var threads = []Thread{}
	var thread Thread
	
	database.MySQL.Where("(num = ? OR parent = ?) AND deleted_by_endless_excess = 0", num, num).Order("id asc").Limit(2000).Find(&thread.Posts)
	
	var postIndex = 1;
	
	for index, post := range thread.Posts {
		post.ProcessVirtualFields()
		post.ProcessSecrets()
		
		if(post.Deleted == 0) {
			post.RestorePostFiles()
		} else {
			post.SetSecuredFileUrls(ip)
		}
		
		if(post.ForceGeo == 0) {
			if(board.EnableFlags == 0) {
				post.Icon = ""
			}
		}
		
		post.Number = postIndex
		
		thread.Posts[index] = post
		
		boardJson.FilesCount += len(post.FilesParsed)
		
		postIndex++
	}
    
    if(board.EnableReactions == 1) {
        thread.Posts.ProcessReactions()
    }
	
	database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted_by_endless_excess = 0", postItem.Board, num, num).Distinct("ip").Count(&boardJson.PostersCount)
	
	threads = append(threads, thread)
	
	boardJson.Threads = threads
	boardJson.PostsCount = len(thread.Posts)
	boardJson.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	boardJson.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "board_")
	
	return boardJson, nil
}

func GetThreadJson(boardId string, num int) (BoardJson, error) {
	var boardJson BoardJson
	
	var board Board
	err := board.GetById(boardId)
	
	if(err != nil) {
		return boardJson, err
	}
	
	boardJson.Config = GlobalConfig
	
	_ = json.Unmarshal([]byte(GlobalConfig.MenuSections), &boardJson.MenuSections)
	_ = json.Unmarshal([]byte(GlobalConfig.DangerMenuSections), &boardJson.DangerMenuSections)
	
	boardJson.Board = board
	boardJson.CurrentThread = num
	
	var postItem Post
	err = postItem.GetByNum(num)
	
	if(err != nil || postItem.Parent > 0 || postItem.Deleted > 0) {
		return boardJson, err
	}
	
	postItem.ProcessVirtualFields()
	postItem.ProcessSecrets()
	
	boardJson.Board.CurrentThreadSubject = postItem.Title
	boardJson.IsClosed = postItem.Closed
	
	var threads = []Thread{}
	var thread Thread
	
	database.MySQL.Where("(num = ? OR parent = ?) AND deleted = 0", num, num).Order("id asc").Find(&thread.Posts)
	
	var postIndex = 1;
	
	for index, post := range thread.Posts {
		post.ProcessVirtualFields()
		post.ProcessSecrets()
		post.RestorePostFiles()
		
		if(GlobalConfig.DisableFilesDisplaying == 1) {
			post.HidePostFiles()
		}
		
		if(post.ForceGeo == 0) {
			if(board.EnableFlags == 0) {
				post.Icon = ""
			}
		}
		
		post.Number = postIndex
		
		thread.Posts[index] = post
		
		boardJson.FilesCount += len(post.FilesParsed)
		
		postIndex++
	}
    
    if(board.EnableReactions == 1) {
        thread.Posts.ProcessReactions()
    }
	
	database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", postItem.Board, num, num).Distinct("ip").Count(&boardJson.PostersCount)
	
	threads = append(threads, thread)
	
	boardJson.Threads = threads
	boardJson.PostsCount = len(thread.Posts)
	boardJson.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	boardJson.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "board_")
	
	return boardJson, nil
}

func GetBoardJson(boardId string, offset int, mode string) (BoardJson, error) {
	var boardJson BoardJson
	
	var board Board
	err := board.GetById(boardId)
	
	if(err != nil) {
		return boardJson, err
	}
	
	boardJson.Config = GlobalConfig
	
	_ = json.Unmarshal([]byte(GlobalConfig.MenuSections), &boardJson.MenuSections)
	_ = json.Unmarshal([]byte(GlobalConfig.DangerMenuSections), &boardJson.DangerMenuSections)
	
	boardJson.Board = board
	boardJson.IsBoard = true
	
	var threads = []Thread{}
	var thread Thread
	var opPosts Posts
	
	if(boardId == "o") {
		if(mode == "catalogStandart" || mode == "catalogNum") {
			if(mode == "catalogNum") {
				boardJson.Filter = "num"
				database.MySQL.Where("board != 'test' AND board != 'onion' AND parent = 0 AND deleted = 0 AND archived = 0 AND files NOT LIKE 'null'").Order("num desc").Find(&opPosts)
			} else {
				boardJson.Filter = "standart"
				database.MySQL.Where("board != 'test' AND board != 'onion' AND parent = 0 AND deleted = 0 AND archived = 0 AND files NOT LIKE 'null'").Order("lasthit desc").Find(&opPosts)
			}
		} else {
			database.MySQL.Where("board != 'test' AND board != 'onion' AND parent = 0 AND deleted = 0 AND archived = 0").Order("lasthit desc").Limit(30).Offset(offset).Find(&opPosts)
		}
	} else {
		if(mode == "catalogStandart" || mode == "catalogNum") {
			if(mode == "catalogNum") {
				boardJson.Filter = "num"
				database.MySQL.Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0 AND files NOT LIKE 'null'", boardId).Order("num desc").Find(&opPosts)
			} else {
				boardJson.Filter = "standart"
				database.MySQL.Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0 AND files NOT LIKE 'null'", boardId).Order("lasthit desc").Find(&opPosts)
			}
		} else {
			database.MySQL.Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0", boardId).Order("(sticky = 0) asc, lasthit desc").Limit(30).Offset(offset).Find(&opPosts)
		}
	}
	
	for _, opPost := range opPosts {
		thread = Thread{}
		thread.ThreadNum = opPost.Num
		
		if(boardId == "o") {
			if(mode == "boardPage") {
				database.MySQL.Model(&Post{}).Where("(num = ? OR parent = ?) AND deleted = 0", opPost.Num, opPost.Num).Count(&thread.PostsCount)
				database.MySQL.Model(&Post{}).Where("(num = ? OR parent = ?) AND deleted = 0 AND files NOT LIKE 'null'", opPost.Num, opPost.Num).Count(&thread.FilesCount)
			} else {
				database.MySQL.Model(&Post{}).Where("(num = ? OR parent = ?) AND deleted = 0", opPost.Num, opPost.Num).Count(&opPost.PostsCountForCatalog)
				database.MySQL.Model(&Post{}).Where("(num = ? OR parent = ?) AND deleted = 0 AND files NOT LIKE 'null'", opPost.Num, opPost.Num).Count(&opPost.FilesCountForCatalog)
			}
		} else {
			if(mode == "boardPage") {
				database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", boardId, opPost.Num, opPost.Num).Count(&thread.PostsCount)
				database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0 AND files NOT LIKE 'null'", boardId, opPost.Num, opPost.Num).Count(&thread.FilesCount)
			} else {
				database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", boardId, opPost.Num, opPost.Num).Count(&opPost.PostsCountForCatalog)
				database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0 AND files NOT LIKE 'null'", boardId, opPost.Num, opPost.Num).Count(&opPost.FilesCountForCatalog)
			}
		}
		
		thread.SkippedPostsCount = thread.PostsCount - 1
		thread.SkippedFilesCount = thread.FilesCount - 1
		
		if(mode == "boardPage") {
			database.MySQL.Where("parent = ? AND deleted = 0", opPost.Num).Order("id desc").Limit(2).Find(&thread.Posts)
			
			for index, post := range thread.Posts {
				post.ProcessVirtualFields()
				post.ProcessSecrets()
				
				if(GlobalConfig.DisableFilesDisplaying == 1) {
					post.HidePostFiles()
				}
				
				if(post.ForceGeo == 0) {
					if(board.EnableFlags == 0) {
						post.Icon = ""
					}
				}
				
				thread.Posts[index] = post
				
				thread.SkippedPostsCount--
				
				if(len(post.FilesParsed) > 0) {
					thread.SkippedFilesCount--
				}
			}
		}
		
		opPost.ProcessVirtualFields()
		opPost.ProcessSecrets()
				
		if(GlobalConfig.DisableFilesDisplaying == 1) {
			opPost.HidePostFiles()
		}
		
		if(board.EnableFlags == 0) {
			opPost.Icon = ""
		}
		
		if(mode == "catalogStandart" || mode == "catalogNum") {
			opPost.Subject = opPost.Title
		}
		
		thread.Posts = append(thread.Posts, opPost)
    
        if(board.EnableReactions == 1) {
            thread.Posts.ProcessReactions()
        }
		
		slices.Reverse(thread.Posts)
		
		threads = append(threads, thread)
	}
	
	boardJson.Threads = threads
	boardJson.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	boardJson.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "board_")
	
	return boardJson, nil
}

func RenderCatalogInFile(boardId string) {
	catalogTypes := []string{"catalogStandart", "catalogNum"}
	
	for _, catalogType := range catalogTypes {
		var boardJson BoardJson
		
		boardJson, _ = GetBoardJson(boardId, 0, catalogType)
		
		if(len(boardJson.Threads) >= 0) {
			ex, err := os.Executable()
			exPath := filepath.Dir(ex)
			
			filename := "catalog"
			
			if(catalogType == "catalogNum") {
				filename = "catalog_num"
			}
			
			tpl := template.Must(template.ParseFiles(exPath + "/templates/catalog.html"))
			
			f, err := os.Create(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/catalog.html")
			
			if(err != nil) {
				fmt.Println("create file: ", err)
			} else {
				boardJson.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
				boardJson.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "board_")
				
				err = tpl.Execute(f, boardJson)
				
				if(err != nil) {
					fmt.Println("execute: ", err)
				}
			}
			
			jsonResponse, _ := json.Marshal(boardJson)
			
			_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/" + filename + ".json", jsonResponse, 0777)
		}
	}
}

func RenderBoardThreadsInFile(boardId string) {
	var opPosts Posts
	var boardThreads BoardThreads
	
	boardThreads.Board = boardId
	
	database.MySQL.Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0", boardId).Find(&opPosts)
	
	opPosts.ProcessVirtualFields()
	
	for _, opPost := range opPosts {
		var boardThread BoardThread
		boardThread.Num = opPost.Num
		boardThread.Lasthit = opPost.Lasthit
		boardThread.Timestamp = opPost.Timestamp
		boardThread.Comment = opPost.Comment
		boardThread.Subject = opPost.Title
		
		database.MySQL.Model(&Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", boardId, opPost.Num, opPost.Num).Count(&boardThread.PostsCount)
		
		boardThreads.Threads = append(boardThreads.Threads, boardThread)
	}
	
	sort.Slice(boardThreads.Threads, func(i, j int) bool {
		return boardThreads.Threads[i].PostsCount > boardThreads.Threads[j].PostsCount
	})
	
	jsonResponse, _ := json.Marshal(boardThreads)
	
	_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardId + "/threads.json", jsonResponse, 0777)
}

func RenderBoardInFile(boardId string, page int) {
	var boardJson BoardJson
	
	boardJson, _ = GetBoardJson(boardId, page * 30, "boardPage")
	
	if(len(boardJson.Threads) >= 0) {
		var pagesCount int
		var threadsCount int64
		database.MySQL.Model(&Post{}).Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0", boardJson.Board.ID).Count(&threadsCount)
		
		pagesCount = int(math.Ceil(float64(threadsCount) / 30))
		
		boardJson.PagesCount = pagesCount
		boardJson.CurrentPage = page
		
		for currentPage := 0; currentPage < pagesCount; currentPage++ {
			boardJson.PagesSlice = append(boardJson.PagesSlice, currentPage)
		}
		
		ex, err := os.Executable()
		exPath := filepath.Dir(ex)
		
		filename := strconv.Itoa(page)
		
		if(page == 0) {
			filename = "index"
		}
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/board.html"))
		
		err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)

		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			f, err := os.Create(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/" + filename + ".html")
			
			if(err != nil) {
				fmt.Println("create file: ", err)
			} else {
				err = tpl.Execute(f, boardJson)
				
				if(err != nil) {
					fmt.Println("execute: ", err)
				}
			}
		}
		
		jsonResponse, _ := json.Marshal(boardJson)
		
		err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/" + filename + ".json", jsonResponse, 0777)
		}
	}
}

func RenderThreadInFile(boardId string, num int) {
	var boardJson BoardJson
	boardJson, _ = GetThreadJson(boardId, num)
	
	if(len(boardJson.Threads) > 0) {
		ex, err := os.Executable()
		exPath := filepath.Dir(ex)
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/board.html"))
		
		err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			f, err := os.Create(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res/" + strconv.Itoa(num) + ".html")
			
			if(err != nil) {
				fmt.Println("create file: ", err)
			} else {
				err = tpl.Execute(f, boardJson)

				if(err != nil) {
					fmt.Println("execute: ", err)
				}
			}
		}
		
		jsonResponse, _ := json.Marshal(boardJson)
		
		err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res/" + strconv.Itoa(num) + ".json", jsonResponse, 0777)
		}
	}
}

func RenderNewsInFile() {
	var newsJson NewsJson
	var latestPosts []Post
	
	database.MySQL.Where("board = 'news' AND parent = 0 AND deleted = 0 AND archived = 0").Order("num desc").Limit(10).Find(&latestPosts)
	
	for _, post := range latestPosts {
		var newsItem NewsItem
		
		post.ProcessVirtualFields()
		
		newsItem.Num = post.Num
		newsItem.Date = post.Date
		newsItem.Subject = post.Subject
		newsItem.Views = 0
		
		newsJson.Latest = append(newsJson.Latest, newsItem)
	}
	
	jsonResponse, _ := json.Marshal(newsJson)
	
	err := os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/", 0777)
	
	if(err != nil) {
		fmt.Println("create dir: ", err)
	} else {
		_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/news.json", jsonResponse, 0777)
	}
}

func RenderAllBoards() {
	var boards Boards
	
	database.MySQL.Order("id asc").Find(&boards)
	
	for _, board := range boards {
		var pagesCount int
		var threadsCount int64
		database.MySQL.Model(&Post{}).Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0", board.ID).Count(&threadsCount)
		
		pagesCount = int(math.Ceil(float64(threadsCount) / 30))
		
		for currentPage := 1; currentPage <= 100; currentPage++ {
			_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + board.ID + "/" + strconv.Itoa(currentPage) + ".html")
			_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + board.ID + "/" + strconv.Itoa(currentPage) + ".json")
		}
		
		RenderBoardInFile(board.ID, 0)
		
		for currentPage := 2; currentPage <= pagesCount; currentPage++ {
			RenderBoardInFile(board.ID, currentPage - 1)
		}
		
		RenderBoardThreadsInFile(board.ID)
		RenderCatalogInFile(board.ID)
	}
}

func RenderAllThreads() {
	var opPosts Posts
	
	database.MySQL.Where("parent = 0 AND deleted = 0 AND archived = 0").Find(&opPosts)
	
	for _, opPost := range opPosts {
		RenderThreadInFile(opPost.Board, opPost.Num)
	}
}

func ProcessAutodeletion() {
	var posts Posts
	var threadsToReRender []string
	
	timestamp := time.Now().Unix()
	
	database.MySQL.Where("autodeletion_timestamp > 0 AND autodeletion_timestamp <= ? AND deleted = 0 AND archived = 0", timestamp).Order("parent asc").Find(&posts)
	
	posts.ProcessVirtualFields()
	
	for _, post := range posts {
		database.MySQL.Exec("UPDATE posts SET deleted = ?, deleted_by_autodeletion = 1 WHERE id = ?", timestamp, post.ID)
		
		post.RemovePostFiles()
		
		if(!slices.Contains(threadsToReRender, post.Board + "_" + strconv.Itoa(post.Parent))) {
			threadsToReRender = append(threadsToReRender, post.Board + "_" + strconv.Itoa(post.Parent))
		}
	}
	
	for _, threadBoardNum := range threadsToReRender {
		data := strings.Split(threadBoardNum, "_")
		boardId := data[0]
		threadNum, _ := strconv.Atoi(data[1])
		
		RenderThreadInFile(boardId, threadNum)
	}
}

func RemoveThreadFiles(boardId string, num int) {
	_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardId + "/res/" + strconv.Itoa(num) + ".html")
	_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardId + "/res/" + strconv.Itoa(num) + ".json")
	_ = os.RemoveAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardId + "/src/" + strconv.Itoa(num) + "/")
	_ = os.RemoveAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardId + "/thumb/" + strconv.Itoa(num) + "/")
}