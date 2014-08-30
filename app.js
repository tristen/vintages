L.mapbox.accessToken = 'pk.eyJ1IjoidHJpc3RlbiIsImEiOiJiUzBYOEJzIn0.VyXs9qNWgTfABLzSI3YcrQ';

var indexes = {},
    PRODUCT_URL = 'http://www.lcbo.com/lcbo/search?searchTerm=',
    data;

$.getJSON('data.json', function(res) {
    data = res;
    $('#search').attr('placeholder', 'Search ' + data.length + ' wines');
    var val = ('object' === typeof window.location.hash.slice('+')) ?
        window.location.hash.slice('+').join(' ') :
        window.location.hash;

    if (window.location.hash) {
        $search.val(val.replace(/#/g, '').replace(/\+/g, ' ')).keyup();
    }
});

var $search = $('#search');
var $autocomplete = $('#autocomplete');
var $results = $('#results');
var s = search();

function badthumbs() {
    $('img').error(function() {
        $(this).attr({
            'src' :  $(this).attr('data-error')
        });
    });
}

function buildmap(el, callback) {
    var $map = el.find('.map');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var id = $map.attr('id').split('-')[1];
            var p = position.coords;
            var url = 'http://lcboapi.com/products/' + id + '/stores?callback=?' +
                '&geo=' + p.latitude + '+' + p.longitude +
                '&per_page=5';

            $.getJSON(url, function(res) {
                if (!res.result || !res.result.length) return callback('No store locations near you carry stock.');
                var geojson = buildgeojson(res.result);
                var map = L.mapbox.map('map-' + id, 'tristen.map-4s93c8qx', {
                    attributionControl: false,
                    infoControl: true
                });
                var locations = L.mapbox.featureLayer().addTo(map);
                    locations.setGeoJSON(geojson);

                locations.eachLayer(function(store) {
                    var props = store.feature.properties;
                    var m = L.divIcon({
                        className: 'location-point',
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
        }, function() {
            callback('Request failed.');
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

$search.keyup(function(e) {
    $autocomplete.empty();
    window.location.hash = '#' + this.value.trim().split(/\s+/).join('+');
    if (this.value) {
        s.autocomplete(this.value, function(results) {
            $autocomplete.empty();
            for (var i = 0; i < results.length; i++) {
                var a = document.createElement('a');
                a.innerHTML = results[i];
                a.href = '#';
                a.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var s = $('#search').val();
                    var terms = s.split(/\s+/);
                    if (!terms) return;
                    terms[terms.length - 1] = this.innerHTML;
                    $('#search').val(terms.join(' ')).keyup().focus();
                };
                $autocomplete.append(a);
                $autocomplete.append(' ');
            }
        });
    }
});

$search.keyup(function(e) {
    $results.empty();
    if (this.value) {
        s.query(this.value, function(results) {
            for (var i = 0; i < results.length; i++) {
                var d = results[i].item;

                var item = document.createElement('div');
                    item.className = 'keyline-bottom item col12 clearfix';

                var expand = document.createElement('div');
                    expand.className = 'expand col12 small';

                if (d.description) {
                    var description = document.createElement('div');
                        description.innerHTML = d.description;
                        description.className = 'prose';
                        expand.appendChild(description);
                }
                if (d.notes) {
                    var notes = document.createElement('div');
                        notes.innerHTML = d.notes;
                        notes.className = 'prose';
                        expand.appendChild(notes);
                }
                var map = document.createElement('div');
                    map.className = 'map contain animate loading';
                    map.id = 'map-' + results[i].id;

                var mapTitle = document.createElement('label');
                    mapTitle.className = 'map-label';
                    mapTitle.innerHTML = 'Closest store locations with stock';

                map.appendChild(mapTitle);
                expand.appendChild(map);

                var result = document.createElement('div');
                    result.className = 'col12 clearfix';

                var details = document.createElement('div');
                    details.className = 'col10 pad0y pad0x';
                var thumb = document.createElement('img');
                    thumb.className = 'block fl';
                    thumb.src = d.img;
                    thumb.setAttribute('data-error', 'img/missing.png');
                var h3 = document.createElement('h3');
                    h3.className = 'block strong';
                var a = document.createElement('a');
                    a.href = '#';
                    a.className = 'js-product truncate';
                    a.innerHTML = d.name;
                    h3.appendChild(a);

                var meta = document.createElement('div');
                    meta.className = 'meta small quiet';

                var flag = document.createElement('span');
                    flag.className = 'sprite flag ' + d.origin.split(',')[0].toLowerCase().replace(/\s/g, '-');
                var producer = document.createElement('span');
                    producer.innerHTML = d.producer;
                    producer.className = 'small';
                var origin = document.createElement('span');
                    origin.innerHTML = d.origin;
                    origin.className = 'small';
                var lcbo = document.createElement('a');
                    lcbo.href = PRODUCT_URL + results[i].id;
                    lcbo.target = '_blank';
                    lcbo.innerHTML = 'LCBO';

                var price = document.createElement('span');
                    price.className = 'text-right col2 pad1x pad2y';
                    price.innerHTML = '$' + d.price / 100;

                details.appendChild(thumb);
                details.appendChild(h3);

                meta.appendChild(flag);
                meta.appendChild(origin);
                meta.appendChild(producer);
                meta.appendChild(lcbo);

                details.appendChild(meta);

                result.appendChild(details);
                result.appendChild(price);

                item.appendChild(result);
                item.appendChild(expand);
                $results[0].appendChild(item);
            }

            $('.js-product').on('click', function() {
                var $item = $(this).parents('.item');
                if ($item.is('.active')) {
                    $item.removeClass('active');
                } else {
                    $('.item').removeClass('active');
                    $item.addClass('active');
                    buildmap($item.find('.expand'), function(err) {
                        if (err) {
                            $item.find('label').text(err);
                            $item.find('.map').addClass('error');
                        }
                        $item.find('.map').removeClass('loading');
                    });
                }
                return false;
            });

            badthumbs();
        });
    }
});
