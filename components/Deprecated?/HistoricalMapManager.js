/*
	Thing to allow editing of vector data associated
	with a historical map
	very minimal (hopefully!)
*/

(function(){
	
	var _a = Archmap;
	
	_a.HistoricalMapManager = function() { };
	
	_a.HistoricalMapManager.prototype = {
		initialize: function() {
			this.dom = $("div#HistoricalMapManager");
			this.dom.append("<a href='#trace-a-place'>Add a Place to the Map</a>");
			this.listen();
		},
		listen: function() {
			var that = this;
			this.dom.find("a").click(function(){
				_a.require("components/Foundry",function(){
					var foundry = new _a.Foundry();
					// I apologize! (there should be a good way of doing this)
					// UGLY
					var collection_id = _a.dataStore.dataProvider.model.data.shapes.Collection.id;
					var collection = _a.dataStore.get("collection/"+collection_id);

					foundry.start("Place");
					foundry.addCallback(function(model){
						// need to define what the current collection is
						// also needs to not reset the entire
						_a.log("calling back");
						_a.log("---");
						_a.log(model);
						collection.add(model,true);
					});
				});
				return false;
			});
		}
	};
	
})();