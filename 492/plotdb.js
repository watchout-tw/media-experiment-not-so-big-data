{
  sample: function() {
    var ret = {
      name: [{name: "Country", data: []}],
      x: [{name: "Year", data: []}],
      y: [{name: "Population", data: []}]
    };
    var countries = d3.range(50).map(function(d,i) { return plotdb.data.sample.country.get(d); });
    var years = d3.range(50).map(function(d,i) { return d + 1960; });
    var i,j;
    for(i=0;i<countries.length;i++) {
      for(j=0;j<years.length;j++) {
        ret.name[0].data.push(countries[i]);
        ret.x[0].data.push(years[j]);
        ret.y[0].data.push(Math.random()*0.2 + Math.sin(i/50 + j/10) + 20 + j/10 + i/10);
      }
    }
    return ret;
  },
  dimension: {
    name: { type: [plotdb.String], require: false, desc: "Name" },
    x: { type: [plotdb.Order], require: false, desc: "Value along X Axis" },
    y: { type: [plotdb.Number], require: true, desc: "Value along Y Axis" }
  },
  config: {
    fontFamily: {},
    background: {},
    textFill: {},
    margin: {},
    fontSize: {},
    stroke: {},
    hoverStroke: {},
    highlightName: {
      name: "Highlight Name",
      type: [plotdb.String],
       default: "",
      desc: "the name of the most important line"
    },
    highlightStroke: {
      extend: "stroke",
      name: "Highlight Stroke",
      default: "#0058ff",
      desc: "used to highlight the most important line"
    },
    labelShow: {},
    preciseHovering: { name: "Popup Only if Mouse on Line", type: [plotdb.Boolean], default: true},
    lineSmoothing: {},
    labelAside: { name: "Label Put ASidde", type: [plotdb.Boolean], default: false },
    highlight: { name: "Highlight Lines", type: [plotdb.String], default: "['Chile', 'Belize', 'Australia']" },
    yAxisShow: {},
    yAxisLabel: {},
    yAxisTickSizeInner: {},
    yAxisTickSizeOuter: {},
    yAxisTickPadding: {},
    yAxisShowDomain: {default: true},
    yAxisTickCount: {},
    yAxisLabelPosition: {},
    xAxisShow: {},
    xAxisLabel: {},
    xAxisTickSizeInner: {},
    xAxisTickSizeOuter: {},
    xAxisTickPadding: {},
    xAxisShowDomain: {default: true},
  },
  init: function() {
    var that = this;
    this.svg = d3.select(this.root).append("svg");
    this.xAxisGroup = this.svg.append("g").attr({class: "axis horizontal"});
    this.yAxisGroup = this.svg.append("g").attr({class: "axis vertical"});
    this.dataGroup = this.svg.append("g").attr({class: "data-group"});
    this.lineBuilder = d3.svg.line()
      .x(function(d,i) { return that.xScale(d.x) + that.xSegWidth/2; })
      .y(function(d,i) { return that.yScale(d.y); });
    this.popup = plotd3.html.popup(this.root).on("mousemove", function(d,i,popup) {
      if(that.config.preciseHovering)
        d3.select(this).attr({stroke: that.config.hoverStroke, "stroke-width": 3});
      popup.select(".title").text(d.name || d.key);
    }).on("mouseout", function(d,i,popup) {
      if(that.config.preciseHovering) {
        var hlname = d.key == that.config.highlightName;
        var hlline = (that.nameFilter.indexOf(d.key) >= 0);
        d3.select(this).attr({stroke:
          (hlname ? that.config.highlightStroke :
           (hlline ? that.config.hoverStroke : that.config.stroke)
          ), "stroke-width": (hlname ? 3 : 1)
        });
      }
    });
    this.popupNode = this.popup.getPopupNode();
    this.nameMap = {};
    this.svg.on("mousemove",function(d,i) {
      if(that.config.preciseHovering) return;
      var range = that.xScale.range();
      var y = d3.event.clientY, x = d3.event.clientX;
      var min = -1,minJ = 0;
      for(var j=0,dx=0;j<that.xValues.length;j++) {
        dx = Math.abs(x - that.xScale(that.xValues[j]));
        if(min == -1 || dx < min) { minJ = j; min = dx; }
      }
      var idx = minJ;
      if(idx<0) idx = 0;
      if(idx>=that.xValues.length) idx = that.xValues.length - 1;
      var xPoint = (that.xValues[idx]);
      var i,list = that.xPoints[xPoint];
      var min = Math.abs(y - that.yScale(list[0].y)),diff,candidate = 0,name;
      for(i=0;i<list.length;i++) {
        diff = Math.abs(y - that.yScale(list[i].y));
        if(diff < min) {
          min = diff;
          candidate = i;
        }
      }
      name = list[candidate].name;
      that.hover(name);
      that.popup.showByEvent(list[candidate],0);
    });
    this.overlap = plotd3.rwd.overlap();
  },
  hover: function(name) {
    var that = this;
    if(this.activeName) {
      var hlname = this.activeName == that.config.highlightName;
      var hlline = (that.nameFilter.indexOf(this.activeName) >= 0);
      this.nameMap[this.activeName].attr({
        stroke: function(d,i) {
          return (
            hlname ? that.config.highlightStroke :
            ( hlline ? that.config.hoverStroke : that.config.stroke )
          );
        },
        "stroke-width": function(d,i) {
          return (hlname? 3 : 1);
        }
      });
    }
    this.nameMap[name].attr({
      stroke: this.config.hoverStroke,
      "stroke-width": 3
    });
    this.activeName = name;
  },
  parse: function() {
    var that = this,i,node;
    this.parsed = d3.nest().key(function(d,i) { return d.name || ""; }).entries(this.data);
    for(i=0;i<this.parsed.length;i++) {
      plotdb.Order.sort(this.parsed[i].values,"x");
    }
    this.yRange = d3.extent(this.data, function(d,i) { return d.y; });
    this.xValues = d3.map(this.data, function(d,i) { return d.x; }).keys();
    this.xPoints = {};
    for(i=0;i<this.xValues.length;i++) this.xPoints[this.xValues[i]] = [];
    for(i=0;i<this.data.length;i++) {
      node = this.data[i];
      this.xPoints[node.x].push(this.data[i]);
    }
  },
  bind: function() {
    var that = this,sel;
    sel = this.dataGroup.selectAll("path.data").data(this.parsed);
    sel.exit().remove();
    sel = sel.enter().append("path").attr('class', function(d,i) {
      return ['data', 'data_path', 'data_path_' + d.key].join(' ')
    }).each(function(d,i) {
      that.nameMap[d.key] = d3.select(this);
    });
    this.popup.nodes(sel);
    sel = this.dataGroup.selectAll("text.label.data").data(this.parsed);
    sel.exit().remove();
    sel.enter().append("text").attr({class: "data label", opacity: 0});
    this.dataGroup.selectAll("text.label.data").text(function(d,i) { return d.key; });
    //this.popup.nodes(sel);
    this.resize();
  },
  resize: function() {
    var that = this;
    var box = this.root.getBoundingClientRect();
    var width = this.width = box.width;
    var height = this.height = box.height;
    this.svg.attr({
      width: width + "px", height: height + "px",
      viewBox: [0,0,width,height].join(" "),
      preserveAspectRatio: "xMidYMid"
    });
    this.lineBuilder.interpolate(this.config.lineSmoothing);
    try {
      this.nameFilter = JSON.parse(this.config.highlight);
    } catch(e) {
      this.nameFilter = [];
    }
    if(!Array.isArray(this.nameFilter)) this.nameFilter = [];
    this.dataGroup.selectAll("text.label.data").attr({
      "opacity": function(d,i) { return (that.nameFilter.indexOf(d.key) >= 0 && that.config.labelShow?1:0) },
      "font-size": that.config.fontSize
    });
    if(this.config.labelAside && this.config.labelShow) {
      this.labelWidth = d3.max(this.dataGroup.selectAll("text.label.data").filter(function(d,i) {
        return that.nameFilter.indexOf(d.key) >= 0;
      })[0].map(function(d,i) {
        return d.getBoundingClientRect().width;
      }));
    } else {
      this.labelWidth = 0;
    }
    this.yScale = d3.scale.linear()
      .domain(this.yRange)
      .range([this.height - this.config.margin, this.config.margin]);
    this.yAxis = plotd3.rwd.axis()
      .scale(this.yScale)
      .orient("left")
      .label(this.config.yAxisLabel || " ")
      .labelPosition(this.config.yAxisLabelPosition)
      .tickValues(this.yScale.ticks(this.config.yAxisTickCount))
      .tickSize(this.config.yAxisTickSizeInner, this.config.yAxisTickSizeOuter)
      .tickPadding(this.config.yAxisTickPadding)
      .fontSize(this.config.fontSize);
    this.yAxisGroup.call(this.yAxis);
    this.yAxisWidth = (this.config.yAxisShow ? this.yAxis.offset() : 0);
    this.xScale = d3.scale.ordinal()
      .domain(this.xValues)
      .rangeBands([this.config.margin + this.yAxisWidth, this.width - this.config.margin - this.labelWidth],1,0);
    this.xAxis = plotd3.rwd.axis()
      .scale(this.xScale)
      .orient("bottom")
      .label(this.config.xAxisLabel || " ")
      .labelPosition(this.config.xAxisLabelPosition)
      .tickSize(this.config.xAxisTickSizeInner, this.config.xAxisTickSizeOuter)
      .tickPadding(this.config.xAxisTickPadding)
      .fontSize(this.config.fontSize);
    this.xSegWidth = 0;
    this.xstep = (this.xScale.range()[1] - this.xScale.range()[0])/2;
    this.xAxisGroup.call(this.xAxis);
    this.xAxisHeight = (this.config.xAxisShow ? this.xAxis.offset() : 0);
    this.yScale.range([this.height - this.config.margin - this.xAxisHeight, this.config.margin]);
    this.yAxisGroup.call(this.yAxis);
    this.popupNode[0][0].style.minHeight = this.config.fontSize + "px";
  },
  render: function() {
    var that = this;
    if(this.config.fontFamily) d3.select(this.root).style("font-family", this.config.fontFamily);
    d3.select(this.root).style("background-color", this.config.background);
    this.svg.selectAll("text").attr({
      "font-size": that.config.fontSize,
      "fill": that.config.textFill
    });
    this.xAxisGroup.attr({
      transform: ["translate(", 0, (this.height - this.config.margin - this.xAxisHeight), ")"].join(" "),
      display: this.config.xAxisShow ? "block" : "none"
    });
    this.yAxisGroup.attr({
      transform: ["translate(", (this.config.margin + this.yAxisWidth), 0, ")"].join(" "),
      display: this.config.yAxisShow ? "block" : "none"
    });
    this.svg.selectAll("path.data").attr({
      d: function(d,i) {
        return that.lineBuilder(d.values);
      },
      fill: "none",
      stroke: this.config.stroke,
      "stroke-width": function(d,i) { return (d.key == that.config.highlightName ? 3 : 1 ); }
    }).attr({
      stroke: function(d,i) {
        var hlname = d.key == that.config.highlightName;
        var hlline = (that.nameFilter.indexOf(d.key) >= 0);
        return (
          hlname ? that.config.highlightStroke :
          ( hlline ? that.config.hoverStroke : that.config.stroke )
        );
      }
    });
    if(this.config.labelAside) this.svg.selectAll("text.label.data").attr({
      x: this.width - this.config.margin - this.labelWidth - this.xSegWidth + this.config.fontSize/2,
      y: function(d,i) { return that.yScale(d.values[d.values.length - 1].y); },
      dy: "0.3em",
      "text-anchor": "start"
    });
    else this.svg.selectAll("text.label.data").attr({
      y: function(d,i) { return that.yScale(d.values[parseInt(d.values.length/2)].y); },
      dy: "-0.5em",
      "text-anchor": "middle"
    }).filter(function(d,i) { return (that.nameFilter.indexOf(d.key) >= 0); }).each(function(d,i) {
      var idx = parseInt(that.xValues.length * ((i + 1) / (that.nameFilter.length + 1)));
      d3.select(this).attr({
        x: that.xScale(that.xValues[idx]),
        y: that.yScale(d.values[idx].y),
        "text-anchor": function() { return (i==that.nameFilter.length - 1 ? "end" : "middle"); }
      });
    });
    var showntext = this.svg.selectAll("text.label.data")
      .filter(function(d,i) { return (that.nameFilter.indexOf(d.key) >= 0); });
    showntext.each(function(d,i) {
      d.y = that.yScale(d.values[d.values.length - 1].y);
    });
    showntext[0].sort(function(a,b) { return d3.select(a).datum().y - d3.select(b).datum().y; });
    var pairs = d3.pairs(showntext[0]), d1, d2;
    for(var i=0;i<pairs.length;i++) {
      d1 = d3.select(pairs[i][0]).datum();
      d2 = d3.select(pairs[i][1]).datum();
      if(Math.abs(d1.y - d2.y) < this.config.fontSize * 1.1) {
        d1.y = d1.y - (Math.sign(d2.y - d1.y) || 1) * this.config.fontSize * 0.5;
        d2.y = d2.y - (Math.sign(d1.y - d2.y) || -1) * this.config.fontSize * 0.5;
      }
    }
    showntext.attr({
      y: function(d,i) { return d.y; }
    });
  }
}
