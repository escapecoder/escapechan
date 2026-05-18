package utils

import (
	"unicode"
	"os"
	"time"
	"strconv"
	"strings"
	"net/http"
	"io/ioutil"
	"regexp"
	
	"github.com/speps/go-hashids/v2"
	"github.com/aquilax/tripcode"
)

func CalculateUppercasePercentage(text string) float64 {
	var upperCount, totalCount int

	for _, r := range text {
		if unicode.IsLetter(r) {
			totalCount++
			if unicode.IsUpper(r) {
				upperCount++
			}
		}
	}

	if totalCount == 0 {
		return 0
	}

	return float64(upperCount) / float64(totalCount) * 100
}

func GetTrip(plain string) string {
	trip := ""
	
	plainParts := strings.Split(plain, "#")
	
	if(len(plainParts) == 2) {
		trip = plainParts[0] + "!" + tripcode.Tripcode(plainParts[1])
	} else if(len(plainParts) >= 3) {
		trip = plainParts[0] + "!!" + tripcode.SecureTripcode(plainParts[1], plainParts[2])
	}
	
	return trip
}

func GetNewNum(boardId string) int {
	var num int
	
	client := http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Get(os.Getenv("NUMS_SERVER") + "/increment/" + boardId)
	
	if(err == nil) {
		body, err := ioutil.ReadAll(resp.Body)
		
		if(err == nil) {
			num, err = strconv.Atoi(string(body))
		}
	}
	
	return num
}

func IsIpHashed(ip string) bool {
	if(strings.Contains(ip, ":")) {
		return false
	}
	
	letterCheck := regexp.MustCompile(`^[a-zA-Z]+$`)
	ipOctets := strings.Split(ip, ".")
	
	for _, octet := range ipOctets {
		if(letterCheck.MatchString(octet)) {
			return true
		}
	}
	
	return false
}

func HashIp(ip string) string {
	if(strings.Contains(ip, ":")) {
		return ip
	}
	
	hd := hashids.NewData()
	hd.Salt = os.Getenv("HASHIDS_SALT")
	hd.MinLength = 3
	hd.Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	
	h, _ := hashids.NewWithData(hd)
	
	digitCheck := regexp.MustCompile(`^[0-9]+$`)
	ipOctets := strings.Split(ip, ".")
	
	for index, octet := range ipOctets {
		if(digitCheck.MatchString(octet)) {
			intOctet, _ := strconv.Atoi(octet)
			
			processedOctet, _ := h.Encode([]int{intOctet, index})
			
			ipOctets[index] = processedOctet
		}
	}
	
	ip = strings.Join(ipOctets, ".")
	
	return ip
}

func UnhashIp(ip string) string {
	if(strings.Contains(ip, ":")) {
		return ip
	}
	
	hd := hashids.NewData()
	hd.Salt = os.Getenv("HASHIDS_SALT")
	hd.MinLength = 3
	hd.Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	
	h, _ := hashids.NewWithData(hd)
	
	letterCheck := regexp.MustCompile(`^[a-zA-Z]+$`)
	ipOctets := strings.Split(ip, ".")
	
	for index, octet := range ipOctets {
		if(letterCheck.MatchString(octet)) {
			processedOctet, err := h.DecodeWithError(octet)
			
			if(err == nil && processedOctet[1] == index) {
				ipOctets[index] = strconv.Itoa(processedOctet[0])
			}
		}
	}
	
	ip = strings.Join(ipOctets, ".")
	
	return ip
}

func MakeUrlsClickable(text string) string {
	//r := regexp.MustCompile("http(s)?:\\/\\/?[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&'\\(\\)\\*\\+,;=.]+")
	r := regexp.MustCompile(`http(s)?:\/\/?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#@!\$&'\(\)\*\+,;=.]+`)
	
	text = r.ReplaceAllStringFunc(text, func(m string) string {
			toReturn := m
			
			toReturn = "<a href=\"" + toReturn + "\" target=\"_blank\" rel=\"nofollow noopener noreferrer\">" + toReturn + "</a>"
			
			return toReturn
		})
	
	return text
}

func DatabaseEscapeString(value string) string {
	replace := map[string]string{"\\":"\\\\", "'":`\'`, "\\0":"\\\\0", "\n":"\\n", "\r":"\\r", `"`:`\"`, `%`:`\%`, "\x1a":"\\Z"}
	
	for b, a := range replace {
		value = strings.Replace(value, b, a, -1)
	}
	
	return value;
}

func LatinToRussianLetters(value string) string {
	replace := map[string]string{"a":"а", "b":"в", "p":"р", "o":"о", "0":"о", "t":"т", "e":"е", "h":"н", "x":"х", "y":"у", "m":"м", "3":"з", "k":"к"}
	
	for b, a := range replace {
		value = strings.Replace(value, b, a, -1)
	}
	
	return value;
}

func SanitizeHtml(text string) string {
	text = strings.ReplaceAll(text, "<", "&lt;")
	text = strings.ReplaceAll(text, ">", "&gt;")
	text = strings.ReplaceAll(text, "\"", "&quot;")
	
	return text
}