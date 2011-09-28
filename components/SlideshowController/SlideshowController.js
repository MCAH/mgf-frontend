/*
	Component to allow high-level editing of default slideshows
*/

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "SlideshowController",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			this.dom = "#SlideshowController";
    			$(this.dom).append(
    				"<div id='SlideshowController-inner'>"
    				+"<button id='open'>Build the Default Slideshow</button></div>"
    			);
    			$("div.SlideCarousel").after(
    				"<div id='CanonicalSlideshow'>"
    				+"<ul class='clear'></ul></div>");
    			var that = this; // this require could be moved to button click event
    			_a.IO.require("dependencies/DragDropSort",function(){
    				that.listen();
    				that.render();
    			});
    		},
    		renderModel: function(model) {
    		    if(model.isOfType("Building")) {
    		        var that = this;
    		        model.get("canonicalSlideshow",function(slideshow){
    		            that.renderModel(slideshow);
    		        });
    		    }
    		    else if(model.isOfType("Slideshow")) {
    		        //$("div#CanonicalSlideshow ul").empty();
    		        this.slideshow_object = model;
    		        this.slideshow_id = model.get("id");
    		        var that = this;
    		        model.get("slides",function(slides){
    		            $.each(slides,function(i,slide){
    		                that.add(slide.getImage(),slide.get("benchmark"));
    		            });
    		        });
    		    }
    		},
    		listen: function() {
    			// button enables everything
    			var that = this;
    			this.has_been_opened = false;
    			$(this.dom).find("button#open").click(function(){
    				if(this.has_been_opened) {
    					$(that.dom).find("div#while_open").fadeIn();
    				}
    				else {
    					this.has_been_opened = true; // so this won't happen again
    					$(this).parent().append("<div id='while_open'>"
    						+"<em>Drag images onto the grey bar...</em>"
    						+"<button id='save'>Save the Slideshow</button>"
    						+"<button id='cancel'>Cancel the Current Edit</button>"
    						+"<button id='close'>Close the Slide tray</button></div>");
    					that.makeImagesDraggable();
    					that.makeTrayDroppable();
    				}
    				// no matter what, do this stuff
    				$(this).fadeOut();
    				$("div#CanonicalSlideshow").slideDown();
    			});
    			// listen for the save event
    			$(this.dom).find("button#save").live("click",function(){
    				that.save();
    			});
    			$(this.dom).find("button#cancel").live("click",function(){
    				that.cancel();
    			});
    			$(this.dom).find("button#close").live("click",function(){
    				$("div#CanonicalSlideshow").slideUp();
    				$("button#open").fadeIn();
    				$("div#while_open").fadeOut();
    			});
    			$("div#CanonicalSlideshow a.remove").live("click",function(){
    				$(this).parent().remove();
    				return false;
    			});
    			$("div#CanonicalSlideshow input.benchmark").live("click",function(){
    				if($(this).is(":checked")) {
    					$(this).parent().addClass("benchmark");
    				}
    				else {
    					$(this).parent().removeClass("benchmark");
    				}
    			});
    		},
    		makeImagesDraggable: function() {
    			// make sure all biggable images are also draggable
    			$("body").find("a.biggable img").live("mouseover",function(){
    				if($(this).parent().hasClass("immovable") == false) {
    					$(this).draggable({
    						containment:'document', helper:'clone',
    						opacity:0.8,zIndex:10000, appendTo:"body"
    					});
    				}
    			});
    		},
    		makeTrayDroppable: function() {
    			var that = this;
    			$("div#CanonicalSlideshow").droppable({
    				hoverClass: "hovering",
    				accept: 'a.biggable img',
    				drop: function(ev,ui){ that.drop(ui.draggable); }	
    			});
    			$("div#CanonicalSlideshow ul").sortable({});
    			$("div#CanonicalSlideshow ul").disableSelection();
    		},
    		drop: function($item) {
    			var id = $item.parent().attr("href").match(/\d{4,7}/)[0];
    			var image = _a.dataStore.get("image/"+id);
    			if(image) {
    				this.add(image);
    			}
    		},
    		add: function(image,benchmark) {
    			var id = image.get("id");
    			if($("div#CanonicalSlideshow").find("li[rel='"+id+"']").length === 0) {
    				$("div#CanonicalSlideshow ul").append(
    					"<li rel='"+id+"'><a href='/image/"+id+"' class='biggable immovable'>"
    					+"<img src='"+image.get("thumbnail")+"'/></a>"
    					+"<input type='checkbox' class='benchmark'/>"
    					+"<textarea class='caption'>"+image.get("caption")+"</textarea>"
    					+"<a class='remove' href='#remove'>Remove</a></li>");
    				if(benchmark == 1) {
    					$("li[rel='"+id+"']").addClass("benchmark")
    					    .find("input.benchmark").attr("checked",true);
    				}
    			}
    			else {
    				//alert("Already in the slideshow!");
    			}
    		},
    		save: function() { // save it to the database
    			var image_infos = [];
    			$("div#CanonicalSlideshow li").each(function(){
    				var benchmarked = 0;
    				if($(this).find("input.benchmark").is(":checked")) {
    					benchmarked = 1;
    				}
    				var record = {
    					"id": $(this).attr("rel"),
    					"caption": $(this).find("textarea.caption").attr("value"),
    					"benchmark": benchmarked
    				};
    				image_infos.push(record);
    			});
    			image_infos = { "data":image_infos }; // nest it once
    			var data = { "json_data":JSON.stringify(image_infos) }; // nest it for jQuery
    			var that = this;
    			if(image_infos != "") {
    				_a.IO.post("slideshow/"+this.slideshow_id,data,function(data,slideshow){
    					that.render(data.archmap_says.response,slideshow); // re-render
    				});
    			}
    			else {
    				alert("There must be slides in the slideshow!");
    			}
    		},
    		cancel: function() { // revert to the last saved slideshow
    			var that = this;
    			_a.get("slideshow/"+this.slideshow_id,function(data,slideshow){
    				that.render(data.archmap_says.response,slideshow); // re-render
    			},"json",true); // true means I want a non-cached version
    		}
	    }
	});
	
})();