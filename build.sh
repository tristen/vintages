#!/bin/sh

echo "npm install"
npm install

echo ""
echo "Scraping lcboapi.com ..."

rm titles.json && rm data.json

node scrape/scrape.js
node scrape/titles.js

echo ""
echo "Generative indexes ..."

rm -rf indexes/*

node generate_index/invert.js
node generate_index/trie.js

echo ""
echo "Complete! now type npm start"
