var indexes = {}, data;
$.getJSON('data.json', function(res) {
    res = data;
});

var $autocomplete = $('#autocomplete');
var s = search();

$('#search').keyup(function(e) {
    if (this.value) {
        s.query(this.value, function(results) {
            $autocomplete.empty();
            for (var i = 0; i < results.length; i++) {
                var h3 = document.createElement('h3');
                var a = document.createElement('a');
                a.href = '#';
                a.innerHTML = results[i]['data.name'];
                h3.appendChild(a);
                $autocomplete[0].appendChild(h3);
            }
        });
    }
});
