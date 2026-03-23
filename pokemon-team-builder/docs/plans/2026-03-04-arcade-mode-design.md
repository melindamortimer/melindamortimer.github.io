# Arcade Mode Design

## Overview

Add an arcade mode to the Pokemon Team Battle website that transforms the scoring system with thematic multipliers, streak-breaking bonus wins, an optional side-betting system, and session management. Arcade mode makes battles more dramatic by rewarding creative team compositions with score multipliers that change who wins.

## Feature 1: Arcade Mode Toggle

A prominent toggle switch in the header next to the page title. Visual treatment: neon/glow accent when active so the mode is obvious.

**State:**
- `arcadeMode` boolean flag, persisted in `localStorage`
- Battle records tagged with `mode: "arcade"` or `mode: "classic"`
- When OFF: everything works exactly as current (pure BST comparison)
- When ON: multiplier detection, streak bonuses, and side bets become active

## Feature 2: Multiplier Sets

Multipliers are detected at battle resolution (surprise reveal -- not shown during team building). All qualifying multipliers for a team multiply together. **No cap on total multiplier.**

### Triple Points (3x) -- "Against All Odds"

| Set | Condition | Flavor |
|-----|-----------|--------|
| Baby Brigade | 4+ first-evolution Pokemon from 3-stage evolution lines | Sending babies to war |
| Bottom Barrel | Team average BST < 300 | Scraping the bottom |
| Bug Catchers | 4+ Bug types | Youngster Joey energy |
| NFE Army | 5+ Not Fully Evolved Pokemon | Refusing to evolve |
| The Sunkern Special | Sunkern is on the team AND team wins | The greatest upset |
| Slowpoke Parade | 3+ Pokemon with speed stat < 30 | ...eventually |

### Double Points (2x) -- "Thematic Mastery"

| Set | Condition | Flavor |
|-----|-----------|--------|
| Type Specialist | 3+ Pokemon sharing a type | Gym Leader energy |
| Eeveelution Squad | 3+ different Eeveelutions | Gotta evolve 'em all |
| Fossil Expedition | 3+ different Fossil Pokemon | Jurassic Park |
| Pretty in Pink | 3+ Pink Pokemon | Fabulous |
| Kanto Starters United | All 3 Kanto starter lines represented | OG crew |
| Rocket Roster | 3+ Team Rocket associated Pokemon | Prepare for trouble |

### Bonus Points (1.5x) -- "Power Play"

| Set | Condition | Flavor |
|-----|-----------|--------|
| Legendary Assembly | 3+ Legendaries | Overkill much? |
| Final Form Force | 4+ fully evolved Pokemon | Maximum power |
| Dragon's Den | 3+ Dragon types | Beast mode |
| Bird Trio Complete | Articuno + Zapdos + Moltres | Collectors edition |
| Beast Trio Complete | Raikou + Entei + Suicune | Johto's finest |

### Stacking

All qualifying multipliers multiply together, uncapped. Example: a team of 6 unique first-evolution water-type Pokemon triggers Baby Brigade (3x) + Type Specialist (2x) = **6x total**.

### Scoring Flow

1. Both teams fill to 6 Pokemon
2. Raw BST totals calculated (same as current)
3. Qualifying multipliers detected per team
4. Combined multiplier = product of all qualifying multipliers
5. Adjusted score = Raw BST * Combined Multiplier
6. Winner determined by adjusted scores

## Feature 3: Streak-Breaking Bonus Wins

When arcade mode is ON, breaking an opponent's win streak awards bonus wins to the streak-breaker.

| Streak Broken | Bonus Wins | Total Win Value |
|---------------|------------|-----------------|
| 3-4 games | +1 | 2 wins |
| 5-6 games | +2 | 3 wins |
| 7+ games | +3 | 4 wins |

Bonus wins apply to the winner's tally. Shown with a "STREAK BREAKER!" notification after the battle.

## Feature 4: Side-Betting System (Optional)

A separate opt-in layer within arcade mode. Each team can place one bet per battle.

**Flow:**
1. "Place Bet" button appears in each team area when arcade mode is ON
2. Player selects a category they believe they qualify for
3. Bet is hidden from opponent (shows "Bet Placed" indicator)
4. Revealed during the slot machine animation

**Outcomes:**
- Correct bet: additional 1.5x multiplier
- Wrong bet: 0.75x penalty on total score
- No bet: no effect

**Rules:**
- Maximum 1 bet per team per battle
- Betting is optional

## Feature 5: Slot Machine Reveal Animation

When both teams reach 6 Pokemon in arcade mode, a dramatic reveal plays instead of the instant winner.

**Sequence (~3-5 seconds, skippable):**
1. Screen dims, "ARCADE BATTLE!" banner drops in
2. Raw BST scores show for both teams
3. Reel area appears between teams
4. Per team, qualifying bonuses spin in one at a time:
   - Reel lands on bonus name + multiplier value
   - Running total updates with each landing
5. Side bets reveal last with special flourish
6. Final adjusted scores replace raw scores
7. Winner banner with full multiplier breakdown

If no bonuses detected: quick "No Bonuses" result, straight to winner.
If streak broken: "STREAK BREAKER!" overlay after winner reveal.

## Feature 6: Session Stashing

A collapsible sidebar/drawer from the right side for managing sessions.

### Sidebar Contents

- Header: "Sessions" with "New Session" button
- List of stashed sessions, each showing:
  - Session name (editable, defaults to date)
  - Date range (first battle to last)
  - Total battles played
  - Win summary per team name
  - Mode indicator (Classic / Arcade)
  - Load and Delete buttons

### Stash Flow

1. User clicks "Stash & Start Fresh"
2. Current `battleHistory` saved as named session in `localStorage` under `sessions` key
3. `battleHistory` cleared for fresh start
4. All derived data (tallies, graph, GOAT/WOAT) resets

### Load Flow

1. User clicks "Load" on a stashed session
2. Current history auto-stashed first (nothing lost)
3. Loaded session replaces current `battleHistory`
4. Derived data recalculates

### Storage Structure

```
localStorage:
  battleHistory: [...current session battles...]
  arcadeMode: true|false
  sessions: [
    { id, name, createdAt, battles: [...], mode: "arcade"|"classic" },
    ...
  ]
```

## Feature 7: History Integration

Arcade battle records extend the existing format:

```javascript
{
    ...existing fields...,
    mode: "arcade",
    arcade: {
        team1: {
            rawScore: 2850,
            multipliers: [
                { name: "Type Specialist", value: 2, description: "3 Water types" },
                { name: "Baby Brigade", value: 3, description: "4 first-evolutions" }
            ],
            combinedMultiplier: 6,
            adjustedScore: 17100,
            bet: { category: "Type Specialist", correct: true, multiplier: 1.5 }
        },
        team2: { ...same structure... },
        streakBreak: { broken: 5, bonusWins: 2 }
    }
}
```

**History display for arcade battles:**
- "ARCADE" badge on the entry
- Raw score -> multiplier breakdown -> adjusted score
- Streak-break bonus wins
- Bet results if applicable

## Implementation Order (Suggested)

1. Session stashing system (independent of arcade mode)
2. Arcade mode toggle + state management
3. Multiplier set definitions and detection logic
4. Scoring integration (multipliers affect winner determination)
5. Slot machine reveal animation
6. Streak-breaking bonus wins
7. Side-betting system
8. History display updates for arcade battles
