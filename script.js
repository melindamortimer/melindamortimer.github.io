const statMappings = {
    'hp': { short: 'HP', className: 'stat-hp' },
    'attack': { short: 'ATK', className: 'stat-attack' },
    'defense': { short: 'DEF', className: 'stat-defense' },
    'special-attack': { short: 'SP. ATK', className: 'stat-sp-atk' },
    'special-defense': { short: 'SP. DEF', className: 'stat-sp-def' },
    'speed': { short: 'SPE', className: 'stat-speed' }
};

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
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}



let allPokemonNames = [];

async function loadAllPokemonNames() {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
    const data = await res.json();
    allPokemonNames = data.results.map(p => capitalize(p.name));
}
loadAllPokemonNames();

document.addEventListener("DOMContentLoaded", () => {
    const inputs = document.querySelectorAll(".poke-input");
    inputs.forEach(input => setupAutocomplete(input));

    document.querySelector('.teams').addEventListener('click', handleTeamNameClick);
});

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
