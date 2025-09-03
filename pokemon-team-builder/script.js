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
        date: new Date().toLocaleString()
    };

    const history = JSON.parse(localStorage.getItem('battleHistory')) || [];
    history.push(result);
    localStorage.setItem('battleHistory', JSON.stringify(history));

    loadHistory(); // Reload to show the new entry and respect pagination

    document.getElementById('save-results-btn').disabled = true;
}

function loadHistory() {
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
    updateWinTally();
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
        <div class="history-meta"><span>${result.date}</span></div>
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

    history.forEach(result => {
        if (result.winner === 'tie') {
            return;
        }

        const winnerTeamData = result[result.winner];
        const winnerName = winnerTeamData.name;

        if (tally[winnerName]) {
            tally[winnerName]++;
        } else {
            tally[winnerName] = 1;
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
            item.innerHTML = `<strong>${name}:</strong> ${wins} win${wins > 1 ? 's' : ''}`;
            list.appendChild(item);
        });
        tallyContainer.appendChild(list);
    }
}

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

    const inputs = document.querySelectorAll(".poke-input");
    inputs.forEach(input => setupAutocomplete(input));

    document.querySelector('.teams').addEventListener('click', handleTeamNameClick);
});

// Load history after other scripts have set up the page
window.addEventListener('load', loadHistory);

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
