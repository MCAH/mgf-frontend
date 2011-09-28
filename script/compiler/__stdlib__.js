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
/* generic IO functions */

(function(){
	
	var _a = Archmap;
	
	var _loading = {},
	    _loaded = {},
	    _callbacks = {},
	    _yields = {},
	    _requireQueue = [],
	    _queuer = undefined; // function for attempting
	
	_a.IO = {
	    /*
	        @url: the exact stub url that you want
	        @urlParams: things after a question mark, as a js object literal
	        @callback: the function you want called on download
	        @dataType: (optional) the data type
	        @shouldCache: are we allowed to cache the response?
	    */
	    get: function(params) {
	        var url = params.url,
	            urlParams = params.urlParams || {},
	            callback = params.callback,
	            dataType = params.dataType || "json",
	            shouldCache = params.shouldCache || false;
	        if(url === undefined) {
	            return false; // precaution
	        }
	        // add the function to the list of things to-do when source downloads
	        if(typeof callback === "function") {
	            if(_callbacks[url] === undefined) {
	                _callbacks[url] = [];
	            }
	            _callbacks[url].push(callback);
	        }
	        // now determine if we have or don't have that data
	        if(_loaded[url]) { // truthy
	            _a.IO.sendGet(url); // if it's already here, just return it
	        }
	        else if(_loading[url] !== true) {
	            _loading[url] = true; // so noone else gets here
	            urlParams.linkBase = _a.uri;
	            /*if(dataType === "script") {
	                _requireQueue.push(url);
	                clearTimeout(_queuer);
	                _queuer = setTimeout(function(){
	                    _a.IO.clearRequireQueue();
	                },5);}*/
                this.remoteGrab(url,{
	                url: _a.uri + url,
	                dataType: dataType,
	                data: urlParams,
	                cache: shouldCache,
	                success: function(data) {
	                    _loaded[url] = data; // the raw data
	                    if(dataType === "json" || dataType === "html") {
	                        _a.IO.remember(url,data);
	                    }
	                    _loading[url] = false;
	                    if(dataType === "json") {
	                        _a.dataStore.convertJSONToArchObjects(data.archmap_says,function(yield){
	                            _yields[url] = yield;
                                _a.IO.sendGet(url);
	                        });
	                    }
	                    else {
	                        _a.IO.sendGet(url); // now ship the delivery!
	                    }
	                },
	                complete: function(xhr) {
	                    if(xhr.status > 400 && params.errback) {
	                        params.errback();
	                    }
	                }
	            });
	        }
	    },
	    // function that you use like $.ajax but you might get local stuff back, what?!
	    remoteGrab: function(url,params) {
	        $.ajax(params);
	        return;
	    },
	    remember: function(url,data) {
	        // theoretically uses localstorage, but that's not really used
	    },
	    clearRequireQueue: function() {
	        var concatUrl = _a.uri,
	            queue = _requireQueue;
	        _requireQueue = []; // empty it
	        for(var i = 0; i < queue.length; i += 1) {
	            concatUrl += queue[i] + "+";
	        }
	        $.ajax({
	            url: concatUrl.slice(0,-1),
	            dataType: "script",
	            success: function() { // scripts have been evaluated
	                $.each(queue,function(i,url){
	                    _loaded[url] = true;
	                    _loading[url] = false;
	                    _a.IO.sendGet(url);
	                });
	            }
	        });
	    },
		getFresh: function(url,callback) {
			_loaded[url] = false;
			_a.IO.get({
			    url: url,
			    callback: callback
			});
		},
		sendGet: function(url) {
		    var callbacks = _callbacks[url],
    		    length = callbacks.length;
		    if(callbacks === undefined) {
		        return; // so no one wanted to callback? weird
		    }
    		for(var i = 0; i < length; i += 1) {
    		    _a.IO.sendGetCallback(url,callbacks[i]);
    		}
    		_callbacks[url] = []; // empty the callback stack
		},
		sendGetCallback: function(url,callback) {
		    try {
				callback(_loaded[url],_yields[url]);
			}
			catch(e) { // if the callback fails that means it was probably Firefox being lame
				setTimeout(function(){ // so we should go ahead and try again at Firefox's leisure
					callback(_loaded[url],_yields[url]);
				},500); // 500 should be enough right?
			}
		},
		put: function(key,field,value,callback) {
			//if(_a.uri == "") { _a.uri = "/"; }
			$.ajax({
				type: "POST", // really a post, only sort-of a PUT
				url: _a.uri+"/api/"+key+".json?read=true&link_base="+_a.uri,
				data: "_method=PUT&"+field+"="+value, // make sure PUT is specified
				dataType: "json",
				success: function(data) {
					var yield = _a.dataStore.convertJSONToArchObjects(data.archmap_says);
					callback(data,yield);
				}
			});
		},
		post: function(url,data_hash,callback) {
			$.ajax({
				type: "POST",
				url: _a.uri+"/api/"+url+".json?read=true",
				data: data_hash,
				dataType: "json",
				success: function(data) {
					var yield = _a.dataStore.convertJSONToArchObjects(data.archmap_says);
					callback(data,yield);
				}
			});	
		},
		del: function(key,callback,errback) {
			$.ajax({
				type: "POST",
				url: _a.uri+"/api/"+key+".json?read=true",
				data: { "_method":"DELETE" },
				dataType: "json",
				success: function(data) {
					callback(data);
				}
			});
		},
		// getting models from the json api
		getJSONModel: function(key,callback,getFresh,params,errback) {
		    var url = "/api/"+key+".json";
		    if(getFresh === true) {
		        _loaded[url] = undefined;
		    }
		    _a.IO.get({
		        url: url,
		        dataType: "json",
		        callback: callback,
		        urlParams: params,
		        errback: errback
		    });
		},
		// special function, not the like others, just always get the page, simple enough
		loadPartial: function(url) {
		    $.ajax({
		        url: url,
		        dataType: "html",
		        data: {
		            mode: "partial"
		        },
		        success: function(html) {
        		    $("div#stage").empty().html(html);
		        }
		    });
		},
		// other input/output functions, simplify common tasks	
		require: function(src,callback) { // get some code (defers to generic get)
		    if($.isArray(src)) {
		        // now request them all at once and keep a ticker for coming back
		        var count = src.length;
		        _(src).each(function(script){
		            this.require(script,function(){
		                count = count - 1;
		                if(count === 0) {
		                    callback();
		                }
		            });
		        },this);
		        return;
		    }
		    // should be testing here to see if the thing already exists in javascript env
		    if(src.contains("components")) {
		        var name = src.split("/").pop().replace(".js","");
		        if(_a[name] !== undefined) {
		            callback();
		            return;
		        }
		        src += "/"+name;
		    }
		    if(src.contains("dependencies")) {
		        src = "script/"+src;
		    }
		    // the normal thing to do...
    		_a.IO.get({
    		    url: "/"+src+".js",
    		    dataType: "script",
    		    callback: callback,
    		    shouldCache: ( src.indexOf("dependencies") >= 0 ) // 3rd-party, non-volatile
    		});
		},
		// get set-up html for a component and return it
		getComponentHtml: function(name,callback) {
			_a.IO.get({
			    url: "/components/"+name+"/"+name+".html",
			    callback: callback,
			    dataType: "html"
			});
		}
	};
	
	_a.State = {
		save: function(model) {
			if(model.type == "Collection") {
				_a.IO.require("dependencies/Cookies",function(){
					$.cookie("last_collection",model.key());
					_a.log("last collection set to be "+model.key());
				});
			}
		},
		retrieve: function() {
			return $.cookie("last_collection");
		}
	};
	
})();/*  the code to turn static html component
    links into functioning javascript components */

(function(){
    
    var _a = Archmap;

    _a.Template = {
    	templatize: function(dom) {
    	    var domHandle = $(dom);
    		var dataStore = _a.dataStore;
    		var model = dataStore.dataProvider.model;
    		// so the model can be grabbed by whoever wants it
    		domHandle.addClass("model_holder").data("model",model);
    		var dataProvider = dataStore.dataProvider;
    		domHandle.find(".component").each(function(){
    		    var $this = $(this),
    		        model = $this.attr("id");
    			// should make class the only way to create a component
    			if(model == "") {
    				model = $this.attr("class").match(/^[A-Z][\w0-9]+\b/)[0];
    			}
    			var dp = $this.attr("rel");
    			//var that = this;
    			var requireCallback = function(){
    			    // start the component-creation params
    			    var options = { sandbox: $this };
    			    // add inlineOptions if they exist
    			    var inlineOptions = $this.attr("options");
    			    if(inlineOptions) {
    			        _.each(inlineOptions.split(";"),function(option){
    			            var pair = option.split(":");
    			            options[pair[0]] = pair[1];
    			        });
    			    }
    			    // bind to a named function, since one case below is async
    			    var build = function(opts) {
    			        var component = new _a[model](opts);
    			        $this.data("thisComponent",component);
    			    };
    			    // add the dataprovider to the params
    			    if(dp === "this" || dp === "" || dp === undefined) {
    			        options.provider = dataProvider;
    			        build(options); // sync
    			    }
    			    else { // async requests required (maybe not, but we can do it that way)
    			        var goAhead = function(resource) {
    			            _a.dataStore.get(resource,function(model){
        			            options.provider = model;
        			            build(options); // async
        			        });
    			        };
    			        if(dp.indexOf("cookie") >= 0) {
    			            _a.IO.require("dependencies/Cookies",function(){
    			                var parts = dp.split(";"),
        			                resource = $.cookie(parts[0].split(":")[1]) || parts[1].split(":")[1];
        			            goAhead(resource);
        			        });
    			        }
    			        else {
    			            goAhead(dp);
    			        }
    			    }
    			};
    			// now actually call it
    			var defer = $this.attr("loaddefer");
    			if(defer == "true") { defer = 1800; }
    			if(defer) { // truthy, since it contains a value
    			    setTimeout(function(){
    			        _a.IO.require("components/"+model,requireCallback);
    			    },defer);
    			}
    			else {
    			    _a.IO.require("components/"+model,requireCallback);
    			}
    		});
    		
    		// necessary for editing functionality, binds a model to a DOM element
    		// however, should be removed as dom-binding is expensive (or so I heard)
    		// and unnecessary, since someone can look this up only when necessary
    		
    		domHandle
    		    .find(".model_holder").each(function(){
    			    $(this).data("model",_a.dataStore.get($(this).attr("rel")));
    		    });
    		domHandle
    		    // turns straight ticks into curly ticks
    		    .find(".pretty").each(function(){
    			    $(this).html($(this).text().replace(/\'/g,'&rsquo;').replace(/\n/g,"<hr/>"));
    		    });
    		domHandle
    		    // in editable mode, if a field is empty, make sure there's some stub text there
    		    .find(".editable.clickable").each(function(){
    		        var $this = $(this),
    		            text = $this.text();
    			    if(text == "" || text.match(/^[\s]+$/) || !text) {
    				    $this.html("<em>n/a</em>");
    			    }
    		    });
		
    	}
    };

})();/*
	Enabling Simple and Complex Edits on 
	various fields based on a user's authorization
	level (which is processed server-side)
	Similar in spirit to to the BigImageComponent
	since nothing depends on it and all the 
	events are live jquery events
*/

(function(){
	
	var _a = Archmap;
	
	/* User */
	
	_a.User = function(data) {
		this.initialize(data);
	};
	
	_a.User.prototype = {
		initialize: function(data) {
			this.data = data; // cache user data
			if(this.data.auth_level > 1) { // enable editing
				this.editor = new _a.Editor(this.data.auth_level);
			}
			else { // don't let anything look editable
				var neuter = function() {
					$(".hoverable").removeClass("hoverable");
					$(".clickable").removeClass("clickable");
					$(".editable").removeClass("editable");
				};
				$("html").bind("HTMLUpdated",neuter);
				$(function(){
				    neuter(); // call it now
				});
			}
		}
	};
	
	_a.EditorialBoard = { // place for utility editing functions
		makeEditable: function(options) {
			options.element
				.addClass("editable")
				.addClass(options.interaction)
				.attr("rel",options.field);
			_a.EditorialBoard.bindModel(options.element,options.model);
		},
		makeHoverableEditable: function(options) {
			options.interaction = "hoverable";
			_a.EditorialBoard.makeEditable(options);
		},
		makeClickableEditable: function(options) {
			options.interaction = "clickable";
			_a.EditorialBoard.makeEditable(options);
		},
		bindModel: function(element,modelKey) {
			element.addClass("model_holder");
			if(modelKey instanceof _a.Model) { // someone is passing us a model, not a key
				element.attr("type",modelKey.key()).data("model",modelKey); // is the type thing necessary?
			}
			else {
				_a.dataStore.get(modelKey,function(model){
					element.attr("type",model.key()).data("model",model);
				});
			}
		},
		editableParagraph: function(model,key,value) {
		    var p = $("<p/>",{
                html: value,
                "class": "editable hoverable",
                rel: key
            });
            this.bindModel(p,model.key());
            return p;
		}
	};
	
	_a.Editor = function(auth) {
		this.initialize(auth);
	};
	
	_a.Editor.prototype = {
		initialize: function(auth) {
			this.known_metas = {};
			this.auth_level = auth;
			this.listen();
			var that = this;
		},
		listen: function() {
			var that = this;
			$("body").find(".editable.clickable").live("click",function(){
				//if($(this).attr("contentEditable") == "false") {
				that.clickProcess2($(this));
				//}
				return false; // prevent hash in the url
			});
			$("body").find(".editable.hoverable").live("mouseover",function(){
				// if there is not a button, then add a button
				//if($(this).attr("contentEditable") == "false") {
					if($(this).find(".edit-hover").length == 0) {
						$(this).append("<a href='#edit' class='edit-hover'>Edit!</a>");
					}
				//}
			});
			$("body").find(".edit-hover").live("click",function(){
				var parent = $(this).parent();
				//that.clickProcess2(parent);
				that.clickProcess(parent);
				return false; // prevent hash in url
			});
		},
		clickProcess2: function(element,callback) {
			// look back up the line until you find the containing model
			var model = element.closest(".model_holder").data("model");
			var field = element.attr("rel");
			var that = this;
			_a.dataStore.getMetaForModelAndField(model.type,field,function(meta){
				if(that.isAuthorized2(meta) === true) {
					that.makeEditable2(model,meta,element,callback);
				}
			});
		},
		clickProcess: function(element) {
			var model = element.closest(".model_holder").data("model");
			var field = element.attr("rel");
			var that = this;
			_a.dataStore.getMetaForModelAndField(model.type,field,function(meta){
			    if(that.isAuthorized2(meta)) {
			        that.makeEditable(model,meta.data,element);
			    }
			});
		},
		// deprecated
		mapProcess: function(map_holder,marker,container) {
			var lat_spot = container.find("strong[rel='lat']");
			var lng_spot = container.find("strong[rel='lng']");
		},
		mapProcess2: function(lat,lng,container) {
			var lat_spot = container.find("strong[rel='lat']");
			var lng_spot = container.find("strong[rel='lng']");
			lat_spot.text(lat);
			lng_spot.text(lng);
			var that = this;
			this.clickProcess2(lat_spot,function(){
				that.clickProcess2(lng_spot);
				lng_spot.blur();
			});
			lat_spot.blur();
		},
		isAuthorized2: function(meta) {
			if(meta.get("auth_level") > this.auth_level) {
				alert("You are not authorized to edit this");
				return false;
			}
			return true; // innocent until proven guilty
		},
		isAuthorized: function(data) {
			if(data.status == "404") {
				alert("Hmm... I don't know if you can edit this. Ask Rob about it.");
				return false;
			}
			else {
				var meta = data.response.Meta;
				if(meta.auth_level > this.auth_level) {
					alert("You are not authorized to edit this.");
					return false; // not authorized!
				}
				else {
					return true; // authorized!
				}
			}
		},
		suggestify: function() {
			
		},
		makeEditable2: function(model,meta,element,callback) {
			// yes this is _very_ weird (awesome) looking
			var preventSave = false; // a timer to be setup later
			var that = this;
			var editbox = $("<div/>",{
				"class": "editor",
				html: $("<button/>",{
					text: "Cancel",
					click: function() {
						preventSave = true;
						element.html(element.data("original"));
					}
				})
			});
			element
				.addClass("editing")
				.data("original",element.html()) // cache the text as it was
				.attr("contentEditable",true)
				.bind("paste",function(){
					var original = $(this).html();
					var element = $(this);
					setTimeout(function(){
						element.html(that.convertPaste(element));
					},0);
				})
				.blur(function(){ // blurring is saving (after a delay, of course)
					element.unbind("blur");
					setTimeout(function(){
						element
							.removeClass("editing")
							.attr("contentEditable",false) // no longer editable
							.next("div.editor").remove();
						if(preventSave === false) {
							editbox.empty().html("<em>Saving....</em>");
							that.save2(model,meta,element,callback);
							editbox.remove();
						}
					},100); // just event so that this doesn't happen before a cancel click
				})
				// jumpstart on editing
				.find("a.edit-hover").remove(); // hide the edit button if there is one
			element.focus();
			if(meta.get("type") == "textarea") {
				element.after(editbox);
			}
			//else {
			//	element.focus();
			//}
		},
		makeEditable: function(model,meta,element) {
			var clone = element.clone();
			clone.find("a.edit-hover").remove();
			clone.find("a.inline").each(function(){
				var alias = $(this).text() || $(this).find("img").attr("title") || null,
				    unique = $(this).attr("href").replace(_a.uri+"/","").split("/"),
				    abbrev = "["+_a.Config.abbrevs[unique[0]]+"-"+unique[1]+"]";
				if(alias) $(this).text("_"+alias+"_ "+abbrev);
				else $(this).text(abbrev);
			});
			clone.find("em.inline").each(function(){
			    $(this).text("*"+$(this).text()+"*");
			});
			clone.find("span.underlined").each(function(){
				$(this).text("%%"+$(this).text()+"%%");
			});
			var old = clone.html().toString(); // dangerous???
			old = old.replace(/<br>/g,"\n"); // little bit of magic
			old = this.characterConvert(old);
			clone.html(old); // logical calisthentics here
			old = clone.text(); // put it in, take it out again
			
			if(old == "unavailable...") { old = ""; }
			var original_display = element.css('display');
			element
			    .css('display','none')
			    .after("<div class='editor'><button rel='save'>Save</button>"
				    +"<button rel='cancel'>Cancel</button></div>");
			if(meta.type == "input") {
				element.next(".editor").prepend("<input class='put' value='"+old+"' type='text'/>");
			}
			else {
				element.next(".editor").prepend("<textarea class='put'>"+old+"</textarea>");
			}
				
			// shh! now we listen...
			var that = this;
			var editor = $(element).next(".editor"); // cache it!
			
			editor.find("button[rel='save']").click(function(){
				var value = "";
				if(meta.type == "input" || meta.type == "textarea") {
					value = editor.find(".put").attr("value"); // makes no sense
				}
				else { value = editor.find(".put").text(); }
				that.save(model,meta,element,value); // and now... save it!
				$(element).css('display',original_display); // and make everything look the way it did
				editor.remove(); // don't worry it'll be overriden on the callback!
			});
			
			editor.find("button[rel='cancel']").click(function(){
				$(element).css('display',original_display);
				editor.remove();
			});
		},
		boil: function(element) {
			// flatten the string, graft out all the breaks
			var boiled = this.characterConvert(element.html().toString());
			boiled = boiled
				.replace(/(<br(\/)?>){2}/g,"\n\n") // convert line-breaks
				.replace(/&nbsp;/g," ")
				.replace(/(<|&lt;)(\/)?[\w]+(>|&gt;)/g,"")
				.replace(/\n[ ]+/g,"\n");
			return boiled;
		},
		convertPaste: function(element) {
			var string = element.html().toString()
				.replace(/\n/g," ")
				.replace(/<\/(div|p|h(1|2|3|4|5|6))>/g,"{n}") // convert block-levels to encoded <br/>s...
				.replace(/<[^<>]+(\/)?>/g," ") // now strip all tags
				.replace(/\{n\}/g,"<br/><br/>"); // get yer newlines back
			return this.characterConvert(string);
		},
		characterConvert: function(string) { // excising annoying characters
			// double curly quotes
			string = string.replace(/\u201c/g,"\"").replace(/\u201d/g,"\"");
			// single curly quotes
			string = string.replace(/\u2018/g,"'").replace(/\u2019/g,"'");
			// em and en dashes
			string = string.replace(/\u2014/g," -- ").replace(/\u2013/g,"--");
			// now all these characters are gone, but don't worry, php adds them back
			return string;
		},
		save2: function(model,meta,element,callback) {
			var field = meta.get("field");
			var value = this.boil(element);
			model.set(field,value,function(){
			    model.getFresh(field,function(newValue){
			        element.html(newValue);
			        if(typeof callback === "function") {
			            callback();
			        }
			    });
			});
		},
		save: function(model,meta,element,value) {
			var unique = model.id;
			var type = model.type;
			var field = meta.field;
			value = this.characterConvert(value);
			model.set(field,value,function(){
			    model.getFresh(field,function(newValue){
			        element.empty().html(newValue);
			    });
			});
		}
	};
	
	_a.PopoverEditor = function(model,callback) {
		this.start(model,callback);
	};
	
	_a.PopoverEditor.prototype = {
		start: function(model,callback) {
			this.model = model;
			this.callback = callback;
			this.dom = $("<div/>",{
			   "class": "popover" 
			});
			$("body").append(this.dom);
			
			var that = this;
			_a.IO.getComponentHtml("PopoverEditor",function(html){
				that.dom.append(html);
				that.listen();
				that.dom.children("div").append("<h3>More Information</h3>");
				that.loadAllEditableFields(that.model);
				_a.EditorialBoard.bindModel(that.dom.children("div"),model.key());
    			that.dom.height($(document).height());
    			that.dom.find(".popover_panel").css("marginTop",$("body").scrollTop()+25);
			});
		},
		listen: function() {
			var that = this;
			this.dom.find("button.finish").click(function(){
				that.dom.remove();
				_a.dataStore.getFresh(that.model.key(),function(model){
					that.callback(model);
				});
			});
		},
		loadAllEditableFields: function(model) {
			var that = this;
			_a.dataStore.get("meta/"+model.getType()+"::new",function(bigMeta){
			    bigMeta.get("requirements",function(requirements){ // requirements first
					bigMeta.get("nonrequirements",function(nonrequirements){
						// now we can add the fields synchronously
						$.each(requirements,function(i,meta){
							that.addEditableField(meta,model);
						});
						$.each(nonrequirements,function(i,meta){
							that.addEditableField(meta,model);
						});
					});
				});
			});
		},
		addEditableField: function(meta,model) {
			var drop = this.dom.children("div");
			var that = this;
			model.get(meta.get("field"),function(value){ // ah, async
				if(value == ""  || value.match(/^[\s]+$/)) {
				    value = "n/a";
				}
				if(meta.get("editbox") == 0) {
				    return;
				}
				if(meta.get("type") == "textarea") {
					drop.append("<span>"+meta.get("descript")+"</span> "
						+"<p class='editable hoverable' rel='"+meta.get("field")+"'>"+value+"</p>");
				}
				else if(meta.get("type") == "input") {
					drop.append("<span>"+meta.get("descript")+"</span> "
						+"<strong class='editable clickable' rel='"+meta.get("field")+"'>"+value+"</strong>");
				}
				else if(meta.get("type").indexOf("<") >= 0) {
				    var typeDef = meta.get("type").match(/\<([A-Z][\w]+)\>/)[1]; // type of object the list expects
				    model.get(meta.get("field"),function(collection){
				       that.addEntityChooser(meta,collection,typeDef);
				    });
				}
				// add a map for easy editing
				if(meta.get("field") === "lng") {
					that.addEditableMap(drop,model);
				}
				if(meta.get("field") === "reference") {
					//drop.append("<button>Create a new book</button>");
				}
			});
		},
		addEditableMap: function(where,model) {
			var that = this;
			where.append($("<button/>",{
			    text: "Open a map for editing the place...",
			    click: function() {
			        var map = new _a.PopoverMap(model,function(lat,lng){
			            _a.user.editor.mapProcess2(lat,lng,that.dom);
			            delete map;
			        });
			    }
			}));
		},
		addEntityChooser: function(meta,collection,type) {
		    var that = this;
		    // just add a list component here
		    that.dom.children("div").append("<span>"+meta.get("descript")+"</span>");
		    // the view of the collection (will be refreshed automatically)
	        _a.IO.require("components/ListComponent",function(){
	            var listComp = new _a.ListComponent();
	            var sandbox = $("<div/>",{ "class": "ListComponent verysimple" });
	            listComp.setSandbox(sandbox);
	            that.dom.children("div").append(sandbox);
	            listComp.initialize(_a.dataStore.auxiliaryDataProvider(collection));
	        });
		}
	};
	
	_a.PopoverMap = function(model,callback) {
	    this.start(model,callback);
	};
	
	_a.PopoverMap.prototype = {
	    start: function(model,callback) {
			_a.IO.require("components/AMap2",function(){
			    // initial google maps setup (with initial latlng)
			    var _g = google.maps;
				var center = new _g.LatLng(48.0,-0.3);
				var zoom = 3;
				if(model.get("lat") && model.get("lng")) {
					center = new _g.LatLng(model.get("lat"),model.get("lng"));
					zoom = 10;
				}
			    // the html
				var editMap = $("<div/>",{
				    "class": "edit_map",
				    css: {
				        height: $(window).height()-125
				    }
				});
				var done = $("<a/>",{
				    "class": "done",
                    text: "Save new map position",
                    href: "#"
				});
				var crosshairs = $("<img/>",{
				    "class": "crosshairs",
				    src: "/media/ui/crosshairs.png"
				});
				var input = $("<input/>",{
				    "class": "geocode",
				    value: "Search"
				});
				var popover = $("<div/>",{
				    "class": "popover",
				    html: $("<div/>",{
				        "class": "popover_map_panel",
				        html: editMap
				            .after($("<div/>",{
				                "class": "done",
				                html: done.after($("<a/>",{
				                    href: "#",
				                    text: "Cancel",
				                    click: function() {
				                        popover.remove();
				                        return false;
				                    }
				                })).after($("<span/>",{
				                    text: "Align the crosshairs over the target..."
				                }))
				            }))
				            .after(input)
				            .after(crosshairs)
				    })
				});
				$("body").append(popover);
				// now add the map to it
				var options = _a.Config.maps.getGoogleMapOptions();
				options.mapTypeId = "hybrid";
				// now some overwrites on the default options
				options.center = center;
				options.zoom = zoom;
				var map = new _g.Map(editMap[0],options);
				// now add some smart behavior to the input
				var searchResults = [];
				var searchwait = undefined;
				done.bind("click",function(){
				    callback(map.getCenter().lat(),map.getCenter().lng());
				    popover.remove();
				    return false;
				});
				input
				    .bind("keydown",function() {
			            clearTimeout(searchwait);
			        })
			        .bind("keyup",function() {
			            clearTimeout(searchwait);
			            var input = $(this);
			            searchwait = setTimeout(function(){
			                var geocoder = new _g.Geocoder();
			                geocoder.geocode({
			                    address: input.attr("value")
			                },function(results,status){
			                    if(status === "OK") {
			                        for(var r in searchResults) {
			                            searchResults[r].setMap(null); // delete
			                        }
			                        var bounds = new _g.LatLngBounds();
			                        for(var r in results) {
			                            searchResults.push(new _g.Marker({
			                                position: results[r].geometry.location,
			                                map: map,
			                                tile: "TD"
			                            }));
			                            bounds.extend(results[r].geometry.location);
			                        }
			                        map.fitBounds(bounds);
			                    }
			                });
			            },700);
			        });
				// now put it in _just_ the right spot
				var height = $(window).height() - popover.find(".popover_map_panel").height();
				popover.css("padding-top",$("body").scrollTop()+(height/2));
				crosshairs.css("left",editMap.width()/2-15).css("top",editMap.height()/2-15);
			});
	    }
	};
	
})();/*
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
	
})();/* Configuration options (changes with skin) */

(function(){
	
	var _a = Archmap;
	
	_a.Config = {
	    abbrevs: {
		    building: "b",
		    buildings: "b",
		    place: "pl",
		    places: "pl",
		    socialentity: "se",
		    socialentities: "se",
		    image: "i",
		    images: "i",
		    word: "w",
		    words: "w",
		    lexiconentry: "w",
		    lexiconentries: "w"
	    },
		markers: {
			shapes: {
				arrow: "M 5 10 L 14 10 12 8 12 12 14 10 12 8 14 10",
				arrowColor: "#89e",
				arrowHead: "M 14 10 L 12 8 12 12 14 10 12 8"
			},
			colors: {
				defaultIcon: "darkslateblue",
				iconHover: "yellow",
				iconHighlight: "firebrick"
			}
		},
		texts: {
			mapMarkerHoverTipText: "Click the marker to find out more. Double-click to visit the monograph.",
			mapMultiMarkerHoverTipText: "Shift-click this church to compare it the others in the sidebar."
		},
		maps: {
			getGoogleMapOptions: function() { // and how would you like the map to look initially?
				// put it in a return so we don't get namespace/loading issues, ya dig?
				// (ie the code won't evaluate until we return)
				return {
					center: new google.maps.LatLng(48.0,2.0),
					zoom: 6,
					mapTypeId: google.maps.MapTypeId.TERRAIN,
					mapTypeControl: false,
					navigationControl: false,
					disableDefaultUI: true
				};
			},  
			googleMapStylers: {
			    landscape: { visibility: "on", hue: "#00ff09" },
			    water: { visibility: "simplified", hue: "#7700aa", lightness: 100 }
			},
			historicalMapCollection: "collection/182",
			zoomInButtonImage: "/media/ui/zoom_in_alt.png",
			zoomOutButtonImage: "/media/ui/zoom_out_alt.png",
			zoomInButtonImageSmall: "/media/ui/zoom_in_small.png",
			zoomOutButtonImageSmall: "/media/ui/zoom_out_small.png"
		},
		hints: {
			
		}
	};
	
})();/*
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

})();/*
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
	
})();/* family of functions for easy (painless) HTML rendering */

(function(){
	
	var _a = Archmap;
	
	_a.Elements = {};
	
	_a.Elements.UIStuff = { // a collection of stuff with weird names, easily accessible
		closeButton: function() {
			return $("<img/>",{
				src: "/media/ui/close.png"
			});
		},
		arrow: function(direction) {
		    return $("<img/>",{
		        src: "/media/ui/"+direction+"_arrow.png"
		    });
		},
		upArrow: function() {
		    return this.arrow("up");
		},
		downArrow: function() {
		    return this.arrow("down");
		},
		helpPopoverLink: function(options) {
			var link = $("<div/>",{
				"class": "helpPopoverLink",
				html: $("<img/>",{
					src: "/media/ui/helpPopover.png"
				}),
				click: function(e) {
					$("div#container").append(_a.Elements.UIStuff.helpPopover({
						html: options.html,
						css: {
							"right": ($(window).width()-e.pageX-15),
							"top": (e.pageY-15)
						},
						highlight: options.highlight
					}));
				}
			});
			return link;
		},
		helpPopover: function(options) {
			if(options.highlight !== undefined) {
				options.highlight.addClass("helpHighlight");
			}
			var closeButton = $("<div/>",{
				"class": "helpPopoverClose",
				html: $("<img/>",{
					src: "/media/ui/close.png"
				}),
				click: function(){
					if(options.highlight !== undefined) {
						options.highlight.removeClass("helpHighlight");
					}
					$(this).parent().remove();
				}
			});
			var popover = $("<div/>",{
				"class": "helpPopover "+options.extraClasses,
				css: options.css,
				html: $("<div/>",{
					"class": "padding",
					html: options.html
				})
			}).prepend(closeButton);
			return popover;
		},
		/* a button that twists when you click expand */
		expandButton: function(options) {
			var open = "/media/ui/open_arrow.png",
				closed = "/media/ui/closed_arrow.png";
			var img = $("<img/>",{
				"class": "expand",
				src: closed
			});			
			img.toggle(function(){ // image twists down when you first click it
				$(this).attr("src",open);
				options.open();
			},function(){
				$(this).attr("src",closed); // image twists up when you click it again
				options.close();
			});
			// allow for optional triggering of the previous two events
			if(options.trigger !== undefined) {
				options.trigger.click(function(){
					img.trigger("click");
				});
			}
			// now we embed the img in strong tag so styling is much easier
			var strong = $("<strong/>",{
				"class": "expand",
				html: img
			});
			return strong;
		},
		/* an expandable list item that uses the Archmap.Utilities.UIStuff.expandButton */
		expandableListItem: function(content) {
			var visible = $("<div/>",{ // what is visible
				"class": "visible"
			}).append(content.visible); // add the user's content
			var hidden = $("<div/>",{ // what is hidden
				"class": "hidden",
				css: { "display": "none" }
			}).append(content.hidden); // add the user's content
			// the actual list item (grouping everything together)
			var li = $("<li/>",{
				"class": "expandable"
			}).append(visible).append(hidden); // add these to the li
			// attach the click events
			visible.prepend(_a.Elements.UIStuff.expandButton({
				open: function() {
					li.find(".hidden").slideDown("fast");
					if(typeof content.open === "function") {
						content.open(); // user function
					}
				},
				close: function() {
					li.find(".hidden").slideUp("fast");
					if(typeof content.close === "function") {
						content.close(); // user function
					}
				},
				trigger: content.trigger
			}));
			return li;
		},
		standardListItem: function(options) {
			// has a key and an original Key (may be the same thing)
			// essentially a standard protocol for working with a list item
			if(options.classes === undefined) { options.classes = ""; }
			if(options.linkClasses === undefined) { options.linkClasses = ""; }
			var item = $("<li/>",{
				data: {
					originalKey: options.originalKey,
					key: options.key
				},
				"class": "standard-list-item "+options.classes,
				html: $("<a/>",{
					href: "/"+options.key,
					html: "<em>"+options.type+"</em> <span>"+options.name+"</span>",
					"class": "standard-list-item-link "+options.linkClasses
				}),
				mouseover: function() {
					if(typeof options.mouseover === "function") {
						options.mouseover();
					}
				},
				mouseout: function() {
					if(typeof options.mouseout === "function") {
						options.mouseout();
					}
				}
			});
			/*	if you define a click handler for the link embedded,
				the link will kick back on a click */
			if(options.click !== undefined) {
				item.find("a").click(function(){
					options.click(options.key);
					return false;
				});
			}
			return item;
		},
		slideUpArrow: "",
		slideDownArrow: ""
	};
	
	_a.Elements.ScrollableDiv = function(options) {
		this.initialize(options);
	};
	
	_a.Elements.ScrollableDiv.prototype = {
		initialize: function(options) {
			var parent = options.appendTo; // required option
			this.parent = parent;
			var height = options.height || 200;
			var nubbin = $("<div/>",{
				"class": "scrollable-nubbin"
			});
			var scrollbar = $("<div/>",{
				"class": "scrollable-scrollbar",
				css: { height: height }, html: nubbin
			});
			var scrollable = $("<div/>",{
				"class": "scrollable-inside",
				css: { height: height },
				html: $("<div/>",{
					"class": "scrollable-contents",
					html: options.contents
				})
			});
			var container = $("<div/>",{
				"class": "scrollable-outside",
				css: { height: height },
				html: scrollable
			});
			parent.append(container).append(scrollbar);			
			/* temporary scroll shtuff */
			var clicker = undefined;
			var that = this;
			scrollable.mouseover(function(){
				nubbin.addClass("hovering");
				clicker = setInterval(function(){
					var ratio = scrollable.find(".scrollable-contents").height()/container.height();
					var top = parseFloat(scrollable.scrollTop());
					nubbin.css("top",(top/ratio));
				},10);
			}).mouseout(function(){
				nubbin.removeClass("hovering");
				clearInterval(clicker);
			});
			_a.IO.require("dependencies/DisableTextSelect",function(){
				/* scroll handling when grabbing the scrollbar */
				var initialOffset = undefined;
				var isDragging = false;
				// determine the initial offset vertically, then just recalculate the position
				nubbin.mousedown(function(e){ // clicking
					if(isDragging === false) {
						parent.disableTextSelect();
						initialOffset = e.pageY;
					}
					isDragging = true;
				});
				$("html").mousemove(function(e){ // dragging
					if(isDragging) {
						var newTop = e.pageY - initialOffset;
						if(newTop >= 0) {
							if(newTop > (height-nubbin.height())) {
								newTop = height-nubbin.height();
							}
							nubbin.css("top",newTop);
							var ratio = scrollable.find(".scrollable-contents").height()/container.height();
							scrollable.scrollTop(newTop*ratio);
						}
						else {
							_a.log("---");
							_a.log(height-nubbin.height());
							_a.log(e.pageY);
							_a.log(initialOffset);
						}
					}
				}).mouseup(function(){ // releasing
					isDragging = false;
					parent.enableTextSelect();
				});
			});
			/* property-ize some variables so we can deal with them later */
			this.nubbin = nubbin;
			this.scrollable = scrollable;
			this.container = container;
			/* as the method name says */
			this.calculateNubbinHeight();
		},
		replaceHtmlWith: function(html) {
			this.parent.find(".scrollable-contents").html(html);
			this.calculateNubbinHeight();
		},
		calculateNubbinHeight: function() {
			this.nubbin.css("display","block"); // make sure it's visible
			var insideHeight = this.scrollable.find(".scrollable-contents").height();
			var outsideHeight = this.container.height();
			var ratio = outsideHeight/insideHeight;
			this.nubbin.height((ratio*outsideHeight)-3);
			if(insideHeight <= outsideHeight) {
				this.nubbin.css("display","none");
			}
		}
	};
	
	// a dark-background style overlay
	
	_a.Elements.DarkroomOverlay = function(options) {
		this.initialize(options);
	};
	
	_a.Elements.DarkroomOverlay.prototype = {
		
	};
	
	// a biggable image
	
	_a.Elements.BiggableImage = function(options) {
		this.initialize(options);
	};
	_a.Elements.BiggableImage.prototype = {
		initialize: function(options) {
			this.image = options.image;
			if(options.attachTo === undefined) { this.attachTo = $("body"); }
			else { this.attachTo = options.attachTo; }
			this.build();
			this.listen();
		},
		build: function() {
			// the image itself
			this.img = $("<img/>",{
				src: this.image.get("thumbnail")
			});
			this.img.data(this.image); // embed the image object
			// the link which biggifies the image
			this.link = $("<a/>",{
				html: this.img
			});
		},
		listen: function() {
			var that = this;
			this.link.click(function(){
				that.makeBig();
			});
		},
		getElement: function() {
			return this.link;
		},
		makeBig: function() {
			var darkroom = new _a.Elements.DarkroomOverlay({
				
			});
			this.attachTo.append(darkroom.getElement());
		}
	};
	
	// Utility for enabling dragging of elements
	// you provide the drag trigger and a callback
	// function for what to do when the drag happens
	// pretty much manual, takes care of some ugliness
	
	_a.Elements.Dragger = function(options) {
		this.initialize(options);
	};
	
	_a.Elements.Dragger.prototype = {
		initialize: function(options) {
			this.dragBar = options.dragBar; // a jquery element, please
			this.dragFunction = options.dragFunction;
			this.dragging = false;
			this.listen();
		},
		listen: function() {
			var that = this;
			this.dragBar.mousedown(function(){ // initialize the drag
				that.dragging = true;
			});
			$("html").mousemove(function(e){ // do the drag
				if(that.dragging === true) {
					that.dragFunction(e,that.dragBar);
				}
			}).mouseup(function(){ // end the drag
				that.dragging = false;
			});
		}
	};
	
})();/* Useful things that don't fit anywhere else */

// okay, this is hacky, but also makes life nice
String.prototype.contains = function(needle) {
    return ( this.indexOf(needle) >= 0 );
};

_.mixin({
    keyMap: function(obj, iterator, context) {
        var results = {};
        _.each(obj, function(value, key) {
            var res = iterator.call(context, value, key),
                has = _.bind(res.hasOwnProperty,res);
            (has("key") && has("value"))
                ? results[res.key] = res.value
                : (has("k") && has("v"))
                    ? results[res.k] = res.v
                    : results[key] = res;
        });
        return results;
    },
    keyZip: function(ks,vs) {
        return _.keyMap(ks,function(k,i){
            return { key: k, value: vs[i] };
        });
    },
    curry: function(fn) {
        var args = Array.prototype.slice.call(arguments,1);
        return function() {
            return fn.apply(window,args.concat(_.toArray(arguments)));
        };
    },
    // chain together an array of jquery elements in parallel in dom
    $flatten: function(list) {
        return _.foldr(list,function(acc,elem){
            return (acc) ? elem.after(acc) : elem;
        },null);
    }
});

(function(){
	
	var _a = Archmap;
	
	_a.Utilities = {
		isArray: function(thing) {
			return Object.prototype.toString.call(thing) === '[object Array]';
		},
		deaccent: function(string) {
		    var pairs = [
		        [ "É", "E" ], [ "é", "e" ],
		        [ "Á", "A" ], [ "á", "a" ],
		        [ "ê", "e" ], [ "è", "e" ],
		        [ "ô", "o" ], [ "â", "a" ],
		        [ "ç", "c" ], [ "î", "i" ],
		        [ "ù", "u" ], [ "û", "u" ],
		        [ "Â", "A" ], [ "Ô", "O" ]
		    ];
		    _.each(pairs,function(pair){
		        string = string.replace(pair[0],pair[1]);
		    });
		    return string;
		}
	};
	
})();/*
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

})();(function(){
    
    var _a = Archmap;
    
    _a.LayoutManager = {
        fullscreen: function(selectors,callback) {
            var layout = function() {
                $("#container")
                    .height($(window).height())
                    .width($(window).width());
                // not sure where this 25 comes from
                var maxHeight = $("#container").height();
                if($("#header").length > 0) {
                    maxHeight = maxHeight - $("#header").height() - 27;
                }
                if($.isArray(selectors) === false) {
                    selectors = [selectors];
                }
                $.each(selectors,function(i,selector){
                    $(selector).height(maxHeight); 
                });
                if(typeof callback === "function") {
                    callback(maxHeight);
                }
            };
            layout();
            // now bind so it'll happen automatically
            $(window).resize(function(){
                layout();
            });
            return this;
        },
        fullscreenLogo: function() {
            $("div#logo").css("left",12);
            return this;
        },
        searchAdjustment: function() {
            if($(".overflap").length !== 0) {
                var percent = 99 - parseInt( $(".overflap").width() / $(window).width() * 100, 10 );
                var inputPercent = parseInt( 185 / $(window).width() * 100, 10 );
                if(inputPercent > percent) {
                    percent = inputPercent;
                }
                $("#navigation").css("right",percent+"%");
            }
            return this;
        },
        hoverListeners: function() {
          // highlight the button that points to the current page
          $("#header a").each(function(){
              var $this = $(this);
              if($this.attr("href") !== "/" && location.pathname == $this.attr("href")) {
                  $this.addClass("currentpage");
              }
          });
          // add hover effects for drop-downs
          Archmap.IO.require("dependencies/HoverIntent",function(){
            var openPopup = function(e) {
              var div = $(this).parent().find("div.popover-panel");
  						if(div.length > 0) {
  							var pop = div.clone();
  							var left = $(this).offset().left;
  							pop.removeClass("popover-panel")
  								.addClass("poppedover-panel")
  								.css("display","none")
  								.css("top",45).css("left",left)
  								.fadeIn("fast");
  							$("body").append(pop);
  							$(this).data("pop",pop);
  							/*
  							pop.hoverIntent({
  								over: function(){
  									$(this).addClass("beinghovered");
  								},
  								out: function(){
  									$(this).fadeOut("fast",function(){
  										$(this).remove();
  									});
  								},
  								timeout: 300,
  								interval: 1
  							});
  							*/
  						}
            };
            var closePopup = function(e) {
              var pop = $(this).data("pop");
  						if(pop && !pop.hasClass("beinghovered")) {
  							pop.fadeOut("fast",function(){
  								$(this).remove();
  							});
  						}
            };
				    // open and position popover panels for navigation
				    $("a.top.login").toggle(openPopup,closePopup);
    				//$("a.top").hoverIntent({
    				//	over: openPopup,
    				//	out: closePopup
    				//});
    				// tool tips for the main buttons
    				$("#logo a").hoverIntent({
    				    over: function() {
    				        var tip = $("<div/>",{
    				            "class": "buttontip",
    				            text: $(this).attr("tip"),
    				            css: {
    				                left: $(this).offset().left
    				            }
    				        });
    				        $(this).data("tip",tip);
    				        $("div#container").append(tip);
    				        tip.fadeIn();
    				    },
    				    out: function(e) {
    				        $(this).data("tip").fadeOut(function(){
    				            $(this).remove();
    				        });
    				    },
    				    interval: 200,
    				    timeout: 150
    				});
    			});
    			return this;
        }
    };
    
})();(function(){
    
    var _a = Archmap,
        sandbox, // defined later
        stage, // defined later
        closeButton, // defined later
        resizer, // callback for resizing if image is open
        $w = $(window),
        // generic overlay object, which has a "close" method
        overlay = {
            clean: function() {
                resizer = false;
                sandbox.fadeOut("fast",function(){
                    stage.empty();
                    _a.popOverlay();
                });
            }
        },
        keyMatch = function(string) {
            return string.match(/[a-z]+\/\d{4,7}/)[0];
        },
        // interacting with thumbnails
        bindImages = function() {
            // selectors
            var biggable = "a.biggable",
                html = $("html");
            // binders
            $("div#stage")
                // biggable mouseover
                .delegate(biggable,"mouseover",function(){
                    html.trigger("imageHoverOn",this);
                })
                // biggable mouseout
                .delegate(biggable,"mouseout",function(){
                    html.trigger("imageHoverOn",this);
                })
                // biggable click
                .delegate(biggable,"click",function(){
                    var $this = $(this),
                      imageKey = keyMatch($this.attr("href")),
                      slideshowKey = $this.closest(".slideshow-holder").attr("rel");
                    // is this part of a slideshow?
                    if(slideshowKey) { // it is
                      _a.IO.require("components/SlideshowViewer",function(){
                        var slideshow = new _a.SlideshowViewer();
                        _a.pushOverlay(slideshow,"slideshow");
                        slideshow.boot(slideshowKey,imageKey.split("/")[1]);
                      });
                    }
                    else { // it's not, just blow it up
                      if($this.hasClass("stereoscopic")) {
                        blowUp(imageKey,true);
                      }
                      else {
                        blowUp(imageKey);
                      }
                    }
                    return false; // prevent default behavior
                });
            // fullscreen clicks
            $("a.fullscreen").live("click",function(){
                var $this = $(this),
                    image = $this.find("img").data("image"),
                    div = $("<div class='popin'/>").appendTo($this.parent());
                (image)
                    ? popinImageMap(image,div)
                    : _a.dataStore.get(keyMatch($this.attr("href")),function(image){
                        popinImageMap(image,div);
                    });
                $this.remove(); // get rid of the original link
                return false;
            });
            // window resizing
            html.bind("windowResized",function(){
                if(resizer) {
                    resizer();
                }
            });
        },
        // interacting with a blown-up image and its controls
        bindFullscreen = function() {
            closeButton.click(function(){
                overlay.clean();
                return false;
            });
        },
        // make the image fullscreen, but do it with some smarts
        blowUp = function(key,goToStereo) {
            _a.dataStore.get(key,function(img){
                if(img.isOfType("Node")) {
                  resizer = false;
                  popopenNodeViewer(img);
                  return;
                }
                else {
                    var link = makeFullscreenImg(img);
                    sandbox.fadeIn("fast");
                    resizer = function() {
                        img.centerAndFit($w.height(),$w.width()-100,link.find("img"));
                    };
                    resizer();
                    stage
                        .empty()
                        .append(link)
                        .append($("<h5/>",{
                          className: "click-to-zoom",
                          text: "Click the image to zoom in"
                        }))
                        .append(makeMoreInfoLink(img));
                    _a.pushOverlay(overlay,key);
                    if(goToStereo) { // open the stereo viewer
                      $("a.fullscreen").trigger("click");
                    }
                }
            });
        },
        popinImageMap = function(img,where) {
            where.css({
                width: $w.width()-30,
                height: $w.height()-30
            });
            _a.IO.require("components/GImageViewer",function(){
                var viewer = new _a.GImageViewer({
                    provider: img,
                    sandbox: where,
                    background: "clear"
                });
            });
            where.find(".imageviewer").addClass("clear");
        },
        popopenImageMap = function(img) {
		      window.open(
		        "/"+img.key()+"?mode=naked&view=zoom",
		        "image",
		        parametrize({
	                menubar: 1,
	                resizable: 1,
	                width: $w.width(),
	                height: $w.height()+25
	            })
	        );
        },
        popopenNodeViewer = function(node) {
            window.open(
                "/scripts/panorama.php?path="+node.get("swf"),
                "360 degree node view",
                parametrize({
                    menubar: 1,
                    resizable: 1,
                    width: $w.width(),
                    height: $w.height()+25
                })
            );
        },
        makeFullscreenImg = function(img) {
            return $("<a/>",{
                "class": "fullscreen",
                href: "/"+img.key(),
                html: $("<img/>",{
                    src: img.get("thumbnail"),
                    data: { image: img }
                })
            });
        },
        makeMoreInfoLink = function(img) {
            return $("<a/>",{
                "class": "more-information",
		            href: "/"+img.key(),
		            text: "More Information"
            });
        },
        // turn a { a: "b", c: "d" } into "a=b,c=d" string
        parametrize = function(hash) {
            return _.map(hash,function(v,k){ return k+"="+v; }).join(",");
        };
    
    // call this function to add all image embiggening
    
    _a.ImageOverlays = {
        listenForImages: function() {
            _a.IO.require("components/ImageComponent",function(){
                // fill in some blanks left in declarations earlier
                sandbox = $("#big_image_container");
                stage = $("#big_image");
                closeButton = sandbox.find("a.image_close");
                // call the two important functions
                bindImages();
                bindFullscreen();
            });
        },
        popopenImageMap: popopenImageMap
    };
    
})();(function(){
    
    var _a = Archmap,
        // the main function
        timer, // defined later
        outTimer,
        popup, // defined later
        tolerance = 500,
        interlocute = function($elem) {
            $elem
                .delegate("a.inline","mouseover",function(e){
                    var key = $(this).attr("href").slice(1);
                    clearTimeout(outTimer);
                    timer = setTimeout( _.curry(magnify,key,e), tolerance );
                })
                .delegate("a.inline","mouseout",function(){
                    clearTimeout(timer);
                    outTimer = setTimeout(function(){
                        if(popup) {
                            popup.fadeOut();
                        }
                    },tolerance);
                });
            
        },
        magnify = function(key,e) {
            var action = _.curry(pop,key,e);
            (popup !== undefined)
                ? popup.fadeOut("fast",action)
                : action();
        },
        pop = function(key,e) {
            var build = function(thing,image) {
                popup = $("<div/>",{
                    "class": "interlocution",
                    html: _.$flatten([
                        $("<a/>",{
                            text: thing.get("name"),
                            href: "/"+thing.key()
                        }),
                        $("<img/>",{
                            src: image.get("thumbnail")
                        })
                    ]),
                    css: {
                        top: e.pageY - 50,
                        left: e.pageX + 50
                    },
                    mouseout: function() {
                        var $this = $(this);
                        outTimer = setTimeout(function(){
                            $this.fadeOut();
                        },tolerance);
                    },
                    mouseover: function() {
                        clearTimeout(outTimer);
                    }
                }).appendTo($("body"));
            };
            _a.dataStore.get(key,function(thing){
                thing.get("frontispiece",function(img){
                    build(thing,img);
                },function(){ // error
                    build(thing,"");
                });
            });
        };
    
    _a.interlocute = function($elem) {
        interlocute($elem);
    };
    
})();