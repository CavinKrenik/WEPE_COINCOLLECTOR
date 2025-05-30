window.addEventListener('load', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const titleScreenDiv = document.getElementById('titleScreen');
    const titleImageEl = document.getElementById('titleImage'); // HTML element for Title.png
    const startButton = document.getElementById('startButton');
    const startButtonImageEl = document.getElementById('startButtonImage'); // HTML element for start.png
    const scoreDisplay = document.getElementById('scoreDisplay');

    // --- Game Configuration ---
    canvas.width = 800;
    canvas.height = 600;

    let score = 0;
    let gameState = 'title'; // 'title', 'playing', 'gameOver'
    let animationFrameId;
    let isPaused = false;
    const pauseMenu = document.getElementById('pauseMenu');
    const resumeButton = document.getElementById('resumeButton');
    const mainMenuButton = document.getElementById('mainMenuButton');

    // --- Asset Loading ---
    const assets = {
        background: new Image(),
        btc: new Image(),
        player: {
            left: [new Image(), new Image()],
            right: [new Image(), new Image()],
            jumpLeft: new Image(),
            jumpRight: new Image(),
        },
        title: titleImageEl, // Reference to the <img> element in HTML
        startButton: startButtonImageEl // Reference to the <img> element in HTML
    };

    // Updated asset sources to .png
    const assetSources = {
        background: 'background.png',
        btc: 'btc.png',
        playerLeft1: 'Left.png',
        playerLeft2: 'left1.png',
        playerRight1: 'right.png',
        playerRight2: 'right1.png',
        playerJumpLeft: 'jumpleft.png',
        playerJumpRight: 'jumpright.png',
        // Title.png and start.png src are set in the HTML
    };

    let assetsLoadedCount = 0;
    // background, btc, playerLeft1, playerLeft2, playerRight1, playerRight2, playerJumpLeft, playerJumpRight
    const totalCoreAssetsToLoad = 8; 

function coreAssetLoaded() {
    assetsLoadedCount++;
    if (assetsLoadedCount === totalCoreAssetsToLoad) {
        console.log("All core game assets (JS-loaded) are loaded.");
        // Now check the HTML-loaded start button image
        // The title image (assets.title) is handled by the browser directly for its <img> tag.

        if (assets.startButton.complete && assets.startButton.naturalHeight !== 0) {
            startButton.style.display = 'none'; // Hide text button
            startButtonImageEl.style.display = 'block'; // Show image button
            startButtonImageEl.addEventListener('click', initGame);
        } else {
            console.log("start.png image not loaded or has no dimensions, using text button.");
            startButton.addEventListener('click', initGame);
        }
        // Ensure title image is also scaled after it might have loaded
        // assets.title.style.maxWidth = canvas.width * 0.9 + 'px'; // REMOVE OR COMMENT OUT THIS LINE
        // assets.title.style.maxHeight = canvas.height * 0.7 + 'px'; // REMOVE OR COMMENT OUT THIS LINE
    }
}

    assets.background.onload = coreAssetLoaded;
    assets.btc.onload = coreAssetLoaded;
    assets.player.left[0].onload = coreAssetLoaded;
    assets.player.left[1].onload = coreAssetLoaded;
    assets.player.right[0].onload = coreAssetLoaded;
    assets.player.right[1].onload = coreAssetLoaded;
    assets.player.jumpLeft.onload = coreAssetLoaded;
    assets.player.jumpRight.onload = coreAssetLoaded;


    assets.background.src = assetSources.background;
    assets.btc.src = assetSources.btc;
    assets.player.left[0].src = assetSources.playerLeft1;
    assets.player.left[1].src = assetSources.playerLeft2;
    assets.player.right[0].src = assetSources.playerRight1;
    assets.player.right[1].src = assetSources.playerRight2;
    assets.player.jumpLeft.src = assetSources.playerJumpLeft;
    assets.player.jumpRight.src = assetSources.playerJumpRight;
    
    // The src for assets.title (Title.png) and assets.startButton (start.png)
    // are already set in the HTML. We just need to ensure they are handled.
    // We can add an onload for startButtonImageEl if needed for precise control,
    // but checking .complete and .naturalHeight in coreAssetLoaded is usually sufficient.


    // --- Player Object ---
    const player = {
        width: 80,  // IMPORTANT: Adjust based on your character image aspect ratio & desired size
        height: 100, // IMPORTANT: Adjust based on your character image aspect ratio & desired size
        x: canvas.width / 2 - 40,
        y: canvas.height - 110, // Start on ground
        speed: 5,
        dx: 0, // Velocity x
        dy: 0, // Velocity y
        gravity: 0.8,
        jumpPower: -15, 
        isJumping: false,
        groundY: canvas.height - 110, // Should match initial y
        currentFrame: 0,
        animationTimer: 0,
        animationSpeed: 8, // Lower is faster animation
        direction: 'right', // 'left' or 'right'
        images: assets.player,

        draw() {
            let currentImage;
            if (this.isJumping) {
                currentImage = this.direction === 'left' ? this.images.jumpLeft : this.images.jumpRight;
            } else {
                if (this.dx !== 0) { // Moving
                    currentImage = this.direction === 'left' ? this.images.left[this.currentFrame] : this.images.right[this.currentFrame];
                } else { // Idle - use first frame of current direction
                    currentImage = this.direction === 'left' ? this.images.left[0] : this.images.right[0];
                }
            }
            if (currentImage && currentImage.complete && currentImage.naturalHeight !== 0) {
                 ctx.drawImage(currentImage, this.x, this.y, this.width, this.height);
            } else { // Fallback drawing if image not loaded
                ctx.fillStyle = 'green';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        },
        update() {
            // Horizontal movement
            this.x += this.dx;

            // Animation
            if (this.dx !== 0 && !this.isJumping) {
                this.animationTimer++;
                if (this.animationTimer % this.animationSpeed === 0) {
                    this.currentFrame = (this.currentFrame + 1) % this.images.left.length;
                }
            } else if (this.dx === 0 && !this.isJumping) {
                this.currentFrame = 0;
            }

            // Vertical movement (Jump)
            if (this.isJumping) {
                this.dy += this.gravity;
                this.y += this.dy;
                if (this.y >= this.groundY) {
                    this.y = this.groundY;
                    this.isJumping = false;
                    this.dy = 0;
                }
            }

            // --- Screen wrapping logic ---
            if (this.x + this.width < 0) {
                // Off left, appear at right
                this.x = canvas.width;
            } else if (this.x > canvas.width) {
                // Off right, appear at left
                this.x = -this.width;
            }
        },
        jump() {
            if (!this.isJumping) {
                this.isJumping = true;
                this.dy = this.jumpPower;
            }
        }
    };

    // --- Money Object ---
    const moneyItems = [];
    const moneyProps = {
        width: 40,  // IMPORTANT: Adjust based on btc.png visual size
        height: 40, // IMPORTANT: Adjust based on btc.png visual size
        speed: 3, // Slightly faster coins
        spawnInterval: 90, // Spawn a bit more frequently
        spawnTimer: 0
    };

    function createMoney() {
        const x = Math.random() * (canvas.width - moneyProps.width);
        const y = -moneyProps.height; // Start above screen
        moneyItems.push({ x, y, width: moneyProps.width, height: moneyProps.height });
    }

    function updateMoney() {
        moneyProps.spawnTimer++;
        if (moneyProps.spawnTimer >= moneyProps.spawnInterval) { // Use >= for consistency
            moneyProps.spawnTimer = 0; // Reset timer
            createMoney();
        }

        for (let i = moneyItems.length - 1; i >= 0; i--) {
            const money = moneyItems[i];
            money.y += moneyProps.speed;

            // Collision with player
            if (
                money.x < player.x + player.width &&
                money.x + money.width > player.x &&
                money.y < player.y + player.height &&
                money.y + money.height > player.y
            ) {
                moneyItems.splice(i, 1);
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
            }
            // Remove if off screen
            else if (money.y > canvas.height) {
                moneyItems.splice(i, 1);
            }
        }
    }

    function drawMoney() {
        moneyItems.forEach(money => {
            if (assets.btc && assets.btc.complete && assets.btc.naturalHeight !== 0) {
                ctx.drawImage(assets.btc, money.x, money.y, money.width, money.height);
            } else {
                ctx.fillStyle = 'gold'; // Fallback
                ctx.fillRect(money.x, money.y, money.width, money.height);
            }
        });
    }

    // --- Game Controls ---
    const keys = {
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
    };

    function handleKeyDown(e) {
        if (gameState !== 'playing' && e.code !== "Enter" && e.code !== "Space") return; // Allow Enter/Space for potential title interaction

        if (e.code === "ArrowLeft") keys.ArrowLeft = true;
        if (e.code === "ArrowRight") keys.ArrowRight = true;
        if (e.code === "Space") {
            keys.Space = true;
            if(gameState === 'playing') player.jump(); // Trigger jump immediately on press for responsiveness
        }
        if (e.code === "Escape") {
            if (gameState === 'playing') {
                pauseGame();
            } else if (gameState === 'paused') {
                resumeGame();
            }
            return;
        }


        // Prevent page scroll on space/arrow keys if game is active
        if (gameState === 'playing' && (e.code === "Space" || e.code.startsWith("Arrow"))) {
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        if (e.code === "ArrowLeft") keys.ArrowLeft = false;
        if (e.code === "ArrowRight") keys.ArrowRight = false;
        if (e.code === "Space") keys.Space = false;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    function processInputForMovement() { // Renamed to avoid confusion with player.jump()
        player.dx = 0; 
        if (keys.ArrowLeft) {
            player.dx = -player.speed;
            player.direction = 'left';
        }
        if (keys.ArrowRight) {
            player.dx = player.speed;
            player.direction = 'right';
        }
        // Jump is handled in handleKeyDown for immediate response
    }


    // --- Game Loop ---
    function gameLoop() {
        if (gameState !== 'playing') return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (assets.background && assets.background.complete && assets.background.naturalHeight !==0) {
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#87CEEB'; // Fallback
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        processInputForMovement();
        player.update();
        player.draw();

        updateMoney();
        drawMoney();

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function pauseGame() {
        if (gameState === 'playing') {
            isPaused = true;
            gameState = 'paused';
            pauseMenu.style.display = 'flex';
            cancelAnimationFrame(animationFrameId);
        }
    }

    function resumeGame() {
        if (gameState === 'paused') {
            isPaused = false;
            gameState = 'playing';
            pauseMenu.style.display = 'none';
            gameLoop();
        }
    }

    function goToMainMenu() {
        pauseMenu.style.display = 'none';
        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
        titleScreenDiv.style.display = 'flex';
        gameState = 'title';
    }

    resumeButton.addEventListener('click', resumeGame);
    mainMenuButton.addEventListener('click', goToMainMenu);

    // --- Initialization ---
    function initGame() {
        if (assetsLoadedCount < totalCoreAssetsToLoad) {
            console.warn("Assets not fully loaded yet. Game start might be premature.");
            // Optionally, you could disable the start button until assets are loaded.
        }

        titleScreenDiv.style.display = 'none';
        canvas.style.display = 'block';
        scoreDisplay.style.display = 'block';
        score = 0;
        scoreDisplay.textContent = `Score: ${score}`;
        player.x = canvas.width / 2 - player.width / 2;
        player.y = player.groundY;
        player.isJumping = false;
        player.dy = 0;
        player.direction = 'right';
        player.currentFrame = 0; // Reset animation frame
        moneyItems.length = 0; 
        moneyProps.spawnTimer = 0;
        gameState = 'playing';

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop();
    }

    // Set canvas dimensions for title screen elements as well initially
    // titleScreenDiv.style.width = canvas.width + 'px';
    // titleScreenDiv.style.height = canvas.height + 'px';
    // document.getElementById('gameContainer').style.width = canvas.width + 'px';
    // document.getElementById('gameContainer').style.height = canvas.height + 'px';

});