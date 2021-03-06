'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = require('lodash-es/lang');
var _extend = _interopDefault(require('lodash-es/extend'));

var Consts = {

    ClassNames: {
        MASK: 'canvas-highlighter-mask',
        RECT: 'canvas-highlighter-rect',
        RECT_STAND_BY: 'canvas-highlighter-rect-stand-by',
        RECT_ACTIVED: 'canvas-highlighter-rect-actived',
        RECT_SELECTED: 'canvas-highlighter-rect-selected'
    },

    Events: {
        RECT_ACTIVED: 'RECT_ACTIVED',
        RECT_DISACTIVED: 'RECT_DISACTIVED',
        RECT_SELECTED: 'RECT_SELECTED',
        RECT_UNSELECTED: 'RECT_UNSELECTED'
    },

    PropertyNames: {
        ID: 'uuid',
        childrenPropertyName: 'children'
    }
};

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}
// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active && !(this instanceof domain.Domain)) {
      this.domain = domain.active;
    }
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var needDomainExit = false;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  if (needDomainExit)
    domain.exit();

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CanvasHighlighter = function (_EventEmitter) {
    _inherits(CanvasHighlighter, _EventEmitter);

    function CanvasHighlighter(options) {
        _classCallCheck(this, CanvasHighlighter);

        // params handling
        var _this = _possibleConstructorReturn(this, (CanvasHighlighter.__proto__ || Object.getPrototypeOf(CanvasHighlighter)).call(this));

        if (options) {
            _this.sourceElementSelector = options.sourceElement;
            _this.targetElementSelector = options.targetElement;
            _this.data = options.data;
            _this.standByClass = options.standByClass || Consts.ClassNames.RECT_STAND_BY;
            _this.activedClass = options.activedClass || Consts.ClassNames.RECT_ACTIVED;
            _this.selectedClass = options.selectedClass || Consts.ClassNames.RECT_SELECTED;
            _this.frameSize = options.frameSize;
            _this.startingZIndex = options.startingZIndex || 2000;
            _this.idPropertyName = options.idPropertyName || Consts.PropertyNames.ID;
            _this.childrenPropertyName = options.childrenPropertyName || Consts.PropertyNames.childrenPropertyName;
        }

        // init
        _this._init();
        return _this;
    }

    _createClass(CanvasHighlighter, [{
        key: 'render',
        value: function render() {
            this._createMaskLayer();
            this._renderRects(this.data);
        }
    }, {
        key: 'reRender',
        value: function reRender() {
            this.clean();
            this._init();
            this.render();
        }
    }, {
        key: 'clean',
        value: function clean() {
            for (var i = 0; i < this.rects.length; i++) {
                this.rects[i].remove();
            }
            this.rects = [];
            this.mask.remove();
            this.mask = undefined;
            this.q = [];
        }
    }, {
        key: '_renderRects',
        value: function _renderRects(root) {
            // this.data should be the root element or an array of elements

            if (_.isArray(root)) {
                for (var i = 0; i < root.length; i++) {
                    this.q.push(root[i]);
                }
            } else if (_.isObject(root)) {
                this.q.push(root);
            }

            while (this.q.length > 0) {
                var top = this.q.shift();
                this._createRectOnMaskLayer({ rect: top, layerSize: this, frameSize: this.frameSize });

                var children = top[this.childrenPropertyName];
                if (children) {
                    for (var j = 0; j < children.length; j++) {
                        this.q.push(children[j]);
                    }
                }
            }
        }
    }, {
        key: '_createMaskLayer',
        value: function _createMaskLayer() {
            var mask = document.createElement('div');
            mask.setAttribute('style', 'width:100%;height:100%;left:0;right:0;top:0;bottom:0;position:absolute');
            mask.setAttribute('class', Consts.ClassNames.MASK);
            this.container.appendChild(mask);
            this.mask = mask;
            this.layerSize = this.layerSize || { width: this.mask.offsetWidth, height: this.mask.offsetHeight };
        }
    }, {
        key: '_init',
        value: function _init() {
            this.sourceElement = document.querySelector(this.sourceElementSelector);
            this.targetElement = document.querySelector(this.targetElementSelector);

            if (this.targetElement) {
                this.container = this.targetElement;
            } else {
                this.container = this.sourceElement.parentElement;
            }

            this.width = this.container.offsetWidth;
            this.height = this.container.offsetHeight;
            this.rects = [];
            this.selectedRect = {};
            this.selectedRealRect = {};
            this.q = [];
            this.rectsMap = {};
        }
    }, {
        key: '_createRectOnMaskLayer',
        value: function _createRectOnMaskLayer(options) {
            var _this2 = this;

            var rect = void 0,
                layerSize = void 0,
                frameSize = void 0;
            if (options) {
                rect = options.rect || { left: 0, top: 0, right: 0, bottom: 0 };
                layerSize = options.layerSize || { width: 100, height: 100 };
                frameSize = options.frameSize || { width: 100, height: 100 };
            }

            var realRect = rect;
            //if (!(layerSize.width === frameSize.width && layerSize.height === frameSize.height)) {
            realRect = _extend({}, rect);
            realRect.left = rect.left == undefined ? undefined : rect.left * layerSize.width / frameSize.width;
            realRect.right = rect.right == undefined ? undefined : rect.right * layerSize.width / frameSize.width;
            realRect.top = rect.top == undefined ? undefined : rect.top * layerSize.height / frameSize.height;
            realRect.bottom = rect.bottom == undefined ? undefined : rect.bottom * layerSize.height / frameSize.height;
            realRect.width = rect.width == undefined ? undefined : rect.width * layerSize.width / frameSize.width;

            realRect.height = rect.height == undefined ? undefined : rect.height * layerSize.height / frameSize.height;

            //}
            var rectEl = document.createElement('div');
            var styleStr = 'position:absolute;';
            if (realRect.left != undefined) {
                styleStr += 'left:' + realRect.left + 'px;';
            }
            if (realRect.right != undefined) {
                styleStr += 'right:' + realRect.right + 'px;';
            }
            if (realRect.top != undefined) {
                styleStr += 'top:' + realRect.top + 'px;';
            }
            if (realRect.bottom != undefined) {
                styleStr += 'bottom:' + realRect.bottom + 'px;';
            }
            if (realRect.width != undefined) {
                styleStr += 'width:' + realRect.width + 'px;';
            }
            if (realRect.height != undefined) {
                styleStr += 'height:' + realRect.height + 'px;';
            }
            styleStr += 'box-sizing: border-box;z-index: ' + this.startingZIndex++;
            rectEl.setAttribute('style', styleStr);
            rectEl.setAttribute('class', this.standByClass);
            rectEl.addEventListener('mouseover', function () {
                _this2._highlight(rectEl, realRect);
            });
            rectEl.addEventListener('mouseout', function () {
                _this2._unhighlight(rectEl, realRect);
            });
            rectEl.addEventListener('click', function () {
                if (_this2.selectedRect == rectEl) {
                    _this2._unselect(_this2.selectedRect, _this2.selectedRealRect);
                } else {
                    _this2._unselect(_this2.selectedRect, _this2.selectedRealRect);
                    _this2._select(rectEl, realRect);
                }
            });

            this.container.appendChild(rectEl);
            this.rects.push(rectEl);

            var id_key = realRect[this.idPropertyName];
            if (_.isString(id_key)) {
                this.rectsMap[id_key] = { el: rectEl, data: realRect };
            }
        }
    }, {
        key: 'select',
        value: function select(id_key, isSilent) {
            if (_.isString(id_key) && _.isObject(this.rectsMap[id_key])) {
                this._select(this.rectsMap[id_key].el, this.rectsMap[id_key].data, isSilent);
            }
        }
    }, {
        key: 'unselect',
        value: function unselect(id_key, isSilent) {
            if (_.isString(id_key) && _.isObject(this.rectsMap[id_key])) {
                this._unselect(this.rectsMap[id_key].el, this.rectsMap[id_key].data, isSilent);
            }
        }
    }, {
        key: '_select',
        value: function _select(el, data, isSilent) {
            if (this.selectedRect != el) {
                this.selectedRect = el;
                this.selectedRealRect = data;
                el.setAttribute('class', this.selectedClass);
                if (!isSilent) {
                    this.emit(Consts.Events.RECT_SELECTED, data);
                }
            }
        }
    }, {
        key: '_unselect',
        value: function _unselect(el, data, isSilent) {
            if (this.selectedRect == el) {
                // unselect it
                if (_.isFunction(this.selectedRect.setAttribute)) {
                    this.selectedRect.setAttribute('class', this.standByClass);
                    if (!isSilent) {
                        this.emit(Consts.Events.RECT_UNSELECTED, this.selectedRealRect);
                    }
                    this.selectedRealRect = {};
                    this.selectedRect = {};
                }
            }
        }
    }, {
        key: 'highlight',
        value: function highlight(id_key, isSilent) {
            if (_.isString(id_key) && _.isObject(this.rectsMap[id_key])) {
                this._highlight(this.rectsMap[id_key].el, this.rectsMap[id_key].data, isSilent);
            }
        }
    }, {
        key: 'unhighlight',
        value: function unhighlight(id_key, isSilent) {
            if (_.isString(id_key) && _.isObject(this.rectsMap[id_key])) {
                this._unhighlight(this.rectsMap[id_key].el, this.rectsMap[id_key].data, isSilent);
            }
        }
    }, {
        key: '_highlight',
        value: function _highlight(el, data, isSilent) {
            if (this.selectedRect != el) {
                el.setAttribute('class', this.activedClass);
            }
            if (!isSilent) {
                this.emit(Consts.Events.RECT_ACTIVED, data);
            }
        }
    }, {
        key: '_unhighlight',
        value: function _unhighlight(el, data, isSilent) {
            if (this.selectedRect != el) {
                el.setAttribute('class', this.standByClass);
            }
            if (!isSilent) {
                this.emit(Consts.Events.RECT_DISACTIVED, data);
            }
        }
    }]);

    return CanvasHighlighter;
}(EventEmitter);

exports.CanvasHighlighter = CanvasHighlighter;
