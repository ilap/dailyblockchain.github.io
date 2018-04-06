var graphics = Viva.Graph.View.webglGraphics();
//writeToScreen("SSSSSSSS:");
//var client = Client;

//writeToScreen(JSON.stringify(client));
//client.registerMethod("getAllTxs", "http://cardanoexplorer.com/api/txs/last", "GET");
//client.registerMethod("getTxSummary", "http://cardanoexplorer.com/api/txs/summary/${id}", "GET");

var args = {
    path: {
        "id": "abd8c6ee1ea138a532b4bc25976a011c84c942c41203e943fe5f6c6f5e94a341"
    },
    headers: {
        "test-header": "client-api"
    }
}
var isWebgl = graphics.isSupported();
if (!isWebgl) {
    alert("Turn on webgl or use modern browser");
}

var graph = Viva.Graph.graph(),
    layout = Viva.Graph.Layout.forceDirected(graph, {
        springLength: 80,
        springCoeff: 0.0002,
        dragCoeff: 0.009,
        gravity: -30,
        theta: 0.7
    }),

    minNodeSize = 1,
    maxNodeSize = 100000000;


function log10(val) {
    return Math.log(val) / Math.LN10;
}

function log2(val) {
    return Math.log(val) / Math.LN2;
}

var scaleType = "LOG"; // LINEAR

var getNodeColor = function (node) {
        // here different colors for tx, input, output, mixed and txconfirmed
        if (node.data && node.data.t && node.data.t == "i") {
            return 0x00FF00;
        } else if (node.data && node.data.t && node.data.t == "o") {
            return 0xFF0000;
        } else if (node.data && node.data.t && node.data.t == "m") {
            return 0xFFA500;
        }
        return 0x008ED2;
    },

    getNodeSize = function (node) {
        if (!node.data || !node.data.s) {
            return 50;
        }
        var rmin = 32;
        var rmax = 96;


        // linear normalization to a range rmin,rmax
        if (scaleType == "LINEAR") {
            return rmin + (rmax - rmin) * ((node.data.s - minNodeSize) / (maxNodeSize - minNodeSize));
        } else {
            // log normalization to a range rmin,rmax
            var min = log2(minNodeSize);
            var max = log2(maxNodeSize);
            var val = log2(node.data.s);

            // linear scaling from min.max -> rmin rmax
            return rmin + (rmax - rmin) * ((val - min) / (max - min));
        }
    },

    getNodeDetails = function (node) {
        // 
        // http://blockchain.info/rawtx/$tx_index?format=json
        var label = "transaction";
        var id = node.id;
        if (node.data && node.data.t) {
            if (node.data.t == "i") {
                // input node
                label = "input";
            } else if (node.data.t == "o") {
                // output node
                label = "output";
            } else if (node.data.t == "mix") {
                // node which is both input and output
                label = "input/output";
            }

            // for addresses infor cors not enabled :-( 
            // enabled for blocks

            var balance = 0;
            //lets get balance
            $.ajax({
                //url:"http://blockchain.info/address/"+id+"?format=json&limit=1&cors=true",
                //url:"http://blockchain.info/rawblock/123?cors=true&format=json",
                url: "https://blockchain.info/q/addressbalance/" + id + "?cors=true",
                async: false,
                crossDomain: true,
                dataType: "text",
                success: function (text) {
                    balance = text / 100000000;
                }
            });

            //document.getElementById("info").innerHTML = label + "<br/>" + id + "<br/>balance: " + balance + " BTC";

        } else {
            // transaction node
            //document.getElementById("info").innerHTML = label + "<br/>" + id;
        }
    };

// need to get these 2 from yavis.reddit.min.js
graphics.setLinkProgram(Viva.Graph.View.webglDualColorLinkProgram());
graphics.setNodeProgram(Viva.Graph.View.webglCustomNodeProgram());

graphics
    .node(function (node) {
        var img = Viva.Graph.View.webglSquare(getNodeSize(node), getNodeColor(node));
        return img;
    })
    .link(function (link) {
        var fromColor, toColor;
        fromColor = toColor = 0x808080;
        var line = Viva.Graph.View.webglDualColorLine(fromColor, toColor);
        line.oldStart = fromColor;
        line.oldEnd = toColor;
        return line;
    });

var renderer = Viva.Graph.View.renderer(graph, {
    layout: layout,
    graphics: graphics,
    container: document.getElementById('g')
    //prerender  : 10
});



var events = Viva.Graph.webglInputEvents(graphics, graph),
    lastHovered = null,

    colorLinks = function (node, color) {
        if (node && node.id) {
            graph.forEachLinkedNode(node.id, function (node, link) {
                if (color) {
                    link.ui.start = link.ui.end = color;
                } else {
                    //link.ui.start = link.ui.oldStart; 
                    //link.ui.end =link.ui.oldEnd;
                    link.ui.start = link.ui.end = 0x80808040;
                }
            });
        }
    };

events.mouseEnter(function (node) {

    getNodeDetails(node);

    colorLinks(lastHovered);
    lastHovered = node;

    graph.forEachLinkedNode(node.id, function (node, link) {
        link.ui.start = link.ui.end = 0xffffffff;
        graphics.bringLinkToFront(link.ui);
    });

    renderer.rerender();
}).mouseLeave(function (node) {

    colorLinks(lastHovered);
    lastHovered = null;

    colorLinks(node);
    renderer.rerender();
});


// pause rendere on spacebar
var paused = false;

var width = $("#g").width(),
    height = $("#g").height();

renderer.run();
graphics.scale(0.15, {
    x: width / 2,
    y: height / 2
});

// websockets part


var linksBuffer = [];
var wsUri = "ws://ws.blockchain.info/inv";
if (document.location.protocol.indexOf("https") === 0) {
    wsUri = "wss://ws.blockchain.info/inv";
}
var output;

function init() {
    output = document.getElementById("output");
    testWebSocket();
    //testRestAPI();
}


var colorNodes = function (node, color) {
    if (node && node.id) {
        graph.forEachNode(function (node) {
            if (color) {
                node.ui.color = color;
            }
        });
    }
};

function addNodes(link) {

    if (link.t == "i") {
        var node = graph.getNode(link.from);
        if (!node) {
            graph.addNode(link.from, {
                s: link.value,
                t: link.t
            });
        } else {
            // such a node already exists
            if (node.data && node.data.t && node.data.t == "o") {
                node.data.t = "mix";
                node.ui.color = 16776960;
                renderer.rerender();
            }
        }
    } else if (link.t == "o") {
        var node = graph.getNode(link.to);
        if (!node) {
            graph.addNode(link.to, {
                s: link.value,
                t: link.t
            });
        } else {
            // such a node alredy exists.  
            if (node.data && node.data.t && node.data.t == "i") {
                node.data.t = "mix";
                node.ui.color = 16776960;
                renderer.rerender();
            }
        }
    }
}

function testWebSocket() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function (evt) {
        onOpen(evt)
    };
    websocket.onclose = function (evt) {
        onClose(evt)
    };
    websocket.onmessage = function (evt) {
        onMessage(evt)
    };
    websocket.onerror = function (evt) {
        onError(evt)
    };
}

function onOpen(evt) {
    //writeToScreen("CONNECTED");
    doSend({
        "op": "unconfirmed_sub"
    });
}

function onClose(evt) {
    //writeToScreen("DISCONNECTED");
}

function onMessage(evt) {
    // parse message
    var msg = JSON.parse(evt.data);
    var txHash = msg.x.hash;
    if (msg.op == "utx") {
        // uncorfimed transactions
        var inputs = msg.x.inputs;
        var outputs = msg.x.out;
        // generate from to 
        var links = [];
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            links.push({
                from: input.prev_out.addr,
                to: txHash,
                value: input.prev_out.value,
                t: "i"
            });
        }
        for (var j = 0; j < outputs.length; j++) {
            var output = outputs[j];
            links.push({
                from: txHash,
                to: output.addr,
                value: output.value,
                t: "o"
            });
        }
    }


    // flush the buffer if not empty
    if (!paused && linksBuffer.length > 0) {
        for (var i = 0; i < linksBuffer.length; i++) {
            var link = linksBuffer[i];

            addNodes(link)
            graph.addLink(link.from, link.to);
        }
        linksBuffer = [];
    }

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link.value > maxNodeSize) {
            maxNodeSize = link.value;
        }

        if (!paused) {
            addNodes(link);
            graph.addLink(link.from, link.to);
        } else {
            // add links to a buffer
            linksBuffer.push(link);
        }
        //writeToScreen('<span style="color: blue;">from: ' + link.from+' to ' +link.to+' value: '+ (link.value/100000000)+'</span>'); 
    }
    //websocket.close(); 
}

function onError(evt) {
    //writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
}

function doSend(message) {
    //writeToScreen("SENT: " + JSON.stringify(message));
    websocket.send(JSON.stringify(message));
}

function writeToScreen(message) {
    //var pre = document.createElement("p");
    //pre.style.wordWrap = "break-word";
    //pre.innerHTML = message;
   // output.appendChild(pre);
    //console.log("DDDDDDDDDDDDDDDDDDD ")
    document.getElementById("info").innerHTML =  "<br/>" + message ;
}

//function testRestAPI() {
    //writeToScreen('TEEEEEESSSSS')
//client.methods.getAllTxs(function (data, response) {
// parsed response body as js object 
//console.log(data);
//writeToScreen('DATA:' + data); 
//processData(data.Right)
// raw response 
//console.log(response);
//setTimeout(function () {
//    getNodes()
//}, 3000);
//});
//}


function processData(data) {
// parse message
if (data.length === 0) {
return
}

for (var i = 0; i < data.length; i++) {
var txHash = data[i].cteId;

args.path.id = txHash
var node = {}

/*client.methods.getTxSummary(args, function (msg, response) {
    var node = msg.Right

    writeToScreen('NIDE:' + node); 

    var links = [];
    var inputs = node.ctsInputs;
    var outputs = node.ctsOutputs;


    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        links.push({
            from: input[0],
            to: txHash,
            value: input[1].getCoin,
            t: "i"
        });
    }
    for (var j = 0; j < outputs.length; j++) {
        var output = outputs[j];
        links.push({
            from: txHash,
            to: output[0],
            value: output[1].getCoin,
            t: "o"
        });
    }

    // flush the buffer if not empty
    if (!paused && linksBuffer.length > 0) {
        for (var i = 0; i < linksBuffer.length; i++) {
            var link = linksBuffer[i];

            addNodes(link)
            graph.addLink(link.from, link.to);
        }
        linksBuffer = [];
    }

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link.value > maxNodeSize) {
            maxNodeSize = link.value;
        }

        if (!paused) {
            addNodes(link);
            graph.addLink(link.from, link.to);
        } else {
            // add links to a buffer
            linksBuffer.push(link);
        }

    }
});*/
 }
}
window.addEventListener("load", init, false);
window.l = layout;
window.g = graph;
window.r = renderer;
