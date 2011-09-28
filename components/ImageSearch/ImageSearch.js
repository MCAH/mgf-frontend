(function(){
    
    var _a = Archmap,
        // add names and ids to a list
        fillMembers = function(model,where,updateFn) {
            var ul = $("<ul/>"),
                input = where.find("input"),
                selection = where.find(".selections");
            model.iterateMembers(function(i,m){
                ul.append($("<li/>",{
                    "class": "choice",
                    text: m.get("name"),
                    data: { model: ( m.isanitem() ) ? m.getItem() : m }
                }));
            });
            // livesearching
            input
                .liveUpdate(ul)
                .keyup(function(){
                    ul.slideDown();
                })
                .blur(function(){
                    var $this = $(this);
                    setTimeout(function(){
                        ul.slideUp();
                        $this.attr("value","");
                    },10);
                });
            where.append(ul);
            // interacting with the results
            ul.find("li").click(function(){
                var $this = $(this),
                    model = $this.data("model");
                $this.addClass("unavailable");
                // add new div to the selection
                selection.append($("<div/>",{
                    "class": "selected",
                    html: _.$flatten([
                        $("<span/>",{ text: model.get("name") }),
                        $("<span/>",{
                            "class": "delete",
                            text: "x",
                            click: function() {
                                $(this).parent().remove();
                                $this.removeClass("unavailable");
                                //updateFn();
                            }
                        })
                    ]),
                    data: { id: model.get("id") }
                }));
                //updateFn();
            });
            // default submit behavior
            input.parent().submit(function(){
                ul.find("li:visible").not(".unavailable").trigger("click");
                input.attr("value","");
                setTimeout(function(){
                   ul.slideUp(); 
                },300);
                return false;
            });
        },
        // attempt at natural language parsing of image search
        auNaturale = function(text,comp) {
            comp.search(text);
        };
    
    _a.defineComponent({
        name: "ImageSearch",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                this.loadTemplate("ImageSearch",function(){
                    _a.IO.require([
                            "dependencies/LiveSearch",
                            "dependencies/Quicksilver",
                            "components/ImageComponent"
                        ],function(){
                            that.defineHandles().fillControls();
                        });
                });
            },
            defineHandles: function() {
                var sand = this.sandbox,
                    that = this;
                this.handles = {
                    buildings: sand.find(".buildings"),
                    keywords: sand.find(".keywords"),
                    types: sand.find(".types")
                };
                this.results = sand.find(".results");
                // natural language parsing
                sand.find(".natural").find("form").submit(function(){
                    //auNaturale($(this).find("input").attr("value"));
                    that.search($(this).find("input").attr("value"));
                    return false;
                });
                return this;
            },
            fillControls: function() {
                var that = this,
                    pairs = {
                        buildings: "collection/1",
                        keywords: "catalog/keywords",
                        types: "catalog/types"
                    },
                    handles = this.handles,
                    updateFn = function() { that.search(); };
                // iterate over pairs, making async requests
                _(pairs).each(function(signature,handle){
                    _a.dataStore.get(signature,function(model){
                        fillMembers(model,handles[handle],updateFn);
                    });
                });
                this.sandbox.find(".search").click(updateFn);
                return this;
            },
            renderModel: function() {
                return false; // not how this operates
            },
            search: function(simple) {
                var results = this.results,
                    newResult = $("<div/>",{
                        "class": "result clear"
                    }),
                    populateImage = function(image) {
                        var a = $("<a/>",{
                                href: "/"+image.key(),
                                "class": "biggable"
                            }),
                            imgComp = new _a.ImageComponent({
                                sandbox: a,
                                provider: image,
                                height: 115,
                                width: 125
                            });
                        newResult.append($("<div class='image'/>").append(a));
                    };
                // the cleaning
                results.find(".result").addClass("collapsed");
                results.append(newResult);
                // the actual searching
                if(simple === undefined) {
                    _a.IO.getJSONModel("search/null/facetedimages",function(res,obj){
                        _.each(obj.get("facetedimages"),populateImage);
                    },true,this.buildQuery());
                }
                else {
                    _a.IO.getJSONModel("search/null/natural",function(res,obj){
                        _.each(obj.get("natural"),populateImage);
                    },true,{
                        natural: simple
                    });
                }
            },
            buildQuery: function() {
                var sand = this.sandbox,
                    all = sand.find(".list,.boolean"),
                    params = $.map(all,function(elem){
                        var $elem = $(elem),
                            isList = $elem.hasClass("list"),
                            key = $elem.attr("rel"),
                            values = $.map($elem.find(":selected,.selected"),function(i){
                                return (isList)
                                    ? $(i).data("id")
                                    : $(i).attr("value");
                            }).join(",");
                        return [ [ key, values ] ];
                    });
                // filter out non-existent params and return the rest after converting to a hash
                return _(params)
                    .chain()
                    .reject(function(p){ return p === false || p[1] === ""; })
                    .keyMap(function(p){
                        return { key: p[0], value: p[1] };
                    }).value();
            },
            buildTitle: function(hash) {
                //var title = (hash.types) ? 
            }
        }
    });
    
})();