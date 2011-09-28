(function(){
    
    var _a = Archmap;
    
    _a.defineComponent({
        name: "ImageComponent",
        extend: "GroupComponent",
        methods: {
            start: function() {
                this.defaultType = "frontispiece";
                this.blank = true;
                this.defaultType = this.inlineOptions.type || undefined;
                var that = this;
                // defer, so caller has time to call setType
                _.defer(function(){
                    that.render();
                });
            },
            // if a building is being passed in, you can
            // override its default choice of frontispiece
            setType: function(type) {
                this.defaultType = type;
            },
            renderModel: function(model) {
                if(model.isOfType("image")) {
                    this.image = model; // remember the record
                    this.img = $("<img/>",{
                        src: model.get("thumbnail"),
                        css: { paddingTop: 20 },
                        data: { image: model }
                    });
                    this.sandbox
                        .append(this.img)
                        .css("text-align","center");
                    if(model.get("id")) {
                        this._isBlank = false;
                        model.centerAndFit(
                            this.inlineOptions.height || ( this.sandbox.height()-25 ),
                            this.inlineOptions.width || ( this.sandbox.width()-25 ),
                            this.img
                        );
                    }
                    else {
                        this._isBlank = true;
                        this.img.attr("src","/media/ui/blank2.png");
                    }
                }
                else if(model.isOfType("Building")) {
                    var that = this;
                    model.get(this.defaultType,function(image){
                        that.renderModel(image);
                    });
                }
            },
            getFromImage: function(field) {
                return (this.image === undefined)
                    ? false
                    : this.image.get(field);
            },
            centerAndScaleAndFit: function(against,xy) {
                this.lastLargest = against;
                if(this.image === undefined) {
                    return;
                }
                else {
                    this.image.centerAndScaleAndFit(
                        this.sandbox.height() - 25,
                        this.sandbox.width(),
                        this.img, against, xy
                    );
                }
            },
            resize: function(height,width) {
                if(height && width) {
                    if(this.image.get("id")) {
                        if(this.defaultType === "floorplan") {
                            this.image.centerAndScaleAndFit(
                                height - 25,
                                width,
                                this.img, this.lastLargest,
                                { x:25, y:25 }
                            );
                        }
                        else {
                            this.image.centerAndFit(
                                height - 25,
                                width - 25,
                                this.img,
                                { x:25, y:25 }
                            );
                        }
                    }
                }
            },
            isBlank: function() {
                return this._isBlank;
            }
        }
    });
    
})();