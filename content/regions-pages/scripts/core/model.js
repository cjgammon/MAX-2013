/*global define*/
define([], function(require) {

    var AppEvent = require('core/events/AppEvent'),
        coffeescript = require('text!articles/03_coffeescript/index.html'),
        instance,
        Model;
    
        Model = function () {
            instance = this;

            instance.paginated = false;
            instance.currentPage = 0;
            instance.totalPages = 0;
            //instance.singlePageWidth = 1020;
            instance.singlePageWidth = 900;
            instance.magazineName = "appliness";
            instance.pages = [];

            instance.articles = [
                {
                    html: coffeescript, 
                    url: '?article1', 
                    title: 'Ten Features I Like About Coffeescript', 
                    author: 'Karl Seguin', 
                    thumb: 'images/thumbnails/coffeescript.png',
                    images: []}
            ];
            
            instance.loadArticles = function () {
                var i,
                    $section,
                    $fragment = $(document.createDocumentFragment()),
                    $articleHolder = $('#articleHolder');
                    
                $.each(instance.articles, function(i, item){
                    $section = $('<section>')
                        .attr('id', 'section' + i)
                        .html(instance.articles[i].html)
                        .appendTo($fragment)

                    instance.pages.push($section)
                    
                    // DOM content lodead but not yet appended to document
                    AppEvent.ARTICLE_LOAD.dispatch($section)
                    instance.totalPages += 1;
                })

                $('body').addClass(instance.magazineName);
                $articleHolder.append($fragment)
                
                // DOM content now appended to document
                AppEvent.MAGAZINE_LOAD.dispatch($articleHolder)
            };

            instance.getArticleTitle = function (article) {
                return instance.articles[article].title;
            };

            // get a page's index by its url used in History.pushState()
            instance.getPageIndex = function(url){
                var index = 0;
                
                $.each(instance.articles, function(i, item){
                    if (item.url === url){
                        index = i
                        return
                     }
                })
                
                return index
            }
            
            instance.getPageByIndex = function(index){
                return instance.pages[index]
            }
            
        };

    return new Model();
});
