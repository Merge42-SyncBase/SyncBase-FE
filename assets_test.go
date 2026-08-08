package frontend

import (
	"html/template"
	"io/fs"
	"testing"
)

func TestEmbeddedAssetsAndTemplates(t *testing.T) {
	static, err := Static()
	if err != nil {
		t.Fatalf("Static: %v", err)
	}
	for _, name := range []string{"css/app.css", "js/upload.js", "vendor/pdfjs/pdf.mjs"} {
		if _, err := fs.Stat(static, name); err != nil {
			t.Errorf("Stat(%q): %v", name, err)
		}
	}
	parsed, err := Parse(template.New("syncbase").Funcs(template.FuncMap{
		"statusLabel":     func(any) string { return "" },
		"formatTime":      func(any) string { return "" },
		"formatTimePtr":   func(any) string { return "" },
		"errorLabel":      func(string) string { return "" },
		"activeVersion":   func(any) string { return "" },
		"stages":          func() []any { return nil },
		"stageLabel":      func(any) string { return "" },
		"stageState":      func(any, any) string { return "" },
		"stageStateLabel": func(string) string { return "" },
		"isProcessing":    func(any) bool { return false },
	}))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	for _, name := range []string{"login", "documents", "upload", "details", "source", "search"} {
		if parsed.Lookup(name) == nil {
			t.Errorf("template %q is missing", name)
		}
	}
}
