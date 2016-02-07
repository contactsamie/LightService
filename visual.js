$(function () {
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

        nodes[arg]=true;

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
        $(function () {
            graphArg.container = document.getElementById(arg);
            var cy = window.cy = cytoscape(graphArg);
        });
    });
    light(function (service, system) {
       
        var records = system.getAllRecords();
        for (var i = 0; i < records.length; i++) {
            var currentRecord = records[i];
            var nextRecord = records[i + 1] || {methodType:"end",methodName:""};

            service.connect({
                from: (currentRecord.dataType === "argument" ? "in:" : "out:") + currentRecord.methodType + ":" + currentRecord.methodName,//+ currentRecord.position,
                to: (nextRecord.dataType === "argument" ? "in:" : "out:") + nextRecord.methodType + ":" + nextRecord.methodName,//+ nextRecord.position,
            });
      
        }

        service.draw("cy");
     
       
    });
});