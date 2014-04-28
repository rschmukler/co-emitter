MOCHA_PATH=./node_modules/.bin/mocha
MOCHA_OPTS=--harmony --reporter=spec

test:
	$(MOCHA_PATH) $(MOCHA_OPTS) -w

test-once:
	$(MOCHA_PATH) $(MOCHA_OPTS)

.PHONY: test test-once
