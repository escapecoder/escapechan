package i18n

import (
	"os"
	"encoding/json"
	"io/ioutil"
	"path/filepath"
	"strings"
)

type Translations map[string]map[string]string

var translations Translations

// Загрузить все переводы из директории "translations"
func LoadTranslations() error {
	ex, err := os.Executable()
	
	if err != nil {
		panic(err)
	}
	
	exPath := filepath.Dir(ex)
	
	translations = make(Translations)
	dir := exPath + "/translations"
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".json") {
			lang := strings.TrimSuffix(file.Name(), ".json")
			filePath := filepath.Join(dir, file.Name())

			// Чтение и парсинг JSON файла
			data, err := ioutil.ReadFile(filePath)
			if err != nil {
				return err
			}

			var langTranslations map[string]string
			err = json.Unmarshal(data, &langTranslations)
			if err != nil {
				return err
			}

			translations[lang] = langTranslations
		}
	}

	return nil
}

// Получить все переводы для языка
func GetTranslations(language string) (map[string]string, bool) {
	lang, ok := translations[language]
	return lang, ok
}

// Получить конкретную строку перевода по ключу
func GetTranslation(language, key string) (string) {
	lang, ok := translations[language]
	if !ok {
		return ""
	}
	translation, _ := lang[key]
	return translation
}

// Получить переводы для языка с префиксом
func GetTranslationsByPrefix(language, prefix string) (map[string]string, bool) {
	lang, ok := translations[language]
	if !ok {
		return nil, false
	}

	result := make(map[string]string)
	for key, value := range lang {
		if strings.HasPrefix(key, prefix) {
			result[key] = value
		}
	}

	if len(result) == 0 {
		return nil, false
	}

	return result, true
}

// Получить переводы для языка с префиксом в формате JSON
func GetTranslationsJsonByPrefix(language, prefix string) (string, bool) {
	lang, ok := translations[language]
	if !ok {
		return "", false
	}

	result := make(map[string]string)
	for key, value := range lang {
		if strings.HasPrefix(key, prefix) {
			result[key] = value
		}
	}

	if len(result) == 0 {
		return "", false
	}

	// Преобразуем результат в JSON
	jsonData, err := json.Marshal(result)
	if err != nil {
		return "", false
	}

	return string(jsonData), true
}