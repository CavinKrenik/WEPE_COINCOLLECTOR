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
  // dirt: new Image(), // Uncomment if you have these assets
  // grass: new Image(),
  // bridge: new Image(),
  // blockEmpty: new Image(),
  spikes: new Image(),
  music: new Audio()
};

// --- IMPORTANT: Ensure 'level2background.gif' is in the 'leveltwo' folder ---
assets.bg.src = "level2background.gif";
// --- ---

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

assets.music.src = "Fast Desert Theme.wav";
assets.music.loop = true;
assets.music.volume = 0.5;

// UI Elements from HTML
const pauseMenu = document.getElementById("pauseMenu");
const resumeButton = document.getElementById("resumeButton");
const retryButton = document.getElementById("retryButton"); // For pause menu
const mainMenuButton = document.getElementById("mainMenuButton"); // For pause menu

// End Screen Buttons from HTML
const endScreenRetryBtn = document.getElementById("endScreenRetryBtn");
const endScreenMainMenuBtn = document.getElementById("endScreenMainMenuBtn");


// Game state
let score = 0;
let timer = 120; // 2 minutes
let gameState = "loading"; // Start with loading state
let cameraX = 0;
let timerInterval;
let totalGameWidth = 6000; // Define the total width of your game world, should match platform extent

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

     if (this.x < 0) { // Prevent moving left of absolute 0
        this.x = 0;
     }
     // Prevent moving beyond the defined game width (optional, if you want a hard stop)
     if (this.x + this.width > totalGameWidth) {
        this.x = totalGameWidth - this.width;
     }


    let targetCameraX = this.x - canvas.width / 3;
    cameraX = Math.max(0, Math.min(targetCameraX, totalGameWidth - canvas.width)); // Camera doesn't go left of 0 or beyond game width
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
  }
};

const platformBaseY = canvas.height - 40;
const coinWidth = 32;
const coinHeight = 32;
const spikeHeight = 20;

const platforms = [
  { x: 0, y: platformBaseY, width: totalGameWidth, height: 40, type: 'ground' }, // Main ground uses totalGameWidth
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
  { x: 5800, y: platformBaseY - 180, width: 180, height: 20 }, // Near the end of 6000 width
];

const coins = [
  { x: 350, y: platformBaseY - 140 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 550, y: platformBaseY - 210 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1050, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1450, y: platformBaseY - 140 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1750, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1950, y: platformBaseY - 200 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2150, y: platformBaseY - 150 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2400, y: platformBaseY - 120 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2650, y: platformBaseY - 220 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2850, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 3100, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 3350, y: platformBaseY - 130 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 3650, y: platformBaseY - 200 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 3850, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4100, y: platformBaseY - 160 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4350, y: platformBaseY - 120 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4600, y: platformBaseY - 210 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4850, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5050, y: platformBaseY - 170 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5350, y: platformBaseY - 150 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5600, y: platformBaseY - 100 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5850, y: platformBaseY - 180 - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  // Ground coins
  { x: 400, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 900, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 1600, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2200, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 2900, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 3500, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4200, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 4900, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
  { x: 5500, y: platformBaseY - coinHeight, collected: false, width: coinWidth, height: coinHeight },
];

const spikes = [
  { x: 850, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 1300, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 1800, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 1780, y: platformBaseY - 100 - spikeHeight, width: 40, height: spikeHeight }, // On platform x:1700
  { x: 2500, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 2540, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 3000, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 3350, y: platformBaseY - 130 - spikeHeight, width: 40, height: spikeHeight }, // On platform x:3300
  { x: 3700, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 4000, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 4040, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 4400, y: platformBaseY - 120 - spikeHeight, width: 40, height: spikeHeight }, // On platform x:4300
  { x: 4700, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 5100, y: platformBaseY - 170 - spikeHeight, width: 40, height: spikeHeight }, // On platform x:5000
  { x: 5400, y: platformBaseY - spikeHeight, width: 40, height: spikeHeight },
  { x: 5850, y: platformBaseY - 180 - spikeHeight, width: 40, height: spikeHeight }, // On platform x:5800
];

// Input
const keys = {};
window.addEventListener("keydown", e => {
  if (e.code === "Escape") {
      togglePause();
      e.preventDefault(); return;
  }
  if (gameState !== "playing") return;
  if (e.code === "ArrowLeft") { keys.left = true; e.preventDefault(); }
  if (e.code === "ArrowRight") { keys.right = true; e.preventDefault(); }
  if (e.code === "Space") { player.jump(); e.preventDefault(); }
});
window.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
});

// Touch controls
document.getElementById("leftBtn").addEventListener("touchstart", e => { e.preventDefault(); if (gameState === "playing") keys.left = true; });
document.getElementById("leftBtn").addEventListener("touchend", e => { e.preventDefault(); if (gameState === "playing") keys.left = false; });
document.getElementById("rightBtn").addEventListener("touchstart", e => { e.preventDefault(); if (gameState === "playing") keys.right = true; });
document.getElementById("rightBtn").addEventListener("touchend", e => { e.preventDefault(); if (gameState === "playing") keys.right = false; });
document.getElementById("jumpBtn").addEventListener("touchstart", e => { e.preventDefault(); if (gameState === "playing") player.jump(); });

// Pause logic
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
    startTimer(timer);
    requestAnimationFrame(gameLoop);
  }
}

resumeButton.onclick = togglePause;
retryButton.onclick = () => location.reload();
mainMenuButton.onclick = () => window.location.href = "../index.html";

// Timer
function startTimer(currentTime = 120) {
  timer = currentTime;
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState !== "playing") { clearInterval(timerInterval); return; }
    timer--;
    updateTimerDisplay();
    if (timer <= 0) endLevel();
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

// Game loop
function gameLoop() {
  if (gameState !== "playing") return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Updated Background Drawing Logic ---
  if (assets.bg.complete && assets.bg.naturalWidth > 0) {
      const bgImage = assets.bg;
      const bgWidth = bgImage.naturalWidth;
      // const bgHeight = bgImage.naturalHeight; // Use if you need original height for aspect ratio
      const canvasHeight = canvas.height;
      const parallaxFactor = 0.3; // Adjust for more or less parallax (0.1 to 0.8 is common)

      let startX = (-cameraX * parallaxFactor);
      // Ensure seamless tiling by adjusting startX with modulo, handling negative results correctly
      startX = startX % bgWidth;
      if (startX > 0) {
          startX -= bgWidth;
      }
      
      for (let x = startX; x < canvas.width; x += bgWidth) {
          ctx.drawImage(bgImage, x, 0, bgWidth, canvasHeight); // Stretches/crops bg to canvas height
      }
  } else {
      ctx.fillStyle = "#222"; // Fallback
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // --- End of Background Drawing ---


  if (assets.bushBig.complete) ctx.drawImage(assets.bushBig, 600 - cameraX, platformBaseY - assets.bushBig.height);
  if (assets.bushSmall.complete) ctx.drawImage(assets.bushSmall, 1200 - cameraX, platformBaseY - assets.bushSmall.height);
  if (assets.bushBig.complete) ctx.drawImage(assets.bushBig, 2600 - cameraX, platformBaseY - assets.bushBig.height);
  if (assets.bushSmall.complete) ctx.drawImage(assets.bushSmall, 3500 - cameraX, platformBaseY - assets.bushSmall.height);
  if (assets.bushBig.complete) ctx.drawImage(assets.bushBig, 4500 - cameraX, platformBaseY - assets.bushBig.height); // More scenery


  platforms.forEach(p => {
    let platformImg = assets.platform;
    if(platformImg.complete && platformImg.naturalHeight !== 0) {
        ctx.drawImage(platformImg, p.x - cameraX, p.y, p.width, p.height);
    } else {
        ctx.fillStyle = "grey"; ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }
  });

  spikes.forEach(s => {
    if(assets.spikes.complete && assets.spikes.naturalHeight !== 0) {
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
        if(assets.coin.complete && assets.coin.naturalHeight !== 0) {
            ctx.drawImage(assets.coin, c.x - cameraX, c.y, c.width, c.height);
        } else {
            ctx.fillStyle = "gold"; ctx.fillRect(c.x - cameraX, c.y, c.width, c.height);
        }
      if (player.x < c.x + c.width && player.x + player.width > c.x &&
          player.y < c.y + c.height && player.y + player.height > c.y) {
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

function endLevel() {
  if (gameState === "ended") return;
  gameState = "ended";
  clearInterval(timerInterval);
  if (assets.music) assets.music.pause();

  // Display "Time's Up!" message or similar on one of the buttons or a new div
  // For simplicity, we'll use the retry button's text content area or a new message div.
  // Let's assume you might want a specific message area:
  // const timeUpMessageDiv = document.getElementById("timeUpMessage"); // You'd add this div to HTML
  // if(timeUpMessageDiv) timeUpMessageDiv.textContent = "Time's Up!";

  endScreenRetryBtn.textContent = "Retry Level"; // Set text for clarity
  endScreenRetryBtn.style.display = "block";
  endScreenMainMenuBtn.style.display = "block";


  endScreenRetryBtn.onclick = () => location.reload();
  endScreenMainMenuBtn.onclick = () => window.location.href = "../index.html";
}

function initGame() {
  score = 0;
  updateScoreDisplay();
  gameState = "playing"; // Set to playing once assets are loaded and game starts

  // Hide end screen buttons initially
  endScreenRetryBtn.style.display = "none";
  endScreenMainMenuBtn.style.display = "none";


  coins.forEach(c => c.collected = false);
  player.reset();

  if (assets.music) {
    assets.music.currentTime = 0;
    let playPromise = assets.music.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => console.warn("Music autoplay for Level 2 was prevented:", error));
    }
  }
  startTimer();
  requestAnimationFrame(gameLoop);
}

// Count all images (including arrays)
let assetsLoaded = 0;
let totalAssets = 0;

// Helper to count all images (including arrays)
function countAllImages(obj) {
    for (const key in obj) {
        if (obj[key] instanceof HTMLImageElement) {
            totalAssets++;
        } else if (Array.isArray(obj[key])) {
            obj[key].forEach(img => {
                if (img instanceof HTMLImageElement) totalAssets++;
            });
        }
    }
}
countAllImages(assets);

// Now assign onload/onerror for all images (including arrays)
function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        console.log("All Level 2 assets loaded.");
        initGame();
    }
}
for (const key in assets) {
    if (assets[key] instanceof HTMLImageElement) {
        assets[key].onload = assetLoaded;
        assets[key].onerror = assetLoaded;
    } else if (Array.isArray(assets[key])) {
        assets[key].forEach(img => {
            if (img instanceof HTMLImageElement) {
                img.onload = assetLoaded;
                img.onerror = assetLoaded;
            }
        });
    }
}

// If an asset has no src (like an unassigned Audio object initially), it won't fire load events.
// A simple way if not all assets have src initially assigned or are not HTMLImage/Audio:
// For now, the current loop handles images and audio with src. If you have other asset types, adjust.
// If an asset object doesn't have a .src (e.g. it's a sub-object like player frames), this simple counter won't work perfectly.
// The current asset list is flat, so it should mostly work.

// Fallback if some assets don't load or to ensure game starts
// window.onload is a good general trigger, but asset preloading is better.
window.onload = () => {
    // If assets haven't triggered initGame yet (e.g. due to caching or quick loads)
    // and game state is still 'loading', try to start.
    // This is a fallback; the assetLoaded counter is preferred.
    if (gameState === "loading" && assetsLoaded < totalAssets) {
        console.warn("Window loaded, but not all assets reported loaded. Attempting to start game if critical assets are ready.");
        // You could add a more robust check here for critical assets like player/background
        // For now, if the asset counter didn't finish, this will just wait or you can force start.
        // To be safe, we rely on the assetLoaded counter. If it fails, check console for errors.
    }
    // If no assets were defined with src, the counter might not increment.
    // A simple timeout fallback if assetLoaded isn't robust enough for all cases:
    setTimeout(() => {
        if (gameState === "loading") {
            console.warn("Timeout waiting for assets. Forcing game start attempt.");
            initGame();
        }
    }, 3000); // Start after 3s if assets are still "loading"
};

// Resize canvas listener
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // You might need to recalculate platformBaseY and other layout elements if they depend on initial canvas.height
    // For simplicity, current design assumes platformBaseY is relative to initial load height.
    // If you want dynamic recalculation:
    // platformBaseY = canvas.height - 40; // And then potentially update all platform/coin/spike y positions
});