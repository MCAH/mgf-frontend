(function(){
    
    var _a = Archmap;
    
    _a.defineComponent({
        name: "SectionComponent",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                _a.IO.require("components/AMap2",function(){
                    that.loadTemplate("SectionComponent",function(){
                        that.defineHandles().render();
                    });
                });
            },
            defineHandles: function() {
                var that = this;
                this.sectionHandle = this.sandbox.find(".imageviewer");
                return this;
            },
            renderModel: function(model) {
                var div = this.sectionHandle,
                    that = this;
                model.get("lat_section",function(image){
    				      _a.ImageLayer.getImageLayer(image,function(layer){
                    var map = _a.ImageLayer.buildMapWithLayer(div[0],layer,"section");
                  	_a.ImageLayer.hideGoogleLogo(div);
                  	_a.ImageLayer.bindImagePan(layer,map,div);
                  	_a.Zooms.addCustomZooms(div,map,true);
                  	setTimeout(function(){
                  	  _a.ImageLayer.fitImage(layer,map,div);
                  	},300);
                  	that.sandbox.find("button").click(function(){
                  	  _a.ImageOverlays.popopenImageMap(image);
                  	});
                  });
                },function(){
                  that.sandbox.remove();
                });
            }
      }
    });
    
})();