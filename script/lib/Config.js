/* Configuration options (changes with skin) */

(function(){
	
	var _a = Archmap;
	
	_a.Config = {
	    abbrevs: {
		    building: "b",
		    buildings: "b",
		    place: "pl",
		    places: "pl",
		    socialentity: "se",
		    socialentities: "se",
		    image: "i",
		    images: "i",
		    word: "w",
		    words: "w",
		    lexiconentry: "w",
		    lexiconentries: "w"
	    },
		markers: {
			shapes: {
				arrow: "M 5 10 L 14 10 12 8 12 12 14 10 12 8 14 10",
				arrowColor: "#89e",
				arrowHead: "M 14 10 L 12 8 12 12 14 10 12 8"
			},
			colors: {
				defaultIcon: "darkslateblue",
				iconHover: "yellow",
				iconHighlight: "firebrick"
			}
		},
		texts: {
			mapMarkerHoverTipText: "Click the marker to find out more. Double-click to visit the monograph.",
			mapMultiMarkerHoverTipText: "Shift-click this church to compare it the others in the sidebar."
		},
		maps: {
			getGoogleMapOptions: function() { // and how would you like the map to look initially?
				// put it in a return so we don't get namespace/loading issues, ya dig?
				// (ie the code won't evaluate until we return)
				return {
					center: new google.maps.LatLng(48.0,2.0),
					zoom: 6,
					mapTypeId: google.maps.MapTypeId.TERRAIN,
					mapTypeControl: false,
					navigationControl: false,
					disableDefaultUI: true
				};
			},  
			googleMapStylers: {
			    landscape: { visibility: "on", hue: "#00ff09" },
			    water: { visibility: "simplified", hue: "#7700aa", lightness: 100 }
			},
			historicalMapCollection: "collection/182",
			zoomInButtonImage: "/media/ui/zoom_in_alt.png",
			zoomOutButtonImage: "/media/ui/zoom_out_alt.png",
			zoomInButtonImageSmall: "/media/ui/zoom_in_small.png",
			zoomOutButtonImageSmall: "/media/ui/zoom_out_small.png"
		},
		hints: {
			
		}
	};
	
})();