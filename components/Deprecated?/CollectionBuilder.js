/*

	Macro environment for building collections
	delegates to everything else

*/

(function(){
	
	var _a = Archmap;
	
	_a.CollectionBuilder = function() { };
	
	_a.CollectionBuilder.prototype = {
		initialize: function() {
			this.dom = $("div#collection_builder");
			this.drop = this.dom.find("div#drop ul");
			this.listen();
			var that = this;
			_a.require("components/LiveSearch",function(){
				that.setup();
			});
		},
		listen: function() {
			var that = this;
			$("ul#collection_select li a").live("click",function(){
				var selected_collection = $(this).attr("href");
				that.setCurrentCollection(selected_collection);
				return false;
			});
			_a.require("dependencies/DragDropSort",function(){
				$("ul#collection_select li a").each(function(){
					that.makeDroppable($(this));
				});
			});
			// code for initiating a new
			this.dom.find("a[href='#newCollection']").click(function(){
				if(_a.user.data.auth_level < 2) {
					alert("You must be logged in!");
					return false;
				}
				_a.require("components/Foundry",function(){
					var foundry = new _a.Foundry();
					foundry.start("Collection");
					foundry.addCallback(function(model){
						// append the new collection to the collection-list
						$("ul#collection_select").append(
							"<li><a href='"+model.key()+"'>"+model.get("name")+"</a></li>");
						var link = $("ul#collection_select a:last");
						// make sure we can drop stuff on it
						that.makeDroppable(link);
						// and display it
						link.trigger("click");
					});
				});
				return false; // for link-behavior
			});
			this.dom.find("a[href='#new']").click(function(){
				if(_a.user.data.auth_level < 2) {
					alert("You must be logged in!");
					return false;
				}
				if(that.current_collection === undefined) {
					alert("You must select a collection to edit!");
					return false;
				}
				that.foundry = undefined; // clear it
				that.dom.find("#add").empty(); // empty the form area
				_a.require("components/Foundry",function(){
					that.foundry = new _a.Foundry();
					that.foundry.start();
					that.foundry.addCallback(function(model){
						that.addToCollection(model,that.current_collection);
					});
				});
				return false; // for link-behavior
			});
		},
		makeDroppable: function(clctn) {
			var collection_key = clctn.attr("href");
			clctn.droppable({
				hoverClass: "hovering",
				accept: "li.listed-model",
				drop: function(ev,ui) {
					_a.dataStore.get(collection_key,function(collection){
						var model = _a.dataStore.get(ui.draggable.attr("rel"));
						collection.add(model,false);
						ui.draggable.fadeOut();
					});
				}
			});
		},
		setCurrentCollection: function(key) {
			this.live.empty();
			var that = this;
			_a.dataStore.get(key,function(collection){
				that.populateCurrentCollection(collection);
			});
		},
		populateCurrentCollection: function(collection) {
			//_a.triggerEvent("osmPlease");
			this.current_collection = collection;
			_a.triggerEvent("changeDataProvider",[collection]);
		},
		setup: function() {
			this.live = new _a.LiveSearch();
			this.finder = this.dom.find("input#finder");
			var that = this;
			var currentProvider = _a.provider();
			this.live.initialize(this.finder,
				function(term){ return "search/"+term; },
				function(results,search){
					//_a.log(search);
					_a.triggerEvent("changeDataProvider",[search]);
					//that.render(results);
				},
				function() { // what to do when search clears out
					_a.triggerEvent("changeDataProvider",[currentProvider]);
				}
			);
		},
		render: function(results) {
			this.drop.empty();
			for(var r in results) {
				this.renderModel(results[r],this.drop);
			}
			// let em drag!
			this.drop.find("li").draggable({
				revert: "invalid"
			});
		},
		renderModel: function(model,where) {
			var html = "<li class='newitem' rel='"+model.key()+"'>"
				+"<em>"+model.type+"</em> <a target='_blank' href='"+model.type+"/"+model.get("id")+"'>"
				+model.get("name")+"</a>";
			html += "</li>";
			where.append(html);
		},
		add: function(element) {
			var that = this;
			_a.dataStore.get(element.attr("rel"),function(model){
				that.addToCollection(model,that.current_collection);
			});
			element.fadeOut(); // get rid of the original
		},
		addToCollection: function(model,collection) {
			collection.add(model,true);
		},
		clear: function() {
			this.drop.empty();
		}
	};
	
})();