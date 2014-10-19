var queue = require('queue-async'),
    fs = require('fs'),
    _ = require('underscore'),
    request = require('request'),
    API = 'http://lcboapi.com/';

function start() {
    request(API + 'products/', function(err, res) {
        if (err) console.error(err);
        res = JSON.parse(res.body);
        var total = res.pager.total_pages,
            pages = [],
            q = queue(1);

        while (--total > 0) pages.push(total);

        pages.forEach(function(p) {
            q.defer(function(url, callback) {
                page(url, callback);
            }, API + 'products?page=' + p);
        });

        q.awaitAll(function(err, data) {
            if (err) console.error(err);
            data = _(data).flatten();
            console.log(data.length + ' Vintages found.');
            fs.writeFileSync('data/data.json', JSON.stringify(data));
        });
    });
}

function page(url, callback) {
    request(url, function(err, res) {
        if (err) callback(err);
        res = JSON.parse(res.body);
        console.log('Reading page ' + res.pager.current_page);
        res = res.result.filter(function(item) {
            return item.stock_type === 'VINTAGES' &&
                   item.primary_category === 'Wine';
        });

        callback(null, res);
    });
}

start();
