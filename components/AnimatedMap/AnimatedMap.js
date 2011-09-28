(function(){
    
    var _a = Archmap;

    // helpers functions (private)
    var renderArray = function(arr) {
        (_.isArray(arr))
            ? _.each(arr,function(a){ renderArray(a); })
            : arr.fadeIn(); // (not an array here)
        };
        
    // some funky prototypal inheritance funk
    _a.defineComponent({
        name: "AnimatedMap",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                this.inlineOptions.zoom = "false";
                _a.IO.require("components/MapComponent2",function(){
                        that.mPro = _a.MapComponent2.prototype;
                        that.mPro.start.apply(that);
                    }
                );
            },
            defineHandles: function() {
                this.textBox = $(this.inlineOptions.text); // cheating?
                return this.mPro.defineHandles.apply(this,arguments);
            },
            initializeMap: function() {
                // run MapComponent2 method, save the result, do some stuff, then return that
                var init = this.mPro.initializeMap.apply(this,arguments),
                    map = this.map,
                    styles = this.styles;
                    
                setTimeout(function(){
                    // modify the default style, so we can see place names at all levels
                    styles.simple.rule("administrative.locality",{
                        visibility: "on", lightness: 25
                    }).update();
                    map.setZoom(7);
                },100);
                
                //_a.ImageLayer.hideGoogleLayer(this.map.getDiv());
                _a.ImageLayer.hideGoogleLogo(this.mapdom);
                // now send the original value, for compatability
                this.placeHighlight = undefined;
                var stage = $("div#stage"),
                    ghosts = [],
                    ghostCheck,
                    that = this;
                stage
                    .bind("glowHoverOn",function(e,key){
                        clearTimeout(ghostCheck);
                        _a.dataStore.get(key,function(model){
                            ghosts.push(new _a.Markers.GhostPlace({
                                map: map,
                                model: model
                            }));
                        });
                    })
                    .bind("glowHoverOff",function(){
                        var clearGhosts = function() {
                            $(".ghostPlace").fadeOut(function(){
                                $(this).remove();
                            });
                        };
                        clearGhosts(); // try it once
                        ghostCheck = setTimeout(clearGhosts,500); // make sure they're gone
                    });
                    
                _a.Zooms.addCustomZooms(this.mapdom,this.map);
                
                return init;
            },
            renderModel: function(model) {
                return (model.isProvider())
                    ? false // uninterested dude!
                    : this.mPro.renderModel.apply(this,arguments);
            },
            highlightModel: function(key) {
                // clear the existing markers (this.markers is from MapComponent2)
                _.each(this.markers,function(m){
                    m.fadeOut();
                });
                
                var that = this;
                // now render what we want to render
                _a.dataStore.get(key, function(model) {
                    var u = undefined,
                    	res = that.renderModel(model,u,u,true);
                	// render the full collection after a skip, eh?
                	setTimeout(function(){ renderArray(res); },500);
                });
            }
        }
    });

})();