/*global define*/
define(['core/model', 
        'core/events/UserEvent', 
        'core/paginator/Article', 
        'core/paginator/Page',
        'core/hud'], 
        function(Model, UserEvent, Article, Page, HUD) {

    var Paginator;

        Paginator = function () {
            var instance = this,
                articleCount = 0,
                $articles,
                $paginator,
                $flipbook,
                overbutton,
                mouseMoveTimeout,
                resizeTimeout;

            instance.pages = [];
            instance.articles = [];
            instance.currentPage = -1;
            instance.flipping = false;
            instance.cache = [];

            
            instance.setup = function () {
                instance.addPaginator();
                instance.addEvents();
                instance.layout();
            }
            
            instance.layout = function(){
                instance.addArticles();
                instance.populateFlipbook();
                sortPageDepth();
                
                var firstPage = instance.getArticleFirstPage(Model.currentPage);
                instance.currentPage = instance.pages.indexOf(firstPage);
                instance.setPage(instance.currentPage);
                
                if (Model.currentPage === 0){
                    // cover article, preload upcoming article
                    instance.renderNextArticle()
                }
                else{
                    // preload previous article
                    instance.renderPrevArticle()
                }
                
                instance.orderStackRelativeToPage(instance.currentPage)
            }
            
            /**
             * setPage
             * sets open page
             */
            instance.setPage = function (page, callback) {
                TweenMax.killAll(true);
                
                instance.currentPage = page;
                instance.orderStackRelativeToPage(page);
            }
            
            instance.orderStackRelativeToPage = function(page){
                for (var j = 0; j < instance.pages.length; j += 1) {
                    
                    if (j == page || j > page) {
                        goalRotation = instance.pages[j].rotation.y == -180 ? goalRotation = '+=180' : goalRotation = 0; //ensures flip counter clockwise
                    } else if (j < page) {
                        goalRotation = -180;
                    }
                    
                    TweenMax.set(instance.pages[j].c, {css: {rotationY: goalRotation}});
                    TweenMax.set(instance.pages[j].rotation, {y: goalRotation});
                }
                
                sortPageDepth();  //prevents flicker of right page
            }
            
            /*
                Gets the 'Article' object instance for the article index.

                @param articleIndex {Integer} the article's index in the Model.articles array
                @return {Object} the 'Article' object instance
            */
            instance.getArticle = function(articleIndex){
                var articleObj = instance.articles[articleIndex]
                if (!articleObj){
                    throw new Error("No 'Article' object at index "+ articleIndex)
                }
                
                return articleObj
            }
            
            
            /*
                Gets a reference to the article's first page object instance
                @param articleIndex {Integer} index of the article from the Model.articles array
                @return {Object} reference to the instance of the first page object
            */
            instance.getArticleFirstPage = function(articleIndex){
                var articleObj = instance.getArticle(articleIndex)
                var firstPage = articleObj.pages[0]

                if (!firstPage){
                    throw new Error("No 'Page' object in 'Article.pages' at index "+ 0)
                }
                
                return firstPage
            }
            
            /*
                Gets a reference to the article's last page object instance
                
                @param articleIndex {Integer} index of the article from the Model.articles array
                @return {Object} reference to the instance of the last page object
            */
            instance.getArticleLastPage = function(articleIndex){
                var articleObj = instance.getArticle(articleIndex)
                var lastPage = articleObj.pages[articleObj.pages.length - 1]

                if (!lastPage){
                    throw new Error("No 'Page' object in 'Article.pages' at index "+ articleObj.pages.length)
                }
                
                return lastPage
            }

            /**
             * gotoPage
             * animates to specific page
             * @param page int - page number representing left side of open spread
             * @param callback - callback method
             * TODO:: fix multi page flipping
             */
            instance.gotoPage = function (page, callback) {
                var timeline,
                    tween,
                    tweens = [],
                    article,
                    j,
                    pagesToAnimate,
                    diff,
                    dir,
                    speed,
                    goalRotation,
                    pageIndexLimit;

                if (instance.flipping || page < 0 ||page > instance.pages.length - 1) {
                    return;
                }

                if (page > instance.currentPage) {
                    dir = -1;
                    j = Math.max(instance.currentPage - 1, 0);
                    pageIndexLimit = page;
                    
                } else if (page < instance.currentPage) {
                    dir = 1;
                    j = Math.max(page - 1, 0);
                    pageIndexLimit = instance.currentPage;
                } else if (page == instance.currentPage) {
                    return;
                }  
                
                TweenMax.killAll(true);
                HUD.hideMenu();
                
                //update url TODO:: need to make this fire goto
                article = instance.pages[page].article.id;
                History.pushState({state: article + 1}, Model.getArticleTitle(article), Model.articles[article].url);

                instance.flipping = true;
                
                // animate only pages in-between, not the whole stack
                for (j; j < pageIndexLimit; j++) {
                    pagesToAnimate = Math.abs(instance.currentPage - page)
                    diff = Math.abs(page - j);
                    
                    // cap speed at 3 seconds
                    speed = Math.min((pagesToAnimate - diff * .2) / 2, 3);  //TODO :: improve this equation?
                    
                    if (j == page || j > page) {
                        //GREATER THAN
                        goalRotation = instance.pages[j].rotation.y == -180 ? goalRotation = '+=180' : goalRotation = 0; //ensures flip counter clockwise
                    } else if (j < page) {
                        //LESS THAN
                        goalRotation = -180;
                    }                      
                    
                    tween = tweenPageRotation(instance.pages[j], speed, diff, goalRotation);

                    if (tween !== false) {
                        tweens.push(tween);
                    }
                }
                
                timeline = new TimelineMax({tweens: tweens, onComplete: handle_goto_COMPLETE});

                instance.currentPage = page;
                sortPageDepth();  //prevents flicker of right page
                
                // preload the next article when getting close to it
                if (instance.currentPage == instance.pages.length - 2){
                    instance.renderNextArticle()
                }
                
                if (instance.currentPage < 1){
                    instance.renderPrevArticle()
                }
            }
            
            instance.renderNextArticle = function() {
                var currentArticleId = instance.pages[instance.currentPage].article.id,
                    nextArticleId = currentArticleId + 1; 
                    
                // check to see if article at that index was not rendered and it exists
                if (!instance.cache[nextArticleId] && instance.articles[nextArticleId]){
                    
                    // grab a reference to the current last page
                    var lastPage = instance.getArticleLastPage(currentArticleId);
                    
                    // make it the DOM reference
                    lastPage = lastPage.container
                    
                    // append new pages after the last page.
                    var onCreatePage = function(page){
                        $(page).insertAfter(lastPage)

                        // swap the last page reference to the one just added
                        lastPage = page
                    }
                    
                    instance.renderArticle(nextArticleId, onCreatePage)
                }
            }
            
            instance.renderPrevArticle = function() {
                var currentArticleId = instance.pages[instance.currentPage].article.id,
                    prevArticleId = currentArticleId - 1; 
                    
                // check to see if article at that index was not rendered and it exists
                if (!instance.cache[prevArticleId] && instance.articles[prevArticleId]){
                    
                    // grab a reference to the current article's first page
                    var firstPage = instance.getArticleFirstPage(currentArticleId);
                    
                    // make it the DOM reference
                    firstPage = firstPage.container
                    
                    // append new pages before the first page.
                    var onCreatePage = function(page){
                        $(page).insertBefore(firstPage)
                    }
                    
                    instance.renderArticle(prevArticleId, onCreatePage)
                    
                    // offset the current page according to the ones just added
                    instance.setPage(instance.currentPage + instance.cache[prevArticleId].length)
                }
            }

            instance.next = function () {
                var nextPage = instance.currentPage + 1;
                instance.gotoPage(nextPage);
            }

            instance.previous = function () {
                var nextPage = instance.currentPage - 1;
                instance.gotoPage(nextPage);
            }

            /**
             * add articles to paginator
             */
            instance.addArticles = function () {
                var i,
                    contentArticle,
                    numArticles = Model.articles.length;

                instance.articles = [];

                for (i = 0; i < numArticles; i += 1) {
                    contentArticle = $($articles[i]);
                    instance.addArticle(i, contentArticle);
                }
                
                return instance.articles;
            }

            /**
             * add specific article
             */            
            instance.addArticle = function (id, content) {
                var article = new Article(id, content);
                instance.articles.push(article);
                return article;
            }

            /**
             * populates flip book pages
             */
            instance.populateFlipbook = function () {

                var onPageCreate = function(page){
                    $flipbook.append(page)
                }

                // render only the current article on the first run and append it straight to the flipbook container
                instance.renderArticle(Model.currentPage, onPageCreate)
            }
            
            /*
                Render a CSS Regions paginated view of an article and attach the page nodes with the onPageCreate callback function.
                
                @param {Integer} id The index of the article in the Model.articles array
                @param {Function} onPageCreate A callback function that gets called every time a page is created. 
                                               The function gets a single argument, the DOM Node element of the page that was created.
                                               
                @example:
                instance.renderArticle(1, function(page){
                    document.body.appendChild(page)
                })
            */
            instance.renderArticle = function(id, onPageCreate){
                var article, key;
                
                if (typeof onPageCreate !== 'function'){
                    throw new Error("Expected onPageCreate to be a function. Got "+ typeof onPageCreate)
                }
                
                // TODO: keep cache to support implementation of .detachNode() when node count becomes a performance hog.
                if (!instance.cache[id]){
                    article = instance.articles[id]
                    instance.cache[id] = article.addPages(onPageCreate)
                }  
                
                // empty the pages array. avoid mem leaks
                instance.pages.length = 0
                
                /* 
                    Rebuild the instance.pages array with page intances sorted ascending by the article indexes (key) that have been previously rendered.
                    Use this approach in stead of array.concat because articles may be loaded in non-linear fashion if the user jumps between articles from the HUD
                 */
                for (key in instance.cache){
                    
                    // object key magically turns from integer to string; convert it back.
                    key = parseInt(key, 10)
                    
                    // clone of pages array because we're likely to kill it on the next renderArticle() pass
                    var clone = instance.cache[key].slice(0)
                    
                    instance.pages = instance.pages.concat(clone)
                }
                
                sortPageDepth()
            }

            /**
             * adds paginator elements
             */
            instance.addPaginator = function () {
                $('#paginator').remove();

                $('body').addClass('paginated');

                instance.pages = [];
                instance.articles = [];

                HUD.hideMenu();

                $articles = $('article');
                $paginator = $('<div id="paginator">');
                $flipbook = $('<div id="flipbook">');

                $paginator.append($flipbook);
                $('#stage').append($paginator);
                
                UserEvent.ARROWS.dispatch(0, 0);
            }

            instance.addEvents = function () {
                UserEvent.NEXT.add(instance.next);
                UserEvent.PREVIOUS.add(instance.previous);
                UserEvent.GOTO.add(handle_GOTO);
                UserEvent.RESIZE.add(handle_RESIZE);
                UserEvent.MOUSE_MOVE.add(handle_MOUSE_MOVE);

                $('#rightFixedButton').bind('mouseover', handle_arrowbtn_MOUSE_OVER);
                $('#leftFixedButton').bind('mouseover', handle_arrowbtn_MOUSE_OVER);
                $('#rightFixedButton').bind('mouseout', handle_arrowbtn_MOUSE_OUT);
                $('#leftFixedButton').bind('mouseout', handle_arrowbtn_MOUSE_OUT);
            }
            
            instance.reset = function () {
                // reset the arrays; no references lost in space
                instance.pages.length = 0;
                instance.articles.length = 0;
                instance.cache.length = 0;
            }

            instance.destroy = function () {
                $('#paginator').remove();
                $('body').removeClass('paginated');
                
                instance.reset()

                UserEvent.NEXT.remove(instance.next);
                UserEvent.PREVIOUS.remove(instance.previous);
                UserEvent.GOTO.remove(handle_GOTO);
                UserEvent.RESIZE.remove(handle_RESIZE);
                UserEvent.MOUSE_MOVE.remove(handle_MOUSE_MOVE);
                
                $('#rightFixedButton').unbind('mouseover', handle_arrowbtn_MOUSE_OVER);
                $('#leftFixedButton').unbind('mouseover', handle_arrowbtn_MOUSE_OVER);
                $('#rightFixedButton').unbind('mouseout', handle_arrowbtn_MOUSE_OUT);
                $('#leftFixedButton').unbind('mouseout', handle_arrowbtn_MOUSE_OUT);

                clearTimeout(mouseMoveTimeout);
            }

            /**
             * event handlers
             */
            function handle_RESIZE(e) {
                TweenMax.killAll(true);
                clearTimeout(resizeTimeout);

                resizeTimeout = setTimeout(function () {
                    
                    instance.reset();
                    $flipbook.empty();

                    //regenerate
                    instance.layout()
                }, 100);
            }
            
            function handle_arrowbtn_MOUSE_OVER(e) {
                clearTimeout(mouseMoveTimeout);
                overbutton = true;
            }

            function handle_arrowbtn_MOUSE_OUT(e) {
                overbutton = false;
            }

            function handle_MOUSE_MOVE(e) {
                clearTimeout(mouseMoveTimeout);
                
                manageArrows();

                if (overbutton !== true) {
                    mouseMoveTimeout = setTimeout(function () {
                        UserEvent.ARROWS.dispatch(0, 0);
                    }, 1500);
                }
            }

            function handle_GOTO(article) {
                // TODO: needs implementation
            }

            function handle_gototween_COMPLETE(page, diff) {
                TweenMax.set(page.c, {
                    css:{z: -diff * 2}
                });
            }

            /**
             * complete event for goto animation
             */
            function handle_goto_COMPLETE(callback) {
                instance.flipping = false;
                sortPageDepth();
                manageArrows();
                if (callback) {callback();};
            }

            /**
             * tween page rotation
             * @param page - page to tween
             * @param speed - speed of tween
             * @param diff - difference in pages between goal page and this page
             * @param dir - direction
             * @param callback
             */
            function tweenPageRotation(page, speed, diff, dir, callback) {
                var shadowtween1,
                    shadowtween2,
                    shadowtween3,
                    shadowtween4;

                if (page.rotation.y !== dir) {
                    //page animation
                    var tween = TweenMax.to(page.c, speed, {
                        css:{rotationY: dir}, 
                        ease: Quad.easeInOut,
                        onComplete: handle_gototween_COMPLETE,
                        onCompleteParams: [page, diff]
                    });
                    //tracking rotation
                    TweenMax.to(page.rotation, speed, {
                        y: dir, 
                        ease: Quad.easeInOut
                    });

                    //TODO:: can we optimize this more?
                    //shadow rotation
                    if ($(window).width() >= Model.singlePageWidth) {
                        shadowtween1 = TweenMax.to(page.c.find('.shadow.front'), speed / 2, {css: {opacity: .25}, ease: Linear.easeNone});
                        shadowtween2 = TweenMax.to(page.c.find('.shadow.back'), speed / 2, {css: {opacity: .25}, ease: Linear.easeNone});
                        shadowtween3 = TweenMax.to(page.c.find('.shadow.front'), speed / 2, {css: {opacity: 0}, delay: speed / 2, ease: Linear.easeNone});
                        shadowtween4 = TweenMax.to(page.c.find('.shadow.back'), speed / 2, {css: {opacity: 0}, delay: speed / 2, ease: Linear.easeNone});
                        new TimelineMax({tweens: [shadowtween1, shadowtween2, shadowtween3, shadowtween4], yoyo: true, ease: Quad.easeInOut});
                    }
                }
                
                return tween || false;
            }

            /**
             * manage arrow visibility
             */
            function manageArrows() {
                if (instance.currentPage == 0) {
                    UserEvent.ARROWS.dispatch(0, 1);
                } else if (instance.currentPage == instance.pages.length - 1) {
                    UserEvent.ARROWS.dispatch(1, 0);
                } else {
                    UserEvent.ARROWS.dispatch(1, 1);
                }
            }

            /**
             * order pages z index
             */
            function sortPageDepth() {
                var i,
                    diff;
                
                for (i = 0; i < instance.pages.length; i += 1) {
                    diff = Math.abs(instance.currentPage - i);
                    TweenMax.set(instance.pages[i].c, {css:{z: diff * -1}});
                    if (diff > 2) {
                        //TweenMax.set(instance.pages[i].c, {css:{opacity: 0}});
                        TweenMax.set(instance.pages[i].c, {css:{visibility: 'hidden'}});
                    } else {
                        //TweenMax.set(instance.pages[i].c, {css:{opacity: 1}});
                        TweenMax.set(instance.pages[i].c, {css:{visibility: 'visible'}});
                    }
                }
            }

        };

    return Paginator;
});
