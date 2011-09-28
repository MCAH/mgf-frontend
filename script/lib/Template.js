/*  the code to turn static html component
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

})();