/*global define*/
define([], function (require) {

    var UserEvent     = require('core/events/UserEvent'),
        AppEvent      = require('core/events/AppEvent'),
        Model         = require('core/model'),
        instance,
        TOC;

    TOC = function () {
        instance = this;
        this.isVisible = false;
        this.container = null;
        this.watchers = [];
        this.config = {
            itemClass: 'toc-item',
            itemTitleClass: 'toc-item-title',
            itemAuthorClass: 'toc-item-author'
        }
    };
    
    function handle_TOC_CONTAINER_CLICK(e){

        // using currentTarget because the event is bubbling from one of its childNodes
        var pageIndex = parseInt($(e.currentTarget).data('page-index'), 10)
        
            console.log("TOC CLICK", e.currentTarget, pageIndex);
        if (isNaN(pageIndex)){
            throw new Error("Invalid value for 'pageIndex'. Expected number, got " + typeof pageIndex)
        }
        
        UserEvent.GOTO.dispatch(pageIndex)
    }
    
    function handle_ARTICLE_VISIBLE(pageIndex){
        // TODO: use smarter page awareness for TOC
        //if (pageIndex === 1 && !Model.paginated){
        //    instance.show()
        //}
        //else{
        //    // free up some memory
        //    stroll.unbind(instance.container)
        //}
    } 

    TOC.prototype = {
        
        init: function () {
            instance.container = $('#toc-nav');
            instance.populate(Model.articles);
            instance.addEvents();
        },

        /**
         * add article thumbs and titles to Table of Contents page
         */
        populate: function (articles) {
            
            var $navItem, $navItemImg, $navItemTitle, $navItemAuthor, $navItemCopy,
                $fragment = $(document.createDocumentFragment()),
                ignoreIndexes = [0, 1];
            
            $.each(articles, function(i, item){

                // ignore cover page and index page
                if (ignoreIndexes.indexOf(i) > -1){
                    return
                }
                
                $navItem = $('<li>')
                    .addClass(instance.config.itemClass)
                    .addClass('js-animates')
                    .data('page-index', i);
                
                if (item.thumb) {
                    $navItemImg = $('<img>')
                        .attr('src', item.thumb)
                        .appendTo($navItem);
                }

                $navItemCopy = $('<div>')
                    .addClass('toc-item-copy')
                    .appendTo($navItem);
                
                $navItemTitle = $('<div>')
                    .addClass(instance.config.itemTitleClass)
                    .text(item.title)
                    .appendTo($navItemCopy);
                 
                if (item.author) {
                    $navItemAuthor = $('<div>')
                        .addClass(instance.config.itemAuthorClass)
                        .text('by: ' + item.author)
                        .appendTo($navItemCopy);
                }

                $fragment.append($navItem);
            })
            
            instance.container.empty().append($fragment);
        },
        
        addEvents: function () {
            /**
            * using event delegation to improve performance.
            * clicks on the target '.toc-item' will bubble up to the container. We fish them here
            */
            var targetSelector = '.' + instance.config.itemClass;
            $(targetSelector).bind('click', handle_TOC_CONTAINER_CLICK);
            
            //instance.container.bind('click', handle_TOC_CONTAINER_CLICK);
            //instance.container.on('click tap', targetSelector, handle_TOC_CONTAINER_CLICK);
            //AppEvent.ARTICLE_VISIBLE.add(handle_ARTICLE_VISIBLE)
        },

        /**
         * setup stroll.js on TOC items
         */
        show: function () {
            // stroll needs a fixed height for the container
            //instance.container.css('height', $(window).height())
            //stroll.bind(instance.container)
        }
    };

    return new TOC();
})
