all: js/site.js js/d3.js

D3_FILES = \
	node_modules/d3/src/start.js \
	node_modules/d3/src/core/index.js \
	node_modules/d3/src/event/index.js \
	node_modules/d3/src/selection/index.js \
	node_modules/d3/src/time/index.js \
	node_modules/d3/src/xhr/index.js \
	node_modules/d3/src/end.js \
	src/d3.jsonp.js

js/d3.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@

js/site.js: index.js js/d3.js src/search.js
	./node_modules/.bin/browserify --debug index.js > js/site.js
