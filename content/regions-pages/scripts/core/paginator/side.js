/*global define*/
define([], function() {

    var Side;

        Side = function (id, flowname) {
            this.id = id;
            this.flowname = flowname;
            this.element = $('<div>');
            this.element.addClass('side');
            this.element.css('-webkit-flow-from', flowname);
        };

    return Side;
});
