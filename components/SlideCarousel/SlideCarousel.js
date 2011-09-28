/*
	Nice little show of images
	from around the building
*/

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "SlideCarousel",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			var that = this;
    			_a.IO.getComponentHtml("SlideCarousel",function(html){
    				that.sandbox.append(html);
    				that.defineHandles().listen().render();
    				var popLink = _a.Elements.UIStuff.helpPopoverLink({
    					html: "In the slideshow above, you can follow a pre-determined visit from west to east &mdash; exterior to interior. Click any image to enlarge it; once enlarged, use the back-and-forth arrows to move backward and forward.",
    					highlight: this.sandbox
    				});
    				popLink.css("top",135);
    				that.sandbox.append(popLink);
    			});
    		},
    		defineHandles: function() {
    			this.ul = this.sandbox.find("ul");
    			this.ul.addClass("slideshow-holder");
    			return this; // chaining
    		},
    		listen: function() {
    			var that = this;
    			this.sandbox.find("strong.last").click(function(){
    				var current_left = parseInt($(this).parent().css("margin-left"),10);
    				if(current_left < 0 && !$(this).parent().is(":animated")) {
    					$(this).parent().animate({"margin-left":(current_left + 200)+"px"});
    				}
    			});
    			this.sandbox.find("strong.next").click(function(){
    				var width = parseInt($(this).parent().css('width'),10);
    				var current_left = parseInt($(this).parent().css("margin-left"),10);
    				if(current_left > 0-(width-300+current_left) && !$(this).parent().is(":animated")) {
    					$(this).parent().animate({"margin-left":(current_left - 200)+"px"});
    				}
    			});
    			return this; // chaining
    		},
    		renderModel: function(model) {
    			if(model instanceof _a.Building) {
    				var that = this;
    				model.get("canonicalSlideshow",function(slideshow){
    					that.ul.attr("rel",slideshow.key());
    					slideshow.get("slides",function(slides){
    						$.each(slides,function(i,slide){
    							that.renderModel(slide);
    						});
    					});
    				});
    				return;
    			}
    			if(model.get("benchmark") == 1) {
    				var caption = model.get("caption").replace("'","&rsquo;");
    				var item = $("<li/>",{
    					html: $("<a/>",{
    						title: caption,
    						href: "/"+model.getImage().key(),
    						"class": "biggable",
    						html: $("<img/>",{
    							src: model.getImage().get("thumbnail")
    						})
    					})
    				});
    				model.getImage().centerAndFit(100,100,item.find("img"));
    				this.ul.append(item);
    			}
    		}
	    }
	});
	
})();