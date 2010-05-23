(function($) {
  $.fn.extend({
    keybind: function(seq, handler) {
      var data = this.data('keybind'),
          handlers;

      if (!data) {
        data = { bindings: {} };
        this.data('keybind', data)
            .bind({ keypress: keypressHandler,
                    keydown:  keydownHandler,
                    keyup:    keyupHandler });
      }

      if (typeof seq === "object")
        $.each(seq, function(s, h) { attachBinding(data.bindings, s, h); });
      else
        attachBinding(data.bindings, seq, handler);

      return this;
    },

    keyunbind: function(seq, handler) {
      var data = this.data('keybind'),
          handlers = data.bindings[seq];

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
                       keydown:  keydownHandler,
                       keyup:    keyupHandler });
      return this;
    }
  });

  function keypressHandler(event) {
    var data = $(this).data('keybind'),
        key  = keyDescription(event),
        retVal = true;

    if ((event.charCode >= 37 && event.charCode <= 40) ||
        !shouldTriggerOnKeydown(event))
      retVal = triggerHandlers(data.bindings, key, event);

    return retVal;
  }

  function keydownHandler(event) {
    if (!shouldTriggerOnKeydown(event))
      return;

    var data = $(this).data('keybind'),
        key  = keyDescription(event);

    return triggerHandlers(data.bindings, key, event);
  }

  function keyupHandler(event) {
  }

  function attachBinding(bindings, seq, handler) {
    var handlers = bindings[seq];
    if (handlers)
      handlers.push(handler)
    else
      bindings[seq] = [handler];
  }

  function keyDescription(event) {
    var mods = '',
        key;

    if (event.ctrlKey)
      mods += 'C-';
    if (event.altKey)
      mods += 'A-';

    if (event.type === 'keydown') {
      key = _specialKeys[event.keyCode] || String.fromCharCode(event.keyCode).toLowerCase();
    } else if (event.type === 'keypress') {
      key = String.fromCharCode(event.charCode || event.keyCode);
    } else
      throw("could prolly support keyup but i don't atm");

    return { chord: mods + key };
  }

  function triggerHandlers(bindings, key, event) {
    var handlers = bindings[key.chord],
        retVal   = true;

    if (handlers === undefined)
      return retVal;

    $.each(handlers, function(i, fn) {
      if (fn(key, event) === false)
        retVal = false;
    });

    return retVal;
  }

  function shouldTriggerOnKeydown(event) {
    return event.keyCode in _specialKeys || event.ctrlKey || event.altKey;
  }

  var _specialKeys = {
    13: 'Enter', 27: 'Esc', 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down'
  };

}(jQuery));
