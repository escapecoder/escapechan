package main

import (
	"os"
	"fmt"
	"time"
	"strconv"
	"net/http"
	"io/ioutil"
	"math/rand"
	"path/filepath"
	"encoding/json"
	
	"github.com/gorilla/mux"
)

var numsMap map[string]int

func incrementHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
	
	var board string
	board = vars["board"]
	
	w.Header().Set("Content-Type", "text/plain")
    w.WriteHeader(http.StatusOK)
    
	_, ok := numsMap[board]
	
	if(!ok) {
		numsMap[board] = rand.Intn(4985632)
	}
	
	numsMap[board]++
	
	num := numsMap[board]
	
	w.Write([]byte(strconv.Itoa(num)))
}

func parseFromFile() {
	ex, err := os.Executable()
	
	if err != nil {
		panic(err)
	}
	
	exPath := filepath.Dir(ex)
	
	jsonFile, err := os.Open(exPath + "/data.json")
	
	jsonData, _ := ioutil.ReadAll(jsonFile)

	if(err == nil) {
		json.Unmarshal([]byte(jsonData), &numsMap)
	}
}

func saveToFile() {
	ex, err := os.Executable()
	
	if err != nil {
		panic(err)
	}
	
	exPath := filepath.Dir(ex)
	
	jsonData, err := json.Marshal(numsMap)
	
	if(err == nil) {
		_ = os.WriteFile(exPath + "/data.json", jsonData, 0777)
	}
}

func main() {
    numsMap = make(map[string]int)
	
	parseFromFile()
	
	ticker := time.NewTicker(2 * time.Second)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <- ticker.C:
				saveToFile()
			case <- quit:
				ticker.Stop()
				return
			}
		}
	}()
	
	r := mux.NewRouter()
    r.HandleFunc("/increment/{board}", incrementHandler)
    http.Handle("/", r)
	
	colorGreen := "\033[32m"
	colorReset := "\033[0m"
	
	httpPort := "8998" //os.Getenv("HTTP_PORT")
	
	fmt.Println(string(colorGreen) + "Listening on port " + httpPort, string(colorReset))
	
	http.ListenAndServe("127.0.0.1:" + httpPort, r)
}