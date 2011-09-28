(function() {
  var Stil, _i, _result, features, log, makeRule, rules;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __slice = Array.prototype.slice;
  /*
  public namespace, the only thing you see
  */
  window.GStil = {
    makeStyle: function(title) {
      return new Stil(title);
    }
  };
  log = function(string) {
    return console.log(string);
  };
  rules = {
    featureTypes: {
      administrative: ["country", "province", "locality", "neighborhood", "land_parcel"],
      landscape: ["man_made", "natural"],
      poi: ["attraction", "business", "government", "medical", "park", "place_of_worship", "school", "sports_complex", "road", "highway", "arterial", "local"],
      road: ["arterial", "highway", "local"],
      transit: ["line"],
      "transit.station": ["airport", "bus", "rail"],
      water: true
    },
    elementTypes: ["all", "geometry", "labels"],
    stylers: {
      hue: /#[abcdefABCDEF0123456789]{6}/,
      invert_lightness: [true, false],
      saturation: (function() {
        _result = [];
        for (_i = -100; _i <= 100; _i++){ _result.push(_i); }
        return _result;
      }).call(this),
      lightness: (function() {
        _result = [];
        for (_i = -100; _i <= 100; _i++){ _result.push(_i); }
        return _result;
      }).call(this),
      gamma: (function() {
        _result = [];
        for (_i = -100; _i <= 100; _i++){ _result.push(_i); }
        return _result;
      }).call(this),
      visibility: ["on", "simplified", "off"]
    }
  };
  features = rules.featureTypes;
  _.each(features, function(subs, supr) {
    _.each(subs, function(sub) {
      return (features[("" + (supr) + "." + (sub))] = true);
    });
    return (features[supr] = true);
  });
  /*
  the stil object (whose methods you use, but don't really see)
  */
  Stil = function(name) {
    this.name = name;
    this.rules = [];
    this.last = null;
    this.map;
    return this;
  };
  Stil.prototype.pushRule = function(rule) {
    this.rules.push(rule);
    return (this.last = rule);
  };
  Stil.prototype._buildStyledMapType = function(map) {
    this.map = map;
    return new google.maps.StyledMapType(this.rules, {
      map: map,
      name: this.name
    });
  };
  Stil.prototype.addTo = function(map) {
    var that;
    this.map = map;
    that = this;
    _.defer(__bind(function() {
      var style;
      style = this._buildStyledMapType(map);
      map.mapTypes.set(this.name, style);
      map.setMapTypeId(this.name);
      return (this.style = style);
    }, this));
    return this;
  };
  Stil.prototype.registerWith = function(map) {
    this.style = this._buildStyledMapType(map);
    return this;
  };
  Stil.prototype.update = function() {
    return this.addTo(this.map);
  };
  Stil.prototype.rule = function(featureType, stylers) {
    var compoundType, prefix, rule, suffix, that;
    features = rules.featureTypes;
    rule = null;
    if (features.hasOwnProperty(featureType)) {
      rule = makeRule(featureType);
    } else {
      prefix = this.last.featureType.split(".")[0];
      suffix = featureType;
      compoundType = ("" + (prefix) + "." + (suffix));
      if (features.hasOwnProperty(compoundType)) {
        rule = makeRule(compoundType);
      }
    }
    if (rule !== null) {
      this.pushRule(rule);
      if (stylers) {
        that = this;
        _.each(stylers, function(value, key) {
          return that[key](value);
        });
      }
    } else {
      log("That's not a real feature type.");
    }
    return this;
  };
  Stil.prototype.ruleIf = function(cond, featureType, stylers) {
    if (cond) {
      this.rule(featureType, stylers);
    }
    return this;
  };
  Stil.prototype.just = function(elementType) {
    this.last.elementType = elementType;
    return this;
  };
  Stil.prototype.turnOff = function() {
    var that;
    features = __slice.call(arguments, 0);
    that = this;
    _.each(features, function(feature) {
      return that.rule(feature).visibility("off");
    });
    return this;
  };
  Stil.prototype.print = function() {
    return this.rules;
  };
  _.each(rules.stylers, function(type, name) {
    return (Stil.prototype[name] = function(style) {
      var obj;
      obj = {};
      obj[name] = style;
      this.last.stylers.push(obj);
      return this;
    });
  });
  /*
  the rule object (which you don't see)
  */
  makeRule = function(featureType) {
    return {
      featureType: featureType,
      elementType: "all",
      stylers: []
    };
  };
}).call(this);
