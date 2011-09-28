/*
    For easy interaction with keywords and image types
    on individual image pages
*/

(function(){
    
    var _a = Archmap,
        types = [ // hmm... kind of messy name confusions....
            { name: "imagetypes", resource: "catalog/types", tag: "strong" },
            { name: "lexiconentries", resource: "catalog/keywords", tag: "a" }
        ],
        auth = _a.user.data.auth_level,
        // convert list of words to jQuery collection of li's
        processList = function(words,appendTo,tag,callbacks) {
            return _.$flatten(_.map(words,function(word){
                var li = $("<li/>",{
                    html: $("<"+tag+"/>",{
                        href: "/"+word.key(),
                        text: word.get("name"),
                        data: { key: word.key() }
                    })
                });
                if(callbacks) {
                    _.each(callbacks,function(fn,name){
                        li.bind(name,fn);
                    });
                }
                return li;
            })).appendTo(appendTo);
        },
        allowDefaultText = function(input,callbacks) {
            var defaultText = input.attr("value");
            input
                .focus(function(){
                    if(input.attr("value") === defaultText) {
                        input.attr("value","").keyup();
                    }
                    callbacks.focus();
                })
                .blur(function(){
                    if(input.attr("value") === "") {
                        input.attr("value",defaultText);
                    }
                    callbacks.blur();
                })
                .parent().submit(function(){
                    callbacks.submit();
                    return false;
                });
        };
    
    _a.defineComponent({
        name: "KeywordComponent",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                this.rendered = false;
                this.loadTemplate(function(){
                    _a.IO.require([
                            "dependencies/LiveSearch",
                            "dependencies/Quicksilver"
                        ],function(){
                            that.defineHandles().addEditing().render();
                        });
                });
            },
            defineHandles: function() {
                var sandbox = this.sandbox,
                    currents = sandbox.find(".currents"),
                    choices = sandbox.find(".choices");
                // this.imagetypes, this.lexiconentries
                this.currents = {};
                this.choices = {};
                this.inputs = {};
                _.each(types,function(t){
                    this.currents[t.name] = currents.find("ul."+t.name);
                    this.choices[t.name] = choices.find("ul."+t.name);
                    this.inputs[t.name] = sandbox.find("input."+t.name);
                },this);
                return this;
            },
            addEditing: function() {
                if(auth > 2) {
                    // populate the lists
                    var that = this;
                    _.each(types,function(t){
                        _a.dataStore.get(t.resource,function(catalog){
                            var words = catalog.get("members"),
                                input = that.inputs[t.name],
                                ul = that.choices[t.name];
                            processList(words,ul,t.tag);
                            allowDefaultText(input,{
                                focus: function() {
                                    ul.fadeIn("fast");
                                },
                                blur: function(){
                                    ul.fadeOut("fast");
                                },
                                submit: function() {
                                    that.addKeyword( $(ul.find(":visible")[0]).text() );
                                }
                            });
                            input.liveUpdate(ul);
                        });
                    });
                    // listen for interaction with the results
                    this.sandbox
                        .delegate(".choices a","click",function(){
                            var keyword = $(this).text();
                            that.addKeyword(keyword);
                            return false;
                        });
                }
                else { // hide editing controls
                    this.sandbox.find(".choices").remove();
                }
                return this;
            },
            renderModel: function(model) {
                this.image = model;
                var that = this;
                _.each(types,function(t){
                    model.getFresh(t.name,function(words){
                        processList(words,that.currents[t.name],t.tag,{
                            mouseover: function() {
                                if(_a.user.data.auth_level > 2) {
                                    var $this = $(this),
                                        button = $this.find("button");
                                    (button.length > 0)
                                        ? button.show()
                                        : $this.append($("<button/>",{
                                            text: "-",
                                            click: function(){
                                                var $a = $(this).prev("a");
                                                that.image.removeKeyword($a.text());
                                                $a.parent().remove();
                                            }
                                        }));
                                }
                            },
                            mouseout: function() {
                                $(this).find("button").hide();
                            }
                        });
                    });
                });
            },
            addKeyword: function(keyword) {
                this.image.addKeyword(keyword);
                var provider = this.dataProvider;
                setTimeout(function(){ provider.refresh(); },100);
            },
            unrender: function() {
                _.each(this.currents,function(c){ c.empty(); });
            }
        }
    });
    
})();