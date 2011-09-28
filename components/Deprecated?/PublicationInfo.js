/* Getting and setting publication info using Google Books or JSTOR */

(function(){
	
	var _a = Archmap;
	
	_a.PublicationInfo = function() { };
	
	_a.PublicationInfo.prototype = new _a.GroupComponent();
	
	jQuery.extend(_a.PublicationInfo.prototype,{
		start: function() {
			var that = this;
			_a.IO.getComponentHtml("PublicationInfo",function(html){
				that.sandbox.append(html);
				that.defineHandles().listen().render();
			});
		},
		defineHandles: function() {
			this.google = this.sandbox.find(".google");
			this.results = this.sandbox.find(".results").find("ul");
			return this;
		},
		listen: function() {
			var that = this;
			this.google.submit(function(){
				that.searchGoogle($(this).find("input").attr("value"));
				return false;
			});
			return this;
		},
		renderModel: function(model) { // should just be the book itself
			this.mainModel = model;
			this.google.find("input").attr("value",model.get("name"));
		},
		searchGoogle: function(searchString) {
			var that = this;
			$.ajax({
				url: encodeURI("/scripts/books.php?q="+searchString),
				success: function(response) {
					that.printGoogleResults(response);
				}
			});
		},
		printGoogleResults: function(response) {
			this.results.empty();
			var that = this;
			$(response).find("entry").each(function(){
				var ids = [];
				var isbn = undefined;
				var goog = undefined;
				$(this).find("identifier").each(function(){
					if(goog === undefined) {
						goog = $(this).text();
					}
					var id = $(this).text();
					ids.push(id);
					//if(id.match(/^ISBN/)) {
					//	isbn = id;
					//}
				});
				_a.log("-------");
				_a.log($(this).children("title").text());
				_a.log(ids);
				that.results.append($("<li/>",{
					html: $("<a/>",{
						href: "#",
						text: $(this).children("title").text(),
						click: function() {
							return false;
						}
					})
				}));
			});
		}
	});
	
})();
