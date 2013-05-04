function () {
	
var $parallax,
    $document = $(document);

function parallax() {
    var newTop,
        offset;
    
    newTop = $document.scrollTop();

    $parallax.each(function () {
        var $this = $(this);

        offset = $this.data('parallax');
        $this.children().css('webkitTransform', 'translateY(' + newTop / offset + 'px)');
    });
}

/**
 * update on request animation frame
 *
 */
function update() {
    requestAnimationFrame(update);
}

/**
 * scroll event
 */
function handle_SCROLL(e) {
    parallax();    
}

function init() {
    $parallax = $('.parallax');
    $parallax.css('overflow', 'hidden');
    $document.scroll(handle_SCROLL);

    requestAnimationFrame(update);
}
}();

$document.ready(init);
