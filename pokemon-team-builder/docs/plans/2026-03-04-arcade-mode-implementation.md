# Arcade Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add arcade mode with score multipliers, session stashing, streak-breaking bonuses, side bets, and a slot machine reveal animation to the Pokemon Team Battle website.

**Architecture:** This is a vanilla HTML/CSS/JS app with a single `script.js` (~3,187 lines), `styles.css` (~1,505 lines), and minimal `index.html`. All DOM is built dynamically in `DOMContentLoaded`. State lives in global variables and `localStorage`. We add features by extending the existing patterns: new global state vars, new category data arrays, new functions inserted at logical section boundaries, and new CSS classes.

**Tech Stack:** Vanilla HTML/CSS/JS, no build tools, no test framework. Testing is manual browser verification.

**Design doc:** `docs/plans/2026-03-04-arcade-mode-design.md`

---

## Task 1: Session Stashing -- Storage Layer

**Files:**
- Modify: `script.js:1-17` (global state)
- Modify: `script.js` (new section after history logic, ~line 2337)

**Step 1: Add session state variables**

Add after line 17 (`let ocrDebug = true;`):

```javascript
let arcadeMode = false;
let currentSessionId = null; // ID of the active session (null = unsaved new session)
let currentBets = { team1: null, team2: null }; // Side bets for current battle
```

**Step 2: Add session helper functions**

Insert a new section `// ==================== Session Management ====================` after the `hideStreakAchievement` function (~line 2459). Add these functions:

```javascript
// ==================== Session Management ====================

function getSessions() {
    return JSON.parse(localStorage.getItem('sessions')) || [];
}

function saveSessions(sessions) {
    localStorage.setItem('sessions', JSON.stringify(sessions));
}

function generateSessionName() {
    const now = new Date();
    return `Session ${now.toLocaleDateString()}`;
}

function buildSessionSummary(battles) {
    if (battles.length === 0) return { totalBattles: 0, dateRange: null, winSummary: {} };

    const sorted = [...battles].sort((a, b) => a.id - b.id);
    const dateRange = {
        from: sorted[0].date,
        to: sorted[sorted.length - 1].date
    };

    const winSummary = {};
    battles.forEach(result => {
        if (result.winner === 'tie') return;
        const winnerName = result[result.winner].name;
        winSummary[winnerName] = (winSummary[winnerName] || 0) + 1;
    });

    // Detect mode: if any battle is arcade, label as arcade
    const hasArcade = battles.some(b => b.mode === 'arcade');

    return {
        totalBattles: battles.length,
        dateRange,
        winSummary,
        mode: hasArcade ? 'arcade' : 'classic'
    };
}

function stashCurrentSession(name) {
    const battles = JSON.parse(localStorage.getItem('battleHistory')) || [];
    if (battles.length === 0) return null; // Nothing to stash

    const sessions = getSessions();
    const session = {
        id: Date.now(),
        name: name || generateSessionName(),
        createdAt: new Date().toISOString(),
        battles: battles,
        summary: buildSessionSummary(battles)
    };
    sessions.push(session);
    saveSessions(sessions);

    // Clear current history
    localStorage.setItem('battleHistory', JSON.stringify([]));
    fullHistory = [];
    currentSessionId = null;

    return session;
}

function loadSession(sessionId) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return false;

    // Auto-stash current session first (if it has battles)
    const currentBattles = JSON.parse(localStorage.getItem('battleHistory')) || [];
    if (currentBattles.length > 0) {
        stashCurrentSession(null);
    }

    // Load the selected session
    localStorage.setItem('battleHistory', JSON.stringify(session.battles));
    currentSessionId = sessionId;
    loadHistory();
    return true;
}

function deleteSession(sessionId) {
    let sessions = getSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(sessions);
}

function renameSession(sessionId, newName) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.name = newName;
        saveSessions(sessions);
    }
}
```

**Step 3: Verify manually**

Open browser console, run:
- `stashCurrentSession('Test')` -- should save current history as a session
- `getSessions()` -- should return array with the session
- Verify `battleHistory` in localStorage is now `[]`

---

## Task 2: Session Stashing -- Sidebar UI

**Files:**
- Modify: `script.js` DOMContentLoaded handler (~line 2653)
- Modify: `styles.css` (append new styles)

**Step 1: Add sidebar HTML injection**

In the `DOMContentLoaded` handler, before `const teamsContainer = document.querySelector('.teams');` (line 2703), add:

```javascript
// Create sessions sidebar
const sessionsSidebar = document.createElement('div');
sessionsSidebar.id = 'sessions-sidebar';
sessionsSidebar.className = 'sessions-sidebar';
sessionsSidebar.innerHTML = `
    <div class="sessions-sidebar-header">
        <h3>Sessions</h3>
        <button id="close-sidebar-btn" class="sessions-close-btn">&times;</button>
    </div>
    <button id="stash-session-btn" class="sessions-action-btn">Stash & Start Fresh</button>
    <div id="sessions-list" class="sessions-list"></div>
`;
document.body.appendChild(sessionsSidebar);

// Create sidebar toggle button (fixed position, right edge)
const sidebarToggle = document.createElement('button');
sidebarToggle.id = 'sessions-toggle-btn';
sidebarToggle.className = 'sessions-toggle-btn';
sidebarToggle.innerHTML = '📁';
sidebarToggle.title = 'Sessions';
document.body.appendChild(sidebarToggle);
```

**Step 2: Add sidebar event listeners**

After the sidebar HTML injection, add:

```javascript
// Sidebar toggle
document.getElementById('sessions-toggle-btn').addEventListener('click', () => {
    sessionsSidebar.classList.toggle('open');
    if (sessionsSidebar.classList.contains('open')) {
        renderSessionsList();
    }
});
document.getElementById('close-sidebar-btn').addEventListener('click', () => {
    sessionsSidebar.classList.remove('open');
});

// Stash button
document.getElementById('stash-session-btn').addEventListener('click', () => {
    const currentBattles = JSON.parse(localStorage.getItem('battleHistory')) || [];
    if (currentBattles.length === 0) {
        alert('No battles to stash. Play some battles first!');
        return;
    }
    const name = prompt('Name this session:', generateSessionName());
    if (name === null) return; // Cancelled
    stashCurrentSession(name || generateSessionName());
    loadHistory();
    renderSessionsList();
});
```

**Step 3: Add renderSessionsList function**

Add to the Session Management section in `script.js`:

```javascript
function renderSessionsList() {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    const sessions = getSessions();
    if (sessions.length === 0) {
        container.innerHTML = '<p class="sessions-empty">No saved sessions yet.</p>';
        return;
    }

    container.innerHTML = sessions.map(session => {
        const summary = session.summary || buildSessionSummary(session.battles);
        const winEntries = Object.entries(summary.winSummary || {})
            .sort(([, a], [, b]) => b - a)
            .map(([name, wins]) => `${name}: ${wins}W`)
            .join(', ');
        const dateRange = summary.dateRange
            ? `${new Date(summary.dateRange.from).toLocaleDateString()} - ${new Date(summary.dateRange.to).toLocaleDateString()}`
            : 'No battles';
        const modeTag = summary.mode === 'arcade' ? '<span class="session-mode-tag arcade">ARCADE</span>' : '<span class="session-mode-tag classic">CLASSIC</span>';
        const isActive = session.id === currentSessionId;

        return `
            <div class="session-card ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                <div class="session-card-header">
                    <span class="session-name" contenteditable="true" data-session-id="${session.id}">${session.name}</span>
                    ${modeTag}
                </div>
                <div class="session-card-meta">
                    <span>${dateRange}</span>
                    <span>${summary.totalBattles} battle${summary.totalBattles !== 1 ? 's' : ''}</span>
                </div>
                <div class="session-card-wins">${winEntries || 'No wins'}</div>
                <div class="session-card-actions">
                    <button class="session-load-btn" data-session-id="${session.id}" ${isActive ? 'disabled' : ''}>
                        ${isActive ? 'Active' : 'Load'}
                    </button>
                    <button class="session-delete-btn" data-session-id="${session.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    // Event delegation for session cards
    container.querySelectorAll('.session-load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sessionId = parseInt(btn.dataset.sessionId);
            loadSession(sessionId);
            renderSessionsList();
        });
    });

    container.querySelectorAll('.session-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sessionId = parseInt(btn.dataset.sessionId);
            if (confirm('Delete this session? This cannot be undone.')) {
                deleteSession(sessionId);
                renderSessionsList();
            }
        });
    });

    // Inline rename on blur
    container.querySelectorAll('.session-name').forEach(nameEl => {
        nameEl.addEventListener('blur', () => {
            const sessionId = parseInt(nameEl.dataset.sessionId);
            const newName = nameEl.textContent.trim();
            if (newName) renameSession(sessionId, newName);
        });
        nameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
        });
    });
}
```

**Step 4: Add sidebar CSS**

Append to `styles.css`:

```css
/* ==================== Sessions Sidebar ==================== */
.sessions-toggle-btn {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 999;
    background: var(--primary-accent);
    border: 1px solid var(--secondary-accent);
    color: var(--text-color);
    padding: 12px 8px;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: background 0.2s;
}
.sessions-toggle-btn:hover {
    background: var(--secondary-accent);
}

.sessions-sidebar {
    position: fixed;
    right: -340px;
    top: 0;
    width: 340px;
    height: 100vh;
    background: var(--card-bg);
    border-left: 2px solid var(--secondary-accent);
    z-index: 1000;
    transition: right 0.3s ease;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
}
.sessions-sidebar.open {
    right: 0;
}

.sessions-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
.sessions-sidebar-header h3 {
    color: var(--text-color);
    margin: 0;
    font-size: 1.3rem;
}
.sessions-close-btn {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 4px;
}

.sessions-action-btn {
    width: 100%;
    padding: 10px;
    background: var(--secondary-accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 16px;
    transition: opacity 0.2s;
}
.sessions-action-btn:hover { opacity: 0.85; }

.sessions-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.sessions-empty {
    color: #888;
    text-align: center;
    padding: 20px;
    font-style: italic;
}

.session-card {
    background: var(--dark-bg);
    border: 1px solid var(--primary-accent);
    border-radius: 8px;
    padding: 12px;
}
.session-card.active {
    border-color: var(--secondary-accent);
    box-shadow: 0 0 8px rgba(233, 69, 96, 0.3);
}

.session-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}
.session-name {
    color: var(--text-color);
    font-weight: 700;
    font-size: 0.95rem;
    outline: none;
    border-bottom: 1px dashed transparent;
    cursor: text;
}
.session-name:focus {
    border-bottom-color: var(--secondary-accent);
}

.session-mode-tag {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    text-transform: uppercase;
}
.session-mode-tag.arcade {
    background: #ff6b35;
    color: white;
}
.session-mode-tag.classic {
    background: var(--primary-accent);
    color: var(--text-color);
}

.session-card-meta {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 0.8rem;
    margin-bottom: 4px;
}
.session-card-wins {
    color: var(--text-color);
    font-size: 0.85rem;
    margin-bottom: 8px;
}

.session-card-actions {
    display: flex;
    gap: 8px;
}
.session-load-btn, .session-delete-btn {
    flex: 1;
    padding: 6px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
}
.session-load-btn {
    background: var(--primary-accent);
    color: var(--text-color);
}
.session-load-btn:hover:not(:disabled) { background: #1a5276; }
.session-load-btn:disabled { opacity: 0.5; cursor: default; }
.session-delete-btn {
    background: #5a2d2d;
    color: #ff8888;
}
.session-delete-btn:hover { background: #7a3d3d; }
```

**Step 5: Verify manually**

- Reload page. Verify sidebar toggle button appears on right edge.
- Click toggle -- sidebar slides in. Click X -- sidebar slides out.
- Play a few battles and save them. Click "Stash & Start Fresh". Verify history clears.
- Open sidebar again -- session card should appear with correct summary.
- Click "Load" on the session -- verify history restores.
- Click session name to edit it inline.
- Click "Delete" -- confirm dialog, session disappears.

---

## Task 3: Arcade Mode Toggle

**Files:**
- Modify: `index.html:10` (add toggle next to h1)
- Modify: `script.js` DOMContentLoaded handler
- Modify: `styles.css`

**Step 1: Add arcade toggle to HTML**

Replace line 10 in `index.html`:

```html
    <div class="header-row">
        <h1>Pokémon Team Battle</h1>
        <label class="arcade-toggle">
            <input type="checkbox" id="arcade-mode-toggle">
            <span class="arcade-toggle-slider"></span>
            <span class="arcade-toggle-label">ARCADE</span>
        </label>
    </div>
```

**Step 2: Add arcade toggle initialization in DOMContentLoaded**

At the start of the `DOMContentLoaded` handler (after the first line), add:

```javascript
// Initialize arcade mode from localStorage
arcadeMode = localStorage.getItem('arcadeMode') === 'true';
const arcadeToggle = document.getElementById('arcade-mode-toggle');
arcadeToggle.checked = arcadeMode;
document.body.classList.toggle('arcade-active', arcadeMode);

arcadeToggle.addEventListener('change', () => {
    arcadeMode = arcadeToggle.checked;
    localStorage.setItem('arcadeMode', arcadeMode);
    document.body.classList.toggle('arcade-active', arcadeMode);
    updateBetButtonsVisibility();
});
```

Also add a placeholder function (we'll fill it in later):

```javascript
function updateBetButtonsVisibility() {
    // Will be implemented in Task 7 (Side Bets)
}
```

**Step 3: Add arcade toggle CSS and body glow**

Append to `styles.css`:

```css
/* ==================== Arcade Mode Toggle ==================== */
.header-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 10px 0;
}

.arcade-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
}
.arcade-toggle input {
    display: none;
}
.arcade-toggle-slider {
    width: 48px;
    height: 24px;
    background: #444;
    border-radius: 12px;
    position: relative;
    transition: background 0.3s;
}
.arcade-toggle-slider::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 3px;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
}
.arcade-toggle input:checked + .arcade-toggle-slider {
    background: #ff6b35;
}
.arcade-toggle input:checked + .arcade-toggle-slider::after {
    transform: translateX(24px);
}
.arcade-toggle-label {
    color: #888;
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 1px;
    transition: color 0.3s;
}
.arcade-toggle input:checked ~ .arcade-toggle-label {
    color: #ff6b35;
    text-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
}

/* Arcade mode active body treatment */
body.arcade-active {
    border-top: 3px solid #ff6b35;
}
body.arcade-active h1 {
    text-shadow: 0 0 10px rgba(255, 107, 53, 0.4);
}
```

**Step 4: Verify manually**

- Reload page. Toggle should appear next to the title.
- Toggle on -- "ARCADE" label glows orange, body gets top border.
- Toggle off -- returns to normal.
- Reload page -- toggle state persists from localStorage.

---

## Task 4: Multiplier Set Definitions & Detection Logic

**Files:**
- Modify: `script.js` (new section after achievements, ~line 989)

**Step 1: Add arcade multiplier definitions**

Insert after line 989 (after the achievements array closing `];`):

```javascript
// ==================== Arcade Multiplier Sets ====================
// Each set has a check function that receives team data (same format as achievements)
// and returns { matched: boolean, description: string }

const arcadeMultiplierSets = [
    // === Triple Points (3x) - "Against All Odds" ===
    {
        id: 'baby-brigade',
        name: 'Baby Brigade',
        emoji: '🍼',
        multiplier: 3,
        tier: 'against-all-odds',
        flavor: 'Sending babies to war!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.threeStageFirstEvolutions.includes(p)).length;
            if (count >= 4) return { matched: true, description: `${count} first-evolution Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'bottom-barrel',
        name: 'Bottom Barrel',
        emoji: '🪣',
        multiplier: 3,
        tier: 'against-all-odds',
        flavor: 'Scraping the bottom!',
        check: (team) => {
            const avgBST = team.pokemon.reduce((sum, p) => sum + p.score, 0) / team.pokemon.length;
            if (avgBST < 300) return { matched: true, description: `Avg BST: ${Math.round(avgBST)}` };
            return { matched: false };
        }
    },
    {
        id: 'bug-catchers',
        name: 'Bug Catchers',
        emoji: '🐛',
        multiplier: 3,
        tier: 'against-all-odds',
        flavor: 'Youngster Joey energy!',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.includes('bug')).length;
            if (count >= 4) return { matched: true, description: `${count} Bug-type Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'nfe-army',
        name: 'NFE Army',
        emoji: '🚫',
        multiplier: 3,
        tier: 'against-all-odds',
        flavor: 'Refusing to evolve!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const nfeCount = pokemon.filter(p => !pokemonCategories.finalEvolutions.includes(p) && !isLegendary(p)).length;
            if (nfeCount >= 5) return { matched: true, description: `${nfeCount} not fully evolved` };
            return { matched: false };
        }
    },
    {
        id: 'sunkern-special',
        name: 'The Sunkern Special',
        emoji: '🌻',
        multiplier: 3,
        tier: 'against-all-odds',
        flavor: 'The greatest upset!',
        check: (team, isWinner) => {
            if (!isWinner) return { matched: false };
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            if (pokemon.includes('sunkern')) return { matched: true, description: 'Won with Sunkern!' };
            return { matched: false };
        }
    },
    {
        id: 'slowpoke-parade',
        name: 'Slowpoke Parade',
        emoji: '🦥',
        multiplier: 3,
        tier: 'against-all-odds',
        flavor: '...eventually',
        check: (team) => {
            const slowCount = team.pokemon.filter(p => {
                const speedStat = p.stats?.find(s => s.name === 'SPE');
                return speedStat && speedStat.value < 30;
            }).length;
            if (slowCount >= 3) return { matched: true, description: `${slowCount} Pokémon with speed < 30` };
            return { matched: false };
        }
    },

    // === Double Points (2x) - "Thematic Mastery" ===
    {
        id: 'type-specialist',
        name: 'Type Specialist',
        emoji: '🏋️',
        multiplier: 2,
        tier: 'thematic-mastery',
        flavor: 'Gym Leader energy!',
        check: (team) => {
            const typeCounts = {};
            team.pokemon.forEach(p => {
                if (p.types) {
                    p.types.forEach(t => {
                        typeCounts[t] = (typeCounts[t] || 0) + 1;
                    });
                }
            });
            const bestType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];
            if (bestType && bestType[1] >= 3) {
                return { matched: true, description: `${bestType[1]} ${bestType[0].charAt(0).toUpperCase() + bestType[0].slice(1)}-type` };
            }
            return { matched: false };
        }
    },
    {
        id: 'eeveelution-squad',
        name: 'Eeveelution Squad',
        emoji: '🦊',
        multiplier: 2,
        tier: 'thematic-mastery',
        flavor: "Gotta evolve 'em all!",
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.eeveelutions.includes(p)).length;
            if (count >= 3) return { matched: true, description: `${count} Eeveelutions` };
            return { matched: false };
        }
    },
    {
        id: 'fossil-expedition',
        name: 'Fossil Expedition',
        emoji: '🦴',
        multiplier: 2,
        tier: 'thematic-mastery',
        flavor: 'Jurassic Park!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.fossils.includes(p)).length;
            if (count >= 3) return { matched: true, description: `${count} Fossil Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'pretty-in-pink',
        name: 'Pretty in Pink',
        emoji: '🌸',
        multiplier: 2,
        tier: 'thematic-mastery',
        flavor: 'Fabulous!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.pinkPokemon.includes(p)).length;
            if (count >= 3) return { matched: true, description: `${count} Pink Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'kanto-starters-united',
        name: 'Kanto Starters United',
        emoji: '🎮',
        multiplier: 2,
        tier: 'thematic-mastery',
        flavor: 'OG crew!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const hasGrass = pokemonCategories.kantoStarterLines.grass.some(p => pokemon.includes(p));
            const hasFire = pokemonCategories.kantoStarterLines.fire.some(p => pokemon.includes(p));
            const hasWater = pokemonCategories.kantoStarterLines.water.some(p => pokemon.includes(p));
            if (hasGrass && hasFire && hasWater) return { matched: true, description: 'All 3 Kanto starter lines' };
            return { matched: false };
        }
    },
    {
        id: 'rocket-roster',
        name: 'Rocket Roster',
        emoji: '🚀',
        multiplier: 2,
        tier: 'thematic-mastery',
        flavor: 'Prepare for trouble!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const rocketPokemon = [...pokemonCategories.teamRocketMeowth, ...pokemonCategories.teamRocketOther];
            const count = pokemon.filter(p => rocketPokemon.includes(p)).length;
            if (count >= 3) return { matched: true, description: `${count} Team Rocket Pokémon` };
            return { matched: false };
        }
    },

    // === Bonus Points (1.5x) - "Power Play" ===
    {
        id: 'legendary-assembly',
        name: 'Legendary Assembly',
        emoji: '⭐',
        multiplier: 1.5,
        tier: 'power-play',
        flavor: 'Overkill much?',
        check: (team) => {
            const count = team.pokemon.filter(p => isLegendary(p.name)).length;
            if (count >= 3) return { matched: true, description: `${count} Legendaries` };
            return { matched: false };
        }
    },
    {
        id: 'final-form-force',
        name: 'Final Form Force',
        emoji: '💪',
        multiplier: 1.5,
        tier: 'power-play',
        flavor: 'Maximum power!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.finalEvolutions.includes(p)).length;
            if (count >= 4) return { matched: true, description: `${count} fully evolved` };
            return { matched: false };
        }
    },
    {
        id: 'dragons-den',
        name: "Dragon's Den",
        emoji: '🐉',
        multiplier: 1.5,
        tier: 'power-play',
        flavor: 'Beast mode!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.dragons.includes(p)).length;
            if (count >= 3) return { matched: true, description: `${count} Dragon-type` };
            return { matched: false };
        }
    },
    {
        id: 'bird-trio-complete',
        name: 'Bird Trio Complete',
        emoji: '🐦',
        multiplier: 1.5,
        tier: 'power-play',
        flavor: "Collector's edition!",
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            if (pokemonCategories.legendaryBirds.every(b => pokemon.includes(b))) {
                return { matched: true, description: 'Articuno + Zapdos + Moltres' };
            }
            return { matched: false };
        }
    },
    {
        id: 'beast-trio-complete',
        name: 'Beast Trio Complete',
        emoji: '🐾',
        multiplier: 1.5,
        tier: 'power-play',
        flavor: "Johto's finest!",
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const beasts = ['raikou', 'entei', 'suicune'];
            if (beasts.every(b => pokemon.includes(b))) {
                return { matched: true, description: 'Raikou + Entei + Suicune' };
            }
            return { matched: false };
        }
    }
];
```

**Step 2: Add multiplier detection function**

Add right after the `arcadeMultiplierSets` array:

```javascript
function detectArcadeMultipliers(teamData, isWinner) {
    const matched = [];
    // Enrich team data with types and stats from DOM if available
    const enrichedTeam = enrichTeamDataForArcade(teamData);

    arcadeMultiplierSets.forEach(set => {
        const result = set.check(enrichedTeam, isWinner);
        if (result.matched) {
            matched.push({
                id: set.id,
                name: set.name,
                emoji: set.emoji,
                multiplier: set.multiplier,
                tier: set.tier,
                flavor: set.flavor,
                description: result.description
            });
        }
    });
    return matched;
}

function calculateCombinedMultiplier(multipliers) {
    if (multipliers.length === 0) return 1;
    return multipliers.reduce((product, m) => product * m.multiplier, 1);
}

function enrichTeamDataForArcade(teamData) {
    // The team data from getTeamData() only has name, score, sprite.
    // We need types and individual stats for multiplier checks.
    // Read from DOM cards which have this info stored.
    const enriched = { ...teamData };
    const teamId = teamData === getTeamData('team1') ? 'team1' : 'team2';

    // Try to get types and stats from the actual Pokemon cards in DOM
    const grid = document.getElementById(`${teamId}-grid`) || document.getElementById('team1-grid');

    // Find which team this data belongs to by matching team name
    const team1Name = getTeamNameElement('team1')?.textContent;
    const team2Name = getTeamNameElement('team2')?.textContent;
    const actualTeamId = teamData.name === team1Name ? 'team1' : 'team2';
    const actualGrid = document.getElementById(`${actualTeamId}-grid`);

    if (actualGrid) {
        enriched.pokemon = Array.from(actualGrid.children).map(card => {
            const name = card.querySelector('.pokemon-name')?.textContent || '';
            const score = parseInt(card.dataset.totalStats, 10) || 0;
            const sprite = card.querySelector('.pokemon-sprite')?.src || null;

            // Extract types from type bubbles
            const typeBubbles = card.querySelectorAll('.type-bubble');
            const types = Array.from(typeBubbles).map(b => b.textContent.toLowerCase().trim());

            // Extract individual stats
            const statBubbles = card.querySelectorAll('.stat-bubble');
            const stats = Array.from(statBubbles).map(b => ({
                name: b.querySelector('.stat-name')?.textContent || '',
                value: parseInt(b.querySelector('.stat-value')?.textContent, 10) || 0
            }));

            return { name, score, sprite, types, stats };
        });
    }

    return enriched;
}
```

**Step 3: Verify manually**

In the browser console, after building two teams:
- `const team1Data = getTeamData('team1');`
- `const enriched = enrichTeamDataForArcade(team1Data);`
- `console.log(enriched.pokemon[0].types);` -- should show type array
- `detectArcadeMultipliers(team1Data, true)` -- should return array of matching multipliers

---

## Task 5: Scoring Integration -- Multipliers Affect Winner

**Files:**
- Modify: `script.js` `determineWinner()` function (~line 1882)
- Modify: `script.js` `saveCurrentBattle()` function (~line 1962)

**Step 1: Modify determineWinner to use arcade multipliers**

Replace the `determineWinner` function with an arcade-aware version. The key change: when `arcadeMode` is true, instead of immediately comparing scores, we run the slot machine reveal animation (Task 6) which handles the multiplier reveal and winner announcement. When arcade mode is off, behavior is unchanged.

```javascript
async function determineWinner() {
    const team1Score = parseInt(getTeamScoreElement('team1').textContent);
    const team2Score = parseInt(getTeamScoreElement('team2').textContent);

    const team1 = getTeamElement('team1');
    const team2 = getTeamElement('team2');
    const team1Text = getWinnerTextElement('team1');
    const team2Text = getWinnerTextElement('team2');

    // Reset previous winner/tie states
    team1.classList.remove('winner', 'tie');
    team2.classList.remove('winner', 'tie');
    team1Text.textContent = '';
    team2Text.textContent = '';

    const team1Data = getTeamData('team1');
    const team2Data = getTeamData('team2');

    if (arcadeMode) {
        // Arcade mode: detect multipliers, then run slot machine reveal
        // We need to pre-detect multipliers for both teams (winner unknown yet for winner-dependent ones)
        // First pass: detect without winner info
        const team1MultipliersBase = detectArcadeMultipliers(team1Data, false);
        const team2MultipliersBase = detectArcadeMultipliers(team2Data, false);

        const team1Combined = calculateCombinedMultiplier(team1MultipliersBase);
        const team2Combined = calculateCombinedMultiplier(team2MultipliersBase);

        // Apply bets
        const team1BetMultiplier = evaluateBet('team1', team1MultipliersBase);
        const team2BetMultiplier = evaluateBet('team2', team2MultipliersBase);

        const team1Adjusted = Math.round(team1Score * team1Combined * team1BetMultiplier);
        const team2Adjusted = Math.round(team2Score * team2Combined * team2BetMultiplier);

        // Determine preliminary winner from adjusted scores
        let prelimWinner = null;
        if (team1Adjusted > team2Adjusted) prelimWinner = 'team1';
        else if (team2Adjusted > team1Adjusted) prelimWinner = 'team2';

        // Re-detect with winner info for winner-dependent multipliers (e.g., Sunkern Special)
        const team1IsWinner = prelimWinner === 'team1';
        const team2IsWinner = prelimWinner === 'team2';
        const team1MultipliersFinal = detectArcadeMultipliers(team1Data, team1IsWinner);
        const team2MultipliersFinal = detectArcadeMultipliers(team2Data, team2IsWinner);

        const team1CombinedFinal = calculateCombinedMultiplier(team1MultipliersFinal);
        const team2CombinedFinal = calculateCombinedMultiplier(team2MultipliersFinal);

        const team1AdjustedFinal = Math.round(team1Score * team1CombinedFinal * team1BetMultiplier);
        const team2AdjustedFinal = Math.round(team2Score * team2CombinedFinal * team2BetMultiplier);

        // Store arcade data for saving later
        window._arcadeBattleData = {
            team1: {
                rawScore: team1Score,
                multipliers: team1MultipliersFinal,
                combinedMultiplier: team1CombinedFinal,
                betMultiplier: team1BetMultiplier,
                adjustedScore: team1AdjustedFinal,
                bet: currentBets.team1
            },
            team2: {
                rawScore: team2Score,
                multipliers: team2MultipliersFinal,
                combinedMultiplier: team2CombinedFinal,
                betMultiplier: team2BetMultiplier,
                adjustedScore: team2AdjustedFinal,
                bet: currentBets.team2
            }
        };

        // Run the slot machine reveal animation
        await showArcadeReveal(
            team1Score, team2Score,
            team1MultipliersFinal, team2MultipliersFinal,
            team1AdjustedFinal, team2AdjustedFinal,
            currentBets,
            team1BetMultiplier, team2BetMultiplier
        );

        // After animation, determine actual winner
        if (team1AdjustedFinal > team2AdjustedFinal) {
            team1.classList.add('winner');
            team1Text.textContent = `Winner! (${team1AdjustedFinal})`;
            window._arcadeBattleData.winner = 'team1';
        } else if (team2AdjustedFinal > team1AdjustedFinal) {
            team2.classList.add('winner');
            team2Text.textContent = `Winner! (${team2AdjustedFinal})`;
            window._arcadeBattleData.winner = 'team2';
        } else {
            team1.classList.add('tie');
            team2.classList.add('tie');
            team1Text.textContent = 'Tie!';
            team2Text.textContent = 'Tie!';
            window._arcadeBattleData.winner = 'tie';
        }

        // Reset bets for next battle
        currentBets = { team1: null, team2: null };

    } else {
        // Classic mode: unchanged behavior
        await new Promise(resolve => setTimeout(resolve, 500));

        if (team1Score > team2Score) {
            team1.classList.add('winner');
            team1Text.textContent = 'Winner!';
        } else if (team2Score > team1Score) {
            team2.classList.add('winner');
            team2Text.textContent = 'Winner!';
        } else {
            team1.classList.add('tie');
            team2.classList.add('tie');
            team1Text.textContent = 'Tie!';
            team2Text.textContent = 'Tie!';
        }

        window._arcadeBattleData = null;
    }

    // Detect and display achievements (same for both modes)
    const isTie = !team1.classList.contains('winner') && !team2.classList.contains('winner') && team1.classList.contains('tie');
    const team1IsWinner = team1.classList.contains('winner');
    const team2IsWinner = team2.classList.contains('winner');
    currentBattleAchievements.team1 = detectAchievements(team1Data, team1IsWinner, isTie);
    currentBattleAchievements.team2 = detectAchievements(team2Data, team2IsWinner, isTie);

    const crossTeamAchievements = detectCrossTeamAchievements(team1Data, team2Data);
    const allAchievements = [
        ...currentBattleAchievements.team1,
        ...currentBattleAchievements.team2,
        ...crossTeamAchievements
    ];

    const uniqueAchievements = filterTieredAchievements(
        deduplicateAchievements(allAchievements)
    );
    showAchievementPopup(uniqueAchievements);

    // Show the save button
    const saveBtn = getSaveButton();
    saveBtn.style.display = 'block';
    saveBtn.disabled = false;
    isBattleConcluded = true;
}
```

**Step 2: Add bet evaluation placeholder**

Add near the arcade multiplier functions:

```javascript
function evaluateBet(teamId, detectedMultipliers) {
    const bet = currentBets[teamId];
    if (!bet) return 1; // No bet placed
    const betMatched = detectedMultipliers.some(m => m.id === bet.categoryId);
    return betMatched ? 1.5 : 0.75;
}
```

**Step 3: Modify saveCurrentBattle to include arcade data**

In the `saveCurrentBattle` function, modify the `result` object construction (around line 1989). After `winner: winner,` add:

```javascript
        mode: arcadeMode ? 'arcade' : 'classic',
        arcade: window._arcadeBattleData || null,
```

And after saving, clear the arcade data:

```javascript
    window._arcadeBattleData = null;
```

**Step 4: Verify manually**

- Toggle arcade mode ON
- Build two teams, verify multipliers are detected (check console)
- In classic mode, verify everything works exactly as before

---

## Task 6: Slot Machine Reveal Animation

**Files:**
- Modify: `script.js` (new function `showArcadeReveal`)
- Modify: `styles.css` (animation styles)

**Step 1: Add showArcadeReveal function**

Add to script.js after the multiplier detection functions:

```javascript
// ==================== Arcade Reveal Animation ====================

async function showArcadeReveal(
    team1Raw, team2Raw,
    team1Multipliers, team2Multipliers,
    team1Final, team2Final,
    bets, team1BetMult, team2BetMult
) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'arcade-reveal-overlay';
        overlay.innerHTML = `
            <div class="arcade-reveal-container">
                <div class="arcade-reveal-banner">ARCADE BATTLE!</div>
                <div class="arcade-reveal-scores">
                    <div class="arcade-reveal-team">
                        <div class="arcade-reveal-team-name">${getTeamNameElement('team1').textContent}</div>
                        <div class="arcade-reveal-raw-score">${team1Raw}</div>
                        <div class="arcade-reveal-multipliers" id="arcade-reveal-t1-multipliers"></div>
                        <div class="arcade-reveal-final-score" id="arcade-reveal-t1-final"></div>
                    </div>
                    <div class="arcade-reveal-vs">VS</div>
                    <div class="arcade-reveal-team">
                        <div class="arcade-reveal-team-name">${getTeamNameElement('team2').textContent}</div>
                        <div class="arcade-reveal-raw-score">${team2Raw}</div>
                        <div class="arcade-reveal-multipliers" id="arcade-reveal-t2-multipliers"></div>
                        <div class="arcade-reveal-final-score" id="arcade-reveal-t2-final"></div>
                    </div>
                </div>
                <div class="arcade-reveal-winner" id="arcade-reveal-winner"></div>
                <button class="arcade-reveal-skip" id="arcade-reveal-skip">Skip</button>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);

        let skipped = false;
        const skipBtn = document.getElementById('arcade-reveal-skip');

        const cleanup = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            resolve();
        };

        skipBtn.addEventListener('click', () => {
            skipped = true;
            // Show everything immediately
            revealAllMultipliers(team1Multipliers, 't1');
            revealAllMultipliers(team2Multipliers, 't2');
            showBetResults();
            showFinalScoresAndWinner();
            setTimeout(cleanup, 1500);
        });

        function revealAllMultipliers(multipliers, prefix) {
            const container = document.getElementById(`arcade-reveal-${prefix}-multipliers`);
            container.innerHTML = multipliers.map(m =>
                `<div class="arcade-multiplier-badge landed">${m.emoji} ${m.name} <span class="multiplier-value">${m.multiplier}x</span></div>`
            ).join('');
        }

        function showBetResults() {
            if (bets.team1) {
                const container = document.getElementById('arcade-reveal-t1-multipliers');
                const correct = team1BetMult === 1.5;
                container.innerHTML += `<div class="arcade-multiplier-badge bet ${correct ? 'won' : 'lost'} landed">🎰 Bet: ${bets.team1.categoryName} ${correct ? '✓ 1.5x' : '✗ 0.75x'}</div>`;
            }
            if (bets.team2) {
                const container = document.getElementById('arcade-reveal-t2-multipliers');
                const correct = team2BetMult === 1.5;
                container.innerHTML += `<div class="arcade-multiplier-badge bet ${correct ? 'won' : 'lost'} landed">🎰 Bet: ${bets.team2.categoryName} ${correct ? '✓ 1.5x' : '✗ 0.75x'}</div>`;
            }
        }

        function showFinalScoresAndWinner() {
            document.getElementById('arcade-reveal-t1-final').textContent = team1Final;
            document.getElementById('arcade-reveal-t2-final').textContent = team2Final;

            const winnerEl = document.getElementById('arcade-reveal-winner');
            if (team1Final > team2Final) {
                winnerEl.textContent = `${getTeamNameElement('team1').textContent} WINS!`;
                winnerEl.className = 'arcade-reveal-winner show';
            } else if (team2Final > team1Final) {
                winnerEl.textContent = `${getTeamNameElement('team2').textContent} WINS!`;
                winnerEl.className = 'arcade-reveal-winner show';
            } else {
                winnerEl.textContent = "IT'S A TIE!";
                winnerEl.className = 'arcade-reveal-winner show tie';
            }
        }

        // Animated reveal sequence
        async function animateReveal() {
            const allMultipliers = [
                ...team1Multipliers.map(m => ({ ...m, team: 't1' })),
                ...team2Multipliers.map(m => ({ ...m, team: 't2' }))
            ];

            // Reveal multipliers one by one with delay
            for (let i = 0; i < allMultipliers.length; i++) {
                if (skipped) return;
                const m = allMultipliers[i];
                const container = document.getElementById(`arcade-reveal-${m.team}-multipliers`);
                const badge = document.createElement('div');
                badge.className = 'arcade-multiplier-badge spinning';
                badge.innerHTML = `${m.emoji} ${m.name} <span class="multiplier-value">${m.multiplier}x</span>`;
                container.appendChild(badge);

                await new Promise(r => setTimeout(r, 300));
                if (skipped) return;
                badge.classList.remove('spinning');
                badge.classList.add('landed');
                await new Promise(r => setTimeout(r, 400));
            }

            if (skipped) return;

            // Show bet results
            showBetResults();
            await new Promise(r => setTimeout(r, 500));
            if (skipped) return;

            // Show final scores
            showFinalScoresAndWinner();

            // Auto-close after showing winner
            await new Promise(r => setTimeout(r, 2500));
            if (!skipped) cleanup();
        }

        if (team1Multipliers.length === 0 && team2Multipliers.length === 0 && !bets.team1 && !bets.team2) {
            // No bonuses: quick reveal
            const winnerEl = document.getElementById('arcade-reveal-winner');
            const t1Container = document.getElementById('arcade-reveal-t1-multipliers');
            const t2Container = document.getElementById('arcade-reveal-t2-multipliers');
            t1Container.innerHTML = '<div class="arcade-no-bonus">No bonuses</div>';
            t2Container.innerHTML = '<div class="arcade-no-bonus">No bonuses</div>';

            setTimeout(() => {
                showFinalScoresAndWinner();
                setTimeout(cleanup, 2000);
            }, 1000);
        } else {
            animateReveal();
        }
    });
}
```

**Step 2: Add arcade reveal CSS**

Append to `styles.css`:

```css
/* ==================== Arcade Reveal Animation ==================== */
.arcade-reveal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}
.arcade-reveal-overlay.show { opacity: 1; }

.arcade-reveal-container {
    background: var(--card-bg);
    border: 2px solid #ff6b35;
    border-radius: 16px;
    padding: 30px 40px;
    max-width: 700px;
    width: 90%;
    text-align: center;
    box-shadow: 0 0 40px rgba(255, 107, 53, 0.3);
}

.arcade-reveal-banner {
    font-size: 2rem;
    font-weight: 700;
    color: #ff6b35;
    text-shadow: 0 0 15px rgba(255, 107, 53, 0.5);
    margin-bottom: 20px;
    animation: arcade-pulse 1s infinite alternate;
}
@keyframes arcade-pulse {
    from { text-shadow: 0 0 15px rgba(255, 107, 53, 0.5); }
    to { text-shadow: 0 0 25px rgba(255, 107, 53, 0.8), 0 0 40px rgba(255, 107, 53, 0.3); }
}

.arcade-reveal-scores {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 20px;
}

.arcade-reveal-team {
    flex: 1;
    min-width: 0;
}
.arcade-reveal-team-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 6px;
}
.arcade-reveal-raw-score {
    font-size: 1.5rem;
    color: #aaa;
    margin-bottom: 10px;
}
.arcade-reveal-vs {
    font-size: 1.5rem;
    font-weight: 700;
    color: #666;
    padding-top: 30px;
}
.arcade-reveal-final-score {
    font-size: 2rem;
    font-weight: 700;
    color: #ff6b35;
    min-height: 2.5rem;
}

.arcade-reveal-multipliers {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
    min-height: 30px;
}

.arcade-multiplier-badge {
    background: var(--dark-bg);
    border: 1px solid #ff6b35;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 0.85rem;
    color: var(--text-color);
    transition: transform 0.3s, opacity 0.3s;
}
.arcade-multiplier-badge.spinning {
    opacity: 0.5;
    transform: scaleY(0.5);
}
.arcade-multiplier-badge.landed {
    opacity: 1;
    transform: scaleY(1);
    animation: arcade-land 0.3s ease-out;
}
@keyframes arcade-land {
    from { transform: scaleY(1.3) scaleX(0.9); }
    to { transform: scaleY(1) scaleX(1); }
}

.arcade-multiplier-badge.bet.won {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.15);
}
.arcade-multiplier-badge.bet.lost {
    border-color: #f44336;
    background: rgba(244, 67, 54, 0.15);
}

.multiplier-value {
    font-weight: 700;
    color: #ff6b35;
    margin-left: 4px;
}

.arcade-no-bonus {
    color: #666;
    font-style: italic;
    padding: 6px;
}

.arcade-reveal-winner {
    font-size: 1.8rem;
    font-weight: 700;
    color: #4caf50;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.4s, transform 0.4s;
    margin-top: 10px;
}
.arcade-reveal-winner.show {
    opacity: 1;
    transform: scale(1);
}
.arcade-reveal-winner.tie { color: #ffd700; }

.arcade-reveal-skip {
    margin-top: 15px;
    background: none;
    border: 1px solid #666;
    color: #999;
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
}
.arcade-reveal-skip:hover { border-color: #aaa; color: #ccc; }
```

**Step 3: Verify manually**

- Toggle arcade mode ON
- Build two teams with type synergy (e.g., 3+ water types)
- When battle triggers, slot machine overlay should appear
- Multipliers should animate in one by one
- Final adjusted scores should appear
- Winner announcement should show
- Skip button should work
- With no multipliers, should show "No bonuses" quickly

---

## Task 7: Streak-Breaking Bonus Wins

**Files:**
- Modify: `script.js` `saveCurrentBattle()` function
- Modify: `script.js` `updateWinTally()` function
- Modify: `script.js` `showStreakBreakAchievement()` function

**Step 1: Add streak bonus calculation function**

Add to the Session Management or Arcade section:

```javascript
function calculateStreakBreakBonus(streakBroken) {
    if (streakBroken >= 7) return 3;
    if (streakBroken >= 5) return 2;
    if (streakBroken >= 3) return 1;
    return 0;
}

function getStreakBeforeSave(loserTeamName) {
    // Calculate the losing team's streak from history (before this battle is saved)
    const history = JSON.parse(localStorage.getItem('battleHistory')) || [];
    const sorted = [...history].sort((a, b) => b.id - a.id);
    let streak = 0;
    for (const result of sorted) {
        const wasInMatch = result.team1.name === loserTeamName || result.team2.name === loserTeamName;
        if (!wasInMatch) continue;
        const didWin = (result.winner === 'team1' && result.team1.name === loserTeamName) ||
                       (result.winner === 'team2' && result.team2.name === loserTeamName);
        if (didWin) streak++;
        else break;
    }
    return streak;
}
```

**Step 2: Modify saveCurrentBattle to add streak break data and bonus wins**

In `saveCurrentBattle`, after the winner is determined and before the result object is constructed, add:

```javascript
    // Arcade mode: detect streak-breaking bonus
    let streakBreakData = null;
    if (arcadeMode && winner !== 'tie') {
        const loserTeamId = winner === 'team1' ? 'team2' : 'team1';
        const loserName = result[loserTeamId] ? result[loserTeamId].name : (loserTeamId === 'team1' ? team1Data.name : team2Data.name);
        const loserStreak = getStreakBeforeSave(loserName);
        const bonusWins = calculateStreakBreakBonus(loserStreak);
        if (bonusWins > 0) {
            streakBreakData = { broken: loserStreak, bonusWins: bonusWins };
        }
    }
```

Add `streakBreak` to the arcade data on the result object.

**Step 3: Modify updateWinTally to count bonus wins**

In the `updateWinTally` function, modify the tally counting loop to check for arcade bonus wins:

```javascript
    history.forEach(result => {
        if (result.winner === 'tie') return;
        const winnerName = result[result.winner].name;
        const bonusWins = (result.arcade?.streakBreak?.bonusWins) || 0;
        tally[winnerName] = (tally[winnerName] || 0) + 1 + bonusWins;
    });
```

**Step 4: Modify showStreakBreakAchievement to show bonus wins in arcade mode**

```javascript
function showStreakBreakAchievement(teamName, streakCount) {
    const achievementContainer = document.getElementById('streak-achievement');
    const bonusWins = arcadeMode ? calculateStreakBreakBonus(streakCount) : 0;
    const bonusText = bonusWins > 0 ? `<br><span class="streak-bonus-wins">⚡ STREAK BREAKER! +${bonusWins} bonus win${bonusWins > 1 ? 's' : ''}!</span>` : '';

    achievementContainer.innerHTML = `
        <div class="streak-break-notification">
            <button class="streak-close-btn" title="Dismiss">&times;</button>
            💔 <strong>${teamName}</strong>'s ${streakCount}-win streak has ended!${bonusText}
        </div>
    `;
    achievementContainer.style.display = 'block';

    achievementContainer.querySelector('.streak-close-btn').addEventListener('click', () => {
        achievementContainer.style.display = 'none';
    });
}
```

**Step 5: Add CSS for bonus wins text**

```css
.streak-bonus-wins {
    color: #ff6b35;
    font-weight: 700;
    font-size: 1rem;
}
```

**Step 6: Verify manually**

- Toggle arcade mode ON
- Play several battles so one team builds a 3+ win streak
- Have the losing team win to break the streak
- Verify "STREAK BREAKER! +1 bonus wins!" shows
- Verify the win tally counts the bonus wins

---

## Task 8: Side-Betting System

**Files:**
- Modify: `script.js` (bet UI, bet logic)
- Modify: `styles.css` (bet styling)

**Step 1: Add bet UI injection**

In the `DOMContentLoaded` handler, add bet buttons after each team's button-container. Add after the autocomplete setup:

```javascript
// Add bet buttons for arcade mode
['team1', 'team2'].forEach(teamId => {
    const team = document.getElementById(teamId);
    const buttonContainer = team.querySelector('.button-container');
    const betBtn = document.createElement('button');
    betBtn.className = 'bet-btn';
    betBtn.id = `${teamId}-bet-btn`;
    betBtn.textContent = '🎰 Place Bet';
    betBtn.style.display = arcadeMode ? '' : 'none';
    betBtn.addEventListener('click', () => showBetModal(teamId));
    buttonContainer.appendChild(betBtn);
});
```

**Step 2: Implement updateBetButtonsVisibility (replace placeholder)**

```javascript
function updateBetButtonsVisibility() {
    ['team1', 'team2'].forEach(teamId => {
        const btn = document.getElementById(`${teamId}-bet-btn`);
        if (btn) {
            btn.style.display = arcadeMode ? '' : 'none';
            // Reset bet indicators when turning off arcade
            if (!arcadeMode) {
                currentBets[teamId] = null;
                btn.textContent = '🎰 Place Bet';
                btn.classList.remove('bet-placed');
            }
        }
    });
}
```

**Step 3: Add bet modal and selection logic**

```javascript
function showBetModal(teamId) {
    if (isBattleConcluded) return; // Can't bet after battle

    const categories = arcadeMultiplierSets.map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        tier: s.tier
    }));

    const popup = createPopup('bet-modal', 'bet-modal-popup', `
        <div class="bet-modal-content">
            <h3>🎰 Place Your Bet</h3>
            <p class="bet-modal-desc">Bet on a bonus you think your team qualifies for.<br>Correct: 1.5x bonus | Wrong: 0.75x penalty</p>
            <div class="bet-categories">
                ${categories.map(c => `
                    <button class="bet-category-btn" data-id="${c.id}" data-name="${c.name}">
                        ${c.emoji} ${c.name}
                    </button>
                `).join('')}
            </div>
            <button class="bet-cancel-btn">Cancel / No Bet</button>
        </div>
    `);

    popup.querySelectorAll('.bet-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentBets[teamId] = {
                categoryId: btn.dataset.id,
                categoryName: btn.dataset.name
            };
            const betBtn = document.getElementById(`${teamId}-bet-btn`);
            betBtn.textContent = '🎰 Bet Placed!';
            betBtn.classList.add('bet-placed');
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        });
    });

    popup.querySelector('.bet-cancel-btn').addEventListener('click', () => {
        currentBets[teamId] = null;
        const betBtn = document.getElementById(`${teamId}-bet-btn`);
        betBtn.textContent = '🎰 Place Bet';
        betBtn.classList.remove('bet-placed');
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });

    setupPopupCloseHandlers(popup, '.bet-cancel-btn');
}
```

**Step 4: Add bet CSS**

```css
/* ==================== Side Betting ==================== */
.bet-btn {
    background: #3d2e00;
    color: #ffd700;
    border: 1px solid #ffd700;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
}
.bet-btn:hover { background: #5a4400; }
.bet-btn.bet-placed {
    background: #2d5a00;
    border-color: #4caf50;
    color: #4caf50;
}

.bet-modal-popup {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1500;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}
.bet-modal-popup.show { opacity: 1; }

.bet-modal-content {
    background: var(--card-bg);
    border: 2px solid #ffd700;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    text-align: center;
}
.bet-modal-content h3 {
    color: #ffd700;
    margin-bottom: 8px;
}
.bet-modal-desc {
    color: #aaa;
    font-size: 0.85rem;
    margin-bottom: 16px;
}
.bet-categories {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 12px;
}
.bet-category-btn {
    background: var(--dark-bg);
    border: 1px solid var(--primary-accent);
    color: var(--text-color);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
    transition: border-color 0.2s;
}
.bet-category-btn:hover {
    border-color: #ffd700;
}
.bet-cancel-btn {
    background: none;
    border: 1px solid #666;
    color: #999;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}
.bet-cancel-btn:hover { border-color: #aaa; color: #ccc; }
```

**Step 5: Verify manually**

- Toggle arcade mode ON -- bet buttons should appear on each team
- Click "Place Bet" -- modal with all categories should open
- Select a category -- button should change to "Bet Placed!"
- Build teams and trigger battle -- bet result should show in the reveal
- Toggle arcade mode OFF -- bet buttons should disappear

---

## Task 9: History Display Updates for Arcade Battles

**Files:**
- Modify: `script.js` `renderHistoryEntry()` function (~line 2055)
- Modify: `styles.css`

**Step 1: Update renderHistoryEntry to show arcade data**

In the `renderHistoryEntry` function, after the achievement badges HTML generation, add arcade-specific display:

```javascript
    // Arcade mode display
    let arcadeBadgeHTML = '';
    let arcadeDetailsHTML = '';
    if (result.mode === 'arcade' && result.arcade) {
        arcadeBadgeHTML = '<span class="history-arcade-tag">ARCADE</span>';

        const formatMultipliers = (teamArcade) => {
            if (!teamArcade?.multipliers?.length) return '<span class="no-multipliers">No bonuses</span>';
            return teamArcade.multipliers.map(m =>
                `<span class="history-multiplier-badge">${m.emoji} ${m.name} ${m.multiplier}x</span>`
            ).join(' ');
        };

        const t1 = result.arcade.team1;
        const t2 = result.arcade.team2;
        const streakHTML = result.arcade.streakBreak
            ? `<div class="history-streak-break">⚡ Streak Breaker! ${result.arcade.streakBreak.broken}-streak broken, +${result.arcade.streakBreak.bonusWins} bonus wins</div>`
            : '';

        arcadeDetailsHTML = `
            <div class="history-arcade-details">
                <div class="history-arcade-team">
                    <span class="arcade-detail-label">${result.team1.name}:</span>
                    ${formatMultipliers(t1)}
                    ${t1?.combinedMultiplier > 1 ? `<span class="arcade-total-mult">${t1.combinedMultiplier}x = ${t1.adjustedScore}</span>` : ''}
                </div>
                <div class="history-arcade-team">
                    <span class="arcade-detail-label">${result.team2.name}:</span>
                    ${formatMultipliers(t2)}
                    ${t2?.combinedMultiplier > 1 ? `<span class="arcade-total-mult">${t2.combinedMultiplier}x = ${t2.adjustedScore}</span>` : ''}
                </div>
                ${streakHTML}
            </div>
        `;
    }
```

Then inject `arcadeBadgeHTML` into the meta div and `arcadeDetailsHTML` after the team sections in the entry's innerHTML.

Modify the `entry.innerHTML` to include:

```javascript
    entry.innerHTML = `
        <button class="delete-history-btn" title="Delete this entry">&times;</button>
        <div class="history-meta"><span>${new Date(result.date).toLocaleString()}</span> ${arcadeBadgeHTML}</div>
        <div class="history-team-compact">
            <h3>${result.team1.name} (${result.team1.score})${team1WinnerTag}${tieTag}</h3>
            <div class="history-pokemon-list">${team1PokemonList}</div>
        </div>
        <div class="history-team-compact">
            <h3>${result.team2.name} (${result.team2.score})${team2WinnerTag}${tieTag}</h3>
            <div class="history-pokemon-list">${team2PokemonList}</div>
        </div>
        ${arcadeDetailsHTML}
        ${achievementBadgesHTML}
        <span class="load-hint">Click to Load Battle</span>`;
```

**Step 2: Add arcade history CSS**

```css
/* ==================== Arcade History Display ==================== */
.history-arcade-tag {
    background: #ff6b35;
    color: white;
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 700;
    margin-left: 8px;
    vertical-align: middle;
}

.history-arcade-details {
    background: rgba(255, 107, 53, 0.08);
    border: 1px solid rgba(255, 107, 53, 0.2);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 6px 0;
    font-size: 0.8rem;
}

.history-arcade-team {
    margin-bottom: 4px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
}
.arcade-detail-label {
    color: var(--text-color);
    font-weight: 600;
    margin-right: 4px;
}
.history-multiplier-badge {
    background: var(--dark-bg);
    border: 1px solid #ff6b35;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 0.75rem;
}
.no-multipliers {
    color: #666;
    font-style: italic;
}
.arcade-total-mult {
    color: #ff6b35;
    font-weight: 700;
    margin-left: 4px;
}

.history-streak-break {
    color: #ff6b35;
    font-weight: 600;
    margin-top: 4px;
    font-size: 0.85rem;
}
```

**Step 3: Verify manually**

- Play a battle in arcade mode with multipliers active
- Save the battle
- Check history entry -- should show "ARCADE" badge, multiplier breakdown, adjusted scores
- Play a classic mode battle -- should show normal history without arcade data

---

## Task 10: Integration Testing & Polish

**Step 1: Full workflow test -- Classic mode**

- Ensure all existing functionality works unchanged when arcade mode is OFF
- Save a few battles, verify history, GOAT/WOAT, graph, streaks, achievements all work

**Step 2: Full workflow test -- Arcade mode**

- Toggle ON, build teams with known multipliers (e.g., 3+ water types)
- Verify slot machine shows Type Specialist 2x
- Verify adjusted score determines winner (not raw BST)
- Place a bet, verify correct/incorrect outcomes
- Break a 3+ streak, verify bonus wins
- Check history shows arcade data

**Step 3: Session stashing workflow**

- Play 5 battles
- Stash session
- Play 3 more battles
- Stash again
- Load first session -- verify all 5 battles appear
- Load second session -- verify 3 battles appear
- Delete a session

**Step 4: Edge cases**

- No multipliers on either team in arcade mode (fast reveal path)
- Tie in arcade mode
- Switching arcade mode mid-session (battles should be tagged correctly per-battle)
- Empty session stash attempt (should show message)
- Very large multiplier stacking (verify display doesn't break)
