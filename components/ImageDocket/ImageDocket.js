/* shows all the images for something */

(function(){
	
	var _a = Archmap;
	
	_a.defineComponent({
	    name: "ImageDocket",
	    extend: "GroupComponent",
	    methods: {
	        start: function() {
    			var that = this;
    			_a.IO.getComponentHtml("ImageDocket",function(html){
    				that.sandbox.append(html);
    				that.defineHandles().render();
    			});
    		},
    		defineHandles: function() {
    			this.loaders = this.sandbox.find("ul.loaders");
    			return this;
    		},
    		renderModel: function(model) {
    			var that = this;
    			var imageDrop = $("<div/>",{ "class": "imageDrop" });
    			var name = $("<span/>",{
    				"class": "title",
    				text: "All Images of "+model.get("name")
    			});
    			var expandable = _a.Elements.UIStuff.expandableListItem({
    				visible: name,
    				hidden: imageDrop,
    				trigger: name,
    				open: function() {
    					if(imageDrop.find("img").length == 0) { // already loaded
    						that.loadImagesForModel(model,imageDrop);
    					}
    				}
    			});
    			this.loaders.append(expandable);
    		},
    		loadImagesForModel: function(model,imageDrop) {
    			var that = this;
    			var width = imageDrop.width() - 50;
    			model.get("images",function(images){
    				$.each(images,function(i,image){
    					var img = $("<img/>",{
    					  data: { image: image }
    					}); // for resizing
    					image.fitToSpace(300,width,img);
    					imageDrop.append($("<a/>",{
    						"class": "docket-image-link biggable",
    						href: "/"+image.key(),
    						html: img
    					}));
    				});
    			});
    		}
	    }
	});
	
})();