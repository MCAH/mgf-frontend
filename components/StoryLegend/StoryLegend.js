(function(){
    
    var _a = Archmap;
    
    _a.defineComponent({
        name: "StoryLegend",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                _a.IO.getComponentHtml("StoryLegend",function(html){
                    _a.IO.require("dependencies/DisableTextSelect",function(){
                        that.sandbox.append(html);
                        that.defineHandles().listen().render();
                        _a.IO.require("dependencies/DragDropSort",function(){
                            that.sandbox.draggable({ containment: "#stage" });
                        });
                    });
                });
            },
            defineHandles: function() {
                // this.title = this.sandbox.find("h3.title");
                this.list = this.sandbox.find("ul:first");
                this.movers = {
                    back: this.sandbox.find(".back"),
                    forth: this.sandbox.find(".forth")
                };
                this.movers.back
                    .disableTextSelect()
                    .append(_a.Elements.UIStuff.upArrow())
                    .addClass("disabled");
                this.movers.forth.disableTextSelect().append(_a.Elements.UIStuff.downArrow());
                return this;
            },
            listen: function() {
                var that = this,
                    sandbox = this.sandbox,
                    descend = function(current,direction) {
                        if(current.find("li").length > 0) { // has kids
                            current.children("ul").slideDown("fast");
                            descend( // oh hell yeah weird recursion ternary syntax
                                (direction === "next")
                                    ? current.find("li:first")
                                    : current.find("li:last"),
                                direction
                            );
                        }
                        else { // no kids, safe to select
                            that.selectItem(current);
                        }
                    },
                    // for clicking access
                    traverse = function(current,direction) {
                        // if no "current" parameter is provided
                        var adj = (current.length === 0)
                            ? that.list.find("li:first")
                            : current[direction]();
                        if(adj.is("li")) {
                            descend(adj,direction);
                        }
                        else {
                            var parent = current.parent().parent();
                            if(parent.length > 0) {
                                if(current.closest("ul").hasClass("top") === false) {
                                    current.closest("ul").slideUp("fast");
                                    that.closeDetailWindow();
                                }
                                traverse(parent,direction);
                            }
                            else { // terminate recursion
                                that.deselectAllItems();
                                return false;
                            }
                        }
                    };
                // moving backward
                this.movers.back
                    .click(function(){
                        // do the traversal
                        traverse(sandbox.find(".highlit"),"prev");
                        // now look again
                        var highlit = sandbox.find(".highlit");
                        //if(highlit).closest("ul").hasClass("top") && 
                    });
                // moving forth
                this.movers.forth
                    .click(function(){
                        that.movers.back.removeClass("disabled");
                        traverse(sandbox.find(".highlit"),"next");
                    });
                // clicking a drawer can trigger different things
                this.list.delegate("span","click",function(){
                    var item = $(this).parent();
                    if(item.find("li.highlit").length > 0) {
                        that.deselectAllItems();
                        item.children("ul").slideUp("fast");
                    }
                    else {
                        descend($(this).parent(),"next");
                    }
                });
                // key listeners
                var listening = false;
                this.sandbox.hover(function(){
                    listening = true;
                },function(){
                    listening = false;
                });
                $("html").keydown(function(e){
                    if(listening) {
                        if(e.which === 38) {
                            that.movers.back.trigger("click");
                        }
                        if(e.which === 40) {
                            that.movers.forth.trigger("click");
                        }
                    }
                });
                return this;
            },
            renderModel: function(model,parent) {
                var that = this;
                if(parent === undefined) { // top-level
                    // this.title.text(model.get("name"));
                    model.iterateMembers(function(i,member){
                        that.renderModel(member,null);
                    });
                }
                else { // top-level items
                    // look for a name in parenthesis at the end of the string
                    //if(parent !== null) {
                    //    var shortname = model.get("name").match(/\(([^\)\d\(]+)\)($|[\s]+$)/);
                    //}
                    //var shortname = model.get("name").match(/\(([^\)\d\(]+)\)($|[\s]+$)/);
                    var shortname = model.get("shortname") || model.get("name");
                    var li = $("<li/>",{
                        "class": (parent === null) ? "top" : "inner",
                        html: $("<span/>",{
                          //text: (shortname) ? shortname[1] : model.get("name")
                          text: shortname
                        }),
                        data: { model: model }
                    });
                    // append appropriately!
                    (parent === null)
                        ? this.list.append(li) : parent.append(li);
                    if(model.isOfType("Collection")) {
                        var ul = $("<ul>",{
                            "class": "inner"
                        });
                        li.append(ul);
                        model.iterateMembers(function(i,member){
                            if(member.isOfType("Map") || member.isOfType("Collection")) {
                                that.renderModel(member,ul);
                            }
                        });
                    }
                }
            },
            selectItem: function(item) {
                this.sandbox.find("li").removeClass("highlit");
                item.addClass("highlit");
                this.openDetailWindow(item.data("model"));
                this.sandbox.find(".highlitParent").removeClass("highlitParent");
                item.parentsUntil("ul.top").addClass("highlitParent");
                this.sandbox.find("ul").not(".highlitParent,.top").slideUp("fast");
            },
            deselectAllItems: function() {
                $(".highlitParent").removeClass("highlitParent");//.children().slideUp();
                $("li").removeClass("highlit");
                if($(".beingDisplayed").length > 0) {
                  this.selectItem($(".beingDisplayed"));
                }
                //$("html").trigger("removeHistoricalMapOverlay");
            },
            openDetailWindow: function(model) {  
              var that = this;
              //this.selectModel(model.key());
              //$("html").trigger("historicalMapOverlay",[ model ]); // put the map on the map
              /*
              this.sandbox.addClass("fat");
              this.sandbox.find(".detailWindow").remove();
              var slider = $("<input/>",{
    		        type: "range",
    		        change: function(){
    		            $("html").trigger("historicalMapOpacityChange",[ $(this).attr("value")/100 ]);
    		        }
    		      });
    		      var detail = $("<div/>",{
    		        "class": "detailWindow",
    		        html: slider
    	                .after($("<p/>",{
    	                    html: model.get("descript")
    	                }))
    		            });
    		      this.sandbox.append(detail);
    		      */
            },
            closeDetailWindow: function() {
                this.sandbox.removeClass("fat").find(".detailWindow").remove();
            }
        }
    });
    
})();