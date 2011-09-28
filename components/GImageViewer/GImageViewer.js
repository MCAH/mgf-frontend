/* using a google map for viewing zooming images */

(function(){
    
    var _a = Archmap,
        _g = google.maps;
    
    _a.defineComponent({
        name: "GImageViewer",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                _a.IO.require("components/AMap2",function(){
                    that.loadTemplate(function(){
                        that.viewerHandle = that.sandbox.find("div.imageviewer");
                        that.viewerHandle.height(that.sandbox.height());
                        if(that.inlineOptions.background) {
                            that.viewerHandle.addClass(that.inlineOptions.background);
                        }
                        this.render();
                    });
                });
            },
            renderModel: function(model) {
                if(model instanceof _a.Image) {
                    this.setImage(model);
                }
            },
            setImage: function(image) {
                var div = this.viewerHandle,
                    map = undefined,
                    that = this,
                    isStereo = image.get("has_stereo") == 1, // true or false, eh?
                    layerName = (isStereo) ? "threeDee" : "twoDee",
                    layerCallback = function(layer) {
                        var map = _a.ImageLayer.buildMapWithLayer(div[0],layer,layerName);
                        map.setZoom(9);
                        setTimeout(function(){
                            map.setZoom(10);
                            _a.ImageLayer.fitImage(layer,map,div);
                        },150);
                        // pretty self-explanatory
                        _a.ImageLayer.hideGoogleLogo(div);
                        // make sure you can't pan away
                        _a.ImageLayer.bindImagePan(layer,map,div);
                        //if(that.inlineOptions.allowCarding !== true) {
                            // make sure you can't push it around like a card
                            //_a.ImageLayer.bindImageZoom(layer,map,div);
                        //}
                        // and then, you know, custom zooms
                        _a.Zooms.addCustomZooms(div,map);
                        // is it a stereo image?
                        if(isStereo) {
                            //that.addThreeDeeOption(image,map,div);
                            that.addTwoDeeOption(image,map,div);
                            // addTwoDeeOption
                        }
                        // remember for resizing
                        that.layer = layer;
                        that.map = map;
                    };
                    
                _a.ImageLayer.getImageLayer(image,layerCallback,isStereo);
            },
            addTwoDeeOption: function(image,map,div) {
                div.before($("<button/>",{ // 3D controls
                    "class": "make3D",
                    text: "Make 2D",
                    click: function(){
                        if($(this).text() === "Make 2D") {
                            $(this).text("Make 3D");
                            if("twoDee" in map.mapTypes) {
                              map.setMapTypeId("twoDee");
                            }
                            else {
                              _a.ImageLayer.getImageLayer(image,function(twoDee){
                                _a.ImageLayer.swapImageLayer(map,twoDee,"twoDee");
                              });
                            }
                        }
                        else {
                          map.setMapTypeId("threeDee");
                          $(this).text("Make 2D");
                        }
                    }
                }));
            },
            resize: function() {
                this.viewerHandle
                    .height(this.sandbox.height())
                    .width(this.sandbox.width());
                _g.event.trigger(this.map,'resize');
            }
        }
    });
    
})();