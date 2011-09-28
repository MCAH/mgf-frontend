/*
	Small Ajax Profile when some object comes into focus
*/

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "ProfileComponent",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			this.dom = this.sandbox;
    			var that = this;
    			_a.IO.getComponentHtml("ProfileComponent",function(html){
    				that.dom.append(html);
    				that.profile = that.dom.find("div#map_profile ul");
    				that.dragbar = that.dom.find("#profile_dragbar");
    				that.select = that.dom.find("select");
    				that.image_type = "frontispiece";
    				that.listen();
    				that.profile.parent().height(that.dom.height()-30);
    				that.lastDimension = { height:undefined, width:100 };
    				that.dragbar.height(that.dom.height()); // set the drag bar's height
    				that.hasBeenOpenedOnce = false;
    				that.hiddenFromView = false;
    				that.toHide = $(that.inlineOptions.hide);
    			});
    		},
    		listen: function() {
    			var that = this;
    			this.select.change(function(){
    				that.switchImageTypes($(this).find("option:selected").attr("value"));
    			});
    			_a.IO.require("dependencies/DragDropSort",function(){
    				that.profile.sortable({
    					opacity: 0.7
    				});
    			});
    			_a.IO.require("dependencies/DisableTextSelect",function(){
    				that.dragbar.disableTextSelect();
    			});
    			// for resizing width-wise
    			this.being_widened = false;
    			// start the resize
    			that.dragbar.mousedown(function(){
    				that.being_widened = true;
    			});
    			// resizing
    			$("html").mousemove(function(e){
    				if(that.being_widened === true) {
    					var percent = (e.pageX/$(window).width())*100;
    					var other_width = 100-percent;
    					$("#left_sidebar").css("width",percent+"%");
    					$("#right_main").css("width",other_width+"%");
    					// resizing images
    					that.reflowLayout();
    					_a.resizeWindow();
    				}
    			});
    			// end the resizing
    			$("html").mouseup(function(e){
    				if(that.being_widened === true) {
    					that.being_widened = false;
    				}
    			});
    			// close button on individual churches
    			this.profile.delegate("strong.close","click",function(){
    				that.unselectModel($(this).closest("li").attr("rel"));
    			});
    			// close button for everything in the current drawer
    			this.sandbox
    			    .find("button.clearselection").click(function(){
    			        that.profile.find("strong.close").trigger("click");
    			    })
    			    .end()
    			    .find("button.compare").click(function(){
    			        var ids = that.profile.find("li img").map(function(){
    			            return $(this).attr("image_id");
    			        }).toArray();
    			        window.open("/compare?mode=naked#/"+ids.join("/"),"compare",
    			            "menubar=1,resizable=1,width=1024,height=728");
    			    });
    		},
    		unrender: function() {
    			this.profile.empty();
    		},
    		resize: function() {
    			this.reflowLayout();
    		},
    		hide: function() {
    		    this.sandbox.fadeOut();
    		    this.toHide.fadeIn("fast");
    		},
    		show: function() {
    		    this.sandbox.fadeIn();
    		    this.toHide.fadeOut("slow");
    		},
    		highlightModel: function(key) {
    			if(this.sandbox.css("display") != "block" && this.hasBeenOpenedOnce === false) {
    				this.show();
    				var that = this;
    				setTimeout(function(){
    					that.highlightModel(key);
    				},300);
    				return;
    			}
    			if(this.hiddenFromView == true) {
    				//this.sandbox.find("div#heightChanger").trigger("click");
    				this.show();
    				var that = this;
    				setTimeout(function(){
    					that.highlightModel(key);
    				},300);
    				return;
    			}
    			// if it's already here, skip it!
    			if(this.profile.find("li[rel='"+key+"']").length !== 0) { return; }
    			// otherwise, we should actually render it
    			var model = this.getModel(key);
    			// load the profile dynamically...
    			var item = $("<li/>",{
    				rel: model.key(),
    				html: $("<div/>",{
    					"class": "li-wrapper",
    					html: $("<a/>",{
    					    "class": "postersize",
    					    href: "/"+model.key(),
    					    html: $("<h5/>",{
    					        text: model.get("name")
    					    })
    					})
    				})
    			});
    			item.append($("<strong/>",{
    				"class": "close",
    				html: _a.Elements.UIStuff.closeButton()
    			}));
    			this.profile.append(item);
    			item.data("model",model); // cache it for easy iteration later
    			this.addImageTo(item);
    		},
    		unhighlightModel: function(key) {
    			this.profile.find("li[rel='"+key+"']").remove();
    			this.reflowLayout();
    			var that = this;
    			// wait for 250 milliseconds to hide the component itself if nothing is showing
    			setTimeout(function(){
    				if(that.profile.find("li").length === 0) {
    					that.hide();
    				}
    			},250);
    		},
    		addImageTo: function(li) {
    			var that = this,
    			    callback = function(image) {
    			        if(li.find("img.poster").length === 0) {
        					that.addImage(li,image);
        					that.reflowLayout();
        				}
    			    };
    			if(this.image_type === "parametric") {
    			    callback(undefined);
    			}
    			else {
    			    li.data("model").get(this.image_type,callback);
    			}
    		},
    		reflowLayout: function() {
    			// the rory o'neill algorithm for placing images
    			var tiles = this.profile.find("li"),
    			    howMany = tiles.length,
    			    fullHeight = this.sandbox.height() - 100,
    			    fullWidth = this.sandbox.width() - 20,
    			    height = undefined,
    			    width = undefined;
    			// the brains goes here
    		    var dims = this.calculateOptimalTileSize(fullHeight,fullWidth,tiles);
    		    height = dims.maxHeight;
    		    width = dims.width;
    			// execute the results of the calculation
    			if(howMany === 1) {
    				height += 75;
    			}
    			tiles.height(height).width(width);
    			try {
    			    this.resizeImages();
    			}
    			catch(e) { _a.log(e); }
    		},
    		calculateOptimalTileSize: function(fullHeight,fullWidth,tiles) {
    			var howMany = tiles.length;
    			var columns = 1;
    			var rows = undefined, maxHeight = 0, prevMaxHeight = 0,
    				prevTw = undefined, prevTh = undefined,
    				tw = undefined, th = undefined,
    				totalImageArea = 0, prevTotalImageArea = 0,
    				guvnah = 0, that = this;
    			// now run that loop!
    			while(guvnah < 50) {
    				totalImageArea = 0;
    				prevMaxHeight = maxHeight;
    				maxHeight = 0;
    				rows = Math.ceil( howMany / columns );
    				tw = fullWidth / columns;
    				th = fullHeight / rows;
    				// fit each image and get the total image area
    			    tiles.each(function(){
    					var img = $(this).find("img.poster");
    			        try {
    			            var dims = img.data("image").maximizeForTile(th,tw);
    			        }
    			        catch(e) { }
    				    // make sure the image exists
    					if(dims.height !== NaN) {
    						totalImageArea += dims.height*dims.width;
    						if(dims.height > maxHeight) {
    							maxHeight = dims.height;
    						}
    					}
    				});
    				if(prevTotalImageArea > totalImageArea) {
    					return {
    					    height: prevTh,
    					    width: prevTw,
    						columns: columns-1,
    						maxHeight: prevMaxHeight
    					};
    				}
    				prevTh = th; prevTw = tw;
    				prevTotalImageArea = totalImageArea;
    				columns += 1;
    				guvnah += 1;
    			}
    			return {
    			    height: th,
    			    width: tw,
    				columns: columns,
    				maxHeight: maxHeight
    			};
    		},
    		resizeImages: function() {
    			if(this.image_type === "floorplan") {
    				this.rescaleFloorplans();
    				return;
    			}
    			if(this.image_type === "parametric") {
    			    var that = this;
    			    // gotta wait for the buildingModels to roll in
    			    setTimeout(function(){
    			        that.rescaleParametrics();
    			        setTimeout(function(){
    			            that.rescaleParametrics();
    			        },500);
    			    },500);
    			}
    			// default (for normal images)
    			this.profile.find("li").each(function(){
    				var image = $(this).find("img.poster");
    				var width = $(this).width();
    				var height = $(this).height();
    				image.data("image").centerAndFit(height-10,width,image,{ x:25, y:45 });
    			});
    		},
    		rescaleFloorplans: function() {
    			// one pass to find the smallest scale ratio
    			var largest = 1000; // impossibly large
    			this.profile.find("img.floorplan").each(function(){
    				var scale = parseFloat($(this).data("image").get("scale"));
    				if(largest > scale) { largest = scale; }
    			});
    			this.profile.find("li").each(function(){
    				var image = $(this).find("img.poster"),
    				    obj = image.data("image");
    				if(obj.centerAndScaleAndFit) {
    				    image.data("image").centerAndScaleAndFit(
        					$(this).height()-5,$(this).width()-20,
        					image,largest,{ x:5, y:15 }
        				);
    				}
    			});
    		},
    		rescaleParametrics: function() {
    		    var tallest = 0;
    		    this.profile.find("img.poster").each(function(){
    		        var height = $(this).data("image").maxHeight();
    		        if(height > tallest) {
    		            tallest = height;
    		        }
    		    });
    		    var allowable = this.profile.find("li").height();
    		    var scale = allowable/tallest * .75;
    		    // how much does it need to shrink?
    		    this.profile.find("img.poster").each(function(){
    		        $(this).data("image").scaleTo(scale);
    		    });
    		},
    		switchImageTypes: function(new_type) {
    		    var that = this;
    		    // make sure we have the parametric component code
    		    if(new_type === "parametric" && _a.ParametricComponent === undefined) {
    		        _a.IO.require("components/ParametricComponent",function(){
    		            that.switchImageTypes(new_type);
    		        });
    		        return;
    		    }
    		    // proceed as usual
    			var old_type = this.image_type;
    			this.image_type = new_type;
    			this.profile.find("img").each(function(){
    				var li = $(this).closest("li");
    				if(new_type === "parametric") {
    				    that.addImage(li,undefined,old_type);
    				}
    				else {
    				    li.data("model").get(new_type,function(image){
        					that.addImage(li,image,old_type);
        				});
    				}
    			});
    			setTimeout(function(){
    			    that.reflowLayout();
    			},150);
    		},
    		addImage: function(li,image,old_type) { // generic image adding...
    		    var img = li.find("img.poster");
    		    if(this.image_type === "parametric") {
    		        img.css("display","none");
        			img.next(".parametric").remove();
        			img.data("image",this.addParametricAfter(img,li.data("model")));
    		    }
    		    else {
    		        if(!image.get("id")) {
        		        image = new _a.BlankImage();
        		    }
        		    var src = image.get("thumbnail"),
        		        img = li.find("img.poster"); // defined in if statements
        		    // now do we need a new img or do we modify an old img?
        			if(img.length === 0) { // no image yet added
        			    // now the actual image that will be tucked into the li
        			    var img = $("<img/>",{
        			        "class": this.image_type + " poster",
        			        src: src
        			    });
        				li.find("a").prepend(img);
        			}
        			else { // there is already an image here, just modify it
        				img.removeClass(old_type)
        				    .addClass(this.image_type)
        				    .attr("src",src)
        				    .css("display","inline")
                            .next("parametric").remove();
        			}
        			img.data("image",image);
    		    }
    		    // if there is no image, fake the src attribute
    		    
    			/*
    			// wait, was this supposed to be parametric?
    			if(this.image_type === "parametric") {
    			    img.css("display","none");
        			img.next(".parametric").remove();
        			img.data("image",this.addParametricAfter(img,li.data("model")));
    			}
    			*/
    			//else {
    			//    img.data("image",image);
    			//}
    			// now reflow the whole layout
    			this.reflowLayout();
    		},
    		addParametricAfter: function(elem,building) {
    		    var li = elem.closest("li"),
    		        sandbox = $("<div/>",{
    		            "class": "parametric",
    		            css: {
    		                height: li.height() - 25,
    		                width: li.width() - 5
    		            }
    		        }),
    		        section = _a.componentBuilder({
                        component: "ParametricComponent",
                        sandbox: sandbox,
                        provider: building
                    });
                elem.after(sandbox);
                return section;
    		}
	    }
	});
	
})();