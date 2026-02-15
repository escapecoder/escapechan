package structs

type DatatablesResponse struct {
	RecordsTotal	int64 `json:"recordsTotal"`
	RecordsFiltered	int64 `json:"recordsFiltered"`
	Data	interface{} `json:"data"`
}