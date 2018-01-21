// html element that holds the chart
var viz_container;

// our weighted tree
var viz;

// our theme
var theme;

// Raw Data
var resource_data_list = [];

// Flattened Data
// Data that has been joined and flattened into an array of simple objects [{},{}]
var flattened_data

// nested data
var data = {};

// stores the currently selected value field
var valueField = "region";
var valueFields = ["region", "environment", "purpose"];
// var rollupFields = ["kubernetes.pod.cluster", "kubernetes.node.name", "kubernetes.pod.namespace", "kubernetes.pod.name"];

function refreshData(init) {
    d3.json('/data')
    // d3.json('/staticdata')
      .get(function (error, json) {
        resource_data_list = buildDataList(json);
        console.log("resource_data_list", resource_data_list);
        populateKeySelectors(resource_data_list);

        // Builds a large dateset of all relevent data joined together
        buildFlattenedData()
        data.values=prepDataJson();
        if(init) {
          initialize();
        }
      });
}

function filterData(value) {
  return eval($('#filterInput').val())
}

// Builds a large dateset of all relevent data joined together
function buildFlattenedData() {
  pods = getType("kubernetes.pod");
  replicasets = getType("kubernetes.replicaset");
  statefulsets = getType("kubernetes.statefulset");
  daemonsets = getType("kubernetes.daemonset");
  deployments = getType("kubernetes.deployment");
  clusters = getType("kops.cluster");
  nodes = getType("kubernetes.node");
  namespaces = getType("kubernetes.namespace");
  containers = getType("kubernetes.container");
  containerendpoints = getType("kubernetes.containerendpoint");
  services = getType("kubernetes.service");
  serviceports = getType("kubernetes.serviceport");
  endpointtargets = getType("kubernetes.endpointtarget");
  nodeports = getType("kubernetes.nodePort");
  ingressrules = getType("kubernetes.ingressrule");
  ingresses = getType("kubernetes.ingress");
  ingresscontrollers = getType("kubernetes.ingresscontroller");


  regions = getType("aws.region");
  dnsrecords = getType("aws.dnsrecord");
  dnsrecordtargets = getType("aws.dnsrecordtarget");
  loadbalancers = getType("aws.loadbalancer")
  loadbalancerlisteners = getType("aws.loadbalancerlistener")
  listenerrules = getType("aws.listenerrule")
  targetgroups = getType("aws.targetgroup")
  autoscalinggroups = getType("aws.autoscalinggroup")
  instances = getType("aws.instance")

  // console.log("dnsrecords", dnsrecords);
  // console.log("endpoints", endpoints);
  // console.log("dnsrecordtargets", dnsrecordtargets);


  kubernetes_group = leftjoin(containers, function (o) { return o.joindata["kubernetes.container.podUid"]; }, pods, function (o) { return o.metadata["kubernetes.pod.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.pod.createdByUid"]; }, replicasets, function (o) { return o.metadata["kubernetes.replicaset.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.replicaset.createdByUid"]; }, deployments, function (o) { return o.metadata["kubernetes.deployment.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.pod.createdByUid"]; }, statefulsets, function (o) { return o.metadata["kubernetes.statefulset.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.pod.createdByUid"]; }, daemonsets, function (o) { return o.metadata["kubernetes.daemonset.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.pod.cluster"]+":"+o.metadata["kubernetes.pod.node"]; }, nodes, function (o) { return o.metadata["kubernetes.node.cluster"]+":"+o.data["kubernetes.node.name"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.pod.cluster"]; }, clusters, function (o) { return o.data["kops.cluster.name"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.pod.cluster"]+":"+o.metadata["kubernetes.pod.namespace"]; }, namespaces, function (o) { return o.metadata["kubernetes.namespace.cluster"]+":"+o.data["kubernetes.namespace.name"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.container.uid"]; }, containerendpoints, function (o) { return o.metadata["kubernetes.containerendpoint.containerUid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.containerendpoint.uid"]; }, endpointtargets, function (o) { return o.metadata["kubernetes.endpointtarget.containerEndpointUid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
      return o.metadata["kubernetes.endpointtarget.cluster"]+
      ":"+o.metadata["kubernetes.endpointtarget.namespace"]+
      ":"+o.data["kubernetes.endpointtarget.name"]+
      ":"+o.data["kubernetes.endpointtarget.port"]+
      ":"+o.data["kubernetes.endpointtarget.protocol"]; },
    serviceports, function (o) {
      return o.metadata["kubernetes.serviceport.cluster"]+
      ":"+o.metadata["kubernetes.serviceport.namespace"]+
      ":"+o.metadata["kubernetes.serviceport.serviceName"]+
      ":"+o.data["kubernetes.serviceport.targetPort"]+
      ":"+o.data["kubernetes.serviceport.protocol"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.serviceport.serviceUid"]; }, services, function (o) { return o.metadata["kubernetes.service.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
      return o.metadata["kubernetes.service.cluster"]+
      ":"+o.metadata["kubernetes.service.namespace"]+
      ":"+o.data["kubernetes.service.name"]+
      ":"+o.data["kubernetes.serviceport.port"]; },
    ingressrules, function (o) {
      return o.metadata["kubernetes.ingressrule.cluster"]+
      ":"+o.metadata["kubernetes.ingressrule.namespace"]+
      ":"+o.data["kubernetes.ingressrule.serviceName"]+
      ":"+o.data["kubernetes.ingressrule.servicePort"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.ingressrule.ingressUid"]; }, ingresses, function (o) { return o.metadata["kubernetes.ingress.uid"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
      return o.metadata["kubernetes.ingress.cluster"]+
      ":"+o.metadata["kubernetes.ingress.ingressClass"]+
      // ":"+o.data["kubernetes.ingressrule.servicePort"]+
      ":"+o.data["kubernetes.endpointtarget.protocol"]; },
    ingresscontrollers, function (o) {
      return o.metadata["kubernetes.ingresscontroller.cluster"]+
      ":"+o.metadata["kubernetes.ingresscontroller.class"]+
      // ":"+o.data["kubernetes.ingresscontroller.targetPort"]+
      ":"+o.data["kubernetes.ingresscontroller.protocol"]; });



  kubernetes_group = leftjoin(kubernetes_group, function (o) { return o.metadata["kubernetes.node.region"]; }, regions, function (o) { return o.data["aws.region.name"]; });





  // Ingress Controller entry into cluster
  listenerrule_group = leftjoin(listenerrules, function (o) { return o.metadata["aws.listenerrule.action"]; }, targetgroups, function (o) { return o.metadata["aws.targetgroup.arn"]; });
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
        return o.metadata["kubernetes.ingressrule.cluster"]+
        ":"+o.data["kubernetes.ingresscontroller.nodePort"]+
        ":"+o.data["kubernetes.ingressrule.host"]; },
      listenerrule_group, function (o) {
        return o.metadata["aws.targetgroup.cluster"]+
        ":"+o.data["aws.targetgroup.port"]+
        ":"+o.data["aws.listenerrule.hostHeader"]; });

  // console.log("asdfasdf"+kubernetes_group["test"])

  // Join to V2 Loadbalancer listeners
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
      return o.metadata["aws.listenerrule.cluster"]+
      ":"+o.metadata["aws.listenerrule.listener_arn"]; },
    loadbalancerlisteners, function (o) {
      return o.metadata["aws.loadbalancerlistener.cluster"]+
      ":"+o.metadata["aws.loadbalancerlistener.arn"]; });

  // Join Listeners to V2 Load Balancers
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
      return o.metadata["aws.loadbalancerlistener.cluster"]+
      ":"+o.metadata["aws.loadbalancerlistener.lb_arn"]; },
    loadbalancers, function (o) {
      return o.metadata["aws.loadbalancer.cluster"]+
      ":"+o.metadata["aws.loadbalancer.arn"]; });

  dns_group = leftjoin(dnsrecordtargets, function (o) { return o.metadata["aws.dnsrecordtarget.dnsRecordUid"]; }, dnsrecords, function (o) { return o.metadata["aws.dnsrecord.uid"]; });
  // Join load balancers to DNS entries
  kubernetes_group = leftjoin(kubernetes_group, function (o) {
      return o.metadata["aws.loadbalancer.cluster"]+
      ":"+o.metadata["aws.loadbalancer.dns"]+
      ":"+o.data["aws.listenerrule.hostHeader"]; },
    dns_group, function (o) {
      return o.metadata["aws.dnsrecordtarget.cluster"]+
      ":"+o.data["aws.dnsrecordtarget.target"]+
      ":"+o.data["aws.dnsrecord.name"]; });

/*
  //
  aws_group = leftjoin(dnsrecords, function (o) { return o.metadata["aws.dnsrecord.targets"]; }, loadbalancers, function (o) { return o.metadata["aws.loadbalancer.dns"]; });

  //
  aws_group = leftjoin(aws_group, function (o) { return o.data["aws.loadbalancer.name"]; }, autoscalinggroups, function (o) { return o.metadata["aws.autoscalinggroup.loadBalancerNames"]; });

  // Join to load balancer (v2) listeners
  aws_group = leftjoin(aws_group, function (o) { return o.metadata["aws.loadbalancer.arn"]; }, loadbalancerlisteners, function (o) { return o.metadata["aws.loadbalancerlistener.lb_arn"]; });

  // Join to classic load balancer listeners
  aws_group = leftjoin(aws_group, function (o) { return o.data["aws.loadbalancer.name"]; }, loadbalancerlisteners, function (o) { return o.metadata["aws.loadbalancerlistener.lb_name"]; });

  // Join to load balancer (v2) listener rules
  aws_group = leftjoin(aws_group, function (o) { return o.data["aws.dnsrecord.name"]+":"+o.metadata["aws.loadbalancerlistener.arn"]; }, listenerrules, function (o) { return o.data["aws.listenerrule.hostHeader"]+":"+o.metadata["aws.listenerrule.listener_arn"]; });

  // Join to target group (lbv2)
  aws_group = leftjoin(aws_group, function (o) { return o.metadata["aws.listenerrule.action"]; }, targetgroups, function (o) { return o.metadata["aws.targetgroup.arn"]; });

  // Join to target group to autoscaling groups
  aws_group = leftjoin(aws_group, function (o) { return o.metadata["aws.targetgroup.arn"]; }, autoscalinggroups, function (o) { return o.metadata["aws.autoscalinggroup.targetGroupARNs"]; });

  // Join to instances
  aws_group = leftjoin(aws_group, function (o) { return o.metadata["aws.autoscalinggroup.instances"]; }, instances, function (o) { return o.data["aws.instance.id"]; });
*/



  // console.log("aws_group", JSON.parse(JSON.stringify(aws_group)));
  // kubernetes_group = _.hashLeftOuterJoin(pods, function (o) { return o.metadata["kubernetes.pod.createdByUid"]; }, replicasets, function (o) { return o.metadata["kubernetes.replicaset.uid"]; });
  // kubernetes_group = _.hashLeftOuterJoin(kubernetes_group, function (o) { return o["kubernetes.replicaset.createdByUid"]; }, deployments, function (o) { return o["kubernetes.deployment.uid"]; });
  // kubernetes_group = _.hashLeftOuterJoin(kubernetes_group, function (o) { return o["kubernetes.pod.createdByUid"]; }, statefulsets, function (o) { return o["kubernetes.statefulset.uid"]; });
  // kubernetes_group = _.hashLeftOuterJoin(kubernetes_group, function (o) { return o["kubernetes.pod.createdByUid"]; }, daemonsets, function (o) { return o["kubernetes.daemonset.uid"]; });
  // kubernetes_group = _.hashLeftOuterJoin(kubernetes_group, function (o) { return o["kubernetes.pod.cluster"]; }, clusters, function (o) { return o["kubernetes.cluster.name"]; });
  // kubernetes_group = _.hashLeftOuterJoin(kubernetes_group, function (o) { return o["kubernetes.pod.node"]; }, nodes, function (o) { return o["kubernetes.node.name"]; });
  console.log("kubernetes_group", JSON.parse(JSON.stringify(kubernetes_group)));

  joined_data = kubernetes_group
  // console.log("joined_data", JSON.parse(JSON.stringify(joined_data)))
  // fgroup = removeUnkeyedNodes(joined_data)
  // console.log(keys)

  flattened_data = flattenData(joined_data);
  console.log("flattened_data", JSON.parse(JSON.stringify(flattened_data)))
}

function prepDataJson() {

    var keys = getKeyList();
    // console.log("Keys", keys);

    // Apply filter to working data
    setFilter($('#wt_filter').val())
    workingDataset = applyFilter(flattened_data, $('#wt_filter').val());

    // returns a new object
    workingDataset = deKeyData(workingDataset, keys)
    console.log("deKeyedData", JSON.parse(JSON.stringify(workingDataset)));
    deDupeData(workingDataset);
    console.log("deDupedData", JSON.parse(JSON.stringify(workingDataset)));

    // For each key selected, add the type template if a value doesn't already exist
    workingDataset = $.map(workingDataset, function(e) {
      for(i=0;i<keys.length;i++) {
        if(!(keys[i] in e)) {
          $.extend(e, typeTemplates[getKeyType(keys[i])])
        }
      }
      e.keys=jQuery.extend([], keys);
      e.value=1
      return e
    });

    console.log("missingKeysAdded", JSON.parse(JSON.stringify(workingDataset)));

    var values=[];
    values = workingDataset;

    //Make our data into a nested tree.
    nest = d3.nest();
    if(keys.length > 0) {
      for(i=0; i<keys.length-1; i++) {
        // console.log("Nesting "+keys[i]+" in level "+i);
        nest = nest.key(createNestingFunction(keys[i]));
      };
    }
    nest = nest.entries(values);
    console.log("nest", nest);

    //This will be a viz.data function;
    vizuly.core.util.aggregateNest(nest, ["value"], function (a, b) {
        return Number(a) + Number(b);
    });

    //Remove empty child nodes left at end of aggregation and add unqiue ids
    function removeEmptyNodes(node,parentId,childId) {
      if (!node) return;
      node.id=parentId + "_" + childId;
      if (node.values) {

        for(var i = node.values.length - 1; i >= 0; i--) {
            node.id=parentId + "_" + i;
            if(!node.values[i].key && !node.values[i][keys[keys.length - 1]]) {
                // ??
                node.values.splice(i, 1);
            }
            else {
              // Recurse eache value
              removeEmptyNodes(node.values[i],node.id,i)
            }
        }
      }
    }

    var node={};
    node.values = nest;
    removeEmptyNodes(node,"0","0");

    return nest;
}

function createNestingFunction(propertyName){
  return function(d){
            return d[propertyName];
         };
}

function createNestingFunction2(propertyName){
  return function(d){
            return trimLabel(d.key || d[keys[keys.length - 1]])
         };
}

function initialize() {


    viz = vizuly.viz.weighted_tree(document.getElementById("viz_container"));
    theme = vizuly.theme.weighted_tree(viz).skin(vizuly.skin.WEIGHTED_TREE_AXIIS);
    viz.data(data)                                                      // Expects hierarchical array of objects.
        .width("100%")                                                     // Width of component
        .height(screenHeight)                                                    // Height of component
        .children(function (d) { return d.values })                     // Denotes the property that holds child object array
        .key(function (d) { return d.id })                              // Unique key
        .value(function (d) { return d["agg_value"]; })
        .fixedSpan(-1)                                                  // fixedSpan > 0 will use this pixel value for horizontal spread versus auto size based on viz width
        .branchPadding(.07)
        .label(createNestingFunction2("foo"))
        .on("measure",onMeasure)                                        // Make any measurement changes
        .on("mouseover",onMouseOver)                                    // mouseover callback - all viz components issue these events
        .on("mouseout",onMouseOut)                                      // mouseout callback - all viz components issue these events
        .on("click",onClick)
        ;                                           // mouseout callback - all viz components issue these events
    //     // Open up some of the tree branches.
    //     // viz.toggleNode(data.values[2]);
    //     // viz.toggleNode(data.values[2].values[0]);
    //     // viz.toggleNode(data.values[3]);


    // svg = d3.select("svg").call(d3.behavior.zoom().on("zoom", function () {
    // svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    // }))

    //We use this function to size the components based on the selected value from the RadiaLProgressTest.html page.
    // changeSize(d3.select("#currentDisplay").attr("item_value"));
    changeSize(screenWidth+","+screenHeight);

}

function zoomed() {
  context.save();
  context.clearRect(0, 0, width, height);
  context.translate(d3.event.transform.x, d3.event.transform.y);
  context.scale(d3.event.transform.k, d3.event.transform.k);
  // drawPoints();
  context.restore();
}

function getDescriptionByType(type, data) {

  if(data.childProp_keys) {
    prefix="childProp_"
  } else {
    prefix=""
  }
  // console.log(type);
  switch(type) {
    case "kops.cluster":
      return makeDescription({
        "Cluster Name": data[prefix+"kops.cluster.name"],
        "Version": data[prefix+"kops.cluster.version"],
        "Topology": data[prefix+"kops.cluster.topology"],
        "Created": data[prefix+"kops.cluster.created"]
      })
    case "kubernetes.node":
      return makeDescription({
        "Name": data[prefix+"kubernetes.node.name"],
        "Region": data[prefix+"kubernetes.node.region"],
        "Availability Zone": data[prefix+"kubernetes.node.az"],
        "Role": data[prefix+"kubernetes.node.role"],
        "Public IP": data[prefix+"kubernetes.node.publicIp"],
        "Private IP": data[prefix+"kubernetes.node.privateIp"],
        "Machine Type": data[prefix+"kubernetes.node.machineType"],
        "Kernel Version": data[prefix+"kubernetes.node.kernelVersion"],
        "OS Image": data[prefix+"kubernetes.node.osImage"],
        "Cluster": data[prefix+"kubernetes.node.cluster"],
        "Created": data[prefix+"kubernetes.node.created"]
      })
    case "kubernetes.replicaset":
      return makeDescription({
        "Name": data[prefix+"kubernetes.replicaset.name"],
        "Cluster": data[prefix+"kubernetes.replicaset.cluster"],
        "Namespace": data[prefix+"kubernetes.replicaset.namespace"],
        "Created": data[prefix+"kubernetes.replicaset.created"]
      })
    case "kubernetes.deployment":
      return makeDescription({
        "Name": data[prefix+"kubernetes.deployment.name"],
        "Replicas": data[prefix+"kubernetes.deployment.replicas"],
        "Available Replicas": data[prefix+"kubernetes.deployment.availableReplicas"],
        "Cluster": data[prefix+"kubernetes.deployment.cluster"],
        "Namespace": data[prefix+"kubernetes.deployment.namespace"],
        "Created": data[prefix+"kubernetes.deployment.created"]
      })
    case "kubernetes.statefulset":
      return makeDescription({
        "Name": data[prefix+"kubernetes.statefulset.name"],
        "Replicas": data[prefix+"kubernetes.statefulset.replicas"],
        "Ready Replicas": data[prefix+"kubernetes.statefulset.readyReplicas"],
        "Cluster": data[prefix+"kubernetes.statefulset.cluster"],
        "Namespace": data[prefix+"kubernetes.statefulset.namespace"],
        "Created": data[prefix+"kubernetes.statefulset.created"]
      })
    case "kubernetes.daemonset":
      return makeDescription({
        "Name": data[prefix+"kubernetes.daemonset.name"],
        "Cluster": data[prefix+"kubernetes.daemonset.cluster"],
        "Namespace": data[prefix+"kubernetes.daemonset.namespace"],
        "Created": data[prefix+"kubernetes.daemonset.created"]
      })
    case "kubernetes.service":
      return makeDescription({
        "Service Name": data[prefix+"kubernetes.service.name"],
        "Service Type": data[prefix+"kubernetes.service.type"],
        "Cluster IP": data[prefix+"kubernetes.service.clusterIP"],
        "Cluster": data[prefix+"kubernetes.service.cluster"],
        "Namespace": data[prefix+"kubernetes.service.namespace"]
      })
    case "kubernetes.pod":
      return makeDescription({
        "Name": data[prefix+"kubernetes.pod.name"],
        "Pod IP": data[prefix+"kubernetes.pod.podIP"],
        "Host Network": data[prefix+"kubernetes.pod.hostNetwork"],
        "Cluster": data[prefix+"kubernetes.pod.cluster"],
        "Namespace": data[prefix+"kubernetes.pod.namespace"],
        "Node": data[prefix+"kubernetes.pod.node"]
      })
    case "kubernetes.container":
      return makeDescription({
        "Image": data[prefix+"kubernetes.container.image"],
        "Pod IP": data[prefix+"kubernetes.container.podIP"],
        "Cluster": data[prefix+"kubernetes.container.cluster"],
        "Namespace": data[prefix+"kubernetes.container.namespace"],
        "Node": data[prefix+"kubernetes.container.node"],
      })
    case "kubernetes.containerendpoint":
      return makeDescription({
        "Endpoint": data[prefix+"kubernetes.containerendpoint.endpoint"]
      })
    case "kubernetes.namespace":
      return makeDescription({
        "Name": data[prefix+"kubernetes.namespace.name"],
        "Cluster": data[prefix+"kubernetes.namespace.cluster"]
      })
    case "cluster":
      return '<div class="Rtable Rtable--2cols">'+
            '<div class="Rtable-cell cell-head">Kubernetes Version: </div>'+
            '<div class="Rtable-cell">x.x</div>'+
            '<div class="Rtable-cell cell-head">AWS Account: </div>'+
            '<div class="Rtable-cell">xxxx</div>'+
            '<div class="Rtable-cell cell-head">AWS Region: </div>'+
            '<div class="Rtable-cell">us-east-2</div>'+
            '</div>';
    case "region":
      return '<div class="Rtable Rtable--2cols">'+
            '<div class="Rtable-cell cell-head">Region Locale: </div>'+
            '<div class="Rtable-cell">Ohio</div>'+
            '</div>';
    case "deployment":
      return '<div class="Rtable Rtable--2cols">'+
            '<div class="Rtable-cell cell-head">Namespace: </div>'+
            '<div class="Rtable-cell">xxxx</div>'+
            '<div class="Rtable-cell cell-head">Replicas: </div>'+
            '<div class="Rtable-cell">3</div>'+
            '</div>';
    case "pod":
      return '<div class="Rtable Rtable--2cols">'+
            '<div class="Rtable-cell cell-head">Namespace: </div>'+
            '<div class="Rtable-cell">xxxx</div>'+
            '<div class="Rtable-cell cell-head">#Containers: </div>'+
            '<div class="Rtable-cell">2</div>'+
            '<div class="Rtable-cell cell-head">Container Image(s): </div>'+
            '<div class="Rtable-cell">xxxx/xxxx:xxx</div>'+
            '<div class="Rtable-cell cell-head">Container Status: </div>'+
            '<div class="Rtable-cell">2/2</div>'+
            '</div>';
    case "kubernetes.namespace.name":
      return '<div class="Rtable Rtable--2cols">'+
            '<div class="Rtable-cell cell-head">Labels: </div>'+
            '<div class="Rtable-cell">'+data.childProp_labels+'</div>'+
            '</div>';
    case "aws.dnsrecord":
      return makeDescription({
        "Type": data[prefix+"aws.dnsrecord.type"],
        "TTL": data[prefix+"aws.dnsrecord.ttl"]
      })
    case "aws.loadbalancer":
      return makeDescription({
        "Type": data[prefix+"aws.loadbalancer.type"],
        "Scheme": data[prefix+"aws.loadbalancer.scheme"],
        "Created": data[prefix+"aws.loadbalancer.createdTime"]
      })
    case "aws.loadbalancerlistener":
      return makeDescription({
        "Protocol": data[prefix+"aws.loadbalancerlistener.protocol"],
        "Port": data[prefix+"aws.loadbalancerlistener.port"],
        "Attached Certs": (data[prefix+"aws.loadbalancerlistener.numCerts"] || 0),
        "Instance Protocol": data[prefix+"aws.loadbalancerlistener.instanceProtocol"],
        "Instance Port": data[prefix+"aws.loadbalancerlistener.instancePort"]
      })
    case "aws.listenerrule":
      return makeDescription({
        "Priority": data[prefix+"aws.listenerrule.priority"]
      })
    case "aws.targetgroup":
      return makeDescription({
        "Protocol": data[prefix+"aws.targetgroup.protocol"],
        "Port": data[prefix+"aws.targetgroup.port"]
      })
    case "aws.autoscalinggroup":
      return makeDescription({
        "Desired Capacity": data[prefix+"aws.autoscalinggroup.desiredCapacity"],
        "Min Size": data[prefix+"aws.autoscalinggroup.minSize"],
        "Max Size": data[prefix+"aws.autoscalinggroup.maxSize"]
      })
    case "aws.instance":
      return makeDescription({
        "Instance Type": data[prefix+"aws.instance.instanceType"],
        "Private IP": data[prefix+"aws.instance.privateIpAddress"],
        "Launch Time": data[prefix+"aws.instance.launchTime"]
      })
    case "aws.region":
      return makeDescription({
        "Name": data[prefix+"aws.region.name"],
        "Locale": data[prefix+"aws.region.locale"]
      })
  }

  return null
}


function trimLabel(label) {
   return (String(label).length > 20) ? String(label).substr(0, 17) + "..." : label;
}


var datatip='<div class="tooltip" style="width: 250px; background-opacity:.5">' +
    '<div class="header1">HEADER1</div>' +
    // '<div class="header-rule"></div>' +
    // '<div class="header2"> HEADER2 </div>' +
    '<div class="header-rule"></div>' +
    '<div class="header3"> HEADER3 </div>' +
    '</div>';

// This function uses the above html template to replace values and then creates a new <div> that it appends to the
// document.body.  This is just one way you could implement a data tip.
function createDataTip(x,y,h1,h3) {

    var html = datatip.replace("HEADER1", h1);
    // html = html.replace("HEADER2", h2);
    html = html.replace("HEADER3", h3);

    d3.select("body")
        .append("div")
        .attr("class", "vz-weighted_tree-tip")
        .style("position", "absolute")
        .style("top", y + "px")
        .style("left", (x - 125) + "px")
        .style("opacity",0)
        .html(html)
        .transition().style("opacity",1);
}

function onMeasure() {
   // Allows you to manually override vertical spacing
   // viz.tree().nodeSize([100,0]);
}

function onMouseOver(e,d,i) {

    if (d == data) return;
    var rect = e.getBoundingClientRect();
    if (d.target) d = d.target; //This if for link elements

    // This craziness is to deal with the different types of data aggregation
    if(d.childProp_keys) {
      if(Array.isArray(d.childProp_keys[0])) {
        resource_type = getKeyType(d.childProp_keys[0][d.depth-1])
        description = getDescriptionByType(getKeyType(d.childProp_keys[0][d.depth-1]), d)
      } else {
        resource_type = getKeyType(d.childProp_keys[d.depth-1] || d.keys[d.depth-1])
        description = getDescriptionByType(getKeyType(d.childProp_keys[d.depth-1]), d)
      }
    } else {
      resource_type = getKeyType(d.keys[d.depth-1])
      description = getDescriptionByType(getKeyType(d.keys[d.depth-1]), d)
    }

    // Position path tooltips differently than points(g)
    if(e.tagName === "path") {
      x = rect.right
      y = rect.top+viz.height() *.05
    } else {
      x = rect.left
      y = rect.top+viz.height() *.05
    }

    createDataTip(x, y, resource_type, description);
}

function onMouseOut(e,d,i) {
    d3.selectAll(".vz-weighted_tree-tip").remove();
}

//We can capture click events and respond to them
function onClick(g,d,i) {
    viz.toggleNode(d);
}

//This changes the size of the component by adjusting the width/height;
function changeSize(val) {
  console.log("changing size to ", val);
    var s = String(val).split(",");
    viz_container.transition().duration(300).style('width', s[0] + 'px').style('height', s[1] + 'px');
    // viz.width(s[0]).height(s[1]*.8).update();
    viz.width(s[0]).height(s[1]).update();
}

//This sets the same value for each radial progress
// function changeData(val) {
//     valueField=valueFields[Number(val)];
//     viz.update();
// }

function refresh(dirtyDepth) {
  console.log("refreshing (depth "+dirtyDepth+" is dirty)");
  // d3.json("data/data.json", function (json) {

  // Clear the chart
  // $('#viz_container').children().remove();

    data.values=prepDataJson();
    // viz.toggleNode(d3.select('.vz-id-undefined'))
    viz.data(data);
    viz.update(true,dirtyDepth);
    // viz.toggleNode(data.values[0]);
    // viz.toggleNode(data.values[1]);
    // viz.toggleNode(data.values[2]);
  // });

}

function setFilter(filterValue) {
  // console.log("setting filter", filterValue);
  document.cookie = "filter="+filterValue
  filter = filterValue;
}

function applyFilter(datum, filterValue) {

  // console.log("Applying filter", filterValue);

  parsed_filters = [];
  parsed_filters = filterValue.split(",")
  parsed_filters.forEach(function(v, k) {
    parsed_filters[k] = v.split("=");
  })
  // console.log("Parsed Filter", parsed_filters);

  var result = []

  $.map(datum, function (e) {

    // Deep copy of entry
    var entry = $.extend(true, {}, e)

    filtered = false
    for(var i=0,ilen=parsed_filters.length; i<ilen; i++) {
      // for(var j=0,jlen=parsed_filters[i].length; j<ilen; j++) {
        if(entry[parsed_filters[i][0]] != parsed_filters[i][1]) {
          filtered = true
        }
      // }
    }

    if(!filtered) {
      result.push(entry);
    }
    // if(entry[eval(parsed_filter[0])] == parsed_filter[1]) {
    //   result.push(entry)
    // }
  });

  return result;
}
