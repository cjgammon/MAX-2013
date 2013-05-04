require.config({
  shim: {
  },

  paths: {
    hm: 'vendor/hm',
    esprima: 'vendor/esprima',
    highlight: 'vendor/highlight.pack',
    scrollMonitor: 'vendor/scrollMonitor',
    jquery: 'vendor/jquery.min',
    history: 'vendor/jquery.history',
    tweenmax: 'vendor/greensock/TweenMax.min'
  }
});
 
require(['app', 'history', 'tweenmax', 'highlight'], function(app) {
    app.init();
});
