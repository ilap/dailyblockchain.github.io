var Client = require('node-rest-client').Client;
var Viva = require('./js/vivagraph.js');

var graph = Viva.Graph.graph(),
layout = Viva.Graph.Layout.forceDirected(graph, {
   springLength : 80,
   springCoeff : 0.0002,
   dragCoeff : 0.009,
   gravity : -30,
   theta : 0.7
}), 

minNodeSize = 1,
maxNodeSize = 100000000;

var linksBuffer = [];
var nodes = [];
var client = new Client();
var paused = false;

// registering remote methods 
// http://cardano-explorer.cardano-mainnet.iohk.io
client.registerMethod("getAllTxs", "http://cardanoexplorer.com/api/txs/last", "GET");
client.registerMethod("getTxSummary", "http://cardanoexplorer.com/api/txs/summary/${id}", "GET");

var args = {
  path: {
    "id": "abd8c6ee1ea138a532b4bc25976a011c84c942c41203e943fe5f6c6f5e94a341"
  },
  headers: {
    "test-header": "client-api"
  }
}

function getNodes() {
  client.methods.getAllTxs(function (data, response) {
    // parsed response body as js object 
    console.log(data);
    processData(data.Right)
    // raw response 
    //console.log(response);
    setTimeout(function () {
      getNodes()
    }, 3000);
  });

}


function processData(data) {
  // parse message
  if (data.length === 0) {
    return
  }

  for (var i = 0; i < data.length; i++) {
    var txHash = data[i].cteId;

    args.path.id = txHash
    var node = {}

    client.methods.getTxSummary(args, function (msg, response) {
        var node = msg.Right

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
    });
  }

  function addNodes(link){
        
    if(link.t == "i"){
        var node = graph.getNode(link.from); 
        if( !node ){
            graph.addNode(link.from,{s:link.value,t:link.t});
        } else {
            // such a node already exists
            if(node.data && node.data.t && node.data.t == "o" ){
                node.data.t = "mix";
                node.ui.color = 16776960;
                renderer.rerender();
            }
        }
    } else if(link.t == "o"){
        var node = graph.getNode(link.to); 
        if( ! node){
            graph.addNode(link.to,{s:link.value,t:link.t});
        } else {
            // such a node alredy exists.  
            if(node.data && node.data.t && node.data.t == "i"){
                node.data.t = "mix";
                node.ui.color = 16776960;
                renderer.rerender();
            }
        }
    } 
 }
}


  getNodes()

  /*
  {
    "Right": {
      "ctsId": "ce496932e0790ffd5f5c0508e47c6ce8402ca1895ffcd82e2807cdb4175dc605",
      "ctsTxTimeIssued": 1522916011,
      "ctsBlockTimeIssued": 1522916011,
      "ctsBlockHeight": 835552,
      "ctsBlockEpoch": 38,
      "ctsBlockSlot": 14846,
      "ctsBlockHash": "988a53dfdce3436fd2af3713e4bd2eafb765df6f6abb8ec9294d06819068a1b2",
      "ctsRelayedBy": null,
      "ctsTotalInput": {
        "getCoin": "3401243989640"
      },
      "ctsTotalOutput": {
        "getCoin": "3401243818394"
      },
      "ctsFees": {
        "getCoin": "171246"
      },
      "ctsInputs": [
        ["DdzFFzCqrhsr1JEpS1we2HwZmqSzL5smsSxc3C7BEvW9EgNSfRs9gfHtZR6MFXuhe8fW6QMTaEQhG7fMgPp9xj8eknNScUsbijpqHaUN", {
          "getCoin": "3401243989640"
        }]
      ],
      "ctsOutputs": [
        ["DdzFFzCqrhtBayunsgFcocQJVkUujpWDUV1ZnJmzuyVY9ruqcKkDH7yZ2L6fsL5CiQ4X1NFUVGWWzK3erppMXhifJpsHBZgsByxn8MuB", {
          "getCoin": "3344553449901"
        }],
        ["DdzFFzCqrhsxNjioQrx2RZEUHL16AxhUUpKDpkRuSxH1E3TxRi2WFLkyFyDjRTjSVDhv5U8N3PMVtXTURf9Qty1B9MPBKmvRUNCxvp6e", {
          "getCoin": "56690368493"
        }]
      ]
    }
  }
  */