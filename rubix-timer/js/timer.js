// js/timer.js
//
// Timer state machine. Supports multiple independent instances
// via configurable key code and display element.

import { formatTime } from './utils.js';

export function initTimer(timerDisplay, { key = 'Space', getScrambleText, onStop, onStateChange, enableTouch = true }) {
  let timerState = 'idle';
  let holdTimeout = null;
  let startTime = 0;
  let elapsed = 0;
  let animationFrame = null;
  let currentScramble = '';
  let multiplayerMode = false;

  function handleInputDown() {
    if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'idle' || timerState === 'stopped') {
      startHolding();
    }
  }

  function handleInputUp() {
    if (timerState === 'holding') {
      cancelHolding();
    } else if (timerState === 'ready') {
      if (multiplayerMode) {
        timerState = 'idle';
        timerDisplay.style.color = '#ffffff';
        if (onStateChange) onStateChange('mp-released', 0);
      } else {
        startTimerRun();
      }
    }
  }

  function startHolding() {
    timerDisplay.textContent = '0.00';
    timerState = 'holding';
    timerDisplay.style.color = '#ffd700';
    if (onStateChange) onStateChange('holding', 0);
    holdTimeout = setTimeout(() => {
      timerState = 'ready';
      timerDisplay.style.color = '#00e676';
      if (onStateChange) onStateChange('ready', 0);
    }, 300);
  }

  function cancelHolding() {
    clearTimeout(holdTimeout);
    timerState = 'idle';
    timerDisplay.style.color = '#ffffff';
    if (onStateChange) onStateChange('idle', 0);
  }

  function startTimerRun() {
    timerState = 'running';
    timerDisplay.style.color = '#ffffff';
    currentScramble = getScrambleText();
    startTime = performance.now();
    if (onStateChange) onStateChange('running', 0);
    updateDisplay();
  }

  function stopTimer() {
    timerState = 'stopped';
    elapsed = Math.round(performance.now() - startTime);
    cancelAnimationFrame(animationFrame);
    timerDisplay.textContent = formatTime(elapsed);
    timerDisplay.style.color = '#ffffff';
    if (onStateChange) onStateChange('stopped', elapsed);
    onStop(elapsed, currentScramble);
  }

  function updateDisplay() {
    if (timerState !== 'running') return;
    elapsed = performance.now() - startTime;
    timerDisplay.textContent = formatTime(elapsed);
    if (onStateChange) onStateChange('running', elapsed);
    animationFrame = requestAnimationFrame(updateDisplay);
  }

  // Keyboard — only respond to the configured key
  document.addEventListener('keydown', (e) => {
    if (e.code !== key) return;
    e.preventDefault();
    if (!e.repeat) handleInputDown();
  });

  document.addEventListener('keyup', (e) => {
    if (e.code !== key) return;
    e.preventDefault();
    handleInputUp();
  });

  // Touch — only if enabled (disabled for P2 instance in local 2P)
  if (enableTouch) {
    timerDisplay.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleInputDown();
    });

    timerDisplay.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleInputUp();
    });
  }

  return {
    forceStart() {
      startTimerRun();
    },
    setMultiplayerMode(enabled) {
      multiplayerMode = enabled;
    },
    resetToIdle() {
      clearTimeout(holdTimeout);
      cancelAnimationFrame(animationFrame);
      timerState = 'idle';
      timerDisplay.textContent = '0.00';
      timerDisplay.style.color = '#ffffff';
    },
    destroy() {
      // Clean up animation frame and timeout
      clearTimeout(holdTimeout);
      cancelAnimationFrame(animationFrame);
      // Note: can't remove anonymous event listeners, but they check
      // the key code so they become no-ops if the instance is "destroyed"
    },
  };
}
