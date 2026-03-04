# format the code with prettier
format:
	npm run format

# check the code with prettier
format-check:
	npm run format:check

# lint the code with eslint
lint:
	npm run lint

# check the code with eslint
lint-check:
	npm run lint:check

format-lint:
	npm run format && npm run lint

# run the tests
test:
	npm run test

# run the tests in watch mode
test-watch:
	npm run test:watch

# run the tests with coverage
test-coverage:
	npm run test:coverage

# build the project
build:
	npm run build