(function(){
    
    var _a = Archmap,
        yearStep = 10,
        yearWidth = 50,
        kings = "socialentity/156";
    
    _a.defineComponent({
        name: "SimpleTimeline",
        extend: "GroupComponent",
        methods: {
            start: function() {
                var that = this;
                this.loadTemplate("SimpleTimeline",function(){
                    that.defineHandles().build().addKings();
                });
            },
            defineHandles: function() {
                this.flag = this.sandbox.find(".flag");
                this.years = this.sandbox.find(".very-wide");
                this.currentYear = this.yearFromPixels(this.years.css("left"));
                return this;
            },
            build: function() {
                var that = this;
                _.each(_.range(0,1500,yearStep),function(i){
                    that.years.append($("<span/>",{
                        "class": "year",
                        css: { width: yearWidth },
                        text: i
                    }));
                });
                return this;
            },
            highlightModel: function(key) {
                var model = _a.dataStore.get(key);
                this.moveTo(
                    parseInt(model.get("name").match(/[\d]{3,}/),10)
                );
            },
            yearFromPixels: function(pixels) {
                return Math.round(Math.abs(parseInt(pixels,10) * yearStep / yearWidth));
            },
            pixelsFromYear: function(year) {
                return Math.round(Math.abs(parseInt(year,10)/yearStep * yearWidth));
            },
            moveTo: function(year) {
                var half = this.sandbox.width()/2,
                    pixels = Math.round(year/yearStep * yearWidth),
                    flag = this.flag,
                    between = year - this.currentYear,
                    step = 1700/Math.abs(between),
                    years = this.years,
                    yearFromPixels = this.yearFromPixels;
                this.currentYear = year;
                // animate the years
                var clicker = setInterval(function(){
                    flag.text( yearFromPixels(parseInt(years.css("left"),10) - half + 15) );
                },step);
                // animate the timeline
                this.years.animate({ left: ((0-pixels)+half-15) },2000,function(){
                    clearInterval(clicker);
                    flag.text(year);
                });
            },
            addKings: function() {
                var that = this;
                _a.dataStore.get(kings,function(collection){
                    _.each(collection.get("members"),function(k){
                        var start = that.pixelsFromYear(k.get("beg_year")),
                            end = that.pixelsFromYear(k.get("end_year"));
                        that.years.append($("<span/>",{
                            "class": "king",
                            css: {
                                left: start,
                                width: (end - start - 1)
                            },
                            html: $("<span/>",{
                                "class": "name",
                                text: k.get("name")
                            })
                        }));
                    });
                });
            }
        }
    });
    
})();