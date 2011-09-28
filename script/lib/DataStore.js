/*
	The DataStore class, the motel
	for all kinds of cached data...
*/

(function(){
	
	var _a = Archmap;
	
	/* The Warehouse of Data */
	
	_a.DataStore = function(user) { // the place where data lives
		this.initialize(user);
	};
	
	_a.DataStore.prototype = {
		initialize: function(user) {
			this.user = user; // hmmm... not sure anyone actually looks at this..., deletable?
			this.data = {}; // where we keep the various responses from the api
			this.providers = {}; // stack of known data providers
			this.dataProvider = null;
			this.currentHash = window.location.hash;
			/* for when the data provider changes */
			var that = this;
			$("html").bind("changeDataProvider",function(e,model){
				that.changeDataProvider(model);
			});
			$("html").bind("refreshDataProvider",function(e,dataProviderKey){
				that.refreshProvider(dataProviderKey);
			});
		},
		get: function(key,callback,getFresh) { // gets a model out of the warehouse
			if(key === undefined) {
			    return false;
			}
			key = key.toLowerCase(); // just to be safe
			if(key === undefined || key == "") {
				return false; // if there's no key, don't do anything, there was a mistake in calling
			}
			// try getting it locally
			var local = this.localGet(key);
			if(getFresh !== true && local) {
				if(_.isFunction(callback)) {
					callback(local);
				}
				return local; // if called with a callback
			}
			// now just go ahead and get it remotely
			else {
			    this.remoteGet(key,callback,getFresh);
			    return false;
			}
		},
		localGet: function(key) {
		    if(this.data[key]) {
		        return this.data[key];
		    }
		    else {
		        return false;
		    }
		},
		remoteGet: function(key,callback,getFresh) {
		    var that = this;
		    _a.IO.getJSONModel(key,function(data,model){
		        var realKey = data.archmap_says.model;
				// TROUBLEMAKER -- watch out for recursive (not sure how it's happening)
				if(_.isFunction(callback)) {
					if(that.data[realKey]) {
						callback(that.data[realKey]); // we asked for it and now it's here
					}
					else {
						throw("AskedForItButDidntGetItError");
					}
				}
		    },getFresh);
		},
		getFresh: function(key,callback) {
			this.get(key,callback,true); // do a normal get
		},
		getMetaForModelAndField: function(model,field,callback) {
			this.get("meta/"+model+"::"+field,callback);
		},
		keyPush: function(key,value) {
			this.data[key.toLowerCase()] = value;
		},
		push: function(model) { // cache a single model
		    this.keyPush(model.key(),model);
		},
		infuseInline: function(api,callback) { // async, since we might not have the parent
		    var that = this;
			this.convertJSONToArchObjects(api,function(object,parent){
			    if(parent !== undefined) {
			        that.setDataProvider(parent);
			    }
			    else {
			        that.setDataProvider(object);
			    }
			    callback(); // ready to proceed
			});
		},
		convertJSONToArchObjects: function(api,callback) { // make the syntax easier
			if(api.method !== "shortlist" && api.system_model !== "search") {
			    var that = this;
			    this.get(api.model,function(model){
			        if(typeof callback === "function") { // now it's safe to case recurse
    			        var value = that.recurseForModels( api.response, api.model, api.method );
    			        callback(value,model);
    			    }
			    });
			}
			else {
			    var value = this.recurseForModels( api.response, api.model, api.method );
			    if(typeof callback === "function") {
			        callback(value);
			    }
			    return value; // for non-callback based calls
			}
		},
		recurseForModels: function(data,parent,method) {
			var yield = undefined;
			if(_a.Utilities.isArray(data)) { // a real array, which we must reconstitute
				for(var i in data) {
					if(typeof(data[i]) === "object") {
						var model = this.recurseForModels(data[i],parent,method);
						try { data[i] = model.getReceipt(); }
						catch(e) { data[i] = model; }
					}
				}
				this.get(parent).data[method] = data; // save it to the object
			}
			else if(typeof(data) === "object") {
				for(var key in data) {
					if(typeof(Archmap[key]) === "function") { // we are dealing with an object
						var uri = data[key].uri;
						var model = new Archmap[key](data[key]);
						yield = model; // so we can return it
						this.keyPush(uri,model);
						if(uri === parent) { // parent is the object iself
							this.recurseForModels(data[key],uri,method); // descend into its fields
						}
						else { // we need to get the parent
							if(parent && this.get(parent)) {
								this.get(parent).data[method] = model.getReceipt();
								this.recurseForModels(data[key],model.key(),null);
							}
							else { /* error, we have no record of the parent */
								//alert(uri+" "+parent);
								throw("NoRecordOfParentError");
							}
						}
					}
					else { // we are iterating fields now, so we descend again
						if(typeof(data[key]) === "object") {
							this.recurseForModels(data[key],parent,key);
						}
					}
				}
			}
			else { // not worth iterating, something like a building elevation field
				if(this.get(parent)) {
					this.get(parent).data[method] = data;
				}
			}
			if(yield == undefined) { yield = data; }
			return yield;
		},
		setDataProvider: function(model) { // a shipment has come in!
			this.dataProvider = new _a.DataProvider(this.data[model.key()],this);
			this.providers[model.key()] = this.dataProvider;
			this.dataProvider.ready(); // notification!
			_a.State.save(model); // may not save if not a collection-like object
		},
		changeDataProvider: function(model) {
			this.dataProvider = new _a.DataProvider(model,this);
			var that = this; // unnecessary?
			$("html").trigger("newDataProvider",[that.dataProvider]);
			_a.State.save(model);
		},
		auxiliaryDataProvider: function(model) {
			if(model.key() in this.providers) {
				return this.providers[model.key()];
			}
			this.providers[model.key()] = new _a.DataProvider(model,this);
			return this.providers[model.key()];
		},
		refreshProvider: function(dataProviderKey) {
		    var that = this;
		    if(dataProviderKey) {
				this.getFresh(dataProviderKey,function(model){
					that.providers[dataProviderKey].model = model;
					$("html").trigger("dataProviderRefreshed",[that.providers[dataProviderKey]]);
				});
			}
			else {
			    var key = that.dataProvider.model.key();
				this.getFresh(key,function(model){
					that.changeDataProvider(model);
				});
			}
		}
	};
	
	/*
		keep a ticket to the datastore, rather than the object iself
		but if the receipt exists, then we know the object is there
	*/
	
	_a.Receipt = function(key) {
		this.key = key;
		this.name = "Receipt for "+this.key;
	};
	
	_a.Receipt.prototype = {
		checkout: function() {
			return _a.dataStore.get(this.key);
		}
	};
	
	/* The Administrator of the Warehouse of Data */
	
	_a.DataProvider = function(model,dataStore) {
		this.model = model; // an instantiated object passed in
		this.id = this.model.get("id");
		this.dataStore = dataStore; // it's parent warehouse
		this.selection = []; // stack of selected models
		this.subfocusedModel = undefined;
		// history implementation here TODO
	};
	
	_a.DataProvider.prototype = {
		ready: function() {
			$("html").trigger('dataProviderReady',this);
		},
		isDataProvider: function() {
			return true; // this may seem weird, but like... trust me...
		},
		key: function() {
			return this.model.key();
		},
		get: function(field) {
			return this.model.get(field.toLowerCase());
		},
		select: function(key,caller) {
			if(this.isThisModelSelected(key)) {
				if(_a.shiftOn === false) {
					this.dataStore.get(key).visit();
				}
				else {
					this.unselect(key,caller);
				}
				return; // our work here is done
			}
			if(_a.provider().isIterable() === false) {
				this.dataStore.get(key).visit();
			}
			if(this.subfocusedModel !== undefined) {
				this.unsubfocus();
			}
			if(_a.shiftOn === false) {
				this.clearSelection();
			}
			this.multiselect(key,caller); // "multi"-selecting 1 model
		},
		multiselect: function(key,caller) {
			this.selection.push(key);
			buffered_hash = "";
			for(var s in this.selection) {
				buffered_hash += "/"+this.selection[s];
			}
			//window.location.hash = buffered_hash; // url-tracking
			this.dataStore.get(key).select(caller);
		},
		isThisModelSelected: function(key) {
			for(var s in this.selection) {
				if(this.selection[s] == key) {
					return true;
				}
			}
			return false;
		},
		clearSelection: function() {
			while(this.selection.length > 0) {
				this.dataStore.get(this.selection.pop()).unselect();
			}
		},
		unselect: function(key) {
			for(var s in this.selection) { // remove it from the selection stack
				if(this.selection[s] == key) {
					this.selection.splice(s,1);
				}
			}
			//window.location.hash = window.location.hash.replace(key,"");
			this.dataStore.get(key).unselect();
		},
		subfocus: function(key) {
			this.clearSelection();
			if(this.subfocusedModel !== undefined) {
				this.subfocusedModel.unsubfocus();
			}
			this.dataStore.get(key).subfocus();
			this.subfocusedModel = this.dataStore.get(key);
		},
		getSelectionStack: function() { // so we can do context sensitive operations
			return this.selection;
		},
		unsubfocus: function() { // key doesn't matter
			this.subfocusedModel.unsubfocus(); // forget it!
			this.subfocusedModel = undefined;
		},
		hover: function(key) {
			for(var s in this.selection) {
				if(this.selection[s] == key) {
					return 0;
				}
			}
			this.dataStore.get(key).hover();
		},
		unhover: function(key) {
			for(var s in this.selection) {
				if(this.selection[s] == key) {
					return 0;
				}
			}
			this.dataStore.get(key).unhover();
		},
		refresh: function() {
		    // yes I'm aware this is hella strange
		    _a.dataStore.refreshProvider(this.key());
		}
	};

})();