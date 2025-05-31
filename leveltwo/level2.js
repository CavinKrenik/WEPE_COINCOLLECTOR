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
  dirt: new Image(), // Uncommented
  grass: new Image(), // Uncommented
  bridge: new Image(), // Uncommented
  blockEmpty: new Image(), // Uncommented
  spikes: new Image(),
  music: new Audio()
};

console.log("Initializing asset loading for Level 2...");

// --- IMPORTANT: Ensure asset files are in the 'leveltwo' folder ---
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

// Set sources for newly uncommented assets (assuming .png and in 'leveltwo' folder)
assets.dirt.src = "dirt.png";
assets.grass.src = "grass.png";
assets.bridge.src = "bridge.png";
assets.blockEmpty.src = "blockempty.png"; // Assuming 'blockempty.png' as a filename

assets.music.src = "Fast Desert Theme.wav";
assets.music.loop = true;
assets.music.volume = 0.5;

// UI Elements from HTML
const pauseMenu = document.getElementById("pauseMenu");
const resumeButton = document.getElementById("resumeButton");
const retryButton = document.getElementById("retryButton"); // For pause menu
const mainMenuButton = document.getElementById("mainMenuButton"); // For pause menu

// End Screen Buttons from HTML (ensure these IDs exist in level2.html if used for end screen)
// const endScreenRetryBtn = document.getElementById("endScreenRetryBtn");
// const endScreenMainMenuBtn = document.getElementById("endScreenMainMenuBtn");
// For level 2, it seems these might not be in the HTML, the endLevel function needs adjustment or these buttons added to HTML
// For now, I will assume they might be added or an alternative end screen is used.
// If not, the endLevel function will try to access null elements.
// The provided level2.html does not have "endScreenRetryBtn" or "endScreenMainMenuBtn".
// It has a "nextLevelBtn". I'll adapt to what's available or keep it simple.
// For now, endLevel just stops the game and music. A proper end screen/transition would be needed.


// Game state
let score = 0;
let timer = 120; // 2 minutes
let gameState = "loading"; // Start with loading state
let cameraX = 0;
let timerInterval;
let totalGameWidth = 24000; // Expanded from 6000

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
        this.y + this.height > p.y && this.y + this.height < p.y + p.height / 2 + this.dy && // Simpler check for landing on top
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
      ctx.fillStyle = "green"; // Fallback
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
    this.y = canvas.height - 160; // Adjust if platformBaseY changes with resize
    this.dx = 0;
    this.dy = 0;
    this.onGround = false;
    this.isJumping = false;
    this.direction = "right";
    this.currentFrame = 0;
    cameraX = 0; // Reset camera on player reset
  }
};

const platformBaseY = canvas.height - 40; // Base for ground, adjust if needed
const coinWidth = 32;
const coinHeight = 32;
const spikeHeight = 20; // Assuming original spike asset height

const platforms = [
  // Main ground platform - type 'ground' for special rendering
  { x: 0, y: platformBaseY, width: totalGameWidth, height: 40, type: 'ground' },
  // Original platforms
  { x: 300, y: platformBaseY - 140, width: 120, height: 20 },
  { x: 500, y: platformBaseY - 210, width: 120, height: 20 },
  { x: 700, y: platformBaseY - 140, width: 120, height: 20 },
  { x: 1000, y: platformBaseY - 180, width: 120, height: 20 },
  { x: 1400, y: platformBaseY - 140, width: 120, height: 20 },
  { x: 1700, y: platformBaseY - 100, width: 150, height: 20 },
  { x: 1900, y: platformBaseY - 200, width: 100, height: 20 },
  { x: 2100, y: platformBaseY - 150, width: 120, height: 20 },
  { x: 2350, y: platformBaseY - 120, width: 180, height: 20 },
  { x: 2600, y: platformBaseY - 220, width: 100, height: 20 },
  { x: 2800, y: platformBaseY - 100, width: 150, height: 20 },
  { x: 3050, y: platformBaseY - 180, width: 120, height: 20 },
  { x: 3300, y: platformBaseY - 130, width: 200, height: 20 },
  { x: 3600, y: platformBaseY - 200, width: 100, height: 20 },
  { x: 3800, y: platformBaseY - 100, width: 150, height: 20 },
  { x: 4050, y: platformBaseY - 160, width: 120, height: 20 },
  { x: 4300, y: platformBaseY - 120, width: 180, height: 20 },
  { x: 4550, y: platformBaseY - 210, width: 100, height: 20 },
  { x: 4800, y: platformBaseY - 100, width: 150, height: 20 },
  { x: 5000, y: platformBaseY - 170, width: 200, height: 20 },
  { x: 5300, y: platformBaseY - 150, width: 150, height: 20 },
  { x: 5550, y: platformBaseY - 100, width: 100, height: 20 },
  { x: 5800, y: platformBaseY - 180, width: 180, height: 20 },

  // Expanded level platforms (6000 to 12000)
  { x: 6200, y: platformBaseY - 150, width: 150, height: 20 },
  { x: 6500, y: platformBaseY - 100, width: 200, height: 20, type: 'bridge' }, // Example bridge platform
  { x: 6800, y: platformBaseY - 200, width: 100, height: 20 },
  { x: 7100, y: platformBaseY - 120, width: 180, height: 20 },
  { x: 7400, y: platformBaseY - 250, width: 120, height: 20 },
  { x: 7800, y: platformBaseY - 100, width: 150, height: 20 },
  { x: 8200, y: platformBaseY - 180, width: 200, height: 20 },
  { x: 8500, y: platformBaseY - 80, width: 100, height: 20 },
  { x: 8900, y: platformBaseY - 220, width: 150, height: 20 },
  { x: 9300, y: platformBaseY - 140, width: 120, height: 20 },
  { x: 9700, y: platformBaseY - 190, width: 250, height: 20, type: 'bridge' }, // Example bridge
  { x: 10100, y: platformBaseY - 100, width: 100, height: 20 },
  { x: 10400, y: platformBaseY - 240, width: 130, height: 20 },
  { x: 10800, y: platformBaseY - 160, width: 180, height: 20 },
  { x: 11200, y: platformBaseY - 90, width: 150, height: 20 },
  { x: 11600, y: platformBaseY - 200, width: 200, height: 20 },
];

const coins = [
  // Original coins
  { x: 350, y: platformBaseY - 140 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 550, y: platformBaseY - 210 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1050, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  // ... (include all original coins for brevity) ...
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
  // ... (include all original spikes for brevity) ...
  { x: 5850, y: platformBaseY - 180 - spikeHeight, width: 40, height: spikeHeight }, // On platform x:5800

  // Expanded level spikes
  { x: 6400, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 6880, y: platformBaseY - 200 - spikeHeight, width: 40, height: spikeHeight }, // On platform
  { x: 7200, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 7240, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 8000, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 8550, y: platformBaseY - 80 - spikeHeight, width: 40, height: spikeHeight }, // On platform
  { x: 9500, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 10200, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 10850, y: platformBaseY - 160 - spikeHeight, width: 40, height: spikeHeight }, // On platform
  { x: 11500, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
];

const scenery = [ // For blockEmpty and additional bushes
  { asset: assets.bushBig, x: 600, yOffset: assets.bushBig.height },
  { asset: assets.bushSmall, x: 1200, yOffset: assets.bushSmall.height },
  { asset: assets.bushBig, x: 2600, yOffset: assets.bushBig.height },
  { asset: assets.bushSmall, x: 3500, yOffset: assets.bushSmall.height },
  { asset: assets.bushBig, x: 4500, yOffset: assets.bushBig.height },
  // Expanded
  { asset: assets.blockEmpty, x: 6100, yOffset: 50, yAnchor: platformBaseY - 200 }, // Example decorative block
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
    if (assets.music) {
      let playPromise = assets.music.play();
      if (playPromise !== undefined) playPromise.catch(error => console.warn("Music resume failed:", error));
    }
    startTimer(timer); // Resume timer with current time
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
      timer = 0; // Ensure timer doesn't go negative if endLevel has a delay
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
    if (startX > 0) startX -= bgWidth; // Correct handling for positive modulo

    for (let x = startX; x < canvas.width; x += bgWidth) {
      ctx.drawImage(bgImage, x, 0, bgWidth, canvasHeight);
    }
  } else {
    ctx.fillStyle = "#222"; // Fallback if background fails to load
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
      const tileHeight = 40; // Assuming assets.dirt/grass are tileable or will be stretched
      const tileWidth = 40; // Assume square tiles or adjust as needed for asset aspect ratio
      if (assets.dirt.complete && assets.dirt.naturalHeight !== 0) {
        for (let i = 0; i * tileWidth < p.width; i++) {
          ctx.drawImage(assets.dirt, p.x + i * tileWidth - cameraX, p.y, tileWidth, tileHeight);
        }
      } else { // Fallback for dirt
        ctx.fillStyle = "#8B4513"; // Brown
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
      }
      if (assets.grass.complete && assets.grass.naturalHeight !== 0) {
        for (let i = 0; i * tileWidth < p.width; i++) {
          // Draw grass slightly overlapping or on top of dirt
          ctx.drawImage(assets.grass, p.x + i * tileWidth - cameraX, p.y, tileWidth, tileHeight / 2); // Assuming grass is half height
        }
      }
    } else if (p.type === 'bridge' && assets.bridge.complete && assets.bridge.naturalHeight !== 0) {
      ctx.drawImage(assets.bridge, p.x - cameraX, p.y, p.width, p.height);
    } else if (p.type === 'cryptostep' && assets.cryptostep.complete && assets.cryptostep.naturalHeight !== 0) {
      ctx.drawImage(assets.cryptostep, p.x - cameraX, p.y, p.width, p.height);
    } else if (assets.platform.complete && assets.platform.naturalHeight !== 0) {
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
      ctx.fillStyle = "red"; ctx.fillRect(s.x - cameraX, s.y, s.width, s.height); // Fallback
    }
    if (player.x < s.x + s.width && player.x + player.width > s.x &&
      player.y < s.y + s.height && player.y + player.height > s.y) {
      player.reset(); score = Math.max(0, score - 5); updateScoreDisplay();
      // Potentially add a small visual/audio cue for damage
    }
  });

  coins.forEach(c => {
    if (!c.collected) {
      if (assets.coin.complete && assets.coin.naturalHeight !== 0) {
        ctx.drawImage(assets.coin, c.x - cameraX, c.y, c.width, c.height);
      } else {
        ctx.fillStyle = "gold"; ctx.fillRect(c.x - cameraX, c.y, c.width, c.height); // Fallback
      }
      if (player.x < c.x + c.width && player.x + player.width > c.x &&
        player.y < c.y + c.height && player.y + player.height > c.y) {
        c.collected = true; score++; updateScoreDisplay();
        // Potentially add a small visual/audio cue for coin collection
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

function endLevel(message = "Level Ended") {
  if (gameState === "ended") return;
  console.log("endLevel called with message:", message);
  gameState = "ended";
  clearInterval(timerInterval);
  if (assets.music) assets.music.pause();

  // Show "Next Level" button if all coins collected or some other condition
  const allCoinsCollected = coins.every(c => c.collected);
  const nextLevelBtn = document.getElementById("nextLevelBtn");

  if (nextLevelBtn) { // Check if button exists
    if (message === "Time's Up!" || !allCoinsCollected) {
      // On time up or not all coins, perhaps show Retry/Main Menu on pause menu
      // Or display a message differently.
      // For simplicity, just show a message using an alert or modifying pause menu text.
      pauseMenu.children[0].textContent = message + (allCoinsCollected ? " - All Coins!" : " - Try Again?");
      // Show pause menu as an end screen
      pauseMenu.style.display = "flex";
      // Hide resume, show retry and main menu
      if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "none";
      if (document.getElementById("retryButton")) document.getElementById("retryButton").style.display = "block";
      if (document.getElementById("mainMenuButton")) document.getElementById("mainMenuButton").style.display = "block";

    } else if (allCoinsCollected) { // Player won
      nextLevelBtn.textContent = "You Win! (Next coming soon)"; // Or actual next level
      nextLevelBtn.style.display = "block";
      nextLevelBtn.onclick = () => {
        alert("Congratulations! Next level isn't ready yet.");
        // window.location.href = "../levelthree/level3.html"; // Example
      };
    }
  } else {
    // Fallback if nextLevelBtn is not in HTML
    alert(message + (allCoinsCollected ? " - All Coins Collected!" : ""));
    // Show pause menu as an end screen
    pauseMenu.style.display = "flex";
    if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "none";
  }
}

// Add a staircase of cryptostep platforms (right side of the level)
const stairStartX = 18000;
const stairStartY = platformBaseY - 40;
const stairSteps = 15;
/* stepWidth already declared above; removed duplicate declaration */
const stepHeight = 30;
for (let i = 0; i < stairSteps; i++) {
  platforms.push({
    x: stairStartX + i * stepWidth,
    y: stairStartY - i * stepHeight,
    width: stepWidth,
    height: stepHeight,
    type: 'cryptostep'
  });
  // Place a coin on each step
  coins.push({
    x: stairStartX + i * stepWidth + stepWidth / 2 - coinWidth / 2,
    y: stairStartY - i * stepHeight - coinHeight - 5,
    collected: false,
    width: coinWidth,
    height: coinHeight
  });
}

// Add three staircases of cryptostep platforms
function addStaircase(startX, startY, steps, up = true) {
  for (let i = 0; i < steps; i++) {
    platforms.push({
      x: startX + i * stepWidth,
      y: up ? startY - i * stepHeight : startY + i * stepHeight,
      width: stepWidth,
      height: stepHeight,
      type: 'cryptostep'
    });
    // Place a coin on each step
    coins.push({
      x: startX + i * stepWidth + stepWidth / 2 - coinWidth / 2,
      y: (up ? startY - i * stepHeight : startY + i * stepHeight) - coinHeight - 5,
      collected: false,
      width: coinWidth,
      height: coinHeight
    });
  }
}

const stepWidth = 80;

// Staircase 1: Near the beginning
addStaircase(600, platformBaseY - 40, 10, true);

// Staircase 2: Middle of the level
addStaircase(11000, platformBaseY - 40, 12, true);

// Staircase 3: Near the end
addStaircase(21000, platformBaseY - 40, 15, true);

function initGame() {
  console.log("initGame: Initializing game state for Level 2...");
  score = 0;
  updateScoreDisplay();
  timer = 120; // Reset timer
  gameState = "playing";

  const nextLevelBtn = document.getElementById("nextLevelBtn");
  if (nextLevelBtn) nextLevelBtn.style.display = "none";
  pauseMenu.style.display = "none";
  if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "inline-block"; // Ensure resume is visible


  coins.forEach(c => c.collected = false);
  player.reset(); // Resets player position and camera

  if (assets.music) {
    assets.music.currentTime = 0;
    let playPromise = assets.music.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => console.warn("Music autoplay for Level 2 was prevented:", error));
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
countAllAssets(assets); // Count all images and audio for loading.

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
    const src = assetItem.src || `audio_${key}`; // Audio might not have src immediately if controlled later
    assetItem.onload = () => assetLoadHandler(src, true);
    assetItem.onerror = () => assetLoadHandler(src, false);
    // For audio, 'canplaythrough' is often better than 'onload'
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

// New asset for cryptostep
assets.cryptostep = new Image();
assets.cryptostep.src = "cryptostep.png";

// Fallback timeout for game start, though asset handlers should cover it.
const gameStartTimeout = setTimeout(() => {
  if (gameState === "loading") {
    console.warn(`Timeout (${gameStartTimeout}ms) waiting for assets. ${assetsLoaded}/${totalAssets} loaded. Forcing game start attempt if not already started.`);
    if (assetsLoaded < totalAssets) {
      console.warn("Not all assets reported loaded/failed. Game might be missing resources.");
    }
    // Check again because initGame might have been called by asset handlers
    if (gameState === "loading") {
      initGame();
    }
  }
}, 5000); // Increased timeout to 5s

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // player.reset(); // Or adjust player position more intelligently
  // platformBaseY may need recalculation if it's meant to be dynamic
  // For now, assuming initial platformBaseY based on initial load height is okay.
  // If platforms/player y-pos needs dynamic adjustment, that logic would go here.
  console.log("Canvas resized. Redrawing may be needed or elements repositioned.");
});

// Ensure script tries to load assets even if window.onload fires early (e.g. cached page)
// The primary loading is now tied to asset events directly.
console.log("End of Level 2 script. Asset loading initiated.");

// Helper to place coins in a letter shape
function placeLetter(letter, startX, startY, scale = 1) {
  const pixel = 24 * scale; // spacing
  const patterns = {
    W: [
      [0,0],[0,1],[0,2],[0,3],[1,3],[2,2],[3,3],[4,2],[5,3],[6,2],[6,1],[6,0]
    ],
    E: [
      [0,0],[0,1],[0,2],[0,3],[1,0],[2,0],[1,1],[1,2],[1,3],[2,3]
    ],
    P: [
      [0,0],[0,1],[0,2],[0,3],[1,0],[2,0],[2,1],[1,2],[2,2]
    ]
  };
  const coords = patterns[letter];
  if (!coords) return;
  coords.forEach(([dx,dy]) => {
    coins.push({
      x: startX + dx * pixel,
      y: startY + dy * pixel,
      collected: false,
      width: coinWidth,
      height: coinHeight
    });
  });
}

// Spell WEPE in the middle of the level
let letterStartX = 14000;
let letterStartY = platformBaseY - 400;
placeLetter('W', letterStartX, letterStartY, 2);
placeLetter('E', letterStartX + 200, letterStartY, 2);
placeLetter('P', letterStartX + 350, letterStartY, 2);
placeLetter('E', letterStartX + 500, letterStartY, 2);