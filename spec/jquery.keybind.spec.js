Screw.Unit(function() {
  describe('jquery.keybind plugin', function() {
    var cbLogger;

    before(function() {
      cbLogger = new CallbackLogger();
    });

    // Returns a callback which can track callback order by name.
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

    after(function() {
      jQuery(document).keyunbindAll();
    });

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
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041' });
          triggerEvent('keypress', 65, 97);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'a');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 65, 0);
          triggerEvent('keypress', 0, 97);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'a');
        });

        it("supports IE", function() {
          triggerEvent('keydown', 65, 0);
          triggerEvent('keypress', 97, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'a');
        });
      });

      describe('Modifiers on lowercase characters', function() {
        before(function() {
          jQuery(document).keybind('C-a', loggingCallback('C-a'));
          jQuery(document).keybind('A-a', loggingCallback('A-a'));
          jQuery(document).keybind('M-a', loggingCallback('M-a'));

          // eh? i need S-Left, but not S-a, which is A. so ...
          jQuery(document).keybind('S-a', loggingCallback('S-a'));
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 17, 0, { keyIdentifier: 'Control' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');

          cbLogger.reset();
          triggerEvent('keydown', 18, 0, { keyIdentifier: 'Alt' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           altKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A-a');

          cbLogger.reset();
          triggerEvent('keydown', 91, 0, { keyIdentifier: 'Meta',
                                           metaKey: true });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           metaKey: true });
          triggerEvent('keypress', 97, 97, { metaKey: true }); // Only in safari, not chrome

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'M-a');
        });

        it("supports WebKit on OSX oddities", function() {
          // I get a meaningless keypress event on Safari WebKit 530.17 and Chrome WebKit 533.4
          triggerEvent('keydown', 17, 0, { keyIdentifier: 'Control' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           ctrlKey: true });
          triggerEvent('keypress', 1, 1, { keyIdentifier: 'U+0041',
                                           ctrlKey: true });
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 17, 0);
          triggerEvent('keydown', 65, 0, { ctrlKey: true });
          triggerEvent('keypress', 0, 97, { ctrlKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'C-a');

          cbLogger.reset();
          triggerEvent('keydown', 18, 0);
          triggerEvent('keydown', 65, 0, { altKey: true });
          triggerEvent('keypress', 0, 97, { altKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A-a');

          cbLogger.reset();
          triggerEvent('keydown', 224, 0, { metaKey: true });
          triggerEvent('keydown', 65, 0, { metaKey: true });
          triggerEvent('keypress', 97, 97, { metaKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'M-a');
        });

        it("supports IE", function() {
          expect('not failing').to(equal, 'implement me please');
        });
      });

      describe('Uppercase characters', function() {
        before(function() {
          jQuery(document).keybind('A', loggingCallback('A'));
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 16, 0, { keyIdentifier: 'Shift' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           shiftKey: true });
          triggerEvent('keypress', 65, 65, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 16, 0);
          triggerEvent('keydown', 65, 0, { shiftKey: true });
          triggerEvent('keypress', 0, 65, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A');
        });

        it("supports IE", function() {
          triggerEvent('keydown', 16, 0);
          triggerEvent('keydown', 65, 0, { shiftKey: true });
          triggerEvent('keypress', 65, 0, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'A');
        });
      });

      describe('Enter', function() {
        before(function() {
          jQuery(document).keybind('Enter', loggingCallback('Enter'));
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 13, 0, { keyIdentifier: 'Enter' });
          triggerEvent('keypress', 13, 13, { keyIdentifier: 'Enter' });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Enter');
        });

        it("supports Gecko and IE", function() {
          triggerEvent('keydown', 13, 0);
          triggerEvent('keypress', 13, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Enter');
        });
      });

      describe('Esc', function() {
        before(function() {
          jQuery(document).keybind('Esc', loggingCallback('Esc'));
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 27, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Esc');
        });

        it("supports Gecko and IE", function() {
          triggerEvent('keydown', 27, 0);
          triggerEvent('keypress', 27, 0);

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Esc');
        });
      });

      describe('Arrow keys', function() {
        before(function() {
          jQuery(document).keybind('Left', loggingCallback('Left'));
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 37, 0, { keyIdentifier: 'Left' });
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Left');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 37, 0);
          triggerEvent('keypress', 37, 0);
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Left');
        });

        it("supports IE", function() {
          triggerEvent('keydown', 37, 0);
          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, 'Left');
        });

        it("does not confuse arrow keys with punctuation", function() {
          jQuery(document).keybind('%', loggingCallback('%'));

          // a la WebKit
          triggerEvent('keydown', 16, 0, { keyIdentifier: 'Shift' });
          triggerEvent('keydown', 53, 0, { keyIdentifier: 'U+0035',
                                           shiftKey: true });
          triggerEvent('keypress', 37, 37, { shiftKey: true });

          expect(loggedCount()).to(equal, 1);
          expect(loggedKeyName()).to(equal, '%');
        });
      });

    });
  });

  function press(singleChar) {
    var keyCode  = singleChar.toUpperCase().charCodeAt(0),
        charCode = singleChar.charCodeAt(0);

    // Makes it look like Gecko. This isn't meant to be used when
    // testing portability.
    triggerEvent('keydown', keyCode, 0);
    triggerEvent('keypress', 0, charCode);
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

});
