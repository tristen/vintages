(function() {
require('./js/d3');
var search = require('./src/search.js');
search.primetitles('data/titles.json');

var LCBO  = 'http://www.lcbo.com/lcbo/search?searchTerm=';
var TOKEN = 'pk.eyJ1IjoidHJpc3RlbiIsImEiOiJiUzBYOEJzIn0.VyXs9qNWgTfABLzSI3YcrQ';
var MAPID = 'tristen.jfooa3j0';

L.mapbox.accessToken = TOKEN;
var $search = d3.select('#search');
var $autocomplete = d3.select('#autocomplete');
var $results = d3.select('#results');
var map;

function buildmap(sel, callback) {
    if (map) map.remove();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var id = sel.attr('id').split('-')[1];
            var coords = position.coords;
            var url = 'http://lcboapi.com/products/' + id + '/stores?geo=' +
                coords.latitude + '+' + coords.longitude + '&per_page=5&callback=d3.jsonp.products';

            d3.jsonp(url, function(res) {
                if (!res.result || !res.result.length) {
                    return callback('No store locations near you carry stock.');
                }
                var geojson = buildgeojson(res.result);
                map = L.mapbox.map('map-' + id, MAPID, {
                    attributionControl: false,
                    infoControl: true
                });
                var locations = L.mapbox.featureLayer().addTo(map);
                    locations.setGeoJSON(geojson);

                locations.eachLayer(function(store) {
                    var props = store.feature.properties;
                    var m = L.divIcon({
                        className: 'location-point digits-' + props.quantity.toString().length,
                        iconSize: [25,45],
                        html: props.quantity,
                        popupAnchor: [0, -25]
                    });

                    var content = document.createElement('div');
                    var quantity = document.createElement('h4');
                        quantity.innerHTML = props.quantity + ' in stock.';

                    var hours = document.createElement('a');
                        hours.innerHTML = 'Store details';
                        hours.target = '_blank';
                        hours.href = props.storeURL;

                    var address = document.createElement('div');
                        address.className = 'small quiet';
                        address.innerHTML = props.address + ' ' +
                                            props.city;

                    content.appendChild(quantity);
                    content.appendChild(address);
                    content.appendChild(hours);

                    store.setIcon(m);
                    store.bindPopup(content);
                });

                map.fitBounds(locations.getBounds());
                callback(null);
            });
        });
    } else {
        callback('Geolocation is not supported.');
    }
}

function buildgeojson(data) {
    return data.reduce(function(memo, item) {
        memo.push({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [item.longitude, item.latitude]
            },
            "properties": {
                "quantity": item.quantity,
                "city": item.city,
                "address": item.address_line_1,
                "storeURL": 'http://lcbosearch.com/stores/' + item.id
            }
        });
        return memo;
    }, []);
}

function buildResults(d) {
    var result = d3.select(this);
    var item = result.append('div')
        .attr('class', 'col12 clearfix');

    var details = item.append('div')
        .attr('class', 'col10 pad0y pad0x');

    details.append('img')
        .attr('class', 'block fl')
        .attr('data-error', 'img/missing.png')
        .attr('src', d.item.img)
        .on('error', function() {
            d3.select(this)
                .attr('src', d3.select(this).attr('data-error'));
        });

    var title = details.append('h3')
        .attr('class', 'block strong');

    title.append('a')
        .attr('href', '#')
        .attr('class', 'truncate')
        .html(d.item.name)
        .on('click', function() {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            if (result.classed('active')) {
                result.classed('active', false);
            } else {
                d3.selectAll('.item').classed('active', false);
                result.classed('active', true);
                var map = result.select('.map');
                map.classed('loading', true);
                buildmap(map, function(err) {
                    if (err) {
                        result.select('label').text(err);
                        map.classed('error', true);
                    }
                    map.classed('loading', false);
                });
            }
        });


    var meta = details.append('div')
        .attr('class', 'meta small quiet')

    meta.append('span')
        .attr('class', 'sprite flag ' + normalizeClass(d.item.origin));

    meta.append('span')
        .html(d.item.producer);

    meta.append('span')
        .html(d.item.origin);

    meta.append('a')
        .attr('href', LCBO + d.item.id)
        .attr('target', '_blank')
        .text('LCBO');

    item.append('span')
        .attr('class', 'text-right col2 pad1x pad2y')
        .text('$' + d.item.price / 100);

    // Exanded results.
    var expand = result.append('div')
        .attr('class', 'expand col12 small');

    if (d.item.description) {
        expand.append('div')
            .attr('class', 'prose')
            .html(d.item.description);
    }

    if (d.item.notes) {
        expand.append('div')
            .attr('class', 'prose')
            .html(d.item.notes);
    }

    var map = expand.append('div')
        .attr('class', 'map contain animate loading')
        .attr('id', 'map-' + d.id);

    map.append('label')
        .attr('class', 'map-label')
        .html('Closest store locations with stock');
}

function normalizeClass(input) {
    return input.split(',')[0].toLowerCase().replace(/\s/g, '-');
}

function keyup() {
    $results.html('');
    $autocomplete.html('');

    if (this.value) {
        window.location.hash = '#' + this.value.trim().split(/\s+/).join('+');

        search.query(this.value, function(results) {
            $results
                .selectAll('div')
                .data(results)
                .enter()
                .append('div')
                    .attr('class', 'keyline-bottom item col12 clearfix')
                    .each(buildResults);
        });

        search.autocomplete(this.value, function(results) {
            $autocomplete
                .selectAll('a')
                .data(results)
                .enter()
                .append('a')
                    .text(function(d) { return d; })
                    .attr('href', '#')
                    .on('click', function() {
                        d3.event.preventDefault();
                        d3.event.stopPropagation();
                        $search
                            .attr('value', this.textContent)
                            .each(keyup);
                    });
        });
    }
}

d3.select('body').classed('loading', true);
d3.json('data/data.json', function(err, res) {
    if (err) return console.error('data.json could not be found.');
    d3.select('body').classed('loading', false);
    $search
        .attr('placeholder', 'Search ' + res.length + ' wines')
        .on('keyup', keyup);

    var val = ('object' === typeof window.location.hash.slice('+')) ?
        window.location.hash.slice('+').join(' ') :
        window.location.hash;

    if (window.location.hash) {
        $search
            .attr('value', val.replace(/#/g, '').replace(/\+/g, ' '))
            .each(keyup);
    }
});

})();
