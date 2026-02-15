package middleware

import (
	"net/http"
	_ "encoding/json"

	"github.com/gorilla/context"
	
	"3ch/backend/models"
	_ "3ch/backend/structs"
	_ "3ch/backend/utils"
)

func CheckModerAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var currentModer models.Moder
		hasAuthError := false
		
		moderCookie, err := r.Cookie("moder")
		
		if(err != nil) {
			hasAuthError = true
		} else {
			err := currentModer.GetBySession(moderCookie.Value)
			
			if(err != nil) {
				hasAuthError = true
			} else if(currentModer.Enabled == 0) {
				hasAuthError = true
			}
		}
		
		if(hasAuthError) {
			http.Redirect(w, r, "/moder/login", http.StatusSeeOther)
			
			return
		} else {
			context.Set(r, "hasAuth", true)
			context.Set(r, "currentModer", currentModer)
		}
		
		next.ServeHTTP(w, r)
	})
}