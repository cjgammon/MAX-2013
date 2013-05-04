/*global define*/
define([], function (require) {

    var UserEvent = require('core/events/UserEvent'),
        InView,
        instance,
        $activeSection;

    InView = function () {
        instance = this;
        instance.init = function () {
            UserEvent.SCROLL.add(handle_SCROLL);
        }
    };

    function inviewAnimations() {
        $activeSection.find('.js-animates').each(function () {
            var $this = $(this);

            if ($this.offset().top < $(window).height() - $this.height() / 2 
                && $this.offset().top + $this.height() > 0) 
            {
                if (!$this.hasClass('in')){
                    $this.addClass('in');
                }
            } else {
                if ($this.hasClass('in')){
                    $this.removeClass('in');
                }
            }
        });
    }

    function parallaxAnimations() {
        $activeSection.find('.js-parallax').each(function () {
            var $this = $(this);
            $this.css('background-position', '50% ' + $activeSection.scrollTop() / 2 + 'px');
        });
    }

    //TODO throttle?
    function handle_SCROLL() {
        $activeSection = $('section.active');
        //console.log('scroll', $activeSection);
        
        inviewAnimations();
        parallaxAnimations();
    }

    return new InView();
})
