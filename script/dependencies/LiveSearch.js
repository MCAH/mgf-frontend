// a john resig port of quicksilver searching
// modified for archmap use

jQuery.fn.liveUpdate = function(list){
	list = jQuery(list);

	if ( list.length ) {
		var rows = list.children('li'),
			cache = rows.map(function(){
				return this.innerHTML.toLowerCase();
			});
			
		this.keyup(filter)
			.keyup()
			.parents('form').submit(function(){
				return false;
			});
	}
		
	return this;
	// weird.... hoisting from beyond the return, I dig it
	function filter() {
		var term = jQuery.trim( jQuery(this).val().toLowerCase() ),
		    scores = [];
		
		if ( !term ) {
			rows.show();
		} else {
			rows.hide();

			cache.each(function(i){
				var score = this.score(term); // score function from dependencies/Quicksilver.js
				if (score > 0) { scores.push([score, i]); }
			});

			jQuery.each(scores.sort(function(a, b){return b[0] - a[0];}), function(){
				jQuery(rows[ this[1] ]).show();
			});
		}
	}
};