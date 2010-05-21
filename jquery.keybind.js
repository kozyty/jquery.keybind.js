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
      return this;
    }
  });

  function keypressHandler(event) {
    var data = $(this).data('keybind'),
        key  = { chord: String.fromCharCode(event.charCode) };

    if (data.bindings[key.chord] !== undefined)
      $.each(data.bindings[key.chord], function(i, fn) { fn(key, event); });

    return false;
  }

  function keydownHandler(event) {
  }

  function keyupHandler(event) {
  }

}(jQuery));
