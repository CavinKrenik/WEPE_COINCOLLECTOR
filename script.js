window.addEventListener('load', function () {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const titleScreenDiv = document.getElementById('titleScreen');
    const titleImageEl = document.getElementById('titleImage');
    const startButton = document.getElementById('startButton');
    const startButtonImageEl = document.getElementById('startButtonImage');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const timerDisplay = document.getElementById('timerDisplay');
    const pauseMenu = document.getElementById('pauseMenu');
    const resumeButton = document.getElementById('resumeButton');
    const mainMenuButton = document.getElementById('mainMenuButton');
    const pauseViewHighscoresButton = document.getElementById('pauseViewHighscoresButton');
    const viewHighscoresButton = document.getElementById('viewHighscoresButton'); // For title screen
    const touchControlsDiv = document.getElementById('touchControls');
    const bgMusic = document.getElementById('bgMusic');

    // --- Game Configuration ---
    canvas.width = 800; // Default, will be resized
    canvas.height = 600; // Default, will be resized

    let score = 0;
    let gameState = 'title'; // 'title', 'playing', 'paused', 'gameOver'
    let animationFrameId;
    let highscoreEntered = false; // Flag to ensure highscore prompt appears only once per game end

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
        // startButton: startButtonImageEl // This was a reference, but we primarily use startButtonImageEl directly
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
    const totalCoreAssetsToLoad = 8; // background, btc, 2x left, 2x right, jumpL, jumpR

    function coreAssetLoaded() {
        assetsLoadedCount++;
        console.log(`Asset loaded. Count: ${assetsLoadedCount} / ${totalCoreAssetsToLoad}`);

        if (assetsLoadedCount === totalCoreAssetsToLoad) {
            console.log("All core game assets (JS-loaded) are loaded. Setting up start button...");

            startButton.removeEventListener('click', initGame);
            startButtonImageEl.removeEventListener('click', initGame);

            console.log("Start button image ('startButtonImageEl') details:", {
                src: startButtonImageEl.src,
                complete: startButtonImageEl.complete,
                naturalWidth: startButtonImageEl.naturalWidth,
                naturalHeight: startButtonImageEl.naturalHeight,
                looksLoaded: startButtonImageEl.complete && startButtonImageEl.naturalHeight > 0 && startButtonImageEl.naturalWidth > 0
            });

            if (startButtonImageEl.src && startButtonImageEl.complete && startButtonImageEl.naturalHeight > 0 && startButtonImageEl.naturalWidth > 0) {
                console.log("Attempting to use IMAGE start button (start.png).");
                startButton.style.display = 'none';
                startButtonImageEl.style.display = 'block';
                startButtonImageEl.addEventListener('click', initGame);
            } else {
                console.log("Attempting to use TEXT start button. 'start.png' image failed to load or has no dimensions.");
                startButton.style.display = 'block';
                startButtonImageEl.style.display = 'none';
                startButton.addEventListener('click', initGame);
            }
        } else if (assetsLoadedCount > totalCoreAssetsToLoad) {
            console.warn("assetsLoadedCount has exceeded totalCoreAssetsToLoad. Check asset loading logic.");
        }
    }

    // Assign onload handlers for JS-loaded assets
    assets.background.onload = coreAssetLoaded;
    assets.btc.onload = coreAssetLoaded;
    assets.player.left[0].onload = coreAssetLoaded;
    assets.player.left[1].onload = coreAssetLoaded;
    assets.player.right[0].onload = coreAssetLoaded;
    assets.player.right[1].onload = coreAssetLoaded;
    assets.player.jumpLeft.onload = coreAssetLoaded;
    assets.player.jumpRight.onload = coreAssetLoaded;

    // Set sources for JS-loaded assets
    assets.background.src = assetSources.background;
    assets.btc.src = assetSources.btc;
    assets.player.left[0].src = assetSources.playerLeft1;
    assets.player.left[1].src = assetSources.playerLeft2;
    assets.player.right[0].src = assetSources.playerRight1;
    assets.player.right[1].src = assetSources.playerRight2;
    assets.player.jumpLeft.src = assetSources.playerJumpLeft;
    assets.player.jumpRight.src = assetSources.playerJumpRight;

    // --- Player Object ---
    const playerBaseWidth = 80;
    const playerBaseHeight = 100;
    const playerAspectRatio = playerBaseWidth / playerBaseHeight;

    const player = {
        width: playerBaseWidth,
        height: playerBaseHeight,
        x: canvas.width / 2 - playerBaseWidth / 2,
        y: canvas.height - playerBaseHeight - (canvas.height * 0.12),
        speed: 5,
        dx: 0,
        dy: 0,
        gravity: 0.8,
        jumpPower: -15,
        isJumping: false,
        canDoubleJump: true,
        groundY: canvas.height - playerBaseHeight - (canvas.height * 0.12),
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
                // Fallback drawing if image isn't ready
                ctx.fillStyle = 'green';
                ctx.fillRect(this.x, this.y, this.width, this.height);
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
        },
        update() {
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

            // Jumping and Gravity
            if (this.isJumping) {
                this.dy += this.gravity;
                this.y += this.dy;
                if (this.y >= this.groundY) {
                    this.y = this.groundY;
                    this.isJumping = false;
                    this.dy = 0;
                    this.canDoubleJump = true; // Reset double jump when landing
                }
            }

            // Screen wrapping
            if (this.x + this.width < 0) {
                this.x = canvas.width;
            } else if (this.x > canvas.width) {
                this.x = -this.width;
            }
        }
    };

    let originalSpeed = player.speed;
    let speedBoostTimeout = null;

    // --- Money Object ---
    const moneyItems = [];
    const moneyProps = {
        baseWidth: 40,
        width: 40,
        height: 40,
        speed: 3,
        spawnInterval: 90, // Frames
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

            // Collision detection with player
            if (
                money.x < player.x + player.width &&
                money.x + money.width > player.x &&
                money.y < player.y + player.height &&
                money.y + money.height > player.y
            ) {
                moneyItems.splice(i, 1);
                score++;
                scoreDisplay.textContent = `Score: ${score}`;

                // Speed boost logic
                if (score > 0 && score % 5 === 0) {
                    if (speedBoostTimeout !== null) {
                        clearTimeout(speedBoostTimeout);
                    }
                    player.speed = player.speed * 3.1 > originalSpeed * 2 ? originalSpeed * 2 : player.speed * 1.3;
                    console.log("Speed Boost!", player.speed);
                    speedBoostTimeout = setTimeout(() => {
                        player.speed = originalSpeed;
                        speedBoostTimeout = null;
                        console.log("Speed normal.", player.speed);
                    }, 3000); // 3 second boost
                }

                // Add chart step for collected coin
                addChartStep(true);
            }
            // Remove money if it goes off screen
            else if (money.y > canvas.height) {
                moneyItems.splice(i, 1);
                addChartStep(false); // Add red step for missed coin
            }
        }
    }

    function drawMoney() {
        moneyItems.forEach(money => {
            if (assets.btc && assets.btc.complete && assets.btc.naturalHeight !== 0) {
                ctx.drawImage(assets.btc, money.x, money.y, money.width, money.height);
            } else {
                // Fallback drawing
                ctx.fillStyle = 'gold';
                ctx.fillRect(money.x, money.y, money.width, money.height);
            }
        });
    }

    // --- Input Handling ---
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

        if (gameState === 'playing') {
            if (e.code === "ArrowLeft") keys.ArrowLeft = true;
            if (e.code === "ArrowRight") keys.ArrowRight = true;
            if (e.code === "Space") {
                player.jump(); // Always call jump on space
            }
            if (e.code === "Space" || e.code.startsWith("Arrow")) {
                e.preventDefault(); // Prevent page scrolling
            }
        } else if (gameState === 'title' && (e.code === "Enter" || e.code === "Space")) {
            initGame();
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

    // --- Game Loop ---
    function gameLoop() {
        if (gameState !== 'playing') return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (assets.background && assets.background.complete && assets.background.naturalHeight !== 0) {
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#87CEEB'; // Fallback background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw chart steps (candlestick chart) - MOVED TO BE BEHIND PLAYER
        chartSteps.forEach(step => {
            const img = step.color === 'green' ? assets.greensteplarge : assets.redsteplarge;
            if (img && img.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, step.x, step.y, chartStepWidth, chartStepHeight);
            } else {
                ctx.fillStyle = step.color === 'green' ? 'green' : 'red';
                ctx.fillRect(step.x, step.y, chartStepWidth, chartStepHeight);
            }
        });

        processInputForMovement();
        player.update();
        player.draw();

        updateMoney();
        drawMoney();

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Game State Management ---
    function pauseGame() {
        if (gameState === 'playing') {
            gameState = 'paused';
            pauseMenu.style.display = 'flex';
            if (timerInterval) { // Pause the timer logic by not decrementing
                // The interval itself keeps running but startTimer's callback checks gameState
            }
            console.log("Game paused. gameState:", gameState);
        }
    }

    function resumeGame() {
        if (gameState === 'paused') {
            gameState = 'playing';
            pauseMenu.style.display = 'none';
            // Timer will resume decrementing as gameState is 'playing'
            animationFrameId = requestAnimationFrame(gameLoop); // Restart game loop
            console.log("Game resumed. gameState:", gameState);
        }
    }

    function goToMainMenu() {
        console.log("goToMainMenu called");
        if (speedBoostTimeout) {
            clearTimeout(speedBoostTimeout);
            player.speed = originalSpeed;
            speedBoostTimeout = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        pauseMenu.style.display = 'none';
        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
        timerDisplay.style.display = 'none';
        touchControlsDiv.style.display = 'flex'; // Show for title if applicable, CSS might hide for desktop
        titleScreenDiv.style.display = 'flex';
        if (viewHighscoresButton) viewHighscoresButton.style.display = 'block'; // Show title screen high score button

        if (bgMusic) {
            bgMusic.volume = 0.5; // Optional: set volume
            bgMusic.currentTime = 0;
            bgMusic.play();
        }

        gameState = 'title';
        console.log("gameState changed to 'title'");
    }

    function initGame() {
        console.log("initGame function has been CALLED.");
        highscoreEntered = false; // Reset for this game session

        if (assetsLoadedCount < totalCoreAssetsToLoad && !assets.background.complete) {
            console.warn("Assets not fully loaded yet. Game start might be premature.");
            // Optionally, could add a loading screen or delay here
        }

        titleScreenDiv.style.display = 'none';
        if (viewHighscoresButton) viewHighscoresButton.style.display = 'none'; // Hide title screen high score button
        canvas.style.display = 'block';
        scoreDisplay.style.display = 'block';
        timerDisplay.style.display = 'block';
        pauseMenu.style.display = 'none';
        touchControlsDiv.style.display = 'flex'; // Show touch controls

        score = 0;
        scoreDisplay.textContent = `Score: ${score}`;

        scaleGameObjects(); // Recalculate sizes and groundY first
        player.x = canvas.width / 2 - player.width / 2;
        player.y = player.groundY;
        player.isJumping = false;
        player.dy = 0;
        player.dx = 0; // Ensure player is stationary at start
        player.direction = 'right';
        player.currentFrame = 0;
        player.speed = originalSpeed;

        moneyItems.length = 0;
        moneyProps.spawnTimer = 0;

        if (speedBoostTimeout) {
            clearTimeout(speedBoostTimeout);
            speedBoostTimeout = null;
        }

        gameState = 'playing';
        console.log("gameState changed to 'playing'");

        startTimer();

        if (bgMusic) {
            bgMusic.volume = 0.5;
            bgMusic.currentTime = 0;
            bgMusic.play();
        }

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);

        // Reset chart steps for new game
        chartSteps.length = 0;
        chartCurrentX = 0;
        chartCurrentY = chartBaseY;
    }

    // Event listeners for pause menu buttons
    resumeButton.addEventListener('click', resumeGame);
    mainMenuButton.addEventListener('click', goToMainMenu);
    if (pauseViewHighscoresButton) {
        pauseViewHighscoresButton.addEventListener('click', () => {
            console.log("Pause menu 'View High Scores' clicked.");
            showHighscores(false); // false means don't ask to play again
        });
    }
    // Event listener for title screen high score button
    if (viewHighscoresButton) {
        viewHighscoresButton.addEventListener('click', () => {
            console.log("Title screen 'View High Scores' clicked.");
            showHighscores(false);
        });
    }


    // --- Touch Controls ---
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const joystickArea = document.getElementById('joystickArea');
    const joystickBase = document.getElementById('joystickBase');
    const joystickKnob = document.getElementById('joystickKnob');

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
        let dx = touch.clientX - joystickStart.x;
        let dy = touch.clientY - joystickStart.y;
        const maxDist = 40;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxDist) {
            dx = dx * maxDist / dist;
            dy = dy * maxDist / dist;
        }
        moveKnob(dx, dy);

        // Set movement keys
        if (dx < -10) {
            keys.ArrowLeft = true;
            keys.ArrowRight = false;
        } else if (dx > 10) {
            keys.ArrowLeft = false;
            keys.ArrowRight = true;
        } else {
            keys.ArrowLeft = false;
            keys.ArrowRight = false;
        }
        e.preventDefault();
    }, { passive: false });

    joystickArea.addEventListener('touchend', function(e) {
        joystickActive = false;
        moveKnob(0, 0);
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
        e.preventDefault();
    }, { passive: false });

    function moveKnob(dx, dy) {
        joystickKnob.style.left = (25 + dx) + 'px';
        joystickKnob.style.top = (25 + dy) + 'px';
    }

    // Jump button
    jumpBtn.addEventListener('touchstart', function(e) {
        if (gameState === 'playing') player.jump();
        e.preventDefault();
    });


    // --- Scaling and Resizing ---
    function scaleGameObjects() {
        const gameAreaBottomMargin = canvas.height * 0.13;

        player.height = Math.max(40, canvas.height * 0.12);
        player.width = player.height * playerAspectRatio;
        player.groundY = canvas.height - player.height - gameAreaBottomMargin;

        if (player.y + player.height > canvas.height - gameAreaBottomMargin || player.y > player.groundY) {
            player.y = player.groundY;
        }

        moneyProps.width = Math.max(20, canvas.width * 0.04);
        moneyProps.height = moneyProps.width;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        scaleGameObjects();
        // If game is playing and player is off screen due to resize, you might want to reposition
        if (gameState === 'playing') {
            if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
            if (player.x < 0) player.x = 0;
            if (player.y > player.groundY) player.y = player.groundY; // Ensure on ground
        }
        // No explicit redraw needed here as gameLoop handles it if active, or title screen is static
    }
    window.addEventListener('resize', resizeCanvas);

    // --- Timer ---
    let timer = 60; // seconds
    let timerInterval = null;

    function startTimer() {
        console.log("startTimer called");
        timer = 60; // Reset timer duration
        updateTimerDisplay();
        if (timerInterval) {
            clearInterval(timerInterval); // Clear existing interval
        }
        timerInterval = setInterval(() => {
            if (gameState !== 'playing') { // Only decrement if game is actively playing
                return;
            }
            timer--;
            updateTimerDisplay();
            if (timer <= 0) {
                endGame(); // No need to clear interval here, endGame will do it
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const min = Math.floor(timer / 60);
        const sec = timer % 60;
        timerDisplay.textContent = `Time: ${min}:${sec.toString().padStart(2, '0')}`;
    }

    // --- High Scores & Game End ---
    let highscores = JSON.parse(localStorage.getItem('highscores')) || [];

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

        if (gameState === 'gameover') {
            console.log("endGame called but already in gameover state.");
            return;
        }
        gameState = 'gameover';
        console.log("gameState changed to 'gameover'");

        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
        timerDisplay.style.display = 'none';
        touchControlsDiv.style.display = 'none';

        // Automatically transition to Level 2 (IMMEDIATE)
        window.location.href = "leveltwo/level2.html";

        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
    }

    function showHighscores(askRetry = false) {
        console.log("showHighscores called. askRetry:", askRetry);
        let currentHighscores = JSON.parse(localStorage.getItem('highscores')) || [];
        let msg = "HIGH SCORES:\n";
        if (currentHighscores.length === 0) {
            msg += "No scores yet!\n";
        } else {
            currentHighscores.forEach((hs, i) => {
                msg += `${i + 1}. ${hs.initials} - ${hs.score}\n`;
            });
        }

        if (askRetry) {
            msg += "\nPlay again?";
            if (confirm(msg)) {
                console.log("'Play again' confirmed.");
                // highscoreEntered = false; // This is reset in initGame()
                initGame();
            } else {
                console.log("'Play again' declined.");
                goToMainMenu();
            }
        } else {
            alert(msg);
        }
    }

    // --- Initial Setup ---
    console.log("Setting up initial game view.");
    resizeCanvas(); // Set initial canvas size
    goToMainMenu(); // Start on the title screen

    // --- Music Toggle Button ---
    const toggleMusicButton = document.getElementById('toggleMusicButton');
    if (toggleMusicButton && bgMusic) {
        toggleMusicButton.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play();
                toggleMusicButton.textContent = "Pause Music";
            } else {
                bgMusic.pause();
                toggleMusicButton.textContent = "Play Music";
            }
        });

        // Set initial button text
        toggleMusicButton.textContent = bgMusic.paused ? "Play Music" : "Pause Music";
    }

    // --- Charting (NEW FEATURE) ---
    const chartSteps = []; // Each entry: { x, y, color: 'green'|'red' }
    const chartStepWidth = 40; // Adjust as needed
    const chartStepHeight = 80; // Adjust as needed
    const chartBaseY = canvas.height - chartStepHeight - 10; // 10px above bottom
    let chartCurrentX = 0;
    let chartCurrentY = chartBaseY;

    function addChartStep(isGreen) {
        chartSteps.push({
            x: chartCurrentX,
            y: chartCurrentY,
            color: isGreen ? 'green' : 'red'
        });
        chartCurrentX += chartStepWidth;
        // Move up for green, down for red
        if (isGreen) {
            chartCurrentY -= chartStepHeight / 2;
        } else {
            chartCurrentY += chartStepHeight / 2;
        }
    }

    // Drop a green step for collected coin
    chartSteps.push({
        x: chartCurrentX,
        y: chartCurrentY - chartStepHeight / 2, // Up by half step
        color: 'green'
    });
    chartCurrentX += chartStepWidth;
    chartCurrentY -= chartStepHeight / 2;

    // Drop a red step for missed coin
    chartSteps.push({
        x: chartCurrentX,
        y: chartCurrentY + chartStepHeight / 2, // Down by half step
        color: 'red'
    });
    chartCurrentX += chartStepWidth;
    chartCurrentY += chartStepHeight / 2;

    chartSteps.length = 0;
    chartCurrentX = 0;
    chartCurrentY = chartBaseY;

    addChartStep(true); // Green step for collected coin
    addChartStep(false); // Red step for missed coin
});