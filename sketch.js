/*
Week 4 — Example 5: Example 5: Blob Platformer (JSON + Classes)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This file orchestrates everything:
- load JSON in preload()
- create WorldLevel from JSON
- create BlobPlayer
- update + draw each frame
- handle input events (jump, optional next level)

This matches the structure of the original blob sketch from Week 2 but moves
details into classes.
*/

let data; // raw JSON data
let levelIndex = 0;

let world; // WorldLevel instance (current level)
let player; // BlobPlayer instance

// Platform timer for level 2
let platformTimers = {}; // Track time on each platform
let maxTimeOnPlatform = 300; // Frames (5 seconds at 60fps)
let currentPlatformIndex = -1; // Which platform player is on
let collapsedPlatforms = new Set(); // Track which platforms have collapsed

// Level timer for level 2
let levelTimer = 0; // Frame counter for level 2
let levelTimeLimit = 600; // 10 seconds (600 frames at 60fps)
let timerExpiredThisFrame = false; // Track if we already lost a life this timeout

// Lives system
let lives = 3; // Player starts with 3 lives per level

// Cacti system
let cacti = [];
let cactusStartDelay = 0; // Frames before cacti start moving
let cactusDelayDuration = 180; // 3 seconds at 60fps
let invincibilityTimer = 0; // Frames of invincibility after getting hit
let invincibilityDuration = 120; // 2 seconds at 60fps

function initializeCacti() {
  // Create multiple cacti at different starting positions
  cacti = [
    { x: 640, speed: 5, y: 270 },
    { x: 300, speed: 4.5, y: 270 },
    { x: -150, speed: 5, y: 270 },
    { x: -150, speed: 4.5, y: 270 },
    { x: -150, speed: 5, y: 270 },
    { x: -150, speed: 4.5, y: 270 },
    { x: -150, speed: 5, y: 270 },
    { x: -150, speed: 4.5, y: 270 },
    { x: -150, speed: 5, y: 270 },
    { x: -150, speed: 4.5, y: 270 },
  ];
  cactusStartDelay = 0; // Reset delay timer
}

function preload() {
  // Load the level data from disk before setup runs.
  data = loadJSON("levels.json");
}

function setup() {
  // Create the player once (it will be respawned per level).
  player = new BlobPlayer();

  // Initialize cacti
  initializeCacti();

  // Load the first level.
  loadLevel(0);

  // Simple shared style setup.
  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  // 1) Draw the world (background + platforms)
  world.drawWorld();

  // 2) Update and draw the player on top of the world
  player.update(world.platforms);
  player.draw(world.theme.blob);

  // 2.5) Update level timer on level 2
  if (levelIndex === 1) {
    levelTimer++;
    const timeRemaining = Math.max(0, levelTimeLimit - levelTimer);
    const secondsLeft = Math.ceil(timeRemaining / 60);
    
    // Display timer in top left
    fill(0);
    textSize(24);
    textAlign(LEFT);
    
    // Color code: red if less than 3 seconds
    if (secondsLeft <= 3) {
      fill(255, 0, 0);
    }
    
    text("Time: " + secondsLeft + "s", 10, 80);
    textAlign(LEFT);
    textSize(14);
    fill(0);
    
    // Time's up - lose a life and respawn
    if (secondsLeft === 0 && !timerExpiredThisFrame) {
      timerExpiredThisFrame = true;
      lives--;
      if (lives <= 0) {
        lives = 3;
        loadLevel(levelIndex); // Restart level when all lives lost
      } else {
        // Respawn and reset timer without reloading level
        player.spawnFromLevel(world);
        levelTimer = 0;
      }
    } else if (secondsLeft > 0) {
      timerExpiredThisFrame = false;
    }
  }

  // 3) Draw rolling cacti on level 1 only
  if (levelIndex === 0) {
    cactusStartDelay++;
    
    // Update invincibility timer
    if (invincibilityTimer > 0) {
      invincibilityTimer--;
    }
    
    for (let cactus of cacti) {
      // Only move cacti after delay period
      if (cactusStartDelay > cactusDelayDuration) {
        // Update cactus position (move left)
        cactus.x -= cactus.speed;
        
        // Loop back to right side when it goes off screen
        if (cactus.x < -40) {
          cactus.x = width + 20;
        }
      }
      
      // Check collision between cactus and blob (only if not invincible)
      if (invincibilityTimer === 0) {
        const distToCactus = dist(player.x, player.y, cactus.x, cactus.y);
        if (distToCactus < player.r + 20) {
          // Cactus hit blob - lose a life
          lives--;
          invincibilityTimer = invincibilityDuration; // Start invincibility period
          player.spawnFromLevel(world); // Respawn on current level
          
          if (lives <= 0) {
            lives = 3;
            loadLevel(levelIndex); // Restart level when all lives lost
          }
        }
      }
      
      // Draw cactus emoji
      textSize(30);
      text("🌵", cactus.x, cactus.y);
      textSize(14); // Reset text size for HUD
    }
  }

  // 4) Draw vertical black wall on right side at top for level transition
  // Wall is 20 pixels wide, extends from top to y=120
  fill(0);
  rect(width - 20, 0, 20, 120);

  // 5) Check if player reached the right top opening (x > width-20 and y < 120)
  if (player.x + player.r > width - 20 && player.y - player.r < 120) {
    // Auto-advance to next level
    const next = (levelIndex + 1) % data.levels.length;
    loadLevel(next);
  }

  // 5.5) Check if player fell off the bottom - lose a life
  if (player.y - player.r > height + 50) {
    lives--;
    if (lives <= 0) {
      lives = 3;
      loadLevel(levelIndex); // Restart level
    } else {
      player.spawnFromLevel(world); // Respawn on current level
    }
  }

  // 6) Draw lives tally on both levels
  fill(0);
  textSize(18);
  textAlign(LEFT);
  let lifesTally = "";
  for (let i = 0; i < lives; i++) {
    lifesTally += "❤️ ";
  }
  text(lifesTally, 10, height - 20);

  // 7) HUD
  fill(0);
  text(world.name, 10, 18);
  text("Move: A/D or ←/→ • Jump: Space/W/↑ • Next: N", 10, 36);
}

function keyPressed() {
  // Jump keys
  if (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) {
    player.jump();
  }

  // Optional: cycle levels with N (as with the earlier examples)
  if (key === "n" || key === "N") {
    const next = (levelIndex + 1) % data.levels.length;
    loadLevel(next);
  }
}

/*
Load a level by index:
- create a WorldLevel instance from JSON
- resize canvas based on inferred geometry
- spawn player using level start + physics
*/
function loadLevel(i) {
  levelIndex = i;

  // Create the world object from the JSON level object.
  world = new WorldLevel(data.levels[levelIndex]);

  // Reset platform timers for new level
  platformTimers = {};
  currentPlatformIndex = -1;
  collapsedPlatforms = new Set();
  
  // Reset level timer
  levelTimer = 0;
  timerExpiredThisFrame = false;
  
  // Reset lives
  lives = 3;
  
  // Reset cacti for level 1
  if (i === 0) {
    initializeCacti();
    invincibilityTimer = 0; // Reset invincibility when level loads
  }

  // Fit canvas to world geometry (or defaults if needed).
  const W = world.inferWidth(640);
  const H = world.inferHeight(360);
  resizeCanvas(W, H);

  // Apply level settings + respawn.
  player.spawnFromLevel(world);
}

/*
Update and display timers on level 2
*/
function updateAndDisplayTimers() {
  // Check if blob is on any platform (not ground)
  let onPlatformIndex = -1;
  
  for (let i = 1; i < world.platforms.length; i++) { // Start from 1 to skip ground
    if (collapsedPlatforms.has(i)) continue;
    
    const platform = world.platforms[i];
    
    // Simple distance check - is blob near/on this platform
    const blobBottom = player.y + player.r;
    const platformTop = platform.y;
    const platformBottom = platform.y + platform.h;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.w;
    
    // Check if blob is above and within x bounds
    if (player.y > platformTop - 20 && player.y < platformBottom + 10 &&
        player.x > platformLeft && player.x < platformRight) {
      onPlatformIndex = i;
      break;
    }
  }
  
  // Update timer for current platform
  if (onPlatformIndex >= 1) {
    // If blob just landed on this platform, start timer
    if (currentPlatformIndex !== onPlatformIndex) {
      platformTimers[onPlatformIndex] = 0;
      currentPlatformIndex = onPlatformIndex;
    }
    
    // Increment timer
    platformTimers[onPlatformIndex]++;
    
    // Calculate seconds remaining (5 seconds = 300 frames at 60fps)
    const secondsLeft = 5 - Math.floor(platformTimers[onPlatformIndex] / 60);
    const displaySeconds = Math.max(0, secondsLeft);
    
    const platform = world.platforms[onPlatformIndex];
    
    // Display big countdown number
    if (displaySeconds > 3) {
      fill(100, 200, 100); // Green
    } else if (displaySeconds > 1) {
      fill(255, 200, 0); // Yellow
    } else if (displaySeconds > 0) {
      fill(255, 100, 0); // Orange
    } else {
      fill(255, 0, 0); // Red
    }
    
    textSize(50);
    textAlign(CENTER, CENTER);
    text(displaySeconds, platform.x + platform.w / 2, platform.y - 35);
    textAlign(LEFT);
    textSize(14);
    fill(0);
    
    // Collapse platform when time is up
    if (displaySeconds === 0 && platformTimers[onPlatformIndex] > 300) {
      collapsedPlatforms.add(onPlatformIndex);
      player.vy = -15;
      platformTimers[onPlatformIndex] = 0;
    }
  } else {
    // Blob left platform - reset
    currentPlatformIndex = -1;
  }
}
