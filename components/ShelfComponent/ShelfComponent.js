(function(){
    
    var _a = Archmap;
    
    // private functional functions
    
    var addParametric = function(sandbox,building) {
            sandbox.empty();
            var section = new _a.ParametricComponent({
                sandbox: sandbox,
                provider: building
            });
            return section;
        },
        addImage = function(sandbox,building,imageType) {
            sandbox.empty();
            var image = new _a.ImageComponent({
                sandbox: sandbox,
                provider: building
            });
            image.setType(imageType);
            return image;
        };
    
    _a.defineComponent({
        name: "ShelfComponent",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                _a.IO.require([
                        "components/ParametricComponent",
                        "dependencies/DragDropSort",
                        "dependencies/SortElements"
                    ],function(){
                        that.loadTemplate("ShelfComponent",function(){
                            that.defineHandles().buttonListen().exampleListen().render();
                        });
                    });
            },
            defineHandles: function() {
                this.shelf = this.sandbox.find("ul");
                return this;
            },
            exampleListen: function() {
                var that = this;
                this.sandbox.find(".examples a").click(function(){
                    var $this = $(this),
                        action = $this.attr("href").replace("#","");
                    switch(action) {
                        
                        case "line":
                            that.sandbox.find("button[rel='parametric']").trigger("click");
                            that.stackButton.trigger("click",[ undefined, 1 ]);
                            break;
                            
                        case "animate":
                            that.sandbox.find("button[rel='parametric']").trigger("click");
                            that.stackButton.trigger("click",[ undefined, 2 ]);
                            var interval = 300;
                            that.shelf.find("li").each(function(){
                                setTimeout(function(){ that.arrowHighlight("right"); },interval);
                                interval += 275;
                            });
                            setTimeout(function(){ that.arrowHighlight("right"); },interval);
                            break;
                            
                        case "frontispieces":
                            that.unstackButton.trigger("click");
                            that.sandbox.find("button[rel='frontispiece']").trigger("click");
                            break;
                            
                    }
                    return false;
                });
                return this;
            },
            buttonListen: function() {
                this.isStacked = false;
                var that = this,
                    sandbox = this.sandbox,
                    rand = function(from,to) {
                        var range = to - from;
                        return Math.floor(Math.random()*range) + from;
                    },
                    stackClicks = -1, // gets incremented before applied
                    stackStyles = [ // different stacking styles
                        { top: 5, left: 5, name: "Isometric View" },
                        { top: 0, left: 10, name: "Equal Intervals" },
                        { top: 0, left: 0, name: "Stack of Cards" },
                        { top: 5, left: 0, name: "Equal Intervals (Vertical)" },
                        {
                            top: function(building){
                                return 185;
                            },
                            left: function(building){
                                var beg = building.get("beg_year");
                                return (beg)
                                    ? (beg - 1000)*4
                                    : 5000;
                            },
                            name: "Timeline View"
                        },
                        {
                            top: function(building){
                                return Math.abs((180-parseFloat(building.get("lat"))))*150 - 19300;
                            },
                            left: function(building){
                                return (parseFloat(building.get("lng"))+5)*150 - 500;
                            },
                            name: "Geographical View"
                        }
                    ],
                    stackStyleLength = stackStyles.length;
                // buttons to remember
                this.stackButton = sandbox.find("button.stack");
                this.unstackButton = sandbox.find("button.unstack");
                /* clear the arrowed class if it's around for a hover */
                this.shelf.delegate("li","mouseover",function(){
                    $(".arrowed").removeClass("arrowed");
                    $(this).addClass("arrowed");
                });
                this.shelf.delegate("li","mouseout",function(){
                    $(this).removeClass("arrowed");
                });
                /* stacking */
                this.stackButton.click(function(e,dontIncrement,stackStyle){
                    // do some quick cleanup
                    sandbox.find("button.unstack").trigger("click",[false]);
                    if(dontIncrement === undefined) {
                        stackClicks += 1; // so the stack style will change
                    }
                    if(stackStyle) {
                        stackClicks = stackStyle;
                    }
                    that.isStacked = true;
                    // set the height appropriately
                    that.shelf.height(900);
                    // determine which stack style we'll be using
                    // (based on how many times it's clicked)
                    var style = stackStyles[( stackClicks%stackStyleLength )];
                    // defaults
                    var top = 195, left = 75;
                    // now apply the stack positioning algorithm
                    that.stackButton.text("Stack: "+style.name);
                    that.shelf.find("li").each(function(){
                        var building = $(this).data("building");
                        // what's the algorithm for placing them absolutely?
                        (_.isFunction(style.top))
                            ? top = style.top(building) : top += style.top;
                        (_.isFunction(style.left))
                            ? left = style.left(building) : left += style.left;
                        // now place it
                        $(this).css({
                            position: "absolute",
                            top: top,
                            left: left
                        }).addClass("absolute");
                    });
                });
                /* unstacking */
                this.unstackButton.click(function(e,clearClicks){
                    that.isStacked = false;
                    if(clearClicks !== false) {
                        stackClicks = -1;
                    }
                    that.shelf.find("li").css({
                        position: "relative",
                        top: "",
                        left: "",
                        zIndex: ""
                    }).removeClass("absolute");
                });
                /* key listeners */
                $("body").bind("keydown",function(e){
                    if(e.which === 37 || e.which === 39) {
                        that.arrowHighlight(e.which);
                    }
                });
                return this;
            },
            arrowHighlight: function(which) {
                var settings = (which === 37 || which === "left")
                    ? { pseudo: "last", adjacent: "prev" }
                    : { pseudo: "first", adjacent: "next" };
                // now apply the settings
                var arrowed = this.sandbox.find(".arrowed");
                // if there are none, apply to ends, otherwise go adjacent
                if(arrowed.length === 0) {
                    this.sandbox.find("li:"+settings.pseudo).addClass("arrowed");
                }
                else {
                    arrowed.removeClass("arrowed")[settings.adjacent]().addClass("arrowed");
                }
            },
            renderModel: function(model) {
                var that = this;
                if(model.isOfType("Collection")) {
                    model.iterateMembers(function(i,item){
                        that.renderModel(item);
                    });
                    return;
                }
                if(model.isOfType("Building")) {
                    this.preventFinalize();
                    var building = model.getItem(),
                        sandbox = $("<div/>",{
                            "class": "component"
                        }),
                        holder = $("<li/>",{
                            "class": "section",
                            data: {
                                building: building
                            },
                            html: sandbox
                        });
                    // now get the building model so we can build the component
                    building.getBuildingModel(function(buildingModel){
                        that.enableFinalize().finalize(); // clear the lock, try to finalize
                        var height = buildingModel.maxHeight();
                        if(height) {
                            holder
                                .data("measure",height)
                                .prepend($("<div/>",{
                                    "class": "link",
                                    html: $("<a/>",{
                                        href: "/"+building.key(),
                                        text: building.get("name")
                                    })
                                }))
                                .prepend($("<div/>",{
                                    "class": "measure",
                                    text: height
                                }));
                            // add it to the dom
                            that.shelf.append(holder);
                            // add the component to its dom element
                            holder.data("component",addParametric(sandbox,building));
                        }
                    });
                }
            },
            finalize: function() {
                if(this.canBeFinalized() === true) {
                    clearTimeout(this.finalizer);
                    var that = this;
                    this.finalizer = setTimeout(function(){
                        that.bindSorters();
                        that.sandbox.find("button[rel='naveHeight']").trigger("click");
                        setTimeout(function(){
                            that.sandbox.find("button.selected").trigger("click",[true]);
                        },1000);
                        that.bindTypeChoosers();
                        that.sandbox.find("button[rel='parametric']").trigger("click");
                        that.bindButtons();
                        that.freeze();
                    },500);
                }
            },
            bindSorters: function() {
                var lis = this.shelf.find("li"),
                    that = this,
                    organizer = this.sandbox.find("div.organizer");
                // attach a common event for all of them
                organizer.delegate("button","click",function(e,dontIncrement){
                    var button = $(this),
                        reverse = ( (button.attr("action") == "reverse") ? true : false );
                    // if it's already selected, add another count so we can determine even/odd
                    (dontIncrement !== true && button.hasClass("selected"))
                        ? button.data("clickCount",button.data("clickCount") + 1)
                        : button.data("clickCount",1);
                    // get rid of all selected highlights
                    organizer.find("button.selected").removeClass("selected");
                    // add it to this one
                    button.addClass("selected");
                    // replace the statistic by which we measure, based on the button's specified field
                    lis.each(function(i){
                        var item = $(this),
                            newValue = item.data("building").get(button.attr("rel"));
                        // now update the measure
                        item.removeClass("defaulted")
                            .data("measure", (newValue) ? newValue : "N/A")
                            .find("div.measure")
                                .text(item.data("measure"));
                        // blur them if they're not up to snuff
                        _a.log(i);
                        _a.log(newValue);
                        var component = item.data("component");
                        if(!newValue
                            || (component instanceof _a.ParametricComponent && component.isBlank() === true)) {
                            item.addClass("defaulted");
                        }
                    });
                    // now the actual sorting
                    // and, yes, I did try to make this function as absolutely
                    // complicated as humanly possible (ok, not really)
                    that.shelf.find("li").sortElements(function(a,b){
                        var _a = $(a),
                            _b = $(b),
                            aM = _a.data("measure"),
                            bM = _b.data("measure"),
                            truth = (aM.match && aM.match(/^[\d]/)) // if it's number, do this
                                ? parseFloat(aM) > parseFloat(bM)
                                : aM < bM,
                            rtrn; // will be determined
                        // first, should we just skip this comparison?
                        if(_a.hasClass("defaulted")) { return 1; }
                        else if(_b.hasClass("defaulted")) { return -1; }
                        else {
                            rtrn = ( button.data("clickCount") % 2 === 1 )
                                ? ( truth ) ? -1 : 1
                                : ( truth ) ? 1 : -1;
                            // watch out for a reverse command! (for years n' shtuff)
                            return (reverse === true)
                                ? (rtrn === -1) ? 1 : -1 // reversing....
                                : rtrn; // not reversing
                        }
                    });
                    if(that.isStacked === true) {
                        that.unstackButton.trigger("click",[false]);
                        that.stackButton.trigger("click",[true]);
                    }
                });
            },
            resort: function() {
                this.sandbox.find("div.organizer").find("button.selected").trigger("click",[true]);
            },
            bindTypeChoosers: function() {
                _a.IO.require("components/ImageComponent",function(){}); // interaction is callback enough!
                var lis = this.shelf.find("li"),
                    that = this,
                    chooser = this.sandbox.find("div.imagetypes");
                // delegate the clicks for type chooser buttons
                chooser.delegate("button","click",function(){
                    var button = $(this),
                        type = button.attr("rel"),
                        isParametric = (type === "parametric");
                    // wait, do we need to do this?
                    if(button.hasClass("selected")) {
                        return;
                    }
                    // switch the classes to highlight the one involved
                    chooser.find("button.selected").removeClass("selected");
                    button.addClass("selected");
                    that.components = []; // for speedy read-through on floorplans
                    // now add a new component to each li
                    lis.each(function(){
                        var item = $(this),
                            building = item.data("building"),
                            sandbox = $(this).find(".component"),
                            component = (isParametric)
                                ? addParametric(sandbox,building)
                                : addImage(sandbox,building,type);
                        // remember it (so we can delete it?)
                        item.data("component",component);
                        that.components.push(component);
                    });
                    // do we need to scale the images?
                    if(type === "floorplan") {
                        var scaleFn = function(){
                            var largest = 100000;
                            // finding the smallest
                            _.each(that.components,function(comp){
                                var scale = parseFloat(comp.getFromImage("scale"));
                                if(_.isNumber(scale) && largest > scale) {
                                    largest = scale;
                                }
                            });
                            if(largest !== 100000) {
                                // now apply the scale we learned
                                _.each(that.components,function(comp){
                                    comp.centerAndScaleAndFit(largest,{ x:5, y:15 });
                                });
                            }
                        };
                        scaleFn(); // call once for switching back to floorplan view
                        setTimeout(scaleFn,1000);
                        setTimeout(scaleFn,5000);
                        setTimeout(scaleFn,10000);
                    }
                    setTimeout(function(){
                        that.resort();
                    },100);
                });
            },
            bindButtons: function() {
                var sandbox = this.sandbox,
                    that = this;
                /* opacity changer */
                sandbox.find("input.opacityChanger").bind("change",function(){
                    var value = $(this).attr("value")/100;
                    sandbox.find("li").css("background-color","rgba(255,255,255,"+value+")");
                });
                /* box size changer */
                var lis = sandbox.find("li"),
                    width = lis.width(),
                    height = lis.height(),
                    set; // resize waiter
                // now listen!
                sandbox.find("input.sizeChanger").bind("change",function(){
                    var value = $(this).attr("value"),
                        delt = (value < 50) ? -(50-value) : (value-50);
                    sandbox.find("li").width(width+delt);
                    sandbox.find("li .component").width(width+delt);
                    clearTimeout(set);
                    set = setTimeout(function(){
                        _.each(that.components,function(comp){
                            comp.resize(height,width+delt);
                        });
                    },100);
                });
            },
            freeze: function() {
                this.shelf.find("li").draggable({
                    opacity: 0.9,
                    stack: "li"
                });
            }
        }
    });
    
})();