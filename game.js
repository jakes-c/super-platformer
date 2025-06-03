// Enhanced Platformer Game - JavaScript Part 1
// Game setup and canvas initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match your CSS
canvas.width = 1000;
canvas.height = 500;

// Asset Management System
const assets = {
    images: {},
    sounds: {},
    loaded: 0,
    total: 0,
    ready: false
};

// Fallback image creation for missing assets
function createFallbackImage(width, height, color) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    return canvas;
}

// Enhanced image sources with fallback support
const imageSources = {
    player: {
        idle: 'images/player.png',  // or your specific idle sprite
        run: 'images/player.png',   // you can use the same image for now
        jump: 'images/player.png'   // or create separate sprites
    },
    enemy: {
        red: 'images/enemy.png',     // your enemy.png file
        purple: 'images/enemy.png',  // you can use the same image or create variants
        pink: 'images/enemy.png'
    },
    coin: 'images/coin.png',
    // ... rest of your image sources

    goal: 'images/goal_flag.png',
    particles: {
        coin: 'images/particle_gold.png',
        hit: 'images/particle_red.png'
    }
};

// Audio Management
let audioMuted = false;
const audioElements = {
    jump: document.getElementById('jumpSound'),
    coin: document.getElementById('coinSound'),
    enemyHit: document.getElementById('enemyHitSound'),
    levelComplete: document.getElementById('levelCompleteSound'),
    gameOver: document.getElementById('gameOverSound'),
    backgroundMusic: document.getElementById('backgroundMusicGround') // Changed from 'backgroundMusic'
};

// Enhanced Game State
let gameState = {
    score: 0,
    lives: 3,
    currentLevel: 1,
    gameRunning: false,
    keys: {},
    camera: { x: 0, y: 0 },
    screenShake: 0,
    currentScreen: 'start' // start, instructions, game, gameOver, levelComplete, gameWon
};

// Enhanced Player object with better animation
const player = {
    x: 50,
    y: 350,
    width: 62,
    height: 70,
    velX: 0,
    velY: 0,
    speed: 5,
    jumpPower: 15,
    grounded: false,
    color: '#FF6B6B',
    animState: 'idle',
    animFrame: 0,
    animTimer: 0,
    direction: 1, // 1 for right, -1 for left
    invulnerable: false,
    invulnerabilityTimer: 0
};

// Game objects arrays
let platforms = [];
let enemies = [];
let coins = [];
let particles = [];
let goal = {};

// Asset Loading Functions
async function loadAssets() {
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingText = document.getElementById('loadingText');
    
    // Show loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    // Count total assets
    let totalAssets = 0;
    function countAssets(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                totalAssets++;
            } else if (typeof obj[key] === 'object') {
                countAssets(obj[key]);
            }
        }
    }
    countAssets(imageSources);
    
    let loadedAssets = 0;
    
    // Load images recursively
    async function loadImagesRecursive(sources, target) {
        for (let key in sources) {
            if (typeof sources[key] === 'string') {
                if (loadingText) {
                    loadingText.textContent = `Loading ${key}...`;
                }
                
                try {
                    target[key] = await loadImage(sources[key]);
                    console.log(`Successfully loaded image: ${key}`);
                } catch (error) {
                    console.error(`Failed to load image ${key}:`, error);
                    // Use fallback image
                    target[key] = createFallbackImage(32, 32, '#CCCCCC');
                }
                
                loadedAssets++;
                const progress = (loadedAssets / totalAssets) * 100;
                if (loadingProgress) {
                    loadingProgress.style.width = `${progress}%`;
                }
                
                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 50));
            } else if (typeof sources[key] === 'object') {
                target[key] = {};
                await loadImagesRecursive(sources[key], target[key]);
            }
        }
    }
    
    try {
        await loadImagesRecursive(imageSources, assets.images);
        console.log('All images loaded successfully');
    } catch (error) {
        console.error('Error loading images:', error);
    }
    
    // Setup audio with error handling
    Object.keys(audioElements).forEach(key => {
        const audioElement = audioElements[key];
        if (audioElement && audioElement.tagName === 'AUDIO') {
            assets.sounds[key] = audioElement;
            assets.sounds[key].volume = key === 'backgroundMusic' ? 0.3 : 0.5;
            
            // Add error handling for audio loading
            audioElement.addEventListener('error', (e) => {
                console.warn(`Failed to load audio: ${key}`, e);
            });
        } else {
            console.warn(`Audio element not found: ${key}`);
        }
    });
    
    if (loadingText) {
        loadingText.textContent = 'Ready to play!';
    }
    if (loadingProgress) {
        loadingProgress.style.width = '100%';
    }
    
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        assets.ready = true;
        showStartScreen();
    }, 800);
}
// Debug function - add after loadAssets function
function debugAssets() {
    console.log('=== ASSET DEBUG ===');
    console.log('Audio elements found:');
    Object.keys(audioElements).forEach(key => {
        const element = audioElements[key];
        console.log(`${key}:`, element ? 'Found' : 'Missing', element?.src || 'No src');
    });
    
    console.log('Images to load:');
    console.log(imageSources);
    
    console.log('Assets ready:', assets.ready);
    console.log('=================');
}

// Call this in browser console: debugAssets()

// Audio functions with better error handling
function playSound(soundName) {
    if (!audioMuted && assets.sounds[soundName]) {
        try {
            const audio = assets.sounds[soundName];
            audio.currentTime = 0;
            
            // Create a promise-based play with better error handling
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log(`Audio play failed for ${soundName}:`, error.message);
                    // Don't throw error, just log it
                });
            }
        } catch (error) {
            console.log(`Audio error for ${soundName}:`, error.message);
        }
    } else if (!assets.sounds[soundName]) {
        console.warn(`Sound not found: ${soundName}`);
    }
}
// Function to handle audio context resume (needed for some browsers)
function resumeAudioContext() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || webkitAudioContext;
        if (!window.gameAudioContext) {
            window.gameAudioContext = new AudioContextClass();
        }
        
        if (window.gameAudioContext.state === 'suspended') {
            window.gameAudioContext.resume().then(() => {
                console.log('Audio context resumed');
            }).catch(err => {
                console.log('Failed to resume audio context:', err);
            });
        }
    }
}

// Call this on first user interaction
document.addEventListener('click', resumeAudioContext, { once: true });
document.addEventListener('keydown', resumeAudioContext, { once: true });
function toggleMute() {
    audioMuted = !audioMuted;
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = audioMuted ? '🔇' : '🔊';
    
    if (audioMuted) {
        if (assets.sounds.backgroundMusic) {
            assets.sounds.backgroundMusic.pause();
        }
    } else {
        if (gameState.gameRunning && assets.sounds.backgroundMusic) {
            assets.sounds.backgroundMusic.play().catch(e => 
                console.log('Background music failed:', e)
            );
        }
    }
}

// Screen management functions
function showStartScreen() {
    gameState.currentScreen = 'start';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
    hideAllModals();
}

function showInstructions() {
    gameState.currentScreen = 'instructions';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('instructionsScreen').style.display = 'flex';
}

function backToStart() {
    document.getElementById('instructionsScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('gameWon').style.display = 'none';
    showStartScreen();
}

function hideAllModals() {
    const modals = ['gameOver', 'levelComplete', 'gameWon', 'instructionsScreen'];
    modals.forEach(modal => {
        document.getElementById(modal).style.display = 'none';
    });
}

function startGame() {
    gameState.currentScreen = 'game';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('instructionsScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    hideAllModals();
    
    // Initialize game
    initGame();
}
// Enhanced Platformer Game - JavaScript Part 2
// Level configurations with enhanced enemy types and better layouts
const levels = {
    1: {
        theme: 'forest',
        platforms: [
            {x: 0, y: 450, width: 300, height: 50},
            {x: 400, y: 400, width: 150, height: 20},
            {x: 650, y: 350, width: 150, height: 20},
            {x: 900, y: 300, width: 200, height: 20},
            {x: 1200, y: 250, width: 150, height: 20},
            {x: 1450, y: 450, width: 300, height: 50}
        ],
        enemies: [
            {x: 450, y: 360, width: 30, height: 30, velX: -1, type: 'red', platform: 1},
            {x: 950, y: 260, width: 30, height: 30, velX: 1, type: 'red', platform: 3},
            {x: 1500, y: 410, width: 30, height: 30, velX: -1, type: 'red', platform: 5}
        ],
        coins: [
            {x: 470, y: 360, width: 20, height: 20, animFrame: 0},
            {x: 700, y: 310, width: 20, height: 20, animFrame: 0},
            {x: 950, y: 220, width: 20, height: 20, animFrame: 0},
            {x: 1250, y: 210, width: 20, height: 20, animFrame: 0},
            {x: 1550, y: 410, width: 20, height: 20, animFrame: 0}
        ],
        goal: {x: 1600, y: 380, width: 40, height: 70}
    },
    2: {
        theme: 'desert',
        platforms: [
            {x: 0, y: 450, width: 300, height: 50},
            {x: 400, y: 400, width: 150, height: 20},
            {x: 650, y: 330, width: 150, height: 20},
            {x: 900, y: 280, width: 150, height: 20},
            {x: 1150, y: 350, width: 150, height: 20},
            {x: 1400, y: 300, width: 150, height: 20},
            {x: 1650, y: 450, width: 300, height: 50}
        ],
        enemies: [
            {x: 450, y: 360, width: 30, height: 30, velX: -0.8, type: 'purple', platform: 1},
            {x: 950, y: 240, width: 30, height: 30, velX: 0.8, type: 'purple', platform: 3},
            {x: 1200, y: 310, width: 30, height: 30, velX: -0.8, type: 'purple', platform: 4},
            {x: 1750, y: 410, width: 30, height: 30, velX: -0.8, type: 'purple', platform: 6}
        ],
        coins: [
            {x: 470, y: 360, width: 20, height: 20, animFrame: 0},
            {x: 700, y: 290, width: 20, height: 20, animFrame: 0},
            {x: 950, y: 240, width: 20, height: 20, animFrame: 0},
            {x: 1200, y: 310, width: 20, height: 20, animFrame: 0},
            {x: 1450, y: 260, width: 20, height: 20, animFrame: 0},
            {x: 1800, y: 410, width: 20, height: 20, animFrame: 0}
        ],
        goal: {x: 1850, y: 380, width: 40, height: 70}
    },
    3: {
        theme: 'space',
        platforms: [
            {x: 0, y: 450, width: 250, height: 50},
            {x: 350, y: 380, width: 120, height: 20},
            {x: 550, y: 320, width: 120, height: 20},
            {x: 750, y: 250, width: 120, height: 20},
            {x: 950, y: 180, width: 120, height: 20},
            {x: 1150, y: 250, width: 120, height: 20},
            {x: 1350, y: 320, width: 120, height: 20},
            {x: 1550, y: 380, width: 120, height: 20},
            {x: 1750, y: 300, width: 120, height: 20},
            {x: 1950, y: 450, width: 300, height: 50}
        ],
        enemies: [
            {x: 380, y: 340, width: 30, height: 30, velX: -1.2, type: 'pink', platform: 1},
            {x: 580, y: 280, width: 30, height: 30, velX: 1.2, type: 'pink', platform: 2},
            {x: 980, y: 140, width: 30, height: 30, velX: -1.2, type: 'pink', platform: 4},
            {x: 1180, y: 210, width: 30, height: 30, velX: 1.2, type: 'pink', platform: 5},
            {x: 1580, y: 340, width: 30, height: 30, velX: -1.2, type: 'pink', platform: 7},
            {x: 2050, y: 410, width: 30, height: 30, velX: -1.2, type: 'pink', platform: 9}
        ],
        coins: [
            {x: 400, y: 340, width: 20, height: 20, animFrame: 0},
            {x: 600, y: 280, width: 20, height: 20, animFrame: 0},
            {x: 800, y: 210, width: 20, height: 20, animFrame: 0},
            {x: 1000, y: 140, width: 20, height: 20, animFrame: 0},
            {x: 1200, y: 210, width: 20, height: 20, animFrame: 0},
            {x: 1400, y: 280, width: 20, height: 20, animFrame: 0},
            {x: 1600, y: 340, width: 20, height: 20, animFrame: 0},
            {x: 1800, y: 260, width: 20, height: 20, animFrame: 0}
        ],
        goal: {x: 2100, y: 380, width: 40, height: 70}
    }
};

// Screen shake effect
function addScreenShake(intensity = 10) {
    gameState.screenShake = intensity;
    // Add screen shake CSS class for additional effect
    document.body.classList.add('screen-shake');
    setTimeout(() => {
        document.body.classList.remove('screen-shake');
    }, 500);
}

// Initialize level with theme switching
function initLevel(levelNum) {
    const level = levels[levelNum];
    if (!level) return;
    
    platforms = [...level.platforms];
    enemies = [...level.enemies];
    coins = [...level.coins];
    goal = {...level.goal};
    
    // Update body class for theme
    document.body.className = `level-${levelNum}`;
    
    // Add animation frames to coins
    coins.forEach(coin => coin.animFrame = Math.random() * 60);
    
    // Reset player position
    player.x = 50;
    player.y = 350;
    player.velX = 0;
    player.velY = 0;
    player.animState = 'idle';
    player.invulnerable = false;
    player.invulnerabilityTimer = 0;
    gameState.camera.x = 0;
    gameState.screenShake = 0;
}

// Enhanced Input handling
document.addEventListener('keydown', (e) => {
    gameState.keys[e.code] = true;
    
    // Prevent default for game keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
    
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

// Enhanced Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// More precise platform collision
function checkPlatformCollision(player, platform) {
    if (checkCollision(player, platform)) {
        // Check if player is falling onto platform from above
        if (player.velY > 0 && player.y < platform.y) {
            return 'top';
        }
        // Check side collisions
        else if (player.x + player.width/2 < platform.x) {
            return 'left';
        }
        else if (player.x + player.width/2 > platform.x + platform.width) {
            return 'right';
        }
    }
    return false;
}

// Enhanced particle system
function createParticles(x, y, type = 'hit', count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            velX: (Math.random() - 0.5) * 12,
            velY: Math.random() * -10 - 2,
            life: 30 + Math.random() * 20,
            maxLife: 30 + Math.random() * 20,
            type: type,
            size: Math.random() * 6 + 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3
        });
    }
}

// Update particles with rotation
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.velX;
        particle.y += particle.velY;
        particle.velY += 0.4; // gravity
        particle.velX *= 0.98; // air resistance
        particle.rotation += particle.rotationSpeed;
        particle.life--;
        return particle.life > 0;
    });
}

// Player animation system
function updatePlayerAnimation() {
    player.animTimer++;
    
    if (player.grounded) {
        if (Math.abs(player.velX) > 0.5) {
            player.animState = 'run';
            if (player.animTimer % 6 === 0) { // Faster animation
                player.animFrame = (player.animFrame + 1) % 4;
            }
        } else {
            player.animState = 'idle';
            if (player.animTimer % 40 === 0) { // Slower idle animation
                player.animFrame = (player.animFrame + 1) % 2;
            }
        }
    } else {
        player.animState = 'jump';
        player.animFrame = player.velY < 0 ? 0 : 1; // Different frame for up/down
    }
    
    // Update direction
    if (player.velX > 0.5) player.direction = 1;
    else if (player.velX < -0.5) player.direction = -1;
}

// Enhanced player invulnerability
function updatePlayerInvulnerability() {
    if (player.invulnerable) {
        player.invulnerabilityTimer--;
        if (player.invulnerabilityTimer <= 0) {
            player.invulnerable = false;
        }
    }
}
// Enhanced Platformer Game - JavaScript Part 3
// Enhanced Player physics with better movement
function updatePlayer() {
    if (!gameState.gameRunning) return;
    
    // Update invulnerability
    updatePlayerInvulnerability();
    
    // Horizontal movement with acceleration
    const acceleration = 0.8;
    const maxSpeed = player.speed;
    const friction = 0.85;
    
    if (gameState.keys['ArrowLeft']) {
        player.velX = Math.max(player.velX - acceleration, -maxSpeed);
    } else if (gameState.keys['ArrowRight']) {
        player.velX = Math.min(player.velX + acceleration, maxSpeed);
    } else {
        player.velX *= friction; // Apply friction
        if (Math.abs(player.velX) < 0.1) player.velX = 0;
    }
    
    // Jumping with coyote time
    if (gameState.keys['Space'] && (player.grounded || player.coyoteTime > 0)) {
        player.velY = -player.jumpPower;
        player.grounded = false;
        player.coyoteTime = 0;
        playSound('jump');
    }
    
    // Coyote time - allow jumping briefly after leaving platform
    if (player.grounded) {
        player.coyoteTime = 8;
    } else if (player.coyoteTime > 0) {
        player.coyoteTime--;
    }
    
    // Enhanced gravity with terminal velocity
    const gravity = 0.8;
    const terminalVelocity = 16;
    
    player.velY += gravity;
    if (player.velY > terminalVelocity) player.velY = terminalVelocity;
    
    // Update position
    const oldX = player.x;
    const oldY = player.y;
    
    player.x += player.velX;
    player.y += player.velY;
    
    // Update animation
    updatePlayerAnimation();
    
    // Enhanced platform collision
    player.grounded = false;
    
    platforms.forEach(platform => {
        const collision = checkPlatformCollision(player, platform);
        
        if (collision === 'top') {
            player.y = platform.y - player.height;
            player.velY = 0;
            player.grounded = true;
        } else if (collision === 'left' && player.velX > 0) {
            player.x = platform.x - player.width;
            player.velX = 0;
        } else if (collision === 'right' && player.velX < 0) {
            player.x = platform.x + platform.width;
            player.velX = 0;
        }
    });
    
    // Screen boundaries
    if (player.x < 0) {
        player.x = 0;
        player.velX = 0;
    }
    
    // Death by falling
    if (player.y > canvas.height + 100) {
        handlePlayerDeath('fall');
    }
    
    // Update camera with smooth following
    const targetCameraX = player.x - canvas.width / 3;
    const maxCameraX = Math.max(0, getCurrentLevelWidth() - canvas.width);
    
    gameState.camera.x += (Math.max(0, Math.min(targetCameraX, maxCameraX)) - gameState.camera.x) * 0.1;
}

// Get current level width for camera bounds
function getCurrentLevelWidth() {
    const level = levels[gameState.currentLevel];
    if (!level) return canvas.width;
    
    let maxX = 0;
    level.platforms.forEach(platform => {
        maxX = Math.max(maxX, platform.x + platform.width);
    });
    return Math.max(maxX, goal.x + goal.width + 200);
}

// Handle player death with different types
function handlePlayerDeath(type = 'enemy') {
    if (player.invulnerable) return;
    
    gameState.lives--;
    addScreenShake(type === 'fall' ? 25 : 15);
    
    // Create death particles
    createParticles(
        player.x + player.width/2, 
        player.y + player.height/2, 
        'hit', 
        type === 'fall' ? 20 : 12
    );
    
    playSound('enemyHit');
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        resetPlayerPosition();
        // Grant brief invulnerability
        player.invulnerable = true;
        player.invulnerabilityTimer = 120; // 2 seconds at 60fps
    }
}

// Reset player position with smooth transition
function resetPlayerPosition() {
    player.x = 50;
    player.y = 350;
    player.velX = 0;
    player.velY = 0;
    player.animState = 'idle';
    player.coyoteTime = 0;
    gameState.camera.x = 0;
    
    // Add transition effect
    document.body.classList.add('level-transition');
    setTimeout(() => {
        document.body.classList.remove('level-transition');
    }, 1000);
}

// Enhanced enemy system with better AI
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        const oldX = enemy.x;
        enemy.x += enemy.velX;
        
        // Enhanced platform edge detection
        let onPlatform = false;
        let platformBounds = null;
        
        // Find the platform this enemy is associated with
        if (enemy.platform !== undefined && platforms[enemy.platform]) {
            const platform = platforms[enemy.platform];
            platformBounds = {
                left: platform.x + 5, // Small margin
                right: platform.x + platform.width - 35 // Account for enemy width
            };
            
            // Check if enemy is still on the platform
            if (enemy.x >= platformBounds.left && enemy.x <= platformBounds.right) {
                onPlatform = true;
            }
        } else {
            // Fallback: check all platforms
            platforms.forEach(platform => {
                if (enemy.y + enemy.height >= platform.y - 5 && 
                    enemy.y + enemy.height <= platform.y + platform.height + 10 &&
                    enemy.x + enemy.width > platform.x && 
                    enemy.x < platform.x + platform.width) {
                    onPlatform = true;
                    platformBounds = {
                        left: platform.x,
                        right: platform.x + platform.width - enemy.width
                    };
                }
            });
        }
        
        // Reverse direction if at platform edge or hitting boundaries
        if (!onPlatform || 
            (platformBounds && (enemy.x <= platformBounds.left || enemy.x >= platformBounds.right))) {
            enemy.velX *= -1;
            enemy.x = oldX; // Revert position
        }
        
        // Enemy-specific behavior based on type
        switch (enemy.type) {
            case 'red':
                // Basic patrol enemy
                break;
            case 'purple':
                // Slightly faster with occasional pause
                if (Math.random() < 0.01) {
                    enemy.pauseTimer = 60; // Pause for 1 second
                }
                if (enemy.pauseTimer > 0) {
                    enemy.pauseTimer--;
                    enemy.x = oldX; // Don't move during pause
                }
                break;
            case 'pink':
                // Fastest enemy with smooth movement
                break;
        }
        // Enhanced Platformer Game - JavaScript Part 4
// Continue enemy update and collision systems

        // Check collision with player
        if (!player.invulnerable && checkCollision(player, enemy)) {
            handlePlayerDeath('enemy');
        }
    });
}

// Enhanced coin collection system
function updateCoins() {
    coins.forEach((coin, index) => {
        // Animate coins
        coin.animFrame += 0.2;
        
        // Floating animation
        coin.y += Math.sin(coin.animFrame) * 0.5;
        
        // Check collection
        if (checkCollision(player, coin)) {
            // Remove coin
            coins.splice(index, 1);
            
            // Add score
            gameState.score += 100;
            
            // Create collection particles
            createParticles(
                coin.x + coin.width/2, 
                coin.y + coin.height/2, 
                'coin', 
                6
            );
            
            playSound('coin');
            updateUI();
        }
    });
}

// Goal/flag collision
function checkGoalCollision() {
    if (checkCollision(player, goal)) {
        // Bonus points for remaining coins
        const coinBonus = coins.length * 50;
        gameState.score += coinBonus;
        
        playSound('levelComplete');
        
        if (gameState.currentLevel < Object.keys(levels).length) {
            showLevelComplete(coinBonus);
        } else {
            showGameWon();
        }
    }
}

// Enhanced rendering system with improved graphics
function render() {
    // Clear canvas with background
    ctx.fillStyle = '#87CEEB'; // Default sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake
    if (gameState.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.screenShake;
        const shakeY = (Math.random() - 0.5) * gameState.screenShake;
        ctx.translate(shakeX, shakeY);
        gameState.screenShake *= 0.9;
        if (gameState.screenShake < 0.5) gameState.screenShake = 0;
    }
    
    // Apply camera offset
    ctx.save();
    ctx.translate(-gameState.camera.x, 0);
    
    // Render background elements
    renderBackground();
    
    // Render platforms with enhanced graphics
    renderPlatforms();
    
    // Render coins with animation
    renderCoins();
    
    // Render enemies with sprite support
    renderEnemies();
    
    // Render goal
    renderGoal();
    
    // Render player with animation
    renderPlayer();
    
    // Render particles
    renderParticles();
    
    ctx.restore();
    
    // Reset any transforms
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Background rendering with parallax effect
function renderBackground() {
    const level = levels[gameState.currentLevel];
    if (!level) return;
    
    // Simple gradient background based on theme
    const gradients = {
        forest: ['#87CEEB', '#98FB98'],
        desert: ['#FFE4B5', '#F4A460'],
        space: ['#191970', '#483D8B']
    };
    
    const colors = gradients[level.theme] || gradients.forest;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(gameState.camera.x, 0, canvas.width, canvas.height);
    
    // Add some simple background elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 100 + gameState.camera.x * 0.3) % (canvas.width + 100);
        const y = 50 + Math.sin(i) * 30;
        const size = 10 + Math.sin(i * 2) * 5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Enhanced platform rendering
function renderPlatforms() {
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    platforms.forEach(platform => {
        // Main platform
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add texture lines
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 1;
        for (let i = 0; i < platform.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(platform.x + i, platform.y);
            ctx.lineTo(platform.x + i, platform.y + platform.height);
            ctx.stroke();
        }
        
        // Grass/surface effect
        ctx.fillStyle = '#228B22';
        ctx.fillRect(platform.x, platform.y - 3, platform.width, 3);
    });
}

// Enhanced coin rendering with animation
function renderCoins() {
    coins.forEach(coin => {
        ctx.save();
        
        // Rotate coin for spinning effect
        const centerX = coin.x + coin.width / 2;
        const centerY = coin.y + coin.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(coin.animFrame * 0.1);
        
        // Draw coin with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.width/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shine effect
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(-coin.width/6, -coin.height/6, coin.width/6, 0, Math.PI * 2);
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });
}

// Enhanced enemy rendering
function renderEnemies() {
    enemies.forEach(enemy => {
    ctx.save();
    
    // Get appropriate enemy sprite
    let enemySprite;
    if (assets.images.enemy && assets.images.enemy[enemy.type]) {
        enemySprite = assets.images.enemy[enemy.type];
    } else {
        // Fallback colors
        const colors = {
            red: '#DC143C',
            purple: '#8A2BE2',
            pink: '#FF69B4'
        };
        enemySprite = createFallbackImage(30, 30, colors[enemy.type] || colors.red);
    }
    
    // Draw enemy sprite
    ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Add glow effect for special enemies (optional)
    if (enemy.type === 'pink') {
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x - 2, enemy.y - 2, enemy.width + 4, enemy.height + 4);
        ctx.shadowBlur = 0;
    }
    
    ctx.restore();
});
}

// Goal rendering
function renderGoal() {
    ctx.save();
    
    // Flag pole
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(goal.x, goal.y, 4, goal.height);
    
    // Flag
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(goal.x + 4, goal.y, goal.width - 4, 25);
    
    // Flag pattern
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            if ((i + j) % 2 === 0) {
                ctx.fillRect(goal.x + 4 + i * 10, goal.y + j * 12, 10, 12);
            }
        }
    }
    
    // Wave effect
    const waveOffset = Math.sin(Date.now() * 0.01) * 2;
    ctx.save();
    ctx.translate(waveOffset, 0);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(goal.x + 4, goal.y, goal.width - 4, 25);
    ctx.restore();
    
    ctx.restore();
}

// Enhanced player rendering with animation
function renderPlayer() {
    ctx.save();
    
    // Handle invulnerability flashing
    if (player.invulnerable && Math.floor(player.invulnerabilityTimer / 6) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    // Flip sprite based on direction
    if (player.direction === -1) {
        ctx.scale(-1, 1);
        ctx.translate(-(player.x + player.width), 0);
    } else {
        ctx.translate(player.x, 0);
    }
    
    // Player body
   // Get appropriate player sprite based on animation state
let playerSprite = assets.images.player?.idle || createFallbackImage(32, 40, player.color);

// Select sprite based on animation state
if (assets.images.player) {
    switch (player.animState) {
        case 'idle':
            playerSprite = assets.images.player.idle || playerSprite;
            break;
        case 'run':
            playerSprite = assets.images.player.run || playerSprite;
            break;
        case 'jump':
            playerSprite = assets.images.player.jump || playerSprite;
            break;
    }
}

// Draw player sprite
ctx.drawImage(playerSprite, 0, player.y, player.width, player.height);
    
    ctx.restore();
}
// Enhanced Platformer Game - JavaScript Part 5
// Particle system and game flow

// Enhanced particle rendering
function renderParticles() {
    particles.forEach(particle => {
        ctx.save();
        
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        
        // Translate and rotate
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        // Different particle types
        switch (particle.type) {
            case 'coin':
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Sparkle effect
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'hit':
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                break;
                
            default:
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        }
        
        ctx.restore();
    });
}

// Game initialization
function initGame() {
    // Reset game state
    gameState.score = 0;
    gameState.lives = 3;
    gameState.currentLevel = 1;
    gameState.gameRunning = true;
    gameState.camera = { x: 0, y: 0 };
    gameState.screenShake = 0;
    
    // Initialize first level
    initLevel(1);
    
    // Start background music
    if (!audioMuted && assets.sounds.backgroundMusic) {
        assets.sounds.backgroundMusic.loop = true;
        assets.sounds.backgroundMusic.play().catch(e => 
            console.log('Background music failed:', e)
        );
    }
    
    // Update UI
    updateUI();
    
    // Start game loop
    gameLoop();
}

// Main game loop
function gameLoop() {
    if (!gameState.gameRunning) return;
    
    // Update game objects
    updatePlayer();
    updateEnemies();
    updateCoins();
    updateParticles();
    
    // Check goal collision
    checkGoalCollision();
    
    // Render everything
    render();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// UI Update functions
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.currentLevel;
    
    // Update lives display with hearts
    const livesContainer = document.getElementById('lives-hearts');
    if (livesContainer) {
        livesContainer.innerHTML = '❤️'.repeat(Math.max(0, gameState.lives));
    }
}

// Level completion
function showLevelComplete(coinBonus = 0) {
    gameState.gameRunning = false;
    
    // Stop background music
    if (assets.sounds.backgroundMusic) {
        assets.sounds.backgroundMusic.pause();
    }
    
    // Show level complete modal
    document.getElementById('levelComplete').style.display = 'flex';
    document.getElementById('levelScore').textContent = gameState.score;
    document.getElementById('coinBonus').textContent = coinBonus;
    document.getElementById('completedLevel').textContent = gameState.currentLevel;
    
    // Add celebration particles
    setTimeout(() => {
        for (let i = 0; i < 30; i++) {
            createParticles(
                canvas.width / 2 + gameState.camera.x,
                canvas.height / 2,
                'coin',
                1
            );
        }
    }, 500);
}

// Continue to next level
function nextLevel() {
    gameState.currentLevel++;
    
    if (gameState.currentLevel > Object.keys(levels).length) {
        showGameWon();
        return;
    }
    
    // Hide level complete modal
    document.getElementById('levelComplete').style.display = 'none';
    
    // Initialize next level
    initLevel(gameState.currentLevel);
    
    // Restart game loop
    gameState.gameRunning = true;
    
    // Resume background music
    if (!audioMuted && assets.sounds.backgroundMusic) {
        assets.sounds.backgroundMusic.play().catch(e => 
            console.log('Background music failed:', e)
        );
    }
    
    updateUI();
    gameLoop();
}

// Game Over
function gameOver() {
    gameState.gameRunning = false;
    
    // Stop background music
    if (assets.sounds.backgroundMusic) {
        assets.sounds.backgroundMusic.pause();
    }
    
    playSound('gameOver');
    
    // Show game over screen
    document.getElementById('gameOver').style.display = 'flex';
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('reachedLevel').textContent = gameState.currentLevel;
    
    // Add dramatic screen shake
    addScreenShake(30);
}

// Game Won (all levels completed)
function showGameWon() {
    gameState.gameRunning = false;
    
    // Stop background music
    if (assets.sounds.backgroundMusic) {
        assets.sounds.backgroundMusic.pause();
    }
    
    // Calculate final bonus
    const timeBonus = Math.max(0, 10000 - Date.now()); // Placeholder time bonus
    const finalScore = gameState.score + timeBonus;
    
    // Show game won screen
    document.getElementById('gameWon').style.display = 'flex';
    document.getElementById('totalScore').textContent = finalScore;
    document.getElementById('timeBonus').textContent = timeBonus;
    
    // Victory particles
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createParticles(
                Math.random() * canvas.width + gameState.camera.x,
                Math.random() * canvas.height,
                Math.random() > 0.5 ? 'coin' : 'hit',
                1
            );
        }, i * 100);
    }
    
    playSound('levelComplete');
}

// Restart game
function restartGame() {
    // Hide all modals
    hideAllModals();
    
    // Reset particles
    particles = [];
    
    // Start new game
    initGame();
}

// Pause/Resume functionality
function togglePause() {
    if (gameState.currentScreen !== 'game') return;
    
    gameState.gameRunning = !gameState.gameRunning;
    
    const pauseBtn = document.getElementById('pauseBtn');
    if (gameState.gameRunning) {
        pauseBtn.textContent = '⏸️';
        gameLoop();
        if (!audioMuted && assets.sounds.backgroundMusic) {
            assets.sounds.backgroundMusic.play().catch(e => 
                console.log('Background music failed:', e)
            );
        }
    } else {
        pauseBtn.textContent = '▶️';
        if (assets.sounds.backgroundMusic) {
            assets.sounds.backgroundMusic.pause();
        }
    }
}

// Keyboard shortcuts for game control
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'KeyP':
            if (gameState.currentScreen === 'game') {
                togglePause();
            }
            break;
        case 'KeyM':
            toggleMute();
            break;
        case 'KeyR':
            if (gameState.currentScreen === 'game' && !gameState.gameRunning) {
                restartGame();
            }
            break;
        case 'Escape':
            if (gameState.currentScreen === 'game') {
                backToStart();
            }
            break;
    }
});

// Touch/Mobile controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Interpret gestures
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 30) {
            // Swipe right
            gameState.keys['ArrowRight'] = true;
            setTimeout(() => gameState.keys['ArrowRight'] = false, 200);
        } else if (deltaX < -30) {
            // Swipe left
            gameState.keys['ArrowLeft'] = true;
            setTimeout(() => gameState.keys['ArrowLeft'] = false, 200);
        }
    } else {
        // Vertical swipe
        if (deltaY < -30) {
            // Swipe up (jump)
            gameState.keys['Space'] = true;
            setTimeout(() => gameState.keys['Space'] = false, 100);
        }
    }
});

// Performance monitoring
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

function updatePerformance() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        
        // Display FPS if performance container exists
        const fpsDisplay = document.getElementById('fps');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${fps}`;
        }
    }
}

// Enhanced game loop with performance monitoring
const originalGameLoop = gameLoop;
gameLoop = function() {
    updatePerformance();
    originalGameLoop();
};

// Window focus/blur handling
window.addEventListener('blur', () => {
    if (gameState.gameRunning && gameState.currentScreen === 'game') {
        togglePause();
    }
});

// Resize handling
window.addEventListener('resize', () => {
    // Adjust canvas if needed (keep aspect ratio)
    const container = document.getElementById('gameContainer');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Maintain aspect ratio
        const aspectRatio = canvas.width / canvas.height;
        let newWidth = containerWidth;
        let newHeight = containerWidth / aspectRatio;
        
        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
    }
});

// Initialize the game when assets are loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting asset loading...');
    loadAssets();
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Game error:', e.error);
    // Could show error message to user
});

// Debug mode (toggle with 'D' key)
let debugMode = false;
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyD' && e.ctrlKey) {
        debugMode = !debugMode;
        console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
    }
});

// Debug rendering
function renderDebug() {
    if (!debugMode) return;
    
    ctx.save();
    ctx.translate(-gameState.camera.x, 0);
    
    // Player hitbox
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Platform hitboxes
    ctx.strokeStyle = '#00FF00';
    platforms.forEach(platform => {
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Enemy hitboxes
    ctx.strokeStyle = '#FF00FF';
    enemies.forEach(enemy => {
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    // Coin hitboxes
    ctx.strokeStyle = '#FFFF00';
    coins.forEach(coin => {
        ctx.strokeRect(coin.x, coin.y, coin.width, coin.height);
    });
    
    ctx.restore();
    
    // Debug info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText(`Player: ${Math.round(player.x)}, ${Math.round(player.y)}`, 10, 30);
    ctx.fillText(`Velocity: ${Math.round(player.velX)}, ${Math.round(player.velY)}`, 10, 45);
    ctx.fillText(`Grounded: ${player.grounded}`, 10, 60);
    ctx.fillText(`Camera: ${Math.round(gameState.camera.x)}`, 10, 75);
    ctx.fillText(`FPS: ${fps}`, 10, 90);
}

// Add debug rendering to main render function
const originalRender = render;
render = function() {
    originalRender();
    renderDebug();
};

console.log('Enhanced Platformer Game - JavaScript Part 5 loaded');
// Image Loading Fix - Add this to the end of your game.js file

// Define the missing loadImage function
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

// Fix the image sources to match your actual file structure
const fixedImageSources = {
    player: {
        idle: 'images/player.png',
        run: 'images/player.png',
        jump: 'images/player.png'
    },
    enemy: {
        red: 'images/enemy.png',
        purple: 'images/enemy.png',
        pink: 'images/enemy.png'
    },
    coin: 'images/coin.png'
};

// Override the original imageSources with the fixed ones
Object.assign(imageSources, fixedImageSources);

// Enhanced fallback system that creates better looking sprites
function createBetterFallbackImage(width, height, color, type = 'default') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    switch (type) {
        case 'player':
            // Create a simple character sprite
            ctx.fillStyle = color;
            ctx.fillRect(8, 0, 16, 40); // body
            ctx.fillStyle = '#FFE4C4'; // skin color
            ctx.fillRect(10, 0, 12, 8); // head
            ctx.fillStyle = '#000000';
            ctx.fillRect(12, 2, 2, 2); // left eye
            ctx.fillRect(18, 2, 2, 2); // right eye
            ctx.fillRect(14, 4, 4, 1); // mouth
            break;
            
        case 'enemy':
            // Create enemy sprite with spikes
            ctx.fillStyle = color;
            ctx.fillRect(2, 10, 26, 20); // body
            // Add spikes
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                ctx.moveTo(2 + i * 4, 10);
                ctx.lineTo(4 + i * 4, 5);
                ctx.lineTo(6 + i * 4, 10);
            }
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(8, 15, 3, 3);
            ctx.fillRect(19, 15, 3, 3);
            break;
            
        case 'coin':
            // Create a golden coin
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 2;
            
            // Outer circle
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner shine
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(centerX - 2, centerY - 2, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        default:
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
    }
    
    return canvas;
}

// Improved asset loading with better error handling and fallbacks
async function improvedLoadAssets() {
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingText = document.getElementById('loadingText');
    
    // Show loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    console.log('Starting improved asset loading...');
    
    // Load images with better fallbacks
    try {
        // Player images
        if (loadingText) loadingText.textContent = 'Loading player sprites...';
        try {
            assets.images.player = {
                idle: await loadImage('images/player.png'),
                run: await loadImage('images/player.png'),
                jump: await loadImage('images/player.png')
            };
            console.log('Player sprites loaded successfully');
        } catch (error) {
            console.warn('Player sprites failed to load, using fallback');
            assets.images.player = {
                idle: createBetterFallbackImage(32, 40, '#FF6B6B', 'player'),
                run: createBetterFallbackImage(32, 40, '#FF6B6B', 'player'),
                jump: createBetterFallbackImage(32, 40, '#FF6B6B', 'player')
            };
        }
        
        if (loadingProgress) loadingProgress.style.width = '33%';
        
        // Enemy images
        if (loadingText) loadingText.textContent = 'Loading enemy sprites...';
        try {
            const enemyImg = await loadImage('images/enemy.png');
            assets.images.enemy = {
                red: enemyImg,
                purple: enemyImg,
                pink: enemyImg
            };
            console.log('Enemy sprites loaded successfully');
        } catch (error) {
            console.warn('Enemy sprites failed to load, using fallback');
            assets.images.enemy = {
                red: createBetterFallbackImage(30, 30, '#DC143C', 'enemy'),
                purple: createBetterFallbackImage(30, 30, '#8A2BE2', 'enemy'),
                pink: createBetterFallbackImage(30, 30, '#FF69B4', 'enemy')
            };
        }
        
        if (loadingProgress) loadingProgress.style.width = '66%';
        
        // Coin image
        if (loadingText) loadingText.textContent = 'Loading coin sprites...';
        try {
            assets.images.coin = await loadImage('images/coin.png');
            console.log('Coin sprite loaded successfully');
        } catch (error) {
            console.warn('Coin sprite failed to load, using fallback');
            assets.images.coin = createBetterFallbackImage(20, 20, '#FFD700', 'coin');
        }
        
        if (loadingProgress) loadingProgress.style.width = '100%';
        
    } catch (error) {
        console.error('Critical error in asset loading:', error);
    }
    
    // Setup audio with improved error handling
    if (loadingText) loadingText.textContent = 'Setting up audio...';
    
    Object.keys(audioElements).forEach(key => {
        const audioElement = audioElements[key];
        if (audioElement && audioElement.tagName === 'AUDIO') {
            assets.sounds[key] = audioElement;
            assets.sounds[key].volume = key === 'backgroundMusic' ? 0.3 : 0.5;
            
            audioElement.addEventListener('error', (e) => {
                console.warn(`Audio failed to load: ${key}`, e);
            });
        } else {
            console.warn(`Audio element not found: ${key}`);
        }
    });
    
    // Finish loading
    if (loadingText) loadingText.textContent = 'Ready to play!';
    if (loadingProgress) loadingProgress.style.width = '100%';
    
    setTimeout(() => {
        if (loadingScreen) loadingScreen.style.display = 'none';
        assets.ready = true;
        console.log('All assets loaded, showing start screen');
        showStartScreen();
    }, 800);
}

// Replace the original loadAssets function
loadAssets = improvedLoadAssets;

// Debug function to check what's actually loaded
function checkLoadedAssets() {
    console.log('=== LOADED ASSETS CHECK ===');
    console.log('Player sprites:', assets.images.player);
    console.log('Enemy sprites:', assets.images.enemy);
    console.log('Coin sprite:', assets.images.coin);
    console.log('Audio elements:', Object.keys(assets.sounds));
    console.log('Assets ready:', assets.ready);
    console.log('==========================');
}

// Call this in browser console to check: checkLoadedAssets()

// Fix the coin rendering to use the loaded/fallback image
function renderCoinsFixed() {
    coins.forEach(coin => {
        ctx.save();
        
        if (assets.images.coin) {
            // Use the loaded or fallback coin image
            const centerX = coin.x + coin.width / 2;
            const centerY = coin.y + coin.height / 2;
            
            ctx.translate(centerX, centerY);
            ctx.rotate(coin.animFrame * 0.1);
            ctx.drawImage(assets.images.coin, -coin.width/2, -coin.height/2, coin.width, coin.height);
        } else {
            // Ultra fallback if even the fallback fails
            ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
            ctx.rotate(coin.animFrame * 0.1);
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(-coin.width/6, -coin.height/6, coin.width/6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

// Override the original renderCoins function
renderCoins = renderCoinsFixed;

// Fix player rendering to use loaded sprites
function renderPlayerFixed() {
    ctx.save();
    
    // Handle invulnerability flashing
    if (player.invulnerable && Math.floor(player.invulnerabilityTimer / 6) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    // Flip sprite based on direction
    if (player.direction === -1) {
        ctx.scale(-1, 1);
        ctx.translate(-(player.x + player.width), 0);
    } else {
        ctx.translate(player.x, 0);
    }
    
    // Get appropriate player sprite
    let playerSprite = null;
    if (assets.images.player) {
        switch (player.animState) {
            case 'idle':
                playerSprite = assets.images.player.idle;
                break;
            case 'run':
                playerSprite = assets.images.player.run;
                break;
            case 'jump':
                playerSprite = assets.images.player.jump;
                break;
            default:
                playerSprite = assets.images.player.idle;
        }
    }
    
    if (playerSprite) {
        ctx.drawImage(playerSprite, 0, player.y, player.width, player.height);
    } else {
        // Ultra fallback
        ctx.fillStyle = player.color;
        ctx.fillRect(0, player.y, player.width, player.height);
    }
    
    ctx.restore();
}

// Override the original renderPlayer function
renderPlayer = renderPlayerFixed;

console.log('Image loading fix applied! Your sprites should now load correctly or show nice fallbacks.');
console.log('If images still don\'t load, check that your image files are in the correct "images/" folder.');
