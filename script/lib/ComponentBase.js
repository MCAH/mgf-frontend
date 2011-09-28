/*
	Base functionality for defining
	new components: GenericComponent,
	GroupComponent (displays a group,
	paticipates in events), and the
	SingletonComponent
*/

(function(){
	
	var _a = Archmap;
	
	/* The Basic Component, not much here */
	
	// requires params.component,
	// params.sandbox, params.provider
	// just wrapping up some ugly nastiness
	// sorry code gods!
	// should be deprecated
	// pretty sure this is deprecated
	_a.componentBuilder = function(params) {
	    var component = new _a[params.component]();
	    component.setSandbox(params.sandbox);
	    component.initialize(_a.dataStore.auxiliaryDataProvider(params.provider));
	    return component;
	};
	
	// one-stop shop
	// for defining a component
	// requires params.name
	// requires params.extend
	// requires params.methods (actually optional, but why?)
	_a.defineComponent = function(params) {
	    var name = params.name;
	    // constructor
	    _a[name] = function(params) {
	        this.inlineOptions = {}; // in case these aren't set later on
	        this.___componentName = name;
	        // default constructor behavior, so it's easy to instantiate
    	    if(params !== undefined) {
    	        var sandbox = params.sandbox,
    	            provider = params.provider;
    	        delete params.sandbox;
    	        delete params.provider;
    	        // set the options with what's left in the params hash
    	        this.setOptions(params);
    	        // set the sandbox
    	        if(sandbox && this.setSandbox) {
    	            this.setSandbox(sandbox);
    	            this.sandbox.addClass(name);
    	        }
    	        // set the data provider
    	        if(provider && this.initialize) {
    	            var provider = (provider instanceof _a.DataProvider)
    	                ? provider : _a.dataStore.auxiliaryDataProvider(provider);
    	            // now kick-start it!
    	            this.initialize(provider);
    	        }
    	    }
    	    _a.components.push(this);
	    };
	    // subclass
	    _a[name].prototype = (params.extend) ? new _a[params.extend]() : {};
	    // add some methods!
	    jQuery.extend(_a[name].prototype, params.methods || {} );
	};
	
	_a.newComponent = function(params) {
	    _a.defineComponent(params);
	};
	
	_a.GenericComponent = function() { };

	_a.GenericComponent.prototype = {
		addGenericListeners: function() {
			var that = this;
			$("html").bind("dataProviderReady",function(e,provider){
				that.initialize(provider);
			});
			$("html").bind("windowResized",function(e) {
				that.resize();
			});
		},
		resize: function() { // what happens when the window resizes
			return false; // subclasses must implement this
		},
		getModel: function(key) { // get a model from the dataProvider
			return this.dataProvider.dataStore.get(key);
		},
		selectModel: function(key) {
			if(_.isString(key) === false) {
			    key = key.key(); // get the key from the object
			}
			this.dataProvider.select(key,this);
		},
		multiselectModel: function(key) {
		    this.dataProvider.multiselect(key,this);
		},
		unselectModel: function(key) {
			this.dataProvider.unselect(key,this);
		},
		setSandbox: function(jQueryDomElement) {
			this.sandbox = jQueryDomElement;
			return this; // chaining
		},
		setOptions: function(options) {
		    this.inlineOptions = options || {};
		},
		loadTemplate: function(name,callback) {
		    if(_.isFunction(name)) { // no name specified, then we default
		        callback = name;
		        name = this.___componentName;
		    }
		    var that = this;
		    _a.IO.getComponentHtml(name,function(html){
		        that.sandbox.append(html);
		        callback.apply(that);
		    });
		},
		destroy: function() {
		    _.each(_.keys(this),function(key){
		        delete this[key];
		    },this);
		}
	};
	
	/*
		Components that don't want to participate in the game
		of object select/deselect etc. -- things that do their
		own thing and don't want to be bothered, thank you
	*/
	
	_a.SingletonComponent = function() { };
	
	_a.SingletonComponent.prototype = new _a.GenericComponent();
	
	jQuery.extend(_a.SingletonComponent.prototype,{
		initialize: function() {
			this.addListeners();
			this.start();
		},
		start: function() {
			return false;
		},
		boot: function(dataProvider) { // not sure anyone uses this...
			
		},
		addListeners: function() {
			this.addGenericListeners();
		},
		request_and_wait: function(dataStore,src) { // deprecated
			var method_name = src;
			src = dataStore.dataProvider.model.key()+"/"+src;
			var that = this;
			dataStore.request(src,function(data,yield){
				that.start();
				that.render(data,yield);
			});
		},
		resize: function() {
			return false;
		},
		clean: function() {
			$(this.dom).empty(); // deprecated
			this.sandbox.empty(); // latest & greatest
		}
	});
	
	/* Components that "participate" should extend this */
	
	_a.GroupComponent = function() { };
	
	_a.GroupComponent.prototype = new _a.GenericComponent();
	
	jQuery.extend(_a.GroupComponent.prototype,{
		addListeners: function() {
			this.addGenericListeners();
			var that = this;
			$("html").bind("newDataProvider",function(e,dataProvider){
				that.unrender();
				that.boot(dataProvider);
				that.render();
			});
			$("html").bind("dataProviderRefreshed",function(e,dataProvider){
			    if(dataProvider.model.key() === that.dataProvider.model.key()) {
			        that.unrender();
			        that.boot(dataProvider);
			        that.render();
			    }
			});
			
			// meta code for binding events to appropriate functions
			var events = { // eventName: functionName
				"modelHoverOn": "hoverOnModel",
				"modelHoverOff": "hoverOffModel",
				"modelSelected": "highlightModel",
				"modelUnselected": "unhighlightModel",
				"modelBlurred": "blurModel",
				"modelFocused": "focusModel",
				"modelSubfocused": "subfocusOnModel",
				"modelUnsubfocused": "unsubfocusOnModel"
			};
			$.each(events,function(eventName,functionName){
				$("html").bind(eventName,function(e,model,caller){
					try {
						that[functionName](model,caller);
					}
					catch(e) {
						that[functionName](model);
					}
				});
			});
			
		},
		initialize: function(dataProvider) { // first start
			this.boot(dataProvider);
			this.hangups = []; // for hanging the connection to finalize
			this.addListeners();
			this.start();
		},
		boot: function(dataProvider) { // component restart button
			this.dataProvider = dataProvider;
		},
		start: function() { // implemented by the extender, first-pass starter
			return false;
		},
		prerender: function() {
			// available so you can regenerate critical stuff for re-renders
			return false; // if a component needs to handle some bidness, do it now!
		},
		render: function() { // render all the objects, one-by-one
			this.prerender();
			var model = this.dataProvider.model;
			if(model.key() != "catalog/collection") {
				this.renderModel(model);
			}
			this.finalize();
		},
		renderModel: function() {
			return false; // subclasses' job
		},
		unrender: function() { // clear out what you currently have rendered
			return false; // subclasses' job
		},
		rerender: function() { // for zooming and stuff like that
			this.unrender();
			this.render();
		},
		blurFilter: function(fn) {
			this.blurChildren(this.dataProvider.model,fn);
		},
		blurChildren: function(parent,fn) {
			var that = this;
			parent.iterateChildren(function(i,model){
				if(model.isExpandable()) {
					that.blurChildren(model,fn);
				}
				else if(fn(model)) {
					model.focus();
				}
				else {
					model.blur();
				}
			});
		},
		preventFinalize: function() {
			this.hangups.push(true);
		},
		enableFinalize: function() {
			this.hangups.pop();
			return this; // for chaining
		},
		canBeFinalized: function() {
			if(this.hangups.length === 0) { return true; }
		},
		// triggers for subclasses to call/bind to actual events
		hoverModel: function(key) { this.dataProvider.hover(key); },
		unhoverModel: function(key) { this.dataProvider.unhover(key); },
		subfocusModel: function(key) { this.dataProvider.subfocus(key); },
		unsubfocusModel: function(key) { this.dataProvider.unsubfocus(key); },
		// simple stubs -- implemented by subclasses or else useless
		highlightModel: function() { return false; },
		unhighlightModel: function() { return false; },
		focusModel: function() { return false; },
		blurModel: function() { return false; },
		finalize: function() { return false; },
		hoverOnModel: function() { return false; },
		hoverOffModel: function() { return false; },
		subfocusOnModel: function() { return false; },
		unsubfocusOnModel: function() { return false; }
	});
	
})();