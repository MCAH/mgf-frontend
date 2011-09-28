/*
	Component for one-off image uploading
*/

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "UploadComponent",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			var that = this;
    			if(_a.user.data.auth_level < 2) {
    				delete this;
    				return; // not authorized to use this component
    				/*
    					and you may be thinking to yourself, that doesn't look secure!
    					and you'd be right, it's not. But the php code that this js points
    					to is secure, so, like, CHILL dude
    				*/
    			}
    			_a.IO.getComponentHtml("UploadComponent",function(html){
    				_a.IO.require("dependencies/Forms",function(){ // jquery form plugin
    					that.sandbox.append(html);
    					that.defineHandles().listen().render();
    				});
    			});
    		},
    		defineHandles: function() {
    			this.button = this.sandbox.find("button.upload");
    			this.form = this.sandbox.find("div.hidden form");
    			return this;
    		},
    		listen: function() {
    			var that = this;
    			// reveal the form
    			this.button.click(function(){
    				that.form.parent().slideDown();
    			});
    			// submit the form with ajax
    			var form = this.form;
    			form.submit(function(){
    			    $(this).parent().slideUp();
    				$(this).ajaxSubmit({
    					success: function(text) {
    						that.sandbox.find("img").remove();
    						that.model.getFresh(that.listName,function(links){
    							links.iterateMembers(function(i,link){
    								that.addImage(link);
    							});
    						});
    					}
    				});
    				return false; // keep us where we are!
    			});
    			return this;
    		},
    		renderModel: function(model) {
    			this.model = model;
    			var name = model.get("name");
    			if(model.isOfType("Person")) {
    				name = model.get("firstname");
    			}
    			this.button.text(this.button.text()+" of "+name);
    			this.form.find("input[name='parent']").attr("value",model.key());
    			this.listName = (model.isOfType("Building"))
    			    ? "other_images" : "images";
    			var that = this;
    			model.get(this.listName,function(links){
    				links.iterateMembers(function(i,link){
    					that.addImage(link);
    				});
    			});
    		},
    		addImage: function(image) {
    			this.sandbox.append($("<a/>",{
    				href: "/"+image.key(),
    				html: $("<img/>",{
    					src: image.get("thumbnail")
    				})
    			}));
    		}
	    }
	});
	
})();