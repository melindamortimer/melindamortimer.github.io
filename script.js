const character = document.getElementById("character");
const gameArea = document.getElementById("game-area");
const preview = document.getElementById("preview");
const prevCatBtn = document.getElementById("prev-cat");
const nextCatBtn = document.getElementById("next-cat");

const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;
const FRAMES_PER_ACTION = 3;
const TOTAL_CATS = 8;

let catIndex = 0;
let currentFrame = 0;
let frameTimer = 0;
let frameInterval = 200;

let x = 100;
let y = 0;
let velocityY = 0;
let isJumping = false;
let action = "down";

const gravity = 1;
const groundLevel = 0;

const actionRowOffsets = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

function updateSpriteFrame() {
  const catRow = Math.floor(catIndex / 4);
  const catCol = catIndex % 4;

  const frameX = (catCol * 3 + currentFrame) * SPRITE_WIDTH;
  const frameY = (catRow * 4 + actionRowOffsets[action]) * SPRITE_HEIGHT;

  character.style.backgroundPosition = `-${frameX}px -${frameY}px`;
}

function setAction(newAction) {
  if (action !== newAction) {
    action = newAction;
    currentFrame = 0;
    frameTimer = 0;
  }
}

function updatePosition() {
  // Horizontal movement
  if (movingLeft) {
    velocityX = -3;
  } else if (movingRight) {
    velocityX = 3;
  } else {
    velocityX = 0;
  }

  x += velocityX;
  x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
  character.style.left = x + "px";

  // Vertical movement
  if (isJumping) {
    velocityY -= gravity;
    y += velocityY;

    if (y <= groundLevel) {
      y = groundLevel;
      isJumping = false;
    }
    character.style.bottom = y + "px";
  }
}


function animateCharacter() {
  updatePosition();

  frameTimer += 16;
  if (frameTimer >= frameInterval) {
    currentFrame = (currentFrame + 1) % FRAMES_PER_ACTION;
    updateSpriteFrame();
    frameTimer = 0;
  }

  requestAnimationFrame(animateCharacter);
}

let velocityX = 0;
let movingLeft = false;
let movingRight = false;

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") {
    if (!movingLeft) {
      setAction("left");
      updateSpriteFrame(); // ✅ Immediately show left-facing sprite
    }
    movingLeft = true;
  } else if (e.code === "ArrowRight") {
    if (!movingRight) {
      setAction("right");
      updateSpriteFrame(); // ✅ Immediately show right-facing sprite
    }
    movingRight = true;
  } else if (e.code === "ArrowUp") {
    setAction("up");
    updateSpriteFrame();
  } else if (e.code === "ArrowDown") {
    setAction("down");
    updateSpriteFrame();
  } else if (e.code === "Space" && !isJumping) {
    isJumping = true;
    velocityY = 10;
  }
});


document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") {
    movingLeft = false;
  } else if (e.code === "ArrowRight") {
    movingRight = false;
  }

  if (!movingLeft && !movingRight && !isJumping) {
    currentFrame = 1; // idle frame
  }
});


// --- Cat preview animation ---
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

// --- Cat selection logic ---
function changeCat(direction) {
  if (direction === "left") {
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
  updateSpriteFrame();

  // Remove preview border after brief flash
  setTimeout(() => {
    preview.classList.remove("active-left");
    preview.classList.remove("active-right");
  }, 200);
}

prevCatBtn.addEventListener("click", () => changeCat("left"));
nextCatBtn.addEventListener("click", () => changeCat("right"));

// --- Init ---
setAction("down");
updateSpriteFrame();
animateCharacter();
