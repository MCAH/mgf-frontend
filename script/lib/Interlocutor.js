(function(){
    
    var _a = Archmap,
        // the main function
        timer, // defined later
        outTimer,
        popup, // defined later
        tolerance = 500,
        interlocute = function($elem) {
            $elem
                .delegate("a.inline","mouseover",function(e){
                    var key = $(this).attr("href").slice(1);
                    clearTimeout(outTimer);
                    timer = setTimeout( _.curry(magnify,key,e), tolerance );
                })
                .delegate("a.inline","mouseout",function(){
                    clearTimeout(timer);
                    outTimer = setTimeout(function(){
                        if(popup) {
                            popup.fadeOut();
                        }
                    },tolerance);
                });
            
        },
        magnify = function(key,e) {
            var action = _.curry(pop,key,e);
            (popup !== undefined)
                ? popup.fadeOut("fast",action)
                : action();
        },
        pop = function(key,e) {
            var build = function(thing,image) {
                popup = $("<div/>",{
                    "class": "interlocution",
                    html: _.$flatten([
                        $("<a/>",{
                            text: thing.get("name"),
                            href: "/"+thing.key()
                        }),
                        $("<img/>",{
                            src: image.get("thumbnail")
                        })
                    ]),
                    css: {
                        top: e.pageY - 50,
                        left: e.pageX + 50
                    },
                    mouseout: function() {
                        var $this = $(this);
                        outTimer = setTimeout(function(){
                            $this.fadeOut();
                        },tolerance);
                    },
                    mouseover: function() {
                        clearTimeout(outTimer);
                    }
                }).appendTo($("body"));
            };
            _a.dataStore.get(key,function(thing){
                thing.get("frontispiece",function(img){
                    build(thing,img);
                },function(){ // error
                    build(thing,"");
                });
            });
        };
    
    _a.interlocute = function($elem) {
        interlocute($elem);
    };
    
})();