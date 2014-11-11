TESTS = test/unit/*.js
REPORTER = spec

test: base/nquery.js
	@npm install
	@./node_modules/mocha/bin/mocha  $(TESTS) --reporter spec

base/nquery.js: peg/nquery.pegjs
	@./node_modules/pegjs/bin/pegjs peg/nquery.pegjs ./base/nquery.js

clean:

.PHONY: test
