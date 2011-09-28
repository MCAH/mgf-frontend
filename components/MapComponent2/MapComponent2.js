/*
	All kinds of mapping functionality
	all wrapped up, ready to use
*/

(function(){

	var _a = Archmap;
	var _g = google.maps;
	
	// non-this functions
	var blowupStreet = function(attachTo,latlng) {
	        var div = $("<div/>",{
	                css: {
	                    position: "absolute",
	                    top: 25, left: 25,
	                    width:300, height:300,
	                    zIndex: "10000000000000000000000000"
	                },
	                html: $("<div/>",{
	                    css: { height: 300, width:300 }
	                })
	            }).appendTo($("body")),
	            pano = new _g.StreetViewPanorama(div.find("div")[0],{
	                position: latlng,
	                pov: {
	                    heading: 165,
	                    pitch: 0,
	                    zoom: 1
	                }
	            });
	        return pano;
	    };
	
	_a.defineComponent({
	    name: "MapComponent2",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			var that = this;
    			_a.IO.require([
    			        "components/AMap2",
    			        "dependencies/Raphael",
    			        "dependencies/GStil"
    			    ],function(){
    			        that.loadTemplate("MapComponent2",function(){
    			            that.defineHandles().initializeMap().render();
    			        });
    			    });
    		},
    		unrender: function() {
    		    for(var m in this.markers) {
    		        this.markers[m].setMap(null); // delete
    		    }
    		    for(var o in this.overlays) {
    		        this.overlays[o].setMap(null);
    		    }
    		},
    		defineHandles: function() {
    			this.box = this.sandbox.find("div.map_box");
    			this.mapdom = this.sandbox.find("div.map");
    			var height = this.sandbox.height();
    			this.mapdom.height(height).width("100%"); // define height/width explicitly
    			this.markers = {}; // all the markers we end up throwing on the map, keyed by key
    			this.overlays = {}; // overlays are weird, so they need their own thing
    			this.collections = {}; // collections, so we can highlight subcollections
    			return this; // chaining
    		},
    		initializeMap: function() {
    			var that = this,
    			    options = _a.Config.maps.getGoogleMapOptions(),
    			    map = new _g.Map(this.mapdom[0],options),
    			    simple = _a.MapStuff.getGStil(map,"Simple",false),
    			    complex = _a.MapStuff.getGStil(map,"Localities",true);
    			map.mapTypes.set(simple.style.name,simple.style);
    			map.mapTypes.set(complex.style.name,complex.style);
    			map.setMapTypeId(simple.style.name);
    			this.styles = {
    			    simple: simple,
    			    complex: complex
    			};
    			// inlineOptions
    			if(this.inlineOptions.constrain !== undefined) {
    			    map.alterBoundsFitting({ left:200 });
    			}
    			// zoomers?
    			if(this.inlineOptions.zoom !== "false") {
    			    _a.Zooms.addCustomZooms(this.mapdom,map,undefined,this);
    			}
    			// should a collection be overlaid on top of the map?
    			if(this.inlineOptions.overlay) {
    			    _a.dataStore.get(this.inlineOptions.overlay,function(overlay){
    			        that.renderModel(overlay,{
    			            fill: "green",
    			            opacity: 0.4
    			        });
    			    });
    			}
    			// add a legend to the map
    			if(this.sandbox.height() > 500) {
    			    var that = this;
    				var legend = new _a.ArchmapLegend({
    					map: map,
    					sandbox: this.sandbox,
    					historicalMaps: (this.inlineOptions.historicalMaps)
    					  ? _a.Config.maps.historicalMapCollection : undefined,
    					customType: simple.name,
    					list: (this.inlineOptions.legend) ? true : undefined
    				});
    				this.addToolTip = true;
    				// do we need a fieldwork button?
    				legend.addCallback(function(){
    				    if(that.inlineOptions.fieldworkButton) {
    				        (function(){
    				            var clicks = 0;
            			        legend.addButton({
            			            text: "All Churches",
            			            click: function() {
            			                var collection = (clicks%2 === 0) ? 157 : 1;
            			                _a.dataStore.get("collection/"+collection,function(model){
            			                    $("html").trigger("newDataProvider",[
            			                        _a.dataStore.auxiliaryDataProvider(model)
            			                    ]);
            			                });
            			                clicks += 1;
            			            }
            			        });
            			    })();
            			}
    				});
    				setTimeout(function(){
    				    // the fieldwork collection
    				    //_a.dataStore.get("collection/157");
    				},3000);
    				this.legend = legend;
    				this.panorama = map.getStreetView();
    				___map = map;
    			}
    			// listen for zoom changes
    			_g.event.addListener(map,"zoom_changed",function(){
    				var zoom = map.getZoom(),
    					type = map.getMapTypeId();
    				if(zoom >= 8 && type == simple.name) { // when the zoom reaches a certain level
    					map.setMapTypeId(complex.name); // we change to the complex map type
    					return;
    				}
    				if(zoom < 8 && type == complex.name) { // same goes for the other way around
    					map.setMapTypeId(simple.name);
    					return;
    				}
    			});
    			// single clicks get rid of disambiguation popin maps
    			_g.event.addListener(map,"click",function(){
    				if(that.canDisablePopinMap === true) {
    					try {
    						setTimeout(function(){
    							that.popinMap.setMap(null); // the new way to remove stuff?
    						},100);
    					}
    					catch(e) { }
    				}
    			});
    			// right clicks for context views
    			/*
    			_g.event.addListener(map,"rightclick",function(){
    				if(that.lastClickedMarker !== undefined) {
    					that.markers[that.lastClickedMarker].addContextMenu();
    				}
    			});
    			*/
    			$("html")
    			    .bind("historicalMapOpacityChange",function(e,opacity){
    			        if(that.currentOverlay !== undefined) {
    			            that.currentOverlay.changeOpacity(opacity);
    			        }
    			    })
    			    .bind("removeHistoricalMapOverlay",function(){
    			        that.currentOverlay.hide();
    			    });
    			this.map = map; // remember for later!
    			return this; // the map is ready! chain on chainer!
    		},
    		renderModel: function(model,styles,depth,hidden) {
    			var that = this,
    			    depth = depth || 0,
    			    iconShape = model.get("icon_shape"),
    			    color = model.get("color"),
    			    shape = model.get("shape");
			    if(iconShape) {
			        (styles) ? styles.path = iconShape : styles = { path: iconShape };
			    }
			    if(color) {
			        (styles) ? styles.fill = color : styles = { fill: color };
			    }
    			if(model.isIterable()) {
    			    var collection = [];
    			    this.preventFinalize(); // don't finalize until we render this collection
    			    // watch out for special render styles (like drawing arrows to a single point)
    			    var renderStyle = parseInt(model.get("render_style"),10);
    			    if(renderStyle === 1) {
    			        var first;
    			        model.iterateMembers(function(i,member){
    			            var stil = $.extend({},styles);
    			            if(i === 0) {
    			                first = new _g.LatLng(member.get("lat"),member.get("lng")); // cache start point
    			                collection.push(that.renderModel(member,$.extend(stil,
    			                    {
    			                        fill: "deeppink",
    			                        scale: 2
    			                    }),
    			                    depth + 1,hidden
    			                ));
    			            }
    			            else {
    			                collection.push(that.renderModel(member,$.extend(stil,
    			                    {
    			                        arrow: {
    			                            stop: first
    			                        }
    			                    }),
    			                    depth + 1,hidden
    			                ));
    			            }
    			        },function(){
    			            that.enableFinalize().finalize();
    			        });
    			    }
    			    else if(renderStyle === 2) {
    			        var members = model.get("members"),
    			            blue = 15;
    			        model.iterateMembers(function(i,member){
    			            var stil = $.extend({},styles);
    			            var next = members[i+1];
    			            if(next !== undefined) {
    			                blue += i;
    			                collection.push(that.renderModel(member,$.extend(stil,
    			                    {
    			                        arrow: {
    			                            stop: new _g.LatLng(next.get("lat"),next.get("lng"))
    			                        },
    			                        strokeColor: "rgb("+blue+",0,"+blue+")"
    			                    }),
    			                    depth + 1,hidden
    			                ));
    			            }
    			            else {
    			                collection.push(that.renderModel(member,stil,depth+1,hidden));
    			            }
    			        },function(){
    			            that.enableFinalize().finalize();
    			        });
    			    }
    			    else if(renderStyle === 3) {
    			        var first;
    			        model.iterateMembers(function(i,member){
    			            var stil = $.extend({},styles);
    			            if(i === 0) {
    			                first = new _g.LatLng(member.get("lat"),member.get("lng")); // cache start point
    			                collection.push(that.renderModel(member,$.extend(stil,
    			                    {
    			                        fill: "deeppink",
    			                        scale: 2
    			                    }),
    			                    depth + 1,hidden
    			                ));
    			            }
    			            else {
    			                collection.push(that.renderModel(member,$.extend(stil,
    			                    {
    			                        arrow: {
    			                            start: first
    			                        }
    			                    }),
    			                    depth + 1,hidden
    			                ));
    			            }
    			        },function(){
    			            that.enableFinalize().finalize();
    			        });
    			    }
    			    else {
    			        var stil = styles || {};
        				model.iterateMembers(function(i,member){
        					collection.push(that.renderModel(member,stil,depth+1,hidden));
        				},function(){ // what to do when we're done
        					that.enableFinalize().finalize(); // clear the lock, try to finalize
        				},true);
    			    }
    			    this.collections[model.key()] = collection;
    			    return collection;
    			}
    			else if(model.get("lat") && model.get("lng")) {
    			    if(depth > 2) {
    			        return;
    			    }
    			    if(shape) {
        			    var marker = new _a.Markers.Ghost({
        			        shape: shape,
        			        map: this.map,
        			        model: model,
        			        hidden: hidden,
        			        color: color
        			    });
        			}
        			else {
    				    var marker = new _a.Markers.ShapeMarker({
        					position: new _g.LatLng(model.get("lat"),model.get("lng")),
        					map: this.map,
        					model: model,
        					addToolTip: this.addToolTip,
        					styles: styles,
        					hidden: hidden,
        					callbacks: {
        						mouseover: function() {
        							that.hoverModel(model.key());
        						},
        						mouseout: function() {
        							that.unhoverModel(model.key());
        						},
        						click: function() {
        							var overlaps = that.isThisMarkerOverlappingAnyOthers(model.key());
        							if(overlaps) {
        								that.popopenMapForChoosing(overlaps);
        							}
        							else {
        								that.lastClickedMarker = model.key();
        								that.selectModel(model.key());
        							}
        						}
        					}
        				});
        			}
    				this.markers[model.key()] = marker; // save it!
    				return marker;
    			}
    			else if(model.isOfType("Image")) {
    			    model.get("building",function(building){
    			        that.renderModel(building,styles,depth+1,hidden);
    			        that.finalize();
    			    });
    			}
    			else if(model.isOfType("Map")) {
    			    var overlay = new _a.HistoricalMapOverlay({
    			        map: this.map,
    			        model: model,
    			        opacity: 0.7,
    			        shouldFillMap: true,
    			        visibility: "visible"
    			    });
    			    this.overlays[model.key()] = overlay;
    			}
    		},
    		finalize: function() {
    			if(this.canBeFinalized()) {
    				var markers = this.markers,
    				    bounds = new _g.LatLngBounds(),
    				    length = _.reduce(markers,function(length,m){
    				        var ll = m.getLatLng();
    				        ( _.isArray(ll) )
    				            ? _.each(ll,function(l){ bounds.extend(l); })
    				            : bounds.extend(ll);
    				        return length + 1;
    				    },0);
    				// what should we do with these bounds?
    				if(bounds !== undefined) {
    				    if(length === 1) {
    				        var head = _.head(_.values(markers)).getLatLng();
    				        (_.isArray(head))
    				            ? this.map.fitBounds(bounds)
    				            : this.map.setCenter(head);
    				        this.map.setZoom(5);
    				    }
    				    else {
    				        this.map.fitBounds(bounds);
    				    }
    				}
    			}
    		},
    		highlightModel: function(key) {
    		    var model = _a.dataStore.get(key),
    		        that = this;
    		    if(model.isOfType("Collection")) {
    		        this.renderModel(model,{ fill: "blue" });
    		    }
    		    else if(key in this.overlays) {
    		        var overlay = this.overlays[key];
    		        overlay.show().fillMap();
    		        this.currentOverlay = overlay;
    		    }
    		    else {
    		        var marker = this.markers[key],
    		            ll = marker.getLatLng();
    		        marker.highlight();
        			marker.hover();
        			if(this.map.getBounds().contains(ll) === false) {
        			    this.map.setCenter(ll);
        			}
        			//setTimeout(function(){
        			//    blowupStreet(null,ll);
        			//},1000);
    		    }
    		},
    		unhighlightModel: function(key) {
    		    var model = _a.dataStore.get(key);
    		    if(model.isOfType("Collection")) {
    		        _.each(this.collections[key],function(marker){
    		            marker.remove();
    		        });
    		    }
    		    else if(key in this.overlays) {
    			    this.overlays[key].hide();
    			}
    			else {
    			    this.markers[key].unhighlight();
    			    this.markers[key].unhover();
    			}
    		},
    		hoverOnModel: function(key) {
    			var isMultiselection = this.dataProvider.getSelectionStack().length > 0;
    			this.markers[key].hover();
    			this.markers[key].setTipText(isMultiselection);
    		},
    		hoverOffModel: function(key) {
    			var isMultiselection = this.dataProvider.getSelectionStack().length > 0;
    			this.markers[key].unhover();
    			this.markers[key].setTipText(isMultiselection);
    		},
    		focusModel: function(key) {
    			var marker = this.markers[key];
    			if(marker !== undefined) {
    				marker.focus();
    			}
    		},
    		blurModel: function(key) {
    			var marker = this.markers[key];
    			if(marker !== undefined) {
    				marker.blur();
    			}
    		},
    		isThisMarkerOverlappingAnyOthers: function(key) {
    			// convert 25 pixels to latlng
    			var projection = this.markers[key].getProjection();
    			var point = projection.fromLatLngToDivPixel(this.markers[key].getLatLng());
    			var northeast = projection.fromDivPixelToLatLng(new _g.Point(point.x+5,point.y-5));
    			var southwest = projection.fromDivPixelToLatLng(new _g.Point(point.x-5,point.y+5));
    			var bounds = new _g.LatLngBounds(southwest,northeast);
    			var overlaps = [];
    			for(var m in this.markers) {
    				if(m == key) {
    					continue;
    				}
    				if(bounds.contains(this.markers[m].getLatLng())) {
    					overlaps.push(this.markers[m]);
    				}
    			}
    			if(overlaps.length > 0) {
    				overlaps.push(this.markers[key]); // we should also consider the clicked thing
    				return overlaps;
    			}
    			return false;
    		},
    		popopenMapForChoosing: function(overlaps) {
    			this.canDisablePopinMap = false;
    			var that = this;
    			this.popinMap = new _a.PopinMap({
    				map: this.map,
    				points: overlaps,
    				callback: function(modelkey) {
    					that.selectModel(modelkey);
    				}
    			});
    			setTimeout(function(){
    				that.canDisablePopinMap = true;
    			},300);
    		},
    		resize: function() {
    			this.mapdom
    				.height(this.sandbox.height())
    				.width(this.sandbox.width());
    			_g.event.trigger(this.map,'resize');
    			this.finalize();
    		}
	    }
	});
	
})();