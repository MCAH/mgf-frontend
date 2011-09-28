/* for viewing and updating the bibliography of an item */

(function(){
	
	var _a = Archmap;
	
	_a.BibliographyComponent = function() { };
	
	_a.BibliographyComponent.prototype = new _a.GroupComponent();
	
	jQuery.extend(_a.BibliographyComponent.prototype,{
		start: function() {
			this._editingEnabled = false;
			if(_a.user.data.auth_level > 1) { // cosmetic authorization
				this._editingEnabled = true;
			}
			var that = this;
			_a.IO.getComponentHtml("BibliographyComponent",function(html){
				that.sandbox.append(html);
				that.defineHandles().listen().enableEditing().render();
			});
		},
		defineHandles: function() {
			return this;
		},
		renderModel: function(model) { // the top-level thing
			
		},
		enableEditing: function() {
		    // prepend a button for adding stuff to the bibliography
			return this;
		}
	});
	
})();