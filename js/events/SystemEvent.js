define([], function(require) {
	
	var SystemEvent = {
		NEXT: new signals.Signal(),
		PREVIOUS: new signals.Signal(),
		GOTO: new signals.Signal()
	}
	
	return SystemEvent;
});