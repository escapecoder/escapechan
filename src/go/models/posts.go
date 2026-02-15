package models

import (
	"os"
	"time"
	_ "errors"
	"fmt"
	"sort"
	"regexp"
	"strings"
	"strconv"
	"slices"
	"math"
	"math/rand"
	"encoding/json"
	"unicode/utf8"
	"path/filepath"
	"encoding/base64"
	"crypto/md5"
	"crypto/sha256"
	
	_ "3ch/backend/config"
	"3ch/backend/database"
	"3ch/backend/utils"
	
	"github.com/frustra/bbcode"
	"github.com/goodsign/monday"
	"github.com/microcosm-cc/bluemonday"
    "github.com/AvraamMavridis/randomcolor"
	"github.com/thanhpk/randstr"
)

type Post struct {
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
	Views	int `json:"views"`
	Likes	int `json:"likes"`
	Dislikes	int `json:"dislikes"`
	Reactions	PostReactions `gorm:"-" json:"reactions"`
	ReactionsCount	int `gorm:"-" json:"reactions_count"`
	Reports	int `json:"-"`
	Endless	int `json:"endless"`
	EnablePoll	int `json:"enable_poll"`
	EnableMultipleVotes	int `json:"enable_multiple_votes"`
	Answers	string `json:"-"`
	AnswersParsed	[]string `gorm:"-" json:"answers"`
	PollResultsExact	[]int64 `gorm:"-" json:"poll_results_exact"`
	PollResultsPercent	[]float64 `gorm:"-" json:"poll_results_percent"`
	TotalPollVotes	int64 `gorm:"-" json:"total_poll_votes"`
	Edited	int64 `json:"edited"`
	EditedByMod	int64 `json:"edited_by_mod"`
	EditedByModId	int64 `json:"edited_by_mod_id"`
	Usercode	string `json:"-"`
	Email	string `json:"email"`
	Name	string `json:"name"`
	Client	string `json:"client"`
	Icon	string `gorm:"-" json:"icon"`
	PosterId	string `json:"-"`
	ModerId	int `json:"-"`
	PasscodeId	int `json:"-"`
	Trip	string `json:"trip"`
	TripPlain	string `json:"-"`
	Subject	string `json:"subject"`
	ModNote	string `json:"-"`
	Title	string `gorm:"-" json:"-"`
	Tags	string `json:"tags"`
	Comment	string `json:"-"`
	CommentParsed	string `gorm:"comment_parsed" json:"comment"`
	Files	string `gorm:"files" json:"-"`
	FilesParsed	Files `gorm:"-" json:"files"`
	FilesCount	int `gorm:"-" json:"-"`
	FilesCountForCatalog	int64 `gorm:"-" json:"files_count"`
	PostsCountForCatalog	int64 `gorm:"-" json:"posts_count"`
	ForceGeo	int `json:"-"`
	Menu	string `json:"-"`
	MenuParsed	PostMenuSections `gorm:"-" json:"menu"`
	Pixels	int `json:"pixels"`
	Autohide	int `gorm:"-" json:"autohide"`
	Hat	string `json:"hat"`
	Ip	string `json:"-"`
	IpCountryCode	string `json:"-"`
	IpCountryName	string `json:"-"`
	IpCityName	string `json:"-"`
}

type Posts []Post

func (Post) TableName() string {
	return "posts"
}

type PostReaction struct {
	Icon	string `json:"icon"`
	Count	int `json:"count"`
}

type PostReactions []PostReaction

type PostReactionFromGroupSelect struct {
	Num	int
	Icon	string
	Votes	int
}

type Replacement struct {
	Source	string `json:"source"`
	Result	string `json:"result"`
}

type Replacements []Replacement

type SpamlistWord struct {
	Value	string `json:"value"`
	Type	string `json:"type"`
}

type Spamlist []SpamlistWord

type PostMenuLink struct {
	Label	string `json:"label"`
	Url	string `json:"url"`
}

type PostMenuSection struct {
	Name	string `json:"sectionName"`
	Links	[]PostMenuLink `json:"links"`
}

type PostMenuSections []PostMenuSection

func (post *Post) RemovePostFiles() {
	if(post.FilesCount > 0) {
		for _, fileParsed := range post.FilesParsed {
			_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + fileParsed.Path)
			_ = os.Remove(os.Getenv("GENERATED_CACHE_DIRECTORY") + fileParsed.Thumbnail)
		}
	}
}

func (post *Post) HidePostFiles() {
	if(post.FilesCount > 0) {
		for i, fileParsed := range post.FilesParsed {
			fileParsed.Path = "/static/img/nomedia.jpg"
			fileParsed.Thumbnail = "/static/img/nomedia.jpg"
			fileParsed.Type = 1
			fileParsed.ThumbnailWidth = 220
			fileParsed.ThumbnailHeight = 220
			fileParsed.Width = 640
			fileParsed.Height = 640
			
			post.FilesParsed[i] = fileParsed
		}
	}
}

func (post *Post) RestorePostFiles() {
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

func (post *Post) SetSecuredFileUrls(ip string) {
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

func (post *Post) ProcessVirtualFields() {
	var ban Ban
	var board Board
	var posterId Id
    
	var menuParsed PostMenuSections
	json.Unmarshal([]byte(post.Menu), &menuParsed)
    
    post.MenuParsed = menuParsed
	
	var filesParsed Files
	json.Unmarshal([]byte(post.Files), &filesParsed)
	
	post.FilesParsed = filesParsed
	post.FilesCount = len(post.FilesParsed)
	
	err := ban.GetActiveByIpBoardType(post.Ip, post.Board, "autohide")
	
	if(err == nil) {
		post.Autohide = 1
	}
	
	if(post.FilesCount > 0) {
		for i, fileParsed := range post.FilesParsed {
			fileParsed.DisplayName = utils.SanitizeHtml(fileParsed.DisplayName)
			fileParsed.FullName = utils.SanitizeHtml(fileParsed.FullName)
			
			post.FilesParsed[i] = fileParsed
		}
	}
	
	if(post.EnablePoll == 1) {
		var answersParsed []string
		var pollResultsExact []int64
		var pollResultsPercent []float64
		
		json.Unmarshal([]byte(post.Answers), &answersParsed)
		post.AnswersParsed = answersParsed
		
		for i, answer := range post.AnswersParsed {
			var votesCount int64
			
			database.MySQL.Model(&PollVotes{}).Where("board = '" + post.Board + "' AND num = " + strconv.Itoa(post.Num) + " AND vote = " + strconv.Itoa(i)).Count(&votesCount)
			
			pollResultsExact = append(pollResultsExact, votesCount)
			
			post.TotalPollVotes = post.TotalPollVotes + votesCount
			
			post.AnswersParsed[i] = utils.SanitizeHtml(answer)
		}
		
		post.PollResultsExact = pollResultsExact
		
		for _, votesCount := range post.PollResultsExact {
			var percent float64
			
			if(post.TotalPollVotes > 0 && votesCount > 0) {
				percent = 100 * (float64(votesCount) / float64(post.TotalPollVotes))
			}
			
			pollResultsPercent = append(pollResultsPercent, math.Round(percent))
		}
		
		post.PollResultsPercent = pollResultsPercent
	}
	
	post.Date = monday.Format(time.Unix(post.Timestamp, 0), "Mon 02 Jan 2006 15:04:05",  monday.Locale(os.Getenv("LOCALE")))
	
	if(post.AutodeletionTimestamp > 0) {
		post.AutodeletionDate = monday.Format(time.Unix(post.AutodeletionTimestamp, 0), "Mon 02 Jan 2006 15:04:05",  monday.Locale(os.Getenv("LOCALE")))
	}
	
	if(post.IpCountryCode != "") {
		post.Icon = "<img hspace=\"3\" src=\"/static/img/flags/" + post.IpCountryCode + ".png\" border=\"0\" style=\"max-width:18px;max-height:12px;\">"
	}
	
	if(post.ModerId > 0 && post.ForceGeo == 0) {
		post.Icon = ""
	}
	
	if(post.Email != "") {
		post.Email = "mailto:" + post.Email
	}
	
	if(post.Name != "") {
		post.Name = post.Name + "&nbsp;"
	}
	
	if(post.ModNote != "") {
		post.CommentParsed = post.CommentParsed + "<br><br><i style='color:#9c27b0;'>(" + post.ModNote + ")</i>"
	}
	
	err = board.GetById(post.Board)
	
	if(err == nil) {
		if(board.EnableIds == 1) {
			if(post.PosterId != "" && post.Email != "mailto:sage") {
				err := posterId.GetById(post.PosterId)
				
				if(err == nil) {
					post.Name = post.Name + "ID:&nbsp;<span id=\"id_tag_" + posterId.ID[:8] + "\" style=\"color:" + posterId.Color + ";\">" + strings.ReplaceAll(posterId.Name, " ", "&nbsp;") + "</span>&nbsp;"
				}
			}
			
			if(post.PosterId != "" && strings.ToLower(post.Email) == "mailto:sage") {
				post.Name = "Heaven"
				post.Email = ""
			}
		}
	}
	
	p := bluemonday.StripTagsPolicy()
	
	post.Title = post.Subject
	
	if(post.Subject == "") {
		post.Title = p.Sanitize(strings.ReplaceAll(post.CommentParsed, "<br>", " "))
		
		if(utf8.RuneCountInString(post.Title) > 100) {
			post.Title = string([]rune(post.Title)[:100])
		}
	}
	
	post.Subject = utils.SanitizeHtml(post.Subject)
	post.Email = utils.SanitizeHtml(post.Email)
}

func (posts Posts) ProcessVirtualFields() {
	for i, post := range posts {
		post.ProcessVirtualFields()
		posts[i] = post
	}
}

func (posts Posts) ProcessReactions() {
	var nums []string
	var results []PostReactionFromGroupSelect
    
    for _, post := range posts {
		nums = append(nums, strconv.Itoa(post.Num))
	}
    
    database.MySQL.Raw("SELECT r.num, r.icon, COUNT(r.id) as votes FROM reactions AS r WHERE r.num IN(" + strings.Join(nums, ",") + ") GROUP BY r.num, r.icon ORDER BY r.num, votes DESC, icon DESC;").Scan(&results)
    
    for i, post := range posts {
        for _, result := range results {
            if(post.Num == result.Num) {
				var postReaction PostReaction
				postReaction.Icon = result.Icon
				postReaction.Count = result.Votes
                post.Reactions = append(post.Reactions, postReaction);
                
                post.ReactionsCount = post.ReactionsCount + result.Votes
            }
        }
        
        posts[i] = post
    }
}

func (post Post) ProcessReactions() {
	var nums []string
	var results []PostReactionFromGroupSelect

	nums = append(nums, strconv.Itoa(post.Num))
    
    database.MySQL.Raw("SELECT r.num, r.icon, COUNT(r.id) as votes FROM reactions AS r WHERE r.num IN(" + strings.Join(nums, ",") + ") GROUP BY r.num, r.icon ORDER BY r.num, votes DESC, icon DESC;").Scan(&results)
    
    for _, result := range results {
		var postReaction PostReaction
		postReaction.Icon = result.Icon
        postReaction.Count = result.Votes
        post.Reactions = append(post.Reactions, postReaction);
        
        post.ReactionsCount = post.ReactionsCount + result.Votes
    }
}

func (post *Post) Create() (error) {
	err := database.MySQL.Create(&post).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *Post) Update() (error) {
	err := database.MySQL.Save(&post).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *Post) Delete() (error) {
	err := database.MySQL.Delete(&post).Error
	
	if(err != nil) {
		return err
	}
	
	return nil
}

func (post *Post) GetById(id int) (error) {
	err := database.MySQL.First(&post, "`id` = ?", id).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *Post) GetByBoardNum(board string, num int) (error) {
	err := database.MySQL.First(&post, "`board` = ? AND `num` = ?", board, num).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *Post) GetLastByBoardIpTimestamp(board string, ip string, timestamp int64) (error) {
	err := database.MySQL.Last(&post, "`board` = ? AND `ip` = ? AND `deleted` = 0 AND `archived` = 0 AND `timestamp` <= ?", board, ip, timestamp).Order("id desc").Limit(1).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (post *Post) GetByNum(num int) (error) {
	err := database.MySQL.First(&post, "`num` = ?", num).Error
	
	if(err != nil) {
		return err
	} else {
		post.ProcessVirtualFields()
	}
	
	return nil
}

func (posts *Posts) Search(board string, text string) {
	database.MySQL.Where("board = ? AND (comment LIKE ? OR subject LIKE ?) AND deleted = 0 AND archived = 0", board, "%" + utils.DatabaseEscapeString(text) + "%", "%" + utils.DatabaseEscapeString(text) + "%").Order("id desc").Limit(100).Find(&posts)
	
	posts.ProcessVirtualFields()
}

func (post *Post) CheckSpamlist(spamlist string) (bool, SpamlistWord) {
	var boardSpamlist Spamlist
	
	_ = json.Unmarshal([]byte(spamlist), &boardSpamlist)
	
	p := bluemonday.StripTagsPolicy()
	
	sanitizedComment := p.Sanitize(post.CommentParsed)
	
	for _, word := range boardSpamlist {
		word.Value = strings.ToLower(word.Value)
		
		if(word.Type == "sequence") {
			if(strings.Contains(utils.LatinToRussianLetters(post.Comment), utils.LatinToRussianLetters(word.Value)) || strings.Contains(utils.LatinToRussianLetters(sanitizedComment), utils.LatinToRussianLetters(word.Value))) {
				return true, word
			}
		}
	}
	
	tokens := strings.FieldsFunc(sanitizedComment, func(r rune) bool {
		chars := []string{",", ".", " ", "\n", "\n", "\t", "-", "_", "'", "\"", "\"", "+", "(", ")", ":", ":", "!", "?"}
		
		if(slices.Contains(chars, string(r))) {
			return true
		}
		
		return false
	})
	
	for _, word := range boardSpamlist {
		word.Value = strings.ToLower(word.Value)
		
		if(word.Type == "prefix" || word.Type == "word") {
			for _, token := range tokens {
				if((word.Type == "prefix" && strings.HasPrefix(utils.LatinToRussianLetters(token), utils.LatinToRussianLetters(word.Value))) || (word.Type == "word" && utils.LatinToRussianLetters(token) == utils.LatinToRussianLetters(word.Value))) {
					return true, word
				}
			}
		}
	}
	
	return false, SpamlistWord{}
}

func CompileText(in *bbcode.BBCodeNode) string {
	out := ""
	if in.ID == bbcode.TEXT {
		out = in.Value.(string)
	}
	for _, child := range in.Children {
		out += CompileText(child)
	}
	return out
}

func (post *Post) ProcessBBCode(board Board) {
	newlineStub := "NEWLINE" + strconv.Itoa(rand.Intn(4985632))
	
	post.CommentParsed = post.Comment
	
	r := regexp.MustCompile("%%")
	
	matches := r.FindAllStringIndex(post.CommentParsed, -1)
	
	if(len(matches) % 2 == 0) {
		i := 1
		
		post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
				toReturn := m
				
				if(i % 2 == 0) {
					toReturn = "[/spoiler]";
				} else {
					toReturn = "[spoiler]";
				}
				
				i++
				
				return toReturn
			})
	}
	
	r = regexp.MustCompile("\\*\\*")
	
	matches = r.FindAllStringIndex(post.CommentParsed, -1)
	
	if(len(matches) % 2 == 0) {
		i := 1
		
		post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
				toReturn := m
				
				if(i % 2 == 0) {
					toReturn = "[/b]";
				} else {
					toReturn = "[b]";
				}
				
				i++
				
				return toReturn
			})
	}
	
	r = regexp.MustCompile("\\*")
	
	matches = r.FindAllStringIndex(post.CommentParsed, -1)
	
	if(len(matches) % 2 == 0) {
		i := 1
		
		post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
				toReturn := m
				
				if(i % 2 == 0) {
					toReturn = "[/i]";
				} else {
					toReturn = "[i]";
				}
				
				i++
				
				return toReturn
			})
	}
	
	post.CommentParsed = strings.Replace(post.CommentParsed, "\r", "", -1)
	post.CommentParsed = strings.Replace(post.CommentParsed, "\n", newlineStub, -1)
	
	compiler := bbcode.NewCompiler(false, true)
	
	compiler.SetTag("o", func(node *bbcode.BBCodeNode) (*bbcode.HTMLTag, bool) {
		out := bbcode.NewHTMLTag("")
		out.Name = "span"
		out.Attrs["class"] = "o"
		return out, true
	})
	
	compiler.SetTag("spoiler", func(node *bbcode.BBCodeNode) (*bbcode.HTMLTag, bool) {
		out := bbcode.NewHTMLTag("")
		out.Name = "span"
		out.Attrs["class"] = "spoiler"
		return out, true
	})
	
	compiler.SetTag("sup", func(node *bbcode.BBCodeNode) (*bbcode.HTMLTag, bool) {
		out := bbcode.NewHTMLTag("")
		out.Name = "sup"
		return out, true
	})
	
	compiler.SetTag("sub", func(node *bbcode.BBCodeNode) (*bbcode.HTMLTag, bool) {
		out := bbcode.NewHTMLTag("")
		out.Name = "sub"
		return out, true
	})
	
	compiler.SetTag("pre", func(node *bbcode.BBCodeNode) (*bbcode.HTMLTag, bool) {
		out := bbcode.NewHTMLTag("")
		out.Name = "pre"
		return out, true
	})
	
	compiler.SetTag("img", nil)
	compiler.SetTag("url", nil)
	compiler.SetTag("quote", nil)
	compiler.SetTag("center", nil)
	compiler.SetTag("color", nil)
	compiler.SetTag("size", nil)
	compiler.SetTag("code", nil)
	
	post.CommentParsed = compiler.Compile(post.CommentParsed)
	
	r = regexp.MustCompile("&gt;&gt;([0-9]+)")
	
	post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
			toReturn := m
			
			num, _ := strconv.Atoi(strings.Replace(m, "&gt;&gt;", "", -1))
			
			var citedPost Post
			
			err := citedPost.GetByNum(num)
			
			if(err == nil && citedPost.Deleted == 0) {
				if(citedPost.Parent == 0) {
					toReturn = toReturn + " (OP)"
				}
				
				postId := strconv.Itoa(citedPost.Num)
				threadId := strconv.Itoa(citedPost.Parent)
				
				if(citedPost.Parent == 0) {
					threadId = strconv.Itoa(citedPost.Num)
				}
				
				toReturn = "<a href=\"/" + citedPost.Board + "/res/" + threadId + ".html#" + postId + "\" class=\"post-reply-link\" data-thread=\"" + threadId + "\" data-num=\"" + postId + "\">" + toReturn + "</a>"
			}
			
			return toReturn
		})
	
	if(board.EnableDices == 1) {
		r = regexp.MustCompile("##([0-9]+)d([0-9]+)##")
		
		post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
				toReturn := m
				
				fmt.Println(toReturn)
				
				m = strings.ReplaceAll(m, "#", "")
				
				mparts := strings.Split(m, "d")
				rolls, _ := strconv.Atoi(mparts[0])
				faces, _ := strconv.Atoi(mparts[1])
				
				if(rolls > 0 && rolls <= 20 && faces > 0 && faces <= 100) {
					toReturn = "<img src=\"/static/img/dice-32.png\" style=\"width:14px;margin:auto 3px -2px 3px;\">" + m + ": "
					
					sum := 0
					var operands []string
					
					faces++
					
					for i := 0; i < rolls; i++ {
						result := rand.Intn(faces - 1) + 1
						
						operands = append(operands, strconv.Itoa(result))
						
						sum = sum + result
					}
					
					toReturn = toReturn + "(" + strings.Join(operands, " + ") + ") = " + strconv.Itoa(sum)
				}
				
				return toReturn
			})
			
		r = regexp.MustCompile("##([0-9]+)d([0-9]+)h([0-9]+)##")
		
		post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
				toReturn := m
				
				fmt.Println(toReturn)
				
				m = strings.ReplaceAll(m, "#", "")
				m2 := strings.ReplaceAll(m, "h", "d")
				
				mparts := strings.Split(m2, "d")
				rolls, _ := strconv.Atoi(mparts[0])
				faces, _ := strconv.Atoi(mparts[1])
				hcount, _ := strconv.Atoi(mparts[2])
				
				if(rolls > 0 && rolls <= 20 && hcount <= rolls && faces > 0 && faces <= 100) {
					toReturn = "<img src=\"/static/img/dice-32.png\" style=\"width:14px;margin:auto 3px -2px 3px;\">" + m + ": "
					
					sum := 0
					var operandsInt []int
					var operands []string
					
					faces++
					
					for i := 0; i < rolls; i++ {
						result := rand.Intn(faces - 1) + 1
						
						operandsInt = append(operandsInt, result)
						operands = append(operands, strconv.Itoa(result))
					}
					
					sort.Sort(sort.Reverse(sort.IntSlice(operandsInt)))
					
					operandsInt = operandsInt[:hcount]
					
					for _, operandInt := range operandsInt {
						sum = sum + operandInt
					}
					
					toReturn = toReturn + "(" + strings.Join(operands, " + ") + ") = " + strconv.Itoa(sum)
				}
				
				return toReturn
			})
	}
	
	lines := strings.Split(post.CommentParsed, newlineStub)
	
	for index, line := range lines {
		if(strings.HasPrefix(line, "&gt;")) {
			line = "<span class=\"unkfunc\">" + line + "</span>"
			
			lines[index] = line
		}
	}
	
	post.CommentParsed = strings.Join(lines, "\n")
	
	post.CommentParsed = strings.Replace(post.CommentParsed, "\n", "<br>", -1)
	
	post.CommentParsed = utils.MakeUrlsClickable(post.CommentParsed)
    
	var replacements Replacements
	
	_ = json.Unmarshal([]byte(board.Replacements), &replacements)
    
    slices.SortFunc(replacements, func(a, b Replacement) int {
        if len(a.Source) > len(b.Source) {
            return -1
        }
        if len(a.Source) < len(b.Source) {
            return 1
        }
        return 0
    })
	
	for _, word := range replacements {
		r = regexp.MustCompile("(?i)" + regexp.QuoteMeta(word.Source))
        
		post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(source string) string {
                bgColor := randomcolor.GetRandomColorInHex()
                fgColor := randomcolor.GetRandomColorInHex()
				
				return "<span class=\"replacement\" style=\"color:" + fgColor + ";background:" + bgColor + ";\">" + word.Result + "</span>"
			})
	}
}

func (post *Post) ProcessSecrets() {
	var citedUsercodes []string
	
	citedUsercodes = append(citedUsercodes, post.Usercode)
	
	r := regexp.MustCompile("&gt;&gt;([0-9]+)")
	
	_ = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
			toReturn := m
			
			num, _ := strconv.Atoi(strings.Replace(m, "&gt;&gt;", "", -1))
			
			var citedPost Post
			
			err := citedPost.GetByNum(num)
			
			if(err == nil) {
				citedUsercodes = append(citedUsercodes, citedPost.Usercode)
			}
			
			return toReturn
		})
	
	r = regexp.MustCompile(`\[secret\](.*?)\[/secret\]`)
	
	post.CommentParsed = r.ReplaceAllStringFunc(post.CommentParsed, func(m string) string {
			content := r.FindStringSubmatch(m)[1]
			
			mainKey := randstr.Hex(32)
			
			encryptedContent := encryptSecretText(content, mainKey)
			
			var userKeys []string
			
			for _, usercode := range citedUsercodes {
				encryptedKey := encryptSecretText(mainKey, usercode)
				
				if(!slices.Contains(userKeys, encryptedKey)) {
					userKeys = append(userKeys, encryptedKey)
				}
			}
			
			return fmt.Sprintf(`<span class="secret-text" data-encrypted="%s" data-keys="%s">[приватный текст]</span>`, encryptedContent, strings.Join(userKeys, ","))
		})
}

func encryptSecretText(ciphertext, key string) string {
	if len(ciphertext) == 0 || len(key) == 0 {
		return ciphertext
	}
	
	ciphertext = base64.StdEncoding.EncodeToString([]byte(ciphertext))
	
	// Преобразуем входные строки в байты (UTF-8)
	textBytes := []byte(ciphertext)
	keyBytes := []byte(key)
	result := make([]byte, len(textBytes))

	// Применяем XOR для каждого байта текста с байтом ключа
	for i := 0; i < len(textBytes); i++ {
		result[i] = textBytes[i] ^ keyBytes[i%len(keyBytes)]
	}

	// Вычисляем SHA-256 хеш исходного текста
	hash := sha256.Sum256(textBytes)

	// Объединяем хеш и зашифрованный текст
	resultWithHash := append(hash[:], result...)

	// Кодируем результат в Base64
	return base64.StdEncoding.EncodeToString(resultWithHash)
}