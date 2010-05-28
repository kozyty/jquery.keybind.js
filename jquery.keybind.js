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
    if ((desc.charCode >= 37 && desc.charCode <= 40) ||
        // same thing but on IE
        (event.type === 'keypress' && desc.keyCode >= 37 && desc.keyCode <= 40))
      return false;

    if (desc.keyCode === 189 || desc.keyCode === 187)
      return true;

    if (desc.charCode === 45 || desc.keyCode === 45) // -
      return true;

    if (desc.charCode === 95 || desc.keyCode === 95) // _
      return true;

    if (desc.charCode === 61 || desc.keyCode === 61
        || desc.charCode === 43 || desc.keyCode === 43) // =
      return true;

    if (desc.keyCode in _specialKeys)
      return true;

    return false;
  }

  function keyDescription(event) {
    var desc = {};

    if (event.ctrlKey)
      desc.ctrl = true;
    if (event.altKey)
      desc.alt = true;
    if (event.originalEvent.metaKey)
      desc.meta = true;
    if (event.shiftKey)
      desc.shift = true;

    desc.keyCode  = realKeyCode(desc, event);
    desc.charCode = event.charCode;
    desc.name = keyName(desc, event);

    return desc;
  }

  function realKeyCode(desc, event) {
    var keyCode = event.keyCode;
    if (keyCode in _funkyKeyCodes)
      keyCode = _funkyKeyCodes[keyCode];
    return keyCode;
  }

  function keyName(desc, event) {
    var name, mods = '';

    if (desc.ctrl) mods += 'C-';
    if (desc.alt)  mods += 'A-';
    if (desc.meta) mods += 'M-';

    if (event.type === 'keydown') {
      var keyCode = desc.keyCode;

      if (desc.shift && ((keyCode >= 65 && keyCode <= 97) // a..z
                        || (keyCode >= 37 && keyCode <= 40))) // Left..Down
        mods += 'S-';

      if (keyCode in _specialKeys)
        name = _specialKeys[keyCode];
      else
        name = String.fromCharCode(keyCode).toLowerCase();

    } else if (event.type === 'keypress') {
      name = String.fromCharCode(desc.charCode || desc.keyCode);

    } else
      throw("could prolly support keyup but explicitly don't right now");

    if (desc.shift && name in _shiftedKeys)
      name = _shiftedKeys[name];

    return mods + name;
  }

  var _specialKeys = {
    13: 'Enter', 27: 'Esc', 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down',
    187: '=', 189: '-'
  };

  // Gecko -> WebKit/IE
  var _funkyKeyCodes = {
    109: 189
  };

  var _shiftedKeys = {
    '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
    '=': '+', '-': '_'
  };

}(jQuery));
