var socket = io();
var allObjects = {players: {}, bullets: {}};  // yeah, this needs to be matched with app.js for now...
var inputs; // contains all info about ourselves to send to the server

function setup() {
  createCanvas(1200, 800);  // Hardcoding let's go
  rectMode(CENTER);
  inputs = {
    moveX: 0,
    moveY: 0,
    shoot: false
  }
}

function draw() {
  sendUpdate();
  background(230);

  for (const [index, object] of Object.entries(allObjects.players)) {
    if (object == null) continue;
    var x = object.posX; var y = object.posY; var d = object.diameter; var r = object.rot;
    fill(object.color[0], object.color[1], object.color[2]);
    ellipse(x, y, d, d);
    fill(object.color[0] * 0.5, object.color[1] * 0.5, object.color[2] * 0.5);
    ellipse(x + cos(r) * d / 2.5, y + sin(r) * d / 2.5, 8, 8);
  }

  for (const [index, object] of Object.entries(allObjects.bullets)) {
      fill(200, 25, 25);
      ellipse(object.posX, object.posY, 15, 15);
  }
}

function sendUpdate() {
  // checks WASD and arrow keys
  inputs.moveX = (keyIsDown(65) || keyIsDown(37)) ? -1 : 0 + (keyIsDown(68) || keyIsDown(39)) ? 1 : 0;
  inputs.moveY = (keyIsDown(83) || keyIsDown(40)) ? -1 : 0 + (keyIsDown(87) || keyIsDown(38)) ? 1 : 0;
  inputs.shoot = keyIsDown(32);   // Space
  socket.emit('infoUpdate', inputs);
}

socket.on('receiveUpdate', function(objects) {
  allObjects = objects;
});
