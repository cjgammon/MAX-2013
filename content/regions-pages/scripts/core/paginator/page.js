/*global define*/
define([], function() {

    var Page;

        Page = function (front, back, article) {
            this.article = article;
            this.flowname = article.flowname;
            this.front = front;
            this.back = back;
            this.position = {x: 0, y: 0, z: 0};
            this.rotation = {x: 0, y: 0, z: 0};
            this.container = $('<div class="page ' + this.flowname + '" data-for="'+ article.content.attr('id') +'">');
            this.shadowFront = $('<div class="shadow front">');
            this.shadowBack = $('<div class="shadow back">');
            this.container.data('class', this.flowname);
            this.container.append(front);
            if (back !== null) {
                this.container.append(back);
            }
            this.container.append(this.shadowFront);
            this.container.append(this.shadowBack);
            this.c = this.container;
         
            return this;
        };

    return Page;
});
