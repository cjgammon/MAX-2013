require.config({
  shim: {
  },

  paths: {
  	tweenmax: 'vendor/greensock/TweenMax.min',
    jquery: 'vendor/jquery-1.9.0.min',
    signals: 'vendor/signals.min'
  }
});
 
require(['app', 'tweenmax', 'signals'], function(App) {
    var app = new App();
});
