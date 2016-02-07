var graphArg = {
    boxSelectionEnabled: false,
    autounselectify: true,
    layout: {
      //  padding: 10,
        name: 'grid'// 'circle'//'concentric'// 'grid'// 'dagre'
    }
};
graphArg.style = [
    {
        selector: 'node',
        style: {
            //'content': 'data(id)',
            //'text-opacity': 0.5,
            //'text-valign': 'center',
            //'text-halign': 'right',
            //'background-color': '#11479e',

            
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
        this.addNode({ id: arg.from ,error:arg.fromError,success:arg.fromSuccess,unknown:arg.fromUnknown , link:arg.fromLink});
    }
    if (!nodes[arg.to]) {
        this.addNode({ id: arg.to, error: arg.toError, success: arg.toSuccess, unknown: arg.toUnknown,link:arg.toLink });
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
    light.service("http://code.jquery.com/jquery-2.0.3.min.js").load();
    light.service("http://cytoscape.github.io/cytoscape.js/api/cytoscape.js-latest/cytoscape.min.js").load();
    light.service("https://cdn.rawgit.com/cpettitt/dagre/v0.7.4/dist/dagre.min.js").load();
    light.service("https://cdn.rawgit.com/cytoscape/cytoscape.js-dagre/1.1.2/cytoscape-dagre.js").load();

    $(function () {
        graphArg.container = document.getElementById(arg);
        var cy = window.cy = cytoscape(graphArg);
        cy.on('tap', function (evt) {
            console.info(nodes[evt.cyTarget.id()]);
            $('#definition').html((nodes[evt.cyTarget.id()]).toString());
        });
    });
});
light.service("visualizeCalls", function (arg, service, system) {
    var records = system.getAllRecords(150,220);
    for (var i = 0; i < records.length; i++) {
        var currentRecord = records[i];
        var nextRecord = records[i + 1] || { methodType: "end", methodName: "" };
        service.connect({
            fromLink:currentRecord.link,
            fromError: currentRecord.info === "event:error"?10:0,
            fromSuccess: ((currentRecord.dataType === "argument") || (currentRecord.info !== "event:error")) ? 10 : 0,
            fromUnknown: 0,
            toLink: nextRecord.link,
            toError: nextRecord.info === "event:error" ? 10 : 0,
            toSuccess: ((nextRecord.dataType === "argument") || (nextRecord.info !== "event:error")) ? 10 : 0,
            toUnknown: 0,
            from: (currentRecord.dataType === "argument" ? "in:" : "out:") + currentRecord.methodType + ":" + currentRecord.methodName + "# " + currentRecord.position,
            to: (nextRecord.dataType === "argument" ? "in:" : "out:") + nextRecord.methodType + ":" + nextRecord.methodName+"# "+ nextRecord.position,
        });
    }
    service.draw("cy");
});