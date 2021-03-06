$(function() {
  var focusedClass = 'keyboard-focused',
      defaultScrollSpeed = 200,
      prefixKeysPressed = {},
      prefixShortcutTimeout = 1100,
      shortcutKeys = {
        97:  'a',
        114: 'r',
        117: 'u',
        91:  '[',
        93:  ']'
      };

  $(document).on('keypress', function(event) {
    if ($(event.target).is(':input')) {
      return;
    }

    if (!($.isEmptyObject(prefixKeysPressed))) {
      event.preventDefault();
      handlePrefixedShortcuts(event.which);
      return;
    }

    resetPrefixKeys();
    switch (event.which) {
      case 106: // j
        focusNextFocusable();
        scrollToFocused();
        event.preventDefault();
        break;

      case 107: // k
        focusPreviousFocusable();
        scrollToFocused();
        event.preventDefault();
        break;

      case 120: // x
        switchSnapshotDiffTab();
        event.preventDefault();
        break;

      case 13:  // Enter
      case 111: // o
        openFocused();
        event.preventDefault();
        break;

      case 63:  // ?
        openHelpModal();
        event.preventDefault();
        break;

      case 71:  // G
        scrollAndFocusBottom();
        event.preventDefault();
        break;

      case 103:  // g prefix
        setPrefixKey(event.which);
        event.preventDefault();
        break;

      default: // check for shortcut keys
        if (handleShortcutKey(event.which)) {
          event.preventDefault();
        }
    }

    // Handlers for shortcuts:

    function scrollAndFocusTop() {
      $('html, body').animate({ scrollTop: 0 }, defaultScrollSpeed);
      moveFocus({ first: true });
    }

    function scrollAndFocusBottom() {
       $('html, body').animate({ scrollTop: $(document).height() },
          defaultScrollSpeed);
       moveFocus({ last: true });
    }

    function focusNextFocusable() {
      moveFocus({ forward: true });
    }

    function focusPreviousFocusable() {
      moveFocus({ backward: true });
    }

    function handlePrefixedShortcuts(keyCode) {
      resetPrefixKeys();
      // handle different prefixes with diff. shortcuts
      if(keyCode == 103) {
        switch (keyCode) {
          case 103: // g
            scrollAndFocusTop();
            break;

          default: // ignore if it wasn't a prefixed shortcut
            resetPrefixKeys();
        }
      }
    }

    function handleShortcutKey(keyCode) {
      var key = shortcutKeys[keyCode];
      if (key) {
        var $shortcut = $('[data-keyboard-shortcut="' + key + '"]')
              .addClass(focusedClass);
        if ($shortcut.length) {
          $shortcut[0].click();
          scrollToFocused();
          return true;
        }
      }
    }

    // @param movement [Object] options hash allows either forward, backward,
    //   first or last to set movement type
    // @param $scope [$Object] jQuery element within which to search for
    //   focused element(s)
    // @return [$Object] jQuery element that is focused
    function findAndSetFocus(movement, $scope) {
      var $focused   = $scope.filter('.' + focusedClass);
      if (!($focused.length)) {
        var whereToFocus = (movement.first || movement.forward) ? 'first' : 'last';
        setFocus(whereToFocus);
        $focused   = $scope.filter('.' + focusedClass);
      }
      return $focused;
    }

    // @param movement [Object] options hash allows either forward, backward,
    //   first or last to set movement type
    // @return [Boolean] true if movement was successful, false otherwise
    function moveFocus(movement) {
      var $focusable = $('[data-keyboard-focusable]:visible'),
          $focused   = findAndSetFocus(movement, $focusable);
      if ($focused.length) {
        if (movement.first || movement.last) {
          var $nextFocus = (movement.first) ? $focusable.first() : $focusable.last();
          $focused.removeClass(focusedClass);
          $nextFocus.addClass(focusedClass);
          return true;
        } else {
          var dir     = (movement.forward) ? 1 : -1,
              moveTo  = $focusable.index($focused) + dir;
          if (moveTo >= 0 && moveTo < $focusable.length) {
            $focused.removeClass(focusedClass);
            $focusable.eq(moveTo).addClass(focusedClass);
            return true;
          }
        }
      }
      return false;
    }

    function openFocused() {
      var $focused = $('[data-keyboard-focusable]:visible.' + focusedClass);
      if ($focused.is('a')) {
        $focused[0].click();
      } else {
        var $link = $focused.find('a:visible:first');
        if ($link.length) {
          $link[0].click();
        }
      }
    }

    function openHelpModal() {
      $('.keyboard-shortcut-help').modal('toggle');
    }

    function resetPrefixKeys() {
      prefixKeysPressed = {};
    }

    function scrollToFocused() {
      var $focused = $('.' + focusedClass);
      if ($focused.length && !$focused.visible()) {
        $('html, body').stop(true, true).animate({
          scrollTop: $focused.offset().top - $(window).height() / 4
        }, defaultScrollSpeed);
      }
    }

    function setPrefixKey(key) {
      if (key) {
        prefixKeysPressed[key] = 1;
        setTimeout(resetPrefixKeys, prefixShortcutTimeout);
      }
    }

    // @param whereToFocus [String] either 'first' or 'last'; used to select
    //   focusable element
    function setFocus(whereToFocus){
      $('[data-keyboard-focusable]:visible:' + whereToFocus)
        .addClass(focusedClass);
    }

    function switchSnapshotDiffTab() {
      var tabSelector = '.snapshot-diff-image .nav li'
          $active = $(tabSelector + '.active'),
          $next   = $active.next();
      if (!$next.length) {
        $next = $(tabSelector + ':first');
      }
      $next.find('a').click();
    }
  });
});
