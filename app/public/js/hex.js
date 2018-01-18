var pods
var raw_data
var num_pods
var sqrt_pods
var redline_restarts = 30


function refreshData() {
  d3.json('/data')
    .get(function (error, json) {

      // Assign the raw_data
      raw_data = json
      console.log("raw_data", raw_data)

      // Build a list of all the data
      resource_data_list = buildDataList(raw_data);

      // Extract the pod data
      pods = getType("kubernetes.pod");
      console.log("pods", pods);

      // Perform the necessary variable calculations
      performCalcs(pods);

      // Refresh whatever type of option we have selected
      refresh($('#hex_options').find('.selected').attr("item_value"))
    })
}

function refresh(type) {

  // Clear the chart
  $('#hex-chart').children().remove();

  // Render the new chart
  makeMap(type);
}

function performCalcs(pods) {
  num_pods = pods.length
  sqrt_pods = Math.sqrt(num_pods)
}

function makeMap(type) {

  //svg sizes and margins
  var margin = {
      top: 50,
      right: 20,
      bottom: 20,
      left: 50
  };

  //The next lines should be run, but this seems to go wrong on the first load in bl.ocks.org
  //var width = $(window).width() - margin.left - margin.right - 40;
  //var height = $(window).height() - margin.top - margin.bottom - 80;
  //So I set it fixed to:
  var width = 1800;
  var height = 900;

  //The number of columns and rows of the heatmap
  var MapColumns = Math.ceil(sqrt_pods);
  	MapRows = Math.ceil(sqrt_pods);

  //The maximum radius the hexagons can have to still fit the screen
  var hexRadius = d3.min([width/(Math.sqrt(3)*(MapColumns+3)),
  			height/((MapRows+3)*1.5)]);

  //Set the new height and width based on the max possible
  width = MapColumns*hexRadius*Math.sqrt(3);
  height = MapRows*1.5*hexRadius+0.5*hexRadius;

  //Set the hexagon radius
  var hexbin = d3.hexbin()
      .radius(hexRadius);

  //Calculate the center positions of each hexagon
  var points = [];
  var truePoints = [];
  for (var i = 0; i < MapRows; i++) {
      for (var j = 0; j < MapColumns; j++) {
        pod_index=(MapRows*i)+j
        if(pod_index<num_pods) {
          point_data = pods[pod_index]
        } else {
          point_data = {}
        }
        points.push([hexRadius * j * 1.75, hexRadius * i * 1.5, point_data, type]);
  	    truePoints.push([hexRadius * j * Math.sqrt(3), hexRadius * i * 1.5]);
      }
  }

  //Create SVG element
  var svg = d3.select("#hex-chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //Start drawing the hexagons
  svg.append("g")
      .selectAll(".hexagon")
      .data(hexbin(points))
      .enter().append("path")
      .attr("class", "hexagon")
      .attr("d", function (d) {
  		return "M" + d.x + "," + d.y + hexbin.hexagon();
  	  })
      .attr("stroke", "white")
      .attr("stroke-width", "1px")
      .style("fill", function (d,i) {
        return makeColor(d);
  	  })
      .attr("title", function(d) {
        return makeTooltip(d)
      })
    	.on("mouseover", mouseover)
    	.on("mouseout", mouseout);

    tippy('path.hexagon', {
      placement: 'right',
      duration: 0,
      arrow: true
    })

  ///////////////////////////////////////////////////////////////////////////
  ///// Function to calculate the line segments between two node numbers ////
  ///////////////////////////////////////////////////////////////////////////
  //Which nodes are neighbours
  // var neighbour =
  // [
  // 	[577,548], [578,579], [578,548], [578,549],[583,584], [583,554], [592,593], [593,563], [540,510], [541,510], [541,511],[542,511], [547,548], [548,517], [553,554], [553,523], [562,532], [563,564], [563,532], [563,533], [511,512], [511,482], [517,518], [517,488], [521,492], [522,523], [522,492], [522,493], [531,532], [532,502], [481,482], [482,451], [487,488], [487,457], [491,492], [491,461], [501,471], [502,503], [502,471], [502,472], [451,452], [452,422], [456,457], [457,427], [460,461], [460,431], [470,471], [470,441], [422,423], [423,392], [427,428], [427,397], [430,431], [430,400], [431,400], [440,441], [440,410], [392,393], [392,363], [394,365], [395,365], [395,366], [396,397], [396,366], [396,367], [398,369], [399,400], [399,369], [399,370], [400,401], [401,371], [409,410], [409,380], [413,384], [414,384], [362,363], [362,332], [363,332], [363,333], [364,365], [364,333], [364,334], [368,369], [368,338], [371,372], [372,341], [379,380], [379,349], [383,384], [383,353], [384,385], [384,354], [331,332], [332,302], [337,338], [338,308], [341,342], [341,312], [348,349], [349,319], [351,322], [352,353], [352,322], [352,323], [353,354], [353,324], [302,303], [302,272], [308,309], [308,278], [311,312], [312,281], [312,282], [313,282], [314,284], [315,284], [318,288], [319,320], [319,288], [319,289], [321,322], [322,291], [323,324], [324,293], [324,294], [325,294], [271,272], [271,242], [277,278], [278,248], [282,283], [283,284], [283,253], [283,254], [284,285], [285,255], [287,288], [287,258], [291,292], [292,262], [294,295], [295,265], [295,266], [296,266], [296,267], [297,267], [298,269], [299,269], [240,210], [241,242], [241,210], [242,211], [248,249], [249,218], [255,256], [256,225], [256,226], [257,258], [257,226], [257,227], [262,263], [262,232], [267,268], [268,269], [268,237], [268,238], [210,211], [211,212], [211,181], [211,182], [217,188], [218,219], [218,188], [218,189], [225,226], [225,196], [231,232], [231,202], [181,182], [182,151], [187,188], [187,157], [195,196], [196,165], [201,202], [202,171], [151,152], [151,122], [152,122], [152,123],[153,123], [155,126], [156,157], [156,126], [156,127], [165,166], [166,136], [166,137], [167,137], [170,141], [171,172], [171,141], [171,142], [121,122], [121,91], [123,124], [124,93], [124,94], [125,126], [125,94], [125,95], [137,138], [138,107], [138,108], [139,108], [139,109], [140,141], [140,109], [140,110], [90,91], [91,61], [91,62], [92,62], [92,63], [93,63], [106,77], [107,108], [107,77], [107,78], [63,64], [64,33], [76,77], [77,46], [33,34], [33,4], [46,47], [46,17], [3,4], [16,17]
  // ];
  //
  // //Initiate some variables
  // var Sqr3 = 1/Math.sqrt(3);
  // var lineData = [];
  // var Node1,
  // 	Node2,
  // 	Node1_xy,
  // 	Node2_xy,
  // 	P1,
  // 	P2;
  //
  // //Calculate the x1, y1, x2, y2 of each line segment between neighbours
  // for (var i = 0; i < neighbour.length; i++) {
  // 	Node1 = neighbour[i][0];
  // 	Node2 = neighbour[i][1];
  //
  // 	//An offset needs to be applied if the node is in an uneven row
  //  	if (Math.floor(Math.floor((Node1/MapColumns)%2)) != 0) {
  // 		Node1_xy = [(truePoints[Node1][0]+(hexRadius/(Sqr3*2))),truePoints[Node1][1]];
  // 	}
  // 	else {
  // 		Node1_xy = [truePoints[Node1][0],truePoints[Node1][1]];
  // 	}
  //
  // 	//An offset needs to be applied if the node is in an uneven row
  // 	if (Math.floor(Math.floor((Node2/MapColumns)%2)) != 0) {
  // 		Node2_xy = [(truePoints[Node2][0]+(hexRadius/(Sqr3*2))),truePoints[Node2][1]];
  // 	}
  // 	else {
  // 		Node2_xy = [truePoints[Node2][0],truePoints[Node2][1]];
  // 	}//else
  //
  // 	//P2 is the exact center location between two nodes
  // 	P2 = [(Node1_xy[0]+Node2_xy[0])/2,(Node1_xy[1]+Node2_xy[1])/2]; //[x2,y2]
  // 	P1 = Node1_xy; //[x1,x2]
  //
  // 	//A line segment will be drawn between the following two coordinates
  // 	lineData.push([(P2[0] + Sqr3*(P1[1] - P2[1])),(P2[1] + Sqr3*(P2[0] - P1[0]))]); //[x3_top, y3_top]
  // 	lineData.push([(P2[0] + Sqr3*(P2[1] - P1[1])),(P2[1] + Sqr3*(P1[0] - P2[0]))]); //[x3_bottom, y3_bottom]
  // }//for i
  //
  // ///////////////////////////////////////////////////////////////////////////
  // /////////////////// Draw the black line segments //////////////////////////
  // ///////////////////////////////////////////////////////////////////////////
  //
  // var lineFunction = d3.svg.line()
  // 		  .x(function(d) {return d[0];})
  // 		  .y(function(d) {return d[1];})
  // 		  .interpolate("linear");
  //
  // var Counter = 0;
  // //Loop over the linedata and draw each line
  // for (var i = 0; i < (lineData.length/2); i++) {
  // svg.append("path")
  // 	.attr("d", lineFunction([lineData[Counter],lineData[Counter+1]]))
  // 	.attr("stroke", "black")
  // 	.attr("stroke-width", 1.25)
  // 	.attr("fill", "none");
  //
  // 	Counter = Counter + 2;
  // } //for i

}

//Function to call when you mouseover a node
function mouseover(d) {
  // console.log(d);
  // console.log(d3.select(this))
  // var pos = this.getBoundingClientRect();
  // console.log(pos.top, pos.right, pos.bottom, pos.left);
  // html = makeTooltip(d)
  // d3.select("body")
  //     .append("div")
  //     .attr("class", "vz-weighted_tree-tip")
  //     .style("position", "absolute")
  //     .style("top", d3.event.pageY + "px")
  //     .style("left", (d3.event.pageX+100) + "px")
  //     .style("opacity",0)
  //     .html(makeTooltip(d))
  //     .transition().style("opacity",1);
  var el = d3.select(this)
		.transition()
		.duration(10)
		.style("fill-opacity", 0.3)
		;
}

//Mouseout function
function mouseout(d) {
  d3.selectAll(".vz-weighted_tree-tip").remove();
	var el = d3.select(this)
	   .transition()
	   .duration(1000)
	   .style("fill-opacity", 1)
	   ;
};

function makeTooltip(d) {

  pod = d[0][2]
  type = d[0][3]

  if(Object.keys(pod).length) {
    return makeDescription({
      "Pod Name": pod.data["kubernetes.pod.name"],
      "Host Network": pod.data["kubernetes.pod.hostNetwork"],
      "Cluster": pod.metadata["kubernetes.pod.cluster"],
      "Namespace": pod.metadata["kubernetes.pod.namespace"],
      "Container Restarts": pod.metadata["kubernetes.pod.numContainerRestarts"],
      "Containers Ready": pod.metadata["kubernetes.pod.numReadyContainers"]+"/"+pod.metadata["kubernetes.pod.numContainers"],
      "Pod IP": pod.data["kubernetes.pod.podIP"],
      "Node": pod.metadata["kubernetes.pod.node"],
    })

    // '<div class="Rtable Rtable--2cols">'+
    // '<div class="Rtable-cell cell-head">Pod Name: '+pod.data["kubernetes.pod.name"]+"</div>"+
    // '<div>Host Network: '+pod.kubernetes.pod.hostNetwork+"</div>"+
    // '<div>Cluster: '+pod.metadata["kubernetes.pod.cluster"]+"</div>"+
    // '<div>Restarts: '+pod.metadata["kubernetes.pod.numContainerRestarts"]+"</div>"+
    // '<div>Ready: '+pod.metadata["kubernetes.pod.numReadyContainers"]+"/"+pod.metadata["kubernetes.pod.numContainers"]+"</div>"+
    // "</div>"
  }

  return ""
}

function makeColor(d) {

  item = d[0][2]
  type = d[0][3]
  saturation = 0.8
  default_color = "black"

  // If there's no data, return default color
  if(!Object.keys(item).length) {
    return default_color
  }

  // Based on the type of data, return different color schemes
  switch(type) {
    case "restarts":
      restarts = item.metadata["kubernetes.pod.numContainerRestarts"]
      hue = 120 - (Math.min(restarts, redline_restarts)/redline_restarts) * 120;
      return hsv2rgb(hue, saturation, 1)
    case "ready":
      if(item.metadata["kubernetes.pod.numReadyContainers"] === item.metadata["kubernetes.pod.numContainers"]) {
        return hsv2rgb(120, saturation, 1)
      } else {
        return hsv2rgb(0, saturation, 1)
      }
  }

  return default_color
}

var hsv2rgb = function(h, s, v) {
  // adapted from http://schinckel.net/2012/01/10/hsv-to-rgb-in-javascript/
  var rgb, i, data = [];
  if (s === 0) {
    rgb = [v,v,v];
  } else {
    h = h / 60;
    i = Math.floor(h);
    data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
    switch(i) {
      case 0:
        rgb = [v, data[2], data[0]];
        break;
      case 1:
        rgb = [data[1], v, data[0]];
        break;
      case 2:
        rgb = [data[0], v, data[2]];
        break;
      case 3:
        rgb = [data[0], data[1], v];
        break;
      case 4:
        rgb = [data[2], data[0], v];
        break;
      default:
        rgb = [v, data[0], data[1]];
        break;
    }
  }
  return '#' + rgb.map(function(x){
    return ("0" + Math.round(x*255).toString(16)).slice(-2);
  }).join('');
};
