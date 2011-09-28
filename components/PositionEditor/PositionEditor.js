(function(){

    var _a = Archmap;

    _a.defineComponent({
        name: "PositionEditor",
        extend: "GroupComponent",
        methods: {
            start: function() {
                if(_a.user.data.auth_level > 4) {
                    this.render();
                }
            },
            renderModel: function(model) {
                var button = $("<button/>",{
                    text: "Edit Lat/Lng Position",
                    click: function() {
                        var map = new _a.PopoverMap(model,function(lat,lng){
                            model.set("lat",lat,function(){
                                model.set("lng",lng,function(){
                                    alert("done");
                                });
                            });
                        });
                    }
                });
                this.sandbox.append(button);
            }
        }
    });
    
})();