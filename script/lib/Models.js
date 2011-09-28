/*
	Abstract Models for Representation
	by the various Components, subclassed
*/

(function(){
	
	var _a = Archmap;
	
	/* The Abstract Model */
	
	_a.Model = function(data) {
		this.data = data;
	};
	
	_a.Model.prototype = {
		initialize: function(data) {
			this.data = data;
		},
		key: function() { // maybe works?
			return this.get("uri");
		},
		get: function(field,callback,errback) {
			if(this.data[field] !== undefined) {
				var value = this.data[field];
				if(value instanceof _a.Receipt) { // if it's a receipt, get a copy
					value = value.checkout(); // by checking it out of the dataStore
				}
				else if(_a.Utilities.isArray(value)) { // if it's an array of receipts
					var array = this.checkoutReceiptArray(value); // check em all out
					// if it's not an array of receipts, we'll get nothing back!
					if(array.length === 0) {
						array = value;
					}
					value = array;
				}
				if(typeof(callback) == "function") {
					callback(value); // simple asynchronous
				}
				else {
					return value; // simple synchronous, use responsibly!
				}
			}
			else if(field in this.whitelist) {
				var that = this;
				_a.IO.getJSONModel(this.key()+"/"+field,function(data,object){
				    if(typeof callback === "function") {
				        if(that.data[field] !== object) {
				            that.data[field] = object;
				            that.get(field,callback);
				        }
				        else {
				            that.get(field,callback);
				        }
				    }
				},undefined,undefined,function(){
				    if(errback) {
				        errback();
				    }
				});
			}
			else {
			    return false;
			}
		},
		getFresh: function(field,callback) {
			var that = this;
			this.data[field] = undefined;
			// replaces the field and then we just proceed as usual
			_a.IO.getJSONModel(this.key()+"/"+field,function(data,object){
			    that.data[field] = object;
			    that.get(field,callback);
			},true);
		},
		getOriginalKey: function() {
			return this.key();
		},
		getAuthor: function(callback) { // special call for something that does not usually exist
			if(this.get("author_id")) {
				var author = _a.dataStore.get("person/"+this.get("author_id"),function(author){
					if(typeof(callback) === "function") {
						callback(author);
					}
				});
				return author;
			}
			return false; // get here, there is no author to be had
		},
		getType: function() {
			return this.type;
		},
		getItem: function() {
			return false; // stub for compatability
		},
		getReceipt: function() {
			return new _a.Receipt(this.get("uri"));
		},
		checkoutReceiptArray: function(array) {
			var newarray = []; // make a copy, so we don't overwrite
			var length = array.length, i = 0;
			for(i = 0; i < array.length; i += 1) { // checkout each receipt
				if(array[i] instanceof _a.Receipt) {
					newarray[i] = array[i].checkout();
				}
			}
			return newarray;
		},
		shout: function(eventName,caller) { // a fun way to trigger events, wheee!
			try { $("html").trigger(eventName,[this.key(),caller]); }
			catch(e) { /*_a.log(e);*/ }
		},
		// simple event masks
		select: function(caller) { this.shout("modelSelected",caller); },
		unselect: function() { this.shout("modelUnselected"); },
		hover: function() { this.shout("modelHoverOn"); },
		unhover: function() { this.shout("modelHoverOff"); },
		focus: function() { this.shout("modelFocused"); },
		blur: function() { this.shout("modelBlurred"); },
		update: function() { this.shout("modelUpdated"); },
		subfocus: function() { this.shout("modelSubfocused"); },
		unsubfocus: function() { this.shout("modelUnsubfocused"); },
		// go to the model's homepage (link simulation)
		visit: function() {
			window.location.href = _a.uri+"/"+this.key(); // take me there!
		},
		set: function(field,value,callback) { // alias for get/set idea
		    this.put(field,value,callback);
		},
		put: function(field,value,callback) {
			_a.IO.put(this.key(),field,value,function(data){
				if(callback !== undefined) {
					callback(data);
				}
			});
		},
		edit: function(callback,e) {
			var editor = new _a.PopoverEditor(this,function(){
				callback();
			},e);
		},
		isExpandable: function() {
			// should be expanded in the future to include social entities etc.
			var main_id = _a.dataStore.dataProvider.id;
			if(this.type == "Collection" && this.get("id") !== main_id) {
				return true;
			}
			else {
				return false;
			}
		},
		isIterable: function() {
			if(this instanceof _a.Collection || this instanceof _a.Search) {
				return true;
			}
			if(this.getItem() && this.getItem() instanceof _a.Collection) {
				return true;
			}
			return false; // otherwise
		},
		isProvider: function() {
			if(this.get("id") === _a.dataStore.dataProvider.id) { return true; }
			else { return false; }
		},
		iterateChildren: function(callback) { // deprecated (but still works, since it's different)
			this.get("members",function(members){
				try {
					$.each(members,function(i,child){
						callback(i,child);
					});
				}
				catch(e) {
					//alert(e);
				}
			});
		},
		iterateMembers: function(callback,finalizeCallback,reverse) { // function for members
		    var result = {};
			this.get("members",function(members){
			  if(reverse === true) { members.reverse(); }
				$.each(members,function(i,member){
					result[member.key()] = callback(i,member);
				});
				if(typeof(finalizeCallback)==="function"){ finalizeCallback(); }
			});
			return result;
		},
		mapMembers: function() {
		    var mapping = _.map(this.get("members"),function(m){
		        callback(m);
		    });
		    if(typeof finalizeCallback === "function") {
	            finalizeCallback();
	        }
	        return mapping;
		},
		toString: function() {
			return this.type + "\t"+ this.get("id");
		},
		isOfType: function(type) {
			if(this.type.toLowerCase() == type.toLowerCase()) {
				return true;
			}
			return false;
		},
		isanitem: function() {
		    return false;
		},
		whitelist: { descript:true, relations:true }
	};
	
	/* Implementations of Model */
	
	// meta-ly writes subclass constructors, since they all look the
	// same -- saves on space when js is traveling over the wire
	// also it's pretty ugly to write out a bunch of stubs for all these classes
	// meant to correspond directly with php classes (in architecture, not function)
	
	var subclasses = [
    "Building",
    "Person",
    "Place",
    "Publication",
    "Catalog",
		"Image",
		"Node",
		"Map",
		"HistoricalEvent",
		"LexiconEntry",
		"SocialEntity",
		"Note",
		"Collection",
		"Search",
		"Slideshow",
		"CollectionItem",
		"Meta",
		"Slide",
		"BuildingModel",
		"Keyword",
		"ImageType"
	];
	
	$.each(subclasses,function(i,subclass){ // for each of the subclasses, write a constructor
		_a[subclass] = function(data) {
			this.data = data; // save its data
			this.type = subclass; // record its type (since js lacks introspection)
		};
		_a[subclass].prototype = new _a.Model(this.data); // make it a subclass
	});
	
	/* subclassing collection with things that are collections by any other name */
	// this is a crappy idea, get rid of this
	
	var collectionSubs = ["Story","Feature","SocialEntity","Chapter"];
	$.each(collectionSubs,function(i,sub){
		_a[sub] = function(data) {
			this.data = data;
			this.type = sub;
		};
		_a[sub].prototype = new _a.Collection(this.data); // subclass of collection
	});
	
	/* extend various models if more methods necessary */
	
	jQuery.extend(_a.Building.prototype,{
	    get: function(key,callback) {
	        var exceptions = {
    	        naveHeight: true,
                naveWidth: true,
                aisleHeight: true,
                aisleWidth: true
    	    };
	        if(this.buildingModel !== undefined && key in exceptions) {
	            return this.buildingModel[key]();
	        }
	        else {
	            return _a.Model.prototype.get.apply(this,arguments);
	        }
	    },
		getBuildingModel: function(callback) { // for parametric data
		    var that = this;
		    this.get("model",function(buildingModel){
    			callback(buildingModel);
    			that.buildingModel = buildingModel;
    		});
		},
		whitelist: {
		    floorplan:true, frontispiece:true, nave:true, plan:true,
    	    elevation:true, history:true, chronology:true, significance:true, bibliography:true,
    	    model:true, images:true, canonicalSlideshow:true, bibliography_list:true,
    	    historical_events: true, relations:true, other_images: true,
    	    lat_section: true, exterior_chevet: true
		}
	});
	
	jQuery.extend(_a.HistoricalEvent.prototype,{
	    whitelist: {
	        buildings_involved:true, bibliography_list:true,
	        descript:true, relations:true
	    }
	});
	
	jQuery.extend(_a.BuildingModel.prototype,{
		/* parametric constants */
		zones: {
			"nave": 1, "transept": 2, "crossing":3, "choir":4
		},
		positions: {
			"main": 1, "arcade": 2, "aisle": 3, "wall": 4, "aisle2": 5
		},
		dimensions: {
			"apex": 1, "springer": 2, "boss": 3, "opening": 4, "wall": 5, "centerline": 6
		},
		getDim: function(zone,position,dim) {
			var zoneNum = this.zones[zone.toLowerCase()];
			var posNum = this.positions[position.toLowerCase()];
			var dimNum = this.dimensions[dim.toLowerCase()];
			return this.data.dimensions[zoneNum+"_"+posNum+"_"+dimNum];
		},
		maxHeight: function() {
		    return this.naveHeight();
		},
		naveHeight: function() {
		    return this.getDim("nave","main","apex");
		},
		naveWidth: function() {
		    return this.getDim("nave","main","opening");
		},
		aisleHeight: function() {
		    return this.getDim("nave","aisle","apex");
		},
		aisleWidth: function() {
		    return this.getDim("nave","aisle","opening");
		}
	});
	
	jQuery.extend(_a.Collection.prototype,{
		add: function(model,resetProvider,callback,additionalParams) {
			var that = this,
			    last = this.last(),
			    sortval = (last) ? last.get("sortval") + 1 : 1,
			    params = {
			        item_entity_id: model.type.toLowerCase(),
			        item_id: model.get("id"),
			        sortval: sortval
			    };
			// add some additional params if necessary
			$.extend(params,additionalParams);
			// now post it!
			_a.IO.post(this.key(),
				params,
				function(data,item){
					if(resetProvider) { // if set to true, will tell everyone about new provider
						var new_collection = _a.dataStore.get(that.key());
						if(resetProvider === true) {
						    _a.triggerEvent("refreshDataProvider"); // should trigger event on the model
						}
						else {
						    _a.triggerEvent("refreshDataProvider",[resetProvider]);
						}
					}
					if(typeof(callback) === "function") {
						callback();
					}
				}
			);
		},
		whitelist: { "members":true, "render_style":true },
		last: function() {
		    var members = this.get("members");
		    if(members) {
		        return members[members.length-1];
		    }
		    else {
		        return false;
		    }
		}
	});
	
	jQuery.extend(_a.CollectionItem.prototype,{
		key: function() {
			if(this.getItem() instanceof _a.Model) {
				return this.getItem().key();
			}
			return this.data.uri;
		},
		// overwriting the get function, to be transparent to the contained object
		get: function(field,callback) {
			var value = _a.Model.prototype.get.apply(this,arguments);
			if(value === false || value === undefined) {
				return this.getItem().get(field,callback);
			}
			return value; // return the value if it's good
		},
		isanitem: function() {
		    return true;
		},
		getOriginalKey: function() {
			return this.data.uri;
		},
		getType: function() {
			return this.getItem().getType();
		},
		isOfType: function(type) {
			return this.getItem().isOfType(type);
		},
		isExpandable: function() {
			return this.getItem().isExpandable();
		},
		getItem: function() {
			return this.get("item");
		},
		savePosition: function(position,callback) {
			_a.IO.put("CollectionItem/"+this.data.id,"sortval",position,function(data){
			    if(typeof callback === "function") {
			        callback();
			    }
			});
		},
		del: function(callback) {
			_a.IO.del(this.data.uri,function(){
				if(typeof(callback) === "function") {
					callback();
				}
			});
		}
	});
	
	jQuery.extend(_a.Meta.prototype,{
		whitelist: { "requirements":true, "nonrequirements":true }
	});
	
	jQuery.extend(_a.Slide.prototype,{
		getImage: function() {
			return this.get("image");
		}
	});
	
	jQuery.extend(_a.Person.prototype,{
	    whitelist: {
	        descript: true, relations: true,
	        authored_books: true, edited_books: true,
	        images: true, my_collections: true
	    }
	});
	
	jQuery.extend(_a.Publication.prototype,{
	    whitelist: {
	        descript:true, relations:true, authors: true, editors: true,
	        buildings_referenced: true, events_referenced:true
	    }
	});
	
	jQuery.extend(_a.Image.prototype,{
		whitelist: { plot:true, lexiconentries:true, imagetypes:true },
		get: function(field,callback) {
		    if(field === "building") {
		        // non-callback get is not supported
		        _a.dataStore.get("building/"+this.get("building_id"),function(building){
		            callback(building);
		        });
		    }
		    else {
		        return _a.Model.prototype.get.apply(this,arguments);
		    }
		},
		getImageArea: function(height,width) {
			var dims = this.maximizeForTile(height,width);
			return dims.height * dims.width;
		},
		fitToSpace: function(height,width,imgElement) {
			var dims = this.maximizeForTile(height,width);
			if(dims.width > dims.height) {
				var size = this.maximizeForDimension(dims.width);
			}
			else {
				var size = this.maximizeForDimension(dims.height);
			}
			var src = this.get("medium").replace("/700/","/"+size+"/");
			imgElement.height(dims.height).width(dims.width).attr("src",src);
			return dims;
		},
		maximizeForTile: function(height,width) {
			var ratioElement = height/width;
			var ratioImage = this.get("height")/this.get("width");
			if(ratioImage > ratioElement) {
				return { height: height, width: this.get("width") * (height/this.get("height")) };
			}
			else {
				return { width: width, height: this.get("height") * (width/this.get("width")) };
			}
		},
		maximizeImg: function(width,height,element) {
			var maxes = this.maxSizeFor(width,height);
			element.attr("src",maxes[0]).width(maxes[1]).height(maxes[2]);
		},
		isWidthwise: function() {
			if(this.get("width") > this.get("height")) { return true; }
			return false;
		},
		centerAndFit: function(height,width,imgElement,padding,isAbsolute) {
			if(padding !== undefined) {
				var dims = this.fitToSpace( height - padding.y, width - padding.x, imgElement );
				var marginTop = (height - dims.height)/2;
			}
			else {
				var dims = this.fitToSpace(height,width,imgElement);
				var marginTop = (height - dims.height)/2;
			}
			if(isAbsolute === true) {
				var marginLeft = (width - dims.width)/2;
				imgElement.css("top",marginTop).css("left",marginLeft);
			}
			else {
				imgElement
				    .attr("image_id",this.get("id"))
				    .css("margin-top",marginTop)
				    .css("margin-bottom",marginTop);
			}
		},
		centerAndScaleAndFit: function(height,width,imgElement,against,padding) {
			if(padding !== undefined) {
				var dims = this.fitToSpace( height - padding.y, width - padding.x, imgElement ); // fitting
			}
			else {
				var dims = this.fitToSpace(height,width,imgElement); // fitting
			}
			var ratio = against/parseFloat(this.get("scale")); // scaling
			if(isNaN(ratio)) { return; } // scaling
			imgElement.width(imgElement.width()*ratio).height(imgElement.height()*ratio); // scaling
			imgElement
			    .attr("image_id",this.get("id"))
			    .css("margin-top",(height-imgElement.height())/2); // centering
		},
		maximizeForDimension: function(dimension) {
			if(dimension > 1700) { return 2000; }
			else if(dimension > 1300) { return 1700; }
			else if(dimension > 700) { return 1300; }
			else if(dimension > 300) { return 700; }
			else if(dimension > 100) { return 300; }
			else if(dimension > 50) { return 100; }
			else { return 50; }
		},
		urlForSize: function(size) {
			return this.get("medium").replace("/700/","/"+size+"/");
		},
		scale: function(imgElement,against) {
			var ratio = against/parseFloat(this.get("scale"));
			if(isNaN(ratio)) { return; }
			imgElement.width(imgElement.width()*ratio).height(imgElement.height()*ratio);
		},
		addKeyword: function(keyword) {
		    // lil' bit of a hack
		    this.put("newKeyword",keyword);
		},
		removeKeyword: function(keyword) {
		    // also a lil' bit of a hack
		    this.put("removeKeyword",keyword);
		}
	});
	
	_a.BlankImage = function() {};
	_a.BlankImage.prototype = {
	    get: function(key) {
	        var sizes = { thumbnail:true, small:true, medium:true };
	        return (key in sizes) ? "/media/ui/blank2.png" : false;
	    },
	    maximizeForTile: function(th,tw) {
	        return {
	            height: th/2,
	            width: tw/2
	        };
	    },
	    centerAndFit: function() {
	        return false;
	    },
	    maxHeight: function() {
	        return false;
	    }
	};
	
	jQuery.extend(_a.Map.prototype,{
		whitelist: { shape_collection:true }
	});
	
	jQuery.extend(_a.Search.prototype,{
		// yes I know this is ugly because it is already defined above... but how to override???
		iterateMembers: function(callback,finalizeCallback) {
			this.get("quicksearch",function(members){
				$.each(members,function(i,member){
					callback(i,member);
				});
				if(typeof(finalizeCallback)==="function"){ finalizeCallback(); }
			});
		},
		whitelist: { nonrequirements:true, facetedimages:true }
	});
	
})();