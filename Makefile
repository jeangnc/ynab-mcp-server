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
	@npm whoami --registry https://registry.npmjs.org 2>/dev/null || npm login --registry https://registry.npmjs.org --scope=@jean.gnc
	npm run release
