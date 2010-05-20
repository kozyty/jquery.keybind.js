(function($) {

  $.fn.extend({
    keybind: function(seq, handler) {
      var data = this.data('keybind');

      if (!data) {
        data = { bindings: [] };
        this.data('keybind', data)
            .bind({ keypress: keypressHandler,
                    keydown:  keydownHandler,
                    keyup:    keyupHandler });
      }

      data.bindings.push(handler);

      return this;
    },

    keyunbind: function(seq, handler) {
      return this;
    }
  });

  function keypressHandler(event) {
    var data = $(this).data('keybind');
    $.each(data.bindings, function(i, fn) {
      fn({chord:'a'}, event);
    });
    return false;
  }

  function keydownHandler(event) {
  }

  function keyupHandler(event) {
  }

}(jQuery));
