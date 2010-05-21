module('Features');

test("One key sequence, multiple bindings", function() {
  var fired = [],
      fnA = function() { fired.push('fnA'); },
      fnB = function() { fired.push('fnB'); };

  jQuery(document).keybind('a', fnA).keybind('a', fnB);

  // shouldn't have to use this interface to trigger events at this
  // level, but no better solution atm
  triggerEvent('keydown', 65, 0);
  triggerEvent('keypress', 65, 97);
  same(fired, ['fnA', 'fnB'], "Fires all bound handlers, in order");

  fired = [];
  jQuery(document).keyunbind('a', fnA);
  triggerEvent('keydown', 65, 0);
  triggerEvent('keypress', 65, 97);
  same(fired, ['fnB'], "Can unbind a single handler by function");

  fired = [];
  jQuery(document).keybind('a', fnB).keyunbind('a');
  triggerEvent('keydown', 65, 0);
  triggerEvent('keypress', 65, 97);
  same(fired, [], "Can unbind all handlers for a sequence at once");
});

module('Portability');

// Maybe better to organize as closure does, by browser.
// We'll see.

test('Lowercase characters', function() {
  var key, event, cnt = 0;

  jQuery(document).keybind('a', function(k, e) {
    cnt++;
    key = k;
    event = e;
  });

  // WebKit 533.2
  triggerEvent('keydown', 65, 0);
  triggerEvent('keypress', 65, 97);
  equals(cnt, 1, "Only triggers once");
  equals(key.chord, 'a', 'WebKit');

  // Firefox/Namoroka 3.6.3
  cnt = 0;
  triggerEvent('keydown', 65, 0);
  triggerEvent('keypress', 0, 97);
  equals(cnt, 1, "Only triggers once");
  equals(key.chord, 'a', 'Gecko');
});

test('Uppercase characters', function() {
  var key, event, cnt = 0;

  jQuery(document).keybind('A', function(k, e) {
    cnt++;
    key = k;
    event = e;
  });

  // WebKit 533.2
  triggerEvent('keydown', 16, 0, { keyIdentifier: 'Shift' });
  triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                   shiftKey: true });
  triggerEvent('keypress', 65, 65, { shiftKey: true });
  equals(cnt, 1, "Only triggers once");
  equals(key.chord, 'A', 'WebKit');

  // Firefox/Namoroka 3.6.3
  cnt = 0;
  triggerEvent('keydown', 16, 0);
  triggerEvent('keydown', 65, 0, { shiftKey: true });
  triggerEvent('keypress', 0, 65, { shiftKey: true });
  equals(cnt, 1, "Only triggers once");
  equals(key.chord, 'A', 'Gecko');
});

function triggerEvent(type, keyCode, charCode, props) {
  var event = mockEvent(type, keyCode, charCode, props);
  jQuery(document).trigger(event);
}

function mockEvent(type, keyCode, charCode, props) {
  var event = { type:          type,
                keyCode:       keyCode,
                charCode:      charCode,
                keyIdentifier: undefined,
                keyLocation:   undefined,
                shiftKey:      false,
                ctrlKey:       false,
                altKey:        false,
                metaKey:       false,
                timeStamp:     (new Date()).getTime() };

  // keyLocation is 0 in most cases when using keyIdentifier,
  // so default to that any time keyIdentifier is set
  props = props || {};
  if (props.keyIdentifier && props.keyLocation === undefined)
    event.keyLocation = 0;

  // Pass the event through jQuery's "fixer", which attempts to
  // normalize values, but also ends up stripping properties like
  // keyIdentifier. Make sure the tests exercise realistic cases.
  return jQuery.event.fix($.extend(event, props));
}
