;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
(function(){!function(){
  var d3 = {version: "3.4.13"}; // semver
function d3_functor(v) {
  return typeof v === "function" ? v : function() { return v; };
}

d3.functor = d3_functor;
var d3_nsPrefix = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

d3.ns = {
  prefix: d3_nsPrefix,
  qualify: function(name) {
    var i = name.indexOf(":"),
        prefix = name;
    if (i >= 0) {
      prefix = name.slice(0, i);
      name = name.slice(i + 1);
    }
    return d3_nsPrefix.hasOwnProperty(prefix)
        ? {space: d3_nsPrefix[prefix], local: name}
        : name;
  }
};
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}
function d3_class(ctor, properties) {
  for (var key in properties) {
    Object.defineProperty(ctor.prototype, key, {
      value: properties[key],
      enumerable: false
    });
  }
}

d3.map = function(object) {
  var map = new d3_Map;
  if (object instanceof d3_Map) object.forEach(function(key, value) { map.set(key, value); });
  else for (var key in object) map.set(key, object[key]);
  return map;
};

function d3_Map() {
  this._ = Object.create(null);
}

var d3_map_proto = "__proto__",
    d3_map_zero = "\0";

d3_class(d3_Map, {
  has: d3_map_has,
  get: function(key) {
    return this._[d3_map_escape(key)];
  },
  set: function(key, value) {
    return this._[d3_map_escape(key)] = value;
  },
  remove: d3_map_remove,
  keys: d3_map_keys,
  values: function() {
    var values = [];
    for (var key in this._) values.push(this._[key]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var key in this._) entries.push({key: d3_map_unescape(key), value: this._[key]});
    return entries;
  },
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
  }
});

function d3_map_escape(key) {
  return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
}

function d3_map_unescape(key) {
  return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
}

function d3_map_has(key) {
  return d3_map_escape(key) in this._;
}

function d3_map_remove(key) {
  return (key = d3_map_escape(key)) in this._ && delete this._[key];
}

function d3_map_keys() {
  var keys = [];
  for (var key in this._) keys.push(d3_map_unescape(key));
  return keys;
}

function d3_map_size() {
  var size = 0;
  for (var key in this._) ++size;
  return size;
}

function d3_map_empty() {
  for (var key in this._) return false;
  return true;
}

d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i >= 0) {
    name = type.slice(i + 1);
    type = type.slice(0, i);
  }

  if (type) return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);

  if (arguments.length === 2) {
    if (listener == null) for (type in this) {
      if (this.hasOwnProperty(type)) this[type].on(name, null);
    }
    return this;
  }
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}

d3.event = null;

function d3_eventPreventDefault() {
  d3.event.preventDefault();
}

function d3_eventSource() {
  var e = d3.event, s;
  while (s = e.sourceEvent) e = s;
  return e;
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var dispatch = new d3_dispatch,
      i = 0,
      n = arguments.length;

  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}
var d3_arraySlice = [].slice,
    d3_array = function(list) { return d3_arraySlice.call(list); }; // conversion for NodeLists

var d3_document = document,
    d3_documentElement = d3_document.documentElement,
    d3_window = window;

// Redefine d3_array if the browser doesn’t support slice-based conversion.
try {
  d3_array(d3_documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = function(list) {
    var i = list.length, array = new Array(i);
    while (i--) array[i] = list[i];
    return array;
  };
}

d3.mouse = function(container) {
  return d3_mousePoint(container, d3_eventSource());
};

// https://bugs.webkit.org/show_bug.cgi?id=44083
var d3_mouse_bug44083 = /WebKit/.test(d3_window.navigator.userAgent) ? -1 : 0;

function d3_mousePoint(container, e) {
  if (e.changedTouches) e = e.changedTouches[0];
  var svg = container.ownerSVGElement || container;
  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    if (d3_mouse_bug44083 < 0 && (d3_window.scrollX || d3_window.scrollY)) {
      svg = d3.select("body").append("svg").style({
        position: "absolute",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        border: "none"
      }, "important");
      var ctm = svg[0][0].getScreenCTM();
      d3_mouse_bug44083 = !(ctm.f || ctm.e);
      svg.remove();
    }
    if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY;
    else point.x = e.clientX, point.y = e.clientY;
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return [point.x, point.y];
  }
  var rect = container.getBoundingClientRect();
  return [e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop];
};

d3.touch = function(container, touches, identifier) {
  if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
  if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return d3_mousePoint(container, touch);
    }
  }
};

d3.touches = function(container, touches) {
  if (arguments.length < 2) touches = d3_eventSource().touches;
  return touches ? d3_array(touches).map(function(touch) {
    var point = d3_mousePoint(container, touch);
    point.identifier = touch.identifier;
    return point;
  }) : [];
};
function d3_vendorSymbol(object, name) {
  if (name in object) return name;
  name = name.charAt(0).toUpperCase() + name.slice(1);
  for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
    var prefixName = d3_vendorPrefixes[i] + name;
    if (prefixName in object) return prefixName;
  }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_active, // active timer object
    d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) { setTimeout(callback, 17); };

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();

  // Add the callback to the tail of the queue.
  var time = then + delay, timer = {c: callback, t: time, f: false, n: null};
  if (d3_timer_queueTail) d3_timer_queueTail.n = timer;
  else d3_timer_queueHead = timer;
  d3_timer_queueTail = timer;

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
};

function d3_timer_step() {
  var now = d3_timer_mark(),
      delay = d3_timer_sweep() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  d3_timer_mark();
  d3_timer_sweep();
};

function d3_timer_mark() {
  var now = Date.now();
  d3_timer_active = d3_timer_queueHead;
  while (d3_timer_active) {
    if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
    d3_timer_active = d3_timer_active.n;
  }
  return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
  var t0,
      t1 = d3_timer_queueHead,
      time = Infinity;
  while (t1) {
    if (t1.f) {
      t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
    } else {
      if (t1.t < time) time = t1.t;
      t1 = (t0 = t1).n;
    }
  }
  d3_timer_queueTail = t0;
  return time;
}
var d3_subclass = {}.__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(object, prototype) {
  object.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(object, prototype) {
  for (var property in prototype) object[property] = prototype[property];
};

function d3_selection(groups) {
  d3_subclass(groups, d3_selectionPrototype);
  return groups;
}

var d3_select = function(s, n) { return n.querySelector(s); },
    d3_selectAll = function(s, n) { return n.querySelectorAll(s); },
    d3_selectMatcher = d3_documentElement.matches || d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")],
    d3_selectMatches = function(n, s) { return d3_selectMatcher.call(n, s); };

// Prefer Sizzle, if available.
if (typeof Sizzle === "function") {
  d3_select = function(s, n) { return Sizzle(s, n)[0] || null; };
  d3_selectAll = Sizzle;
  d3_selectMatches = Sizzle.matchesSelector;
}

d3.selection = function() {
  return d3_selectionRoot;
};

var d3_selectionPrototype = d3.selection.prototype = [];


d3_selectionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      group,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(subnode = selector.call(node, node.__data__, i, j));
        if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selector(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_select(selector, this);
  };
}

d3_selectionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      node;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
        subgroup.parentNode = node;
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selectorAll(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_selectAll(selector, this);
  };
}

d3_selectionPrototype.attr = function(name, value) {
  if (arguments.length < 2) {

    // For attr(string), return the attribute value for the first node.
    if (typeof name === "string") {
      var node = this.node();
      name = d3.ns.qualify(name);
      return name.local
          ? node.getAttributeNS(name.space, name.local)
          : node.getAttribute(name);
    }

    // For attr(object), the object specifies the names and values of the
    // attributes to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_attr(value, name[value]));
    return this;
  }

  return this.each(d3_selection_attr(name, value));
};

function d3_selection_attr(name, value) {
  name = d3.ns.qualify(name);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrConstant() {
    this.setAttribute(name, value);
  }
  function attrConstantNS() {
    this.setAttributeNS(name.space, name.local, value);
  }

  // For attr(string, function), evaluate the function for each element, and set
  // or remove the attribute as appropriate.
  function attrFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttribute(name);
    else this.setAttribute(name, x);
  }
  function attrFunctionNS() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttributeNS(name.space, name.local);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return value == null
      ? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
      ? (name.local ? attrFunctionNS : attrFunction)
      : (name.local ? attrConstantNS : attrConstant));
}
function d3_collapse(s) {
  return s.trim().replace(/\s+/g, " ");
}
d3.requote = function(s) {
  return s.replace(d3_requote_re, "\\$&");
};

var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

d3_selectionPrototype.classed = function(name, value) {
  if (arguments.length < 2) {

    // For classed(string), return true only if the first node has the specified
    // class or classes. Note that even if the browser supports DOMTokenList, it
    // probably doesn't support it on SVG elements (which can be animated).
    if (typeof name === "string") {
      var node = this.node(),
          n = (name = d3_selection_classes(name)).length,
          i = -1;
      if (value = node.classList) {
        while (++i < n) if (!value.contains(name[i])) return false;
      } else {
        value = node.getAttribute("class");
        while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
      }
      return true;
    }

    // For classed(object), the object specifies the names of classes to add or
    // remove. The values may be functions that are evaluated for each element.
    for (value in name) this.each(d3_selection_classed(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_classed(name, value));
};

function d3_selection_classedRe(name) {
  return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
}

function d3_selection_classes(name) {
  return (name + "").trim().split(/^|\s+/);
}

// Multiple class names are allowed (e.g., "foo bar").
function d3_selection_classed(name, value) {
  name = d3_selection_classes(name).map(d3_selection_classedName);
  var n = name.length;

  function classedConstant() {
    var i = -1;
    while (++i < n) name[i](this, value);
  }

  // When the value is a function, the function is still evaluated only once per
  // element even if there are multiple class names.
  function classedFunction() {
    var i = -1, x = value.apply(this, arguments);
    while (++i < n) name[i](this, x);
  }

  return typeof value === "function"
      ? classedFunction
      : classedConstant;
}

function d3_selection_classedName(name) {
  var re = d3_selection_classedRe(name);
  return function(node, value) {
    if (c = node.classList) return value ? c.add(name) : c.remove(name);
    var c = node.getAttribute("class") || "";
    if (value) {
      re.lastIndex = 0;
      if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
    } else {
      node.setAttribute("class", d3_collapse(c.replace(re, " ")));
    }
  };
}

d3_selectionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
      return this;
    }

    // For style(string), return the computed style value for the first node.
    if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // Otherwise, a name, value and priority are specified, and handled as below.
  return this.each(d3_selection_style(name, value, priority));
};

function d3_selection_style(name, value, priority) {

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  function styleConstant() {
    this.style.setProperty(name, value, priority);
  }

  // For style(name, function) or style(name, function, priority), evaluate the
  // function for each element, and set or remove the style property as
  // appropriate. When setting, use the specified priority.
  function styleFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.style.removeProperty(name);
    else this.style.setProperty(name, x, priority);
  }

  return value == null
      ? styleNull : (typeof value === "function"
      ? styleFunction : styleConstant);
}

d3_selectionPrototype.property = function(name, value) {
  if (arguments.length < 2) {

    // For property(string), return the property value for the first node.
    if (typeof name === "string") return this.node()[name];

    // For property(object), the object specifies the names and values of the
    // properties to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_property(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_property(name, value));
};

function d3_selection_property(name, value) {

  // For property(name, null), remove the property with the specified name.
  function propertyNull() {
    delete this[name];
  }

  // For property(name, string), set the property with the specified name.
  function propertyConstant() {
    this[name] = value;
  }

  // For property(name, function), evaluate the function for each element, and
  // set or remove the property as appropriate.
  function propertyFunction() {
    var x = value.apply(this, arguments);
    if (x == null) delete this[name];
    else this[name] = x;
  }

  return value == null
      ? propertyNull : (typeof value === "function"
      ? propertyFunction : propertyConstant);
}

d3_selectionPrototype.text = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.textContent = v == null ? "" : v; } : value == null
      ? function() { this.textContent = ""; }
      : function() { this.textContent = value; })
      : this.node().textContent;
};

d3_selectionPrototype.html = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.innerHTML = v == null ? "" : v; } : value == null
      ? function() { this.innerHTML = ""; }
      : function() { this.innerHTML = value; })
      : this.node().innerHTML;
};

d3_selectionPrototype.append = function(name) {
  name = d3_selection_creator(name);
  return this.select(function() {
    return this.appendChild(name.apply(this, arguments));
  });
};

function d3_selection_creator(name) {
  return typeof name === "function" ? name
      : (name = d3.ns.qualify(name)).local ? function() { return this.ownerDocument.createElementNS(name.space, name.local); }
      : function() { return this.ownerDocument.createElementNS(this.namespaceURI, name); };
}

d3_selectionPrototype.insert = function(name, before) {
  name = d3_selection_creator(name);
  before = d3_selection_selector(before);
  return this.select(function() {
    return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
  });
};

// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
d3_selectionPrototype.remove = function() {
  return this.each(function() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  });
};

d3.set = function(array) {
  var set = new d3_Set;
  if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
  return set;
};

function d3_Set() {
  this._ = Object.create(null);
}

d3_class(d3_Set, {
  has: d3_map_has,
  add: function(key) {
    this._[d3_map_escape(key += "")] = true;
    return key;
  },
  remove: d3_map_remove,
  values: d3_map_keys,
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var key in this._) f.call(this, d3_map_unescape(key));
  }
});

d3_selectionPrototype.data = function(value, key) {
  var i = -1,
      n = this.length,
      group,
      node;

  // If no value is specified, return the first value.
  if (!arguments.length) {
    value = new Array(n = (group = this[0]).length);
    while (++i < n) {
      if (node = group[i]) {
        value[i] = node.__data__;
      }
    }
    return value;
  }

  function bind(group, groupData) {
    var i,
        n = group.length,
        m = groupData.length,
        n0 = Math.min(n, m),
        updateNodes = new Array(m),
        enterNodes = new Array(m),
        exitNodes = new Array(n),
        node,
        nodeData;

    if (key) {
      var nodeByKeyValue = new d3_Map,
          keyValues = new Array(n),
          keyValue;

      for (i = -1; ++i < n;) {
        if (nodeByKeyValue.has(keyValue = key.call(node = group[i], node.__data__, i))) {
          exitNodes[i] = node; // duplicate selection key
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
        keyValues[i] = keyValue;
      }

      for (i = -1; ++i < m;) {
        if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        } else if (node !== true) { // no duplicate data key
          updateNodes[i] = node;
          node.__data__ = nodeData;
        }
        nodeByKeyValue.set(keyValue, true);
      }

      for (i = -1; ++i < n;) {
        if (nodeByKeyValue.get(keyValues[i]) !== true) {
          exitNodes[i] = group[i];
        }
      }
    } else {
      for (i = -1; ++i < n0;) {
        node = group[i];
        nodeData = groupData[i];
        if (node) {
          node.__data__ = nodeData;
          updateNodes[i] = node;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
      }
      for (; i < m; ++i) {
        enterNodes[i] = d3_selection_dataNode(groupData[i]);
      }
      for (; i < n; ++i) {
        exitNodes[i] = group[i];
      }
    }

    enterNodes.update
        = updateNodes;

    enterNodes.parentNode
        = updateNodes.parentNode
        = exitNodes.parentNode
        = group.parentNode;

    enter.push(enterNodes);
    update.push(updateNodes);
    exit.push(exitNodes);
  }

  var enter = d3_selection_enter([]),
      update = d3_selection([]),
      exit = d3_selection([]);

  if (typeof value === "function") {
    while (++i < n) {
      bind(group = this[i], value.call(group, group.parentNode.__data__, i));
    }
  } else {
    while (++i < n) {
      bind(group = this[i], value);
    }
  }

  update.enter = function() { return enter; };
  update.exit = function() { return exit; };
  return update;
};

function d3_selection_dataNode(data) {
  return {__data__: data};
}

d3_selectionPrototype.datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.property("__data__");
};

d3_selectionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
        subgroup.push(node);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_filter(selector) {
  return function() {
    return d3_selectMatches(this, selector);
  };
}

d3_selectionPrototype.order = function() {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
};
d3.ascending = d3_ascending;

function d3_ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

d3_selectionPrototype.sort = function(comparator) {
  comparator = d3_selection_sortComparator.apply(this, arguments);
  for (var j = -1, m = this.length; ++j < m;) this[j].sort(comparator);
  return this.order();
};

function d3_selection_sortComparator(comparator) {
  if (!arguments.length) comparator = d3_ascending;
  return function(a, b) {
    return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
  };
}
function d3_noop() {}

d3_selectionPrototype.on = function(type, listener, capture) {
  var n = arguments.length;
  if (n < 3) {

    // For on(object) or on(object, boolean), the object specifies the event
    // types and listeners to add or remove. The optional boolean specifies
    // whether the listener captures events.
    if (typeof type !== "string") {
      if (n < 2) listener = false;
      for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
      return this;
    }

    // For on(string), return the listener for the first node.
    if (n < 2) return (n = this.node()["__on" + type]) && n._;

    // For on(string, function), use the default capture.
    capture = false;
  }

  // Otherwise, a type, listener and capture are specified, and handled as below.
  return this.each(d3_selection_on(type, listener, capture));
};

function d3_selection_on(type, listener, capture) {
  var name = "__on" + type,
      i = type.indexOf("."),
      wrap = d3_selection_onListener;

  if (i > 0) type = type.slice(0, i);
  var filter = d3_selection_onFilters.get(type);
  if (filter) type = filter, wrap = d3_selection_onFilter;

  function onRemove() {
    var l = this[name];
    if (l) {
      this.removeEventListener(type, l, l.$);
      delete this[name];
    }
  }

  function onAdd() {
    var l = wrap(listener, d3_array(arguments));
    onRemove.call(this);
    this.addEventListener(type, this[name] = l, l.$ = capture);
    l._ = listener;
  }

  function removeAll() {
    var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"),
        match;
    for (var name in this) {
      if (match = name.match(re)) {
        var l = this[name];
        this.removeEventListener(match[1], l, l.$);
        delete this[name];
      }
    }
  }

  return i
      ? listener ? onAdd : onRemove
      : listener ? d3_noop : removeAll;
}

var d3_selection_onFilters = d3.map({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
});

d3_selection_onFilters.forEach(function(k) {
  if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
});

function d3_selection_onListener(listener, argumentz) {
  return function(e) {
    var o = d3.event; // Events can be reentrant (e.g., focus).
    d3.event = e;
    argumentz[0] = this.__data__;
    try {
      listener.apply(this, argumentz);
    } finally {
      d3.event = o;
    }
  };
}

function d3_selection_onFilter(listener, argumentz) {
  var l = d3_selection_onListener(listener, argumentz);
  return function(e) {
    var target = this, related = e.relatedTarget;
    if (!related || (related !== target && !(related.compareDocumentPosition(target) & 8))) {
      l.call(target, e);
    }
  };
}

d3_selectionPrototype.each = function(callback) {
  return d3_selection_each(this, function(node, i, j) {
    callback.call(node, node.__data__, i, j);
  });
};

function d3_selection_each(groups, callback) {
  for (var j = 0, m = groups.length; j < m; j++) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
      if (node = group[i]) callback(node, i, j);
    }
  }
  return groups;
}

d3_selectionPrototype.call = function(callback) {
  var args = d3_array(arguments);
  callback.apply(args[0] = this, args);
  return this;
};

d3_selectionPrototype.empty = function() {
  return !this.node();
};

d3_selectionPrototype.node = function() {
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
};

d3_selectionPrototype.size = function() {
  var n = 0;
  d3_selection_each(this, function() { ++n; });
  return n;
};

function d3_selection_enter(selection) {
  d3_subclass(selection, d3_selection_enterPrototype);
  return selection;
}

var d3_selection_enterPrototype = [];

d3.selection.enter = d3_selection_enter;
d3.selection.enter.prototype = d3_selection_enterPrototype;

d3_selection_enterPrototype.append = d3_selectionPrototype.append;
d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
d3_selection_enterPrototype.node = d3_selectionPrototype.node;
d3_selection_enterPrototype.call = d3_selectionPrototype.call;
d3_selection_enterPrototype.size = d3_selectionPrototype.size;


d3_selection_enterPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      upgroup,
      group,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    upgroup = (group = this[j]).update;
    subgroups.push(subgroup = []);
    subgroup.parentNode = group.parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
        subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

d3_selection_enterPrototype.insert = function(name, before) {
  if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
  return d3_selectionPrototype.insert.call(this, name, before);
};

function d3_selection_enterInsertBefore(enter) {
  var i0, j0;
  return function(d, i, j) {
    var group = enter[j].update,
        n = group.length,
        node;
    if (j != j0) j0 = j, i0 = 0;
    if (i >= i0) i0 = i + 1;
    while (!(node = group[i0]) && ++i0 < n);
    return node;
  };
}

// import "../transition/transition";

d3_selectionPrototype.transition = function() {
  var id = d3_transitionInheritId || ++d3_transitionId,
      subgroups = [],
      subgroup,
      node,
      transition = d3_transitionInherit || {time: Date.now(), ease: d3_ease_cubicInOut, delay: 0, duration: 250};

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) d3_transitionNode(node, i, id, transition);
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, id);
};
// import "../transition/transition";

d3_selectionPrototype.interrupt = function() {
  return this.each(d3_selection_interrupt);
};

function d3_selection_interrupt() {
  var lock = this.__transition__;
  if (lock) ++lock.active;
}

// TODO fast singleton implementation?
d3.select = function(node) {
  var group = [typeof node === "string" ? d3_select(node, d3_document) : node];
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

d3.selectAll = function(nodes) {
  var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

var d3_selectionRoot = d3.select(d3_documentElement);
var d3_time = d3.time = {},
    d3_date = Date;

function d3_date_utc() {
  this._ = new Date(arguments.length > 1
      ? Date.UTC.apply(this, arguments)
      : arguments[0]);
}

d3_date_utc.prototype = {
  getDate: function() { return this._.getUTCDate(); },
  getDay: function() { return this._.getUTCDay(); },
  getFullYear: function() { return this._.getUTCFullYear(); },
  getHours: function() { return this._.getUTCHours(); },
  getMilliseconds: function() { return this._.getUTCMilliseconds(); },
  getMinutes: function() { return this._.getUTCMinutes(); },
  getMonth: function() { return this._.getUTCMonth(); },
  getSeconds: function() { return this._.getUTCSeconds(); },
  getTime: function() { return this._.getTime(); },
  getTimezoneOffset: function() { return 0; },
  valueOf: function() { return this._.valueOf(); },
  setDate: function() { d3_time_prototype.setUTCDate.apply(this._, arguments); },
  setDay: function() { d3_time_prototype.setUTCDay.apply(this._, arguments); },
  setFullYear: function() { d3_time_prototype.setUTCFullYear.apply(this._, arguments); },
  setHours: function() { d3_time_prototype.setUTCHours.apply(this._, arguments); },
  setMilliseconds: function() { d3_time_prototype.setUTCMilliseconds.apply(this._, arguments); },
  setMinutes: function() { d3_time_prototype.setUTCMinutes.apply(this._, arguments); },
  setMonth: function() { d3_time_prototype.setUTCMonth.apply(this._, arguments); },
  setSeconds: function() { d3_time_prototype.setUTCSeconds.apply(this._, arguments); },
  setTime: function() { d3_time_prototype.setTime.apply(this._, arguments); }
};

var d3_time_prototype = Date.prototype;
function d3_identity(d) {
  return d;
}
function d3_format_precision(x, p) {
  return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
}
d3.round = function(x, n) {
  return n
      ? Math.round(x * (n = Math.pow(10, n))) / n
      : Math.round(x);
};
var abs = Math.abs;

var d3_formatPrefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"].map(d3_formatPrefix);

d3.formatPrefix = function(value, precision) {
  var i = 0;
  if (value) {
    if (value < 0) value *= -1;
    if (precision) value = d3.round(value, d3_format_precision(value, precision));
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
  }
  return d3_formatPrefixes[8 + i / 3];
};

function d3_formatPrefix(d, i) {
  var k = Math.pow(10, abs(8 - i) * 3);
  return {
    scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
    symbol: d
  };
}

function d3_locale_numberFormat(locale) {
  var locale_decimal = locale.decimal,
      locale_thousands = locale.thousands,
      locale_grouping = locale.grouping,
      locale_currency = locale.currency,
      formatGroup = locale_grouping && locale_thousands ? function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = locale_grouping[0],
            length = 0;
        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = locale_grouping[j = (j + 1) % locale_grouping.length];
        }
        return t.reverse().join(locale_thousands);
      } : d3_identity;

  return function(specifier) {
    var match = d3_format_re.exec(specifier),
        fill = match[1] || " ",
        align = match[2] || ">",
        sign = match[3] || "-",
        symbol = match[4] || "",
        zfill = match[5],
        width = +match[6],
        comma = match[7],
        precision = match[8],
        type = match[9],
        scale = 1,
        prefix = "",
        suffix = "",
        integer = false,
        exponent = true;

    if (precision) precision = +precision.substring(1);

    if (zfill || fill === "0" && align === "=") {
      zfill = fill = "0";
      align = "=";
    }

    switch (type) {
      case "n": comma = true; type = "g"; break;
      case "%": scale = 100; suffix = "%"; type = "f"; break;
      case "p": scale = 100; suffix = "%"; type = "r"; break;
      case "b":
      case "o":
      case "x":
      case "X": if (symbol === "#") prefix = "0" + type.toLowerCase();
      case "c": exponent = false;
      case "d": integer = true; precision = 0; break;
      case "s": scale = -1; type = "r"; break;
    }

    if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];

    // If no precision is specified for r, fallback to general notation.
    if (type == "r" && !precision) type = "g";

    // Ensure that the requested precision is in the supported range.
    if (precision != null) {
      if (type == "g") precision = Math.max(1, Math.min(21, precision));
      else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
    }

    type = d3_format_types.get(type) || d3_format_typeDefault;

    var zcomma = zfill && comma;

    return function(value) {
      var fullSuffix = suffix;

      // Return the empty string for floats formatted as ints.
      if (integer && (value % 1)) return "";

      // Convert negative to positive, and record the sign prefix.
      var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;

      // Apply the scale, computing it from the value's exponent for si format.
      // Preserve the existing suffix, if any, such as the currency symbol.
      if (scale < 0) {
        var unit = d3.formatPrefix(value, precision);
        value = unit.scale(value);
        fullSuffix = unit.symbol + suffix;
      } else {
        value *= scale;
      }

      // Convert to the desired precision.
      value = type(value, precision);

      // Break the value into the integer part (before) and decimal part (after).
      var i = value.lastIndexOf("."),
          before,
          after;
      if (i < 0) {
        // If there is no decimal, break on "e" where appropriate.
        var j = exponent ? value.lastIndexOf("e") : -1;
        if (j < 0) before = value, after = "";
        else before = value.substring(0, j), after = value.substring(j);
      } else {
        before = value.substring(0, i);
        after = locale_decimal + value.substring(i + 1);
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (!zfill && comma) before = formatGroup(before, Infinity);

      var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length),
          padding = length < width ? new Array(length = width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);

      // Apply prefix.
      negative += prefix;

      // Rejoin integer and decimal parts.
      value = before + after;

      return (align === "<" ? negative + value + padding
            : align === ">" ? padding + negative + value
            : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length)
            : negative + (zcomma ? value : padding + value)) + fullSuffix;
    };
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;

var d3_format_types = d3.map({
  b: function(x) { return x.toString(2); },
  c: function(x) { return String.fromCharCode(x); },
  o: function(x) { return x.toString(8); },
  x: function(x) { return x.toString(16); },
  X: function(x) { return x.toString(16).toUpperCase(); },
  g: function(x, p) { return x.toPrecision(p); },
  e: function(x, p) { return x.toExponential(p); },
  f: function(x, p) { return x.toFixed(p); },
  r: function(x, p) { return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p)))); }
});

function d3_format_typeDefault(x) {
  return x + "";
}

function d3_time_interval(local, step, number) {

  function round(date) {
    var d0 = local(date), d1 = offset(d0, 1);
    return date - d0 < d1 - date ? d0 : d1;
  }

  function ceil(date) {
    step(date = local(new d3_date(date - 1)), 1);
    return date;
  }

  function offset(date, k) {
    step(date = new d3_date(+date), k);
    return date;
  }

  function range(t0, t1, dt) {
    var time = ceil(t0), times = [];
    if (dt > 1) {
      while (time < t1) {
        if (!(number(time) % dt)) times.push(new Date(+time));
        step(time, 1);
      }
    } else {
      while (time < t1) times.push(new Date(+time)), step(time, 1);
    }
    return times;
  }

  function range_utc(t0, t1, dt) {
    try {
      d3_date = d3_date_utc;
      var utc = new d3_date_utc();
      utc._ = t0;
      return range(utc, t1, dt);
    } finally {
      d3_date = Date;
    }
  }

  local.floor = local;
  local.round = round;
  local.ceil = ceil;
  local.offset = offset;
  local.range = range;

  var utc = local.utc = d3_time_interval_utc(local);
  utc.floor = utc;
  utc.round = d3_time_interval_utc(round);
  utc.ceil = d3_time_interval_utc(ceil);
  utc.offset = d3_time_interval_utc(offset);
  utc.range = range_utc;

  return local;
}

function d3_time_interval_utc(method) {
  return function(date, k) {
    try {
      d3_date = d3_date_utc;
      var utc = new d3_date_utc();
      utc._ = date;
      return method(utc, k)._;
    } finally {
      d3_date = Date;
    }
  };
}

d3_time.year = d3_time_interval(function(date) {
  date = d3_time.day(date);
  date.setMonth(0, 1);
  return date;
}, function(date, offset) {
  date.setFullYear(date.getFullYear() + offset);
}, function(date) {
  return date.getFullYear();
});

d3_time.years = d3_time.year.range;
d3_time.years.utc = d3_time.year.utc.range;

d3_time.day = d3_time_interval(function(date) {
  var day = new d3_date(2000, 0);
  day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return day;
}, function(date, offset) {
  date.setDate(date.getDate() + offset);
}, function(date) {
  return date.getDate() - 1;
});

d3_time.days = d3_time.day.range;
d3_time.days.utc = d3_time.day.utc.range;

d3_time.dayOfYear = function(date) {
  var year = d3_time.year(date);
  return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
};

["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach(function(day, i) {
  i = 7 - i;

  var interval = d3_time[day] = d3_time_interval(function(date) {
    (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
    return date;
  }, function(date, offset) {
    date.setDate(date.getDate() + Math.floor(offset) * 7);
  }, function(date) {
    var day = d3_time.year(date).getDay();
    return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
  });

  d3_time[day + "s"] = interval.range;
  d3_time[day + "s"].utc = interval.utc.range;

  d3_time[day + "OfYear"] = function(date) {
    var day = d3_time.year(date).getDay();
    return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
  };
});

d3_time.week = d3_time.sunday;
d3_time.weeks = d3_time.sunday.range;
d3_time.weeks.utc = d3_time.sunday.utc.range;
d3_time.weekOfYear = d3_time.sundayOfYear;

function d3_locale_timeFormat(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_days = locale.days,
      locale_shortDays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  function d3_time_format(template) {
    var n = template.length;

    function format(date) {
      var string = [],
          i = -1,
          j = 0,
          c,
          p,
          f;
      while (++i < n) {
        if (template.charCodeAt(i) === 37) {
          string.push(template.slice(j, i));
          if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
          if (f = d3_time_formats[c]) c = f(date, p == null ? (c === "e" ? " " : "0") : p);
          string.push(c);
          j = i + 1;
        }
      }
      string.push(template.slice(j, i));
      return string.join("");
    }

    format.parse = function(string) {
      var d = {y: 1900, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0, Z: null},
          i = d3_time_parse(d, template, string, 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // If a time zone is specified, it is always relative to UTC;
      // we need to use d3_date_utc if we aren’t already.
      var localZ = d.Z != null && d3_date !== d3_date_utc,
          date = new (localZ ? d3_date_utc : d3_date);

      // Set year, month, date.
      if ("j" in d) date.setFullYear(d.y, 0, d.j);
      else if ("w" in d && ("W" in d || "U" in d)) {
        date.setFullYear(d.y, 0, 1);
        date.setFullYear(d.y, 0, "W" in d
            ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7
            :  d.w          + d.U * 7 - (date.getDay() + 6) % 7);
      } else date.setFullYear(d.y, d.m, d.d);

      // Set hours, minutes, seconds and milliseconds.
      date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);

      return localZ ? date._ : date;
    };

    format.toString = function() {
      return template;
    };

    return format;
  }

  function d3_time_parse(date, template, string, j) {
    var c,
        p,
        t,
        i = 0,
        n = template.length,
        m = string.length;
    while (i < n) {
      if (j >= m) return -1;
      c = template.charCodeAt(i++);
      if (c === 37) {
        t = template.charAt(i++);
        p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
        if (!p || ((j = p(date, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }

  d3_time_format.utc = function(template) {
    var local = d3_time_format(template);

    function format(date) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date();
        utc._ = date;
        return local(utc);
      } finally {
        d3_date = Date;
      }
    }

    format.parse = function(string) {
      try {
        d3_date = d3_date_utc;
        var date = local.parse(string);
        return date && date._;
      } finally {
        d3_date = Date;
      }
    };

    format.toString = local.toString;

    return format;
  };

  d3_time_format.multi =
  d3_time_format.utc.multi = d3_time_formatMulti;

  var d3_time_periodLookup = d3.map(),
      d3_time_dayRe = d3_time_formatRe(locale_days),
      d3_time_dayLookup = d3_time_formatLookup(locale_days),
      d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays),
      d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays),
      d3_time_monthRe = d3_time_formatRe(locale_months),
      d3_time_monthLookup = d3_time_formatLookup(locale_months),
      d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths),
      d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);

  locale_periods.forEach(function(p, i) {
    d3_time_periodLookup.set(p.toLowerCase(), i);
  });

  var d3_time_formats = {
    a: function(d) { return locale_shortDays[d.getDay()]; },
    A: function(d) { return locale_days[d.getDay()]; },
    b: function(d) { return locale_shortMonths[d.getMonth()]; },
    B: function(d) { return locale_months[d.getMonth()]; },
    c: d3_time_format(locale_dateTime),
    d: function(d, p) { return d3_time_formatPad(d.getDate(), p, 2); },
    e: function(d, p) { return d3_time_formatPad(d.getDate(), p, 2); },
    H: function(d, p) { return d3_time_formatPad(d.getHours(), p, 2); },
    I: function(d, p) { return d3_time_formatPad(d.getHours() % 12 || 12, p, 2); },
    j: function(d, p) { return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3); },
    L: function(d, p) { return d3_time_formatPad(d.getMilliseconds(), p, 3); },
    m: function(d, p) { return d3_time_formatPad(d.getMonth() + 1, p, 2); },
    M: function(d, p) { return d3_time_formatPad(d.getMinutes(), p, 2); },
    p: function(d) { return locale_periods[+(d.getHours() >= 12)]; },
    S: function(d, p) { return d3_time_formatPad(d.getSeconds(), p, 2); },
    U: function(d, p) { return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2); },
    w: function(d) { return d.getDay(); },
    W: function(d, p) { return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2); },
    x: d3_time_format(locale_date),
    X: d3_time_format(locale_time),
    y: function(d, p) { return d3_time_formatPad(d.getFullYear() % 100, p, 2); },
    Y: function(d, p) { return d3_time_formatPad(d.getFullYear() % 10000, p, 4); },
    Z: d3_time_zone,
    "%": function() { return "%"; }
  };

  var d3_time_parsers = {
    a: d3_time_parseWeekdayAbbrev,
    A: d3_time_parseWeekday,
    b: d3_time_parseMonthAbbrev,
    B: d3_time_parseMonth,
    c: d3_time_parseLocaleFull,
    d: d3_time_parseDay,
    e: d3_time_parseDay,
    H: d3_time_parseHour24,
    I: d3_time_parseHour24,
    j: d3_time_parseDayOfYear,
    L: d3_time_parseMilliseconds,
    m: d3_time_parseMonthNumber,
    M: d3_time_parseMinutes,
    p: d3_time_parseAmPm,
    S: d3_time_parseSeconds,
    U: d3_time_parseWeekNumberSunday,
    w: d3_time_parseWeekdayNumber,
    W: d3_time_parseWeekNumberMonday,
    x: d3_time_parseLocaleDate,
    X: d3_time_parseLocaleTime,
    y: d3_time_parseYear,
    Y: d3_time_parseFullYear,
    Z: d3_time_parseZone,
    "%": d3_time_parseLiteralPercent
  };

  function d3_time_parseWeekdayAbbrev(date, string, i) {
    d3_time_dayAbbrevRe.lastIndex = 0;
    var n = d3_time_dayAbbrevRe.exec(string.slice(i));
    return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseWeekday(date, string, i) {
    d3_time_dayRe.lastIndex = 0;
    var n = d3_time_dayRe.exec(string.slice(i));
    return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseMonthAbbrev(date, string, i) {
    d3_time_monthAbbrevRe.lastIndex = 0;
    var n = d3_time_monthAbbrevRe.exec(string.slice(i));
    return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseMonth(date, string, i) {
    d3_time_monthRe.lastIndex = 0;
    var n = d3_time_monthRe.exec(string.slice(i));
    return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseLocaleFull(date, string, i) {
    return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
  }

  function d3_time_parseLocaleDate(date, string, i) {
    return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
  }

  function d3_time_parseLocaleTime(date, string, i) {
    return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
  }

  function d3_time_parseAmPm(date, string, i) {
    var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
    return n == null ? -1 : (date.p = n, i);
  }

  return d3_time_format;
}

var d3_time_formatPads = {"-": "", "_": " ", "0": "0"},
    d3_time_numberRe = /^\s*\d+/, // note: ignores next directive
    d3_time_percentRe = /^%/;

function d3_time_formatPad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function d3_time_formatRe(names) {
  return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
}

function d3_time_formatLookup(names) {
  var map = new d3_Map, i = -1, n = names.length;
  while (++i < n) map.set(names[i].toLowerCase(), i);
  return map;
}

function d3_time_parseWeekdayNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 1));
  return n ? (date.w = +n[0], i + n[0].length) : -1;
}

function d3_time_parseWeekNumberSunday(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i));
  return n ? (date.U = +n[0], i + n[0].length) : -1;
}

function d3_time_parseWeekNumberMonday(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i));
  return n ? (date.W = +n[0], i + n[0].length) : -1;
}

function d3_time_parseFullYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 4));
  return n ? (date.y = +n[0], i + n[0].length) : -1;
}

function d3_time_parseYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
}

function d3_time_parseZone(date, string, i) {
  return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5))
      ? (date.Z = -string, i + 5) // sign differs from getTimezoneOffset!
      : -1;
}

function d3_time_expandYear(d) {
  return d + (d > 68 ? 1900 : 2000);
}

function d3_time_parseMonthNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
}

function d3_time_parseDay(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.d = +n[0], i + n[0].length) : -1;
}

function d3_time_parseDayOfYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 3));
  return n ? (date.j = +n[0], i + n[0].length) : -1;
}

// Note: we don't validate that the hour is in the range [0,23] or [1,12].
function d3_time_parseHour24(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.H = +n[0], i + n[0].length) : -1;
}

function d3_time_parseMinutes(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.M = +n[0], i + n[0].length) : -1;
}

function d3_time_parseSeconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.S = +n[0], i + n[0].length) : -1;
}

function d3_time_parseMilliseconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 3));
  return n ? (date.L = +n[0], i + n[0].length) : -1;
}

// TODO table of time zone offset names?
function d3_time_zone(d) {
  var z = d.getTimezoneOffset(),
      zs = z > 0 ? "-" : "+",
      zh = abs(z) / 60 | 0,
      zm = abs(z) % 60;
  return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
}

function d3_time_parseLiteralPercent(date, string, i) {
  d3_time_percentRe.lastIndex = 0;
  var n = d3_time_percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function d3_time_formatMulti(formats) {
  var n = formats.length, i = -1;
  while (++i < n) formats[i][0] = this(formats[i][0]);
  return function(date) {
    var i = 0, f = formats[i];
    while (!f[1](date)) f = formats[++i];
    return f[0](date);
  };
}

d3.locale = function(locale) {
  return {
    numberFormat: d3_locale_numberFormat(locale),
    timeFormat: d3_locale_timeFormat(locale)
  };
};

var d3_locale_enUS = d3.locale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
  dateTime: "%a %b %e %X %Y",
  date: "%m/%d/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;

var d3_time_formatUtc = d3_time_format.utc;

var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");

d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z")
    ? d3_time_formatIsoNative
    : d3_time_formatIso;

function d3_time_formatIsoNative(date) {
  return date.toISOString();
}

d3_time_formatIsoNative.parse = function(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
};

d3_time_formatIsoNative.toString = d3_time_formatIso.toString;

d3_time.second = d3_time_interval(function(date) {
  return new d3_date(Math.floor(date / 1e3) * 1e3);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 1e3); // DST breaks setSeconds
}, function(date) {
  return date.getSeconds();
});

d3_time.seconds = d3_time.second.range;
d3_time.seconds.utc = d3_time.second.utc.range;

d3_time.minute = d3_time_interval(function(date) {
  return new d3_date(Math.floor(date / 6e4) * 6e4);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 6e4); // DST breaks setMinutes
}, function(date) {
  return date.getMinutes();
});

d3_time.minutes = d3_time.minute.range;
d3_time.minutes.utc = d3_time.minute.utc.range;

d3_time.hour = d3_time_interval(function(date) {
  var timezone = date.getTimezoneOffset() / 60;
  return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 36e5); // DST breaks setHours
}, function(date) {
  return date.getHours();
});

d3_time.hours = d3_time.hour.range;
d3_time.hours.utc = d3_time.hour.utc.range;

d3_time.month = d3_time_interval(function(date) {
  date = d3_time.day(date);
  date.setDate(1);
  return date;
}, function(date, offset) {
  date.setMonth(date.getMonth() + offset);
}, function(date) {
  return date.getMonth();
});

d3_time.months = d3_time.month.range;
d3_time.months.utc = d3_time.month.utc.range;

function d3_bisector(compare) {
  return {
    left: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

var d3_bisect = d3_bisector(d3_ascending);
d3.bisectLeft = d3_bisect.left;
d3.bisect = d3.bisectRight = d3_bisect.right;

d3.bisector = function(f) {
  return d3_bisector(f.length === 1
      ? function(d, x) { return d3_ascending(f(d), x); }
      : f);
};

d3.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step === Infinity) throw new Error("infinite range");
  var range = [],
       k = d3_range_integerScale(abs(step)),
       i = -1,
       j;
  start *= k, stop *= k, step *= k;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
  else while ((j = start + step * ++i) < stop) range.push(j / k);
  return range;
};

function d3_range_integerScale(x) {
  var k = 1;
  while (x * k % 1) k *= 10;
  return k;
}
function d3_true() {
  return true;
}
d3.color = d3_color;

function d3_color() {}

d3_color.prototype.toString = function() {
  return this.rgb() + "";
};

d3.hsl = d3_hsl;

function d3_hsl(h, s, l) {
  return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l)
      : arguments.length < 2 ? (h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l)
      : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl))
      : new d3_hsl(h, s, l);
}

var d3_hslPrototype = d3_hsl.prototype = new d3_color;

d3_hslPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_hsl(this.h, this.s, this.l / k);
};

d3_hslPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_hsl(this.h, this.s, k * this.l);
};

d3_hslPrototype.rgb = function() {
  return d3_hsl_rgb(this.h, this.s, this.l);
};

function d3_hsl_rgb(h, s, l) {
  var m1,
      m2;

  /* Some simple corrections for h, s and l. */
  h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
  s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;

  /* From FvD 13.37, CSS Color Module Level 3 */
  m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
  m1 = 2 * l - m2;

  function v(h) {
    if (h > 360) h -= 360;
    else if (h < 0) h += 360;
    if (h < 60) return m1 + (m2 - m1) * h / 60;
    if (h < 180) return m2;
    if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
    return m1;
  }

  function vv(h) {
    return Math.round(v(h) * 255);
  }

  return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
}
var π = Math.PI,
    τ = 2 * π,
    halfπ = π / 2,
    ε = 1e-6,
    ε2 = ε * ε,
    d3_radians = π / 180,
    d3_degrees = 180 / π;

function d3_sgn(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
function d3_cross2d(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function d3_acos(x) {
  return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
}

function d3_asin(x) {
  return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
}

function d3_sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function d3_cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function d3_tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

function d3_haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

d3.hcl = d3_hcl;

function d3_hcl(h, c, l) {
  return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l)
      : arguments.length < 2 ? (h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l)
      : (h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b)
      : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b)))
      : new d3_hcl(h, c, l);
}

var d3_hclPrototype = d3_hcl.prototype = new d3_color;

d3_hclPrototype.brighter = function(k) {
  return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.darker = function(k) {
  return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.rgb = function() {
  return d3_hcl_lab(this.h, this.c, this.l).rgb();
};

function d3_hcl_lab(h, c, l) {
  if (isNaN(h)) h = 0;
  if (isNaN(c)) c = 0;
  return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
}

d3.lab = d3_lab;

function d3_lab(l, a, b) {
  return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b)
      : arguments.length < 2 ? (l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b)
      : (l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l)
      : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b)))
      : new d3_lab(l, a, b);
}

// Corresponds roughly to RGB brighter/darker
var d3_lab_K = 18;

// D65 standard referent
var d3_lab_X = 0.950470,
    d3_lab_Y = 1,
    d3_lab_Z = 1.088830;

var d3_labPrototype = d3_lab.prototype = new d3_color;

d3_labPrototype.brighter = function(k) {
  return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.darker = function(k) {
  return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.rgb = function() {
  return d3_lab_rgb(this.l, this.a, this.b);
};

function d3_lab_rgb(l, a, b) {
  var y = (l + 16) / 116,
      x = y + a / 500,
      z = y - b / 200;
  x = d3_lab_xyz(x) * d3_lab_X;
  y = d3_lab_xyz(y) * d3_lab_Y;
  z = d3_lab_xyz(z) * d3_lab_Z;
  return new d3_rgb(
    d3_xyz_rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    d3_xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
    d3_xyz_rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z)
  );
}

function d3_lab_hcl(l, a, b) {
  return l > 0
      ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l)
      : new d3_hcl(NaN, NaN, l);
}

function d3_lab_xyz(x) {
  return x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
}
function d3_xyz_lab(x) {
  return x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
}

function d3_xyz_rgb(r) {
  return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
}

d3.rgb = d3_rgb;

function d3_rgb(r, g, b) {
  return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b)
      : arguments.length < 2 ? (r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b)
      : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb))
      : new d3_rgb(r, g, b);
}

function d3_rgbNumber(value) {
  return new d3_rgb(value >> 16, value >> 8 & 0xff, value & 0xff);
}

function d3_rgbString(value) {
  return d3_rgbNumber(value) + "";
}

var d3_rgbPrototype = d3_rgb.prototype = new d3_color;

d3_rgbPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  var r = this.r,
      g = this.g,
      b = this.b,
      i = 30;
  if (!r && !g && !b) return new d3_rgb(i, i, i);
  if (r && r < i) r = i;
  if (g && g < i) g = i;
  if (b && b < i) b = i;
  return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
};

d3_rgbPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_rgb(k * this.r, k * this.g, k * this.b);
};

d3_rgbPrototype.hsl = function() {
  return d3_rgb_hsl(this.r, this.g, this.b);
};

d3_rgbPrototype.toString = function() {
  return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
};

function d3_rgb_hex(v) {
  return v < 0x10
      ? "0" + Math.max(0, v).toString(16)
      : Math.min(255, v).toString(16);
}

function d3_rgb_parse(format, rgb, hsl) {
  var r = 0, // red channel; int in [0, 255]
      g = 0, // green channel; int in [0, 255]
      b = 0, // blue channel; int in [0, 255]
      m1, // CSS color specification match
      m2, // CSS color specification type (e.g., rgb)
      color;

  /* Handle hsl, rgb. */
  m1 = /([a-z]+)\((.*)\)/i.exec(format);
  if (m1) {
    m2 = m1[2].split(",");
    switch (m1[1]) {
      case "hsl": {
        return hsl(
          parseFloat(m2[0]), // degrees
          parseFloat(m2[1]) / 100, // percentage
          parseFloat(m2[2]) / 100 // percentage
        );
      }
      case "rgb": {
        return rgb(
          d3_rgb_parseNumber(m2[0]),
          d3_rgb_parseNumber(m2[1]),
          d3_rgb_parseNumber(m2[2])
        );
      }
    }
  }

  /* Named colors. */
  if (color = d3_rgb_names.get(format)) return rgb(color.r, color.g, color.b);

  /* Hexadecimal colors: #rgb and #rrggbb. */
  if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
    if (format.length === 4) {
      r = (color & 0xf00) >> 4; r = (r >> 4) | r;
      g = (color & 0xf0); g = (g >> 4) | g;
      b = (color & 0xf); b = (b << 4) | b;
    } else if (format.length === 7) {
      r = (color & 0xff0000) >> 16;
      g = (color & 0xff00) >> 8;
      b = (color & 0xff);
    }
  }

  return rgb(r, g, b);
}

function d3_rgb_hsl(r, g, b) {
  var min = Math.min(r /= 255, g /= 255, b /= 255),
      max = Math.max(r, g, b),
      d = max - min,
      h,
      s,
      l = (max + min) / 2;
  if (d) {
    s = l < .5 ? d / (max + min) : d / (2 - max - min);
    if (r == max) h = (g - b) / d + (g < b ? 6 : 0);
    else if (g == max) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  } else {
    h = NaN;
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new d3_hsl(h, s, l);
}

function d3_rgb_lab(r, g, b) {
  r = d3_rgb_xyz(r);
  g = d3_rgb_xyz(g);
  b = d3_rgb_xyz(b);
  var x = d3_xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / d3_lab_X),
      y = d3_xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / d3_lab_Y),
      z = d3_xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / d3_lab_Z);
  return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
}

function d3_rgb_xyz(r) {
  return (r /= 255) <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
}

function d3_rgb_parseNumber(c) { // either integer or percentage
  var f = parseFloat(c);
  return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
}

var d3_rgb_names = d3.map({
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
});

d3_rgb_names.forEach(function(key, value) {
  d3_rgb_names.set(key, d3_rgbNumber(value));
});

d3.interpolateRgb = d3_interpolateRgb;

function d3_interpolateRgb(a, b) {
  a = d3.rgb(a);
  b = d3.rgb(b);
  var ar = a.r,
      ag = a.g,
      ab = a.b,
      br = b.r - ar,
      bg = b.g - ag,
      bb = b.b - ab;
  return function(t) {
    return "#"
        + d3_rgb_hex(Math.round(ar + br * t))
        + d3_rgb_hex(Math.round(ag + bg * t))
        + d3_rgb_hex(Math.round(ab + bb * t));
  };
}

d3.interpolateObject = d3_interpolateObject;

function d3_interpolateObject(a, b) {
  var i = {},
      c = {},
      k;
  for (k in a) {
    if (k in b) {
      i[k] = d3_interpolate(a[k], b[k]);
    } else {
      c[k] = a[k];
    }
  }
  for (k in b) {
    if (!(k in a)) {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

d3.interpolateArray = d3_interpolateArray;

function d3_interpolateArray(a, b) {
  var x = [],
      c = [],
      na = a.length,
      nb = b.length,
      n0 = Math.min(a.length, b.length),
      i;
  for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
  for (; i < na; ++i) c[i] = a[i];
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < n0; ++i) c[i] = x[i](t);
    return c;
  };
}
d3.interpolateNumber = d3_interpolateNumber;

function d3_interpolateNumber(a, b) {
  a = +a, b = +b;
  return function(t) { return a * (1 - t) + b * t; };
}

d3.interpolateString = d3_interpolateString;

function d3_interpolateString(a, b) {
  var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = d3_interpolate_numberA.exec(a))
      && (bm = d3_interpolate_numberB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: d3_interpolateNumber(am, bm)});
    }
    bi = d3_interpolate_numberB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2
      ? (q[0] ? (b = q[0].x, function(t) { return b(t) + ""; })
      : function() { return b; })
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");

d3.interpolate = d3_interpolate;

function d3_interpolate(a, b) {
  var i = d3.interpolators.length, f;
  while (--i >= 0 && !(f = d3.interpolators[i](a, b)));
  return f;
}

d3.interpolators = [
  function(a, b) {
    var t = typeof b;
    return (t === "string" ? (d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) ? d3_interpolateRgb : d3_interpolateString)
        : b instanceof d3_color ? d3_interpolateRgb
        : Array.isArray(b) ? d3_interpolateArray
        : t === "object" && isNaN(b) ? d3_interpolateObject
        : d3_interpolateNumber)(a, b);
  }
];
d3.interpolateRound = d3_interpolateRound;

function d3_interpolateRound(a, b) {
  b -= a;
  return function(t) { return Math.round(a + b * t); };
}
function d3_uninterpolateNumber(a, b) {
  b = (b -= a = +a) || 1 / b;
  return function(x) { return (x - a) / b; };
}

function d3_uninterpolateClamp(a, b) {
  b = (b -= a = +a) || 1 / b;
  return function(x) { return Math.max(0, Math.min(1, (x - a) / b)); };
}

d3.format = d3_locale_enUS.numberFormat;
function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
  var u = uninterpolate(domain[0], domain[1]),
      i = interpolate(range[0], range[1]);
  return function(x) {
    return i(u(x));
  };
}

function d3_scale_nice(domain, nice) {
  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      dx;

  if (x1 < x0) {
    dx = i0, i0 = i1, i1 = dx;
    dx = x0, x0 = x1, x1 = dx;
  }

  domain[i0] = nice.floor(x0);
  domain[i1] = nice.ceil(x1);
  return domain;
}

function d3_scale_niceStep(step) {
  return step ? {
    floor: function(x) { return Math.floor(x / step) * step; },
    ceil: function(x) { return Math.ceil(x / step) * step; }
  } : d3_scale_niceIdentity;
}

var d3_scale_niceIdentity = {
  floor: d3_identity,
  ceil: d3_identity
};

function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
  var u = [],
      i = [],
      j = 0,
      k = Math.min(domain.length, range.length) - 1;

  // Handle descending domains.
  if (domain[k] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++j <= k) {
    u.push(uninterpolate(domain[j - 1], domain[j]));
    i.push(interpolate(range[j - 1], range[j]));
  }

  return function(x) {
    var j = d3.bisect(domain, x, 1, k) - 1;
    return i[j](u[j](x));
  };
}
d3.scale = {};

function d3_scaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}

function d3_scaleRange(scale) {
  return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
}

d3.scale.linear = function() {
  return d3_scale_linear([0, 1], [0, 1], d3_interpolate, false);
};

function d3_scale_linear(domain, range, interpolate, clamp) {
  var output,
      input;

  function rescale() {
    var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear,
        uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
    output = linear(domain, range, uninterpolate, interpolate);
    input = linear(range, domain, uninterpolate, d3_interpolate);
    return scale;
  }

  function scale(x) {
    return output(x);
  }

  // Note: requires range is coercible to number!
  scale.invert = function(y) {
    return input(y);
  };

  scale.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x.map(Number);
    return rescale();
  };

  scale.range = function(x) {
    if (!arguments.length) return range;
    range = x;
    return rescale();
  };

  scale.rangeRound = function(x) {
    return scale.range(x).interpolate(d3_interpolateRound);
  };

  scale.clamp = function(x) {
    if (!arguments.length) return clamp;
    clamp = x;
    return rescale();
  };

  scale.interpolate = function(x) {
    if (!arguments.length) return interpolate;
    interpolate = x;
    return rescale();
  };

  scale.ticks = function(m) {
    return d3_scale_linearTicks(domain, m);
  };

  scale.tickFormat = function(m, format) {
    return d3_scale_linearTickFormat(domain, m, format);
  };

  scale.nice = function(m) {
    d3_scale_linearNice(domain, m);
    return rescale();
  };

  scale.copy = function() {
    return d3_scale_linear(domain, range, interpolate, clamp);
  };

  return rescale();
}

function d3_scale_linearRebind(scale, linear) {
  return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
}

function d3_scale_linearNice(domain, m) {
  return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
}

function d3_scale_linearTickRange(domain, m) {
  if (m == null) m = 10;

  var extent = d3_scaleExtent(domain),
      span = extent[1] - extent[0],
      step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)),
      err = m / span * step;

  // Filter ticks to get closer to the desired count.
  if (err <= .15) step *= 10;
  else if (err <= .35) step *= 5;
  else if (err <= .75) step *= 2;

  // Round start and stop values to step interval.
  extent[0] = Math.ceil(extent[0] / step) * step;
  extent[1] = Math.floor(extent[1] / step) * step + step * .5; // inclusive
  extent[2] = step;
  return extent;
}

function d3_scale_linearTicks(domain, m) {
  return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
}

function d3_scale_linearTickFormat(domain, m, format) {
  var range = d3_scale_linearTickRange(domain, m);
  if (format) {
    var match = d3_format_re.exec(format);
    match.shift();
    if (match[8] === "s") {
      var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
      if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
      match[8] = "f";
      format = d3.format(match.join(""));
      return function(d) {
        return format(prefix.scale(d)) + prefix.symbol;
      };
    }
    if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
    format = match.join("");
  } else {
    format = ",." + d3_scale_linearPrecision(range[2]) + "f";
  }
  return d3.format(format);
}

var d3_scale_linearFormatSignificant = {s: 1, g: 1, p: 1, r: 1, e: 1};

// Returns the number of significant digits after the decimal point.
function d3_scale_linearPrecision(value) {
  return -Math.floor(Math.log(value) / Math.LN10 + .01);
}

// For some format types, the precision specifies the number of significant
// digits; for others, it specifies the number of digits after the decimal
// point. For significant format types, the desired precision equals one plus
// the difference between the decimal precision of the range’s maximum absolute
// value and the tick step’s decimal precision. For format "e", the digit before
// the decimal point counts as one.
function d3_scale_linearFormatPrecision(type, range) {
  var p = d3_scale_linearPrecision(range[2]);
  return type in d3_scale_linearFormatSignificant
      ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e")
      : p - (type === "%") * 2;
}

function d3_time_scale(linear, methods, format) {

  function scale(x) {
    return linear(x);
  }

  scale.invert = function(x) {
    return d3_time_scaleDate(linear.invert(x));
  };

  scale.domain = function(x) {
    if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
    linear.domain(x);
    return scale;
  };

  function tickMethod(extent, count) {
    var span = extent[1] - extent[0],
        target = span / count,
        i = d3.bisect(d3_time_scaleSteps, target);
    return i == d3_time_scaleSteps.length ? [methods.year, d3_scale_linearTickRange(extent.map(function(d) { return d / 31536e6; }), count)[2]]
        : !i ? [d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2]]
        : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
  }

  scale.nice = function(interval, skip) {
    var domain = scale.domain(),
        extent = d3_scaleExtent(domain),
        method = interval == null ? tickMethod(extent, 10)
          : typeof interval === "number" && tickMethod(extent, interval);

    if (method) interval = method[0], skip = method[1];

    function skipped(date) {
      return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
    }

    return scale.domain(d3_scale_nice(domain, skip > 1 ? {
      floor: function(date) {
        while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
        return date;
      },
      ceil: function(date) {
        while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
        return date;
      }
    } : interval));
  };

  scale.ticks = function(interval, skip) {
    var extent = d3_scaleExtent(scale.domain()),
        method = interval == null ? tickMethod(extent, 10)
          : typeof interval === "number" ? tickMethod(extent, interval)
          : !interval.range && [{range: interval}, skip]; // assume deprecated range function

    if (method) interval = method[0], skip = method[1];

    return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip); // inclusive upper bound
  };

  scale.tickFormat = function() {
    return format;
  };

  scale.copy = function() {
    return d3_time_scale(linear.copy(), methods, format);
  };

  return d3_scale_linearRebind(scale, linear);
}

function d3_time_scaleDate(t) {
  return new Date(t);
}

var d3_time_scaleSteps = [
  1e3,    // 1-second
  5e3,    // 5-second
  15e3,   // 15-second
  3e4,    // 30-second
  6e4,    // 1-minute
  3e5,    // 5-minute
  9e5,    // 15-minute
  18e5,   // 30-minute
  36e5,   // 1-hour
  108e5,  // 3-hour
  216e5,  // 6-hour
  432e5,  // 12-hour
  864e5,  // 1-day
  1728e5, // 2-day
  6048e5, // 1-week
  2592e6, // 1-month
  7776e6, // 3-month
  31536e6 // 1-year
];

var d3_time_scaleLocalMethods = [
  [d3_time.second, 1],
  [d3_time.second, 5],
  [d3_time.second, 15],
  [d3_time.second, 30],
  [d3_time.minute, 1],
  [d3_time.minute, 5],
  [d3_time.minute, 15],
  [d3_time.minute, 30],
  [d3_time.hour, 1],
  [d3_time.hour, 3],
  [d3_time.hour, 6],
  [d3_time.hour, 12],
  [d3_time.day, 1],
  [d3_time.day, 2],
  [d3_time.week, 1],
  [d3_time.month, 1],
  [d3_time.month, 3],
  [d3_time.year, 1]
];

var d3_time_scaleLocalFormat = d3_time_format.multi([
  [".%L", function(d) { return d.getMilliseconds(); }],
  [":%S", function(d) { return d.getSeconds(); }],
  ["%I:%M", function(d) { return d.getMinutes(); }],
  ["%I %p", function(d) { return d.getHours(); }],
  ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
  ["%b %d", function(d) { return d.getDate() != 1; }],
  ["%B", function(d) { return d.getMonth(); }],
  ["%Y", d3_true]
]);

var d3_time_scaleMilliseconds = {
  range: function(start, stop, step) { return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate); },
  floor: d3_identity,
  ceil: d3_identity
};

d3_time_scaleLocalMethods.year = d3_time.year;

d3_time.scale = function() {
  return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
};

var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
  return [m[0].utc, m[1]];
});

var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([
  [".%L", function(d) { return d.getUTCMilliseconds(); }],
  [":%S", function(d) { return d.getUTCSeconds(); }],
  ["%I:%M", function(d) { return d.getUTCMinutes(); }],
  ["%I %p", function(d) { return d.getUTCHours(); }],
  ["%a %d", function(d) { return d.getUTCDay() && d.getUTCDate() != 1; }],
  ["%b %d", function(d) { return d.getUTCDate() != 1; }],
  ["%B", function(d) { return d.getUTCMonth(); }],
  ["%Y", d3_true]
]);

d3_time_scaleUtcMethods.year = d3_time.year.utc;

d3_time.scale.utc = function() {
  return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
};

d3.xhr = d3_xhrType(d3_identity);

function d3_xhrType(response) {
  return function(url, mimeType, callback) {
    if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, mimeType = null;
    return d3_xhr(url, mimeType, response, callback);
  };
}

function d3_xhr(url, mimeType, response, callback) {
  var xhr = {},
      dispatch = d3.dispatch("beforesend", "progress", "load", "error"),
      headers = {},
      request = new XMLHttpRequest,
      responseType = null;

  // If IE does not support CORS, use XDomainRequest.
  if (d3_window.XDomainRequest
      && !("withCredentials" in request)
      && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest;

  "onload" in request
      ? request.onload = request.onerror = respond
      : request.onreadystatechange = function() { request.readyState > 3 && respond(); };

  function respond() {
    var status = request.status, result;
    if (!status && d3_xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
      try {
        result = response.call(xhr, request);
      } catch (e) {
        dispatch.error.call(xhr, e);
        return;
      }
      dispatch.load.call(xhr, result);
    } else {
      dispatch.error.call(xhr, request);
    }
  }

  request.onprogress = function(event) {
    var o = d3.event;
    d3.event = event;
    try { dispatch.progress.call(xhr, request); }
    finally { d3.event = o; }
  };

  xhr.header = function(name, value) {
    name = (name + "").toLowerCase();
    if (arguments.length < 2) return headers[name];
    if (value == null) delete headers[name];
    else headers[name] = value + "";
    return xhr;
  };

  // If mimeType is non-null and no Accept header is set, a default is used.
  xhr.mimeType = function(value) {
    if (!arguments.length) return mimeType;
    mimeType = value == null ? null : value + "";
    return xhr;
  };

  // Specifies what type the response value should take;
  // for instance, arraybuffer, blob, document, or text.
  xhr.responseType = function(value) {
    if (!arguments.length) return responseType;
    responseType = value;
    return xhr;
  };

  // Specify how to convert the response content to a specific type;
  // changes the callback value on "load" events.
  xhr.response = function(value) {
    response = value;
    return xhr;
  };

  // Convenience methods.
  ["get", "post"].forEach(function(method) {
    xhr[method] = function() {
      return xhr.send.apply(xhr, [method].concat(d3_array(arguments)));
    };
  });

  // If callback is non-null, it will be used for error and load events.
  xhr.send = function(method, data, callback) {
    if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
    request.open(method, url, true);
    if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
    if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
    if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
    if (responseType != null) request.responseType = responseType;
    if (callback != null) xhr.on("error", callback).on("load", function(request) { callback(null, request); });
    dispatch.beforesend.call(xhr, request);
    request.send(data == null ? null : data);
    return xhr;
  };

  xhr.abort = function() {
    request.abort();
    return xhr;
  };

  d3.rebind(xhr, dispatch, "on");

  return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
};

function d3_xhr_fixCallback(callback) {
  return callback.length === 1
      ? function(error, request) { callback(error == null ? request : null); }
      : callback;
}

function d3_xhrHasResponse(request) {
  var type = request.responseType;
  return type && type !== "text"
      ? request.response // null on error
      : request.responseText; // "" on error
}

d3.text = d3_xhrType(function(request) {
  return request.responseText;
});

d3.json = function(url, callback) {
  return d3_xhr(url, "application/json", d3_json, callback);
};

function d3_json(request) {
  return JSON.parse(request.responseText);
}

d3.html = function(url, callback) {
  return d3_xhr(url, "text/html", d3_html, callback);
};

function d3_html(request) {
  var range = d3_document.createRange();
  range.selectNode(d3_document.body);
  return range.createContextualFragment(request.responseText);
}

d3.xml = d3_xhrType(function(request) {
  return request.responseXML;
});
  if (typeof define === "function" && define.amd) define(d3);
  else if (typeof module === "object" && module.exports) module.exports = d3;
  this.d3 = d3;
}();
d3.jsonp = function (url, callback) {
    function rand() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var c = '', i = -1;
        while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
        return c;
    }
    function create(url) {
        var e = url.match(/callback=d3.jsonp.(\w+)/);
        var c = e ? e[1] : rand();
        d3.jsonp[c] = function(data) {
            callback(data);
            delete d3.jsonp[c];
            script.remove();
        };
        return 'd3.jsonp.' + c;
    }

    var cb = create(url);
    var script = d3.select('head')
        .append('script')
        .attr('type', 'text/javascript')
        .attr('src', url.replace(/(\{|%7B)callback(\{|%7D)/, cb));
};

})()
},{}],3:[function(require,module,exports){
(function() {
require('./js/d3');
var search = require('./src/search.js');
var removeDiacritics = require('diacritics').remove;
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
        .attr('class', 'col12 contain clearfix');

    var details = item.append('div')
        .attr('class', 'col10 pad0y pad0x');

    var img = details.append('div')
        .attr('class', 'square fl');

    img.append('img')
        .attr('data-error', 'img/missing.png')
        .attr('src', (d.item.img) ? d.item.img : 'img/missing.png')
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
        .attr('class', 'meta small');

    meta.append('span')
        .attr('class', 'sprite flag ' + normalizeClass(d.item.origin));

    meta.append('span')
        .html(d.item.producer)
        .attr('class', 'quiet');

    meta.append('span')
        .html(d.item.origin)
        .attr('class', 'quiet');

    meta.append('span')
        .text('$' + d.item.price / 100);

    var actions = item.append('div')
        .attr('class', 'pin-right pad1x pad1y small');

    //actions.append('a')
        //.attr('href', LCBO + d.item.id)
        //.attr('target', '_blank')
        //.text('LCBO');

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

    // Results have rendered.
    d3.select(this.parentNode).classed('loading', false);
}

function normalizeClass(input) {
    return removeDiacritics(input.split(', ').pop().toLowerCase().replace(/\s/g, '-'));
}

function commafy(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function keyup() {
    $results
        .html('')
        .classed('loading', true);

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

d3.json('data/data.json', function(err, res) {
    if (err) return console.error('data.json could not be found.');
    d3.select('body').classed('loading', false);
    $search
        .attr('placeholder', 'Search ' + commafy(res.length) + ' wines')
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

},{"./src/search.js":1,"./js/d3":2,"diacritics":4}],4:[function(require,module,exports){
exports.remove = removeDiacritics;

var replacementList = [
  {
    base: ' ',
    chars: "\u00A0",
  }, {
    base: '0',
    chars: "\u07C0",
  }, {
    base: 'A',
    chars: "\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F",
  }, {
    base: 'AA',
    chars: "\uA732",
  }, {
    base: 'AE',
    chars: "\u00C6\u01FC\u01E2",
  }, {
    base: 'AO',
    chars: "\uA734",
  }, {
    base: 'AU',
    chars: "\uA736",
  }, {
    base: 'AV',
    chars: "\uA738\uA73A",
  }, {
    base: 'AY',
    chars: "\uA73C",
  }, {
    base: 'B',
    chars: "\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0181",
  }, {
    base: 'C',
    chars: "\uFF43\u24b8\uff23\uA73E\u1E08",
  }, {
    base: 'D',
    chars: "\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018A\u0189\u1D05\uA779",
  }, {
    base: 'Dh',
    chars: "\u00D0",
  }, {
    base: 'DZ',
    chars: "\u01F1\u01C4",
  }, {
    base: 'Dz',
    chars: "\u01F2\u01C5",
  }, {
    base: 'E',
    chars: "\u025B\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E\u1D07",
  }, {
    base: 'F',
    chars: "\uA77C\u24BB\uFF26\u1E1E\u0191\uA77B",
  }, {
    base: 'G',
    chars: "\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E\u0262",
  }, {
    base: 'H',
    chars: "\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D",
  }, {
    base: 'I',
    chars: "\u24BE\uFF29\xCC\xCD\xCE\u0128\u012A\u012C\u0130\xCF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197",
  }, {
    base: 'J',
    chars: "\u24BF\uFF2A\u0134\u0248\u0237",
  }, {
    base: 'K',
    chars: "\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2",
  }, {
    base: 'L',
    chars: "\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780",
  }, {
    base: 'LJ',
    chars: "\u01C7",
  }, {
    base: 'Lj',
    chars: "\u01C8",
  }, {
    base: 'M',
    chars: "\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C\u03FB",
  }, {
    base: 'N',
    chars: "\uA7A4\u0220\u24C3\uFF2E\u01F8\u0143\xD1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u019D\uA790\u1D0E",
  }, {
    base: 'NJ',
    chars: "\u01CA",
  }, {
    base: 'Nj',
    chars: "\u01CB",
  }, {
    base: 'O',
    chars: "\u24C4\uFF2F\xD2\xD3\xD4\u1ED2\u1ED0\u1ED6\u1ED4\xD5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\xD6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\xD8\u01FE\u0186\u019F\uA74A\uA74C",
  }, {
    base: 'OE',
    chars: "\u0152",
  }, {
    base: 'OI',
    chars: "\u01A2",
  }, {
    base: 'OO',
    chars: "\uA74E",
  }, {
    base: 'OU',
    chars: "\u0222",
  }, {
    base: 'P',
    chars: "\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754",
  }, {
    base: 'Q',
    chars: "\u24C6\uFF31\uA756\uA758\u024A",
  }, {
    base: 'R',
    chars: "\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782",
  }, {
    base: 'S',
    chars: "\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784",
  }, {
    base: 'T',
    chars: "\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786",
  }, {
    base: 'Th',
    chars: "\u00DE",
  }, {
    base: 'TZ',
    chars: "\uA728",
  }, {
    base: 'U',
    chars: "\u24CA\uFF35\xD9\xDA\xDB\u0168\u1E78\u016A\u1E7A\u016C\xDC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244",
  }, {
    base: 'V',
    chars: "\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245",
  }, {
    base: 'VY',
    chars: "\uA760",
  }, {
    base: 'W',
    chars: "\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72",
  }, {
    base: 'X',
    chars: "\u24CD\uFF38\u1E8A\u1E8C",
  }, {
    base: 'Y',
    chars: "\u24CE\uFF39\u1EF2\xDD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE",
  }, {
    base: 'Z',
    chars: "\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762",
  }, {
    base: 'a',
    chars: "\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250\u0251",
  }, {
    base: 'aa',
    chars: "\uA733",
  }, {
    base: 'ae',
    chars: "\u00E6\u01FD\u01E3",
  }, {
    base: 'ao',
    chars: "\uA735",
  }, {
    base: 'au',
    chars: "\uA737",
  }, {
    base: 'av',
    chars: "\uA739\uA73B",
  }, {
    base: 'ay',
    chars: "\uA73D",
  }, {
    base: 'b',
    chars: "\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253\u0182",
  }, {
    base: 'c',
    chars: "\u24D2\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184\u0043\u0106\u0108\u010A\u010C\u00C7\u0187\u023B",
  }, {
    base: 'd',
    chars: "\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\u018B\u13E7\u0501\uA7AA",
  }, {
    base: 'dh',
    chars: "\u00F0",
  }, {
    base: 'dz',
    chars: "\u01F3\u01C6",
  }, {
    base: 'e',
    chars: "\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u01DD",
  }, {
    base: 'f',
    chars: "\u24D5\uFF46\u1E1F\u0192",
  }, {
    base: 'ff',
    chars: "\uFB00",
  }, {
    base: 'fi',
    chars: "\uFB01",
  }, {
    base: 'fl',
    chars: "\uFB02",
  }, {
    base: 'ffi',
    chars: "\uFB03",
  }, {
    base: 'ffl',
    chars: "\uFB04",
  }, {
    base: 'g',
    chars: "\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\uA77F\u1D79",
  }, {
    base: 'h',
    chars: "\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265",
  }, {
    base: 'hv',
    chars: "\u0195",
  }, {
    base: 'i',
    chars: "\u24D8\uFF49\xEC\xED\xEE\u0129\u012B\u012D\xEF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131",
  }, {
    base: 'j',
    chars: "\u24D9\uFF4A\u0135\u01F0\u0249",
  }, {
    base: 'k',
    chars: "\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3",
  }, {
    base: 'l',
    chars: "\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747\u026D",
  }, {
    base: 'lj',
    chars: "\u01C9",
  }, {
    base: 'm',
    chars: "\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F",
  }, {
    base: 'n',
    chars: "\u24DD\uFF4E\u01F9\u0144\xF1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5\u043B\u0509",
  }, {
    base: 'nj',
    chars: "\u01CC",
  }, {
    base: 'o',
    chars: "\u24DE\uFF4F\xF2\xF3\xF4\u1ED3\u1ED1\u1ED7\u1ED5\xF5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\xF6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\xF8\u01FF\uA74B\uA74D\u0275\u0254\u1D11",
  }, {
    base: 'oe',
    chars: "\u0153",
  }, {
    base: 'oi',
    chars: "\u01A3",
  }, {
    base: 'oo',
    chars: "\uA74F",
  }, {
    base: 'ou',
    chars: "\u0223",
  }, {
    base: 'p',
    chars: "\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755\u03C1",
  }, {
    base: 'q',
    chars: "\u24E0\uFF51\u024B\uA757\uA759",
  }, {
    base: 'r',
    chars: "\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783",
  }, {
    base: 's',
    chars: "\u24E2\uFF53\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B\u0282",
  }, {
    base: 'ss',
    chars: "\xDF",
  }, {
    base: 't',
    chars: "\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787",
  }, {
    base: 'th',
    chars: "\u00FE",
  }, {
    base: 'tz',
    chars: "\uA729",
  }, {
    base: 'u',
    chars: "\u24E4\uFF55\xF9\xFA\xFB\u0169\u1E79\u016B\u1E7B\u016D\xFC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289",
  }, {
    base: 'v',
    chars: "\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C",
  }, {
    base: 'vy',
    chars: "\uA761",
  }, {
    base: 'w',
    chars: "\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73",
  }, {
    base: 'x',
    chars: "\u24E7\uFF58\u1E8B\u1E8D",
  }, {
    base: 'y',
    chars: "\u24E8\uFF59\u1EF3\xFD\u0177\u1EF9\u0233\u1E8F\xFF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF",
  }, {
    base: 'z',
    chars: "\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763",
  }
];

var diacriticsMap = {};
for (var i = 0; i < replacementList.length; i += 1) {
  var chars = replacementList[i].chars;
  for (var j = 0; j < chars.length; j += 1) {
    diacriticsMap[chars[j]] = replacementList[i].base;
  }
}

function removeDiacritics(str) {
  return str.replace(/[^\u0000-\u007e]/g, function(c) {
    return diacriticsMap[c] || c;
  });
}

},{}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy90cmlzdGVuL2Rldi9naXRodWIvdmludGFnZXMvc3JjL3NlYXJjaC5qcyIsIi9Vc2Vycy90cmlzdGVuL2Rldi9naXRodWIvdmludGFnZXMvanMvZDMuanMiLCIvVXNlcnMvdHJpc3Rlbi9kZXYvZ2l0aHViL3ZpbnRhZ2VzL2luZGV4LmpzIiwiL1VzZXJzL3RyaXN0ZW4vZGV2L2dpdGh1Yi92aW50YWdlcy9ub2RlX21vZHVsZXMvZGlhY3JpdGljcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xubW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gc2hhcmRlZCBpbmRleGVzXG52YXIgaW5kZXhlcyA9IHt9O1xudmFyIHRpdGxlcyA9IHt9O1xuXG4vLyB0cmllc1xudmFyIHRyaWVzID0ge307XG5cbmZ1bmN0aW9uIHNoYXJkKGEpIHtcbiAgICBpZiAoIWEpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gYVswXS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vLyBHZXQgYSBzaGFyZC5cbmZ1bmN0aW9uIGdldGluZGV4KGEsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGluZGV4ZXNbc2hhcmQoYSldKSByZXR1cm4gY2FsbGJhY2soaW5kZXhlc1tzaGFyZChhKV0pO1xuXG4gICAgZDMuanNvbignZGF0YS9pbmRleGVzLycgKyBzaGFyZChhKSArICcuanNvbicsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgIGluZGV4ZXNbc2hhcmQoYSldID0gcmVzO1xuICAgICAgICBjYWxsYmFjayhpbmRleGVzW3NoYXJkKGEpXSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIG9taXRMZWFkaW5nWmVybyhzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvXjArLywgJycpO1xufVxuXG5mdW5jdGlvbiBnZXRJRChpZCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaWRzID0gW107XG4gICAgZm9yICh2YXIgdCBpbiB0aXRsZXMpIHtcbiAgICAgICAgaWYgKHQuaW5kZXhPZihvbWl0TGVhZGluZ1plcm8oaWQpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlkcy5wdXNoKHBhcnNlSW50KHQsIDEwKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2FsbGJhY2soaWRzKTtcbn1cblxuZnVuY3Rpb24gZ2V0dHJpZShhLCBjYWxsYmFjaykge1xuICAgIGlmICh0cmllc1tzaGFyZChhKV0pIHJldHVybiBjYWxsYmFjayh0cmllc1tzaGFyZChhKV0pO1xuXG4gICAgZDMuanNvbignZGF0YS9pbmRleGVzLycgKyBzaGFyZChhKSArICcuanNvbi50cmllLmpzb24nLCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICB0cmllc1tzaGFyZChhKV0gPSByZXM7XG4gICAgICAgIGNhbGxiYWNrKHRyaWVzW3NoYXJkKGEpXSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGpvaW50aXRsZXMoeCkge1xuICAgIHZhciBsID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGwucHVzaCh7XG4gICAgICAgICAgICBpZDogeFtpXSxcbiAgICAgICAgICAgIGl0ZW06IHRpdGxlc1t4W2ldXSB8fCAnJ1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGw7XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdChhLCBiKSB7XG4gICAgdmFyIGMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGIuaW5kZXhPZihhW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGMucHVzaChhW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYztcbn1cblxuZnVuY3Rpb24gY2xlYW5zcGxpdChxKSB7XG4gICAgdmFyIHRlcm1zID0gcS5zcGxpdCgvXFxzKy8pO1xuICAgIGlmICghdGVybXMubGVuZ3RoKSByZXR1cm4gW107XG4gICAgdGVybXMgPSB0ZXJtcy5tYXAoZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgY2xlYW4gPSB0LnJlcGxhY2UoL1teQS1aYS16MC05XS9nLCAnJyk7XG4gICAgICAgIGlmICghY2xlYW4pIHJldHVybiBmYWxzZTtcbiAgICAgICAgZWxzZSByZXR1cm4gY2xlYW4udG9Mb3dlckNhc2UoKTtcbiAgICB9KS5maWx0ZXIoZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdDtcbiAgICB9KTtcbiAgICByZXR1cm4gdGVybXM7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHkob2JqKSB7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBhdXRvY29tcGxldGUocSwgY2FsbGJhY2spIHtcbiAgICB2YXIgdGVybXMgPSBjbGVhbnNwbGl0KHEpO1xuICAgIGlmICghdGVybXMpIHJldHVybiBjYWxsYmFjayhbXSk7XG4gICAgdmFyIGxhc3QgPSB0ZXJtcy5wb3AoKTtcbiAgICB2YXIgbGltaXQgPSAyMDtcbiAgICBpZiAoaXNOYU4ocGFyc2VJbnQobGFzdCwgMTApKSkge1xuICAgICAgICBnZXR0cmllKGxhc3QsIGZ1bmN0aW9uKHRyaWUpIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSB0cmllO1xuICAgICAgICAgICAgLy8gaW5jaCB1cCBwb3MgdG8gZW5kXG4gICAgICAgICAgICB2YXIgcHJlZml4ID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocG9zW2xhc3RbaV1dKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZpeCArPSBsYXN0W2ldO1xuICAgICAgICAgICAgICAgICAgICBwb3MgPSBwb3NbbGFzdFtpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN0cnMgPSBbXTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyYXZlcnNlKHBvcywgcHJlZml4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0cnMubGVuZ3RoID4gbGltaXQpIHJldHVybiBjYWxsYmFjayhzdHJzKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNFbXB0eShwb3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cnMucHVzaChwcmVmaXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHBvcykge1xuICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZShwb3NbaV0sIHByZWZpeCArIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyYXZlcnNlKHBvcywgcHJlZml4KTtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhzdHJzKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBxdWVyeShxLCBjYWxsYmFjaykge1xuICAgIHZhciB0ZXJtcyA9IGNsZWFuc3BsaXQocSk7XG4gICAgaWYgKCF0ZXJtcykgcmV0dXJuIGNhbGxiYWNrKFtdKTtcbiAgICBmdW5jdGlvbiBkb3Rlcm0oaWR4KSB7XG4gICAgICAgIHZhciB0ZXJtID0gdGVybXMucG9wKCk7XG4gICAgICAgIGlmICghaXNOYU4ocGFyc2VJbnQodGVybSwgMTApKSAmJiB0ZXJtLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIGdldElEKHRlcm0sIGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgIGlmICh0ZXJtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZG90ZXJtKGlkeCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGpvaW50aXRsZXMocmVzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZXRpbmRleCh0ZXJtLCBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICghaW5kZXhbdGVybV0pIHJldHVybiBjYWxsYmFjayhbXSk7XG4gICAgICAgICAgICAgICAgaWR4ID0gKGlkeCkgP1xuICAgICAgICAgICAgICAgICAgICBpbnRlcnNlY3QoaWR4LCBpbmRleFt0ZXJtXSkgOlxuICAgICAgICAgICAgICAgICAgICBpZHggPSBpbmRleFt0ZXJtXTtcblxuICAgICAgICAgICAgICAgIGlmICghaWR4KSByZXR1cm4gY2FsbGJhY2soW10pO1xuICAgICAgICAgICAgICAgIGlmICh0ZXJtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZG90ZXJtKGlkeCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGpvaW50aXRsZXMoaWR4KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZG90ZXJtKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzLnF1ZXJ5ID0gcXVlcnk7XG5tb2R1bGUuZXhwb3J0cy5hdXRvY29tcGxldGUgPSBhdXRvY29tcGxldGU7XG5tb2R1bGUuZXhwb3J0cy5wcmltZXRpdGxlcyA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICBkMy5qc29uKHBhdGgsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjb25zb2xlLmVycm9yKCd0aXRsZXMuanNvbiBjb3VsZCBub3QgYmUgcHJpbWVkIGZvciBzZWFyY2guJyk7XG4gICAgICAgIHRpdGxlcyA9IHJlczsgXG4gICAgfSk7XG59O1xuXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCl7IWZ1bmN0aW9uKCl7XG4gIHZhciBkMyA9IHt2ZXJzaW9uOiBcIjMuNC4xM1wifTsgLy8gc2VtdmVyXG5mdW5jdGlvbiBkM19mdW5jdG9yKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIgPyB2IDogZnVuY3Rpb24oKSB7IHJldHVybiB2OyB9O1xufVxuXG5kMy5mdW5jdG9yID0gZDNfZnVuY3RvcjtcbnZhciBkM19uc1ByZWZpeCA9IHtcbiAgc3ZnOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXG4gIHhodG1sOiBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIixcbiAgeGxpbms6IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLFxuICB4bWw6IFwiaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlXCIsXG4gIHhtbG5zOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvXCJcbn07XG5cbmQzLm5zID0ge1xuICBwcmVmaXg6IGQzX25zUHJlZml4LFxuICBxdWFsaWZ5OiBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIGkgPSBuYW1lLmluZGV4T2YoXCI6XCIpLFxuICAgICAgICBwcmVmaXggPSBuYW1lO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgIHByZWZpeCA9IG5hbWUuc2xpY2UoMCwgaSk7XG4gICAgICBuYW1lID0gbmFtZS5zbGljZShpICsgMSk7XG4gICAgfVxuICAgIHJldHVybiBkM19uc1ByZWZpeC5oYXNPd25Qcm9wZXJ0eShwcmVmaXgpXG4gICAgICAgID8ge3NwYWNlOiBkM19uc1ByZWZpeFtwcmVmaXhdLCBsb2NhbDogbmFtZX1cbiAgICAgICAgOiBuYW1lO1xuICB9XG59O1xuLy8gQ29waWVzIGEgdmFyaWFibGUgbnVtYmVyIG9mIG1ldGhvZHMgZnJvbSBzb3VyY2UgdG8gdGFyZ2V0LlxuZDMucmViaW5kID0gZnVuY3Rpb24odGFyZ2V0LCBzb3VyY2UpIHtcbiAgdmFyIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aCwgbWV0aG9kO1xuICB3aGlsZSAoKytpIDwgbikgdGFyZ2V0W21ldGhvZCA9IGFyZ3VtZW50c1tpXV0gPSBkM19yZWJpbmQodGFyZ2V0LCBzb3VyY2UsIHNvdXJjZVttZXRob2RdKTtcbiAgcmV0dXJuIHRhcmdldDtcbn07XG5cbi8vIE1ldGhvZCBpcyBhc3N1bWVkIHRvIGJlIGEgc3RhbmRhcmQgRDMgZ2V0dGVyLXNldHRlcjpcbi8vIElmIHBhc3NlZCB3aXRoIG5vIGFyZ3VtZW50cywgZ2V0cyB0aGUgdmFsdWUuXG4vLyBJZiBwYXNzZWQgd2l0aCBhcmd1bWVudHMsIHNldHMgdGhlIHZhbHVlIGFuZCByZXR1cm5zIHRoZSB0YXJnZXQuXG5mdW5jdGlvbiBkM19yZWJpbmQodGFyZ2V0LCBzb3VyY2UsIG1ldGhvZCkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gbWV0aG9kLmFwcGx5KHNvdXJjZSwgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdmFsdWUgPT09IHNvdXJjZSA/IHRhcmdldCA6IHZhbHVlO1xuICB9O1xufVxuZnVuY3Rpb24gZDNfY2xhc3MoY3RvciwgcHJvcGVydGllcykge1xuICBmb3IgKHZhciBrZXkgaW4gcHJvcGVydGllcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLnByb3RvdHlwZSwga2V5LCB7XG4gICAgICB2YWx1ZTogcHJvcGVydGllc1trZXldLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxufVxuXG5kMy5tYXAgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIG1hcCA9IG5ldyBkM19NYXA7XG4gIGlmIChvYmplY3QgaW5zdGFuY2VvZiBkM19NYXApIG9iamVjdC5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsdWUpIHsgbWFwLnNldChrZXksIHZhbHVlKTsgfSk7XG4gIGVsc2UgZm9yICh2YXIga2V5IGluIG9iamVjdCkgbWFwLnNldChrZXksIG9iamVjdFtrZXldKTtcbiAgcmV0dXJuIG1hcDtcbn07XG5cbmZ1bmN0aW9uIGQzX01hcCgpIHtcbiAgdGhpcy5fID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cblxudmFyIGQzX21hcF9wcm90byA9IFwiX19wcm90b19fXCIsXG4gICAgZDNfbWFwX3plcm8gPSBcIlxcMFwiO1xuXG5kM19jbGFzcyhkM19NYXAsIHtcbiAgaGFzOiBkM19tYXBfaGFzLFxuICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiB0aGlzLl9bZDNfbWFwX2VzY2FwZShrZXkpXTtcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuX1tkM19tYXBfZXNjYXBlKGtleSldID0gdmFsdWU7XG4gIH0sXG4gIHJlbW92ZTogZDNfbWFwX3JlbW92ZSxcbiAga2V5czogZDNfbWFwX2tleXMsXG4gIHZhbHVlczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl8pIHZhbHVlcy5wdXNoKHRoaXMuX1trZXldKTtcbiAgICByZXR1cm4gdmFsdWVzO1xuICB9LFxuICBlbnRyaWVzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZW50cmllcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl8pIGVudHJpZXMucHVzaCh7a2V5OiBkM19tYXBfdW5lc2NhcGUoa2V5KSwgdmFsdWU6IHRoaXMuX1trZXldfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH0sXG4gIHNpemU6IGQzX21hcF9zaXplLFxuICBlbXB0eTogZDNfbWFwX2VtcHR5LFxuICBmb3JFYWNoOiBmdW5jdGlvbihmKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMuXykgZi5jYWxsKHRoaXMsIGQzX21hcF91bmVzY2FwZShrZXkpLCB0aGlzLl9ba2V5XSk7XG4gIH1cbn0pO1xuXG5mdW5jdGlvbiBkM19tYXBfZXNjYXBlKGtleSkge1xuICByZXR1cm4gKGtleSArPSBcIlwiKSA9PT0gZDNfbWFwX3Byb3RvIHx8IGtleVswXSA9PT0gZDNfbWFwX3plcm8gPyBkM19tYXBfemVybyArIGtleSA6IGtleTtcbn1cblxuZnVuY3Rpb24gZDNfbWFwX3VuZXNjYXBlKGtleSkge1xuICByZXR1cm4gKGtleSArPSBcIlwiKVswXSA9PT0gZDNfbWFwX3plcm8gPyBrZXkuc2xpY2UoMSkgOiBrZXk7XG59XG5cbmZ1bmN0aW9uIGQzX21hcF9oYXMoa2V5KSB7XG4gIHJldHVybiBkM19tYXBfZXNjYXBlKGtleSkgaW4gdGhpcy5fO1xufVxuXG5mdW5jdGlvbiBkM19tYXBfcmVtb3ZlKGtleSkge1xuICByZXR1cm4gKGtleSA9IGQzX21hcF9lc2NhcGUoa2V5KSkgaW4gdGhpcy5fICYmIGRlbGV0ZSB0aGlzLl9ba2V5XTtcbn1cblxuZnVuY3Rpb24gZDNfbWFwX2tleXMoKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiB0aGlzLl8pIGtleXMucHVzaChkM19tYXBfdW5lc2NhcGUoa2V5KSk7XG4gIHJldHVybiBrZXlzO1xufVxuXG5mdW5jdGlvbiBkM19tYXBfc2l6ZSgpIHtcbiAgdmFyIHNpemUgPSAwO1xuICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fKSArK3NpemU7XG4gIHJldHVybiBzaXplO1xufVxuXG5mdW5jdGlvbiBkM19tYXBfZW1wdHkoKSB7XG4gIGZvciAodmFyIGtleSBpbiB0aGlzLl8pIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmQzLmRpc3BhdGNoID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkaXNwYXRjaCA9IG5ldyBkM19kaXNwYXRjaCxcbiAgICAgIGkgPSAtMSxcbiAgICAgIG4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICB3aGlsZSAoKytpIDwgbikgZGlzcGF0Y2hbYXJndW1lbnRzW2ldXSA9IGQzX2Rpc3BhdGNoX2V2ZW50KGRpc3BhdGNoKTtcbiAgcmV0dXJuIGRpc3BhdGNoO1xufTtcblxuZnVuY3Rpb24gZDNfZGlzcGF0Y2goKSB7fVxuXG5kM19kaXNwYXRjaC5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgaSA9IHR5cGUuaW5kZXhPZihcIi5cIiksXG4gICAgICBuYW1lID0gXCJcIjtcblxuICAvLyBFeHRyYWN0IG9wdGlvbmFsIG5hbWVzcGFjZSwgZS5nLiwgXCJjbGljay5mb29cIlxuICBpZiAoaSA+PSAwKSB7XG4gICAgbmFtZSA9IHR5cGUuc2xpY2UoaSArIDEpO1xuICAgIHR5cGUgPSB0eXBlLnNsaWNlKDAsIGkpO1xuICB9XG5cbiAgaWYgKHR5cGUpIHJldHVybiBhcmd1bWVudHMubGVuZ3RoIDwgMlxuICAgICAgPyB0aGlzW3R5cGVdLm9uKG5hbWUpXG4gICAgICA6IHRoaXNbdHlwZV0ub24obmFtZSwgbGlzdGVuZXIpO1xuXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgaWYgKGxpc3RlbmVyID09IG51bGwpIGZvciAodHlwZSBpbiB0aGlzKSB7XG4gICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSkgdGhpc1t0eXBlXS5vbihuYW1lLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGQzX2Rpc3BhdGNoX2V2ZW50KGRpc3BhdGNoKSB7XG4gIHZhciBsaXN0ZW5lcnMgPSBbXSxcbiAgICAgIGxpc3RlbmVyQnlOYW1lID0gbmV3IGQzX01hcDtcblxuICBmdW5jdGlvbiBldmVudCgpIHtcbiAgICB2YXIgeiA9IGxpc3RlbmVycywgLy8gZGVmZW5zaXZlIHJlZmVyZW5jZVxuICAgICAgICBpID0gLTEsXG4gICAgICAgIG4gPSB6Lmxlbmd0aCxcbiAgICAgICAgbDtcbiAgICB3aGlsZSAoKytpIDwgbikgaWYgKGwgPSB6W2ldLm9uKSBsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGRpc3BhdGNoO1xuICB9XG5cbiAgZXZlbnQub24gPSBmdW5jdGlvbihuYW1lLCBsaXN0ZW5lcikge1xuICAgIHZhciBsID0gbGlzdGVuZXJCeU5hbWUuZ2V0KG5hbWUpLFxuICAgICAgICBpO1xuXG4gICAgLy8gcmV0dXJuIHRoZSBjdXJyZW50IGxpc3RlbmVyLCBpZiBhbnlcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHJldHVybiBsICYmIGwub247XG5cbiAgICAvLyByZW1vdmUgdGhlIG9sZCBsaXN0ZW5lciwgaWYgYW55ICh3aXRoIGNvcHktb24td3JpdGUpXG4gICAgaWYgKGwpIHtcbiAgICAgIGwub24gPSBudWxsO1xuICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLnNsaWNlKDAsIGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihsKSkuY29uY2F0KGxpc3RlbmVycy5zbGljZShpICsgMSkpO1xuICAgICAgbGlzdGVuZXJCeU5hbWUucmVtb3ZlKG5hbWUpO1xuICAgIH1cblxuICAgIC8vIGFkZCB0aGUgbmV3IGxpc3RlbmVyLCBpZiBhbnlcbiAgICBpZiAobGlzdGVuZXIpIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyQnlOYW1lLnNldChuYW1lLCB7b246IGxpc3RlbmVyfSkpO1xuXG4gICAgcmV0dXJuIGRpc3BhdGNoO1xuICB9O1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuZDMuZXZlbnQgPSBudWxsO1xuXG5mdW5jdGlvbiBkM19ldmVudFByZXZlbnREZWZhdWx0KCkge1xuICBkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufVxuXG5mdW5jdGlvbiBkM19ldmVudFNvdXJjZSgpIHtcbiAgdmFyIGUgPSBkMy5ldmVudCwgcztcbiAgd2hpbGUgKHMgPSBlLnNvdXJjZUV2ZW50KSBlID0gcztcbiAgcmV0dXJuIGU7XG59XG5cbi8vIExpa2UgZDMuZGlzcGF0Y2gsIGJ1dCBmb3IgY3VzdG9tIGV2ZW50cyBhYnN0cmFjdGluZyBuYXRpdmUgVUkgZXZlbnRzLiBUaGVzZVxuLy8gZXZlbnRzIGhhdmUgYSB0YXJnZXQgY29tcG9uZW50IChzdWNoIGFzIGEgYnJ1c2gpLCBhIHRhcmdldCBlbGVtZW50IChzdWNoIGFzXG4vLyB0aGUgc3ZnOmcgZWxlbWVudCBjb250YWluaW5nIHRoZSBicnVzaCkgYW5kIHRoZSBzdGFuZGFyZCBhcmd1bWVudHMgYGRgICh0aGVcbi8vIHRhcmdldCBlbGVtZW50J3MgZGF0YSkgYW5kIGBpYCAodGhlIHNlbGVjdGlvbiBpbmRleCBvZiB0aGUgdGFyZ2V0IGVsZW1lbnQpLlxuZnVuY3Rpb24gZDNfZXZlbnREaXNwYXRjaCh0YXJnZXQpIHtcbiAgdmFyIGRpc3BhdGNoID0gbmV3IGQzX2Rpc3BhdGNoLFxuICAgICAgaSA9IDAsXG4gICAgICBuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuICB3aGlsZSAoKytpIDwgbikgZGlzcGF0Y2hbYXJndW1lbnRzW2ldXSA9IGQzX2Rpc3BhdGNoX2V2ZW50KGRpc3BhdGNoKTtcblxuICAvLyBDcmVhdGVzIGEgZGlzcGF0Y2ggY29udGV4dCBmb3IgdGhlIHNwZWNpZmllZCBgdGhpemAgKHR5cGljYWxseSwgdGhlIHRhcmdldFxuICAvLyBET00gZWxlbWVudCB0aGF0IHJlY2VpdmVkIHRoZSBzb3VyY2UgZXZlbnQpIGFuZCBgYXJndW1lbnR6YCAodHlwaWNhbGx5LCB0aGVcbiAgLy8gZGF0YSBgZGAgYW5kIGluZGV4IGBpYCBvZiB0aGUgdGFyZ2V0IGVsZW1lbnQpLiBUaGUgcmV0dXJuZWQgZnVuY3Rpb24gY2FuIGJlXG4gIC8vIHVzZWQgdG8gZGlzcGF0Y2ggYW4gZXZlbnQgdG8gYW55IHJlZ2lzdGVyZWQgbGlzdGVuZXJzOyB0aGUgZnVuY3Rpb24gdGFrZXMgYVxuICAvLyBzaW5nbGUgYXJndW1lbnQgYXMgaW5wdXQsIGJlaW5nIHRoZSBldmVudCB0byBkaXNwYXRjaC4gVGhlIGV2ZW50IG11c3QgaGF2ZVxuICAvLyBhIFwidHlwZVwiIGF0dHJpYnV0ZSB3aGljaCBjb3JyZXNwb25kcyB0byBhIHR5cGUgcmVnaXN0ZXJlZCBpbiB0aGVcbiAgLy8gY29uc3RydWN0b3IuIFRoaXMgY29udGV4dCB3aWxsIGF1dG9tYXRpY2FsbHkgcG9wdWxhdGUgdGhlIFwic291cmNlRXZlbnRcIiBhbmRcbiAgLy8gXCJ0YXJnZXRcIiBhdHRyaWJ1dGVzIG9mIHRoZSBldmVudCwgYXMgd2VsbCBhcyBzZXR0aW5nIHRoZSBgZDMuZXZlbnRgIGdsb2JhbFxuICAvLyBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSBub3RpZmljYXRpb24uXG4gIGRpc3BhdGNoLm9mID0gZnVuY3Rpb24odGhpeiwgYXJndW1lbnR6KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGUxKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgZTAgPVxuICAgICAgICBlMS5zb3VyY2VFdmVudCA9IGQzLmV2ZW50O1xuICAgICAgICBlMS50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIGQzLmV2ZW50ID0gZTE7XG4gICAgICAgIGRpc3BhdGNoW2UxLnR5cGVdLmFwcGx5KHRoaXosIGFyZ3VtZW50eik7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBkMy5ldmVudCA9IGUwO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIGRpc3BhdGNoO1xufVxudmFyIGQzX2FycmF5U2xpY2UgPSBbXS5zbGljZSxcbiAgICBkM19hcnJheSA9IGZ1bmN0aW9uKGxpc3QpIHsgcmV0dXJuIGQzX2FycmF5U2xpY2UuY2FsbChsaXN0KTsgfTsgLy8gY29udmVyc2lvbiBmb3IgTm9kZUxpc3RzXG5cbnZhciBkM19kb2N1bWVudCA9IGRvY3VtZW50LFxuICAgIGQzX2RvY3VtZW50RWxlbWVudCA9IGQzX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBkM193aW5kb3cgPSB3aW5kb3c7XG5cbi8vIFJlZGVmaW5lIGQzX2FycmF5IGlmIHRoZSBicm93c2VyIGRvZXNu4oCZdCBzdXBwb3J0IHNsaWNlLWJhc2VkIGNvbnZlcnNpb24uXG50cnkge1xuICBkM19hcnJheShkM19kb2N1bWVudEVsZW1lbnQuY2hpbGROb2RlcylbMF0ubm9kZVR5cGU7XG59IGNhdGNoKGUpIHtcbiAgZDNfYXJyYXkgPSBmdW5jdGlvbihsaXN0KSB7XG4gICAgdmFyIGkgPSBsaXN0Lmxlbmd0aCwgYXJyYXkgPSBuZXcgQXJyYXkoaSk7XG4gICAgd2hpbGUgKGktLSkgYXJyYXlbaV0gPSBsaXN0W2ldO1xuICAgIHJldHVybiBhcnJheTtcbiAgfTtcbn1cblxuZDMubW91c2UgPSBmdW5jdGlvbihjb250YWluZXIpIHtcbiAgcmV0dXJuIGQzX21vdXNlUG9pbnQoY29udGFpbmVyLCBkM19ldmVudFNvdXJjZSgpKTtcbn07XG5cbi8vIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD00NDA4M1xudmFyIGQzX21vdXNlX2J1ZzQ0MDgzID0gL1dlYktpdC8udGVzdChkM193aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkgPyAtMSA6IDA7XG5cbmZ1bmN0aW9uIGQzX21vdXNlUG9pbnQoY29udGFpbmVyLCBlKSB7XG4gIGlmIChlLmNoYW5nZWRUb3VjaGVzKSBlID0gZS5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgdmFyIHN2ZyA9IGNvbnRhaW5lci5vd25lclNWR0VsZW1lbnQgfHwgY29udGFpbmVyO1xuICBpZiAoc3ZnLmNyZWF0ZVNWR1BvaW50KSB7XG4gICAgdmFyIHBvaW50ID0gc3ZnLmNyZWF0ZVNWR1BvaW50KCk7XG4gICAgaWYgKGQzX21vdXNlX2J1ZzQ0MDgzIDwgMCAmJiAoZDNfd2luZG93LnNjcm9sbFggfHwgZDNfd2luZG93LnNjcm9sbFkpKSB7XG4gICAgICBzdmcgPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKS5zdHlsZSh7XG4gICAgICAgIHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICBib3JkZXI6IFwibm9uZVwiXG4gICAgICB9LCBcImltcG9ydGFudFwiKTtcbiAgICAgIHZhciBjdG0gPSBzdmdbMF1bMF0uZ2V0U2NyZWVuQ1RNKCk7XG4gICAgICBkM19tb3VzZV9idWc0NDA4MyA9ICEoY3RtLmYgfHwgY3RtLmUpO1xuICAgICAgc3ZnLnJlbW92ZSgpO1xuICAgIH1cbiAgICBpZiAoZDNfbW91c2VfYnVnNDQwODMpIHBvaW50LnggPSBlLnBhZ2VYLCBwb2ludC55ID0gZS5wYWdlWTtcbiAgICBlbHNlIHBvaW50LnggPSBlLmNsaWVudFgsIHBvaW50LnkgPSBlLmNsaWVudFk7XG4gICAgcG9pbnQgPSBwb2ludC5tYXRyaXhUcmFuc2Zvcm0oY29udGFpbmVyLmdldFNjcmVlbkNUTSgpLmludmVyc2UoKSk7XG4gICAgcmV0dXJuIFtwb2ludC54LCBwb2ludC55XTtcbiAgfVxuICB2YXIgcmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIFtlLmNsaWVudFggLSByZWN0LmxlZnQgLSBjb250YWluZXIuY2xpZW50TGVmdCwgZS5jbGllbnRZIC0gcmVjdC50b3AgLSBjb250YWluZXIuY2xpZW50VG9wXTtcbn07XG5cbmQzLnRvdWNoID0gZnVuY3Rpb24oY29udGFpbmVyLCB0b3VjaGVzLCBpZGVudGlmaWVyKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykgaWRlbnRpZmllciA9IHRvdWNoZXMsIHRvdWNoZXMgPSBkM19ldmVudFNvdXJjZSgpLmNoYW5nZWRUb3VjaGVzO1xuICBpZiAodG91Y2hlcykgZm9yICh2YXIgaSA9IDAsIG4gPSB0b3VjaGVzLmxlbmd0aCwgdG91Y2g7IGkgPCBuOyArK2kpIHtcbiAgICBpZiAoKHRvdWNoID0gdG91Y2hlc1tpXSkuaWRlbnRpZmllciA9PT0gaWRlbnRpZmllcikge1xuICAgICAgcmV0dXJuIGQzX21vdXNlUG9pbnQoY29udGFpbmVyLCB0b3VjaCk7XG4gICAgfVxuICB9XG59O1xuXG5kMy50b3VjaGVzID0gZnVuY3Rpb24oY29udGFpbmVyLCB0b3VjaGVzKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikgdG91Y2hlcyA9IGQzX2V2ZW50U291cmNlKCkudG91Y2hlcztcbiAgcmV0dXJuIHRvdWNoZXMgPyBkM19hcnJheSh0b3VjaGVzKS5tYXAoZnVuY3Rpb24odG91Y2gpIHtcbiAgICB2YXIgcG9pbnQgPSBkM19tb3VzZVBvaW50KGNvbnRhaW5lciwgdG91Y2gpO1xuICAgIHBvaW50LmlkZW50aWZpZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuICAgIHJldHVybiBwb2ludDtcbiAgfSkgOiBbXTtcbn07XG5mdW5jdGlvbiBkM192ZW5kb3JTeW1ib2wob2JqZWN0LCBuYW1lKSB7XG4gIGlmIChuYW1lIGluIG9iamVjdCkgcmV0dXJuIG5hbWU7XG4gIG5hbWUgPSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKTtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBkM192ZW5kb3JQcmVmaXhlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2YXIgcHJlZml4TmFtZSA9IGQzX3ZlbmRvclByZWZpeGVzW2ldICsgbmFtZTtcbiAgICBpZiAocHJlZml4TmFtZSBpbiBvYmplY3QpIHJldHVybiBwcmVmaXhOYW1lO1xuICB9XG59XG5cbnZhciBkM192ZW5kb3JQcmVmaXhlcyA9IFtcIndlYmtpdFwiLCBcIm1zXCIsIFwibW96XCIsIFwiTW96XCIsIFwib1wiLCBcIk9cIl07XG5cbnZhciBkM190aW1lcl9xdWV1ZUhlYWQsXG4gICAgZDNfdGltZXJfcXVldWVUYWlsLFxuICAgIGQzX3RpbWVyX2ludGVydmFsLCAvLyBpcyBhbiBpbnRlcnZhbCAob3IgZnJhbWUpIGFjdGl2ZT9cbiAgICBkM190aW1lcl90aW1lb3V0LCAvLyBpcyBhIHRpbWVvdXQgYWN0aXZlP1xuICAgIGQzX3RpbWVyX2FjdGl2ZSwgLy8gYWN0aXZlIHRpbWVyIG9iamVjdFxuICAgIGQzX3RpbWVyX2ZyYW1lID0gZDNfd2luZG93W2QzX3ZlbmRvclN5bWJvbChkM193aW5kb3csIFwicmVxdWVzdEFuaW1hdGlvbkZyYW1lXCIpXSB8fCBmdW5jdGlvbihjYWxsYmFjaykgeyBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxNyk7IH07XG5cbi8vIFRoZSB0aW1lciB3aWxsIGNvbnRpbnVlIHRvIGZpcmUgdW50aWwgY2FsbGJhY2sgcmV0dXJucyB0cnVlLlxuZDMudGltZXIgPSBmdW5jdGlvbihjYWxsYmFjaywgZGVsYXksIHRoZW4pIHtcbiAgdmFyIG4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICBpZiAobiA8IDIpIGRlbGF5ID0gMDtcbiAgaWYgKG4gPCAzKSB0aGVuID0gRGF0ZS5ub3coKTtcblxuICAvLyBBZGQgdGhlIGNhbGxiYWNrIHRvIHRoZSB0YWlsIG9mIHRoZSBxdWV1ZS5cbiAgdmFyIHRpbWUgPSB0aGVuICsgZGVsYXksIHRpbWVyID0ge2M6IGNhbGxiYWNrLCB0OiB0aW1lLCBmOiBmYWxzZSwgbjogbnVsbH07XG4gIGlmIChkM190aW1lcl9xdWV1ZVRhaWwpIGQzX3RpbWVyX3F1ZXVlVGFpbC5uID0gdGltZXI7XG4gIGVsc2UgZDNfdGltZXJfcXVldWVIZWFkID0gdGltZXI7XG4gIGQzX3RpbWVyX3F1ZXVlVGFpbCA9IHRpbWVyO1xuXG4gIC8vIFN0YXJ0IGFuaW1hdGluJyFcbiAgaWYgKCFkM190aW1lcl9pbnRlcnZhbCkge1xuICAgIGQzX3RpbWVyX3RpbWVvdXQgPSBjbGVhclRpbWVvdXQoZDNfdGltZXJfdGltZW91dCk7XG4gICAgZDNfdGltZXJfaW50ZXJ2YWwgPSAxO1xuICAgIGQzX3RpbWVyX2ZyYW1lKGQzX3RpbWVyX3N0ZXApO1xuICB9XG59O1xuXG5mdW5jdGlvbiBkM190aW1lcl9zdGVwKCkge1xuICB2YXIgbm93ID0gZDNfdGltZXJfbWFyaygpLFxuICAgICAgZGVsYXkgPSBkM190aW1lcl9zd2VlcCgpIC0gbm93O1xuICBpZiAoZGVsYXkgPiAyNCkge1xuICAgIGlmIChpc0Zpbml0ZShkZWxheSkpIHtcbiAgICAgIGNsZWFyVGltZW91dChkM190aW1lcl90aW1lb3V0KTtcbiAgICAgIGQzX3RpbWVyX3RpbWVvdXQgPSBzZXRUaW1lb3V0KGQzX3RpbWVyX3N0ZXAsIGRlbGF5KTtcbiAgICB9XG4gICAgZDNfdGltZXJfaW50ZXJ2YWwgPSAwO1xuICB9IGVsc2Uge1xuICAgIGQzX3RpbWVyX2ludGVydmFsID0gMTtcbiAgICBkM190aW1lcl9mcmFtZShkM190aW1lcl9zdGVwKTtcbiAgfVxufVxuXG5kMy50aW1lci5mbHVzaCA9IGZ1bmN0aW9uKCkge1xuICBkM190aW1lcl9tYXJrKCk7XG4gIGQzX3RpbWVyX3N3ZWVwKCk7XG59O1xuXG5mdW5jdGlvbiBkM190aW1lcl9tYXJrKCkge1xuICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgZDNfdGltZXJfYWN0aXZlID0gZDNfdGltZXJfcXVldWVIZWFkO1xuICB3aGlsZSAoZDNfdGltZXJfYWN0aXZlKSB7XG4gICAgaWYgKG5vdyA+PSBkM190aW1lcl9hY3RpdmUudCkgZDNfdGltZXJfYWN0aXZlLmYgPSBkM190aW1lcl9hY3RpdmUuYyhub3cgLSBkM190aW1lcl9hY3RpdmUudCk7XG4gICAgZDNfdGltZXJfYWN0aXZlID0gZDNfdGltZXJfYWN0aXZlLm47XG4gIH1cbiAgcmV0dXJuIG5vdztcbn1cblxuLy8gRmx1c2ggYWZ0ZXIgY2FsbGJhY2tzIHRvIGF2b2lkIGNvbmN1cnJlbnQgcXVldWUgbW9kaWZpY2F0aW9uLlxuLy8gUmV0dXJucyB0aGUgdGltZSBvZiB0aGUgZWFybGllc3QgYWN0aXZlIHRpbWVyLCBwb3N0LXN3ZWVwLlxuZnVuY3Rpb24gZDNfdGltZXJfc3dlZXAoKSB7XG4gIHZhciB0MCxcbiAgICAgIHQxID0gZDNfdGltZXJfcXVldWVIZWFkLFxuICAgICAgdGltZSA9IEluZmluaXR5O1xuICB3aGlsZSAodDEpIHtcbiAgICBpZiAodDEuZikge1xuICAgICAgdDEgPSB0MCA/IHQwLm4gPSB0MS5uIDogZDNfdGltZXJfcXVldWVIZWFkID0gdDEubjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHQxLnQgPCB0aW1lKSB0aW1lID0gdDEudDtcbiAgICAgIHQxID0gKHQwID0gdDEpLm47XG4gICAgfVxuICB9XG4gIGQzX3RpbWVyX3F1ZXVlVGFpbCA9IHQwO1xuICByZXR1cm4gdGltZTtcbn1cbnZhciBkM19zdWJjbGFzcyA9IHt9Ll9fcHJvdG9fXz9cblxuLy8gVW50aWwgRUNNQVNjcmlwdCBzdXBwb3J0cyBhcnJheSBzdWJjbGFzc2luZywgcHJvdG90eXBlIGluamVjdGlvbiB3b3JrcyB3ZWxsLlxuZnVuY3Rpb24ob2JqZWN0LCBwcm90b3R5cGUpIHtcbiAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbn06XG5cbi8vIEFuZCBpZiB5b3VyIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IF9fcHJvdG9fXywgd2UnbGwgdXNlIGRpcmVjdCBleHRlbnNpb24uXG5mdW5jdGlvbihvYmplY3QsIHByb3RvdHlwZSkge1xuICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBwcm90b3R5cGUpIG9iamVjdFtwcm9wZXJ0eV0gPSBwcm90b3R5cGVbcHJvcGVydHldO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uKGdyb3Vwcykge1xuICBkM19zdWJjbGFzcyhncm91cHMsIGQzX3NlbGVjdGlvblByb3RvdHlwZSk7XG4gIHJldHVybiBncm91cHM7XG59XG5cbnZhciBkM19zZWxlY3QgPSBmdW5jdGlvbihzLCBuKSB7IHJldHVybiBuLnF1ZXJ5U2VsZWN0b3Iocyk7IH0sXG4gICAgZDNfc2VsZWN0QWxsID0gZnVuY3Rpb24ocywgbikgeyByZXR1cm4gbi5xdWVyeVNlbGVjdG9yQWxsKHMpOyB9LFxuICAgIGQzX3NlbGVjdE1hdGNoZXIgPSBkM19kb2N1bWVudEVsZW1lbnQubWF0Y2hlcyB8fCBkM19kb2N1bWVudEVsZW1lbnRbZDNfdmVuZG9yU3ltYm9sKGQzX2RvY3VtZW50RWxlbWVudCwgXCJtYXRjaGVzU2VsZWN0b3JcIildLFxuICAgIGQzX3NlbGVjdE1hdGNoZXMgPSBmdW5jdGlvbihuLCBzKSB7IHJldHVybiBkM19zZWxlY3RNYXRjaGVyLmNhbGwobiwgcyk7IH07XG5cbi8vIFByZWZlciBTaXp6bGUsIGlmIGF2YWlsYWJsZS5cbmlmICh0eXBlb2YgU2l6emxlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgZDNfc2VsZWN0ID0gZnVuY3Rpb24ocywgbikgeyByZXR1cm4gU2l6emxlKHMsIG4pWzBdIHx8IG51bGw7IH07XG4gIGQzX3NlbGVjdEFsbCA9IFNpenpsZTtcbiAgZDNfc2VsZWN0TWF0Y2hlcyA9IFNpenpsZS5tYXRjaGVzU2VsZWN0b3I7XG59XG5cbmQzLnNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZDNfc2VsZWN0aW9uUm9vdDtcbn07XG5cbnZhciBkM19zZWxlY3Rpb25Qcm90b3R5cGUgPSBkMy5zZWxlY3Rpb24ucHJvdG90eXBlID0gW107XG5cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gIHZhciBzdWJncm91cHMgPSBbXSxcbiAgICAgIHN1Ymdyb3VwLFxuICAgICAgc3Vibm9kZSxcbiAgICAgIGdyb3VwLFxuICAgICAgbm9kZTtcblxuICBzZWxlY3RvciA9IGQzX3NlbGVjdGlvbl9zZWxlY3RvcihzZWxlY3Rvcik7XG5cbiAgZm9yICh2YXIgaiA9IC0xLCBtID0gdGhpcy5sZW5ndGg7ICsraiA8IG07KSB7XG4gICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgc3ViZ3JvdXAucGFyZW50Tm9kZSA9IChncm91cCA9IHRoaXNbal0pLnBhcmVudE5vZGU7XG4gICAgZm9yICh2YXIgaSA9IC0xLCBuID0gZ3JvdXAubGVuZ3RoOyArK2kgPCBuOykge1xuICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkge1xuICAgICAgICBzdWJncm91cC5wdXNoKHN1Ym5vZGUgPSBzZWxlY3Rvci5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGksIGopKTtcbiAgICAgICAgaWYgKHN1Ym5vZGUgJiYgXCJfX2RhdGFfX1wiIGluIG5vZGUpIHN1Ym5vZGUuX19kYXRhX18gPSBub2RlLl9fZGF0YV9fO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3ViZ3JvdXAucHVzaChudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZDNfc2VsZWN0aW9uKHN1Ymdyb3Vwcyk7XG59O1xuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fc2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gXCJmdW5jdGlvblwiID8gc2VsZWN0b3IgOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2VsZWN0KHNlbGVjdG9yLCB0aGlzKTtcbiAgfTtcbn1cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLnNlbGVjdEFsbCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gIHZhciBzdWJncm91cHMgPSBbXSxcbiAgICAgIHN1Ymdyb3VwLFxuICAgICAgbm9kZTtcblxuICBzZWxlY3RvciA9IGQzX3NlbGVjdGlvbl9zZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgZm9yICh2YXIgaiA9IC0xLCBtID0gdGhpcy5sZW5ndGg7ICsraiA8IG07KSB7XG4gICAgZm9yICh2YXIgZ3JvdXAgPSB0aGlzW2pdLCBpID0gLTEsIG4gPSBncm91cC5sZW5ndGg7ICsraSA8IG47KSB7XG4gICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgIHN1Ymdyb3Vwcy5wdXNoKHN1Ymdyb3VwID0gZDNfYXJyYXkoc2VsZWN0b3IuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSkpO1xuICAgICAgICBzdWJncm91cC5wYXJlbnROb2RlID0gbm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZDNfc2VsZWN0aW9uKHN1Ymdyb3Vwcyk7XG59O1xuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fc2VsZWN0b3JBbGwoc2VsZWN0b3IpIHtcbiAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gXCJmdW5jdGlvblwiID8gc2VsZWN0b3IgOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2VsZWN0QWxsKHNlbGVjdG9yLCB0aGlzKTtcbiAgfTtcbn1cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLmF0dHIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcblxuICAgIC8vIEZvciBhdHRyKHN0cmluZyksIHJldHVybiB0aGUgYXR0cmlidXRlIHZhbHVlIGZvciB0aGUgZmlyc3Qgbm9kZS5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5ub2RlKCk7XG4gICAgICBuYW1lID0gZDMubnMucXVhbGlmeShuYW1lKTtcbiAgICAgIHJldHVybiBuYW1lLmxvY2FsXG4gICAgICAgICAgPyBub2RlLmdldEF0dHJpYnV0ZU5TKG5hbWUuc3BhY2UsIG5hbWUubG9jYWwpXG4gICAgICAgICAgOiBub2RlLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICB9XG5cbiAgICAvLyBGb3IgYXR0cihvYmplY3QpLCB0aGUgb2JqZWN0IHNwZWNpZmllcyB0aGUgbmFtZXMgYW5kIHZhbHVlcyBvZiB0aGVcbiAgICAvLyBhdHRyaWJ1dGVzIHRvIHNldCBvciByZW1vdmUuIFRoZSB2YWx1ZXMgbWF5IGJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICAgIC8vIGV2YWx1YXRlZCBmb3IgZWFjaCBlbGVtZW50LlxuICAgIGZvciAodmFsdWUgaW4gbmFtZSkgdGhpcy5lYWNoKGQzX3NlbGVjdGlvbl9hdHRyKHZhbHVlLCBuYW1lW3ZhbHVlXSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fYXR0cihuYW1lLCB2YWx1ZSkpO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2F0dHIobmFtZSwgdmFsdWUpIHtcbiAgbmFtZSA9IGQzLm5zLnF1YWxpZnkobmFtZSk7XG5cbiAgLy8gRm9yIGF0dHIoc3RyaW5nLCBudWxsKSwgcmVtb3ZlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUuXG4gIGZ1bmN0aW9uIGF0dHJOdWxsKCkge1xuICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9XG4gIGZ1bmN0aW9uIGF0dHJOdWxsTlMoKSB7XG4gICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGVOUyhuYW1lLnNwYWNlLCBuYW1lLmxvY2FsKTtcbiAgfVxuXG4gIC8vIEZvciBhdHRyKHN0cmluZywgc3RyaW5nKSwgc2V0IHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUuXG4gIGZ1bmN0aW9uIGF0dHJDb25zdGFudCgpIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gIH1cbiAgZnVuY3Rpb24gYXR0ckNvbnN0YW50TlMoKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVOUyhuYW1lLnNwYWNlLCBuYW1lLmxvY2FsLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBGb3IgYXR0cihzdHJpbmcsIGZ1bmN0aW9uKSwgZXZhbHVhdGUgdGhlIGZ1bmN0aW9uIGZvciBlYWNoIGVsZW1lbnQsIGFuZCBzZXRcbiAgLy8gb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGUgYXMgYXBwcm9wcmlhdGUuXG4gIGZ1bmN0aW9uIGF0dHJGdW5jdGlvbigpIHtcbiAgICB2YXIgeCA9IHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKHggPT0gbnVsbCkgdGhpcy5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgZWxzZSB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCB4KTtcbiAgfVxuICBmdW5jdGlvbiBhdHRyRnVuY3Rpb25OUygpIHtcbiAgICB2YXIgeCA9IHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKHggPT0gbnVsbCkgdGhpcy5yZW1vdmVBdHRyaWJ1dGVOUyhuYW1lLnNwYWNlLCBuYW1lLmxvY2FsKTtcbiAgICBlbHNlIHRoaXMuc2V0QXR0cmlidXRlTlMobmFtZS5zcGFjZSwgbmFtZS5sb2NhbCwgeCk7XG4gIH1cblxuICByZXR1cm4gdmFsdWUgPT0gbnVsbFxuICAgICAgPyAobmFtZS5sb2NhbCA/IGF0dHJOdWxsTlMgOiBhdHRyTnVsbCkgOiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gKG5hbWUubG9jYWwgPyBhdHRyRnVuY3Rpb25OUyA6IGF0dHJGdW5jdGlvbilcbiAgICAgIDogKG5hbWUubG9jYWwgPyBhdHRyQ29uc3RhbnROUyA6IGF0dHJDb25zdGFudCkpO1xufVxuZnVuY3Rpb24gZDNfY29sbGFwc2Uocykge1xuICByZXR1cm4gcy50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5kMy5yZXF1b3RlID0gZnVuY3Rpb24ocykge1xuICByZXR1cm4gcy5yZXBsYWNlKGQzX3JlcXVvdGVfcmUsIFwiXFxcXCQmXCIpO1xufTtcblxudmFyIGQzX3JlcXVvdGVfcmUgPSAvW1xcXFxcXF5cXCRcXCpcXCtcXD9cXHxcXFtcXF1cXChcXClcXC5cXHtcXH1dL2c7XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5jbGFzc2VkID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG5cbiAgICAvLyBGb3IgY2xhc3NlZChzdHJpbmcpLCByZXR1cm4gdHJ1ZSBvbmx5IGlmIHRoZSBmaXJzdCBub2RlIGhhcyB0aGUgc3BlY2lmaWVkXG4gICAgLy8gY2xhc3Mgb3IgY2xhc3Nlcy4gTm90ZSB0aGF0IGV2ZW4gaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRE9NVG9rZW5MaXN0LCBpdFxuICAgIC8vIHByb2JhYmx5IGRvZXNuJ3Qgc3VwcG9ydCBpdCBvbiBTVkcgZWxlbWVudHMgKHdoaWNoIGNhbiBiZSBhbmltYXRlZCkuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMubm9kZSgpLFxuICAgICAgICAgIG4gPSAobmFtZSA9IGQzX3NlbGVjdGlvbl9jbGFzc2VzKG5hbWUpKS5sZW5ndGgsXG4gICAgICAgICAgaSA9IC0xO1xuICAgICAgaWYgKHZhbHVlID0gbm9kZS5jbGFzc0xpc3QpIHtcbiAgICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICghdmFsdWUuY29udGFpbnMobmFtZVtpXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICghZDNfc2VsZWN0aW9uX2NsYXNzZWRSZShuYW1lW2ldKS50ZXN0KHZhbHVlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gRm9yIGNsYXNzZWQob2JqZWN0KSwgdGhlIG9iamVjdCBzcGVjaWZpZXMgdGhlIG5hbWVzIG9mIGNsYXNzZXMgdG8gYWRkIG9yXG4gICAgLy8gcmVtb3ZlLiBUaGUgdmFsdWVzIG1heSBiZSBmdW5jdGlvbnMgdGhhdCBhcmUgZXZhbHVhdGVkIGZvciBlYWNoIGVsZW1lbnQuXG4gICAgZm9yICh2YWx1ZSBpbiBuYW1lKSB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX2NsYXNzZWQodmFsdWUsIG5hbWVbdmFsdWVdKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBPdGhlcndpc2UsIGJvdGggYSBuYW1lIGFuZCBhIHZhbHVlIGFyZSBzcGVjaWZpZWQsIGFuZCBhcmUgaGFuZGxlZCBhcyBiZWxvdy5cbiAgcmV0dXJuIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fY2xhc3NlZChuYW1lLCB2YWx1ZSkpO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2NsYXNzZWRSZShuYW1lKSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKFwiKD86XnxcXFxccyspXCIgKyBkMy5yZXF1b3RlKG5hbWUpICsgXCIoPzpcXFxccyt8JClcIiwgXCJnXCIpO1xufVxuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlcyhuYW1lKSB7XG4gIHJldHVybiAobmFtZSArIFwiXCIpLnRyaW0oKS5zcGxpdCgvXnxcXHMrLyk7XG59XG5cbi8vIE11bHRpcGxlIGNsYXNzIG5hbWVzIGFyZSBhbGxvd2VkIChlLmcuLCBcImZvbyBiYXJcIikuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlZChuYW1lLCB2YWx1ZSkge1xuICBuYW1lID0gZDNfc2VsZWN0aW9uX2NsYXNzZXMobmFtZSkubWFwKGQzX3NlbGVjdGlvbl9jbGFzc2VkTmFtZSk7XG4gIHZhciBuID0gbmFtZS5sZW5ndGg7XG5cbiAgZnVuY3Rpb24gY2xhc3NlZENvbnN0YW50KCkge1xuICAgIHZhciBpID0gLTE7XG4gICAgd2hpbGUgKCsraSA8IG4pIG5hbWVbaV0odGhpcywgdmFsdWUpO1xuICB9XG5cbiAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlIGZ1bmN0aW9uIGlzIHN0aWxsIGV2YWx1YXRlZCBvbmx5IG9uY2UgcGVyXG4gIC8vIGVsZW1lbnQgZXZlbiBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgY2xhc3MgbmFtZXMuXG4gIGZ1bmN0aW9uIGNsYXNzZWRGdW5jdGlvbigpIHtcbiAgICB2YXIgaSA9IC0xLCB4ID0gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB3aGlsZSAoKytpIDwgbikgbmFtZVtpXSh0aGlzLCB4KTtcbiAgfVxuXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBjbGFzc2VkRnVuY3Rpb25cbiAgICAgIDogY2xhc3NlZENvbnN0YW50O1xufVxuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlZE5hbWUobmFtZSkge1xuICB2YXIgcmUgPSBkM19zZWxlY3Rpb25fY2xhc3NlZFJlKG5hbWUpO1xuICByZXR1cm4gZnVuY3Rpb24obm9kZSwgdmFsdWUpIHtcbiAgICBpZiAoYyA9IG5vZGUuY2xhc3NMaXN0KSByZXR1cm4gdmFsdWUgPyBjLmFkZChuYW1lKSA6IGMucmVtb3ZlKG5hbWUpO1xuICAgIHZhciBjID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgcmUubGFzdEluZGV4ID0gMDtcbiAgICAgIGlmICghcmUudGVzdChjKSkgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBkM19jb2xsYXBzZShjICsgXCIgXCIgKyBuYW1lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZDNfY29sbGFwc2UoYy5yZXBsYWNlKHJlLCBcIiBcIikpKTtcbiAgICB9XG4gIH07XG59XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5zdHlsZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBwcmlvcml0eSkge1xuICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIGlmIChuIDwgMykge1xuXG4gICAgLy8gRm9yIHN0eWxlKG9iamVjdCkgb3Igc3R5bGUob2JqZWN0LCBzdHJpbmcpLCB0aGUgb2JqZWN0IHNwZWNpZmllcyB0aGVcbiAgICAvLyBuYW1lcyBhbmQgdmFsdWVzIG9mIHRoZSBhdHRyaWJ1dGVzIHRvIHNldCBvciByZW1vdmUuIFRoZSB2YWx1ZXMgbWF5IGJlXG4gICAgLy8gZnVuY3Rpb25zIHRoYXQgYXJlIGV2YWx1YXRlZCBmb3IgZWFjaCBlbGVtZW50LiBUaGUgb3B0aW9uYWwgc3RyaW5nXG4gICAgLy8gc3BlY2lmaWVzIHRoZSBwcmlvcml0eS5cbiAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGlmIChuIDwgMikgdmFsdWUgPSBcIlwiO1xuICAgICAgZm9yIChwcmlvcml0eSBpbiBuYW1lKSB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX3N0eWxlKHByaW9yaXR5LCBuYW1lW3ByaW9yaXR5XSwgdmFsdWUpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIEZvciBzdHlsZShzdHJpbmcpLCByZXR1cm4gdGhlIGNvbXB1dGVkIHN0eWxlIHZhbHVlIGZvciB0aGUgZmlyc3Qgbm9kZS5cbiAgICBpZiAobiA8IDIpIHJldHVybiBkM193aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5vZGUoKSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcblxuICAgIC8vIEZvciBzdHlsZShzdHJpbmcsIHN0cmluZykgb3Igc3R5bGUoc3RyaW5nLCBmdW5jdGlvbiksIHVzZSB0aGUgZGVmYXVsdFxuICAgIC8vIHByaW9yaXR5LiBUaGUgcHJpb3JpdHkgaXMgaWdub3JlZCBmb3Igc3R5bGUoc3RyaW5nLCBudWxsKS5cbiAgICBwcmlvcml0eSA9IFwiXCI7XG4gIH1cblxuICAvLyBPdGhlcndpc2UsIGEgbmFtZSwgdmFsdWUgYW5kIHByaW9yaXR5IGFyZSBzcGVjaWZpZWQsIGFuZCBoYW5kbGVkIGFzIGJlbG93LlxuICByZXR1cm4gdGhpcy5lYWNoKGQzX3NlbGVjdGlvbl9zdHlsZShuYW1lLCB2YWx1ZSwgcHJpb3JpdHkpKTtcbn07XG5cbmZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9zdHlsZShuYW1lLCB2YWx1ZSwgcHJpb3JpdHkpIHtcblxuICAvLyBGb3Igc3R5bGUobmFtZSwgbnVsbCkgb3Igc3R5bGUobmFtZSwgbnVsbCwgcHJpb3JpdHkpLCByZW1vdmUgdGhlIHN0eWxlXG4gIC8vIHByb3BlcnR5IHdpdGggdGhlIHNwZWNpZmllZCBuYW1lLiBUaGUgcHJpb3JpdHkgaXMgaWdub3JlZC5cbiAgZnVuY3Rpb24gc3R5bGVOdWxsKCkge1xuICAgIHRoaXMuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gIH1cblxuICAvLyBGb3Igc3R5bGUobmFtZSwgc3RyaW5nKSBvciBzdHlsZShuYW1lLCBzdHJpbmcsIHByaW9yaXR5KSwgc2V0IHRoZSBzdHlsZVxuICAvLyBwcm9wZXJ0eSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZSwgdXNpbmcgdGhlIHNwZWNpZmllZCBwcmlvcml0eS5cbiAgZnVuY3Rpb24gc3R5bGVDb25zdGFudCgpIHtcbiAgICB0aGlzLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlLCBwcmlvcml0eSk7XG4gIH1cblxuICAvLyBGb3Igc3R5bGUobmFtZSwgZnVuY3Rpb24pIG9yIHN0eWxlKG5hbWUsIGZ1bmN0aW9uLCBwcmlvcml0eSksIGV2YWx1YXRlIHRoZVxuICAvLyBmdW5jdGlvbiBmb3IgZWFjaCBlbGVtZW50LCBhbmQgc2V0IG9yIHJlbW92ZSB0aGUgc3R5bGUgcHJvcGVydHkgYXNcbiAgLy8gYXBwcm9wcmlhdGUuIFdoZW4gc2V0dGluZywgdXNlIHRoZSBzcGVjaWZpZWQgcHJpb3JpdHkuXG4gIGZ1bmN0aW9uIHN0eWxlRnVuY3Rpb24oKSB7XG4gICAgdmFyIHggPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh4ID09IG51bGwpIHRoaXMuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgZWxzZSB0aGlzLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHgsIHByaW9yaXR5KTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZSA9PSBudWxsXG4gICAgICA/IHN0eWxlTnVsbCA6ICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBzdHlsZUZ1bmN0aW9uIDogc3R5bGVDb25zdGFudCk7XG59XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5wcm9wZXJ0eSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuXG4gICAgLy8gRm9yIHByb3BlcnR5KHN0cmluZyksIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgZm9yIHRoZSBmaXJzdCBub2RlLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHRoaXMubm9kZSgpW25hbWVdO1xuXG4gICAgLy8gRm9yIHByb3BlcnR5KG9iamVjdCksIHRoZSBvYmplY3Qgc3BlY2lmaWVzIHRoZSBuYW1lcyBhbmQgdmFsdWVzIG9mIHRoZVxuICAgIC8vIHByb3BlcnRpZXMgdG8gc2V0IG9yIHJlbW92ZS4gVGhlIHZhbHVlcyBtYXkgYmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gICAgLy8gZXZhbHVhdGVkIGZvciBlYWNoIGVsZW1lbnQuXG4gICAgZm9yICh2YWx1ZSBpbiBuYW1lKSB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX3Byb3BlcnR5KHZhbHVlLCBuYW1lW3ZhbHVlXSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gT3RoZXJ3aXNlLCBib3RoIGEgbmFtZSBhbmQgYSB2YWx1ZSBhcmUgc3BlY2lmaWVkLCBhbmQgYXJlIGhhbmRsZWQgYXMgYmVsb3cuXG4gIHJldHVybiB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX3Byb3BlcnR5KG5hbWUsIHZhbHVlKSk7XG59O1xuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fcHJvcGVydHkobmFtZSwgdmFsdWUpIHtcblxuICAvLyBGb3IgcHJvcGVydHkobmFtZSwgbnVsbCksIHJlbW92ZSB0aGUgcHJvcGVydHkgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUuXG4gIGZ1bmN0aW9uIHByb3BlcnR5TnVsbCgpIHtcbiAgICBkZWxldGUgdGhpc1tuYW1lXTtcbiAgfVxuXG4gIC8vIEZvciBwcm9wZXJ0eShuYW1lLCBzdHJpbmcpLCBzZXQgdGhlIHByb3BlcnR5IHdpdGggdGhlIHNwZWNpZmllZCBuYW1lLlxuICBmdW5jdGlvbiBwcm9wZXJ0eUNvbnN0YW50KCkge1xuICAgIHRoaXNbbmFtZV0gPSB2YWx1ZTtcbiAgfVxuXG4gIC8vIEZvciBwcm9wZXJ0eShuYW1lLCBmdW5jdGlvbiksIGV2YWx1YXRlIHRoZSBmdW5jdGlvbiBmb3IgZWFjaCBlbGVtZW50LCBhbmRcbiAgLy8gc2V0IG9yIHJlbW92ZSB0aGUgcHJvcGVydHkgYXMgYXBwcm9wcmlhdGUuXG4gIGZ1bmN0aW9uIHByb3BlcnR5RnVuY3Rpb24oKSB7XG4gICAgdmFyIHggPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh4ID09IG51bGwpIGRlbGV0ZSB0aGlzW25hbWVdO1xuICAgIGVsc2UgdGhpc1tuYW1lXSA9IHg7XG4gIH1cblxuICByZXR1cm4gdmFsdWUgPT0gbnVsbFxuICAgICAgPyBwcm9wZXJ0eU51bGwgOiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gcHJvcGVydHlGdW5jdGlvbiA6IHByb3BlcnR5Q29uc3RhbnQpO1xufVxuXG5kM19zZWxlY3Rpb25Qcm90b3R5cGUudGV4dCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IHRoaXMuZWFjaCh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBmdW5jdGlvbigpIHsgdmFyIHYgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB0aGlzLnRleHRDb250ZW50ID0gdiA9PSBudWxsID8gXCJcIiA6IHY7IH0gOiB2YWx1ZSA9PSBudWxsXG4gICAgICA/IGZ1bmN0aW9uKCkgeyB0aGlzLnRleHRDb250ZW50ID0gXCJcIjsgfVxuICAgICAgOiBmdW5jdGlvbigpIHsgdGhpcy50ZXh0Q29udGVudCA9IHZhbHVlOyB9KVxuICAgICAgOiB0aGlzLm5vZGUoKS50ZXh0Q29udGVudDtcbn07XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5odG1sID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gdGhpcy5lYWNoKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICA/IGZ1bmN0aW9uKCkgeyB2YXIgdiA9IHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IHRoaXMuaW5uZXJIVE1MID0gdiA9PSBudWxsID8gXCJcIiA6IHY7IH0gOiB2YWx1ZSA9PSBudWxsXG4gICAgICA/IGZ1bmN0aW9uKCkgeyB0aGlzLmlubmVySFRNTCA9IFwiXCI7IH1cbiAgICAgIDogZnVuY3Rpb24oKSB7IHRoaXMuaW5uZXJIVE1MID0gdmFsdWU7IH0pXG4gICAgICA6IHRoaXMubm9kZSgpLmlubmVySFRNTDtcbn07XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIG5hbWUgPSBkM19zZWxlY3Rpb25fY3JlYXRvcihuYW1lKTtcbiAgcmV0dXJuIHRoaXMuc2VsZWN0KGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFwcGVuZENoaWxkKG5hbWUuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2NyZWF0b3IobmFtZSkge1xuICByZXR1cm4gdHlwZW9mIG5hbWUgPT09IFwiZnVuY3Rpb25cIiA/IG5hbWVcbiAgICAgIDogKG5hbWUgPSBkMy5ucy5xdWFsaWZ5KG5hbWUpKS5sb2NhbCA/IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lLnNwYWNlLCBuYW1lLmxvY2FsKTsgfVxuICAgICAgOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50TlModGhpcy5uYW1lc3BhY2VVUkksIG5hbWUpOyB9O1xufVxuXG5kM19zZWxlY3Rpb25Qcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24obmFtZSwgYmVmb3JlKSB7XG4gIG5hbWUgPSBkM19zZWxlY3Rpb25fY3JlYXRvcihuYW1lKTtcbiAgYmVmb3JlID0gZDNfc2VsZWN0aW9uX3NlbGVjdG9yKGJlZm9yZSk7XG4gIHJldHVybiB0aGlzLnNlbGVjdChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNlcnRCZWZvcmUobmFtZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBiZWZvcmUuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCBudWxsKTtcbiAgfSk7XG59O1xuXG4vLyBUT0RPIHJlbW92ZShzZWxlY3Rvcik/XG4vLyBUT0RPIHJlbW92ZShub2RlKT9cbi8vIFRPRE8gcmVtb3ZlKGZ1bmN0aW9uKT9cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnQpIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgfSk7XG59O1xuXG5kMy5zZXQgPSBmdW5jdGlvbihhcnJheSkge1xuICB2YXIgc2V0ID0gbmV3IGQzX1NldDtcbiAgaWYgKGFycmF5KSBmb3IgKHZhciBpID0gMCwgbiA9IGFycmF5Lmxlbmd0aDsgaSA8IG47ICsraSkgc2V0LmFkZChhcnJheVtpXSk7XG4gIHJldHVybiBzZXQ7XG59O1xuXG5mdW5jdGlvbiBkM19TZXQoKSB7XG4gIHRoaXMuXyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5cbmQzX2NsYXNzKGQzX1NldCwge1xuICBoYXM6IGQzX21hcF9oYXMsXG4gIGFkZDogZnVuY3Rpb24oa2V5KSB7XG4gICAgdGhpcy5fW2QzX21hcF9lc2NhcGUoa2V5ICs9IFwiXCIpXSA9IHRydWU7XG4gICAgcmV0dXJuIGtleTtcbiAgfSxcbiAgcmVtb3ZlOiBkM19tYXBfcmVtb3ZlLFxuICB2YWx1ZXM6IGQzX21hcF9rZXlzLFxuICBzaXplOiBkM19tYXBfc2l6ZSxcbiAgZW1wdHk6IGQzX21hcF9lbXB0eSxcbiAgZm9yRWFjaDogZnVuY3Rpb24oZikge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl8pIGYuY2FsbCh0aGlzLCBkM19tYXBfdW5lc2NhcGUoa2V5KSk7XG4gIH1cbn0pO1xuXG5kM19zZWxlY3Rpb25Qcm90b3R5cGUuZGF0YSA9IGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgdmFyIGkgPSAtMSxcbiAgICAgIG4gPSB0aGlzLmxlbmd0aCxcbiAgICAgIGdyb3VwLFxuICAgICAgbm9kZTtcblxuICAvLyBJZiBubyB2YWx1ZSBpcyBzcGVjaWZpZWQsIHJldHVybiB0aGUgZmlyc3QgdmFsdWUuXG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHZhbHVlID0gbmV3IEFycmF5KG4gPSAoZ3JvdXAgPSB0aGlzWzBdKS5sZW5ndGgpO1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgIHZhbHVlW2ldID0gbm9kZS5fX2RhdGFfXztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZChncm91cCwgZ3JvdXBEYXRhKSB7XG4gICAgdmFyIGksXG4gICAgICAgIG4gPSBncm91cC5sZW5ndGgsXG4gICAgICAgIG0gPSBncm91cERhdGEubGVuZ3RoLFxuICAgICAgICBuMCA9IE1hdGgubWluKG4sIG0pLFxuICAgICAgICB1cGRhdGVOb2RlcyA9IG5ldyBBcnJheShtKSxcbiAgICAgICAgZW50ZXJOb2RlcyA9IG5ldyBBcnJheShtKSxcbiAgICAgICAgZXhpdE5vZGVzID0gbmV3IEFycmF5KG4pLFxuICAgICAgICBub2RlLFxuICAgICAgICBub2RlRGF0YTtcblxuICAgIGlmIChrZXkpIHtcbiAgICAgIHZhciBub2RlQnlLZXlWYWx1ZSA9IG5ldyBkM19NYXAsXG4gICAgICAgICAga2V5VmFsdWVzID0gbmV3IEFycmF5KG4pLFxuICAgICAgICAgIGtleVZhbHVlO1xuXG4gICAgICBmb3IgKGkgPSAtMTsgKytpIDwgbjspIHtcbiAgICAgICAgaWYgKG5vZGVCeUtleVZhbHVlLmhhcyhrZXlWYWx1ZSA9IGtleS5jYWxsKG5vZGUgPSBncm91cFtpXSwgbm9kZS5fX2RhdGFfXywgaSkpKSB7XG4gICAgICAgICAgZXhpdE5vZGVzW2ldID0gbm9kZTsgLy8gZHVwbGljYXRlIHNlbGVjdGlvbiBrZXlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub2RlQnlLZXlWYWx1ZS5zZXQoa2V5VmFsdWUsIG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGtleVZhbHVlc1tpXSA9IGtleVZhbHVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAtMTsgKytpIDwgbTspIHtcbiAgICAgICAgaWYgKCEobm9kZSA9IG5vZGVCeUtleVZhbHVlLmdldChrZXlWYWx1ZSA9IGtleS5jYWxsKGdyb3VwRGF0YSwgbm9kZURhdGEgPSBncm91cERhdGFbaV0sIGkpKSkpIHtcbiAgICAgICAgICBlbnRlck5vZGVzW2ldID0gZDNfc2VsZWN0aW9uX2RhdGFOb2RlKG5vZGVEYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlICE9PSB0cnVlKSB7IC8vIG5vIGR1cGxpY2F0ZSBkYXRhIGtleVxuICAgICAgICAgIHVwZGF0ZU5vZGVzW2ldID0gbm9kZTtcbiAgICAgICAgICBub2RlLl9fZGF0YV9fID0gbm9kZURhdGE7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUJ5S2V5VmFsdWUuc2V0KGtleVZhbHVlLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChpID0gLTE7ICsraSA8IG47KSB7XG4gICAgICAgIGlmIChub2RlQnlLZXlWYWx1ZS5nZXQoa2V5VmFsdWVzW2ldKSAhPT0gdHJ1ZSkge1xuICAgICAgICAgIGV4aXROb2Rlc1tpXSA9IGdyb3VwW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IC0xOyArK2kgPCBuMDspIHtcbiAgICAgICAgbm9kZSA9IGdyb3VwW2ldO1xuICAgICAgICBub2RlRGF0YSA9IGdyb3VwRGF0YVtpXTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICBub2RlLl9fZGF0YV9fID0gbm9kZURhdGE7XG4gICAgICAgICAgdXBkYXRlTm9kZXNbaV0gPSBub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudGVyTm9kZXNbaV0gPSBkM19zZWxlY3Rpb25fZGF0YU5vZGUobm9kZURhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKDsgaSA8IG07ICsraSkge1xuICAgICAgICBlbnRlck5vZGVzW2ldID0gZDNfc2VsZWN0aW9uX2RhdGFOb2RlKGdyb3VwRGF0YVtpXSk7XG4gICAgICB9XG4gICAgICBmb3IgKDsgaSA8IG47ICsraSkge1xuICAgICAgICBleGl0Tm9kZXNbaV0gPSBncm91cFtpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRlck5vZGVzLnVwZGF0ZVxuICAgICAgICA9IHVwZGF0ZU5vZGVzO1xuXG4gICAgZW50ZXJOb2Rlcy5wYXJlbnROb2RlXG4gICAgICAgID0gdXBkYXRlTm9kZXMucGFyZW50Tm9kZVxuICAgICAgICA9IGV4aXROb2Rlcy5wYXJlbnROb2RlXG4gICAgICAgID0gZ3JvdXAucGFyZW50Tm9kZTtcblxuICAgIGVudGVyLnB1c2goZW50ZXJOb2Rlcyk7XG4gICAgdXBkYXRlLnB1c2godXBkYXRlTm9kZXMpO1xuICAgIGV4aXQucHVzaChleGl0Tm9kZXMpO1xuICB9XG5cbiAgdmFyIGVudGVyID0gZDNfc2VsZWN0aW9uX2VudGVyKFtdKSxcbiAgICAgIHVwZGF0ZSA9IGQzX3NlbGVjdGlvbihbXSksXG4gICAgICBleGl0ID0gZDNfc2VsZWN0aW9uKFtdKTtcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgYmluZChncm91cCA9IHRoaXNbaV0sIHZhbHVlLmNhbGwoZ3JvdXAsIGdyb3VwLnBhcmVudE5vZGUuX19kYXRhX18sIGkpKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGJpbmQoZ3JvdXAgPSB0aGlzW2ldLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlLmVudGVyID0gZnVuY3Rpb24oKSB7IHJldHVybiBlbnRlcjsgfTtcbiAgdXBkYXRlLmV4aXQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGV4aXQ7IH07XG4gIHJldHVybiB1cGRhdGU7XG59O1xuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fZGF0YU5vZGUoZGF0YSkge1xuICByZXR1cm4ge19fZGF0YV9fOiBkYXRhfTtcbn1cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLmRhdHVtID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gdGhpcy5wcm9wZXJ0eShcIl9fZGF0YV9fXCIsIHZhbHVlKVxuICAgICAgOiB0aGlzLnByb3BlcnR5KFwiX19kYXRhX19cIik7XG59O1xuXG5kM19zZWxlY3Rpb25Qcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oZmlsdGVyKSB7XG4gIHZhciBzdWJncm91cHMgPSBbXSxcbiAgICAgIHN1Ymdyb3VwLFxuICAgICAgZ3JvdXAsXG4gICAgICBub2RlO1xuXG4gIGlmICh0eXBlb2YgZmlsdGVyICE9PSBcImZ1bmN0aW9uXCIpIGZpbHRlciA9IGQzX3NlbGVjdGlvbl9maWx0ZXIoZmlsdGVyKTtcblxuICBmb3IgKHZhciBqID0gMCwgbSA9IHRoaXMubGVuZ3RoOyBqIDwgbTsgaisrKSB7XG4gICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgc3ViZ3JvdXAucGFyZW50Tm9kZSA9IChncm91cCA9IHRoaXNbal0pLnBhcmVudE5vZGU7XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBncm91cC5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgIGlmICgobm9kZSA9IGdyb3VwW2ldKSAmJiBmaWx0ZXIuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSkge1xuICAgICAgICBzdWJncm91cC5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkM19zZWxlY3Rpb24oc3ViZ3JvdXBzKTtcbn07XG5cbmZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9maWx0ZXIoc2VsZWN0b3IpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19zZWxlY3RNYXRjaGVzKHRoaXMsIHNlbGVjdG9yKTtcbiAgfTtcbn1cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLm9yZGVyID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGogPSAtMSwgbSA9IHRoaXMubGVuZ3RoOyArK2ogPCBtOykge1xuICAgIGZvciAodmFyIGdyb3VwID0gdGhpc1tqXSwgaSA9IGdyb3VwLmxlbmd0aCAtIDEsIG5leHQgPSBncm91cFtpXSwgbm9kZTsgLS1pID49IDA7KSB7XG4gICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgIGlmIChuZXh0ICYmIG5leHQgIT09IG5vZGUubmV4dFNpYmxpbmcpIG5leHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgbmV4dCk7XG4gICAgICAgIG5leHQgPSBub2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5kMy5hc2NlbmRpbmcgPSBkM19hc2NlbmRpbmc7XG5cbmZ1bmN0aW9uIGQzX2FzY2VuZGluZyhhLCBiKSB7XG4gIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogYSA+PSBiID8gMCA6IE5hTjtcbn1cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gIGNvbXBhcmF0b3IgPSBkM19zZWxlY3Rpb25fc29ydENvbXBhcmF0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgZm9yICh2YXIgaiA9IC0xLCBtID0gdGhpcy5sZW5ndGg7ICsraiA8IG07KSB0aGlzW2pdLnNvcnQoY29tcGFyYXRvcik7XG4gIHJldHVybiB0aGlzLm9yZGVyKCk7XG59O1xuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fc29ydENvbXBhcmF0b3IoY29tcGFyYXRvcikge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIGNvbXBhcmF0b3IgPSBkM19hc2NlbmRpbmc7XG4gIHJldHVybiBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGEgJiYgYiA/IGNvbXBhcmF0b3IoYS5fX2RhdGFfXywgYi5fX2RhdGFfXykgOiAhYSAtICFiO1xuICB9O1xufVxuZnVuY3Rpb24gZDNfbm9vcCgpIHt9XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyLCBjYXB0dXJlKSB7XG4gIHZhciBuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgaWYgKG4gPCAzKSB7XG5cbiAgICAvLyBGb3Igb24ob2JqZWN0KSBvciBvbihvYmplY3QsIGJvb2xlYW4pLCB0aGUgb2JqZWN0IHNwZWNpZmllcyB0aGUgZXZlbnRcbiAgICAvLyB0eXBlcyBhbmQgbGlzdGVuZXJzIHRvIGFkZCBvciByZW1vdmUuIFRoZSBvcHRpb25hbCBib29sZWFuIHNwZWNpZmllc1xuICAgIC8vIHdoZXRoZXIgdGhlIGxpc3RlbmVyIGNhcHR1cmVzIGV2ZW50cy5cbiAgICBpZiAodHlwZW9mIHR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGlmIChuIDwgMikgbGlzdGVuZXIgPSBmYWxzZTtcbiAgICAgIGZvciAoY2FwdHVyZSBpbiB0eXBlKSB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX29uKGNhcHR1cmUsIHR5cGVbY2FwdHVyZV0sIGxpc3RlbmVyKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyBGb3Igb24oc3RyaW5nKSwgcmV0dXJuIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGZpcnN0IG5vZGUuXG4gICAgaWYgKG4gPCAyKSByZXR1cm4gKG4gPSB0aGlzLm5vZGUoKVtcIl9fb25cIiArIHR5cGVdKSAmJiBuLl87XG5cbiAgICAvLyBGb3Igb24oc3RyaW5nLCBmdW5jdGlvbiksIHVzZSB0aGUgZGVmYXVsdCBjYXB0dXJlLlxuICAgIGNhcHR1cmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIE90aGVyd2lzZSwgYSB0eXBlLCBsaXN0ZW5lciBhbmQgY2FwdHVyZSBhcmUgc3BlY2lmaWVkLCBhbmQgaGFuZGxlZCBhcyBiZWxvdy5cbiAgcmV0dXJuIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fb24odHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpKTtcbn07XG5cbmZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9vbih0eXBlLCBsaXN0ZW5lciwgY2FwdHVyZSkge1xuICB2YXIgbmFtZSA9IFwiX19vblwiICsgdHlwZSxcbiAgICAgIGkgPSB0eXBlLmluZGV4T2YoXCIuXCIpLFxuICAgICAgd3JhcCA9IGQzX3NlbGVjdGlvbl9vbkxpc3RlbmVyO1xuXG4gIGlmIChpID4gMCkgdHlwZSA9IHR5cGUuc2xpY2UoMCwgaSk7XG4gIHZhciBmaWx0ZXIgPSBkM19zZWxlY3Rpb25fb25GaWx0ZXJzLmdldCh0eXBlKTtcbiAgaWYgKGZpbHRlcikgdHlwZSA9IGZpbHRlciwgd3JhcCA9IGQzX3NlbGVjdGlvbl9vbkZpbHRlcjtcblxuICBmdW5jdGlvbiBvblJlbW92ZSgpIHtcbiAgICB2YXIgbCA9IHRoaXNbbmFtZV07XG4gICAgaWYgKGwpIHtcbiAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsLCBsLiQpO1xuICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25BZGQoKSB7XG4gICAgdmFyIGwgPSB3cmFwKGxpc3RlbmVyLCBkM19hcnJheShhcmd1bWVudHMpKTtcbiAgICBvblJlbW92ZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCB0aGlzW25hbWVdID0gbCwgbC4kID0gY2FwdHVyZSk7XG4gICAgbC5fID0gbGlzdGVuZXI7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIl5fX29uKFteLl0rKVwiICsgZDMucmVxdW90ZSh0eXBlKSArIFwiJFwiKSxcbiAgICAgICAgbWF0Y2g7XG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzKSB7XG4gICAgICBpZiAobWF0Y2ggPSBuYW1lLm1hdGNoKHJlKSkge1xuICAgICAgICB2YXIgbCA9IHRoaXNbbmFtZV07XG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihtYXRjaFsxXSwgbCwgbC4kKTtcbiAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlcbiAgICAgID8gbGlzdGVuZXIgPyBvbkFkZCA6IG9uUmVtb3ZlXG4gICAgICA6IGxpc3RlbmVyID8gZDNfbm9vcCA6IHJlbW92ZUFsbDtcbn1cblxudmFyIGQzX3NlbGVjdGlvbl9vbkZpbHRlcnMgPSBkMy5tYXAoe1xuICBtb3VzZWVudGVyOiBcIm1vdXNlb3ZlclwiLFxuICBtb3VzZWxlYXZlOiBcIm1vdXNlb3V0XCJcbn0pO1xuXG5kM19zZWxlY3Rpb25fb25GaWx0ZXJzLmZvckVhY2goZnVuY3Rpb24oaykge1xuICBpZiAoXCJvblwiICsgayBpbiBkM19kb2N1bWVudCkgZDNfc2VsZWN0aW9uX29uRmlsdGVycy5yZW1vdmUoayk7XG59KTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX29uTGlzdGVuZXIobGlzdGVuZXIsIGFyZ3VtZW50eikge1xuICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgIHZhciBvID0gZDMuZXZlbnQ7IC8vIEV2ZW50cyBjYW4gYmUgcmVlbnRyYW50IChlLmcuLCBmb2N1cykuXG4gICAgZDMuZXZlbnQgPSBlO1xuICAgIGFyZ3VtZW50elswXSA9IHRoaXMuX19kYXRhX187XG4gICAgdHJ5IHtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50eik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGQzLmV2ZW50ID0gbztcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9vbkZpbHRlcihsaXN0ZW5lciwgYXJndW1lbnR6KSB7XG4gIHZhciBsID0gZDNfc2VsZWN0aW9uX29uTGlzdGVuZXIobGlzdGVuZXIsIGFyZ3VtZW50eik7XG4gIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMsIHJlbGF0ZWQgPSBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgaWYgKCFyZWxhdGVkIHx8IChyZWxhdGVkICE9PSB0YXJnZXQgJiYgIShyZWxhdGVkLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKHRhcmdldCkgJiA4KSkpIHtcbiAgICAgIGwuY2FsbCh0YXJnZXQsIGUpO1xuICAgIH1cbiAgfTtcbn1cblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICByZXR1cm4gZDNfc2VsZWN0aW9uX2VhY2godGhpcywgZnVuY3Rpb24obm9kZSwgaSwgaikge1xuICAgIGNhbGxiYWNrLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgaik7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2VhY2goZ3JvdXBzLCBjYWxsYmFjaykge1xuICBmb3IgKHZhciBqID0gMCwgbSA9IGdyb3Vwcy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICBmb3IgKHZhciBncm91cCA9IGdyb3Vwc1tqXSwgaSA9IDAsIG4gPSBncm91cC5sZW5ndGgsIG5vZGU7IGkgPCBuOyBpKyspIHtcbiAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIGNhbGxiYWNrKG5vZGUsIGksIGopO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZ3JvdXBzO1xufVxuXG5kM19zZWxlY3Rpb25Qcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciBhcmdzID0gZDNfYXJyYXkoYXJndW1lbnRzKTtcbiAgY2FsbGJhY2suYXBwbHkoYXJnc1swXSA9IHRoaXMsIGFyZ3MpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmQzX3NlbGVjdGlvblByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMubm9kZSgpO1xufTtcblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLm5vZGUgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaiA9IDAsIG0gPSB0aGlzLmxlbmd0aDsgaiA8IG07IGorKykge1xuICAgIGZvciAodmFyIGdyb3VwID0gdGhpc1tqXSwgaSA9IDAsIG4gPSBncm91cC5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgIHZhciBub2RlID0gZ3JvdXBbaV07XG4gICAgICBpZiAobm9kZSkgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG4gPSAwO1xuICBkM19zZWxlY3Rpb25fZWFjaCh0aGlzLCBmdW5jdGlvbigpIHsgKytuOyB9KTtcbiAgcmV0dXJuIG47XG59O1xuXG5mdW5jdGlvbiBkM19zZWxlY3Rpb25fZW50ZXIoc2VsZWN0aW9uKSB7XG4gIGQzX3N1YmNsYXNzKHNlbGVjdGlvbiwgZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlKTtcbiAgcmV0dXJuIHNlbGVjdGlvbjtcbn1cblxudmFyIGQzX3NlbGVjdGlvbl9lbnRlclByb3RvdHlwZSA9IFtdO1xuXG5kMy5zZWxlY3Rpb24uZW50ZXIgPSBkM19zZWxlY3Rpb25fZW50ZXI7XG5kMy5zZWxlY3Rpb24uZW50ZXIucHJvdG90eXBlID0gZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlO1xuXG5kM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuYXBwZW5kID0gZDNfc2VsZWN0aW9uUHJvdG90eXBlLmFwcGVuZDtcbmQzX3NlbGVjdGlvbl9lbnRlclByb3RvdHlwZS5lbXB0eSA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5lbXB0eTtcbmQzX3NlbGVjdGlvbl9lbnRlclByb3RvdHlwZS5ub2RlID0gZDNfc2VsZWN0aW9uUHJvdG90eXBlLm5vZGU7XG5kM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuY2FsbCA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5jYWxsO1xuZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlLnNpemUgPSBkM19zZWxlY3Rpb25Qcm90b3R5cGUuc2l6ZTtcblxuXG5kM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgdmFyIHN1Ymdyb3VwcyA9IFtdLFxuICAgICAgc3ViZ3JvdXAsXG4gICAgICBzdWJub2RlLFxuICAgICAgdXBncm91cCxcbiAgICAgIGdyb3VwLFxuICAgICAgbm9kZTtcblxuICBmb3IgKHZhciBqID0gLTEsIG0gPSB0aGlzLmxlbmd0aDsgKytqIDwgbTspIHtcbiAgICB1cGdyb3VwID0gKGdyb3VwID0gdGhpc1tqXSkudXBkYXRlO1xuICAgIHN1Ymdyb3Vwcy5wdXNoKHN1Ymdyb3VwID0gW10pO1xuICAgIHN1Ymdyb3VwLnBhcmVudE5vZGUgPSBncm91cC5wYXJlbnROb2RlO1xuICAgIGZvciAodmFyIGkgPSAtMSwgbiA9IGdyb3VwLmxlbmd0aDsgKytpIDwgbjspIHtcbiAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgc3ViZ3JvdXAucHVzaCh1cGdyb3VwW2ldID0gc3Vibm9kZSA9IHNlbGVjdG9yLmNhbGwoZ3JvdXAucGFyZW50Tm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgaikpO1xuICAgICAgICBzdWJub2RlLl9fZGF0YV9fID0gbm9kZS5fX2RhdGFfXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1Ymdyb3VwLnB1c2gobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGQzX3NlbGVjdGlvbihzdWJncm91cHMpO1xufTtcblxuZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uKG5hbWUsIGJlZm9yZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIGJlZm9yZSA9IGQzX3NlbGVjdGlvbl9lbnRlckluc2VydEJlZm9yZSh0aGlzKTtcbiAgcmV0dXJuIGQzX3NlbGVjdGlvblByb3RvdHlwZS5pbnNlcnQuY2FsbCh0aGlzLCBuYW1lLCBiZWZvcmUpO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2VudGVySW5zZXJ0QmVmb3JlKGVudGVyKSB7XG4gIHZhciBpMCwgajA7XG4gIHJldHVybiBmdW5jdGlvbihkLCBpLCBqKSB7XG4gICAgdmFyIGdyb3VwID0gZW50ZXJbal0udXBkYXRlLFxuICAgICAgICBuID0gZ3JvdXAubGVuZ3RoLFxuICAgICAgICBub2RlO1xuICAgIGlmIChqICE9IGowKSBqMCA9IGosIGkwID0gMDtcbiAgICBpZiAoaSA+PSBpMCkgaTAgPSBpICsgMTtcbiAgICB3aGlsZSAoIShub2RlID0gZ3JvdXBbaTBdKSAmJiArK2kwIDwgbik7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG59XG5cbi8vIGltcG9ydCBcIi4uL3RyYW5zaXRpb24vdHJhbnNpdGlvblwiO1xuXG5kM19zZWxlY3Rpb25Qcm90b3R5cGUudHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWQgPSBkM190cmFuc2l0aW9uSW5oZXJpdElkIHx8ICsrZDNfdHJhbnNpdGlvbklkLFxuICAgICAgc3ViZ3JvdXBzID0gW10sXG4gICAgICBzdWJncm91cCxcbiAgICAgIG5vZGUsXG4gICAgICB0cmFuc2l0aW9uID0gZDNfdHJhbnNpdGlvbkluaGVyaXQgfHwge3RpbWU6IERhdGUubm93KCksIGVhc2U6IGQzX2Vhc2VfY3ViaWNJbk91dCwgZGVsYXk6IDAsIGR1cmF0aW9uOiAyNTB9O1xuXG4gIGZvciAodmFyIGogPSAtMSwgbSA9IHRoaXMubGVuZ3RoOyArK2ogPCBtOykge1xuICAgIHN1Ymdyb3Vwcy5wdXNoKHN1Ymdyb3VwID0gW10pO1xuICAgIGZvciAodmFyIGdyb3VwID0gdGhpc1tqXSwgaSA9IC0xLCBuID0gZ3JvdXAubGVuZ3RoOyArK2kgPCBuOykge1xuICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkgZDNfdHJhbnNpdGlvbk5vZGUobm9kZSwgaSwgaWQsIHRyYW5zaXRpb24pO1xuICAgICAgc3ViZ3JvdXAucHVzaChub2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZDNfdHJhbnNpdGlvbihzdWJncm91cHMsIGlkKTtcbn07XG4vLyBpbXBvcnQgXCIuLi90cmFuc2l0aW9uL3RyYW5zaXRpb25cIjtcblxuZDNfc2VsZWN0aW9uUHJvdG90eXBlLmludGVycnVwdCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5lYWNoKGQzX3NlbGVjdGlvbl9pbnRlcnJ1cHQpO1xufTtcblxuZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2ludGVycnVwdCgpIHtcbiAgdmFyIGxvY2sgPSB0aGlzLl9fdHJhbnNpdGlvbl9fO1xuICBpZiAobG9jaykgKytsb2NrLmFjdGl2ZTtcbn1cblxuLy8gVE9ETyBmYXN0IHNpbmdsZXRvbiBpbXBsZW1lbnRhdGlvbj9cbmQzLnNlbGVjdCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdmFyIGdyb3VwID0gW3R5cGVvZiBub2RlID09PSBcInN0cmluZ1wiID8gZDNfc2VsZWN0KG5vZGUsIGQzX2RvY3VtZW50KSA6IG5vZGVdO1xuICBncm91cC5wYXJlbnROb2RlID0gZDNfZG9jdW1lbnRFbGVtZW50O1xuICByZXR1cm4gZDNfc2VsZWN0aW9uKFtncm91cF0pO1xufTtcblxuZDMuc2VsZWN0QWxsID0gZnVuY3Rpb24obm9kZXMpIHtcbiAgdmFyIGdyb3VwID0gZDNfYXJyYXkodHlwZW9mIG5vZGVzID09PSBcInN0cmluZ1wiID8gZDNfc2VsZWN0QWxsKG5vZGVzLCBkM19kb2N1bWVudCkgOiBub2Rlcyk7XG4gIGdyb3VwLnBhcmVudE5vZGUgPSBkM19kb2N1bWVudEVsZW1lbnQ7XG4gIHJldHVybiBkM19zZWxlY3Rpb24oW2dyb3VwXSk7XG59O1xuXG52YXIgZDNfc2VsZWN0aW9uUm9vdCA9IGQzLnNlbGVjdChkM19kb2N1bWVudEVsZW1lbnQpO1xudmFyIGQzX3RpbWUgPSBkMy50aW1lID0ge30sXG4gICAgZDNfZGF0ZSA9IERhdGU7XG5cbmZ1bmN0aW9uIGQzX2RhdGVfdXRjKCkge1xuICB0aGlzLl8gPSBuZXcgRGF0ZShhcmd1bWVudHMubGVuZ3RoID4gMVxuICAgICAgPyBEYXRlLlVUQy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICA6IGFyZ3VtZW50c1swXSk7XG59XG5cbmQzX2RhdGVfdXRjLnByb3RvdHlwZSA9IHtcbiAgZ2V0RGF0ZTogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl8uZ2V0VVRDRGF0ZSgpOyB9LFxuICBnZXREYXk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fLmdldFVUQ0RheSgpOyB9LFxuICBnZXRGdWxsWWVhcjogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl8uZ2V0VVRDRnVsbFllYXIoKTsgfSxcbiAgZ2V0SG91cnM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fLmdldFVUQ0hvdXJzKCk7IH0sXG4gIGdldE1pbGxpc2Vjb25kczogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl8uZ2V0VVRDTWlsbGlzZWNvbmRzKCk7IH0sXG4gIGdldE1pbnV0ZXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fLmdldFVUQ01pbnV0ZXMoKTsgfSxcbiAgZ2V0TW9udGg6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fLmdldFVUQ01vbnRoKCk7IH0sXG4gIGdldFNlY29uZHM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fLmdldFVUQ1NlY29uZHMoKTsgfSxcbiAgZ2V0VGltZTogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl8uZ2V0VGltZSgpOyB9LFxuICBnZXRUaW1lem9uZU9mZnNldDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LFxuICB2YWx1ZU9mOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuXy52YWx1ZU9mKCk7IH0sXG4gIHNldERhdGU6IGZ1bmN0aW9uKCkgeyBkM190aW1lX3Byb3RvdHlwZS5zZXRVVENEYXRlLmFwcGx5KHRoaXMuXywgYXJndW1lbnRzKTsgfSxcbiAgc2V0RGF5OiBmdW5jdGlvbigpIHsgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDRGF5LmFwcGx5KHRoaXMuXywgYXJndW1lbnRzKTsgfSxcbiAgc2V0RnVsbFllYXI6IGZ1bmN0aW9uKCkgeyBkM190aW1lX3Byb3RvdHlwZS5zZXRVVENGdWxsWWVhci5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7IH0sXG4gIHNldEhvdXJzOiBmdW5jdGlvbigpIHsgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDSG91cnMuYXBwbHkodGhpcy5fLCBhcmd1bWVudHMpOyB9LFxuICBzZXRNaWxsaXNlY29uZHM6IGZ1bmN0aW9uKCkgeyBkM190aW1lX3Byb3RvdHlwZS5zZXRVVENNaWxsaXNlY29uZHMuYXBwbHkodGhpcy5fLCBhcmd1bWVudHMpOyB9LFxuICBzZXRNaW51dGVzOiBmdW5jdGlvbigpIHsgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDTWludXRlcy5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7IH0sXG4gIHNldE1vbnRoOiBmdW5jdGlvbigpIHsgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDTW9udGguYXBwbHkodGhpcy5fLCBhcmd1bWVudHMpOyB9LFxuICBzZXRTZWNvbmRzOiBmdW5jdGlvbigpIHsgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDU2Vjb25kcy5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7IH0sXG4gIHNldFRpbWU6IGZ1bmN0aW9uKCkgeyBkM190aW1lX3Byb3RvdHlwZS5zZXRUaW1lLmFwcGx5KHRoaXMuXywgYXJndW1lbnRzKTsgfVxufTtcblxudmFyIGQzX3RpbWVfcHJvdG90eXBlID0gRGF0ZS5wcm90b3R5cGU7XG5mdW5jdGlvbiBkM19pZGVudGl0eShkKSB7XG4gIHJldHVybiBkO1xufVxuZnVuY3Rpb24gZDNfZm9ybWF0X3ByZWNpc2lvbih4LCBwKSB7XG4gIHJldHVybiBwIC0gKHggPyBNYXRoLmNlaWwoTWF0aC5sb2coeCkgLyBNYXRoLkxOMTApIDogMSk7XG59XG5kMy5yb3VuZCA9IGZ1bmN0aW9uKHgsIG4pIHtcbiAgcmV0dXJuIG5cbiAgICAgID8gTWF0aC5yb3VuZCh4ICogKG4gPSBNYXRoLnBvdygxMCwgbikpKSAvIG5cbiAgICAgIDogTWF0aC5yb3VuZCh4KTtcbn07XG52YXIgYWJzID0gTWF0aC5hYnM7XG5cbnZhciBkM19mb3JtYXRQcmVmaXhlcyA9IFtcInlcIixcInpcIixcImFcIixcImZcIixcInBcIixcIm5cIixcIsK1XCIsXCJtXCIsXCJcIixcImtcIixcIk1cIixcIkdcIixcIlRcIixcIlBcIixcIkVcIixcIlpcIixcIllcIl0ubWFwKGQzX2Zvcm1hdFByZWZpeCk7XG5cbmQzLmZvcm1hdFByZWZpeCA9IGZ1bmN0aW9uKHZhbHVlLCBwcmVjaXNpb24pIHtcbiAgdmFyIGkgPSAwO1xuICBpZiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSAqPSAtMTtcbiAgICBpZiAocHJlY2lzaW9uKSB2YWx1ZSA9IGQzLnJvdW5kKHZhbHVlLCBkM19mb3JtYXRfcHJlY2lzaW9uKHZhbHVlLCBwcmVjaXNpb24pKTtcbiAgICBpID0gMSArIE1hdGguZmxvb3IoMWUtMTIgKyBNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMTApO1xuICAgIGkgPSBNYXRoLm1heCgtMjQsIE1hdGgubWluKDI0LCBNYXRoLmZsb29yKChpIC0gMSkgLyAzKSAqIDMpKTtcbiAgfVxuICByZXR1cm4gZDNfZm9ybWF0UHJlZml4ZXNbOCArIGkgLyAzXTtcbn07XG5cbmZ1bmN0aW9uIGQzX2Zvcm1hdFByZWZpeChkLCBpKSB7XG4gIHZhciBrID0gTWF0aC5wb3coMTAsIGFicyg4IC0gaSkgKiAzKTtcbiAgcmV0dXJuIHtcbiAgICBzY2FsZTogaSA+IDggPyBmdW5jdGlvbihkKSB7IHJldHVybiBkIC8gazsgfSA6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQgKiBrOyB9LFxuICAgIHN5bWJvbDogZFxuICB9O1xufVxuXG5mdW5jdGlvbiBkM19sb2NhbGVfbnVtYmVyRm9ybWF0KGxvY2FsZSkge1xuICB2YXIgbG9jYWxlX2RlY2ltYWwgPSBsb2NhbGUuZGVjaW1hbCxcbiAgICAgIGxvY2FsZV90aG91c2FuZHMgPSBsb2NhbGUudGhvdXNhbmRzLFxuICAgICAgbG9jYWxlX2dyb3VwaW5nID0gbG9jYWxlLmdyb3VwaW5nLFxuICAgICAgbG9jYWxlX2N1cnJlbmN5ID0gbG9jYWxlLmN1cnJlbmN5LFxuICAgICAgZm9ybWF0R3JvdXAgPSBsb2NhbGVfZ3JvdXBpbmcgJiYgbG9jYWxlX3Rob3VzYW5kcyA/IGZ1bmN0aW9uKHZhbHVlLCB3aWR0aCkge1xuICAgICAgICB2YXIgaSA9IHZhbHVlLmxlbmd0aCxcbiAgICAgICAgICAgIHQgPSBbXSxcbiAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgZyA9IGxvY2FsZV9ncm91cGluZ1swXSxcbiAgICAgICAgICAgIGxlbmd0aCA9IDA7XG4gICAgICAgIHdoaWxlIChpID4gMCAmJiBnID4gMCkge1xuICAgICAgICAgIGlmIChsZW5ndGggKyBnICsgMSA+IHdpZHRoKSBnID0gTWF0aC5tYXgoMSwgd2lkdGggLSBsZW5ndGgpO1xuICAgICAgICAgIHQucHVzaCh2YWx1ZS5zdWJzdHJpbmcoaSAtPSBnLCBpICsgZykpO1xuICAgICAgICAgIGlmICgobGVuZ3RoICs9IGcgKyAxKSA+IHdpZHRoKSBicmVhaztcbiAgICAgICAgICBnID0gbG9jYWxlX2dyb3VwaW5nW2ogPSAoaiArIDEpICUgbG9jYWxlX2dyb3VwaW5nLmxlbmd0aF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQucmV2ZXJzZSgpLmpvaW4obG9jYWxlX3Rob3VzYW5kcyk7XG4gICAgICB9IDogZDNfaWRlbnRpdHk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHNwZWNpZmllcikge1xuICAgIHZhciBtYXRjaCA9IGQzX2Zvcm1hdF9yZS5leGVjKHNwZWNpZmllciksXG4gICAgICAgIGZpbGwgPSBtYXRjaFsxXSB8fCBcIiBcIixcbiAgICAgICAgYWxpZ24gPSBtYXRjaFsyXSB8fCBcIj5cIixcbiAgICAgICAgc2lnbiA9IG1hdGNoWzNdIHx8IFwiLVwiLFxuICAgICAgICBzeW1ib2wgPSBtYXRjaFs0XSB8fCBcIlwiLFxuICAgICAgICB6ZmlsbCA9IG1hdGNoWzVdLFxuICAgICAgICB3aWR0aCA9ICttYXRjaFs2XSxcbiAgICAgICAgY29tbWEgPSBtYXRjaFs3XSxcbiAgICAgICAgcHJlY2lzaW9uID0gbWF0Y2hbOF0sXG4gICAgICAgIHR5cGUgPSBtYXRjaFs5XSxcbiAgICAgICAgc2NhbGUgPSAxLFxuICAgICAgICBwcmVmaXggPSBcIlwiLFxuICAgICAgICBzdWZmaXggPSBcIlwiLFxuICAgICAgICBpbnRlZ2VyID0gZmFsc2UsXG4gICAgICAgIGV4cG9uZW50ID0gdHJ1ZTtcblxuICAgIGlmIChwcmVjaXNpb24pIHByZWNpc2lvbiA9ICtwcmVjaXNpb24uc3Vic3RyaW5nKDEpO1xuXG4gICAgaWYgKHpmaWxsIHx8IGZpbGwgPT09IFwiMFwiICYmIGFsaWduID09PSBcIj1cIikge1xuICAgICAgemZpbGwgPSBmaWxsID0gXCIwXCI7XG4gICAgICBhbGlnbiA9IFwiPVwiO1xuICAgIH1cblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcIm5cIjogY29tbWEgPSB0cnVlOyB0eXBlID0gXCJnXCI7IGJyZWFrO1xuICAgICAgY2FzZSBcIiVcIjogc2NhbGUgPSAxMDA7IHN1ZmZpeCA9IFwiJVwiOyB0eXBlID0gXCJmXCI7IGJyZWFrO1xuICAgICAgY2FzZSBcInBcIjogc2NhbGUgPSAxMDA7IHN1ZmZpeCA9IFwiJVwiOyB0eXBlID0gXCJyXCI7IGJyZWFrO1xuICAgICAgY2FzZSBcImJcIjpcbiAgICAgIGNhc2UgXCJvXCI6XG4gICAgICBjYXNlIFwieFwiOlxuICAgICAgY2FzZSBcIlhcIjogaWYgKHN5bWJvbCA9PT0gXCIjXCIpIHByZWZpeCA9IFwiMFwiICsgdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY2FzZSBcImNcIjogZXhwb25lbnQgPSBmYWxzZTtcbiAgICAgIGNhc2UgXCJkXCI6IGludGVnZXIgPSB0cnVlOyBwcmVjaXNpb24gPSAwOyBicmVhaztcbiAgICAgIGNhc2UgXCJzXCI6IHNjYWxlID0gLTE7IHR5cGUgPSBcInJcIjsgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN5bWJvbCA9PT0gXCIkXCIpIHByZWZpeCA9IGxvY2FsZV9jdXJyZW5jeVswXSwgc3VmZml4ID0gbG9jYWxlX2N1cnJlbmN5WzFdO1xuXG4gICAgLy8gSWYgbm8gcHJlY2lzaW9uIGlzIHNwZWNpZmllZCBmb3IgciwgZmFsbGJhY2sgdG8gZ2VuZXJhbCBub3RhdGlvbi5cbiAgICBpZiAodHlwZSA9PSBcInJcIiAmJiAhcHJlY2lzaW9uKSB0eXBlID0gXCJnXCI7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgcmVxdWVzdGVkIHByZWNpc2lvbiBpcyBpbiB0aGUgc3VwcG9ydGVkIHJhbmdlLlxuICAgIGlmIChwcmVjaXNpb24gIT0gbnVsbCkge1xuICAgICAgaWYgKHR5cGUgPT0gXCJnXCIpIHByZWNpc2lvbiA9IE1hdGgubWF4KDEsIE1hdGgubWluKDIxLCBwcmVjaXNpb24pKTtcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJlXCIgfHwgdHlwZSA9PSBcImZcIikgcHJlY2lzaW9uID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjAsIHByZWNpc2lvbikpO1xuICAgIH1cblxuICAgIHR5cGUgPSBkM19mb3JtYXRfdHlwZXMuZ2V0KHR5cGUpIHx8IGQzX2Zvcm1hdF90eXBlRGVmYXVsdDtcblxuICAgIHZhciB6Y29tbWEgPSB6ZmlsbCAmJiBjb21tYTtcblxuICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFyIGZ1bGxTdWZmaXggPSBzdWZmaXg7XG5cbiAgICAgIC8vIFJldHVybiB0aGUgZW1wdHkgc3RyaW5nIGZvciBmbG9hdHMgZm9ybWF0dGVkIGFzIGludHMuXG4gICAgICBpZiAoaW50ZWdlciAmJiAodmFsdWUgJSAxKSkgcmV0dXJuIFwiXCI7XG5cbiAgICAgIC8vIENvbnZlcnQgbmVnYXRpdmUgdG8gcG9zaXRpdmUsIGFuZCByZWNvcmQgdGhlIHNpZ24gcHJlZml4LlxuICAgICAgdmFyIG5lZ2F0aXZlID0gdmFsdWUgPCAwIHx8IHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDAgPyAodmFsdWUgPSAtdmFsdWUsIFwiLVwiKSA6IHNpZ24gPT09IFwiLVwiID8gXCJcIiA6IHNpZ247XG5cbiAgICAgIC8vIEFwcGx5IHRoZSBzY2FsZSwgY29tcHV0aW5nIGl0IGZyb20gdGhlIHZhbHVlJ3MgZXhwb25lbnQgZm9yIHNpIGZvcm1hdC5cbiAgICAgIC8vIFByZXNlcnZlIHRoZSBleGlzdGluZyBzdWZmaXgsIGlmIGFueSwgc3VjaCBhcyB0aGUgY3VycmVuY3kgc3ltYm9sLlxuICAgICAgaWYgKHNjYWxlIDwgMCkge1xuICAgICAgICB2YXIgdW5pdCA9IGQzLmZvcm1hdFByZWZpeCh2YWx1ZSwgcHJlY2lzaW9uKTtcbiAgICAgICAgdmFsdWUgPSB1bml0LnNjYWxlKHZhbHVlKTtcbiAgICAgICAgZnVsbFN1ZmZpeCA9IHVuaXQuc3ltYm9sICsgc3VmZml4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgKj0gc2NhbGU7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbnZlcnQgdG8gdGhlIGRlc2lyZWQgcHJlY2lzaW9uLlxuICAgICAgdmFsdWUgPSB0eXBlKHZhbHVlLCBwcmVjaXNpb24pO1xuXG4gICAgICAvLyBCcmVhayB0aGUgdmFsdWUgaW50byB0aGUgaW50ZWdlciBwYXJ0IChiZWZvcmUpIGFuZCBkZWNpbWFsIHBhcnQgKGFmdGVyKS5cbiAgICAgIHZhciBpID0gdmFsdWUubGFzdEluZGV4T2YoXCIuXCIpLFxuICAgICAgICAgIGJlZm9yZSxcbiAgICAgICAgICBhZnRlcjtcbiAgICAgIGlmIChpIDwgMCkge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBkZWNpbWFsLCBicmVhayBvbiBcImVcIiB3aGVyZSBhcHByb3ByaWF0ZS5cbiAgICAgICAgdmFyIGogPSBleHBvbmVudCA/IHZhbHVlLmxhc3RJbmRleE9mKFwiZVwiKSA6IC0xO1xuICAgICAgICBpZiAoaiA8IDApIGJlZm9yZSA9IHZhbHVlLCBhZnRlciA9IFwiXCI7XG4gICAgICAgIGVsc2UgYmVmb3JlID0gdmFsdWUuc3Vic3RyaW5nKDAsIGopLCBhZnRlciA9IHZhbHVlLnN1YnN0cmluZyhqKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJlZm9yZSA9IHZhbHVlLnN1YnN0cmluZygwLCBpKTtcbiAgICAgICAgYWZ0ZXIgPSBsb2NhbGVfZGVjaW1hbCArIHZhbHVlLnN1YnN0cmluZyhpICsgMSk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBmaWxsIGNoYXJhY3RlciBpcyBub3QgXCIwXCIsIGdyb3VwaW5nIGlzIGFwcGxpZWQgYmVmb3JlIHBhZGRpbmcuXG4gICAgICBpZiAoIXpmaWxsICYmIGNvbW1hKSBiZWZvcmUgPSBmb3JtYXRHcm91cChiZWZvcmUsIEluZmluaXR5KTtcblxuICAgICAgdmFyIGxlbmd0aCA9IHByZWZpeC5sZW5ndGggKyBiZWZvcmUubGVuZ3RoICsgYWZ0ZXIubGVuZ3RoICsgKHpjb21tYSA/IDAgOiBuZWdhdGl2ZS5sZW5ndGgpLFxuICAgICAgICAgIHBhZGRpbmcgPSBsZW5ndGggPCB3aWR0aCA/IG5ldyBBcnJheShsZW5ndGggPSB3aWR0aCAtIGxlbmd0aCArIDEpLmpvaW4oZmlsbCkgOiBcIlwiO1xuXG4gICAgICAvLyBJZiB0aGUgZmlsbCBjaGFyYWN0ZXIgaXMgXCIwXCIsIGdyb3VwaW5nIGlzIGFwcGxpZWQgYWZ0ZXIgcGFkZGluZy5cbiAgICAgIGlmICh6Y29tbWEpIGJlZm9yZSA9IGZvcm1hdEdyb3VwKHBhZGRpbmcgKyBiZWZvcmUsIHBhZGRpbmcubGVuZ3RoID8gd2lkdGggLSBhZnRlci5sZW5ndGggOiBJbmZpbml0eSk7XG5cbiAgICAgIC8vIEFwcGx5IHByZWZpeC5cbiAgICAgIG5lZ2F0aXZlICs9IHByZWZpeDtcblxuICAgICAgLy8gUmVqb2luIGludGVnZXIgYW5kIGRlY2ltYWwgcGFydHMuXG4gICAgICB2YWx1ZSA9IGJlZm9yZSArIGFmdGVyO1xuXG4gICAgICByZXR1cm4gKGFsaWduID09PSBcIjxcIiA/IG5lZ2F0aXZlICsgdmFsdWUgKyBwYWRkaW5nXG4gICAgICAgICAgICA6IGFsaWduID09PSBcIj5cIiA/IHBhZGRpbmcgKyBuZWdhdGl2ZSArIHZhbHVlXG4gICAgICAgICAgICA6IGFsaWduID09PSBcIl5cIiA/IHBhZGRpbmcuc3Vic3RyaW5nKDAsIGxlbmd0aCA+Pj0gMSkgKyBuZWdhdGl2ZSArIHZhbHVlICsgcGFkZGluZy5zdWJzdHJpbmcobGVuZ3RoKVxuICAgICAgICAgICAgOiBuZWdhdGl2ZSArICh6Y29tbWEgPyB2YWx1ZSA6IHBhZGRpbmcgKyB2YWx1ZSkpICsgZnVsbFN1ZmZpeDtcbiAgICB9O1xuICB9O1xufVxuXG4vLyBbW2ZpbGxdYWxpZ25dW3NpZ25dW3N5bWJvbF1bMF1bd2lkdGhdWyxdWy5wcmVjaXNpb25dW3R5cGVdXG52YXIgZDNfZm9ybWF0X3JlID0gLyg/OihbXntdKT8oWzw+PV5dKSk/KFsrXFwtIF0pPyhbJCNdKT8oMCk/KFxcZCspPygsKT8oXFwuLT9cXGQrKT8oW2EteiVdKT8vaTtcblxudmFyIGQzX2Zvcm1hdF90eXBlcyA9IGQzLm1hcCh7XG4gIGI6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgudG9TdHJpbmcoMik7IH0sXG4gIGM6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoeCk7IH0sXG4gIG86IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgudG9TdHJpbmcoOCk7IH0sXG4gIHg6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgudG9TdHJpbmcoMTYpOyB9LFxuICBYOiBmdW5jdGlvbih4KSB7IHJldHVybiB4LnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpOyB9LFxuICBnOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiB4LnRvUHJlY2lzaW9uKHApOyB9LFxuICBlOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiB4LnRvRXhwb25lbnRpYWwocCk7IH0sXG4gIGY6IGZ1bmN0aW9uKHgsIHApIHsgcmV0dXJuIHgudG9GaXhlZChwKTsgfSxcbiAgcjogZnVuY3Rpb24oeCwgcCkgeyByZXR1cm4gKHggPSBkMy5yb3VuZCh4LCBkM19mb3JtYXRfcHJlY2lzaW9uKHgsIHApKSkudG9GaXhlZChNYXRoLm1heCgwLCBNYXRoLm1pbigyMCwgZDNfZm9ybWF0X3ByZWNpc2lvbih4ICogKDEgKyAxZS0xNSksIHApKSkpOyB9XG59KTtcblxuZnVuY3Rpb24gZDNfZm9ybWF0X3R5cGVEZWZhdWx0KHgpIHtcbiAgcmV0dXJuIHggKyBcIlwiO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX2ludGVydmFsKGxvY2FsLCBzdGVwLCBudW1iZXIpIHtcblxuICBmdW5jdGlvbiByb3VuZChkYXRlKSB7XG4gICAgdmFyIGQwID0gbG9jYWwoZGF0ZSksIGQxID0gb2Zmc2V0KGQwLCAxKTtcbiAgICByZXR1cm4gZGF0ZSAtIGQwIDwgZDEgLSBkYXRlID8gZDAgOiBkMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNlaWwoZGF0ZSkge1xuICAgIHN0ZXAoZGF0ZSA9IGxvY2FsKG5ldyBkM19kYXRlKGRhdGUgLSAxKSksIDEpO1xuICAgIHJldHVybiBkYXRlO1xuICB9XG5cbiAgZnVuY3Rpb24gb2Zmc2V0KGRhdGUsIGspIHtcbiAgICBzdGVwKGRhdGUgPSBuZXcgZDNfZGF0ZSgrZGF0ZSksIGspO1xuICAgIHJldHVybiBkYXRlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZ2UodDAsIHQxLCBkdCkge1xuICAgIHZhciB0aW1lID0gY2VpbCh0MCksIHRpbWVzID0gW107XG4gICAgaWYgKGR0ID4gMSkge1xuICAgICAgd2hpbGUgKHRpbWUgPCB0MSkge1xuICAgICAgICBpZiAoIShudW1iZXIodGltZSkgJSBkdCkpIHRpbWVzLnB1c2gobmV3IERhdGUoK3RpbWUpKTtcbiAgICAgICAgc3RlcCh0aW1lLCAxKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKHRpbWUgPCB0MSkgdGltZXMucHVzaChuZXcgRGF0ZSgrdGltZSkpLCBzdGVwKHRpbWUsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGltZXM7XG4gIH1cblxuICBmdW5jdGlvbiByYW5nZV91dGModDAsIHQxLCBkdCkge1xuICAgIHRyeSB7XG4gICAgICBkM19kYXRlID0gZDNfZGF0ZV91dGM7XG4gICAgICB2YXIgdXRjID0gbmV3IGQzX2RhdGVfdXRjKCk7XG4gICAgICB1dGMuXyA9IHQwO1xuICAgICAgcmV0dXJuIHJhbmdlKHV0YywgdDEsIGR0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgZDNfZGF0ZSA9IERhdGU7XG4gICAgfVxuICB9XG5cbiAgbG9jYWwuZmxvb3IgPSBsb2NhbDtcbiAgbG9jYWwucm91bmQgPSByb3VuZDtcbiAgbG9jYWwuY2VpbCA9IGNlaWw7XG4gIGxvY2FsLm9mZnNldCA9IG9mZnNldDtcbiAgbG9jYWwucmFuZ2UgPSByYW5nZTtcblxuICB2YXIgdXRjID0gbG9jYWwudXRjID0gZDNfdGltZV9pbnRlcnZhbF91dGMobG9jYWwpO1xuICB1dGMuZmxvb3IgPSB1dGM7XG4gIHV0Yy5yb3VuZCA9IGQzX3RpbWVfaW50ZXJ2YWxfdXRjKHJvdW5kKTtcbiAgdXRjLmNlaWwgPSBkM190aW1lX2ludGVydmFsX3V0YyhjZWlsKTtcbiAgdXRjLm9mZnNldCA9IGQzX3RpbWVfaW50ZXJ2YWxfdXRjKG9mZnNldCk7XG4gIHV0Yy5yYW5nZSA9IHJhbmdlX3V0YztcblxuICByZXR1cm4gbG9jYWw7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfaW50ZXJ2YWxfdXRjKG1ldGhvZCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgaykge1xuICAgIHRyeSB7XG4gICAgICBkM19kYXRlID0gZDNfZGF0ZV91dGM7XG4gICAgICB2YXIgdXRjID0gbmV3IGQzX2RhdGVfdXRjKCk7XG4gICAgICB1dGMuXyA9IGRhdGU7XG4gICAgICByZXR1cm4gbWV0aG9kKHV0YywgaykuXztcbiAgICB9IGZpbmFsbHkge1xuICAgICAgZDNfZGF0ZSA9IERhdGU7XG4gICAgfVxuICB9O1xufVxuXG5kM190aW1lLnllYXIgPSBkM190aW1lX2ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgZGF0ZSA9IGQzX3RpbWUuZGF5KGRhdGUpO1xuICBkYXRlLnNldE1vbnRoKDAsIDEpO1xuICByZXR1cm4gZGF0ZTtcbn0sIGZ1bmN0aW9uKGRhdGUsIG9mZnNldCkge1xuICBkYXRlLnNldEZ1bGxZZWFyKGRhdGUuZ2V0RnVsbFllYXIoKSArIG9mZnNldCk7XG59LCBmdW5jdGlvbihkYXRlKSB7XG4gIHJldHVybiBkYXRlLmdldEZ1bGxZZWFyKCk7XG59KTtcblxuZDNfdGltZS55ZWFycyA9IGQzX3RpbWUueWVhci5yYW5nZTtcbmQzX3RpbWUueWVhcnMudXRjID0gZDNfdGltZS55ZWFyLnV0Yy5yYW5nZTtcblxuZDNfdGltZS5kYXkgPSBkM190aW1lX2ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgdmFyIGRheSA9IG5ldyBkM19kYXRlKDIwMDAsIDApO1xuICBkYXkuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpKTtcbiAgcmV0dXJuIGRheTtcbn0sIGZ1bmN0aW9uKGRhdGUsIG9mZnNldCkge1xuICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyBvZmZzZXQpO1xufSwgZnVuY3Rpb24oZGF0ZSkge1xuICByZXR1cm4gZGF0ZS5nZXREYXRlKCkgLSAxO1xufSk7XG5cbmQzX3RpbWUuZGF5cyA9IGQzX3RpbWUuZGF5LnJhbmdlO1xuZDNfdGltZS5kYXlzLnV0YyA9IGQzX3RpbWUuZGF5LnV0Yy5yYW5nZTtcblxuZDNfdGltZS5kYXlPZlllYXIgPSBmdW5jdGlvbihkYXRlKSB7XG4gIHZhciB5ZWFyID0gZDNfdGltZS55ZWFyKGRhdGUpO1xuICByZXR1cm4gTWF0aC5mbG9vcigoZGF0ZSAtIHllYXIgLSAoZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpIC0geWVhci5nZXRUaW1lem9uZU9mZnNldCgpKSAqIDZlNCkgLyA4NjRlNSk7XG59O1xuXG5bXCJzdW5kYXlcIiwgXCJtb25kYXlcIiwgXCJ0dWVzZGF5XCIsIFwid2VkbmVzZGF5XCIsIFwidGh1cnNkYXlcIiwgXCJmcmlkYXlcIiwgXCJzYXR1cmRheVwiXS5mb3JFYWNoKGZ1bmN0aW9uKGRheSwgaSkge1xuICBpID0gNyAtIGk7XG5cbiAgdmFyIGludGVydmFsID0gZDNfdGltZVtkYXldID0gZDNfdGltZV9pbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgKGRhdGUgPSBkM190aW1lLmRheShkYXRlKSkuc2V0RGF0ZShkYXRlLmdldERhdGUoKSAtIChkYXRlLmdldERheSgpICsgaSkgJSA3KTtcbiAgICByZXR1cm4gZGF0ZTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgTWF0aC5mbG9vcihvZmZzZXQpICogNyk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgZGF5ID0gZDNfdGltZS55ZWFyKGRhdGUpLmdldERheSgpO1xuICAgIHJldHVybiBNYXRoLmZsb29yKChkM190aW1lLmRheU9mWWVhcihkYXRlKSArIChkYXkgKyBpKSAlIDcpIC8gNykgLSAoZGF5ICE9PSBpKTtcbiAgfSk7XG5cbiAgZDNfdGltZVtkYXkgKyBcInNcIl0gPSBpbnRlcnZhbC5yYW5nZTtcbiAgZDNfdGltZVtkYXkgKyBcInNcIl0udXRjID0gaW50ZXJ2YWwudXRjLnJhbmdlO1xuXG4gIGQzX3RpbWVbZGF5ICsgXCJPZlllYXJcIl0gPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgdmFyIGRheSA9IGQzX3RpbWUueWVhcihkYXRlKS5nZXREYXkoKTtcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoZDNfdGltZS5kYXlPZlllYXIoZGF0ZSkgKyAoZGF5ICsgaSkgJSA3KSAvIDcpO1xuICB9O1xufSk7XG5cbmQzX3RpbWUud2VlayA9IGQzX3RpbWUuc3VuZGF5O1xuZDNfdGltZS53ZWVrcyA9IGQzX3RpbWUuc3VuZGF5LnJhbmdlO1xuZDNfdGltZS53ZWVrcy51dGMgPSBkM190aW1lLnN1bmRheS51dGMucmFuZ2U7XG5kM190aW1lLndlZWtPZlllYXIgPSBkM190aW1lLnN1bmRheU9mWWVhcjtcblxuZnVuY3Rpb24gZDNfbG9jYWxlX3RpbWVGb3JtYXQobG9jYWxlKSB7XG4gIHZhciBsb2NhbGVfZGF0ZVRpbWUgPSBsb2NhbGUuZGF0ZVRpbWUsXG4gICAgICBsb2NhbGVfZGF0ZSA9IGxvY2FsZS5kYXRlLFxuICAgICAgbG9jYWxlX3RpbWUgPSBsb2NhbGUudGltZSxcbiAgICAgIGxvY2FsZV9wZXJpb2RzID0gbG9jYWxlLnBlcmlvZHMsXG4gICAgICBsb2NhbGVfZGF5cyA9IGxvY2FsZS5kYXlzLFxuICAgICAgbG9jYWxlX3Nob3J0RGF5cyA9IGxvY2FsZS5zaG9ydERheXMsXG4gICAgICBsb2NhbGVfbW9udGhzID0gbG9jYWxlLm1vbnRocyxcbiAgICAgIGxvY2FsZV9zaG9ydE1vbnRocyA9IGxvY2FsZS5zaG9ydE1vbnRocztcblxuICBmdW5jdGlvbiBkM190aW1lX2Zvcm1hdCh0ZW1wbGF0ZSkge1xuICAgIHZhciBuID0gdGVtcGxhdGUubGVuZ3RoO1xuXG4gICAgZnVuY3Rpb24gZm9ybWF0KGRhdGUpIHtcbiAgICAgIHZhciBzdHJpbmcgPSBbXSxcbiAgICAgICAgICBpID0gLTEsXG4gICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgYyxcbiAgICAgICAgICBwLFxuICAgICAgICAgIGY7XG4gICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICBpZiAodGVtcGxhdGUuY2hhckNvZGVBdChpKSA9PT0gMzcpIHtcbiAgICAgICAgICBzdHJpbmcucHVzaCh0ZW1wbGF0ZS5zbGljZShqLCBpKSk7XG4gICAgICAgICAgaWYgKChwID0gZDNfdGltZV9mb3JtYXRQYWRzW2MgPSB0ZW1wbGF0ZS5jaGFyQXQoKytpKV0pICE9IG51bGwpIGMgPSB0ZW1wbGF0ZS5jaGFyQXQoKytpKTtcbiAgICAgICAgICBpZiAoZiA9IGQzX3RpbWVfZm9ybWF0c1tjXSkgYyA9IGYoZGF0ZSwgcCA9PSBudWxsID8gKGMgPT09IFwiZVwiID8gXCIgXCIgOiBcIjBcIikgOiBwKTtcbiAgICAgICAgICBzdHJpbmcucHVzaChjKTtcbiAgICAgICAgICBqID0gaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0cmluZy5wdXNoKHRlbXBsYXRlLnNsaWNlKGosIGkpKTtcbiAgICAgIHJldHVybiBzdHJpbmcuam9pbihcIlwiKTtcbiAgICB9XG5cbiAgICBmb3JtYXQucGFyc2UgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHZhciBkID0ge3k6IDE5MDAsIG06IDAsIGQ6IDEsIEg6IDAsIE06IDAsIFM6IDAsIEw6IDAsIFo6IG51bGx9LFxuICAgICAgICAgIGkgPSBkM190aW1lX3BhcnNlKGQsIHRlbXBsYXRlLCBzdHJpbmcsIDApO1xuICAgICAgaWYgKGkgIT0gc3RyaW5nLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIC8vIFRoZSBhbS1wbSBmbGFnIGlzIDAgZm9yIEFNLCBhbmQgMSBmb3IgUE0uXG4gICAgICBpZiAoXCJwXCIgaW4gZCkgZC5IID0gZC5IICUgMTIgKyBkLnAgKiAxMjtcblxuICAgICAgLy8gSWYgYSB0aW1lIHpvbmUgaXMgc3BlY2lmaWVkLCBpdCBpcyBhbHdheXMgcmVsYXRpdmUgdG8gVVRDO1xuICAgICAgLy8gd2UgbmVlZCB0byB1c2UgZDNfZGF0ZV91dGMgaWYgd2UgYXJlbuKAmXQgYWxyZWFkeS5cbiAgICAgIHZhciBsb2NhbFogPSBkLlogIT0gbnVsbCAmJiBkM19kYXRlICE9PSBkM19kYXRlX3V0YyxcbiAgICAgICAgICBkYXRlID0gbmV3IChsb2NhbFogPyBkM19kYXRlX3V0YyA6IGQzX2RhdGUpO1xuXG4gICAgICAvLyBTZXQgeWVhciwgbW9udGgsIGRhdGUuXG4gICAgICBpZiAoXCJqXCIgaW4gZCkgZGF0ZS5zZXRGdWxsWWVhcihkLnksIDAsIGQuaik7XG4gICAgICBlbHNlIGlmIChcIndcIiBpbiBkICYmIChcIldcIiBpbiBkIHx8IFwiVVwiIGluIGQpKSB7XG4gICAgICAgIGRhdGUuc2V0RnVsbFllYXIoZC55LCAwLCAxKTtcbiAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcihkLnksIDAsIFwiV1wiIGluIGRcbiAgICAgICAgICAgID8gKGQudyArIDYpICUgNyArIGQuVyAqIDcgLSAoZGF0ZS5nZXREYXkoKSArIDUpICUgN1xuICAgICAgICAgICAgOiAgZC53ICAgICAgICAgICsgZC5VICogNyAtIChkYXRlLmdldERheSgpICsgNikgJSA3KTtcbiAgICAgIH0gZWxzZSBkYXRlLnNldEZ1bGxZZWFyKGQueSwgZC5tLCBkLmQpO1xuXG4gICAgICAvLyBTZXQgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMgYW5kIG1pbGxpc2Vjb25kcy5cbiAgICAgIGRhdGUuc2V0SG91cnMoZC5IICsgKGQuWiAvIDEwMCB8IDApLCBkLk0gKyBkLlogJSAxMDAsIGQuUywgZC5MKTtcblxuICAgICAgcmV0dXJuIGxvY2FsWiA/IGRhdGUuXyA6IGRhdGU7XG4gICAgfTtcblxuICAgIGZvcm1hdC50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZm9ybWF0O1xuICB9XG5cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZShkYXRlLCB0ZW1wbGF0ZSwgc3RyaW5nLCBqKSB7XG4gICAgdmFyIGMsXG4gICAgICAgIHAsXG4gICAgICAgIHQsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBuID0gdGVtcGxhdGUubGVuZ3RoLFxuICAgICAgICBtID0gc3RyaW5nLmxlbmd0aDtcbiAgICB3aGlsZSAoaSA8IG4pIHtcbiAgICAgIGlmIChqID49IG0pIHJldHVybiAtMTtcbiAgICAgIGMgPSB0ZW1wbGF0ZS5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBpZiAoYyA9PT0gMzcpIHtcbiAgICAgICAgdCA9IHRlbXBsYXRlLmNoYXJBdChpKyspO1xuICAgICAgICBwID0gZDNfdGltZV9wYXJzZXJzW3QgaW4gZDNfdGltZV9mb3JtYXRQYWRzID8gdGVtcGxhdGUuY2hhckF0KGkrKykgOiB0XTtcbiAgICAgICAgaWYgKCFwIHx8ICgoaiA9IHAoZGF0ZSwgc3RyaW5nLCBqKSkgPCAwKSkgcmV0dXJuIC0xO1xuICAgICAgfSBlbHNlIGlmIChjICE9IHN0cmluZy5jaGFyQ29kZUF0KGorKykpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gajtcbiAgfVxuXG4gIGQzX3RpbWVfZm9ybWF0LnV0YyA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgdmFyIGxvY2FsID0gZDNfdGltZV9mb3JtYXQodGVtcGxhdGUpO1xuXG4gICAgZnVuY3Rpb24gZm9ybWF0KGRhdGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGQzX2RhdGUgPSBkM19kYXRlX3V0YztcbiAgICAgICAgdmFyIHV0YyA9IG5ldyBkM19kYXRlKCk7XG4gICAgICAgIHV0Yy5fID0gZGF0ZTtcbiAgICAgICAgcmV0dXJuIGxvY2FsKHV0Yyk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBkM19kYXRlID0gRGF0ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3JtYXQucGFyc2UgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGQzX2RhdGUgPSBkM19kYXRlX3V0YztcbiAgICAgICAgdmFyIGRhdGUgPSBsb2NhbC5wYXJzZShzdHJpbmcpO1xuICAgICAgICByZXR1cm4gZGF0ZSAmJiBkYXRlLl87XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBkM19kYXRlID0gRGF0ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZm9ybWF0LnRvU3RyaW5nID0gbG9jYWwudG9TdHJpbmc7XG5cbiAgICByZXR1cm4gZm9ybWF0O1xuICB9O1xuXG4gIGQzX3RpbWVfZm9ybWF0Lm11bHRpID1cbiAgZDNfdGltZV9mb3JtYXQudXRjLm11bHRpID0gZDNfdGltZV9mb3JtYXRNdWx0aTtcblxuICB2YXIgZDNfdGltZV9wZXJpb2RMb29rdXAgPSBkMy5tYXAoKSxcbiAgICAgIGQzX3RpbWVfZGF5UmUgPSBkM190aW1lX2Zvcm1hdFJlKGxvY2FsZV9kYXlzKSxcbiAgICAgIGQzX3RpbWVfZGF5TG9va3VwID0gZDNfdGltZV9mb3JtYXRMb29rdXAobG9jYWxlX2RheXMpLFxuICAgICAgZDNfdGltZV9kYXlBYmJyZXZSZSA9IGQzX3RpbWVfZm9ybWF0UmUobG9jYWxlX3Nob3J0RGF5cyksXG4gICAgICBkM190aW1lX2RheUFiYnJldkxvb2t1cCA9IGQzX3RpbWVfZm9ybWF0TG9va3VwKGxvY2FsZV9zaG9ydERheXMpLFxuICAgICAgZDNfdGltZV9tb250aFJlID0gZDNfdGltZV9mb3JtYXRSZShsb2NhbGVfbW9udGhzKSxcbiAgICAgIGQzX3RpbWVfbW9udGhMb29rdXAgPSBkM190aW1lX2Zvcm1hdExvb2t1cChsb2NhbGVfbW9udGhzKSxcbiAgICAgIGQzX3RpbWVfbW9udGhBYmJyZXZSZSA9IGQzX3RpbWVfZm9ybWF0UmUobG9jYWxlX3Nob3J0TW9udGhzKSxcbiAgICAgIGQzX3RpbWVfbW9udGhBYmJyZXZMb29rdXAgPSBkM190aW1lX2Zvcm1hdExvb2t1cChsb2NhbGVfc2hvcnRNb250aHMpO1xuXG4gIGxvY2FsZV9wZXJpb2RzLmZvckVhY2goZnVuY3Rpb24ocCwgaSkge1xuICAgIGQzX3RpbWVfcGVyaW9kTG9va3VwLnNldChwLnRvTG93ZXJDYXNlKCksIGkpO1xuICB9KTtcblxuICB2YXIgZDNfdGltZV9mb3JtYXRzID0ge1xuICAgIGE6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxvY2FsZV9zaG9ydERheXNbZC5nZXREYXkoKV07IH0sXG4gICAgQTogZnVuY3Rpb24oZCkgeyByZXR1cm4gbG9jYWxlX2RheXNbZC5nZXREYXkoKV07IH0sXG4gICAgYjogZnVuY3Rpb24oZCkgeyByZXR1cm4gbG9jYWxlX3Nob3J0TW9udGhzW2QuZ2V0TW9udGgoKV07IH0sXG4gICAgQjogZnVuY3Rpb24oZCkgeyByZXR1cm4gbG9jYWxlX21vbnRoc1tkLmdldE1vbnRoKCldOyB9LFxuICAgIGM6IGQzX3RpbWVfZm9ybWF0KGxvY2FsZV9kYXRlVGltZSksXG4gICAgZDogZnVuY3Rpb24oZCwgcCkgeyByZXR1cm4gZDNfdGltZV9mb3JtYXRQYWQoZC5nZXREYXRlKCksIHAsIDIpOyB9LFxuICAgIGU6IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0RGF0ZSgpLCBwLCAyKTsgfSxcbiAgICBIOiBmdW5jdGlvbihkLCBwKSB7IHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkLmdldEhvdXJzKCksIHAsIDIpOyB9LFxuICAgIEk6IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0SG91cnMoKSAlIDEyIHx8IDEyLCBwLCAyKTsgfSxcbiAgICBqOiBmdW5jdGlvbihkLCBwKSB7IHJldHVybiBkM190aW1lX2Zvcm1hdFBhZCgxICsgZDNfdGltZS5kYXlPZlllYXIoZCksIHAsIDMpOyB9LFxuICAgIEw6IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0TWlsbGlzZWNvbmRzKCksIHAsIDMpOyB9LFxuICAgIG06IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0TW9udGgoKSArIDEsIHAsIDIpOyB9LFxuICAgIE06IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0TWludXRlcygpLCBwLCAyKTsgfSxcbiAgICBwOiBmdW5jdGlvbihkKSB7IHJldHVybiBsb2NhbGVfcGVyaW9kc1srKGQuZ2V0SG91cnMoKSA+PSAxMildOyB9LFxuICAgIFM6IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0U2Vjb25kcygpLCBwLCAyKTsgfSxcbiAgICBVOiBmdW5jdGlvbihkLCBwKSB7IHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkM190aW1lLnN1bmRheU9mWWVhcihkKSwgcCwgMik7IH0sXG4gICAgdzogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXREYXkoKTsgfSxcbiAgICBXOiBmdW5jdGlvbihkLCBwKSB7IHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkM190aW1lLm1vbmRheU9mWWVhcihkKSwgcCwgMik7IH0sXG4gICAgeDogZDNfdGltZV9mb3JtYXQobG9jYWxlX2RhdGUpLFxuICAgIFg6IGQzX3RpbWVfZm9ybWF0KGxvY2FsZV90aW1lKSxcbiAgICB5OiBmdW5jdGlvbihkLCBwKSB7IHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkLmdldEZ1bGxZZWFyKCkgJSAxMDAsIHAsIDIpOyB9LFxuICAgIFk6IGZ1bmN0aW9uKGQsIHApIHsgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0RnVsbFllYXIoKSAlIDEwMDAwLCBwLCA0KTsgfSxcbiAgICBaOiBkM190aW1lX3pvbmUsXG4gICAgXCIlXCI6IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCIlXCI7IH1cbiAgfTtcblxuICB2YXIgZDNfdGltZV9wYXJzZXJzID0ge1xuICAgIGE6IGQzX3RpbWVfcGFyc2VXZWVrZGF5QWJicmV2LFxuICAgIEE6IGQzX3RpbWVfcGFyc2VXZWVrZGF5LFxuICAgIGI6IGQzX3RpbWVfcGFyc2VNb250aEFiYnJldixcbiAgICBCOiBkM190aW1lX3BhcnNlTW9udGgsXG4gICAgYzogZDNfdGltZV9wYXJzZUxvY2FsZUZ1bGwsXG4gICAgZDogZDNfdGltZV9wYXJzZURheSxcbiAgICBlOiBkM190aW1lX3BhcnNlRGF5LFxuICAgIEg6IGQzX3RpbWVfcGFyc2VIb3VyMjQsXG4gICAgSTogZDNfdGltZV9wYXJzZUhvdXIyNCxcbiAgICBqOiBkM190aW1lX3BhcnNlRGF5T2ZZZWFyLFxuICAgIEw6IGQzX3RpbWVfcGFyc2VNaWxsaXNlY29uZHMsXG4gICAgbTogZDNfdGltZV9wYXJzZU1vbnRoTnVtYmVyLFxuICAgIE06IGQzX3RpbWVfcGFyc2VNaW51dGVzLFxuICAgIHA6IGQzX3RpbWVfcGFyc2VBbVBtLFxuICAgIFM6IGQzX3RpbWVfcGFyc2VTZWNvbmRzLFxuICAgIFU6IGQzX3RpbWVfcGFyc2VXZWVrTnVtYmVyU3VuZGF5LFxuICAgIHc6IGQzX3RpbWVfcGFyc2VXZWVrZGF5TnVtYmVyLFxuICAgIFc6IGQzX3RpbWVfcGFyc2VXZWVrTnVtYmVyTW9uZGF5LFxuICAgIHg6IGQzX3RpbWVfcGFyc2VMb2NhbGVEYXRlLFxuICAgIFg6IGQzX3RpbWVfcGFyc2VMb2NhbGVUaW1lLFxuICAgIHk6IGQzX3RpbWVfcGFyc2VZZWFyLFxuICAgIFk6IGQzX3RpbWVfcGFyc2VGdWxsWWVhcixcbiAgICBaOiBkM190aW1lX3BhcnNlWm9uZSxcbiAgICBcIiVcIjogZDNfdGltZV9wYXJzZUxpdGVyYWxQZXJjZW50XG4gIH07XG5cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZVdlZWtkYXlBYmJyZXYoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgZDNfdGltZV9kYXlBYmJyZXZSZS5sYXN0SW5kZXggPSAwO1xuICAgIHZhciBuID0gZDNfdGltZV9kYXlBYmJyZXZSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgcmV0dXJuIG4gPyAoZGF0ZS53ID0gZDNfdGltZV9kYXlBYmJyZXZMb29rdXAuZ2V0KG5bMF0udG9Mb3dlckNhc2UoKSksIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VXZWVrZGF5KGRhdGUsIHN0cmluZywgaSkge1xuICAgIGQzX3RpbWVfZGF5UmUubGFzdEluZGV4ID0gMDtcbiAgICB2YXIgbiA9IGQzX3RpbWVfZGF5UmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgIHJldHVybiBuID8gKGRhdGUudyA9IGQzX3RpbWVfZGF5TG9va3VwLmdldChuWzBdLnRvTG93ZXJDYXNlKCkpLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cblxuICBmdW5jdGlvbiBkM190aW1lX3BhcnNlTW9udGhBYmJyZXYoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgZDNfdGltZV9tb250aEFiYnJldlJlLmxhc3RJbmRleCA9IDA7XG4gICAgdmFyIG4gPSBkM190aW1lX21vbnRoQWJicmV2UmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgIHJldHVybiBuID8gKGRhdGUubSA9IGQzX3RpbWVfbW9udGhBYmJyZXZMb29rdXAuZ2V0KG5bMF0udG9Mb3dlckNhc2UoKSksIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VNb250aChkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICBkM190aW1lX21vbnRoUmUubGFzdEluZGV4ID0gMDtcbiAgICB2YXIgbiA9IGQzX3RpbWVfbW9udGhSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgcmV0dXJuIG4gPyAoZGF0ZS5tID0gZDNfdGltZV9tb250aExvb2t1cC5nZXQoblswXS50b0xvd2VyQ2FzZSgpKSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG5cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZUxvY2FsZUZ1bGwoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgcmV0dXJuIGQzX3RpbWVfcGFyc2UoZGF0ZSwgZDNfdGltZV9mb3JtYXRzLmMudG9TdHJpbmcoKSwgc3RyaW5nLCBpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VMb2NhbGVEYXRlKGRhdGUsIHN0cmluZywgaSkge1xuICAgIHJldHVybiBkM190aW1lX3BhcnNlKGRhdGUsIGQzX3RpbWVfZm9ybWF0cy54LnRvU3RyaW5nKCksIHN0cmluZywgaSk7XG4gIH1cblxuICBmdW5jdGlvbiBkM190aW1lX3BhcnNlTG9jYWxlVGltZShkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICByZXR1cm4gZDNfdGltZV9wYXJzZShkYXRlLCBkM190aW1lX2Zvcm1hdHMuWC50b1N0cmluZygpLCBzdHJpbmcsIGkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZUFtUG0oZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBkM190aW1lX3BlcmlvZExvb2t1cC5nZXQoc3RyaW5nLnNsaWNlKGksIGkgKz0gMikudG9Mb3dlckNhc2UoKSk7XG4gICAgcmV0dXJuIG4gPT0gbnVsbCA/IC0xIDogKGRhdGUucCA9IG4sIGkpO1xuICB9XG5cbiAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0O1xufVxuXG52YXIgZDNfdGltZV9mb3JtYXRQYWRzID0ge1wiLVwiOiBcIlwiLCBcIl9cIjogXCIgXCIsIFwiMFwiOiBcIjBcIn0sXG4gICAgZDNfdGltZV9udW1iZXJSZSA9IC9eXFxzKlxcZCsvLCAvLyBub3RlOiBpZ25vcmVzIG5leHQgZGlyZWN0aXZlXG4gICAgZDNfdGltZV9wZXJjZW50UmUgPSAvXiUvO1xuXG5mdW5jdGlvbiBkM190aW1lX2Zvcm1hdFBhZCh2YWx1ZSwgZmlsbCwgd2lkdGgpIHtcbiAgdmFyIHNpZ24gPSB2YWx1ZSA8IDAgPyBcIi1cIiA6IFwiXCIsXG4gICAgICBzdHJpbmcgPSAoc2lnbiA/IC12YWx1ZSA6IHZhbHVlKSArIFwiXCIsXG4gICAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICByZXR1cm4gc2lnbiArIChsZW5ndGggPCB3aWR0aCA/IG5ldyBBcnJheSh3aWR0aCAtIGxlbmd0aCArIDEpLmpvaW4oZmlsbCkgKyBzdHJpbmcgOiBzdHJpbmcpO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX2Zvcm1hdFJlKG5hbWVzKSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKFwiXig/OlwiICsgbmFtZXMubWFwKGQzLnJlcXVvdGUpLmpvaW4oXCJ8XCIpICsgXCIpXCIsIFwiaVwiKTtcbn1cblxuZnVuY3Rpb24gZDNfdGltZV9mb3JtYXRMb29rdXAobmFtZXMpIHtcbiAgdmFyIG1hcCA9IG5ldyBkM19NYXAsIGkgPSAtMSwgbiA9IG5hbWVzLmxlbmd0aDtcbiAgd2hpbGUgKCsraSA8IG4pIG1hcC5zZXQobmFtZXNbaV0udG9Mb3dlckNhc2UoKSwgaSk7XG4gIHJldHVybiBtYXA7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VXZWVrZGF5TnVtYmVyKGRhdGUsIHN0cmluZywgaSkge1xuICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMSkpO1xuICByZXR1cm4gbiA/IChkYXRlLncgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlV2Vla051bWJlclN1bmRheShkYXRlLCBzdHJpbmcsIGkpIHtcbiAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICByZXR1cm4gbiA/IChkYXRlLlUgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlV2Vla051bWJlck1vbmRheShkYXRlLCBzdHJpbmcsIGkpIHtcbiAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICByZXR1cm4gbiA/IChkYXRlLlcgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlRnVsbFllYXIoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyA0KSk7XG4gIHJldHVybiBuID8gKGRhdGUueSA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VZZWFyKGRhdGUsIHN0cmluZywgaSkge1xuICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMikpO1xuICByZXR1cm4gbiA/IChkYXRlLnkgPSBkM190aW1lX2V4cGFuZFllYXIoK25bMF0pLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfcGFyc2Vab25lKGRhdGUsIHN0cmluZywgaSkge1xuICByZXR1cm4gL15bKy1dXFxkezR9JC8udGVzdChzdHJpbmcgPSBzdHJpbmcuc2xpY2UoaSwgaSArIDUpKVxuICAgICAgPyAoZGF0ZS5aID0gLXN0cmluZywgaSArIDUpIC8vIHNpZ24gZGlmZmVycyBmcm9tIGdldFRpbWV6b25lT2Zmc2V0IVxuICAgICAgOiAtMTtcbn1cblxuZnVuY3Rpb24gZDNfdGltZV9leHBhbmRZZWFyKGQpIHtcbiAgcmV0dXJuIGQgKyAoZCA+IDY4ID8gMTkwMCA6IDIwMDApO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlTW9udGhOdW1iZXIoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAyKSk7XG4gIHJldHVybiBuID8gKGRhdGUubSA9IG5bMF0gLSAxLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VEYXkoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAyKSk7XG4gIHJldHVybiBuID8gKGRhdGUuZCA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VEYXlPZlllYXIoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAzKSk7XG4gIHJldHVybiBuID8gKGRhdGUuaiA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbi8vIE5vdGU6IHdlIGRvbid0IHZhbGlkYXRlIHRoYXQgdGhlIGhvdXIgaXMgaW4gdGhlIHJhbmdlIFswLDIzXSBvciBbMSwxMl0uXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlSG91cjI0KGRhdGUsIHN0cmluZywgaSkge1xuICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMikpO1xuICByZXR1cm4gbiA/IChkYXRlLkggPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlTWludXRlcyhkYXRlLCBzdHJpbmcsIGkpIHtcbiAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgcmV0dXJuIG4gPyAoZGF0ZS5NID0gK25bMF0sIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbn1cblxuZnVuY3Rpb24gZDNfdGltZV9wYXJzZVNlY29uZHMoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAyKSk7XG4gIHJldHVybiBuID8gKGRhdGUuUyA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VNaWxsaXNlY29uZHMoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAzKSk7XG4gIHJldHVybiBuID8gKGRhdGUuTCA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG59XG5cbi8vIFRPRE8gdGFibGUgb2YgdGltZSB6b25lIG9mZnNldCBuYW1lcz9cbmZ1bmN0aW9uIGQzX3RpbWVfem9uZShkKSB7XG4gIHZhciB6ID0gZC5nZXRUaW1lem9uZU9mZnNldCgpLFxuICAgICAgenMgPSB6ID4gMCA/IFwiLVwiIDogXCIrXCIsXG4gICAgICB6aCA9IGFicyh6KSAvIDYwIHwgMCxcbiAgICAgIHptID0gYWJzKHopICUgNjA7XG4gIHJldHVybiB6cyArIGQzX3RpbWVfZm9ybWF0UGFkKHpoLCBcIjBcIiwgMikgKyBkM190aW1lX2Zvcm1hdFBhZCh6bSwgXCIwXCIsIDIpO1xufVxuXG5mdW5jdGlvbiBkM190aW1lX3BhcnNlTGl0ZXJhbFBlcmNlbnQoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gIGQzX3RpbWVfcGVyY2VudFJlLmxhc3RJbmRleCA9IDA7XG4gIHZhciBuID0gZDNfdGltZV9wZXJjZW50UmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDEpKTtcbiAgcmV0dXJuIG4gPyBpICsgblswXS5sZW5ndGggOiAtMTtcbn1cblxuZnVuY3Rpb24gZDNfdGltZV9mb3JtYXRNdWx0aShmb3JtYXRzKSB7XG4gIHZhciBuID0gZm9ybWF0cy5sZW5ndGgsIGkgPSAtMTtcbiAgd2hpbGUgKCsraSA8IG4pIGZvcm1hdHNbaV1bMF0gPSB0aGlzKGZvcm1hdHNbaV1bMF0pO1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSkge1xuICAgIHZhciBpID0gMCwgZiA9IGZvcm1hdHNbaV07XG4gICAgd2hpbGUgKCFmWzFdKGRhdGUpKSBmID0gZm9ybWF0c1srK2ldO1xuICAgIHJldHVybiBmWzBdKGRhdGUpO1xuICB9O1xufVxuXG5kMy5sb2NhbGUgPSBmdW5jdGlvbihsb2NhbGUpIHtcbiAgcmV0dXJuIHtcbiAgICBudW1iZXJGb3JtYXQ6IGQzX2xvY2FsZV9udW1iZXJGb3JtYXQobG9jYWxlKSxcbiAgICB0aW1lRm9ybWF0OiBkM19sb2NhbGVfdGltZUZvcm1hdChsb2NhbGUpXG4gIH07XG59O1xuXG52YXIgZDNfbG9jYWxlX2VuVVMgPSBkMy5sb2NhbGUoe1xuICBkZWNpbWFsOiBcIi5cIixcbiAgdGhvdXNhbmRzOiBcIixcIixcbiAgZ3JvdXBpbmc6IFszXSxcbiAgY3VycmVuY3k6IFtcIiRcIiwgXCJcIl0sXG4gIGRhdGVUaW1lOiBcIiVhICViICVlICVYICVZXCIsXG4gIGRhdGU6IFwiJW0vJWQvJVlcIixcbiAgdGltZTogXCIlSDolTTolU1wiLFxuICBwZXJpb2RzOiBbXCJBTVwiLCBcIlBNXCJdLFxuICBkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiXSxcbiAgc2hvcnREYXlzOiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIl0sXG4gIG1vbnRoczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXG4gIHNob3J0TW9udGhzOiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cbn0pO1xuXG52YXIgZDNfdGltZV9mb3JtYXQgPSBkM190aW1lLmZvcm1hdCA9IGQzX2xvY2FsZV9lblVTLnRpbWVGb3JtYXQ7XG5cbnZhciBkM190aW1lX2Zvcm1hdFV0YyA9IGQzX3RpbWVfZm9ybWF0LnV0YztcblxudmFyIGQzX3RpbWVfZm9ybWF0SXNvID0gZDNfdGltZV9mb3JtYXRVdGMoXCIlWS0lbS0lZFQlSDolTTolUy4lTFpcIik7XG5cbmQzX3RpbWVfZm9ybWF0LmlzbyA9IERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nICYmICtuZXcgRGF0ZShcIjIwMDAtMDEtMDFUMDA6MDA6MDAuMDAwWlwiKVxuICAgID8gZDNfdGltZV9mb3JtYXRJc29OYXRpdmVcbiAgICA6IGQzX3RpbWVfZm9ybWF0SXNvO1xuXG5mdW5jdGlvbiBkM190aW1lX2Zvcm1hdElzb05hdGl2ZShkYXRlKSB7XG4gIHJldHVybiBkYXRlLnRvSVNPU3RyaW5nKCk7XG59XG5cbmQzX3RpbWVfZm9ybWF0SXNvTmF0aXZlLnBhcnNlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gIHZhciBkYXRlID0gbmV3IERhdGUoc3RyaW5nKTtcbiAgcmV0dXJuIGlzTmFOKGRhdGUpID8gbnVsbCA6IGRhdGU7XG59O1xuXG5kM190aW1lX2Zvcm1hdElzb05hdGl2ZS50b1N0cmluZyA9IGQzX3RpbWVfZm9ybWF0SXNvLnRvU3RyaW5nO1xuXG5kM190aW1lLnNlY29uZCA9IGQzX3RpbWVfaW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICByZXR1cm4gbmV3IGQzX2RhdGUoTWF0aC5mbG9vcihkYXRlIC8gMWUzKSAqIDFlMyk7XG59LCBmdW5jdGlvbihkYXRlLCBvZmZzZXQpIHtcbiAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgTWF0aC5mbG9vcihvZmZzZXQpICogMWUzKTsgLy8gRFNUIGJyZWFrcyBzZXRTZWNvbmRzXG59LCBmdW5jdGlvbihkYXRlKSB7XG4gIHJldHVybiBkYXRlLmdldFNlY29uZHMoKTtcbn0pO1xuXG5kM190aW1lLnNlY29uZHMgPSBkM190aW1lLnNlY29uZC5yYW5nZTtcbmQzX3RpbWUuc2Vjb25kcy51dGMgPSBkM190aW1lLnNlY29uZC51dGMucmFuZ2U7XG5cbmQzX3RpbWUubWludXRlID0gZDNfdGltZV9pbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gIHJldHVybiBuZXcgZDNfZGF0ZShNYXRoLmZsb29yKGRhdGUgLyA2ZTQpICogNmU0KTtcbn0sIGZ1bmN0aW9uKGRhdGUsIG9mZnNldCkge1xuICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyBNYXRoLmZsb29yKG9mZnNldCkgKiA2ZTQpOyAvLyBEU1QgYnJlYWtzIHNldE1pbnV0ZXNcbn0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgcmV0dXJuIGRhdGUuZ2V0TWludXRlcygpO1xufSk7XG5cbmQzX3RpbWUubWludXRlcyA9IGQzX3RpbWUubWludXRlLnJhbmdlO1xuZDNfdGltZS5taW51dGVzLnV0YyA9IGQzX3RpbWUubWludXRlLnV0Yy5yYW5nZTtcblxuZDNfdGltZS5ob3VyID0gZDNfdGltZV9pbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gIHZhciB0aW1lem9uZSA9IGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDYwO1xuICByZXR1cm4gbmV3IGQzX2RhdGUoKE1hdGguZmxvb3IoZGF0ZSAvIDM2ZTUgLSB0aW1lem9uZSkgKyB0aW1lem9uZSkgKiAzNmU1KTtcbn0sIGZ1bmN0aW9uKGRhdGUsIG9mZnNldCkge1xuICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyBNYXRoLmZsb29yKG9mZnNldCkgKiAzNmU1KTsgLy8gRFNUIGJyZWFrcyBzZXRIb3Vyc1xufSwgZnVuY3Rpb24oZGF0ZSkge1xuICByZXR1cm4gZGF0ZS5nZXRIb3VycygpO1xufSk7XG5cbmQzX3RpbWUuaG91cnMgPSBkM190aW1lLmhvdXIucmFuZ2U7XG5kM190aW1lLmhvdXJzLnV0YyA9IGQzX3RpbWUuaG91ci51dGMucmFuZ2U7XG5cbmQzX3RpbWUubW9udGggPSBkM190aW1lX2ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgZGF0ZSA9IGQzX3RpbWUuZGF5KGRhdGUpO1xuICBkYXRlLnNldERhdGUoMSk7XG4gIHJldHVybiBkYXRlO1xufSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gIGRhdGUuc2V0TW9udGgoZGF0ZS5nZXRNb250aCgpICsgb2Zmc2V0KTtcbn0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgcmV0dXJuIGRhdGUuZ2V0TW9udGgoKTtcbn0pO1xuXG5kM190aW1lLm1vbnRocyA9IGQzX3RpbWUubW9udGgucmFuZ2U7XG5kM190aW1lLm1vbnRocy51dGMgPSBkM190aW1lLm1vbnRoLnV0Yy5yYW5nZTtcblxuZnVuY3Rpb24gZDNfYmlzZWN0b3IoY29tcGFyZSkge1xuICByZXR1cm4ge1xuICAgIGxlZnQ6IGZ1bmN0aW9uKGEsIHgsIGxvLCBoaSkge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSBsbyA9IDA7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDQpIGhpID0gYS5sZW5ndGg7XG4gICAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgICAgaWYgKGNvbXBhcmUoYVttaWRdLCB4KSA8IDApIGxvID0gbWlkICsgMTtcbiAgICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsbztcbiAgICB9LFxuICAgIHJpZ2h0OiBmdW5jdGlvbihhLCB4LCBsbywgaGkpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykgbG8gPSAwO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCA0KSBoaSA9IGEubGVuZ3RoO1xuICAgICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICAgIGlmIChjb21wYXJlKGFbbWlkXSwgeCkgPiAwKSBoaSA9IG1pZDtcbiAgICAgICAgZWxzZSBsbyA9IG1pZCArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG87XG4gICAgfVxuICB9O1xufVxuXG52YXIgZDNfYmlzZWN0ID0gZDNfYmlzZWN0b3IoZDNfYXNjZW5kaW5nKTtcbmQzLmJpc2VjdExlZnQgPSBkM19iaXNlY3QubGVmdDtcbmQzLmJpc2VjdCA9IGQzLmJpc2VjdFJpZ2h0ID0gZDNfYmlzZWN0LnJpZ2h0O1xuXG5kMy5iaXNlY3RvciA9IGZ1bmN0aW9uKGYpIHtcbiAgcmV0dXJuIGQzX2Jpc2VjdG9yKGYubGVuZ3RoID09PSAxXG4gICAgICA/IGZ1bmN0aW9uKGQsIHgpIHsgcmV0dXJuIGQzX2FzY2VuZGluZyhmKGQpLCB4KTsgfVxuICAgICAgOiBmKTtcbn07XG5cbmQzLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgc3RlcCA9IDE7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICBzdG9wID0gc3RhcnQ7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICB9XG4gIGlmICgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXAgPT09IEluZmluaXR5KSB0aHJvdyBuZXcgRXJyb3IoXCJpbmZpbml0ZSByYW5nZVwiKTtcbiAgdmFyIHJhbmdlID0gW10sXG4gICAgICAgayA9IGQzX3JhbmdlX2ludGVnZXJTY2FsZShhYnMoc3RlcCkpLFxuICAgICAgIGkgPSAtMSxcbiAgICAgICBqO1xuICBzdGFydCAqPSBrLCBzdG9wICo9IGssIHN0ZXAgKj0gaztcbiAgaWYgKHN0ZXAgPCAwKSB3aGlsZSAoKGogPSBzdGFydCArIHN0ZXAgKiArK2kpID4gc3RvcCkgcmFuZ2UucHVzaChqIC8gayk7XG4gIGVsc2Ugd2hpbGUgKChqID0gc3RhcnQgKyBzdGVwICogKytpKSA8IHN0b3ApIHJhbmdlLnB1c2goaiAvIGspO1xuICByZXR1cm4gcmFuZ2U7XG59O1xuXG5mdW5jdGlvbiBkM19yYW5nZV9pbnRlZ2VyU2NhbGUoeCkge1xuICB2YXIgayA9IDE7XG4gIHdoaWxlICh4ICogayAlIDEpIGsgKj0gMTA7XG4gIHJldHVybiBrO1xufVxuZnVuY3Rpb24gZDNfdHJ1ZSgpIHtcbiAgcmV0dXJuIHRydWU7XG59XG5kMy5jb2xvciA9IGQzX2NvbG9yO1xuXG5mdW5jdGlvbiBkM19jb2xvcigpIHt9XG5cbmQzX2NvbG9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5yZ2IoKSArIFwiXCI7XG59O1xuXG5kMy5oc2wgPSBkM19oc2w7XG5cbmZ1bmN0aW9uIGQzX2hzbChoLCBzLCBsKSB7XG4gIHJldHVybiB0aGlzIGluc3RhbmNlb2YgZDNfaHNsID8gdm9pZCAodGhpcy5oID0gK2gsIHRoaXMucyA9ICtzLCB0aGlzLmwgPSArbClcbiAgICAgIDogYXJndW1lbnRzLmxlbmd0aCA8IDIgPyAoaCBpbnN0YW5jZW9mIGQzX2hzbCA/IG5ldyBkM19oc2woaC5oLCBoLnMsIGgubClcbiAgICAgIDogZDNfcmdiX3BhcnNlKFwiXCIgKyBoLCBkM19yZ2JfaHNsLCBkM19oc2wpKVxuICAgICAgOiBuZXcgZDNfaHNsKGgsIHMsIGwpO1xufVxuXG52YXIgZDNfaHNsUHJvdG90eXBlID0gZDNfaHNsLnByb3RvdHlwZSA9IG5ldyBkM19jb2xvcjtcblxuZDNfaHNsUHJvdG90eXBlLmJyaWdodGVyID0gZnVuY3Rpb24oaykge1xuICBrID0gTWF0aC5wb3coMC43LCBhcmd1bWVudHMubGVuZ3RoID8gayA6IDEpO1xuICByZXR1cm4gbmV3IGQzX2hzbCh0aGlzLmgsIHRoaXMucywgdGhpcy5sIC8gayk7XG59O1xuXG5kM19oc2xQcm90b3R5cGUuZGFya2VyID0gZnVuY3Rpb24oaykge1xuICBrID0gTWF0aC5wb3coMC43LCBhcmd1bWVudHMubGVuZ3RoID8gayA6IDEpO1xuICByZXR1cm4gbmV3IGQzX2hzbCh0aGlzLmgsIHRoaXMucywgayAqIHRoaXMubCk7XG59O1xuXG5kM19oc2xQcm90b3R5cGUucmdiID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBkM19oc2xfcmdiKHRoaXMuaCwgdGhpcy5zLCB0aGlzLmwpO1xufTtcblxuZnVuY3Rpb24gZDNfaHNsX3JnYihoLCBzLCBsKSB7XG4gIHZhciBtMSxcbiAgICAgIG0yO1xuXG4gIC8qIFNvbWUgc2ltcGxlIGNvcnJlY3Rpb25zIGZvciBoLCBzIGFuZCBsLiAqL1xuICBoID0gaXNOYU4oaCkgPyAwIDogKGggJT0gMzYwKSA8IDAgPyBoICsgMzYwIDogaDtcbiAgcyA9IGlzTmFOKHMpID8gMCA6IHMgPCAwID8gMCA6IHMgPiAxID8gMSA6IHM7XG4gIGwgPSBsIDwgMCA/IDAgOiBsID4gMSA/IDEgOiBsO1xuXG4gIC8qIEZyb20gRnZEIDEzLjM3LCBDU1MgQ29sb3IgTW9kdWxlIExldmVsIDMgKi9cbiAgbTIgPSBsIDw9IC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICBtMSA9IDIgKiBsIC0gbTI7XG5cbiAgZnVuY3Rpb24gdihoKSB7XG4gICAgaWYgKGggPiAzNjApIGggLT0gMzYwO1xuICAgIGVsc2UgaWYgKGggPCAwKSBoICs9IDM2MDtcbiAgICBpZiAoaCA8IDYwKSByZXR1cm4gbTEgKyAobTIgLSBtMSkgKiBoIC8gNjA7XG4gICAgaWYgKGggPCAxODApIHJldHVybiBtMjtcbiAgICBpZiAoaCA8IDI0MCkgcmV0dXJuIG0xICsgKG0yIC0gbTEpICogKDI0MCAtIGgpIC8gNjA7XG4gICAgcmV0dXJuIG0xO1xuICB9XG5cbiAgZnVuY3Rpb24gdnYoaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKHYoaCkgKiAyNTUpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBkM19yZ2IodnYoaCArIDEyMCksIHZ2KGgpLCB2dihoIC0gMTIwKSk7XG59XG52YXIgz4AgPSBNYXRoLlBJLFxuICAgIM+EID0gMiAqIM+ALFxuICAgIGhhbGbPgCA9IM+AIC8gMixcbiAgICDOtSA9IDFlLTYsXG4gICAgzrUyID0gzrUgKiDOtSxcbiAgICBkM19yYWRpYW5zID0gz4AgLyAxODAsXG4gICAgZDNfZGVncmVlcyA9IDE4MCAvIM+AO1xuXG5mdW5jdGlvbiBkM19zZ24oeCkge1xuICByZXR1cm4geCA+IDAgPyAxIDogeCA8IDAgPyAtMSA6IDA7XG59XG5cbi8vIFJldHVybnMgdGhlIDJEIGNyb3NzIHByb2R1Y3Qgb2YgQUIgYW5kIEFDIHZlY3RvcnMsIGkuZS4sIHRoZSB6LWNvbXBvbmVudCBvZlxuLy8gdGhlIDNEIGNyb3NzIHByb2R1Y3QgaW4gYSBxdWFkcmFudCBJIENhcnRlc2lhbiBjb29yZGluYXRlIHN5c3RlbSAoK3ggaXNcbi8vIHJpZ2h0LCAreSBpcyB1cCkuIFJldHVybnMgYSBwb3NpdGl2ZSB2YWx1ZSBpZiBBQkMgaXMgY291bnRlci1jbG9ja3dpc2UsXG4vLyBuZWdhdGl2ZSBpZiBjbG9ja3dpc2UsIGFuZCB6ZXJvIGlmIHRoZSBwb2ludHMgYXJlIGNvbGxpbmVhci5cbmZ1bmN0aW9uIGQzX2Nyb3NzMmQoYSwgYiwgYykge1xuICByZXR1cm4gKGJbMF0gLSBhWzBdKSAqIChjWzFdIC0gYVsxXSkgLSAoYlsxXSAtIGFbMV0pICogKGNbMF0gLSBhWzBdKTtcbn1cblxuZnVuY3Rpb24gZDNfYWNvcyh4KSB7XG4gIHJldHVybiB4ID4gMSA/IDAgOiB4IDwgLTEgPyDPgCA6IE1hdGguYWNvcyh4KTtcbn1cblxuZnVuY3Rpb24gZDNfYXNpbih4KSB7XG4gIHJldHVybiB4ID4gMSA/IGhhbGbPgCA6IHggPCAtMSA/IC1oYWxmz4AgOiBNYXRoLmFzaW4oeCk7XG59XG5cbmZ1bmN0aW9uIGQzX3NpbmgoeCkge1xuICByZXR1cm4gKCh4ID0gTWF0aC5leHAoeCkpIC0gMSAvIHgpIC8gMjtcbn1cblxuZnVuY3Rpb24gZDNfY29zaCh4KSB7XG4gIHJldHVybiAoKHggPSBNYXRoLmV4cCh4KSkgKyAxIC8geCkgLyAyO1xufVxuXG5mdW5jdGlvbiBkM190YW5oKHgpIHtcbiAgcmV0dXJuICgoeCA9IE1hdGguZXhwKDIgKiB4KSkgLSAxKSAvICh4ICsgMSk7XG59XG5cbmZ1bmN0aW9uIGQzX2hhdmVyc2luKHgpIHtcbiAgcmV0dXJuICh4ID0gTWF0aC5zaW4oeCAvIDIpKSAqIHg7XG59XG5cbmQzLmhjbCA9IGQzX2hjbDtcblxuZnVuY3Rpb24gZDNfaGNsKGgsIGMsIGwpIHtcbiAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBkM19oY2wgPyB2b2lkICh0aGlzLmggPSAraCwgdGhpcy5jID0gK2MsIHRoaXMubCA9ICtsKVxuICAgICAgOiBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IChoIGluc3RhbmNlb2YgZDNfaGNsID8gbmV3IGQzX2hjbChoLmgsIGguYywgaC5sKVxuICAgICAgOiAoaCBpbnN0YW5jZW9mIGQzX2xhYiA/IGQzX2xhYl9oY2woaC5sLCBoLmEsIGguYilcbiAgICAgIDogZDNfbGFiX2hjbCgoaCA9IGQzX3JnYl9sYWIoKGggPSBkMy5yZ2IoaCkpLnIsIGguZywgaC5iKSkubCwgaC5hLCBoLmIpKSlcbiAgICAgIDogbmV3IGQzX2hjbChoLCBjLCBsKTtcbn1cblxudmFyIGQzX2hjbFByb3RvdHlwZSA9IGQzX2hjbC5wcm90b3R5cGUgPSBuZXcgZDNfY29sb3I7XG5cbmQzX2hjbFByb3RvdHlwZS5icmlnaHRlciA9IGZ1bmN0aW9uKGspIHtcbiAgcmV0dXJuIG5ldyBkM19oY2wodGhpcy5oLCB0aGlzLmMsIE1hdGgubWluKDEwMCwgdGhpcy5sICsgZDNfbGFiX0sgKiAoYXJndW1lbnRzLmxlbmd0aCA/IGsgOiAxKSkpO1xufTtcblxuZDNfaGNsUHJvdG90eXBlLmRhcmtlciA9IGZ1bmN0aW9uKGspIHtcbiAgcmV0dXJuIG5ldyBkM19oY2wodGhpcy5oLCB0aGlzLmMsIE1hdGgubWF4KDAsIHRoaXMubCAtIGQzX2xhYl9LICogKGFyZ3VtZW50cy5sZW5ndGggPyBrIDogMSkpKTtcbn07XG5cbmQzX2hjbFByb3RvdHlwZS5yZ2IgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGQzX2hjbF9sYWIodGhpcy5oLCB0aGlzLmMsIHRoaXMubCkucmdiKCk7XG59O1xuXG5mdW5jdGlvbiBkM19oY2xfbGFiKGgsIGMsIGwpIHtcbiAgaWYgKGlzTmFOKGgpKSBoID0gMDtcbiAgaWYgKGlzTmFOKGMpKSBjID0gMDtcbiAgcmV0dXJuIG5ldyBkM19sYWIobCwgTWF0aC5jb3MoaCAqPSBkM19yYWRpYW5zKSAqIGMsIE1hdGguc2luKGgpICogYyk7XG59XG5cbmQzLmxhYiA9IGQzX2xhYjtcblxuZnVuY3Rpb24gZDNfbGFiKGwsIGEsIGIpIHtcbiAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBkM19sYWIgPyB2b2lkICh0aGlzLmwgPSArbCwgdGhpcy5hID0gK2EsIHRoaXMuYiA9ICtiKVxuICAgICAgOiBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IChsIGluc3RhbmNlb2YgZDNfbGFiID8gbmV3IGQzX2xhYihsLmwsIGwuYSwgbC5iKVxuICAgICAgOiAobCBpbnN0YW5jZW9mIGQzX2hjbCA/IGQzX2hjbF9sYWIobC5oLCBsLmMsIGwubClcbiAgICAgIDogZDNfcmdiX2xhYigobCA9IGQzX3JnYihsKSkuciwgbC5nLCBsLmIpKSlcbiAgICAgIDogbmV3IGQzX2xhYihsLCBhLCBiKTtcbn1cblxuLy8gQ29ycmVzcG9uZHMgcm91Z2hseSB0byBSR0IgYnJpZ2h0ZXIvZGFya2VyXG52YXIgZDNfbGFiX0sgPSAxODtcblxuLy8gRDY1IHN0YW5kYXJkIHJlZmVyZW50XG52YXIgZDNfbGFiX1ggPSAwLjk1MDQ3MCxcbiAgICBkM19sYWJfWSA9IDEsXG4gICAgZDNfbGFiX1ogPSAxLjA4ODgzMDtcblxudmFyIGQzX2xhYlByb3RvdHlwZSA9IGQzX2xhYi5wcm90b3R5cGUgPSBuZXcgZDNfY29sb3I7XG5cbmQzX2xhYlByb3RvdHlwZS5icmlnaHRlciA9IGZ1bmN0aW9uKGspIHtcbiAgcmV0dXJuIG5ldyBkM19sYWIoTWF0aC5taW4oMTAwLCB0aGlzLmwgKyBkM19sYWJfSyAqIChhcmd1bWVudHMubGVuZ3RoID8gayA6IDEpKSwgdGhpcy5hLCB0aGlzLmIpO1xufTtcblxuZDNfbGFiUHJvdG90eXBlLmRhcmtlciA9IGZ1bmN0aW9uKGspIHtcbiAgcmV0dXJuIG5ldyBkM19sYWIoTWF0aC5tYXgoMCwgdGhpcy5sIC0gZDNfbGFiX0sgKiAoYXJndW1lbnRzLmxlbmd0aCA/IGsgOiAxKSksIHRoaXMuYSwgdGhpcy5iKTtcbn07XG5cbmQzX2xhYlByb3RvdHlwZS5yZ2IgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGQzX2xhYl9yZ2IodGhpcy5sLCB0aGlzLmEsIHRoaXMuYik7XG59O1xuXG5mdW5jdGlvbiBkM19sYWJfcmdiKGwsIGEsIGIpIHtcbiAgdmFyIHkgPSAobCArIDE2KSAvIDExNixcbiAgICAgIHggPSB5ICsgYSAvIDUwMCxcbiAgICAgIHogPSB5IC0gYiAvIDIwMDtcbiAgeCA9IGQzX2xhYl94eXooeCkgKiBkM19sYWJfWDtcbiAgeSA9IGQzX2xhYl94eXooeSkgKiBkM19sYWJfWTtcbiAgeiA9IGQzX2xhYl94eXooeikgKiBkM19sYWJfWjtcbiAgcmV0dXJuIG5ldyBkM19yZ2IoXG4gICAgZDNfeHl6X3JnYiggMy4yNDA0NTQyICogeCAtIDEuNTM3MTM4NSAqIHkgLSAwLjQ5ODUzMTQgKiB6KSxcbiAgICBkM194eXpfcmdiKC0wLjk2OTI2NjAgKiB4ICsgMS44NzYwMTA4ICogeSArIDAuMDQxNTU2MCAqIHopLFxuICAgIGQzX3h5el9yZ2IoIDAuMDU1NjQzNCAqIHggLSAwLjIwNDAyNTkgKiB5ICsgMS4wNTcyMjUyICogeilcbiAgKTtcbn1cblxuZnVuY3Rpb24gZDNfbGFiX2hjbChsLCBhLCBiKSB7XG4gIHJldHVybiBsID4gMFxuICAgICAgPyBuZXcgZDNfaGNsKE1hdGguYXRhbjIoYiwgYSkgKiBkM19kZWdyZWVzLCBNYXRoLnNxcnQoYSAqIGEgKyBiICogYiksIGwpXG4gICAgICA6IG5ldyBkM19oY2woTmFOLCBOYU4sIGwpO1xufVxuXG5mdW5jdGlvbiBkM19sYWJfeHl6KHgpIHtcbiAgcmV0dXJuIHggPiAwLjIwNjg5MzAzNCA/IHggKiB4ICogeCA6ICh4IC0gNCAvIDI5KSAvIDcuNzg3MDM3O1xufVxuZnVuY3Rpb24gZDNfeHl6X2xhYih4KSB7XG4gIHJldHVybiB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxIC8gMykgOiA3Ljc4NzAzNyAqIHggKyA0IC8gMjk7XG59XG5cbmZ1bmN0aW9uIGQzX3h5el9yZ2Iocikge1xuICByZXR1cm4gTWF0aC5yb3VuZCgyNTUgKiAociA8PSAwLjAwMzA0ID8gMTIuOTIgKiByIDogMS4wNTUgKiBNYXRoLnBvdyhyLCAxIC8gMi40KSAtIDAuMDU1KSk7XG59XG5cbmQzLnJnYiA9IGQzX3JnYjtcblxuZnVuY3Rpb24gZDNfcmdiKHIsIGcsIGIpIHtcbiAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBkM19yZ2IgPyB2b2lkICh0aGlzLnIgPSB+fnIsIHRoaXMuZyA9IH5+ZywgdGhpcy5iID0gfn5iKVxuICAgICAgOiBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IChyIGluc3RhbmNlb2YgZDNfcmdiID8gbmV3IGQzX3JnYihyLnIsIHIuZywgci5iKVxuICAgICAgOiBkM19yZ2JfcGFyc2UoXCJcIiArIHIsIGQzX3JnYiwgZDNfaHNsX3JnYikpXG4gICAgICA6IG5ldyBkM19yZ2IociwgZywgYik7XG59XG5cbmZ1bmN0aW9uIGQzX3JnYk51bWJlcih2YWx1ZSkge1xuICByZXR1cm4gbmV3IGQzX3JnYih2YWx1ZSA+PiAxNiwgdmFsdWUgPj4gOCAmIDB4ZmYsIHZhbHVlICYgMHhmZik7XG59XG5cbmZ1bmN0aW9uIGQzX3JnYlN0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gZDNfcmdiTnVtYmVyKHZhbHVlKSArIFwiXCI7XG59XG5cbnZhciBkM19yZ2JQcm90b3R5cGUgPSBkM19yZ2IucHJvdG90eXBlID0gbmV3IGQzX2NvbG9yO1xuXG5kM19yZ2JQcm90b3R5cGUuYnJpZ2h0ZXIgPSBmdW5jdGlvbihrKSB7XG4gIGsgPSBNYXRoLnBvdygwLjcsIGFyZ3VtZW50cy5sZW5ndGggPyBrIDogMSk7XG4gIHZhciByID0gdGhpcy5yLFxuICAgICAgZyA9IHRoaXMuZyxcbiAgICAgIGIgPSB0aGlzLmIsXG4gICAgICBpID0gMzA7XG4gIGlmICghciAmJiAhZyAmJiAhYikgcmV0dXJuIG5ldyBkM19yZ2IoaSwgaSwgaSk7XG4gIGlmIChyICYmIHIgPCBpKSByID0gaTtcbiAgaWYgKGcgJiYgZyA8IGkpIGcgPSBpO1xuICBpZiAoYiAmJiBiIDwgaSkgYiA9IGk7XG4gIHJldHVybiBuZXcgZDNfcmdiKE1hdGgubWluKDI1NSwgciAvIGspLCBNYXRoLm1pbigyNTUsIGcgLyBrKSwgTWF0aC5taW4oMjU1LCBiIC8gaykpO1xufTtcblxuZDNfcmdiUHJvdG90eXBlLmRhcmtlciA9IGZ1bmN0aW9uKGspIHtcbiAgayA9IE1hdGgucG93KDAuNywgYXJndW1lbnRzLmxlbmd0aCA/IGsgOiAxKTtcbiAgcmV0dXJuIG5ldyBkM19yZ2IoayAqIHRoaXMuciwgayAqIHRoaXMuZywgayAqIHRoaXMuYik7XG59O1xuXG5kM19yZ2JQcm90b3R5cGUuaHNsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBkM19yZ2JfaHNsKHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xufTtcblxuZDNfcmdiUHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBcIiNcIiArIGQzX3JnYl9oZXgodGhpcy5yKSArIGQzX3JnYl9oZXgodGhpcy5nKSArIGQzX3JnYl9oZXgodGhpcy5iKTtcbn07XG5cbmZ1bmN0aW9uIGQzX3JnYl9oZXgodikge1xuICByZXR1cm4gdiA8IDB4MTBcbiAgICAgID8gXCIwXCIgKyBNYXRoLm1heCgwLCB2KS50b1N0cmluZygxNilcbiAgICAgIDogTWF0aC5taW4oMjU1LCB2KS50b1N0cmluZygxNik7XG59XG5cbmZ1bmN0aW9uIGQzX3JnYl9wYXJzZShmb3JtYXQsIHJnYiwgaHNsKSB7XG4gIHZhciByID0gMCwgLy8gcmVkIGNoYW5uZWw7IGludCBpbiBbMCwgMjU1XVxuICAgICAgZyA9IDAsIC8vIGdyZWVuIGNoYW5uZWw7IGludCBpbiBbMCwgMjU1XVxuICAgICAgYiA9IDAsIC8vIGJsdWUgY2hhbm5lbDsgaW50IGluIFswLCAyNTVdXG4gICAgICBtMSwgLy8gQ1NTIGNvbG9yIHNwZWNpZmljYXRpb24gbWF0Y2hcbiAgICAgIG0yLCAvLyBDU1MgY29sb3Igc3BlY2lmaWNhdGlvbiB0eXBlIChlLmcuLCByZ2IpXG4gICAgICBjb2xvcjtcblxuICAvKiBIYW5kbGUgaHNsLCByZ2IuICovXG4gIG0xID0gLyhbYS16XSspXFwoKC4qKVxcKS9pLmV4ZWMoZm9ybWF0KTtcbiAgaWYgKG0xKSB7XG4gICAgbTIgPSBtMVsyXS5zcGxpdChcIixcIik7XG4gICAgc3dpdGNoIChtMVsxXSkge1xuICAgICAgY2FzZSBcImhzbFwiOiB7XG4gICAgICAgIHJldHVybiBoc2woXG4gICAgICAgICAgcGFyc2VGbG9hdChtMlswXSksIC8vIGRlZ3JlZXNcbiAgICAgICAgICBwYXJzZUZsb2F0KG0yWzFdKSAvIDEwMCwgLy8gcGVyY2VudGFnZVxuICAgICAgICAgIHBhcnNlRmxvYXQobTJbMl0pIC8gMTAwIC8vIHBlcmNlbnRhZ2VcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJyZ2JcIjoge1xuICAgICAgICByZXR1cm4gcmdiKFxuICAgICAgICAgIGQzX3JnYl9wYXJzZU51bWJlcihtMlswXSksXG4gICAgICAgICAgZDNfcmdiX3BhcnNlTnVtYmVyKG0yWzFdKSxcbiAgICAgICAgICBkM19yZ2JfcGFyc2VOdW1iZXIobTJbMl0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyogTmFtZWQgY29sb3JzLiAqL1xuICBpZiAoY29sb3IgPSBkM19yZ2JfbmFtZXMuZ2V0KGZvcm1hdCkpIHJldHVybiByZ2IoY29sb3IuciwgY29sb3IuZywgY29sb3IuYik7XG5cbiAgLyogSGV4YWRlY2ltYWwgY29sb3JzOiAjcmdiIGFuZCAjcnJnZ2JiLiAqL1xuICBpZiAoZm9ybWF0ICE9IG51bGwgJiYgZm9ybWF0LmNoYXJBdCgwKSA9PT0gXCIjXCIgJiYgIWlzTmFOKGNvbG9yID0gcGFyc2VJbnQoZm9ybWF0LnNsaWNlKDEpLCAxNikpKSB7XG4gICAgaWYgKGZvcm1hdC5sZW5ndGggPT09IDQpIHtcbiAgICAgIHIgPSAoY29sb3IgJiAweGYwMCkgPj4gNDsgciA9IChyID4+IDQpIHwgcjtcbiAgICAgIGcgPSAoY29sb3IgJiAweGYwKTsgZyA9IChnID4+IDQpIHwgZztcbiAgICAgIGIgPSAoY29sb3IgJiAweGYpOyBiID0gKGIgPDwgNCkgfCBiO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0Lmxlbmd0aCA9PT0gNykge1xuICAgICAgciA9IChjb2xvciAmIDB4ZmYwMDAwKSA+PiAxNjtcbiAgICAgIGcgPSAoY29sb3IgJiAweGZmMDApID4+IDg7XG4gICAgICBiID0gKGNvbG9yICYgMHhmZik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJnYihyLCBnLCBiKTtcbn1cblxuZnVuY3Rpb24gZDNfcmdiX2hzbChyLCBnLCBiKSB7XG4gIHZhciBtaW4gPSBNYXRoLm1pbihyIC89IDI1NSwgZyAvPSAyNTUsIGIgLz0gMjU1KSxcbiAgICAgIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpLFxuICAgICAgZCA9IG1heCAtIG1pbixcbiAgICAgIGgsXG4gICAgICBzLFxuICAgICAgbCA9IChtYXggKyBtaW4pIC8gMjtcbiAgaWYgKGQpIHtcbiAgICBzID0gbCA8IC41ID8gZCAvIChtYXggKyBtaW4pIDogZCAvICgyIC0gbWF4IC0gbWluKTtcbiAgICBpZiAociA9PSBtYXgpIGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKTtcbiAgICBlbHNlIGlmIChnID09IG1heCkgaCA9IChiIC0gcikgLyBkICsgMjtcbiAgICBlbHNlIGggPSAociAtIGcpIC8gZCArIDQ7XG4gICAgaCAqPSA2MDtcbiAgfSBlbHNlIHtcbiAgICBoID0gTmFOO1xuICAgIHMgPSBsID4gMCAmJiBsIDwgMSA/IDAgOiBoO1xuICB9XG4gIHJldHVybiBuZXcgZDNfaHNsKGgsIHMsIGwpO1xufVxuXG5mdW5jdGlvbiBkM19yZ2JfbGFiKHIsIGcsIGIpIHtcbiAgciA9IGQzX3JnYl94eXoocik7XG4gIGcgPSBkM19yZ2JfeHl6KGcpO1xuICBiID0gZDNfcmdiX3h5eihiKTtcbiAgdmFyIHggPSBkM194eXpfbGFiKCgwLjQxMjQ1NjQgKiByICsgMC4zNTc1NzYxICogZyArIDAuMTgwNDM3NSAqIGIpIC8gZDNfbGFiX1gpLFxuICAgICAgeSA9IGQzX3h5el9sYWIoKDAuMjEyNjcyOSAqIHIgKyAwLjcxNTE1MjIgKiBnICsgMC4wNzIxNzUwICogYikgLyBkM19sYWJfWSksXG4gICAgICB6ID0gZDNfeHl6X2xhYigoMC4wMTkzMzM5ICogciArIDAuMTE5MTkyMCAqIGcgKyAwLjk1MDMwNDEgKiBiKSAvIGQzX2xhYl9aKTtcbiAgcmV0dXJuIGQzX2xhYigxMTYgKiB5IC0gMTYsIDUwMCAqICh4IC0geSksIDIwMCAqICh5IC0geikpO1xufVxuXG5mdW5jdGlvbiBkM19yZ2JfeHl6KHIpIHtcbiAgcmV0dXJuIChyIC89IDI1NSkgPD0gMC4wNDA0NSA/IHIgLyAxMi45MiA6IE1hdGgucG93KChyICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG59XG5cbmZ1bmN0aW9uIGQzX3JnYl9wYXJzZU51bWJlcihjKSB7IC8vIGVpdGhlciBpbnRlZ2VyIG9yIHBlcmNlbnRhZ2VcbiAgdmFyIGYgPSBwYXJzZUZsb2F0KGMpO1xuICByZXR1cm4gYy5jaGFyQXQoYy5sZW5ndGggLSAxKSA9PT0gXCIlXCIgPyBNYXRoLnJvdW5kKGYgKiAyLjU1KSA6IGY7XG59XG5cbnZhciBkM19yZ2JfbmFtZXMgPSBkMy5tYXAoe1xuICBhbGljZWJsdWU6IDB4ZjBmOGZmLFxuICBhbnRpcXVld2hpdGU6IDB4ZmFlYmQ3LFxuICBhcXVhOiAweDAwZmZmZixcbiAgYXF1YW1hcmluZTogMHg3ZmZmZDQsXG4gIGF6dXJlOiAweGYwZmZmZixcbiAgYmVpZ2U6IDB4ZjVmNWRjLFxuICBiaXNxdWU6IDB4ZmZlNGM0LFxuICBibGFjazogMHgwMDAwMDAsXG4gIGJsYW5jaGVkYWxtb25kOiAweGZmZWJjZCxcbiAgYmx1ZTogMHgwMDAwZmYsXG4gIGJsdWV2aW9sZXQ6IDB4OGEyYmUyLFxuICBicm93bjogMHhhNTJhMmEsXG4gIGJ1cmx5d29vZDogMHhkZWI4ODcsXG4gIGNhZGV0Ymx1ZTogMHg1ZjllYTAsXG4gIGNoYXJ0cmV1c2U6IDB4N2ZmZjAwLFxuICBjaG9jb2xhdGU6IDB4ZDI2OTFlLFxuICBjb3JhbDogMHhmZjdmNTAsXG4gIGNvcm5mbG93ZXJibHVlOiAweDY0OTVlZCxcbiAgY29ybnNpbGs6IDB4ZmZmOGRjLFxuICBjcmltc29uOiAweGRjMTQzYyxcbiAgY3lhbjogMHgwMGZmZmYsXG4gIGRhcmtibHVlOiAweDAwMDA4YixcbiAgZGFya2N5YW46IDB4MDA4YjhiLFxuICBkYXJrZ29sZGVucm9kOiAweGI4ODYwYixcbiAgZGFya2dyYXk6IDB4YTlhOWE5LFxuICBkYXJrZ3JlZW46IDB4MDA2NDAwLFxuICBkYXJrZ3JleTogMHhhOWE5YTksXG4gIGRhcmtraGFraTogMHhiZGI3NmIsXG4gIGRhcmttYWdlbnRhOiAweDhiMDA4YixcbiAgZGFya29saXZlZ3JlZW46IDB4NTU2YjJmLFxuICBkYXJrb3JhbmdlOiAweGZmOGMwMCxcbiAgZGFya29yY2hpZDogMHg5OTMyY2MsXG4gIGRhcmtyZWQ6IDB4OGIwMDAwLFxuICBkYXJrc2FsbW9uOiAweGU5OTY3YSxcbiAgZGFya3NlYWdyZWVuOiAweDhmYmM4ZixcbiAgZGFya3NsYXRlYmx1ZTogMHg0ODNkOGIsXG4gIGRhcmtzbGF0ZWdyYXk6IDB4MmY0ZjRmLFxuICBkYXJrc2xhdGVncmV5OiAweDJmNGY0ZixcbiAgZGFya3R1cnF1b2lzZTogMHgwMGNlZDEsXG4gIGRhcmt2aW9sZXQ6IDB4OTQwMGQzLFxuICBkZWVwcGluazogMHhmZjE0OTMsXG4gIGRlZXBza3libHVlOiAweDAwYmZmZixcbiAgZGltZ3JheTogMHg2OTY5NjksXG4gIGRpbWdyZXk6IDB4Njk2OTY5LFxuICBkb2RnZXJibHVlOiAweDFlOTBmZixcbiAgZmlyZWJyaWNrOiAweGIyMjIyMixcbiAgZmxvcmFsd2hpdGU6IDB4ZmZmYWYwLFxuICBmb3Jlc3RncmVlbjogMHgyMjhiMjIsXG4gIGZ1Y2hzaWE6IDB4ZmYwMGZmLFxuICBnYWluc2Jvcm86IDB4ZGNkY2RjLFxuICBnaG9zdHdoaXRlOiAweGY4ZjhmZixcbiAgZ29sZDogMHhmZmQ3MDAsXG4gIGdvbGRlbnJvZDogMHhkYWE1MjAsXG4gIGdyYXk6IDB4ODA4MDgwLFxuICBncmVlbjogMHgwMDgwMDAsXG4gIGdyZWVueWVsbG93OiAweGFkZmYyZixcbiAgZ3JleTogMHg4MDgwODAsXG4gIGhvbmV5ZGV3OiAweGYwZmZmMCxcbiAgaG90cGluazogMHhmZjY5YjQsXG4gIGluZGlhbnJlZDogMHhjZDVjNWMsXG4gIGluZGlnbzogMHg0YjAwODIsXG4gIGl2b3J5OiAweGZmZmZmMCxcbiAga2hha2k6IDB4ZjBlNjhjLFxuICBsYXZlbmRlcjogMHhlNmU2ZmEsXG4gIGxhdmVuZGVyYmx1c2g6IDB4ZmZmMGY1LFxuICBsYXduZ3JlZW46IDB4N2NmYzAwLFxuICBsZW1vbmNoaWZmb246IDB4ZmZmYWNkLFxuICBsaWdodGJsdWU6IDB4YWRkOGU2LFxuICBsaWdodGNvcmFsOiAweGYwODA4MCxcbiAgbGlnaHRjeWFuOiAweGUwZmZmZixcbiAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6IDB4ZmFmYWQyLFxuICBsaWdodGdyYXk6IDB4ZDNkM2QzLFxuICBsaWdodGdyZWVuOiAweDkwZWU5MCxcbiAgbGlnaHRncmV5OiAweGQzZDNkMyxcbiAgbGlnaHRwaW5rOiAweGZmYjZjMSxcbiAgbGlnaHRzYWxtb246IDB4ZmZhMDdhLFxuICBsaWdodHNlYWdyZWVuOiAweDIwYjJhYSxcbiAgbGlnaHRza3libHVlOiAweDg3Y2VmYSxcbiAgbGlnaHRzbGF0ZWdyYXk6IDB4Nzc4ODk5LFxuICBsaWdodHNsYXRlZ3JleTogMHg3Nzg4OTksXG4gIGxpZ2h0c3RlZWxibHVlOiAweGIwYzRkZSxcbiAgbGlnaHR5ZWxsb3c6IDB4ZmZmZmUwLFxuICBsaW1lOiAweDAwZmYwMCxcbiAgbGltZWdyZWVuOiAweDMyY2QzMixcbiAgbGluZW46IDB4ZmFmMGU2LFxuICBtYWdlbnRhOiAweGZmMDBmZixcbiAgbWFyb29uOiAweDgwMDAwMCxcbiAgbWVkaXVtYXF1YW1hcmluZTogMHg2NmNkYWEsXG4gIG1lZGl1bWJsdWU6IDB4MDAwMGNkLFxuICBtZWRpdW1vcmNoaWQ6IDB4YmE1NWQzLFxuICBtZWRpdW1wdXJwbGU6IDB4OTM3MGRiLFxuICBtZWRpdW1zZWFncmVlbjogMHgzY2IzNzEsXG4gIG1lZGl1bXNsYXRlYmx1ZTogMHg3YjY4ZWUsXG4gIG1lZGl1bXNwcmluZ2dyZWVuOiAweDAwZmE5YSxcbiAgbWVkaXVtdHVycXVvaXNlOiAweDQ4ZDFjYyxcbiAgbWVkaXVtdmlvbGV0cmVkOiAweGM3MTU4NSxcbiAgbWlkbmlnaHRibHVlOiAweDE5MTk3MCxcbiAgbWludGNyZWFtOiAweGY1ZmZmYSxcbiAgbWlzdHlyb3NlOiAweGZmZTRlMSxcbiAgbW9jY2FzaW46IDB4ZmZlNGI1LFxuICBuYXZham93aGl0ZTogMHhmZmRlYWQsXG4gIG5hdnk6IDB4MDAwMDgwLFxuICBvbGRsYWNlOiAweGZkZjVlNixcbiAgb2xpdmU6IDB4ODA4MDAwLFxuICBvbGl2ZWRyYWI6IDB4NmI4ZTIzLFxuICBvcmFuZ2U6IDB4ZmZhNTAwLFxuICBvcmFuZ2VyZWQ6IDB4ZmY0NTAwLFxuICBvcmNoaWQ6IDB4ZGE3MGQ2LFxuICBwYWxlZ29sZGVucm9kOiAweGVlZThhYSxcbiAgcGFsZWdyZWVuOiAweDk4ZmI5OCxcbiAgcGFsZXR1cnF1b2lzZTogMHhhZmVlZWUsXG4gIHBhbGV2aW9sZXRyZWQ6IDB4ZGI3MDkzLFxuICBwYXBheWF3aGlwOiAweGZmZWZkNSxcbiAgcGVhY2hwdWZmOiAweGZmZGFiOSxcbiAgcGVydTogMHhjZDg1M2YsXG4gIHBpbms6IDB4ZmZjMGNiLFxuICBwbHVtOiAweGRkYTBkZCxcbiAgcG93ZGVyYmx1ZTogMHhiMGUwZTYsXG4gIHB1cnBsZTogMHg4MDAwODAsXG4gIHJlZDogMHhmZjAwMDAsXG4gIHJvc3licm93bjogMHhiYzhmOGYsXG4gIHJveWFsYmx1ZTogMHg0MTY5ZTEsXG4gIHNhZGRsZWJyb3duOiAweDhiNDUxMyxcbiAgc2FsbW9uOiAweGZhODA3MixcbiAgc2FuZHlicm93bjogMHhmNGE0NjAsXG4gIHNlYWdyZWVuOiAweDJlOGI1NyxcbiAgc2Vhc2hlbGw6IDB4ZmZmNWVlLFxuICBzaWVubmE6IDB4YTA1MjJkLFxuICBzaWx2ZXI6IDB4YzBjMGMwLFxuICBza3libHVlOiAweDg3Y2VlYixcbiAgc2xhdGVibHVlOiAweDZhNWFjZCxcbiAgc2xhdGVncmF5OiAweDcwODA5MCxcbiAgc2xhdGVncmV5OiAweDcwODA5MCxcbiAgc25vdzogMHhmZmZhZmEsXG4gIHNwcmluZ2dyZWVuOiAweDAwZmY3ZixcbiAgc3RlZWxibHVlOiAweDQ2ODJiNCxcbiAgdGFuOiAweGQyYjQ4YyxcbiAgdGVhbDogMHgwMDgwODAsXG4gIHRoaXN0bGU6IDB4ZDhiZmQ4LFxuICB0b21hdG86IDB4ZmY2MzQ3LFxuICB0dXJxdW9pc2U6IDB4NDBlMGQwLFxuICB2aW9sZXQ6IDB4ZWU4MmVlLFxuICB3aGVhdDogMHhmNWRlYjMsXG4gIHdoaXRlOiAweGZmZmZmZixcbiAgd2hpdGVzbW9rZTogMHhmNWY1ZjUsXG4gIHllbGxvdzogMHhmZmZmMDAsXG4gIHllbGxvd2dyZWVuOiAweDlhY2QzMlxufSk7XG5cbmQzX3JnYl9uYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgZDNfcmdiX25hbWVzLnNldChrZXksIGQzX3JnYk51bWJlcih2YWx1ZSkpO1xufSk7XG5cbmQzLmludGVycG9sYXRlUmdiID0gZDNfaW50ZXJwb2xhdGVSZ2I7XG5cbmZ1bmN0aW9uIGQzX2ludGVycG9sYXRlUmdiKGEsIGIpIHtcbiAgYSA9IGQzLnJnYihhKTtcbiAgYiA9IGQzLnJnYihiKTtcbiAgdmFyIGFyID0gYS5yLFxuICAgICAgYWcgPSBhLmcsXG4gICAgICBhYiA9IGEuYixcbiAgICAgIGJyID0gYi5yIC0gYXIsXG4gICAgICBiZyA9IGIuZyAtIGFnLFxuICAgICAgYmIgPSBiLmIgLSBhYjtcbiAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICByZXR1cm4gXCIjXCJcbiAgICAgICAgKyBkM19yZ2JfaGV4KE1hdGgucm91bmQoYXIgKyBiciAqIHQpKVxuICAgICAgICArIGQzX3JnYl9oZXgoTWF0aC5yb3VuZChhZyArIGJnICogdCkpXG4gICAgICAgICsgZDNfcmdiX2hleChNYXRoLnJvdW5kKGFiICsgYmIgKiB0KSk7XG4gIH07XG59XG5cbmQzLmludGVycG9sYXRlT2JqZWN0ID0gZDNfaW50ZXJwb2xhdGVPYmplY3Q7XG5cbmZ1bmN0aW9uIGQzX2ludGVycG9sYXRlT2JqZWN0KGEsIGIpIHtcbiAgdmFyIGkgPSB7fSxcbiAgICAgIGMgPSB7fSxcbiAgICAgIGs7XG4gIGZvciAoayBpbiBhKSB7XG4gICAgaWYgKGsgaW4gYikge1xuICAgICAgaVtrXSA9IGQzX2ludGVycG9sYXRlKGFba10sIGJba10pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjW2tdID0gYVtrXTtcbiAgICB9XG4gIH1cbiAgZm9yIChrIGluIGIpIHtcbiAgICBpZiAoIShrIGluIGEpKSB7XG4gICAgICBjW2tdID0gYltrXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKGsgaW4gaSkgY1trXSA9IGlba10odCk7XG4gICAgcmV0dXJuIGM7XG4gIH07XG59XG5cbmQzLmludGVycG9sYXRlQXJyYXkgPSBkM19pbnRlcnBvbGF0ZUFycmF5O1xuXG5mdW5jdGlvbiBkM19pbnRlcnBvbGF0ZUFycmF5KGEsIGIpIHtcbiAgdmFyIHggPSBbXSxcbiAgICAgIGMgPSBbXSxcbiAgICAgIG5hID0gYS5sZW5ndGgsXG4gICAgICBuYiA9IGIubGVuZ3RoLFxuICAgICAgbjAgPSBNYXRoLm1pbihhLmxlbmd0aCwgYi5sZW5ndGgpLFxuICAgICAgaTtcbiAgZm9yIChpID0gMDsgaSA8IG4wOyArK2kpIHgucHVzaChkM19pbnRlcnBvbGF0ZShhW2ldLCBiW2ldKSk7XG4gIGZvciAoOyBpIDwgbmE7ICsraSkgY1tpXSA9IGFbaV07XG4gIGZvciAoOyBpIDwgbmI7ICsraSkgY1tpXSA9IGJbaV07XG4gIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgZm9yIChpID0gMDsgaSA8IG4wOyArK2kpIGNbaV0gPSB4W2ldKHQpO1xuICAgIHJldHVybiBjO1xuICB9O1xufVxuZDMuaW50ZXJwb2xhdGVOdW1iZXIgPSBkM19pbnRlcnBvbGF0ZU51bWJlcjtcblxuZnVuY3Rpb24gZDNfaW50ZXJwb2xhdGVOdW1iZXIoYSwgYikge1xuICBhID0gK2EsIGIgPSArYjtcbiAgcmV0dXJuIGZ1bmN0aW9uKHQpIHsgcmV0dXJuIGEgKiAoMSAtIHQpICsgYiAqIHQ7IH07XG59XG5cbmQzLmludGVycG9sYXRlU3RyaW5nID0gZDNfaW50ZXJwb2xhdGVTdHJpbmc7XG5cbmZ1bmN0aW9uIGQzX2ludGVycG9sYXRlU3RyaW5nKGEsIGIpIHtcbiAgdmFyIGJpID0gZDNfaW50ZXJwb2xhdGVfbnVtYmVyQS5sYXN0SW5kZXggPSBkM19pbnRlcnBvbGF0ZV9udW1iZXJCLmxhc3RJbmRleCA9IDAsIC8vIHNjYW4gaW5kZXggZm9yIG5leHQgbnVtYmVyIGluIGJcbiAgICAgIGFtLCAvLyBjdXJyZW50IG1hdGNoIGluIGFcbiAgICAgIGJtLCAvLyBjdXJyZW50IG1hdGNoIGluIGJcbiAgICAgIGJzLCAvLyBzdHJpbmcgcHJlY2VkaW5nIGN1cnJlbnQgbnVtYmVyIGluIGIsIGlmIGFueVxuICAgICAgaSA9IC0xLCAvLyBpbmRleCBpbiBzXG4gICAgICBzID0gW10sIC8vIHN0cmluZyBjb25zdGFudHMgYW5kIHBsYWNlaG9sZGVyc1xuICAgICAgcSA9IFtdOyAvLyBudW1iZXIgaW50ZXJwb2xhdG9yc1xuXG4gIC8vIENvZXJjZSBpbnB1dHMgdG8gc3RyaW5ncy5cbiAgYSA9IGEgKyBcIlwiLCBiID0gYiArIFwiXCI7XG5cbiAgLy8gSW50ZXJwb2xhdGUgcGFpcnMgb2YgbnVtYmVycyBpbiBhICYgYi5cbiAgd2hpbGUgKChhbSA9IGQzX2ludGVycG9sYXRlX251bWJlckEuZXhlYyhhKSlcbiAgICAgICYmIChibSA9IGQzX2ludGVycG9sYXRlX251bWJlckIuZXhlYyhiKSkpIHtcbiAgICBpZiAoKGJzID0gYm0uaW5kZXgpID4gYmkpIHsgLy8gYSBzdHJpbmcgcHJlY2VkZXMgdGhlIG5leHQgbnVtYmVyIGluIGJcbiAgICAgIGJzID0gYi5zbGljZShiaSwgYnMpO1xuICAgICAgaWYgKHNbaV0pIHNbaV0gKz0gYnM7IC8vIGNvYWxlc2NlIHdpdGggcHJldmlvdXMgc3RyaW5nXG4gICAgICBlbHNlIHNbKytpXSA9IGJzO1xuICAgIH1cbiAgICBpZiAoKGFtID0gYW1bMF0pID09PSAoYm0gPSBibVswXSkpIHsgLy8gbnVtYmVycyBpbiBhICYgYiBtYXRjaFxuICAgICAgaWYgKHNbaV0pIHNbaV0gKz0gYm07IC8vIGNvYWxlc2NlIHdpdGggcHJldmlvdXMgc3RyaW5nXG4gICAgICBlbHNlIHNbKytpXSA9IGJtO1xuICAgIH0gZWxzZSB7IC8vIGludGVycG9sYXRlIG5vbi1tYXRjaGluZyBudW1iZXJzXG4gICAgICBzWysraV0gPSBudWxsO1xuICAgICAgcS5wdXNoKHtpOiBpLCB4OiBkM19pbnRlcnBvbGF0ZU51bWJlcihhbSwgYm0pfSk7XG4gICAgfVxuICAgIGJpID0gZDNfaW50ZXJwb2xhdGVfbnVtYmVyQi5sYXN0SW5kZXg7XG4gIH1cblxuICAvLyBBZGQgcmVtYWlucyBvZiBiLlxuICBpZiAoYmkgPCBiLmxlbmd0aCkge1xuICAgIGJzID0gYi5zbGljZShiaSk7XG4gICAgaWYgKHNbaV0pIHNbaV0gKz0gYnM7IC8vIGNvYWxlc2NlIHdpdGggcHJldmlvdXMgc3RyaW5nXG4gICAgZWxzZSBzWysraV0gPSBicztcbiAgfVxuXG4gIC8vIFNwZWNpYWwgb3B0aW1pemF0aW9uIGZvciBvbmx5IGEgc2luZ2xlIG1hdGNoLlxuICAvLyBPdGhlcndpc2UsIGludGVycG9sYXRlIGVhY2ggb2YgdGhlIG51bWJlcnMgYW5kIHJlam9pbiB0aGUgc3RyaW5nLlxuICByZXR1cm4gcy5sZW5ndGggPCAyXG4gICAgICA/IChxWzBdID8gKGIgPSBxWzBdLngsIGZ1bmN0aW9uKHQpIHsgcmV0dXJuIGIodCkgKyBcIlwiOyB9KVxuICAgICAgOiBmdW5jdGlvbigpIHsgcmV0dXJuIGI7IH0pXG4gICAgICA6IChiID0gcS5sZW5ndGgsIGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbzsgaSA8IGI7ICsraSkgc1sobyA9IHFbaV0pLmldID0gby54KHQpO1xuICAgICAgICAgIHJldHVybiBzLmpvaW4oXCJcIik7XG4gICAgICAgIH0pO1xufVxuXG52YXIgZDNfaW50ZXJwb2xhdGVfbnVtYmVyQSA9IC9bLStdPyg/OlxcZCtcXC4/XFxkKnxcXC4/XFxkKykoPzpbZUVdWy0rXT9cXGQrKT8vZyxcbiAgICBkM19pbnRlcnBvbGF0ZV9udW1iZXJCID0gbmV3IFJlZ0V4cChkM19pbnRlcnBvbGF0ZV9udW1iZXJBLnNvdXJjZSwgXCJnXCIpO1xuXG5kMy5pbnRlcnBvbGF0ZSA9IGQzX2ludGVycG9sYXRlO1xuXG5mdW5jdGlvbiBkM19pbnRlcnBvbGF0ZShhLCBiKSB7XG4gIHZhciBpID0gZDMuaW50ZXJwb2xhdG9ycy5sZW5ndGgsIGY7XG4gIHdoaWxlICgtLWkgPj0gMCAmJiAhKGYgPSBkMy5pbnRlcnBvbGF0b3JzW2ldKGEsIGIpKSk7XG4gIHJldHVybiBmO1xufVxuXG5kMy5pbnRlcnBvbGF0b3JzID0gW1xuICBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHQgPSB0eXBlb2YgYjtcbiAgICByZXR1cm4gKHQgPT09IFwic3RyaW5nXCIgPyAoZDNfcmdiX25hbWVzLmhhcyhiKSB8fCAvXigjfHJnYlxcKHxoc2xcXCgpLy50ZXN0KGIpID8gZDNfaW50ZXJwb2xhdGVSZ2IgOiBkM19pbnRlcnBvbGF0ZVN0cmluZylcbiAgICAgICAgOiBiIGluc3RhbmNlb2YgZDNfY29sb3IgPyBkM19pbnRlcnBvbGF0ZVJnYlxuICAgICAgICA6IEFycmF5LmlzQXJyYXkoYikgPyBkM19pbnRlcnBvbGF0ZUFycmF5XG4gICAgICAgIDogdCA9PT0gXCJvYmplY3RcIiAmJiBpc05hTihiKSA/IGQzX2ludGVycG9sYXRlT2JqZWN0XG4gICAgICAgIDogZDNfaW50ZXJwb2xhdGVOdW1iZXIpKGEsIGIpO1xuICB9XG5dO1xuZDMuaW50ZXJwb2xhdGVSb3VuZCA9IGQzX2ludGVycG9sYXRlUm91bmQ7XG5cbmZ1bmN0aW9uIGQzX2ludGVycG9sYXRlUm91bmQoYSwgYikge1xuICBiIC09IGE7XG4gIHJldHVybiBmdW5jdGlvbih0KSB7IHJldHVybiBNYXRoLnJvdW5kKGEgKyBiICogdCk7IH07XG59XG5mdW5jdGlvbiBkM191bmludGVycG9sYXRlTnVtYmVyKGEsIGIpIHtcbiAgYiA9IChiIC09IGEgPSArYSkgfHwgMSAvIGI7XG4gIHJldHVybiBmdW5jdGlvbih4KSB7IHJldHVybiAoeCAtIGEpIC8gYjsgfTtcbn1cblxuZnVuY3Rpb24gZDNfdW5pbnRlcnBvbGF0ZUNsYW1wKGEsIGIpIHtcbiAgYiA9IChiIC09IGEgPSArYSkgfHwgMSAvIGI7XG4gIHJldHVybiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAoeCAtIGEpIC8gYikpOyB9O1xufVxuXG5kMy5mb3JtYXQgPSBkM19sb2NhbGVfZW5VUy5udW1iZXJGb3JtYXQ7XG5mdW5jdGlvbiBkM19zY2FsZV9iaWxpbmVhcihkb21haW4sIHJhbmdlLCB1bmludGVycG9sYXRlLCBpbnRlcnBvbGF0ZSkge1xuICB2YXIgdSA9IHVuaW50ZXJwb2xhdGUoZG9tYWluWzBdLCBkb21haW5bMV0pLFxuICAgICAgaSA9IGludGVycG9sYXRlKHJhbmdlWzBdLCByYW5nZVsxXSk7XG4gIHJldHVybiBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIGkodSh4KSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGQzX3NjYWxlX25pY2UoZG9tYWluLCBuaWNlKSB7XG4gIHZhciBpMCA9IDAsXG4gICAgICBpMSA9IGRvbWFpbi5sZW5ndGggLSAxLFxuICAgICAgeDAgPSBkb21haW5baTBdLFxuICAgICAgeDEgPSBkb21haW5baTFdLFxuICAgICAgZHg7XG5cbiAgaWYgKHgxIDwgeDApIHtcbiAgICBkeCA9IGkwLCBpMCA9IGkxLCBpMSA9IGR4O1xuICAgIGR4ID0geDAsIHgwID0geDEsIHgxID0gZHg7XG4gIH1cblxuICBkb21haW5baTBdID0gbmljZS5mbG9vcih4MCk7XG4gIGRvbWFpbltpMV0gPSBuaWNlLmNlaWwoeDEpO1xuICByZXR1cm4gZG9tYWluO1xufVxuXG5mdW5jdGlvbiBkM19zY2FsZV9uaWNlU3RlcChzdGVwKSB7XG4gIHJldHVybiBzdGVwID8ge1xuICAgIGZsb29yOiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLmZsb29yKHggLyBzdGVwKSAqIHN0ZXA7IH0sXG4gICAgY2VpbDogZnVuY3Rpb24oeCkgeyByZXR1cm4gTWF0aC5jZWlsKHggLyBzdGVwKSAqIHN0ZXA7IH1cbiAgfSA6IGQzX3NjYWxlX25pY2VJZGVudGl0eTtcbn1cblxudmFyIGQzX3NjYWxlX25pY2VJZGVudGl0eSA9IHtcbiAgZmxvb3I6IGQzX2lkZW50aXR5LFxuICBjZWlsOiBkM19pZGVudGl0eVxufTtcblxuZnVuY3Rpb24gZDNfc2NhbGVfcG9seWxpbmVhcihkb21haW4sIHJhbmdlLCB1bmludGVycG9sYXRlLCBpbnRlcnBvbGF0ZSkge1xuICB2YXIgdSA9IFtdLFxuICAgICAgaSA9IFtdLFxuICAgICAgaiA9IDAsXG4gICAgICBrID0gTWF0aC5taW4oZG9tYWluLmxlbmd0aCwgcmFuZ2UubGVuZ3RoKSAtIDE7XG5cbiAgLy8gSGFuZGxlIGRlc2NlbmRpbmcgZG9tYWlucy5cbiAgaWYgKGRvbWFpbltrXSA8IGRvbWFpblswXSkge1xuICAgIGRvbWFpbiA9IGRvbWFpbi5zbGljZSgpLnJldmVyc2UoKTtcbiAgICByYW5nZSA9IHJhbmdlLnNsaWNlKCkucmV2ZXJzZSgpO1xuICB9XG5cbiAgd2hpbGUgKCsraiA8PSBrKSB7XG4gICAgdS5wdXNoKHVuaW50ZXJwb2xhdGUoZG9tYWluW2ogLSAxXSwgZG9tYWluW2pdKSk7XG4gICAgaS5wdXNoKGludGVycG9sYXRlKHJhbmdlW2ogLSAxXSwgcmFuZ2Vbal0pKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbih4KSB7XG4gICAgdmFyIGogPSBkMy5iaXNlY3QoZG9tYWluLCB4LCAxLCBrKSAtIDE7XG4gICAgcmV0dXJuIGlbal0odVtqXSh4KSk7XG4gIH07XG59XG5kMy5zY2FsZSA9IHt9O1xuXG5mdW5jdGlvbiBkM19zY2FsZUV4dGVudChkb21haW4pIHtcbiAgdmFyIHN0YXJ0ID0gZG9tYWluWzBdLCBzdG9wID0gZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIHN0YXJ0IDwgc3RvcCA/IFtzdGFydCwgc3RvcF0gOiBbc3RvcCwgc3RhcnRdO1xufVxuXG5mdW5jdGlvbiBkM19zY2FsZVJhbmdlKHNjYWxlKSB7XG4gIHJldHVybiBzY2FsZS5yYW5nZUV4dGVudCA/IHNjYWxlLnJhbmdlRXh0ZW50KCkgOiBkM19zY2FsZUV4dGVudChzY2FsZS5yYW5nZSgpKTtcbn1cblxuZDMuc2NhbGUubGluZWFyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBkM19zY2FsZV9saW5lYXIoWzAsIDFdLCBbMCwgMV0sIGQzX2ludGVycG9sYXRlLCBmYWxzZSk7XG59O1xuXG5mdW5jdGlvbiBkM19zY2FsZV9saW5lYXIoZG9tYWluLCByYW5nZSwgaW50ZXJwb2xhdGUsIGNsYW1wKSB7XG4gIHZhciBvdXRwdXQsXG4gICAgICBpbnB1dDtcblxuICBmdW5jdGlvbiByZXNjYWxlKCkge1xuICAgIHZhciBsaW5lYXIgPSBNYXRoLm1pbihkb21haW4ubGVuZ3RoLCByYW5nZS5sZW5ndGgpID4gMiA/IGQzX3NjYWxlX3BvbHlsaW5lYXIgOiBkM19zY2FsZV9iaWxpbmVhcixcbiAgICAgICAgdW5pbnRlcnBvbGF0ZSA9IGNsYW1wID8gZDNfdW5pbnRlcnBvbGF0ZUNsYW1wIDogZDNfdW5pbnRlcnBvbGF0ZU51bWJlcjtcbiAgICBvdXRwdXQgPSBsaW5lYXIoZG9tYWluLCByYW5nZSwgdW5pbnRlcnBvbGF0ZSwgaW50ZXJwb2xhdGUpO1xuICAgIGlucHV0ID0gbGluZWFyKHJhbmdlLCBkb21haW4sIHVuaW50ZXJwb2xhdGUsIGQzX2ludGVycG9sYXRlKTtcbiAgICByZXR1cm4gc2NhbGU7XG4gIH1cblxuICBmdW5jdGlvbiBzY2FsZSh4KSB7XG4gICAgcmV0dXJuIG91dHB1dCh4KTtcbiAgfVxuXG4gIC8vIE5vdGU6IHJlcXVpcmVzIHJhbmdlIGlzIGNvZXJjaWJsZSB0byBudW1iZXIhXG4gIHNjYWxlLmludmVydCA9IGZ1bmN0aW9uKHkpIHtcbiAgICByZXR1cm4gaW5wdXQoeSk7XG4gIH07XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRvbWFpbjtcbiAgICBkb21haW4gPSB4Lm1hcChOdW1iZXIpO1xuICAgIHJldHVybiByZXNjYWxlKCk7XG4gIH07XG5cbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcmFuZ2U7XG4gICAgcmFuZ2UgPSB4O1xuICAgIHJldHVybiByZXNjYWxlKCk7XG4gIH07XG5cbiAgc2NhbGUucmFuZ2VSb3VuZCA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gc2NhbGUucmFuZ2UoeCkuaW50ZXJwb2xhdGUoZDNfaW50ZXJwb2xhdGVSb3VuZCk7XG4gIH07XG5cbiAgc2NhbGUuY2xhbXAgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY2xhbXA7XG4gICAgY2xhbXAgPSB4O1xuICAgIHJldHVybiByZXNjYWxlKCk7XG4gIH07XG5cbiAgc2NhbGUuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gaW50ZXJwb2xhdGU7XG4gICAgaW50ZXJwb2xhdGUgPSB4O1xuICAgIHJldHVybiByZXNjYWxlKCk7XG4gIH07XG5cbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbihtKSB7XG4gICAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclRpY2tzKGRvbWFpbiwgbSk7XG4gIH07XG5cbiAgc2NhbGUudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKG0sIGZvcm1hdCkge1xuICAgIHJldHVybiBkM19zY2FsZV9saW5lYXJUaWNrRm9ybWF0KGRvbWFpbiwgbSwgZm9ybWF0KTtcbiAgfTtcblxuICBzY2FsZS5uaWNlID0gZnVuY3Rpb24obSkge1xuICAgIGQzX3NjYWxlX2xpbmVhck5pY2UoZG9tYWluLCBtKTtcbiAgICByZXR1cm4gcmVzY2FsZSgpO1xuICB9O1xuXG4gIHNjYWxlLmNvcHkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfbGluZWFyKGRvbWFpbiwgcmFuZ2UsIGludGVycG9sYXRlLCBjbGFtcCk7XG4gIH07XG5cbiAgcmV0dXJuIHJlc2NhbGUoKTtcbn1cblxuZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyUmViaW5kKHNjYWxlLCBsaW5lYXIpIHtcbiAgcmV0dXJuIGQzLnJlYmluZChzY2FsZSwgbGluZWFyLCBcInJhbmdlXCIsIFwicmFuZ2VSb3VuZFwiLCBcImludGVycG9sYXRlXCIsIFwiY2xhbXBcIik7XG59XG5cbmZ1bmN0aW9uIGQzX3NjYWxlX2xpbmVhck5pY2UoZG9tYWluLCBtKSB7XG4gIHJldHVybiBkM19zY2FsZV9uaWNlKGRvbWFpbiwgZDNfc2NhbGVfbmljZVN0ZXAoZDNfc2NhbGVfbGluZWFyVGlja1JhbmdlKGRvbWFpbiwgbSlbMl0pKTtcbn1cblxuZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyVGlja1JhbmdlKGRvbWFpbiwgbSkge1xuICBpZiAobSA9PSBudWxsKSBtID0gMTA7XG5cbiAgdmFyIGV4dGVudCA9IGQzX3NjYWxlRXh0ZW50KGRvbWFpbiksXG4gICAgICBzcGFuID0gZXh0ZW50WzFdIC0gZXh0ZW50WzBdLFxuICAgICAgc3RlcCA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHNwYW4gLyBtKSAvIE1hdGguTE4xMCkpLFxuICAgICAgZXJyID0gbSAvIHNwYW4gKiBzdGVwO1xuXG4gIC8vIEZpbHRlciB0aWNrcyB0byBnZXQgY2xvc2VyIHRvIHRoZSBkZXNpcmVkIGNvdW50LlxuICBpZiAoZXJyIDw9IC4xNSkgc3RlcCAqPSAxMDtcbiAgZWxzZSBpZiAoZXJyIDw9IC4zNSkgc3RlcCAqPSA1O1xuICBlbHNlIGlmIChlcnIgPD0gLjc1KSBzdGVwICo9IDI7XG5cbiAgLy8gUm91bmQgc3RhcnQgYW5kIHN0b3AgdmFsdWVzIHRvIHN0ZXAgaW50ZXJ2YWwuXG4gIGV4dGVudFswXSA9IE1hdGguY2VpbChleHRlbnRbMF0gLyBzdGVwKSAqIHN0ZXA7XG4gIGV4dGVudFsxXSA9IE1hdGguZmxvb3IoZXh0ZW50WzFdIC8gc3RlcCkgKiBzdGVwICsgc3RlcCAqIC41OyAvLyBpbmNsdXNpdmVcbiAgZXh0ZW50WzJdID0gc3RlcDtcbiAgcmV0dXJuIGV4dGVudDtcbn1cblxuZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyVGlja3MoZG9tYWluLCBtKSB7XG4gIHJldHVybiBkMy5yYW5nZS5hcHBseShkMywgZDNfc2NhbGVfbGluZWFyVGlja1JhbmdlKGRvbWFpbiwgbSkpO1xufVxuXG5mdW5jdGlvbiBkM19zY2FsZV9saW5lYXJUaWNrRm9ybWF0KGRvbWFpbiwgbSwgZm9ybWF0KSB7XG4gIHZhciByYW5nZSA9IGQzX3NjYWxlX2xpbmVhclRpY2tSYW5nZShkb21haW4sIG0pO1xuICBpZiAoZm9ybWF0KSB7XG4gICAgdmFyIG1hdGNoID0gZDNfZm9ybWF0X3JlLmV4ZWMoZm9ybWF0KTtcbiAgICBtYXRjaC5zaGlmdCgpO1xuICAgIGlmIChtYXRjaFs4XSA9PT0gXCJzXCIpIHtcbiAgICAgIHZhciBwcmVmaXggPSBkMy5mb3JtYXRQcmVmaXgoTWF0aC5tYXgoYWJzKHJhbmdlWzBdKSwgYWJzKHJhbmdlWzFdKSkpO1xuICAgICAgaWYgKCFtYXRjaFs3XSkgbWF0Y2hbN10gPSBcIi5cIiArIGQzX3NjYWxlX2xpbmVhclByZWNpc2lvbihwcmVmaXguc2NhbGUocmFuZ2VbMl0pKTtcbiAgICAgIG1hdGNoWzhdID0gXCJmXCI7XG4gICAgICBmb3JtYXQgPSBkMy5mb3JtYXQobWF0Y2guam9pbihcIlwiKSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZm9ybWF0KHByZWZpeC5zY2FsZShkKSkgKyBwcmVmaXguc3ltYm9sO1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKCFtYXRjaFs3XSkgbWF0Y2hbN10gPSBcIi5cIiArIGQzX3NjYWxlX2xpbmVhckZvcm1hdFByZWNpc2lvbihtYXRjaFs4XSwgcmFuZ2UpO1xuICAgIGZvcm1hdCA9IG1hdGNoLmpvaW4oXCJcIik7XG4gIH0gZWxzZSB7XG4gICAgZm9ybWF0ID0gXCIsLlwiICsgZDNfc2NhbGVfbGluZWFyUHJlY2lzaW9uKHJhbmdlWzJdKSArIFwiZlwiO1xuICB9XG4gIHJldHVybiBkMy5mb3JtYXQoZm9ybWF0KTtcbn1cblxudmFyIGQzX3NjYWxlX2xpbmVhckZvcm1hdFNpZ25pZmljYW50ID0ge3M6IDEsIGc6IDEsIHA6IDEsIHI6IDEsIGU6IDF9O1xuXG4vLyBSZXR1cm5zIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIGFmdGVyIHRoZSBkZWNpbWFsIHBvaW50LlxuZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyUHJlY2lzaW9uKHZhbHVlKSB7XG4gIHJldHVybiAtTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMTAgKyAuMDEpO1xufVxuXG4vLyBGb3Igc29tZSBmb3JtYXQgdHlwZXMsIHRoZSBwcmVjaXNpb24gc3BlY2lmaWVzIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnRcbi8vIGRpZ2l0czsgZm9yIG90aGVycywgaXQgc3BlY2lmaWVzIHRoZSBudW1iZXIgb2YgZGlnaXRzIGFmdGVyIHRoZSBkZWNpbWFsXG4vLyBwb2ludC4gRm9yIHNpZ25pZmljYW50IGZvcm1hdCB0eXBlcywgdGhlIGRlc2lyZWQgcHJlY2lzaW9uIGVxdWFscyBvbmUgcGx1c1xuLy8gdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgZGVjaW1hbCBwcmVjaXNpb24gb2YgdGhlIHJhbmdl4oCZcyBtYXhpbXVtIGFic29sdXRlXG4vLyB2YWx1ZSBhbmQgdGhlIHRpY2sgc3RlcOKAmXMgZGVjaW1hbCBwcmVjaXNpb24uIEZvciBmb3JtYXQgXCJlXCIsIHRoZSBkaWdpdCBiZWZvcmVcbi8vIHRoZSBkZWNpbWFsIHBvaW50IGNvdW50cyBhcyBvbmUuXG5mdW5jdGlvbiBkM19zY2FsZV9saW5lYXJGb3JtYXRQcmVjaXNpb24odHlwZSwgcmFuZ2UpIHtcbiAgdmFyIHAgPSBkM19zY2FsZV9saW5lYXJQcmVjaXNpb24ocmFuZ2VbMl0pO1xuICByZXR1cm4gdHlwZSBpbiBkM19zY2FsZV9saW5lYXJGb3JtYXRTaWduaWZpY2FudFxuICAgICAgPyBNYXRoLmFicyhwIC0gZDNfc2NhbGVfbGluZWFyUHJlY2lzaW9uKE1hdGgubWF4KGFicyhyYW5nZVswXSksIGFicyhyYW5nZVsxXSkpKSkgKyArKHR5cGUgIT09IFwiZVwiKVxuICAgICAgOiBwIC0gKHR5cGUgPT09IFwiJVwiKSAqIDI7XG59XG5cbmZ1bmN0aW9uIGQzX3RpbWVfc2NhbGUobGluZWFyLCBtZXRob2RzLCBmb3JtYXQpIHtcblxuICBmdW5jdGlvbiBzY2FsZSh4KSB7XG4gICAgcmV0dXJuIGxpbmVhcih4KTtcbiAgfVxuXG4gIHNjYWxlLmludmVydCA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gZDNfdGltZV9zY2FsZURhdGUobGluZWFyLmludmVydCh4KSk7XG4gIH07XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxpbmVhci5kb21haW4oKS5tYXAoZDNfdGltZV9zY2FsZURhdGUpO1xuICAgIGxpbmVhci5kb21haW4oeCk7XG4gICAgcmV0dXJuIHNjYWxlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHRpY2tNZXRob2QoZXh0ZW50LCBjb3VudCkge1xuICAgIHZhciBzcGFuID0gZXh0ZW50WzFdIC0gZXh0ZW50WzBdLFxuICAgICAgICB0YXJnZXQgPSBzcGFuIC8gY291bnQsXG4gICAgICAgIGkgPSBkMy5iaXNlY3QoZDNfdGltZV9zY2FsZVN0ZXBzLCB0YXJnZXQpO1xuICAgIHJldHVybiBpID09IGQzX3RpbWVfc2NhbGVTdGVwcy5sZW5ndGggPyBbbWV0aG9kcy55ZWFyLCBkM19zY2FsZV9saW5lYXJUaWNrUmFuZ2UoZXh0ZW50Lm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkIC8gMzE1MzZlNjsgfSksIGNvdW50KVsyXV1cbiAgICAgICAgOiAhaSA/IFtkM190aW1lX3NjYWxlTWlsbGlzZWNvbmRzLCBkM19zY2FsZV9saW5lYXJUaWNrUmFuZ2UoZXh0ZW50LCBjb3VudClbMl1dXG4gICAgICAgIDogbWV0aG9kc1t0YXJnZXQgLyBkM190aW1lX3NjYWxlU3RlcHNbaSAtIDFdIDwgZDNfdGltZV9zY2FsZVN0ZXBzW2ldIC8gdGFyZ2V0ID8gaSAtIDEgOiBpXTtcbiAgfVxuXG4gIHNjYWxlLm5pY2UgPSBmdW5jdGlvbihpbnRlcnZhbCwgc2tpcCkge1xuICAgIHZhciBkb21haW4gPSBzY2FsZS5kb21haW4oKSxcbiAgICAgICAgZXh0ZW50ID0gZDNfc2NhbGVFeHRlbnQoZG9tYWluKSxcbiAgICAgICAgbWV0aG9kID0gaW50ZXJ2YWwgPT0gbnVsbCA/IHRpY2tNZXRob2QoZXh0ZW50LCAxMClcbiAgICAgICAgICA6IHR5cGVvZiBpbnRlcnZhbCA9PT0gXCJudW1iZXJcIiAmJiB0aWNrTWV0aG9kKGV4dGVudCwgaW50ZXJ2YWwpO1xuXG4gICAgaWYgKG1ldGhvZCkgaW50ZXJ2YWwgPSBtZXRob2RbMF0sIHNraXAgPSBtZXRob2RbMV07XG5cbiAgICBmdW5jdGlvbiBza2lwcGVkKGRhdGUpIHtcbiAgICAgIHJldHVybiAhaXNOYU4oZGF0ZSkgJiYgIWludGVydmFsLnJhbmdlKGRhdGUsIGQzX3RpbWVfc2NhbGVEYXRlKCtkYXRlICsgMSksIHNraXApLmxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gc2NhbGUuZG9tYWluKGQzX3NjYWxlX25pY2UoZG9tYWluLCBza2lwID4gMSA/IHtcbiAgICAgIGZsb29yOiBmdW5jdGlvbihkYXRlKSB7XG4gICAgICAgIHdoaWxlIChza2lwcGVkKGRhdGUgPSBpbnRlcnZhbC5mbG9vcihkYXRlKSkpIGRhdGUgPSBkM190aW1lX3NjYWxlRGF0ZShkYXRlIC0gMSk7XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgICAgfSxcbiAgICAgIGNlaWw6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgd2hpbGUgKHNraXBwZWQoZGF0ZSA9IGludGVydmFsLmNlaWwoZGF0ZSkpKSBkYXRlID0gZDNfdGltZV9zY2FsZURhdGUoK2RhdGUgKyAxKTtcbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgICB9XG4gICAgfSA6IGludGVydmFsKSk7XG4gIH07XG5cbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbihpbnRlcnZhbCwgc2tpcCkge1xuICAgIHZhciBleHRlbnQgPSBkM19zY2FsZUV4dGVudChzY2FsZS5kb21haW4oKSksXG4gICAgICAgIG1ldGhvZCA9IGludGVydmFsID09IG51bGwgPyB0aWNrTWV0aG9kKGV4dGVudCwgMTApXG4gICAgICAgICAgOiB0eXBlb2YgaW50ZXJ2YWwgPT09IFwibnVtYmVyXCIgPyB0aWNrTWV0aG9kKGV4dGVudCwgaW50ZXJ2YWwpXG4gICAgICAgICAgOiAhaW50ZXJ2YWwucmFuZ2UgJiYgW3tyYW5nZTogaW50ZXJ2YWx9LCBza2lwXTsgLy8gYXNzdW1lIGRlcHJlY2F0ZWQgcmFuZ2UgZnVuY3Rpb25cblxuICAgIGlmIChtZXRob2QpIGludGVydmFsID0gbWV0aG9kWzBdLCBza2lwID0gbWV0aG9kWzFdO1xuXG4gICAgcmV0dXJuIGludGVydmFsLnJhbmdlKGV4dGVudFswXSwgZDNfdGltZV9zY2FsZURhdGUoK2V4dGVudFsxXSArIDEpLCBza2lwIDwgMSA/IDEgOiBza2lwKTsgLy8gaW5jbHVzaXZlIHVwcGVyIGJvdW5kXG4gIH07XG5cbiAgc2NhbGUudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmb3JtYXQ7XG4gIH07XG5cbiAgc2NhbGUuY29weSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM190aW1lX3NjYWxlKGxpbmVhci5jb3B5KCksIG1ldGhvZHMsIGZvcm1hdCk7XG4gIH07XG5cbiAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclJlYmluZChzY2FsZSwgbGluZWFyKTtcbn1cblxuZnVuY3Rpb24gZDNfdGltZV9zY2FsZURhdGUodCkge1xuICByZXR1cm4gbmV3IERhdGUodCk7XG59XG5cbnZhciBkM190aW1lX3NjYWxlU3RlcHMgPSBbXG4gIDFlMywgICAgLy8gMS1zZWNvbmRcbiAgNWUzLCAgICAvLyA1LXNlY29uZFxuICAxNWUzLCAgIC8vIDE1LXNlY29uZFxuICAzZTQsICAgIC8vIDMwLXNlY29uZFxuICA2ZTQsICAgIC8vIDEtbWludXRlXG4gIDNlNSwgICAgLy8gNS1taW51dGVcbiAgOWU1LCAgICAvLyAxNS1taW51dGVcbiAgMThlNSwgICAvLyAzMC1taW51dGVcbiAgMzZlNSwgICAvLyAxLWhvdXJcbiAgMTA4ZTUsICAvLyAzLWhvdXJcbiAgMjE2ZTUsICAvLyA2LWhvdXJcbiAgNDMyZTUsICAvLyAxMi1ob3VyXG4gIDg2NGU1LCAgLy8gMS1kYXlcbiAgMTcyOGU1LCAvLyAyLWRheVxuICA2MDQ4ZTUsIC8vIDEtd2Vla1xuICAyNTkyZTYsIC8vIDEtbW9udGhcbiAgNzc3NmU2LCAvLyAzLW1vbnRoXG4gIDMxNTM2ZTYgLy8gMS15ZWFyXG5dO1xuXG52YXIgZDNfdGltZV9zY2FsZUxvY2FsTWV0aG9kcyA9IFtcbiAgW2QzX3RpbWUuc2Vjb25kLCAxXSxcbiAgW2QzX3RpbWUuc2Vjb25kLCA1XSxcbiAgW2QzX3RpbWUuc2Vjb25kLCAxNV0sXG4gIFtkM190aW1lLnNlY29uZCwgMzBdLFxuICBbZDNfdGltZS5taW51dGUsIDFdLFxuICBbZDNfdGltZS5taW51dGUsIDVdLFxuICBbZDNfdGltZS5taW51dGUsIDE1XSxcbiAgW2QzX3RpbWUubWludXRlLCAzMF0sXG4gIFtkM190aW1lLmhvdXIsIDFdLFxuICBbZDNfdGltZS5ob3VyLCAzXSxcbiAgW2QzX3RpbWUuaG91ciwgNl0sXG4gIFtkM190aW1lLmhvdXIsIDEyXSxcbiAgW2QzX3RpbWUuZGF5LCAxXSxcbiAgW2QzX3RpbWUuZGF5LCAyXSxcbiAgW2QzX3RpbWUud2VlaywgMV0sXG4gIFtkM190aW1lLm1vbnRoLCAxXSxcbiAgW2QzX3RpbWUubW9udGgsIDNdLFxuICBbZDNfdGltZS55ZWFyLCAxXVxuXTtcblxudmFyIGQzX3RpbWVfc2NhbGVMb2NhbEZvcm1hdCA9IGQzX3RpbWVfZm9ybWF0Lm11bHRpKFtcbiAgW1wiLiVMXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0TWlsbGlzZWNvbmRzKCk7IH1dLFxuICBbXCI6JVNcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXRTZWNvbmRzKCk7IH1dLFxuICBbXCIlSTolTVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldE1pbnV0ZXMoKTsgfV0sXG4gIFtcIiVJICVwXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0SG91cnMoKTsgfV0sXG4gIFtcIiVhICVkXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0RGF5KCkgJiYgZC5nZXREYXRlKCkgIT0gMTsgfV0sXG4gIFtcIiViICVkXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0RGF0ZSgpICE9IDE7IH1dLFxuICBbXCIlQlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldE1vbnRoKCk7IH1dLFxuICBbXCIlWVwiLCBkM190cnVlXVxuXSk7XG5cbnZhciBkM190aW1lX3NjYWxlTWlsbGlzZWNvbmRzID0ge1xuICByYW5nZTogZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHsgcmV0dXJuIGQzLnJhbmdlKE1hdGguY2VpbChzdGFydCAvIHN0ZXApICogc3RlcCwgK3N0b3AsIHN0ZXApLm1hcChkM190aW1lX3NjYWxlRGF0ZSk7IH0sXG4gIGZsb29yOiBkM19pZGVudGl0eSxcbiAgY2VpbDogZDNfaWRlbnRpdHlcbn07XG5cbmQzX3RpbWVfc2NhbGVMb2NhbE1ldGhvZHMueWVhciA9IGQzX3RpbWUueWVhcjtcblxuZDNfdGltZS5zY2FsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZDNfdGltZV9zY2FsZShkMy5zY2FsZS5saW5lYXIoKSwgZDNfdGltZV9zY2FsZUxvY2FsTWV0aG9kcywgZDNfdGltZV9zY2FsZUxvY2FsRm9ybWF0KTtcbn07XG5cbnZhciBkM190aW1lX3NjYWxlVXRjTWV0aG9kcyA9IGQzX3RpbWVfc2NhbGVMb2NhbE1ldGhvZHMubWFwKGZ1bmN0aW9uKG0pIHtcbiAgcmV0dXJuIFttWzBdLnV0YywgbVsxXV07XG59KTtcblxudmFyIGQzX3RpbWVfc2NhbGVVdGNGb3JtYXQgPSBkM190aW1lX2Zvcm1hdFV0Yy5tdWx0aShbXG4gIFtcIi4lTFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldFVUQ01pbGxpc2Vjb25kcygpOyB9XSxcbiAgW1wiOiVTXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0VVRDU2Vjb25kcygpOyB9XSxcbiAgW1wiJUk6JU1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXRVVENNaW51dGVzKCk7IH1dLFxuICBbXCIlSSAlcFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldFVUQ0hvdXJzKCk7IH1dLFxuICBbXCIlYSAlZFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldFVUQ0RheSgpICYmIGQuZ2V0VVRDRGF0ZSgpICE9IDE7IH1dLFxuICBbXCIlYiAlZFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldFVUQ0RhdGUoKSAhPSAxOyB9XSxcbiAgW1wiJUJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXRVVENNb250aCgpOyB9XSxcbiAgW1wiJVlcIiwgZDNfdHJ1ZV1cbl0pO1xuXG5kM190aW1lX3NjYWxlVXRjTWV0aG9kcy55ZWFyID0gZDNfdGltZS55ZWFyLnV0YztcblxuZDNfdGltZS5zY2FsZS51dGMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGQzX3RpbWVfc2NhbGUoZDMuc2NhbGUubGluZWFyKCksIGQzX3RpbWVfc2NhbGVVdGNNZXRob2RzLCBkM190aW1lX3NjYWxlVXRjRm9ybWF0KTtcbn07XG5cbmQzLnhociA9IGQzX3hoclR5cGUoZDNfaWRlbnRpdHkpO1xuXG5mdW5jdGlvbiBkM194aHJUeXBlKHJlc3BvbnNlKSB7XG4gIHJldHVybiBmdW5jdGlvbih1cmwsIG1pbWVUeXBlLCBjYWxsYmFjaykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyICYmIHR5cGVvZiBtaW1lVHlwZSA9PT0gXCJmdW5jdGlvblwiKSBjYWxsYmFjayA9IG1pbWVUeXBlLCBtaW1lVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIGQzX3hocih1cmwsIG1pbWVUeXBlLCByZXNwb25zZSwgY2FsbGJhY2spO1xuICB9O1xufVxuXG5mdW5jdGlvbiBkM194aHIodXJsLCBtaW1lVHlwZSwgcmVzcG9uc2UsIGNhbGxiYWNrKSB7XG4gIHZhciB4aHIgPSB7fSxcbiAgICAgIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJiZWZvcmVzZW5kXCIsIFwicHJvZ3Jlc3NcIiwgXCJsb2FkXCIsIFwiZXJyb3JcIiksXG4gICAgICBoZWFkZXJzID0ge30sXG4gICAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0LFxuICAgICAgcmVzcG9uc2VUeXBlID0gbnVsbDtcblxuICAvLyBJZiBJRSBkb2VzIG5vdCBzdXBwb3J0IENPUlMsIHVzZSBYRG9tYWluUmVxdWVzdC5cbiAgaWYgKGQzX3dpbmRvdy5YRG9tYWluUmVxdWVzdFxuICAgICAgJiYgIShcIndpdGhDcmVkZW50aWFsc1wiIGluIHJlcXVlc3QpXG4gICAgICAmJiAvXihodHRwKHMpPzopP1xcL1xcLy8udGVzdCh1cmwpKSByZXF1ZXN0ID0gbmV3IFhEb21haW5SZXF1ZXN0O1xuXG4gIFwib25sb2FkXCIgaW4gcmVxdWVzdFxuICAgICAgPyByZXF1ZXN0Lm9ubG9hZCA9IHJlcXVlc3Qub25lcnJvciA9IHJlc3BvbmRcbiAgICAgIDogcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHsgcmVxdWVzdC5yZWFkeVN0YXRlID4gMyAmJiByZXNwb25kKCk7IH07XG5cbiAgZnVuY3Rpb24gcmVzcG9uZCgpIHtcbiAgICB2YXIgc3RhdHVzID0gcmVxdWVzdC5zdGF0dXMsIHJlc3VsdDtcbiAgICBpZiAoIXN0YXR1cyAmJiBkM194aHJIYXNSZXNwb25zZShyZXF1ZXN0KSB8fCBzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCB8fCBzdGF0dXMgPT09IDMwNCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gcmVzcG9uc2UuY2FsbCh4aHIsIHJlcXVlc3QpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBkaXNwYXRjaC5lcnJvci5jYWxsKHhociwgZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRpc3BhdGNoLmxvYWQuY2FsbCh4aHIsIHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpc3BhdGNoLmVycm9yLmNhbGwoeGhyLCByZXF1ZXN0KTtcbiAgICB9XG4gIH1cblxuICByZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBvID0gZDMuZXZlbnQ7XG4gICAgZDMuZXZlbnQgPSBldmVudDtcbiAgICB0cnkgeyBkaXNwYXRjaC5wcm9ncmVzcy5jYWxsKHhociwgcmVxdWVzdCk7IH1cbiAgICBmaW5hbGx5IHsgZDMuZXZlbnQgPSBvOyB9XG4gIH07XG5cbiAgeGhyLmhlYWRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgbmFtZSA9IChuYW1lICsgXCJcIikudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHJldHVybiBoZWFkZXJzW25hbWVdO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSBkZWxldGUgaGVhZGVyc1tuYW1lXTtcbiAgICBlbHNlIGhlYWRlcnNbbmFtZV0gPSB2YWx1ZSArIFwiXCI7XG4gICAgcmV0dXJuIHhocjtcbiAgfTtcblxuICAvLyBJZiBtaW1lVHlwZSBpcyBub24tbnVsbCBhbmQgbm8gQWNjZXB0IGhlYWRlciBpcyBzZXQsIGEgZGVmYXVsdCBpcyB1c2VkLlxuICB4aHIubWltZVR5cGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG1pbWVUeXBlO1xuICAgIG1pbWVUeXBlID0gdmFsdWUgPT0gbnVsbCA/IG51bGwgOiB2YWx1ZSArIFwiXCI7XG4gICAgcmV0dXJuIHhocjtcbiAgfTtcblxuICAvLyBTcGVjaWZpZXMgd2hhdCB0eXBlIHRoZSByZXNwb25zZSB2YWx1ZSBzaG91bGQgdGFrZTtcbiAgLy8gZm9yIGluc3RhbmNlLCBhcnJheWJ1ZmZlciwgYmxvYiwgZG9jdW1lbnQsIG9yIHRleHQuXG4gIHhoci5yZXNwb25zZVR5cGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHJlc3BvbnNlVHlwZTtcbiAgICByZXNwb25zZVR5cGUgPSB2YWx1ZTtcbiAgICByZXR1cm4geGhyO1xuICB9O1xuXG4gIC8vIFNwZWNpZnkgaG93IHRvIGNvbnZlcnQgdGhlIHJlc3BvbnNlIGNvbnRlbnQgdG8gYSBzcGVjaWZpYyB0eXBlO1xuICAvLyBjaGFuZ2VzIHRoZSBjYWxsYmFjayB2YWx1ZSBvbiBcImxvYWRcIiBldmVudHMuXG4gIHhoci5yZXNwb25zZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmVzcG9uc2UgPSB2YWx1ZTtcbiAgICByZXR1cm4geGhyO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIG1ldGhvZHMuXG4gIFtcImdldFwiLCBcInBvc3RcIl0uZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgICB4aHJbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHhoci5zZW5kLmFwcGx5KHhociwgW21ldGhvZF0uY29uY2F0KGQzX2FycmF5KGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiBjYWxsYmFjayBpcyBub24tbnVsbCwgaXQgd2lsbCBiZSB1c2VkIGZvciBlcnJvciBhbmQgbG9hZCBldmVudHMuXG4gIHhoci5zZW5kID0gZnVuY3Rpb24obWV0aG9kLCBkYXRhLCBjYWxsYmFjaykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyICYmIHR5cGVvZiBkYXRhID09PSBcImZ1bmN0aW9uXCIpIGNhbGxiYWNrID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gICAgcmVxdWVzdC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICBpZiAobWltZVR5cGUgIT0gbnVsbCAmJiAhKFwiYWNjZXB0XCIgaW4gaGVhZGVycykpIGhlYWRlcnNbXCJhY2NlcHRcIl0gPSBtaW1lVHlwZSArIFwiLCovKlwiO1xuICAgIGlmIChyZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIpIGZvciAodmFyIG5hbWUgaW4gaGVhZGVycykgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgIGlmIChtaW1lVHlwZSAhPSBudWxsICYmIHJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSkgcmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKG1pbWVUeXBlKTtcbiAgICBpZiAocmVzcG9uc2VUeXBlICE9IG51bGwpIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlO1xuICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSB4aHIub24oXCJlcnJvclwiLCBjYWxsYmFjaykub24oXCJsb2FkXCIsIGZ1bmN0aW9uKHJlcXVlc3QpIHsgY2FsbGJhY2sobnVsbCwgcmVxdWVzdCk7IH0pO1xuICAgIGRpc3BhdGNoLmJlZm9yZXNlbmQuY2FsbCh4aHIsIHJlcXVlc3QpO1xuICAgIHJlcXVlc3Quc2VuZChkYXRhID09IG51bGwgPyBudWxsIDogZGF0YSk7XG4gICAgcmV0dXJuIHhocjtcbiAgfTtcblxuICB4aHIuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXF1ZXN0LmFib3J0KCk7XG4gICAgcmV0dXJuIHhocjtcbiAgfTtcblxuICBkMy5yZWJpbmQoeGhyLCBkaXNwYXRjaCwgXCJvblwiKTtcblxuICByZXR1cm4gY2FsbGJhY2sgPT0gbnVsbCA/IHhociA6IHhoci5nZXQoZDNfeGhyX2ZpeENhbGxiYWNrKGNhbGxiYWNrKSk7XG59O1xuXG5mdW5jdGlvbiBkM194aHJfZml4Q2FsbGJhY2soY2FsbGJhY2spIHtcbiAgcmV0dXJuIGNhbGxiYWNrLmxlbmd0aCA9PT0gMVxuICAgICAgPyBmdW5jdGlvbihlcnJvciwgcmVxdWVzdCkgeyBjYWxsYmFjayhlcnJvciA9PSBudWxsID8gcmVxdWVzdCA6IG51bGwpOyB9XG4gICAgICA6IGNhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBkM194aHJIYXNSZXNwb25zZShyZXF1ZXN0KSB7XG4gIHZhciB0eXBlID0gcmVxdWVzdC5yZXNwb25zZVR5cGU7XG4gIHJldHVybiB0eXBlICYmIHR5cGUgIT09IFwidGV4dFwiXG4gICAgICA/IHJlcXVlc3QucmVzcG9uc2UgLy8gbnVsbCBvbiBlcnJvclxuICAgICAgOiByZXF1ZXN0LnJlc3BvbnNlVGV4dDsgLy8gXCJcIiBvbiBlcnJvclxufVxuXG5kMy50ZXh0ID0gZDNfeGhyVHlwZShmdW5jdGlvbihyZXF1ZXN0KSB7XG4gIHJldHVybiByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbn0pO1xuXG5kMy5qc29uID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICByZXR1cm4gZDNfeGhyKHVybCwgXCJhcHBsaWNhdGlvbi9qc29uXCIsIGQzX2pzb24sIGNhbGxiYWNrKTtcbn07XG5cbmZ1bmN0aW9uIGQzX2pzb24ocmVxdWVzdCkge1xuICByZXR1cm4gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG59XG5cbmQzLmh0bWwgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gIHJldHVybiBkM194aHIodXJsLCBcInRleHQvaHRtbFwiLCBkM19odG1sLCBjYWxsYmFjayk7XG59O1xuXG5mdW5jdGlvbiBkM19odG1sKHJlcXVlc3QpIHtcbiAgdmFyIHJhbmdlID0gZDNfZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgcmFuZ2Uuc2VsZWN0Tm9kZShkM19kb2N1bWVudC5ib2R5KTtcbiAgcmV0dXJuIHJhbmdlLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG59XG5cbmQzLnhtbCA9IGQzX3hoclR5cGUoZnVuY3Rpb24ocmVxdWVzdCkge1xuICByZXR1cm4gcmVxdWVzdC5yZXNwb25zZVhNTDtcbn0pO1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZShkMyk7XG4gIGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gZDM7XG4gIHRoaXMuZDMgPSBkMztcbn0oKTtcbmQzLmpzb25wID0gZnVuY3Rpb24gKHVybCwgY2FsbGJhY2spIHtcbiAgICBmdW5jdGlvbiByYW5kKCkge1xuICAgICAgICB2YXIgY2hhcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eic7XG4gICAgICAgIHZhciBjID0gJycsIGkgPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraSA8IDE1KSBjICs9IGNoYXJzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MikpO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlKHVybCkge1xuICAgICAgICB2YXIgZSA9IHVybC5tYXRjaCgvY2FsbGJhY2s9ZDMuanNvbnAuKFxcdyspLyk7XG4gICAgICAgIHZhciBjID0gZSA/IGVbMV0gOiByYW5kKCk7XG4gICAgICAgIGQzLmpzb25wW2NdID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgZDMuanNvbnBbY107XG4gICAgICAgICAgICBzY3JpcHQucmVtb3ZlKCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAnZDMuanNvbnAuJyArIGM7XG4gICAgfVxuXG4gICAgdmFyIGNiID0gY3JlYXRlKHVybCk7XG4gICAgdmFyIHNjcmlwdCA9IGQzLnNlbGVjdCgnaGVhZCcpXG4gICAgICAgIC5hcHBlbmQoJ3NjcmlwdCcpXG4gICAgICAgIC5hdHRyKCd0eXBlJywgJ3RleHQvamF2YXNjcmlwdCcpXG4gICAgICAgIC5hdHRyKCdzcmMnLCB1cmwucmVwbGFjZSgvKFxce3wlN0IpY2FsbGJhY2soXFx7fCU3RCkvLCBjYikpO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpIHtcbnJlcXVpcmUoJy4vanMvZDMnKTtcbnZhciBzZWFyY2ggPSByZXF1aXJlKCcuL3NyYy9zZWFyY2guanMnKTtcbnZhciByZW1vdmVEaWFjcml0aWNzID0gcmVxdWlyZSgnZGlhY3JpdGljcycpLnJlbW92ZTtcbnNlYXJjaC5wcmltZXRpdGxlcygnZGF0YS90aXRsZXMuanNvbicpO1xuXG52YXIgTENCTyAgPSAnaHR0cDovL3d3dy5sY2JvLmNvbS9sY2JvL3NlYXJjaD9zZWFyY2hUZXJtPSc7XG52YXIgVE9LRU4gPSAncGsuZXlKMUlqb2lkSEpwYzNSbGJpSXNJbUVpT2lKaVV6QllPRUp6SW4wLlZ5WHM5cU5XZ1RmQUJMelNJM1ljclEnO1xudmFyIE1BUElEID0gJ3RyaXN0ZW4uamZvb2EzajAnO1xuXG5MLm1hcGJveC5hY2Nlc3NUb2tlbiA9IFRPS0VOO1xudmFyICRzZWFyY2ggPSBkMy5zZWxlY3QoJyNzZWFyY2gnKTtcbnZhciAkYXV0b2NvbXBsZXRlID0gZDMuc2VsZWN0KCcjYXV0b2NvbXBsZXRlJyk7XG52YXIgJHJlc3VsdHMgPSBkMy5zZWxlY3QoJyNyZXN1bHRzJyk7XG52YXIgbWFwO1xuXG5mdW5jdGlvbiBidWlsZG1hcChzZWwsIGNhbGxiYWNrKSB7XG4gICAgaWYgKG1hcCkgbWFwLnJlbW92ZSgpO1xuICAgIGlmIChuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcbiAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgICAgICAgdmFyIGlkID0gc2VsLmF0dHIoJ2lkJykuc3BsaXQoJy0nKVsxXTtcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSBwb3NpdGlvbi5jb29yZHM7XG4gICAgICAgICAgICB2YXIgdXJsID0gJ2h0dHA6Ly9sY2JvYXBpLmNvbS9wcm9kdWN0cy8nICsgaWQgKyAnL3N0b3Jlcz9nZW89JyArXG4gICAgICAgICAgICAgICAgY29vcmRzLmxhdGl0dWRlICsgJysnICsgY29vcmRzLmxvbmdpdHVkZSArICcmcGVyX3BhZ2U9NSZjYWxsYmFjaz1kMy5qc29ucC5wcm9kdWN0cyc7XG5cbiAgICAgICAgICAgIGQzLmpzb25wKHVybCwgZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXMucmVzdWx0IHx8ICFyZXMucmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ05vIHN0b3JlIGxvY2F0aW9ucyBuZWFyIHlvdSBjYXJyeSBzdG9jay4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGdlb2pzb24gPSBidWlsZGdlb2pzb24ocmVzLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgbWFwID0gTC5tYXBib3gubWFwKCdtYXAtJyArIGlkLCBNQVBJRCwge1xuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbkNvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmZvQ29udHJvbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbnMgPSBMLm1hcGJveC5mZWF0dXJlTGF5ZXIoKS5hZGRUbyhtYXApO1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbnMuc2V0R2VvSlNPTihnZW9qc29uKTtcblxuICAgICAgICAgICAgICAgIGxvY2F0aW9ucy5lYWNoTGF5ZXIoZnVuY3Rpb24oc3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BzID0gc3RvcmUuZmVhdHVyZS5wcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbSA9IEwuZGl2SWNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdsb2NhdGlvbi1wb2ludCBkaWdpdHMtJyArIHByb3BzLnF1YW50aXR5LnRvU3RyaW5nKCkubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvblNpemU6IFsyNSw0NV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sOiBwcm9wcy5xdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwQW5jaG9yOiBbMCwgLTI1XVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVhbnRpdHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoNCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHkuaW5uZXJIVE1MID0gcHJvcHMucXVhbnRpdHkgKyAnIGluIHN0b2NrLic7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGhvdXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMuaW5uZXJIVE1MID0gJ1N0b3JlIGRldGFpbHMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMudGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgICAgICAgICAgICAgICAgICAgICBob3Vycy5ocmVmID0gcHJvcHMuc3RvcmVVUkw7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGFkZHJlc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3MuY2xhc3NOYW1lID0gJ3NtYWxsIHF1aWV0JztcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcHJvcHMuYWRkcmVzcyArICcgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLmNpdHk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZChxdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoaG91cnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLnNldEljb24obSk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLmJpbmRQb3B1cChjb250ZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG1hcC5maXRCb3VuZHMobG9jYXRpb25zLmdldEJvdW5kcygpKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjaygnR2VvbG9jYXRpb24gaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkZ2VvanNvbihkYXRhKSB7XG4gICAgcmV0dXJuIGRhdGEucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIGl0ZW0pIHtcbiAgICAgICAgbWVtby5wdXNoKHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIkZlYXR1cmVcIixcbiAgICAgICAgICAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJjb29yZGluYXRlc1wiOiBbaXRlbS5sb25naXR1ZGUsIGl0ZW0ubGF0aXR1ZGVdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgICAgICBcInF1YW50aXR5XCI6IGl0ZW0ucXVhbnRpdHksXG4gICAgICAgICAgICAgICAgXCJjaXR5XCI6IGl0ZW0uY2l0eSxcbiAgICAgICAgICAgICAgICBcImFkZHJlc3NcIjogaXRlbS5hZGRyZXNzX2xpbmVfMSxcbiAgICAgICAgICAgICAgICBcInN0b3JlVVJMXCI6ICdodHRwOi8vbGNib3NlYXJjaC5jb20vc3RvcmVzLycgKyBpdGVtLmlkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9LCBbXSk7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkUmVzdWx0cyhkKSB7XG4gICAgdmFyIHJlc3VsdCA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICB2YXIgaXRlbSA9IHJlc3VsdC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb2wxMiBjb250YWluIGNsZWFyZml4Jyk7XG5cbiAgICB2YXIgZGV0YWlscyA9IGl0ZW0uYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY29sMTAgcGFkMHkgcGFkMHgnKTtcblxuICAgIHZhciBpbWcgPSBkZXRhaWxzLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NxdWFyZSBmbCcpO1xuXG4gICAgaW1nLmFwcGVuZCgnaW1nJylcbiAgICAgICAgLmF0dHIoJ2RhdGEtZXJyb3InLCAnaW1nL21pc3NpbmcucG5nJylcbiAgICAgICAgLmF0dHIoJ3NyYycsIChkLml0ZW0uaW1nKSA/IGQuaXRlbS5pbWcgOiAnaW1nL21pc3NpbmcucG5nJylcbiAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3NyYycsIGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdkYXRhLWVycm9yJykpO1xuICAgICAgICB9KTtcblxuICAgIHZhciB0aXRsZSA9IGRldGFpbHMuYXBwZW5kKCdoMycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdibG9jayBzdHJvbmcnKTtcblxuICAgIHRpdGxlLmFwcGVuZCgnYScpXG4gICAgICAgIC5hdHRyKCdocmVmJywgJyMnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAndHJ1bmNhdGUnKVxuICAgICAgICAuaHRtbChkLml0ZW0ubmFtZSlcbiAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZDMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGQzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5jbGFzc2VkKCdhY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLml0ZW0nKS5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNsYXNzZWQoJ2FjdGl2ZScsIHRydWUpO1xuICAgICAgICAgICAgICAgIHZhciBtYXAgPSByZXN1bHQuc2VsZWN0KCcubWFwJyk7XG4gICAgICAgICAgICAgICAgbWFwLmNsYXNzZWQoJ2xvYWRpbmcnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBidWlsZG1hcChtYXAsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuc2VsZWN0KCdsYWJlbCcpLnRleHQoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5jbGFzc2VkKCdlcnJvcicsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hcC5jbGFzc2VkKCdsb2FkaW5nJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuXG4gICAgdmFyIG1ldGEgPSBkZXRhaWxzLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldGEgc21hbGwnKTtcblxuICAgIG1ldGEuYXBwZW5kKCdzcGFuJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Nwcml0ZSBmbGFnICcgKyBub3JtYWxpemVDbGFzcyhkLml0ZW0ub3JpZ2luKSk7XG5cbiAgICBtZXRhLmFwcGVuZCgnc3BhbicpXG4gICAgICAgIC5odG1sKGQuaXRlbS5wcm9kdWNlcilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3F1aWV0Jyk7XG5cbiAgICBtZXRhLmFwcGVuZCgnc3BhbicpXG4gICAgICAgIC5odG1sKGQuaXRlbS5vcmlnaW4pXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdxdWlldCcpO1xuXG4gICAgbWV0YS5hcHBlbmQoJ3NwYW4nKVxuICAgICAgICAudGV4dCgnJCcgKyBkLml0ZW0ucHJpY2UgLyAxMDApO1xuXG4gICAgdmFyIGFjdGlvbnMgPSBpdGVtLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Bpbi1yaWdodCBwYWQxeCBwYWQxeSBzbWFsbCcpO1xuXG4gICAgLy9hY3Rpb25zLmFwcGVuZCgnYScpXG4gICAgICAgIC8vLmF0dHIoJ2hyZWYnLCBMQ0JPICsgZC5pdGVtLmlkKVxuICAgICAgICAvLy5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJylcbiAgICAgICAgLy8udGV4dCgnTENCTycpO1xuXG4gICAgLy8gRXhhbmRlZCByZXN1bHRzLlxuICAgIHZhciBleHBhbmQgPSByZXN1bHQuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnZXhwYW5kIGNvbDEyIHNtYWxsJyk7XG5cbiAgICBpZiAoZC5pdGVtLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGV4cGFuZC5hcHBlbmQoJ2RpdicpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAncHJvc2UnKVxuICAgICAgICAgICAgLmh0bWwoZC5pdGVtLmRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoZC5pdGVtLm5vdGVzKSB7XG4gICAgICAgIGV4cGFuZC5hcHBlbmQoJ2RpdicpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAncHJvc2UnKVxuICAgICAgICAgICAgLmh0bWwoZC5pdGVtLm5vdGVzKTtcbiAgICB9XG5cbiAgICB2YXIgbWFwID0gZXhwYW5kLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21hcCBjb250YWluIGFuaW1hdGUgbG9hZGluZycpXG4gICAgICAgIC5hdHRyKCdpZCcsICdtYXAtJyArIGQuaWQpO1xuXG4gICAgbWFwLmFwcGVuZCgnbGFiZWwnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFwLWxhYmVsJylcbiAgICAgICAgLmh0bWwoJ0Nsb3Nlc3Qgc3RvcmUgbG9jYXRpb25zIHdpdGggc3RvY2snKTtcblxuICAgIC8vIFJlc3VsdHMgaGF2ZSByZW5kZXJlZC5cbiAgICBkMy5zZWxlY3QodGhpcy5wYXJlbnROb2RlKS5jbGFzc2VkKCdsb2FkaW5nJywgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDbGFzcyhpbnB1dCkge1xuICAgIHJldHVybiByZW1vdmVEaWFjcml0aWNzKGlucHV0LnNwbGl0KCcsICcpLnBvcCgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzL2csICctJykpO1xufVxuXG5mdW5jdGlvbiBjb21tYWZ5KHgpIHtcbiAgICByZXR1cm4geC50b1N0cmluZygpLnJlcGxhY2UoL1xcQig/PShcXGR7M30pKyg/IVxcZCkpL2csIFwiLFwiKTtcbn1cblxuZnVuY3Rpb24ga2V5dXAoKSB7XG4gICAgJHJlc3VsdHNcbiAgICAgICAgLmh0bWwoJycpXG4gICAgICAgIC5jbGFzc2VkKCdsb2FkaW5nJywgdHJ1ZSk7XG5cbiAgICAkYXV0b2NvbXBsZXRlLmh0bWwoJycpO1xuXG4gICAgaWYgKHRoaXMudmFsdWUpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnIycgKyB0aGlzLnZhbHVlLnRyaW0oKS5zcGxpdCgvXFxzKy8pLmpvaW4oJysnKTtcblxuICAgICAgICBzZWFyY2gucXVlcnkodGhpcy52YWx1ZSwgZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgICAgICAgJHJlc3VsdHNcbiAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKCdkaXYnKVxuICAgICAgICAgICAgICAgIC5kYXRhKHJlc3VsdHMpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAna2V5bGluZS1ib3R0b20gaXRlbSBjb2wxMiBjbGVhcmZpeCcpXG4gICAgICAgICAgICAgICAgICAgIC5lYWNoKGJ1aWxkUmVzdWx0cyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlYXJjaC5hdXRvY29tcGxldGUodGhpcy52YWx1ZSwgZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgICAgICAgJGF1dG9jb21wbGV0ZVxuICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoJ2EnKVxuICAgICAgICAgICAgICAgIC5kYXRhKHJlc3VsdHMpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdhJylcbiAgICAgICAgICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSlcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCAnIycpXG4gICAgICAgICAgICAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQzLmV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkMy5ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzZWFyY2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigndmFsdWUnLCB0aGlzLnRleHRDb250ZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lYWNoKGtleXVwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZDMuanNvbignZGF0YS9kYXRhLmpzb24nLCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgIGlmIChlcnIpIHJldHVybiBjb25zb2xlLmVycm9yKCdkYXRhLmpzb24gY291bGQgbm90IGJlIGZvdW5kLicpO1xuICAgIGQzLnNlbGVjdCgnYm9keScpLmNsYXNzZWQoJ2xvYWRpbmcnLCBmYWxzZSk7XG4gICAgJHNlYXJjaFxuICAgICAgICAuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoICcgKyBjb21tYWZ5KHJlcy5sZW5ndGgpICsgJyB3aW5lcycpXG4gICAgICAgIC5vbigna2V5dXAnLCBrZXl1cCk7XG5cbiAgICB2YXIgdmFsID0gKCdvYmplY3QnID09PSB0eXBlb2Ygd2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoJysnKSkgP1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaC5zbGljZSgnKycpLmpvaW4oJyAnKSA6XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuXG4gICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG4gICAgICAgICRzZWFyY2hcbiAgICAgICAgICAgIC5hdHRyKCd2YWx1ZScsIHZhbC5yZXBsYWNlKC8jL2csICcnKS5yZXBsYWNlKC9cXCsvZywgJyAnKSlcbiAgICAgICAgICAgIC5lYWNoKGtleXVwKTtcbiAgICB9XG59KTtcblxufSkoKTtcbiIsImV4cG9ydHMucmVtb3ZlID0gcmVtb3ZlRGlhY3JpdGljcztcblxudmFyIHJlcGxhY2VtZW50TGlzdCA9IFtcbiAge1xuICAgIGJhc2U6ICcgJyxcbiAgICBjaGFyczogXCJcXHUwMEEwXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnMCcsXG4gICAgY2hhcnM6IFwiXFx1MDdDMFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0EnLFxuICAgIGNoYXJzOiBcIlxcdTI0QjZcXHVGRjIxXFx1MDBDMFxcdTAwQzFcXHUwMEMyXFx1MUVBNlxcdTFFQTRcXHUxRUFBXFx1MUVBOFxcdTAwQzNcXHUwMTAwXFx1MDEwMlxcdTFFQjBcXHUxRUFFXFx1MUVCNFxcdTFFQjJcXHUwMjI2XFx1MDFFMFxcdTAwQzRcXHUwMURFXFx1MUVBMlxcdTAwQzVcXHUwMUZBXFx1MDFDRFxcdTAyMDBcXHUwMjAyXFx1MUVBMFxcdTFFQUNcXHUxRUI2XFx1MUUwMFxcdTAxMDRcXHUwMjNBXFx1MkM2RlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0FBJyxcbiAgICBjaGFyczogXCJcXHVBNzMyXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnQUUnLFxuICAgIGNoYXJzOiBcIlxcdTAwQzZcXHUwMUZDXFx1MDFFMlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0FPJyxcbiAgICBjaGFyczogXCJcXHVBNzM0XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnQVUnLFxuICAgIGNoYXJzOiBcIlxcdUE3MzZcIixcbiAgfSwge1xuICAgIGJhc2U6ICdBVicsXG4gICAgY2hhcnM6IFwiXFx1QTczOFxcdUE3M0FcIixcbiAgfSwge1xuICAgIGJhc2U6ICdBWScsXG4gICAgY2hhcnM6IFwiXFx1QTczQ1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ0InLFxuICAgIGNoYXJzOiBcIlxcdTI0QjdcXHVGRjIyXFx1MUUwMlxcdTFFMDRcXHUxRTA2XFx1MDI0M1xcdTAxODFcIixcbiAgfSwge1xuICAgIGJhc2U6ICdDJyxcbiAgICBjaGFyczogXCJcXHVGRjQzXFx1MjRiOFxcdWZmMjNcXHVBNzNFXFx1MUUwOFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0QnLFxuICAgIGNoYXJzOiBcIlxcdTI0QjlcXHVGRjI0XFx1MUUwQVxcdTAxMEVcXHUxRTBDXFx1MUUxMFxcdTFFMTJcXHUxRTBFXFx1MDExMFxcdTAxOEFcXHUwMTg5XFx1MUQwNVxcdUE3NzlcIixcbiAgfSwge1xuICAgIGJhc2U6ICdEaCcsXG4gICAgY2hhcnM6IFwiXFx1MDBEMFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0RaJyxcbiAgICBjaGFyczogXCJcXHUwMUYxXFx1MDFDNFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0R6JyxcbiAgICBjaGFyczogXCJcXHUwMUYyXFx1MDFDNVwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0UnLFxuICAgIGNoYXJzOiBcIlxcdTAyNUJcXHUyNEJBXFx1RkYyNVxcdTAwQzhcXHUwMEM5XFx1MDBDQVxcdTFFQzBcXHUxRUJFXFx1MUVDNFxcdTFFQzJcXHUxRUJDXFx1MDExMlxcdTFFMTRcXHUxRTE2XFx1MDExNFxcdTAxMTZcXHUwMENCXFx1MUVCQVxcdTAxMUFcXHUwMjA0XFx1MDIwNlxcdTFFQjhcXHUxRUM2XFx1MDIyOFxcdTFFMUNcXHUwMTE4XFx1MUUxOFxcdTFFMUFcXHUwMTkwXFx1MDE4RVxcdTFEMDdcIixcbiAgfSwge1xuICAgIGJhc2U6ICdGJyxcbiAgICBjaGFyczogXCJcXHVBNzdDXFx1MjRCQlxcdUZGMjZcXHUxRTFFXFx1MDE5MVxcdUE3N0JcIixcbiAgfSwge1xuICAgIGJhc2U6ICdHJyxcbiAgICBjaGFyczogXCJcXHUyNEJDXFx1RkYyN1xcdTAxRjRcXHUwMTFDXFx1MUUyMFxcdTAxMUVcXHUwMTIwXFx1MDFFNlxcdTAxMjJcXHUwMUU0XFx1MDE5M1xcdUE3QTBcXHVBNzdEXFx1QTc3RVxcdTAyNjJcIixcbiAgfSwge1xuICAgIGJhc2U6ICdIJyxcbiAgICBjaGFyczogXCJcXHUyNEJEXFx1RkYyOFxcdTAxMjRcXHUxRTIyXFx1MUUyNlxcdTAyMUVcXHUxRTI0XFx1MUUyOFxcdTFFMkFcXHUwMTI2XFx1MkM2N1xcdTJDNzVcXHVBNzhEXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnSScsXG4gICAgY2hhcnM6IFwiXFx1MjRCRVxcdUZGMjlcXHhDQ1xceENEXFx4Q0VcXHUwMTI4XFx1MDEyQVxcdTAxMkNcXHUwMTMwXFx4Q0ZcXHUxRTJFXFx1MUVDOFxcdTAxQ0ZcXHUwMjA4XFx1MDIwQVxcdTFFQ0FcXHUwMTJFXFx1MUUyQ1xcdTAxOTdcIixcbiAgfSwge1xuICAgIGJhc2U6ICdKJyxcbiAgICBjaGFyczogXCJcXHUyNEJGXFx1RkYyQVxcdTAxMzRcXHUwMjQ4XFx1MDIzN1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ0snLFxuICAgIGNoYXJzOiBcIlxcdTI0QzBcXHVGRjJCXFx1MUUzMFxcdTAxRThcXHUxRTMyXFx1MDEzNlxcdTFFMzRcXHUwMTk4XFx1MkM2OVxcdUE3NDBcXHVBNzQyXFx1QTc0NFxcdUE3QTJcIixcbiAgfSwge1xuICAgIGJhc2U6ICdMJyxcbiAgICBjaGFyczogXCJcXHUyNEMxXFx1RkYyQ1xcdTAxM0ZcXHUwMTM5XFx1MDEzRFxcdTFFMzZcXHUxRTM4XFx1MDEzQlxcdTFFM0NcXHUxRTNBXFx1MDE0MVxcdTAyM0RcXHUyQzYyXFx1MkM2MFxcdUE3NDhcXHVBNzQ2XFx1QTc4MFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ0xKJyxcbiAgICBjaGFyczogXCJcXHUwMUM3XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnTGonLFxuICAgIGNoYXJzOiBcIlxcdTAxQzhcIixcbiAgfSwge1xuICAgIGJhc2U6ICdNJyxcbiAgICBjaGFyczogXCJcXHUyNEMyXFx1RkYyRFxcdTFFM0VcXHUxRTQwXFx1MUU0MlxcdTJDNkVcXHUwMTlDXFx1MDNGQlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ04nLFxuICAgIGNoYXJzOiBcIlxcdUE3QTRcXHUwMjIwXFx1MjRDM1xcdUZGMkVcXHUwMUY4XFx1MDE0M1xceEQxXFx1MUU0NFxcdTAxNDdcXHUxRTQ2XFx1MDE0NVxcdTFFNEFcXHUxRTQ4XFx1MDE5RFxcdUE3OTBcXHUxRDBFXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnTkonLFxuICAgIGNoYXJzOiBcIlxcdTAxQ0FcIixcbiAgfSwge1xuICAgIGJhc2U6ICdOaicsXG4gICAgY2hhcnM6IFwiXFx1MDFDQlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ08nLFxuICAgIGNoYXJzOiBcIlxcdTI0QzRcXHVGRjJGXFx4RDJcXHhEM1xceEQ0XFx1MUVEMlxcdTFFRDBcXHUxRUQ2XFx1MUVENFxceEQ1XFx1MUU0Q1xcdTAyMkNcXHUxRTRFXFx1MDE0Q1xcdTFFNTBcXHUxRTUyXFx1MDE0RVxcdTAyMkVcXHUwMjMwXFx4RDZcXHUwMjJBXFx1MUVDRVxcdTAxNTBcXHUwMUQxXFx1MDIwQ1xcdTAyMEVcXHUwMUEwXFx1MUVEQ1xcdTFFREFcXHUxRUUwXFx1MUVERVxcdTFFRTJcXHUxRUNDXFx1MUVEOFxcdTAxRUFcXHUwMUVDXFx4RDhcXHUwMUZFXFx1MDE4NlxcdTAxOUZcXHVBNzRBXFx1QTc0Q1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ09FJyxcbiAgICBjaGFyczogXCJcXHUwMTUyXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnT0knLFxuICAgIGNoYXJzOiBcIlxcdTAxQTJcIixcbiAgfSwge1xuICAgIGJhc2U6ICdPTycsXG4gICAgY2hhcnM6IFwiXFx1QTc0RVwiLFxuICB9LCB7XG4gICAgYmFzZTogJ09VJyxcbiAgICBjaGFyczogXCJcXHUwMjIyXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnUCcsXG4gICAgY2hhcnM6IFwiXFx1MjRDNVxcdUZGMzBcXHUxRTU0XFx1MUU1NlxcdTAxQTRcXHUyQzYzXFx1QTc1MFxcdUE3NTJcXHVBNzU0XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnUScsXG4gICAgY2hhcnM6IFwiXFx1MjRDNlxcdUZGMzFcXHVBNzU2XFx1QTc1OFxcdTAyNEFcIixcbiAgfSwge1xuICAgIGJhc2U6ICdSJyxcbiAgICBjaGFyczogXCJcXHUyNEM3XFx1RkYzMlxcdTAxNTRcXHUxRTU4XFx1MDE1OFxcdTAyMTBcXHUwMjEyXFx1MUU1QVxcdTFFNUNcXHUwMTU2XFx1MUU1RVxcdTAyNENcXHUyQzY0XFx1QTc1QVxcdUE3QTZcXHVBNzgyXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnUycsXG4gICAgY2hhcnM6IFwiXFx1MjRDOFxcdUZGMzNcXHUxRTlFXFx1MDE1QVxcdTFFNjRcXHUwMTVDXFx1MUU2MFxcdTAxNjBcXHUxRTY2XFx1MUU2MlxcdTFFNjhcXHUwMjE4XFx1MDE1RVxcdTJDN0VcXHVBN0E4XFx1QTc4NFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ1QnLFxuICAgIGNoYXJzOiBcIlxcdTI0QzlcXHVGRjM0XFx1MUU2QVxcdTAxNjRcXHUxRTZDXFx1MDIxQVxcdTAxNjJcXHUxRTcwXFx1MUU2RVxcdTAxNjZcXHUwMUFDXFx1MDFBRVxcdTAyM0VcXHVBNzg2XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnVGgnLFxuICAgIGNoYXJzOiBcIlxcdTAwREVcIixcbiAgfSwge1xuICAgIGJhc2U6ICdUWicsXG4gICAgY2hhcnM6IFwiXFx1QTcyOFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ1UnLFxuICAgIGNoYXJzOiBcIlxcdTI0Q0FcXHVGRjM1XFx4RDlcXHhEQVxceERCXFx1MDE2OFxcdTFFNzhcXHUwMTZBXFx1MUU3QVxcdTAxNkNcXHhEQ1xcdTAxREJcXHUwMUQ3XFx1MDFENVxcdTAxRDlcXHUxRUU2XFx1MDE2RVxcdTAxNzBcXHUwMUQzXFx1MDIxNFxcdTAyMTZcXHUwMUFGXFx1MUVFQVxcdTFFRThcXHUxRUVFXFx1MUVFQ1xcdTFFRjBcXHUxRUU0XFx1MUU3MlxcdTAxNzJcXHUxRTc2XFx1MUU3NFxcdTAyNDRcIixcbiAgfSwge1xuICAgIGJhc2U6ICdWJyxcbiAgICBjaGFyczogXCJcXHUyNENCXFx1RkYzNlxcdTFFN0NcXHUxRTdFXFx1MDFCMlxcdUE3NUVcXHUwMjQ1XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnVlknLFxuICAgIGNoYXJzOiBcIlxcdUE3NjBcIixcbiAgfSwge1xuICAgIGJhc2U6ICdXJyxcbiAgICBjaGFyczogXCJcXHUyNENDXFx1RkYzN1xcdTFFODBcXHUxRTgyXFx1MDE3NFxcdTFFODZcXHUxRTg0XFx1MUU4OFxcdTJDNzJcIixcbiAgfSwge1xuICAgIGJhc2U6ICdYJyxcbiAgICBjaGFyczogXCJcXHUyNENEXFx1RkYzOFxcdTFFOEFcXHUxRThDXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnWScsXG4gICAgY2hhcnM6IFwiXFx1MjRDRVxcdUZGMzlcXHUxRUYyXFx4RERcXHUwMTc2XFx1MUVGOFxcdTAyMzJcXHUxRThFXFx1MDE3OFxcdTFFRjZcXHUxRUY0XFx1MDFCM1xcdTAyNEVcXHUxRUZFXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnWicsXG4gICAgY2hhcnM6IFwiXFx1MjRDRlxcdUZGM0FcXHUwMTc5XFx1MUU5MFxcdTAxN0JcXHUwMTdEXFx1MUU5MlxcdTFFOTRcXHUwMUI1XFx1MDIyNFxcdTJDN0ZcXHUyQzZCXFx1QTc2MlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2EnLFxuICAgIGNoYXJzOiBcIlxcdTI0RDBcXHVGRjQxXFx1MUU5QVxcdTAwRTBcXHUwMEUxXFx1MDBFMlxcdTFFQTdcXHUxRUE1XFx1MUVBQlxcdTFFQTlcXHUwMEUzXFx1MDEwMVxcdTAxMDNcXHUxRUIxXFx1MUVBRlxcdTFFQjVcXHUxRUIzXFx1MDIyN1xcdTAxRTFcXHUwMEU0XFx1MDFERlxcdTFFQTNcXHUwMEU1XFx1MDFGQlxcdTAxQ0VcXHUwMjAxXFx1MDIwM1xcdTFFQTFcXHUxRUFEXFx1MUVCN1xcdTFFMDFcXHUwMTA1XFx1MkM2NVxcdTAyNTBcXHUwMjUxXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnYWEnLFxuICAgIGNoYXJzOiBcIlxcdUE3MzNcIixcbiAgfSwge1xuICAgIGJhc2U6ICdhZScsXG4gICAgY2hhcnM6IFwiXFx1MDBFNlxcdTAxRkRcXHUwMUUzXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnYW8nLFxuICAgIGNoYXJzOiBcIlxcdUE3MzVcIixcbiAgfSwge1xuICAgIGJhc2U6ICdhdScsXG4gICAgY2hhcnM6IFwiXFx1QTczN1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ2F2JyxcbiAgICBjaGFyczogXCJcXHVBNzM5XFx1QTczQlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2F5JyxcbiAgICBjaGFyczogXCJcXHVBNzNEXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnYicsXG4gICAgY2hhcnM6IFwiXFx1MjREMVxcdUZGNDJcXHUxRTAzXFx1MUUwNVxcdTFFMDdcXHUwMTgwXFx1MDE4M1xcdTAyNTNcXHUwMTgyXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnYycsXG4gICAgY2hhcnM6IFwiXFx1MjREMlxcdTAxMDdcXHUwMTA5XFx1MDEwQlxcdTAxMERcXHUwMEU3XFx1MUUwOVxcdTAxODhcXHUwMjNDXFx1QTczRlxcdTIxODRcXHUwMDQzXFx1MDEwNlxcdTAxMDhcXHUwMTBBXFx1MDEwQ1xcdTAwQzdcXHUwMTg3XFx1MDIzQlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2QnLFxuICAgIGNoYXJzOiBcIlxcdTI0RDNcXHVGRjQ0XFx1MUUwQlxcdTAxMEZcXHUxRTBEXFx1MUUxMVxcdTFFMTNcXHUxRTBGXFx1MDExMVxcdTAxOENcXHUwMjU2XFx1MDI1N1xcdTAxOEJcXHUxM0U3XFx1MDUwMVxcdUE3QUFcIixcbiAgfSwge1xuICAgIGJhc2U6ICdkaCcsXG4gICAgY2hhcnM6IFwiXFx1MDBGMFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2R6JyxcbiAgICBjaGFyczogXCJcXHUwMUYzXFx1MDFDNlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2UnLFxuICAgIGNoYXJzOiBcIlxcdTI0RDRcXHVGRjQ1XFx1MDBFOFxcdTAwRTlcXHUwMEVBXFx1MUVDMVxcdTFFQkZcXHUxRUM1XFx1MUVDM1xcdTFFQkRcXHUwMTEzXFx1MUUxNVxcdTFFMTdcXHUwMTE1XFx1MDExN1xcdTAwRUJcXHUxRUJCXFx1MDExQlxcdTAyMDVcXHUwMjA3XFx1MUVCOVxcdTFFQzdcXHUwMjI5XFx1MUUxRFxcdTAxMTlcXHUxRTE5XFx1MUUxQlxcdTAyNDdcXHUwMUREXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnZicsXG4gICAgY2hhcnM6IFwiXFx1MjRENVxcdUZGNDZcXHUxRTFGXFx1MDE5MlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2ZmJyxcbiAgICBjaGFyczogXCJcXHVGQjAwXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnZmknLFxuICAgIGNoYXJzOiBcIlxcdUZCMDFcIixcbiAgfSwge1xuICAgIGJhc2U6ICdmbCcsXG4gICAgY2hhcnM6IFwiXFx1RkIwMlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2ZmaScsXG4gICAgY2hhcnM6IFwiXFx1RkIwM1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ2ZmbCcsXG4gICAgY2hhcnM6IFwiXFx1RkIwNFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2cnLFxuICAgIGNoYXJzOiBcIlxcdTI0RDZcXHVGRjQ3XFx1MDFGNVxcdTAxMURcXHUxRTIxXFx1MDExRlxcdTAxMjFcXHUwMUU3XFx1MDEyM1xcdTAxRTVcXHUwMjYwXFx1QTdBMVxcdUE3N0ZcXHUxRDc5XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnaCcsXG4gICAgY2hhcnM6IFwiXFx1MjREN1xcdUZGNDhcXHUwMTI1XFx1MUUyM1xcdTFFMjdcXHUwMjFGXFx1MUUyNVxcdTFFMjlcXHUxRTJCXFx1MUU5NlxcdTAxMjdcXHUyQzY4XFx1MkM3NlxcdTAyNjVcIixcbiAgfSwge1xuICAgIGJhc2U6ICdodicsXG4gICAgY2hhcnM6IFwiXFx1MDE5NVwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2knLFxuICAgIGNoYXJzOiBcIlxcdTI0RDhcXHVGRjQ5XFx4RUNcXHhFRFxceEVFXFx1MDEyOVxcdTAxMkJcXHUwMTJEXFx4RUZcXHUxRTJGXFx1MUVDOVxcdTAxRDBcXHUwMjA5XFx1MDIwQlxcdTFFQ0JcXHUwMTJGXFx1MUUyRFxcdTAyNjhcXHUwMTMxXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnaicsXG4gICAgY2hhcnM6IFwiXFx1MjREOVxcdUZGNEFcXHUwMTM1XFx1MDFGMFxcdTAyNDlcIixcbiAgfSwge1xuICAgIGJhc2U6ICdrJyxcbiAgICBjaGFyczogXCJcXHUyNERBXFx1RkY0QlxcdTFFMzFcXHUwMUU5XFx1MUUzM1xcdTAxMzdcXHUxRTM1XFx1MDE5OVxcdTJDNkFcXHVBNzQxXFx1QTc0M1xcdUE3NDVcXHVBN0EzXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnbCcsXG4gICAgY2hhcnM6IFwiXFx1MjREQlxcdUZGNENcXHUwMTQwXFx1MDEzQVxcdTAxM0VcXHUxRTM3XFx1MUUzOVxcdTAxM0NcXHUxRTNEXFx1MUUzQlxcdTAxN0ZcXHUwMTQyXFx1MDE5QVxcdTAyNkJcXHUyQzYxXFx1QTc0OVxcdUE3ODFcXHVBNzQ3XFx1MDI2RFwiLFxuICB9LCB7XG4gICAgYmFzZTogJ2xqJyxcbiAgICBjaGFyczogXCJcXHUwMUM5XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnbScsXG4gICAgY2hhcnM6IFwiXFx1MjREQ1xcdUZGNERcXHUxRTNGXFx1MUU0MVxcdTFFNDNcXHUwMjcxXFx1MDI2RlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ24nLFxuICAgIGNoYXJzOiBcIlxcdTI0RERcXHVGRjRFXFx1MDFGOVxcdTAxNDRcXHhGMVxcdTFFNDVcXHUwMTQ4XFx1MUU0N1xcdTAxNDZcXHUxRTRCXFx1MUU0OVxcdTAxOUVcXHUwMjcyXFx1MDE0OVxcdUE3OTFcXHVBN0E1XFx1MDQzQlxcdTA1MDlcIixcbiAgfSwge1xuICAgIGJhc2U6ICduaicsXG4gICAgY2hhcnM6IFwiXFx1MDFDQ1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ28nLFxuICAgIGNoYXJzOiBcIlxcdTI0REVcXHVGRjRGXFx4RjJcXHhGM1xceEY0XFx1MUVEM1xcdTFFRDFcXHUxRUQ3XFx1MUVENVxceEY1XFx1MUU0RFxcdTAyMkRcXHUxRTRGXFx1MDE0RFxcdTFFNTFcXHUxRTUzXFx1MDE0RlxcdTAyMkZcXHUwMjMxXFx4RjZcXHUwMjJCXFx1MUVDRlxcdTAxNTFcXHUwMUQyXFx1MDIwRFxcdTAyMEZcXHUwMUExXFx1MUVERFxcdTFFREJcXHUxRUUxXFx1MUVERlxcdTFFRTNcXHUxRUNEXFx1MUVEOVxcdTAxRUJcXHUwMUVEXFx4RjhcXHUwMUZGXFx1QTc0QlxcdUE3NERcXHUwMjc1XFx1MDI1NFxcdTFEMTFcIixcbiAgfSwge1xuICAgIGJhc2U6ICdvZScsXG4gICAgY2hhcnM6IFwiXFx1MDE1M1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ29pJyxcbiAgICBjaGFyczogXCJcXHUwMUEzXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAnb28nLFxuICAgIGNoYXJzOiBcIlxcdUE3NEZcIixcbiAgfSwge1xuICAgIGJhc2U6ICdvdScsXG4gICAgY2hhcnM6IFwiXFx1MDIyM1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ3AnLFxuICAgIGNoYXJzOiBcIlxcdTI0REZcXHVGRjUwXFx1MUU1NVxcdTFFNTdcXHUwMUE1XFx1MUQ3RFxcdUE3NTFcXHVBNzUzXFx1QTc1NVxcdTAzQzFcIixcbiAgfSwge1xuICAgIGJhc2U6ICdxJyxcbiAgICBjaGFyczogXCJcXHUyNEUwXFx1RkY1MVxcdTAyNEJcXHVBNzU3XFx1QTc1OVwiLFxuICB9LCB7XG4gICAgYmFzZTogJ3InLFxuICAgIGNoYXJzOiBcIlxcdTI0RTFcXHVGRjUyXFx1MDE1NVxcdTFFNTlcXHUwMTU5XFx1MDIxMVxcdTAyMTNcXHUxRTVCXFx1MUU1RFxcdTAxNTdcXHUxRTVGXFx1MDI0RFxcdTAyN0RcXHVBNzVCXFx1QTdBN1xcdUE3ODNcIixcbiAgfSwge1xuICAgIGJhc2U6ICdzJyxcbiAgICBjaGFyczogXCJcXHUyNEUyXFx1RkY1M1xcdTAxNUJcXHUxRTY1XFx1MDE1RFxcdTFFNjFcXHUwMTYxXFx1MUU2N1xcdTFFNjNcXHUxRTY5XFx1MDIxOVxcdTAxNUZcXHUwMjNGXFx1QTdBOVxcdUE3ODVcXHUxRTlCXFx1MDI4MlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ3NzJyxcbiAgICBjaGFyczogXCJcXHhERlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ3QnLFxuICAgIGNoYXJzOiBcIlxcdTI0RTNcXHVGRjU0XFx1MUU2QlxcdTFFOTdcXHUwMTY1XFx1MUU2RFxcdTAyMUJcXHUwMTYzXFx1MUU3MVxcdTFFNkZcXHUwMTY3XFx1MDFBRFxcdTAyODhcXHUyQzY2XFx1QTc4N1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ3RoJyxcbiAgICBjaGFyczogXCJcXHUwMEZFXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAndHonLFxuICAgIGNoYXJzOiBcIlxcdUE3MjlcIixcbiAgfSwge1xuICAgIGJhc2U6ICd1JyxcbiAgICBjaGFyczogXCJcXHUyNEU0XFx1RkY1NVxceEY5XFx4RkFcXHhGQlxcdTAxNjlcXHUxRTc5XFx1MDE2QlxcdTFFN0JcXHUwMTZEXFx4RkNcXHUwMURDXFx1MDFEOFxcdTAxRDZcXHUwMURBXFx1MUVFN1xcdTAxNkZcXHUwMTcxXFx1MDFENFxcdTAyMTVcXHUwMjE3XFx1MDFCMFxcdTFFRUJcXHUxRUU5XFx1MUVFRlxcdTFFRURcXHUxRUYxXFx1MUVFNVxcdTFFNzNcXHUwMTczXFx1MUU3N1xcdTFFNzVcXHUwMjg5XCIsXG4gIH0sIHtcbiAgICBiYXNlOiAndicsXG4gICAgY2hhcnM6IFwiXFx1MjRFNVxcdUZGNTZcXHUxRTdEXFx1MUU3RlxcdTAyOEJcXHVBNzVGXFx1MDI4Q1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ3Z5JyxcbiAgICBjaGFyczogXCJcXHVBNzYxXCIsXG4gIH0sIHtcbiAgICBiYXNlOiAndycsXG4gICAgY2hhcnM6IFwiXFx1MjRFNlxcdUZGNTdcXHUxRTgxXFx1MUU4M1xcdTAxNzVcXHUxRTg3XFx1MUU4NVxcdTFFOThcXHUxRTg5XFx1MkM3M1wiLFxuICB9LCB7XG4gICAgYmFzZTogJ3gnLFxuICAgIGNoYXJzOiBcIlxcdTI0RTdcXHVGRjU4XFx1MUU4QlxcdTFFOERcIixcbiAgfSwge1xuICAgIGJhc2U6ICd5JyxcbiAgICBjaGFyczogXCJcXHUyNEU4XFx1RkY1OVxcdTFFRjNcXHhGRFxcdTAxNzdcXHUxRUY5XFx1MDIzM1xcdTFFOEZcXHhGRlxcdTFFRjdcXHUxRTk5XFx1MUVGNVxcdTAxQjRcXHUwMjRGXFx1MUVGRlwiLFxuICB9LCB7XG4gICAgYmFzZTogJ3onLFxuICAgIGNoYXJzOiBcIlxcdTI0RTlcXHVGRjVBXFx1MDE3QVxcdTFFOTFcXHUwMTdDXFx1MDE3RVxcdTFFOTNcXHUxRTk1XFx1MDFCNlxcdTAyMjVcXHUwMjQwXFx1MkM2Q1xcdUE3NjNcIixcbiAgfVxuXTtcblxudmFyIGRpYWNyaXRpY3NNYXAgPSB7fTtcbmZvciAodmFyIGkgPSAwOyBpIDwgcmVwbGFjZW1lbnRMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gIHZhciBjaGFycyA9IHJlcGxhY2VtZW50TGlzdFtpXS5jaGFycztcbiAgZm9yICh2YXIgaiA9IDA7IGogPCBjaGFycy5sZW5ndGg7IGogKz0gMSkge1xuICAgIGRpYWNyaXRpY3NNYXBbY2hhcnNbal1dID0gcmVwbGFjZW1lbnRMaXN0W2ldLmJhc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlRGlhY3JpdGljcyhzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXlxcdTAwMDAtXFx1MDA3ZV0vZywgZnVuY3Rpb24oYykge1xuICAgIHJldHVybiBkaWFjcml0aWNzTWFwW2NdIHx8IGM7XG4gIH0pO1xufVxuIl19
;