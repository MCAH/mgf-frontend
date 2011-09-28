/*
	Basic search for the front page
*/

(function(){
	
	var _a = Archmap,
	  gurl = "https://www.googleapis.com/customsearch/v1",
	  key = "AIzaSyC3OUQCPeGOhN_jbuARHrVG2PjNoWl-Fls",
	  cse = "017076027136652010926:vxl4hvjdc1s";
	
	_a.defineComponent({
	    name: "BasicSearch",
	    extend: "SingletonComponent",
	    methods: {
	        initialize: function() {
    			this.dom = $("#BasicSearch");
    			var that = this;
    			_a.IO.getComponentHtml("BasicSearch",function(html){
    				that.dom.append(html);
    				that.listen();
    			});
    		},
    		listen: function() {
    		  var input = this.dom.find("#searcher");
    		  
    		  this.dom.find("form").submit(function(){
    		    var val = input.val();
    		    //$.ajax({
    		    //  url: 
    		    //})
    		    return false;
    		  });
    		}
    		/*
    		listen: function() {
    			this.input = this.dom.find("input#searcher");
    			this.drop = this.dom.find("div#live_results ul");
    			var that = this,
    			    keyListening = false;
    			this.input
    			    .focus(function(){
    			        keyListening = true;
    			        if($(this).attr("value") === "Search") {
    			            $(this).addClass("writing").attr("value","");
    			        }
    			        else {
        					that.drop.parent().fadeIn();
        				}
    			    })
    			    .blur(function(){
    			        keyListening = false;
    			        if($(this).attr("value").match(/^[\s]{0,}$/)) {
    			            $(this).removeClass("writing").attr("value","Search");
    			        }
    			        that.drop.parent().fadeOut();
    			    });
    			    
    			$("html").keydown(function(event){
    			    if(keyListening === true) {
    			        if(event.keyCode === 38) { // 38 is up
    			            if(that.drop.find("li.selected").prev("li").length !== 0) {
    			                that.drop.find("li.selected")
    			                    .prev("li").addClass("selected")
    			                    .end().removeClass("selected");
    			                    return false;
    			            }
    			            return true;
    			        }
    			        if(event.keyCode === 40) { // 40 is down
    			            if(that.drop.find("li.selected").length === 0) {
    			                that.drop.find("li:first").addClass("selected");
    			            }
    			            else {
    			                that.drop.find("li.selected")
    			                    .next("li").addClass("selected")
    			                    .end().removeClass("selected");
    			            }
    			            return true;
    			        }
    			    }
    			});
    			
    			// the actual search functionality is loaded here
    			_a.IO.require("components/LiveSearch",function(){
    				that.liveSearch = new _a.LiveSearch({
    				    inputHandle: that.input,
    				    url: function(term) {
    				        return "search/"+term+"/quicksearch";
    				    },
    				    response: function(results) {
    				        that.drop.parent().fadeIn();
    				        that.drop.empty();
    						var count = 0;
    						for(var r in results) {
    							if(count > 10) { return; }
    							var result = results[r];
    							that.drop.append(_a.Elements.UIStuff.standardListItem({
    								key: result.key(),
    								name: result.get("name"),
    								type: result.getType()
    							}));
    							count += 1;
    						}
    						if(results.length === 0) {
    							that.drop.append("<li><em>We've searched and found nothing!</em></li>");
    						}
    				    },
    				    clear: function() {
    				        that.drop.empty();
    						that.drop.parent().fadeOut();
    				    }
    				});
    			});
    			// interaction listeners
    			// temporary search functionality
    		 	$("form#search").submit(function(){
    		 	    if(that.sandbox.find(".selected").length === 0) {
    		 		    window.location = _a.uri+"/search/"+$(this).find("input").attr("value");
    		 		}
    		 		else {
    		 		    window.location = _a.uri + that.sandbox.find(".selected a").attr("href");
    		 		}
    		 		return false;
    		 	});
    		}*/
	    }
	});
	
	/*
	_a.BasicSearch = function(){ };
	
	_a.BasicSearch.prototype = new _a.SingletonComponent();
	
	jQuery.extend(_a.BasicSearch.prototype,{
		
	});
	*/
	
})();