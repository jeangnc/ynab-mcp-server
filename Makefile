.PHONY: install build run dev clean

install:
	npm install

build:
	npm run build

run:
	npm run start

dev:
	npm run dev

clean:
	rm -rf build
