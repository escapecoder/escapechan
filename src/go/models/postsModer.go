package models

import (
	"os"
	"time"
	_ "errors"
	_ "fmt"
	"regexp"
	"strings"
	"strconv"
	_ "math/rand"
	"encoding/json"
	"encoding/base64"
	_ "unicode/utf8"
	"path/filepath"
	"crypto/md5"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	"3ch/backend/utils"
	
	_ "github.com/frustra/bbcode"
	"github.com/goodsign/monday"
	_ "github.com/microcosm-cc/bluemonday"
)

type ModerPost struct {
	ID	int `gorm:"id" json:"-"`
	Board	string `json:"board"`
	Num	int `json:"num"`
	Number	int `gorm:"-" json:"number"`
	Parent	int `json:"parent"`
	Lasthit	int64 `json:"lasthit"`
	Lasttouch	int64 `json:"lasttouch"`
	Timestamp	int64 `json:"timestamp"`
	Date	string `gorm:"-" json:"date"`
	AutodeletionTimestamp	int64 `json:"autodeletion_timestamp"`
	AutodeletionDate	string `gorm:"-" json:"autodeletion_date"`
	Op	int `json:"op"`
	Sticky	int `json:"sticky"`
	Private	int `json:"private"`
	Closed	int `json:"closed"`
	Banned	int `json:"banned"`
	Archived	int `json:"archived"`
	Deleted	int `json:"deleted"`
	DeletedByThreadDeletion	int `json:"deleted_by_thread_deletion"`
	DeletedByEndlessExcess	int `json:"deleted_by_endless_excess"`
	DeletedByOwner	int `json:"deleted_by_owner"`
	DeletedByOp	int `json:"deleted_by_op"`
	DeletedByAutodeletion	int `json:"deleted_by_autodeletion"`
	Views	int `json:"views"`
	Likes	int `json:"likes"`
	Dislikes	int `json:"dislikes"`
	Reports	int `json:"reports"`
	Endless	int `json:"endless"`
	EnablePoll	int `json:"enable_poll"`
	EnableMultipleVotes	int `json:"enable_multiple_votes"`
	Answers	string `json:"-"`
	AnswersParsed	[]string `gorm:"-" json:"answers"`
	PollResultsExact	[]int64 `gorm:"-" json:"poll_results_exact"`
	PollResultsPercent	[]float64 `gorm:"-" json:"poll_results_percent"`
	PollResults	[]int64 `gorm:"-" json:"poll_results"`
	TotalPollVotes	[]int64 `gorm:"-" json:"total_poll_votes"`
	Edited	int64 `json:"edited"`
	EditedByMod	int64 `json:"edited_by_mod"`
	EditedByModId	int `json:"edited_by_mod_id"`
	Usercode	string `json:"usercode"`
	Email	string `json:"email"`
	Name	string `json:"name"`
	Client	string `json:"client"`
	PosterId	string `json:"-"`
	ModerId	int `json:"moder_id"`
	ModerName	string `gorm:"-" json:"moder_name"`
	ModerLevel	int `gorm:"-" json:"moder_level"`
	PasscodeId	int `json:"passcode_id"`
	Trip	string `json:"trip"`
	TripPlain	string `json:"-"`
	Subject	string `json:"subject"`
	ModNote	string `json:"-"`
	Title	string `gorm:"-" json:"-"`
	Tags	string `json:"tags"`
	Comment	string `json:"-"`
	BanReason	string `json:"ban_reason"`
	BanId	int `json:"ban_id"`
	BanModer	int `json:"ban_moder"`
	CommentParsed	string `gorm:"comment_parsed" json:"comment"`
	Files	string `gorm:"files" json:"-"`
	FilesParsed	Files `gorm:"-" json:"files"`
	FilesCount	int `gorm:"-" json:"-"`
	FilesCountForCatalog	int64 `gorm:"-" json:"files_count"`
	PostsCountForCatalog	int64 `gorm:"-" json:"posts_count"`
	ForceGeo	int `json:"-"`
	Menu	string `json:"-"`
	MenuParsed	[]string `gorm:"-" json:"menu"`
	Autohide	int `gorm:"-" json:"autohide"`
	Ip	string `json:"ip"`
	IpCountryCode	string `json:"ip_country_code"`
	IpCountryName	string `json:"ip_country_name"`
	IpCityName	string `json:"ip_city_name"`
	ActivePostsOnBoard	int64 `gorm:"-" json:"active_posts_on_board"`
	ActivePostsOnSite	int64 `gorm:"-" json:"active_posts_on_site"`
	DeletedPostsOnBoard	int64 `gorm:"-" json:"deleted_posts_on_board"`
	DeletedPostsOnSite	int64 `gorm:"-" json:"deleted_posts_on_site"`
	TotalPostsOnBoard	int64 `gorm:"-" json:"total_posts_on_board"`
	TotalPostsOnSite	int64 `gorm:"-" json:"total_posts_on_site"`
}

type ModerPosts []ModerPost

func (ModerPost) TableName() string {
	return "posts"
}

func (post *ModerPost) RemovePostFiles() {
	if(post.FilesCount > 0) {
		for _, fileParsed := range post.FilesParsed {
			_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + fileParsed.Path)
			_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + fileParsed.Thumbnail)
		}
	}
}

func (post *ModerPost) RestorePostFiles() {
	if(post.FilesCount > 0) {
		for _, fileParsed := range post.FilesParsed {
			mediaDirectory := os.Getenv("STORED_MEDIA_DIRECTORY") + "/" + fileParsed.MD5[0:2] + "/" + fileParsed.MD5[2:4]
			mediaFilename := fileParsed.MD5 + ".orig"
			mediaThumbFilename := fileParsed.MD5 + ".thumb"
			
			var fileSymlinkDirectory string
			var thumbSymlinkDirectory string
			
			if(post.Parent > 0) {
				fileSymlinkDirectory = "/" + post.Board + "/src/" + strconv.Itoa(post.Parent)
				thumbSymlinkDirectory = "/" + post.Board + "/thumb/" + strconv.Itoa(post.Parent)
			} else {
				fileSymlinkDirectory = "/" + post.Board + "/src/" + strconv.Itoa(post.Num)
				thumbSymlinkDirectory = "/" + post.Board + "/thumb/" + strconv.Itoa(post.Num)
			}
			
			_ = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + fileSymlinkDirectory, 0777)
			os.Symlink(mediaDirectory + "/" + mediaFilename, os.Getenv("GENERATED_CACHE_DIRECTORY") + fileParsed.Path)
			
			_ = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + thumbSymlinkDirectory, 0777)
			os.Symlink(mediaDirectory + "/" + mediaThumbFilename, os.Getenv("GENERATED_CACHE_DIRECTORY") + fileParsed.Thumbnail)
		}
	}
}

func (post *ModerPost) SetSecuredFileUrls(ip string) {
	if(post.FilesCount > 0 && post.Deleted > 0) {
		for i, fileParsed := range post.FilesParsed {
			timestamp := time.Now().Unix()
			ttl := 60 * 60
			
			expires := int(timestamp) + ttl
			
			extension := filepath.Ext(fileParsed.Path)
			
			mimeType := "application/octet-stream"
			
			mimeTypes := map[string]string {
				".jpg": "image/jpeg",
				".jpeg": "image/jpeg",
				".png": "image/png",
				".gif": "image/gif",
				".webp": "image/webp",
				".mp4": "video/mp4",
				".webm": "video/webm",
			}
			
			value, ok := mimeTypes[extension]
			
			if(ok) {
				mimeType = value
			}
			
			mediaFilePath := "/media/" + fileParsed.MD5[0:2] + "/" + fileParsed.MD5[2:4] + "/" + fileParsed.MD5 + ".orig"
			
			phash := md5.Sum([]byte(strconv.Itoa(expires) + " " + mediaFilePath + " " + ip + " " + mimeType + " 5r6yv87r6uvmy4rd87e6gfe49"))
			
			pbase64 := base64.StdEncoding.EncodeToString(phash[:])
			pbase64 = strings.ReplaceAll(pbase64, "+", "-")
			pbase64 = strings.ReplaceAll(pbase64, "/", "_")
			pbase64 = strings.ReplaceAll(pbase64, "=", "")
			
			fileParsed.Path = mediaFilePath + "?t=" + pbase64 + "&e=" + strconv.Itoa(expires) + "&mime=" + mimeType
			
			mimeType = "image/jpeg"
			
			mediaThumbnailPath := "/media/" + fileParsed.MD5[0:2] + "/" + fileParsed.MD5[2:4] + "/" + fileParsed.MD5 + ".thumb"
			
			thash := md5.Sum([]byte(strconv.Itoa(expires) + " " + mediaThumbnailPath + " " + ip + " " + mimeType + " 5r6yv87r6uvmy4rd87e6gfe49"))
			
			tbase64 := base64.StdEncoding.EncodeToString(thash[:])
			tbase64 = strings.ReplaceAll(tbase64, "+", "-")
			tbase64 = strings.ReplaceAll(tbase64, "/", "_")
			tbase64 = strings.ReplaceAll(tbase64, "=", "")
			
			fileParsed.Thumbnail = mediaThumbnailPath + "?t=" + tbase64 + "&e=" + strconv.Itoa(expires) + "&mime=" + mimeType
			
			post.FilesParsed[i] = fileParsed
		}
	}
}

func (post *ModerPost) ProcessVirtualFields() {
	var filesParsed Files
	var posterId Id
	
	json.Unmarshal([]byte(post.Files), &filesParsed)
	
	post.FilesParsed = filesParsed
	post.FilesCount = len(post.FilesParsed)
	
	if(post.FilesCount > 0) {
		for i, fileParsed := range post.FilesParsed {
			fileParsed.DisplayName = utils.SanitizeHtml(fileParsed.DisplayName)
			fileParsed.FullName = utils.SanitizeHtml(fileParsed.FullName)
			
			post.FilesParsed[i] = fileParsed
		}
	}
	
	post.Date = monday.Format(time.Unix(post.Timestamp, 0), "Mon 02 Jan 2006 15:04:05", monday.Locale(os.Getenv("LOCALE")))
	
	if(post.AutodeletionTimestamp > 0) {
		post.AutodeletionDate = monday.Format(time.Unix(post.AutodeletionTimestamp, 0), "Mon 02 Jan 2006 15:04:05",  monday.Locale(os.Getenv("LOCALE")))
	}
	
	if(post.Email != "") {
		post.Email = "mailto:" + post.Email
	}
	
	if(post.ModNote != "") {
		post.CommentParsed = post.CommentParsed + "<br><br><i style='color:#9c27b0;'>(" + post.ModNote + ")</i>"
	}
	
	if(post.PosterId != "" && post.Email != "mailto:sage") {
		err := posterId.GetById(post.PosterId)
		
		if(err == nil) {
			post.Name = post.Name + "&nbsp;ID:&nbsp;<span id=\"id_tag_" + posterId.ID[:8] + "\" style=\"color:" + posterId.Color + ";\">" + strings.ReplaceAll(posterId.Name, " ", "&nbsp;") + "</span>&nbsp;"
		}
	}
	
	if(post.PosterId != "" && post.Email == "mailto:sage") {
		post.Name = "Heaven"
		post.Email = ""
	}
	
	post.Subject = utils.SanitizeHtml(post.Subject)
	post.Email = utils.SanitizeHtml(post.Email)
	
	var moder Moder
	
	if(post.ModerId > 0) {
		err := moder.GetById(post.ModerId)
		
		if(err == nil) {
			post.ModerName = moder.Login
			post.ModerLevel = moder.Level
		}
	}
}

func (posts ModerPosts) ProcessVirtualFields() {
	for i, post := range posts {
		post.ProcessVirtualFields()
		posts[i] = post
	}
}

func (post *ModerPost) Create() (error) {
	err := database.MySQL.Create(&post).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPost) Update() (error) {
	err := database.MySQL.Save(&post).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPost) Delete() (error) {
	err := database.MySQL.Delete(&post).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (post *ModerPost) GetById(id int) (error) {
	err := database.MySQL.First(&post, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPost) GetByNum(id int) (error) {
	err := database.MySQL.First(&post, "`num` = ?", id).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPost) GetByBoardNum(board string, num int) (error) {
	err := database.MySQL.First(&post, "`board` = ? AND `num` = ?", board, num).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *ModerPost) ProcessSecrets() {
	r := regexp.MustCompile(`\[secret\](.*?)\[/secret\]`)
	
	post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
			_ = r.FindStringSubmatch(m)[1]
			
			return "[приватный текст]"
		})
}