var fs = require('fs');

fs.readFile('data.json', 'utf8', function(err, data) {
    data = JSON.parse(data);
    var titles = {};

    data.map(function(d) {
        titles[d.id] = d.name;
    });

    fs.writeFileSync('../titles.json', JSON.stringify(titles));
});
