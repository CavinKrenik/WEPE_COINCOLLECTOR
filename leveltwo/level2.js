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
  music: new Audio(),
  cryptostep: new Image(),
  greenstepsmall: new Image(),
  greenstepmedium: new Image(),
  greensteplarge: new Image(),
  redstepsmall: new Image(),
  redstepmedium: new Image(),
  redsteplarge: new Image()
};

console.log("Initializing asset loading for Level 2...");

// ✅ All paths adjusted for current directory (no ../)
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
assets.spikes.src = "Spikes.png";
assets.dirt.src = "Dirt_Block.png";
assets.grass.src = "Grass_Block.png";
assets.bridge.src = "Bridge.png";
assets.blockEmpty.src = "Empty_Brown_Block.png";
assets.cryptostep.src = "cryptostep.png";
assets.greenstepsmall.src = "greenstepsmall.png";
assets.greenstepmedium.src = "greenstepmedium.png";
assets.greensteplarge.src = "greensteplarge.png";
assets.redstepsmall.src = "redstepsmall.png";
assets.redstepmedium.src = "redstepmedium.png";
assets.redsteplarge.src = "redsteplarge.png";

assets.music.src = "Fast Desert Theme.wav";
assets.music.loop = true;
assets.music.volume = 0.5;


// UI Elements from HTML
const pauseMenu = document.getElementById("pauseMenu");
const resumeButton = document.getElementById("resumeButton");
const retryButton = document.getElementById("retryButton");
const mainMenuButton = document.getElementById("mainMenuButton");
const toggleMusicButton = document.getElementById("toggleMusicButton");

if (toggleMusicButton) { // Check if the button exists before adding listener
    toggleMusicButton.onclick = function () {
        musicEnabled = !musicEnabled;
        if (musicEnabled) {
            assets.music.play();
            toggleMusicButton.textContent = "Pause Music";
        } else {
            assets.music.pause();
            toggleMusicButton.textContent = "Play Music";
        }
    };
    // Set initial button text
    toggleMusicButton.textContent = assets.music.paused ? "Play Music" : "Pause Music";
}


// Game state
let score = 0;
let timer = 120;
let gameState = "loading";
let cameraX = 0;
let timerInterval;
let totalGameWidth = 24000;

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
        this.y + this.height > p.y && this.y + this.height < p.y + p.height / 2 + this.dy &&
        this.dy >= 0
      ) {
        this.y = p.y - this.height;
        this.dy = 0;
        this.onGround = true;
        this.isJumping = false;
      }
    });

    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + this.width > totalGameWidth) {
      this.x = totalGameWidth - this.width;
    }

    let targetCameraX = this.x - canvas.width / 3;
    cameraX = Math.max(0, Math.min(targetCameraX, totalGameWidth - canvas.width));
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
    if (this.onGround && gameState === "playing") {
      this.dy = this.jumpPower;
      this.isJumping = true;
      this.onGround = false;
    }
  },
  reset() {
    this.x = 100;
    this.y = canvas.height - 160;
    this.dx = 0;
    this.dy = 0;
    this.onGround = false;
    this.isJumping = false;
    this.direction = "right";
    this.currentFrame = 0;
    cameraX = 0;
  }
};

const platformBaseY = canvas.height - 40;
const coinWidth = 32;
const coinHeight = 32;
const spikeHeight = 20;

const platforms = [
  // Main ground platform - type 'ground' for special rendering
  { x: 0, y: platformBaseY, width: totalGameWidth, height: 40, type: 'ground' },
  // Original platforms (add type: 'platform' to all generic ones)
  { x: 300, y: platformBaseY - 140, width: 120, height: 20, type: 'platform' },
  { x: 500, y: platformBaseY - 210, width: 120, height: 20, type: 'platform' },
  { x: 700, y: platformBaseY - 140, width: 120, height: 20, type: 'platform' },
  { x: 1000, y: platformBaseY - 180, width: 120, height: 20, type: 'platform' },
  { x: 1400, y: platformBaseY - 140, width: 120, height: 20, type: 'platform' },
  { x: 1700, y: platformBaseY - 100, width: 150, height: 20, type: 'platform' },
  { x: 1900, y: platformBaseY - 200, width: 100, height: 20, type: 'platform' },
  { x: 2100, y: platformBaseY - 150, width: 120, height: 20, type: 'platform' },
  { x: 2350, y: platformBaseY - 120, width: 180, height: 20, type: 'platform' },
  { x: 2600, y: platformBaseY - 220, width: 100, height: 20, type: 'platform' },
  { x: 2800, y: platformBaseY - 100, width: 150, height: 20, type: 'platform' },
  { x: 3050, y: platformBaseY - 180, width: 120, height: 20, type: 'platform' },
  { x: 3300, y: platformBaseY - 130, width: 200, height: 20, type: 'platform' },
  { x: 3600, y: platformBaseY - 200, width: 100, height: 20, type: 'platform' },
  { x: 3800, y: platformBaseY - 100, width: 150, height: 20, type: 'platform' },
  { x: 4050, y: platformBaseY - 160, width: 120, height: 20, type: 'platform' },
  { x: 4300, y: platformBaseY - 120, width: 180, height: 20, type: 'platform' },
  { x: 4550, y: platformBaseY - 210, width: 100, height: 20, type: 'platform' },
  { x: 4800, y: platformBaseY - 100, width: 150, height: 20, type: 'platform' },
  { x: 5000, y: platformBaseY - 170, width: 200, height: 20, type: 'platform' },
  { x: 5300, y: platformBaseY - 150, width: 150, height: 20, type: 'platform' },
  { x: 5550, y: platformBaseY - 100, width: 100, height: 20, type: 'platform' },
  { x: 5800, y: platformBaseY - 180, width: 180, height: 20, type: 'platform' },

  // Expanded level platforms (6000 to 12000)
  { x: 6200, y: platformBaseY - 150, width: 150, height: 20, type: 'platform' },
  { x: 6500, y: platformBaseY - 100, width: 200, height: 20, type: 'bridge' },
  { x: 6800, y: platformBaseY - 200, width: 100, height: 20, type: 'platform' },
  { x: 7100, y: platformBaseY - 120, width: 180, height: 20, type: 'platform' },
  { x: 7400, y: platformBaseY - 250, width: 120, height: 20, type: 'platform' },
  { x: 7800, y: platformBaseY - 100, width: 150, height: 20, type: 'platform' },
  { x: 8200, y: platformBaseY - 180, width: 200, height: 20, type: 'platform' },
  { x: 8500, y: platformBaseY - 80, width: 100, height: 20, type: 'platform' },
  { x: 8900, y: platformBaseY - 220, width: 150, height: 20, type: 'platform' },
  { x: 9300, y: platformBaseY - 140, width: 120, height: 20, type: 'platform' },
  { x: 9700, y: platformBaseY - 190, width: 250, height: 20, type: 'bridge' },
  { x: 10100, y: platformBaseY - 100, width: 100, height: 20, type: 'platform' },
  { x: 10400, y: platformBaseY - 240, width: 130, height: 20, type: 'platform' },
  { x: 10800, y: platformBaseY - 160, width: 180, height: 20, type: 'platform' },
  { x: 11200, y: platformBaseY - 90, width: 150, height: 20, type: 'platform' },
  { x: 11600, y: platformBaseY - 200, width: 200, height: 20, type: 'platform' },
];

const coins = [
  // Original coins
  { x: 350, y: platformBaseY - 140 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 550, y: platformBaseY - 210 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1050, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 400, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 900, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1600, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2200, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2900, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 3500, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4200, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4900, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5500, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5850, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },


  // Expanded level coins
  { x: 6250, y: platformBaseY - 150 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 6550, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 6850, y: platformBaseY - 200 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 7150, y: platformBaseY - 120 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 7000, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 7850, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 8250, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 8700, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 9350, y: platformBaseY - 140 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 9800, y: platformBaseY - 190 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 10500, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 11250, y: platformBaseY - 90 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 11800, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
];

const spikes = [
  // Original spikes
  { x: 850, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 1300, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 5850, y: platformBaseY - 180 - spikeHeight, width: 40, height: spikeHeight },

  // Expanded level spikes
  { x: 6400, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 6880, y: platformBaseY - 200 - spikeHeight, width: 40, height: spikeHeight },
  { x: 7200, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 7240, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 8000, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 8550, y: platformBaseY - 80 - spikeHeight, width: 40, height: spikeHeight },
  { x: 9500, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 10200, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 10850, y: platformBaseY - 160 - spikeHeight, width: 40, height: spikeHeight },
  { x: 11500, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
];

const scenery = [
  { asset: assets.bushBig, x: 600, yOffset: assets.bushBig.height },
  { asset: assets.bushSmall, x: 1200, yOffset: assets.bushSmall.height },
  { asset: assets.bushBig, x: 2600, yOffset: assets.bushBig.height },
  { asset: assets.bushSmall, x: 3500, yOffset: assets.bushSmall.height },
  { asset: assets.bushBig, x: 4500, yOffset: assets.bushBig.height },
  // Expanded
  { asset: assets.blockEmpty, x: 6100, yOffset: 50, yAnchor: platformBaseY - 200 },
  { asset: assets.bushSmall, x: 6700, yOffset: assets.bushSmall.height },
  { asset: assets.bushBig, x: 7500, yOffset: assets.bushBig.height },
  { asset: assets.blockEmpty, x: 8000, yOffset: 50, yAnchor: platformBaseY - 50 },
  { asset: assets.bushSmall, x: 8800, yOffset: assets.bushSmall.height },
  { asset: assets.bushBig, x: 9900, yOffset: assets.bushBig.height },
  { asset: assets.blockEmpty, x: 10500, yOffset: 60, yAnchor: platformBaseY - 250 },
  { asset: assets.bushSmall, x: 11300, yOffset: assets.bushSmall.height },
];


// Input
const keys = {};
window.addEventListener("keydown", e => {
  if (e.code === "Escape") { togglePause(); e.preventDefault(); return; }
  if (gameState !== "playing") return;
  if (e.code === "ArrowLeft") { keys.left = true; e.preventDefault(); }
  if (e.code === "ArrowRight") { keys.right = true; e.preventDefault(); }
  if (e.code === "Space") { player.jump(); e.preventDefault(); }
});
window.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
});

document.getElementById("leftBtn").addEventListener("touchstart", e => { e.preventDefault(); if (gameState === "playing") keys.left = true; });
document.getElementById("leftBtn").addEventListener("touchend", e => { e.preventDefault(); if (gameState === "playing") keys.left = false; });
document.getElementById("rightBtn").addEventListener("touchstart", e => { e.preventDefault(); if (gameState === "playing") keys.right = true; });
document.getElementById("rightBtn").addEventListener("touchend", e => { e.preventDefault(); if (gameState === "playing") keys.right = false; });
document.getElementById("jumpBtn").addEventListener("touchstart", e => { e.preventDefault(); if (gameState === "playing") player.jump(); });

function togglePause() {
  if (gameState === "playing") {
    gameState = "paused";
    pauseMenu.style.display = "flex";
    if (assets.music) assets.music.pause();
    if (timerInterval) clearInterval(timerInterval);
  } else if (gameState === "paused") {
    gameState = "playing";
    pauseMenu.style.display = "none";
    if (assets.music && musicEnabled) {
      let playPromise = assets.music.play();
      if (playPromise !== undefined) playPromise.catch(error => console.warn("Music resume failed:", error));
    }
    startTimer(timer);
    requestAnimationFrame(gameLoop);
  }
}

resumeButton.onclick = togglePause;
retryButton.onclick = () => { console.log("Retry clicked"); location.reload(); };
mainMenuButton.onclick = () => { console.log("Main Menu clicked"); window.location.href = "../index.html"; };

function startTimer(currentTime = 120) {
  timer = currentTime;
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState !== "playing") { clearInterval(timerInterval); return; }
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      timer = 0;
      updateTimerDisplay();
      endLevel("Time's Up!");
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  document.getElementById("timerDisplay").textContent = `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}
function updateScoreDisplay() {
  document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
}

function gameLoop() {
  if (gameState !== "playing") return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Background
  if (assets.bg.complete && assets.bg.naturalWidth > 0) {
    const bgImage = assets.bg;
    const bgWidth = bgImage.naturalWidth;
    const canvasHeight = canvas.height;
    const parallaxFactor = 0.3;
    let startX = (-cameraX * parallaxFactor) % bgWidth;
    if (startX > 0) startX -= bgWidth;

    for (let x = startX; x < canvas.width; x += bgWidth) {
      ctx.drawImage(bgImage, x, 0, bgWidth, canvasHeight);
    }
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw Scenery (bushes, blocks)
  scenery.forEach(item => {
    if (item.asset && item.asset.complete && item.asset.naturalHeight !== 0) {
      const yPos = item.yAnchor !== undefined ? item.yAnchor - item.yOffset : platformBaseY - item.yOffset;
      ctx.drawImage(item.asset, item.x - cameraX, yPos);
    }
  });


  platforms.forEach(p => {
    if (p.type === 'ground') {
      const tileHeight = 40;
      const tileWidth = 40;
      if (assets.dirt.complete && assets.dirt.naturalHeight !== 0) {
        for (let i = 0; i * tileWidth < p.width; i++) {
          ctx.drawImage(assets.dirt, p.x + i * tileWidth - cameraX, p.y, tileWidth, tileHeight);
        }
      } else {
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
      }
      if (assets.grass.complete && assets.grass.naturalHeight !== 0) {
        for (let i = 0; i * tileWidth < p.width; i++) {
          ctx.drawImage(assets.grass, p.x + i * tileWidth - cameraX, p.y, tileWidth, tileHeight / 2);
        }
      }
    } else if (p.type === 'bridge' && assets.bridge.complete && assets.bridge.naturalHeight !== 0) {
      ctx.drawImage(assets.bridge, p.x - cameraX, p.y, p.width, p.height);
    } else if (p.type && p.type.startsWith('step') && assets[p.type] && assets[p.type].complete && assets[p.type].naturalHeight !== 0) {
      ctx.drawImage(assets[p.type], p.x - cameraX, p.y, p.width, p.height);
    } else if (p.type === 'platform' && assets.platform.complete && assets.platform.naturalHeight !== 0) {
      ctx.drawImage(assets.platform, p.x - cameraX, p.y, p.width, p.height);
    } else {
      ctx.fillStyle = "grey";
      ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }
  });

  spikes.forEach(s => {
    if (assets.spikes.complete && assets.spikes.naturalHeight !== 0) {
      ctx.drawImage(assets.spikes, s.x - cameraX, s.y, s.width, s.height);
    } else {
      ctx.fillStyle = "red"; ctx.fillRect(s.x - cameraX, s.y, s.width, s.height);
    }
    if (player.x < s.x + s.width && player.x + player.width > s.x &&
      player.y < s.y + s.height && player.y + player.height > s.y) {
      player.reset(); score = Math.max(0, score - 5); updateScoreDisplay();
    }
  });

  coins.forEach(c => {
    if (!c.collected) {
      if (assets.coin.complete && assets.coin.naturalHeight !== 0) {
        ctx.drawImage(assets.coin, c.x - cameraX, c.y, c.width, c.height);
      } else {
        ctx.fillStyle = "gold"; ctx.fillRect(c.x - cameraX, c.y, c.width, c.height);
      }
      if (player.x < c.x + c.width && player.x + player.width > c.x &&
        player.y < c.y + c.height && player.y + c.height > player.y) {
        c.collected = true; score++; updateScoreDisplay();
      }
    }
  });

  player.dx = 0;
  if (keys.left) player.dx = -player.speed;
  if (keys.right) player.dx = player.speed;

  player.update();
  player.draw();

  requestAnimationFrame(gameLoop);
}

function endGame() {
  // This function is called by endLevel when timer reaches 0 or all coins collected
  // It should primarily handle stopping game processes and cleaning up,
  // letting endLevel handle UI transitions.
  console.log("endGame called. Current score:", score); // Retain this log

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (assets.music) {
    assets.music.pause();
    assets.music.currentTime = 0; // Reset music for next play
  }
}


function endLevel(message = "Level Ended") {
  if (gameState === "ended") return;
  console.log("endLevel called with message:", message);
  gameState = "ended"; // Set game state to ended
  endGame(); // Call endGame for cleanup

  const allCoinsCollected = coins.every(c => c.collected);
  const nextLevelBtn = document.getElementById("nextLevelBtn");

  if (nextLevelBtn) {
    if (message === "Time's Up!" || !allCoinsCollected) {
      pauseMenu.children[0].textContent = message + (allCoinsCollected ? " - All Coins!" : " - Try Again?");
      pauseMenu.style.display = "flex";
      if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "none";
      if (document.getElementById("retryButton")) document.getElementById("retryButton").style.display = "block";
      if (document.getElementById("mainMenuButton")) document.getElementById("mainMenuButton").style.display = "block";

    } else if (allCoinsCollected) {
      nextLevelBtn.textContent = "You Win! (Next coming soon)";
      nextLevelBtn.style.display = "block";
      nextLevelBtn.onclick = () => {
        alert("Congratulations! Next level isn't ready yet.");
      };
    }
  } else {
    alert(message + (allCoinsCollected ? " - All Coins Collected!" : ""));
    pauseMenu.style.display = "flex";
    if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "none";
  }
}

const cryptoStepWidth = 60;
const cryptoStepMinHeight = 30;
const cryptoStepMaxHeight = 100;

function getRandomStepAsset(isGreen, sizeHint) {
  let asset;
  let size = sizeHint || Math.random();
  if (isGreen) {
    if (size < 0.33) asset = assets.greenstepsmall;
    else if (size < 0.66) asset = assets.greenstepmedium;
    else asset = assets.greensteplarge;
  } else {
    if (size < 0.33) asset = assets.redstepsmall;
    else if (size < 0.66) asset = assets.redstepmedium;
    else asset = assets.redsteplarge;
  }
  if (asset === assets.greenstepsmall) return 'greenstepsmall';
  if (asset === assets.greenstepmedium) return 'greenstepmedium';
  if (asset === assets.greensteplarge) return 'greensteplarge';
  if (asset === assets.redstepsmall) return 'redstepsmall';
  if (asset === assets.redstepmedium) return 'redstepmedium';
  if (asset === assets.redsteplarge) return 'redsteplarge';
  return 'cryptostep';
}

function addCryptoChartStaircase(startX, startY, numSteps) {
  let currentY = startY;
  let currentX = startX;

  for (let i = 0; i < numSteps; i++) {
    let yDelta = (Math.random() * (cryptoStepMaxHeight - cryptoStepMinHeight) + cryptoStepMinHeight) * (Math.random() < 0.5 ? -1 : 1);
    let nextY = currentY + yDelta;

    nextY = Math.max(platformBaseY - 500, Math.min(platformBaseY - 50, nextY));

    let isGreen = nextY < currentY;
    let stepAssetType = getRandomStepAsset(isGreen, Math.random());

    platforms.push({
      x: currentX,
      y: nextY,
      width: cryptoStepWidth,
      height: Math.abs(currentY - nextY) + cryptoStepMinHeight,
      type: stepAssetType
    });
    coins.push({
      x: currentX + cryptoStepWidth / 2 - coinWidth / 2,
      y: nextY - coinHeight - 10,
      collected: false,
      width: coinWidth,
      height: coinHeight
    });
    currentX += cryptoStepWidth + (Math.random() * 20 + 10);
    currentY = nextY;
  }
}

addCryptoChartStaircase(600, platformBaseY - 100, 15);

addCryptoChartStaircase(11000, platformBaseY - 150, 20);

addCryptoChartStaircase(21000, platformBaseY - 200, 25);


function initGame() {
  console.log("initGame: Initializing game state for Level 2...");
  score = 0;
  updateScoreDisplay();
  timer = 120;
  gameState = "playing";

  const nextLevelBtn = document.getElementById("nextLevelBtn");
  if (nextLevelBtn) nextLevelBtn.style.display = "none";
  pauseMenu.style.display = "none";
  if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "none";


  coins.forEach(c => c.collected = false);
  player.reset();

  if (assets.music) {
    assets.music.currentTime = 0;
    if (musicEnabled) {
        let playPromise = assets.music.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.warn("Music autoplay for Level 2 was prevented:", error));
        }
    }
  }
  startTimer();
  requestAnimationFrame(gameLoop);
  console.log("initGame: Level 2 started.");
}

let assetsLoaded = 0;
let totalAssets = 0;

function countAllAssets(obj) {
  for (const key in obj) {
    if (obj[key] instanceof HTMLImageElement || obj[key] instanceof HTMLAudioElement) {
      totalAssets++;
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach(item => {
        if (item instanceof HTMLImageElement || item instanceof HTMLAudioElement) totalAssets++;
      });
    }
  }
}
countAllAssets(assets);

function assetLoadHandler(assetName, success) {
  assetsLoaded++;
  if (success) {
    console.log(`Asset '${assetName}' loaded successfully. Progress: ${assetsLoaded}/${totalAssets}`);
  } else {
    console.error(`Asset '${assetName}' FAILED to load. Progress: ${assetsLoaded}/${totalAssets}`);
    if (assetName === assets.bg.src) {
      console.error("CRITICAL: Background image failed to load. Gameplay experience will be affected.");
    }
  }

  if (assetsLoaded === totalAssets) {
    console.log(`All ${totalAssets} Level 2 assets accounted for (loaded or failed). Initializing game.`);
    initGame();
  }
}

for (const key in assets) {
  const assetItem = assets[key];
  if (assetItem instanceof HTMLImageElement || assetItem instanceof HTMLAudioElement) {
    const src = assetItem.src || `audio_${key}`;
    assetItem.onload = () => assetLoadHandler(src, true);
    assetItem.onerror = () => assetLoadHandler(src, false);
    if (assetItem instanceof HTMLAudioElement) {
      assetItem.oncanplaythrough = () => assetLoadHandler(src, true);
    }

  } else if (Array.isArray(assetItem)) {
    assetItem.forEach(img => {
      if (img instanceof HTMLImageElement) {
        const src = img.src;
        img.onload = () => assetLoadHandler(src, true);
        img.onerror = () => assetLoadHandler(src, false);
      }
    });
  }
}

const gameStartTimeout = setTimeout(() => {
  if (gameState === "loading") {
    console.warn(`Timeout (${gameStartTimeout}ms) waiting for assets. ${assetsLoaded}/${totalAssets} loaded. Forcing game start attempt if not already started.`);
    if (assetsLoaded < totalAssets) {
      console.warn("Not all assets reported loaded/failed. Game might be missing resources.");
    }
    if (gameState === "loading") {
      initGame();
    }
  }
}, 5000);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  console.log("Canvas resized. Redrawing may be needed or elements repositioned.");
});

console.log("End of Level 2 script. Asset loading initiated.");

// Helper to place coins in a letter shape
function placeLetter(letter, startX, startY, scale = 1) {
  const pixel = 30 * scale; // Spacing between coins
  const patterns = {
    'W': [
      "1   1   1",
      "1   1   1",
      "1   1   1",
      "1   1   1",
      "1   1   1",
      "1 1 1 1 1",
      " 1     1 "
    ],
    'E': [
      "1111111",
      "1      ",
      "1      ",
      "111111 ",
      "1      ",
      "1      ",
      "1111111"
    ],
    'P': [
      "111111 ",
      "1     1",
      "1     1",
      "111111 ",
      "1      ",
      "1      ",
      "1      "
    ],
    'E2': [ // This is the distinct 'E' pattern for the end of WEPE
      "1111111",
      "1      ",
      "1      ",
      "111111 ",
      "1      ",
      "1      ",
      "1111111"
    ]
  };
  const patternRows = patterns[letter];
  if (!patternRows) return;
  for (let dy = 0; dy < patternRows.length; dy++) {
    const row = patternRows[dy];
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] === '1') {
        coins.push({
          x: startX + dx * pixel,
          y: startY + dy * pixel,
          collected: false,
          width: coinWidth,
          height: coinHeight
        });
      }
    }
  }
}

// 🧹 Remove old WEPE positions (manually if necessary)
// 🟢 Place new centered and spaced W E P E
let startX = 13000;
let startY = platformBaseY - 500;
let spacing = 260;
placeLetter('W', startX, startY, 1.5);
placeLetter('E', startX + spacing, startY, 1.5);
placeLetter('P', startX + spacing * 2, startY, 1.5);
placeLetter('E2', startX + spacing * 3, startY, 1.5); // <-- This is the last E

let musicEnabled = true; // Track if music should play