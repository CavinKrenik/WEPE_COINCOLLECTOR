window.addEventListener('load', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const titleScreenDiv = document.getElementById('titleScreen');
    const titleImageEl = document.getElementById('titleImage'); // HTML element for Title.png
    const startButton = document.getElementById('startButton');
    const startButtonImageEl = document.getElementById('startButtonImage'); // HTML element for start.png
    const scoreDisplay = document.getElementById('scoreDisplay');

    // --- Game Configuration ---
    // These initial canvas.width/height will be overridden by resizeCanvas() on load
    canvas.width = 800;
    canvas.height = 600;

    let score = 0;
    let gameState = 'title'; // 'title', 'playing', 'paused', 'gameOver'
    let animationFrameId;
    // let isPaused = false; // gameState 'paused' will handle this
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

    const assetSources = {
        background: 'background.png',
        btc: 'btc.png',
        playerLeft1: 'Left.png',
        playerLeft2: 'left1.png',
        playerRight1: 'right.png',
        playerRight2: 'right1.png',
        playerJumpLeft: 'jumpleft.png',
        playerJumpRight: 'jumpright.png',
    };

    let assetsLoadedCount = 0;
    const totalCoreAssetsToLoad = 8; 

    function coreAssetLoaded() {
        assetsLoadedCount++;
        if (assetsLoadedCount === totalCoreAssetsToLoad) {
            console.log("All core game assets (JS-loaded) are loaded.");
            
            if (assets.startButton.complete && assets.startButton.naturalHeight !== 0 && assets.startButton.src) {
                startButton.style.display = 'none'; 
                startButtonImageEl.style.display = 'block'; 
                startButtonImageEl.addEventListener('click', initGame);
            } else {
                console.log("start.png image not loaded or has no dimensions, using text button.");
                startButton.addEventListener('click', initGame);
            }
            // REMOVED: Lines that restricted titleImageEl size
            // assets.title.style.maxWidth = canvas.width * 0.9 + 'px'; 
            // assets.title.style.maxHeight = canvas.height * 0.7 + 'px'; 
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
    
    const playerBaseWidth = 80; // Original reference width
    const playerBaseHeight = 100; // Original reference height
    const playerAspectRatio = playerBaseWidth / playerBaseHeight;

    // --- Player Object ---
    const player = {
        width: playerBaseWidth, 
        height: playerBaseHeight,
        x: canvas.width / 2 - playerBaseWidth / 2,
        y: canvas.height - playerBaseHeight - (canvas.height * 0.12), // Adjusted groundY
        speed: 5, // Base speed, consider scaling with canvas size if needed
        dx: 0, 
        dy: 0, 
        gravity: 0.8, // Base gravity
        jumpPower: -15, // Base jump power
        isJumping: false,
        groundY: canvas.height - playerBaseHeight - (canvas.height * 0.12), // Initial groundY
        currentFrame: 0,
        animationTimer: 0,
        animationSpeed: 8, 
        direction: 'right', 
        images: assets.player,

        draw() {
            let currentImage;
            if (this.isJumping) {
                currentImage = this.direction === 'left' ? this.images.jumpLeft : this.images.jumpRight;
            } else {
                if (this.dx !== 0) { 
                    currentImage = this.direction === 'left' ? this.images.left[this.currentFrame] : this.images.right[this.currentFrame];
                } else { 
                    currentImage = this.direction === 'left' ? this.images.left[0] : this.images.right[0];
                }
            }
            if (currentImage && currentImage.complete && currentImage.naturalHeight !== 0) {
                 ctx.drawImage(currentImage, this.x, this.y, this.width, this.height);
            } else { 
                ctx.fillStyle = 'green';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        },
        update() {
            this.x += this.dx;

            if (this.dx !== 0 && !this.isJumping) {
                this.animationTimer++;
                if (this.animationTimer % this.animationSpeed === 0) {
                    this.currentFrame = (this.currentFrame + 1) % this.images.left.length; 
                }
            } else if (this.dx === 0 && !this.isJumping) { 
                this.currentFrame = 0; 
            }

            if (this.isJumping) {
                this.dy += this.gravity;
                this.y += this.dy;
                if (this.y >= this.groundY) { 
                    this.y = this.groundY;
                    this.isJumping = false;
                    this.dy = 0;
                }
            }

            // Screen wrapping logic
            if (this.x + this.width < 0) {
                this.x = canvas.width;
            } else if (this.x > canvas.width) {
                this.x = -this.width;
            }
        },
        jump() {
            if (!this.isJumping && gameState === 'playing') { // Ensure game is playing
                this.isJumping = true;
                this.dy = this.jumpPower;
            }
        }
    };

    let originalSpeed = player.speed; // Store base speed
    let speedBoostTimeout = null;

    // --- Money Object ---
    const moneyItems = [];
    const moneyProps = {
        baseWidth: 40, // Original reference width
        width: 40,  
        height: 40, 
        speed: 3, // Base speed
        spawnInterval: 90, 
        spawnTimer: 0
    };

    function createMoney() {
        const x = Math.random() * (canvas.width - moneyProps.width);
        const y = -moneyProps.height; 
        moneyItems.push({ x, y, width: moneyProps.width, height: moneyProps.height });
    }

    function updateMoney() {
        moneyProps.spawnTimer++;
        if (moneyProps.spawnTimer >= moneyProps.spawnInterval) { 
            moneyProps.spawnTimer = 0; 
            createMoney();
        }

        for (let i = moneyItems.length - 1; i >= 0; i--) {
            const money = moneyItems[i];
            money.y += moneyProps.speed;

            if (
                money.x < player.x + player.width &&
                money.x + money.width > player.x &&
                money.y < player.y + player.height &&
                money.y + money.height > player.y
            ) {
                moneyItems.splice(i, 1);
                score++;
                scoreDisplay.textContent = `Score: ${score}`;

                if (score > 0 && score % 5 === 0) { // Ensure score > 0 for first boost
                    if (speedBoostTimeout !== null) {
                        clearTimeout(speedBoostTimeout);
                    }
                    // player.speed = originalSpeed * 1.5; // Boost based on current originalSpeed
                    player.speed = player.speed * 1.3 > originalSpeed * 2 ? originalSpeed * 2 : player.speed * 1.3; // Cumulative but capped
                    console.log("Speed Boost!", player.speed);
                    speedBoostTimeout = setTimeout(() => {
                        player.speed = originalSpeed; // Reset to the very base speed
                        speedBoostTimeout = null;
                        console.log("Speed normal.", player.speed);
                    }, 3000); // 3 second boost
                }
            }
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
                ctx.fillStyle = 'gold'; 
                ctx.fillRect(money.x, money.y, money.width, money.height);
            }
        });
    }

    const keys = { ArrowLeft: false, ArrowRight: false, Space: false };

    function handleKeyDown(e) {
        if (e.code === "Escape") {
            if (gameState === 'playing') {
                pauseGame();
            } else if (gameState === 'paused') {
                resumeGame();
            }
            return;
        }
        if (gameState !== 'playing' && gameState !== 'title') return; // Allow space/enter on title for start

        if (gameState === 'playing') {
            if (e.code === "ArrowLeft") keys.ArrowLeft = true;
            if (e.code === "ArrowRight") keys.ArrowRight = true;
            if (e.code === "Space") {
                keys.Space = true; // Set key state
                player.jump(); // Call jump action
            }
             if (e.code === "Space" || e.code.startsWith("Arrow")) {
                e.preventDefault();
            }
        } else if (gameState === 'title' && (e.code === "Enter" || e.code === "Space")) {
            initGame(); // Start game with Enter/Space from title
        }
    }

    function handleKeyUp(e) {
        if (e.code === "ArrowLeft") keys.ArrowLeft = false;
        if (e.code === "ArrowRight") keys.ArrowRight = false;
        if (e.code === "Space") keys.Space = false;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    function processInputForMovement() { 
        player.dx = 0; 
        if (keys.ArrowLeft) {
            player.dx = -player.speed;
            player.direction = 'left';
        }
        if (keys.ArrowRight) {
            player.dx = player.speed;
            player.direction = 'right';
        }
    }

    function gameLoop() {
        if (gameState !== 'playing') return; // Only run loop if playing

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (assets.background && assets.background.complete && assets.background.naturalHeight !==0) {
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#87CEEB'; 
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
            gameState = 'paused';
            pauseMenu.style.display = 'flex'; // CSS handles flex centering
            // cancelAnimationFrame(animationFrameId); // Game loop already checks gameState
        }
    }

    function resumeGame() {
        if (gameState === 'paused') {
            gameState = 'playing';
            pauseMenu.style.display = 'none';
            animationFrameId = requestAnimationFrame(gameLoop); // Restart loop
        }
    }

    function goToMainMenu() {
        if (speedBoostTimeout) { // Clear any active speed boost
            clearTimeout(speedBoostTimeout);
            player.speed = originalSpeed;
            speedBoostTimeout = null;
        }
        pauseMenu.style.display = 'none';
        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
        titleScreenDiv.style.display = 'flex'; // CSS handles flex centering for title screen
        gameState = 'title';
    }

    resumeButton.addEventListener('click', resumeGame);
    mainMenuButton.addEventListener('click', goToMainMenu);

    function initGame() {
        if (assetsLoadedCount < totalCoreAssetsToLoad && !assets.background.complete) { // Check background explicitly
            console.warn("Assets not fully loaded yet. Game start might be premature.");
            // Optionally, could add a loading screen or delay
        }

        titleScreenDiv.style.display = 'none';
        canvas.style.display = 'block';
        scoreDisplay.style.display = 'block';
        pauseMenu.style.display = 'none';

        document.getElementById('timerDisplay').style.display = 'block'; // <-- Add here

        score = 0;
        scoreDisplay.textContent = `Score: ${score}`;
        
        // Reset player state using scaled values
        scaleGameObjects(); // Recalculate sizes and groundY first
        player.x = canvas.width / 2 - player.width / 2;
        player.y = player.groundY; // Place on the recalculated ground
        player.isJumping = false;
        player.dy = 0;
        player.direction = 'right';
        player.currentFrame = 0; 
        player.speed = originalSpeed; // Reset to base speed

        moneyItems.length = 0; 
        moneyProps.spawnTimer = 0;
        
        if (speedBoostTimeout) { // Clear any lingering boost from previous game
            clearTimeout(speedBoostTimeout);
            speedBoostTimeout = null;
        }
        
        gameState = 'playing';

        startTimer(); // Start the timer when the game initializes

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // REMOVED: Lines that restricted titleScreenDiv and gameContainer size
    // titleScreenDiv.style.width = canvas.width + 'px';
    // titleScreenDiv.style.height = canvas.height + 'px';
    // document.getElementById('gameContainer').style.width = canvas.width + 'px';
    // document.getElementById('gameContainer').style.height = canvas.height + 'px';

    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');

    leftBtn.addEventListener('touchstart', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowLeft = true; });
    leftBtn.addEventListener('touchend', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowLeft = false; });
    leftBtn.addEventListener('mousedown', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowLeft = true; }); // For desktop testing
    leftBtn.addEventListener('mouseup', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowLeft = false; }); // For desktop testing


    rightBtn.addEventListener('touchstart', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowRight = true; });
    rightBtn.addEventListener('touchend', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowRight = false; });
    rightBtn.addEventListener('mousedown', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowRight = true; }); // For desktop testing
    rightBtn.addEventListener('mouseup', e => { e.preventDefault(); if(gameState === 'playing') keys.ArrowRight = false; }); // For desktop testing

    jumpBtn.addEventListener('touchstart', e => { 
        e.preventDefault(); 
        if(gameState === 'playing') {
            keys.Space = true; 
            player.jump();
        }
    });
    jumpBtn.addEventListener('touchend', e => { e.preventDefault(); if(gameState === 'playing') keys.Space = false; });
    jumpBtn.addEventListener('mousedown', e => { // For desktop testing
        e.preventDefault(); 
        if(gameState === 'playing') {
            keys.Space = true; 
            player.jump();
        }
    });
    jumpBtn.addEventListener('mouseup', e => { e.preventDefault(); if(gameState === 'playing') keys.Space = false; });


    function scaleGameObjects() {
        const gameAreaBottomMargin = canvas.height * 0.13; // Reserve 13% for controls + buffer

        // Player scaling
        player.height = Math.max(40, canvas.height * 0.12); 
        player.width = player.height * playerAspectRatio; 
        player.groundY = canvas.height - player.height - gameAreaBottomMargin; 
        
        // If player somehow ends up below ground after resize (e.g. if height increased a lot)
        if (player.y + player.height > canvas.height - gameAreaBottomMargin || player.y > player.groundY) {
             player.y = player.groundY;
        }


        // Money scaling
        moneyProps.width = Math.max(20, canvas.width * 0.04); 
        moneyProps.height = moneyProps.width; 

        // Potentially scale speeds and forces if desired for consistency across resolutions
        // Example: (not fully implemented here, would need more adjustment)
        // const scaleFactor = canvas.width / 800; // Compare to original design width
        // player.speed = originalSpeed * scaleFactor;
        // moneyProps.speed = originalMoneySpeed * scaleFactor;
        // player.jumpPower = originalJumpPower * scaleFactor;
        // player.gravity = originalGravity * scaleFactor;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Initial groundY based on new canvas height, player height might still be old value here
        // player.groundY = canvas.height - player.height - (canvas.height * 0.12); 
        // if (player.y > player.groundY) player.y = player.groundY;

        scaleGameObjects(); // This will correctly set player height and then groundY

        // If game is playing, re-center player or adjust position if needed
        if (gameState === 'playing' && (player.x > canvas.width - player.width || player.x < 0)) {
             // player.x = canvas.width / 2 - player.width / 2; // Option: re-center
        }
        // No need to redraw here, game loop will handle it
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial call to set correct sizes

    let timer = 120; // seconds
    let timerInterval = null;
    let highscores = JSON.parse(localStorage.getItem('highscores')) || [];

    function startTimer() {
        timer = 120;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timer--;
            updateTimerDisplay();
            if (timer <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const min = Math.floor(timer / 60);
        const sec = timer % 60;
        document.getElementById('timerDisplay').textContent = `Time: ${min}:${sec.toString().padStart(2, '0')}`;
    }
    if (timerInterval) clearInterval(timerInterval);
    startTimer();

    function endGame() {
        gameState = 'gameover';
        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
        document.getElementById('timerDisplay').style.display = 'none';

        if (!highscoreEntered) {
            // Check for highscore
            let place = highscores.findIndex(hs => score > hs.score);
            if (place === -1 && highscores.length < 3) place = highscores.length;
            if (place !== -1) {
                let initials = prompt("NEW HIGH SCORE! Enter your initials (3 letters):", "");
                initials = (initials || "???").substring(0,3).toUpperCase();
                highscores.splice(place, 0, { initials, score });
                highscores = highscores.slice(0, 3); // Keep top 3
                localStorage.setItem('highscores', JSON.stringify(highscores));
            }
            highscoreEntered = true;
        }
        showHighscores(true); // Pass true to show "Try Again" prompt
    }

    function showHighscores(askRetry = false) {
        let msg = "HIGHSCORES:\n";
        highscores.forEach((hs, i) => {
            msg += `${i+1}. ${hs.initials} - ${hs.score}\n`;
        });
        if (askRetry) {
            msg += "\nPlay again?";
            if (confirm(msg)) {
                highscoreEntered = false; // Reset for next game
                initGame();
            } else {
                location.reload();
            }
        } else {
            alert(msg);
        }
    }

    let highscoreEntered = false; // Add at the top with your other globals

    const viewHighscoresButton = document.getElementById('viewHighscoresButton');
    viewHighscoresButton.addEventListener('click', () => showHighscores());
});