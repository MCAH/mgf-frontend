/*
	Logic for interactively creating things
	and making sure they don't already exist
	and stuff like that
*/

(function(){
	
	var _a = Archmap;
	
	_a.Foundry = function(options) {
		this.options = options;
	};
	
	_a.Foundry.prototype = {
		start: function(choice,changeable) {
			$("div#foundry").remove(); // huh?
			$("body").append("<div id='foundry' class='popover'></div>");
			this.container = $("div#foundry");
			this.container.height($(document).height());
			var that = this;
			_a.IO.getComponentHtml("Foundry",function(html){
				that.container.append(html);
				that.form = that.container.find("form"); // cache the form dom
				if(that.options !== undefined && that.options.position !== undefined) {
					$("#foundry_space").css("marginTop",that.options.position.pageY);
				}
				that.listen();
				if(choice !== undefined && choice != "") {
					if(changeable !== true) {
					    that.loadRequirements(choice);
					    that.clearOptions();
			        }
			        else {
			            that.container.find("select")
			                .find("option:contains('"+choice+"')").attr("selected",true)
			                .end()
			                .trigger("change");
			        }
				}
			});
		},
		addCallback: function(fn) {
			this.callback = fn;
		},
		presetFields: function(fields) {
			this.presets = fields;
		},
		listen: function() {
			var that = this;
			this.container.find("select").change(function(){
				that.form.empty();
				that.loadRequirements($(this).children(":selected").text());
			});
			this.container.find("button.cancel").click(function(){
				that.container.remove();
			});
		},
		submit: function(data,y) {
			var that = this;
			// write preset key=>value pairs to the data we're going to save
			// if there is a bunch of data we know should be written a certain way
			if(this.presets !== undefined) {
				$.each(this.presets,function(field,value){
					data[field] = value;
				});
			}
			if(this.called !== true) {
				//_a.log(this.type);
				//_a.log(data);
				_a.IO.post(this.type,data,function(data,object){
					that.edit(object);
				});
			}
			// this stuff executes before the anonymous function above
			this.called = true;
			this.form.empty(); // and we shall build it again!
			this.clearOptions();
		},
		clearOptions: function() {
			this.container.find("div.options").remove();
		},
		addSubmitButton: function() { // place where we listen for a submit
		    var saveButton = $("<input/>",{
		        type: "submit",
		        "class": "submit",
		        value: "Save"
		    });
			this.form.append(saveButton);
			// and listen!
			var that = this;
			var data = {};
			this.form.submit(function(){
				$(this).find("input[type='text']").each(function(){
					if($(this).data("blocked") === true) {
						alert("You've been blocked!");
						return false;
					}
					else {
						data[$(this).attr("name")] = $(this).attr("value");
					}
				});
				$(this).find("textarea").each(function(){
					data[$(this).attr("name")] = $(this).attr("value");
				});
				that.submit(data); // if you get this far, you're allowed to save, right?
				return false;
			});
		},
		addTextField: function(meta) {
			// name, descript, suggest
			var name = meta.get("field"),
				descript = meta.get("descript"),
				suggest = meta.get("suggest");
			this.form.append("<div rel='"+name+"'><span>"+descript+"</span>"
				+"<input autocomplete='off' name='"+name+"' type='text'/>"
				+"<small class='message'></small></div>");
			this.addSuggestions(suggest,name,this.form.find("div[rel='"+name+"']"));
		},
		addSuggestions: function(suggest,name,where) {
			if(suggest != 0) {
				where.append("<div class='suggestions'><ul></ul></div>");
			}
			if(suggest == 1) { // unstructured hinting, nothing enforced
				this.autoSuggest(name);
			}
			else if(suggest == 2) { // options, you must choose one
				// TODO
			}
			else if(suggest == 3) { // prevents duplicates
				this.autoHint(name);
			}
		},
		loadRequirements: function(type) {
			this.type = type;
			var that = this;
			_a.dataStore.get("meta/"+type+"::new",function(meta){
			    meta.get("requirements",function(requirements){
			        $.each(requirements,function(i,meta){
			            that.addTextField(meta);
			        });
			        that.addSubmitButton();
			    });
			});
		},
		autoSuggest: function(name) {
			var input = this.container.find("input[name='"+name+"']");
			var suggestions = input.parent().find("div.suggestions ul");
			var that = this;
			_a.IO.require("components/LiveSearch",function(){
    			var liveSearch = new _a.LiveSearch({
    			    inputHandle: input,
    			    url: function(term) {
			            return "search/"+term+"/fieldSuggest";
    			    },
    			    params: function(term) {
			            return {
			                model: that.type,
			                field: name
			            };
    			    },
    			    response: function(results) {
			            suggestions.empty();
    					for(var r in results) {
    						var model = results[r];
    						suggestions.append(_a.Elements.UIStuff.standardListItem({
    							key: model.key(),
    							name: model.get("name"),
    							type: model.getType(),
    							click: function(key) { that.addExistingModel(key); }
    						}));
    					}
    			    },
    			    clear: function() {
    			        suggestions.empty();
    			    }
    			});
    		});
		},
		addExistingModel: function(key) {
			try {
			    this.callback(_a.dataStore.get(key)); // call the callback you would've called later
			} catch(e) {
			    alert("hmm--- a problem!");
			    _a.log(e);
			}
			this.disappear();
			delete this;
		},
		autoHint: function(name) {
			this.autoSuggest(name); // add suggestions for convenience
			var that = this;
			var input = this.container.find("input[name='"+name+"']");
			var message = input.next("small.message");
    		_a.IO.require("components/LiveSearch",function(){
    			var liveSearch = new _a.LiveSearch({
    			    inputHandle: input,
    			    url: function(term) {
			            return "search/"+term+"/fieldCheck";
    			    },
    			    params: function(term) {
			            return {
			                model: that.type,
			                field: name
			            };
    			    },
    			    response: function(results) {
			            input.data("blocked",false);
			            if(results.length !== 0) {
			                message.text("already exists");
			                input.data("blocked",true);
			            }
    			    },
    			    clear: function() {
    			        message.text("");
    			    }
    			});
    		});
		},
		edit: function(model) {
			var that = this;
			this.disappear();
			var popover = new _a.PopoverEditor(model,function(model){
				// waiting for the completed model to come out of the oven
				that.callback(model);
				delete that; // immolation (is that the right word?)
			});
		},
		disappear: function() {
			this.container.remove();
		}
	};
	
})();