var socket = io();
var allObjects = {
  players: {},
  walls: {},
  bullets: {}
}; // yeah, this needs to be matched with app.js for now...
var inputs; // contains all info about ourselves to send to the server
var addingPlayer = 0; // 0 = nothing, 1,2,3,4,5 are accepting controls, 6 is player added.
var player2; // same as inputs but contains keymapping as well

function setup() {
  createCanvas(1200, 800); // Hardcoding let's go
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  inputs = {
    moveX: 0,
    moveY: 0,
    shoot: false
  }
}

function draw() {
  sendUpdate();
  drawObjects();
}

function drawObjects() {
  // Draws all things
  drawBackground();
  drawPlayers();
  drawWalls();
  drawBullets();
  drawUI();
}

var offset = 0;
const LINES = 8;

function drawBackground() {
  background(230);
  for (var i = 0; i < LINES; i++) {
    fill(216 + 8 * abs(sin(offset / LINES - ((width / LINES * i + offset) % width / 500))));
    rect((width / LINES * i + offset) % width, height / 2, 8, height);
    rect(width / 2, (width / LINES * i + offset) % width, width, 8);
  }
  offset += 0.1;
}

function drawPlayers() {
  for (const [index, player] of Object.entries(allObjects.players)) {
    if (player == null) continue;
    var x = player.posX;
    var y = player.posY;
    var d = player.radius * 2;
    var r = player.rot;
    fill(player.color[0], player.color[1], player.color[2]);
    ellipse(x, y, d, d);
    fill(player.color[0] * 0.5, player.color[1] * 0.5, player.color[2] * 0.5);
    ellipse(x + cos(r) * d / 2.5, y + sin(r) * d / 2.5, 8, 8);
    drawHealthBars();
  }
}

function drawWalls() {
  fill(67, 113, 130);
  stroke(48, 83, 96);
  strokeWeight(5);
  for (const [index, wall] of Object.entries(allObjects.walls)) {
    rect(wall.posX, wall.posY, wall.w, wall.h, 7);
  }
  noStroke();
}


function drawHealthBars() {
  strokeWeight(2);
  stroke(2);
  for (const [index, player] of Object.entries(allObjects.players)) {
    if (player == null || player.health <= 0) continue;
    if (player.health <= 50) fill(255, 5.1 * player.health, 30);
    else fill(255 - (player.health - 50) * 5.1, 255, 30);
    var ypos = player.posY + player.radius * 1.3 + 10 > height ? height - 10 : player.posY + player.radius * 1.3;
    rect(player.posX, ypos, player.health / 2, 10);
  }
  noStroke();
}

function drawBullets() {
  for (const [index, bullet] of Object.entries(allObjects.bullets)) {
    fill(200, 25, 25);
    ellipse(bullet.posX, bullet.posY, bullet.radius * 2, bullet.radius * 2);
  }
}

function drawUI() {
  // Draws a super mega cool UI which hopefully won't become too cluttered
  if (addingPlayer == 6) return; // A new player was already added
  // First we draw a plus square
  addingPlayer == 0 ? fill(233, 116, 96) : fill(168, 84, 69);
  rect(width - 40, 40, 40, 40, 5);
  addingPlayer == 0 ? fill(120, 233, 96) : fill(88, 169, 69);
  rect(width - 40, 40, 30, 7, 2);
  rect(width - 40, 40, 7, 30, 2);
  // Now we draw control highlights in case we're adding a player.
  fill(120, 233, 96);
  if (addingPlayer == 1) rect(width - 40, 28.5, 7, 7, 2);
  if (addingPlayer == 2) rect(width - 51.5, 40, 7, 7, 2);
  if (addingPlayer == 3) rect(width - 40, 51.5, 7, 7, 2);
  if (addingPlayer == 4) rect(width - 28.5, 40, 7, 7, 2);
  if (addingPlayer == 5) rect(width - 40, 40, 7, 7, 2);
}

function mouseClicked() {
  // Checks mouse click against "add player" button
  if (mouseX > width - 60 && mouseX < width - 20 && mouseY > 20 && mouseY < 60 && addingPlayer == 0) {
    addingPlayer = 1;
    player2 = {
      moveX: 0,
      moveY: 0,
      shoot: false,
      keys: [] // holds keycodes in order Up, Left, down, right, action
    }
  }
}

function keyPressed() {
  // We will use this function to add a new player to the system.
  // Keyinputs for movement etc are checked in the sendUpdate function.
  if (addingPlayer == 0 || addingPlayer == 6) return;
  // Uncomment line below to disallow double-mapping of keys (eg both players use WASD)
  //if (keyCode == 65 || keyCode == 68 || keyCode == 83 || keyCode == 87 || keyCode == 32) return;
  player2.keys.push(keyCode);
  addingPlayer = player2.keys.length + 1;
  if (addingPlayer == 6) socket.emit('newPlayer');
}

function sendUpdate() {
  // checks WASD and arrow keys
  if (addingPlayer == 0) {
    inputs.moveX = (keyIsDown(65) || keyIsDown(37)) ? -1 : 0 + (keyIsDown(68) || keyIsDown(39)) ? 1 : 0;
    inputs.moveY = (keyIsDown(83) || keyIsDown(40)) ? -1 : 0 + (keyIsDown(87) || keyIsDown(38)) ? 1 : 0;
  } else {
    inputs.moveX = keyIsDown(65) ? -1 : 0 + keyIsDown(68) ? 1 : 0;
    inputs.moveY = keyIsDown(83) ? -1 : 0 + keyIsDown(87) ? 1 : 0;
  }
  inputs.shoot = keyIsDown(32);
  socket.emit('infoUpdate', inputs);
  if (addingPlayer != 6) return;
  player2.moveX = keyIsDown(player2.keys[1]) ? -1 : 0 + keyIsDown(player2.keys[3]) ? 1 : 0;
  player2.moveY = keyIsDown(player2.keys[2]) ? -1 : 0 + keyIsDown(player2.keys[0]) ? 1 : 0;
  player2.shoot = keyIsDown(player2.keys[4]);
  socket.emit('infoUpdate', player2);
}

socket.on('receiveUpdate', function (objects) {
  allObjects = objects;
});