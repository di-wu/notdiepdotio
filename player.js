function Player() {
  this.posX = 600;
  this.posY = 400;
  this.rot = 0;
  this.color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
  this.radius = 25;
  this.moveX = 0;
  this.moveY = 0;
  this.shoot = false;
  this.firerate = 10;  // higher = shoot more bullets
  this.timeSinceLastShot = 0;  // keeps track of time waited since last bullet
  this.secondPlayerId = -1  // If this player adds a second; we will keep track of id here
}

module.exports = Player;
