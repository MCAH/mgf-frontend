/*
	Component for live-searching the database
	should be a simple layer that can be extended from
*/

(function(){
	
	var _a = Archmap;
	
	_a.LiveSearch = function(params) {
	    if(params !== undefined) {
	        this.initialize(params);
	    }
	};
	
	_a.LiveSearch.prototype = {
		/*
		    @input -- an input dom element
		    @url -- to generate the url to get
		    @params -- to generate extra params (optional)
		    @response -- what to do with the response
		    @clear -- what to clear when clearing should happen
		*/
		initialize: function(params) {
			var input = params.inputHandle,
			    urlFn = params.url,
			    paramsFn = params.params || function(){ }, // bad idea?
			    responseFn = params.response,
			    clearFn = params.clear,
			    lastSearch = "", // buffer
			    waiter = undefined; // timer
			this.input = input; // to remember in empty?
			input.keyup(function(){
				clearTimeout(waiter);
				waiter = setTimeout(function(){
					var value = input.attr("value");
					if(value === lastSearch) {
					    return;
					}
					if(value === "") {
					    clearFn();
					    return;
					}
					lastSearch = value;
					if(value.length < 3) {
						return;
					}
					var resource = urlFn(value);
					var urlParams = paramsFn(value);
					//_a.dataStore.get(resource,function(search){
					//    _a.log(search);
					//});
					/*
					_a.IO.getJSONModel(resource,function(data,yield){
					    alert("called back");
					});
					*/
					
					_a.IO.getJSONModel(resource,function(data,yield){
					    //alert("calling back");
						var method = data.archmap_says.method;
						if(method == "shortlist") {
						    method = "quicksearch";
						}
						responseFn(yield.get(method),yield);
					},true,urlParams); // true for get fresh
					
				},100);
			});
			input.keydown(function(){
				clearTimeout(waiter);
			});
		},
		empty: function() {
			this.input.attr("value","");
		}
	};
	
})();