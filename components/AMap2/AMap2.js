/*
    just a ton of functions 
*/

(function(){
	
	var _a = Archmap,
	    _g = google.maps, // for local references
	    fadeSpeed = 1500;
	
	// so the loader knows I've loaded, even though this namespace isn't used
	_a.AMap2 = {};
	
	//// shhhhh, I'm sneaking into the Google Maps Prototype!
	//// oh well, kind of useless
	
	jQuery.extend(_g.Map.prototype,{
	    alterBoundsFitting: function(margins) {
	        this.__boundsMargins = {
        	    bottom: margins.bottom || 0,
        	    right: margins.right || 0,
        	    left: margins.left || 0,
        	    top: margins.top || 0
        	};
        	var that = this;
        	setTimeout(function(){
        	    that.fitBounds(that.getBounds());
        	},1000);
	    },
      _fitBounds: _g.Map.prototype.fitBounds,
      fitBounds: function(bounds) {
          if(this.__boundsMargins) {
            console.log("true");
              var that = this;
                   setTimeout(function(){
                       //that.setZoom(that.getZoom()+1);
                       that.panBy(-that.__boundsMargins.left,0);
                   },200);
          }
          return this._fitBounds(bounds);
      }
	});
	
	// private helper functions
	//var euclidean = new EuclideanProjection(), // cached projection object
	var geometry = {
	    convert: function(point,to,euclidean) {
	        return _.map([point,to],function(p){
	            return euclidean.fromLatLngToDivPixel(p);
	        });
	    },
	    sides: function(ps) {
	        return (ps[0])
	            ? [ ps[1].y - ps[0].y, ps[1].x - ps[0].x ]
	            : false;
	    },
	    angle: function(point,to,euclidean) {
	        var sides = this.sides(this.convert(point,to,euclidean));
	        return Math.atan2(sides[0],sides[1]) * (180/Math.PI);
	    },
	    pythagoreanChop: function(point,to,euclidean,reduction) {
	        var points = this.convert(point,to,euclidean),
	            start = points[0],
	            ab = this.sides(points),
	            a = ab[0], b = ab[1],
	            hype = Math.sqrt( (a*a) + (b*b) );
	        return ( reduction > hype )
	            ? point
	            : (function(){
	                var ratio = ( hype - reduction ) / hype,
	                    deltA = a * ratio,
	                    deltB = b * ratio;
	                return euclidean.fromDivPixelToLatLng(
	                    new _g.Point( start.x + deltB, start.y + deltA )
	                );
	            })();
	    }
	};
	
	_a.MapStuff = { // a family of functions, they just love maps!
	    getProjectionFor: function(map) {
	        // establish a dummy overlayview, then harvest it's projection
	        var p = function(map) { this.setMap(map); };
	        p.prototype = new _g.OverlayView();
	        $.extend(p.prototype,{
	            draw: function() {},
	            onAdd: function() {},
	            onRemove: function() {}
	        });
	        return new p(map).getProjection();
	    },
	    getNorthEastAndSouthWest: function(bounds,proj) {
	        return {
	            northeast: proj.fromLatLngToDivPixel(bounds.getNorthEast()),
	            southwest: proj.fromLatLngToDivPixel(bounds.getSouthWest())
	        };
	    },
	    getDivAreaFromLatLngBounds: function(bounds,proj) {
	        var northeast = proj.fromLatLngToDivPixel(bounds.getNorthEast()),
    	        southwest = proj.fromLatLngToDivPixel(bounds.getSouthWest());
    	    return {
    	        height: southwest.y - northeast.y,
    	        width: northeast.x - southwest.x
            };
	    },
	    getBoundsOffset: function(bounds,proj) {
	        var ps = this.getNorthEastAndSouthWest(bounds,proj);
	        return {
	            x: ps.southwest.x,
	            y: ps.northeast.y
	        };
	    },
	    bestFit: function(map,bounds,threshold) {
	        threshold = threshold || 0.6;
	        // let google try
	        map.fitBounds(bounds);
	        // now fix it if they didn't do a great job
	        var div = $(map.getDiv()),
		        height = div.height(),
		        width = div.width(),
		        proj = this.getProjectionFor(map),
		        overlayDims = this.getDivAreaFromLatLngBounds(bounds,proj),
		        heightPercent = overlayDims.height/height,
		        widthPercent = overlayDims.width/width;
		    // determine if we should zoom in another level
		    if(heightPercent < threshold && widthPercent < threshold) {
		        map.setZoom(map.getZoom()+1);
		    }
	    },
		getGStil: function(map,name,localities) {
		    // requires dependencies/GStil
		    var style = GStil.makeStyle(name)
		        .turnOff("road","poi.park","administrative")
                .rule("administrative.country",{ visibility: "simplified", lightness: 25 })
		        .rule("landscape",{ hue: "#00ff09", lightness: -15 })
		        .rule("water",{ visibility: "simplified", hue: "#ccccee", lightness: 95 })
		        .ruleIf((localities===true),"administrative.locality",{
		            visibility: "on", lightness: 35 })
		        .registerWith(map);
		    return style; // GStil
		}
	};
	
	_a.ArchmapLegend = function(options) {
		this.map = options.map;
		this.customType = options.customType;
		this.historicalMaps = options.historicalMaps;
		this.sandbox = options.sandbox; // dom element
		this.shouldAddList = options.list;
		this.initialize();
	};
	
	_a.ArchmapLegend.prototype = {
		initialize: function() {
			var that = this;
			_a.IO.getComponentHtml("ArchmapLegend",function(html){
				that.sandbox.append(html);
				that.defineHandles().addMapTypes();
				
				if(that.historicalMaps) { that.addHistoricalMaps(); }
				else { that.historicals.remove(); }
				
				if(that.shouldAddList === true) {
				    that.addList();
				}
				if(that.callback) {
				    that.callback();
			    }
			});
		},
		addCallback: function(callback) {
		    this.callback = callback;
		},
		defineHandles: function() {
		  this.box = this.sandbox.find(".ArchmapLegend"); // janky, yeh
			this.historicals = this.sandbox.find(".historicalMaps");
			this.mapTypes = this.sandbox.find(".mapTypes");
			this.list = this.sandbox.find(".legendList");
			this.list.css("display","none");
			// what happens when we click an .opener strong tag
			this.sandbox.find("strong.opener").toggle(function(){
				$(this).next("div.contents").slideDown();
			},function(){
				$(this).next("div.contents").slideUp();
			});
			return this; // chaining
		},
		addButton: function(params) {
		    this.box.append($("<div/>",{
		        "class": "drawer",
		        html: $("<strong/>",{
		            "class": "opener",
		            text: params.text,
		            click: function() {
		                params.click.call(this);
		            }
		        })
		    }));
		},
		addMapTypes: function() {
			var ul = this.mapTypes.find("ul");
			var mapTypes = this.map.mapTypes;
			var normals = {
				roadmap: "Roadmap",
				satellite: "Satellite",
				hybrid: "Hybrid",
				terrain: "Terrain"
			};
			normals[this.customType] = "MGF";
			for(var n in normals) {
				ul.append($("<li/>",{
					"class": "mapType",
					html: $("<strong/>",{
						"class": "option",
						data: { mapType: n },
						text: normals[n]
					})
				}));
			}
			var that = this;
			ul.find("strong").click(function() { // what to do when it's clicked
				that.map.setMapTypeId($(this).data("mapType"));
				if($(this).hasClass("beingDisplayed")) {
					$(this).removeClass("beingDisplayed");
				}
				else {
					ul.find("strong").removeClass("beingDisplayed");
					$(this).addClass("beingDisplayed");
				}
			});
			return this;
		},
		addHistoricalMaps: function() {
			var that = this;
			var ul = this.historicals.find("ul");
			_a.dataStore.get(this.historicalMaps,function(collection){
				collection.iterateMembers(function(i,map){
					ul.append($("<li/>",{
						html: $("<strong/>",{
							"class": "option",
							text: map.get("shortname"),
							data: { map: map }
						})
					}));
				});
				// code for handling all the links at once
				ul.find("strong.option").click(function(){
					if($(this).hasClass("beingDisplayed")) { // remove its map
						$(this).data("overlay").hide();
						$(this).removeClass("beingDisplayed");
						$(".overlayControlPanel").remove();
					}
					else {
					    if($(this).hasClass("overlayPrepared")) {
    						$(this).data("overlay").show();
    						$("strong.option").removeClass("beingDisplayed");
    						$(this).addClass("beingDisplayed");
    					}
    					else {
    						var overlay = new _a.HistoricalMapOverlay({
    							model: $(this).data("map"),
    							map: that.map
    						});
    						$(this).data("overlay",overlay);
    						$("strong.option").removeClass("beingDisplayed");
    						$(this).addClass("beingDisplayed").addClass("overlayPrepared");
    					}
    					$(".overlayControlPanel").remove();
    					var overlay = $(this).data("overlay"),
    					    map = $(this).data("map"),
    					    slider = $("<input/>",{
    					        type: "range",
    					        change: function(){
    					            overlay.changeOpacity($(this).attr("value")/100);
    					        }
    					    });
    					var thisThing = this;
    					_a.IO.require("dependencies/DragDropSort",function(){
    						var popover = _a.Elements.UIStuff.helpPopover({
    						    html: slider
    						        .before($("<a/>",{
    						            "class": "block-link",
    						            href: "/"+map.key(),
    						            text: map.get("name")
    						        }))
    						        .after($("<div/>",{
    						            html: map.get("descript")
    						        })),
    						    css: {
    						        top: $(thisThing).offset().top,
    						        right: $(window).width() - $(thisThing).offset().left + 5,
    						        zIndex: 10000000000000
    						    },
    						    extraClasses: "overlayControlPanel"
    						}).appendTo($("body"));
    						//$("div#container").append(popover);
    						//popover.draggable({ containment: "#container" });
    					});
					}
				});
			});
		},
		addList: function() {
		    this.list.fadeIn();
		    var that = this;
		    _a.IO.require("components/LegendComponent",function(){
		        var sandbox = that.list.find(".contents"),
		            list = new _a.LegendComponent({
		                sandbox: that.list.find(".contents"),
		                provider: _a.mainDataProvider(),
		                trigger: sandbox.prev("strong")
		            });
		    });
		}
	};
	
	/* Markers */
	
	_a.Markers = { // a whole store full of markers!
		getMarkerImage: function(name) {
			return new _g.MarkerImage(name,new _g.Size(30,30),new _g.Point(0,0),new _g.Point(0,30));
		},
		// boil down the necessary boilerplate
		extend: function(params) {
		    var init = params.methods.init,
		        name = params.name;
		    delete params.methods.init;
		    _a.Markers[name] = function() {
		        init.apply(this,arguments);
		    };
		    _a.Markers[name].prototype = (params.extend)
		        ? new _g[params.extend]()
		        : {}; // empty method hash, to be extended
		    $.extend(_a.Markers[name].prototype,params.methods);
		}
	};
	
	/* Markers.Ghost (blurred polygon) */
	
	var blurFactor = 25,
	    colorGovernor,
	    colorMachine = {
	        governor: undefined,
	        colors: [ "rgba(158,95,89,0.7)", "rgba(158,95,89,0.7)" ],
	        pull: function() {
	            var colors = this.colors.concat(), // copy
	                color = this.colors.shift();
	            this.colors.push(color);
	            if(this.governor === undefined) {
	                this.governor = setTimeout(function(){
	                    // replace it with the original
	                    colorMachine.colors = colors;
	                    // and kill this reference
	                    delete colorMachine.governor;
	                },10);
	            }
	            return color;
	        }
	    };
	    
	_a.Markers.extend({
	    name: "GhostPlace",
	    extend: "OverlayView",
	    methods: {
	        init: function(params) {
	            this.params = params;
	            var model = params.model;
	            this.latlng = new _g.LatLng(
	                model.get("lat"),
	                model.get("lng")
	            );
	            var that = this;
	            _a.IO.require("dependencies/StackBlur",function(){
	                that.setMap(params.map);
	            });
	        },
	        onAdd: function() {
	            var canvas = $("<canvas/>",{
	                "class": "ghostPlace",
	                css: {
	                    position: "absolute",
	                    zIndex: 100000
	                }
	            });
	            this.canvas = canvas;
	            this.con = canvas[0].getContext('2d');
	            this.getPanes().overlayImage.appendChild(canvas[0]);
	        },
	        draw: function() {
	            var proj = this.getProjection(),
	              zoom = this.map.getZoom(),
	              blur = parseInt(blurFactor * (zoom/20),10),
	              can = this.canvas[0],
	              con = this.con,
	              pixels = proj.fromLatLngToDivPixel(this.latlng);
	            can.width = 30;
	            can.height = 30;
	            con.fillStyle = "purple";
	            con.beginPath();
	            con.arc(15, 15, 10, 0, Math.PI*2, true);
	            con.closePath();
	            con.fill();
	            this.canvas.css({
	                top: pixels.y - 15,
	                left: pixels.x -15
	            });
	            StackBlur.blurCanvas(can,0,0,can.width,can.height,blur);
	        },
	        remove: function() {
	            this.setMap(null);
	        }
	    }
	});
	
	_a.Markers.extend({
	    name: "Ghost",
	    extend: "OverlayView",
	    methods: {
	        init: function(params) {
	            this.params = params;
	            this.map = params.map;
	            var shape = params.shape,
	                bounds = new _g.LatLngBounds(),
	                points = _.map(shape.split(";"),function(pair){
                        var ps = pair.split(","),
                            ll = new _g.LatLng(ps[0],ps[1]);
                        bounds.extend(ll);
                        return ll;
                    });
	            this.bounds = bounds;
	            this.points = points;
	            this.hidden = params.hidden;
	            var that = this;
	            _a.IO.require("dependencies/StackBlur",function(){
	                that.setMap(params.map);
	            });
	        },
	        onAdd: function() {
	            var canvas = $("<canvas/>",{
                    css: {
                        position: "absolute",
                        zIndex: 1000000,
                        display: (this.hidden) ? "none" : "block"
                    }
                });
                this.canvas = canvas;
                this.con = canvas[0].getContext('2d');
                // add it to the map
                this.getPanes().mapPane.appendChild(canvas[0]);
	        },
	        draw: function() {
	            // so you don't block the zooming, do it after an interval
	            var that = this;
	            setTimeout(function(){
	                that.redraw();
	            },100);
	        },
	        redraw: function() {
	            var proj = this.getProjection(),
	              zoom = this.map.getZoom();
	            if(zoom > 10) { this.map.setZoom(9); return; };
	            var blur = parseInt(blurFactor * (zoom/8),10),
	                bounds = this.bounds,
                    offset = _a.MapStuff.getBoundsOffset(bounds,proj),
                    size = _a.MapStuff.getDivAreaFromLatLngBounds(bounds,proj),
                    points = _.map(this.points,function(p){
                        var c = proj.fromLatLngToDivPixel(p);
                        return [ c.x - offset.x + blur, c.y - offset.y + blur ];
                    }),
                    can = this.canvas[0],
                    con = this.con;
                // and now draw
                can.width = size.width + blur*2;
                can.height = size.height + blur*2;
                con.fillStyle = this.params.color || colorMachine.pull();
                con.beginPath();
                con.moveTo.apply(con,_.head(points));
                _.each(_.tail(points),function(point){
                    con.lineTo.apply(con,point);
                });
                con.fill();
                StackBlur.blurCanvas(can,0,0,can.width,can.height,blur);
                this.canvas.css({
                    top: offset.y - blur,
                    left: offset.x - blur
                });
	        },
	        onRemove: function() {
	            this.canvas.remove();
	        },
	        getLatLng: function() {
	            return [
	                this.bounds.getNorthEast(),
	                this.bounds.getSouthWest()
	            ];
	        },
	        fadeIn: function() {
	            (function fade(that) {
	                (that.canvas === undefined)
	                    ? setTimeout(fade,300) // try again in a second
	                    : that.canvas.fadeIn(fadeSpeed);
	            })(this);
	        },
	        fadeOut: function() {
	            var that = this;
	            if(this.canvas) {
	                this.canvas.fadeOut(fadeSpeed,function(){
    	                $(this).remove();
    	                that.setMap(null);
    	            });
	            }
	        }
	    }
	});
	
	/* Markers.Arrow (polyline wrapper) */
	
	_a.Markers.extend({
	    name: "Arrow",
	    extend: "OverlayView",
	    methods: {
	        // takes params.start && params.stop
	        init: function(params) {
	            this.params = params;
	            this.map = params.map;
	            this.hidden = params.hidden;
	            this.setMap(params.map);
	        },
	        onAdd: function() {
	            // calculate the short polyline here
	            var point = geometry.pythagoreanChop(
	                this.params.start,this.params.stop,
	                this.getProjection(),this.params.hypotenuse
	            );
	            var angle = geometry.angle(
	                this.params.start,this.params.stop,this.getProjection()
	            );
	            this.originalOptions = {
	                clickable: false,
	                path: [ this.params.start, point ],
	                map: this.map,
	                strokeColor: this.params.strokeColor || "blue",
	                strokeWeight: 7,
	                strokeOpacity: 0.1,
	                geodesic: true
	            };
	            this.polyline = new _g.Polyline(this.originalOptions);
	            if(this.hidden) {
	                this.polyline.setMap(null);
	            }
	            this.end = point;
	            // now add the arrowhead
	            var canvas = $("<div/>",{
	                    "class": "arrowHeadCanvas"
	                }),
	                div = $("<div/>",{
	                    "class": "arrowHead",
	                    css: {
	                        display: (this.hidden) ? "none" : "block"
	                    },
	                    html: canvas
	                }),
	                raphael = Raphael(canvas[0],20,20),
	                pin = raphael
                        .path(_a.Config.markers.shapes.arrowHead)
                        .attr({
                            stroke: "royalblue",
                            "stroke-width": 0,
                            fill: "blue",
                            opacity: 0.2
                        })
                        .scale(6,3)
                        .rotate(angle);
	            // now add the parent div to the map
	            this.getPanes().overlayImage.appendChild(div[0]);
	            this.div = div;
	            this.pin = pin;
	        },
	        draw: function() {
    			var pixels = this.getProjection().fromLatLngToDivPixel(this.end);
    			this.div.css("left",pixels.x-12).css("top",pixels.y-10);
	        },
	        onRemove: function() {
	            this.div.remove();
	            this.polyline.setMap(null); // remove
	        },
	        hover: function() {
	            this.polyline.setOptions({
	               strokeColor: "yellow",
	               strokeOpacity: "1.0"
	            });
	        },
	        fadeOut: function() {
	            this.polyline.setMap(null);
	            this.div.fadeOut(fadeSpeed);
	        },
	        fadeIn: function() {
	            var polyline = this.polyline,
	                map = this.map;
	            this.div.fadeIn(fadeSpeed,function(){
	                polyline.setMap(map);
	            });
	        },
	        unhover: function() {
	            this.polyline.setOptions(this.originalOptions);
	        },
	        highlight: function() {
	            
	        }
	    }
	});
	
	_a.Markers.PlanMarker = function(options) {
		this.options = options;
		this._latlng = options.position;
		this.data = options.data;
		this.setMap(options.map);
	};
	_a.Markers.PlanMarker.prototype = new _g.OverlayView();
	
	jQuery.extend(_a.Markers.PlanMarker.prototype,{
		onAdd: function() {
			var extraClass = this.options["class"];
			var canvas = $("<div/>",{
				"class": "planMarkerCanvas"
			});
			var div = $("<a/>",{
			    href: "#",
				"class": "planMarker "+extraClass
			});
			div.append(canvas);
			this.getPanes().overlayImage.appendChild(div[0]);
			this.div = div;
			this.canvas = canvas;
			if(this.data.media_type == 1) {
				this.addPin();
			}
			else {
				div.addClass("panorama");
			}
			if(this._isHidden === true) {
				this.div.css("display","none");
			}
			if(this._permanent === true) {
			    this.div.addClass("permanent");
			}
			this.listen();
		},
		listen: function() {
			var that = this;
			var waiter = undefined;
			this.div
				.mouseover(function(){
					that.highlight();
					waiter = setTimeout(function(){
						that.options.mouseover();
					},250);
				})
				.mouseout(function(){
					clearTimeout(waiter);
					that.unhighlight();
				})
				.click(function(){
					that.options.click();
					return false;
				});
			// listening for a click is unnecessary, since the plancomponent
			// is constantly finding the closest marker to the mouse
		},
		addPin: function() {
			var rotation = this.data.rotation;
			var raphael = Raphael(this.canvas[0],20,20);
			var pin = raphael.path(_a.Config.markers.shapes.arrow);
			pin.attr({stroke:_a.Config.markers.shapes.arrowColor,
				fill:_a.Config.markers.shapes.arrowColor,"stroke-width":2});
			pin.rotate(rotation,"absolute"); // and rotate as desired
			pin.translate(-1,-1);
			this.arrow = {
				canvas: raphael,
				pin: pin
			};
			this.lastTranslation = 0;
		},
		draw: function() {
			var pixels = this.getProjection().fromLatLngToDivPixel(this._latlng);
			var zoom = (this.map.getZoom()-7) / 2;
			var size = 8+(10*zoom);
			var opacity = (this.map.getZoom()-1)/10;
			this.div
				.css("left",pixels.x).css("top",pixels.y)
				.css("width",size).css("height",size)
				.css("opacity",opacity);
			this.resizePin(zoom);
		},
		resizePin: function(zoom) {
			if(this.arrow === undefined) {
				return;
			}
			var width = this.div.css("width");
			var height = this.div.css("height");
			this.arrow.canvas.setSize(width,height);
			this.arrow.pin.scale(zoom,zoom,0,0);
			this.arrow.pin
				.translate(this.lastTranslation,this.lastTranslation)
				.translate(-zoom,-zoom);
			this.lastTranslation = zoom;
		},
		onRemove: function() {
			this.div.remove();
		},
		getLatLng: function() {
			return this._latlng;
		},
		makePermanent: function() {
		    this._permanent = true;
		},
		isPermanent: function() {
		    return this._permanent;
		},
		highlight: function() {
			this.div.addClass("highlighted");
			if(this.arrow === undefined) { return; }
			this.arrow.pin.attr("fill","white");
		},
		unhighlight: function() {
			this.div.removeClass("highlighted");
			if(this.arrow === undefined) { return; }
			this.arrow.pin.attr("fill",_a.Config.markers.shapes.arrowColor);
		},
		click: function() {
			$(".planMarker").removeClass("clicked");
			this.div.addClass("clicked");
		},
		injectLink: function(link) {
		    this.div.append(link);
		},
		initialHide: function() {
			this._isHidden = true;
		},
		hide: function() {
			this._isHidden = true;
			// since this function might be called before it's added to the map
			if(this.div === undefined) { return; }
			this.div.fadeOut("fast");
		},
		show: function() {
			this._isHidden = false;
			// since this function might be called before it's added to the map
			if(this.div === undefined) { return; }
			this.div.fadeIn("fast");
		},
		isHidden: function() {
			return this._isHidden;
		},
		isPanorama: function() {
			return this.div.hasClass("panorama");
		}
	});
	
	_a.Markers.ShapeMarker = function(options) {
		if(options !== undefined) {
		    this.boot(options);
		}
	};
	_a.Markers.ShapeMarker.prototype = new _g.OverlayView();
	
	jQuery.extend(_a.Markers.ShapeMarker.prototype,{
	    boot: function(options) {
	        this.options = options; // remember this so we can copy the whole marker
    		this._latlng = options.position; // where should it go (a google.maps.LatLng)
    		this.model = options.model; // the actual archmap model
    		this.styles = (options.styles) ? $.extend({},options.styles) : {};
    		// make it a hash if it doesn't exist
    		this.hidden = options.hidden;
    		// what should the color be?
    		if(this.styles.fill === undefined) {
    			this.styles.fill = _a.Config.markers.colors.defaultIcon;
    			if(this.model.key() === _a.provider().key()) {
    				this.styles.fill = "red";
    			}
    		}
    		if(this.styles.arrow !== undefined) {
    		    // lot of repeated code here, could be refactored
    		    if(this.styles.arrow.stop) {
    		        this.arrow = new _a.Markers.Arrow({
        		        start: this._latlng,
        		        stop: this.styles.arrow.stop,
        		        map: options.map,
        		        strokeColor: this.styles.strokeColor,
        		        hypotenuse: 45,
        		        mode: this.styles.arrow.mode,
        		        hidden: this.hidden
        		    });
        		    var that = this;
        		    setTimeout(function(){
        		        var degree = geometry.angle(
        		            that.getLatLng(),that.styles.arrow.stop,that.getProjection()
        		        );
        		        _.each(that.vectors,function(shape){
        		            shape.rotate(degree+180);
        		        });
        		    },500);
    		    }
    		    else if(this.styles.arrow.start) {
    		        this.arrow = new _a.Markers.Arrow({
        		        stop: this._latlng,
        		        start: this.styles.arrow.start,
        		        map: options.map,
        		        strokeColor: this.styles.strokeColor,
        		        hypotenuse: 15,
        		        mode: this.styles.arrow.mode,
        		        hidden: this.hidden
        		    });
        		    var that = this;
        		    setTimeout(function(){
        		        var degree = geometry.angle(
        		            that.styles.arrow.stop,that.getLatLng(),that.getProjection()
        		        );
        		        _.each(that.vectors,function(shape){
        		            shape.rotate(degree+180);
        		        });
        		    },500);
    		    }
    		}
    		this.callbacks = options.callbacks; // what to do when you do something
    		this.setMap(options.map); // is required, no?
	    },
		onAdd: function() {
			var canvas = $("<div/>",{ // for raphael
				"class": "shapeMarkerCanvas"
			});
			var tip = $("<div/>",{ // the pop-up name thing
				"class": "shapeMarkerTip",
				html: this.model.get("name")
			});
			var div = $("<div/>",{ // the marker container
				"class": "shapeMarker",
				css: {
				    display: (this.hidden) ? "none" : "block"
				}
			});
			div.append(canvas).append(tip);
			this.div = div; // remember our dom element
			this.tip = tip; // remember this so we can add an image
			this.canvas = canvas; // where the raphael is
			this.drawShape(canvas);
			this.getPanes().overlayImage.appendChild(div[0]); // append the div to the map
			this.tipText = _a.Config.texts.mapMarkerHoverTipText;
			this.addListeners(canvas);
		},
		draw: function() {
			var pixels = this.getProjection().fromLatLngToDivPixel(this.getLatLng());
			this.div.css("left",pixels.x).css("top",pixels.y);
			this.resizeShape(this.getMap().getZoom());
		},
		addListeners: function(triggerElement) {
			var waiter = undefined;
			var that = this;
			triggerElement // what is the trigger
				// on mouseover, everybody do this!
				.bind("mouseover",function(){
					if(typeof that.callbacks.mouseover === "function") {
						that.callbacks.mouseover(); // user-specified behavior
					}
					that.hover(); // handle this natively
					if(that.options.addToolTip) {
						that.waiter = setTimeout(function(){
							that.model.get("frontispiece",function(frontispiece){
								if(frontispiece.get("id")) {
									var dims = frontispiece.maximizeForTile(100,100);
									if(that.tip.find(".previewImage").length !== 0) {
									    return;
									}
									that.tip.append($("<div/>",{
										"class": "previewImage",
										css: { display: "none" },
										html: $("<img/>",{
											src: frontispiece.get("thumbnail"),
											height: dims.height, width: dims.width
										})
									}));
								}
								if(that.tip.find(".tipText").length !== 0) {
								    return;
								}
								that.tip.append("<div class='tipText'>"+that.tipText+"</em>");
								that.tip.find(".previewImage,.tipText").fadeIn();
							});
						},350);
					}
				})
				// on mouseout, everybody do this!
				.bind("mouseout",function(){
					if(typeof that.callbacks.mouseout === "function") {
						that.callbacks.mouseout(); // user-specified behavior
					}
					that.unhover(); // handle this natively
					if(that.options.addToolTip) {
						// cancel the request for the image in the tooltip,
						// and clera anything that might be leftover
						clearTimeout(that.waiter);
						that.tip.find(".previewImage,.tipText").remove();
					}
				})
				// on click, everybody do THIS!
				.bind("click",function(){
					if(typeof that.callbacks.click === "function") {
						that.callbacks.click(); // user-specified behavior
					}
				});
		},
		drawShape: function(canvas) {
			this.cansize = 25;
			var raphael = Raphael(canvas[0],this.cansize,this.cansize);
			var path = this.styles.path || "M0,8 L0,16 L8,16 L8,24 L16,24 L16,20 L16,16 L24,16"
				+" L24,8 L16,8 L16,4 L16,0 L12,0 L8,0 L8,8 L0,8";
			var fill = this.styles.fill;
			var shadow = raphael.path(path)
			    .attr({
			        "stroke-width":0,
			        fill:"#000",
			        opacity:0.1
			    }).translate(5,5);
			var shape = raphael.path(path)
			    .attr({
			        "stroke-width": 1,
			        "stroke": "white",
			        fill: fill,
			        opacity: this.styles.opacity || 0.9
			    });
			this.vectors = { shape: shape, shadow: shadow };
			this.raphael = raphael; // save the canvas
			this.resizeShape(this.getMap().getZoom());
		},
		resizeShape: function(zoom) {
			var scale = zoom/12;
			var newSize = (this.cansize*scale)+2;
			this.raphael.setSize(newSize,newSize);
			this.div.width(newSize).height(newSize);
			this.vectors.shape.scale(scale,scale,0,0); // zoom
			this.vectors.shadow.scale(scale,scale,0,0); // zoom!
			// now reposition the marker based on context
			var pixels = this.getProjection().fromLatLngToDivPixel(this.getLatLng());
			this.div.css("left",(pixels.x - newSize/2)).css("top",(pixels.y - newSize/2));
		},
		addContextMenu: function() {
			// TODO
		},
		hide: function() {
		    //this.div.css("display","none");
		},
		cloneForNewMap: function(map) {
			var newOptions = $.extend({},this.options); // thanks Jon Resig on StackOverflow!
			newOptions.map = map;
			return new _a.Markers.ShapeMarker(newOptions);
		},
		setTipText: function(multiselected) {
			if(multiselected === true) {
				this.tipText = _a.Config.texts.mapMultiMarkerHoverTipText;
			}
			else {
				this.tipText = _a.Config.texts.mapMarkerHoverTipText;
			}
		},
		hover: function() {
			$(".shapeMarkerTip").css("display","none");
			this.tip.css("display","block");
			if(this.isBig === false || this.isBig === undefined) {
				this.vectors.shape.attr({ "fill":_a.Config.markers.colors.iconHover });
			}
			if(this.arrow) {
			    this.arrow.hover();
			}
		},
		unhover: function(multiselected) {
			this.tip.css("display","none");
			if(this.isBig === false || this.isBig === undefined) {
				this.vectors.shape.attr({ "fill":this.styles.fill });
			}
			if(this.arrow) {
			    this.arrow.unhover();
			}
		},
		fadeIn: function() {
		    this.div.fadeIn(fadeSpeed);
		    if(this.arrow) {
		        this.arrow.fadeIn();
		    }
		},
		fadeOut: function() {
		    if(this.div) {
		        this.div.fadeOut(fadeSpeed);
    		    if(this.arrow) {
    		        this.arrow.fadeOut();
    		    }
		    }
		},
		highlight: function(multiselected) {
		    this.div.css("display","block");
			this.isBig = true;
			this.vectors.shape.attr({ "fill":_a.Config.markers.colors.iconHighlight });
		},
		unhighlight: function(multiselected) {
			this.isBig = false;
			this.vectors.shape.attr({ "fill":this.styles.fill });
		},
		focus: function() {
			this.div.removeClass("blurred");
		},
		blur: function() {
			this.div.addClass("blurred");
		},
		remove: function() {
		    this.setMap(null);
		},
		onRemove: function() {
			this.div.remove(); // takes care of tip
			if(this.arrow) {
			    this.arrow.setMap(null);
			}
		},
		getLatLng: function() {
			return this._latlng;
		}
	});
    
    
	
	// @options.points what points will this map encompass
	// @options.callback gets the key chosen by the map, so you do what ya want
	_a.PopinMap = function(options) {
		this.points = options.points;
		this.callback = options.callback;
		this.setMap(options.map);
	};
	
	_a.PopinMap.prototype = new _g.OverlayView();
	
	jQuery.extend(_a.PopinMap.prototype,{
		onAdd: function() {
		  var holder = $("<div/>",{
				className: "popinMap"
			});
			var div = $("<div/>",{
				className: "popinMap-map"
			}).appendTo(holder);
			this.getPanes().floatPane.appendChild(holder[0]); // append the div to the map
			this.div = div; // remember for removing and drawing
			this.holder = holder;
			this.prepareMap();
		},
		draw: function() {
			var center = this.points[0].getLatLng();
			var pixels = this.getProjection().fromLatLngToDivPixel(center);
			this.holder
				.css("left",( pixels.x - ( this.holder.width() /2 ) ) )
				.css("top",( pixels.y - ( this.holder.height() /2 ) ) );
		},
		onRemove: function() {
			this.holder.remove();
		},
		prepareMap: function(div) {
			var div = this.div;
			var map = new _g.Map(div[0],_a.Config.maps.getGoogleMapOptions());
			//var complex = _a.MapStuff.getPlacesStyleFor(map);
			var complex = _a.MapStuff.getGStil(map,"Localities",true);
			map.mapTypes.set(complex.style.name,complex.style);
			map.setMapTypeId(complex.style.name);
			map.fitBounds(this.buildBoundsAddMarkers(map));
			setTimeout(function(){
			  div.children().css("overflow","visible");
			  _a.ImageLayer.hideGoogleLogo(div);
			},50);
		},
		// dual purpose function (so we only loop markers once)
		buildBoundsAddMarkers: function(map) {
			var bounds = undefined; // funky workaround
			for(var p in this.points) {
				var knob = this.points[p].options.model.key();
				var marker = this.points[p];
				var latlng = marker.getLatLng();
				if(bounds === undefined) {
					bounds = new _g.LatLngBounds(latlng,latlng);
				}
				else {
					bounds.extend(latlng);
				}
				this.addMarkerToMap(marker,map);
			}
			return bounds;
		},
		addMarkerToMap: function(marker,map) {
			var model = marker.options.model;
			var callback = this.callback;
			new _a.Markers.ShapeMarker({ // add a new marker to the map
				map: map,
				model: model,
				position: marker.options.position,
				callbacks: {
					click: function() {
						callback(model.key());
					}
				}
			});
		}
	});
	
	var genericOpacity = 0.6135; // for opacity hack
	
	// options.map (required), options.model (required)
	_a.HistoricalMapOverlay = function(options) {
		this.model = options.model;
		this.visibility = options.visibility || "visible";
		this.map = options.map;
		this.opacity = genericOpacity;
		this.shouldFill = options.shouldFillMap || false;
		this.loadXML();
	};
	
	_a.HistoricalMapOverlay.prototype = {
		loadXML: function() {
			var name = this.model.get("identifier");
			var url = "/media/maps/"+name+"/tilemapresource.xml";
			this.mapTilePath = "media/maps/"+name;
			var that = this;
			$.ajax({
				type: "GET", url: url, dataType: "xml",
				success: function(xml) {
				    that.buildWithXML(xml);
				}
			});
		},
		buildWithXML: function(xml) {
			var box = $(xml).find("BoundingBox"),
			    mapBounds = new _g.LatLngBounds(
				    new _g.LatLng( box.attr("minx"), box.attr("miny") ),
				    new _g.LatLng( box.attr("maxx"), box.attr("maxy") )
			    ),
			    minZoom = parseInt($(xml).find("TileSet:first")
			                .attr("href").match(/\d{1,2}$/),10),
			    maxZoom = parseInt($(xml).find("TileSet:last")
			                .attr("href").match(/\d{1,2}$/),10),
			    path = this.mapTilePath,
			    mapType = new _g.ImageMapType({
				    isPng: true,
				    minZoom: minZoom,
				    maxZoom: maxZoom,
				    tileSize: new _g.Size(256,256),
				    opacity: genericOpacity,
				    getTileUrl: function(tile,zoom) {
					    var ymax = 1 << zoom;
					    var y = ymax - tile.y -1;
					    if((zoom < minZoom) || (zoom > maxZoom)) {
						    return "http://www.maptiler.org/img/none.png";
					    }
					    return "/"+path+"/"+zoom+"/"+tile.x+"/"+y+".png";
				    }
			    });
			// stuff to remember
			mapType.__opacity = this.opacity; // goddamn it google!
			this.mapBounds = mapBounds;
			this.mapType = mapType;
			if(this.visibility !== "hidden") {
			    this.show();
			    if(this.shouldFill === true) {
			        this.fillMap();
			    }
			}
		},
		changeOpacity: function(to) {
		    this.mapType.__opacity = to; /// simple log for future zooming, etc.
		    // super-hack (we added a 'opacitymaptile' class based on the opacity)
		    $("div.opacitymaptile").css("opacity",to);
		},
		fillMap: function() {
		    _a.MapStuff.bestFit(this.map,this.mapBounds);
		    // code here for determining coverage
		    // man this looks like enterprise code
		    /*
		    var div = $(this.map.getDiv()),
		        height = div.height(),
		        width = div.width(),
		        projection = _a.MapStuff.getProjectionFor(this.map),
		        overlayDims = getDivAreaFromLatLngBounds(this.mapBounds,projection),
		        heightPercent = overlayDims.height/height,
		        widthPercent = overlayDims.width/width;
		    if(heightPercent < 0.6 && widthPercent < 0.6) {
		        this.map.setZoom(this.map.getZoom()+1);
		    }
		    */
		},
		show: function() {
			this.map.overlayMapTypes.push(null);
			this.map.overlayMapTypes.setAt("0",this.mapType);
			$("div.opacitymaptile").removeClass("opacitymaptile");
			// for opacity-changing hack
			var that = this;
			setTimeout(function(){
			  var oldOpacity = that.mapType.__opacity;
		    $("div.map_box").find("div").each(function(){
		      if($(this).css("opacity") == genericOpacity) {
		        $(this).addClass("opacitymaptile");
		      }
		    });
			},1000);
			/*
			this.opacityHack = _g.event.addListener(this.map,"tilesloaded",function(){
			    alert("loaded!");
			    var oldOpacity = that.mapType.__opacity;
			    $("div.map_box").find("div").each(function(){
    		        if($(this).css("opacity") == genericOpacity) {
    		          
    		            $(this).addClass("opacitymaptile");
    		        }
    		    });
			});
			*/
			return this;
		},
		hide: function() {
		  _g.event.removeListener(this.opacityHack);
			this.map.overlayMapTypes.setAt("0",null);
			// for opacity-changing hack
			this.mapType.__opacity = genericOpacity;
			return this;
		}
	};
	
	_a.Zooms = {
	    addCustomZooms: function(container,map,small,caller) {
	        container
	            .before(this.getCustomZoomFor(map,"zoomIn",small,caller))
	            .before(this.getCustomZoomFor(map,"zoomOut",small));
	    },
	    getCustomZoomFor: function(map,direction,small,caller) {
	        var buttonName = direction+"ButtonImage"+( (small === true) ? "Small" : "" );
	        return $("<div/>",{
	            "class": "zoom "+direction+((small === true)?" small":""),
	            html: $("<img/>",{
	                src: _a.Config.maps[buttonName]
	            }),
	            click: function() {
	              if(direction === "zoomOut") {
	                map.setZoom(map.getZoom()-1);
	              }
	              else if(!caller) {
	                map.setZoom(map.getZoom()+1);
	              }
	              else {
	                var things = _.map(caller.dataProvider.selection,function(t){
  	                var thing = _a.dataStore.get(t);
  	                return new _g.LatLng(thing.get("lat"),thing.get("lng"));
  	              });
  	              if(things.length > 0) {
  	                map.panTo( (things.length < 2)
    	                ? things[0]
    	                : _.foldr(things,function(bounds,ll){
    	                    return bounds.extend(ll);
    	                  },new _g.LatLngBounds).getCenter()
    	              );
    	            }
  	              map.setZoom(map.getZoom()+1);
	              }
	            }
        	});
	    }
	};
	
	_a.ImageLayer = {
	    ZOOMOFFSET: 8,
	    getImageLayer: function(image,callback,inStereo) {
            var path = "/media/"+image.get("zoomify").replace(/__/g,"/");
            if(inStereo === true) {
                path = path.replace("zoomify","stereo_zoomify");
            }
			var that = this;
			$.ajax({
				url: path+"/ImageProperties.xml",
				dataType: "html",
				success: function(xml) {
				    callback( that._buildImageLayer(image,xml,path) );
				}
			});
        },
        _buildImageLayer: function(image,xml,path) {
			var attrs = $(xml).find("IMAGE_PROPERTIES").prevObject;
			var height = attrs.attr("height"),
			    width = attrs.attr("width"),
			    info = this.calculateZoomifyInfo(height,width),
			    maxZoom = info.tiers.length + 7;
			// now the actual image layer, with the help of all these predefined variables
			var layer = new _g.ImageMapType({
				isPng: false,
				minZoom: _a.ImageLayer.ZOOMOFFSET,
				maxZoom: maxZoom,
				projection: new _a.EuclideanProjection(),
				name: "Flat",
				tileSize: new _g.Size(256,256),
				opacity: 1.0,
				getTileUrl: function(tile,zoom) {
					var center = (1 << zoom)/2;
					var z = zoom - _a.ImageLayer.ZOOMOFFSET,
					    x = (tile.x - center),
					    y = (tile.y - center);
					// if there a real tile to load?
					if( x < 0 || y < 0 || x*256 > info.sizes[z].w || y*256 > info.sizes[z].h ) { // No.
					    return "/media/ui/blank2.png";
					}
    				else { // Yes.
    				    var tileGroup = Math.floor(
    				        ( x + y * info.tiers[z].w + info.tileCountToTier[z] )/ 256);
    					return path+"/TileGroup"+tileGroup+"/"+[z,x,y].join("-")+".jpg";
    				}
				}
			});
			layer.__zoomifyInfo = info; // sneak some contraband into the prototype
			layer.__smallestTile = info.smallest;
			return layer;
        },
        calculateZoomifyInfo: function(height,width) {
            // code adapted from http://trac.openlayers.org/attachment/ticket/1285/zoomify.patch
            var size = {
                    w: width,
                    h: height
                },
                tiers = [],
                sizes = [],
                tileCountToTier = [],
                tiles = {
                    w: Math.ceil(size.w/256),
                    h: Math.ceil(size.h/256)
                };
            tiers.push(tiles);
            sizes.push(size);
            // reverse engineer the zoomify tiling algorithm
            while(size.w > 256 || size.h > 256) {
                size = {
                    w: Math.floor(size.w/2),
                    h: Math.floor(size.h/2)
                };
                tiles = {
                    w: Math.ceil(size.w/256),
                    h: Math.ceil(size.h/256)
                };
                tiers.push(tiles);
                sizes.push(size);
            }
            tiers.reverse();
            sizes.reverse();
            var tierCount = tiers.length,
                smallest = sizes[0];
            tileCountToTier[0] = 0;
            for(var i = 1; i < tierCount; i += 1) {
                tileCountToTier.push( tiers[i-1].w * tiers[i-1].h + tileCountToTier[i-1] );
            }
            return {
                tiers: tiers,
                tileCountToTier: tileCountToTier,
                sizes: sizes,
                smallest: smallest
            };
        },
        buildMapWithLayer: function(div,layer,layerKey) {
          var viewer = new _g.Map(div,{
            center: new _g.LatLng(-.6,.5),
				    navigationControl: false,
				    mapTypeControl: false,
				    disableDefaultUI: true,
				    zoom: 8
          });
          viewer.mapTypes.set(layerKey,layer);
			    viewer.setMapTypeId(layerKey); // set image layer as the real layer
			    return viewer;
        },
        /*
            centers if image is smaller than frame
            otherwise just zooms back to closest border
        */
        fitImage: function(layer,map,div,forceCenter,fudge) {
            var info = layer.__zoomifyInfo,
                bounds = map.getBounds(),
                fudge = (fudge) ? fudge : 0;
            if(bounds === undefined) {
                return;
            }
            var center = map.getCenter(),
                dims = info.sizes[map.getZoom() - _a.ImageLayer.ZOOMOFFSET],
                contain = {
                    h: div.height(),
                    w: div.width()
                },
                proj = new _a.EuclideanProjection(), // should be a static property
                northwest = new _g.LatLng(
                    bounds.getNorthEast().lat(),
                    bounds.getSouthWest().lng()
                ),
                southeast = new _g.LatLng(
                    bounds.getSouthWest().lat(),
                    bounds.getNorthEast().lng()
                ),
                newBounds = new _g.LatLngBounds(),
                point = proj.fromPointToLatLng(new _g.Point(info.sizes[0].w,info.sizes[0].h)),
                latlng = new _g.LatLng(point.lat()/256-.70,point.lng()/256+.70);
            newBounds.extend(new _g.LatLng(0,0));
            newBounds.extend(latlng);
            if(dims === undefined) {
                return;
            }
            // otherwise we're correcting for over-pans
            // now test to find what we need to correct
            var latCorrect = undefined,
                lngCorrect = undefined,
                boundsCenter = newBounds.getCenter();
                
            if(contain.h > dims.h || forceCenter === true) {
                latCorrect = boundsCenter.lat();
            }
            if(contain.w > dims.w || forceCenter === true) {
                lngCorrect = boundsCenter.lng();
            }
            // latitude corrections
            if(latCorrect === undefined) {
                if(southeast.lat() < latlng.lat()) {
                    latCorrect = center.lat() + ( latlng.lat() - southeast.lat() );
                }
                else if(northwest.lat() > 0) {
                    latCorrect = center.lat() + ( -.0005 - northwest.lat() );
                }
            }
            if(lngCorrect === undefined) {
                if(southeast.lng() > latlng.lng()) {
                    lngCorrect = center.lng() - ( southeast.lng() - latlng.lng() );
                }
                else if(northwest.lng() < 0) {
                    lngCorrect = center.lng() - northwest.lng() - fudge;
                }
            }
            // set defaults if nothing was corrected
            if(!latCorrect) {
                latCorrect = center.lat();
            }
            if(!lngCorrect) {
                lngCorrect = center.lng();
            }
            //return;
            map.panTo(new _g.LatLng(latCorrect,lngCorrect));
        },
        swapImageLayer: function(viewer,layer,layerKey) {
            viewer.mapTypes.set(layerKey,layer);
            viewer.setMapTypeId(layerKey);
        },
        hideGoogleLogo: function(mapDiv) {
          setTimeout(function(){ // bye bye Google Maps logo!
				    mapDiv.children("div").find("div:nth-child(2)").find("a").fadeOut();
			    },1000);
        },
        bindImagePan: function(layer,map,div,fudge) {
            _g.event.addListener(map,"dragend",function(){
                try {
                    _a.ImageLayer.fitImage(layer,map,div,false,fudge);
                }
                catch(e) {
                    setTimeout(function(){
                        _a.ImageLayer.fitImage(layer,map,div,false,fudge);
                    },300);
                }
            });
            _g.event.addListener(map,"resize",function(){
                setTimeout(function(){
                    _a.ImageLayer.fitImage(layer,map,div,true,fudge);
                },300);
            });
        },
        bindImageZoom: function(layer,map,div) {
            _g.event.addListener(map,"zoom_changed",function(){
                var zoom = map.getZoom(),
                    reals = layer.__zoomifyInfo.sizes[zoom-_a.ImageLayer.ZOOMOFFSET];
                if(reals && $(window).height() > reals.h) {
                    map.setZoom(zoom);
                }
                setTimeout(function(){
                   _a.ImageLayer.fitImage(layer,map,div);
                },300);
            });
        }
	};
	
	/* thanks internet! (necessary for a flat projection/translation of rectilinear points)*/

	_a.EuclideanProjection = function() {
		var EUCLIDEAN_RANGE = 256;
		this.pixelOrigin_ = new google.maps.Point(EUCLIDEAN_RANGE / 2, EUCLIDEAN_RANGE / 2);
		this.pixelsPerLonDegree_ = EUCLIDEAN_RANGE / 360;
		this.pixelsPerLonRadian_ = EUCLIDEAN_RANGE / (2 * Math.PI);
		this.scaleLat = 1;	// Height
		this.scaleLng = 1;	// Width
		this.offsetLat = 0;	// Height
		this.offsetLng = 0;	// Width
	};
    
	_a.EuclideanProjection.prototype = {
		fromLatLngToPoint: function(latLng, opt_point) {
			var point = opt_point || new google.maps.Point(0, 0);
			var origin = this.pixelOrigin_;
			point.x = (origin.x + (latLng.lng() + this.offsetLng ) * this.scaleLng * this.pixelsPerLonDegree_);
			// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
			// 89.189.  This is about a third of a tile past the edge of the world tile.
			point.y = (origin.y + (-1 * latLng.lat() + this.offsetLat ) * this.scaleLat * this.pixelsPerLonDegree_);
			return point;
		},
		fromPointToLatLng: function(point) {
			var origin = this.pixelOrigin_;
			var lng = (((point.x - origin.x) / this.pixelsPerLonDegree_) / this.scaleLng) - this.offsetLng;
			var lat = ((-1 *( point.y - origin.y) / this.pixelsPerLonDegree_) / this.scaleLat) - this.offsetLat;
			return new _g.LatLng(lat,lng,true);
		}
	};
	
})();