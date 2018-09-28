var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use(express.static(__dirname + '/client'))  // client is the root folder for clients

var socketList = [];
var idCounter = 0;  // new connetions will get a new id, increasing by one

io.on('connection', function(socket){
  console.log('Someone connected!');
  socketList[idCounter] = {position: [50, 50], color: [0, 0, 0]}
  socket.id = idCounter++;

  socket.on('infoUpdate', function(player){
    if (socketList[socket.id] == null) return;  // this player is not registered (yet)
    socketList[socket.id].color = player.color;
    socketList[socket.id].position[0] += player.moveX * 5;
    socketList[socket.id].position[1] += player.moveY * 5;
  });

  socket.on('disconnect', function(){
    console.log('Aww, someone disconnected');
    delete socketList[socket.id];
  });
});

function sendUpdate() {
  io.emit('positionUpdate', socketList);
}

http.listen(3000, function(){
  console.log('Server is up, listening on *:3000');
});

setInterval(sendUpdate, 10);  // Lower number to kill host
