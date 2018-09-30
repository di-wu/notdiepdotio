var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var tickSpeed = 10;    // Lower number to kill host

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use(express.static(__dirname + '/client'))  // client is the root folder for clients

var objectList = {
  players: {},
  bullets: {}
};
var idCounter = 0;  // new connetions will get a new id, increasing by one

io.on('connection', function(socket){
  console.log('Someone connected!');
  initialize(socket);

  socket.on('infoUpdate', function(player) {infoUpdate(player, socket.id)});

  socket.on('disconnect', function() { disconnect(socket.id)});
});

function initialize(socket) {
  // Fully initializes a player in the socket list.
  var newPlayer = {
    posX: 600,
    posY: 400,
    rot: 0,
    color: [Math.random() * 255, Math.random() * 255, Math.random() * 255],
    diameter: 50,
    moveX: 0,
    moveY: 0,
    shoot: false,
    firerate: 10,  // higher = shoot more bullets
    timeSinceLastShot: 0  // keeps track of time waited since last bullet
  }
  objectList.players[idCounter] = newPlayer;
  socket.id = idCounter++;
}

function disconnect(id) {
  console.log('Aww, someone disconnected');
  delete objectList.players[id];
}


function infoUpdate(input, id) {
  // A player sends his info
  objectList.players[id].moveX = input.moveX;
  objectList.players[id].moveY = input.moveY;
  // We can only change from fale to true, not the other way around
  // Shoot will be set to false when the server actually spawns the bullet
  objectList.players[id].shoot = objectList.players[id].shoot ? true : input.shoot;
}

function sendUpdate() {
  io.emit('receiveUpdate', objectList);
}

http.listen(3000, function() {
  console.log('Server is up, listening on *:3000');
});

setInterval(updateTick, tickSpeed);


// Entire game code starts here

var screenX = 1200; // hardcoding canvas dimensions because ehhh
var screenY = 800;

function updateTick() {
  // Executed at a certain interval, this is our main "game loop".
  shootBullets();
  updatePositions();
  sendUpdate();
}


function updatePositions() {
  // Updates positions of all moving objects
  for (const [index, player] of Object.entries(objectList.players)) {
    // Goes through all the connected players and updates their positions.
    if (player == null) continue;
    player.posX += player.moveY * Math.cos(player.rot) * 2.5;   // Speed currently hardcoded in
    player.posY += player.moveY * Math.sin(player.rot) * 2.5;
    player.rot += player.moveX * 0.05;
    // Lines below are for keeping player on screen
    if (player.posX - player.diameter / 2 < 0) player.posX = player.diameter / 2;
    if (player.posY - player.diameter / 2 < 0) player.posY = player.diameter / 2;
    if (player.posX + player.diameter / 2 > screenX) player.posX = screenX - player.diameter / 2;
    if (player.posY + player.diameter / 2 > screenY) player.posY = screenY - player.diameter / 2;
  }

  for (const [index, bullet] of Object.entries(objectList.bullets)) {
    bullet.posX += bullet.velX;
    bullet.posY += bullet.velY;
    if ((bullet.posX < -50 || bullet.posX > screenX + 50) &&
        (bullet.posY < -50 || bullet.posY > screenX + 50))
        delete objectList.bullets[bullet.id];
  }
}

function shootBullets() {
  // Goes through all the players and spawns a bullet at their position if they shot
  for (const [index, player] of Object.entries(objectList.players)) {
    player.timeSinceLastShot += tickSpeed;
    if (player.shoot && player.timeSinceLastShot > 1000 / player.firerate) {
      var newBullet = {
        posX: player.posX + Math.cos(player.rot) * player.diameter / 2,
        posY: player.posY + Math.sin(player.rot) * player.diameter / 2,
        velX: Math.cos(player.rot) * 4.5,
        velY: Math.sin(player.rot) * 4.5,
        id: idCounter
      }
      player.timeSinceLastShot = 0;
      objectList.bullets[idCounter++] = newBullet;
      player.shoot = false;
      player.posX -= newBullet.velX;
      player.posY -= newBullet.velY;
    }
  }
}
