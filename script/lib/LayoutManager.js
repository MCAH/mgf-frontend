(function(){
    
    var _a = Archmap;
    
    _a.LayoutManager = {
        fullscreen: function(selectors,callback) {
            var layout = function() {
                $("#container")
                    .height($(window).height())
                    .width($(window).width());
                // not sure where this 25 comes from
                var maxHeight = $("#container").height();
                if($("#header").length > 0) {
                    maxHeight = maxHeight - $("#header").height() - 27;
                }
                if($.isArray(selectors) === false) {
                    selectors = [selectors];
                }
                $.each(selectors,function(i,selector){
                    $(selector).height(maxHeight); 
                });
                if(typeof callback === "function") {
                    callback(maxHeight);
                }
            };
            layout();
            // now bind so it'll happen automatically
            $(window).resize(function(){
                layout();
            });
            return this;
        },
        fullscreenLogo: function() {
            $("div#logo").css("left",12);
            return this;
        },
        searchAdjustment: function() {
            if($(".overflap").length !== 0) {
                var percent = 99 - parseInt( $(".overflap").width() / $(window).width() * 100, 10 );
                var inputPercent = parseInt( 185 / $(window).width() * 100, 10 );
                if(inputPercent > percent) {
                    percent = inputPercent;
                }
                $("#navigation").css("right",percent+"%");
            }
            return this;
        },
        hoverListeners: function() {
          // highlight the button that points to the current page
          $("#header a").each(function(){
              var $this = $(this);
              if($this.attr("href") !== "/" && location.pathname == $this.attr("href")) {
                  $this.addClass("currentpage");
              }
          });
          // add hover effects for drop-downs
          Archmap.IO.require("dependencies/HoverIntent",function(){
            var openPopup = function(e) {
              var div = $(this).parent().find("div.popover-panel");
  						if(div.length > 0) {
  							var pop = div.clone();
  							var left = $(this).offset().left;
  							pop.removeClass("popover-panel")
  								.addClass("poppedover-panel")
  								.css("display","none")
  								.css("top",45).css("left",left)
  								.fadeIn("fast");
  							$("body").append(pop);
  							$(this).data("pop",pop);
  							/*
  							pop.hoverIntent({
  								over: function(){
  									$(this).addClass("beinghovered");
  								},
  								out: function(){
  									$(this).fadeOut("fast",function(){
  										$(this).remove();
  									});
  								},
  								timeout: 300,
  								interval: 1
  							});
  							*/
  						}
            };
            var closePopup = function(e) {
              var pop = $(this).data("pop");
  						if(pop && !pop.hasClass("beinghovered")) {
  							pop.fadeOut("fast",function(){
  								$(this).remove();
  							});
  						}
            };
				    // open and position popover panels for navigation
				    $("a.top.login").toggle(openPopup,closePopup);
    				//$("a.top").hoverIntent({
    				//	over: openPopup,
    				//	out: closePopup
    				//});
    				// tool tips for the main buttons
    				$("#logo a").hoverIntent({
    				    over: function() {
    				        var tip = $("<div/>",{
    				            "class": "buttontip",
    				            text: $(this).attr("tip"),
    				            css: {
    				                left: $(this).offset().left
    				            }
    				        });
    				        $(this).data("tip",tip);
    				        $("div#container").append(tip);
    				        tip.fadeIn();
    				    },
    				    out: function(e) {
    				        $(this).data("tip").fadeOut(function(){
    				            $(this).remove();
    				        });
    				    },
    				    interval: 200,
    				    timeout: 150
    				});
    			});
    			return this;
        }
    };
    
})();