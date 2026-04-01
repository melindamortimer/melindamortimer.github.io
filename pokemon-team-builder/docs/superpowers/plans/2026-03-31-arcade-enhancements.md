# Arcade Mode Enhancements Implementation Plan

> **For agentic workers:** Execute this plan using a team of agents. Spawn teammates for independent tasks, coordinate via task list. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bet tooltips, GOAT/WOAT game thresholds, history replay button, and 25 new betting outcomes across two new tiers.

**Architecture:** All changes are in `script.js` and `styles.css`. The existing arcade system has `pokemonCategories` (data lists), `arcadeMultiplierSets` (achievement definitions), `getContributingPokemon` (per-achievement Pokemon attribution), and `showBetModal`/`showArcadeReveal` (UI). We add new data lists, new achievement entries, and update the UI components.

**Tech Stack:** Vanilla JavaScript, CSS, HTML. No build step, no test framework. Verification is manual (open `index.html` in browser).

**Spec:** `docs/superpowers/specs/2026-03-31-arcade-enhancements-design.md`

**Git policy:** User handles all git operations. Plan steps note when a commit is appropriate but do not include git commands.

---

### Task 1: Add New Pokemon Category Lists

**Files:**
- Modify: `script.js:571-758` (inside `pokemonCategories` object)

Add 17 new arrays and 1 type effectiveness table to `pokemonCategories`.

- [ ] **Step 1: Add color lists after the existing `starters` array (line 757)**

Insert before the closing `};` of `pokemonCategories`:

```javascript
    // === Color categories (official Pokedex color + visual judgment, Gen 1-2) ===
    bluePokemon: [
        'squirtle', 'wartortle', 'blastoise', 'nidoran-f', 'nidorina', 'nidoqueen',
        'oddish', 'golduck', 'poliwag', 'poliwhirl', 'poliwrath', 'tentacool',
        'tentacruel', 'tangela', 'horsea', 'seadra', 'gyarados', 'lapras',
        'vaporeon', 'omanyte', 'omastar', 'articuno', 'dratini', 'dragonair',
        'totodile', 'croconaw', 'feraligatr', 'chinchou', 'lanturn', 'marill',
        'azumarill', 'jumpluff', 'wooper', 'quagsire', 'wobbuffet', 'heracross',
        'kingdra', 'phanpy', 'suicune'
    ],
    redOrangePokemon: [
        'charmander', 'charmeleon', 'charizard', 'vulpix', 'growlithe', 'arcanine',
        'paras', 'parasect', 'krabby', 'kingler', 'goldeen', 'seaking', 'voltorb',
        'electrode', 'magikarp', 'flareon', 'magmar', 'jynx', 'scizor', 'vileplume',
        'ledyba', 'ledian', 'ariados', 'slugma', 'magcargo', 'octillery', 'delibird',
        'magby', 'ho-oh', 'cyndaquil', 'quilava', 'typhlosion', 'porygon2', 'yanma'
    ],
    purplePokemon: [
        'rattata', 'ekans', 'arbok', 'nidoran-m', 'nidorino', 'nidoking', 'zubat',
        'golbat', 'crobat', 'venonat', 'venomoth', 'gloom', 'grimer', 'muk',
        'shellder', 'cloyster', 'gastly', 'haunter', 'gengar', 'koffing', 'weezing',
        'starmie', 'ditto', 'aerodactyl', 'mewtwo', 'espeon', 'misdreavus', 'aipom',
        'gligar', 'granbull', 'forretress', 'mantine', 'tyrogue'
    ],
    greenPokemon: [
        'bulbasaur', 'ivysaur', 'venusaur', 'caterpie', 'metapod', 'bellsprout',
        'weepinbell', 'victreebel', 'scyther', 'chikorita', 'bayleef', 'meganium',
        'spinarak', 'natu', 'xatu', 'bellossom', 'politoed', 'skiploom', 'sunkern',
        'sunflora', 'larvitar', 'tyranitar', 'celebi'
    ],
    yellowPokemon: [
        'kakuna', 'beedrill', 'pikachu', 'raichu', 'sandshrew', 'sandslash',
        'ninetales', 'meowth', 'persian', 'psyduck', 'ponyta', 'rapidash',
        'drowzee', 'hypno', 'exeggutor', 'electabuzz', 'jolteon', 'zapdos',
        'moltres', 'pichu', 'mareep', 'flaaffy', 'ampharos', 'girafarig',
        'dunsparce', 'shuckle', 'elekid', 'raikou'
    ],
    brownPokemon: [
        'weedle', 'pidgey', 'pidgeotto', 'pidgeot', 'raticate', 'spearow', 'fearow',
        'diglett', 'dugtrio', 'mankey', 'primeape', 'abra', 'kadabra', 'alakazam',
        'geodude', 'graveler', 'golem', 'farfetchd', 'doduo', 'dodrio', 'cubone',
        'marowak', 'hitmonlee', 'hitmonchan', 'rhyhorn', 'rhydon', 'kangaskhan',
        'staryu', 'pinsir', 'tauros', 'eevee', 'kabuto', 'kabutops', 'dragonite',
        'sentret', 'furret', 'hoothoot', 'noctowl', 'sudowoodo', 'teddiursa',
        'ursaring', 'swinub', 'piloswine', 'stantler', 'hitmontop', 'miltank', 'entei'
    ],
```

- [ ] **Step 2: Add shape/body lists after color lists**

```javascript
    // === Shape/body categories (Gen 1-2) ===
    serpentinePokemon: [
        'ekans', 'arbok', 'onix', 'dratini', 'dragonair', 'gyarados',
        'steelix', 'dunsparce'
    ],
    roundPokemon: [
        'clefairy', 'clefable', 'jigglypuff', 'wigglytuff', 'voltorb', 'electrode',
        'exeggcute', 'koffing', 'weezing', 'gastly', 'chansey', 'ditto', 'snorlax',
        'togepi', 'cleffa', 'igglybuff', 'marill', 'azumarill', 'hoppip', 'jumpluff',
        'sunkern', 'wobbuffet', 'pineco', 'forretress', 'corsola', 'qwilfish', 'blissey'
    ],
    aquaticPokemon: [
        'tentacool', 'tentacruel', 'seel', 'dewgong', 'shellder', 'cloyster',
        'horsea', 'seadra', 'goldeen', 'seaking', 'staryu', 'starmie', 'magikarp',
        'gyarados', 'lapras', 'omanyte', 'omastar', 'kabuto', 'kabutops',
        'chinchou', 'lanturn', 'qwilfish', 'corsola', 'remoraid', 'octillery',
        'mantine', 'kingdra'
    ],
    tinyPokemon: [
        'diglett', 'natu', 'caterpie', 'weedle', 'pidgey', 'rattata', 'spearow',
        'paras', 'magnemite', 'shellder', 'ditto', 'eevee', 'pichu', 'cleffa',
        'igglybuff', 'togepi', 'sunkern', 'pikachu', 'nidoran-f', 'meowth',
        'geodude', 'krabby', 'exeggcute', 'cubone', 'horsea', 'omanyte', 'mew',
        'bellossom', 'marill', 'hoppip', 'wooper', 'swinub', 'smoochum'
    ],
    giantPokemon: [
        'steelix', 'onix', 'gyarados', 'lugia', 'dragonair', 'ho-oh', 'arbok',
        'lapras', 'feraligatr', 'kangaskhan', 'dragonite', 'snorlax', 'mantine', 'entei'
    ],
    rodentPokemon: [
        'rattata', 'raticate', 'pikachu', 'raichu', 'sandshrew', 'sandslash',
        'nidoran-f', 'nidorina', 'nidoran-m', 'nidorino', 'pichu', 'sentret',
        'furret', 'marill', 'azumarill', 'cyndaquil'
    ],
    floralPokemon: [
        'bulbasaur', 'ivysaur', 'venusaur', 'oddish', 'gloom', 'vileplume',
        'paras', 'parasect', 'bellsprout', 'weepinbell', 'victreebel', 'exeggcute',
        'exeggutor', 'tangela', 'chikorita', 'bayleef', 'meganium', 'bellossom',
        'hoppip', 'skiploom', 'jumpluff', 'sunkern', 'sunflora', 'celebi'
    ],
    birdPokemon: [
        'pidgey', 'pidgeotto', 'pidgeot', 'spearow', 'fearow', 'farfetchd',
        'doduo', 'dodrio', 'articuno', 'zapdos', 'moltres', 'hoothoot', 'noctowl',
        'natu', 'xatu', 'murkrow', 'delibird', 'skarmory', 'lugia', 'ho-oh', 'togetic'
    ],
    spikyPokemon: [
        'sandslash', 'nidoran-m', 'nidorino', 'nidoking', 'nidoran-f', 'nidorina',
        'nidoqueen', 'beedrill', 'cloyster', 'jolteon', 'omastar', 'pinsir',
        'corsola', 'qwilfish', 'heracross', 'forretress', 'sneasel', 'skarmory',
        'steelix', 'tyranitar'
    ],
```

- [ ] **Step 3: Add type effectiveness table after shape lists**

```javascript
    // === Type effectiveness (all 51 super-effective pairs) ===
    // Format: [attackType, defenseType] meaning attackType deals 2x to defenseType
    typeEffectiveness: [
        ['bug', 'dark'], ['bug', 'grass'], ['bug', 'psychic'],
        ['dark', 'ghost'], ['dark', 'psychic'],
        ['dragon', 'dragon'],
        ['electric', 'flying'], ['electric', 'water'],
        ['fairy', 'dark'], ['fairy', 'dragon'], ['fairy', 'fighting'],
        ['fighting', 'dark'], ['fighting', 'ice'], ['fighting', 'normal'],
        ['fighting', 'rock'], ['fighting', 'steel'],
        ['fire', 'bug'], ['fire', 'grass'], ['fire', 'ice'], ['fire', 'steel'],
        ['flying', 'bug'], ['flying', 'fighting'], ['flying', 'grass'],
        ['ghost', 'ghost'], ['ghost', 'psychic'],
        ['grass', 'ground'], ['grass', 'rock'], ['grass', 'water'],
        ['ground', 'electric'], ['ground', 'fire'], ['ground', 'poison'],
        ['ground', 'rock'], ['ground', 'steel'],
        ['ice', 'dragon'], ['ice', 'flying'], ['ice', 'grass'], ['ice', 'ground'],
        ['poison', 'fairy'], ['poison', 'grass'],
        ['psychic', 'fighting'], ['psychic', 'poison'],
        ['rock', 'bug'], ['rock', 'fire'], ['rock', 'flying'], ['rock', 'ice'],
        ['steel', 'fairy'], ['steel', 'ice'], ['steel', 'rock'],
        ['water', 'fire'], ['water', 'ground'], ['water', 'rock']
    ]
```

- [ ] **Step 4: Verify** - Open `index.html` in browser, open console, type `pokemonCategories.bluePokemon.length`. Should return `39`. Check a few others (`brownPokemon` should be `47`, `typeEffectiveness` should be `51`).

- [ ] **Step 5: Commit** - "Add 17 new Pokemon category lists and type effectiveness table for arcade achievements"

---

### Task 2: Add Pokedex ID Extraction

**Files:**
- Modify: `script.js` — add helper near `enrichTeamDataForArcade` (around line 1753), update enrichment to include `pokedexId`

Several new achievements (Neighbors, Gen 1/Gen 2 Purist) need Pokedex IDs. The sprite URL contains the ID in the pattern `/pokemon/{id}.png`.

- [ ] **Step 1: Add helper function before `enrichTeamDataForArcade`**

Insert before line 1753:

```javascript
function getPokedexIdFromSprite(spriteUrl) {
    const match = spriteUrl?.match(/\/pokemon\/(\d+)\./);
    return match ? parseInt(match[1]) : null;
}
```

- [ ] **Step 2: Add `pokedexId` to the enrichment output**

In `enrichTeamDataForArcade` (line 1781), the `return` inside the `.map()` currently returns `{ name, score, sprite, types, stats }`. Add `pokedexId`:

Change:
```javascript
            return { name, score, sprite, types, stats };
```
to:
```javascript
            const pokedexId = getPokedexIdFromSprite(sprite);
            return { name, score, sprite, types, stats, pokedexId };
```

- [ ] **Step 3: Verify** - Open console, add a Pokemon manually (e.g., Pikachu), then run: `enrichTeamDataForArcade(getTeamData('team1')).pokemon[0].pokedexId`. Should return `25`.

- [ ] **Step 4: Commit** - "Add Pokedex ID extraction to arcade enrichment for new achievements"

---

### Task 3: Add `hint` Field to Existing Achievements + Tooltip UI

**Files:**
- Modify: `script.js:1097-1606` (add `hint` to each entry in `arcadeMultiplierSets`)
- Modify: `script.js:1795-1843` (`showBetModal` — update button template)
- Modify: `styles.css` (add tooltip styles)

- [ ] **Step 1: Add `hint` field to each of the 34 existing `arcadeMultiplierSets` entries**

Add a `hint` property to each object. Insert after the `flavor` line in each entry. Here are all 34:

**Against All Odds tier:**
```
baby-brigade:     hint: '3+ first-evolution Pokemon from 3-stage lines',
bottom-barrel:    hint: 'Team average BST under 350',
bug-catchers:     hint: '3+ Bug-type Pokemon',
nfe-army:         hint: '4+ not fully evolved Pokemon',
sunkern-special:  hint: 'Win the battle with Sunkern on your team',
slowpoke-parade:  hint: '2+ Slowpoke family members',
cocoon-chaos:     hint: '2+ cocoon Pokemon (Metapod, Kakuna, etc.)',
```

**Thematic Mastery tier:**
```
type-specialist:       hint: '3+ Pokemon sharing one type',
eeveelution-squad:     hint: '2+ Eeveelutions',
fossil-expedition:     hint: '2+ Fossil Pokemon',
pretty-in-pink:        hint: '2+ pink Pokemon',
kanto-starters-united: hint: 'All 3 Kanto starter lines represented',
rocket-roster:         hint: '2+ Team Rocket Pokemon',
pikaclone-parade:      hint: '2+ Pikaclones',
cat-cafe:              hint: '2+ cat Pokemon',
good-boys:             hint: '2+ dog Pokemon',
egg-gang:              hint: '2+ egg-themed Pokemon',
gym-leader:            hint: '5+ Pokemon sharing one type',
starter-pack:          hint: '3+ starter Pokemon',
ghost-story:           hint: '2+ Ghost-type',
fairy-tale:            hint: '2+ Fairy-type',
steel-wall:            hint: '2+ Steel-type',
fighting-dojo:         hint: '2+ Fighting-type',
```

**Power Play tier:**
```
legendary-assembly:    hint: '2+ Legendary Pokemon',
final-form-force:      hint: '4+ fully evolved Pokemon',
dragons-den:           hint: '2+ Dragon-type',
bird-trio-complete:    hint: 'Articuno + Zapdos + Moltres',
beast-trio-complete:   hint: 'Raikou + Entei + Suicune',
pseudo-legendary-club: hint: '2+ pseudo-legendaries',
speed-demons:          hint: '3+ Pokemon with 100+ base Speed',
tank-division:         hint: '3+ Pokemon with 90+ base Defense',
elemental-trio:        hint: 'Fire + Water + Grass types on team',
glass-cannons:         hint: '2+ Pokemon with ATK/SPATK >100 and HP <70',
the-impostor:          hint: 'Ditto on the team',
```

- [ ] **Step 2: Also add `hint` to the data pulled in `showBetModal`**

Update line 1798 to also pull `hint`, `bonus`, and `flavor`:

```javascript
    const categories = arcadeMultiplierSets.map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        tier: s.tier,
        bonus: s.bonus,
        flavor: s.flavor,
        hint: s.hint
    }));
```

- [ ] **Step 3: Update the bet button template with tooltip**

Replace the button template in `showBetModal` (lines 1810-1813):

```javascript
                ${categories.map(c => `
                    <button class="bet-category-btn" data-id="${c.id}" data-name="${c.name}">
                        <span class="bet-btn-main">${c.emoji} ${c.name}</span>
                        <span class="bet-btn-info">+${c.bonus}/ea</span>
                        <span class="bet-tooltip">${c.flavor} — ${c.hint}</span>
                    </button>
                `).join('')}
```

- [ ] **Step 4: Add CSS for the tooltip and button layout**

Add to `styles.css` after the `.bet-cancel-btn:hover` rule (around line 1932):

```css
.bet-category-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.bet-btn-main {
    text-align: left;
}
.bet-btn-info {
    font-size: 0.75rem;
    color: #ffd700;
    opacity: 0.7;
    white-space: nowrap;
    margin-left: 8px;
}
.bet-tooltip {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    margin-top: 4px;
    background: #1a1a2e;
    border: 1px solid #ffd700;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 0.78rem;
    color: #ccc;
    z-index: 10;
    white-space: normal;
    line-height: 1.3;
    pointer-events: none;
}
.bet-category-btn:hover .bet-tooltip,
.bet-category-btn:focus .bet-tooltip {
    display: block;
}
```

- [ ] **Step 5: Verify** - Enable arcade mode, add 6 Pokemon to one team, click "Place Bet." Hover over any button — should see the tooltip with flavor text, dash, and hint. The `+bonus/ea` should appear right-aligned.

- [ ] **Step 6: Commit** - "Add hint descriptions and hover tooltips to bet placement buttons"

---

### Task 4: Add Tier Section Headers to Bet Modal

**Files:**
- Modify: `script.js` — `showBetModal` function
- Modify: `styles.css` — tier header styles

With 59 achievements coming, the bet modal needs organization by tier.

- [ ] **Step 1: Replace the flat button list with grouped sections**

In `showBetModal`, replace the `categories.map(...)` section with grouped rendering. Replace the entire `<div class="bet-categories">...</div>` block:

```javascript
            <div class="bet-categories">
                ${(() => {
                    const tierOrder = ['against-all-odds', 'thematic-mastery', 'power-play', 'quick-match', 'lucky-finds'];
                    const tierLabels = {
                        'against-all-odds': 'Against All Odds (+100/ea)',
                        'thematic-mastery': 'Thematic Mastery (+75/ea)',
                        'power-play': 'Power Play (+50/ea)',
                        'quick-match': 'Quick Match (+30/ea)',
                        'lucky-finds': 'Lucky Finds (+15/ea)'
                    };
                    return tierOrder.map(tier => {
                        const tierCats = categories.filter(c => c.tier === tier);
                        if (tierCats.length === 0) return '';
                        return `
                            <div class="bet-tier-section">
                                <div class="bet-tier-header">${tierLabels[tier]}</div>
                                ${tierCats.map(c => `
                                    <button class="bet-category-btn" data-id="${c.id}" data-name="${c.name}">
                                        <span class="bet-btn-main">${c.emoji} ${c.name}</span>
                                        <span class="bet-btn-info">+${c.bonus}/ea</span>
                                        <span class="bet-tooltip">${c.flavor} — ${c.hint}</span>
                                    </button>
                                `).join('')}
                            </div>
                        `;
                    }).join('');
                })()}
            </div>
```

- [ ] **Step 2: Add tier header CSS**

```css
.bet-tier-section {
    margin-bottom: 8px;
}
.bet-tier-header {
    color: #ffd700;
    font-size: 0.8rem;
    font-weight: bold;
    padding: 6px 0 4px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    margin-bottom: 4px;
    position: sticky;
    top: 0;
    background: var(--card-bg);
    z-index: 1;
}
```

- [ ] **Step 3: Verify** - Open bet modal. Should see tier section headers separating the achievement groups. Headers should be sticky when scrolling.

- [ ] **Step 4: Commit** - "Add tier section headers to bet placement modal"

---

### Task 5: GOAT/WOAT Tiered Game Thresholds

**Files:**
- Modify: `script.js:2337-2419` (`detectGoatWoatAchievements`)
- Modify: `script.js:3985+` (`updateGoatWoat` — add threshold messages)

- [ ] **Step 1: Replace the single threshold with tiered checks**

In `detectGoatWoatAchievements`, replace the early return at line 2357:

```javascript
    // Need enough history for rankings to be meaningful (at least 10 teams = 5 battles)
    if (allScores.length < 10) return result;
```

with tiered threshold logic:

```javascript
    const totalGames = Math.floor(allScores.length / 2);
    // Champion & Elite: need 10+ games
    const hasEnoughForElite = totalGames >= 10;
    // Contender: need 50+ games
    const hasEnoughForContender = totalGames >= 50;

    // Not enough games for any ranking
    if (!hasEnoughForElite) return result;
```

- [ ] **Step 2: Update the ranking logic to use tiered thresholds**

In the same function, update the GOAT ranking checks (lines 2365-2389). Replace:

```javascript
        if (goatRank === 1) {
```

with:

```javascript
        if (goatRank === 1 && hasEnoughForElite) {
```

Replace:
```javascript
        } else if (goatRank <= 3) {
```
with:
```javascript
        } else if (goatRank <= 3 && hasEnoughForElite) {
```

Replace:
```javascript
        } else if (goatRank <= 10) {
```
with:
```javascript
        } else if (goatRank <= 10 && hasEnoughForContender) {
```

Apply the same three changes to the WOAT ranking checks (lines 2391-2415):

```javascript
        if (woatRank === 1 && hasEnoughForElite) {
```
```javascript
        } else if (woatRank <= 3 && hasEnoughForElite) {
```
```javascript
        } else if (woatRank <= 10 && hasEnoughForContender) {
```

- [ ] **Step 3: Add threshold messages to leaderboard display**

In `updateGoatWoat`, find the section where it checks if history is empty (around line 4011-4013). Add threshold messages after the existing empty check. Find the line that renders the table and add before it:

```javascript
    const totalGames = Math.floor(history.length);
    let thresholdMsg = '';
    if (totalGames < 10) {
        thresholdMsg = `<p class="goat-threshold-msg">Play ${10 - totalGames} more game${10 - totalGames === 1 ? '' : 's'} to unlock GOAT/WOAT Champion & Elite rankings</p>`;
    } else if (totalGames < 50) {
        thresholdMsg = `<p class="goat-threshold-msg">Play ${50 - totalGames} more game${50 - totalGames === 1 ? '' : 's'} to unlock GOAT/WOAT Contender rankings</p>`;
    }
```

Insert `thresholdMsg` into the rendered HTML for the leaderboard section.

- [ ] **Step 4: Add CSS for threshold message**

```css
.goat-threshold-msg {
    color: #888;
    font-size: 0.8rem;
    font-style: italic;
    text-align: center;
    margin: 4px 0;
}
```

- [ ] **Step 5: Verify** - Clear battle history (`localStorage.removeItem('battleHistory')`), play a few battles. GOAT/WOAT should not appear until 10 games. Check the message appears with correct countdown.

- [ ] **Step 6: Commit** - "Add tiered minimum game thresholds for GOAT/WOAT achievements"

---

### Task 6: History Replay Reveal Button

**Files:**
- Modify: `script.js:1848-2110` (`showArcadeReveal` — add optional replay params)
- Modify: `script.js:3333-3447` (`renderHistoryEntry` — add replay button)
- Modify: `styles.css` (replay button styles)

The `showArcadeReveal` function currently reads team names and sprite maps from the DOM. For replay from history, we need to pass these as parameters since the battle may not be loaded on the page.

- [ ] **Step 1: Modify `showArcadeReveal` to accept optional replay options**

Change the function signature (line 1848) from:

```javascript
async function showArcadeReveal(
    team1Raw, team2Raw,
    team1Multipliers, team2Multipliers,
    team1Final, team2Final,
    bets, team1BetMult, team2BetMult
) {
```

to:

```javascript
async function showArcadeReveal(
    team1Raw, team2Raw,
    team1Multipliers, team2Multipliers,
    team1Final, team2Final,
    bets, team1BetMult, team2BetMult,
    replayOptions
) {
```

- [ ] **Step 2: Use replayOptions for team names**

Inside the function, right after `return new Promise(async (resolve) => {` (line 1854), replace the inline team name references in the overlay HTML. Change lines 1862 and 1869:

```javascript
        const team1Name = replayOptions?.team1Name || getTeamNameElement('team1')?.textContent || 'Team 1';
        const team2Name = replayOptions?.team2Name || getTeamNameElement('team2')?.textContent || 'Team 2';
```

Then update the overlay HTML to use `${team1Name}` and `${team2Name}` instead of `${getTeamNameElement('team1').textContent}` and `${getTeamNameElement('team2').textContent}`.

Also update `showFinalScoresAndWinner` (line 2034-2043) to use the same variables instead of calling `getTeamNameElement`:

```javascript
        function showFinalScoresAndWinner() {
            document.getElementById('arcade-reveal-t1-final').textContent = team1Final;
            document.getElementById('arcade-reveal-t2-final').textContent = team2Final;

            const winnerEl = document.getElementById('arcade-reveal-winner');
            if (team1Final > team2Final) {
                winnerEl.textContent = `${team1Name} WINS!`;
                winnerEl.className = 'arcade-reveal-winner show burst';
            } else if (team2Final > team1Final) {
                winnerEl.textContent = `${team2Name} WINS!`;
                winnerEl.className = 'arcade-reveal-winner show burst';
            } else {
                winnerEl.textContent = "IT'S A TIE!";
                winnerEl.className = 'arcade-reveal-winner show tie burst';
            }
        }
```

- [ ] **Step 3: Use replayOptions for sprite maps**

Replace the `buildSpriteMap` calls (lines 1914-1915):

```javascript
        const t1Sprites = replayOptions?.team1Sprites || buildSpriteMap('team1');
        const t2Sprites = replayOptions?.team2Sprites || buildSpriteMap('team2');
```

- [ ] **Step 4: Add replay button to arcade history entries**

In `renderHistoryEntry`, inside the `if (result.mode === 'arcade' && result.arcade)` block (around line 3373), add a replay button. After the `arcadeBadgeHTML` assignment (line 3374):

```javascript
        arcadeBadgeHTML = '<span class="history-arcade-tag">ARCADE</span>';
        arcadeBadgeHTML += '<button class="replay-reveal-btn" title="Replay arcade reveal animation">Replay</button>';
```

- [ ] **Step 5: Add the click handler for the replay button**

After the history entry is added to the DOM (after line 3446 `historyList.appendChild(entry);`), add:

```javascript
    // Replay reveal button for arcade entries
    const replayBtn = entry.querySelector('.replay-reveal-btn');
    if (replayBtn && result.mode === 'arcade' && result.arcade) {
        replayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const t1 = result.arcade.team1;
            const t2 = result.arcade.team2;

            // Build sprite maps from saved Pokemon data
            const team1Sprites = {};
            result.team1.pokemon.forEach(p => { if (p.name && p.sprite) team1Sprites[p.name] = p.sprite; });
            const team2Sprites = {};
            result.team2.pokemon.forEach(p => { if (p.name && p.sprite) team2Sprites[p.name] = p.sprite; });

            showArcadeReveal(
                t1.rawScore, t2.rawScore,
                t1.multipliers || [], t2.multipliers || [],
                t1.adjustedScore, t2.adjustedScore,
                { team1: t1.bet, team2: t2.bet },
                t1.betMultiplier || 1, t2.betMultiplier || 1,
                {
                    team1Name: result.team1.name,
                    team2Name: result.team2.name,
                    team1Sprites,
                    team2Sprites
                }
            );
        });
    }
```

- [ ] **Step 6: Add CSS for replay button**

```css
.replay-reveal-btn {
    background: none;
    border: 1px solid #ff6b35;
    color: #ff6b35;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    cursor: pointer;
    margin-left: 6px;
    vertical-align: middle;
}
.replay-reveal-btn:hover {
    background: #ff6b35;
    color: white;
}
```

- [ ] **Step 7: Verify** - Play an arcade battle and save it. Find it in history. Click "Replay" button — should see the full arcade reveal animation with correct team names, Pokemon sprites, bonuses, and winner.

- [ ] **Step 8: Commit** - "Add Replay Reveal button to arcade game history entries"

---

### Task 7: Quick Match Tier Achievements (+30/ea)

**Files:**
- Modify: `script.js` — append to `arcadeMultiplierSets` array, add cases to `getContributingPokemon`

Add 10 new achievements. Insert after the last entry in `arcadeMultiplierSets` (after `the-impostor`, line 1605) but before the closing `];`:

- [ ] **Step 1: Add the 10 Quick Match achievement definitions**

```javascript
    // === Quick Match (+30/ea) - "Type Combos & Stat Patterns" ===
    {
        id: 'dual-wielders',
        name: 'Dual Wielders',
        emoji: '⚔️',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Double the types, double the fun!',
        hint: '3+ Pokemon with exactly 2 types',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.length === 2).length;
            if (count >= 3) return { matched: true, description: `${count} dual-type Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'pure-souls',
        name: 'Pure Souls',
        emoji: '✨',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Keeping it simple!',
        hint: '4+ Pokemon with exactly 1 type',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.length === 1).length;
            if (count >= 4) return { matched: true, description: `${count} mono-type Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'rainbow-team',
        name: 'Rainbow Team',
        emoji: '🌈',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'All the colors of the wind!',
        hint: '8+ distinct types across your team',
        check: (team) => {
            const types = new Set(team.pokemon.flatMap(p => p.types || []));
            if (types.size >= 8) return { matched: true, description: `${types.size} distinct types` };
            return { matched: false };
        }
    },
    {
        id: 'full-house',
        name: 'Full House',
        emoji: '🎴',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Three of a kind plus a pair!',
        hint: '3 Pokemon share one type + 2 share a different type',
        check: (team) => {
            const typeCounts = {};
            team.pokemon.forEach(p => {
                if (p.types) p.types.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
            });
            const counts = Object.entries(typeCounts).sort(([,a], [,b]) => b - a);
            if (counts.length >= 2 && counts[0][1] >= 3 && counts[1][1] >= 2) {
                return { matched: true, description: `${counts[0][1]} ${counts[0][0]} + ${counts[1][1]} ${counts[1][0]}` };
            }
            return { matched: false };
        }
    },
    {
        id: 'neighbors',
        name: 'Neighbors',
        emoji: '🏘️',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Living on the same route!',
        hint: '3+ Pokemon with consecutive Pokedex numbers',
        check: (team) => {
            const ids = team.pokemon.map(p => p.pokedexId).filter(id => id != null).sort((a, b) => a - b);
            if (ids.length < 3) return { matched: false };
            let bestRun = 1, currentRun = 1;
            for (let i = 1; i < ids.length; i++) {
                if (ids[i] === ids[i-1] + 1) { currentRun++; bestRun = Math.max(bestRun, currentRun); }
                else { currentRun = 1; }
            }
            if (bestRun >= 3) return { matched: true, description: `${bestRun} consecutive Pokedex numbers` };
            return { matched: false };
        }
    },
    {
        id: 'opposites-attract',
        name: 'Opposites Attract',
        emoji: '🧲',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Keep your enemies closer!',
        hint: "2+ pairs where a teammate's type beats another's",
        check: (team) => {
            const te = pokemonCategories.typeEffectiveness;
            let pairs = 0;
            for (let i = 0; i < team.pokemon.length; i++) {
                for (let j = i + 1; j < team.pokemon.length; j++) {
                    const a = team.pokemon[i].types || [];
                    const b = team.pokemon[j].types || [];
                    const hasSE = te.some(([atk, def]) =>
                        (a.includes(atk) && b.includes(def)) || (b.includes(atk) && a.includes(def))
                    );
                    if (hasSE) pairs++;
                }
            }
            if (pairs >= 2) return { matched: true, description: `${pairs} super-effective pairs` };
            return { matched: false };
        }
    },
    {
        id: 'stat-twins',
        name: 'Stat Twins',
        emoji: '👯',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Perfectly balanced!',
        hint: '3+ Pokemon with total BST within 15 of each other',
        check: (team) => {
            const scores = team.pokemon.map(p => p.score).sort((a, b) => a - b);
            let bestCount = 1;
            for (let i = 0; i < scores.length; i++) {
                let count = 1;
                for (let j = i + 1; j < scores.length; j++) {
                    if (scores[j] - scores[i] <= 15) count++;
                    else break;
                }
                bestCount = Math.max(bestCount, count);
            }
            if (bestCount >= 3) return { matched: true, description: `${bestCount} Pokemon within 15 BST` };
            return { matched: false };
        }
    },
    {
        id: 'monochrome',
        name: 'Monochrome',
        emoji: '🎨',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Color coordinated!',
        hint: '4+ Pokemon of the same color group',
        check: (team) => {
            const colorLists = {
                blue: pokemonCategories.bluePokemon,
                red: pokemonCategories.redOrangePokemon,
                purple: pokemonCategories.purplePokemon,
                green: pokemonCategories.greenPokemon,
                yellow: pokemonCategories.yellowPokemon,
                brown: pokemonCategories.brownPokemon,
                pink: pokemonCategories.pinkPokemon
            };
            const names = team.pokemon.map(p => p.name.toLowerCase());
            for (const [color, list] of Object.entries(colorLists)) {
                const count = names.filter(n => list.includes(n)).length;
                if (count >= 4) return { matched: true, description: `${count} ${color} Pokemon` };
            }
            return { matched: false };
        }
    },
    {
        id: 'gen-1-purist',
        name: 'Gen 1 Purist',
        emoji: '1️⃣',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Original 151 or bust!',
        hint: 'All 6 Pokemon from Gen 1 (Kanto)',
        check: (team) => {
            const ids = team.pokemon.map(p => p.pokedexId).filter(id => id != null);
            if (ids.length === 6 && ids.every(id => id >= 1 && id <= 151)) {
                return { matched: true, description: 'All Gen 1 Pokemon!' };
            }
            return { matched: false };
        }
    },
    {
        id: 'gen-2-purist',
        name: 'Gen 2 Purist',
        emoji: '2️⃣',
        bonus: 30,
        tier: 'quick-match',
        flavor: 'Johto represent!',
        hint: 'All 6 Pokemon from Gen 2 (Johto)',
        check: (team) => {
            const ids = team.pokemon.map(p => p.pokedexId).filter(id => id != null);
            if (ids.length === 6 && ids.every(id => id >= 152 && id <= 251)) {
                return { matched: true, description: 'All Gen 2 Pokemon!' };
            }
            return { matched: false };
        }
    },
```

- [ ] **Step 2: Add `getContributingPokemon` cases for all 10 Quick Match achievements**

Add these cases inside the `switch` in `getContributingPokemon` (before the `default:` case):

```javascript
        case 'dual-wielders':
            return pokemon.filter(p => p.types && p.types.length === 2).map(p => p.name);
        case 'pure-souls':
            return pokemon.filter(p => p.types && p.types.length === 1).map(p => p.name);
        case 'rainbow-team':
            return pokemon.map(p => p.name); // all contribute types
        case 'full-house': {
            const fhTypeCounts = {};
            pokemon.forEach(p => p.types?.forEach(t => { fhTypeCounts[t] = (fhTypeCounts[t] || 0) + 1; }));
            const fhCounts = Object.entries(fhTypeCounts).sort(([,a], [,b]) => b - a);
            if (fhCounts.length >= 2) {
                const topTypes = [fhCounts[0][0], fhCounts[1][0]];
                return pokemon.filter(p => p.types?.some(t => topTypes.includes(t))).map(p => p.name);
            }
            return [];
        }
        case 'neighbors': {
            const nIds = pokemon.map(p => ({ name: p.name, id: p.pokedexId || getPokedexIdFromSprite(p.sprite) }))
                .filter(p => p.id != null).sort((a, b) => a.id - b.id);
            let bestStart = 0, bestLen = 1, curStart = 0, curLen = 1;
            for (let i = 1; i < nIds.length; i++) {
                if (nIds[i].id === nIds[i-1].id + 1) { curLen++; if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; } }
                else { curStart = i; curLen = 1; }
            }
            return nIds.slice(bestStart, bestStart + bestLen).map(p => p.name);
        }
        case 'opposites-attract': {
            const te = pokemonCategories.typeEffectiveness;
            const involved = new Set();
            for (let i = 0; i < pokemon.length; i++) {
                for (let j = i + 1; j < pokemon.length; j++) {
                    const a = pokemon[i].types || [];
                    const b = pokemon[j].types || [];
                    if (te.some(([atk, def]) => (a.includes(atk) && b.includes(def)) || (b.includes(atk) && a.includes(def)))) {
                        involved.add(pokemon[i].name);
                        involved.add(pokemon[j].name);
                    }
                }
            }
            return [...involved];
        }
        case 'stat-twins': {
            const stScores = pokemon.map(p => ({ name: p.name, score: p.score })).sort((a, b) => a.score - b.score);
            let stBestGroup = [];
            for (let i = 0; i < stScores.length; i++) {
                const group = [stScores[i]];
                for (let j = i + 1; j < stScores.length; j++) {
                    if (stScores[j].score - stScores[i].score <= 15) group.push(stScores[j]);
                    else break;
                }
                if (group.length > stBestGroup.length) stBestGroup = group;
            }
            return stBestGroup.map(p => p.name);
        }
        case 'monochrome': {
            const mcColorLists = {
                blue: pokemonCategories.bluePokemon, red: pokemonCategories.redOrangePokemon,
                purple: pokemonCategories.purplePokemon, green: pokemonCategories.greenPokemon,
                yellow: pokemonCategories.yellowPokemon, brown: pokemonCategories.brownPokemon,
                pink: pokemonCategories.pinkPokemon
            };
            const mcNames = pokemon.map(p => p.name.toLowerCase());
            let bestColor = [], bestCount = 0;
            for (const [, list] of Object.entries(mcColorLists)) {
                const matching = pokemon.filter(p => list.includes(p.name.toLowerCase()));
                if (matching.length > bestCount) { bestCount = matching.length; bestColor = matching; }
            }
            return bestColor.map(p => p.name);
        }
        case 'gen-1-purist':
        case 'gen-2-purist':
            return pokemon.map(p => p.name); // all 6 contribute
```

- [ ] **Step 3: Verify** - Add 3 dual-type Pokemon (e.g., Charizard, Gyarados, Steelix) to a team. Battle in arcade mode. Check that "Dual Wielders" bonus appears. Place a bet on "Pure Souls" with 4+ mono-type Pokemon and verify it works.

- [ ] **Step 4: Commit** - "Add Quick Match tier: 10 new arcade achievements (+30/ea)"

---

### Task 8: Lucky Finds Color Achievements (+15/ea)

**Files:**
- Modify: `script.js` — append to `arcadeMultiplierSets`, add cases to `getContributingPokemon`

Add 6 color-based achievements to `arcadeMultiplierSets`:

- [ ] **Step 1: Add the 6 color achievement definitions**

Append after the Quick Match entries:

```javascript
    // === Lucky Finds (+15/ea) - "Visual & Thematic Fun" ===
    // Color achievements
    {
        id: 'blue-crew',
        name: 'Blue Crew',
        emoji: '🔵',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Feeling blue (in a good way)!',
        hint: '3+ blue-colored Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => pokemonCategories.bluePokemon.includes(n)).length;
            if (count >= 3) return { matched: true, description: `${count} blue Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'red-alert',
        name: 'Red Alert',
        emoji: '🔴',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Hot team incoming!',
        hint: '3+ red/orange-colored Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => pokemonCategories.redOrangePokemon.includes(n)).length;
            if (count >= 3) return { matched: true, description: `${count} red/orange Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'purple-reign',
        name: 'Purple Reign',
        emoji: '🟣',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Royalty on the field!',
        hint: '3+ purple-colored Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => pokemonCategories.purplePokemon.includes(n)).length;
            if (count >= 3) return { matched: true, description: `${count} purple Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'green-machine',
        name: 'Green Machine',
        emoji: '🟢',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: "It's not easy being green!",
        hint: '3+ green-colored Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => pokemonCategories.greenPokemon.includes(n)).length;
            if (count >= 3) return { matched: true, description: `${count} green Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'yellow-squad',
        name: 'Yellow Squad',
        emoji: '🟡',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Electric vibes!',
        hint: '3+ yellow-colored Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => pokemonCategories.yellowPokemon.includes(n)).length;
            if (count >= 3) return { matched: true, description: `${count} yellow Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'brown-town',
        name: 'Brown Town',
        emoji: '🟤',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Down to earth!',
        hint: '3+ brown-colored Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => pokemonCategories.brownPokemon.includes(n)).length;
            if (count >= 3) return { matched: true, description: `${count} brown Pokemon` };
            return { matched: false };
        }
    },
```

- [ ] **Step 2: Add `getContributingPokemon` cases for color achievements**

```javascript
        case 'blue-crew':
            return pokemon.filter(p => pokemonCategories.bluePokemon.includes(p.name.toLowerCase())).map(p => p.name);
        case 'red-alert':
            return pokemon.filter(p => pokemonCategories.redOrangePokemon.includes(p.name.toLowerCase())).map(p => p.name);
        case 'purple-reign':
            return pokemon.filter(p => pokemonCategories.purplePokemon.includes(p.name.toLowerCase())).map(p => p.name);
        case 'green-machine':
            return pokemon.filter(p => pokemonCategories.greenPokemon.includes(p.name.toLowerCase())).map(p => p.name);
        case 'yellow-squad':
            return pokemon.filter(p => pokemonCategories.yellowPokemon.includes(p.name.toLowerCase())).map(p => p.name);
        case 'brown-town':
            return pokemon.filter(p => pokemonCategories.brownPokemon.includes(p.name.toLowerCase())).map(p => p.name);
```

- [ ] **Step 3: Verify** - Add 3 blue Pokemon (Squirtle, Lapras, Vaporeon) to a team. Battle in arcade mode. "Blue Crew" should trigger.

- [ ] **Step 4: Commit** - "Add Lucky Finds color achievements: 6 new arcade achievements (+15/ea)"

---

### Task 9: Lucky Finds Shape Achievements (+15/ea)

**Files:**
- Modify: `script.js` — append to `arcadeMultiplierSets`, add cases to `getContributingPokemon`

Add 9 shape/body-based achievements:

- [ ] **Step 1: Add the 9 shape achievement definitions**

Append after the color achievements:

```javascript
    // Shape/body achievements
    {
        id: 'serpent-strike',
        name: 'Serpent Strike',
        emoji: '🐍',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Sssssurprise!',
        hint: '2+ serpentine Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.serpentinePokemon)).length;
            if (count >= 2) return { matched: true, description: `${count} serpentine Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'round-table',
        name: 'Round Table',
        emoji: '⚪',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Knights not included!',
        hint: '3+ round/spherical Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.roundPokemon)).length;
            if (count >= 3) return { matched: true, description: `${count} round Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'aqua-show',
        name: 'Aqua Show',
        emoji: '🐟',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Something fishy going on!',
        hint: '3+ fish/aquatic-bodied Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.aquaticPokemon)).length;
            if (count >= 3) return { matched: true, description: `${count} aquatic Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'tiny-titans',
        name: 'Tiny Titans',
        emoji: '🐣',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: "Size doesn't matter!",
        hint: '3+ Pokemon under 0.5m tall',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.tinyPokemon)).length;
            if (count >= 3) return { matched: true, description: `${count} tiny Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'kaiju-club',
        name: 'Kaiju Club',
        emoji: '🦕',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'They grow up so fast!',
        hint: '2+ Pokemon over 2m tall',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.giantPokemon)).length;
            if (count >= 2) return { matched: true, description: `${count} giant Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'rodent-run',
        name: 'Rodent Run',
        emoji: '🐭',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Squeaky squad!',
        hint: '2+ rodent Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.rodentPokemon)).length;
            if (count >= 2) return { matched: true, description: `${count} rodent Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'floral-arrangement',
        name: 'Floral Arrangement',
        emoji: '🌺',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Smells like victory!',
        hint: '3+ plant/flower Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.floralPokemon)).length;
            if (count >= 3) return { matched: true, description: `${count} floral Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'bird-watching',
        name: 'Bird Watching',
        emoji: '🦅',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: 'Tweet tweet!',
        hint: '3+ bird-shaped Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.birdPokemon)).length;
            if (count >= 3) return { matched: true, description: `${count} bird Pokemon` };
            return { matched: false };
        }
    },
    {
        id: 'spiky-situation',
        name: 'Spiky Situation',
        emoji: '🌵',
        bonus: 15,
        tier: 'lucky-finds',
        flavor: "Don't touch!",
        hint: '3+ spiky/quilled Pokemon',
        check: (team) => {
            const names = team.pokemon.map(p => p.name.toLowerCase());
            const count = names.filter(n => matchesAnyBase(n, pokemonCategories.spikyPokemon)).length;
            if (count >= 3) return { matched: true, description: `${count} spiky Pokemon` };
            return { matched: false };
        }
    }
```

- [ ] **Step 2: Add `getContributingPokemon` cases for shape achievements**

```javascript
        case 'serpent-strike':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.serpentinePokemon)).map(p => p.name);
        case 'round-table':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.roundPokemon)).map(p => p.name);
        case 'aqua-show':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.aquaticPokemon)).map(p => p.name);
        case 'tiny-titans':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.tinyPokemon)).map(p => p.name);
        case 'kaiju-club':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.giantPokemon)).map(p => p.name);
        case 'rodent-run':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.rodentPokemon)).map(p => p.name);
        case 'floral-arrangement':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.floralPokemon)).map(p => p.name);
        case 'bird-watching':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.birdPokemon)).map(p => p.name);
        case 'spiky-situation':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.spikyPokemon)).map(p => p.name);
```

- [ ] **Step 3: Verify** - Test several shape achievements:
  - Add Ekans + Arbok (serpent-strike should trigger)
  - Add Voltorb + Jigglypuff + Chansey (round-table should trigger)
  - Add Pidgey + Spearow + Fearow (bird-watching should trigger)
  - Open bet modal, verify all 59 achievements appear organized by tier

- [ ] **Step 4: Commit** - "Add Lucky Finds shape achievements: 9 new arcade achievements (+15/ea)"

---

### Task 10: Final Verification & Cleanup

**Files:**
- Review: `script.js`, `styles.css`

- [ ] **Step 1: Verify total achievement count** - Open console: `arcadeMultiplierSets.length`. Should return `59`.

- [ ] **Step 2: Verify bet modal** - Open bet modal. Should show 5 tier sections with proper headers, all 59 achievements with tooltips on hover, bonus values visible.

- [ ] **Step 3: Verify GOAT/WOAT thresholds** - With fewer than 10 games in history, GOAT/WOAT should not trigger. With 10+ games, Champion and Elite should appear. With 50+, Contender should appear.

- [ ] **Step 4: Verify history replay** - Play an arcade battle, save it. Find in history. Click "Replay" — full animation with correct names, sprites, bonuses, and winner.

- [ ] **Step 5: Test edge cases**:
  - Monochrome + specific color achievement stacking (4 blue Pokemon should trigger both Blue Crew and Monochrome)
  - Ditto on team should still trigger "The Impostor"
  - Sunkern Special should still work with winner-dependent check
  - Bet on a Lucky Finds achievement, win the bet, verify 1.2x multiplier applies

- [ ] **Step 6: Final commit** - "Complete arcade mode enhancements: 25 new achievements, tooltips, GOAT thresholds, history replay"
