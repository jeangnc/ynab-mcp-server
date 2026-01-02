.PHONY: install build run dev clean release

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

release:
	npm run build
	git tag v$$(node -p "require('./package.json').version")
	git push origin v$$(node -p "require('./package.json').version")
	npm publish
