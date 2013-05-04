
var $main,
	currentDiv;

function init() {
	$main = $('#main');
	
	$main.bind('mousedown', handle_MOUSE_DOWN);
	$(document).bind('mouseup', handle_MOUSE_UP);
	$(document).bind('keydown', handle_KEY_DOWN);
	$('.region').live('mousedown', handle_region_MOUSE_DOWN);
	$('#flow-button').bind('click', function () {
		$('.region').addClass('flow-from');
	});
	$('#clear-button').bind('click', clear);
	
	duplicate();
}

function clear(e) {
	$('.region').remove();
}

function duplicate() {
	console.log('key duplicate', $("#content-preview").html());
	$('#content').html($("#content-preview").html());
}

function handle_KEY_DOWN(e) {
	duplicate();
}

function handle_region_MOUSE_DOWN(e) {
	currentDiv = $(this);
	currentDiv.css('border', '1px solid green');
}

function handle_MOUSE_DOWN(e) {
	currentDiv = $('<div class="region">');
	currentDiv.data('x', e.pageX);
	currentDiv.data('y', e.pageY);
	currentDiv.css({'left': currentDiv.data('x'), 'top': currentDiv.data('y')});
	$main.append(currentDiv);
	$main.bind('mousemove', handle_MOUSE_MOVE);
}

function handle_MOUSE_MOVE(e) {
	currentDiv.css({'width': e.pageX - currentDiv.data('x'), 'height': e.pageY - currentDiv.data('y')});
}

function handle_MOUSE_UP(e) {
	$main.unbind('mousemove', handle_MOUSE_MOVE);
}

$(document).ready(init);