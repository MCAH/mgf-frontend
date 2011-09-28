/*
	Super-secret component for finding images
	of the church on flickr
*/

(function(){
	
	var _a = Archmap;
	
	_a.FlickrImages = function() { };
	
	_a.FlickrImages.prototype = new _a.SingletonComponent();
	
	jQuery.extend(_a.FlickrImages.prototype,{
		start: function() {
			this.dom = $("div#FlickrImages");
			this.dom.append("<h3>Images from Flickr</h3>");
			this.dom.addClass("clear");
			if(_a.user.data.auth_level >= 0) { // make sure you're me!
				var that = this;
				setTimeout(function(){
					that.grabImages();
				},2000);
			}
		},
		grabImages: function() {
			var thing = _a.dataStore.dataProvider.model;
			var params = { method: "flickr.photos.search",
				api_key: "32f0ecf935b266299d47bb70e4982761", tags: "church",
				lat: thing.get("lat"), lon: thing.get("lng"), radius: "2km",
				per_page: 35, format: "json", jsoncallback: "?"
			};
			var string = "";
			for(var p in params) { string += p+"="+params[p]+"&"; }
			var that = this;
			$.getJSON("http://api.flickr.com/services/rest/?"+string,function(data){
				for(var p in data.photos.photo) {
					that.displayImage(data.photos.photo[p]);
				}
			});
		},
		displayImage: function(image) {
			var farmLink = "http://farm"+image.farm+".static.flickr.com/"
				+image.server+"/"+image.id+"_"+image.secret+"_s.jpg";
			var linkBack = 'http://flickr.com/photos/'+image.owner+'/'+image.id+'/';
			this.dom.append("<a href='"+linkBack+"'><img src='"+farmLink+"'/></a>");
		}
	});
	
})();