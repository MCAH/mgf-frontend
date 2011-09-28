(function(){
    
    var _a = Archmap,
        sandbox, // defined later
        stage, // defined later
        closeButton, // defined later
        resizer, // callback for resizing if image is open
        $w = $(window),
        // generic overlay object, which has a "close" method
        overlay = {
            clean: function() {
                resizer = false;
                sandbox.fadeOut("fast",function(){
                    stage.empty();
                    _a.popOverlay();
                });
            }
        },
        keyMatch = function(string) {
            return string.match(/[a-z]+\/\d{4,7}/)[0];
        },
        // interacting with thumbnails
        bindImages = function() {
            // selectors
            var biggable = "a.biggable",
                html = $("html");
            // binders
            $("div#stage")
                // biggable mouseover
                .delegate(biggable,"mouseover",function(){
                    html.trigger("imageHoverOn",this);
                })
                // biggable mouseout
                .delegate(biggable,"mouseout",function(){
                    html.trigger("imageHoverOn",this);
                })
                // biggable click
                .delegate(biggable,"click",function(){
                    var $this = $(this),
                      imageKey = keyMatch($this.attr("href")),
                      slideshowKey = $this.closest(".slideshow-holder").attr("rel");
                    // is this part of a slideshow?
                    if(slideshowKey) { // it is
                      _a.IO.require("components/SlideshowViewer",function(){
                        var slideshow = new _a.SlideshowViewer();
                        _a.pushOverlay(slideshow,"slideshow");
                        slideshow.boot(slideshowKey,imageKey.split("/")[1]);
                      });
                    }
                    else { // it's not, just blow it up
                      if($this.hasClass("stereoscopic")) {
                        blowUp(imageKey,true);
                      }
                      else {
                        blowUp(imageKey);
                      }
                    }
                    return false; // prevent default behavior
                });
            // fullscreen clicks
            $("a.fullscreen").live("click",function(){
                var $this = $(this),
                    image = $this.find("img").data("image"),
                    div = $("<div class='popin'/>").appendTo($this.parent());
                (image)
                    ? popinImageMap(image,div)
                    : _a.dataStore.get(keyMatch($this.attr("href")),function(image){
                        popinImageMap(image,div);
                    });
                $this.remove(); // get rid of the original link
                return false;
            });
            // window resizing
            html.bind("windowResized",function(){
                if(resizer) {
                    resizer();
                }
            });
        },
        // interacting with a blown-up image and its controls
        bindFullscreen = function() {
            closeButton.click(function(){
                overlay.clean();
                return false;
            });
        },
        // make the image fullscreen, but do it with some smarts
        blowUp = function(key,goToStereo) {
            _a.dataStore.get(key,function(img){
                if(img.isOfType("Node")) {
                  resizer = false;
                  popopenNodeViewer(img);
                  return;
                }
                else {
                    var link = makeFullscreenImg(img);
                    sandbox.fadeIn("fast");
                    resizer = function() {
                        img.centerAndFit($w.height(),$w.width()-100,link.find("img"));
                    };
                    resizer();
                    stage
                        .empty()
                        .append(link)
                        .append($("<h5/>",{
                          className: "click-to-zoom",
                          text: "Click the image to zoom in"
                        }))
                        .append(makeMoreInfoLink(img));
                    _a.pushOverlay(overlay,key);
                    if(goToStereo) { // open the stereo viewer
                      $("a.fullscreen").trigger("click");
                    }
                }
            });
        },
        popinImageMap = function(img,where) {
            where.css({
                width: $w.width()-30,
                height: $w.height()-30
            });
            _a.IO.require("components/GImageViewer",function(){
                var viewer = new _a.GImageViewer({
                    provider: img,
                    sandbox: where,
                    background: "clear"
                });
            });
            where.find(".imageviewer").addClass("clear");
        },
        popopenImageMap = function(img) {
		      window.open(
		        "/"+img.key()+"?mode=naked&view=zoom",
		        "image",
		        parametrize({
	                menubar: 1,
	                resizable: 1,
	                width: $w.width(),
	                height: $w.height()+25
	            })
	        );
        },
        popopenNodeViewer = function(node) {
            window.open(
                "/scripts/panorama.php?path="+node.get("swf"),
                "360 degree node view",
                parametrize({
                    menubar: 1,
                    resizable: 1,
                    width: $w.width(),
                    height: $w.height()+25
                })
            );
        },
        makeFullscreenImg = function(img) {
            return $("<a/>",{
                "class": "fullscreen",
                href: "/"+img.key(),
                html: $("<img/>",{
                    src: img.get("thumbnail"),
                    data: { image: img }
                })
            });
        },
        makeMoreInfoLink = function(img) {
            return $("<a/>",{
                "class": "more-information",
		            href: "/"+img.key(),
		            text: "More Information"
            });
        },
        // turn a { a: "b", c: "d" } into "a=b,c=d" string
        parametrize = function(hash) {
            return _.map(hash,function(v,k){ return k+"="+v; }).join(",");
        };
    
    // call this function to add all image embiggening
    
    _a.ImageOverlays = {
        listenForImages: function() {
            _a.IO.require("components/ImageComponent",function(){
                // fill in some blanks left in declarations earlier
                sandbox = $("#big_image_container");
                stage = $("#big_image");
                closeButton = sandbox.find("a.image_close");
                // call the two important functions
                bindImages();
                bindFullscreen();
            });
        },
        popopenImageMap: popopenImageMap
    };
    
})();