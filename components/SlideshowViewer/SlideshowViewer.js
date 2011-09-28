/*
	Quick, easy way to view a full slideshow
*/

(function(){
	
	var _a = Archmap,
	    $w = $(window);
	
	_a.SlideshowViewer = function() {
		this.speed = 2000;
	};
	
	_a.SlideshowViewer.prototype = new _a.SingletonComponent();
	
	jQuery.extend(_a.SlideshowViewer.prototype,{
		boot: function(slideshow,start_image_id) {
			this.addListeners(); // need to do this b/c we're overriding the default boot
			// make sure you've got a container there
			$("body").append("<div id='SlideshowViewer' class='popover'></div>");
			this.dom = $("div#SlideshowViewer");
			this.dom.css('height',$w.height());
			this.slideshow = _a.dataStore.get(slideshow); // sync
			var that = this;
			_a.IO.getComponentHtml("SlideshowViewer",function(html){
				that.dom.append(html);
				that.render(start_image_id);
			});
		},
		resize: function() {
			this.dom.css('height',$w.height());
			this.recenter(0);
		},
		render: function(start_image_id) {
			// cache some jquery refs
			var pagers = this.dom.find(".pager");
			this.buttons = {
			    last: pagers.first(),
			    play: pagers.slice(1,2),
			    next: pagers.last()
			};
			// setup functions
			this.enable_motion();
			this.enable_close();
			// show the canvas
			this.dom.fadeIn("fast");
			this.slides = this.slideshow.get("slides");//data.slides;
			for(var s in this.slides) {
				// find the center and then center the show
				if(start_image_id === this.slides[s].getImage().get("id")) {
					this.center(parseInt(s,10));
				}
			}
		},
		recenter: function(increment) { // give it an increment (integer)
			this.center(this.currentIndex += increment);
		},
		center: function(index) {
		    var length = this.slides.length;
		    if( index < 0 ) {
		        index = length - 1;
		    }
		    else if( index >= length ) {
		        index = 0;
		        if(this.playing === true) {
				    this.buttons.play.click(); // so it stops
				}
		    }
		    this.current(this.slides[index]);
		    this.currentIndex = index;
		},
		current: function(slide) {
			var img = slide.getImage();
			// get scaling info
			var bigImage = $("<a/>",{
				"class": "fullscreen",
				href: "/"+img.key(),
				rel: img.get("zoomify"),
				html: $("<img/>",{ src: img.get("thumbnail"), css: {"display":"none"} })
			});
			img.centerAndFit(
			    $w.height(), $w.width(),
			    bigImage.find("img"),
			    undefined, true
			);
			this.dom.find("a.more-information").remove().end().append($("<a/>",{
		        "class": "more-information",
		        href: "/"+img.key(),
		        text: "More Information"
		    }))
		    .find(".click-to-zoom").remove()
		    .end()
		    .append($("<h5/>",{
          className: "click-to-zoom",
          text: "Click the image to zoom in"
        }));
			this.dom.find("div#slide_info").empty().text(slide.caption);
			this.dom.find("div#main_slide img").fadeOut("normal",function(){
				$(this).remove();
			});
			this.dom.find("div#main_slide").append(bigImage);
			this.dom.find("div#main_slide img").fadeIn("normal");
		},
		enable_motion: function() {
			var that = this;
			// what happens when you click last
			this.buttons.last.click(function(){
				that.recenter(-1);
			});
			// what happens when you click next
			this.buttons.next.click(function(){
				that.recenter(1);
			});
			// what happens when you click play/pause
			this.playing = false;
			this.player = false;
			this.buttons.play.click(function(){
			    var $this = $(this),
			        img = $this.find("img"),
			        src = img.attr("src"),
			        alt = img.attr("alt");
			    (that.playing === false)
			        ? that.play()
			        : that.pause();
			    // now swap the image (regardless)
			    img.attr("alt",src).attr("src",alt);
			    that.playing = !that.playing;
			});
		},
		play: function() {
			var that = this,
			    move = function() {
			        that.buttons.next.click();
			    };
			move();
			this.player = setInterval(move,this.speed);
		},
		pause: function(finished) {
			clearInterval(this.player);
			// if we've reached the end, queue it up at the front
			if(finished === true) {
				var that = this;
				setTimeout(function(){
					that.restart();
				},this.speed);
			}
		},
		restart: function() {
			clearInterval(this.player); // not sure why I need to cancel it twice
			this.recenter(-(this.slides.length-1));
			this.dom.find("a#prev_slide").css('display','none');
			this.dom.find("a#next_slide").css('display','block');
		},
		enable_close: function() {
			var that = this;
			this.dom.find(".slideshow_close").click(function(){
				that.clean();
				return false;
			});
		},
		clean: function() {
			var that = this;
			this.dom.fadeOut("fast",function(){
				that.dom.remove();
				_a.popOverlay();
				//$("html").trigger("overlayCleaned",this);
			});
		}
	});
	
})();