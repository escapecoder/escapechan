package models

type File struct {
	Extension	string `json:"-"`
	Type	int `json:"type"`
	Name	string `json:"name"`
	Path	string `json:"path"`
	Thumbnail	string `json:"thumbnail"`
	ThumbnailWidth	int `json:"tn_width"`
	ThumbnailHeight	int `json:"tn_height"`
	MD5		string `json:"md5"`
	DisplayName	string `json:"displayname"`
	FullName	string `json:"fullname"`
	Width	int `json:"width"`
	Height	int `json:"height"`
	Size	int64 `json:"size"`
	Duration	string `json:"duration,omitempty"`
	DurationSecs	int `json:"duration_secs,omitempty"`
	ApproximateFramesCount	int `json:"-"`
}

type Files []File