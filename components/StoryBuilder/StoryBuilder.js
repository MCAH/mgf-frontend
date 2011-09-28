/*
	a thing that lets you _seamlessly_ build stories
	kind of intricately involved with the pre-printed html
	in a way that begs... should this be done some other way?
	this is not really a component.... it's like.... hmmm....
	this should be reconsidered I guess... probably not though
*/

(function(){
	
	var _a = Archmap;
	
	_a.StoryBuilder = function() { };
	
	_a.StoryBuilder.prototype = new _a.GroupComponent();
	
	jQuery.extend(_a.StoryBuilder.prototype,{
		start: function() {
			var that = this;
			_a.IO.getComponentHtml("StoryBuilder",function(html){
				that.sandbox.append(html);
				that.defineHandles().listen().render();
			});
		},
		defineHandles: function() {
			this.buttons = {
				start: this.sandbox.find("a.start"),
				add: this.sandbox.find("a.add")
			};
			this.playground = this.sandbox.find("div.playground");
			this.goToStage("home");
			return this; // chaining
		},
		renderModel: function(model) {
			if(model.isOfType("Story")) {
				this.setStory(model);
				this.goToStage("one-editing");
			}
		},
		goToStage: function(stage) {
			switch(stage) {
				case "home":
					this.playground.css("display","none");
					this.buttons.start.css("display","block");
					return;
				case "editing":
					this.playground.css("display","block");
					return;
				case "one-editing":
					this.buttons.start.css("display","none");
					this.playground.css("display","block");
					return;
				default:
					return;
			}
		},
		listen: function() {
			var that = this;
			var buttons = this.buttons;
			// what happens when you start a collection
			buttons.start.click(function(){ // same thing for new or edit
				_a.IO.require("components/Foundry",function(){
					var foundry = new _a.Foundry();
					foundry.start("Collection"); // should be "Story"
					foundry.addCallback(function(model){
						that.setStory(model);
						that.goToStage("editing");
					});
				});
				return false; // prevent default behavior
			});
			// what happens when you click "add"
			buttons.add.click(function(e){
				that.addChapter(e);
				return false;
			});
			return this; // chaining
		},
		setStory: function(story) {
			// model-holding necessary
			this.storyBeingEdited = story;
			_a.EditorialBoard.bindModel(this.playground,story);
			this.playground.find("h3")
				.html("<div rel='name' class='editable clickable'>"+story.get("name")+"<div>");
			this.playground.find("h5 a").attr("href","/story/"+story.get("id"));
			var that = this;
			story.get("descript",function(descript){
				that.playground.find("div.descript")
					.html(descript)
					.attr("rel","descript")
					.addClass("editable").addClass("hoverable");
			});
			this.playground.find("ul").empty();
			story.iterateMembers(function(i,chapter){
				that.displayChapter(chapter);
			});
		},
		displayChapter: function(chapter) {
			var li = _a.Elements.UIStuff.expandableListItem({
				visible: "<h4><div rel='name' class='editable clickable'>"+chapter.get("name")+"</div></h4>",
				hidden: "<div rel='descript' class='editable hoverable'>"+chapter.get("descript")+"</div>"
			});
			_a.EditorialBoard.bindModel(li,chapter);
			this.playground.find("ul").append(li);
			$("html").trigger("HTMLUpdated"); // so editing functions take note
		},
		addChapter: function(e) {
			var that = this;
			_a.IO.require("components/Foundry",function(){
				var foundry = new _a.Foundry({ position:e });
				foundry.start("Collection"); // should be Chapter
				foundry.addCallback(function(chapter){
					//alert(that.storyBeingEdited.key());
					//alert(chapter.key());
					that.storyBeingEdited.add(chapter,false,function(){
						that.displayChapter(chapter);
					});
				});
			});
		}
	});
	
})();