var _s = require('underscore.string'),
    path = require('path'),
    fs = require('fs');

var words = {};

fs.readdir('data/indexes/', function(err, files) {
    files.map(function(f) {
        var obj = JSON.parse(fs.readFileSync('data/indexes/' + f, 'utf8'));
        var keys = Object.keys(obj);
        var trie = {};
        for (var i = 0; i < keys.length; i++) {
            var pos = trie;
            for (var j = 0; j < keys[i].length; j++) {
                if (pos[keys[i][j]] === undefined) {
                    pos[keys[i][j]] = {};
                }
                pos = pos[keys[i][j]];
            }
        }
        fs.writeFileSync('data/indexes/' + f + '.trie.json', JSON.stringify(trie));
    });
});
