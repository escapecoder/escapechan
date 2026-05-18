package utils

import (
	"os"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
)

// Функция для проверки решения reCAPTCHA
func VerifyRecaptcha(response string, remoteIP string) (bool, error) {
	// Формируем параметры запроса
	params := url.Values{}
	params.Add("secret", os.Getenv("RECAPTCHA_SECRET"))
	params.Add("response", response)
	params.Add("remoteip", remoteIP)

	// Отправляем запрос к API reCAPTCHA
	resp, err := http.PostForm("https://www.google.com/recaptcha/api/siteverify", params)
	if err != nil {
		return false, fmt.Errorf("ошибка при отправке запроса: %v", err)
	}
	defer resp.Body.Close()

	// Чтение ответа
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("ошибка при чтении ответа: %v", err)
	}

	// Структура для обработки ответа
	var result struct {
		Success     bool   `json:"success"`
		ChallengeTS string `json:"challenge_ts"`
		Hostname    string `json:"hostname"`
	}

	// Декодируем JSON-ответ
	if err := json.Unmarshal(body, &result); err != nil {
		return false, fmt.Errorf("ошибка при разборе ответа: %v", err)
	}

	// Если проверка прошла успешно
	if result.Success {
		return true, nil
	}

	// В случае ошибки
	return false, fmt.Errorf("неудачная проверка reCAPTCHA")
}