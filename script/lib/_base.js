/*
	Miscellaneous helpful functions
	HC SVNT very ugly code
*/

(function(){
	
	var _a = Archmap;
	
	_a.shiftOn = false; // is the shift key being held? (good to know)
	_a.rightClicking = false;
	_a.overlays = []; // stack of overlays, to be popped on back button
	_a.current_hash = window.location.hash.toString().replace("#","");
	
	// this key stuff should be in the basic archmap
	// or a lot of stuff from basic archmap should be here
	
	var html = $("html");
	
	html.keydown(function(e){ // keys are pressed, behave accordingly
		if(e.shiftKey) {
			_a.shiftOn = true;
		}
	});
	
	html.bind("contextmenu",function(){
		_a.rightClicking = true;
	});
	
	html.keyup(function(e){ // keys are unpressed, behave accordingly
		if(!e.shiftKey) {
			_a.shiftOn = false;
		}
		_a.rightClicking = false;
	});
	
	// history checker
	setInterval(function(){
		var hash = window.location.hash.toString().replace("#","");
		if(_a.current_hash !== hash) {
			try {
			    _a.popOverlay().clean();
			}
			catch(e) {
			    _a.log(e);
			}
		}
		_a.current_hash = hash;
	},200);
	
	// overlay must have a "clean" method, since that will be called
	_a.pushOverlay = function(overlay,key) {
	    _a.overlays.push(overlay);
	    _a.current_hash = key;
	    window.location.hash = key;
	};
	
	_a.popOverlay = function() {
	    window.location.hash = "/";
	    _a.current_hash = "";
	    return _a.overlays.pop();
	};
	
	// is this in use? ----- should be moved to IO, apparently SlideshowViewer uses it
	_a.imageCache = []; // this may not be the best way to do this
	_a.preloadImage = function(src) {
		var img = document.createElement("img");
		img.src = src;
		_a.imageCache.push(img);
	};

})();