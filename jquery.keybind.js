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
        desc = keyDescription(event),
        retVal = true;

    if ((event.charCode >= 37 && event.charCode <= 40) ||
        !shouldTriggerOnKeydown(desc, event))
      retVal = triggerHandlers(data.bindings, desc, event);

    return retVal;
  }

  function keydownHandler(event) {
    var data = $(this).data('keybind'),
        desc = keyDescription(event);

    if (!shouldTriggerOnKeydown(desc, event))
      return;

    return triggerHandlers(data.bindings, desc, event);
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

  function triggerHandlers(bindings, desc, event) {
    var handlers = bindings[desc.chord],
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
    return desc.modified || event.keyCode in _specialKeys;
  }

  function keyDescription(event) {
    var desc = {},
        mods = '',
        key;

    if (event.ctrlKey) {
      mods += 'C-';
      desc.modified = desc.ctrl = true;
    }
    if (event.altKey) {
      mods += 'A-';
      desc.modified = desc.alt = true;
    }
    if (event.originalEvent.metaKey) {
      mods += 'M-';
      desc.modified = desc.meta = true;
    }

    if (event.type === 'keydown') {
      key = _specialKeys[event.keyCode] || String.fromCharCode(event.keyCode).toLowerCase();
    } else if (event.type === 'keypress') {
      key = String.fromCharCode(event.charCode || event.keyCode);
    } else
      throw("could prolly support keyup but i don't atm");

    desc.chord = mods + key;

    return desc;
  }

  var _specialKeys = {
    13: 'Enter', 27: 'Esc', 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down'
  };

}(jQuery));
