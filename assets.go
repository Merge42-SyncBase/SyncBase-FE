package frontend

import (
	"embed"
	"io/fs"
)

//go:embed static
var embedded embed.FS

// Static returns the immutable frontend file system rooted at static/.
func Static() (fs.FS, error) {
	return fs.Sub(embedded, "static")
}
