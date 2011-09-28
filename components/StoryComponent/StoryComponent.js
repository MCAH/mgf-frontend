/*
	Storytelling sidebar for telling stories!
	got the smarts to remember
*/

(function(){
	
	var _a = Archmap;
	
	_a.StoryComponent = function() { };
	
	_a.StoryComponent.prototype = new _a.GroupComponent();
	
	jQuery.extend(_a.StoryComponent.prototype,{
		start: function() {
			this.chapters = []; // each "chapter" (collection) goes here
			var that = this;
			_a.IO.getComponentHtml("StoryComponent",function(html){
				that.sandbox.append(html);
				// we would like to 
				that.slideSpace = that.sandbox.find("div.space");
				that.inside = that.sandbox.find("div.inside");
				that.descript = that.inside.find("div.main_descript");
				that.paragraphs = that.inside.find("div.paragraphs");
				that.inside.find("strong.stepper").css("display","none");
				that.buttons = {
					big: that.inside.find("strong.stepper"),
					prev: that.inside.find("span.mover.prev"),
					next: that.inside.find("span.mover.next")
				};
				that.titlebar = that.inside.find("span.title");
				that.buttons.big.css("display","none");
				that.buttons.prev.css("display","none");
				that.resize();
				that.render();
				that.listen();
			});
		},
		resize: function() {
			var padding = parseInt(this.inside.css("paddingTop"),10)*2;
			var margin = parseInt(this.inside.css("marginTop"),10)*2;
			this.inside.height(this.sandbox.height() - padding - margin);
		},
		renderModel: function(model) {
			if(model == _a.provider()) {
				this.mainModel = model;
				this.currentIndex = -1;
				//this.descript.prepend("<h3>"+model.get("name")+"</h3>");
				var that = this;
				model.get("descript",function(descript){
					that.changeText({
						header: model.get("name"),
						descript: descript,
						key: model.key()
					});
					that.buttons.big.fadeIn();
				});
				model.iterateMembers(function(i,member){
					that.chapters.push(member);
				});
			}
			else {
				this.chapters.push(model.getReceipt());
			}
		},
		listen: function() {
			var that = this;
			this.buttons.big.click(function(){ // "play" button
				that.changeChapter(1);
			});
			this.buttons.prev.click(function(){ // backward button
				that.changeChapter(-1);
			});
			this.buttons.next.click(function(){ // forward button
				that.changeChapter(1);
			});
		},
		changeChapter: function(increment,callback,preventSubfocus,speed) {
			if(speed === undefined) { speed = "normal"; }
			this.currentIndex += increment; // increment can be negative
			if(this.currentIndex === -1) {
				this.buttons.prev.fadeOut();
				this.slipSlideAway(false,{
					key: this.mainModel.key(),
					descript: this.mainModel.get("descript"), // sync is safe!
					header: this.mainModel.get("name"),
					title: "Introduction",
					callback: callback,
					speed: speed
				});
				if(preventSubfocus === undefined) {
					this.unsubfocusModel(undefined); // meaning all
				}
			}
			else {
				this.buttons.prev.fadeIn();
				var chapter = this.chapters[this.currentIndex];
				var that = this;
				if(preventSubfocus === undefined) {
					var newCallback = function() {
						that.subfocusModel(chapter.key());
						if(typeof(callback) === "function") {
							callback();
						}
					};
				}
				else {
					var newCallback = callback;
				}
				// no longer async because async was having wacky recursive problem....
				// should be looked into
				var descript = chapter.get("descript");
				this.slipSlideAway((increment > 0),{
					key: chapter.key(),
					descript: descript,
					header: chapter.get("name"),
					title: this.mainModel.get("name")+", Part "+(that.currentIndex+1),
					callback: newCallback,
					speed: speed
				});
			}
			// make sure the correct buttons are showing
			if(this.currentIndex + 1 >=  this.chapters.length) {
				this.buttons.next.fadeOut();
				this.buttons.big.fadeOut();
			}
			else {
				this.buttons.next.fadeIn();
				this.buttons.big.fadeIn();
			}
		},
		slipSlideAway: function(forwards,options) {
			var width = this.inside.width(); // attempting to make the width of the inside permanent
			//var width = this.sandbox.width();
			this.inside.width(width);
			this.slideSpace.width(10000);
			var copy = this.inside.clone();
			if(forwards === true) {
				this.inside.before(copy); // we won't see it as we change it, because it got pushed
			}
			else {
				this.inside.after(copy);
				this.inside.css("marginLeft",-(width*1.2)); // so it can't be seen
			}
			this.changeText(options);
			var that = this;
			if(forwards === true) {
				copy.animate({marginLeft:-(width*1.2)},options.speed,function(){
					copy.remove();
					that.inside.css("marginLeft",10);
					if(typeof(options.callback) === "function") {
						options.callback();
					}
				});
			}
			else {
				this.inside.animate({marginLeft:10},options.speed,function(){
					copy.remove();
					if(typeof(options.callback) === "function") {
						options.callback();
					}
				});
			}
		},
		changeText: function(options) {
			var h3 = this.descript.find("h3");
			h3.html(options.header);
			_a.EditorialBoard.makeClickableEditable({
				element: h3,
				field: "name",
				model: options.key
			});
			var p = $("<p/>",{ html: options.descript });
			_a.EditorialBoard.makeHoverableEditable({
				element: p,
				field: "descript",
				model: options.key
			});
			if(this.scrollable === undefined) {
				this.scrollable = new _a.Elements.ScrollableDiv({
					appendTo: this.paragraphs,
					contents: p,
					height: this.sandbox.height() * 0.5
				});
			}
			else {
				this.scrollable.replaceHtmlWith(p);
			}
			this.titlebar.html(options.title);
		},
		highlightModel: function(key) {
			// should only actually rollback if the selected thing is not in the collection
			this.rollback(); // if someone highlights a model, roll back the slides!
		},
		rollback: function() {
			var that = this;
			if(this.currentIndex > -1) {
				this.changeChapter(-1,function(){
					that.rollback(); // key doesn't matter
				},true,"fast");
			}
		}
	});
	
})();