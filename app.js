var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use(express.static(__dirname + '/client'))  // client is the root folder for clients

var socketList = {};

io.on('connection', function(socket){
  console.log('Someone connected!');

  socket.on('pos', function(player){
    socket.id = player.id;
    socketList[player.id] = player;
    data = [];
    for (var player in socketList) {
      data.push(socketList[player]);
    }
    socket.emit('positionUpdate', data);
  });

  socket.on('disconnect', function(){
    console.log('Aww, someone disconnected');
    delete socketList[socket.id];
  });
});

http.listen(3000, function(){
  console.log('Server is up, listening on *:3000');
});
