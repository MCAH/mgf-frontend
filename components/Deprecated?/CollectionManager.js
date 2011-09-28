/*
	Simple code for creating items
	and adding them to a collection
	// TODO: move into the listcomponent
*/

(function(){
	
	var _a = Archmap;
	
	_a.CollectionManager = function() { };
	
	_a.CollectionManager.prototype = new _a.GroupComponent();
	
	jQuery.extend(_a.CollectionManager.prototype,{
		start: function() {
			if(_a.user.data.auth_level < 2) {
				return; // quit
			}
			if(this.dataProvider.model.get("name").indexOf("Chronology") >= 0) {
				this.is_chronology = true;
				this.sandbox.append("<a href='#'>Add an Event to the Chronology</a>");
				var that = this;
				_a.dataStore.get(this.dataProvider.model.get("parent"),function(building){
					that.parent = building;
					$("div#unique-inner").append("<a href='/"+building.key()+"'>"+building.get("name")+"</a>");
				});
			}
			else {
				this.is_chronology = false;
				this.sandbox.append("<a href='#' class='add plussign'>Add Something to the Collection</a>");
			}
			this.listen();
		},
		listen: function() {
			var that = this;
			this.sandbox.find("a").click(function(e){
				_a.IO.require("components/Foundry",function(){
					var foundry = new _a.Foundry({ position:e });
					var collection = that.dataProvider.model;
					if(that.is_chronology) {
						foundry.start("HistoricalEvent");
						foundry.presetFields({
							lat: that.parent.get("lat"),
							lng: that.parent.get("lng")
						});
					}
					else {
						foundry.start();
					}
					foundry.addCallback(function(model){
						collection.add(model,true);
					});
				});
				return false; // for link behavior
			});
		}
	});
	
})();