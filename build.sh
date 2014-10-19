#!/bin/sh

echo "npm install"
npm install

echo ""
echo "Scraping lcboapi.com ..."

rm data/titles.json && rm data/data.json

node generate_data/scrape.js
node generate_data/titles.js

echo ""
echo "Generate indexes ..."

rm -rf data/indexes/*

node generate_data/invert.js
node generate_data/trie.js

echo ""
echo "Complete! now type npm start"
