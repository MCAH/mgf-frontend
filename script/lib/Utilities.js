/* Useful things that don't fit anywhere else */

// okay, this is hacky, but also makes life nice
String.prototype.contains = function(needle) {
    return ( this.indexOf(needle) >= 0 );
};

_.mixin({
    keyMap: function(obj, iterator, context) {
        var results = {};
        _.each(obj, function(value, key) {
            var res = iterator.call(context, value, key),
                has = _.bind(res.hasOwnProperty,res);
            (has("key") && has("value"))
                ? results[res.key] = res.value
                : (has("k") && has("v"))
                    ? results[res.k] = res.v
                    : results[key] = res;
        });
        return results;
    },
    keyZip: function(ks,vs) {
        return _.keyMap(ks,function(k,i){
            return { key: k, value: vs[i] };
        });
    },
    curry: function(fn) {
        var args = Array.prototype.slice.call(arguments,1);
        return function() {
            return fn.apply(window,args.concat(_.toArray(arguments)));
        };
    },
    // chain together an array of jquery elements in parallel in dom
    $flatten: function(list) {
        return _.foldr(list,function(acc,elem){
            return (acc) ? elem.after(acc) : elem;
        },null);
    }
});

(function(){
	
	var _a = Archmap;
	
	_a.Utilities = {
		isArray: function(thing) {
			return Object.prototype.toString.call(thing) === '[object Array]';
		},
		deaccent: function(string) {
		    var pairs = [
		        [ "É", "E" ], [ "é", "e" ],
		        [ "Á", "A" ], [ "á", "a" ],
		        [ "ê", "e" ], [ "è", "e" ],
		        [ "ô", "o" ], [ "â", "a" ],
		        [ "ç", "c" ], [ "î", "i" ],
		        [ "ù", "u" ], [ "û", "u" ],
		        [ "Â", "A" ], [ "Ô", "O" ]
		    ];
		    _.each(pairs,function(pair){
		        string = string.replace(pair[0],pair[1]);
		    });
		    return string;
		}
	};
	
})();