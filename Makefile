.PHONY: install clean check

install:
	npm install

clean:
	rm -rf build

# Run all quality checks (lint, typecheck, test)
check:
	npm run lint
	npm run typecheck
	npm run test:run
