// level4_camera_scroll.js - Extended from original code with camera scrolling and corrected image sources

window.onload = function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const bgMusic = document.getElementById("bgMusic");
  if (bgMusic) {
    bgMusic.volume = 0.3;
    // Add an event listener to play music on the first user interaction.
    // This bypasses browser autoplay restrictions.
    document.body.addEventListener("click", function oncePlayMusic() {
      bgMusic.play().catch(e => console.error("Music autoplay failed:", e));
      document.body.removeEventListener("click", oncePlayMusic); // Remove listener after first play
    }, { once: true }); // Ensure the listener is only triggered once
  }

  const TILE_SIZE = 64;
  // Make each row 40 columns wide for a much longer level
  const tileMap = [
    // Top row (empty)
    Array(60).fill(0),
    // Floating platforms
    [1,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // More platforms
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Lava row
    [1,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Ground row
    Array(60).fill(1),
  ];

  const assets = {
    playerWalkRight: [],
    playerWalkLeft: [],
    playerShootRight: new Image(),
    playerShootLeft: new Image(),

    enemyWalkRight: [],
    enemyWalkLeft: [],
    enemyAttackRight: new Image(),
    enemyAttackLeft: new Image(),

    bulletImg: new Image(),

    explosionFrames: [],
    gunshotEffectFrames: [],
    playerHitEffect: new Image(),

    ground1Tile: new Image(),
    ground2Tile: new Image(),
    floatingGroundTile: new Image(), // Fix: Added for floating platforms
    hotLavaTile: new Image(), // Fix: Added for hot lava

    background1: new Image(), // Fix: background1.png
    background2: new Image()  // Fix: background2.png
  };

  // Define all assets to be loaded with their correct paths and target properties
  const assetsToLoad = [
    // Player Assets (all .png as per file explorer)
    { name: 'playerWalkRight0', src: "characterstep.png", targetArray: assets.playerWalkRight, index: 0 },
    { name: 'playerWalkRight1', src: "characterstep1.png", targetArray: assets.playerWalkRight, index: 1 },
    { name: 'playerWalkLeft0', src: "characterstepleft.png", targetArray: assets.playerWalkLeft, index: 0 },
    { name: 'playerWalkLeft1', src: "characterstepleft1.png", targetArray: assets.playerWalkLeft, index: 1 },
    { name: 'playerShootRight', src: "charactershoot.png", targetObject: assets, targetProperty: 'playerShootRight' },
    { name: 'playerShootLeft', src: "charactershootleft.png", targetObject: assets, targetProperty: 'playerShootLeft' },

    // Enemy Walk Assets (all .png as per file explorer)
    { name: 'enemyWalkRight0', src: "enemywalkright.png", targetArray: assets.enemyWalkRight, index: 0 },
    { name: 'enemyWalkRight1', src: "enemywalkright1.png", targetArray: assets.enemyWalkRight, index: 1 },
    { name: 'enemyWalkLeft0', src: "enemywalkleft.png", targetArray: assets.enemyWalkLeft, index: 0 },
    { name: 'enemyWalkLeft1', src: "enemywalkleft1.png", targetArray: assets.enemyWalkLeft, index: 1 },

    // Enemy Attack Assets (all .png as per file explorer)
    { name: 'enemyAttackRight', src: "enemyattackright.png", targetObject: assets, targetProperty: 'enemyAttackRight' },
    { name: 'enemyAttackLeft', src: "enemyattackleft.png", targetObject: assets, targetProperty: 'enemyAttackLeft' },

    // Other Assets (all .png as per file explorer)
    { name: 'bulletImg', src: "bullet.png", targetObject: assets, targetProperty: 'bulletImg' },
    { name: 'explosionFrame0', src: "bullethitenemy.png", targetArray: assets.explosionFrames, index: 0 },
    { name: 'explosionFrame1', src: "bullethitenemy1.png", targetArray: assets.explosionFrames, index: 1 },
    { name: 'explosionFrame2', src: "bullethitenemy2.png", targetArray: assets.explosionFrames, index: 2 },

    // Gunshot Animation Frames (all .png)
    { name: 'gunshotFrame0', src: "gunshotanimation.png", targetArray: assets.gunshotEffectFrames, index: 0 },
    { name: 'gunshotFrame1', src: "gunshotanimation1.png", targetArray: assets.gunshotEffectFrames, index: 1 },
    { name: 'gunshotFrame2', src: "gunshotanimation2.png", targetArray: assets.gunshotEffectFrames, index: 2 },
    { name: 'gunshotFrame3', src: "gunshotanimation3.png", targetArray: assets.gunshotEffectFrames, index: 3 },

    // Player Hit Effect (single .png image)
    { name: 'playerHitEffect', src: "enemyhitsplayer.png", targetObject: assets, targetProperty: 'playerHitEffect' },

    // Individual Ground/Tile Assets (all .png)
    { name: 'ground1Tile', src: "ground1tile.png", targetObject: assets, targetProperty: 'ground1Tile' },
    { name: 'ground2Tile', src: "ground2tile.png", targetObject: assets, targetProperty: 'ground2Tile' },
    { name: 'floatingGroundTile', src: "floatinggroundtile.png", targetObject: assets, targetProperty: 'floatingGroundTile' }, // Fix: Added for floating platforms
    { name: 'hotLavaTile', src: "hotlavatile.png", targetObject: assets, targetProperty: 'hotLavaTile' }, // Fix: Added for hot lava

    // Background images (both .png)
    { name: 'background1', src: "background1.png", targetObject: assets, targetProperty: 'background1' },
    { name: 'background2', src: "background2.png", targetObject: assets, targetProperty: 'background2' }
  ];

  let assetsLoadedCount = 0;
  const totalAssets = assetsToLoad.length;

  // Function to check if all assets are loaded and start the game
  function assetLoaded() {
    assetsLoadedCount++;
    if (assetsLoadedCount === totalAssets) {
      console.log("All Level 4 assets loaded. Starting game loop.");
      gameLoop(); // Start the game loop only after all assets are loaded
    }
  }

  // Load each asset and assign it to the correct place in the 'assets' object
  assetsToLoad.forEach(assetConfig => {
    const img = new Image();
    img.onload = assetLoaded;
    img.onerror = () => {
      console.error(`Failed to load asset: ${assetConfig.src}`);
      assetLoaded(); // Still call assetLoaded to allow game to start even if one asset fails
    };
    img.src = assetConfig.src;

    if (assetConfig.targetArray) {
      assetConfig.targetArray[assetConfig.index] = img;
    } else if (assetConfig.targetObject) {
      assetConfig.targetObject[assetConfig.targetProperty] = img;
    }
  });


  const player = {
    x: 100, y: 400,
    width: 64, height: 64,
    speed: 4,
    frame: 0, frameTick: 0, // Current animation frame index for walking
    bullets: [], health: 100,
    direction: 'right', // Added 'direction' property
    isShooting: false,  // Added 'isShooting' property
    shootTimer: null,   // To manage shooting animation duration
    shoot() {
      // Only allow shooting if not already in shooting animation state
      if (!this.isShooting) {
        this.isShooting = true;
        const bulletX = this.x + (this.direction === 'right' ? 50 : 0);
        const bulletDX = (this.direction === 'right' ? 10 : -10);
        this.bullets.push({ x: bulletX, y: this.y + 20, width: 16, height: 8, dx: bulletDX });

        // Add gunshot effect when shooting
        activeGunshotEffects.push({
          x: this.x + (this.direction === 'right' ? this.width : -30), // Adjust position for effect
          y: this.y + 20,
          frame: 0,
          frameTick: 0,
          direction: this.direction // Store direction for potential mirroring
        });

        // Clear previous shoot timer if any and set a new one
        if (this.shootTimer) clearTimeout(this.shootTimer);
        this.shootTimer = setTimeout(() => {
          this.isShooting = false;
        }, 200); // Duration for shooting animation/pose
      }
    }
  };

  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup", e => delete keys[e.key]);

  // Added direction and isAttacking properties to enemies
  let enemies = [
    { x: 800, y: 400, width: 64, height: 64, frame: 0, frameTick: 0, health: 5, alive: true, direction: 'left', isAttacking: false, attackTimer: null },
    { x: 1300, y: 400, width: 64, height: 64, frame: 0, frameTick: 0, health: 5, alive: true, direction: 'left', isAttacking: false, attackTimer: null }
  ];

  let explosions = [];
  let activeGunshotEffects = [];
  let activePlayerHitEffects = [];

  // Fix: Global variables for background flashing
  let backgroundFlashTimer = 0;
  const backgroundFlashInterval = 10; // How many frames each background stays (adjust for speed)
  let currentBackgroundIndex = 0; // 0 for background1, 1 for background2

  const camera = { x: 0 };
  const worldWidth = tileMap[0].length * TILE_SIZE;

  // Fix: Redefined drawTileLayer to map tileIndex values to specific asset images.
  function drawTileLayer(ctx, map, tileSize, offsetX) {
    // Define a mapping from tileMap index to the actual asset image
    const tileImageMap = {
      0: null, // 0 means empty space, draw nothing
      1: assets.ground1Tile,
      2: assets.ground2Tile,
      3: assets.floatingGroundTile, // Added for floating platforms
      4: assets.hotLavaTile,      // Added for hot lava
    };

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tileIndex = map[row][col];
        const tileImage = tileImageMap[tileIndex];

        if (tileImage && tileImage.complete) {
          ctx.drawImage(
            tileImage,
            col * tileSize - offsetX, row * tileSize, // Direct coordinates, no need for sx, sy
            tileSize, tileSize
          );
        }
      }
    }
  }

  function createExplosion(x, y) {
    explosions.push({ x, y, frame: 0, maxFrames: 3, tick: 0 });
  }

  function drawExplosions() {
    explosions.forEach((e, i) => {
      // Use the current frame from the explosionFrames array
      const currentExplosionFrame = assets.explosionFrames[e.frame];
      if (currentExplosionFrame && currentExplosionFrame.complete) {
        // Assume explosion frames are 64x64 like the character, adjust if different sizes
        ctx.drawImage(currentExplosionFrame, e.x - camera.x, e.y, 64, 64);
      }
      if (++e.tick % 5 === 0) e.frame++; // Animation speed
      if (e.frame >= assets.explosionFrames.length) explosions.splice(i, 1); // Remove after last frame
    });
  }

  function drawPlayer() {
    // Select image based on player's shooting state and direction.
    let currentImage;
    if (player.isShooting) {
      currentImage = player.direction === 'right' ? assets.playerShootRight : assets.playerShootLeft;
    } else {
      currentImage = player.direction === 'right' ? assets.playerWalkRight[player.frame] : assets.playerWalkLeft[player.frame];
    }

    // Ensure the selected image is loaded before attempting to draw.
    if (currentImage && currentImage.complete) {
      ctx.drawImage(currentImage, player.x - camera.x, player.y, player.width, player.height);
    } else {
      // Fallback if image not loaded or during loading phase
      ctx.fillStyle = "green";
      ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);
    }

    // Animation for walking (only if not shooting and moving).
    if (!player.isShooting && (keys["ArrowRight"] || keys["ArrowLeft"])) {
      if (++player.frameTick % 10 === 0) { // Animation speed
        player.frame = (player.frame + 1) % (player.direction === 'right' ? assets.playerWalkRight.length : assets.playerWalkLeft.length);
      }
    } else if (!player.isShooting && !(keys["ArrowRight"] || keys["ArrowLeft"])) {
      // If not moving and not shooting, reset to first frame (idle pose)
      player.frame = 0;
      player.frameTick = 0;
    }
  }

  function drawBullets() {
    player.bullets.forEach(b => {
      // Ensure bulletImg is defined and loaded before drawing
      if (assets.bulletImg && assets.bulletImg.complete) {
        ctx.drawImage(assets.bulletImg, b.x - camera.x, b.y, b.width, b.height);
      } else {
        ctx.fillStyle = "yellow"; // Fallback for bullet
        ctx.fillRect(b.x - camera.x, b.y, b.width, b.height);
      }
    });
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.alive) {
        let currentEnemyImage;
        // Select enemy image based on its attack state and direction
        if (e.isAttacking) {
          currentEnemyImage = e.direction === 'right' ? assets.enemyAttackRight : assets.enemyAttackLeft;
        } else {
          currentEnemyImage = e.direction === 'right' ? assets.enemyWalkRight[e.frame] : assets.enemyWalkLeft[e.frame];
        }

        if (currentEnemyImage && currentEnemyImage.complete) {
            ctx.drawImage(currentEnemyImage, e.x - camera.x, e.y, e.width, e.height);
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = "purple";
            ctx.fillRect(e.x - camera.x, e.y, e.width, e.height);
        }

        // Cycle between 2 frames for enemy walking animation (only if not attacking)
        if (!e.isAttacking) {
            if (++e.frameTick % 15 === 0) e.frame = (e.frame + 1) % (e.direction === 'right' ? assets.enemyWalkRight.length : assets.enemyWalkLeft.length);
        } else {
            e.frame = 0; // Reset frame to first idle/walk frame if attacking
            e.frameTick = 0;
        }

        ctx.fillStyle = "red";
        ctx.fillRect(e.x - camera.x, e.y - 10, 60, 5);
        ctx.fillStyle = "lime";
        ctx.fillRect(e.x - camera.x, e.y - 10, (e.health / 5) * 60, 5);
      }
    });
  }

  // New function to draw gunshot effects
  function drawGunshotEffects() {
    activeGunshotEffects.forEach((effect, i) => {
      const currentGunshotFrame = assets.gunshotEffectFrames[effect.frame];
      if (currentGunshotFrame && currentGunshotFrame.complete) {
          // Adjust position based on frame width and direction for mirroring
          let drawX = effect.x - camera.x;
          if (effect.direction === 'left') {
              drawX = effect.x - camera.x - (currentGunshotFrame.naturalWidth || 64);
          }
          ctx.drawImage(currentGunshotFrame, drawX, effect.y, 64, 64);
      }

      effect.frameTick++;
      if (effect.frameTick % 3 === 0) { // Adjust speed of muzzle flash animation
          effect.frame++;
      }
      if (effect.frame >= assets.gunshotEffectFrames.length) {
          activeGunshotEffects.splice(i, 1); // Remove after last frame
      }
    });
  }

  // New function to draw player hit effects
  function drawPlayerHitEffects() {
    activePlayerHitEffects.forEach((effect, i) => {
      if (assets.playerHitEffect && assets.playerHitEffect.complete) {
        ctx.drawImage(assets.playerHitEffect, effect.x - camera.x, effect.y, 64, 64);
      }
      effect.frameTick++;
      if (effect.frameTick >= effect.duration) {
        activePlayerHitEffects.splice(i, 1); // Remove effect after its duration
      }
    });
  }

  function drawUI() {
    ctx.fillStyle = "black";
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = "lime";
    ctx.fillRect(20, 20, player.health * 2, 20);
    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 200, 20);
    if (player.health <= 0) {
      ctx.fillStyle = "red";
      ctx.font = "48px Arial";
      ctx.fillText("GAME OVER", canvas.width / 2 - 130, canvas.height / 2);
    }
  }

  function update() {
    if (player.health <= 0) return;

    // Handle player direction based on input
    player.dx = 0; // Reset horizontal movement for animation logic
    if (keys["ArrowRight"]) {
        player.x += player.speed;
        player.direction = 'right';
    }
    if (keys["ArrowLeft"]) {
        player.x -= player.speed;
        player.direction = 'left';
    }

    // Trigger shoot only on key press, not continuous holding
    if (keys[" "] || keys["z"]) {
        player.shoot();
        delete keys[" "]; // Consume the space key press
        delete keys["z"]; // Consume the z key press
    }

    player.bullets.forEach(b => b.x += b.dx); // Use bullet's own dx
    player.bullets = player.bullets.filter(b => b.x < worldWidth && b.x > -TILE_SIZE); // Filter out-of-bounds bullets

    enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Update enemy direction based on movement towards player
      if (dx > 0) {
          enemy.direction = 'right';
      } else if (dx < 0) {
          enemy.direction = 'left';
      }

      if (dist > 1) { // If enemy is far, it walks
          enemy.x += (dx / dist) * 1.5;
          enemy.y += (dy / dist) * 1.5;
          enemy.isAttacking = false; // Not attacking while moving
      } else { // If enemy is close, it attacks
          enemy.isAttacking = true;
          // For simplicity, isAttacking is true when close. You might add a separate attack cooldown/timer.
      }

      if (player.x < enemy.x + enemy.width && player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) {
        if (player.health > 0) { // Only add effect if player is still alive
            player.health -= 0.5; // Player takes damage on collision
            // Add player hit effect when damaged
            activePlayerHitEffects.push({
                x: player.x + player.width / 2 - 32, // Centered on player (assuming 64x64 effect image)
                y: player.y + player.height / 2 - 32,
                frame: 0,
                frameTick: 0,
                duration: 30 // How many ticks the effect lasts
            });
        }
      }
      player.bullets.forEach((bullet, i) => {
        if (bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
          enemy.health--;
          player.bullets.splice(i, 1);
          if (enemy.health <= 0) {
            enemy.alive = false;
            createExplosion(enemy.x, enemy.y);
          }
        }
      });
    });
    player.health = Math.min(Math.max(player.health, 0), 100);

    camera.x = Math.max(0, player.x - canvas.width / 2);
    camera.x = Math.min(camera.x, worldWidth - canvas.width);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw flashing background images
    const backgrounds = [assets.background1, assets.background2];
    backgroundFlashTimer++;
    if (backgroundFlashTimer >= backgroundFlashInterval) {
        currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
        backgroundFlashTimer = 0;
    }
    const currentBackground = backgrounds[currentBackgroundIndex];

    if (currentBackground && currentBackground.complete) {
        const bgImage = currentBackground;
        const bgWidth = bgImage.naturalWidth;
        const canvasHeight = canvas.height;
        const parallaxFactor = 0.2; // Adjust for desired parallax speed

        let startX = (-camera.x * parallaxFactor) % bgWidth;
        if (startX > 0) startX -= bgWidth;

        for (let x = startX; x < canvas.width; x += bgWidth) {
          ctx.drawImage(bgImage, x, 0, bgWidth, canvasHeight); // Draw background stretched to canvas height
        }
    } else {
        ctx.fillStyle = "#222"; // Fallback color if background not loaded
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw ground tiles over the background image
    drawTileLayer(ctx, tileMap, TILE_SIZE, camera.x);

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawExplosions();
    // Draw new effects
    drawGunshotEffects();
    drawPlayerHitEffects();

    drawUI();
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
};