// Some CommonJS require() magics would be nice here. And Screw.Unit's
// spec_helper can't provide something in scope without making it a global.
//
// So in place of namespacing, see the big pile of helpers at the bottom
// of this file ...
Screw.Unit(function() {
  var cbLogger;

  before(function() {
    cbLogger = new CallbackLogger();
  });

  after(function() {
    jQuery(document).keyunbindAll();
  });

  describe('jquery.keybind plugin', function() {
    describe("Creating multiple bindings in one call", function() {
      before(function() {
        jQuery(document).keybind({ 'a': loggingCallback('fnA'),
                                   'b': loggingCallback('fnB') });
      });

      it("attaches each seq->handler pair", function() {
        press('b');
        press('a');
        expect(loggedOrder()).to(equal, ['fnB', 'fnA']);
      });
    });

    describe("One key sequence, multiple bindings", function() {
      var fn1 = loggingCallback('fn1'),
          fn2 = loggingCallback('fn2');

      before(function() {
        jQuery(document).keybind('a', fn1).keybind('a', fn2);
      });

      it("fires all bound handlers, in the order they were bound", function() {
        press('a');
        expect(loggedOrder()).to(equal, ['fn1', 'fn2']);
      });

      it("can unbind a single handler by function", function() {
        jQuery(document).keyunbind('a', fn1);

        press('a');
        expect(loggedOrder()).to(equal, ['fn2']);
      });

      it("can unbind all handlers at once", function() {
        jQuery(document).keyunbind('a');

        press('a');
        expect(loggedOrder()).to(equal, []);
      });
    });

    describe("Cancelling events", function() {
      it("is done by returning false from a handler", function() {
        jQuery(document).keybind('a', returnFalse);

        press('a');
        expect(loggedEvent().isDefaultPrevented()).to(be_true);
        expect(loggedEvent().isPropagationStopped()).to(be_true);
      });

      it("is done even if one of two handlers returns true", function() {
        jQuery(document).keybind('a', returnFalse).keybind('a', returnTrue);

        press('a');
        expect(loggedEvent().isDefaultPrevented()).to(be_true);
        expect(loggedEvent().isPropagationStopped()).to(be_true);
      });

      it("is not done if no handler returns false", function() {
        jQuery(document).keybind('a', returnTrue);

        press('a');
        expect(loggedEvent().isDefaultPrevented()).to(be_false);
        expect(loggedEvent().isPropagationStopped()).to(be_false);
      });
    });

    describe('keyunbindAll', function() {
      it("removes the data attached to the element", function() {
        jQuery(document).keybind('a', returnTrue);
        expect(jQuery(document).data('keybind')).to_not(be_null);

        jQuery(document).keyunbindAll();
        expect(jQuery(document).data('keybind')).to(be_null);
      });

      it("unbinds bound bindings", function() { // english is fun
        jQuery(document).keybind('a', returnTrue);
        press('a');
        expect(loggedCount()).to(equal, 1);

        jQuery(document).keyunbindAll();
        press('a');
        expect(loggedCount()).to(equal, 1);
      });
    });

    describe('portability', function() {
      describe('Lowercase characters', function() {
        before(function() {
          jQuery(document).keybind('a', loggingCallback('a'));
        });

        it("supports WebKit", function() {
          keydown(65, 0, { keyIdentifier: 'U+0041' });
          keypress(65, 97);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'a');
        });

        it("supports Gecko", function() {
          keydown(65, 0);
          keypress(0, 97);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'a');
        });

        it("supports IE", function() {
          keydown(65, undefined);
          keypress(97, undefined);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'a');
        });
      });

      describe('Uppercase characters', function() {
        before(function() {
          jQuery(document).keybind('A', loggingCallback('A'));
        });

        it("supports WebKit", function() {
          keydown(16, 0, { keyIdentifier: 'Shift' });
          keydown(65, 0, { keyIdentifier: 'U+0041',
                           shiftKey: true });
          keypress(65, 65, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A');
        });

        it("supports Gecko", function() {
          keydown(16, 0);
          keydown(65, 0, { shiftKey: true });
          keypress(0, 65, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A');
        });

        it("supports IE", function() {
          keydown(16, undefined, { shiftKey: true });
          keydown(65, undefined, { shiftKey: true });
          keypress(65, undefined, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A');
        });
      });

      describe('C-a', function() {
        before(function() {
          jQuery(document).keybind('C-a', loggingCallback('C-a'));
        });

        it("supports WebKit", function() {
          keydown(17, 0, { keyIdentifier: 'Control' });
          keydown(65, 0, { keyIdentifier: 'U+0041',
                           ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');
        });

        it("supports WebKit on OSX", function() {
          keydown(17, 0, { keyIdentifier: 'Control' });
          keydown(65, 0, { keyIdentifier: 'U+0041',
                           ctrlKey: true });
          keypress(1, 1, { keyIdentifier: 'U+0041',
                           ctrlKey: true });
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');
        });

        it("supports Gecko", function() {
          keydown(17, 0);
          keydown(65, 0, { ctrlKey: true });
          keypress(0, 97, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');
        });

        it("supports IE", function() {
          keydown(17, undefined, { ctrlKey: true });
          keydown(65, undefined, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');
        });
      });

      describe("A-a", function() {
        before(function() {
          jQuery(document).keybind('A-a', loggingCallback('A-a'));
        });

        it("supports WebKit", function() {
          keydown(18, 0, { keyIdentifier: 'Alt' });
          keydown(65, 0, { keyIdentifier: 'U+0041',
                           altKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A-a');
        });

        it("supports Gecko", function() {
          keydown(18, 0);
          keydown(65, 0, { altKey: true });
          keypress(0, 97, { altKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A-a');
        });

        it("supports IE", function() {
          keydown(18, undefined, { altKey: true });
          keydown(65, undefined, { altKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A-a');
        });
      });

      describe("M-a", function() {
        before(function() {
          jQuery(document).keybind('M-a', loggingCallback('M-a'));
        });

        it("supports WebKit", function() {
          keydown(91, 0, { keyIdentifier: 'Meta',
                           metaKey: true });
          keydown(65, 0, { keyIdentifier: 'U+0041',
                           metaKey: true });
          keypress(97, 97, { metaKey: true }); // Only in safari, not chrome

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'M-a');
        });

        it("supports Gecko", function() {
          keydown(224, 0, { metaKey: true });
          keydown(65, 0, { metaKey: true });
          keypress(97, 97, { metaKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'M-a');
        });

        it("can not support IE, which does not support metaKey", function() {
          expect(true).to(be_true);
        });
      });

      describe('C-S-a', function() {
        before(function() {
          jQuery(document).keybind('C-S-a', loggingCallback('C-S-a'));
        });

        it("supports WebKit", function() {
          keydown(16, 0, { keyIdentifier: 'Shift' });
          keydown(17, 0, { keyIdentifier: 'Control',
                           shiftKey: true });
          keydown(65, 0, { keyIdentifier: 'U+0041',
                           ctrlKey: true, shiftKey: true });
          keypress(1, 1, { keyIdentifier: 'U+0041',
                           ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-S-a');
        });

        it("supports Gecko", function() {
          keydown(16, 0);
          keydown(17, 0);
          keydown(65, 0, { ctrlKey: true, shiftKey: true });
          keypress(0, 65, { ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-S-a');
        });

        it("supports IE", function() {
          keydown(17, undefined, { ctrlKey: true });
          keydown(16, undefined, { ctrlKey: true, shiftKey: true });
          keydown(65, undefined, { ctrlKey: true, shiftKey: true });
          keypress(1, undefined, { ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-S-a');
        });
      });

      describe('Enter', function() {
        before(function() {
          jQuery(document).keybind('Enter', loggingCallback('Enter'));
        });

        it("supports WebKit", function() {
          keydown(13, 0, { keyIdentifier: 'Enter' });
          keypress(13, 13, { keyIdentifier: 'Enter' });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Enter');
        });

        it("supports Gecko and IE", function() {
          keydown(13, 0);
          keypress(13, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Enter');
        });
      });

      describe('Esc', function() {
        before(function() {
          jQuery(document).keybind('Esc', loggingCallback('Esc'));
        });

        it("supports WebKit", function() {
          keydown(27, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Esc');
        });

        it("supports Gecko and IE", function() {
          keydown(27, 0);
          keypress(27, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Esc');
        });
      });

      // Chosen because it overlaps with the left arrow key
      describe('%', function() {
        before(function() {
          jQuery(document).keybind('%', loggingCallback('%'));
        });

        it("supports WebKit", function() {
          keydown(16, 0, { keyIdentifier: 'Shift' });
          keydown(53, 0, { keyIdentifier: 'U+0035',
                           shiftKey: true });
          keypress(37, 37, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '%');
        });

        it("supports Gecko", function() {
          keydown(16, 0);
          keydown(53, 0);
          keypress(0, 37, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '%');
        });

        it("supports IE", function() {
          keydown(16, undefined, { shiftKey: true });
          keydown(53, undefined, { shiftKey: true });
          keypress(37, undefined, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '%');
        });
      });

      describe('C-%', function() {
        before(function() {
          jQuery(document).keybind('C-%', loggingCallback('C-%'));
        });

        it("supports WebKit", function() {
          keydown(17, 0, { keyIdentifier: 'Control' });
          keydown(16, 0, { keyIdentifier: 'Shift',
                           ctrlKey: true });
          keydown(53, 0, { keyIdentifier: 'U+0035',
                           ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-%');
        });

        it("supports Gecko", function() {
          keydown(17, 0);
          keydown(16, 0,  { ctrlKey: true });
          keydown(53, 0,  { ctrlKey: true, shiftKey: true });
          keypress(0, 37, { ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-%');
        });

        it("supports IE", function() {
          keydown(17, undefined, { ctrlKey: true });
          keydown(16, undefined, { ctrlKey: true, shiftKey: true });
          keydown(53, undefined, { ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-%');
        });
      });

      describe('-', function() {
        before(function() {
          jQuery(document).keybind('-', loggingCallback('-'));
        });

        it("supports WebKit", function() {
          keydown(189, 0, { keyIdentifier: 'U+00BD' });
          keypress(45, 45);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '-');
        });

        it("supports Gecko", function() {
          keydown(109, 0);
          keypress(0, 45);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '-');
        });

        it("supports IE", function() {
          keydown(189, undefined);
          keypress(45, undefined);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '-');
        });
      });

      describe('_', function() {
        before(function() {
          jQuery(document).keybind('_', loggingCallback('_'));
        });

        it("supports WebKit", function() {
          keydown(16, 0, { keyIdentifier: 'Shift' });
          keydown(189, 0, { keyIdentifier: 'U+00BD', shiftKey: true });
          keypress(95, 95, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '_');
        });

        it("supports Gecko", function() {
          keydown(16, 0);
          keydown(109, 0, { shiftKey: true });
          keypress(0, 95, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '_');
        });

        it("supports IE", function() {
          keydown(16, undefined, { shiftKey: true });
          keydown(189, undefined, { shiftKey: true });
          keypress(95, undefined, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '_');
        });
      });

      describe('C--', function() {
        before(function() {
          jQuery(document).keybind('C--', loggingCallback('C--'));
        });

        it("supports WebKit", function() {
          keydown(17, 0, { keyIdentifier: 'Control' });
          keydown(189, 0, { keyIdentifier: 'U+00BD',
                            ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C--');
        });

        it("supports Gecko", function() {
          keydown(17, 0);
          keydown(109, 0, { ctrlKey: true });
          keypress(0, 45, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C--');
        });

        it("supports IE", function() {
          keydown(17, undefined, { ctrlKey: true });
          keydown(189, undefined, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C--');
        });
      });

      describe('C-_', function() {
        before(function() {
          jQuery(document).keybind('C-_', loggingCallback('C-_'));
        });

        it("supports WebKit", function() {
          keydown(16, 0, { keyIdentifier: 'Shift' });
          keydown(17, 0, { keyIdentifier: 'Control',
                           shiftKey: true });
          keypress(189, 0, { keyIdentifier: 'U+00BD',
                             ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-_');
        });

        it("supports Gecko", function() {
          keydown(17, 0);
          keydown(16, 0, { ctrlKey: true });
          keydown(109, 0, { ctrlKey: true, shiftKey: true });
          keypress(0, 95, { ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-_');
        });

        it("supports IE", function() {
          keydown(17, undefined, { ctrlKey: true });
          keydown(16, undefined, { ctrlKey: true, shiftKey: true });
          keydown(189, undefined, { ctrlKey: true, shiftKey: true });
          keypress(31, undefined, { ctrlKey: true, shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-_');
        });
      });

      describe('=', function() {
        before(function() {
          jQuery(document).keybind('=', loggingCallback('='));
        });

        it("supports WebKit", function() {
          keydown(187, 0, { keyIdentifier: 'U+00BB' });
          keypress(61, 61);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '=');
        });

        it("supports Gecko", function() {
          keydown(61, 0);
          keypress(0, 61);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '=');
        });

        it("supports IE", function() {
          keydown(187, undefined);
          keydown(61, undefined);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '=');
        });
      });

      describe('C-=', function() {
        before(function() {
          jQuery(document).keybind('C-=', loggingCallback('C-='));
        });

        it("supports WebKit", function() {
          keydown(17, 0, { keyIdentifier: 'Control' });
          keydown(187, 0, { keyIdentifier: 'U+00BB', ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-=');
        });

        it("supports Gecko", function() {
          keydown(17, 0);
          keydown(61, 0, { ctrlKey: true });
          keypress(0, 61, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-=');
        });

        it("supports IE", function() {
          keydown(17, undefined, { ctrlKey: true });
          keydown(187, undefined, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-=');
        });
      });

      describe('+', function() {
      });

      describe('C-+', function() {
      });

      describe('Left', function() {
        before(function() {
          jQuery(document).keybind('Left', loggingCallback('Left'));
        });

        it("supports WebKit", function() {
          keydown(37, 0, { keyIdentifier: 'Left' });
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Left');
        });

        it("supports Gecko", function() {
          keydown(37, 0);
          keypress(37, 0);
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Left');
        });

        it("supports IE", function() {
          keydown(37, undefined);
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Left');
        });
      });

      describe('C-Left', function() {
      });

      describe('S-Left', function() {
      });

    });
  });

  //// Testable callbacks

  function loggingCallback(name) {
    return function(key, event) { cbLogger.log(name, key, event); };
  }

  function returnTrue(key, event) {
    cbLogger.log('returnTrue', key, event);
    return true;
  }

  function returnFalse(key, event) {
    cbLogger.log('returnFalse', key, event);
    return false;
  }

  function loggedOrder()   { return cbLogger.order; }
  function loggedEvent()   { return cbLogger.event; }
  function loggedKey()     { return cbLogger.key; }
  function loggedKeyName() { return cbLogger.key.chord; }
  function loggedCount()   { return cbLogger.count; }

  //// Event generation

  function press(singleChar) {
    var keyCode  = singleChar.toUpperCase().charCodeAt(0),
        charCode = singleChar.charCodeAt(0);

    // Acts like Gecko.
    keydown(keyCode, 0);
    keypress(0, charCode);
  }

  var CallbackLogger = function() {
    this.reset();
  };

  CallbackLogger.prototype.reset = function() {
    this.order = [];
    this.key   = null;
    this.event = null;
    this.count = 0;
  };

  CallbackLogger.prototype.log = function(name, key, event) {
    this.order.push(name);
    this.key   = key;
    this.event = event;
    this.count += 1;
  };

  function keypress(keyCode, charCode, props) {
    triggerEvent('keypress', keyCode, charCode, props);
  }

  function keydown(keyCode, charCode, props) {
    triggerEvent('keydown', keyCode, charCode, props);
  }

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
});
