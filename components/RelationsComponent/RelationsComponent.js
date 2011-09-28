/*  puts together several list components,
    one for each relation */
    
(function(){
    
    var _a = Archmap;
    
    _a.defineComponent({
        name: "RelationsComponent",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                _a.IO.getComponentHtml("RelationsComponent",function(html){
                    that.sandbox.append(html);
                    _a.IO.require("components/ListComponent",function(){
                        that.addInteraction().render();
                    });
                });
            },
            addInteraction: function() {
                this.sandbox.delegate("h5","click",function(){
                    if($(this).next().is(":visible")) { // bring it up
                        $(this).removeClass("open").next().slideUp("fast");
                    }
                    else { // drop it down
                        $(this).addClass("open").next().slideDown("fast");
                    }
                });
                return this;
            },
            renderModel: function(model) {
                var that = this;
                this.lists = [];
                model.get("relations",function(relations){
                    $.each(relations,function(i,relation){
                        var goodtitle = relation.get("name").replace("DEFAULT:","");
                        if(goodtitle === "images") {
                            return;
                        }
                        _a.dataStore.getMetaForModelAndField(model.getType(),goodtitle,function(meta){
                            var length = relation.get("members").length;
                            if(length === 0 && meta.get("auth_level") > _a.user.data.auth_level) {
                                return;
                            }
                            if(goodtitle == "my_collections" && _a.user.data.id != model.get("id")) {
                                return;
                            }
                            var drawer = $("<div/>",{ "class": "drawer" }),
        		                sandbox = $("<div/>",{ "class": "ListComponent nonames" }),
        		                title = $("<h5/>", { text: meta.get("descript") }),
        		                listComp = new _a.ListComponent({
        		                    sandbox: sandbox,
        		                    provider: relation
        		                });
        		            // prepare the drawer
        		            drawer.prepend(title)
        		                .prepend("<span class='num'>( "+length+" )</span>")
        		                .append(sandbox);
        		            that.sandbox.append(drawer);
        		            that.lists.push(listComp);
    		            });
                    });
                });
            }
        }
    });
    
})();