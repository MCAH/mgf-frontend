/*
	Meta functionalityeeee, foundations
	of the Archmap framework...
*/

(function(){
  
  if(!window.console) {
    window.console = {
      log: function() {}
    };
  }

	var _a = Archmap = {}; // definin the namespace
	
	_a.log = function(string) { try { console.log(string); } catch(e) { } }; // logging-function (firefox-safe)
	
	_a.components = []; // all the components that have been produced
	
	_a.uri = ""; // customizable bottom for links (but to be honest, not rigorously used)
	var readyCallbacks = [];
	var beforeCallbacks = [];
	
	_a.initialize = function(data) { // flint-bearer, fire-starter
		
		_a.user = new _a.User(data.archmap_says.you); // define a user, available always as Archmap.user
		var ds = new _a.DataStore(_a.user); // buy data, it will get shipped to your callback
		_a.dataStore = ds; // this should be an actual global variable
		
		ds.infuseInline(data.archmap_says,function(){ // the dataStore loves it when you give in pipelined data!
		    
		    // no matter what, bind these functions for easy access to provider/model
		    _a.mainDataProvider = function() { return ds.dataProvider; };
		    _a.provider = function() { return ds.dataProvider.model; };
		    
		    // waiting for the dom to be ready
		    $(function(){
		        _a.ImageOverlays.listenForImages(); // image interaction code
		        runBeforeReadyCallbacks(); // callbacks for before templatize
		        _a.Template.templatize("body"); // breathe life into the html components!
		        runReadyCallbacks(); // callbacks for after templatize
		        setTimeout(function(){
		            _a.interlocute($("div#stage"));
		        },1000);
		    });
		});
	};
	
	_a.blankCheck = function() {
	  _a.user = new _a.User({ id: 1, isUser: 10 });
	  _a.dataStore = new _a.DataStore(_a.user);
	};
	
	// code in templates that can be executed before $(function) calls
	_a.beforeReady = function(callback) {
	    beforeCallbacks.push(callback);
	};
	
	var runBeforeReadyCallbacks = function() {
	    _.each(beforeCallbacks,function(cback){ cback(); });
	};
	
	// safe rewriting of simple $(function(){}) calls
	_a.whenReady = function(callback) {
	    readyCallbacks.push(callback);
	};
	
	var runReadyCallbacks = function() {
	    _.each(readyCallbacks,function(cback){ cback(); });
	};
	
	var cleanup = function() {
	    _(_a.components).each(function(comp){
            comp.destroy();
        });
        _a.components = [];
	};
	
	_a.update = function(data) {
	    _a.dataStore.infuseInline(data.archmap_says,function(){
	        _a.Template.templatize("div#stage");
	    });
	};
	
	// quick way to bind a model
	_a.bindModel = function(dom,modelKey) {
		_a.EditorialBoard.bindModel(dom,modelKey);
	};
	
	/* alerting components that the window has resized */
	var resizer = undefined;
	$(window)
	    .resize(function(){
		    _a.resizeWindow();
	    })
	    .unload(function(){
	        cleanup();
	    });
	/* prevents too much resizing */
	_a.resizeWindow = function() {
		clearTimeout(resizer);
		resizer = setTimeout(function(){
			$("html").trigger("windowResized");
		},100);
	};
	
	// syntax niceification
	_a.triggerEvent = function(eventName,parameters) {
		$("html").trigger(eventName,parameters);
	};
	
	// get some code (defers to generic get)
	// both are deprecated
	//_a.require = function(src,callback) { _a.IO.require(src,callback); };
	//_a.getComponentHtml = function(name,callback) { _a.IO.getComponentHtml(name,callback); };
	
})();
