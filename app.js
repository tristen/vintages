var indexes = {}, titles;
$.getJSON('titles.json', function(o) {
    titles = o;
});

var $output = $('#output');
var $autocomplete = $('#autocomplete');
var s = search();

$('#search').keyup(function(e) {
    if (this.value) {
        s.query(this.value, function(results) {
            $output.empty();
            for (var i = 0; i < results.length; i++) {
                var h3 = document.createElement('h3');
                var a = document.createElement('a');
                a.href = '#';
                a.innerHTML = results[i].title;
                h3.appendChild(a);
                $output[0].appendChild(h3);
            }
        });
    }
});
