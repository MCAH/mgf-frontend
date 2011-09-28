/*
	Google maps version of plan component
*/

(function(){
	
	var _a = Archmap,
	    _g = google.maps;
	
	_a.defineComponent({
	    name: "PlanComponentM",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			this.markers = {}; // the plot points, keyed by id in image table (bad idea?)
    			this.appliedFilters = {};
    			var that = this;
    			_a.IO.getComponentHtml("PlanComponentM",function(html){
    				that.sandbox.append(html);
    				_a.IO.require("components/AMap2",function(){
    					that.defineHandles().render();
    				});
    			});
    		},
    		defineHandles: function() {
    			this.planHandle = this.sandbox.find("div.plan");
    			this.planHandle.css("width",this.sandbox.width());
    			// make an image view box connected to the body, at a high z-index level
    			this.imageView = this.sandbox.find(".plan-image-view");
    			this.bigger = this.inlineOptions.bigger;
    			this.smaller = this.inlineOptions.smaller;
    			this.addControls();
    			var that = this;
    			_a.IO.require("dependencies/DisableTextSelect",function(){
    				that.imageView.disableTextSelect();
    			});
    			// listen for when to show plan image view
    			var that = this;
    			this.sandbox.hover(function(){},function(){
			        setTimeout(function(){
			            that.imageView.css("display","none");
			        },1);
			    });
    			return this;
    		},
    		addControls: function() {
    			this.controls = this.sandbox.find("div.inner-controls");
    			this.levels = this.controls.find("select");
    			// adding the level controls with an easy for-loop
    			var levels = {
    				"-1": "Crypt", 1: "Ground", 2: "Gallery", 3: "Triforium",
    				4: "Clerestory", 5: "Roof", 6: "Tower"
    			};
    			for(var l in levels) {
    				this.levels.append("<option value='"+l+"'>"+levels[l]+"</option>");
    			}
    			this.filters = this.controls.find("input:checkbox");
    			// should we add an enlarge button?
        		if(this.bigger) {
        			var that = this;
        			this.sandbox.append($("<button/>",{
        			    "class": "size-changer",
        			    text: "Expand plan viewer",
        			    click: function(){
        			        that.sandbox.fadeOut();
        			        if(that.bigger instanceof _a.PlanComponentM) {
        			            that.bigger.sandbox.fadeIn();
        			        }
        			        else {
        			            that.bigger = new _a.PlanComponentM({
        			                sandbox: $(that.bigger), // it's just a selector, so... yeah
        			                provider: that.dataProvider,
        			                smaller: that.sandbox
        			            });
        			        }
        			    }
        			}));
        		}
        		if(this.smaller) {
        		    var that = this;
        		    this.sandbox.append($("<button/>",{
        		        "class": "size-changer",
        		        text: "Shrink plan viewer",
        		        click: function() {
        		            that.sandbox.fadeOut();
        		            that.smaller.fadeIn();
        		        }
        		    }));
        		}
    			this.listenToControls();
    		},
    		listenToControls: function() {
    			//this.current_level = "all";
    			var that = this;

    			/* option selects for what floor to look at */
    			this.levels.change(function(){
    				//that.current_level = $(this).find("option:selected").attr("value");
    				//alert(that.current_level);
    				var filters = [];
    				var all = false;
    				$(this).find("option").each(function(){
    					var filter = { field: "level", value: $(this).attr("value") };
    					if($(this).is(":selected") || all) {
    						filter.availability = true;
    						if(filter.value == "all") {
    							all = true; // everything should be visible
    						}
    					}
    					else {
    						filter.availability = false;
    					}
    					filters.push(filter);
    				});
    				that.addFilter(filters);
    			});

    			/* checkboxes, turning off and on */
    			this.controls.find("input:checkbox").mousedown(function(e){
    				var current = $(this).is(":checked"); // the value before the click
    				if(current === true) { // it is being deselected
    					var opposite = $("input[name='"+$(this).attr("opposite")+"']");
    					if(opposite.is(":checked") === false) {
    						opposite.trigger("mousedown"); // select the opposite, so something shows
    					}
    				}
    				$(this).attr("checked",!current); // set it to the opposite, as it should be
    				that.addFilter({
    					field: $(this).attr("field"),
    					value: $(this).attr("value"),
    					availability: !current
    				});
    				/* the code below is to disable funky default handling of checkboxes */
    			}).click(function(){
    				return false; // annoying default behavior
    			});
    			this.controls.find("label").click(function(){
    				$("input[name='"+$(this).attr("for")+"']").trigger("click");
    			});
    		},
    		/* image filter, needs an object { field:*, value:*, availability:bool } */
    		addFilter: function(filter) { // filter can be array of filters
    			if(_a.Utilities.isArray(filter) === false) {
    				filter = [filter]; // make it an array
    			}
    			for(var felt in filter) {
    				var filt = filter[felt];
    				if(filt.availability === true) {
    					delete this.appliedFilters[filt.field+"/"+filt.value];
    				}
    				else {
    					this.appliedFilters[filt.field+"/"+filt.value] = filt;
    				}
    			}
    			this.applyFilters();
    		},
    		checkLevels: function() {
    			var that = this;
    			this.levels.find("option").each(function(){
    				var value = parseInt($(this).attr("value"),10);
    				var count = that.checkFilterCount({
    					field: "level",
    					value: value
    				});
    				if(count === 0 && $(this).attr("value") != "all") {
    					$(this).remove();
    				}
    			});
    			if(this.levels.find("option").length == 2) {
    				$(this.levels.find("option")[0]).remove();
    			}
    		},
    		checkFilterCount: function(filter) {
    			var count = _.foldr(this.markers,_.bind(function(acc,marker){
    				//console.log(filter.value,filter.field,marker.data[filter.field]);
    				var value = (marker.data[filter.field] == filter.value) ? 1 : 0;
    				return acc + value;
    			},this),0);
    			return count;
    		},
    		/* loop through all the filters and apply them */
    		applyFilters: function() {
    			var that = this;
    			if(this.markers === undefined) { return; }
    			$.each(this.markers,function(i,marker){
    				var record = marker.data;
    				var disallowed = false;
    				for(var i in that.appliedFilters) {
    					var filter = that.appliedFilters[i];
    					if(record[filter.field] == filter.value) {
    						disallowed = true;
    						break; // skip the other filters, this one has been disallowed
    					}
    				}
    				if(disallowed === true && marker.isPermanent() !== true) {
    					marker.hide();
    				}
    				else {
    					marker.show();
    				}
    			});
    		},
    		listen: function() {
    			var that = this;
    			var waiter = undefined;
    			var preventWaiter = false;
    			// for image hovering by other components
    			$("html").bind("imageHoverOn",function(e,model){
    				var id = $(model).attr("href").match(/\d{4,7}/)[0];
    				try {
    					that.markers[id].highlight();
    				}
    				catch(e) {
    					_a.log(e);
    				}
    			});
    			$("html").bind("imageHoverOff",function(e,model){
    				var id = $(model).attr("href").match(/\d{4,7}/)[0];
    				try {
    					that.markers[id].unhighlight();
    				}
    				catch(e) {
    					_a.log(e);
    				}
    			});
    			// in progress
    			$("html").bind("closestImagePlease",function(e,direction,image_id){
    				that.findNearestTo(image_id,direction);
    			});
    			return this;
    		},
    		renderModel: function(model) {
    			var that = this;
    			if(model instanceof _a.Building) {
    				model.get("floorplan",function(floorplan){
    					var div = that.planHandle;
    					_a.ImageLayer.getImageLayer(floorplan,function(layer){
    					  that.sandbox.append($("<div/>",{
    					    className: "plan_legend"
    					  }));
                that.plan = _a.ImageLayer.buildMapWithLayer(div[0],layer,"plan");
                _a.ImageLayer.hideGoogleLogo(div);
                _a.Zooms.addCustomZooms(div,that.plan,true);
                //return;
                _a.IO.require("dependencies/Raphael",function(){
                  var smallestWidth = layer.__smallestTile.w; // ok ok, it's ugly
        				  that.addImageMarkers(floorplan, smallestWidth, layer.maxZoom);
        			  });
          			_a.ImageLayer.hideGoogleLogo(div);
          			_a.ImageLayer.bindImagePan(layer,that.plan,div,0.025);
          			_a.Zooms.addCustomZooms(div,that.plan,true);
          			var fit = function(){
          			  _a.ImageLayer.fitImage(layer,that.plan,div);
          			};
          			setTimeout(fit,300);
          			setTimeout(fit,1000);
          			// so the box will disappear
      			    that.sandbox.hover(function(){},function(){
      			        setTimeout(function(){
      			            that.imageView.css("display","none");
      			        },1);
      			    });
              });
    				});
    			}
    			if(model instanceof _a.Image) {
    			    this.callingImage = model;
    			    model.get("building",function(building){
    			        that.renderModel(building);
    			    });
    			}
    		},
    		addImageMarkers: function(floorplan,tileWidth,maxZoom) {
    		    var that = this,
    			    ratio = tileWidth/700; // originally plotted on a 700 pixel image
    			    offset = 126; // some kind of magic number.... (TODO: explain)
        		// wait to get the plot, since it can be kinda HUGE
        		setTimeout(function(){
        			floorplan.get("plot",function(plot){
        				var length = plot.length;
        				var projection = new _a.EuclideanProjection();
        				// iterate each point, add it's marker
        				_.each(plot,function(p){
        				    var x = p.xloc*ratio,
        				        y = p.yloc*ratio,
        				        point = projection.fromPointToLatLng(new _g.Point(x+offset,y+offset)),
        				        latlng = new _g.LatLng((point.lat()/256),(point.lng()/256)),
        				        marker = new _a.Markers.PlanMarker({
        				          position: latlng,
            						  "class": "normal",
              						data: p,
              						maxZoom: maxZoom,
              						map: that.plan,
              						mouseover: function() {
              						    that.highlightPlotpoint(p.media_id);
              						},
              						click: function() {
              						    that.imageView.find("a").trigger("click");
              						}
        				        });
        				    // cleanup logic
    				        if(that.callingImage !== undefined && p.media_id === that.callingImage.get("id")) {
        					    marker.makePermanent();
        					}
        					if(p.level != 1 || p.view_type != 1) {
        						marker.initialHide();
        					}
        					// add to a list memory
        					that.markers[p.media_id] = marker;
        				});
        				// so the plan will zoom to the markers
        				that.fitToMarkers();
        				// trigger cosmetic control changes here
        				that.checkLevels();
        				that.levels.find("option[value='1']").attr("selected",true);
        				that.levels.change(); // notify the box of the change
        				that.controls.find("input:checkbox[name='details']").trigger("mousedown");
        			});
        		},1000); // hopefully no-one notices!
    		},
    		fitToMarkers: function() {
    			var bounds = undefined; // have to start undefined since we need a seed
    			for(var m in this.markers) {
    				var latlng = this.markers[m].getLatLng();
    				if(bounds === undefined) {
    					bounds = new _g.LatLngBounds(latlng,latlng);
    				}
    				else {
    					bounds.extend(latlng);
    				}
    			}
    			this.plan.fitBounds(bounds);
    			this.plan.setZoom(this.plan.getZoom()+1);
    		},
    		highlightPlotpoint: function(key) {
    		    var marker = this.markers[key],
    		        point = marker.data,
    		        type = (point.media_type == 1) ? "image" : "node",
    		        that = this;
    		    _a.dataStore.get([type,point.media_id].join("/"),function(item){
    		        var link = $("<a/>",{
    		            href: "/"+item.key(),
    		            rel: item.key(),
    		            "class": (that.callingImage) ? "notbiggable" : "biggable",
    		            html: $("<img/>",{
    		                src: (type == "node") ? item.get("thumbnail") : item.get("small")
    		            }),
    		            click: function() {
    		                if(that.callingImage !== undefined) {
        					    window.location.href = (type == "node") ? "/node/"+key : "/image/"+key;
        					}
    		            }
    		        });
    		        that.imageView
    		            .empty()
    		            .fadeIn()
    		            .append(link);
    		        //if(that.callingImage !== undefined) {
					//    window.location.href = "/image/"+that.closestPoint;
					//}
    		    });
    		},
    		/*
    		// not currently in use -- will be if arrows are added back
    		findNearestTo: function(imageId,direction) {
    			var latlng = this.markers[imageId].getLatLng();
    			var x = latlng.lng(),
    				y = latlng.lat(),
    				x_inc = 0,
    				y_inc = 0,
    				which = imageId;
    			var increment = 0.005;
    			if(direction == 0) { x_inc = -increment; }
    			else if(direction == 1) { y_inc = increment; }
    			else if(direction == 2) { x_inc = increment; }
    			else if(direction == 3) { y_inc = -increment; }
    			while(true) { // ruh-roh, it's infinite!
    				x += x_inc;
    				y += y_inc;
    				which = this.determineClosestMarker(new _g.LatLng(y,x));
    				if(which != imageId && this.markers[which].isPanorama() === false) {
    					break; // we found it!
    				}
    				if(y > 0 || x < 0 || x > 2 || y < -2) {
    					// TODO boundary condition to avoid infinite loop
    					return;
    				}
    			}
    			this.clickClosestMarker(true);
    		},
    		// not currently in use -- will be if arrows are added back
    		determineClosestMarker: function(latlng) {
    			var least = 100000;
    			var leastPoint = undefined;
    			var lat = latlng.lat();
    			var lng = latlng.lng();
    			for(var m in this.markers) {
    				if(this.markers[m].isHidden() === true) {
    					continue;
    				}
    				var mlatlng = this.markers[m]._latlng; // cheating for optimization!
    				var latDist = Math.abs( lat - mlatlng.lat() );
    				var lngDist = Math.abs( lng - mlatlng.lng() );
    				// now calculate the hypotenuse (geometry style!)
    				var dist = Math.sqrt( ( latDist * latDist ) + ( lngDist * lngDist ) );
    				if(dist < least) {
    					least = dist;
    					leastPoint = m;
    				}
    				this.markers[m].unhighlight();
    			}
    			this.markers[leastPoint].highlight();
    			this.closestPoint = leastPoint;
    			return leastPoint;
    		},
    		clickClosestMarker: function(shouldClick) {
    			var marker = this.markers[this.closestPoint];
    			var point = marker.data;
    			var type = "image";
    			if(point.media_type != 1) {
    				type = "node";
    			}
    			var that = this;
    			_a.dataStore.get(type+"/"+point.media_id,function(item){
    				that.imageView
    				    .empty()
    				    .css("display","block")
    				    .append($("<a/>",{
    					    href: "/"+item.key(),
    					    rel: item.key(),
    					    "class": "biggable",
    					    html: $("<img/>",{
    						    src: (type == "node") ? item.get("thumbnail"): item.get("small")
    					    })
    				    }));
    				if(shouldClick === true) {
    					if(that.callingImage !== undefined) {
    					    window.location.href = "/image/"+that.closestPoint;
    					}
    					else {
    					    that.imageView.find("a").trigger("click");
        					marker.click();
    					}
    				}
    				if(shouldClick === false) {
    					marker.click();
    				}
    			});
    		},
    		*/
    		resize: function() {
    		    this.planHandle
    				.width(this.sandbox.width());
    			_g.event.trigger(this.plan,'resize');
    		}
	    }
	});
	
})();