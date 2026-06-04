.PHONY: run build test
run:
	go run ./cmd/skillbook
build:
	go build -o skillbook ./cmd/skillbook
test:
	go test ./...
