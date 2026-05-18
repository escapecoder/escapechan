package router

import (
	"os"
	"fmt"
	"net/http"
	"text/template"
	"path/filepath"
	
	"github.com/gorilla/mux"
	
	"3ch/backend/api"
	"3ch/backend/middleware"
	_ "3ch/backend/structs"
)

func notFoundHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/notfound.html"))
		
		tpl.Execute(w, nil)
	})
}

func MethodNotAllowedHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ex, _ := os.Executable()
		exPath := filepath.Dir(ex)
		
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Header().Set("Content-Type", "text/html")
		
		tpl := template.Must(template.ParseFiles(exPath + "/templates/forbidden.html"))
		
		tpl.Execute(w, nil)
	})
}

func Init() {
	r := mux.NewRouter()
	r.StrictSlash(true)
	
	r.NotFoundHandler = notFoundHandler()
	r.MethodNotAllowedHandler = MethodNotAllowedHandler()
	
	r.HandleFunc("/user/posting", api.CreatePost).Methods("POST")
	r.HandleFunc("/user/report", api.ReportPost).Methods("POST")
	r.HandleFunc("/user/search", api.SearchPosts).Methods("POST")
	r.HandleFunc("/user/edit", api.PostEdit).Methods("POST")
	r.HandleFunc("/user/edit/check", api.CheckPostEdit).Methods("POST")
	r.HandleFunc("/user/delete", api.PostDelete).Methods("POST")
	
	r.HandleFunc("/api/polls/vote", api.VoteInPoll).Methods("GET")
	
	r.HandleFunc("/api/react", api.ReactPost).Methods("GET")
	
	r.HandleFunc("/api/like", api.LikePost).Methods("GET")
	r.HandleFunc("/api/dislike", api.LikePost).Methods("GET")
	
	r.HandleFunc("/api/feed", api.PostsFeed).Methods("GET")
	
	r.HandleFunc("/api/dashchan-captcha/settings/{board}", api.GetDashchanCaptchaSettings).Methods("GET")
	r.HandleFunc("/api/dashchan-captcha/{type}/id", api.GetDashchanCaptchaId).Methods("GET")
	
	r.HandleFunc("/api/captcha/default/id", api.GetCaptchaId).Methods("GET")
	r.HandleFunc("/api/captcha/slide/id", api.GetSlideBasicCaptData).Methods("GET")
	r.HandleFunc("/api/captcha/slide/check", api.CheckSlideData).Methods("POST")
	
	//r.HandleFunc("/api/render/board/{board}/html", api.TestRenderBoardHtml).Methods("GET")
	//r.HandleFunc("/api/render/board/{board}/json", api.TestRenderBoardJson).Methods("GET")
	
	//r.HandleFunc("/api/render/thread/{board}/{num}/html", api.TestRenderThreadHtml).Methods("GET")
	//r.HandleFunc("/api/render/thread/{board}/{num}/json", api.TestRenderThreadJson).Methods("GET")
	
	//r.HandleFunc("/api/render/boards/all", api.RenderAllBoards).Methods("GET")
	
	r.HandleFunc("/api/mobile/v2/boards", api.MobileBoardsList).Methods("GET")
	r.HandleFunc("/api/mobile/v2/info/{board}/{thread}", api.MobileThread).Methods("GET")
	r.HandleFunc("/api/mobile/v2/post/{board}/{num}", api.MobilePost).Methods("GET")
	//r.HandleFunc("/api/mobile/v2/post/{board}/{num}/reacted", api.MobilePostWhoReacted).Methods("GET")
	r.HandleFunc("/api/mobile/v2/after/{board}/{thread}/{num}", api.MobileAfter).Methods("GET")
	
	r.HandleFunc("/fallback/{board}/res/{num}.{format}", api.FallbackThreadUrl).Methods("GET")
	
	r.HandleFunc("/user/passlogin", api.PasscodeLogin).Methods("GET")
	r.HandleFunc("/user/passlogin", api.PasscodeLogin).Methods("POST")
	
	r.HandleFunc("/user/bot", api.BotSettings).Methods("GET")
	
	r.HandleFunc("/moder/login", api.ModerLogin).Methods("GET")
	r.HandleFunc("/moder/login", api.ModerLogin).Methods("POST")
	
	msr := r.PathPrefix("/moder").Subrouter()
	
	msr.HandleFunc("/js", api.ModerJS).Methods("GET")
	
	msr.HandleFunc("/bans", api.ModerBansList).Methods("GET")
	msr.HandleFunc("/bans/search", api.ModerBansSearch).Methods("GET")
	msr.HandleFunc("/bans/cancel", api.ModerBansCancel).Methods("POST")
	
	msr.HandleFunc("/reports", api.ModerReportsList).Methods("GET")
	msr.HandleFunc("/reports/search", api.ModerReportsSearch).Methods("GET")
	msr.HandleFunc("/reports/ignore", api.ModerReportsIgnore).Methods("POST")
	
	msr.HandleFunc("/", api.ModerPostsList).Methods("GET")
	msr.HandleFunc("/posts", api.ModerPostsList).Methods("GET")
	msr.HandleFunc("/posts/search", api.ModerPostsSearch).Methods("GET")
	msr.HandleFunc("/posts/action", api.ModerPostsAction).Methods("GET")
	msr.HandleFunc("/posts/action", api.ModerPostsAction).Methods("POST")
	msr.HandleFunc("/posts/updateMenu", api.ModerPostsUpdateMenu).Methods("POST")
	msr.HandleFunc("/posts/additional", api.ModerPostsAdditional).Methods("GET")
	msr.HandleFunc("/posts/single", api.ModerSinglePost).Methods("GET")
	
	msr.HandleFunc("/modlog", api.ModerModlogList).Methods("GET")
	msr.HandleFunc("/modlog/search", api.ModerModlogSearch).Methods("GET")
	
	msr.HandleFunc("/service", api.ModerService).Methods("GET")
	msr.HandleFunc("/service/render/boards", api.ModerRenderAllBoards).Methods("GET")
	msr.HandleFunc("/service/render/threads", api.ModerRenderAllThreads).Methods("GET")
	
	msr.HandleFunc("/moders", api.ModerModersList).Methods("GET")
	msr.HandleFunc("/moders/create", api.ModerModersEdit).Methods("GET")
	msr.HandleFunc("/moders/{moder}/edit", api.ModerModersEdit).Methods("GET")
	msr.HandleFunc("/moders/save", api.ModerModersSave).Methods("POST")
	
	msr.HandleFunc("/boards", api.ModerBoardsList).Methods("GET")
	msr.HandleFunc("/boards/create", api.ModerBoardsEdit).Methods("GET")
	msr.HandleFunc("/boards/{board}/edit", api.ModerBoardsEdit).Methods("GET")
	msr.HandleFunc("/boards/save", api.ModerBoardsSave).Methods("POST")
	
	msr.HandleFunc("/articles", api.ModerArticlesList).Methods("GET")
	msr.HandleFunc("/articles/create", api.ModerArticlesEdit).Methods("GET")
	msr.HandleFunc("/articles/{article}/edit", api.ModerArticlesEdit).Methods("GET")
	msr.HandleFunc("/articles/save", api.ModerArticlesSave).Methods("POST")
	
	msr.HandleFunc("/passcodes", api.ModerPasscodesList).Methods("GET")
	msr.HandleFunc("/passcodes/search", api.ModerPasscodesSearch).Methods("GET")
	msr.HandleFunc("/passcodes/create", api.ModerPasscodesEdit).Methods("GET")
	msr.HandleFunc("/passcodes/{passcode}/edit", api.ModerPasscodesEdit).Methods("GET")
	msr.HandleFunc("/passcodes/save", api.ModerPasscodesSave).Methods("POST")
	
	msr.HandleFunc("/config", api.ModerConfig).Methods("GET")
	msr.HandleFunc("/config/save", api.ModerConfigSave).Methods("POST")
	
	msr.HandleFunc("/full/{board}/{num}", api.RenderModerThreadHtml).Methods("GET")
	msr.HandleFunc("/full/{board}/{num}/json", api.RenderModerThreadJson).Methods("GET")
	
	msr.HandleFunc("/logout", api.ModerLogout).Methods("GET")
	
	msr.Use(middleware.CheckModerAuth)
	
	colorGreen := "\033[32m"
	colorReset := "\033[0m"
	
	httpPort := os.Getenv("HTTP_PORT")
	
	fmt.Println(string(colorGreen) + "Listening on port " + httpPort, string(colorReset))
	
	http.ListenAndServe("127.0.0.1:" + httpPort, r)
}