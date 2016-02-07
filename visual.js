var graphArg = {
    boxSelectionEnabled: false,
    autounselectify: true,
    layout: {
        name: 'concentric'// 'grid'// 'dagre'
    }
};
graphArg.style = [
    {
        selector: 'node',
        style: {
            'content': 'data(id)',
            'text-opacity': 0.5,
            'text-valign': 'center',
            'text-halign': 'right',
            'background-color': '#11479e'
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
            id: arg
        }
    });

    nodes[arg] = true;
});
light.service("connect", function (arg) {
    if (!nodes[arg.from]) {
        this.addNode(arg.from);
    }
    if (!nodes[arg.to]) {
        this.addNode(arg.to);
    }

    graphArg.elements = graphArg.elements || {};
    graphArg.elements.edges = graphArg.elements.edges || [];
    graphArg.elements.edges.push({
        data: {
            source: arg.from,
            target: arg.to
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
    });
});
light.service("visualizeCalls", function (arg, service, system) {
    var records = system.getAllRecords(50,60);
    for (var i = 0; i < records.length; i++) {
        var currentRecord = records[i];
        var nextRecord = records[i + 1] || { methodType: "end", methodName: "" };
        service.connect({
            from: (currentRecord.dataType === "argument" ? "in:" : "out:") + currentRecord.methodType + ":" + currentRecord.methodName,//+ currentRecord.position,
            to: (nextRecord.dataType === "argument" ? "in:" : "out:") + nextRecord.methodType + ":" + nextRecord.methodName,//+ nextRecord.position,
        });
    }
    service.draw("cy");
});