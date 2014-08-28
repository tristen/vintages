var fs = require('fs');

fs.readFile('data.json', 'utf8', function(err, data) {
    data = JSON.parse(data);
    var titles = {};

    data.map(function(d) {
        titles[d.id] = {
            name: d.name,
            description: d.description,
            notes: d.tasting_note,
            producer: d.producer_name,
            origin: d.origin,
            price: d.price_in_cents,
            img: d.image_thumb_url
        };
    });

    fs.writeFileSync('titles.json', JSON.stringify(titles));
});
