/*global define signals*/
define([], function () {
		
		var AppEvent = {
		    // dispatched when an article has been loaded
            ARTICLE_LOAD: new signals.Signal(),
            // dispatched when all articles have been loaded
            MAGAZINE_LOAD: new signals.Signal(),
            // dispatched when an article has been bookmarked
            ARTICLE_BOOKMARK: new signals.Signal(),
            // dispatched after an article has animated into view
            ARTICLE_VISIBLE: new signals.Signal()
        };

		return AppEvent;
    });
