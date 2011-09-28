/* family of functions for easy (painless) HTML rendering */

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
	
})();