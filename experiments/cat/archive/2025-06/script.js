const character = document.getElementById("character");
const fish = document.getElementById("fish");
const gameArea = document.getElementById("game-area");
const preview = document.getElementById("preview");
const prevCatBtn = document.getElementById("prev-cat");
const nextCatBtn = document.getElementById("next-cat");

const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;
const FRAMES_PER_ACTION = 3;
const TOTAL_CATS = 8;
const TILE_SIZE = 32;
const SPEED = 2;
const FRAME_INTERVAL = 16;
const TRAIL_DELAY_MS = 300;

let catIndex = 0;
let currentFrame = 0;
let frameTimer = 0;
let frameInterval = 200;

let direction = "right";
let queuedDirection = null;

let snake = [{ 
  x: 96, 
  y: 96, 
  col: Math.floor(96 / TILE_SIZE), 
  row: Math.floor(96 / TILE_SIZE) 
}];
let movementQueue = [];

const scoreDisplay = document.getElementById("score");
let score = 0;

const actionRowOffsets = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

// Add this near the top, after your other DOM queries:
const debugBox = document.createElement("div");
debugBox.style.position = "absolute";
debugBox.style.top = "10px";
debugBox.style.right = "10px";
debugBox.style.background = "rgba(0,0,0,0.7)";
debugBox.style.color = "#fff";
debugBox.style.fontFamily = "monospace";
debugBox.style.fontSize = "14px";
debugBox.style.padding = "8px 12px";
debugBox.style.borderRadius = "8px";
debugBox.style.zIndex = "1000";
debugBox.style.display = "none"; // Hidden by default
document.body.appendChild(debugBox);

let debugMode = false;

// Update debug info each frame
function updateDebugBox() {
  if (!debugMode) return;
  const head = snake[0];
  const fishLeft = parseInt(fish.style.left) || 0;
  const fishTop = parseInt(fish.style.top) || 0;
  debugBox.innerHTML = `
    <b>DEBUG</b><br>
    <b>Head</b>: x=${head.x}, y=${head.y}, col=${head.col}, row=${head.row}<br>
    <b>Fish</b>: x=${fishLeft}, y=${fishTop}, col=${Math.floor(fishLeft/TILE_SIZE)}, row=${Math.floor(fishTop/TILE_SIZE)}
  `;
}

function updateSpriteFrame(el, dir, frame = currentFrame) {
  const catRow = Math.floor(catIndex / 4);
  const catCol = catIndex % 4;
  const frameX = (catCol * 3 + frame) * SPRITE_WIDTH;
  const frameY = (catRow * 4 + actionRowOffsets[dir]) * SPRITE_HEIGHT;
  el.style.backgroundPosition = `-${frameX}px -${frameY}px`;
}

function placeFishRandomly() {
  const maxCols = gameArea.clientWidth / TILE_SIZE;
  const maxRows = gameArea.clientHeight / TILE_SIZE;

  // Collect all snake positions as grid coordinates "col,row"
  const occupied = new Set(
    snake.map(seg => `${seg.col},${seg.row}`)
  );
  if (debugMode) {
    console.log("Occupied grid positions:", [...occupied]);
    console.log("Contents of snake:", snake)
  }

  // Build a list of all possible grid positions not occupied by any snake segment
  const available = [];
  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < maxRows; row++) {
      const posKey = `${col},${row}`;
      if (!occupied.has(posKey)) {
        available.push({ x: col * TILE_SIZE, y: row * TILE_SIZE });
      }
    }
  }

  // If there are no available positions, do nothing
  if (available.length === 0) return;

  // Pick a random available position
  const idx = Math.floor(Math.random() * available.length);
  fish.style.left = available[idx].x + "px";
  fish.style.top = available[idx].y + "px";
}

function isAlignedToGrid(x, y) {
  return x % TILE_SIZE === 0 && y % TILE_SIZE === 0;
}

function applyQueuedDirection() {
  const opposites = { up: "down", down: "up", left: "right", right: "left" };
  if (queuedDirection && queuedDirection !== opposites[direction]) {
    direction = queuedDirection;
    queuedDirection = null;
    currentFrame = 0;
  }
}

function updateSnakeSprites() {
  document.querySelectorAll(".cat-segment").forEach(el => el.remove());

  for (let i = 1; i < snake.length; i++) {
    const el = document.createElement("div");
    el.classList.add("cat-segment");
    el.style.width = TILE_SIZE + "px";
    el.style.height = TILE_SIZE + "px";
    el.style.position = "absolute";
    el.style.backgroundImage = "url('images/cat_sprite_sheet.png')";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundSize = "auto";

    const delayFrames = Math.floor(TRAIL_DELAY_MS / FRAME_INTERVAL) * i;
    const index = Math.max(0, movementQueue.length - delayFrames - 1);
    const state = movementQueue[index];

    if (state) {
      el.style.left = state.x + "px";
      el.style.top = state.y + "px";
      updateSpriteFrame(el, state.dir, state.frame);
      gameArea.appendChild(el);

      // --- Update the snake array with the actual rendered position ---
      snake[i].x = state.x;
      snake[i].y = state.y;
      snake[i].col = Math.floor(state.x / TILE_SIZE);
      snake[i].row = Math.floor(state.y / TILE_SIZE);
    }
  }
}

function moveCharacter() {
  const head = snake[0];
  if (isAlignedToGrid(head.x, head.y)) {
    applyQueuedDirection();
  }

  // Store previous positions
  const prevPositions = snake.map(seg => ({ x: seg.x, y: seg.y }));

  // Move head
  if (direction === "right") head.x += SPEED;
  if (direction === "left") head.x -= SPEED;
  if (direction === "up") head.y -= SPEED;
  if (direction === "down") head.y += SPEED;

  const maxX = gameArea.clientWidth - SPRITE_WIDTH;
  const maxY = gameArea.clientHeight - SPRITE_HEIGHT;
  head.x = Math.max(0, Math.min(head.x, maxX));
  head.y = Math.max(0, Math.min(head.y, maxY));

  head.col = Math.floor(head.x / TILE_SIZE);
  head.row = Math.floor(head.y / TILE_SIZE);

  // Move each trailing segment to the previous position of the segment ahead
  for (let i = 1; i < snake.length; i++) {
    snake[i].x = prevPositions[i - 1].x;
    snake[i].y = prevPositions[i - 1].y;
    snake[i].col = Math.floor(snake[i].x / TILE_SIZE);
    snake[i].row = Math.floor(snake[i].y / TILE_SIZE);
  }

  character.style.left = head.x + "px";
  character.style.top = head.y + "px";
  updateSpriteFrame(character, direction);

  movementQueue.push({ x: head.x, y: head.y, dir: direction, frame: currentFrame });
  if (movementQueue.length > 1000) movementQueue.shift();

  updateSnakeSprites();

  const fishLeft = parseInt(fish.style.left);
  const fishTop = parseInt(fish.style.top);
  if (head.x === fishLeft && head.y === fishTop) {
    const tail = snake[snake.length - 1];
    snake.push({ 
      x: tail.x, 
      y: tail.y, 
      col: Math.floor(tail.x / TILE_SIZE), 
      row: Math.floor(tail.y / TILE_SIZE) 
    });
    placeFishRandomly();

    // Increment and update score
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
  }

}

function animateCharacter() {
  moveCharacter();

  frameTimer += FRAME_INTERVAL;
  if (frameTimer >= frameInterval) {
    currentFrame = (currentFrame + 1) % FRAMES_PER_ACTION;
    frameTimer = 0;
  }

  updateDebugBox();

  requestAnimationFrame(animateCharacter);
}

document.addEventListener("keydown", (e) => {
  // Toggle debug mode with the "D" key
  if (e.key === "d" || e.key === "D") {
    debugMode = !debugMode;
    debugBox.style.display = debugMode ? "block" : "none";
  }
  if (e.code === "ArrowUp") queuedDirection = "up";
  else if (e.code === "ArrowDown") queuedDirection = "down";
  else if (e.code === "ArrowLeft") queuedDirection = "left";
  else if (e.code === "ArrowRight") queuedDirection = "right";
});

let previewFrame = 0;
let previewDirection = "right";

function updatePreview() {
  const catRow = Math.floor(catIndex / 4);
  const catCol = catIndex % 4;
  const row = actionRowOffsets[previewDirection];
  const frameX = (catCol * 3 + previewFrame) * SPRITE_WIDTH;
  const frameY = (catRow * 4 + row) * SPRITE_HEIGHT;
  preview.style.backgroundPosition = `-${frameX}px -${frameY}px`;
  previewFrame = (previewFrame + 1) % FRAMES_PER_ACTION;
}

setInterval(updatePreview, frameInterval);

function changeCat(dir) {
  if (dir === "left") {
    catIndex = (catIndex - 1 + TOTAL_CATS) % TOTAL_CATS;
    previewDirection = "left";
    preview.classList.add("active-left");
    preview.classList.remove("active-right");
  } else {
    catIndex = (catIndex + 1) % TOTAL_CATS;
    previewDirection = "right";
    preview.classList.add("active-right");
    preview.classList.remove("active-left");
  }
  currentFrame = 0;
  updateSpriteFrame(character, direction);
  setTimeout(() => {
    preview.classList.remove("active-left");
    preview.classList.remove("active-right");
  }, 200);
}

prevCatBtn.addEventListener("click", () => changeCat("left"));
nextCatBtn.addEventListener("click", () => changeCat("right"));

character.style.left = snake[0].x + "px";
character.style.top = snake[0].y + "px";
updateSpriteFrame(character, direction);
placeFishRandomly();
requestAnimationFrame(animateCharacter);