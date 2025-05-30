const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load assets
const assets = {
  bg: new Image(),
  playerLeft: [new Image(), new Image()],
  playerRight: [new Image(), new Image()],
  playerJumpLeft: new Image(),
  playerJumpRight: new Image(),
  platform: new Image(),
  coin: new Image(),
  bushBig: new Image(),
  bushSmall: new Image(),
  dirt: new Image(),
  grass: new Image(),
  bridge: new Image(),
  blockEmpty: new Image(),
  spikes: new Image(),
  music: new Audio("Fast Desert Theme.wav")
};

assets.bg.src = "level2background.gif";
assets.playerLeft[0].src = "Left.png";
assets.playerLeft[1].src = "left1.png";
assets.playerRight[0].src = "right.png";
assets.playerRight[1].src = "right1.png";
assets.playerJumpLeft.src = "jumpleft.png";
assets.playerJumpRight.src = "jumpright.png";
assets.platform.src = "Platform.png";
assets.coin.src = "btc.png";
assets.bushBig.src = "Big_Bush.png";
assets.bushSmall.src = "Small_Bush.png";
assets.dirt.src = "Dirt_Block.png";
assets.grass.src = "Grass_Block.png";
assets.bridge.src = "Bridge.png";
assets.blockEmpty.src = "Empty_Brown_Block.png";
assets.spikes.src = "Spikes.png";
assets.music.loop = true;
assets.music.volume = 0.5;

// UI Elements
const pauseMenu = document.getElementById("pauseMenu");
const resumeButton = document.getElementById("resumeButton");
const retryButton = document.getElementById("retryButton");
const mainMenuButton = document.getElementById("mainMenuButton");

// Game state
let score = 0;
let timer = 120;
let gameState = "playing";
let cameraX = 0;
let timerInterval;

// Player
const player = {
  x: 100, y: canvas.height - 160,
  width: 50, height: 70,
  dx: 0, dy: 0,
  speed: 6,
  gravity: 1,
  jumpPower: -18,
  onGround: false,
  direction: "right",
  isJumping: false,
  currentFrame: 0,
  animationTimer: 0,
  animationSpeed: 8,
  update() {
    this.dy += this.gravity;
    this.x += this.dx;
    this.y += this.dy;

    // Animation logic
    if (this.dx !== 0 && this.onGround) {
      this.animationTimer++;
      if (this.animationTimer % this.animationSpeed === 0) {
        this.currentFrame = (this.currentFrame + 1) % 2;
      }
      this.direction = this.dx > 0 ? "right" : "left";
    } else if (this.dx === 0 && this.onGround) {
      this.currentFrame = 0;
    }

    this.onGround = false;
    platforms.forEach(p => {
      if (
        this.x + this.width > p.x && this.x < p.x + p.width &&
        this.y + this.height > p.y && this.y + this.height < p.y + p.height &&
        this.dy >= 0
      ) {
        this.y = p.y - this.height;
        this.dy = 0;
        this.onGround = true;
      }
    });

    if (this.y + this.height > canvas.height - 40) {
      this.y = canvas.height - 40 - this.height;
      this.dy = 0;
      this.onGround = true;
    }

    // Screen wrapping (optional)
    if (this.x + this.width < 0) {
      this.x = canvas.width;
    } else if (this.x > canvas.width) {
      this.x = -this.width;
    }

    cameraX = Math.max(0, this.x - 300);
  },
  draw() {
    let img;
    if (this.isJumping || !this.onGround) {
      img = this.direction === "left" ? assets.playerJumpLeft : assets.playerJumpRight;
    } else if (this.dx !== 0) {
      img = this.direction === "left" ? assets.playerLeft[this.currentFrame] : assets.playerRight[this.currentFrame];
    } else {
      img = this.direction === "left" ? assets.playerLeft[0] : assets.playerRight[0];
    }
    if (img && img.complete && img.naturalHeight !== 0) {
      ctx.drawImage(img, this.x - cameraX, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
    }
  },
  jump() {
    if (this.onGround) {
      this.dy = this.jumpPower;
      this.isJumping = true;
    }
  },
  reset() {
    this.x = 100;
    this.y = canvas.height - 160;
    this.dy = 0;
    this.isJumping = false;
    this.currentFrame = 0;
  }
};

// Platforms, coins, spikes (same as before)
const platforms = [
  { x: 0, y: canvas.height - 40, width: 2000, height: 40 },
  { x: 300, y: canvas.height - 180, width: 120, height: 20 },
  { x: 500, y: canvas.height - 250, width: 120, height: 20 },
  { x: 700, y: canvas.height - 180, width: 120, height: 20 },
  { x: 1000, y: canvas.height - 220, width: 120, height: 20 },
  { x: 1400, y: canvas.height - 180, width: 120, height: 20 }
];

const coins = [
  { x: 350, y: canvas.height - 230, collected: false },
  { x: 550, y: canvas.height - 300, collected: false },
  { x: 1050, y: canvas.height - 260, collected: false },
  { x: 1450, y: canvas.height - 230, collected: false }
];

const spikes = [
  { x: 850, y: canvas.height - 60, width: 40, height: 20 },
  { x: 1300, y: canvas.height - 60, width: 40, height: 20 }
];

// Input
const keys = {};
window.addEventListener("keydown", e => {
  if (e.code === "Escape") togglePause();
  if (gameState !== "playing") return;
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space") player.jump();
});
window.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
});

// Touch controls
document.getElementById("leftBtn").addEventListener("touchstart", e => { e.preventDefault(); keys.left = true; });
document.getElementById("leftBtn").addEventListener("touchend", e => { e.preventDefault(); keys.left = false; });
document.getElementById("rightBtn").addEventListener("touchstart", e => { e.preventDefault(); keys.right = true; });
document.getElementById("rightBtn").addEventListener("touchend", e => { e.preventDefault(); keys.right = false; });
document.getElementById("jumpBtn").addEventListener("touchstart", e => { e.preventDefault(); player.jump(); });

// Pause logic
function togglePause() {
  if (gameState === "playing") {
    gameState = "paused";
    pauseMenu.style.display = "flex";
    assets.music.pause();
  } else if (gameState === "paused") {
    gameState = "playing";
    pauseMenu.style.display = "none";
    assets.music.play();
    gameLoop(); // resume loop
  }
}

resumeButton.onclick = togglePause;
retryButton.onclick = () => location.reload();
mainMenuButton.onclick = () => location.href = "../index.html";

// Timer
function startTimer() {
  timer = 120;
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState !== "playing") return;
    timer--;
    updateTimerDisplay();
    if (timer <= 0) endLevel();
  }, 1000);
}
function updateTimerDisplay() {
  document.getElementById("timerDisplay").textContent = `Time: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`;
}

// Game loop
function gameLoop() {
  if (gameState !== "playing") return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(assets.bg, -cameraX, 0, canvas.width * 2, canvas.height);

  ctx.drawImage(assets.bushBig, 600 - cameraX, canvas.height - 100);
  ctx.drawImage(assets.bushSmall, 1200 - cameraX, canvas.height - 100);

  platforms.forEach(p => ctx.drawImage(assets.platform, p.x - cameraX, p.y, p.width, p.height));
  spikes.forEach(s => {
    ctx.drawImage(assets.spikes, s.x - cameraX, s.y, s.width, s.height);
    if (
      player.x + player.width > s.x &&
      player.x < s.x + s.width &&
      player.y + player.height > s.y
    ) {
      player.reset();
    }
  });

  coins.forEach(c => {
    if (!c.collected) ctx.drawImage(assets.coin, c.x - cameraX, c.y, 32, 32);
    if (!c.collected &&
      player.x + player.width > c.x &&
      player.x < c.x + 32 &&
      player.y + player.height > c.y &&
      player.y < c.y + 32
    ) {
      c.collected = true;
      score++;
      document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
    }
  });

  player.dx = 0;
  if (keys.left) player.dx = -player.speed;
  if (keys.right) player.dx = player.speed;
  player.update();
  player.draw();

  if (coins.every(c => c.collected)) return endLevel();
  requestAnimationFrame(gameLoop);
}

function endLevel() {
  gameState = "ended";
  clearInterval(timerInterval);
  assets.music.pause();
  document.getElementById("nextLevelBtn").style.display = "block";
}

document.getElementById("nextLevelBtn").onclick = () => {
  alert("Congratulations! You finished Level 2!");
  window.location.href = "../index.html";
};

function startGame() {
  score = 0;
  gameState = "playing";
  document.getElementById("nextLevelBtn").style.display = "none";
  coins.forEach(c => c.collected = false);
  player.reset();
  assets.music.play();
  startTimer();
  gameLoop();
}
window.onload = startGame;
