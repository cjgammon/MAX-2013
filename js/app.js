/*global define $ TimelineMax TweenLite Quad*/
define([], function (require) {

	var App,
		UserEvent = require('events/UserEvent'),
		SystemEvent = require('events/SystemEvent'),
		instance,
		_WIDTH = $(window).width(),
		_SPEED = 0.3;

	App = function () {
		instance = this;

		this.currentSection = -1;

		this.transitioning = false;
		this.slides = [];
		this.timeline = new TimelineMax();
		this.timeline.pause();
		this.duration = 0;

		this.init();
		this.addEvents();
	}

	App.prototype = {
		init: function () {
			var tweens = [],
				timestamp = 0;

			$('section').each(function () {
				var $this = $(this),
					transitionIn,
					transitionOut,
					startIn;

				instance.timeline.addCallback(instance.loadSlide, timestamp);

				//IN
				transitionIn = TweenLite.fromTo($this, _SPEED, 
					{
						css: {
							x: _WIDTH,
							//scale: 1,
							rotationX: 0,
							opacity: 1,
							z: 0.1
						}
					},
					{
						css: {
							zIndex: 2,
							x: 0,
						},
						ease: Quad.easeIn
					}
				);
				
				instance.timeline.add(transitionIn, timestamp);
				timestamp += _SPEED;

				//position of the slide resolve
				instance.timeline.addCallback(function () {
					if ($this.find('.focus-link').length > -1) {
						$($this.find('.focus-link')[0]).focus();
					}
				}, timestamp);
				instance.timeline.addLabel($this.attr('id'), timestamp);
				instance.slides.push($this.attr('id'));		//TODO:: use getLabelsArray();

				//OUT
				transitionOut = TweenLite.to($this, _SPEED * 1.5, {
					css: {
						//scale: 0.7,
						rotationX: 60,
						opacity: 0,
						zIndex: 1,
						z: -1000
					},
					ease: Quad.easeOut
				});
				
				instance.timeline.add(transitionOut, timestamp);
				timestamp += _SPEED;
			});
			
			//instance.slides = instance.timeline.getLabelsArray();
			instance.duration = instance.timeline.duration();

			UserEvent.KEY_DOWN.add(this.handle_KEY_DOWN);
			SystemEvent.NEXT.add(this.next);
			SystemEvent.PREVIOUS.add(this.previous);
			SystemEvent.GOTO.add(this.gotoSection);
			
			SystemEvent.GOTO.dispatch(0);
		},

		handle_slide_LOAD: function () {
			var $this = $(this),
				doc = $this[0].contentWindow.document;

			function handle_slide_KEY_DOWN(e) {
				switch (e.keyCode) {
				case 27: //ESC
					if (parent) {
						parent.focus();
					}
					break;
                }
			}

			$(doc).bind('keydown', handle_slide_KEY_DOWN);
		},

		loadSlide: function () {
			var $this,
				$iframe;

			$('section').each(function (i) {
				$this = $(this);
				$iframe = $this.find('iframe');

				if (i !== instance.currentSection) {
					//unload iframe
					$iframe.unbind('load');
					$iframe.attr('src', '');
				} else {
					//load iframe
					$iframe.attr('src', $this.find('iframe').data('src'));
					$iframe.unbind('load');
					$iframe.bind('load', instance.handle_slide_LOAD);
				}
			});
		},

		addEvents: function () {
			document.addEventListener('keydown', function (e) {
				UserEvent.KEY_DOWN.dispatch(e);
			});
	        document.addEventListener('mousedown', function (e) {
				UserEvent.MOUSE_DOWN.dispatch(e);
			});
	        document.addEventListener('mouseup', function (e) {
				UserEvent.MOUSE_UP.dispatch(e);
			});
			document.addEventListener('mousemove', function (e) {
				UserEvent.MOUSE_MOVE.dispatch(e);
			});
	        window.addEventListener("devicemotion", function (e) {
				UserEvent.DEVICE_MOTION.dispatch(e);
			});
	        window.addEventListener("deviceorientation", function (e) {
				UserEvent.DEVICE_ORIENTATION.dispatch(e);
			});
	        document.addEventListener('touchstart', function (e) {
				UserEvent.TOUCH_START.dispatch(e);
			});
	        document.addEventListener('touchend', function (e) {
				UserEvent.TOUCH_END.dispatch(e);
			});
		},

		handle_KEY_DOWN: function (e) {
			//e.preventDefault();
			var character = String.fromCharCode(e.keyCode);
			
			console.log(e.keyCode);
			switch (e.keyCode) {
			case 27:
				instance.closeTyper();
				break;
			case 32:
				SystemEvent.NEXT.dispatch();
				break;
            case 37:
                //LEFT
                SystemEvent.PREVIOUS.dispatch();
        		break;
            case 38:
                //UP
                //SystemEvent.GOTO.dispatch(1);
        		break;
            case 39:
                //RIGHT
                SystemEvent.NEXT.dispatch();
        		break;
            case 13:
                //RETURN
				if (typeof(instance.typerValue) !== 'undefined' && instance.typerValue !== null) {
				    e.preventDefault();	
				    instance.executeTyper();
				}
        		break;
            case 8:
                //DELETE
                e.preventDefault();
                instance.subtractTyper();
        		break;
                //TODO:: letter keys
			}

			if (e.keyCode > 47 && e.keyCode < 58) {
				instance.typing(character);
			}

			if (e.keyCode > 64 && e.keyCode < 91) {
				instance.typing(character);
			}
		},

		typing: function (character) {

			$('#ui').show();
			$('#typing').html($('#typing').html() + character);
			//TODO:: use typing to create list of best match

			instance.updateResults();
		},

		updateResults: function () {
			var i = 0,
				j = 0,
				term,
				found,
				slideNumber,
				slideTitle;
			
			term = $('#typing').html();

			$('#results').html('');

			//numbers
			if (!isNaN(term)) {
				j = 0;
				found = false;
				for (i; i < instance.slides.length; i += 1) {
					term = term.toString();
					slideNumber = i.toString();

					if (slideNumber.search(term) === 0) {
						$('#results').append(i + ': ' + instance.slides[i] + '<br/>');
						if (!found) {
							found = true;
							instance.typerValue = parseFloat(term);
						}
					} else {
						j += 1;
					}
				}

				if (j == instance.slides.length) {
					$('#results').html('');
					instance.typerValue = null;
				}
			}

			//letters
			if (isNaN(term)) {
				j = 0;
				found = false;
				for (i; i < instance.slides.length; i += 1) {

					slideTitle = instance.slides[i].toUpperCase();
					if (slideTitle.search(term) === 0) {
						$('#results').append(term + ': ' + instance.slides[i] + '<br/>');
						if (!found) {
							found = true;
							instance.typerValue = i;
						}
					} else {
						j += 1;
					}
				}

				if (j == instance.slides.length) {
					$('#results').html('');
					instance.typerValue = null;
				}
			}
		},

		subtractTyper: function () {
			var origString,
				newString;

			origString = $('#typing').html();
			newString = origString.substr(0, origString.length - 1);

			$('#typing').html(newString);
			
			if (newString < 1) {
				instance.closeTyper();
			}

			instance.updateResults();
		},

		closeTyper: function () {
			$('#typing').html('');
			$('#ui').hide();
			instance.typerValue = null;
		},

		executeTyper: function () {
			if (instance.typerValue !== null && !isNaN(instance.typerValue)) {
				SystemEvent.GOTO.dispatch(instance.typerValue);
				instance.closeTyper();
			}
		},

		next: function () {
			//instance.currentSection += 1;
			var nextSlide = instance.currentSection + 1;
			instance.gotoSection(nextSlide);
		},

		previous: function () {
			//instance.currentSection = instance.currentSection > 0 ? instance.currentSection - 1: 0;
			var prevSlide = instance.currentSection > 0 ? instance.currentSection - 1: 0;
			instance.gotoSection(prevSlide);
		},

		gotoSection: function (num) {
			var newSlide,
				speed;
			
			if (num !== instance.currentSection && instance.transitioning !== true) {
				instance.timeline.kill();
				
				speed = Math.abs(instance.currentSection - num); //set speed based on distance from current
				instance.timeline.timeScale(speed);								
				
				instance.transitioning = true;
				instance.currentSection = num;
				
				newSlide = instance.slides[instance.currentSection];
				
				instance.timeline.tweenTo(newSlide, {
					ease: Quad.easeInOut, 
					onComplete: function () {
						instance.transitioning = false;
					}
				});	
			}
		}
	}

	return App;
});
