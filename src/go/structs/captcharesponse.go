package structs

type CaptchaResponse struct {
	Result	int `json:"result,omitempty"`
	Id	string `json:"id,omitempty"`
	Key	string `json:"key,omitempty"`
	Img	string `json:"img,omitempty"`
}