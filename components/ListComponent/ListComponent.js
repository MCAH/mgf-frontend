/*
	Create a List of Stuff
	related to some parent
*/

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "ListComponent",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    		    //this.clickthrough = true; // allowed to click through
    			this.addInteraction().render();
    		},
    		prerender: function() {
    			// should appeal to this.dataProvider, not _a.provider()
    			this.sandbox.append("<ul class='model-holder' rel='"+_a.provider().key()+"'></ul>");
    			this.list = this.sandbox.find("ul"); // save it as a jQuery handle
    		},
    		addInteraction: function() {
    			/* actually it turns out we want conventional link behavior */
    			var that = this;
    			/*
    			this.sandbox.find("a.generic").live("click",function(){
    				that.selectModel($(this).closest("li").data("key"));
    				return false; // disallow conventional link behavior
    			});
    			*/
    			return this;
    		},
    		finalize: function() {
    			if(_a.user.data.auth_level > 1) {
    				this.makeEditable();
    			}
    		},
    		makeEditable: function() {
    			this.editable = true;
    			// button for adding to the collection
    			var collection = this.dataProvider.model,
    			    type = collection.get("statictype"),
    			    that = this;
    			// now add the button
    			this.sandbox
    			    .prepend($("<a/>",{
        			    href: "#",
        			    "class": "add plussign small",
        			    click: function(e){
        			        _a.IO.require("components/Foundry",function(){
        			            var foundry = new _a.Foundry({ position:e });
        			            if(type) {
        			                foundry.start(type);
        			            }
        			            else {
        			                foundry.start(that.lastType,true);
        			            }
            					foundry.addCallback(function(obj){
            						collection.add(obj,collection.key()); // now do something with the object
            					});
        			        });
        			        return false;
        			    }
        			}))
        			// alphabetize button
        			.prepend($("<button/>",{
        			    text: "Alphabetize",
        			    click: function() {
        			        // get sorting code (it's really nice, check it out)
        			        _a.IO.require("dependencies/SortElements",function(){
        			            // so we sort it
        			            that.list.find("li").sortElements(function(a,b){
        			                var a = _a.Utilities.deaccent($(a).find("span").text()),
        			                    b = _a.Utilities.deaccent($(b).find("span").text());
        			                return ( a > b ) ? 1 : -1;
        			            });
        			            // and now we save that sort!
        			            that.saveSort(that.list);
        			        });
        			    }
        			}))
        			// edit
    			    .delegate("button.edit","click",function(e){
    				    var model = _a.dataStore.get($(this).closest("li").data("key"));
    				    model.edit(function(){
    					    _a.triggerEvent("refreshDataProvider",[that.dataProvider.model.key()]);
    				    },e);
    			    })
    			    // delete
        			.delegate("button.delete","click",function(){
        				var model = _a.dataStore.get($(this).closest("li").data("originalKey"));
        				$(this).closest("li").slideUp("fast");
        				model.del(function(){
        					_a.triggerEvent("refreshDataProvider",[that.dataProvider.model.key()]);
        				});
        			});
    			var that = this;
    			_a.IO.require("dependencies/DragDropSort",function(){
    				that.sandbox.find("ul").each(function(){
    					if($(this).hasClass("model-holder")) {
    						var ul = $(this);
    						_a.dataStore.get(ul.attr("rel"),function(model){
    							if(model.type == "Collection") {
    								that.makeDroppable(ul);
    							}
    						});
    					}
    				});
    				// so they're draggable and sortable
    				that.sandbox.find("ul").sortable({
    					update: function(event,ui) {
    						that.saveSort(ui.item.parent());
    					}
    				});
    			});
    		},
    		makeDroppable: function(ul) {
    			var that = this;
    			ul.droppable({
    				accept: "li.newitem",
    				drop: function(ev,ui){
    					that.addModel(ui.draggable,ul);
    				}
    			});
    		},
    		saveSort: function(ul) {
    		    //this.clickthrough = false;
    			var i = 0;
    			ul.children("li").each(function(){
    				_a.dataStore.get($(this).data("originalKey")).savePosition(i);
    				i += 1;
    			});
    			var that = this;
    			//setTimeout(function(){
    			//    that.clickthrough = true;
    			//},100);
    		},
    		unrender: function() {
    			this.sandbox.undelegate();
    			this.sandbox.empty();
    		},
    		renderModel: function(model,where,color,isTopLevel) {
    		    this.lastType = model.getType();
    			if(color === undefined) { color = "blue"; } // default color
    			if(where === undefined) { where = this.list; } // fix lack of where-ness
    			var item = this.buildListItem(model,isTopLevel);
    			/*
    			if(model.get("color")) {
    				color = model.get("color");
    				item.prepend("<span class='icon' style='background-color:"+color+"'></span>");
    			}
    			*/
    			if(model == this.dataProvider.model) {
    				item = where;
    			}
    			else {
    				where.append(item); // attach to the list if it's worth attaching
    			}
    			// now add more things if it's a collection
    			var that = this;
    			if(model.isIterable() && this.dataProvider.model == model) {
    				model.iterateMembers(function(i,member){
    					that.renderModel(member,item,color,true);
    				});
    			}
    		},
    		buildListItem: function(model,isTopLevel) {
    			var that = this;
    			var name = model.get("name");
    			if(model.isOfType("Publication")) {
    			    name = model.get("mla_citation").replace(/_([^_]+)_/g,"<i>$1</i>");
    			}
    			var mousedown = false,
    			    mousemoving = false,
    			    item = _a.Elements.UIStuff.standardListItem({
        				key: model.key(),
        				originalKey: model.getOriginalKey(),
        				name: name,
        				type: model.getType(),
        				classes: "listed-model",
        				linkClasses: "generic",
        				mouseover: function() {
        					that.hoverModel(model.key());
        				},
        				mouseout: function() {
        					that.unhoverModel(model.key());
        				}
    			});
    			// add a drop-down arrow if it's expandable
    			var that = this;
    			if(model.isExpandable()) {
    				item.prepend(_a.Elements.UIStuff.expandButton({
    					open: function() {
    						if(model.isExpandable()) {
    							var ul = $("<ul/>");
    							model.iterateMembers(function(i,member){
    								that.renderModel(member,ul);
    							},function(){ // when the models are all rendered
    								item.append(ul);
    							});
    						}
    					},
    					close: function(){
    						item.find("ul").remove();
    					}
    				}));
    			}
    			// also add a picture if it's a person or a building
    			if(model.isOfType("Person")) {
    			    model.get("images",function(images){
    			        var first = images.get("members")[0];
    			        if(first !== undefined) {
    			            var src = first.get("thumbnail");
    			            item.find("a").append($("<img/>",{
        			            "class": "preview",
        			            src: src,
        			            css: { width: "30px" }
        			        }));
    			        }
    			    });
    			}
    			else if(model.isOfType("Building")) {
    			    /*
    			    model.get("frontispiece",function(image){
    			        var src = image.get("thumbnail");
    			        if(image.get("filename") == false) {
    			            return;
    			        }
    			        item.find("a").append($("<img/>",{
    			            "class": "preview",
    			            src: src,
    			            css: { width: "30px" }
    			        }));
    			    });
    			    */
    			}
    			// make it editable if it should be editable
    			if(_a.user.data.auth_level > 1 && isTopLevel) {
    				var buttons = $("<div/>",{
    					"class": "edits"
    				});
    				buttons.append($("<button/>",{
    					"class": "delete",
    					text: "Remove"
    				})).append($("<button/>",{
    					"class": "edit",
    					text: "Edit"
    				}));
    				item.append(buttons);
    			}
    			return item;
    		},
    		highlightModel: function(key) {
    			if(this.locate(key)) {
    				this.locate(key).removeClass('hover').addClass('selected');
    			}
    		},
    		unhighlightModel: function(key) {
    			this.locate(key).removeClass('selected');
    		},
    		hoverOnModel: function(key) {
    			this.locate(key).addClass('hover');
    		},
    		hoverOffModel: function(key) {
    			this.locate(key).removeClass('hover');
    		},
    		addModel: function(element,ul) {
    			/* doesn't work right now */
    			var that = this;
    			_a.dataStore.get(element.data("key"),function(model){
    				var collection_key = element.closest("ul.model-holder").attr("rel");
    				_a.dataStore.get(ul.attr("rel"),function(collection){
    					element.fadeOut();
    					collection.add(model,true);
    				});
    			});
    		},
    		locate: function(key) {
    			return this.sandbox.find("a[href='"+key+"']").parent();
    		}
	    }
	});
	
})();