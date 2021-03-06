var StaticGridLayerModel = Backbone.Model.extend({ });

var StaticGridLayer = Backbone.View.extend({

  hide: function() {
    this.model.set("opacity", 0);
  },

  show: function() {
    this.model.set("opacity", 1);
  },

  refresh_time: function(month) {
  },

  set_time: function(month, year) {
    month && this.model.set("month", month);
    year  && this.model.set("year", year);
  },

  _onOpacityUpdate: function() {
    this.layer.setOpacity(this.model.get("opacity"));
  },

  _onYearUpdate: function() {

    var query = "SELECT * FROM gfw2_forma_ie_fix WHERE p <= " + this.model.get("month");
    this.model.set("query", query);
    this.layer.setQuery(query);

  },

  cache_time: function() {

  },

  initialize: function() {
    var that = this;

    this.model = new StaticGridLayerModel({
      year: 2006,
      month: 72
    });

    this.model.bind("change:year",  this._onYearUpdate,  this);
    this.model.bind("change:opacity", this._onOpacityUpdate, this);

    var query = "SELECT * FROM gfw2_forma_ie_fix WHERE p <= " + this.model.get("month");
    this.model.set("query", query);

    this.layer = new CartoDBLayer({
      map: map,
      user_name:'',
      tiler_domain: that.options._cloudfront_url,
      sql_domain:   that.options._cloudfront_url,
      extra_params: { v: that.options._global_version}, //define a verison number on requests
      tiler_path:'/tiles/',
      tiler_suffix:'.png',
      tiler_grid: '.grid.json',
      table_name: "cdm_april_2013",
      query: query,
      layer_order: "bottom",
      opacity: 1,
      interactivity:"cartodb_id",
      debug:false,
      auto_bound: false
    });

  }

});

