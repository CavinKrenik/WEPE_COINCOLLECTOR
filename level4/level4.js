// level4_camera_scroll.js - Extended from original code with camera scrolling and corrected image sources

window.onload = function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const bgMusic = document.getElementById("bgMusic");
  if (bgMusic) {
    function oncePlayMusic() {
      bgMusic.play().catch(e => console.error("Music autoplay failed:", e));
      document.body.removeEventListener("pointerdown", oncePlayMusic);
      document.body.removeEventListener("touchstart", oncePlayMusic);
    }
    document.body.addEventListener("pointerdown", oncePlayMusic, { once: true });
    document.body.addEventListener("touchstart", oncePlayMusic, { once: true });
  }

  const TILE_SIZE = 64;
  const tileMap = [
    Array(60).fill(0),
    [1,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
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
    floatingGroundTile: new Image(),
    hotLavaTile: new Image(),
    background1: new Image(),
    background2: new Image()
  };

  const assetsToLoad = [
    { name: 'playerWalkRight0', src: "characterstep.png", targetArray: assets.playerWalkRight, index: 0 },
    { name: 'playerWalkRight1', src: "characterstep1.png", targetArray: assets.playerWalkRight, index: 1 },
    { name: 'playerWalkLeft0', src: "characterstepleft.png", targetArray: assets.playerWalkLeft, index: 0 },
    { name: 'playerWalkLeft1', src: "characterstepleft1.png", targetArray: assets.playerWalkLeft, index: 1 },
    { name: 'playerShootRight', src: "charactershoot.png", targetObject: assets, targetProperty: 'playerShootRight' },
    { name: 'playerShootLeft', src: "charactershootleft.png", targetObject: assets, targetProperty: 'playerShootLeft' },
    { name: 'enemyWalkRight0', src: "enemywalkright.png", targetArray: assets.enemyWalkRight, index: 0 },
    { name: 'enemyWalkRight1', src: "enemywalkright1.png", targetArray: assets.enemyWalkRight, index: 1 },
    { name: 'enemyWalkLeft0', src: "enemywalkleft.png", targetArray: assets.enemyWalkLeft, index: 0 },
    { name: 'enemyWalkLeft1', src: "enemywalkleft1.png", targetArray: assets.enemyWalkLeft, index: 1 },
    { name: 'enemyAttackRight', src: "enemyattackright.png", targetObject: assets, targetProperty: 'enemyAttackRight' },
    { name: 'enemyAttackLeft', src: "enemyattackleft.png", targetObject: assets, targetProperty: 'enemyAttackLeft' },
    { name: 'bulletImg', src: "bullet.png", targetObject: assets, targetProperty: 'bulletImg' },
    { name: 'explosionFrame0', src: "bullethitenemy.png", targetArray: assets.explosionFrames, index: 0 },
    { name: 'explosionFrame1', src: "bullethitenemy1.png", targetArray: assets.explosionFrames, index: 1 },
    // Removed: { name: 'explosionFrame2', src: "bullethitenemy2.png", targetArray: assets.explosionFrames, index: 2 },
    { name: 'gunshotFrame0', src: "gunshotanimation.png", targetArray: assets.gunshotEffectFrames, index: 0 },
    { name: 'gunshotFrame1', src: "gunshotanimation1.png", targetArray: assets.gunshotEffectFrames, index: 1 },
    { name: 'gunshotFrame2', src: "gunshotanimation2.png", targetArray: assets.gunshotEffectFrames, index: 2 },
    { name: 'gunshotFrame3', src: "gunshotanimation3.png", targetArray: assets.gunshotEffectFrames, index: 3 },
    { name: 'playerHitEffect', src: "enemyhitsplayer.png", targetObject: assets, targetProperty: 'playerHitEffect' },
    { name: 'ground1Tile', src: "ground1tile.png", targetObject: assets, targetProperty: 'ground1Tile' },
    { name: 'ground2Tile', src: "ground2tile.png", targetObject: assets, targetProperty: 'ground2Tile' },
    { name: 'floatingGroundTile', src: "floatinggroundtile.png", targetObject: assets, targetProperty: 'floatingGroundTile' },
    { name: 'hotLavaTile', src: "hotlavatile.png", targetObject: assets, targetProperty: 'hotLavaTile' },
    { name: 'background1', src: "background1.png", targetObject: assets, targetProperty: 'background1' },
    { name: 'background2', src: "background2.png", targetObject: assets, targetProperty: 'background2' }
  ];

  let assetsLoadedCount = 0;
  const totalAssets = assetsToLoad.length;

  function assetLoaded() {
    assetsLoadedCount++;
    if (assetsLoadedCount === totalAssets) {
      console.log("All Level 4 assets loaded. Starting game loop.");
      startGame();
    }
  }

  assetsToLoad.forEach(assetConfig => {
    const img = new Image();
    img.onload = assetLoaded;
    img.onerror = () => {
      console.error(`Failed to load asset: ${assetConfig.src}`);
      assetLoaded();
    };
    img.src = assetConfig.src;
    if (assetConfig.targetArray) {
      assetConfig.targetArray[assetConfig.index] = img;
    } else if (assetConfig.targetObject) {
      assetConfig.targetObject[assetConfig.targetProperty] = img;
    }
  });

  // --- Game State ---
  let paused = false;
  const pauseMenu = document.getElementById("pauseMenu");
  const resumeButton = document.getElementById("resumeButton");
  const retryButton = document.getElementById("retryButton");
  const mainMenuButton = document.getElementById("mainMenuButton");
  const toggleMusicButton = document.getElementById("toggleMusicButton");

  const player = {
    x: 100, y: 0, // Initial Y will be set in startGame based on ground
    width: 64, height: 64,
    speed: 4,
    frame: 0, frameTick: 0,
    bullets: [], health: 100,
    direction: 'right',
    isShooting: false,
    shootTimer: null,
    dy: 0,
    isJumping: false,
    canDoubleJump: true,
    gravity: 1.5,
    jumpPower: -18,
    shoot() {
      if (!this.isShooting) {
        this.isShooting = true;
        const bulletX = this.x + (this.direction === 'right' ? 50 : 0);
        const bulletYOffset = this.y + (this.height / 2) - 4; // Center bullet vertically from player
        const bulletDX = (this.direction === 'right' ? 10 : -10);
        this.bullets.push({ x: bulletX, y: bulletYOffset, width: 16, height: 8, dx: bulletDX });
        createGunshotEffect(this.x + (this.direction === 'right' ? this.width : -30), this.y + 20, this.direction);
        if (this.shootTimer) clearTimeout(this.shootTimer);
        this.shootTimer = setTimeout(() => {
          this.isShooting = false;
        }, 200);
      }
    },
    jump() {
      if (!this.isJumping) {
        this.dy = this.jumpPower;
        this.isJumping = true;
        this.canDoubleJump = true;
      } else if (this.canDoubleJump) {
        this.dy = this.jumpPower;
        this.canDoubleJump = false;
      }
    }
  };

  const keys = {};
  window.addEventListener("keydown", e => {
    keys[e.key] = true;
    if ((e.key === " " || e.key === "ArrowUp") && !paused) {
      player.jump();
    }
    if ((e.key === "z" || e.key === "Z") && !paused) {
      player.shoot();
    }
    if (e.key === "Escape") {
      paused = !paused;
      pauseMenu.style.display = paused ? "flex" : "none";
    }
  });
  window.addEventListener("keyup", e => delete keys[e.key]);

  document.getElementById("jumpBtn").addEventListener("touchstart", function(e) {
    if (!paused) player.jump();
    e.preventDefault();
  });

  document.getElementById("shootBtn").addEventListener("touchstart", function(e) {
    if (!paused) player.shoot();
    e.preventDefault();
  });

  // Joystick controls
  const joystickArea = document.getElementById("joystickArea");
  const joystickKnob = document.getElementById("joystickKnob");
  let joystickActive = false;
  let joystickStartX, joystickStartY;

  joystickArea.addEventListener("touchstart", (e) => {
    joystickActive = true;
    const touch = e.touches[0];
    joystickStartX = touch.clientX;
    joystickStartY = touch.clientY;
    joystickKnob.style.transition = 'none'; // Disable transition for immediate response
    e.preventDefault();
  });

  joystickArea.addEventListener("touchmove", (e) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickStartX;
    const dy = touch.clientY - joystickStartY;

    const maxDistance = 50; // Half of joystickBase width/height (100px)
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy));

    const knobX = maxDistance + Math.cos(angle) * distance;
    const knobY = maxDistance + Math.sin(angle) * distance;

    joystickKnob.style.left = `${knobX - joystickKnob.offsetWidth / 2}px`;
    joystickKnob.style.top = `${knobY - joystickKnob.offsetHeight / 2}px`;

    // Map joystick position to player movement
    keys["ArrowRight"] = knobX > maxDistance + 10;
    keys["ArrowLeft"] = knobX < maxDistance - 10;
    // You could also add jump based on Y or other actions
    e.preventDefault();
  });

  joystickArea.addEventListener("touchend", () => {
    joystickActive = false;
    joystickKnob.style.transition = 'left 0.1s, top 0.1s'; // Re-enable transition
    joystickKnob.style.left = '25px'; // Reset knob to center
    joystickKnob.style.top = '25px';
    keys["ArrowRight"] = false;
    keys["ArrowLeft"] = false;
  });


  // Pause menu buttons
  resumeButton.onclick = () => {
    paused = false;
    pauseMenu.style.display = "none";
  };
  retryButton.onclick = () => window.location.reload();
  mainMenuButton.onclick = () => window.location.href = "../index.html";
  toggleMusicButton.onclick = () => {
    if (bgMusic.paused) {
      bgMusic.play();
    } else {
      bgMusic.pause();
    }
  };

  // --- Game Objects ---
  let enemies = [
    { x: 800, y: 0, width: 64, height: 64, frame: 0, frameTick: 0, health: 5, alive: true, direction: 'left', isAttacking: false, attackTimer: null, animationSpeed: 10 },
    { x: 1300, y: 0, width: 64, height: 64, frame: 0, frameTick: 0, health: 5, alive: true, direction: 'left', isAttacking: false, attackTimer: null, animationSpeed: 10 }
  ];
  let explosions = [];
  let activeGunshotEffects = [];
  let activePlayerHitEffects = [];

  let backgroundFlashTimer = 0;
  // Increased interval for more spaced out lightning flashes
  const backgroundFlashInterval = 50;
  let currentBackgroundIndex = 0;

  const camera = { x: 0 };
  const worldWidth = tileMap[0].length * TILE_SIZE;

  // --- Create and Update Functions ---
  function createExplosion(x, y) {
    explosions.push({
      x: x,
      y: y,
      frame: 0,
      frameTick: 0,
      // maxFrame is now 2 since bullethitenemy2.png is removed
      maxFrame: assets.explosionFrames.length > 0 ? assets.explosionFrames.length : 1, // Ensure it doesn't try to animate non-existent frames
      animationSpeed: 5 // Adjust as needed
    });
  }

  function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i];
      exp.frameTick++;
      if (exp.frameTick >= exp.animationSpeed) {
        exp.frame++;
        exp.frameTick = 0;
      }
      // Ensure exp.frame stays within bounds of available explosion frames
      if (exp.frame >= assets.explosionFrames.length) {
        explosions.splice(i, 1); // Remove explosion when animation finishes
      }
    }
  }

  // NEW: Gunshot effect functions
  function createGunshotEffect(x, y, direction) {
    activeGunshotEffects.push({
      x: x,
      y: y,
      frame: 0,
      frameTick: 0,
      maxFrame: assets.gunshotEffectFrames.length,
      animationSpeed: 2, // Faster for a flash
      direction: direction
    });
  }

  function updateGunshotEffects() {
    for (let i = activeGunshotEffects.length - 1; i >= 0; i--) {
      const effect = activeGunshotEffects[i];
      effect.frameTick++;
      if (effect.frameTick >= effect.animationSpeed) {
        effect.frame++;
        effect.frameTick = 0;
      }
      if (effect.frame >= effect.maxFrame) {
        activeGunshotEffects.splice(i, 1);
      }
    }
  }

  // NEW: Player hit effect functions
  function createPlayerHitEffect(x, y) {
    activePlayerHitEffects.push({
      x: x,
      y: y,
      frame: 0,
      frameTick: 0,
      maxFrame: 1, // Only one frame for playerHitEffect (single image)
      animationSpeed: 1 // Display briefly
    });
  }

  function updatePlayerHitEffects() {
    for (let i = activePlayerHitEffects.length - 1; i >= 0; i--) {
      const effect = activePlayerHitEffects[i];
      effect.frameTick++;
      if (effect.frameTick >= effect.animationSpeed) {
        effect.frame++;
        effect.frameTick = 0;
      }
      if (effect.frame >= effect.maxFrame) {
        activePlayerHitEffects.splice(i, 1);
      }
    }
  }

  // --- Drawing Functions ---
  function drawTileLayer(ctx, map, tileSize, offsetX) {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tile = map[row][col];
        let tileImage = null;
        if (tile === 1 && assets.ground1Tile.complete) {
          tileImage = assets.ground1Tile;
        } else if (tile === 2 && assets.ground2Tile.complete) {
          tileImage = assets.ground2Tile;
        } else if (tile === 3 && assets.floatingGroundTile.complete) {
          tileImage = assets.floatingGroundTile;
        } else if (tile === 4 && assets.hotLavaTile.complete) {
          tileImage = assets.hotLavaTile;
        }

        if (tileImage) {
          ctx.drawImage(tileImage, col * tileSize - offsetX, row * tileSize, tileSize, tileSize);
        } else if (tile !== 0) { // Fallback for unhandled tiles or unloasded images
          // Draw a colored rectangle if image is not loaded or not a valid tile type
          if (tile === 1) ctx.fillStyle = "#964B00"; // Brown for ground1
          else if (tile === 3) ctx.fillStyle = "#228B22"; // Green for floating ground
          else if (tile === 4) ctx.fillStyle = "red"; // Red for hot lava
          else ctx.fillStyle = "gray"; // Default for other unknown tiles
          ctx.fillRect(col * tileSize - offsetX, row * tileSize, tileSize, tileSize);
        }
      }
    }
  }

  function drawPlayer() {
    let playerImage;
    const animationSpeed = 10; // Adjust for slower/faster animation
    if (player.isShooting) {
      playerImage = (player.direction === 'right' && assets.playerShootRight.complete) ? assets.playerShootRight :
                    (player.direction === 'left' && assets.playerShootLeft.complete) ? assets.playerShootLeft : null;
    } else {
      player.frameTick++;
      if (player.frameTick >= animationSpeed) {
        player.frame = (player.frame + 1) % 2; // Assuming 2 walk frames
        player.frameTick = 0;
      }
      playerImage = (player.direction === 'right' && assets.playerWalkRight[player.frame] && assets.playerWalkRight[player.frame].complete) ? assets.playerWalkRight[player.frame] :
                    (player.direction === 'left' && assets.playerWalkLeft[player.frame] && assets.playerWalkLeft[player.frame].complete) ? assets.playerWalkLeft[player.frame] : null;
    }

    if (playerImage) {
      ctx.drawImage(playerImage, player.x - camera.x, player.y, player.width, player.height);
    } else {
      ctx.fillStyle = "blue"; // Fallback if image not loaded
      ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);
    }
  }

  function drawBullets() {
    player.bullets.forEach(b => {
      if (assets.bulletImg.complete) {
        ctx.drawImage(assets.bulletImg, b.x - camera.x, b.y, b.width, b.height);
      } else {
        ctx.fillStyle = "yellow"; // Fallback if image not loaded
        ctx.fillRect(b.x - camera.x, b.y, b.width, b.height);
      }
    });
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.alive) {
        let enemyImage;
        e.frameTick++;
        if (e.frameTick >= e.animationSpeed) {
          e.frame = (e.frame + 1) % 2; // Assuming 2 walk frames
          e.frameTick = 0;
        }

        if (e.isAttacking) {
          enemyImage = (e.direction === 'right' && assets.enemyAttackRight.complete) ? assets.enemyAttackRight :
                       (e.direction === 'left' && assets.enemyAttackLeft.complete) ? assets.enemyAttackLeft : null;
        } else {
          enemyImage = (e.direction === 'right' && assets.enemyWalkRight[e.frame] && assets.enemyWalkRight[e.frame].complete) ? assets.enemyWalkRight[e.frame] :
                       (e.direction === 'left' && assets.enemyWalkLeft[e.frame] && assets.enemyWalkLeft[e.frame].complete) ? assets.enemyWalkLeft[e.frame] : null;
        }

        if (enemyImage) {
          ctx.drawImage(enemyImage, e.x - camera.x, e.y, e.width, e.height);
        } else {
          ctx.fillStyle = "purple"; // Fallback if image not loaded
          ctx.fillRect(e.x - camera.x, e.y, e.width, e.height);
        }
      }
    });
  }

  function drawExplosions() {
    explosions.forEach(exp => {
      // Ensure the frame index is valid for the existing explosionFrames array
      if (exp.frame < assets.explosionFrames.length && assets.explosionFrames[exp.frame] && assets.explosionFrames[exp.frame].complete) {
        ctx.drawImage(assets.explosionFrames[exp.frame], exp.x - camera.x, exp.y);
      }
    });
  }

  function drawGunshotEffects() {
    activeGunshotEffects.forEach(effect => {
      if (assets.gunshotEffectFrames[effect.frame] && assets.gunshotEffectFrames[effect.frame].complete) {
        let drawX = effect.x - camera.x;
        // Flip gunshot effect if player is shooting left
        if (effect.direction === 'left') {
          ctx.save();
          ctx.translate(drawX + assets.gunshotEffectFrames[effect.frame].width / 2, effect.y + assets.gunshotEffectFrames[effect.frame].height / 2);
          ctx.scale(-1, 1);
          ctx.drawImage(assets.gunshotEffectFrames[effect.frame], -assets.gunshotEffectFrames[effect.frame].width / 2, -assets.gunshotEffectFrames[effect.frame].height / 2);
          ctx.restore();
        } else {
          ctx.drawImage(assets.gunshotEffectFrames[effect.frame], drawX, effect.y);
        }
      }
    });
  }

  function drawPlayerHitEffects() {
    activePlayerHitEffects.forEach(effect => {
      if (assets.playerHitEffect && assets.playerHitEffect.complete && effect.frame < effect.maxFrame) {
        ctx.drawImage(assets.playerHitEffect, effect.x - camera.x, effect.y);
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

  // --- Update Function ---
  function update() {
    if (player.health <= 0) return;

    // Horizontal movement
    player.dx = 0;
    if (keys["ArrowRight"]) {
      player.x += player.speed;
      player.direction = 'right';
    }
    if (keys["ArrowLeft"]) {
      player.x -= player.speed;
      player.direction = 'left';
    }

    // Gravity and vertical movement
    player.y += player.dy;
    player.dy += player.gravity;

    // Basic collision detection with the ground (replace with proper tile collision later)
    const floorY = canvas.height - TILE_SIZE; // Assuming the bottom row of tiles is the floor
    if (player.y + player.height > floorY) {
      player.y = floorY - player.height;
      player.dy = 0;
      player.isJumping = false;
      player.canDoubleJump = true;
    }


    // Bullets
    player.bullets.forEach(b => b.x += b.dx);
    player.bullets = player.bullets.filter(b => b.x < worldWidth && b.x > -TILE_SIZE);

    // Enemies and collisions (unchanged)
    enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dx > 0) enemy.direction = 'right';
      else if (dx < 0) enemy.direction = 'left';

      // Simple enemy movement towards player
      if (dist > 1) { // Avoid division by zero
        enemy.x += (dx / dist) * 1.5;
        enemy.y += (dy / dist) * 1.5;
        enemy.isAttacking = false; // Stop attacking when moving
      } else {
        enemy.isAttacking = true; // Start attacking when very close
      }

      if (player.x < enemy.x + enemy.width && player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) {
        if (player.health > 0) {
          player.health -= 0.5;
          createPlayerHitEffect(player.x + player.width / 2 - 32, player.y + player.height / 2 - 32);
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

    // Update effects
    updateExplosions();
    updateGunshotEffects();
    updatePlayerHitEffects();
  }

  // --- Draw Function ---
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (parallax might be added here later)
    if (assets.background1.complete && assets.background2.complete) {
        // Simple alternating background for now, or you can implement parallax
        const bgToDraw = (currentBackgroundIndex % 2 === 0) ? assets.background1 : assets.background2;
        // Adjust backgroundFlashTimer to control how often it changes
        backgroundFlashTimer++;
        if (backgroundFlashTimer >= backgroundFlashInterval) {
            currentBackgroundIndex++;
            backgroundFlashTimer = 0;
        }
        ctx.drawImage(bgToDraw, 0, 0, canvas.width, canvas.height); // Draw full screen
    }


    drawTileLayer(ctx, tileMap, TILE_SIZE, camera.x);
    drawExplosions();
    drawGunshotEffects();
    drawPlayerHitEffects();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawUI();
  }

  // --- Start Game Function ---
  function startGame() {
    // Set initial player and enemy positions on the ground
    player.y = canvas.height - TILE_SIZE - player.height;
    enemies.forEach(enemy => {
        enemy.y = canvas.height - TILE_SIZE - enemy.height;
    });

    gameLoop(); // Start the game loop
  }

  // --- Game Loop ---
  function gameLoop() {
    if (!paused) {
      update();
      draw();
    }
    requestAnimationFrame(gameLoop);
  }

  startGame(); // Start the game after everything is defined
};