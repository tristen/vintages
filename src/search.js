(function() {
module.exports = {};

// sharded indexes
var indexes = {};
var titles = {};

// tries
var tries = {};

function shard(a) {
    if (!a) return false;
    return a[0].toLowerCase();
}

// Get a shard.
function getindex(a, callback) {
    if (indexes[shard(a)]) return callback(indexes[shard(a)]);

    d3.json('data/indexes/' + shard(a) + '.json', function(err, res) {
        indexes[shard(a)] = res;
        callback(indexes[shard(a)]);
    });
}

function omitLeadingZero(s) {
    return s.replace(/^0+/, '');
}

function getID(id, callback) {
    var ids = [];
    for (var t in titles) {
        if (t.indexOf(omitLeadingZero(id)) !== -1) {
            ids.push(parseInt(t, 10));
        }
    }
    callback(ids);
}

function gettrie(a, callback) {
    if (tries[shard(a)]) return callback(tries[shard(a)]);

    d3.json('data/indexes/' + shard(a) + '.json.trie.json', function(err, res) {
        tries[shard(a)] = res;
        callback(tries[shard(a)]);
    });
}

function jointitles(x) {
    var l = [];
    for (var i = 0; i < x.length; i++) {
        l.push({
            id: x[i],
            item: titles[x[i]] || ''
        });
    }
    return l;
}

function intersect(a, b) {
    var c = [];
    for (var i = 0; i < a.length; i++) {
        if (b.indexOf(a[i]) !== -1) {
            c.push(a[i]);
        }
    }
    return c;
}

function cleansplit(q) {
    var terms = q.split(/\s+/);
    if (!terms.length) return [];
    terms = terms.map(function(t) {
        var clean = t.replace(/[^A-Za-z0-9]/g, '');
        if (!clean) return false;
        else return clean.toLowerCase();
    }).filter(function(t) {
        return t;
    });
    return terms;
}

function isEmpty(obj) {
    for (var key in obj) return false;
    return true;
}

function autocomplete(q, callback) {
    var terms = cleansplit(q);
    if (!terms) return callback([]);
    var last = terms.pop();
    var limit = 20;
    if (isNaN(parseInt(last, 10))) {
        gettrie(last, function(trie) {
            var pos = trie;
            // inch up pos to end
            var prefix = '';
            for (var i = 0; i < last.length; i++) {
                if (pos[last[i]]) {
                    prefix += last[i];
                    pos = pos[last[i]];
                }
            }
            var strs = [];
            function traverse(pos, prefix) {
                if (strs.length > limit) return callback(strs);
                if (isEmpty(pos)) {
                    strs.push(prefix);
                }
                for (var i in pos) {
                    traverse(pos[i], prefix + i);
                }
            }
            traverse(pos, prefix);
            return callback(strs);
        });
    }
}

function query(q, callback) {
    var terms = cleansplit(q);
    if (!terms) return callback([]);
    function doterm(idx) {
        var term = terms.pop();
        if (!isNaN(parseInt(term, 10)) && term.length > 2) {
            getID(term, function(res) {
                if (terms.length) {
                    doterm(idx);
                } else {
                    return callback(jointitles(res));
                }
            });
        } else {
            getindex(term, function(index) {
                if (!index[term]) return callback([]);
                idx = (idx) ?
                    intersect(idx, index[term]) :
                    idx = index[term];

                if (!idx) return callback([]);
                if (terms.length) {
                    doterm(idx);
                } else {
                    return callback(jointitles(idx));
                }
            });
        }
    }
    doterm();
}

module.exports.query = query;
module.exports.autocomplete = autocomplete;
module.exports.primetitles = function(path) {
    d3.json(path, function(err, res) {
        if (err) return console.error('titles.json could not be primed for search.');
        titles = res; 
    });
};

})();
