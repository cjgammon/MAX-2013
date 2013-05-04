require.config({
    //path mappings for module names not found directly under baseUrl
    paths: {
        jquery:     'vendor/jqm/jquery_1.7_min',
        jqm:     'vendor/jqm/jquery.mobile-1.1.0', 
        underscore: 'vendor/underscore/underscore_amd',
        backbone:   'vendor/backbone/backbone_amd',
        text:       'vendor/require/text',
        plugin:    'plugin',
        templates:  '../templates',
        modules:    '../modules',
        model:       '../model'
    }

});

//1. load app.js, 
//2. configure jquery mobile to prevent default JQM ajax navigation
//3. bootstrapping application
define(['app','jqm-config'], function(app) {
    $(document).ready(function() {
      console.log("DOM IS READY");// Handler for .ready() called.
    });    
    app.initialize();
});


