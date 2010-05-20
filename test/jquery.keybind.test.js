module('jquery.keybind');

// Maybe better to organize as closure does, by browser.
// We'll see.

test('Lowercase characters', function() {
  var key, event;

  jQuery(document).keybind('a', function(k, e) {
    key = k;
    event = e;
  });

  // WebKit 533.2
  fireEvent('keydown', 65, 0);
  fireEvent('keypress', 65, 97);
  equals(key.chord, 'a');

  // Firefox/Namoroka 3.6.3
  fireEvent('keydown', 65, 0);
  fireEvent('keypress', 0, 97);
  equals(key.chord, 'a');
});

test('Uppercase characters', function() {
  var key, event;

  jQuery(document).keybind('A', function(k, e) {
    key = k;
    event = e;
  });

  // WebKit 533.2
  fireEvent('keydown', 16, 0, { keyIdentifier: 'Shift' });
  fireEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                shiftKey: true });
  fireEvent('keypress', 65, 65, { shiftKey: true });
  equals(key.chord, 'A');

  // Firefox/Namoroka 3.6.3
  fireEvent('keydown', 16, 0);
  fireEvent('keydown', 65, 0, { shiftKey: true });
  fireEvent('keypress', 0, 65, { shiftKey: true });
  equals(key.chord, 'A');
});

function fireEvent(type, keyCode, charCode, props) {
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
