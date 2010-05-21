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

      handlers = data.bindings[seq];
      if (handlers)
        handlers.push(handler);
      else
        data.bindings[seq] = [handler];

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
        key  = { chord: eventChord(event.charCode || event.keyCode, event) };

    if (!shouldTriggerOnKeydown(event))
      triggerHandlers(data.bindings, key, event);

    return false;
  }

  function keydownHandler(event) {
    if (!shouldTriggerOnKeydown(event))
      return;

    var data = $(this).data('keybind'),
        key  = { chord: eventChord(event.keyCode, event) };

    triggerHandlers(data.bindings, key, event);
    return false;
  }

  function keyupHandler(event) {
  }

  function eventChord(key, event) {
    return _specialKeys[key] || String.fromCharCode(key);
  }

  function triggerHandlers(bindings, key, event) {
    var handlers = bindings[key.chord];
    if (handlers !== undefined)
      $.each(handlers, function(i, fn) { fn(key, event); });
  }

  function shouldTriggerOnKeydown(event) {
    return event.keyCode === 27;
  }

  var _specialKeys = {
    13: 'Enter', 27: 'Esc'
  };

}(jQuery));
