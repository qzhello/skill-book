package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	srv.StartAutoCheck() // 后台周期检测来源更新（周期见 ~/.skillbook/sync.json）

	if h := strings.Split(*addr, ":")[0]; h != "" && h != "127.0.0.1" && h != "localhost" && !strings.HasPrefix(h, "127.") {
		log.Printf("警告：监听在非回环地址 %s —— 所有 API（含写文件、Finder 打开）无认证保护，仅建议本机使用。", *addr)
	}
	log.Printf("SkillBook on http://%s  (db=%s)", *addr, filepath.Clean(*dbPath))
	if err := http.ListenAndServe(*addr, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}
