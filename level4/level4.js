// level4_camera_scroll.js - Extended from original code with camera scrolling

window.onload = function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const bgMusic = document.getElementById("bgMusic");
  if (bgMusic) {
    bgMusic.volume = 0.3;
    document.addEventListener("click", () => bgMusic.play());
  }

  const TILE_SIZE = 64;
  const tileMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 0, 0, 2, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

  const playerImg = new Image(); playerImg.src = "character_sprite_sheet.png";
  const bulletImg = new Image(); bulletImg.src = "bullet.png";
  const enemyImg = new Image(); enemyImg.src = "enemy1.png";
  const explosionImg = new Image(); explosionImg.src = "enemydamagefromgunshot.png";
  const backgroundTiles = new Image(); backgroundTiles.src = "level4tiles.png";

  const player = {
    x: 100, y: 400,
    width: 64, height: 64,
    speed: 4, frame: 0, frameTick: 0,
    bullets: [], health: 100,
    shoot() {
      this.bullets.push({ x: this.x + 50, y: this.y + 20, width: 16, height: 8 });
    }
  };

  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup", e => keys[e.key] = false);

  let enemies = [
    { x: 800, y: 400, width: 64, height: 64, frame: 0, frameTick: 0, health: 5, alive: true },
    { x: 1300, y: 400, width: 64, height: 64, frame: 0, frameTick: 0, health: 5, alive: true }
  ];

  let explosions = [];
  const camera = { x: 0 };
  const worldWidth = tileMap[0].length * TILE_SIZE;

  function tileIndexToCoords(index) {
    const tilesPerRow = 3;
    return {
      sx: (index % tilesPerRow) * TILE_SIZE,
      sy: Math.floor(index / tilesPerRow) * TILE_SIZE
    };
  }

  function drawTileLayer(ctx, tilesetImg, map, tileSize, offsetX) {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tileIndex = map[row][col];
        const { sx, sy } = tileIndexToCoords(tileIndex);
        ctx.drawImage(
          tilesetImg,
          sx, sy, tileSize, tileSize,
          col * tileSize - offsetX, row * tileSize,
          tileSize, tileSize
        );
      }
    }
  }

  function createExplosion(x, y) {
    explosions.push({ x, y, frame: 0, maxFrames: 4, tick: 0 });
  }

  function drawExplosions() {
    explosions.forEach((e, i) => {
      ctx.drawImage(explosionImg, e.frame * 64, 0, 64, 64, e.x - camera.x, e.y, 64, 64);
      if (++e.tick % 5 === 0) e.frame++;
      if (e.frame >= e.maxFrames) explosions.splice(i, 1);
    });
  }

  function drawPlayer() {
    ctx.drawImage(playerImg, player.frame * 64, 0, 64, 64, player.x - camera.x, player.y, 64, 64);
    if (++player.frameTick % 10 === 0) player.frame = (player.frame + 1) % 3;
  }

  function drawBullets() {
    player.bullets.forEach(b => ctx.drawImage(bulletImg, b.x - camera.x, b.y, b.width, b.height));
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.alive) {
        ctx.drawImage(enemyImg, e.frame * 64, 0, 64, 64, e.x - camera.x, e.y, e.width, e.height);
        if (++e.frameTick % 15 === 0) e.frame = (e.frame + 1) % 3;
        ctx.fillStyle = "red";
        ctx.fillRect(e.x - camera.x, e.y - 10, 60, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(e.x - camera.x, e.y - 10, (e.health / 5) * 60, 5);
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
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys[" "] || keys["z"]) player.shoot();

    player.bullets.forEach(b => b.x += 10);
    player.bullets = player.bullets.filter(b => b.x < worldWidth);

    enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        enemy.x += (dx / dist) * 1.5;
        enemy.y += (dy / dist) * 1.5;
      }
      if (player.x < enemy.x + enemy.width && player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) {
        player.health -= 0.5;
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
    drawTileLayer(ctx, backgroundTiles, tileMap, TILE_SIZE, camera.x);
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawExplosions();
    drawUI();
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
};