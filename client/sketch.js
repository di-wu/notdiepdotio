var socket = io();
var allPlayers = [];
var self; // contains all info about ourselves to send to the server

function setup() {
  createCanvas(800, 600)
  self = {
    id: int(random(10000)),  // change this maybe
    color: [random(255), random(255), random(255)],
    position: [0, 0]
  }
}

function draw() {
  sendPosition();
  background(230);
  for (var playerNumber in allPlayers) {
    var player = allPlayers[playerNumber];
    fill(player.color[0], player.color[1], player.color[2]);
    ellipse(player.position[0], player.position[1], 40, 40);
  }
}

function sendPosition() {
  self.position = [mouseX, mouseY];
  socket.emit('pos', self);
}

function updatePositions(players) {
  // Players is a variable containing a color and position for each player
  allPlayers = players;
}

socket.on('positionUpdate', updatePositions);
