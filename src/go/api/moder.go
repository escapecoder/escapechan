package api

import (
	"os"
	_ "fmt"
	"os/exec"
	"time"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"net/http"
	"text/template"
	"encoding/json"
	"path/filepath"
	
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"github.com/thanhpk/randstr"
	
	"3ch/backend/models"
	"3ch/backend/structs"
	"3ch/backend/utils"
	"3ch/backend/database"
	"3ch/backend/config"
	"3ch/backend/i18n"
)

var IsAlNum = regexp.MustCompile(`^[a-zA-Z0-9]+$`).MatchString
var IsAlNumDefis = regexp.MustCompile(`^[a-z0-9-]+$`).MatchString

func ModerLogin(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	var success int
	
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	
	method := r.Method
	
	if(method == "POST") {
		login := strings.TrimSpace(r.FormValue("login"))
		password := strings.TrimSpace(r.FormValue("password"))
		
		var moder models.Moder
		var sessions []string
		
		err := moder.GetByLogin(login);
		
		if(err != nil) {
			moderPage.AuthFailed = 1
		} else if(moder.Password != password) {
			moderPage.AuthFailed = 1
		} else {
			 _ = json.Unmarshal([]byte(moder.Sessions), &sessions)
			 
			session := randstr.Hex(16)
			sessions = append(sessions, session)
			
			if(len(sessions) > 100) {
				sessions = sessions[1:]
			}
			
			updatedSessionsJson, _ := json.Marshal(sessions)
			
			moder.Sessions = string(updatedSessionsJson)
			moder.Update()
			
			moderCookie := &http.Cookie{Name: "moder", Value: session, Path: "/", HttpOnly: false}
			http.SetCookie(w, moderCookie)
			
			success = 1
		}
	}
	
	if(success == 1) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
	} else {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		w.Header().Set("Content-Type", "text/html")
		
		tpls := make(map[string]*template.Template)
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/login.html"))
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerLogout(w http.ResponseWriter, r *http.Request) {
	moderCookie := &http.Cookie{Name: "moder", Value: "", Path: "/", Expires: time.Unix(0, 0), HttpOnly: false}
	http.SetCookie(w, moderCookie)
	
	http.Redirect(w, r, "/moder/login", http.StatusSeeOther)
	return
}

func ModerService(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "service"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/service.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerRenderAllBoards(w http.ResponseWriter, r *http.Request) {
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	models.RenderAllBoards()
	
	http.Redirect(w, r, "/moder/service?msg=BOARDS_CACHE_UPDATED", http.StatusSeeOther)
}

func ModerRenderAllThreads(w http.ResponseWriter, r *http.Request) {
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	models.RenderAllThreads()
	
	http.Redirect(w, r, "/moder/service?msg=THREADS_CACHE_UPDATED", http.StatusSeeOther)
}

func ModerModersList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "moders"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var moders models.Moders
	
	if(currentModer.Level < 5) {
		database.MySQL.Where("level < 4").Order("id desc").Find(&moders)
	} else {
		database.MySQL.Order("id desc").Find(&moders)
	}
	
	moderPage.Moders = moders
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/moders_list.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerModersEdit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	moderId, _ := strconv.Atoi(vars["moder"])
	
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "moders"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var boards models.Boards
	
	database.MySQL.Order("id asc").Find(&boards)
	
	moderPage.Boards = boards
	
	var moder models.Moder
	
	if(moderId > 0) {
		_ = moder.GetById(moderId)
	} else {
		moder.Permissions = "[]"
		moder.ExposeIp = 0
		moder.Level = 1
		moder.Enabled = 1
		
		moderPage.IsCreate = 1
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(moderId > 0 && moder.ID == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else if(moder.ID > 0 && currentModer.Level < 5 && moder.Level >= 4) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		moderPage.Moder = moder
		
		tpls := make(map[string]*template.Template)
		tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/moders_edit.html"))
		tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
		
		tpls["top"].ExecuteTemplate(w, "base", moderPage)
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
		tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerModersSave(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var error structs.Error
	var response structs.Response
	var moder models.Moder
	var moder2 models.Moder
	var moderItem models.Moder
	
	var isCreate int
	
	err := r.ParseMultipartForm(40 << 20) //парсинг полей формы и файлов из запроса
	
	if(err != nil) { //есть ошибка парсинга
		error.Code = 100
		error.Message = "Ошибка обработки запроса."
	} else { //нет ошибки парсинга
		moderItem.ID, _ = strconv.Atoi(r.FormValue("id"))
		moderItem.Level, _ = strconv.Atoi(r.FormValue("level"))
		moderItem.ExposeIp, _ = strconv.Atoi(r.FormValue("expose_ip"))
		moderItem.Enabled, _ = strconv.Atoi(r.FormValue("enabled"))
		moderItem.Login = strings.TrimSpace(r.FormValue("login"))
		moderItem.Password = strings.TrimSpace(r.FormValue("password"))
		moderItem.Note = strings.TrimSpace(r.FormValue("note"))
		moderItem.Permissions = strings.TrimSpace(r.FormValue("permissions"))
		isCreate, _ = strconv.Atoi(r.FormValue("create"))
		
		if(isCreate == 1) {
			moderItem.Timestamp = time.Now().Unix()
			moderItem.Sessions = "[]"
		}
	}
	
	if(error.Message == "") {
		err := moder.GetById(moderItem.ID)
		
		if(err != nil && isCreate == 0) {
			error.Code = 1
			error.Message = "Модератора с таким ID не существует."
		} else {
			if(moderItem.Password == "") {
				moderItem.Password = moder.Password
			}
			
			if(isCreate == 0) {
				moderItem.Timestamp = moder.Timestamp
				moderItem.Sessions = moder.Sessions
			}
		}
	}
	
	if(error.Message == "") {
		if(isCreate == 0 && currentModer.Level < 5 && moder.Level >= 4) {
			error.Code = 1
			error.Message = "Модератора с таким ID не существует."
		}
	}
	
	if(error.Message == "") {
		if(moderItem.Login == "") {
			error.Code = 1
			error.Message = "Укажите логин модератора."
		} else if(!IsAlNum(moderItem.Login)) {
			error.Code = 1
			error.Message = "Логин модератора может содержать только цифры и латинские буквы."
		} else {
			err := moder2.GetByLogin(moderItem.Login)
			
			if(err == nil && moder.ID != moder2.ID) {
				error.Code = 1
				error.Message = "Модератор с таким логином уже существует."
			}
		}
	}
	
	if(error.Message == "" && isCreate == 1 && moderItem.Password == "") {
		error.Code = 1
		error.Message = "Укажите пароль модератора."
	}
	
	if(error.Message == "") {
		if(currentModer.Level < 5 && moderItem.Level >= 4) {
			error.Code = 1
			error.Message = "Выберите корректный уровень доступа."
		}
	}
	
	if(error.Message == "") {
		err := moderItem.Update()
		
		if(err != nil) {
			error.Code = 1
			error.Message = "Произошла ошибка."
		}
	}
	
	if(error.Message == "") {
		response.Result = 1
		response.RedirectUrl = "/moder/moders?msg=MODER_SAVED"
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerArticlesList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "articles"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 5) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var articles models.Articles
	
	database.MySQL.Order("id asc").Find(&articles)
	
	moderPage.Articles = articles
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/articles_list.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerArticlesEdit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	articleId, _ := strconv.Atoi(vars["article"])
	
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "articles"
	moderPage.Categories = config.GetCategories()
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 5) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var article models.Article
	
	if(articleId > 0) {
		_ = article.GetById(articleId)
	} else {
		moderPage.IsCreate = 1
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(articleId > 0 && article.ID == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		moderPage.Article = article
		
		tpls := make(map[string]*template.Template)
		tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/articles_edit.html"))
		tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
		
		tpls["top"].ExecuteTemplate(w, "base", moderPage)
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
		tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerArticlesSave(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 5) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var error structs.Error
	var response structs.Response
	var article models.Article
	var articleItem models.Article
	
	var isCreate int
	
	err := r.ParseMultipartForm(40 << 20) //парсинг полей формы и файлов из запроса
	
	if(err != nil) { //есть ошибка парсинга
		error.Code = 100
		error.Message = "Ошибка обработки запроса."
	} else { //нет ошибки парсинга
		articleItem.ID, _ = strconv.Atoi(r.FormValue("id"))
		articleItem.Title = strings.TrimSpace(r.FormValue("title"))
		articleItem.Slug = strings.TrimSpace(r.FormValue("slug"))
		articleItem.Text = strings.TrimSpace(r.FormValue("text"))
		isCreate, _ = strconv.Atoi(r.FormValue("create"))
	}
	
	if(error.Message == "") {
		err := article.GetById(articleItem.ID)
		
		if(err != nil) {
			if(isCreate == 0) {
				error.Code = 1
				error.Message = "Раздел не существует."
			}
		}
	}
	
	if(error.Message == "" && articleItem.Title == "") {
		error.Code = 1
		error.Message = "Укажите название статьи."
	}
	
	if(error.Message == "" && articleItem.Slug == "") {
		error.Code = 1
		error.Message = "Укажите URL статьи."
	}
	
	if(error.Message == "" && !IsAlNumDefis(articleItem.Slug)) {
		error.Code = 1
		error.Message = "URL статьи может содержать только цифры, латинские буквы и дефисы."
	}
	
	if(error.Message == "" && articleItem.Text == "") {
		error.Code = 1
		error.Message = "Укажите текст статьи."
	}
	
	if(error.Message == "") {
		err := articleItem.Update()
		
		if(err != nil) {
			error.Code = 1
			error.Message = "Произошла ошибка."
		}
	}
	
	if(error.Message == "") {
		response.Result = 1
		response.RedirectUrl = "/moder/articles?msg=ARTICLE_SAVED"
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerBoardsList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "boards"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var boards models.Boards
	
	database.MySQL.Order("id asc").Find(&boards)
	
	for index, board := range boards {
		database.MySQL.Model(&models.Post{}).Where("board = ? AND parent = 0 AND deleted = 0 AND archived = 0", board.ID).Count(&board.ActiveThreadsCount)
		database.MySQL.Model(&models.Post{}).Where("board = ? AND deleted = 0 AND archived = 0", board.ID).Count(&board.ActivePostsCount)
		
		boards[index] = board
	}
	
	moderPage.Boards = boards
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/boards_list.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerBoardsEdit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	boardId := vars["board"]
	
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "boards"
	moderPage.Categories = config.GetCategories()
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var board models.Board
	
	if(len(boardId) > 0) {
		_ = board.GetById(boardId)
	} else {
		moderPage.IsCreate = 1
		
		board.DefaultName = "Аноним"
		board.FileTypes = "jpg,png,gif,webm,mp4,webp,mp3,wav"
		board.BumpLimit = 500
		board.MaxPages = 5
		board.MaxComment = 15000
		board.MaxFilesSizeMB = 20
		board.EnableSage = 1
		board.EnablePosting = 1
		board.RequireFilesForOp = 1
		board.IsDanger = 0
		board.BanReasons = "[]"
		board.Spamlist = "[]"
		board.Replacements = "[]"
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(len(boardId) > 0 && len(board.ID) == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		moderPage.Board = board
		
		tpls := make(map[string]*template.Template)
		tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/boards_edit.html"))
		tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
		
		tpls["top"].ExecuteTemplate(w, "base", moderPage)
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
		tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerBoardsSave(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var error structs.Error
	var response structs.Response
	var board models.Board
	var boardItem models.Board
	
	var isCreate int
	
	err := r.ParseMultipartForm(40 << 20) //парсинг полей формы и файлов из запроса
	
	if(err != nil) { //есть ошибка парсинга
		error.Code = 100
		error.Message = "Ошибка обработки запроса."
	} else { //нет ошибки парсинга
		boardItem.ID = strings.TrimSpace(r.FormValue("id"))
		boardItem.BanReasons = strings.TrimSpace(r.FormValue("ban_reasons"))
		boardItem.Spamlist = strings.TrimSpace(r.FormValue("spamlist"))
		boardItem.Replacements = strings.TrimSpace(r.FormValue("replacements"))
		boardItem.Name = strings.TrimSpace(r.FormValue("name"))
		boardItem.Info = strings.TrimSpace(r.FormValue("info"))
		boardItem.DefaultName = strings.TrimSpace(r.FormValue("default_name"))
		boardItem.MaleAdjectives = strings.TrimSpace(r.FormValue("male_adjectives"))
		boardItem.MaleProperNames = strings.TrimSpace(r.FormValue("male_proper_names"))
		boardItem.FemaleAdjectives = strings.TrimSpace(r.FormValue("female_adjectives"))
		boardItem.FemaleProperNames = strings.TrimSpace(r.FormValue("female_proper_names"))
		boardItem.Reactions = strings.TrimSpace(r.FormValue("reactions"))
		boardItem.FileTypes = strings.TrimSpace(r.FormValue("file_types"))
		boardItem.CategoryId, _ = strconv.Atoi(r.FormValue("category_id"))
		boardItem.MaxComment, _ = strconv.Atoi(r.FormValue("max_comment"))
		boardItem.MaxFilesSizeMB, _ = strconv.Atoi(r.FormValue("max_files_size"))
		boardItem.MaxFilesSize = boardItem.MaxFilesSizeMB * 1024
		boardItem.BumpLimit, _ = strconv.Atoi(r.FormValue("bump_limit"))
		boardItem.MaxPages, _ = strconv.Atoi(r.FormValue("max_pages"))
		boardItem.IsDanger, _ = strconv.Atoi(r.FormValue("is_danger"))
		boardItem.RequireFilesForOp, _ = strconv.Atoi(r.FormValue("require_files_for_op"))
		boardItem.EnablePosting, _ = strconv.Atoi(r.FormValue("enable_posting"))
		boardItem.EnableSage, _ = strconv.Atoi(r.FormValue("enable_sage"))
		boardItem.EnableDices, _ = strconv.Atoi(r.FormValue("enable_dices"))
		boardItem.EnableTrips, _ = strconv.Atoi(r.FormValue("enable_trips"))
		boardItem.EnableOpMod, _ = strconv.Atoi(r.FormValue("enable_op_mod"))
		boardItem.EnableLikes, _ = strconv.Atoi(r.FormValue("enable_likes"))
		boardItem.EnableReactions, _ = strconv.Atoi(r.FormValue("enable_reactions"))
		boardItem.EnableFlags, _ = strconv.Atoi(r.FormValue("enable_flags"))
		boardItem.EnableSubject, _ = strconv.Atoi(r.FormValue("enable_subject"))
		boardItem.EnableNames, _ = strconv.Atoi(r.FormValue("enable_names"))
		boardItem.EnableIds, _ = strconv.Atoi(r.FormValue("enable_ids"))
		isCreate, _ = strconv.Atoi(r.FormValue("create"))
	}
	
	if(error.Message == "" && boardItem.ID == "") {
		error.Code = 1
		error.Message = "Укажите ID раздела."
	}
	
	if(error.Message == "" && !IsAlNum(boardItem.ID)) {
		error.Code = 1
		error.Message = "ID раздела может содержать только цифры и латинские буквы."
	}
	
	if(error.Message == "") {
		err := board.GetById(boardItem.ID)
		
		if(err != nil) {
			if(isCreate == 0) {
				error.Code = 1
				error.Message = "Раздел не существует."
			}
		} else if(isCreate == 1) {
			error.Code = 1
			error.Message = "Раздел с таким ID уже существует."
		}
	}
	
	if(error.Message == "" && boardItem.CategoryId < 0) {
		error.Code = 1
		error.Message = "Укажите категорию раздела."
	}
	
	if(error.Message == "" && boardItem.Name == "") {
		error.Code = 1
		error.Message = "Укажите название раздела."
	}
	
	if(error.Message == "" && boardItem.DefaultName == "") {
		error.Code = 1
		error.Message = "Укажите имя постера по умолчанию."
	}
	
	if(error.Message == "" && boardItem.MaxComment <= 0) {
		error.Code = 1
		error.Message = "Укажите максимальную длину поста."
	}
	
	if(error.Message == "" && boardItem.MaxPages <= 1) {
		error.Code = 1
		error.Message = "Количество страниц должно быть не менее 1."
	}
	
	if(error.Message == "" && boardItem.EnableIds == 1 && (boardItem.MaleAdjectives == "" || boardItem.MaleProperNames == "" || boardItem.FemaleAdjectives == "" || boardItem.FemaleProperNames == "")) {
		error.Code = 1
		error.Message = "Заполните прилагательные и имена собственные для генерации ID постеров."
	}
	
	if(error.Message == "") {
		err := boardItem.Update()
		
		if(err != nil) {
			error.Code = 1
			error.Message = "Произошла ошибка."
		}
	}
	
	if(error.Message == "") {
		response.Result = 1
		response.RedirectUrl = "/moder/boards?msg=BOARD_SAVED"
		
		//models.RenderAllBoards()
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerConfig(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "config"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	moderPage.Config = models.GlobalConfig
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/config_edit.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerConfigSave(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 4) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var error structs.Error
	var response structs.Response
	var configItem models.Config
	
	err := r.ParseMultipartForm(40 << 20) //парсинг полей формы и файлов из запроса
	
	if(err != nil) { //есть ошибка парсинга
		error.Code = 100
		error.Message = "Ошибка обработки запроса."
	} else { //нет ошибки парсинга
		configItem.PostformAnnotation = strings.TrimSpace(r.FormValue("postform_annotation"))
		configItem.FooterAnnotation = strings.TrimSpace(r.FormValue("footer_annotation"))
		configItem.BanReasons = strings.TrimSpace(r.FormValue("ban_reasons"))
		configItem.Spamlist = strings.TrimSpace(r.FormValue("spamlist"))
		configItem.MenuSections = strings.TrimSpace(r.FormValue("menu_sections"))
		configItem.DangerMenuSections = strings.TrimSpace(r.FormValue("danger-menu_sections"))
		configItem.NoRknDomain = strings.TrimSpace(r.FormValue("no_rkn_domain"))
		configItem.DisableFilesDisplaying, _ = strconv.Atoi(r.FormValue("disable_files_displaying"))
		configItem.DisableFilesDisplayingForReadonly, _ = strconv.Atoi(r.FormValue("disable_files_displaying_for_readonly"))
		configItem.DisableFilesUploading, _ = strconv.Atoi(r.FormValue("disable_files_uploading"))
	}
	
	if(error.Message == "") {
		configItem.ID = models.GlobalConfig.ID
		
		err := configItem.Update()
		
		if(err != nil) {
			error.Code = 1
			error.Message = "Произошла ошибка."
		}
	}
	
	if(error.Message == "") {
		nginx := "location ~* ^/.*/(src|thumb)/.+$ {\n\trewrite ^ /static/img/nomedia.jpg break;\n}"
		
		if(configItem.DisableFilesDisplaying == 0) {
			nginx = ""
		}
		
		if(configItem.DisableFilesDisplayingForReadonly == 1) {
			nginx = "location ~* ^/.*/(src|thumb)/.+$ {\n\tif ($cookie_usercode_auth = \"\") {\n\t\trewrite ^ /static/img/nomedia.jpg break;\n\t}\n}"
		}
		
		nginxBytes := []byte(nginx)
		_ = os.WriteFile(os.Getenv("NGINX_DISABLE_MEDIA_LOCATION"), nginxBytes, 0777)
		
		cmd := exec.Command("nginx", "-s", "reload")
		_ = cmd.Run()
		
		response.Result = 1
		response.RedirectUrl = "/moder/config?msg=CONFIG_SAVED"
		
		models.GlobalConfig = configItem
		
		//models.RenderAllThreads()
		//models.RenderAllBoards()
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerModlogList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "modlog"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	if(currentModer.Level < 0) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/modlog.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerModlogSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 0) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var conditions []string
	var boardsConditions []string
	var permissions models.ModerPermissions
	
	_ = json.Unmarshal([]byte(currentModer.Permissions), &permissions)
	
	for _, permission := range permissions {
		if(permission.Board == "all") {
			boardsConditions = []string{"1=1"}
			break
		}
		
		var boardsCondition string
		
		if(len(permission.Thread) == 0 || permission.Thread == "0") {
			boardsCondition = "`board` = '" + permission.Board + "'"
		} else {
			boardsCondition = "(`board` = '" + permission.Board + "' AND `parent` = " + permission.Thread + ")"
		}
		
		boardsConditions = append(boardsConditions, boardsCondition);
	}
	
	if(currentModer.Level >= 4) {
		conditions = append(conditions, "1=1")
	} else {
		conditions = append(conditions, "(" + strings.Join(boardsConditions[:], " OR ") + ")")
	}
	
	if(currentModer.Level == 1 || currentModer.Level == 0) {
		conditions = append(conditions, "`moder` = " + strconv.Itoa(currentModer.ID))
	}
	
	var response structs.DatatablesResponse
	var modlog models.ModlogRecords
	
	ip := r.Header.Get("X-Forwarded-For")
	
	length, _ := strconv.Atoi(r.URL.Query().Get("length"))
	
	if(length <= 0) {
		length = 10
	}
	
	if(length > 100) {
		length = 100
	}
	
	start, _ := strconv.Atoi(r.URL.Query().Get("start"))
	
	if(start <= 0) {
		start = 0
	}
	
	searchQuery := strings.TrimSpace(r.URL.Query().Get("query"))
	
	if(searchQuery != "") {
		conditions = append(conditions, "`reason` LIKE \"%" + utils.DatabaseEscapeString(searchQuery) + "%\"")
	}
	
	searchIp := strings.TrimSpace(r.URL.Query().Get("ip"))
	
	if(searchIp != "") {
		lastIpChar := searchIp[len(searchIp)-1:]
		
		if(currentModer.Level < 5 && !utils.IsIpHashed(searchIp)) {
			searchIp = "0.0.0.0"
		}
		
		searchIp = utils.UnhashIp(searchIp)
		
		if(lastIpChar == ".") {
			conditions = append(conditions, "`ip` LIKE \"" + utils.DatabaseEscapeString(searchIp) + "%\"")
		} else {
			conditions = append(conditions, "`ip` = \"" + utils.DatabaseEscapeString(searchIp) + "\"")
		}
	}
	
	database.MySQL.Model(&models.ModlogRecord{}).Where(strings.Join(conditions[:], " AND ")).Count(&response.RecordsTotal)
	
	response.RecordsFiltered = response.RecordsTotal
	
	database.MySQL.Where(strings.Join(conditions[:], " AND ")).Order("id desc").Limit(length).Offset(start).Find(&modlog)
	
	for index, record := range modlog {
		/*if(currentModer.Level == 1 && strings.Contains(record.Ip, ".")) {
			ipOctets := strings.Split(record.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			record.Ip = strings.Join(ipOctets, ".")
		}*/
		
		if(currentModer.Level < 5) {
			record.Ip = utils.HashIp(record.Ip)
			record.IpSubnet = utils.HashIp(record.IpSubnet)
		}
		
		if(record.Num > 0) {
			record.Post.GetByNum(record.Num)
		}
		
		/*if(record.Post.ID > 0 && currentModer.Level == 1 && strings.Contains(record.Ip, ".")) {
			ipOctets := strings.Split(record.Post.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			record.Post.Ip = strings.Join(ipOctets, ".")
		}*/
		
		if(currentModer.Level < 5) {
			record.Post.Ip = utils.HashIp(record.Post.Ip)
		}
		
		record.Post.SetSecuredFileUrls(ip)
		
		modlog[index] = record
	}
	
	modlog.ProcessVirtualFields()
		
	response.Data = modlog
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerPasscodesList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "passcodes"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/passcodes_list.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerPasscodesSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var conditions []string
	
	var response structs.DatatablesResponse
	var passcodes models.ModerPasscodes
	
	length, _ := strconv.Atoi(r.URL.Query().Get("length"))
	
	if(length <= 0) {
		length = 10
	}
	
	if(length > 100) {
		length = 100
	}
	
	start, _ := strconv.Atoi(r.URL.Query().Get("start"))
	
	if(start <= 0) {
		start = 0
	}
	
	id := strings.TrimSpace(r.URL.Query().Get("id"))
	
	if(id != "") {
		conditions = append(conditions, "`id` = \"" + utils.DatabaseEscapeString(id) + "\"")
	}
	
	searchQuery := strings.TrimSpace(r.URL.Query().Get("query"))
	
	if(searchQuery != "") {
		conditions = append(conditions, "`code` LIKE \"%" + utils.DatabaseEscapeString(searchQuery) + "%\"")
	}
	
	database.MySQL.Model(&models.ModerPasscodes{}).Where(strings.Join(conditions[:], " AND ")).Count(&response.RecordsTotal)
	
	response.RecordsFiltered = response.RecordsTotal
	
	database.MySQL.Where(strings.Join(conditions[:], " AND ")).Order("id desc").Limit(length).Offset(start).Find(&passcodes)
	
	for index, passcode := range passcodes {
		passcodes[index] = passcode
	}
	
	passcodes.ProcessVirtualFields()
		
	response.Data = passcodes
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerPasscodesEdit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	passcodeId, _ := strconv.Atoi(vars["passcode"])
	
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "passcodes"
	moderPage.Categories = config.GetCategories()
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	moderPage.CurrentModer = currentModer
	
	var passcode models.ModerPasscode
	
	if(passcodeId > 0) {
		_ = passcode.GetById(passcodeId)
	} else {
		moderPage.IsCreate = 1
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(passcodeId > 0 && passcode.ID == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		passcode.Delta = passcode.Expires - passcode.Timestamp
		
		moderPage.Passcode = passcode
		
		tpls := make(map[string]*template.Template)
		tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/passcodes_edit.html"))
		tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
		
		tpls["top"].ExecuteTemplate(w, "base", moderPage)
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
		tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerPasscodesSave(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var error structs.Error
	var response structs.Response
	var passcode models.ModerPasscode
	var passcodeItem models.ModerPasscode
	
	var isCreate int
	
	err := r.ParseMultipartForm(40 << 20) //парсинг полей формы и файлов из запроса
	
	if(err != nil) { //есть ошибка парсинга
		error.Code = 100
		error.Message = "Ошибка обработки запроса."
	} else { //нет ошибки парсинга
		passcodeItem.ID, _ = strconv.Atoi(r.FormValue("id"))
		passcodeItem.Banned, _ = strconv.Atoi(r.FormValue("banned"))
		passcodeItem.Code = strings.TrimSpace(r.FormValue("code"))
		isCreate, _ = strconv.Atoi(r.FormValue("create"))
		
		if(isCreate == 1) {
			passcodeItem.Timestamp = time.Now().Unix()
		}
		
		passcodeItem.Expires, _ = strconv.ParseInt(r.FormValue("expires"), 10, 64)
	}
	
	if(error.Message == "") {
		err := passcode.GetById(passcodeItem.ID)
		
		if(err != nil && isCreate == 0) {
			error.Code = 1
			error.Message = "Пасскод с таким ID не существует."
		} else {
			if(isCreate == 0) {
				passcodeItem.Code = passcode.Code
				passcodeItem.Timestamp = passcode.Timestamp
				passcodeItem.TgId = passcode.TgId
			}
			
			passcodeItem.Expires = passcodeItem.Timestamp + passcodeItem.Expires;
		}
	}
	
	if(error.Message == "" && passcodeItem.Code == "") {
		error.Code = 1
		error.Message = "Укажите пасскод."
	}
	
	if(error.Message == "" && !IsAlNum(passcodeItem.Code)) {
		error.Code = 1
		error.Message = "Пасскод может содержать только цифры и латинские буквы."
	}
	
	if(error.Message == "") {
		err := passcodeItem.Update()
		
		if(err != nil) {
			error.Code = 1
			error.Message = "Произошла ошибка."
		}
	}
	
	if(error.Message == "") {
		response.Result = 1
		response.RedirectUrl = "/moder/passcodes?msg=PASSCODE_SAVED"
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerBansList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "bans"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bans.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerBansSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var conditions []string
	var boardsConditions []string
	var permissions models.ModerPermissions
	
	_ = json.Unmarshal([]byte(currentModer.Permissions), &permissions)
	
	for _, permission := range permissions {
		if(permission.Board == "all") {
			boardsConditions = []string{"1=1"}
			break
		}
		
		var boardsCondition string
		
		if(len(permission.Thread) == 0 || permission.Thread == "0") {
			boardsCondition = "`board` = '" + permission.Board + "'"
		} else {
			boardsCondition = "(`board` = '" + permission.Board + "' AND `parent` = " + permission.Thread + ")"
		}
		
		boardsConditions = append(boardsConditions, boardsCondition);
	}
	
	conditions = append(conditions, "(" + strings.Join(boardsConditions[:], " OR ") + ")")
	
	var response structs.DatatablesResponse
	var bans models.ModerBans
	
	length, _ := strconv.Atoi(r.URL.Query().Get("length"))
	
	if(length <= 0) {
		length = 10
	}
	
	if(length > 100) {
		length = 100
	}
	
	start, _ := strconv.Atoi(r.URL.Query().Get("start"))
	
	if(start <= 0) {
		start = 0
	}
	
	id := strings.TrimSpace(r.URL.Query().Get("id"))
	
	if(id != "") {
		conditions = append(conditions, "`id` = \"" + utils.DatabaseEscapeString(id) + "\"")
	}
	
	searchQuery := strings.TrimSpace(r.URL.Query().Get("query"))
	
	if(searchQuery != "") {
		conditions = append(conditions, "`reason` LIKE \"%" + utils.DatabaseEscapeString(searchQuery) + "%\"")
	}
	
	searchIp := strings.TrimSpace(r.URL.Query().Get("ip"))
	
	if(searchIp != "") {
		lastIpChar := searchIp[len(searchIp)-1:]
		
		if(currentModer.Level < 5 && !utils.IsIpHashed(searchIp)) {
			searchIp = "0.0.0.0"
		}
		
		searchIp = utils.UnhashIp(searchIp)
		
		if(lastIpChar == ".") {
			conditions = append(conditions, "`ip_subnet` LIKE \"" + utils.DatabaseEscapeString(searchIp) + "%\"")
		} else {
			conditions = append(conditions, "`ip_subnet` = \"" + utils.DatabaseEscapeString(searchIp) + "\"")
		}
	}
	
	searchProcessed := strings.TrimSpace(r.URL.Query().Get("processed"))
	
	if(searchProcessed != "1") {
		//conditions = append(conditions, "`processed` = 0")
	}
	
	database.MySQL.Model(&models.ModerBans{}).Where(strings.Join(conditions[:], " AND ")).Count(&response.RecordsTotal)
	
	response.RecordsFiltered = response.RecordsTotal
	
	database.MySQL.Where(strings.Join(conditions[:], " AND ")).Order("id desc").Limit(length).Offset(start).Find(&bans)
	
	for index, ban := range bans {
		if(currentModer.Level < 5) {
			ban.IpSubnet = utils.HashIp(ban.IpSubnet)
		}
		
		bans[index] = ban
	}
	
	bans.ProcessVirtualFields()
		
	response.Data = bans
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerBansCancel(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	ip := r.Header.Get("X-Forwarded-For")
	
	banId, _ := strconv.Atoi(r.FormValue("id"))

	var response structs.Response
	
	database.MySQL.Exec("UPDATE `bans` SET `canceled` = 1 WHERE `id` = ?", banId)
		
	response.Result = 1
	
	timestamp := time.Now().Unix()
	
	var modlogRecord models.ModlogRecord
	modlogRecord.Moder = currentModer.ID
	modlogRecord.Action = "unban"
	modlogRecord.BanId = banId
	modlogRecord.Ip = ip
	modlogRecord.Timestamp = timestamp
	modlogRecord.Create()
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerReportsList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "reports"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	if(currentModer.Level < 1) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/reports.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerReportsSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 1) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var conditions []string
	var boardsConditions []string
	var permissions models.ModerPermissions
	
	_ = json.Unmarshal([]byte(currentModer.Permissions), &permissions)
	
	for _, permission := range permissions {
		if(permission.Board == "all") {
			boardsConditions = []string{"1=1"}
			break
		}
		
		var boardsCondition string
		
		if(len(permission.Thread) == 0 || permission.Thread == "0") {
			boardsCondition = "`board` = '" + permission.Board + "'"
		} else {
			boardsCondition = "(`board` = '" + permission.Board + "' AND `parent` = " + permission.Thread + ")"
		}
		
		boardsConditions = append(boardsConditions, boardsCondition);
	}
	
	conditions = append(conditions, "(" + strings.Join(boardsConditions[:], " OR ") + ")")
	
	var response structs.DatatablesResponse
	var reports models.ModerReports
	
	ip := r.Header.Get("X-Forwarded-For")
	
	length, _ := strconv.Atoi(r.URL.Query().Get("length"))
	
	if(length <= 0) {
		length = 10
	}
	
	if(length > 100) {
		length = 100
	}
	
	start, _ := strconv.Atoi(r.URL.Query().Get("start"))
	
	if(start <= 0) {
		start = 0
	}
	
	searchQuery := strings.TrimSpace(r.URL.Query().Get("query"))
	
	if(searchQuery != "") {
		conditions = append(conditions, "`comment` LIKE \"%" + utils.DatabaseEscapeString(searchQuery) + "%\"")
	}
	
	searchIp := strings.TrimSpace(r.URL.Query().Get("ip"))
	
	if(searchIp != "") {
		lastIpChar := searchIp[len(searchIp)-1:]
		
		if(currentModer.Level < 5 && !utils.IsIpHashed(searchIp)) {
			searchIp = "0.0.0.0"
		}
		
		searchIp = utils.UnhashIp(searchIp)
		
		if(lastIpChar == ".") {
			conditions = append(conditions, "`ip` LIKE \"" + utils.DatabaseEscapeString(searchIp) + "%\"")
		} else {
			conditions = append(conditions, "`ip` = \"" + utils.DatabaseEscapeString(searchIp) + "\"")
		}
	}
	
	searchProcessed := strings.TrimSpace(r.URL.Query().Get("processed"))
	
	if(searchProcessed != "1") {
		conditions = append(conditions, "`processed` = 0")
	}
	
	database.MySQL.Model(&models.ModerReport{}).Where(strings.Join(conditions[:], " AND ")).Count(&response.RecordsTotal)
	
	response.RecordsFiltered = response.RecordsTotal
	
	database.MySQL.Where(strings.Join(conditions[:], " AND ")).Order("id desc").Limit(length).Offset(start).Find(&reports)
	
	for index, report := range reports {
		/*if(currentModer.Level == 1 && strings.Contains(report.Ip, ".")) {
			ipOctets := strings.Split(report.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			report.Ip = strings.Join(ipOctets, ".")
		}*/
		
		if(currentModer.Level < 5) {
			report.Ip = utils.HashIp(report.Ip)
		}
		
		report.Post.GetByBoardNum(report.Board, report.Num)
		
		/*if(report.Post.ID > 0 && currentModer.Level == 1 && strings.Contains(report.Ip, ".")) {
			ipOctets := strings.Split(report.Post.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			report.Post.Ip = strings.Join(ipOctets, ".")
		}*/
		
		if(currentModer.Level < 5) {
			report.Post.Ip = utils.HashIp(report.Post.Ip)
		}
		
		report.Post.SetSecuredFileUrls(ip)
		
		report.Post.ProcessSecrets()
		
		if(currentModer.Level < 5) {
			report.Post.IpCountryCode = ""
			report.Post.IpCountryName = ""
			report.Post.IpCityName = ""
		}
		
		reports[index] = report
	}
	
	reports.ProcessVirtualFields()
		
	response.Data = reports
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerReportsIgnore(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 1) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	reportId, _ := strconv.Atoi(r.FormValue("id"))

	var response structs.Response
	
	database.MySQL.Exec("UPDATE `reports` SET `processed` = -1 WHERE `id` = ?", reportId)
		
	response.Result = 1
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerSinglePost(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "posts"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	boardId := strings.TrimSpace(r.URL.Query().Get("board"))
	num, _ := strconv.Atoi(r.URL.Query().Get("num"))
	
	ip := r.Header.Get("X-Forwarded-For")
	
	var post models.ModerPost
	
	err := post.GetByBoardNum(boardId, num)
	
	if(err != nil) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else if((post.Parent > 0 &&!currentModer.CanModerateBoardThread(boardId, post.Parent)) || (post.Parent == 0 &&!currentModer.CanModerateBoardThread(boardId, post.Num))) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/forbidden.html"))
		
		tpl.Execute(w, nil)
	} else {
		/*if(currentModer.Level == 1 && strings.Contains(post.Ip, ".")) {
			ipOctets := strings.Split(post.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			post.Ip = strings.Join(ipOctets, ".")
		}*/
		
		if(currentModer.Level < 5) {
			post.Ip = utils.HashIp(post.Ip)
		}
		
		post.SetSecuredFileUrls(ip)
		
		post.ProcessSecrets()
		
		if(currentModer.Level < 5) {
			post.IpCountryCode = ""
			post.IpCountryName = ""
			post.IpCityName = ""
		}
		
		moderPage.Post = post
		
		w.Header().Set("Content-Type", "text/html")
		
		tpls := make(map[string]*template.Template)
		tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/posts_single.html"))
		tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
		
		tpls["top"].ExecuteTemplate(w, "base", moderPage)
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
		tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerPostsList(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	moderPage.CurrentSection = "posts"
	moderPage.Lang, _ = i18n.GetTranslations(os.Getenv("LANGUAGE"))
	moderPage.LangJson, _ = i18n.GetTranslationsJsonByPrefix(os.Getenv("LANGUAGE"), "moderation_")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "text/html")
	
	tpls := make(map[string]*template.Template)
	tpls["top"] = template.Must(template.ParseFiles(exPath + "/templates/moder/top.html"))
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/posts.html"))
	tpls["bottom"] = template.Must(template.ParseFiles(exPath + "/templates/moder/bottom.html"))
	
	tpls["top"].ExecuteTemplate(w, "base", moderPage)
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
	tpls["bottom"].ExecuteTemplate(w, "base", moderPage)
}

func ModerPostsAction(w http.ResponseWriter, r *http.Request) {
	var error structs.Error
	var response structs.Response
	var moderPage structs.ModerPage
	var banReasons []string
	var ipsToBan []string
	var passcodesToBan []int
	var numsToAct []int
	var threadsToRender []int
	var threadsToAct []int
	var postsToAct []models.ModerPost
	var ids string
	var modNote string
	var newBoard string
	var action string
	var banType string
	var reason string
	var ipOrSubnet string
	var end string
	var anywhere int
	var delall int
	var banpass int
	var pinIndex int
	var limit int
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer
	
	method := r.Method
	
	if(method == "POST") {
		ids = strings.TrimSpace(r.FormValue("ids"))
		action = strings.TrimSpace(r.FormValue("action"))
		banType = strings.TrimSpace(r.FormValue("ban_type"))
		newBoard = strings.TrimSpace(r.FormValue("newBoard"))
		modNote = strings.TrimSpace(r.FormValue("mod_note"))
		reason = strings.TrimSpace(r.FormValue("reason"))
		ipOrSubnet = strings.TrimSpace(r.FormValue("ip_or_subnet"))
		end = strings.TrimSpace(r.FormValue("end"))
		anywhere, _ = strconv.Atoi(r.FormValue("anywhere"))
		delall, _ = strconv.Atoi(r.FormValue("del_all"))
		banpass, _ = strconv.Atoi(r.FormValue("banpass"))
		pinIndex, _ = strconv.Atoi(r.FormValue("pin_index"))
		pinIndex = 1
		limit, _ = strconv.Atoi(r.FormValue("limit"))
		
		if(currentModer.Level == 1) {
			ipOrSubnet = "ip"
		}
	} else {
		ids = strings.TrimSpace(r.URL.Query().Get("ids"))
		action = strings.TrimSpace(r.URL.Query().Get("action"))
	}
	
	ip := r.Header.Get("X-Forwarded-For")
	
	moderPage.SelectedPostIds = ids
	moderPage.CurrentPostsAction = action
	
	var boards models.Boards
	
	database.MySQL.Order("id asc").Find(&boards)
	
	moderPage.Boards = boards
	
	boardsNums := strings.Split(ids, ",")
	
	previousBoard := ""
	
	for _, boardNum := range boardsNums {
		var moderPost models.ModerPost
		
		boardNumSplitted := strings.Split(boardNum, ":")
		
		board := boardNumSplitted[0]
		num, _ := strconv.Atoi(boardNumSplitted[1])
		
		if(previousBoard != "" && previousBoard != board) {
			moderPage.HasDifferentBoards = 1
			break
		}
		
		err := moderPost.GetByBoardNum(board, num)
		
		if(err != nil) {
			moderPage.HasUnavailablePosts = 1
			break
		} else if(!currentModer.CanModerateBoardThread(board, moderPost.Parent)) {
			moderPage.HasUnavailablePosts = 1
			break
		} else if((moderPost.Deleted > 0 || moderPost.Archived > 0) && action != "restore") {
			moderPage.HasUnavailablePosts = 1
			break
		} else {
			moderPost.ProcessVirtualFields()
			
			if(currentModer.Level != 5 && moderPost.ModerId > 0 && currentModer.ID != moderPost.ModerId && currentModer.Level <= moderPost.ModerLevel) {
				moderPage.HasOtherModers = 1
			} else {
				if(!slices.Contains(ipsToBan, moderPost.Ip)) {
					ipsToBan = append(ipsToBan, moderPost.Ip)
					moderPage.PostersToBan++
				}
				
				if(!slices.Contains(passcodesToBan, moderPost.PasscodeId)) {
					passcodesToBan = append(passcodesToBan, moderPost.PasscodeId)
				}
				
				if(moderPost.Parent > 0 && !slices.Contains(threadsToRender, moderPost.Parent)) {
					threadsToRender = append(threadsToRender, moderPost.Parent)
				}
				
				if(moderPost.Parent == 0 && !slices.Contains(threadsToAct, moderPost.Num)) {
					threadsToAct = append(threadsToAct, moderPost.Num)
				}
				
				if(!slices.Contains(numsToAct, moderPost.Num)) {
					numsToAct = append(numsToAct, moderPost.Num)
					postsToAct = append(postsToAct, moderPost)
					moderPage.PostsToAct++
				}
			}
		}
		
		previousBoard = board
	}
	
	var board models.Board
	var configBanReasons structs.BanReasons
	var boardBanReasons structs.BanReasons
	
	if(moderPage.HasUnavailablePosts == 0 && moderPage.HasOtherModers == 0 && moderPage.HasDifferentBoards == 0) {
		board.GetById(previousBoard)
		
		_ = json.Unmarshal([]byte(models.GlobalConfig.BanReasons), &configBanReasons)
		
		for _, banReason := range configBanReasons {
			banReasons = append(banReasons, "Общие - " + banReason.Value)
		}
		
		_ = json.Unmarshal([]byte(board.BanReasons), &boardBanReasons)
		
		for _, banReason := range boardBanReasons {
			banReasons = append(banReasons, "/" + board.ID + "/ - " + banReason.Value)
		}
		
		moderPage.BanReasons = banReasons
	}
	
	if(method == "POST") {
		w.Header().Set("Content-Type", "application/json")
		
		if(action == "delete" || action == "ban" || action == "delete_and_ban") {
			if(currentModer.Level >= 3 || currentModer.ID == 50) {
				if(reason == "") {
					error.Code = 100
					error.Message = "Введите причину."
				}
			} else {
				if(reason == "") {
					error.Code = 100
					error.Message = "Укажите причину."
				} else if(!slices.Contains(banReasons, reason)) {
					error.Code = 100
					error.Message = "Некорректная причина."
				}
			}
		}
		
		if(action == "move") {
			if(newBoard == "") {
				error.Code = 100
				error.Message = "Укажите новую доску."
			}
		}
		
		if(action == "ban" || action == "delete_and_ban" || action == "pin" || action == "unpin" || action == "endless" || action == "finite") {
			if(currentModer.Level < 1) {
				error.Code = 100
				error.Message = "Недостаточно прав."
			}
		}
		
		/*if(action == "pin" || action == "unpin" || action == "endless" || action == "finite") {
			if(currentModer.Level < 3) {
				error.Code = 100
				error.Message = "Недостаточно прав."
			}
		}*/
		
		if(error.Message == "" && moderPage.HasUnavailablePosts == 0 && moderPage.HasOtherModers == 0 && moderPage.HasDifferentBoards == 0) {
			if(action == "delete" || action == "ban" || action == "delete_and_ban") {
				timestamp := time.Now().Unix()
				
				for _, postToAct := range postsToAct {
					
					database.MySQL.Exec("UPDATE `reports` SET `processed` = ? WHERE `processed` = 0 AND `board` = ? AND `num` = ?", timestamp, postToAct.Board, postToAct.Num)
				}
			}
			
			if(action == "delete" || action == "delete_and_ban") {
				timestamp := time.Now().Unix()
				
				for _, postToAct := range postsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `deleted` = ?, `ban_reason` = ?, `ban_moder` = ? WHERE `id` = ?", timestamp, reason, currentModer.ID, postToAct.ID)
					postToAct.RemovePostFiles()
				}
				
				for _, threadNum := range threadsToRender {
					models.RenderThreadInFile(board.ID, threadNum)
				}
				
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `deleted` = ?, `deleted_by_thread_deletion` = 1 WHERE `deleted` = 0 AND `deleted_by_endless_excess` = 0 AND `board` = ? AND `parent` = ?", timestamp, board.ID, threadNum)
					
					models.RemoveThreadFiles(board.ID, threadNum)
				}
				
				if(delall == 1) {
					for _, ipToBan := range ipsToBan {
						var otherTreadsToRender []int
						
						var otherPostsToDelete []models.ModerPost
						
						timestamp24ago := timestamp - 60 * 60 * 24;
						
						database.MySQL.Where("`ip` = ? AND `archived` = 0 AND `deleted` = 0 AND timestamp >= ?", ipToBan, timestamp24ago).Order("parent desc").Find(&otherPostsToDelete)
						
						for _, otherPostToDelete := range otherPostsToDelete {
							otherPostToDelete.ProcessVirtualFields()
							
							database.MySQL.Exec("UPDATE `posts` SET `deleted` = ?, `deleted_by_delall` = 1, `ban_reason` = ?, `ban_moder` = ? WHERE `id` = ?", timestamp, reason, currentModer.ID, otherPostToDelete.ID)
							otherPostToDelete.RemovePostFiles()
							
							if(otherPostToDelete.Parent > 0 && !slices.Contains(otherTreadsToRender, otherPostToDelete.Parent)) {
								otherTreadsToRender = append(otherTreadsToRender, otherPostToDelete.Parent)
							}
							
							if(otherPostToDelete.Parent == 0) {
								database.MySQL.Exec("UPDATE `posts` SET `deleted` = ?, `deleted_by_thread_deletion` = 1 WHERE `deleted` = 0 AND `deleted_by_endless_excess` = 0 AND `board` = ? AND `parent` = ?", timestamp, otherPostToDelete.Board, otherPostToDelete.Num)
								
								models.RemoveThreadFiles(otherPostToDelete.Board, otherPostToDelete.Num)
							}
						}
						
						for _, threadNum := range otherTreadsToRender {
							models.RenderThreadInFile(board.ID, threadNum)
						}
					}
				}
			}
			
			if(action == "restore") {
				//timestamp := time.Now().Unix()
				
				for _, postToAct := range postsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `deleted` = 0, `deleted_by_thread_deletion` = 0, `deleted_by_owner` = 0, `deleted_by_op` = 0, `deleted_by_delall` = 0, `ban_reason` = '', `ban_moder` = 0 WHERE `id` = ?", postToAct.ID)
					postToAct.RestorePostFiles()
				}
				
				for _, threadNum := range threadsToRender {
					models.RenderThreadInFile(board.ID, threadNum)
				}
				
				for _, threadNum := range threadsToAct {
					var childPostsToRestore []models.ModerPost
					
					database.MySQL.Where("`board` = ? AND `parent` = ? AND `deleted_by_thread_deletion` = 1", board.ID, threadNum).Order("id asc").Find(&childPostsToRestore)
					
					for _, childPostToRestore := range childPostsToRestore {
						childPostToRestore.ProcessVirtualFields()
						childPostToRestore.RestorePostFiles()
						
						database.MySQL.Exec("UPDATE `posts` SET `deleted` = 0, `deleted_by_thread_deletion` = 0, `ban_reason` = '', `ban_moder` = 0 WHERE `id` = ?", childPostToRestore.ID)
					}
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "move") {
				//timestamp := time.Now().Unix()
				
				for _, postToAct := range postsToAct {
					models.RemoveThreadFiles(board.ID, postToAct.Num)
					
					updatedRawFiles := strings.ReplaceAll(postToAct.Files, "\"path\": \"/" + board.ID + "/", "\"path\": \"/" + newBoard + "/")
					updatedRawFiles = strings.ReplaceAll(updatedRawFiles, "\"path\":\"/" + board.ID + "/", "\"path\": \"/" + newBoard + "/")
					updatedRawFiles = strings.ReplaceAll(updatedRawFiles, "\"thumbnail\": \"/" + board.ID + "/", "\"thumbnail\": \"/" + newBoard + "/")
					updatedRawFiles = strings.ReplaceAll(updatedRawFiles, "\"thumbnail\":\"/" + board.ID + "/", "\"thumbnail\": \"/" + newBoard + "/")
					
					updatedParsedComment := strings.ReplaceAll(postToAct.CommentParsed, "href=\"/" + board.ID + "/", "href=\"/" + newBoard + "/")
					
					database.MySQL.Exec("UPDATE `posts` SET `board` = ?, `files` = ?, `comment_parsed` = ? WHERE `id` = ?", newBoard, updatedRawFiles, updatedParsedComment, postToAct.ID)
					
					postToAct.Board = newBoard
					postToAct.Files = updatedRawFiles
					postToAct.ProcessVirtualFields()
					postToAct.RestorePostFiles()
				}
				
				for _, threadNum := range threadsToAct {
					var childPostsToRestore []models.ModerPost
					
					database.MySQL.Where("`board` = ? AND `parent` = ? AND `deleted` = 0", board.ID, threadNum).Order("id asc").Find(&childPostsToRestore)
					
					for _, childPostToRestore := range childPostsToRestore {
						updatedRawFiles := strings.ReplaceAll(childPostToRestore.Files, "\"path\": \"/" + board.ID + "/", "\"path\": \"/" + newBoard + "/")
						updatedRawFiles = strings.ReplaceAll(updatedRawFiles, "\"path\":\"/" + board.ID + "/", "\"path\": \"/" + newBoard + "/")
						updatedRawFiles = strings.ReplaceAll(updatedRawFiles, "\"thumbnail\": \"/" + board.ID + "/", "\"thumbnail\": \"/" + newBoard + "/")
						updatedRawFiles = strings.ReplaceAll(updatedRawFiles, "\"thumbnail\":\"/" + board.ID + "/", "\"thumbnail\": \"/" + newBoard + "/")
						
						updatedParsedComment := strings.ReplaceAll(childPostToRestore.CommentParsed, "href=\"/" + board.ID + "/", "href=\"/" + newBoard + "/")
						
						database.MySQL.Exec("UPDATE `posts` SET `board` = ?, `files` = ?, `comment_parsed` = ? WHERE `id` = ?", newBoard, updatedRawFiles, updatedParsedComment, childPostToRestore.ID)
						
						childPostToRestore.Board = newBoard
						childPostToRestore.Files = updatedRawFiles
						childPostToRestore.ProcessVirtualFields()
						childPostToRestore.RestorePostFiles()
					}
					
					models.RenderThreadInFile(newBoard, threadNum)
				}
			}
			
			if(action == "note") {
				timestamp := time.Now().Unix()
				
				for _, postToAct := range postsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `mod_note` = ?, lasttouch = ? WHERE `id` = ?", modNote, timestamp, postToAct.ID)
				}
				
				for _, threadNum := range threadsToRender {
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "endless") {
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `endless` = ? WHERE `board` = ? AND `num` = ?", limit, board.ID, threadNum)
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "finite") {
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `endless` = 0 WHERE `board` = ? AND `num` = ?", board.ID, threadNum)
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "pin") {
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `sticky` = ? WHERE `board` = ? AND `num` = ?", pinIndex, board.ID, threadNum)
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "unpin") {
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `sticky` = 0 WHERE `board` = ? AND `num` = ?", board.ID, threadNum)
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "close") {
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `closed` = 1 WHERE `board` = ? AND `num` = ?", board.ID, threadNum)
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			if(action == "open") {
				for _, threadNum := range threadsToAct {
					database.MySQL.Exec("UPDATE `posts` SET `closed` = 0 WHERE `board` = ? AND `num` = ?", board.ID, threadNum)
					
					models.RenderThreadInFile(board.ID, threadNum)
				}
			}
			
			for _, postToAct := range postsToAct {
				timestamp := time.Now().Unix()
				
				var modlogRecord models.ModlogRecord
				modlogRecord.Moder = currentModer.ID
				
				if(action == "delete_and_ban") {
					modlogRecord.Action = "delete"
				} else {
					modlogRecord.Action = action
				}
				
				
				modlogRecord.Board = board.ID
				modlogRecord.Num = postToAct.Num
				modlogRecord.Parent = postToAct.Parent
				modlogRecord.Limit = limit
				modlogRecord.NewBoard = newBoard
				modlogRecord.Anywhere = anywhere
				modlogRecord.Delall = delall
				modlogRecord.Reason = reason
				modlogRecord.IpSubnet = postToAct.Ip
				modlogRecord.Ip = ip
				modlogRecord.Timestamp = timestamp
				modlogRecord.Create()
			}
			
			if(action == "ban" || action == "delete_and_ban") {
				if(banpass == 1) {
					for _, passcodeToBan := range passcodesToBan {
						database.MySQL.Exec("UPDATE `passcodes` SET `banned` = 1 WHERE id = ?", passcodeToBan)
					}
				}
				
				for _, ipToBan := range ipsToBan {
					timestamp := time.Now().Unix()
					ipOctets := strings.Split(ipToBan, ".")
					
					var ban models.Ban
					
					if(ipOrSubnet == "subnet1" && strings.Contains(ipToBan, ".")) {
						ipOctets[3] = "*"
						ban.IpSubnet = strings.Join(ipOctets, ".")
					} else if(ipOrSubnet == "subnet2" && strings.Contains(ipToBan, ".")) {
						ipOctets[3] = "*"
						ipOctets[2] = "*"
						ban.IpSubnet = strings.Join(ipOctets, ".")
					} else {
						ban.IpSubnet = ipToBan
					}
					
					if(end == "3h") {
						ban.End = timestamp + (60 * 60 * 3)
					} else if(end == "12h") {
						ban.End = timestamp + (60 * 60 * 12)
					} else if(end == "1d") {
						ban.End = timestamp + (60 * 60 * 24)
					} else if(end == "3d") {
						ban.End = timestamp + (60 * 60 * 24 * 3)
					} else if(end == "7d") {
						ban.End = timestamp + (60 * 60 * 24 * 7)
					} else if(end == "30d") {
						ban.End = timestamp + (60 * 60 * 24 * 30)
					} else {
						ban.End = 0
					}
					
					if(anywhere == 1) {
						ban.Board = "all"
					} else {
						ban.Board = board.ID
					}
					
					ban.Reason = reason
					ban.Type = banType
					ban.Moder = currentModer.ID
					ban.Timestamp = timestamp
					ban.Create()
					
					for _, postToAct := range postsToAct {
						if(postToAct.Ip == ipToBan) {
							var modlogRecord models.ModlogRecord
							modlogRecord.Moder = currentModer.ID
							modlogRecord.Action = "ban"
							modlogRecord.Board = board.ID
							modlogRecord.Num = postToAct.Num
							modlogRecord.Anywhere = anywhere
							modlogRecord.Delall = delall
							modlogRecord.IpOrSubnet = ipOrSubnet
							modlogRecord.IpSubnet = ban.IpSubnet
							modlogRecord.Reason = reason
							modlogRecord.Ip = ip
							modlogRecord.Timestamp = timestamp
							modlogRecord.End = ban.End
							modlogRecord.Create()
							
							database.MySQL.Exec("UPDATE `posts` SET `ban_id` = ? WHERE id = ?", ban.ID, postToAct.ID)
						}
					}
				}
			}
		}
		
		if(error.Message == "") {
			response.Result = 1
			
			models.RenderBoardInFile(board.ID, 0)
		} else {
			response.Result = 0
			response.Error = error
		}
		
		jsonResponse, _ := json.MarshalIndent(response, "", "    ")
		w.Write(jsonResponse)
	} else {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		w.Header().Set("Content-Type", "text/html")
		
		tpls := make(map[string]*template.Template)
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/moder/posts_action.html"))
		tpls["main"].ExecuteTemplate(w, "base", moderPage)
	}
}

func ModerPostsUpdateMenu(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	if(currentModer.Level < 3) {
		http.Redirect(w, r, "/moder/posts", http.StatusSeeOther)
		return
	}
	
	var error structs.Error
	var response structs.Response
	var post models.ModerPost
	var menu string
	var boardId string
	var num int
	
	var isCreate int
	
	err := r.ParseMultipartForm(40 << 20) //парсинг полей формы и файлов из запроса
	
	if(err != nil) { //есть ошибка парсинга
		error.Code = 100
		error.Message = "Ошибка обработки запроса."
	} else { //нет ошибки парсинга
		menu = strings.TrimSpace(r.FormValue("menu"))
		boardId = strings.TrimSpace(r.FormValue("board"))
		num, _ = strconv.Atoi(r.FormValue("num"))
	}
	
	if(error.Message == "") {
       err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			if(isCreate == 0) {
				error.Code = 1
				error.Message = "Пост не существует."
			}
		}
	}
	
	if(error.Message == "" && menu == "") {
		error.Code = 1
		error.Message = "Укажите JSON меню."
	}
	
	if(error.Message == "") {
		timestamp := time.Now().Unix()
        
        post.Lasttouch = timestamp
		post.Menu = menu
        
		err := post.Update()
		
		if(err != nil) {
			error.Code = 1
			error.Message = "Произошла ошибка."
		} else {
            if(post.Parent > 0) {
                models.RenderThreadInFile(post.Board, post.Parent)
            } else {
                models.RenderThreadInFile(post.Board, post.Num)
            }
        }
	}
	
	if(error.Message == "") {
		response.Result = 1
		response.RedirectUrl = "/moder/posts/single?board=" + boardId + "&num=" + strconv.Itoa(num) + "&msg=POST_MENU_SAVED"
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerPostsSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	var conditions []string
	var boardsConditions []string
	var permissions models.ModerPermissions
	
	_ = json.Unmarshal([]byte(currentModer.Permissions), &permissions)
	
	for _, permission := range permissions {
		if(permission.Board == "all") {
			boardsConditions = []string{"1=1"}
			break
		}
		
		var boardsCondition string
		
		if(len(permission.Thread) == 0 || permission.Thread == "0") {
			boardsCondition = "`board` = '" + permission.Board + "'"
		} else {
			boardsCondition = "(`board` = '" + permission.Board + "' AND `parent` = " + permission.Thread + ")"
		}
		
		boardsConditions = append(boardsConditions, boardsCondition);
	}
	
	conditions = append(conditions, "(" + strings.Join(boardsConditions[:], " OR ") + ")")
	
	var response structs.DatatablesResponse
	var posts models.ModerPosts
	
	ip := r.Header.Get("X-Forwarded-For")
	
	length, _ := strconv.Atoi(r.URL.Query().Get("length"))
	
	if(length <= 0) {
		length = 10
	}
	
	if(length > 100) {
		length = 100
	}
	
	start, _ := strconv.Atoi(r.URL.Query().Get("start"))
	
	if(start <= 0) {
		start = 0
	}
	
	searchQuery := strings.TrimSpace(r.URL.Query().Get("query"))
	
	if(searchQuery != "") {
		conditions = append(conditions, "`comment` LIKE \"%" + utils.DatabaseEscapeString(searchQuery) + "%\"")
	}
	
	if(currentModer.Level >= 1) {
		searchIp := strings.TrimSpace(r.URL.Query().Get("ip"))
		
		if(searchIp != "") {
			lastIpChar := searchIp[len(searchIp)-1:]
			
			if(currentModer.Level < 5 && !utils.IsIpHashed(searchIp)) {
				searchIp = "0.0.0.0"
			}
			
			searchIp = utils.UnhashIp(searchIp)
			
			if(lastIpChar == ".") {
				conditions = append(conditions, "`ip` LIKE \"" + utils.DatabaseEscapeString(searchIp) + "%\"")
			} else {
				conditions = append(conditions, "`ip` = \"" + utils.DatabaseEscapeString(searchIp) + "\"")
			}
		}
	}
	
	searchDeleted := strings.TrimSpace(r.URL.Query().Get("deleted"))
	
	if(searchDeleted != "1") {
		conditions = append(conditions, "`deleted` = 0 AND `archived` = 0")
	}
	
	database.MySQL.Model(&models.ModerPost{}).Where(strings.Join(conditions[:], " AND ")).Count(&response.RecordsTotal)
	
	response.RecordsFiltered = response.RecordsTotal
	
	database.MySQL.Where(strings.Join(conditions[:], " AND ")).Order("id desc").Limit(length).Offset(start).Find(&posts)
	
	posts.ProcessVirtualFields()
	
	for index, post := range posts {
		/*database.MySQL.Model(&models.ModerPostAdditionals{}).Where("board = ? AND deleted = 0 AND archived = 0 AND ip = ?", post.Board, post.Ip).Count(&post.ActivePostsOnBoard)
		database.MySQL.Model(&models.ModerPostAdditionals{}).Where("board = ? AND deleted > 0 AND ip = ?", post.Board, post.Ip).Count(&post.DeletedPostsOnBoard)
		database.MySQL.Model(&models.ModerPostAdditionals{}).Where("board = ? AND ip = ?", post.Board, post.Ip).Count(&post.TotalPostsOnBoard)*/
		
		/*if(currentModer.Level == 1 && strings.Contains(post.Ip, ".")) {
			ipOctets := strings.Split(post.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			post.Ip = strings.Join(ipOctets, ".")
		}*/
		
		if(currentModer.Level == 0) {
			post.Ip = ""
		} else if(currentModer.Level < 5) {
			post.Ip = utils.HashIp(post.Ip)
		}
		
		post.SetSecuredFileUrls(ip)
		
		post.ProcessSecrets()
		
		if(currentModer.Level < 5) {
			post.IpCountryCode = ""
			post.IpCountryName = ""
			post.IpCityName = ""
			post.ModerName = ""
			post.ModerLevel = 0
		}
		
		posts[index] = post
	}
	
	response.Data = posts
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerPostsAdditional(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	
	var filteredNums []string
	var permissions models.ModerPermissions

	_ = json.Unmarshal([]byte(currentModer.Permissions), &permissions)
	
	_ = strings.TrimSpace(r.FormValue("board"))
	numsPlain := strings.TrimSpace(r.FormValue("nums"))
	nums := strings.Split(numsPlain, ",")
	
	if(len(nums) > 2000) {
		nums = nums[0:2000]
	}
	
	var response structs.Response
	var posts models.ModerPostAdditionals
	
	filteredNums = append(filteredNums, "0")
	
	for _, num := range nums {
		numInt, err := strconv.Atoi(num)
		
		if(err == nil && numInt > 0) {
			filteredNums = append(filteredNums, strconv.Itoa(numInt))
		}
	}
	
	database.MySQL.Where("`num` IN (" + strings.Join(filteredNums, ",") + ")").Order("id asc").Find(&posts)
	
	posts.ProcessVirtualFields()
	
	for index, post := range posts {		
		/*if(currentModer.Level == 1 && strings.Contains(post.Ip, ".")) {
			ipOctets := strings.Split(post.Ip, ".")
			ipOctets[3] = "*"
			ipOctets[2] = "*"
			post.Ip = strings.Join(ipOctets, ".")
		}*/
		
		for _, permission := range permissions {
			if(permission.Board == "all") {
				post.ModerHasAccess = true
				break
			}
			
			if(len(permission.Thread) == 0 || permission.Thread == "0") {
				if(permission.Board == post.Board) {
					post.ModerHasAccess = true
					break
				}
			} else {
				if(permission.Board == post.Board && permission.Thread == strconv.Itoa(post.Parent)) {
					post.ModerHasAccess = true
					break
				}
			}
		}
		
		if(post.ModerHasAccess == true) {
			//database.MySQL.Model(&models.ModerPostAdditionals{}).Where("board = ? AND deleted = 0 AND archived = 0 AND ip = ?", post.Board, post.Ip).Count(&post.ActivePostsOnBoard)
			//database.MySQL.Model(&models.ModerPostAdditionals{}).Where("board = ? AND deleted > 0 AND ip = ?", post.Board, post.Ip).Count(&post.DeletedPostsOnBoard)
			//database.MySQL.Model(&models.ModerPostAdditionals{}).Where("board = ? AND ip = ?", post.Board, post.Ip).Count(&post.TotalPostsOnBoard)
			
			if(currentModer.Level == 0) {
				post.Ip = ""
			} else if(currentModer.Level < 5) {
				post.Ip = utils.HashIp(post.Ip)
			}
		} else {
			post.Ip = ""
			post.IpCountryCode = ""
			post.IpCountryName = ""
			post.IpCityName = ""
		}
		
		if(currentModer.Level < 5) {
			post.IpCountryCode = ""
			post.IpCountryName = ""
			post.IpCityName = ""
			post.ModerName = ""
			post.ModerLevel = 0
		}
		
		posts[index] = post
	}
	
	response.Result = posts
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ModerJS(w http.ResponseWriter, r *http.Request) {
	var moderPage structs.ModerPage
	
	currentModer := context.Get(r, "currentModer").(models.Moder)
	moderPage.CurrentModer = currentModer

	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	w.Header().Set("Content-Type", "application/javascript; charset=utf8")
	
	tpls := make(map[string]*template.Template)
	tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/board_moder.js"))
	tpls["main"].ExecuteTemplate(w, "base", moderPage)
}

func RenderModerThreadJson(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	num, _ := strconv.Atoi(vars["num"])
	
	ip := r.Header.Get("X-Forwarded-For")
	
	var boardJson models.BoardJson
	boardJson, _ = models.GetModerThreadJson(vars["board"], num, ip)
	
	if(len(boardJson.Threads) == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "application/json")
		
		boardJson.ModerView = 1
		
		jsonResponse, _ := json.Marshal(boardJson)
		
		w.Write(jsonResponse)
	}
}

func RenderModerThreadHtml(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	num, _ := strconv.Atoi(vars["num"])
	
	ip := r.Header.Get("X-Forwarded-For")
	
	var boardJson models.BoardJson
	boardJson, _ = models.GetModerThreadJson(vars["board"], num, ip)
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(len(boardJson.Threads) == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		boardJson.ModerView = 1
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/board.html"))
		
		tpl.Execute(w, boardJson)
	}
}