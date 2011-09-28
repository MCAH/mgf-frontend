/*
	With me, you can choose a collection
	from a dropdown menu, and the current
	collection in the dataprovider will change
*/

(function(){
	
	var _a = Archmap;
	
	_a.CollectionChooser = function() { };
	
	_a.CollectionChooser.prototype = new _a.GroupComponent();
	
	jQuery.extend(_a.CollectionChooser.prototype,{
		start: function() {
			this.sandbox.append("<ul></ul>");
			this.ul = this.sandbox.find("ul");
			this.setCurrent();
			if(window.location.href.indexOf("you") >= 0) {
				this.setChoices("catalog/collection/yours");
			}
			else {
				this.setChoices("collection/289");
			}
		},
		setCurrent: function() {
			this.sandbox.prepend("<div class='current'><em>Currently Viewing</em> "
				+"<strong>"+_a.provider().get("name")+"</strong></div>");
			// dropdown functionality
			var that = this;
			this.sandbox.find("div.current").click(function(){
				if(that.ul.css("display") == "none") {
					that.ul.slideDown();
				}
				else {
					that.ul.slideUp();
				}
			});
		},
		setChoices: function(collectionName) {
			var that = this;
			_a.dataStore.get(collectionName,function(collection){
				collection.iterateChildren(function(i,child){
					that.addChoice(child);
				});
				// listen for a click on a new data provider option
				var timer = undefined;
				that.sandbox.find("li a").click(function(){
					_a.dataStore.get($(this).attr("href"),function(collection){
						that.sandbox.find("div.current strong").text(collection.get("name"));
						_a.triggerEvent("changeDataProvider",[collection]);
					});
					return false;
				}).mouseover(function(){
					var that = this;
					clearTimeout(timer);
					timer = setTimeout(function(){
						_a.dataStore.get($(that).attr("href"),function(collection){
							collection.get("descript",function(descript){
								$(that).parent().append("<div class='infobox'>"+descript+"</div>");
								$(that).parent().find("div.infobox").fadeIn("fast");
							});
						});
					},300);
				}).mouseout(function(){
					clearTimeout(timer);
					$(this).parent().find("div.infobox").fadeOut(
						"fast",function(){ $(this).remove(); });
				});
			});
		},
		rerender: function() {
			
		},
		addChoice: function(collection) {
			this.ul.append("<li><a href='"+collection.key()+"'>"+collection.get("name")+"</a></li>");
		},
		highlightModel: function() {
			this.ul.slideUp();
		}
	});
	
})();