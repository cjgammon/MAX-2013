/*global define*/
define(['core/events/UserEvent', 
        'core/model'], function(
            UserEvent, 
            Model) {

    var TouchController;

    TouchController = function () {
        var instance = this,
            xOrg,
            yOrg,
            xPos,
            yPos,
            yCor,
            xCor,
            width,
            active,
            degree,
            plane = "",
            direction = "",
            vy = 0,
            newY,
            $body,
            $holder,
            currentArticle,
            MOVE_TIMEOUT,
            startTime,
            // maximum duration in milliseconds for swipe gesture
            swipeTimeThreshold = 200,
            // minimum drag distance in pixels after which page change occurs
            dragDistanceThreshold = 200, //TODO:: update for iphone or different screen sizes
            // distance in pixels scrolled on the horizontal axis
            offset = 0;
    
        function handle_TOUCH_MOVE(e) {
            var touch;

            if (e.originalEvent.touches.length == 1) {
                touch = e.originalEvent.touches[0];
                xPos = touch.pageX;
                yPos = touch.pageY;

                xCor = (xOrg - xPos); //drag amount
                yCor = (yOrg - yPos); //drag amount
           
                //determine direction plane [horizontal|vertical] and direction [up|down|left|right]
                if (plane === "") {

                    if (Math.abs(xCor) > Math.abs(yCor)) {
                        
                        plane = "horizontal";
                        
                        if (xCor > 0){
                            // gesture from right to left
                            direction = "left"
                        }
                        else{
                            // gesture from left to right
                            direction = "right"
                        }
                    } else if (Math.abs(yCor) > Math.abs(xCor)) {
                        plane = "vertical";
                        
                        if (yCor > 0){
                            // gesture from down to up
                            direction = "up"
                        }
                        else{
                            // gesture from up to down
                            direction = "down"
                        }
                    }

                }

                if (plane == 'horizontal') {
                    $holder.css('-webkit-transform', 'translate3d(' + (-xCor - offset) + 'px, 0px, 0px)');
                    e.preventDefault();
                    e.stopPropagation();
                } 
            }
            
        }

        function handle_TOUCH_DOWN(e) {
            var touch = e.originalEvent.touches[0];
            offset = $stage.width() * Model.currentPage;
            
            startTime = +new Date;

            xOrg = touch.pageX;
            yOrg = touch.pageY;

            //article specifics
            currentArticle = $('#section' + (Model.currentPage) + ' article');

            $stage.bind('touchmove', handle_TOUCH_MOVE);
        }

        function handle_TOUCH_UP(e) {
            var duration = +new Date - startTime

            $stage.unbind('touchmove', handle_TOUCH_MOVE);
            
            if (plane == 'horizontal') {
                
                if (duration < swipeTimeThreshold){
                    switch (direction) {
                        case 'left':
                            UserEvent.NEXT.dispatch();
                        break;
                        case 'right':
                            UserEvent.PREVIOUS.dispatch();
                        break;
                    }
                }
                else{
                    if (xCor > dragDistanceThreshold) {
                        UserEvent.NEXT.dispatch();
                    } else if (xCor < dragDistanceThreshold * -1) {
                        UserEvent.PREVIOUS.dispatch();
                    } else {
                        UserEvent.GOTO.dispatch(Model.currentPage);
                    }
                }
            }

            plane = "";
            xCor = 0;
            yCor = 0;
        }

        instance.init = function () {
            $body = $('body');
            $stage = $('#stage');
            $holder = $('#articleHolder');
            $stage.bind('touchstart', handle_TOUCH_DOWN);
            $stage.bind('touchend', handle_TOUCH_UP);
            
            //prevent viewport scrolling
            //$body.bind('touchmove', function (e) {
            //    e.preventDefault();    
            //});
        }

    };

    return new TouchController();
});
