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
	@VERSION=v$$(node -p "require('./package.json').version"); \
	if git rev-parse "$$VERSION" >/dev/null 2>&1; then \
		echo "Tag $$VERSION already exists, skipping..."; \
	else \
		git tag "$$VERSION" && git push origin "$$VERSION"; \
	fi
	npm publish
