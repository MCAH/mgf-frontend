(function(){
	
	var _a = Archmap;
	
	
	var Turtle = function () {
	    this.start();
	};
	
	Turtle.prototype = {
		start: function() {
			this.points = [];
			this.rotation = 0.0;
			this.DEG2RAD = (3.14159265 / 180);
			this.cos = 0.0;
			this.sin = 0.0;
			this.updateTrigs();
		},
		updateTrigs: function() {
			this.cos = Math.cos(this.DEG2RAD * this.rotation);
			this.sin = Math.sin(this.DEG2RAD * this.rotation);		
		},
		dir: function(degs) {
			this.rotation = degs;
			this.updateTrigs();
		},
		turnl: function(degs) {
			this.rotation += degs;
			this.updateTrigs();
		},
		turnr: function(degs) {
			this.rotation -= degs;
			this.updateTrigs();
		},
		mov: function(xx, yy) {
			this.points.push({x:999999, y:999999});
			this.points.push({x:xx, y:yy});
		},
		fwd: function(l) {
			var xx = this.points[this.points.length-1].x + l*this.cos;
			var yy = this.points[this.points.length-1].y + l*this.sin;
			this.points.push({x:xx, y:yy});
		},
		arcl: function(degs, radius, segs) {
			var dtheta = degs/segs;
			//trace("dtheta=" + dtheta);
			var opp = radius * Math.sin(this.DEG2RAD * dtheta);
			var adj = radius - (radius * Math.cos(this.DEG2RAD * dtheta));
			
			var span = Math.sqrt(opp*opp + adj*adj);
			
			
			this.turnl(dtheta/2);
			for (n=0; n<segs; n++) {
				this.fwd(span);
				if (n != (segs-1)) { this.turnl(dtheta); }
				
			}
			this.turnl(dtheta/2);	
		},
		arcr: function(degs, radius, segs) {
			var dtheta = degs/segs;
			
			//trace("dtheta=" + dtheta);
			var opp = radius * Math.sin(this.DEG2RAD * dtheta);
			var adj = radius - (radius * Math.cos(this.DEG2RAD * dtheta));
			
			var span = Math.sqrt(opp*opp + adj*adj);
			
			this.turnr(dtheta/2);
			for (n=0; n<segs; n++) {
				this.fwd(span);
				if (n != (segs-1)) { this.turnr(dtheta); }
				
			}
			this.turnr(dtheta/2);
		},
		toSVG: function() {
			var svgString = "";
			for(i in this.points) {
				if (this.points[i].x==999999) {
					i++;
					svgString += " M " + this.points[i].x + " " + this.points[i].y;
				} else {
					svgString += " L " + this.points[i].x + " " + this.points[i].y;
				}
			}
			return svgString;
		}
	};
	
	_a.newComponent({
	    name: "ParametricComponent",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			var that = this;
    			this.scale = 4; // initial scale
    			_a.IO.getComponentHtml("ParametricComponent",function(html){
    				that.sandbox.append(html);
    				that.canvasHolder = that.sandbox.find(".parametric_canvas");
    				_a.IO.require("dependencies/Raphael",function(){ // require the javascript
    				    that.render();
    				});
    			});
    		},
    		renderModel: function(model) {
    			var that = this;
    			this.building = model;
    			model.getBuildingModel(function(buildingModel){
    				that.buildingModel = buildingModel;
    				that.buildCanvas();
    			});
    			setTimeout(function(){
    			    if(that.isBlank()) {
    			        that.sandbox.remove();
    			    }
    			},1000);
    		},
    		buildCanvas: function(height,width) {
    		    // reset height and width, if specified
    		    if(height !== undefined && width !== undefined) {
    		        this.sandbox.height(height).width(width);
    		        this.dims = {
    		            height: height,
    		            width: width
    		        };
    		    }
    		    else {
    		        this.dims = {
        			    height: this.sandbox.height(),
        			    width: this.sandbox.width()
        			};
    		    }
    		    // now try to build the canvas if we can
    		    if(this.buildingModel && this.dims.height !== 0 && this.dims.width !== 0) {
    		        var parametric = this.sandbox.find(".parametric_canvas");
    		        parametric.empty();
    		        this.raphael = Raphael(
    		            parametric[0], this.dims.width, this.dims.height
    		        );
    		        this.draw();
    		    }
    		    else {
    		        clearTimeout(this.tryer);
    		        var that = this;
    		        this.tryer = setTimeout(function(){
    		            that.buildCanvas(height,width);
    		        },200);
    		    }
    		},
    		resize: function(height,width) {
    		    this.buildCanvas(height,width);
    		},
    		isBlank: function() {
    		    // no paths means nothing was drawn
    		    return (this.sandbox.find("path").length === 0);
    		},
    		centerAndFit: function(height,width) { // resize alias
    		    this.resize(height,width);
    		},
    		maximizeForTile: function(height,width) {
    		    var thisWidth = 500, thisHeight = 700,
    		        ratioElement = height/width,
    		        ratioImage = thisHeight/thisWidth;
    		    // now do the proper logic
    			if(ratioImage > ratioElement) {
    				return { height: height, width: thisWidth * (height/thisHeight) };
    			}
    			else {
    				return { width: width, height: thisHeight * (width/thisWidth) };
    			}
    		},
    		maxHeight: function() {
    		    if(this.buildingModel) {
    		        return this.buildingModel.maxHeight();
    		    }
    		    else {
    		        _a.log("nope");
    		    }
    		    return 0;
    		},
    		scaleTo: function(scale) {
    		    this.scale = scale;
    		    this.buildCanvas(); // push a draw request onto the queue
    		},
    		draw: function() {
    		    var buildingModel = this.buildingModel;
    			var scale = this.scale; // pixels per meter
    			var w 	= buildingModel.getDim("nave","main","opening")  * scale;
    			var h 	= buildingModel.getDim("nave","main","apex") 	 * scale;
    			var spr = buildingModel.getDim("nave","main","springer") * scale;

    			if(w && h && spr) {

    			    var div_cenX = this.dims.width/2;
        			var div_hgt = this.dims.height;
        			var floorPosY = div_hgt - this.dims.height*.15;
        			var cl = h-spr;
        			var w2 = w/2;
        			var radius = (2* (cl*cl + w2*w2)) / w;
        			var ang = Math.atan(cl/(radius-w2)) * 360/3.14159265;

        			dwg = this.raphael.path("M -" +(w2*3.95)+ " 0 L "+(w2*3.95)+ " 0" );
        			dwg.translate( div_cenX, floorPosY);

        			var myTurtle = new Turtle();
        			myTurtle.mov(-w2, 0);
        			myTurtle.dir(270);
        			myTurtle.fwd(spr);
        			myTurtle.arcl(ang, radius/2, 7);	
        			myTurtle.mov(w2, 0);
        			myTurtle.dir(270);
        			myTurtle.fwd(spr);
        			myTurtle.arcr(ang, radius/2, 7);	
        			dwg = this.raphael.path(myTurtle.toSVG());
        			dwg.translate( div_cenX, floorPosY);
        			dwg.attr({"stroke-width":1,"opacity":0.8});

        			var aisle_w   = buildingModel.getDim("nave","aisle","opening")  * scale;
        			var aisle_h   = buildingModel.getDim("nave","aisle","apex") 	* scale;
        			var aisle_spr = buildingModel.getDim("nave","aisle","springer") * scale;
        			var aisle_cl  = aisle_h-aisle_spr;
        			var aisle_w2  = aisle_w/2;
        			var aisle_radius = (2* (aisle_cl*aisle_cl + aisle_w2*aisle_w2)) / aisle_w;
        			var aisle_ang = Math.atan(aisle_cl/(aisle_radius-aisle_w2)) * 360/3.14159265;

        			try {
        			// Aisle 1
            			myTurtle = new Turtle();
            			myTurtle.mov(-aisle_w2, 0);
            			myTurtle.dir(270);
            			myTurtle.fwd(aisle_spr);
            			myTurtle.arcl(aisle_ang, aisle_radius/2, 7);	
            			myTurtle.mov(aisle_w2, 0);
            			myTurtle.dir(270);
            			myTurtle.fwd(aisle_spr);
            			myTurtle.arcr(aisle_ang, aisle_radius/2, 7);	
            			dwg = this.raphael.path(myTurtle.toSVG());
            			dwg.translate( div_cenX-(w2*1.3)-aisle_w2, floorPosY);
            			dwg.attr({"stroke-width":1,"opacity":0.8});
    		        }
    		        catch(e) {
    		            _a.log(e);
    		        }
    		        
    		        
    		       	if (buildingModel.getDim("nave","aisle2","apex") > 0) {
    		       
	        			var aisle2_w   = buildingModel.getDim("nave","aisle2","opening")  * scale;
	        			var aisle2_h   = buildingModel.getDim("nave","aisle2","apex") 	* scale;
	        			var aisle2_spr = buildingModel.getDim("nave","aisle2","springer") * scale;
	        			var aisle2_cl  = aisle2_h-aisle2_spr;
	        			var aisle2_w2  = aisle2_w/2;
	        			var aisle2_radius = (2* (aisle2_cl*aisle2_cl + aisle2_w2*aisle2_w2)) / aisle2_w;
	        			var aisle2_ang = Math.atan(aisle2_cl/(aisle2_radius-aisle2_w2)) * 360/3.14159265;
	
	        			try {
	        			// Aisle 1
	            			myTurtle = new Turtle();
	            			myTurtle.mov(-aisle2_w2, 0);
	            			myTurtle.dir(270);
	            			myTurtle.fwd(aisle2_spr);
	            			myTurtle.arcl(aisle2_ang, aisle2_radius/2, 7);	
	            			myTurtle.mov(aisle2_w2, 0);
	            			myTurtle.dir(270);
	            			myTurtle.fwd(aisle2_spr);
	            			myTurtle.arcr(aisle2_ang, aisle2_radius/2, 7);	
	            			dwg = this.raphael.path(myTurtle.toSVG());
	            			dwg.translate( div_cenX-(w2*1.3)-(aisle_w*1.3)-aisle2_w2, floorPosY);
	            			dwg.attr({"stroke-width":1,"opacity":0.8});
	    		        }
	    		        catch(e) {
	    		            _a.log(e);
	    		        }
	  					
					}

    		        
    		        
    		        
    		        

    		        dwg = this.raphael.path("M 0 0 L 0 -" + h);
        			dwg.translate( div_cenX+w, floorPosY);
        			dwg.attr({"stroke-width":1,"opacity":0.3});

        			dwg = this.raphael.path("M 10 0 L "+(w+10)+" 0 ");
        			dwg.translate( div_cenX, (floorPosY-h-1));
        			dwg.attr({"stroke-width":1,"opacity":0.3});

        			var t = this.raphael.text(50, 50, buildingModel.getDim("nave","main","apex"));
    				t.rotate(-90);
    				t.translate( div_cenX+(w2), (floorPosY-(h)));
    				t.attr({"fill":"red", "opacity":0.5});
    			}
    		}
	    }
	});
	
})();