(function($) {
  $.fn.extend({
    keybind: function(seq, handler) {
      var data = this.data('keybind');

      if (!data) {
        data = { bindings: {} };
        this.data('keybind', data)
            .bind({ keypress: keypressHandler,
                    keydown:  keydownHandler });
      }

      if (typeof seq === "object")
        $.each(seq, function(s, h) { attachBinding(data.bindings, s, h); });
      else
        attachBinding(data.bindings, seq, handler);

      return this;
    },

    keyunbind: function(seq, handler) {
      var data = this.data('keybind');

      if (handler !== undefined) {
        data.bindings[seq] = $.grep(data.bindings[seq], function(h) {
          return h !== handler;
        });
      } else
        delete data.bindings[seq];

      return this;
    },

    keyunbindAll: function() {
      $(this).removeData('keybind')
             .unbind({ keypress: keypressHandler,
                       keydown:  keydownHandler });
      return this;
    }
  });

  function keypressHandler(event) {
    var data = $(this).data('keybind'),
        desc = keyDescription(event);

    if (shouldTriggerOnKeydown(desc, event))
      return true;

    return triggerHandlers(data.bindings, desc, event);
  }

  function keydownHandler(event) {
    var data = $(this).data('keybind'),
        desc = keyDescription(event);

    if (!shouldTriggerOnKeydown(desc, event))
      return true;

    return triggerHandlers(data.bindings, desc, event);
  }

  function attachBinding(bindings, seq, handler) {
    var handlers = bindings[seq];
    if (handlers)
      handlers.push(handler)
    else
      bindings[seq] = [handler];
  }

  function triggerHandlers(bindings, desc, event) {
    var handlers = bindings[desc.name],
        retVal   = true;

    if (handlers === undefined)
      return retVal;

    $.each(handlers, function(i, fn) {
      if (fn(desc, event) === false)
        retVal = false;
    });

    return retVal;
  }

  function shouldTriggerOnKeydown(desc, event) {
    if (desc.ctrl || desc.meta || desc.alt)
      return true;

    // % .. (, which look like arrow keys
    if ((event.charCode >= 37 && event.charCode <= 40) ||
        // same thing but on IE
        (event.type === 'keypress' && event.keyCode >= 37 && event.keyCode <= 40))
      return false;

    if (event.keyCode in _specialKeys)
      return true;

    return false;
  }

  function keyDescription(event) {
    var desc = {},
        mods = '',
        name;

    if (event.ctrlKey)
      desc.ctrl = true;
    if (event.altKey)
      desc.alt = true;
    if (event.originalEvent.metaKey)
      desc.meta = true;
    if (event.shiftKey)
      desc.shift = true;

    desc.modified = desc.ctrl || desc.alt || desc.meta || desc.shift;
    desc.name = keyName(desc, event);

    return desc;
  }

  function keyName(desc, event) {
    var name, mods = '';

    if (desc.ctrl) mods += 'C-';
    if (desc.alt)  mods += 'A-';
    if (desc.meta) mods += 'M-';

    if (event.type === 'keydown') {
      if (event.keyCode >= 65 && event.keyCode <= 97 && desc.shift)
        mods += 'S-';

      if (event.keyCode in _specialKeys) {
        name = _specialKeys[event.keyCode];

      } else {
        name = String.fromCharCode(event.keyCode);
        if (event.keyCode >= 49 && event.keyCode <= 57)
          name = _shiftedKeys[name];
        else
          name = name.toLowerCase();
      }

    } else if (event.type === 'keypress') {
      name = String.fromCharCode(event.charCode || event.keyCode);

    } else
      throw("could prolly support keyup but explicitly don't right now");

    return mods + name;
  }

  var _specialKeys = {
    13: 'Enter', 27: 'Esc', 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down'
  };

  var _shiftedKeys = {
    '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')'
  };

}(jQuery));
