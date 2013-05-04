/*global define*/
define(['core/model', 
        'core/paginator/side',
        'core/paginator/page'], 
        function(Model, Side, Page) {

    var Article,
        PAGE_WIDTH = $(window).width();

    /**
     * @param content jqobject of source article content
     */
    Article = function (id, content) {
        this.id = id;
        this.content = content;
        this.flowname = 'flow' + id;
        this.content.css('flow-into', this.flowname);
        this.flow = this.getFlow();
        this.sides = [];
        this.pages = [];
    };
    
    /**
     * generate side objects for this article
     */
    Article.prototype.addSide = function () {
        var side = new Side(this.sides.length, this.flowname);
        this.sides.push(side);
        return side;
    };
    
    Article.prototype.addPages = function (appendFn) {
        var i = 0,
            flow = this.getFlow(),
            page,
            front,
            back;
            
        while (flow.overset){
            front = this.addSide('front');
            front = front.element;

            if (PAGE_WIDTH >= Model.singlePageWidth) {
                back = this.addSide();
                back = back.element;
            } else {
                back = null;
            }

            page = new Page(front, back, this);
            page.id = i;
            
            this.pages.push(page);
            i++
            
            // let the exteranl 'appendFn' callback decide where to put the page (append, insertBefore, insertAfter, etc)
            // this helps decouple the load order of articles
            appendFn.call(null, page.container)
        }

        return this.pages;
    };

    Article.prototype.getFlow = function () {
        try{
        
            if (typeof(document.webkitGetFlowByName) !== 'undefined') {
                return document.webkitGetFlowByName(this.flowname);
            } else {
                return document.webkitGetNamedFlows()[this.flowname];
            }

        } catch (e) {
            return false;
        }
    };

    return Article;
});
