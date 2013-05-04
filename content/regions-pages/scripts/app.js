/*global define*/
define([], function(require) {

    var HUD = require('core/hud'),
        Model = require('core/model'),
        TOC = require('core/toc'),
        Paginator = require('core/paginator'),
        TouchController = require('core/controllers/TouchController'),
        UserEvent = require('core/events/UserEvent'),
        AppEvent = require('core/events/AppEvent'),
        InView = require('core/InView'),
        stroll = require('vendor/stroll/js/stroll'),
        stellar = require('vendor/jquery.stellar'),

        instance,
        App,
        $window,
        $holder,
        $sections,
        paginator,
        WINDOW_MIN = 1050;


    App = function () {
        instance = this;
        instance.stage = $('#stage');
        instance.transitioning = false;
        instance.initial = true;
    
        instance.scrollTo = scrollTo;
        instance.handle_TOGGLE_PAGINATION = handle_TOGGLE_PAGINATION;
    };

    /**
     * scrollTo - scrolls to a specific page
     * @param page - int
     * @param animated - bool
     */
    function scrollTo(page, animated) {

        if (animated) {
            $holder.css('webkitTransition', '-webkit-transform .4s cubic-bezier(.15,.02,.11,.99)');
        }
        
        $sections.removeClass('active');
        offset = $window.width() * page;

        if (!Modernizr.touch) {
            //handle arrow buttons
            resetArrows(page);
        }

        function runAnimation() {
            $holder.css('webkitTransform', 'translate3d(' + -offset + 'px, 0px, 0px)');

            if (animated) {
                $holder.bind('webkitTransitionEnd', function () {
                    $holder.unbind('webkitTransitionEnd');
                    $holder.css('webkitTransition', 'none');
                    UserEvent.TRANSITION_COMPLETE.dispatch();
                });
            } else {
                UserEvent.TRANSITION_COMPLETE.dispatch();
            }
        }

        runAnimation();
        //setTimeout(runAnimation, 10);
    };

    /**
     * jump to article
     */
    function handle_GOTO(page) {
        if (instance.transitioning === false) {
            HUD.hideMenu();
            instance.transitioning = true;
            History.pushState({state: page + 1}, Model.getArticleTitle(page), Model.articles[page].url);

            // If we're already on this state, History.pushState() will not trigger the 'statechange'.
            // scrollTo() is used in the handler for 'statechange'.
            // Manually trigger scrollTo() in order to slide the page back into view. 
            // Use case for first / last page on non-CSS Regions layouts
            
            if (Model.articles[page].url === window.location.search){
                scrollTo(page, true)
            }
        }
    };

    function handle_NEXT() {
        var upcomingPage = Math.min(Model.nextPage + 1, Model.totalPages -1)
        UserEvent.GOTO.dispatch(upcomingPage)
    };

    function handle_PREVIOUS() {
        var upcomingPage = Math.max(0, Model.nextPage -1)
        UserEvent.GOTO.dispatch(upcomingPage)
    };

    function handle_TRANSITION_COMPLETE() {
        Model.currentPage = Model.nextPage;
        HUD.update();
        instance.transitioning = false;

        $($sections[Model.currentPage]).addClass('active');
        // Reset the scroll position of articles to help users maintain context during navigation
        $sections.scrollTop(0);
        UserEvent.SCROLL.dispatch();
        
        AppEvent.ARTICLE_VISIBLE.dispatch(Model.currentPage)
    };

    /**
     * pagination toggled
     */
    function handle_TOGGLE_PAGINATION() {
        Model.paginated = !Model.paginated;
        if (!Model.paginated) {
            //vertical
            paginator.destroy();

            instance.addEvents();
            $holder.css('opacity', '1');
            $('article').css('-webkit-flow-into', '');
        } else {
            //flip book
            $holder.css('-webkit-transform', '');
            $holder.css('opacity', '0');
            instance.removeEvents();

            paginator = new Paginator();
            paginator.setup();
        }
        
        handle_RESIZE();
    };

    function handle_STATE_CHANGE() {
        var State = History.getState(),
            uri = location.search,
            params,
            spread,
            relativeSpread;
            
        var pageIndex = Model.getPageIndex(window.location.search)
        
        Model.nextPage = pageIndex;
        
        scrollTo(pageIndex, !instance.initial);
        instance.initial = false;
    }

    function handle_MOUSE_MOVE(e) {
        var $windowWidth = $(window).width();

        /*
        if ($windowWidth < WINDOW_MIN) {
            if (e.pageX > $windowWidth - 100 && Model.currentPage !== $sections.length - 1) {
                UserEvent.ARROWS.dispatch(0, 1);
            } else if (e.pageX < 100 && Model.currentPage !== 0) {
                UserEvent.ARROWS.dispatch(1, 0);
            } else {
                UserEvent.ARROWS.dispatch(0, 0);
            }
        }
        */
    }

    /**
     * resize event
     */
    function handle_RESIZE() {
        var i = 0, 
            page;

        $sections.each(function () {
            $(this).css('webkitTransform', 'translateX(' + $window.width() * i + 'px)');
            i += 1;
        });
        
        page = Model.nextPage != Model.currentPage ? Model.nextPage : Model.currentPage; //if already changing page
        scrollTo(page, false);

        if (!Modernizr.touch) {
        //    if ($window.width() > WINDOW_MIN) {
                resetArrows(page);
        //    } else {
        //        UserEvent.ARROWS.dispatch(0, 0);
        //    }
        }
    };

    function resetArrows(page) {
        if (page === 0) {
            UserEvent.ARROWS.dispatch(0, 1);
        } else if (page == $sections.length - 1) {
            UserEvent.ARROWS.dispatch(1, 0);
        } else {
            UserEvent.ARROWS.dispatch(1, 1);
        }
    }
    
    function handle_MAGAZINE_LOAD(magazine){
        $('pre code').each(function(i, e) {hljs.highlightBlock(e)});

        $('#preloader').css('opacity', '0');
        $('#preloader').bind('webkitTransitionEnd', function () {
            $('#preloader').css('display', 'none');
        });
        
        //NOTE:: may need to handle this stuff differently
        // setup stellar.js parallax on the magazine's sections based on data- attributes on its HTML
        //$(magazine.find('section')).stellar({
        //    hideDistantElements: true
        //});
    }

    /**
     * handle keyboard navigation
     */
    function handle_KEY_DOWN(e) {
        switch (e.keyCode) {
        case 39:
            UserEvent.NEXT.dispatch();
            break;
        case 37:
            UserEvent.PREVIOUS.dispatch();
            break;
        }
    }
    
    App.prototype = {
        
        /**
         * initialize application
         **/
        init: function () {
            var initialState;
            
            $window = $(window);
            $holder = $('#articleHolder');

            console.log('********init');

            History = window.History;
            History.Adapter.bind(window, 'statechange', function (e) {
                UserEvent.STATE_CHANGE.dispatch(e);
            });

            // listen for app state events before loading articles
            instance.addAppEvents()
            
            Model.loadArticles();
            HUD.init();
            TOC.init();
            InView.init();

            $sections = $('section');

            if (Modernizr.touch) {
                TouchController.init();
            } else {
                $(document).bind('mousemove', function (e) {
                    UserEvent.MOUSE_MOVE.dispatch(e);    
                })
            }

            //EVENTS
            instance.addEvents();
            UserEvent.TOGGLE_PAGINATION.add(handle_TOGGLE_PAGINATION);
            UserEvent.STATE_CHANGE.add(handle_STATE_CHANGE);
            UserEvent.TRANSITION_COMPLETE.add(handle_TRANSITION_COMPLETE);
            
            $(document).bind('keydown', handle_KEY_DOWN);

            $window.bind('orientationchange', function () {
                UserEvent.RESIZE.dispatch();
            });

            $window.resize(function () {
                UserEvent.RESIZE.dispatch();
            });

            //TODO remove and add for active section?
            $('section').scroll(function() {
                UserEvent.SCROLL.dispatch();
            });

            initialState = History.getState();
            
            if (initialState.hash == '/' || initialState.hash == '/test/') {
                History.pushState({state: 0}, Model.getArticleTitle(Model.currentPage), Model.articles[0].url);
            } else {
                handle_STATE_CHANGE();
            }
            
            //handle_RESIZE();
            handle_TOGGLE_PAGINATION();

            return true;
        },
        
        addAppEvents: function() {
            AppEvent.MAGAZINE_LOAD.add(handle_MAGAZINE_LOAD);
        },

        addEvents: function () {
            UserEvent.GOTO.add(handle_GOTO);
            UserEvent.NEXT.add(handle_NEXT);
            UserEvent.PREVIOUS.add(handle_PREVIOUS);
            UserEvent.RESIZE.add(handle_RESIZE);
            UserEvent.MOUSE_MOVE.add(handle_MOUSE_MOVE);
        },

        removeEvents: function () {
            UserEvent.GOTO.remove(handle_GOTO);
            UserEvent.NEXT.remove(handle_NEXT);
            UserEvent.PREVIOUS.remove(handle_PREVIOUS);
            UserEvent.RESIZE.remove(handle_RESIZE);
            UserEvent.MOUSE_MOVE.remove(handle_MOUSE_MOVE);
        }
        
    };

    return new App();
});
