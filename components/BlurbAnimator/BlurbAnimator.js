(function(){
    
    var _a = Archmap,
        $w = $(window);
    
    _a.defineComponent({
        name: "BlurbAnimator",
        extend: "GroupComponent",
        methods: {
            start: function() {
                this.loadTemplate(function(){
                    this.defineHandles().bindClicks().render();
                });
            },
            defineHandles: function() {
                this.i = -1;
                this.blurb = this.sandbox.find(".blurb");
                this.blurbText = this.blurb.find(".padding");
                this.darkness = this.sandbox.find(".darkness"); // overlay
                this.buttons = {
                    prev: this.sandbox.find(".prev"),
                    next: this.sandbox.find(".next")
                };
                return this;
            },
            bindClicks: function() {
                // next and prev buttons
                var that = this;
                _.each(this.buttons,function(h,k){
                    h.click(function(){
                        that.move( (k === "prev") ? -1 : 1 );
                    });
                });
                // hover the names of things in the sidetext
                var stage = $("div#stage");
                this.blurbText
                    .delegate("a.inline","mouseover",function(){
                        stage.trigger("glowHoverOn",[$(this).attr("href").slice(1)]);
                    })
                    .delegate("a.inline","mouseout",function(){
                        stage.trigger("glowHoverOff");
                    });
                return this;
            },
            renderModel: function(model) {
                if(model.isProvider()) {
                    this.members = model.get("members");
                    this.model = model;
                    // update the preview text (mebbe better way to do this?)
                    //this.updateParagraphWith(model);
                    var that = this;
                    this.darkness
                        .appendTo($("body"))
                        .height($w.height())
                        .find(".blockout")
                            .width($w.width()-400)
                            .height($w.height()-200)
                            .find("div")
                                .html(_a.EditorialBoard.editableParagraph(
                                        model, "descript", model.get("descript")
                                    ))
                                .prepend($("<h3/>",{ text: model.get("name") }))
                                .append($("<strong/>",{
                                    "class": "begin",
                                    text: "Begin",
                                    click: function(){
                                        that.darkness.fadeOut("slow",function(){
                                            that.buttons.next.click();
                                        });
                                    }
                                }))
                            .end()
                        .end()
                        .fadeIn();
                }
            },
            updateParagraphWith: function(model) {
                var that = this;
                model.get("descript",function(d){
                    var p = _a.EditorialBoard.editableParagraph(model,"descript",d);
                    that.blurbText.slideUp(700,function(){
                        $(this).empty().append(p).slideDown(700);
                    });
                });
            },
            highlightModel: function(key) {
                this.updateParagraphWith(_a.dataStore.get(key));
            },
            move: function(inc) {
                var i = this.i,
                    members = this.members,
                    length = members.length,
                    that = this,
                    t = i + inc;
                if(t >= length || t < 0) {
                    return false;
                }
                else {
                    i += inc;
                    this.selectModel(members[i]);
                }
                this.i = i;
            }
        }
    });
    
})();