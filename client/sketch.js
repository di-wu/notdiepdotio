var socket = io();
var allPlayers = [];
var self; // contains all info about ourselves to send to the server

function setup() {
  createCanvas(800, 600)
  self = {
    color: [random(255), random(255), random(255)],
    position: [0, 0],
    moveX: 0,
    moveY: 0
  }
}

function draw() {
  sendUpdate();
  background(230);
  for (var i = 0; i < allPlayers.length; i++) { // for ... in loop doesn't work here?
    player = allPlayers[i];
    if (player == null) continue;
    fill(player.color[0], player.color[1], player.color[2]);
    ellipse(player.position[0], player.position[1], 40, 40);
  }
}

function sendUpdate() {
  self.moveX = keyIsDown(65) ? -1 : 0 + keyIsDown(68) ? 1 : 0;
  self.moveY = keyIsDown(87) ? -1 : 0 + keyIsDown(83) ? 1 : 0;
  socket.emit('infoUpdate', self);
}

socket.on('positionUpdate', function(players){
  allPlayers = players;
});
