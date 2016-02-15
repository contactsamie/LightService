var graphArg = {
    boxSelectionEnabled: false,
    autounselectify: true,
    layout: {
        name: 'grid'
    }
};
graphArg.style = [{
    selector: 'node',
    style: {
        'width': '60px',
        'height': '60px',
        'content': 'data(id)',
        'pie-size': '80%',
        'pie-1-background-color': '#E8747C',
        'pie-1-background-size': 'mapData(error, 0, 10, 0, 100)',
        'pie-2-background-color': '#74CBE8',
        'pie-2-background-size': 'mapData(unknown, 0, 10, 0, 100)',
        'pie-3-background-color': '#74E883',
        'pie-3-background-size': 'mapData(success, 0, 10, 0, 100)'
    }
},

   {
       selector: 'edge',
       style: {
           'width': 4,
           'target-arrow-shape': 'triangle',
           'line-color': '#9dbaea',
           'target-arrow-color': '#9dbaea'
       }
   }
];
var nodes = {};

light.service("addNode", function (arg) {
    graphArg.elements = graphArg.elements || {};
    graphArg.elements.nodes = graphArg.elements.nodes || [];
    graphArg.elements.nodes.push({
        data: {
            id: arg.id,
            error: arg.error,
            unknown: arg.unknown,
            success: arg.success
        }
    });

    nodes[arg.id] = arg.link;
});
light.service("connect", function (arg) {
    if (!nodes[arg.from]) {
        this.service().addNode({
            id: arg.from,
            error: arg.fromError,
            success: arg.fromSuccess,
            unknown: arg.fromUnknown,
            link: arg.fromLink
        });
    }
    if (!nodes[arg.to]) {
        this.service().addNode({
            id: arg.to,
            error: arg.toError,
            success: arg.toSuccess,
            unknown: arg.toUnknown,
            link: arg.toLink
        });
    }

    graphArg.elements = graphArg.elements || {};
    graphArg.elements.edges = graphArg.elements.edges || [];
    graphArg.elements.edges.push({
        data: {
            source: arg.from,
            target: arg.to,
            weight: 1
        }
    });
});
light.service("draw", function (arg) {
    arg = arg || {};
    arg.containerId = arg.containerId || "cy";
    arg.resultId = arg.resultId || "definition";
    arg.layout = arg.layout || {};
    arg.layout.name = arg.layout.name || "grid";
    $(function () {
        graphArg.layout = arg.layout;
        graphArg.container = document.getElementById(arg.containerId);
        var cy = window.cy = cytoscape(graphArg);
        cy.on('tap', function (evt) {
            console.info(nodes[evt.cyTarget.id()]);
            $('#' + arg.resultId).html((nodes[evt.cyTarget.id()]).toString());
        });
    });
});
light.receive("UI_RESPONSE_TO_EVENT_CHANGE_MESSAGE", function (arg) {
    arg = arg || {};
    var records = this.service().timemachine_record().result();
    for (var i = 0; i < records.length; i++) {
        var currentRecord = records[i];
        var nextRecord = records[i + 1] || {
            methodType: "end",
            methodName: ""
        };
        var connectObj = {
            fromLink: currentRecord.link,
            fromError: currentRecord.info === "event:error" ? 10 : 0,
            fromSuccess: ((currentRecord.dataType === "argument") || (currentRecord.info !== "event:error")) ? 10 : 0,
            fromUnknown: 0,
            toLink: nextRecord.link,
            toError: nextRecord.info === "event:error" ? 10 : 0,
            toSuccess: ((nextRecord.dataType === "argument") || (nextRecord.info !== "event:error")) ? 10 : 0,
            toUnknown: 0,
            from: (arg.useShortNames ? currentRecord.position : ((currentRecord.dataType === "argument" ? "in:" : "out:") + currentRecord.methodType + ":" + currentRecord.methodName)) + (arg.streatchOutCalls ? ("# " + currentRecord.position) : ""),
            to: (arg.useShortNames ? nextRecord.position : ((nextRecord.dataType === "argument" ? "in:" : "out:") + nextRecord.methodType + ":" + nextRecord.methodName)) + (arg.streatchOutCalls ? ("# " + nextRecord.position) : ""),
        };
        this.service().connect(connectObj);
    }
    this.service().draw(arg);
});


light.onSystemRecordEvent(function (e) {
    light(function () {      
        light.send("UI_RESPONSE_TO_EVENT_CHANGE_MESSAGE");       
    });
});
/*

light.service("one", function() {
   return "one";
});
light.service("two", function() {
   return "two";
});
light.service("three", function() {
   throw "three";
});
light.service("four", function() {
   return "four";
});
light.service("five", function() {
   return me;
});
light.service("six", function() {
   return "six";
});

light(function(service, system) {
   system.recordStart();
   service.one().two().three().four().five().six();
});
light(function(service) {
   service.visual({
      useShortNames: false,
      streatchOutCalls: false,
      containerId: "cy",
      resultId: "definition",
      layout: {
         name: "circle"//circle,concentric, preset, random,breadthfirst,grid
      }
   });
});

*/