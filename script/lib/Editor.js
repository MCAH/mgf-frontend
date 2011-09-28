/*
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
	
})();