/* Legend Component, being a legend */

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "LegendComponent",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			this.list = $("<ul/>",{
    				"class": "legend_list"
    			});
    			this.sandbox.append(this.list);
    			var that = this;
    			_a.IO.require("dependencies/Raphael",function(){ // for vector drawing icons
    				that.render();
    				that.listen();
    				if(that.inlineOptions.trigger) {
    				    that.setTrigger(that.inlineOptions.trigger);
    				}
    				_a.IO.require("dependencies/ScrollTo",function(){ // for scrolling on key events
    					that.listenToKeys();
    				});
    			});
    		},
    		setTrigger: function(trigger) {
    			this.trigger = trigger;
    			return this; // for chaining
    		},
    		renderModel: function(model,where,color,shape) {
    			//if(model.isProvider()) { return; } // skip the main provider
    			// if nothing is inherited from a parent, we set some defaults
    			if(where === undefined) { where = this.list; }
    			if(color === undefined) { color = "rgb(137,122,196)"; }
    			if(shape === undefined) { shape = ""; }
    			// if something is set on the individual, we override parameters
    			if(model.get("color")) { color = model.get("color"); }
    			if(model.get("icon_shape")) { shape = model.get("icon_shape"); }
    			// the actual list item
    			var item = $("<li/>",{
    				html: $("<a/>",{
    					"class": "item-link",
    					text: model.get("name"),
    					href: model.key()
    				})
    			});
    			var unique = "icon__"+model.key().replace("/","_");
    			item.append($("<div/>",{
    				id: unique, "class": "icon"
    			}));
    			var that = this;
    			if(model.isProvider() && model.isIterable()) {
    				model.iterateMembers(function(i,member){
    					that.renderModel(member,where,color,shape);
    				});
    				return; // don't add the thing itself to the legend
    			} // exit the chain here, but no earlier
    			// should we display things within this thing?
    			if(model.isExpandable()){
    			    // should be changed to use the generic expander in Elements
    				item.append($("<strong/>",{
    					"class": "expand",
    					html: $("<img/>",{
    						src: "/media/ui/closed_arrow.png",
    						rel: "/media/ui/open_arrow.png"
    					})
    				})).data("model",model).addClass("expandable");
    			}
    			// and, finally, attach it to the list!
    			where.append(item);
    			this.addIcon(unique,shape,color);
    			// check to see if height should be restricted
    			if(where == this.list && item.index() > 10) {
    				this.list.height(200);
    			}
    		},
    		unrender: function() {
    			this.list.empty().css("height",""); // auto heighting
    		},
    		listen: function() {
    			var that = this;
    			this.list.delegate("strong","click",function(){
    				if($(this).hasClass("expanded")) {
    					$(this).removeClass("expanded");
    					$(this).parent().find("ul").remove();
    				}
    				else {
    					$(this).addClass("expanded");
    					$(this).parent().append("<ul></ul>");
    					var ul = $(this).parent().find("ul");
    					var model = $(this).parent().data("model");
    					model.iterateChildren(function(i,child){
    						that.renderModel(child,ul,model.get("color"),model.get("icon_shape"));
    					});
    				}
    				var rel = $(this).find("img").attr("rel");
    				var src = $(this).find("img").attr("src");
    				$(this).find("img").attr("rel",src).attr("src",rel);
    			});
    			// hover to hover / hover a long time to select
    			var intender = undefined;
    			this.list.delegate("a.item-link","mouseover",function(){ // mouseover
    				that.hoverModel($(this).attr("href"));
    			}).delegate("a.item-link","mouseout",function(){ // mouseout
    				that.unhoverModel($(this).attr("href"));
    			}).delegate("a.item-link","click",function(){ // click
    				if($(this).hasClass("highlighted")) {
    					that.unselectModel($(this).attr("href"));
    				}
    				else {
    					that.selectModel($(this).attr("href"));
    				}
    				return false; // so we don't follow the link
    			});
    		},
    		listenToKeys: function() {
    			this.hovering = false;
    			var that = this;
    			this.sandbox.mouseover(function(){
    				that.hovering = true;
    			});
    			$("html").bind("keydown",function(e){
    				if(that.hovering === true) {
    					if(e.which === 38) { // UP
    						that.highlightNextOrPrevious(false); // false for previous
    						return false; // prevent scrolling
    					}
    					else if(e.which === 40) { // DOWN
    						that.highlightNextOrPrevious(true); // true for next
    						return false; // prevent scrolling
    					}
    				}
    			});
    		},
    		highlightNextOrPrevious: function(trueForNext) { // boolean
    			if(this.dataProvider.getSelectionStack().length == 1) {
    				if(trueForNext === true) {
    					var target = this.sandbox.find("li a.highlighted").parent().next("li");
    				}
    				else {
    					var target = this.sandbox.find("li a.highlighted").parent().prev("li");
    				}
    				target.find("a").trigger("click");
    				// now that something new has been highlighted, let's scroll to it!
    				this.scrollToListItem(this.sandbox.find("li a.highlighted").parent());
    			}
    		},
    		scrollToListItem: function(listItem) {
    			var offset = 0; // how much do we need to scroll
    			this.sandbox.find("li").each(function(){
    				if($(this) == listItem) {
    					return; // exit the loop, we've found that for which we are looking
    				}
    				else {
    					offset += $(this).height();
    				}
    			});
    			try {
    				var previous = listItem.prev("li");
    				this.list.scrollTo(listItem.prev("li"));
    			}
    			catch(e) {
    				this.list.scrollTo(listItem,{ duration:200 });
    			}
    		},
    		addIcon: function(id,shape,color) {
    			var canvas = Raphael(id,25,25);
    			if(shape == "" || shape == undefined) {
    				shape = "M0,8 L0,16 L8,16 L8,24 L16,24 L16,20 L16,16 L24,16"
    					+" L24,8 L16,8 L16,4 L16,0 L12,0 L8,0 L8,8 L0,8";
    			}
    			var mark = canvas.path(shape).attr({
    				"stroke-width":1, "stroke":"white", "fill":color
    			});
    			mark.scale(0.5,0.5,0,0);
    		},
    		highlightModel: function(key,caller) {
    			var link = this.list.find("a[href='"+key+"']");
    			link.addClass("highlighted");
    			if(this != caller) {
    				this.scrollToListItem(link.parent());
    			}
    		},
    		unhighlightModel: function(key) {
    			this.list.find("a[href='"+key+"']").removeClass("highlighted");
    		}
	    }
	});
	
})();