

// Responsible for turning the pure json data into a flat, consumable format
// [{resource obj},{resource obj},..]
function buildDataList(json) {

  dataList = [];
  for(var cluster in json) {
    for(var i=0;i<json[cluster].length;i++) {
    // dataList = $.map(json, function(e,i) {
      // console.log(e.kind);
      e = json[cluster][i];
      switch(e.kind) {
        case "Namespace":
          dataList.push({
            "type": "kubernetes.namespace",
            "metadata": {
              "kubernetes.namespace.uid": cluster+":"+e.metadata.uid,
              "kubernetes.namespace.cluster": cluster,
            },
            "data": {
              "kubernetes.namespace.name": e.metadata.name
            }
          });
          break;
        case "Cluster":
          dataList.push({
            "type": "kops.cluster",
            "metadata": {
              "kops.cluster.uid": e.metadata.name,
              "kops.cluster.created": fmtDate(e.metadata.creationTimestamp)
            },
            "data": {
              "kops.cluster.name": e.metadata.name,
              "kops.cluster.version": e.spec.kubernetesVersion,
              "kops.cluster.topology": e.spec.topology.masters
            }
          });
          break;
        case "DaemonSet":
          dataList.push({
            "type": "kubernetes.daemonset",
            "metadata": {
              "kubernetes.daemonset.uid": cluster+":"+e.metadata.uid,
              "kubernetes.daemonset.namespace": e.metadata.namespace,
              "kubernetes.daemonset.cluster": cluster,
              "kubernetes.daemonset.created": fmtDate(e.metadata.creationTimestamp)
            },
            "data": {
              "kubernetes.daemonset.name": e.metadata.name
            }
          });
          break;
        case "StatefulSet":
          dataList.push({
            "type": "kubernetes.statefulset",
            "metadata": {
              "kubernetes.statefulset.uid": cluster+":"+e.metadata.uid,
              "kubernetes.statefulset.namespace": e.metadata.namespace,
              "kubernetes.statefulset.cluster": cluster,
              "kubernetes.statefulset.created": fmtDate(e.metadata.creationTimestamp)
            },
            "data": {
              "kubernetes.statefulset.name": e.metadata.name,
              "kubernetes.statefulset.replicas": e.spec.replicas,
              "kubernetes.statefulset.readyReplicas": e.status.readyReplicas
            }
          });
          break;
          case "Deployment":
            dataList.push({
              "type": "kubernetes.deployment",
              "metadata": {
                "kubernetes.deployment.uid": cluster+":"+e.metadata.uid,
                "kubernetes.deployment.cluster": cluster,
                "kubernetes.deployment.namespace": e.metadata.namespace,
                "kubernetes.deployment.created": fmtDate(e.metadata.creationTimestamp)
              },
              "data": {
                "kubernetes.deployment.name": e.metadata.name,
                "kubernetes.deployment.replicas": e.spec.replicas,
                "kubernetes.deployment.availableReplicas": e.status.availableReplicas
              }
            });
            break;
          case "Ingress":
            e.spec.rules.forEach(function(v, k) {
              v.http.paths.forEach(function(v2, k2) {
                dataList.push({
                  "type": "kubernetes.ingressrule",
                  "metadata": {
                    "kubernetes.ingressrule.uid": cluster+":"+e.metadata.uid+":"+v.host+":"+v2.path+":"+v2.backend.serviceName+":"+v2.backend.servicePort,
                    "kubernetes.ingressrule.cluster": cluster,
                    "kubernetes.ingressrule.namespace": e.metadata.namespace,
                    "kubernetes.ingressrule.ingressUid": cluster+":"+e.metadata.uid
                  },
                  "data": {
                    "kubernetes.ingressrule.path": v2.path,
                    "kubernetes.ingressrule.serviceName": v2.backend.serviceName,
                    "kubernetes.ingressrule.servicePort": v2.backend.servicePort,
                    "kubernetes.ingressrule.host": v.host
                  }
                });
              })
            })

            if(e.metadata.annotations) {
              ingressClass = e.metadata.annotations["kubernetes.io/ingress.class"]
            }
            dataList.push({
              "type": "kubernetes.ingress",
              "metadata": {
                "kubernetes.ingress.uid": cluster+":"+e.metadata.uid,
                "kubernetes.ingress.namespace": e.metadata.namespace,
                "kubernetes.ingress.cluster": cluster,
                "kubernetes.ingress.ingressClass": (ingressClass || "")
              },
              "data": {
                "kubernetes.ingress.name": e.metadata.name
              }
            });
            break;
          case "Service":
            if(e.spec.type === "NodePort") {
              for(j=0;j<e.spec.ports.length;j++) {
                // Not sure how else to identify the ingress controller nodePort service
                if(e.metadata.labels && e.metadata.labels.app && e.metadata.labels.app === "nginx-ingress") {
                  dataList.push({
                    "type": "kubernetes.ingresscontroller",
                    "metadata": {
                      "kuberentes.ingresscontroller.uid": cluster+":"+e.metadata.uid+":"+e.spec.ports[j].nodePort,
                      "kubernetes.ingresscontroller.cluster": cluster,
                      "kubernetes.ingresscontroller.class": "nginx"
                    },
                    "data": {
                      "kubernetes.ingresscontroller.nodePort": e.spec.ports[j].nodePort,
                      "kubernetes.ingresscontroller.port": e.spec.ports[j].port,
                      "kubernetes.ingresscontroller.targetPort": e.spec.ports[j].targetPort,
                      "kubernetes.ingresscontroller.protocol": e.spec.ports[j].protocol
                    }
                  });
                } else {
                  dataList.push({
                    "type": "kubernetes.nodePort",
                    "metadata": {
                      "kuberentes.nodePort.uid": cluster+":"+e.metadata.uid+":"+e.spec.ports[j].nodePort,
                      "kubernetes.nodePort.serviceUid": cluster+":"+e.metadata.uid,
                      "kubernetes.nodePort.service_name": e.metadata.name,
                      "kubernetes.nodePort.cluster": cluster
                    },
                    "data": {
                      "kubernetes.nodePort.nodePort": e.spec.ports[j].nodePort,
                      "kubernetes.nodePort.port": e.spec.ports[j].port,
                      "kubernetes.nodePort.targetPort": e.spec.ports[j].targetPort,
                      "kubernetes.nodePort.protocol": e.spec.ports[j].protocol
                    }
                  });
                }
              }
            }
            if(e.spec.ports) {
              for(var x=0,xlen=e.spec.ports.length; x < xlen; x++) {
                portdata = e.spec.ports[x];
                dataList.push({
                  "type": "kubernetes.serviceport",
                  "metadata": {
                    "kubernetes.serviceport.uid": cluster+":"+e.metadata.uid+":"+portdata.port+":"+portdata.protocol+":"+portdata.targetPort,
                    "kubernetes.serviceport.namespace": e.metadata.namespace,
                    "kubernetes.serviceport.cluster": cluster,
                    "kubernetes.serviceport.serviceName": e.metadata.name,
                    "kubernetes.serviceport.serviceUid": cluster+":"+e.metadata.uid
                  },
                  "data": {
                    "kubernetes.serviceport.port": portdata.port,
                    "kubernetes.serviceport.protocol": portdata.protocol,
                    "kubernetes.serviceport.targetPort": portdata.targetPort
                  }
                });
              }
            }
            dataList.push({
              "type": "kubernetes.service",
              "metadata": {
                "kubernetes.service.uid": cluster+":"+e.metadata.uid,
                "kubernetes.service.namespace": e.metadata.namespace,
                "kubernetes.service.cluster": cluster
              },
              "data": {
                "kubernetes.service.name": e.metadata.name,
                "kubernetes.service.clusterIP": e.spec.clusterIP,
                "kubernetes.service.type": e.spec.type
              }
            });
            break;
          case "Endpoints":
            for(var w=0,lenw=e.subsets.length; w < lenw; w++) {
              var addresses = (e.subsets[w].addresses || 0);
              var ports = e.subsets[w].ports;
              for(var x=0,lenx=addresses.length; x < lenx; x++) {
                for(var y=0,leny=ports.length; y < leny; y++) {
                  if(addresses[x].targetRef) {
                    targetRefUid = addresses[x].targetRef.uid
                  }
                  dataList.push({
                    "type": "kubernetes.endpointtarget",
                    "metadata": {
                      "kubernetes.endpointtarget.uid": cluster+":"+e.metadata.uid+":"+addresses[x].ip+":"+ports[y].port+":"+ports[y].protocol,
                      "kubernetes.endpointtarget.containerEndpointUid": cluster+":"+targetRefUid+":"+addresses[x].ip+":"+ports[y].protocol+":"+ports[y].port,
                      "kubernetes.endpointtarget.namespace": e.metadata.namespace,
                      "kubernetes.endpointtarget.cluster": cluster
                    },
                    "data": {
                      "kubernetes.endpointtarget.name": e.metadata.name,
                      "kubernetes.endpointtarget.ip": addresses[x].ip,
                      "kubernetes.endpointtarget.port": ports[y].port,
                      "kubernetes.endpointtarget.protocol": ports[y].protocol
                    }
                  });
                }
              }
            }
            break;
        case "ReplicaSet":
          var createdByUid = "none";
          if(e.metadata.hasOwnProperty("ownerReferences")) {
            createdByUid = e.metadata.ownerReferences[0].uid;
          }
          dataList.push({
            "type": "kubernetes.replicaset",
            "metadata": {
              "kubernetes.replicaset.uid": cluster+":"+e.metadata.uid,
              "kubernetes.replicaset.namespace": e.metadata.namespace,
              "kubernetes.replicaset.cluster": cluster,
              "kubernetes.replicaset.createdByUid": cluster+":"+createdByUid
            },
            "data": {
              "kubernetes.replicaset.name": e.metadata.name,
            }
          });
          break;
        case "Node":
          dataList.push({
            "type": "kubernetes.node",
            "metadata": {
              "kubernetes.node.uid": cluster+":"+e.metadata.uid,
              "kubernetes.node.cluster": cluster,
              "kubernetes.node.region": e.metadata.labels["failure-domain.beta.kubernetes.io/region"],
              "kubernetes.node.az": e.metadata.labels["failure-domain.beta.kubernetes.io/zone"],
              "kubernetes.node.created": fmtDate(e.metadata.creationTimestamp)
            },
            "data": {
              "kubernetes.node.name": e.metadata.name,
              "kubernetes.node.publicIp": $.map(e.status.addresses, function (a) { if (a.type === "ExternalIP") return a.address; return undefined;})[0],
              "kubernetes.node.privateIp": $.map(e.status.addresses, function (a) { if (a.type === "InternalIP") return a.address; return undefined;})[0],
              "kubernetes.node.machineType": e.metadata.labels["beta.kubernetes.io/instance-type"],
              "kubernetes.node.kernelVersion": e.status.nodeInfo.kernelVersion,
              "kubernetes.node.osImage": e.status.nodeInfo.osImage,
              "kubernetes.node.role": e.metadata.labels["kubernetes.io/role"]
            }
          });
          break;
        case "Pod":
          var createdByUid = "none";
          if(e.metadata.hasOwnProperty("annotations") && e.metadata.annotations.hasOwnProperty("kubernetes.io/created-by")) {
            createdByUid = JSON.parse(e.metadata.annotations["kubernetes.io/created-by"]).reference.uid;
          }
          hostNetwork = "false"
          if(e.spec.hostNetwork) {
            hostNetwork = "true"
          }
          numReady = 0
          numRestarts = 0
          e.status.containerStatuses.forEach(function (v, k) {
            if(v.ready === true) {
              numReady++
            }
            numRestarts += v.restartCount
          })

          dataList.push({
            "type": "kubernetes.pod",
            "metadata": {
              "kubernetes.pod.uid": cluster+":"+e.metadata.uid,
              "kubernetes.pod.createdByUid": cluster+":"+createdByUid,
              "kubernetes.pod.namespace": e.metadata.namespace,
              "kubernetes.pod.node": e.spec.nodeName,
              "kubernetes.pod.cluster": cluster,
              "kubernetes.pod.numContainers": e.spec.containers.length,
              "kubernetes.pod.numReadyContainers": numReady,
              "kubernetes.pod.numContainerRestarts": numRestarts
            },
            "data": {
              "kubernetes.pod.name": e.metadata.name,
              "kubernetes.pod.hostNetwork": hostNetwork,
              "kubernetes.pod.podIP": e.status.podIP
            }
          });
          for(j=0;j<e.spec.containers.length;j++) {
            c = e.spec.containers[j];

            containerEndpoints = {}
            if(c.ports) {
              containerEndpoints=$.map(c.ports, function(v,k) {
                ep = e.status.podIP+":"+v.protocol+":"+v.containerPort
                dataList.push({
                  "type": "kubernetes.containerendpoint",
                  "metadata": {
                    "kubernetes.containerendpoint.uid": cluster+":"+e.metadata.uid+":"+ep,
                    "kubernetes.containerendpoint.containerUid": cluster+":"+e.metadata.uid+":"+c.name,
                  },
                  "data": {
                    "kubernetes.containerendpoint.endpoint": e.status.podIP+":"+v.protocol+":"+v.containerPort
                  }
                });
                // return e.status.podIP+":"+v.protocol+":"+v.containerPort;
              });
            }
            dataList.push({
              "type": "kubernetes.container",
              "joindata": {
                "kubernetes.container.podUid": cluster+":"+e.metadata.uid
              },
              "metadata": {
                "kubernetes.container.uid": cluster+":"+e.metadata.uid+":"+c.name,
                "kubernetes.container.cluster": cluster,
                "kubernetes.container.namespace": e.metadata.namespace
                // "kubernetes.container.node": e.spec.nodeName,
                // "kubernetes.container.pod": e.metadata.name,
                //
                // "kubernetes.container.podIP": e.status.podIP
              },
              "data": {
                "kubernetes.container.name": c.name,
                "kubernetes.container.image": c.image
              }
            });
          }
          break;
        case "DnsRecord":
          // isPrivateZone = $.map(json, function(e) {
          //   if(e.kind == "HostedZone") {
          //     return e.HostedZone.Config.PrivateZone
          //   } else {
          //     return undefined
          //   }
          // })
          var targets = []
          if(e.AliasTarget) {
            targets = [e.AliasTarget.DNSName.substring(0, e.AliasTarget.DNSName.length - 1)]
          } else {
            targets = $.map(e.ResourceRecords, function(v, k) {
              return v.Value
            });
          }
          for(var x=0,xlen=targets.length;x < xlen; x++) {
            dataList.push({
              "type": "aws.dnsrecordtarget",
              "metadata": {
                "aws.dnsrecordtarget.uid": e.hostedZoneId+":"+e.Name+":"+targets[x],
                "aws.dnsrecordtarget.dnsRecordUid": e.hostedZoneId+":"+e.Name,
                "aws.dnsrecordtarget.cluster": cluster
              },
              "data": {
                "aws.dnsrecordtarget.target": targets[x]
              }
            });
          }
          dataList.push({
            "type": "aws.dnsrecord",
            "metadata": {
              "aws.dnsrecord.uid": e.hostedZoneId+":"+e.Name,
              // "aws.dnsrecord.targets": targets,
              "aws.dnsrecord.type": e.Type,
              "aws.dnsrecordtarget.cluster": cluster
            },
            "data": {
              "aws.dnsrecord.name": e.Name.replace(/\.$/, ""),
              "aws.dnsrecord.ttl": e.TTL,
              "aws.dnsrecord.hostedZoneId": e.hostedZoneId
              // "aws.dnsrecord.isPrivate": isPrivateZone[0]
            }
          });
          break;
        case "LoadBalancer":
          for(j=0;j<e.ListenerDescriptions.length;j++) {
            listener = e.ListenerDescriptions[j].Listener
            dataList.push({
              "type": "aws.loadbalancerlistener",
              "metadata": {
                "aws.loadbalancerlistener.uid": e.LoadBalancerName+""+listener.LoadBalancerPort,
                "aws.loadbalancerlistener.port": listener.LoadBalancerPort,
                "aws.loadbalancerlistener.protocol": listener.Protocol,
                "aws.loadbalancerlistener.lb_name": e.LoadBalancerName,
                "aws.loadbalancerlistener.instanceProtocol": listener.InstanceProtocol,
                "aws.loadbalancerlistener.instancePort": listener.InstancePort,
                "aws.loadbalancerlistener.cluster": cluster,
              },
              "data": {
                "aws.loadbalancerlistener.ident": listener.Protocol+":"+listener.LoadBalancerPort
              }
            });
          }
          dataList.push({
            "id": e.DNSName,
            "type": "aws.loadbalancer",
            "metadata": {
              "aws.loadbalancer.dns": e.DNSName,
              "aws.loadbalancer.createdTime": fmtDate(e.CreatedTime),
              "aws.loadbalancer.cluster": cluster,
            },
            "data": {
              "aws.loadbalancer.type": "classic",
              "aws.loadbalancer.name": e.LoadBalancerName,
              "aws.loadbalancer.scheme": e.Scheme
            }
          });
          break;
        case "LoadBalancerV2":
          dataList.push({
            "id": e.LoadBalancerArn,
            "type": "aws.loadbalancer",
            "metadata": {
              "aws.loadbalancer.arn": e.LoadBalancerArn,
              "aws.loadbalancer.dns": e.DNSName,
              "aws.loadbalancer.createdTime": fmtDate(e.CreatedTime),
              "aws.loadbalancer.cluster": cluster,
            },
            "data": {
              "aws.loadbalancer.type": e.Type,
              "aws.loadbalancer.name": e.LoadBalancerName,
              "aws.loadbalancer.scheme": e.Scheme
            }
          });
          break;
        case "LoadBalancerListener":
          dataList.push({
            "type": "aws.loadbalancerlistener",
            "metadata": {
              "aws.loadbalancerlistener.arn": e.ListenerArn,
              "aws.loadbalancerlistener.lb_arn": e.LoadBalancerArn,
              "aws.loadbalancerlistener.port": e.Port,
              "aws.loadbalancerlistener.protocol": e.Protocol,
              "aws.loadbalancerlistener.numCerts": e.Certificates.length,
              "aws.loadbalancerlistener.instanceProtocol": "",
              "aws.loadbalancerlistener.instancePort": "",
              "aws.loadbalancerlistener.cluster": cluster,
            },
            "data": {
              "aws.loadbalancerlistener.ident": e.Protocol+":"+e.Port
            }
          });
          break;
        case "ListenerRule":
          var hostHeader = "";
          var action = "";
          if(e.Actions) {
            var action = e.Actions[0].TargetGroupArn
          }
          for(j=0;j<e.Conditions.length;j++) {
            if(e.Conditions[j].Field == "host-header") {
              hostHeader = e.Conditions[j].Values[0]
            }
          }

          dataList.push({
            "type": "aws.listenerrule",
            "metadata": {
              "aws.listenerrule.arn": e.RuleArn,
              "aws.listenerrule.priority": e.Priority,
              "aws.listenerrule.isDefault": e.IsDefault,
              "aws.listenerrule.action": action,
              "aws.listenerrule.cluster": cluster,
              "aws.listenerrule.listener_arn": e.RuleArn.split("/")[0].replace(/listener-rule/, "listener")+
                                                    "/"+e.RuleArn.split("/")[1]+
                                                    "/"+e.RuleArn.split("/")[2]+
                                                    "/"+e.RuleArn.split("/")[3]+
                                                    "/"+e.RuleArn.split("/")[4]
            },
            "data": {
              "aws.listenerrule.hostHeader": hostHeader
            }
          });
          break;
        case "TargetGroup":
          dataList.push({
            "id": e.TargetGroupArn,
            "type": "aws.targetgroup",
            "metadata": {
              "aws.targetgroup.arn": e.TargetGroupArn,
              "aws.targetgroup.loadBalancerArns": e.LoadBalancerArns,
              "aws.targetgroup.cluster": cluster
            },
            "data": {
              "aws.targetgroup.name": e.TargetGroupName,
              "aws.targetgroup.protocol": e.Protocol,
              "aws.targetgroup.port": e.Port,
            }
          });
          break;
        case "AutoscalingGroup":
          instances = $.map(e.Instances, function(v, k) {
            return [v.InstanceId]
          });
          dataList.push({
            "id": e.AutoScalingGroupARN,
            "type": "aws.autoscalinggroup",
            "metadata": {
              "aws.autoscalinggroup.loadBalancerNames": e.LoadBalancerNames,
              "aws.autoscalinggroup.targetGroupARNs": e.TargetGroupARNs,
              "aws.autoscalinggroup.instances": instances
            },
            "data": {
              "aws.autoscalinggroup.name": e.AutoScalingGroupName,
              "aws.autoscalinggroup.minSize": e.MinSize,
              "aws.autoscalinggroup.maxSize": e.MaxSize,
              "aws.autoscalinggroup.desiredCapacity": e.DesiredCapacity
            }
          });
          break;
        case "InstanceGroup":
          dataList.push({
            "id": cluster+"-"+e.metadata.name,
            "type": "kops.instancegroup",
            "data": {
              "kops.instancegroup.name": e.metadata.name,
              "kops.instancegroup.cluster": e.metadata.labels["kops.k8s.io/cluster"],
              "kops.instancegroup.role": e.spec.role,
              "kops.instancegroup.ami": e.spec.image,
              "kops.instancegroup.minSize": e.spec.minSize,
              "kops.instancegroup.maxSize": e.spec.maxSize,
              "kops.instancegroup.machineType": e.spec.machineType,
              "kops.instancegroup.cluster": cluster
            }
          });
          break;
        case "Instance":
          dataList.push({
            "id": e.InstanceId,
            "type": "aws.instance",
            "metadata": {
              "aws.instance.launchTime": fmtDate(e.LaunchTime)
            },
            "data": {
              "aws.instance.id": e.InstanceId,
              "aws.instance.instanceType": e.InstanceType,
              "aws.instance.privateIpAddress": e.PrivateIpAddress
            }
          });

          break;
        default:
          break;
      }
    }
  }

  for(region in region_map) {
    dataList.push({
      "type": "aws.region",
      "metadata": {
      },
      "data": {
        "aws.region.name": region,
        "aws.region.locale": region_map[region]
      }
    });

  }

  return dataList;
}

var typeTemplates = {
  "kubernetes.service": {
    "kubernetes.service.uid": "",
    "kubernetes.service.namespace": "",
    "kubernetes.service.selector": "",
    "kubernetes.service.cluster": "",
    "kubernetes.service.name": "",
    "kubernetes.service.clusterIP": "",
    "kubernetes.service.type": ""
  },
  "kubernetes.endpoint": {
    "kubernetes.endpointtarget.ip": "",
    "kubernetes.endpointtarget.protocol": "",
    "kubernetes.endpointtarget.port": "",
    "kubernetes.endpointtarget.name": ""
  },
  "kubernetes.statefulset": {
    "kubernetes.statefulset.uid": "",
    "kubernetes.statefulset.namespace": "",
    "kubernetes.statefulset.cluster": "",
    "kubernetes.statefulset.created": "",
    "kubernetes.statefulset.name": "",
    "kubernetes.statefulset.replicas": "",
    "kubernetes.statefulset.readyReplicas": ""
  },
  "kubernetes.daemonset": {
    "kubernetes.daemonset.uid": "",
    "kubernetes.daemonset.namespace": "",
    "kubernetes.daemonset.cluster": "",
    "kubernetes.daemonset.created": "",
    "kubernetes.daemonset.name": ""
  },
  "aws.autoscalinggroup": {
    "aws.autoscalinggroup.loadBalancerNames": [],
    "aws.autoscalinggroup.targetGroupARNs": [],
    "aws.autoscalinggroup.instances": [],
    "aws.autoscalinggroup.name": "N/A",
    "aws.autoscalinggroup.minSize": "",
    "aws.autoscalinggroup.maxSize": "",
    "aws.autoscalinggroup.desiredCapacity": ""
  },
  "aws.listenerrule": {
    "aws.listenerrule.arn": "",
    "aws.listenerrule.priority": "",
    "aws.listenerrule.isDefault": "",
    "aws.listenerrule.action": "",
    "aws.listenerrule.listener_arn": "",
    "aws.listenerrule.hostHeader": ""
  },
  "aws.instance": {
    "aws.instance.id": "",
    "aws.instance.name": "",
    "aws.instance.instanceType": "",
    "aws.instance.privateIpAddress": "",
    "aws.instance.launchTime": ""
  }
}

function fmtDate(json_date) {
  return moment.utc(json_date).local().format('MM/DD/YY, h:mm a')
}

function getAvailableFields(resource_data_list) {
  var fields = []
  resource_data_list.forEach(function(resource, i) {
    for(field in resource.data) {
      if(fields.indexOf(field) === -1){
        fields.push(field);
      }
    }
  });
  return fields;
}

// Sorts the chosen levels in a order that is required for joining
// function getSortedTypes(keys) {
//   var typeSortOrder = [
//     "kubernetes.container",
//     "kubernetes.pod",
//     "kubernetes.replicaset",
//     "kubernetes.deployment",
//     "kubernetes.statefulset",
//     "kubernetes.daemonset",
//     "kubernetes.node",
//     "aws.instance",
//     "kops.instancegroup",
//     "aws.autoscalingroup",
//     "aws.targetgroup",
//     "aws.loadbalancer",
//     "aws.dnsrecord"
//   ];
//
//   var compressedKeyTypes = []
//   $.map(keys, function(e) {
//     var parts = e.split('.');
//     var type = parts[0]+'.'+parts[1];
//     if(compressedKeyTypes.indexOf(type) === -1) {
//       compressedKeyTypes.push(type)
//     }
//   });
//
//   sortedTypes = [];
//   values_found = 0;
//   for(i=0;i<typeSortOrder.length;i++) {
//     if(compressedKeyTypes.indexOf(typeSortOrder[i]) !== -1) {
//       sortedTypes.push(typeSortOrder[i]);
//       values_found++;
//     }
//   }
//
//   if(sortedTypes.length !== values_found) {
//     console.log("[Error] Keys lost during sorting operation. Ensure all types are present in typeSortOrder list.");
//   }
//
//   return sortedTypes;
// }

function find_join(first_type, second_type, tree, path, successful_paths) {
  console.log(path);
  for (var type in tree) {
    if (tree.hasOwnProperty(type)) {
      // Only log paths after we've found the starting point
      if(path.length) {
        path.push(type)
      }
      if(type === first_type) {
        console.log("found "+first_type+" looking for "+second_type)
        path.push(type);
      } else if (type === second_type) {
        console.log("found "+second_type)
        console.log("path",path)
        successful_paths.push(path)
      }
      if(tree[type] && !Array.isArray(tree[type]) && typeof tree[type] === 'object') {
        find_join(first_type, second_type, tree[type],path, successful_paths)
        path.pop(); // Pop off wherever we just were, it wasn't what we were looking for
      }
      // if(path.length > 0) {
      //   path.push(type);
      // }
      //
      // if(type === first_type) {
      //   console.log("found "+first_type+" looking for "+second_type)
      //   // Start the "recording"
      //   path.push(type);
      // } else if (type === second_type) {
      //   console.log("found "+second_type)
      //   console.log("path",path)
      // } else {
      // }
      //
      // if(tree[type] && !Array.isArray(tree[type]) && typeof tree[type] === 'object') {
      //   // console.log("diving into "+type)
      //   if(find_join(first_type, second_type, tree[type],path)) {
      //
      //   } else {
      //     path.pop();
      //   }
      // } else {
      //   return false; // dead end
      // }
    }


  }
  // return path
}

// Take in joined data
// Flatten into simple {[],[],[]} structure
// Remove keys that are not displayed and then unique the result
function flattenData(datum, keys) {

  flattened = $.map(datum, function (e) {

    // Deep copy of results
    return $.extend(true, {}, e.data, e.metadata);
  })

  // return removeDuplicates(flattened)
  return flattened
}

// Remove keys base-types that are in keys list
// Returns a new object
function deKeyData(datum, keys) {

  var result = []

  // Determine the base keys (ex: aws.loadbalancer)
  base_keys = []
  keys.forEach(function (v, k) {
    base_keys.push(getKeyType(v))
  })

  $.map(datum, function (e) {

    // Deep copy of entry
    var entry = $.extend(true, {}, e)

    // If key is not one of the base keys, delete it
    for(k in entry) {
      if(base_keys.indexOf(getKeyType(k)) === -1) {
        delete entry[k]
      }
    }

    result.push(entry)
  });

  return result
}

// Finds
function deDupeData(datum) {
  // var obj = {};

  indexesToRemove = []
  for (var i=0, len=datum.length; i < len; i++ ) {
    // Skip this index if it's already flagged for removal
    if(indexesToRemove.indexOf(i) === -1) {
      for(var j=i+1, len2=datum.length-(i+1); j < len; j++) {
        if(_.isEqual(datum[i], datum[j])) {
          indexesToRemove.push(j);
        }
      }
    }
  }

  indexesToRemove = indexesToRemove.sort(compare).reverse();
  for(var i=0;i<indexesToRemove.length;i++) {
    datum.splice(indexesToRemove[i], 1)
  }
  //
  // return datum
}

// Gets the base type of a key
function getKeyType(key) {
  return key.substr(0, key.lastIndexOf("."))
}

function getType(type) {
  return $.map(resource_data_list, function(e) { if(e["type"] === type) return e; return undefined; });
}

function leftjoin(left, leftKeyFunc, right, rightKeyFunc) {
  var result = []
  for(var lk=0;lk<left.length;lk++) {
    var leftMerged = false
    for(var rk=0;rk<right.length;rk++) {
      lkf=leftKeyFunc(left[lk]);
      rkf=rightKeyFunc(right[rk]);
      // if(Array.isArray(lkf)) {
      //   if(lkf.indexOf(rkf) !== -1) {
      //     leftMerged = true
      //     result.push(mergeDataRecords(left[lk], right[rk]));
      //   }
      // } else if(Array.isArray(rkf)) {
      //   if(rkf.indexOf(lkf) !== -1) {
      //     leftMerged = true
      //     result.push(mergeDataRecords(left[lk], right[rk]));
      //   }
      // } else {
        if(lkf !== undefined && !lkf.includes("undefined") && lkf === rkf) {
          leftMerged = true
          result.push(mergeDataRecords(left[lk], right[rk]));
        }
      // }

    }

    // If this record was not merged with any others, insert it as-is
    if(!leftMerged) {
      result.push($.extend({}, left[lk]))
    }

    // result.push(newleft);
  }

  // If we pushed any new records, use those
  return result;
}

// Merges data sets
function mergeDataRecords(left, right) {

  // Do a deep copy of each record into a new record
  newRecord=$.extend(true, {}, left, right)

  // Change record type to mixed indicating is has been merged
  newRecord.type="mixed"

  // Delete the id as it doesn't apply anymore
  // delete newRecord.id

  // Add new ids/types to joined arrays
  // This is used to note what has been merged into this data item
  if(!newRecord.joinedIds) { newRecord.joinedIds = [left.id] }
  if(!newRecord.joinedTypes) { newRecord.joinedTypes = [left.type] }
  newRecord.joinedIds.push(right.id)
  newRecord.joinedTypes.push(right.type)
  // console.log(newRecord);
  return newRecord
}




function compare(a,b) {
  if (a < b)
    return -1;
  if (a > b)
    return 1;
  return 0;
}
