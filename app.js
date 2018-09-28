var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

io.on('connection', function(socket){
  console.log('Someone connected!');

  socket.on('input', function(text){
    console.log('Input received! Message: ' + text);
    // Send the message back to everyone connected
    io.emit('response', text);
  });

  socket.on('disconnect', function(){
    console.log('Aww, someone disconnected');
  });
});

http.listen(3000, function(){
  console.log('Server is up, listening on *:3000');
});
