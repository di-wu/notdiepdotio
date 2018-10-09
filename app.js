var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var tickSpeed = 10;    // Lower number to kill host
var Player = require('./player.js');

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use(express.static(__dirname + '/client'))  // client is the root folder for clients

var objectList = {    // make sure to match with sketch.js dict
  players: {},
  walls: {},
  bullets: {}
};
var idCounter = 0;  // new connetions will get a new id, increasing by one


io.on('connection', function(socket){
  console.log('Someone connected! Given id ' + idCounter);
  objectList.players[idCounter] = new Player();
  socket.id = idCounter++;

  socket.on('infoUpdate', function(player) {handleInfoUpdate(player, socket.id)});
  socket.on('newPlayer', function() {secondaryPlayer(socket.id)});

  socket.on('disconnect', function() {disconnect(socket.id)});
});

function disconnect(id) {
  console.log('Aww, someone disconnected! Was id ' + id);
  setTimeout(function() { // we wait 0.2 seconds here to let any infoUpdate packets come in
    if (objectList.players[id].secondPlayerId != -1)
        delete objectList.players[objectList.players[id].secondPlayerId];
    delete objectList.players[id];
  }, 200);
}

function secondaryPlayer(originalId) {
  // Here we will create a buddy player, and assign its id to the original player.
  objectList.players[idCounter] = new Player();
  objectList.players[originalId].secondPlayerId = idCounter++;
}

function handleInfoUpdate(player, id) {
  // Okay this is where the spaghetti kinda starts
  // We receive an id of the socket, but we don't know if it is for a primary or secondary player.
  // A 2nd player always has a "keys" field though, so we use that to check which player we need to move.
  if (player.keys != null)
    infoUpdate(player, objectList.players[id].secondPlayerId);
  else infoUpdate(player, id);
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
respawnWalls();

function updateTick() {
  // Executed at a certain interval, this is our main "game loop".
  shootBullets();
  updatePositions();
  checkCollisions();
  sendUpdate();
}


function updatePositions() {
  // Updates positions of all moving objects
  for (const [index, player] of Object.entries(objectList.players)) {
    // Goes through all the connected players and updates their positions.
    if (player == null) continue;
    player.posX += player.moveY * Math.cos(player.rot) * 2.5;   // Speed currently hardcoded in
    checkWallCollisionPlayer(player, "X");
    player.posY += player.moveY * Math.sin(player.rot) * 2.5;
    checkWallCollisionPlayer(player, "Y");
    player.rot += player.moveX * 0.05;
    // Lines below are for keeping player on screen
    if (player.posX - player.radius < 0) player.posX = player.radius;
    if (player.posY - player.radius < 0) player.posY = player.radius;
    if (player.posX + player.radius > screenX) player.posX = screenX - player.radius;
    if (player.posY + player.radius > screenY) player.posY = screenY - player.radius;
    // Collide with walls

  }

  for (const [index, bullet] of Object.entries(objectList.bullets)) {
    bullet.posX += bullet.velX;
    bullet.posY += bullet.velY;
    if ((bullet.posX < -bullet.radius || bullet.posX > screenX + bullet.radius) &&
        (bullet.posY < -bullet.radius || bullet.posY > screenX + bullet.radius))
        delete objectList.bullets[bullet.id];
  }
}

function checkWallCollisionPlayer(player, direction) {
  // Collision is always fun :)
  if (direction === "X") {
    for (const [index, wall] of Object.entries(objectList.walls)) {
      if (player.posX + player.radius > wall.posX - wall.w / 2 &&
          player.posX - player.radius < wall.posX + wall.w / 2 &&
          player.posY + player.radius / 2 > wall.posY - wall.h / 2 &&
          player.posY - player.radius / 2 < wall.posY + wall.h / 2) {
            // We are in the wall, probably
            player.posX = player.posX < wall.posX ? wall.posX - wall.w / 2 - player.radius : wall.posX + wall.w / 2 + player.radius;
          }
    }
  } else if (direction === "Y") {
    for (const [index, wall] of Object.entries(objectList.walls)) {
      if (player.posX + player.radius / 2 > wall.posX - wall.w / 2 &&
          player.posX - player.radius / 2 < wall.posX + wall.w / 2 &&
          player.posY + player.radius > wall.posY - wall.h / 2 &&
          player.posY - player.radius < wall.posY + wall.h / 2) {
            // We are in the wall, probably
            player.posY = player.posY < wall.posY ? wall.posY - wall.h / 2 - player.radius : wall.posY + wall.h / 2 + player.radius;
          }
    }
  }
}

function shootBullets() {
  // Goes through all the players and spawns a bullet at their position if they shot
  for (const [index, player] of Object.entries(objectList.players)) {
    if (player == null || player.health <= 0) continue
    player.timeSinceLastShot += tickSpeed;
    if (player.shoot && player.timeSinceLastShot > 1000 / player.firerate) {
      var newBullet = {
        posX: player.posX + Math.cos(player.rot) * player.radius * 1.2,
        posY: player.posY + Math.sin(player.rot) * player.radius * 1.2,
        velX: Math.cos(player.rot + (Math.random() - 0.5) / player.accuracy) * 4.5,
        velY: Math.sin(player.rot + (Math.random() - 0.5) / player.accuracy) * 4.5,
        radius: 7.5,
        id: idCounter
      }
      player.timeSinceLastShot = 0;
      objectList.bullets[idCounter++] = newBullet;
      player.posX -= newBullet.velX;
      player.posY -= newBullet.velY;
    }
    player.shoot = false;
  }
}

function checkCollisions() {
  // This is where the server dies.
  checkPlayerCollisions();
  checkWallCollisions();
}

function checkPlayerCollisions() {
  for (const [index, player] of Object.entries(objectList.players)) {
    for (const [indexBullet, bullet] of Object.entries(objectList.bullets)) {
      if (dist(player.posX, player.posY, bullet.posX, bullet.posY) < player.radius + bullet.radius) {
        delete objectList.bullets[bullet.id];
        if (player.health <= 0) { // This player was already dead, we don't darken even more.
          player.posX += bullet.velX / 3;   // Cool knockback effect on the dead player
          player.posY += bullet.velY / 3;
          continue;
        };
        player.health -= bullet.radius;
        player.health = player.health < 0 ? 0 : player.health;
        if (player.health <= 0)
          player.color = player.color.map(function(element) {return element*0.3;}); // beautiful
      }
    }
  }
}

function checkWallCollisions() {
  for (const [index, wall] of Object.entries(objectList.walls)) {
    for (const [indexBullet, bullet] of Object.entries(objectList.bullets)) {
      if (bullet.posX + bullet.radius > wall.posX - wall.w / 2 &&
          bullet.posX - bullet.radius < wall.posX + wall.w / 2 &&
          bullet.posY + bullet.radius > wall.posY - wall.h / 2 &&
          bullet.posY - bullet.radius < wall.posY + wall.h / 2) {
            delete objectList.bullets[bullet.id];
          }
    }
  }
}

function respawnWalls() {
  // Spawns random walls to start off with.
  objectList.walls = {};  // Throw away everything we had
  while (Object.keys(objectList.walls).length < 6) {
    var direction = Math.random() > 0.5;  // Is this wall long in x or y axis?
    var newWall = {
      posX: Math.floor(Math.random() * (screenX - 50) + 50),
      posY: Math.floor(Math.random() * (screenY - 50) + 50),
      w: Math.floor(50 + 150 * direction + direction * 250 * gaussianRand()),
      h: Math.floor(50 + 150 * !direction + !direction * 250 * gaussianRand()),
      id: idCounter
    }
    objectList.walls[idCounter++] = newWall;
  }
}

function gaussianRand() {
  var rand = 0;
  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }
  return rand / 6;
}

function dist(x1, y1, x2, y2) {
  // Simply calculates distance. Why isn't this default like in p5? :c
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
