package api

import (
	"io"
	"os"
	"fmt"
	"time"
	"bytes"
	"context"
	"slices"
	"regexp"
	"strconv"
	"strings"
	"net/http"
	"crypto/md5"
	"text/template"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"path/filepath"
	"math/rand/v2"
	"unicode/utf8"
	"image"
	"image/jpeg"
	_ "image/png"
	_ "image/gif"
	_ "golang.org/x/image/webp"
	
	"github.com/nfnt/resize"
	"github.com/u2takey/ffmpeg-go"
	"gopkg.in/vansante/go-ffprobe.v2"
	"github.com/davidscholberg/go-durationfmt"
	"github.com/goodsign/monday"
	"github.com/gorilla/mux"
	"github.com/scottleedavis/go-exif-remove"
	"github.com/thanhpk/randstr"
	"github.com/makiuchi-d/gozxing"
	"github.com/makiuchi-d/gozxing/qrcode"
	
	"3ch/backend/i18n"
	"3ch/backend/database"
	"3ch/backend/models"
	"3ch/backend/structs"
	"3ch/backend/utils"
	"3ch/backend/geo"
)

func BotSettings(w http.ResponseWriter, r *http.Request) {
	var botSettingsPage structs.BotSettingsPage
	var success int
	
	var passcode models.Passcode
	isPasscodeActive := false
	
	timestamp := time.Now().Unix()
	passcodeCookie, err := r.Cookie("passcode_auth")
	
	if(err == nil) {
		err := passcode.GetBySession(passcodeCookie.Value)
		
		if(err == nil && passcode.Expires >= timestamp && passcode.Banned == 0) {
			isPasscodeActive = true
		}
	}
	
	if(!isPasscodeActive) {
		botSettingsPage.PasscodeRequired = 1
	} else {
		method := r.Method
		
		if(method == "POST") {
			timestamp := time.Now().Unix()
			code := strings.TrimSpace(r.FormValue("passcode"))
			
			var passcode models.Passcode
			var sessions []string
			
			err := passcode.GetByCode(code);
			
			if(err != nil) {
				botSettingsPage.PasscodeRequired = 1
				botSettingsPage.ErrorText = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_passcode_not_exists")
			} else if(passcode.Expires < timestamp) {
				botSettingsPage.PasscodeRequired = 1
				botSettingsPage.ErrorText = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_passcode_expired")
			} else if(passcode.Banned > 0) {
				botSettingsPage.PasscodeRequired = 1
				botSettingsPage.ErrorText = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_passcode_banned")
			} else {
				 _ = json.Unmarshal([]byte(passcode.Sessions), &sessions)
				 
				session := randstr.Hex(16)
				sessions = append(sessions, session)
				
				if(len(sessions) > 3) {
					sessions = sessions[1:]
				}
				
				updatedSessionsJson, _ := json.Marshal(sessions)
				
				passcode.Sessions = string(updatedSessionsJson)
				passcode.Update()
				
				passcodeCookie := &http.Cookie{Name: "passcode_auth", Value: session, Path: "/", HttpOnly: false}
				http.SetCookie(w, passcodeCookie)
				
				success = 1
			}
		}
	}
	
	if(success == 1) {
		http.Redirect(w, r, "/", http.StatusSeeOther)
	} else {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		w.Header().Set("Content-Type", "text/html")
		
		tpls := make(map[string]*template.Template)
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/botsettings.html"))
		tpls["main"].ExecuteTemplate(w, "base", botSettingsPage)
	}
}

func PasscodeLogin(w http.ResponseWriter, r *http.Request) {
	var passcodePage structs.PasscodePage
	var success int
	
	method := r.Method
	
	if(method == "POST") {
		timestamp := time.Now().Unix()
		code := strings.TrimSpace(r.FormValue("passcode"))
		
		var passcode models.Passcode
		var sessions []string
		
		err := passcode.GetByCode(code);
		
		if(err != nil) {
			passcodePage.AuthFailed = 1
			passcodePage.ErrorText = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_passcode_not_exists")
		} else if(passcode.Expires < timestamp) {
			passcodePage.AuthFailed = 1
			passcodePage.ErrorText = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_passcode_expired")
		} else if(passcode.Banned > 0) {
			passcodePage.AuthFailed = 1
			passcodePage.ErrorText = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_passcode_banned")
		} else {
			 _ = json.Unmarshal([]byte(passcode.Sessions), &sessions)
			 
			session := randstr.Hex(16)
			sessions = append(sessions, session)
			
			if(len(sessions) > 100) {
				sessions = sessions[1:]
			}
			
			updatedSessionsJson, _ := json.Marshal(sessions)
			
			passcode.Sessions = string(updatedSessionsJson)
			passcode.Update()
			
			passcodeCookie := &http.Cookie{Name: "passcode_auth", Value: session, Path: "/", HttpOnly: false}
			http.SetCookie(w, passcodeCookie)
			
			success = 1
		}
	}
	
	if(success == 1) {
		http.Redirect(w, r, "/", http.StatusSeeOther)
	} else {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		w.Header().Set("Content-Type", "text/html")
		
		tpls := make(map[string]*template.Template)
		tpls["main"] = template.Must(template.ParseFiles(exPath + "/templates/passlogin.html"))
		tpls["main"].ExecuteTemplate(w, "base", passcodePage)
	}
}

func FallbackThreadUrl(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	
	_ = vars["board"]
	num, _ := strconv.Atoi(vars["num"])
	format := vars["format"]
	
	var post models.Post
	err := post.GetByNum(num)
	
	if(err != nil || post.Deleted > 0 || (format != "html" && format != "json")) {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	} else {
		newUrl := "/" + post.Board + "/res/" + vars["num"] + "." + format
		
		http.Redirect(w, r, newUrl, http.StatusSeeOther)
		return
	}
}

func PostsFeed(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.MobileResponse
	
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	
	if(limit < 10) {
		limit = 10
	}
	
	if(limit > 100) {
		limit = 100
	}
	
	if(error.Message == "") {
		var posts models.Posts
		
		database.MySQL.Model(&models.Post{}).Where("deleted = 0").Order("id desc").Limit(limit).Find(&posts)
		
		posts.ProcessVirtualFields()
	
		for index, post := range posts {
			post.RestorePostFiles()
			
			var board models.Board
			_ = board.GetById(post.Board)
			
			if(post.ForceGeo == 0) {
				if(board.EnableFlags == 0) {
					post.Icon = ""
				}
			}
			
			posts[index] = post
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

func ReactPost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var board models.Board
	var post models.Post
	var reaction models.Reaction
	var newReaction models.Reaction
	
	boardId := strings.TrimSpace(r.URL.Query().Get("board"))
	num, _ := strconv.Atoi(r.URL.Query().Get("num"))
	icon := strings.TrimSpace(r.URL.Query().Get("icon"))
		
	ip := r.Header.Get("X-Forwarded-For")
	cfCountryCode := r.Header.Get("CF-IPCountry")
	
	alreadyHasReaction := false
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		} else if(board.EnableReactions == 0) {
			error.Code = -4
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_undefined_error")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		}
	}
	
	if(error.Message == "") {
		err := reaction.GetByBoardNumIp(boardId, num, ip)
		
		if(err == nil) {
			alreadyHasReaction = true
		}
	}
	
	if(error.Message == "") {
		var recentCount int64
		timestamp := time.Now().Unix()
		
		interval := int64(60*60)
		
		database.MySQL.Model(&models.Reaction{}).Where("timestamp > ? AND ip = ? AND icon = ?", timestamp - interval, ip, icon).Count(&recentCount)
		
		if(recentCount >= 50) {
			error.Code = -8
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_too_many_same_reactions")
		}
	}
	
	if(error.Message == "" && cfCountryCode == "T1") {
		error.Code = -4
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_tor_voting_denied")
	}
	
	if(error.Message == "" && !slices.Contains(board.ReactionsParsed, icon)) {
		error.Code = -4
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_invalid_vote")
	}
	
	if(error.Message == "") {
		var ipPostsCount int64
		timestamp := time.Now().Unix()
		
		interval := int64(60*60)
		
		database.MySQL.Model(&models.Posts{}).Where("timestamp > " + strconv.Itoa(int(timestamp - interval)) + " AND ip = '" + ip + "' AND deleted = 0").Count(&ipPostsCount)
		
		if(ipPostsCount == 0) {
			error.Code = -50
			error.Message = "Голосование доступно только для постеров последнего часа."
		}
	}
	
	if(error.Message == "") {
		timestamp := time.Now().Unix()
		
		if(alreadyHasReaction) {
			if(reaction.Icon == icon) {
                reaction.Delete()
            } else {
                reaction.Icon = icon
                reaction.Update()
            }
		} else {
			newReaction.Board = board.ID
			newReaction.Num = post.Num
			newReaction.Icon = icon
			newReaction.Timestamp = timestamp
			newReaction.Ip = ip
			
			_ = newReaction.Create()
			
		}
		
		database.MySQL.Exec("UPDATE posts SET lasttouch = ? WHERE id = ?", timestamp, post.ID)
		
		if(post.Parent > 0) {
			models.RenderThreadInFile(post.Board, post.Parent)
		} else {
			models.RenderThreadInFile(post.Board, post.Num)
		}
		
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func LikePost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var board models.Board
	var post models.Post
	var like models.Like
	var newLike models.Like
	
	boardId := strings.TrimSpace(r.URL.Query().Get("board"))
	num, _ := strconv.Atoi(r.URL.Query().Get("num"))
	vote := 1
	
	if(strings.HasSuffix(r.URL.Path, "/dislike")) {
		vote = -1
	}
		
	ip := r.Header.Get("X-Forwarded-For")
	cfCountryCode := r.Header.Get("CF-IPCountry")
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		} else if(board.EnableLikes == 0) {
			error.Code = -4
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_undefined_error")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		}
	}
	
	if(error.Message == "") {
		err := like.GetByBoardNumIp(boardId, num, ip)
		
		if(err == nil) {
			error.Code = -4
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_undefined_error")
		}
	}
	
	if(error.Message == "" && cfCountryCode == "T1") {
		error.Code = -4
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_tor_voting_denied")
	}
	
	if(error.Message == "") {
		var ipPostsCount int64
		
		database.MySQL.Model(&models.Posts{}).Where("ip = '" + ip + "' AND deleted = 0").Count(&ipPostsCount)
		
		if(ipPostsCount == 0) {
			error.Code = -50
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_voting_only_for_posters")
		}
	}
	
	if(error.Message == "") {
		timestamp := time.Now().Unix()
		
		newLike.Board = board.ID
		newLike.Num = post.Num
		newLike.Vote = vote
		newLike.Timestamp = timestamp
		newLike.Ip = ip
		
		_ = newLike.Create()
		
		if(vote > 0) {
			database.MySQL.Exec("UPDATE posts SET likes = likes + 1, lasttouch = ? WHERE id = ?", timestamp, post.ID)
		} else {
			database.MySQL.Exec("UPDATE posts SET dislikes = dislikes, lasttouch = ? + 1 WHERE id = ?", timestamp, post.ID)
		}
		
		if(post.Parent > 0) {
			models.RenderThreadInFile(post.Board, post.Parent)
		} else {
			models.RenderThreadInFile(post.Board, post.Num)
		}
		
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func VoteInPoll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var board models.Board
	var post models.Post
	var parentPost models.Post
	var pollVote models.PollVote
	var newPollVote models.PollVote
	
	boardId := strings.TrimSpace(r.URL.Query().Get("board"))
	num, _ := strconv.Atoi(r.URL.Query().Get("num"))
	vote, _ := strconv.Atoi(r.URL.Query().Get("vote"))
		
	ip := r.Header.Get("X-Forwarded-For")
	cfCountryCode := r.Header.Get("CF-IPCountry")
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		} else if(post.Deleted > 0) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		} else if(post.Closed > 0) {
			error.Code = -32
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_thread_closed")
		} else if(post.EnablePoll == 0) {
			error.Code = -32
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_no_poll_in_post")
		} else {
			if(post.Parent > 0) {
				_ = parentPost.GetByBoardNum(board.ID, post.Parent)
			}
			
			if(parentPost.Closed > 0) {
				error.Code = -32
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_thread_closed")
			} else if(parentPost.Deleted > 0) {
				error.Code = -31
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_thread_not_exists")
			} else {
				var answers []string
				
				json.Unmarshal([]byte(post.Answers), &answers)
				
				if(vote < 0 || vote >= len(answers)) {
					error.Code = -33
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_choose_valid_answer")
				}
			}
		}
	}
	
	if(error.Message == "" && cfCountryCode == "T1") {
		error.Code = -4
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_tor_voting_denied")
	}
	
	if(error.Message == "") {
		var ipPostsCount int64
		
		database.MySQL.Model(&models.Posts{}).Where("ip = '" + ip + "' AND deleted = 0").Count(&ipPostsCount)
		
		if(ipPostsCount == 0) {
			error.Code = -50
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_voting_only_for_posters")
		}
	}
	
	if(error.Message == "") {
		if(post.EnableMultipleVotes == 1) {
			err := pollVote.GetByBoardNumIpVote(boardId, num, ip, vote)
			
			if(err == nil) {
				error.Code = -4
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_already_voted_for_answer")
			}
		} else {
			err := pollVote.GetByBoardNumIp(boardId, num, ip)
			
			if(err == nil) {
				error.Code = -4
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_already_voted_in_poll")
			}
		}
	}
	
	if(error.Message == "") {
		timestamp := time.Now().Unix()
		
		newPollVote.Board = board.ID
		newPollVote.Num = post.Num
		newPollVote.Vote = vote
		newPollVote.Timestamp = timestamp
		newPollVote.Ip = ip
		
		_ = newPollVote.Create()
		
		database.MySQL.Exec("UPDATE posts SET lasttouch = ? WHERE id = ?", timestamp, post.ID)
		
		if(post.Parent > 0) {
			models.RenderThreadInFile(post.Board, post.Parent)
		} else {
			models.RenderThreadInFile(post.Board, post.Num)
		}
		
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func ReportPost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var board models.Board
	var post models.Post
	var report models.Report
	var newReport models.Report
	var ban models.Ban
	
	var boardId string
	var num int
	var comment string
		
	ip := r.Header.Get("X-Forwarded-For")
	
	err := r.ParseMultipartForm(40 << 20)
	
	if(err != nil) {
		error.Code = 666
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_request")
	} else {
		boardId = strings.TrimSpace(r.FormValue("board"))
		num, _ = strconv.Atoi(r.FormValue("post"))
		comment = strings.TrimSpace(r.FormValue("comment"))
	}
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			//error.Code = -2
			//error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByNum(num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		}
	}
	
	if(error.Message == "") {
		err := report.GetByBoardNumIp(post.Board, num, ip)
		
		if(err == nil) {
			error.Code = -4
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_undefined_error")
		}
	}
	
	if(error.Message == "") {
		timestamp := time.Now().Unix()
		
		err := ban.GetActiveByIpBoardType(ip, board.ID, "full")
		
		if(err != nil) {
			newReport.Board = post.Board
			newReport.Num = post.Num
			newReport.Parent = post.Parent
			newReport.Comment = comment
			newReport.Timestamp = timestamp
			newReport.Ip = ip
			
			_ = newReport.Create()
			
			database.MySQL.Exec("UPDATE posts SET reports = reports + 1 WHERE id = ?", post.ID)
		}
		
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func PostDelete(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var board models.Board
	var post models.Post
	var parentPost models.Post
	
	var boardId string
	var num int
	
	isThreadOp := false
		
	ip := r.Header.Get("X-Forwarded-For")
	timestamp := time.Now().Unix()
	
	err := r.ParseMultipartForm(40 << 20)
	
	if(err != nil) {
		error.Code = 666
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_request")
	} else {
		boardId = strings.TrimSpace(r.FormValue("board"))
		num, _ = strconv.Atoi(r.FormValue("post"))
	}
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		}
	}
	
	if(error.Message == "" && post.Deleted > 0) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
	}
	
	if(error.Message == "" && post.Parent == 0) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_cannot_delete_threads")
	}
	
	if(error.Message == "" && post.Parent > 0 && board.EnableOpMod == 1) {
		err := parentPost.GetByBoardNum(boardId, post.Parent)
		
		if(err == nil) {
			opHashCookieNameToCheck := "op_" + board.ID + "_" + strconv.Itoa(parentPost.Num)
			opHashCookieValueToCheck := board.ID + "-" + strconv.Itoa(parentPost.Num) + "-" + parentPost.Ip
			
			hash := md5.Sum([]byte(opHashCookieValueToCheck))
			opHashCookieValueToCheck = hex.EncodeToString(hash[:])
			
			retrievedOpCookie, err := r.Cookie(opHashCookieNameToCheck)
			
			if(err == nil) {
				if(retrievedOpCookie.Value == opHashCookieValueToCheck) {
					isThreadOp = true
				}
			}
			
			if(parentPost.Ip == ip) {
				isThreadOp = true
			}
		}
	}
	
	if(error.Message == "" && post.Ip != ip && !isThreadOp) {
		error.Code = 0
		
		if(board.EnableOpMod == 1) {
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_no_access_to_thread")
		} else {
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_no_thread_author")
		}
	}
	
	if(error.Message == "" && post.Timestamp <= timestamp - 60 * 10) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_post_deletion_expired")
	}
	
	if(error.Message == "") {
		if(isThreadOp && post.Ip != ip) {
			database.MySQL.Exec("UPDATE posts SET deleted = ?, deleted_by_op = 1 WHERE id = ?", timestamp, post.ID)
		} else {
			database.MySQL.Exec("UPDATE posts SET deleted = ?, deleted_by_owner = 1 WHERE id = ?", timestamp, post.ID)
		}
		
		if(post.Parent > 0) {
			post.RemovePostFiles()
			models.RenderThreadInFile(post.Board, post.Parent)
		} else {
			
		}
		
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func PostEdit(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var currentModer models.Moder
	var board models.Board
	var post models.Post
	var ban models.Ban
	
	var boardId string
	var num int
	var comment string
		
	ip := r.Header.Get("X-Forwarded-For")
	timestamp := time.Now().Unix()
	
	isModer := false
	
	moderCookie, err := r.Cookie("moder")
	
	if(err == nil) {
		err := currentModer.GetBySession(moderCookie.Value)
		
		if(err == nil && currentModer.Enabled > 0 && currentModer.Level >= 2) {
			isModer = true
		}
	}
	
	err = r.ParseMultipartForm(40 << 20)
	
	if(err != nil) {
		error.Code = 666
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_request")
	} else {
		boardId = strings.TrimSpace(r.FormValue("board"))
		num, _ = strconv.Atoi(r.FormValue("post"))
		comment = strings.TrimSpace(r.FormValue("comment"))
	}
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		}
	}
	
	if(error.Message == "") {
		err = ban.GetActiveByIpBoardType(ip, board.ID, "full")
		
		if(err == nil) {
			error.Code = 0
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_banned")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		}
	}
	
	if(error.Message == "" && post.Deleted > 0) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
	}
	
	if(error.Message == "" && post.Ip != ip && !isModer) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_no_thread_author")
	}
	
	if(error.Message == "" && post.Timestamp <= timestamp - 60 * 5 && !isModer) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_post_editing_expired")
	}
	
	if(error.Message == "" && strings.Contains(post.Comment, "/postcount")) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_postcount")
	}
	
	if(error.Message == "" && strings.Contains(post.CommentParsed, "<span class=\"replacement\"")) {
		error.Code = 0
		error.Message = "Посты с автозаменами редактировать нельзя."
	}
	
	if(error.Message == "") {
		r := regexp.MustCompile("##([0-9]+)d([0-9]+)##")
		
		matches := r.FindAllStringIndex(post.Comment, -1)
		
		if(len(matches) > 0) {
			error.Code = 0
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_dices")
		}
	}
	
	if(error.Message == "" && comment == "") {
		error.Code = -20
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_empty_comment")
	}
	
	if(error.Message == "") {
		if(utils.CalculateUppercasePercentage(comment) >= 100) {
			//comment = strings.ToLower(comment)
		}
		
		post.Comment = comment
		post.ProcessBBCode(board)
		
		if isSpam, _ := post.CheckSpamlist(board.Spamlist); isSpam == true {
			error.Code = 16
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_spamlist")
		} else if isSpam, _ := post.CheckSpamlist(models.GlobalConfig.Spamlist); isSpam == true {
			error.Code = 16
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_spamlist")
		}
	}
	
	if(error.Message == "") {
		post.Comment = comment
		post.ProcessBBCode(board)
		
		if(post.Ip == ip) {
			database.MySQL.Exec("UPDATE posts SET edited = ?, comment = ?, comment_parsed = ?, lasttouch = ? WHERE id = ?", timestamp, post.Comment, post.CommentParsed, timestamp, post.ID)
		} else {
			database.MySQL.Exec("UPDATE posts SET edited_by_mod = ?, edited_by_mod_id = ?, comment = ?, comment_parsed = ?, lasttouch = ? WHERE id = ?", timestamp, currentModer.ID, post.Comment, post.CommentParsed, timestamp, post.ID)
		}
		
		if(post.Parent > 0) {
			models.RenderThreadInFile(post.Board, post.Parent)
		} else {
			models.RenderThreadInFile(post.Board, post.Num)
		}
		
		post.ProcessSecrets()
		
		response.Message = post.CommentParsed
		
		if(post.Ip == ip) {
			response.Result = 1
		} else {
			response.Result = 2
		}
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func CheckPostEdit(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var currentModer models.Moder
	var board models.Board
	var post models.Post
	var ban models.Ban
	
	var boardId string
	var num int
		
	ip := r.Header.Get("X-Forwarded-For")
	timestamp := time.Now().Unix()
	
	isModer := false
	
	moderCookie, err := r.Cookie("moder")
	
	if(err == nil) {
		err := currentModer.GetBySession(moderCookie.Value)
		
		if(err == nil && currentModer.Enabled > 0 && currentModer.Level >= 2) {
			isModer = true
		}
	}
	
	err = r.ParseMultipartForm(40 << 20)
	
	if(err != nil) {
		error.Code = 666
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_request")
	} else {
		boardId = strings.TrimSpace(r.FormValue("board"))
		num, _ = strconv.Atoi(r.FormValue("post"))
	}
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		}
	}
	
	if(error.Message == "") {
		err = ban.GetActiveByIpBoardType(ip, board.ID, "full")
		
		if(err == nil) {
			error.Code = 0
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_banned")
		}
	}
	
	if(error.Message == "") {
		err := post.GetByBoardNum(boardId, num)
		
		if(err != nil) {
			error.Code = -31
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posts_not_exists")
		}
	}
	
	if(error.Message == "" && post.Ip != ip && !isModer) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_no_thread_author")
	}
	
	if(error.Message == "" && post.Timestamp <= timestamp - 60 * 5 && !isModer) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_post_editing_expired")
	}
	
	if(error.Message == "" && strings.Contains(post.Comment, "/postcount")) {
		error.Code = 0
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_postcount")
	}
	
	if(error.Message == "" && strings.Contains(post.CommentParsed, "<span class=\"replacement\"")) {
		error.Code = 0
		error.Message = "Посты с автозаменами редактировать нельзя."
	}
	
	if(error.Message == "") {
		r := regexp.MustCompile("##([0-9]+)d([0-9]+)##")
		
		matches := r.FindAllStringIndex(post.Comment, -1)
		
		if(len(matches) > 0) {
			error.Code = 0
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_dices")
		}
	}
	
	if(error.Message == "") {
		response.Message = utils.SanitizeHtml(post.Comment)
		response.Result = 1
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

func SearchPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	
	var error structs.Error
	var searchResults structs.SearchResults
	var board models.Board
	
	var boardId string
	var text string
	
	useJson := r.URL.Query().Get("json")
	
	err := r.ParseMultipartForm(40 << 20)
	
	if(err != nil) {
		error.Code = 666
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_request")
	} else {
		boardId = r.FormValue("board")
		text = r.FormValue("text")
	}
	
	if(error.Message == "" && boardId == "") {
		error.Code = -2
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_define_board")
	}
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		}
	}
	
	if(error.Message == "" && text == "") {
		error.Code = -3
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_search_query_empty")
	}
	
	if(error.Message == "" && utf8.RuneCountInString(text) < 3) {
		error.Code = -4
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_search_query_short")
	}
	
	searchResults.Error = error
	searchResults.Board = board
	searchResults.Posts.Search(boardId, text)
	
	if(error.Message != "" || useJson != "1") {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		tpl := template.Must(template.ParseFiles(exPath + "/templates/search.html"))
		
		for index, post := range searchResults.Posts {
			post.ProcessSecrets()
			
			searchResults.Posts[index] = post
		}
    
        if(board.EnableReactions == 1) {
            searchResults.Posts.ProcessReactions()
        }
		
		tpl.Execute(w, searchResults)
	} else {
		for index, post := range searchResults.Posts {
			post.RestorePostFiles()
			post.ProcessSecrets()
			
			if(post.ForceGeo == 0) {
				if(board.EnableFlags == 0) {
					post.Icon = ""
				}
			}
			
			searchResults.Posts[index] = post
		}
    
        if(board.EnableReactions == 1) {
            searchResults.Posts.ProcessReactions()
        }
		
		w.Header().Set("Content-Type", "application/json")
		jsonResponse, _ := json.Marshal(searchResults)
		w.Write(jsonResponse)
	}
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var error structs.Error
	var response structs.Response
	var newPost models.Post
	var parentPost models.Post
	var board models.Board
	var posterId models.Id
	var ban models.Ban
	
	var boardId string
	var num int
	var parent int
	var opMark int
	var forceGeo int
	var modMark int
	var admMark int
	var coderMark int
	var autodelTimer int
	var enablePoll int
	var enableMultipleVotes int
	var name string
	var tripPlain string
	var hat string
	var email string
	var subject string
	var comment string
	var captchaID string
	var captchaValue string
	var captchaType string
	var client string
	var answers []string
	
	var totalFilesCount int
	var totalFilesSize int64
	var files models.Files
	var processedFilesHashes []string
	
	var ipCountryCode string
	var ipCountryName string
	var ipCityName string
		
	ip := r.Header.Get("X-Forwarded-For")
	cfCountryCode := r.Header.Get("CF-IPCountry")
	
	ipInfo, err := geo.GetIpInfo(ip)
	
	if(err != nil) {
		ipCountryName = i18n.GetTranslation(os.Getenv("LANGUAGE"), "undefined_geo")
		ipCityName = i18n.GetTranslation(os.Getenv("LANGUAGE"), "undefined_geo")
	} else {	
		if(os.Getenv("LANGUAGE") == "ru") {
			ipCountryName = ipInfo["country"].(map[string]interface{})["name_ru"].(string)
			ipCityName = ipInfo["city"].(map[string]interface{})["name_ru"].(string)
		} else {
			ipCountryName = ipInfo["country"].(map[string]interface{})["name_en"].(string)
			ipCityName = ipInfo["city"].(map[string]interface{})["name_en"].(string)
		}
	}
	
	countryCode, err := geo.GetCountry(ip)
	
	if(err != nil) {
		ipCountryCode = ""
	} else {
		ipCountryCode = strings.ToLower(countryCode)
	}
	
	err = r.ParseMultipartForm(40 << 20)
	
	if(err != nil) {
		error.Code = 666
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_request")
	} else {
		boardId = r.FormValue("board")
		parent, _ = strconv.Atoi(r.FormValue("thread"))
		forceGeo, _ = strconv.Atoi(r.FormValue("force_geo"))
		opMark, _ = strconv.Atoi(r.FormValue("op_mark"))
		coderMark, _ = strconv.Atoi(r.FormValue("coder_mark"))
		modMark, _ = strconv.Atoi(r.FormValue("mod_mark"))
		admMark, _ = strconv.Atoi(r.FormValue("adm_mark"))
		autodelTimer, _ = strconv.Atoi(r.FormValue("timer"))
		enablePoll, _ = strconv.Atoi(r.FormValue("enable_poll"))
		enableMultipleVotes, _ = strconv.Atoi(r.FormValue("enable_multiple_votes"))
		tripPlain = strings.TrimSpace(r.FormValue("trip"))
		name = strings.TrimSpace(r.FormValue("name"))
		hat = strings.TrimSpace(r.FormValue("hat"))
        
        /*if(!slices.Contains([]string{"red", "blue", "green", "rabbit", "deer", "cat", "poop", "unicorn"}, hat)) {
            hat = "red"
        }*/
        
        if(!slices.Contains([]string{"pikachu", "jackpot", "earflaps", "gibus", "fedora", "turban", "plunger", "silly", "poop2", "condom", "princess", "pig"}, hat)) {
            hat = ""
        }
        
		email = strings.TrimSpace(r.FormValue("email"))
		subject = strings.TrimSpace(r.FormValue("subject"))
		comment = strings.TrimSpace(r.FormValue("comment"))
		captchaID = strings.TrimSpace(r.FormValue("captcha_id"))
		captchaValue = strings.TrimSpace(r.FormValue("captcha_value"))
		captchaType = strings.TrimSpace(r.FormValue("captcha_type"))
		client = strings.TrimSpace(r.FormValue("client"))
		
		if(client == "dashchan" && captchaType == "recaptcha") {
			captchaValue = strings.TrimSpace(r.FormValue("g-recaptcha-response"))
		}
		
		//r.ParseForm()
		for k, v := range r.PostForm {
			for _, value := range v {
				if(k == "poll_answers[]") {
					value = strings.TrimSpace(value)
					
					if(value != "") {
						answers = append(answers, value)
					}
				}
			}
		}
		
		if(autodelTimer < 0) {
			autodelTimer = 0
		}
		
		if(autodelTimer > 60 * 60 * 24 * 7) {
			autodelTimer = 60 * 60 * 24 * 7
		}
	}
	
	var usercode string
	
	var passcode models.Passcode
	isPasscodeActive := false
	
	timestamp := time.Now().Unix()
	passcodeCookie, err := r.Cookie("passcode_auth")
	
	if(err == nil) {
		err := passcode.GetBySession(passcodeCookie.Value)
		
		if(err == nil && passcode.Expires >= timestamp && passcode.Banned == 0) {
			isPasscodeActive = true
		}
	}
	
	useModTag := false
	useAdminTag := false
	useCoderTag := false
	var currentModer models.Moder
	
	moderCookie, err := r.Cookie("moder")
	
	if(err == nil) {
		err := currentModer.GetBySession(moderCookie.Value)
		
		if(err == nil && currentModer.Enabled > 0) {
			isPasscodeActive = true
			
			if(modMark == 1) {
				useModTag = true
			}
			
			if(admMark == 1 && currentModer.Level >= 4) {
				useAdminTag = true
			}
			
			if(coderMark == 1 && currentModer.ID == 1) {
				useCoderTag = true
                //hat = "pink"
			}
		}
	}
	
	if(error.Message == "" && !isPasscodeActive && (captchaValue == "")) {
		error.Code = -5
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_confirm_you_not_robot")
	}
	
	if(error.Message == "" && !isPasscodeActive) {
		if(client == "dashchan" && captchaType == "recaptcha") {
			isCaptchaValid, err := utils.VerifyRecaptcha(captchaValue, ip)
			
			if(err != nil || !isCaptchaValid) {
				error.Code = -5
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_confirm_you_not_robot")
			}
		} else {
			isCaptchaValid := CheckSlideForPosting(captchaID, captchaValue)
			
			if(!isCaptchaValid) {
				error.Code = -5
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_confirm_you_not_robot")
			}
		}
	}
    
	if(error.Message == "" && boardId == "") {
		error.Code = -2
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_define_board")
	}
	
	if(error.Message == "") {
		err := board.GetById(boardId)
		
		if(err != nil) {
			error.Code = -2
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_not_exists")
		} else if(board.EnablePosting == 0) {
			error.Code = -41
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_board_closed")
		}
	}
	
	if(error.Message == "" && parent > 0) {
		err := parentPost.GetByBoardNum(board.ID, parent)
		
		if(err != nil) {
			error.Code = -3
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_thread_not_exists")
		} else if(parentPost.Parent > 0 || parentPost.Deleted != 0 || parentPost.Archived != 0) {
			error.Code = -3
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_thread_not_exists")
		} else if(parentPost.Closed != 0) {
			error.Code = -7
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_thread_closed")
		}
	}
	
	if(error.Message == "") {
		err := ban.GetActiveByIpBoardType(ip, board.ID, "full")
		
		if(err == nil) {
			banReasonText := i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posting_banned") + " " + strconv.Itoa(ban.ID) + "."
			
			if(ban.Reason != "") {
				banReasonText += " " + i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_ban_reason") + " " + ban.Reason
			}
			
			if(ban.IpSubnet[len(ban.IpSubnet)-1:] == "x") {
				banReasonText += " (subnet)"
			}
			
			if(ban.Board != "all") {
				banReasonText += " //!" + ban.Board
			}
			
			if(ban.End > 0) {
				banReasonText += " " + i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_ban_expires") + " " + monday.Format(time.Unix(ban.End, 0), "02/01/2006 Mon 15:04:05", monday.Locale(os.Getenv("LOCALE")))
			}
			
			banReasonText += "."
			
			error.Code = 0
			error.Message = banReasonText
		}
	}
	
	if(error.Message == "" && !isPasscodeActive) {
		if(cfCountryCode == "T1" && board.ID != "onion") {
			banReasonText := i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_tor_posting_denied")
			
			error.Code = 0
			error.Message = banReasonText
		}
	}
	
	if(error.Message == "") {
		var recentCount int64
		timestamp := time.Now().Unix()
		
		interval := int64(20)
		
		if(isPasscodeActive) {
			interval = 5
		}
		
		database.MySQL.Model(&models.Post{}).Where("timestamp > ? AND ip = ?", timestamp - interval, ip).Count(&recentCount)
		
		if(recentCount > 0) {
			error.Code = -8
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_fast_posting")
		}
	}
	
	if(error.Message == "" && parent == 0) {
		var recentCount int64
		timestamp := time.Now().Unix()
		
		interval := int64(60)
		
		database.MySQL.Model(&models.Post{}).Where("parent = 0 AND timestamp > ? AND deleted = 0", timestamp - interval).Count(&recentCount)
		
		if(recentCount > 0) {
			error.Code = -8
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_fast_threads_creation")
		}
	}
	
	if(error.Message == "") {
		for _, fileHeader := range r.MultipartForm.File["file[]"] {
			file, err := fileHeader.Open()
			
			if(err != nil) {
				fmt.Println(err)
				error.Code = 666
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
				break
			}
			
			defer file.Close()
			
			buff := make([]byte, 512)
			_, err = file.Read(buff)
			if(err != nil) {
				fmt.Println(err)
				error.Code = 666
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
				break
			}
			
			_, err = file.Seek(0, io.SeekStart)
			
			filetype := http.DetectContentType(buff)
			
			if(filetype == "application/octet-stream") {
				if(strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".mp4")) {
					filetype = "video/mp4"
				}
				
				if(strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".webm")) {
					filetype = "video/webm"
				}
                
				if(strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".mp3")) {
					filetype = "audio/mpeg"
				}
				
				if(strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".wav")) {
					filetype = "audio/wav"
				}
			}
			
			if(filetype != "image/jpeg" && filetype != "image/png" && filetype != "image/gif" && filetype != "image/webp" && filetype != "video/mp4" && filetype != "video/webm" && filetype != "audio/mpeg" && filetype != "audio/wav" && filetype != "audio/wave") {
				error.Code = -11
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
				break
			}
			
			if(filetype == "image/png" && isAPNG(file)) {
				error.Code = -11
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
				break
			}
			
			if(isRarjpeg(file)) {
				error.Code = -11
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
				break
			}
			
			filetypeChunks := strings.Split(filetype, "/")
			
			fileExtension := strings.Replace(filetypeChunks[1], "jpeg", "jpg", 1)
            
			fileExtension = strings.Replace(fileExtension, "wave", "wav", 1)
            
			fileExtension = strings.Replace(fileExtension, "mpeg", "mp3", 1)
			
			if(!slices.Contains(board.FileTypesParsed, fileExtension)) {
				error.Code = -11
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
				break
			}
			
			_, err = file.Seek(0, 0)
			
			hash := md5.New()
			
			_, err = io.Copy(hash, file);
			md5sum := hash.Sum(nil)
			
			_, err = file.Seek(0, 0)
			
			var fileToAppend models.File
			fileToAppend.Extension = fileExtension
			fileToAppend.Size = fileHeader.Size / 1024
			fileToAppend.FullName = fileHeader.Filename
			fileToAppend.DisplayName = fileHeader.Filename
			
			if(utf8.RuneCountInString(fileToAppend.DisplayName) > 24) {
				fileToAppend.DisplayName = string([]rune(fileToAppend.DisplayName)[:15]) + "[...]" + filepath.Ext(fileToAppend.DisplayName)
			}
			
			fileToAppend.MD5 = fmt.Sprintf("%x", md5sum)
			
			if(slices.Contains(processedFilesHashes, fileToAppend.MD5)) {
				error.Code = -11
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_same_files")
				break
			}
			
			processedFilesHashes = append(processedFilesHashes, fileToAppend.MD5);
			
			fileToAppend.Type = 1
			
			if(fileToAppend.Extension == "mp3" || fileToAppend.Extension == "wav") {
				ctx, cancelFn := context.WithTimeout(context.Background(), 5 * time.Second)
				defer cancelFn()
				
				data, err := ffprobe.ProbeReader(ctx, file)
				
				if(err != nil) {
					error.Code = -11
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
					break
				} else {
					var durationRaw float64
					
					durationRaw = data.Format.DurationSeconds
					
					duration := time.Duration(int(durationRaw) * int(time.Second))
					
					fileToAppend.DurationSecs = int(durationRaw)
					fileToAppend.Duration, _ = durationfmt.Format(duration, "%0h:%0m:%0s")
					fileToAppend.Type = 20
				}
			}
			
			if(fileToAppend.Extension == "mp4" || fileToAppend.Extension == "webm") {
				ctx, cancelFn := context.WithTimeout(context.Background(), 5 * time.Second)
				defer cancelFn()
				
				data, err := ffprobe.ProbeReader(ctx, file)
				
				if(err != nil) {
					error.Code = -11
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
					break
				} else {
					var durationRaw float64
					
					frameRateOperands := strings.Split(data.FirstVideoStream().RFrameRate, "/")
					frameRateOperand1, _ := strconv.Atoi(frameRateOperands[0])
					frameRateOperand2 := 1
					
					if(len(frameRateOperands) > 1) {
						frameRateOperand2, _ = strconv.Atoi(frameRateOperands[1])
					}
					
					frameRate := frameRateOperand1 / frameRateOperand2
					
					if(frameRateOperand1 > 61) {
						frameRate = 24
					}
					
					durationRaw = data.Format.DurationSeconds
					
					duration := time.Duration(int(durationRaw) * int(time.Second))
					
					fileToAppend.ApproximateFramesCount = frameRate * int(durationRaw)
					fileToAppend.DurationSecs = int(durationRaw)
					fileToAppend.Duration, _ = durationfmt.Format(duration, "%0h:%0m:%0s")
					fileToAppend.Width = data.FirstVideoStream().Width
					fileToAppend.Height = data.FirstVideoStream().Height
					fileToAppend.Type = 10
				}
			}
			
			if(fileToAppend.Extension == "jpg" || fileToAppend.Extension == "png" || fileToAppend.Extension == "gif" || fileToAppend.Extension == "webp") {
				im, _, err := image.DecodeConfig(file)
				
				if(err != nil) {
					error.Code = -11
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
					break
				}
				
				fileToAppend.Width = im.Width
				fileToAppend.Height = im.Height
			}
			
			files = append(files, fileToAppend)
			
			totalFilesSize = totalFilesSize + fileHeader.Size
			totalFilesCount = totalFilesCount + 1
		}
	}
	
	if(error.Message == "" && totalFilesCount > 0 && models.GlobalConfig.DisableFilesUploading == 1) {
			error.Code = -22
			error.Message = "Загрузка файлов временно недоступна."
	}
	
	if(error.Message == "" && board.RequireFilesForOp == 1 && models.GlobalConfig.DisableFilesUploading == 0 && parent == 0 && totalFilesCount == 0) {
			error.Code = -19
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_media_required")
	}
	
	if(error.Message == "" && totalFilesCount > 4) {
			error.Code = -13
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_media_limit")
	}
	
	if(error.Message == "" && totalFilesSize > int64(board.MaxFilesSize) * 1024) {
			error.Code = -12
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_filesize_limit")
	}
	
	if(error.Message == "" && board.EnableSubject == 1 && parent == 0 && subject == "") {
		error.Code = -20
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_subject")
	}
	
	if(error.Message == "" && comment == "" && totalFilesCount == 0) {
		error.Code = -20
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_comment")
	}
	
	if(error.Message == "" && enablePoll == 1 && len(answers) < 2) {
		error.Code = -20
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_poll_too_few_poll_answers")
	}
	
	if(error.Message == "" && enablePoll == 1 && len(answers) > 10) {
		error.Code = -20
		error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_poll_too_many_poll_answers")
	}
	
	if(error.Message == "") { 
		num = utils.GetNewNum(board.ID)
		
		if(num == 0) {
			error.Code = 666
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posting_failed")
		}
	}
	
	if(error.Message == "") {
		fileIndex := 0
		
		for _, fileHeader := range r.MultipartForm.File["file[]"] {
			file, _ := fileHeader.Open()
			defer file.Close()
			
			var appendedFile = files[fileIndex]
			
			mediaDirectory := os.Getenv("STORED_MEDIA_DIRECTORY") + "/" + appendedFile.MD5[0:2] + "/" + appendedFile.MD5[2:4]
			mediaFilename := appendedFile.MD5 + ".orig"
			mediaThumbFilename := appendedFile.MD5 + ".thumb"
			
			err = os.MkdirAll(mediaDirectory, 0777)
			
			f, err := os.Create(mediaDirectory + "/" + mediaFilename)
			
			if(err != nil) {
				error.Code = 666
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
				break
			}
			
			defer f.Close()
			
			_, err = io.Copy(f, file)
			
			if(err != nil) {
				error.Code = 666
				error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
				break
			}
			
			_, err = file.Seek(0, 0)
			
			var ti image.Config
			
			if(appendedFile.Extension == "mp3" || appendedFile.Extension == "wav") {
				ctx, cancelFn := context.WithTimeout(context.Background(), 5 * time.Second)
				defer cancelFn()
				
				data, err := ffprobe.ProbeURL(ctx, mediaDirectory + "/" + mediaFilename)
				
				if(err != nil) {
					error.Code = -11
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_unsupported_file")
					break
				} else {
					var durationRaw float64
					
					durationRaw = data.Format.DurationSeconds
					
					duration := time.Duration(int(durationRaw) * int(time.Second))
					
					appendedFile.DurationSecs = int(durationRaw)
					appendedFile.Duration, _ = durationfmt.Format(duration, "%0h:%0m:%0s")
				}
            }
            
			if(appendedFile.Extension == "mp4" || appendedFile.Extension == "webm") {
				var frameNumber = appendedFile.ApproximateFramesCount / 2
				
				fmt.Printf("%+v\n", appendedFile)
				
				buf := bytes.NewBuffer(nil)
				
				err := ffmpeg_go.Input(mediaDirectory + "/" + mediaFilename).Filter("select", ffmpeg_go.Args{fmt.Sprintf("gte(n,%d)", frameNumber)}).Output("pipe:", ffmpeg_go.KwArgs{"vframes": 1, "format": "image2", "vcodec": "mjpeg"}).WithOutput(buf, nil).Run()
				
				if(err != nil) {
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				img, _, err := image.Decode(buf)
				
				if(err != nil) {
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				thumbnail := resize.Thumbnail(220, 220, img, resize.Lanczos3)
				
				t, err := os.Create(mediaDirectory + "/" + mediaThumbFilename)
				
				if(err != nil) {
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				defer t.Close()
				
				jpeg.Encode(t, thumbnail, nil)
				
				_, err = t.Seek(0, io.SeekStart)
				
				ti, _, err = image.DecodeConfig(t)
				
				if(err != nil) {
					fmt.Println(err)
				}
			}
			
			if(appendedFile.Extension == "jpg" || appendedFile.Extension == "png" || appendedFile.Extension == "gif" || appendedFile.Extension == "webp") {
				var img image.Image
				isExifRemovalSuccess := false
				
				buf := bytes.NewBuffer(nil)
				
				if _, err := io.Copy(buf, file); err != nil {
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				bufBytes, err := exifremove.Remove(buf.Bytes())
				
				if(err == nil) {
					isExifRemovalSuccess = true
				}
				
				if(isExifRemovalSuccess && (appendedFile.Extension == "jpg" || appendedFile.Extension == "png")) {
					img, _, err = image.Decode(bytes.NewReader(bufBytes))
				} else {
					_, err = file.Seek(0, 0)
					
					img, _, err = image.Decode(file)
				}
				
				if(err != nil) {
					fmt.Println(err)
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				bmp, _ := gozxing.NewBinaryBitmapFromImage(img)
				qrReader := qrcode.NewQRCodeReader()
				_, err = qrReader.Decode(bmp, nil)
				
				if(err == nil) {
					fmt.Println(err)
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				thumbnail := resize.Thumbnail(220, 220, img, resize.Lanczos3)
				
				t, err := os.Create(mediaDirectory + "/" + mediaThumbFilename)
				
				if(err != nil) {
					error.Code = 666
					error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_internal_server_error")
					break
				}
				
				defer t.Close()
				
				jpeg.Encode(t, thumbnail, nil)
				
				_, err = t.Seek(0, io.SeekStart)
				
				ti, _, err = image.DecodeConfig(t)
				
				if(err != nil) {
					fmt.Println(err)
				}
			}
			
			var fileSymlinkDirectory string
			var thumbSymlinkDirectory string
			
			if(parent > 0) {
				fileSymlinkDirectory = "/" + board.ID + "/src/" + strconv.Itoa(parent)
				thumbSymlinkDirectory = "/" + board.ID + "/thumb/" + strconv.Itoa(parent)
			} else {
				fileSymlinkDirectory = "/" + board.ID + "/src/" + strconv.Itoa(num)
				thumbSymlinkDirectory = "/" + board.ID + "/thumb/" + strconv.Itoa(num)
			}
			
			timestamp := time.Now().Unix()
			randomNumber := rand.IntN(9999 - 1000) + 1000
			
			fileSymlinkPath := strconv.Itoa(int(timestamp)) + strconv.Itoa(randomNumber) +  "." + appendedFile.Extension
			thumbSymlinkPath := strconv.Itoa(int(timestamp)) + strconv.Itoa(randomNumber) + "s.jpg"
			
			err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + fileSymlinkDirectory, 0777)
			os.Symlink(mediaDirectory + "/" + mediaFilename, os.Getenv("GENERATED_CACHE_DIRECTORY") + fileSymlinkDirectory + "/" + fileSymlinkPath)
			
			err = os.MkdirAll(os.Getenv("GENERATED_CACHE_DIRECTORY") + thumbSymlinkDirectory, 0777)
            
            if(appendedFile.Extension == "mp3" || appendedFile.Extension == "wav") {
                os.Symlink(os.Getenv("GENERATED_CACHE_DIRECTORY") + "/static/img/audio.jpg", os.Getenv("GENERATED_CACHE_DIRECTORY") + thumbSymlinkDirectory + "/" + thumbSymlinkPath)
            } else {
                os.Symlink(mediaDirectory + "/" + mediaThumbFilename, os.Getenv("GENERATED_CACHE_DIRECTORY") + thumbSymlinkDirectory + "/" + thumbSymlinkPath)
            }
			
            if(appendedFile.Extension == "mp3" || appendedFile.Extension == "wav") {
                appendedFile.ThumbnailWidth = 140
                appendedFile.ThumbnailHeight = 140
            } else {
                appendedFile.ThumbnailWidth = ti.Width
                appendedFile.ThumbnailHeight = ti.Height
            }
			
			appendedFile.Name = fileSymlinkPath
			appendedFile.Path = fileSymlinkDirectory + "/" + fileSymlinkPath
			appendedFile.Thumbnail = thumbSymlinkDirectory + "/" + thumbSymlinkPath
			
			files[fileIndex] = appendedFile
			
			fileIndex++
		}
	}
	
	if(error.Message == "") {
		if(utils.CalculateUppercasePercentage(comment) >= 100) {
			//comment = strings.ToLower(comment)
		}
		
		newPost.Comment = comment
		newPost.ProcessBBCode(board)
		
		if isSpam, _ := newPost.CheckSpamlist(board.Spamlist); isSpam == true {
			error.Code = 16
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_spamlist")
		} else if isSpam, _ := newPost.CheckSpamlist(models.GlobalConfig.Spamlist); isSpam == true {
			error.Code = 16
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_spamlist")
		}
	}
	
	if(error.Message == "") {
		timestamp := time.Now().Unix()
		
		if(parent == 0 && !useModTag && !useAdminTag && !useCoderTag) {
			newPost.Op = opMark
		} else {
			opHashCookieNameToCheck := "op_" + board.ID + "_" + strconv.Itoa(parentPost.Num)
			opHashCookieValueToCheck := board.ID + "-" + strconv.Itoa(parentPost.Num) + "-" + parentPost.Ip
			
			hash := md5.Sum([]byte(opHashCookieValueToCheck))
			opHashCookieValueToCheck = hex.EncodeToString(hash[:])
			
			retrievedOpCookie, err := r.Cookie(opHashCookieNameToCheck)
			
			if(err == nil) {
				if(retrievedOpCookie.Value == opHashCookieValueToCheck && !useModTag && !useAdminTag && !useCoderTag) {
					newPost.Op = opMark
				}
			}
		}
		
		if(board.EnableIds == 1 && parent == 0 && !useModTag && !useAdminTag && !useCoderTag) {
			newPost.Op = 1
		}
		
		if(board.EnableIds == 1 && newPost.Op == 0 && parent > 0 && !useModTag && !useAdminTag && !useCoderTag) {
			if(ip == parentPost.Ip) {
				newPost.Op = 1
			} else {
				err := posterId.GetByBoardThreadIp(board.ID, parent, ip)
				
				if(err != nil) {
					_ = posterId.Generate(board, parent, ip)
				}
				
				newPost.Op = 0
			}
		}
		
		retrievedUsercodeCookie, err := r.Cookie("usercode_auth")
		
		if(err != nil) {
			usercode = randstr.Hex(32)
			
			hash := md5.Sum([]byte(usercode))
			usercode = hex.EncodeToString(hash[:])
		} else {
			usercode = retrievedUsercodeCookie.Value
		}
		
		newPost.Usercode = usercode
		
		newPost.Num = num
		newPost.Parent = parentPost.Num
		newPost.Board = board.ID
		
		if(useCoderTag) {
			newPost.Name = ""
			newPost.Trip = "!!%coder%!!"
			newPost.ModerId = currentModer.ID
		} else if(useAdminTag) {
			newPost.Name = ""
			newPost.Trip = "!!%adm%!!"
			newPost.ModerId = currentModer.ID
		} else if(useModTag) {
			newPost.Name = ""
			
			if(currentModer.Level > 0) {
				newPost.Trip = "!!%mod%!!"
			} else {
				newPost.Trip = "!!%junior%!!"
			}
			
			newPost.ModerId = currentModer.ID
		} else {
			if(board.EnableNames == 1 && name != "") {
				name = utils.SanitizeHtml(name)
				newPost.Name = name
			} else {
				newPost.Name = board.DefaultName
			}
			
			if(board.EnableTrips == 1 && tripPlain != "") {
				trip := utils.GetTrip(tripPlain)
				
				if(trip != "") {
					newPost.Trip = utils.SanitizeHtml(trip)
					newPost.TripPlain = tripPlain
				}
			}
			
			if(currentModer.ID > 0 && currentModer.Enabled == 1) {
				newPost.ModerId = currentModer.ID
			}
		}
		
		filesJson, _ := json.Marshal(files)
		
		if(board.EnableSubject == 1) {
			newPost.Subject = subject
			
			if(utf8.RuneCountInString(newPost.Subject) > 100) {
				newPost.Subject = string([]rune(newPost.Subject)[:100])
			}
		}
		
		if(strings.Contains(comment, "/postcount")) {
			var myTotalThreads int64
			var myTotalPosts int64
			
			database.MySQL.Model(&models.Post{}).Where("ip = ? AND parent = 0", ip).Count(&myTotalThreads)
			database.MySQL.Model(&models.Post{}).Where("ip = ?", ip).Count(&myTotalPosts)
			
			comment = comment + "\n\nТредов создано: " + strconv.Itoa(int(myTotalThreads)) + "\nПостов создано: " + strconv.Itoa(int(myTotalPosts))
		}
		
		newPost.Comment = comment
		newPost.Menu = "[]"
		newPost.Hat = hat
		newPost.Email = email
		newPost.PosterId = posterId.ID
		newPost.PasscodeId = passcode.ID
		newPost.Files = string(filesJson)
		newPost.Timestamp = timestamp
		newPost.Lasthit = timestamp
		
		if(client == "dashchan") {
			newPost.Client = client
		}
		
		if(autodelTimer > 0) {
			newPost.AutodeletionTimestamp = timestamp + int64(autodelTimer)
		}
		
		newPost.Ip = ip
		newPost.IpCountryCode = ipCountryCode
		newPost.IpCountryName = ipCountryName
		newPost.IpCityName = ipCityName
		
		if(board.EnableFlags == 0 && forceGeo == 1) {
			newPost.ForceGeo = 1
		}
		
		if(enablePoll == 1) {
			answersJson, _ := json.Marshal(answers)
		
			newPost.Answers = string(answersJson)
			newPost.EnablePoll = enablePoll
			newPost.EnableMultipleVotes = enableMultipleVotes
		} else {
			newPost.Answers = "[]"
		}
		
		newPost.ProcessBBCode(board)
		
		err = newPost.Create()
		
		if(err != nil) {
			error.Code = 666
			error.Message = i18n.GetTranslation(os.Getenv("LANGUAGE"), "error_posting_failed")
		}
	}
	
	if(error.Message == "") {
		response.Result = 1
		var totalPostsInThread int64
		
		if(parentPost.ID > 0) {
			database.MySQL.Model(&models.Post{}).Where("board = ? AND (num = ? OR parent = ?) AND deleted = 0", board.ID, parentPost.ID, parentPost.ID).Count(&totalPostsInThread)
			
			response.Num = num
		} else {
			opHashCookieName := "op_" + board.ID + "_" + strconv.Itoa(num)
			opHashCookieValue := board.ID + "-" + strconv.Itoa(num) + "-" + ip
			
			hash := md5.Sum([]byte(opHashCookieValue))
			opHashCookieValue = hex.EncodeToString(hash[:])
			
			opCookie := &http.Cookie{Name: opHashCookieName, Value: opHashCookieValue, Path: "/", HttpOnly: false}
			http.SetCookie(w, opCookie)
			
			response.Thread = num
		}
		
		usercodeCookie := &http.Cookie{Name: "usercode_auth", Value: usercode, Path: "/", HttpOnly: false}
		http.SetCookie(w, usercodeCookie)
		
		database.MySQL.Exec("UPDATE `boards` SET `last_num` = ? WHERE `id` = ?", num, board.ID)
		
		if(parentPost.ID > 0) {
			if(board.EnableSage == 0 || totalFilesCount > 0 || strings.ToLower(newPost.Email) != "mailto:sage") {
				if(int(totalPostsInThread) <= board.BumpLimit || parentPost.Endless > 0) {
					database.MySQL.Exec("UPDATE `posts` SET `lasthit` = ? WHERE `id` = ?", newPost.Timestamp, parentPost.ID)
				}
			}
		}
		
		var postsToDelete []models.Post
		
		if(parentPost.ID > 0 && parentPost.Endless > 0) {
			database.MySQL.Where("board = ? AND parent = ? AND deleted = 0", board.ID, parentPost.Num).Order("id desc").Limit(parentPost.Endless).Offset(parentPost.Endless).Find(&postsToDelete)
			
			for _, post := range postsToDelete {
				database.MySQL.Exec("UPDATE `posts` SET `deleted` = 1, `deleted_by_endless_excess` = 1 WHERE `id` = ?", post.ID)
			}
		}
		
		if(parentPost.ID > 0) {
			models.RenderThreadInFile(board.ID, parentPost.Num)
		} else {
			models.RenderThreadInFile(board.ID, newPost.Num)
		}
	} else {
		response.Result = 0
		response.Error = error
	}
	
	jsonResponse, _ := json.MarshalIndent(response, "", "    ")
	w.Write(jsonResponse)
}

// PNGSignature - сигнатура PNG файла
var PNGSignature = []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}

// isAPNG проверяет, является ли файл APNG
func isAPNG(file io.Reader) (bool) {
	// Проверяем сигнатуру PNG
	sig := make([]byte, 8)
	_, err := io.ReadFull(file, sig)
	if err != nil {
		return false
	}
	if !bytes.Equal(sig, PNGSignature) {
		return false
	}

	// Читаем чанки
	for {
		// Читаем длину чанка (4 байта)
		lengthBuf := make([]byte, 4)
		_, err := io.ReadFull(file, lengthBuf)
		if err == io.EOF {
			break
		}
		if err != nil {
			return false
		}
		length := binary.BigEndian.Uint32(lengthBuf)

		// Читаем тип чанка (4 байта)
		chunkType := make([]byte, 4)
		_, err = io.ReadFull(file, chunkType)
		if err != nil {
			return false
		}

		// Проверяем, является ли чанк acTL (индикатор APNG)
		if string(chunkType) == "acTL" {
			return true
		}

		// Пропускаем данные чанка и CRC (4 байта)
		_, err = io.CopyN(io.Discard, file, int64(length)+4)
		if err != nil {
			return false
		}
	}

	return false
}

// RAR_Signature - сигнатура RAR (7 байт)
var RAR_Signature0 = []byte{0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00}

var RAR_Signature1 = []byte{0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01}

// isRarjpeg проверяет, содержит ли файл сигнатуру RAR
func isRarjpeg(file io.Reader) (bool) {
	// Читаем весь файл в память
	data, err := io.ReadAll(file)
	if err != nil {
		return false
	}

	// Ищем сигнатуру RAR
	rarPos0 := bytes.Index(data, RAR_Signature0)
	rarPos1 := bytes.Index(data, RAR_Signature1)
	if (rarPos0 == -1 && rarPos1 == -1) {
		return false
	}

	return true
}