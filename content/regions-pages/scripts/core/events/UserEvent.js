/*global define signals*/
define([], function () {
		
		var UserEvent = {
            KEY_DOWN: new signals.Signal(),
            KEY_UP: new signals.Signal(),
            MOUSE_MOVE: new signals.Signal(),
            RESIZE: new signals.Signal(),
            SCROLL: new signals.Signal(),
            NEXT: new signals.Signal(),
            PREVIOUS: new signals.Signal(),
            NEXT_PAGE: new signals.Signal(),
            PREVIOUS_PAGE: new signals.Signal(),
            GOTO: new signals.Signal(),
            STATE_CHANGE: new signals.Signal(),
            TRANSITION_COMPLETE: new signals.Signal(),
            TOGGLE_PAGINATION: new signals.Signal(),
            ARROWS: new signals.Signal()
        };

		return UserEvent;
    });
