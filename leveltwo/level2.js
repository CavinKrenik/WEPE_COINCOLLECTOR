const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load assets
const assets = {
  bg: new Image(),
  rocket1: new Image(),
  rocket2: new Image(),
  rocketBoost: new Image(),
  coin: new Image(),
  music: new Audio(),
};

console.log("Initializing asset loading for Level 3...");

// ASSET PATHS - CORRECTED FOR NEW FILE STRUCTURE
assets.bg.src = "Assets/background.png"; // Corrected path
assets.rocket1.src = "Assets/rocket.png"; // Corrected path
assets.rocket2.src = "Assets/rocket2.png"; // Corrected path
assets.rocketBoost.src = "Assets/rocketboost.png"; // Corrected path
assets.coin.src = "Assets/coin.png"; // Corrected path
assets.music.src = "Assets/backgroundmusic.wav"; // Corrected path

assets.music.loop = true;
assets.music.volume = 0.5;

// UI Elements from HTML
const pauseMenu = document.getElementById("pauseMenu");
const resumeButton = document.getElementById("resumeButton");
const retryButton = document.getElementById("retryButton");
const mainMenuButton = document.getElementById("mainMenuButton");
const toggleMusicButton = document.getElementById("toggleMusicButton");

// Game state
let score = 0;
let timer = 120; // 2 minutes
let gameState = "loading";
let cameraX = 0; // Camera moves horizontally
let timerInterval;
let totalGameWidth = 30000; // Increased game width for a long level
let musicEnabled = true;

if (toggleMusicButton) {
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
  toggleMusicButton.textContent = assets.music.paused ? "Play Music" : "Pause Music";
}

// Player (Rocket Ship)
const player = {
  x: canvas.width / 4, // Slightly before the middle of the screen
  y: canvas.height / 2, // Centered vertically initially
  width: 80, // Adjust based on your rocket image size
  height: 80, // Adjust based on your rocket image size
  baseSpeed: 5, // Base speed for horizontal and vertical movement
  inputDx: 0, // Horizontal speed from user input (keys/joystick)
  inputDy: 0, // Vertical speed from user input (keys/joystick)
  boostEffectDx: 0, // Temporary horizontal speed added by boost
  boostStrength: 10, // How much EXTRA speed the boost gives to the right
  boostDuration: 200, // Milliseconds for boost effect
  isBoosting: false,
  boostTimer: null,
  currentFrame: 0,
  animationTimer: 0,
  animationSpeed: 8, // Speed of exhaust flickering
  update() {
    // Calculate effective horizontal speed: input speed + boost effect
    this.x += (this.inputDx + this.boostEffectDx);
    // Apply vertical speed from input
    this.y += this.inputDy;

    // Boundary checks for vertical movement
    if (this.y < 0) {
      this.y = 0;
    }
    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
    }

    // Animation for exhaust flame
    this.animationTimer++;
    if (this.animationTimer % this.animationSpeed === 0) {
      this.currentFrame = (this.currentFrame + 1) % 2;
    }

    // Camera follow player: keep player at 1/4 screen for a consistent feel
    let targetCameraX = this.x - canvas.width / 4;
    cameraX = Math.max(0, Math.min(targetCameraX, totalGameWidth - canvas.width));
  },
  draw() {
    let img;
    if (this.isBoosting) { // Display boost image if boosting
      img = assets.rocketBoost;
    } else { // Otherwise, normal animation
      img = this.currentFrame === 0 ? assets.rocket1 : assets.rocket2;
    }

    if (img && img.complete && img.naturalHeight !== 0) {
      ctx.drawImage(img, this.x - cameraX, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "blue"; // Fallback color
      ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
    }
  },
  boost() {
    if (gameState !== "playing" || this.isBoosting) return;

    this.isBoosting = true;
    this.boostEffectDx = this.boostStrength; // Apply horizontal boost effect

    if (this.boostTimer) clearTimeout(this.boostTimer);
    this.boostTimer = setTimeout(() => {
      this.isBoosting = false;
      this.boostEffectDx = 0; // Remove boost effect after duration
    }, this.boostDuration);
  },
  reset() {
    this.x = canvas.width / 4;
    this.y = canvas.height / 2;
    this.inputDx = 0;
    this.inputDy = 0;
    this.boostEffectDx = 0; // Reset boost effect
    this.isBoosting = false;
    if (this.boostTimer) clearTimeout(this.boostTimer);
    this.boostTimer = null;
    this.currentFrame = 0;
    cameraX = 0;
  }
};

const coinWidth = 32;
const coinHeight = 32;

// Generate coins randomly across the total game width
const coins = [];
const numberOfCoins = 300; // Adjust for more/less coins
for (let i = 0; i < numberOfCoins; i++) {
  const x = Math.random() * totalGameWidth;
  const y = Math.random() * (canvas.height - coinHeight); // Random vertical position
  coins.push({ x, y, width: coinWidth, height: coinHeight, collected: false });
}

// Scenery (simple scrolling background elements, no platforms/spikes)
const scenery = [
  // Example: simple stars/clouds. You can add more with your own assets.
  { x: 500, y: Math.random() * canvas.height, radius: 2, color: 'white' },
  { x: 1000, y: Math.random() * canvas.height, radius: 3, color: 'white' },
  { x: 1500, y: Math.random() * canvas.height, radius: 2, color: 'white' },
  { x: 2000, y: Math.random() * canvas.height, radius: 4, color: 'white' },
  { x: 2500, y: Math.random() * canvas.height, radius: 3, color: 'white' },
  // Add more as needed, or replace with image-based scenery
];

// Input handling (keyboard)
const keys = {}; // Add 'left', 'right' to keys object implicitly
window.addEventListener("keydown", e => {
  if (e.code === "Escape") {
    togglePause();
    e.preventDefault();
    return;
  }
  if (gameState !== "playing") return;

  if (e.code === "ArrowUp") {
    keys.up = true;
    player.inputDy = -player.baseSpeed; // Set inputDy for vertical movement
    e.preventDefault();
  }
  if (e.code === "ArrowDown") {
    keys.down = true;
    player.inputDy = player.baseSpeed; // Set inputDy for vertical movement
    e.preventDefault();
  }
  if (e.code === "ArrowLeft") { // New: Horizontal left movement
    keys.left = true;
    player.inputDx = -player.baseSpeed; // Set inputDx for horizontal movement
    e.preventDefault();
  }
  if (e.code === "ArrowRight") { // New: Horizontal right movement
    keys.right = true;
    player.inputDx = player.baseSpeed; // Set inputDx for horizontal movement
    e.preventDefault();
  }
  if (e.code === "Space") {
    player.boost();
    e.preventDefault();
  }
});

window.addEventListener("keyup", e => {
  if (e.code === "ArrowUp") {
    keys.up = false;
    if (!keys.down) player.inputDy = 0; // Stop vertical if no other vertical key pressed
  }
  if (e.code === "ArrowDown") {
    keys.down = false;
    if (!keys.up) player.inputDy = 0; // Stop vertical if no other vertical key pressed
  }
  if (e.code === "ArrowLeft") { // New: Horizontal left movement
    keys.left = false;
    if (!keys.right) player.inputDx = 0; // Stop horizontal if no other horizontal key pressed
  }
  if (e.code === "ArrowRight") { // New: Horizontal right movement
    keys.right = false;
    if (!keys.left) player.inputDx = 0; // Stop horizontal if no other horizontal key pressed
  }
});

// Touch controls (joystick for vertical and horizontal, boostBtn for boost)
const joystickArea = document.getElementById('joystickArea');
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');
const boostBtn = document.getElementById('boostBtn'); // Renamed from jumpBtn

let joystickActive = false;
let joystickStart = { x: 0, y: 0 };

joystickArea.addEventListener('touchstart', function(e) {
  joystickActive = true;
  const touch = e.touches[0];
  joystickStart = { x: touch.clientX, y: touch.clientY };
  moveKnob(0, 0);
  e.preventDefault();
}, { passive: false });

joystickArea.addEventListener('touchmove', function(e) {
  if (!joystickActive) return;
  const touch = e.touches[0];
  let dx = touch.clientX - joystickStart.x; // Horizontal movement
  let dy = touch.clientY - joystickStart.y; // Vertical movement
  const maxDist = 40;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxDist) {
    dx = dx * maxDist / dist;
    dy = dy * maxDist / dist;
  }
  moveKnob(dx, dy); // Move knob in both x and y

  // Set horizontal movement input
  if (dx < -10) {
    player.inputDx = -player.baseSpeed;
  } else if (dx > 10) {
    player.inputDx = player.baseSpeed;
  } else {
    player.inputDx = 0;
  }

  // Set vertical movement input
  if (dy < -10) {
    player.inputDy = -player.baseSpeed;
  } else if (dy > 10) {
    player.inputDy = player.baseSpeed;
  } else {
    player.inputDy = 0;
  }
  e.preventDefault();
}, { passive: false });

joystickArea.addEventListener('touchend', function(e) {
  joystickActive = false;
  moveKnob(0, 0);
  player.inputDx = 0; // Stop horizontal movement
  player.inputDy = 0; // Stop vertical movement
  e.preventDefault();
}, { passive: false });

function moveKnob(dx, dy) {
  joystickKnob.style.left = (25 + dx) + 'px';
  joystickKnob.style.top = (25 + dy) + 'px';
}

// Boost button
boostBtn.addEventListener('touchstart', function(e) {
  if (gameState === 'playing') player.boost();
  e.preventDefault();
});

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
    if (gameState !== "playing") {
      clearInterval(timerInterval);
      return;
    }
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

  // Draw Background with parallax for a flying effect
  if (assets.bg.complete && assets.bg.naturalWidth > 0) {
    const bgImage = assets.bg;
    const bgWidth = bgImage.naturalWidth;
    const canvasHeight = canvas.height;
    const parallaxFactor = 0.3; // Slower scrolling for background
    let startX = (-cameraX * parallaxFactor) % bgWidth;
    if (startX > 0) startX -= bgWidth;

    for (let x = startX; x < canvas.width; x += bgWidth) {
      ctx.drawImage(bgImage, x, 0, bgWidth, canvasHeight);
    }
  } else {
    ctx.fillStyle = "#1a1a2e"; // Dark space color fallback
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw simple scenery (stars/clouds)
  scenery.forEach(item => {
    // For simple shapes
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x - cameraX, item.y, item.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw coins
  coins.forEach(c => {
    if (!c.collected) {
      if (assets.coin.complete && assets.coin.naturalHeight !== 0) {
        ctx.drawImage(assets.coin, c.x - cameraX, c.y, c.width, c.height);
      } else {
        ctx.fillStyle = "gold";
        ctx.fillRect(c.x - cameraX, c.y, c.width, c.height);
      }

      // Collision detection with player
      if (
        player.x < c.x + c.width &&
        player.x + player.width > c.x &&
        player.y < c.y + c.height &&
        player.y + player.height > c.y
      ) {
        c.collected = true;
        score++;
        updateScoreDisplay();
      }
    }
  });

  player.update();
  player.draw();

  // Level completion check (optional, can be based on all coins collected or time)
  const allCoinsCollected = coins.every(c => c.collected);
  if (allCoinsCollected && gameState === "playing") {
    endLevel("All Coins Collected!");
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  console.log("endGame called. Current score:", score);
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
    assets.music.currentTime = 0;
  }
}

let animationFrameId; // Declare animationFrameId for proper cancellation

function endLevel(message = "Level Ended") {
  if (gameState === "ended") return;
  console.log("endLevel called with message:", message);
  gameState = "ended";
  endGame(); // Stop game processes

  // Display end message and prompt restart/main menu
  const restart = window.confirm(`${message}\nYour Score: ${score}\n\nRestart level? (Cancel for Main Menu)`);
  if (restart) {
    location.reload(); // Reloads the current level
  } else {
    window.location.href = "../index.html"; // Go back to the main menu
  }
}

function initGame() {
  console.log("initGame: Initializing game state for Level 3...");
  score = 0;
  updateScoreDisplay();
  timer = 120; // Reset timer for new game
  gameState = "playing";

  const nextLevelBtn = document.getElementById("nextLevelBtn");
  if (nextLevelBtn) nextLevelBtn.style.display = "none";
  pauseMenu.style.display = "none";
  // The resume button was hidden by default, set it to block for consistency after pause
  if (document.getElementById("resumeButton")) document.getElementById("resumeButton").style.display = "block";

  // Reset coins
  coins.forEach(c => c.collected = false);
  player.reset(); // This will handle player state reset

  if (assets.music) {
    assets.music.currentTime = 0;
    if (musicEnabled) {
      let playPromise = assets.music.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.warn("Music autoplay for Level 3 was prevented:", error));
      }
    }
  }
  startTimer();
  animationFrameId = requestAnimationFrame(gameLoop);
  console.log("initGame: Level 3 started.");
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
    if (assetName === assets.bg.src || assetName === assets.rocket1.src) {
      console.error("CRITICAL: Core game asset failed to load. Gameplay experience will be affected.");
    }
  }

  if (assetsLoaded === totalAssets) {
    console.log(`All ${totalAssets} Level 3 assets accounted for (loaded or failed). Initializing game.`);
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
    console.warn(`Timeout waiting for assets. ${assetsLoaded}/${totalAssets} loaded. Forcing game start attempt if not already started.`);
    if (assetsLoaded < totalAssets) {
      console.warn("Not all assets reported loaded/failed. Game might be missing resources.`);
    }
    if (gameState === "loading") {
      initGame();
    }
  }
}, 5000);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.x = Math.min(player.x, canvas.width - player.width);
  player.y = Math.min(player.y, canvas.height - player.height);
  cameraX = Math.min(cameraX, totalGameWidth - canvas.width);
  console.log("Canvas resized. Player and camera positions adjusted.");
});

console.log("End of Level 3 script. Asset loading initiated.");