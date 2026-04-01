# Arcade Mode Enhancements Design

**Date:** 2026-03-31
**Scope:** 4 fixes/features for arcade mode betting, GOAT/WOAT, history, and new achievements

## Overview

Four changes to the arcade mode system in `script.js`:
1. Hover tooltips on bet placement buttons
2. Tiered minimum game thresholds for GOAT/WOAT achievements
3. Replay Reveal button in game history for arcade entries
4. 25 new betting outcomes across two new lower tiers

---

## Fix 1: Bet Placement Tooltips

**Problem:** The bet modal (`showBetModal`, line 1795) shows only emoji + name per category. Users can't tell what each achievement requires without memorizing them.

**Solution:** Add a tooltip on hover/focus that shows:
- The `flavor` text (already exists on each multiplier set)
- A human-readable `hint` describing the qualification criteria
- The bonus value and tier label

**Implementation:**

1. Add a `hint` field to every entry in `arcadeMultiplierSets` (lines 1097-1606) — a short human-readable summary of what the check requires. Examples:
   - Baby Brigade: `"3+ first-evolution Pokemon from 3-stage lines"`
   - Type Specialist: `"3+ Pokemon sharing one type"`
   - Speed Demons: `"3+ Pokemon with 100+ base Speed"`

2. Update `showBetModal` (line 1810-1813) to render each button with a tooltip element:
   ```html
   <button class="bet-category-btn" data-id="..." data-name="...">
     <span class="bet-btn-main">{emoji} {name}</span>
     <span class="bet-btn-tier">{tier label} +{bonus}/ea</span>
     <span class="bet-tooltip">{flavor} — {hint}</span>
   </button>
   ```

3. CSS tooltip: absolutely positioned below the button, appears on hover (desktop) and on focus/tap-hold (mobile). Styled as a small dark popover with an arrow.

**New `hint` values for all 34 existing achievements:**

| ID | Hint |
|----|------|
| baby-brigade | 3+ first-evolution Pokemon from 3-stage lines |
| bottom-barrel | Team average BST under 350 |
| bug-catchers | 3+ Bug-type Pokemon |
| nfe-army | 4+ not fully evolved Pokemon |
| sunkern-special | Win the battle with Sunkern on your team |
| slowpoke-parade | 2+ Slowpoke family members |
| cocoon-chaos | 2+ cocoon Pokemon (Metapod, Kakuna, etc.) |
| type-specialist | 3+ Pokemon sharing one type |
| eeveelution-squad | 2+ Eeveelutions |
| fossil-expedition | 2+ Fossil Pokemon |
| pretty-in-pink | 2+ pink Pokemon |
| kanto-starters-united | All 3 Kanto starter lines represented |
| rocket-roster | 2+ Team Rocket Pokemon |
| pikaclone-parade | 2+ Pikaclones |
| cat-cafe | 2+ cat Pokemon |
| good-boys | 2+ dog Pokemon |
| egg-gang | 2+ egg-themed Pokemon |
| gym-leader | 5+ Pokemon sharing one type |
| starter-pack | 3+ starter Pokemon |
| ghost-story | 2+ Ghost-type |
| fairy-tale | 2+ Fairy-type |
| steel-wall | 2+ Steel-type |
| fighting-dojo | 2+ Fighting-type |
| legendary-assembly | 2+ Legendary Pokemon |
| final-form-force | 4+ fully evolved Pokemon |
| dragons-den | 2+ Dragon-type |
| bird-trio-complete | Articuno + Zapdos + Moltres |
| beast-trio-complete | Raikou + Entei + Suicune |
| pseudo-legendary-club | 2+ pseudo-legendaries |
| speed-demons | 3+ Pokemon with 100+ base Speed |
| tank-division | 3+ Pokemon with 90+ base Defense |
| elemental-trio | Fire + Water + Grass types on team |
| glass-cannons | 2+ Pokemon with ATK/SPATK >100 and HP <70 |
| the-impostor | Ditto on the team |

---

## Fix 2: GOAT/WOAT Minimum Game Thresholds

**Problem:** Currently `detectGoatWoatAchievements` (line 2357) has a single threshold: `allScores.length < 10` (5 battles). Being GOAT top-10 after 6 games is meaningless.

**Solution:** Tiered thresholds based on achievement difficulty:

| Achievement | Current Threshold | New Threshold |
|---|---|---|
| GOAT/WOAT Champion (#1) | 5 battles (10 scores) | 10 battles (20 scores) |
| GOAT/WOAT Elite (top 3) | 5 battles (10 scores) | 10 battles (20 scores) |
| GOAT/WOAT Contender (top 10) | 5 battles (10 scores) | 50 battles (100 scores) |

**Implementation:**

Replace the single early-return at line 2357 with per-tier checks inside the ranking logic:

```javascript
const totalGames = Math.floor(allScores.length / 2);

// Champion & Elite: need 10+ games
const hasEnoughForElite = totalGames >= 10;
// Contender: need 50+ games
const hasEnoughForContender = totalGames >= 50;

// In the ranking section:
if (goatRank === 1 && hasEnoughForElite) { /* champion */ }
else if (goatRank <= 3 && hasEnoughForElite) { /* elite */ }
else if (goatRank <= 10 && hasEnoughForContender) { /* contender */ }
```

Also update the GOAT/WOAT leaderboard display (`updateGoatWoat`, line 3985) to show a message when there aren't enough games yet:
- "Play 10+ games to unlock GOAT/WOAT Champion & Elite rankings"
- "Play 50+ games to unlock GOAT/WOAT Contender rankings"

---

## Fix 3: History Replay Reveal Button

**Problem:** Arcade game history entries show bonus details but can't replay the animated reveal pop-up.

**Solution:** Add a "Replay Reveal" button to arcade history entries.

**Implementation:**

1. In `renderHistoryEntry` (line 3370-3404), inside the `if (result.mode === 'arcade' && result.arcade)` block, add a button:
   ```html
   <button class="replay-reveal-btn" title="Replay arcade reveal animation">Replay Reveal</button>
   ```

2. Add click handler (with `stopPropagation` to prevent triggering "load battle"):
   ```javascript
   replayBtn.addEventListener('click', (e) => {
       e.stopPropagation();
       const t1 = result.arcade.team1;
       const t2 = result.arcade.team2;
       showArcadeReveal(
           t1.rawScore, t2.rawScore,
           t1.multipliers, t2.multipliers,
           t1.adjustedScore, t2.adjustedScore,
           { team1: t1.bet, team2: t2.bet },
           t1.betMultiplier, t2.betMultiplier
       );
   });
   ```

3. Style: small button next to the ARCADE tag, consistent with existing UI.

**Note:** `showArcadeReveal` (line 1848) accepts all needed arguments, and `result.arcade` stores all of them. The replay will show the full animation including per-Pokemon bonus reveals, bet results, and winner announcement.

**Data verification needed during implementation:** Confirm that `result.arcade.teamN.multipliers[].contributingPokemon` includes sprite URLs (not just names). The reveal animation shows Pokemon sprites one-by-one during bonus reveals. If the saved data only stores names, the replay function will need to either:
- (a) Look up sprites from a cached source, or
- (b) Skip per-Pokemon sprite animation and show badges only for replays, or
- (c) Modify the save format going forward to include sprite URLs in contributing Pokemon data.

Option (c) is cleanest but won't work for existing history entries. Option (b) is the safest fallback.

---

## Fix 4: New Betting Outcomes

### New Tier Structure

Two new tiers below the existing three:

| Tier | Bonus | Label | Existing Count | New Count |
|------|-------|-------|---------------|-----------|
| Against All Odds | +100/ea | Big risk, big reward | 7 | 0 |
| Thematic Mastery | +75/ea | Theme team bonuses | 16 | 0 |
| Power Play | +50/ea | Strong team synergy | 11 | 0 |
| **Quick Match** | **+30/ea** | **Type combos & stat patterns** | **0** | **10** |
| **Lucky Finds** | **+15/ea** | **Visual & thematic fun** | **0** | **15** |

**Total: 34 existing + 25 new = 59 achievements**

### Bet Modal Organization

With 59 achievements, the bet modal needs tier section headers. Group by tier in descending order (highest value first):

```
Against All Odds (+100/ea)
  [buttons...]
Thematic Mastery (+75/ea)
  [buttons...]
Power Play (+50/ea)
  [buttons...]
Quick Match (+30/ea)
  [buttons...]
Lucky Finds (+15/ea)
  [buttons...]
```

Each section header shows the tier name and bonus value. Sections are collapsible (expanded by default).

### Betting Incentive Design

The bet multiplier (1.2x correct, 0.9x wrong) applies to the ENTIRE team adjusted score, not just the bonus. A typical team has ~2400 BST, so:
- Correct bet on +15 achievement: 1.2x on ~2445+ = ~2934 (+~489 from multiplier)
- Correct bet on +100 achievement: 1.2x on ~2700+ = ~3240 (+~540 from multiplier)

The point difference between betting on easy vs hard achievements is small (~50 points), but the probability of winning the bet is much higher for easy achievements. This makes Lucky Finds the "safe bet" tier — exactly what we want to encourage exploration.

### New Pokemon Category Lists

All lists are Gen 1-2 only (Pokedex #1-251), using lowercase PokeAPI names.

#### Color Lists

```javascript
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

#### Shape/Body Lists

```javascript
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

#### Type Effectiveness Table

```javascript
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
],
```

### Quick Match Tier (+30/ea) — 10 Achievements

These use type data, stats, and Pokedex IDs (no hardcoded Pokemon lists needed for most).

#### 1. Dual Wielders
- **ID:** `dual-wielders`
- **Emoji:** `crossed-swords`
- **Flavor:** "Double the types, double the fun!"
- **Hint:** "3+ Pokemon with exactly 2 types"
- **Check:** Count Pokemon where `types.length === 2`, need 3+
- **Contributing:** Pokemon with 2 types

#### 2. Pure Souls
- **ID:** `pure-souls`
- **Emoji:** `sparkles`
- **Flavor:** "Keeping it simple!"
- **Hint:** "4+ Pokemon with exactly 1 type"
- **Check:** Count Pokemon where `types.length === 1`, need 4+
- **Contributing:** Mono-type Pokemon

#### 3. Rainbow Team
- **ID:** `rainbow-team`
- **Emoji:** `rainbow`
- **Flavor:** "All the colors of the wind!"
- **Hint:** "8+ distinct types across your team"
- **Check:** Count unique types across all Pokemon, need 8+
- **Contributing:** All Pokemon (each contributes at least one unique type)

#### 4. Full House
- **ID:** `full-house`
- **Emoji:** `flower-playing-cards`
- **Flavor:** "Three of a kind plus a pair!"
- **Hint:** "3 Pokemon share one type + 2 share a different type"
- **Check:** Count type occurrences. Need one type with 3+ AND a different type with 2+. A Pokemon can contribute to both via dual-typing.
- **Contributing:** Pokemon contributing to the 3-count type and the 2-count type

#### 5. Neighbors
- **ID:** `neighbors`
- **Emoji:** `houses`
- **Flavor:** "Living on the same route!"
- **Hint:** "3+ Pokemon with consecutive Pokedex numbers"
- **Check:** Extract Pokedex IDs from sprite URLs, sort, find a run of 3+ consecutive.
- **Contributing:** Pokemon in the consecutive run
- **Technical note:** Add helper `getPokedexId(pokemon)` that extracts ID from sprite URL pattern `/pokemon/{id}.png`

#### 6. Opposites Attract
- **ID:** `opposites-attract`
- **Emoji:** `magnet`
- **Flavor:** "Keep your enemies closer!"
- **Hint:** "2+ pairs where a teammate's type beats another's"
- **Check:** For each pair of Pokemon on the team, check if any of A's types are super-effective against any of B's types (using `typeEffectiveness` table). Count unique such pairs, need 2+.
- **Contributing:** Pokemon involved in any super-effective pair

#### 7. Stat Twins
- **ID:** `stat-twins`
- **Emoji:** `people-holding-hands`
- **Flavor:** "Perfectly balanced!"
- **Hint:** "3+ Pokemon with total BST within 15 of each other"
- **Check:** Sort Pokemon by BST. Sliding window: find any group of 3+ where max - min <= 15.
- **Contributing:** Pokemon in the cluster

#### 8. Monochrome
- **ID:** `monochrome`
- **Emoji:** `art`
- **Flavor:** "Color coordinated!"
- **Hint:** "4+ Pokemon of the same color group"
- **Check:** For each of the 6 color lists, count matching Pokemon. Need 4+ in any one color.
- **Contributing:** Pokemon matching the best color group

#### 9. Gen 1 Purist
- **ID:** `gen-1-purist`
- **Emoji:** `keycap-1`
- **Flavor:** "Original 151 or bust!"
- **Hint:** "All 6 Pokemon from Gen 1 (Kanto)"
- **Check:** All 6 Pokemon have Pokedex ID between 1-151.
- **Contributing:** All 6 Pokemon

#### 10. Gen 2 Purist
- **ID:** `gen-2-purist`
- **Emoji:** `keycap-2`
- **Flavor:** "Johto represent!"
- **Hint:** "All 6 Pokemon from Gen 2 (Johto)"
- **Check:** All 6 Pokemon have Pokedex ID between 152-251.
- **Contributing:** All 6 Pokemon

### Lucky Finds Tier (+15/ea) — 15 Achievements

All use hardcoded Pokemon lists from `pokemonCategories`.

#### Color Achievements (6)

| # | ID | Name | Emoji | Hint | Threshold |
|---|-----|------|-------|------|-----------|
| 1 | `blue-crew` | Blue Crew | `large-blue-circle` | 3+ blue-colored Pokemon | 3+ from `bluePokemon` (39 eligible) |
| 2 | `red-alert` | Red Alert | `large-red-circle` | 3+ red/orange-colored Pokemon | 3+ from `redOrangePokemon` (34 eligible) |
| 3 | `purple-reign` | Purple Reign | `large-purple-circle` | 3+ purple-colored Pokemon | 3+ from `purplePokemon` (33 eligible) |
| 4 | `green-machine` | Green Machine | `large-green-circle` | 3+ green-colored Pokemon | 3+ from `greenPokemon` (23 eligible) |
| 5 | `yellow-squad` | Yellow Squad | `large-yellow-circle` | 3+ yellow-colored Pokemon | 3+ from `yellowPokemon` (28 eligible) |
| 6 | `brown-town` | Brown Town | `large-brown-circle` | 3+ brown-colored Pokemon | 3+ from `brownPokemon` (47 eligible) |

**Flavor texts:**
- Blue Crew: "Feeling blue (in a good way)!"
- Red Alert: "Hot team incoming!"
- Purple Reign: "Royalty on the field!"
- Green Machine: "It's not easy being green!"
- Yellow Squad: "Electric vibes!"
- Brown Town: "Down to earth!"

#### Shape/Body Achievements (9)

| # | ID | Name | Emoji | Hint | Threshold |
|---|-----|------|-------|------|-----------|
| 7 | `serpent-strike` | Serpent Strike | `snake` | 2+ serpentine Pokemon | 2+ from `serpentinePokemon` (8 eligible) |
| 8 | `round-table` | Round Table | `white-circle` | 3+ round/spherical Pokemon | 3+ from `roundPokemon` (27 eligible) |
| 9 | `aqua-show` | Aqua Show | `fish` | 3+ fish/aquatic-bodied Pokemon | 3+ from `aquaticPokemon` (27 eligible) |
| 10 | `tiny-titans` | Tiny Titans | `hatching-chick` | 3+ Pokemon under 0.5m tall | 3+ from `tinyPokemon` (33 eligible) |
| 11 | `kaiju-club` | Kaiju Club | `sauropod` | 2+ Pokemon over 2m tall | 2+ from `giantPokemon` (14 eligible) |
| 12 | `rodent-run` | Rodent Run | `mouse-face` | 2+ rodent Pokemon | 2+ from `rodentPokemon` (16 eligible) |
| 13 | `floral-arrangement` | Floral Arrangement | `hibiscus` | 3+ plant/flower Pokemon | 3+ from `floralPokemon` (24 eligible) |
| 14 | `bird-watching` | Bird Watching | `eagle` | 3+ bird-shaped Pokemon | 3+ from `birdPokemon` (21 eligible) |
| 15 | `spiky-situation` | Spiky Situation | `cactus` | 3+ spiky/quilled Pokemon | 3+ from `spikyPokemon` (20 eligible) |

**Flavor texts:**
- Serpent Strike: "Sssssurprise!"
- Round Table: "Knights not included!"
- Aqua Show: "Something fishy going on!"
- Tiny Titans: "Size doesn't matter!"
- Kaiju Club: "They grow up so fast!"
- Rodent Run: "Squeaky squad!"
- Floral Arrangement: "Smells like victory!"
- Bird Watching: "Tweet tweet!"
- Spiky Situation: "Don't touch!"

### Pokedex ID Extraction

Several new achievements need Pokedex IDs (Neighbors, Gen 1/Gen 2 Purist). Add to the enrichment pipeline:

1. Add `pokedexId` field to `enrichTeamDataForArcade` output by extracting from the Pokemon card's sprite `<img>` src URL (format: `/pokemon/{id}.png`).

2. Helper function:
   ```javascript
   function getPokedexIdFromSprite(spriteUrl) {
       const match = spriteUrl?.match(/\/pokemon\/(\d+)\.(?:png|svg)/);
       return match ? parseInt(match[1]) : null;
   }
   ```

3. Fallback: If sprite URL doesn't contain a parseable ID (e.g., form variants), those Pokemon won't contribute to Pokedex-based achievements. This is acceptable since form variants are rare in normal play.

### `getContributingPokemon` Updates

Add a `case` for each new achievement ID in the `getContributingPokemon` switch statement (line 1609-1701). For list-based checks, the pattern is simple:

```javascript
case 'blue-crew':
    return pokemon.filter(p => pokemonCategories.bluePokemon.includes(p.name.toLowerCase())).map(p => p.name);
```

For computed checks (type-based, stat-based), use the same logic as the check function but return the matching Pokemon names.

### Achievement Double-Dipping

Achievements can stack. This is consistent with existing behavior (e.g., `type-specialist` and `gym-leader` can both trigger). New interactions:

- "Blue Crew" (+15) + "Monochrome" (+30) if 4+ blue Pokemon — intended, rewards deeper commitment
- "Floral Arrangement" (+15) + "Green Machine" (+15) if 3+ green plants — natural overlap, fine
- Color achievements won't conflict with existing "Pretty in Pink" (+75) since the color lists are distinct (pink is NOT in any of the 6 new color lists)

---

## Technical Notes

### File Changes
All changes are in `script.js` and `styles.css`. No new files needed.

**`script.js` changes:**
- `pokemonCategories` object: Add 17 new category arrays + type effectiveness table
- `arcadeMultiplierSets` array: Add `hint` field to all 34 existing entries + add 25 new entries
- `getContributingPokemon` function: Add 25 new cases
- `showBetModal` function: Update button template, add tier section headers
- `detectGoatWoatAchievements` function: Replace single threshold with tiered thresholds
- `updateGoatWoat` function: Add game-count messages
- `renderHistoryEntry` function: Add replay button for arcade entries
- `enrichTeamDataForArcade` function: Add `pokedexId` extraction
- New helper: `getPokedexIdFromSprite`

**`styles.css` changes:**
- `.bet-tooltip` styles (hover tooltip)
- `.bet-tier-header` styles (section headers in bet modal)
- `.replay-reveal-btn` styles
- `.bet-btn-tier` styles (bonus value badge on buttons)

### Estimated Scope
- ~250 lines of new Pokemon category data
- ~400 lines of new achievement definitions (25 achievements with check functions)
- ~50 lines of new `getContributingPokemon` cases
- ~40 lines of bet modal UI updates
- ~20 lines of GOAT/WOAT threshold changes
- ~30 lines of history replay button
- ~50 lines of CSS
- **Total: ~840 lines of changes**
