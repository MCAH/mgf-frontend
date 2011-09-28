/*
	A fairly simple timeline,
	draggable and clickable and all that
*/

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "TimelineComponent",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			this.zoom_level = 2;
    			this.model_count = 0;
    			this.fitted = false;
    			var that = this;
    			// click to select
    			this.sandbox.delegate("li a","click",function(){
    				that.selectModel($(this).attr("href"));
    				return false;
    			});
    			// hover to hover, unhover to unhover
    			this.sandbox.delegate("ul a","mouseover",function(){
    				that.hoverModel($(this).attr("href"));
    			}).delegate("ul a","mouseout",function(){
    				that.unhoverModel($(this).attr("href"));
    			});
    			var that = this;
    			_a.IO.require("dependencies/Raphael",function(){
    				_a.IO.getComponentHtml("TimelineComponent",function(html){
    					that.sandbox.append(html); // add the html
    					that.prepareTheTimeline();
    					that.render();
    					that.addSocialEntity(156); // kings of france
    					that.listen();
    					that.listenForEvents();
    					that.disableTextSelect();
    				});
    			});
    		},
    		finalize: function() {
    			if(this.canBeFinalized()) {
    				this.fit();
    				var that = this;
    				setTimeout(function(){
    			        that.changeTimelineHeight(that.sandbox.height(),false);
    				},1);
    			}
    		},
    		prepareTheTimeline: function() {
    			this.tickmarks = this.sandbox.find("div.tickmarks");
    			this.timeband = this.sandbox.find("div.timeband");
    			this.timespan = this.sandbox.find("div.timespan");
    			this.timespan_handles = this.sandbox.find("div.timespan-handle");
    			var i = 0;
    			while(i <= 2000) {
    				this.timeband.append("<span class='year' style='left:"+this.zoom(i)+"px;'>"+i+"</span>");
    				var j = i + 25;
    				this.timeband.append("<span class='small' style='left:"+this.zoom(j)+"px;'>"+j+"</span>");
    				i += 50;
    			}
    			this.sandbox.append($("<div/>",{
    			  className: "directions",
    			  text: "Click and drag to see more"
    			}));
    		},
    		fit: function() {
    			if(this.fitted === false) {
    				// find the earliest date on the timeline
    				var first = this.sandbox.find("li:first").find("a").attr("rel");
    				// find the latest date on the timeline
    				var last = this.sandbox.find("li:last").find("a").attr("rel");
    				var zoom = Math.floor(this.sandbox.width()/(last-first))-2;
    				this.fitted = true;
    				//this.zoomChange(zoom); // this appears to be unused....
    				// position the timeline accordingly
    				this.timespan.width(this.zoom(last-first)).css("left",this.zoom(first)+"px");
    				this.sandbox.find("ul").parent().css("left",-(this.zoom(first)-100)+"px");
    			}
    		},
    		fitVisibles: function() {

    		},
    		recenter: function() {

    		},
    		simpleRerender: function() {
    			this.sandbox.find("ul").empty();
    			this.model_count = 0;
    			this.zoom_level = 2;
    			this.render();
    		},
    		unrender: function() {
    			this.sandbox.find("ul").empty();
    			this.model_count = 0;
    			this.zoom_level = 2;
    			this.fitted = false;
    		},
    		resize: function() {
    		},
    		zoom: function(pixels) {
    			return parseInt(pixels,10)*this.zoom_level;
    		},
    		unzoom: function(pixels) {
    			return Math.round(parseInt(pixels,10)/this.zoom_level);
    		},
    		zoomChange: function(change,x,y) {
    			this.zoom_level += change;
    			this.simpleRerender();
    			var that = this;
    			this.timeband.find("span").each(function(){
    				var date = that.zoom($(this).text());
    				$(this).css('left',date+"px");
    			});
    			this.sandbox.find(".timeline-person").remove();
    			this.addSocialEntity(156);
    			this.zoomHeight(this.sandbox.height());
    		},
    		zoomHeight: function(height) {
    			//var model_height = Math.floor((height*4)/this.model_count)-1;
    			//this.sandbox.find("li a").css('height',model_height+"px");
    			this.sandbox.find("li a").css("height","17px");
    		},
    		listenForEvents: function() {

    		},
    		listen: function() {
    			var that = this;
    			this.testStartDate = 1000;
    			// test code for zooming in
    			$("html").bind("timelineHeightTo",function(e,height){
    				that.changeTimelineHeight(height,true);
    			});
    			this.sandbox.dblclick(function(e){
    				//that.changeTimelineHeight(300);
    				/*
    				that.testInterval = setInterval(function(){
    					that.setDateRangeWithYears(that.testStartDate,that.testStartDate+50);
    					that.testStartDate += 3;
    					if(that.testStartDate > 1300) {
    						clearInterval(that.testInterval);
    					}
    				},75);
    				*/
    				//that.zoomChange(1,e.pageX,e.pageY);
    			});
    			// code for changing height of timeline
    			this.being_heightened = false;
    			this.being_dragged = false;
    			// start heightening
    			this.timeband.mousedown(function(e){
    				that.being_heightened = true;
    				that.being_dragged = false; // turn that off!
    				that.inc = e.pageY - that.timeband.offset().top;
    			});
    			this.sandbox.mousedown(function(e){
    				if(that.being_heightened === false && that.being_dragged === false) {
    					that.being_dragged = true;
    					that.dragstart = e;
    					that.starttop = parseInt(that.sandbox.find("ul").css("margin-top"),10);
    					that.startleft = parseInt(that.sandbox.children("div").css("left"),10);
    				}
    			});
    			// timespan dragging
    			this.shifting = false;
    			this.starting_position = false;
    			this.timespan.mousedown(function(e){
    				that.shifting = e.pageX;
    				that.starting_position = parseInt(that.timespan.css("left"),10);
    			});
    			// timespan controlling
    			this.starting_change = false;
    			this.ending_change = false;
    			this.starting_width = false;
    			// activate change in timespan
    			this.timespan_handles.mousedown(function(e){
    				that.starting_width = that.timespan.width();
    				if($(this).hasClass("left")) { // start date changing
    					that.starting_change = e.pageX;
    				}
    				else { // end date changing
    					that.ending_change = e.pageX;
    				}
    			});
    			// dragging
    			$("html").mousemove(function(e){
    				if(that.starting_change || that.ending_change) {
    					if(that.starting_change) { // the user is dragging the start of the scrubber
    						that.scrubTimebar(e.pageX-that.starting_change,true,false);
    					}
    					else { // the user is dragging the end of the scrubber
    						that.scrubTimebar(e.pageX-that.ending_change,false,false);
    					}
    				}
    				else if(that.shifting) { // the user is shifting the scrubber
    					that.scrubTimebar(e.pageX-that.shifting,true,true);
    				}
    				else if(that.being_heightened) {
    					var new_height = ($(window).height()-e.pageY)+that.inc;
    					that.changeTimelineHeight(new_height);
    				}
    				else if(that.being_dragged) {
    					that.dragTimelineWithinBox(
    						that.startleft - ( that.dragstart.pageX - e.pageX ), // x dimension
    						that.starttop - ( that.dragstart.pageY - e.pageY ) // y dimension
    					);
    				}
    			});
    			// end dragging or heightening
    			$("html").mouseup(function(){
    				that.being_heightened = false;
    				that.being_dragged = false;
    				that.dragstart = undefined;
    				that.shifting = false;
    				that.starting_change = false;
    				that.ending_change = false;
    			});
    		},
    		changeTimelineHeight: function(newHeight,animate) {
    			if(newHeight < $(window).height()/1.5) {
    				if(animate) {
    					this.sandbox.stop().animate({height:newHeight},"slow");
    				}
    				else {
    					this.sandbox.height(newHeight);
    				}
    				this.sandbox.find(".timeline-person").height(newHeight);
    				this.zoomHeight(this.sandbox.height());
    			}
    		},
    		dragTimelineWithinBox: function(leftDelta,topDelta) {
    			if(topDelta <= 15) {
    				this.sandbox.find("ul").css("marginTop",topDelta);
    			}
    			this.sandbox.children("div").css("left",leftDelta);
    		},
    		scrubTimebar: function(delta,fromLeft,scrub) {
    			var newWidth = this.timespan.width();
    			if(scrub !== true) { // if not shifting, we change the width
    				if(fromLeft === true) {
    					var newWidth = this.starting_width - delta;
    				}
    				else { // readjusting from the right end
    					var newWidth = this.starting_width + delta;
    					this.setDateRangeWithPixels(
    						this.starting_position,newWidth+this.starting_position
    					);
    				}
    			}
    			// change the starting position
    			if(fromLeft === true) {
    				var newLeft = this.starting_position + delta;
    				this.setDateRangeWithPixels(newLeft,newWidth+newLeft);
    			}
    		},
    		setDateRangeWithPixels: function(begin,end) {
    			this.timespan.css("left",begin).css("width",(end-begin)); // set timebar with raw pixels
    			this.setDateRange(this.unzoom(begin),this.unzoom(end)); // convert pixels to actual years
    		},
    		setDateRangeWithYears: function(begin,end) {
    			// convert real years to pixels
    			this.timespan.css("left",this.zoom(begin)).css("width",this.zoom(end-begin));
    			this.setDateRange(begin,end); // then set the years directly
    		},
    		setDateRange: function(begin,end) {
    			this.blurFilter(function(model){
    				if(model.get("beg_year") > begin && model.get("beg_year") < end) {
    					return true;
    				}
    				else { return false; }
    			});
    		},
    		disableTextSelect: function() {
    			var that = this;
    			_a.IO.require("dependencies/DisableTextSelect",function(){
    				that.sandbox.disableTextSelect();
    			});
    		},
    		renderElement: function(model,color,shape) {
    			var start = parseInt(model.get("beg_year"),10);
    			if(model.getType() == "building") {
    				start -= 11;
    			}
    			var span = 175; // default year length on timeline if no end-date exists
    			if(model.get("end_year") != 0 && model.get("end_year") != "") {
    				span = parseInt(model.get("end_year"),10) - start;
    			}
    			var name = model.get("name").split(",");
    			var element = $("<li/>",{
    				rel: model.key(),
    				"class": model.getType(),
    				html: $("<a/>",{
    					rel: start,
    					href: model.key(),
    					//title: model.get("name").replace(/\'/g,'&rsquo;'),
    					css: {
    						"margin-left": this.zoom(start)+"px",
    						"width": 300 //this.zoom(span)+"px"
    					},
    					html: "<span>"+name[0]+" <em>"+name[1]+"</em></span><div class='icon'></div>"
    				})
    			});
    			// code for the icon
    			var canvas = Raphael(element.find("div.icon")[0],25,25);
    			if(shape == "" || shape == undefined) {
    				shape = "M0,8 L0,16 L8,16 L8,24 L16,24 L16,20 L16,16 L24,16"
    					+" L24,8 L16,8 L16,4 L16,0 L12,0 L8,0 L8,8 L0,8";
    			}
    			var mark = canvas.path(shape).attr({
    				"stroke-width":1, "stroke":"white", "fill":color
    			});
    			mark.scale(0.5,0.5,0,0);
    			return element;
    		},
    		renderModel: function(model,color,shape) {
    			var that = this;
    			// for icons on the timeline
    			color = color || "rgb(137,122,196)";
    			shape = shape || "";
    			if(model.get("color")) { color = model.get("color"); }
    			if(model.get("icon_shape")) { shape = model.get("icon_shape"); }
    			// code for determining whether we should actually place something
    			if(model.isIterable()) {
    				this.preventFinalize();
    				model.iterateMembers(function(i,member){
    					that.renderModel(member,color,shape);
    				},function(){
    					that.enableFinalize().finalize();
    				});
    				if(model.isProvider()) { return; } // exit
    			}
    			// code for placing
    			var placed = false;
    			var time_plottable = false;
    			if(model.get("beg_year")) { time_plottable = true; }
    			// self-sorting each loop, seems to work quickly
    			if(time_plottable) {
    				var element = that.renderElement(model,color,shape);
    				element.data("model",model); // bind a model for easy access-- shitty idea?
    				this.sandbox.find("li").each(function(){
    				//this.elements.each(function(){
    				    var $this = $(this),
    					    start = parseInt($this.find("a").attr("rel"),10);
    					if(!placed && start > parseInt(model.get("beg_year"),10)) {
    						placed = true;
    						$this.before(element);
    					}
    				});
    				if(!placed) {
    					this.sandbox.find("ul").append(element);
    					//this.elements.append(element);
    				}
    				this.model_count += 1;
    			}
    		},
    		highlightModel: function(key,caller) {
    			this.sandbox.find("ul").stop().parent().stop(); /* stop animation if it's animating */
    			if(this.getModel(key).get("beg_year")) {
    				var element = this.locate(key);
    				element.addClass("selected");
    				this.changeTimelineHeight(this.sandbox.find("ul").height()+65,true);

    				// TODO code for making the timeline itself taller
    				if(caller === this) { // I called it and now it's highlighted!
    					// not sure there's anything special to do though
    				}
    				else {
    					var left = this.zoom(element.find("a").attr("rel"));
    					var top = element.index()*(element.height()+1);
    					var offset = this.sandbox.width()/2;
    					var offset_height = Math.floor(this.sandbox.height()/2.5);
    					this.sandbox.find("ul")
    						//.animate({marginTop:-(top)+offset_height},"slow")
    						.parent().animate({left:(-left)+offset},"slow");
    					var clone = element.clone();
    					element.remove();
    					clone.addClass("clone");
    					this.sandbox.find("ul").prepend(clone);
    				}
    			}
    		},
    		unhighlightModel: function(key) {
    			this.locate(key).removeClass("selected").removeClass("hovering");
    			this.changeTimelineHeight(this.sandbox.find("ul").height()+55,true);
    		},
    		hoverOnModel: function(key) {
    			this.locate(key).addClass("hovering");
    		},
    		hoverOffModel: function(key) {
    			this.sandbox.find("li").removeClass("hovering");
    		},
    		focusModel: function(key) {
    			this.locate(key).removeClass("blurred");
    		},
    		blurModel: function(key) {
    			this.locate(key).addClass("blurred");
    		},
    		locate: function(key) {
    			return this.sandbox.find("a[href='"+key+"']").parent();
    		},
    		addSocialEntity: function(which) {
    			// adding the kings of france to the timeline
    			var that = this;
    			_a.dataStore.get("socialEntity/"+which,function(model){
    				model.iterateMembers(function(i,person){
    					var beg = that.zoom(person.get("beg_year")),
    					    end = that.zoom(person.get("end_year")),
    					    name = person.get("name"),
    					    key = person.key();
    					that.sandbox.find("#timeline").append($("<div/>",{
    						"class": "timeline-person",
    						css: {
    							left: beg,
    							width: (end-beg-1)
    						},
    						html: $("<a/>",{
    							href: key, text: name
    						})
    					}));
    				},function(){
    					$("div.timeline-person").height(that.sandbox.height());
    				});
    			});
    		}
	    }
	});
	
})();