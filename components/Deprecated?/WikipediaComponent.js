/*
	Add information on a person/thing by pulling
	that information from wikipedia
*/

(function(){
	
	var _a = Archmap;
	
	_a.WikipediaComponent = function() { };
	
	_a.WikipediaComponent.prototype = new _a.SingletonComponent();
	
	jQuery.extend(_a.WikipediaComponent.prototype,{
		start: function() {
			this.dom = $("div#WikipediaComponent");
			this.dom.append("<div class='wiki-inner'></div>");
			var thing = _a.dataStore.dataProvider.model;
			var wikipedia = thing.get("wikipedia");
			var that = this;
			if(wikipedia) {
				setTimeout(function(){
					that.scrape(thing,wikipedia);
				},1000);
			}
		},
		scrape: function(thing,wikipedia) {
			this.thing = thing;
			this.wikipedia = wikipedia;
			var that = this;
			var wiki = "http://en.wikipedia.org/wiki/"+this.wikipedia;
			var query = "SELECT * FROM html WHERE url = '"+wiki+"'";
			var yql = "http://query.yahooapis.com/v1/public/yql?q="+query;
			$.ajax({ // now get the actual page
				url: yql,
				success: function(data) {
					that.display(data);
				}
			});
		},
		display: function(data) {
			var that = this;
			$(data).find("table.infobox.vcard").find("img:first").each(function(){
				var src = $(this).attr("src");
				that.dom.append("<img width=100 src='"+src+"'/>");
			});
		}
	});
	
})();