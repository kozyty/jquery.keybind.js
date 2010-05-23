Screw.Unit(function() {
  describe('jquery.keybind plugin', function() {

    after(function() {
      jQuery(document).keyunbindAll();
    });

    describe("Creating multiple bindings in one call", function() {
      var fired,
          fnA = function() { fired.push('fnA'); },
          fnB = function() { fired.push('fnB'); };

      before(function() {
        fired = [];
        jQuery(document).keybind({ 'a': fnA, 'b': fnB });
      });

      it("attaches each seq->handler pair", function() {
        triggerEvent('keydown', 66, 0);
        triggerEvent('keypress', 66, 98);
        triggerEvent('keydown', 65, 0);
        triggerEvent('keypress', 65, 97);

        expect(fired).to(equal, ['fnB', 'fnA']);
      });
    });

    describe("One key sequence, multiple bindings", function() {
      var fired,
          fnA = function() { fired.push('fnA'); },
          fnB = function() { fired.push('fnB'); };

      function pressA() {
        triggerEvent('keydown', 65, 0);
        triggerEvent('keypress', 65, 97);
      }

      before(function() {
        fired = [];
        jQuery(document).keybind('a', fnA).keybind('a', fnB);
      });

      it("fires all bound handlers, in the order they were bound", function() {
        pressA();
        expect(fired).to(equal, ['fnA', 'fnB']);
      });

      it("can unbind a single handler by function", function() {
        jQuery(document).keyunbind('a', fnA);
        pressA();

        expect(fired).to(equal, ['fnB']);
      });

      it("can unbind all handlers at once", function() {
        jQuery(document).keyunbind('a');
        pressA();

        expect(fired).to(equal, []);
      });
    });

    describe("Cancelling events", function() {
      var event,
          returnTrue  = function(k, e) { event = e; return true; },
          returnFalse = function(k, e) { event = e; return false; };

      it("is done by returning false from a handler", function() {
        jQuery(document).keybind('a', returnFalse);
        triggerEvent('keydown', 65, 0);
        triggerEvent('keypress', 65, 97);

        expect(event.isDefaultPrevented()).to(be_true);
        expect(event.isPropagationStopped()).to(be_true);
      });

      it("is done even if one of two handlers returns true", function() {
        jQuery(document).keybind('a', returnFalse).keybind('a', returnTrue);
        triggerEvent('keydown', 65, 0);
        triggerEvent('keypress', 65, 97);

        expect(event.isDefaultPrevented()).to(be_true);
        expect(event.isPropagationStopped()).to(be_true);
      });

      it("is not done if no handler returns false", function() {
        jQuery(document).keybind('a', returnTrue);
        triggerEvent('keydown', 65, 0);
        triggerEvent('keypress', 65, 97);

        expect(event.isDefaultPrevented()).to(be_false);
        expect(event.isPropagationStopped()).to(be_false);
      });
    });

    describe('keyunbindAll', function() {
      it("removes the data attached to the element", function() {
        jQuery(document).keybind('a', function() {});
        expect(jQuery(document).data('keybind')).to_not(be_null);

        jQuery(document).keyunbindAll();
        expect(jQuery(document).data('keybind')).to(be_null);
      });

      it("unbinds the internal event listeners from the element", function() {
        jQuery(document).keybind('a', function() {});
        expect(jQuery(document).data('events')).to_not(be_null);
        // ^-- shady? relies on me knowing the guts of jQuery and how
        // it stores its knowledge of dom listeners.

        jQuery(document).keyunbindAll();
        expect(jQuery(document).data('events')).to(be_null);
      });
    });

    describe('portability', function() {
      describe('Lowercase characters', function() {
        var key, event, count;

        before(function() {
          count = 0;
          jQuery(document).keybind('a', function(k, e) {
            key = k;
            event = e;
            count++;
          });
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041' });
          triggerEvent('keypress', 65, 97);

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'a');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 65, 0);
          triggerEvent('keypress', 0, 97);

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'a');
        });

        it("supports IE", function() {
          triggerEvent('keydown', 65, 0);
          triggerEvent('keypress', 97, 0);

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'a');
        });
      });

      describe('Modifiers on lowercase characters', function() {
        var key, event, count;

        before(function() {
          count = 0;

          jQuery(document).keybind('C-a', function(k, e) {
            key = k;
            event = e;
            count++;
          });

          jQuery(document).keybind('A-a', function(k, e) {
            key = k;
            event = e;
            count++;
          });

          jQuery(document).keybind('M-a', function(k, e) {
            key = k;
            event = e;
            count++;
          });

          // eh? i need S-Left, but not S-a, which is A. so ...
          jQuery(document).keybind('S-a', function(k, e) {
            key = k;
            event = e;
            count++;
          });
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 17, 0, { keyIdentifier: 'Control' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           ctrlKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'C-a');

          count = 0;
          triggerEvent('keydown', 18, 0, { keyIdentifier: 'Alt' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           altKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'A-a');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 17, 0);
          triggerEvent('keydown', 65, 0, { ctrlKey: true });
          triggerEvent('keypress', 0, 97, { ctrlKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'C-a');

          triggerEvent('keydown', 18, 0);
          triggerEvent('keydown', 65, 0, { altKey: true });
          triggerEvent('keypress', 0, 97, { altKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'A-a');
        });

        it("supports IE", function() {
          expect('not failing').to(equal, 'implement me please');
        });
      });

      describe('Uppercase characters', function() {
        var key, event, count;

        before(function() {
          count = 0;
          jQuery(document).keybind('A', function(k, e) {
            key = k;
            event = e;
            count++;
          });
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 16, 0, { keyIdentifier: 'Shift' });
          triggerEvent('keydown', 65, 0, { keyIdentifier: 'U+0041',
                                           shiftKey: true });
          triggerEvent('keypress', 65, 65, { shiftKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'A');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 16, 0);
          triggerEvent('keydown', 65, 0, { shiftKey: true });
          triggerEvent('keypress', 0, 65, { shiftKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'A');
        });

        it("supports IE", function() {
          triggerEvent('keydown', 16, 0);
          triggerEvent('keydown', 65, 0, { shiftKey: true });
          triggerEvent('keypress', 65, 0, { shiftKey: true });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'A');
        });
      });

      describe('Enter', function() {
        var key, event, count;

        before(function() {
          count = 0;
          jQuery(document).keybind('Enter', function(k, e) {
            key = k;
            event = e;
            count++;
          });
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 13, 0, { keyIdentifier: 'Enter' });
          triggerEvent('keypress', 13, 13, { keyIdentifier: 'Enter' });

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Enter');
        });

        it("supports Gecko and IE", function() {
          triggerEvent('keydown', 13, 0);
          triggerEvent('keypress', 13, 0);

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Enter');
        });
      });

      describe('Esc', function() {
        var key, event, count;

        before(function() {
          count = 0;
          jQuery(document).keybind('Esc', function(k, e) {
            key = k;
            event = e;
            count++;
          });
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 27, 0);

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Esc');
        });

        it("supports Gecko and IE", function() {
          triggerEvent('keydown', 27, 0);
          triggerEvent('keypress', 27, 0);

          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Esc');
        });
      });

      describe('Arrow keys', function() {
        var key, event, count,
            handler = function(k, e) {
              count++;
              key = k;
              event = e;
            };

        before(function() {
          count = 0;
          key = event = null;
          jQuery(document).keybind('Left', handler);
        });

        it("supports WebKit", function() {
          triggerEvent('keydown', 37, 0, { keyIdentifier: 'Left' });
          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Left');
        });

        it("supports Gecko", function() {
          triggerEvent('keydown', 37, 0);
          triggerEvent('keypress', 37, 0);
          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Left');
        });

        it("supports IE", function() {
          triggerEvent('keydown', 37, 0);
          expect(count).to(equal, 1);
          expect(key.chord).to(equal, 'Left');
        });

        it("does not confuse arrow keys with punctuation", function() {
          jQuery(document).keybind('%', function(k, e) {
            count++;
            key = k;
            event = e;
          });

          // a la WebKit
          triggerEvent('keydown', 16, 0, { keyIdentifier: 'Shift' });
          triggerEvent('keydown', 53, 0, { keyIdentifier: 'U+0035',
                                           shiftKey: true });
          triggerEvent('keypress', 37, 37, { shiftKey: true });
          expect(count).to(equal, 1);
          expect(key.chord).to(equal, '%');
        });
      });

    });
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

});
