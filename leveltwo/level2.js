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
  music: new Audio() // Initialize Audio object
};

// Set sources for assets - ENSURE THESE FILES ARE IN THE 'leveltwo' FOLDER or update paths
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

assets.music.src = "Fast Desert Theme.wav"; // Set music source
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
let gameState = "playing"; // Should be set by startGame
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
        this.y + this.height > p.y && this.y + this.height < p.y + p.height && // Check bottom of player against top of platform
        this.dy >= 0 // Player is falling or on the platform
      ) {
        this.y = p.y - this.height; // Correct player position
        this.dy = 0;
        this.onGround = true;
        this.isJumping = false; // Landed
      }
    });

    // Ground collision (main ground)
    if (this.y + this.height > canvas.height - 40) { // Assuming 40 is the main ground height
      this.y = canvas.height - 40 - this.height;
      this.dy = 0;
      this.onGround = true;
      this.isJumping = false; // Landed
    }


    // Prevent falling through top boundary (if any) - usually not needed for platformers like this
    // if (this.y < 0) {
    //    this.y = 0;
    //    this.dy = 0;
    // }


    // Screen wrapping (optional, but you have it)
    // if (this.x + this.width < 0) {
    //   this.x = canvas.width;
    // } else if (this.x > canvas.width) {
    //   this.x = -this.width;
    // }
    // For a horizontal scroller, you might want to limit player to screen start
     if (this.x < 0) { // Prevent moving too far left off-screen (relative to camera)
       this.x = 0;
     }


    cameraX = Math.max(0, this.x - canvas.width / 3); // Adjust camera logic slightly, e.g. player at 1/3 of screen
  },
  draw() {
    let img;
    if (this.isJumping || !this.onGround) { // Simplified jumping animation check
      img = this.direction === "left" ? assets.playerJumpLeft : assets.playerJumpRight;
    } else if (this.dx !== 0) { // Moving
      img = this.direction === "left" ? assets.playerLeft[this.currentFrame] : assets.playerRight[this.currentFrame];
    } else { // Idle
      img = this.direction === "left" ? assets.playerLeft[0] : assets.playerRight[0];
    }

    if (img && img.complete && img.naturalHeight !== 0) {
      ctx.drawImage(img, this.x - cameraX, this.y, this.width, this.height);
    } else {
      // Fallback drawing if image isn't ready
      ctx.fillStyle = "green";
      ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
    }
  },
  jump() {
    if (this.onGround && gameState === "playing") { // Check gameState here too
      this.dy = this.jumpPower;
      this.isJumping = true;
      this.onGround = false; // Player is no longer on ground once jump starts
    }
  },
  reset() {
    this.x = 100;
    this.y = canvas.height - 160; // Initial position
    this.dx = 0;
    this.dy = 0;
    this.onGround = false; // Will be set true by collision detection if starting on a platform
    this.isJumping = false;
    this.direction = "right";
    this.currentFrame = 0;
    cameraX = 0;
  }
};

// Platforms, coins, spikes (same as before, ensure coordinates make sense for level design)
const platforms = [
  // Main ground platform (example, adjust or use your array)
  { x: 0, y: canvas.height - 40, width: 2000, height: 40, type: 'ground' }, // Added type for clarity

  // Floating platforms
  { x: 300, y: canvas.height - 180, width: 120, height: 20 },
  { x: 500, y: canvas.height - 250, width: 120, height: 20 },
  { x: 700, y: canvas.height - 180, width: 120, height: 20 },
  { x: 1000, y: canvas.height - 220, width: 120, height: 20 },
  { x: 1400, y: canvas.height - 180, width: 120, height: 20 }
  // Add more platforms as needed for your level design
];

const coins = [
  { x: 350, y: canvas.height - 230 - 32, collected: false, width: 32, height: 32 }, // Placed above platform
  { x: 550, y: canvas.height - 300 - 32, collected: false, width: 32, height: 32 }, // Placed above platform
  { x: 1050, y: canvas.height - 260 - 32, collected: false, width: 32, height: 32 },// Placed above platform
  { x: 1450, y: canvas.height - 230 - 32, collected: false, width: 32, height: 32 } // Placed above platform
];

const spikes = [
  { x: 850, y: canvas.height - 40 - 20, width: 40, height: 20 }, // On the main ground
  { x: 1300, y: canvas.height - 40 - 20, width: 40, height: 20 } // On the main ground
];

// Input
const keys = {};
window.addEventListener("keydown", e => {
  if (e.code === "Escape") {
      togglePause();
      e.preventDefault(); // Prevent default browser action for Escape
      return;
  }
  if (gameState !== "playing") return;

  if (e.code === "ArrowLeft") { keys.left = true; e.preventDefault(); }
  if (e.code === "ArrowRight") { keys.right = true; e.preventDefault(); }
  if (e.code === "Space") {
      player.jump();
      e.preventDefault(); // Prevent page scroll on Space
  }
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
    if (timerInterval) clearInterval(timerInterval); // Also pause timer interval
  } else if (gameState === "paused") {
    gameState = "playing";
    pauseMenu.style.display = "none";
    if (assets.music) { // Resume music if it was playing
        let playPromise = assets.music.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.warn("Music resume failed:", error));
        }
    }
    startTimer(timer); // Resume timer from where it left off
    requestAnimationFrame(gameLoop); // resume loop
  }
}

resumeButton.onclick = togglePause;
retryButton.onclick = () => location.reload(); // Simple retry
mainMenuButton.onclick = () => window.location.href = "../index.html"; // Navigate to main menu

// Timer
function startTimer(currentTime = 120) { // Allow resuming timer
  timer = currentTime;
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval); // Clear any existing interval
  timerInterval = setInterval(() => {
    if (gameState !== "playing") { // Only decrement if game is actively playing
        clearInterval(timerInterval); // Stop interval if not playing
        return;
    }
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      endLevel(false); // Pass false, indicating time ran out
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  document.getElementById("timerDisplay").textContent = `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}
// Update score display function
function updateScoreDisplay() {
    document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
}


// Game loop
function gameLoop() {
  if (gameState !== "playing") return; // Stop loop if not playing

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background (parallax effect can be added later if desired)
  if (assets.bg.complete && assets.bg.naturalHeight !== 0) {
      const bgWidth = assets.bg.width;
      const bgHeight = assets.bg.height;
      // Simple scrolling background; adjust for desired effect
      let bgX = (-cameraX * 0.5) % bgWidth; // Slower scroll for parallax
      if (bgX > 0) bgX -= bgWidth; // Ensure seamless loop from left

      ctx.drawImage(assets.bg, bgX, 0, bgWidth, canvas.height); // Stretch/tile as needed
      ctx.drawImage(assets.bg, bgX + bgWidth, 0, bgWidth, canvas.height); // Draw second image for seamless tiling
  } else {
      ctx.fillStyle = "#222"; // Fallback background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }


  // Draw scenery elements (bushes, etc.)
  if (assets.bushBig.complete) ctx.drawImage(assets.bushBig, 600 - cameraX, canvas.height - 40 - assets.bushBig.height); // Position on ground
  if (assets.bushSmall.complete) ctx.drawImage(assets.bushSmall, 1200 - cameraX, canvas.height - 40 - assets.bushSmall.height); // Position on ground


  platforms.forEach(p => {
    if(assets.platform.complete && assets.platform.naturalHeight !== 0) {
        ctx.drawImage(assets.platform, p.x - cameraX, p.y, p.width, p.height);
    } else {
        ctx.fillStyle = "grey"; // Fallback
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }
  });

  spikes.forEach(s => {
    if(assets.spikes.complete && assets.spikes.naturalHeight !== 0) {
        ctx.drawImage(assets.spikes, s.x - cameraX, s.y, s.width, s.height);
    } else {
        ctx.fillStyle = "red"; // Fallback
        ctx.fillRect(s.x - cameraX, s.y, s.width, s.height);
    }

    // Collision with spikes
    if (
      player.x < s.x - cameraX + s.width &&
      player.x + player.width > s.x - cameraX &&
      player.y < s.y + s.height &&
      player.y + player.height > s.y
    ) {
      player.reset(); // Reset player on spike collision
      // Potentially deduct score or lives here
      score = 0; // Reset score as an example
      updateScoreDisplay();
    }
  });

  coins.forEach(c => {
    if (!c.collected) {
        if(assets.coin.complete && assets.coin.naturalHeight !== 0) {
            ctx.drawImage(assets.coin, c.x - cameraX, c.y, c.width, c.height);
        } else {
            ctx.fillStyle = "gold"; // Fallback
            ctx.fillRect(c.x - cameraX, c.y, c.width, c.height);
        }

      // Collision with coins
      if (
        player.x < c.x - cameraX + c.width &&
        player.x + player.width > c.x - cameraX &&
        player.y < c.y + c.height &&
        player.y + player.height > c.y
      ) {
        c.collected = true;
        score++;
        updateScoreDisplay();
      }
    }
  });

  player.dx = 0;
  if (keys.left) player.dx = -player.speed;
  if (keys.right) player.dx = player.speed;

  player.update(); // Update player physics and position
  player.draw();   // Draw player

  // Check for level completion (all coins collected)
  if (coins.every(c => c.collected)) {
    endLevel(true); // Pass true, indicating successful completion
    return; // Stop the game loop once level is ended
  }

  requestAnimationFrame(gameLoop); // Continue the loop
}


function endLevel(completedSuccessfully) {
  if (gameState === "ended") return; // Prevent multiple calls

  gameState = "ended";
  clearInterval(timerInterval); // Stop the timer
  if (assets.music) assets.music.pause();

  const nextLevelButton = document.getElementById("nextLevelBtn");
  if (completedSuccessfully) {
    nextLevelButton.textContent = "Level Cleared! Next?"; // Or some congratulatory message
  } else {
    nextLevelButton.textContent = "Time's Up! Retry?"; // Or game over message
  }
  nextLevelButton.style.display = "block";

  // Handle what happens when the "Next Level" or "Retry" button is clicked
  nextLevelButton.onclick = () => {
    if (completedSuccessfully) {
      // For now, just go back to the main menu as there's no Level 3 defined
      alert("Congratulations! You finished Level 2!");
      window.location.href = "../index.html";
    } else {
      // If time ran out, reload to retry Level 2
      location.reload();
    }
  };
}


function startGame() {
  score = 0;
  updateScoreDisplay();
  gameState = "playing";
  document.getElementById("nextLevelBtn").style.display = "none";

  // Reset coins
  coins.forEach(c => c.collected = false);

  player.reset(); // Reset player state and position

  if (assets.music) {
    assets.music.currentTime = 0; // Ensure music starts from the beginning
    let playPromise = assets.music.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Music autoplay for Level 2 was prevented:", error);
        // Optionally, provide a UI element for the user to manually start music
      });
    }
  }

  startTimer(); // Start or restart the level timer
  requestAnimationFrame(gameLoop); // Start the game loop
}

// Ensure DOM is fully loaded before starting the game
window.onload = startGame;