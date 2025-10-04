const statMappings = {
    'hp': { short: 'HP', className: 'stat-hp' },
    'attack': { short: 'ATK', className: 'stat-attack' },
    'defense': { short: 'DEF', className: 'stat-defense' },
    'special-attack': { short: 'SP. ATK', className: 'stat-sp-atk' },
    'special-defense': { short: 'SP. DEF', className: 'stat-sp-def' },
    'speed': { short: 'SPE', className: 'stat-speed' }
};

let isBattleConcluded = false;

async function fetchPokemon(identifier) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier}`);
    if (!response.ok) {
        throw new Error(`Pokémon not found: ${identifier}`);
    }
    const data = await response.json();

    let processedStats = [];
    const types = data.types.map(typeInfo => typeInfo.type.name);
    let totalStats = 0;

    data.stats.forEach(statObj => {
        const statName = statObj.stat.name;
        const statValue = statObj.base_stat;
        totalStats += statValue;
        if (statMappings[statName]) {
            processedStats.push({
                name: statMappings[statName].short,
                value: statValue,
                className: statMappings[statName].className
            });
        }
    });

    return {
        name: capitalize(data.name),
        stats: processedStats,
        types: types,
        totalStats: totalStats,
        sprite: data.sprites.front_default,
        cry: data.cries?.legacy || data.cries?.latest
    };
}

async function addPokemon(teamId) {
    if (document.getElementById(`${teamId}-grid`).children.length >= 6) return;

    const id = Math.floor(Math.random() * 251) + 1;
    const pokemon = await fetchPokemon(id);
    generatePokemonCard(pokemon, teamId);
}

function setTeamControlsState(teamId, disabled) {
    const teamContainer = document.getElementById(teamId);
    if (teamContainer) {
        teamContainer.querySelector(`#${teamId}-btn`).disabled = disabled;
        teamContainer.querySelector('.randomise-btn').disabled = disabled;
        teamContainer.querySelector('.poke-input').disabled = disabled;
    }
}

function generatePokemonCard(pokemon, teamId) {
    const teamGrid = document.getElementById(`${teamId}-grid`);
    const teamScore = document.getElementById(`${teamId}-score`);
    const teamButton = document.getElementById(`${teamId}-btn`);

    const card = document.createElement('div');
    card.classList.add('pokemon-card');
    card.dataset.totalStats = pokemon.totalStats;

    const img = document.createElement('img');
    img.src = pokemon.sprite;
    img.alt = pokemon.name;
    img.classList.add('pokemon-sprite');
    img.addEventListener('click', () => {
        if (pokemon.cry) {
            new Audio(pokemon.cry).play();
        }
    });

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-pokemon-btn');
    removeBtn.innerHTML = '&times;';
    removeBtn.title = `Remove ${pokemon.name}`;
    removeBtn.onclick = () => removePokemon(card, teamId);


    const nameContainer = document.createElement('div');
    nameContainer.classList.add('pokemon-name-container');

    const nameElement = document.createElement('span');
    nameElement.classList.add('pokemon-name');
    nameElement.textContent = pokemon.name;

    const linkElement = document.createElement('a');
    linkElement.href = `https://pokemondb.net/pokedex/${pokemon.name.toLowerCase()}`;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';
    linkElement.classList.add('pokedex-link');
    linkElement.title = `View ${pokemon.name} on Pokédex`;
    linkElement.innerHTML = '&#128279;'; // Link icon

    nameContainer.appendChild(nameElement);
    nameContainer.appendChild(linkElement);

    const typesContainer = document.createElement('div');
    typesContainer.classList.add('types-container');
    pokemon.types.forEach(type => {
        const typeBubble = document.createElement('span');
        typeBubble.classList.add('type-bubble', `type-${type}`);
        typeBubble.textContent = capitalize(type);
        typesContainer.appendChild(typeBubble);
    });


    const statsGrid = document.createElement('div');
    statsGrid.classList.add('pokemon-stats-grid');

    pokemon.stats.forEach(stat => {
        const statBubble = document.createElement('div');
        statBubble.classList.add('stat-bubble', stat.className);

        const statName = document.createElement('div');
        statName.classList.add('stat-name');
        statName.textContent = stat.name;

        const statValue = document.createElement('div');
        statValue.textContent = stat.value;

        statBubble.appendChild(statName);
        statBubble.appendChild(statValue);
        statsGrid.appendChild(statBubble);
    });

    const totalStatsElement = document.createElement('div');
    totalStatsElement.classList.add('pokemon-total-stats');
    totalStatsElement.innerHTML = `Total: <strong>${pokemon.totalStats}</strong>`;

    card.appendChild(img);
    card.appendChild(removeBtn);
    card.appendChild(nameContainer);
    card.appendChild(typesContainer);
    card.appendChild(statsGrid);
    card.appendChild(totalStatsElement);
    teamGrid.appendChild(card);

    teamScore.textContent = parseInt(teamScore.textContent) + pokemon.totalStats;

    if (teamGrid.children.length >= 6) {
        setTeamControlsState(teamId, true);
    }
    checkForWinner();
}

function removePokemon(card, teamId) {
    const teamScoreEl = document.getElementById(`${teamId}-score`);
    const teamButton = document.getElementById(`${teamId}-btn`);
    const pokemonStats = parseInt(card.dataset.totalStats, 10);

    // Subtract stats from the team total
    teamScoreEl.textContent = parseInt(teamScoreEl.textContent, 10) - pokemonStats;

    // Remove the card from the grid
    card.remove();

    setTeamControlsState(teamId, false);

    // A pokemon was removed, so the previous winner/tie state is invalid.
    // Reset the state for both teams.
    const team1 = document.getElementById("team1");
    const team2 = document.getElementById("team2");
    team1.classList.remove("winner", "tie");
    team2.classList.remove("winner", "tie");
    document.querySelector("#team1 .winner-text").textContent = "";
    document.querySelector("#team2 .winner-text").textContent = "";

    const saveBtn = document.getElementById('save-results-btn');
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
    isBattleConcluded = false;
}

function clearTeam(teamId) {
    const teamGrid = document.getElementById(`${teamId}-grid`);
    const teamScoreEl = document.getElementById(`${teamId}-score`);
    const teamButton = document.getElementById(`${teamId}-btn`);

    // Remove all pokemon cards
    teamGrid.innerHTML = '';

    // Reset score
    teamScoreEl.textContent = '0';

    setTeamControlsState(teamId, false);

    // A team was cleared, so the previous winner/tie state is invalid.
    const team1 = document.getElementById("team1");
    const team2 = document.getElementById("team2");
    team1.classList.remove("winner", "tie");
    team2.classList.remove("winner", "tie");
    document.querySelector("#team1 .winner-text").textContent = "";
    document.querySelector("#team2 .winner-text").textContent = "";

    const saveBtn = document.getElementById('save-results-btn');
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
    isBattleConcluded = false;
}

async function randomiseTeam(teamId) {
    clearTeam(teamId);

    // Disable controls while the team is being generated
    setTeamControlsState(teamId, true);

    try {
        const promises = [];
        for (let i = 0; i < 6; i++) {
            const id = Math.floor(Math.random() * 251) + 1;
            promises.push(fetchPokemon(id));
        }
        const pokemonTeam = await Promise.all(promises);
        pokemonTeam.forEach(pokemon => generatePokemonCard(pokemon, teamId));
    } catch (error) {
        console.error("Failed to randomise team:", error);
        alert("An error occurred while randomising the team. Please try again.");
        // If it fails, re-enable the controls since the team is empty
        setTeamControlsState(teamId, false);
    }
}

function checkForWinner() {
    const team1Full = document.getElementById("team1-grid").children.length === 6;
    const team2Full = document.getElementById("team2-grid").children.length === 6;

    if (team1Full && team2Full) {
        setTimeout(determineWinner, 250);  // Delay before announcing the winner
    }
}

async function determineWinner() {
    const team1Score = parseInt(document.getElementById("team1-score").textContent);
    const team2Score = parseInt(document.getElementById("team2-score").textContent);
    
    const team1 = document.getElementById("team1");
    const team2 = document.getElementById("team2");

    const team1Text = document.querySelector("#team1 .winner-text");
    const team2Text = document.querySelector("#team2 .winner-text");

    // Reset previous winner/tie states
    team1.classList.remove("winner", "tie");
    team2.classList.remove("winner", "tie");
    team1Text.textContent = "";
    team2Text.textContent = "";

    // A short delay for suspense before showing the result
    await new Promise(resolve => setTimeout(resolve, 500));

    if (team1Score > team2Score) {
        team1.classList.add("winner");
        team1Text.textContent = "Winner!";
    } else if (team2Score > team1Score) {
        team2.classList.add("winner");
        team2Text.textContent = "Winner!";
    } else {
        // Handle a tie game
        team1.classList.add("tie");
        team2.classList.add("tie");
        team1Text.textContent = "Tie!";
        team2Text.textContent = "Tie!";
    }

    // Show the save button
    const saveBtn = document.getElementById('save-results-btn');
    saveBtn.style.display = 'block';
    saveBtn.disabled = false;
    isBattleConcluded = true;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Battle History Logic ---

let fullHistory = [];
const DEFAULT_PAGE_SIZE = 5;
let historyPageSize = DEFAULT_PAGE_SIZE;
let currentPage = 1;

function getTeamData(teamId) {
    const teamEl = document.getElementById(teamId);
    const name = teamEl.querySelector('.team-name').textContent;
    const score = teamEl.querySelector(`#${teamId}-score`).textContent;
    const pokemonGrid = teamEl.querySelector(`#${teamId}-grid`);
    const pokemon = Array.from(pokemonGrid.children).map(card => ({
        name: card.querySelector('.pokemon-name').textContent,
        score: parseInt(card.dataset.totalStats, 10)
    }));
    return { name, score, pokemon };
}

async function saveCurrentBattle() {
    if (!isBattleConcluded) return;

    // Hide any existing streak achievement notification
    hideStreakAchievement();

    const team1Data = getTeamData('team1');
    const team2Data = getTeamData('team2');

    const team1Score = parseInt(team1Data.score);
    const team2Score = parseInt(team2Data.score);

    let winner;
    if (team1Score > team2Score) winner = 'team1';
    else if (team2Score > team1Score) winner = 'team2';
    else winner = 'tie';

    const result = {
        id: Date.now(),
        team1: team1Data,
        team2: team2Data,
        winner: winner,
        date: new Date().toISOString()
    };

    const history = JSON.parse(localStorage.getItem('battleHistory')) || [];
    history.push(result);
    localStorage.setItem('battleHistory', JSON.stringify(history));

    loadHistory(true); // Reload to show the new entry and check for streak breaks

    document.getElementById('save-results-btn').disabled = true;
}

function loadHistory(checkStreak = false) {
    fullHistory = JSON.parse(localStorage.getItem('battleHistory')) || [];
    // Sort by date descending (newest first)
    fullHistory.sort((a, b) => b.id - a.id);

    const pageSizeInput = document.getElementById('history-page-size');
    historyPageSize = parseInt(pageSizeInput.value, 10);
    if (isNaN(historyPageSize) || historyPageSize < 1) {
        historyPageSize = DEFAULT_PAGE_SIZE;
        pageSizeInput.value = historyPageSize;
    }

    currentPage = 1; // Reset to the first page
    renderHistoryWithPagination();
    updateGoatWoat();
    updateWinTally();
    if (checkStreak) {
        checkForStreakBreak();
    }
    renderWinDifferenceGraph();
}

function renderHistoryEntry(result) {
    const historyList = document.getElementById('history-list');
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    entry.dataset.id = result.id;

    const isTeam1Winner = result.winner === 'team1';
    const isTeam2Winner = result.winner === 'team2';
    const isTie = result.winner === 'tie';

    const team1PokemonList = result.team1.pokemon.map(p => `${p.name} (${p.score})`).join(', ');
    const team2PokemonList = result.team2.pokemon.map(p => `${p.name} (${p.score})`).join(', ');

    const team1WinnerTag = isTeam1Winner ? ' <span class="history-winner-tag">Winner</span>' : '';
    const team2WinnerTag = isTeam2Winner ? ' <span class="history-winner-tag">Winner</span>' : '';
    const tieTag = isTie ? ' <span class="history-tie-tag">Tie</span>' : '';

    entry.innerHTML = `
        <button class="delete-history-btn" title="Delete this entry">&times;</button>
        <div class="history-meta"><span>${new Date(result.date).toLocaleString()}</span></div>
        <div class="history-team-compact">
            <h3>${result.team1.name} (${result.team1.score})${team1WinnerTag}${tieTag}</h3>
            <div class="history-pokemon-list">${team1PokemonList}</div>
        </div>
        <div class="history-team-compact">
            <h3>${result.team2.name} (${result.team2.score})${team2WinnerTag}${tieTag}</h3>
            <div class="history-pokemon-list">${team2PokemonList}</div>
        </div>`;

    entry.querySelector('.delete-history-btn').addEventListener('click', () => deleteHistoryEntry(result.id));

    historyList.appendChild(entry);
}

function deleteHistoryEntry(id) {
    if (!confirm('Are you sure you want to delete this battle result?')) return;

    let history = JSON.parse(localStorage.getItem('battleHistory')) || [];
    history = history.filter(result => result.id !== id);
    localStorage.setItem('battleHistory', JSON.stringify(history));

    document.querySelector(`.history-entry[data-id="${id}"]`)?.remove();
    loadHistory(); // Reload to reflect deletion and update pagination
}

function renderHistoryWithPagination() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    const startIndex = (currentPage - 1) * historyPageSize;
    const endIndex = startIndex + historyPageSize;
    const itemsToRender = fullHistory.slice(startIndex, endIndex);

    itemsToRender.forEach(result => renderHistoryEntry(result));

    renderPaginationControls();
}

function renderPaginationControls() {
    const controlsContainer = document.getElementById('pagination-controls');
    controlsContainer.innerHTML = '';
    const totalPages = Math.ceil(fullHistory.length / historyPageSize);

    if (totalPages <= 1) return;

    // Previous Button
    const prevButton = document.createElement('button');
    prevButton.textContent = '« Previous';
    prevButton.className = 'pagination-btn';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderHistoryWithPagination();
        }
    });
    controlsContainer.appendChild(prevButton);

    // Page Numbers
    const pageNumbersContainer = document.createElement('div');
    pageNumbersContainer.className = 'page-numbers';
    
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    
    if (startPage > 1) {
        pageNumbersContainer.appendChild(createPageButton(1));
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            pageNumbersContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbersContainer.appendChild(createPageButton(i));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            pageNumbersContainer.appendChild(ellipsis);
        }
        pageNumbersContainer.appendChild(createPageButton(totalPages));
    }

    controlsContainer.appendChild(pageNumbersContainer);

    // Next Button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next »';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderHistoryWithPagination();
        }
    });
    controlsContainer.appendChild(nextButton);
}

function exportHistory() {
    const historyString = localStorage.getItem('battleHistory');
    if (!historyString || historyString === '[]') {
        alert("No battle history to export.");
        return;
    }

    const blob = new Blob([historyString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokemon-battle-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importHistory() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            try {
                const importedData = JSON.parse(content);
                if (!Array.isArray(importedData)) throw new Error("Invalid format: not an array.");

                const existingHistory = JSON.parse(localStorage.getItem('battleHistory')) || [];
                const numBefore = existingHistory.length;
                
                const historyMap = new Map(existingHistory.map(item => [item.id, item]));
                importedData.forEach(item => {
                    if (item && typeof item.id !== 'undefined') historyMap.set(item.id, item);
                });
                const mergedHistory = Array.from(historyMap.values());

                localStorage.setItem('battleHistory', JSON.stringify(mergedHistory));
                alert(`History imported successfully. ${mergedHistory.length - numBefore} new entries added.`);
                loadHistory();
            } catch (err) {
                console.error("Import failed:", err);
                alert("Failed to import history. The file may be corrupt or in the wrong format.");
            }
        };
        reader.readAsText(file, 'UTF-8');
    };
    input.click();
}

function updateWinTally() {
    const history = fullHistory; // Use the global fullHistory which is already loaded
    const tally = {};

    // Calculate total wins
    history.forEach(result => {
        if (result.winner === 'tie') return;
        const winnerName = result[result.winner].name;
        tally[winnerName] = (tally[winnerName] || 0) + 1;
    });

    // Calculate current streaks
    const currentStreaks = {};
    const uniqueTeamNames = [...new Set(history.flatMap(r => [r.team1.name, r.team2.name]))];

    uniqueTeamNames.forEach(teamName => {
        let streak = 0;
        // history is newest to oldest
        for (const result of history) {
            const wasInMatch = result.team1.name === teamName || result.team2.name === teamName;
            if (!wasInMatch) continue;

            const didWin = (result.winner === 'team1' && result.team1.name === teamName) ||
                           (result.winner === 'team2' && result.team2.name === teamName);

            if (didWin) {
                streak++;
            } else {
                // Most recent match for this team was a loss or tie, so streak is broken.
                break;
            }
        }
        if (streak > 1) {
            currentStreaks[teamName] = streak;
        }
    });

    const tallyContainer = document.getElementById('win-tally-container');
    tallyContainer.innerHTML = '';

    // Sort by wins descending
    const sortedTally = Object.entries(tally).sort(([, a], [, b]) => b - a);

    if (sortedTally.length > 0) {
        const list = document.createElement('ul');
        list.className = 'win-tally-list';
        sortedTally.forEach(([name, wins]) => {
            const item = document.createElement('li');
            const streakText = currentStreaks[name] ? ` <span class="win-streak-text">(🔥 ${currentStreaks[name]}-win streak)</span>` : '';
            item.innerHTML = `<strong>${name}:</strong> ${wins} win${wins > 1 ? 's' : ''}${streakText}`;
            list.appendChild(item);
        });
        tallyContainer.appendChild(list);
    }
}

function checkForStreakBreak() {
    if (fullHistory.length < 2) return;

    const history = fullHistory;
    const latestMatch = history[0]; // newest first
    const uniqueTeamNames = [...new Set(history.flatMap(r => [r.team1.name, r.team2.name]))];

    uniqueTeamNames.forEach(teamName => {
        // Check if this team was in the latest match
        const wasInLatestMatch = latestMatch.team1.name === teamName || latestMatch.team2.name === teamName;
        if (!wasInLatestMatch) return;

        // Check if this team lost or tied in the latest match
        const lostOrTied = (latestMatch.winner === 'tie') ||
                          (latestMatch.winner === 'team1' && latestMatch.team1.name !== teamName) ||
                          (latestMatch.winner === 'team2' && latestMatch.team2.name !== teamName);

        if (!lostOrTied) return;

        // Count the streak before this match
        let streakCount = 0;
        for (let i = 1; i < history.length; i++) {
            const result = history[i];
            const wasInMatch = result.team1.name === teamName || result.team2.name === teamName;
            if (!wasInMatch) continue;

            const didWin = (result.winner === 'team1' && result.team1.name === teamName) ||
                           (result.winner === 'team2' && result.team2.name === teamName);

            if (didWin) {
                streakCount++;
            } else {
                break;
            }
        }

        // If they had a streak of 2 or more, show the achievement
        if (streakCount >= 2) {
            showStreakBreakAchievement(teamName, streakCount);
        }
    });
}

function showStreakBreakAchievement(teamName, streakCount) {
    const achievementContainer = document.getElementById('streak-achievement');
    achievementContainer.innerHTML = `
        <div class="streak-break-notification">
            <button class="streak-close-btn" title="Dismiss">&times;</button>
            💔 <strong>${teamName}</strong>'s ${streakCount}-win streak has ended!
        </div>
    `;
    achievementContainer.style.display = 'block';

    // Add close button handler
    achievementContainer.querySelector('.streak-close-btn').addEventListener('click', () => {
        achievementContainer.style.display = 'none';
    });
}

function hideStreakAchievement() {
    const achievementContainer = document.getElementById('streak-achievement');
    if (achievementContainer) {
        achievementContainer.style.display = 'none';
    }
}

function updateGoatWoat() {
    const history = fullHistory;
    const allTeams = [];

    // Collect all teams from all battles
    history.forEach(result => {
        [result.team1, result.team2].forEach((team) => {
            allTeams.push({
                name: team.name,
                score: parseInt(team.score),
                pokemon: team.pokemon.map(p => ({ name: p.name, score: p.score })),
                matchId: result.id
            });
        });
    });

    const goatWoatContainer = document.getElementById('goat-woat-container');
    goatWoatContainer.innerHTML = '';

    if (allTeams.length === 0) {
        goatWoatContainer.innerHTML = '<p class="goat-woat-no-data">No battle history yet.</p>';
        return;
    }

    // Sort by score to find highest and lowest
    allTeams.sort((a, b) => b.score - a.score);

    const goat = allTeams[0];
    const woat = allTeams[allTeams.length - 1];

    const goatSection = document.createElement('div');
    goatSection.className = 'goat-section';
    goatSection.innerHTML = `
        <h3>🐐 GOAT (Greatest of All Time)</h3>
        <div class="goat-woat-team" data-match-id="${goat.matchId}">
            <div class="goat-woat-team-name">${goat.name}</div>
            <div class="goat-woat-score">Total Score: ${goat.score}</div>
            <div class="goat-woat-pokemon">${goat.pokemon.map(p => `${p.name} (${p.score})`).join(', ')}</div>
        </div>
    `;

    const woatSection = document.createElement('div');
    woatSection.className = 'woat-section';
    woatSection.innerHTML = `
        <h3>🗑️ WOAT (Worst of All Time)</h3>
        <div class="goat-woat-team" data-match-id="${woat.matchId}">
            <div class="goat-woat-team-name">${woat.name}</div>
            <div class="goat-woat-score">Total Score: ${woat.score}</div>
            <div class="goat-woat-pokemon">${woat.pokemon.map(p => `${p.name} (${p.score})`).join(', ')}</div>
        </div>
    `;

    goatWoatContainer.appendChild(goatSection);
    goatWoatContainer.appendChild(woatSection);

    // Add click handlers to navigate to the battle
    goatSection.querySelector('.goat-woat-team').addEventListener('click', () => scrollToBattle(goat.matchId));
    woatSection.querySelector('.goat-woat-team').addEventListener('click', () => scrollToBattle(woat.matchId));
}

function scrollToBattle(matchId) {
    const itemGlobalIndex = fullHistory.findIndex(h => h.id === matchId);
    if (itemGlobalIndex === -1) return;

    const targetPage = Math.floor(itemGlobalIndex / historyPageSize) + 1;
    if (targetPage !== currentPage) {
        currentPage = targetPage;
        renderHistoryWithPagination();
    }

    setTimeout(() => {
        document.querySelector(`.history-entry[data-id="${matchId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
}

let graphData = []; // Store data for tooltips and clicks

let allPokemonNames = [];

async function loadAllPokemonNames() {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
    const data = await res.json();
    allPokemonNames = data.results.map(p => capitalize(p.name));
}
loadAllPokemonNames();

document.addEventListener("DOMContentLoaded", () => {
    // Create and inject save button and history section
    const saveButtonContainer = document.createElement('div');
    saveButtonContainer.className = 'save-btn-container';
    saveButtonContainer.innerHTML = `<button id="save-results-btn" class="save-btn" style="display: none;">Save Battle Results</button>`;

    const historyContainer = document.createElement('div');
    historyContainer.id = 'history-container';
    historyContainer.innerHTML = `
        <div class="history-header">
            <h2>Battle History</h2>
            <div class="history-controls">
                <label for="history-page-size" class="history-page-size-label">Per Page:</label>
                <input type="number" id="history-page-size" class="history-page-size-input" min="1" max="50" title="Set items per page">
                <button id="import-history-btn" class="history-control-btn" title="Import History">Import</button>
                <button id="export-history-btn" class="history-control-btn" title="Export History">Export</button>
            </div>
        </div>
        <div id="win-graph-container">
            <div class="graph-controls">
                <label for="graph-limit" class="graph-limit-label">Graph last:</label>
                <select id="graph-limit" class="graph-limit-select">
                    <option value="10" selected>10 battles</option>
                    <option value="25">25 battles</option>
                    <option value="50">50 battles</option>
                    <option value="0">All time</option>
                </select>
            </div>
            <div id="graph-wrapper"></div>
            <div id="graph-tooltip" style="position: absolute; pointer-events: none; opacity: 0; transition: opacity 0.2s ease;"></div>
        </div>
        <div id="goat-woat-container"></div>
        <div id="streak-achievement" style="display: none;"></div>
        <div id="win-tally-container"></div>
        <div id="history-list"></div>
        <div class="history-footer">
            <div id="pagination-controls"></div>
        </div>`;

    const teamsContainer = document.querySelector('.teams');
    teamsContainer.insertAdjacentElement('afterend', saveButtonContainer);
    document.body.appendChild(historyContainer);

    const pageSizeInput = document.getElementById('history-page-size');
    pageSizeInput.value = DEFAULT_PAGE_SIZE;
    pageSizeInput.addEventListener('change', handlePageSizeChange);

    // Add event listeners for new buttons
    document.getElementById('save-results-btn').addEventListener('click', saveCurrentBattle);
    document.getElementById('import-history-btn').addEventListener('click', importHistory);
    document.getElementById('export-history-btn').addEventListener('click', exportHistory);
    document.getElementById('graph-limit').addEventListener('change', renderWinDifferenceGraph);

    const inputs = document.querySelectorAll(".poke-input");
    inputs.forEach(input => setupAutocomplete(input));

    document.querySelector('.teams').addEventListener('click', handleTeamNameClick);
});

document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('win-graph-container');
    const tooltip = document.getElementById('graph-tooltip');

    graphContainer.addEventListener('mouseover', e => {
        if (e.target.classList.contains('graph-point-hover-target')) {
            const index = parseInt(e.target.dataset.index, 10);
            const data = graphData[index];
            if (!data) return;

            const team1Name = document.querySelector('#team1 .team-name').textContent;
            const team2Name = document.querySelector('#team2 .team-name').textContent;

            let content = '';
            if (data.match) {
                const winnerName = data.match.winner === 'tie' ? 'Tie' : data.match[data.match.winner].name;
                content = `
                    <strong>Match Result:</strong> ${winnerName}<br>
                    <strong>Score:</strong> ${data.match.team1.score} - ${data.match.team2.score}<br>
                    <strong>H2H Tally:</strong> ${team1Name} ${data.t1Wins} - ${data.t2Wins} ${team2Name}<br>
                    <strong>Lead:</strong> ${data.diff > 0 ? `${team1Name} by ${data.diff}` : data.diff < 0 ? `${team2Name} by ${-data.diff}` : 'Even'}
                `;
            } else {
                content = '<strong>Start of Series</strong><br>Tally: 0 - 0';
            }
            tooltip.innerHTML = content;
            tooltip.style.opacity = 1;
        }
    });

    graphContainer.addEventListener('mouseout', e => {
        if (e.target.classList.contains('graph-point-hover-target')) {
            tooltip.style.opacity = 0;
        }
    });

    graphContainer.addEventListener('mousemove', e => {
        if (tooltip.style.opacity === '1') {
            const containerRect = graphContainer.getBoundingClientRect();
            let x = e.clientX - containerRect.left;
            let y = e.clientY - containerRect.top;

            if (x + tooltip.offsetWidth + 20 > containerRect.width) x -= (tooltip.offsetWidth + 15);
            else x += 15;
            if (y + tooltip.offsetHeight + 20 > containerRect.height) y -= (tooltip.offsetHeight + 15);
            else y += 15;

            tooltip.style.transform = `translate(${x}px, ${y}px)`;
        }
    });

    graphContainer.addEventListener('click', e => {
        if (e.target.classList.contains('graph-point-hover-target')) {
            const index = parseInt(e.target.dataset.index, 10);
            const data = graphData[index];
            if (!data || !data.match) return;

            const matchId = data.match.id;
            const itemGlobalIndex = fullHistory.findIndex(h => h.id === matchId);
            if (itemGlobalIndex === -1) return;

            const targetPage = Math.floor(itemGlobalIndex / historyPageSize) + 1;
            if (targetPage !== currentPage) {
                currentPage = targetPage;
                renderHistoryWithPagination();
            }

            setTimeout(() => {
                document.querySelector(`.history-entry[data-id="${matchId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    });
});
// Load history after other scripts have set up the page
window.addEventListener('load', () => {
    // Always hide the streak notification on page load
    hideStreakAchievement();
    loadHistory();
});
window.addEventListener('resize', () => renderWinDifferenceGraph()); // Re-render graph on resize

function handlePageSizeChange(e) {
    let newSize = parseInt(e.target.value, 10);
    if (isNaN(newSize) || newSize < 1) {
        newSize = DEFAULT_PAGE_SIZE;
        e.target.value = newSize;
    }
    if (newSize > 50) { // Add a max
        newSize = 50;
        e.target.value = newSize;
    }
    historyPageSize = newSize;
    currentPage = 1; // Reset to first page
    renderHistoryWithPagination();
}

function createPageButton(pageNumber) {
    const pageButton = document.createElement('button');
    pageButton.textContent = pageNumber;
    pageButton.className = 'pagination-btn page-number';
    if (pageNumber === currentPage) {
        pageButton.classList.add('active');
        pageButton.disabled = true;
    }
    pageButton.addEventListener('click', () => {
        currentPage = pageNumber;
        renderHistoryWithPagination();
    });
    return pageButton;
}

function setupAutocomplete(input) {
    const wrapper = input.parentElement;
    const list = wrapper.querySelector(".suggestions");
    let currentIndex = -1;

    input.addEventListener("input", () => {
        const val = input.value.toLowerCase();
        list.innerHTML = "";
        currentIndex = -1;
        if (!val) return;

        const matches = allPokemonNames.filter(name => name.toLowerCase().startsWith(val)).slice(0, 6);
        matches.forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            li.addEventListener("click", () => {
                input.value = name;
                list.innerHTML = "";
                handleManualAdd(input, name);
            });
            list.appendChild(li);
        });
    });

    input.addEventListener("keydown", (e) => {
        const items = list.querySelectorAll("li");
        if (e.key === "ArrowDown") {
            currentIndex = (currentIndex + 1) % items.length;
        } else if (e.key === "ArrowUp") {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            let selectedItem;
    
            if (currentIndex >= 0 && currentIndex < items.length) {
                selectedItem = items[currentIndex];
            } else if (items.length > 0) {
                selectedItem = items[0];
            }
    
            if (selectedItem) {
                const selectedName = selectedItem.textContent;
                list.innerHTML = "";
                currentIndex = -1;
                handleManualAdd(input, selectedName);
            }
        }

        items.forEach((item, idx) => {
            item.classList.toggle("highlighted", idx === currentIndex);
        });

        // Ensure the highlighted item is visible within the scrollable list
        if (currentIndex > -1 && items[currentIndex]) {
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        }
    });
}

function handleTeamNameClick(e) {
    // Check if a team-name span was clicked and it's not already being edited
    if (e.target.classList.contains('team-name') && !e.target.isEditing) {
        const nameSpan = e.target;
        nameSpan.isEditing = true; // Flag to prevent re-triggering

        const h2 = nameSpan.parentNode;
        const currentName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.classList.add('team-name-input');

        const saveChanges = () => {
            const newName = input.value.trim();
            // Revert to original name if the input is empty
            nameSpan.textContent = newName && newName.length > 0 ? newName : currentName;
            h2.replaceChild(nameSpan, input);
            renderWinDifferenceGraph(); // Re-render graph in case name changed
            nameSpan.isEditing = false; // Reset flag
        };

        input.addEventListener('blur', saveChanges, { once: true });
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                input.blur();
            } else if (event.key === 'Escape') {
                input.value = currentName; // Revert changes on Escape
                input.blur();
            } else if (event.key === 'Tab') {
                event.preventDefault(); // Stop browser from tabbing away
                input.blur(); // This will save the changes via the blur listener

                // Find the next team to edit
                const currentTeam = nameSpan.closest('.team');
                const allTeams = Array.from(document.querySelectorAll('.team'));
                const currentIndex = allTeams.indexOf(currentTeam);
                const nextTeam = allTeams[currentIndex + 1]; // Get the next team element

                if (nextTeam) {
                    nextTeam.querySelector('.team-name')?.click();
                } else {
                    // We are on the last team, so focus the first team's input
                    const firstTeamInput = document.querySelector('#team1 .poke-input');
                    firstTeamInput?.focus();
                }
            }
        });

        h2.replaceChild(input, nameSpan);
        input.focus();
        input.select();
    }
}

async function handleManualAdd(input, name) {
    const teamId = input.closest(".team").id;
    const teamGrid = document.getElementById(`${teamId}-grid`);

    if (teamGrid.children.length >= 6) return;
    input.value = ""; // Clear input immediately

    try {
        const pokemon = await fetchPokemon(name.toLowerCase());
        generatePokemonCard(pokemon, teamId);

        // If team 1 is now full, focus team 2's input for a smoother workflow
        if (teamId === 'team1' && teamGrid.children.length === 6) {
            document.querySelector('#team2 .poke-input')?.focus();
        }
    } catch (err) {
        console.error(err);
        alert(`Could not find a Pokémon named "${name}". Please try again.`);
    }
}

function renderWinDifferenceGraph() {
    const wrapper = document.getElementById('graph-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = ''; // Clear previous graph

    const team1Name = document.querySelector('#team1 .team-name').textContent;
    const team2Name = document.querySelector('#team2 .team-name').textContent;

    const relevantHistory = fullHistory.filter(r =>
        (r.team1.name === team1Name && r.team2.name === team2Name) ||
        (r.team1.name === team2Name && r.team2.name === team1Name)
    ).reverse(); // chronological

    const limitSelect = document.getElementById('graph-limit');
    const limit = limitSelect ? parseInt(limitSelect.value, 10) : 0;

    let historyToGraph = relevantHistory;
    let historyBeforeGraph = [];

    if (limit > 0 && relevantHistory.length > limit) {
        const slicePoint = relevantHistory.length - limit;
        historyToGraph = relevantHistory.slice(slicePoint);
        historyBeforeGraph = relevantHistory.slice(0, slicePoint);
    }

    if (relevantHistory.length < 1) {
        wrapper.innerHTML = `<p class="graph-no-data">No head-to-head battle history found for <strong>${team1Name}</strong> vs. <strong>${team2Name}</strong>.</p>`;
        return;
    }

    // Calculate the starting tally from matches that occurred *before* the graphed period
    let startT1Wins = 0;
    let startT2Wins = 0;
    historyBeforeGraph.forEach(match => {
        if (match.winner !== 'tie') {
            if (match[match.winner].name === team1Name) {
                startT1Wins++;
            } else {
                startT2Wins++;
            }
        }
    });

    // Now, build the graph data starting from this initial state
    let runningT1Wins = startT1Wins;
    let runningT2Wins = startT2Wins;
    
    graphData = [{
        diff: startT1Wins - startT2Wins,
        t1Wins: startT1Wins,
        t2Wins: startT2Wins,
        match: null
    }];

    historyToGraph.forEach(match => {
        if (match.winner !== 'tie') {
            if (match[match.winner].name === team1Name) runningT1Wins++;
            else runningT2Wins++;
        }
        graphData.push({
            diff: runningT1Wins - runningT2Wins,
            t1Wins: runningT1Wins,
            t2Wins: runningT2Wins,
            match: match
        });
    });

    const diffValues = graphData.map(d => d.diff);
    const maxAbsDiff = Math.max(1, ...diffValues.map(d => Math.abs(d)));

    const svgHeight = 100; // Increased for date axis
    const svgWidth = wrapper.clientWidth;
    const yCenter = 45; // Asymmetrical center for more space at the bottom
    const yRange = yCenter - 15; // Range for graph line from center

    const points = graphData.map((d, i) => {
        const x = (graphData.length > 1) ? (i / (graphData.length - 1)) * (svgWidth - 40) + 10 : svgWidth / 2;
        const y = yCenter - (d.diff / maxAbsDiff) * yRange;
        return { x, y };
    });

    const pathString = points.map(p => `${p.x},${p.y}`).join(' L ');

    const hoverCircles = points.map((p, i) => {
        const data = graphData[i];
        let colorClass = 'graph-point-neutral';
        if (data.match) {
            if (data.match.winner !== 'tie') {
                // Check which actual team won, not just the position
                const winnerName = data.match[data.match.winner].name;
                if (winnerName === team1Name) {
                    colorClass = 'graph-point-team1-win';
                } else if (winnerName === team2Name) {
                    colorClass = 'graph-point-team2-win';
                }
            }
        }
        return `<circle cx="${p.x}" cy="${p.y}" r="8" class="graph-point-hover-target ${colorClass}" data-index="${i}" />`;
    }).join('');

    const dateLabels = [];
    const dateOptions = { month: 'numeric', day: 'numeric', year: '2-digit' };

    // Add date label for each match point (skip the starting point at index 0)
    historyToGraph.forEach((match, i) => {
        const pointIndex = i + 1; // +1 because index 0 is the starting point
        const date = new Date(match.date).toLocaleDateString(undefined, dateOptions);
        const x = points[pointIndex].x;
        dateLabels.push(`<text x="${x}" y="${svgHeight - 5}" text-anchor="middle" class="graph-label graph-date-label">${date}</text>`);
    });

    const svg = `
        <svg width="100%" height="${svgHeight}" class="win-graph-svg">
            <defs>
                <clipPath id="clip-above"><rect x="0" y="0" width="${svgWidth}" height="${yCenter}" /></clipPath>
                <clipPath id="clip-below"><rect x="0" y="${yCenter}" width="${svgWidth}" height="${svgHeight - yCenter}" /></clipPath>
            </defs>

            <line x1="0" y1="${yCenter}" x2="${svgWidth}" y2="${yCenter}" stroke="var(--primary-accent)" stroke-width="1" stroke-dasharray="4 2" />

            <path d="M ${pathString}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" class="graph-path-above" clip-path="url(#clip-above)" />
            <path d="M ${pathString}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" class="graph-path-below" clip-path="url(#clip-below)" />

            <g class="graph-hover-points">${hoverCircles}</g>

            ${dateLabels.join('')}

            <text x="10" y="15" class="graph-label">${team1Name} Lead</text>
            <text x="10" y="${yCenter + yRange}" class="graph-label">${team2Name} Lead</text>
            <text x="${svgWidth - 10}" y="15" text-anchor="end" class="graph-label-value">+${Math.max(0, ...diffValues)}</text>
            <text x="${svgWidth - 10}" y="${yCenter + yRange}" text-anchor="end" class="graph-label-value">${Math.min(0, ...diffValues)}</text>
        </svg>
    `;

    wrapper.innerHTML = svg;
}
