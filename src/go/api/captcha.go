package api

import (
	"os"
	_ "path/filepath"
	"time"
	"fmt"
	_ "reflect"
	"log"
	"net/http"
	"strconv"
	"strings"
	"encoding/json"
	
	"image"
	_ "image/jpeg"
	_ "image/png"
	_ "image/gif"
	_ "golang.org/x/image/webp"
	
	"github.com/gorilla/mux"

	"github.com/wenlng/go-captcha-assets/resources/images"
	"github.com/wenlng/go-captcha-assets/resources/tiles"
	"github.com/wenlng/go-captcha/v2/slide"
	
	"3ch/backend/captchacache"
	"3ch/backend/captchahelper"
	
	"3ch/backend/structs"
	"3ch/backend/models"
)

var slideBasicCapt slide.Captcha

func getImageFromFilePath(filePath string) (image.Image, error) {
    f, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer f.Close()
    image, _, err := image.Decode(f)
    return image, err
}

func init() {
	builder := slide.NewBuilder(
		//slide.WithGenGraphNumber(2),
		slide.WithEnableGraphVerticalRandom(true),
	)

	// background images
	///*
	imgs, err := images.GetImages()
	if err != nil {
		log.Fatalln(err)
	}
	//*/
	/*
	var imgs []image.Image
	
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)
	
	img, err := getImageFromFilePath(exPath + "/templates/captcha_images/pigcha1.jpg");
	
	//fmt.Println(reflect.TypeOf(imgs))
	
	if(err == nil) {
		imgs = append(imgs, img)
	} else {
		fmt.Println(err)
	}
	
	img2, err := getImageFromFilePath(exPath + "/templates/captcha_images/pigcha2.jpg");
	
	//fmt.Println(reflect.TypeOf(imgs))
	
	if(err == nil) {
		imgs = append(imgs, img2)
	} else {
		fmt.Println(err)
	}
	
	img3, err := getImageFromFilePath(exPath + "/templates/captcha_images/pigcha3.jpg");
	
	//fmt.Println(reflect.TypeOf(imgs))
	
	if(err == nil) {
		imgs = append(imgs, img3)
	} else {
		fmt.Println(err)
	}
	*/

	graphs, err := tiles.GetTiles()
	if err != nil {
		log.Fatalln(err)
	}

	var newGraphs = make([]*slide.GraphImage, 0, len(graphs))
	for i := 0; i < len(graphs); i++ {
		graph := graphs[i]
		newGraphs = append(newGraphs, &slide.GraphImage{
			OverlayImage: graph.OverlayImage,
			MaskImage:    graph.MaskImage,
			ShadowImage:  graph.ShadowImage,
		})
	}

	// set resources
	builder.SetResources(
		slide.WithGraphImages(newGraphs),
		slide.WithBackgrounds(imgs),
	)

	slideBasicCapt = builder.Make()
}

func GetSlideBasicCaptData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	captData, err := slideBasicCapt.Generate()
	if err != nil {
		log.Fatalln(err)
	}

	blockData := captData.GetData()
	if blockData == nil {
		bt, _ := json.Marshal(map[string]interface{}{
			"code":    1,
			"message": "gen captcha data failed",
		})
		_, _ = fmt.Fprintf(w, string(bt))
		return
	}

	var masterImageBase64, tileImageBase64 string
	masterImageBase64 = captData.GetMasterImage().ToBase64()
	if err != nil {
		bt, _ := json.Marshal(map[string]interface{}{
			"code":    1,
			"message": "base64 data failed",
		})
		_, _ = fmt.Fprintf(w, string(bt))
		return
	}

	tileImageBase64 = captData.GetTileImage().ToBase64()
	if err != nil {
		bt, _ := json.Marshal(map[string]interface{}{
			"code":    1,
			"message": "base64 data failed",
		})
		_, _ = fmt.Fprintf(w, string(bt))
		return
	}

	dotsByte, _ := json.Marshal(blockData)
	key := captchahelper.StringToMD5(string(dotsByte))
	captchacache.WriteCache(key, dotsByte)

	bt, _ := json.Marshal(map[string]interface{}{
		"code":         0,
		"captcha_key":  key,
		"image_base64": masterImageBase64,
		"tile_base64":  tileImageBase64,
		"tile_width":   blockData.Width,
		"tile_height":  blockData.Height,
		"tile_x":       blockData.TileX,
		"tile_y":       blockData.TileY,
	})
	
	w.Write(bt)
}

func CheckSlideData(w http.ResponseWriter, r *http.Request) {
	code := 1
	_ = r.ParseForm()
	point := r.Form.Get("point")
	key := r.Form.Get("key")
	if point == "" || key == "" {
		bt, _ := json.Marshal(map[string]interface{}{
			"code":    code,
			"message": "point or key param is empty",
		})
		_, _ = fmt.Fprintf(w, string(bt))
		return
	}

	cacheDataByte := captchacache.ReadCache(key)
	if len(cacheDataByte) == 0 {
		bt, _ := json.Marshal(map[string]interface{}{
			"code":    code,
			"message": "illegal key",
		})
		_, _ = fmt.Fprintf(w, string(bt))
		return
	}
	src := strings.Split(point, ",")
	
	captchacache.ClearCache(key)

	var dct *slide.Block
	if err := json.Unmarshal(cacheDataByte, &dct); err != nil {
		bt, _ := json.Marshal(map[string]interface{}{
			"code":    code,
			"message": "illegal key",
		})
		_, _ = fmt.Fprintf(w, string(bt))
		return
	}

	chkRet := false
	if 2 == len(src) {
		sx, _ := strconv.ParseFloat(fmt.Sprintf("%v", src[0]), 64)
		sy, _ := strconv.ParseFloat(fmt.Sprintf("%v", src[1]), 64)
		chkRet = slide.CheckPoint(int64(sx), int64(sy), int64(dct.X), int64(dct.Y), 4)
	}

	if chkRet {
		code = 0
		
		captchacache.WriteCache(key + "-posting", cacheDataByte)
	}

	bt, _ := json.Marshal(map[string]interface{}{
		"code": code,
	})
	
	w.Write(bt)
}

func CheckSlideForPosting(key string, point string) bool {
	cacheDataByte := captchacache.ReadCache(key + "-posting")
	
	if len(cacheDataByte) == 0 {
		return false
	}
	
	captchacache.ClearCache(key + "-posting")
	
	src := strings.Split(point, ",")

	var dct *slide.Block
	
	if err := json.Unmarshal(cacheDataByte, &dct); err != nil {
		return false
	}

	chkRet := false
	
	if 2 == len(src) {
		sx, _ := strconv.ParseFloat(fmt.Sprintf("%v", src[0]), 64)
		sy, _ := strconv.ParseFloat(fmt.Sprintf("%v", src[1]), 64)
		chkRet = slide.CheckPoint(int64(sx), int64(sy), int64(dct.X), int64(dct.Y), 4)
	}
	
	if(!chkRet) {
		return false
	}
	
	return true
}

func GetCaptchaId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var response structs.CaptchaResponse
	var passcode models.Passcode
	var currentModer models.Moder

	timestamp := time.Now().Unix()
	passcodeCookie, err := r.Cookie("passcode_auth")
	
	isPasscodeActive := false
	
	if(err == nil) {
		err := passcode.GetBySession(passcodeCookie.Value)
		
		if(err == nil && passcode.Expires >= timestamp && passcode.Banned == 0) {
			isPasscodeActive = true
		}
	}
	
	isModer := false
	
	moderCookie, err := r.Cookie("moder")
	
	if(err == nil) {
		err := currentModer.GetBySession(moderCookie.Value)
		
		if(err == nil && currentModer.Enabled > 0) {
			isModer = true
		}
	}
	
	if(isPasscodeActive || isModer) {
		response.Result = 2
	} else {
		response.Result = 1
		response.Id = ""
		response.Key = ""
		response.Img = ""
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func GetDashchanCaptchaSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var passcode models.Passcode

	timestamp := time.Now().Unix()
	passcodeCookie, err := r.Cookie("passcode_auth")
	
	isPasscodeActive := false
	
	if(err == nil) {
		err := passcode.GetBySession(passcodeCookie.Value)
		
		if(err == nil && passcode.Expires >= timestamp && passcode.Banned == 0) {
			isPasscodeActive = true
		}
	}
	
	enabled := 1
	
	if(isPasscodeActive) {
		enabled = 0;
	}
	
	jsonResponse, _ := json.Marshal(map[string]interface{}{
		"enabled":    enabled,
		"result":    1,
		"types": []map[string]interface{}{{
			"expires": 300,
			"id": "recaptcha",
		}},
	})
	
	w.Write(jsonResponse)
}

func GetDashchanCaptchaId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var passcode models.Passcode
	
	vars := mux.Vars(r)
	captchaType, _ := vars["type"]

	timestamp := time.Now().Unix()
	passcodeCookie, err := r.Cookie("passcode_auth")
	
	isPasscodeActive := false
	
	if(err == nil) {
		err := passcode.GetBySession(passcodeCookie.Value)
		
		if(err == nil && passcode.Expires >= timestamp && passcode.Banned == 0) {
			isPasscodeActive = true
		}
	}
	
	result := 1
	
	if(isPasscodeActive) {
		result = 2;
	}
	
	id := ""
	
	if(captchaType == "recaptcha") {
		id = os.Getenv("RECAPTCHA_KEY")
	}
	
	jsonResponse, _ := json.Marshal(map[string]interface{}{
		"result":    result,
		"type":    captchaType,
		"id":    id,
	})
	
	w.Write(jsonResponse)
}