import { formatOrDash, formatDelta, formatTime } from './utils.js';
import { generateScramble } from './scramble.js';
import { applyScramble } from './cube-state.js';
import { initCubeRenderer, updateCubeColors } from './cube-renderer.js';
import {
  addSolve, deleteSolve,
  loadSessionMeta, getActiveSession, setActiveSession,
  createSession, renameSession, deleteSession,
  getSessionSolves, deleteSessionSolves, migrateData,
  getPendingSyncs, clearPendingSyncs, importSolves as storageImportSolves,
} from './storage.js';
import { isLoggedIn } from './auth.js';
import { initAuthUI, startAuthListener } from './auth-ui.js';
import { calcBest, calcAvg, getVsBestColor } from './stats.js';
import { renderSpeedChart } from './chart.js';
import { renderHistoryList, exportSolves, importSolvesFromFile } from './history.js';
import { initTimer } from './timer.js';
import { initMultiplayerUI, isMultiplayer, broadcastTimerUpdate, broadcastNewScramble, saveFinishTime, markMyFinished, setTimerControl, handleMyStateChange, recordMySolve } from './multiplayer-ui.js';

// === DOM References ===

const dom = {
  scrambleText: document.getElementById('scramble-text'),
  timerDisplay: document.getElementById('timer-display'),
  vsBest: document.getElementById('vs-best'),
  hint: document.getElementById('hint'),
  statBest: document.getElementById('stat-best'),
  statAo3: document.getElementById('stat-ao3'),
  statAo5: document.getElementById('stat-ao5'),
  statAo12: document.getElementById('stat-ao12'),
  historyList: document.getElementById('history-list'),
  sessionSelect: document.getElementById('session-select'),
  sessionToday: document.getElementById('session-today'),
  chartCanvas: document.getElementById('speed-chart'),
  chartContainer: document.getElementById('speed-chart-container'),
  importFile: document.getElementById('import-file'),
  cubeScene: document.getElementById('cube-scene'),
  splitDisplayYou: document.getElementById('split-display-you'),
  splitStatusYou: document.getElementById('split-status-you'),
};

initCubeRenderer(dom.cubeScene);

// === Scramble Display ===

function showNewScramble(presetMoves) {
  const moves = presetMoves || generateScramble();
  dom.scrambleText.innerHTML = moves
    .map(m => `<span class="scramble-move">${m}</span>`)
    .join('');
  updateCubeColors(applyScramble(moves));
}

function getCurrentScrambleText() {
  return [...dom.scrambleText.querySelectorAll('.scramble-move')]
    .map(el => el.textContent)
    .join(' ');
}

// === UI Updates ===

async function updateHintVisibility() {
  if (dom.hint) {
    const solves = await getSessionSolves();
    dom.hint.style.display = solves.length > 0 ? 'none' : '';
  }
}

function updateStatValues(solves) {
  const best = calcBest(solves);
  const ao3 = calcAvg(solves, 3);
  const ao5 = calcAvg(solves, 5);
  const ao12 = calcAvg(solves, 12);

  dom.statBest.textContent = formatOrDash(best);
  dom.statAo3.textContent = formatOrDash(ao3);
  dom.statAo5.textContent = formatOrDash(ao5);
  dom.statAo12.textContent = formatOrDash(ao12);

  return { best, ao3, ao5, ao12 };
}

function updateVsBest(solves) {
  if (solves.length <= 1) {
    dom.vsBest.textContent = '';
    return;
  }

  const previousBest = calcBest(solves.slice(1));
  const delta = formatDelta(solves[0].time, previousBest);

  if (!delta) {
    dom.vsBest.textContent = '';
    return;
  }

  dom.vsBest.textContent = 'vs best: ' + delta.text;
  dom.vsBest.style.color = delta.diff === 0 ? '#ffd700' : getVsBestColor(delta.diff);
}

async function renderStats() {
  const solves = await getSessionSolves();
  const { ao3, ao5 } = updateStatValues(solves);
  updateVsBest(solves);
  renderSpeedChart(solves, dom.chartCanvas, dom.chartContainer);
  renderHistoryList(dom.historyList, solves, ao3, ao5);
}

async function renderSessionBar() {
  const meta = await loadSessionMeta();
  dom.sessionSelect.innerHTML = '';
  meta.sessions.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === meta.activeSession) opt.selected = true;
    dom.sessionSelect.appendChild(opt);
  });

  const solves = await getSessionSolves();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = solves.filter(s => s.date?.slice(0, 10) === today).length;
  dom.sessionToday.textContent = todayCount > 0 ? `Today: ${todayCount}` : '';
}

async function refreshAll() {
  await renderSessionBar();
  await renderStats();
  await updateHintVisibility();
}

// === Timer Integration ===

let lastBroadcast = 0;
const BROADCAST_INTERVAL = 100; // ms — throttle to ~10 updates/sec

const timerControl = initTimer(dom.timerDisplay, {
  getScrambleText: getCurrentScrambleText,
  async onStop(elapsed, scramble) {
    if (isMultiplayer()) {
      saveFinishTime(elapsed);
      dom.splitDisplayYou.textContent = formatTime(elapsed);
      dom.splitStatusYou.textContent = 'Done!';
      dom.splitDisplayYou.style.color = '#00e676';
      recordMySolve(elapsed);
      markMyFinished();
    } else {
      showNewScramble();
      await addSolve(elapsed, scramble);
      await renderStats();
      await renderSessionBar();
      if (dom.hint) dom.hint.style.display = 'none';
    }
  },
  onStateChange(state, elapsed) {
    if (!isMultiplayer()) return;
    if (state === 'ready' || state === 'mp-released') {
      handleMyStateChange(state);
      broadcastTimerUpdate(state, elapsed);
      return;
    }
    const now = performance.now();
    if (state === 'running' && now - lastBroadcast < BROADCAST_INTERVAL) return;
    lastBroadcast = now;
    broadcastTimerUpdate(state, elapsed);
    if (state === 'running' || state === 'holding') {
      dom.splitDisplayYou.textContent = formatTime(elapsed);
    }
  }
});
setTimerControl(timerControl);

// === Event Listeners ===

dom.historyList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.history-delete');
  if (btn) {
    await deleteSolve(btn.dataset.id);
    await renderStats();
  }
});

document.getElementById('export-btn').addEventListener('click', () => exportSolves());

document.getElementById('import-btn').addEventListener('click', () => {
  dom.importFile.click();
});

dom.importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importSolvesFromFile(file, refreshAll);
  e.target.value = '';
});

document.getElementById('clear-all-btn').addEventListener('click', async () => {
  if (confirm('Delete all solves in this session?')) {
    const active = isLoggedIn()
      ? (await loadSessionMeta()).activeSession
      : getActiveSession();
    await deleteSessionSolves(active);
    await renderStats();
  }
});

dom.sessionSelect.addEventListener('change', async (e) => {
  await setActiveSession(e.target.value);
  await refreshAll();
});

document.getElementById('session-add').addEventListener('click', async () => {
  const name = prompt('Session name:');
  if (name && name.trim()) {
    await createSession(name.trim());
    await refreshAll();
  }
});

document.getElementById('session-rename').addEventListener('click', async () => {
  const meta = await loadSessionMeta();
  const current = meta.activeSession;
  const name = prompt('Rename session:', current);
  if (name && name.trim() && name.trim() !== current) {
    await renameSession(current, name.trim());
    await refreshAll();
  }
});

document.getElementById('session-delete').addEventListener('click', async () => {
  const meta = await loadSessionMeta();
  const current = meta.activeSession;
  if (confirm(`Delete session "${current}" and all its solves?`)) {
    await deleteSession(current);
    await refreshAll();
  }
});

document.addEventListener('mouseup', (e) => {
  if (e.target.tagName === 'BUTTON') e.target.blur();
});

// Cube panel toggle
const cubePanel = document.getElementById('cube-panel');
const cubeToggle = document.getElementById('cube-toggle');
cubeToggle.addEventListener('click', () => {
  cubePanel.classList.toggle('collapsed');
  cubeToggle.innerHTML = cubePanel.classList.contains('collapsed') ? '&#x25B6;' : '&#x25C0;';
});

// Expose for the inline onclick in HTML
window.showNewScramble = async () => {
  if (isMultiplayer()) {
    const scramble = await broadcastNewScramble();
    if (scramble) showNewScramble(scramble.split(' '));
  } else {
    showNewScramble();
  }
};

// --- Initialization ---
async function init() {
  migrateData();

  // Initialize auth — check for existing session
  await startAuthListener();
  initAuthUI(refreshAll);

  // Flush pending syncs if logged in
  if (isLoggedIn()) {
    await flushPendingSyncs();
  }

  showNewScramble();
  await renderStats();
  await renderSessionBar();
  await updateHintVisibility();
  initMultiplayerUI(showNewScramble);
}

async function flushPendingSyncs() {
  const pending = getPendingSyncs();
  if (pending.length === 0) return;

  try {
    await storageImportSolves(pending);
    clearPendingSyncs();
  } catch (e) {
    // Leave pending for next load
    console.warn('Failed to flush pending syncs:', e);
  }
}

init();
