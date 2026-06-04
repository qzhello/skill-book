package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"skillbook/internal/scanner"
	"skillbook/internal/server"
	"skillbook/internal/store"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:7777", "listen address")
	dbPath := flag.String("db", "skillbook.db", "sqlite path")
	flag.Parse()

	home, _ := os.UserHomeDir()
	cwd, _ := os.Getwd()

	st, err := store.Open(*dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	roots := scanner.DefaultRoots(home, cwd)
	srv := server.New(st, roots)

	log.Printf("SkillBook on http://%s  (db=%s)", *addr, filepath.Clean(*dbPath))
	if err := http.ListenAndServe(*addr, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}
