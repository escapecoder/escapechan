package structs

type MobileResponse struct {
	Posts interface{} `json:"posts,omitempty"`
	UniquePosters interface{} `json:"unique_posters,omitempty"`
	Post interface{} `json:"post,omitempty"`
	Thread interface{} `json:"thread,omitempty"`
	Result	interface{} `json:"result,omitempty"`
	Error	interface{} `json:"error,omitempty"`
}