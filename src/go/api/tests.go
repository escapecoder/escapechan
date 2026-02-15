package api

import (
	"os"
	"fmt"
	_ "time"
	_ "context"
	"strconv"
	"net/http"
	"text/template"
	"encoding/json"
	"path/filepath"
	
	"github.com/gorilla/mux"
	
	"3ch/backend/models"
	_ "3ch/backend/structs"
	_ "3ch/backend/utils"
)

func RenderAllBoards(w http.ResponseWriter, r *http.Request) {
	models.RenderAllBoards()
	return
}

func TestRenderBoardJson(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	offset := 0
	
	var boardJson models.BoardJson
	boardJson, _ = models.GetBoardJson(vars["board"], offset, "boardPage")
	
	if(boardJson.Board.Name == "") {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "application/json")
		
		jsonResponse, _ := json.Marshal(boardJson)
		
		err := os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID, 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID+ "/index.json", jsonResponse, 0777)
		}
		
		w.Write(jsonResponse)
	}
}

func TestRenderBoardHtml(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	offset := 0
	
	var boardJson models.BoardJson
	boardJson, _ = models.GetBoardJson(vars["board"], offset, "boardPage")
	
	ex, err := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(boardJson.Board.Name == "") {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/board.html"))
		
		err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			f, err := os.Create(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/index.html")
			
			if(err != nil) {
				fmt.Println("create file: ", err)
			} else {
				err = tpl.Execute(f, boardJson)

				if(err != nil) {
					fmt.Println("execute: ", err)
				}
			}
		}
		
		tpl.Execute(w, boardJson)
	}
}

func TestRenderThreadJson(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	num, _ := strconv.Atoi(vars["num"])
	
	var boardJson models.BoardJson
	boardJson, _ = models.GetThreadJson(vars["board"], num)
	
	if(len(boardJson.Threads) == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "application/json")
		
		jsonResponse, _ := json.Marshal(boardJson)
		
		err := os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			_ = os.WriteFile(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res/" + vars["num"] + ".json", jsonResponse, 0777)
		}
		
		w.Write(jsonResponse)
	}
}

func TestRenderThreadHtml(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	num, _ := strconv.Atoi(vars["num"])
	
	var boardJson models.BoardJson
	boardJson, _ = models.GetThreadJson(vars["board"], num)
	
	ex, err := os.Executable()
	exPath := filepath.Dir(ex)
	
	if(len(boardJson.Threads) == 0) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/board.html"))
		
		err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res", 0777)
		
		if(err != nil) {
			fmt.Println("create dir: ", err)
		} else {
			f, err := os.Create(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/" + boardJson.Board.ID + "/res/" + vars["num"] + ".html")
			
			if(err != nil) {
				fmt.Println("create file: ", err)
			} else {
				err = tpl.Execute(f, boardJson)

				if(err != nil) {
					fmt.Println("execute: ", err)
				}
			}
		}
		
		tpl.Execute(w, boardJson)
	}
}