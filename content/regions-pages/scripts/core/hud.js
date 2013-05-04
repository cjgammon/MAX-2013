/*global define*/
define(['core/events/UserEvent',
        'core/model'], 
        function (
            UserEvent, 
            Model) {

    var instance,
        HUD,
        $menu,
        $menuButton,
        $hitArea,
        $navContent,
        $navScroll,
        $leftFixedButton,
        $rightFixedButton,
        speed = 0,
        mouseDelta = 0,
        MOUSE_POSITIONS = [],
        ANIMATION_DELAY = 510,
        RELEASE_INTERVAL,
        MOVE_INTERVAL;

    HUD = function () {
        instance = this;
        this.isVisible = false;
    };


    /**
     * manage arrow visibility
     */
    function setupArrows(arrow1, arrow2) {
        if (arrow1) {
            $leftFixedButton.addClass('in');
        } else {
            $leftFixedButton.removeClass('in');
        }

        if (arrow2) {
            $rightFixedButton.addClass('in');
        } else {
            $rightFixedButton.removeClass('in');
        }
    };

    /**
     * takes mouse positions and generates avg. speed
     */
    function avgSpeed() {
        var i,
            differences = [],
            sum = 0;

        for (i = 0; i < MOUSE_POSITIONS.length - 1; i += 1 ) {
            differences.push(MOUSE_POSITIONS[i] - MOUSE_POSITIONS[i + 1]);
        }

        for (i = 0; i < differences.length; i += 1) {
            sum += differences[i];            
        }

        return sum / differences.length;
    };

    /**
     * tracks mouse positions when dragging
     */
    function addMousePosition(pageX) {
        MOUSE_POSITIONS.push(pageX - mouseDelta); //track mouse positions
        if (MOUSE_POSITIONS.length > 6) {
            MOUSE_POSITIONS.pop();        
        }
    };

    /**
     * calculates easing
     */
    function releaseInteval_UPDATE() {
        var xPos;

        speed *= 0.8;

        if (Math.round(speed) === 0) {
            clearInterval(RELEASE_INTERVAL);
            speed = 0;
        } else {
            xPos = $navScroll.scrollLeft() + speed;
            $navScroll.scrollLeft(xPos);    
        }
    };

    //EVENT HANDLERS
    
    function handle_menuButton_CLICK(e) {
        instance.showMenu();
    };

    function handle_hitArea_CLICK(e) {
        instance.hideMenu();
    };

    function handle_pageButton_CLICK(e) {
        $pageButton.toggleClass('toggle');
        UserEvent.TOGGLE_PAGINATION.dispatch();
    };

    function handle_navContent_MOUSE_DOWN(e) {
        e.preventDefault();
        
        speed = 1;
        mouseDelta = e.pageX;
        scrollDelta = $navScroll.scrollLeft();
        $navContent.bind('mousemove', handle_navContent_MOUSE_MOVE);

        addMousePosition(e.pageX);
        MOUSE_POSITIONS = [];
        clearInterval(RELEASE_INTERVAL);

        return false;
    };

    function handle_navContent_MOUSE_MOVE(e) {
        e.preventDefault();
        
        var newPos;
        
        addMousePosition(e.pageX);
        newPos = scrollDelta - (e.pageX - mouseDelta);
        newPos = newPos > 0 ? newPos : 0;
        $navScroll.scrollLeft(newPos);

        return false;
    };
    
    function handle_navContent_MOUSE_UP(e) {
        e.preventDefault();
        
        $navContent.unbind('mousemove', handle_navContent_MOUSE_MOVE);
        addMousePosition(e.pageX);
        speed = avgSpeed();

        if (!isNaN(speed) && speed !== 0) {
            RELEASE_INTERVAL = setInterval(releaseInteval_UPDATE, 30);
        }

        return false;
    };

    function handle_navItem_CLICK(e) {
        e.preventDefault();

        if (isNaN(speed) || speed === 0) {
            var id = $(this).data('id');
            $('#articleName').text(Model.articles[id].title);
            UserEvent.GOTO.dispatch(id);
        }

        return false;
    };

    HUD.prototype = {
        
        /**
         * initialize
         **/
        init: function () {
            $menu = $('#menu');
            $menuButton = $('#menuButton');
            $hitArea = $('#menuHitArea');
            $navContent = $('#navContent');
            $navScroll = $('#navScroll');
            $pageButton = $('#pageButton');
            $rightFixedButton = $('#rightFixedButton');
            $leftFixedButton = $('#leftFixedButton');
        
            instance.populateMenu(Model.articles);
            
            $('#articleName').text(Model.articles[0].title);

            if (!Modernizr.regions) {
                //$pageButton.hide();
            }

            $rightFixedButton.bind('click', function () {
                UserEvent.NEXT.dispatch();
            });

            $leftFixedButton.bind('click', function () {
                UserEvent.PREVIOUS.dispatch();
            });

            UserEvent.ARROWS.add(function (a, b) {
                setupArrows(a, b);
            });

            $pageButton.bind('click', handle_pageButton_CLICK);
            $menuButton.bind('click', handle_menuButton_CLICK);
            $hitArea.bind('click', handle_hitArea_CLICK);
            $navContent.bind('mousedown', handle_navContent_MOUSE_DOWN);
            $navContent.bind('mouseup', handle_navContent_MOUSE_UP);
        },

        /**
         * add article thumbs to menu
         */
        populateMenu: function (data) {
            var i,
                containerWidth = 0;

            for (i = 0; i < data.length; i += 1) {
                if(i > 1) {
                    $navItem = $('<div class="nav-item" data-id="' + i + '">');

                    if (data[i].thumb){
                        $navItemImg = $('<img src="' + data[i].thumb + '">');
                        $navItem.append($navItemImg);
                    }

                    $navItemTitle = $('<div class="nav-item-title">');
                    $navItemTitle.text(data[i].title);

                    $navItem.append($navItemTitle);
                    $navContent.append($navItem);

                    containerWidth += 242;
                }
            }
                
            $('.nav-item').bind('click', handle_navItem_CLICK);
            $navContent.width(containerWidth);
        },

        /**
         * anim in menu
         */
        showMenu: function () {
            var tl,
                tweens = [];

            $menuButton.hide();
            $menu.show();

            TweenMax.to($('#topUI'), .3, {css: {top: 0}, ease: Quint.easeOut});
            TweenMax.to($('#bottomUI'), .3, {css: {bottom: 0}, ease: Quad.easeOut});

            $('.nav-item').each(function () {
                tweens.push(TweenMax.to($(this), .4, {css: {top: 0, opacity: 1, scale: 1}}));
            });
            tl = new TimelineMax({tweens: tweens, stagger: .05});

            instance.isVisible = true
        },

        /**
         * anim out menu
         */
        hideMenu: function () {
            var tl,
                tweens = [];

            if (instance.isVisible == true) {
                instance.isVisible = false
                
                $('.nav-item').each(function () {
                    tweens.push(TweenMax.to($(this), .4, {css: {top: -100, opacity: 0, scale: .5}}));
                });
                tl = new TimelineMax({tweens: tweens});

                TweenMax.to($('#topUI'), .3, {css: {top: -70}, ease: Quad.easeOut});
                TweenMax.to($('#bottomUI'), .3, {css: {bottom: -200}, ease: Quad.easeOut, onComplete: function () {
                    $menuButton.show();
                    $menu.hide();
                }});
            }
        },

        /* Show or hide the menu */
        toggleMenu: function () {
            var timeout,
                later = function() {
                    timeout = null
                    instance.isVisible ? instance.hideMenu() : instance.showMenu()
                }
            clearTimeout(timeout)
            timeout = setTimeout(later, ANIMATION_DELAY)
        },

        /* show highlighted menu*/
        update: function () {
            $('.nav-item').removeClass('selected');
            $($('.nav-item')[Model.currentPage - 2]).addClass('selected');
        }
    };

    return new HUD();
})
