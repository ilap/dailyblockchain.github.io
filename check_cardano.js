var Client = require('node-rest-client').Client;

var linksBuffer = [];
var client = new Client();
  
  // registering remote methods 
  // http://cardano-explorer.cardano-mainnet.iohk.io
  client.registerMethod("getAllTxs", "http://cardanoexplorer.com/api/txs/last", "GET");
  client.registerMethod("getTxSummary", "http://cardanoexplorer.com/api/txs/summary/${txid}", "GET");
  
  function getNodes() {
    client.methods.getAllTxs(function (data, response) {
      // parsed response body as js object 
      console.log(data);
      processData(data)
      // raw response 
      //console.log(response);
      setTimeout(function() {
        getNodes()
      }, 3000);
    });

  }

function processData(data) { 
  // parse message
  if (data.length === 0) {
    return
  }

  for(var i=0; i<data.length; i++){
  } 


  var txHash = msg.x.hash;
     if(msg.op == "utx"){
    // uncorfimed transactions
    var inputs = msg.x.inputs;
    var outputs = msg.x.out;
    // generate from to 
    var links = [];
    for(var i=0;i<inputs.length;i++){
      var input = inputs[i];
      links.push({
                 from: input.prev_out.addr,
                 to: txHash,
                 value: input.prev_out.value,
                 t:"i"
             });
         }
         for(var j=0;j<outputs.length;j++){
      var output = outputs[j];
      links.push({
        from: txHash,
        to: output.addr,
        value: output.value,
                 t:"o"
      });
    }
  }


     // flush the buffer if not empty
     if (! paused && linksBuffer.length > 0) {
         for(var i=0;i<linksBuffer.length;i++){
             var link = linksBuffer[i];
             
             addNodes(link)
             graph.addLink(link.from,link.to);
         }
         linksBuffer = [];
     }
     
     for(var i=0;i<links.length;i++){
    var link = links[i];
    if(link.value > maxNodeSize){
                 maxNodeSize = link.value;
         }
             
         if (! paused) {
             addNodes(link);
             graph.addLink(link.from,link.to);
    } else{
             // add links to a buffer
             linksBuffer.push(link);
         }
         //writeToScreen('<span style="color: blue;">from: ' + link.from+' to ' +link.to+' value: '+ (link.value/100000000)+'</span>'); 
  }
  //websocket.close(); 
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

getNodes()