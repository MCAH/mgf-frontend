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
	
})();