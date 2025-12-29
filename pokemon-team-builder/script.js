const statMappings = {
    'hp': { short: 'HP', className: 'stat-hp' },
    'attack': { short: 'ATK', className: 'stat-attack' },
    'defense': { short: 'DEF', className: 'stat-defense' },
    'special-attack': { short: 'SP. ATK', className: 'stat-sp-atk' },
    'special-defense': { short: 'SP. DEF', className: 'stat-sp-def' },
    'speed': { short: 'SPE', className: 'stat-speed' }
};

// Easter Egg Pokemon Categories
const pokemonCategories = {
    legendaries: [
        'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
        'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'celebi',
        'regirock', 'regice', 'registeel', 'latias', 'latios',
        'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys',
        'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran',
        'regigigas', 'giratina', 'cresselia', 'phione', 'manaphy',
        'darkrai', 'shaymin', 'arceus'
    ],
    legendaryBirds: ['articuno', 'zapdos', 'moltres'],
    towerDuo: ['lugia', 'ho-oh'],
    teamRocketMeowth: ['meowth'],
    teamRocketOther: ['ekans', 'arbok', 'koffing', 'weezing'],
    eeveelutions: ['vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon'],
    fossils: ['omanyte', 'omastar', 'kabuto', 'kabutops', 'aerodactyl', 'lileep', 'cradily', 'anorith', 'armaldo', 'cranidos', 'rampardos', 'shieldon', 'bastiodon', 'tirtouga', 'carracosta', 'archen', 'archeops'],
    kantoStarters: ['bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise'],
    kantoStarterLines: {
        grass: ['bulbasaur', 'ivysaur', 'venusaur'],
        fire: ['charmander', 'charmeleon', 'charizard'],
        water: ['squirtle', 'wartortle', 'blastoise']
    },
    pikachuFamily: ['pichu', 'pikachu', 'raichu'],
    plusleminun: ['plusle', 'minun'],
    pinkPokemon: ['clefairy', 'clefable', 'jigglypuff', 'wigglytuff', 'slowpoke', 'slowbro', 'exeggcute', 'lickitung', 'chansey', 'mr-mime', 'porygon', 'mew', 'cleffa', 'igglybuff', 'flaaffy', 'hoppip', 'slowking', 'snubbull', 'corsola', 'smoochum', 'miltank', 'blissey', 'whismur', 'skitty', 'milotic', 'gorebyss', 'luvdisc', 'cherubi', 'mime-jr', 'happiny', 'lickilicky', 'porygon-z', 'munna', 'musharna', 'audino', 'alomomola', 'spritzee', 'aromatisse', 'sylveon'],
    dragons: ['dratini', 'dragonair', 'dragonite', 'kingdra', 'vibrava', 'flygon', 'altaria', 'bagon', 'shelgon', 'salamence', 'latias', 'latios', 'rayquaza', 'gible', 'gabite', 'garchomp', 'dialga', 'palkia', 'giratina', 'axew', 'fraxure', 'haxorus', 'druddigon', 'deino', 'zweilous', 'hydreigon', 'reshiram', 'zekrom', 'kyurem', 'goomy', 'sliggoo', 'goodra', 'noibat', 'noivern'],
    sunkern: ['sunkern'],
    magikarp: ['magikarp'],
    ditto: ['ditto'],
    slowpokes: ['slowpoke', 'slowbro', 'slowking'],
    mewtwoMew: ['mewtwo', 'mew'],
    // Pokemon that are base forms of 3-stage evolution lines
    threeStageFirstEvolutions: [
        'bulbasaur', 'charmander', 'squirtle', 'caterpie', 'weedle', 'pidgey',
        'nidoran-f', 'nidoran-m', 'zubat', 'oddish', 'poliwag', 'abra', 'machop',
        'bellsprout', 'geodude', 'magnemite', 'gastly', 'rhyhorn', 'horsea',
        'porygon', 'dratini', 'chikorita', 'cyndaquil', 'totodile', 'togepi',
        'mareep', 'hoppip', 'swinub', 'larvitar', 'treecko', 'torchic', 'mudkip',
        'wurmple', 'lotad', 'seedot', 'ralts', 'slakoth', 'whismur', 'aron',
        'budew', 'trapinch', 'duskull', 'spheal', 'bagon', 'beldum'
    ],
    // Pokemon that are fully evolved (final stage)
    finalEvolutions: [
        'venusaur', 'charizard', 'blastoise', 'butterfree', 'beedrill', 'pidgeot', 'raticate',
        'fearow', 'arbok', 'raichu', 'sandslash', 'nidoqueen', 'nidoking', 'clefable', 'wigglytuff',
        'crobat', 'vileplume', 'bellossom', 'parasect', 'venomoth', 'dugtrio', 'persian', 'golduck',
        'primeape', 'arcanine', 'poliwrath', 'politoed', 'alakazam', 'machamp', 'victreebel',
        'tentacruel', 'golem', 'rapidash', 'slowbro', 'slowking', 'magnezone', 'dodrio', 'dewgong',
        'muk', 'cloyster', 'gengar', 'steelix', 'hypno', 'kingler', 'electrode', 'exeggutor',
        'marowak', 'hitmonlee', 'hitmonchan', 'hitmontop', 'weezing', 'rhyperior', 'blissey',
        'tangrowth', 'kingdra', 'seaking', 'starmie', 'mr-mime', 'scizor', 'jynx', 'electivire',
        'magmortar', 'gyarados', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon',
        'glaceon', 'sylveon', 'porygon-z', 'omastar', 'kabutops', 'dragonite', 'meganium',
        'typhlosion', 'feraligatr', 'furret', 'noctowl', 'ledian', 'ariados', 'lanturn', 'togekiss',
        'xatu', 'ampharos', 'azumarill', 'sudowoodo', 'jumpluff', 'ambipom', 'sunflora', 'wobbuffet',
        'quagsire', 'honchkrow', 'mismagius', 'gliscor', 'granbull', 'weavile', 'ursaring', 'magcargo',
        'mamoswine', 'octillery', 'houndoom', 'donphan', 'wyrdeer', 'tyranitar', 'sceptile', 'blaziken',
        'swampert', 'mightyena', 'linoone', 'beautifly', 'dustox', 'ludicolo', 'shiftry', 'swellow',
        'pelipper', 'gardevoir', 'gallade', 'masquerain', 'breloom', 'slaking', 'ninjask', 'shedinja',
        'exploud', 'hariyama', 'delcatty', 'aggron', 'medicham', 'manectric', 'roserade', 'swalot',
        'sharpedo', 'wailord', 'camerupt', 'grumpig', 'flygon', 'cacturne', 'altaria', 'whiscash',
        'crawdaunt', 'claydol', 'cradily', 'armaldo', 'milotic', 'banette', 'dusknoir', 'chimecho',
        'glalie', 'froslass', 'walrein', 'huntail', 'gorebyss', 'salamence', 'metagross'
    ]
};

// Achievement Definitions
// ========================
// Easter eggs that trigger when certain Pokemon or combinations appear in a team.
// Achievements are detected when a battle concludes and saved with the battle history.
//
// LEGENDARY:
//   ⭐ Legendary Encounter     - 1 legendary Pokemon in team
//   🌟 Mythical Assembly       - 2 legendary Pokemon in team
//   👑 Pantheon                - 3+ legendary Pokemon in team
//   🐦 Bird Keeper             - All 3 legendary birds (Articuno, Zapdos, Moltres)
//   🗼 Tower Guardians         - Lugia and Ho-Oh together
//   🧬 Genetic Experiment      - Mewtwo or Mew in team
//
// TEAM ROCKET:
//   😺 That's Right!           - Meowth in team
//   🚀 Prepare for Trouble!    - 2+ Team Rocket Pokemon (Ekans, Arbok, Koffing, Weezing)
//
// UNDERDOG:
//   🌻 The Mighty Sunkern      - Sunkern in team (lowest base stat Pokemon)
//   🐟 Splash!                 - Magikarp in team
//   🏆 Underdog Victory        - Won with 2+ sub-300 total stat Pokemon
//   ✨ Magikarp Miracle        - Won with Magikarp in team
//
// EVOLUTION:
//   🍼 Baby Boom               - 4+ first-stage Pokemon from 3-stage evolution lines
//   💪 Final Form              - 4+ fully evolved Pokemon
//   🦊 Eeveelution Squad       - 3+ Eeveelutions
//
// ICONIC:
//   ⚡ I Choose You!           - Pikachu in team
//   👨‍👩‍👧 Pika-Family              - 2+ Pikachu family members (Pichu, Pikachu, Raichu)
//   🎮 Kanto Starters          - Pokemon from all 3 Kanto starter lines
//   🦴 Fossil Revival          - 2+ fossil Pokemon
//   ➕➖ Dynamic Duo            - Plusle AND Minun together
//
// TYPE SPECIALIST:
//   🐉 Dragon Tamer            - 3+ Dragon type Pokemon
//
// FUN:
//   🫠 Ditto's Identity Crisis - Ditto in team
//   🦥 Slowpoke Mode           - Slowpoke family in team
//   🌸 Pretty in Pink          - 3+ pink Pokemon
//
// CROSS-TEAM:
//   🪞 Mirror Match!           - Same Pokemon appears on both teams
//   ⚔️ Legendary Standoff!     - Same legendary Pokemon on both teams (supersedes Mirror Match)
//
const achievements = [
    // Legendary achievements
    {
        id: 'legendary-encounter',
        title: 'Legendary Encounter',
        emoji: '⭐',
        description: 'A legendary Pokémon appeared!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.legendaries.includes(p)).length;
            return count === 1;
        }
    },
    {
        id: 'mythical-assembly',
        title: 'Mythical Assembly',
        emoji: '🌟',
        description: 'Two legendary Pokémon unite!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.legendaries.includes(p)).length;
            return count === 2;
        }
    },
    {
        id: 'pantheon',
        title: 'Pantheon',
        emoji: '👑',
        description: 'Three or more legendaries assembled!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.legendaries.includes(p)).length;
            return count >= 3;
        }
    },
    {
        id: 'bird-keeper',
        title: 'Bird Keeper',
        emoji: '🐦',
        description: 'All three legendary birds!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemonCategories.legendaryBirds.every(bird => pokemon.includes(bird));
        }
    },
    {
        id: 'tower-guardians',
        title: 'Tower Guardians',
        emoji: '🗼',
        description: 'Lugia and Ho-Oh together!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemonCategories.towerDuo.every(p => pokemon.includes(p));
        }
    },
    {
        id: 'genetic-experiment',
        title: 'Genetic Experiment',
        emoji: '🧬',
        description: 'Mewtwo or Mew in the team!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemonCategories.mewtwoMew.some(p => pokemon.includes(p));
        }
    },
    // Team Rocket
    {
        id: 'thats-right',
        title: "That's Right!",
        emoji: '😺',
        description: 'Meowth is in the team!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.some(p => pokemonCategories.teamRocketMeowth.includes(p));
        }
    },
    {
        id: 'prepare-for-trouble',
        title: 'Prepare for Trouble!',
        emoji: '🚀',
        description: 'Two or more Team Rocket Pokémon!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.teamRocketOther.includes(p)).length;
            return count >= 2;
        }
    },
    // Underdog achievements
    {
        id: 'mighty-sunkern',
        title: 'The Mighty Sunkern',
        emoji: '🌻',
        description: 'Sunkern believes in itself!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.includes('sunkern');
        }
    },
    {
        id: 'splash',
        title: 'Splash!',
        emoji: '🐟',
        description: 'Magikarp used Splash!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.includes('magikarp');
        }
    },
    {
        id: 'underdog-victory',
        title: 'Underdog Victory',
        emoji: '🏆',
        description: 'Won with 2+ sub-300 stat Pokémon!',
        check: (team, isWinner) => {
            if (!isWinner) return false;
            const count = team.pokemon.filter(p => p.score < 300).length;
            return count >= 2;
        }
    },
    {
        id: 'magikarp-miracle',
        title: 'Magikarp Miracle',
        emoji: '✨',
        description: 'Magikarp helped win the battle!',
        check: (team, isWinner) => {
            if (!isWinner) return false;
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.includes('magikarp');
        }
    },
    // Evolution achievements
    {
        id: 'baby-boom',
        title: 'Baby Boom',
        emoji: '🍼',
        description: 'Four or more first-stage Pokémon from 3-stage lines!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.threeStageFirstEvolutions.includes(p)).length;
            return count >= 4;
        }
    },
    {
        id: 'final-form',
        title: 'Final Form',
        emoji: '💪',
        description: 'Four or more fully evolved Pokémon!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.finalEvolutions.includes(p)).length;
            return count >= 4;
        }
    },
    {
        id: 'eeveelution-squad',
        title: 'Eeveelution Squad',
        emoji: '🦊',
        description: 'Three or more Eeveelutions!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.eeveelutions.includes(p)).length;
            return count >= 3;
        }
    },
    // Iconic achievements
    {
        id: 'i-choose-you',
        title: 'I Choose You!',
        emoji: '⚡',
        description: 'Pikachu is on the team!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.includes('pikachu');
        }
    },
    {
        id: 'pika-family',
        title: 'Pika-Family',
        emoji: '👨‍👩‍👧',
        description: 'Multiple Pikachu family members!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.pikachuFamily.includes(p)).length;
            return count >= 2;
        }
    },
    {
        id: 'kanto-starters',
        title: 'Kanto Starters',
        emoji: '🎮',
        description: 'Representatives from all three Kanto starter lines!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const hasGrass = pokemonCategories.kantoStarterLines.grass.some(p => pokemon.includes(p));
            const hasFire = pokemonCategories.kantoStarterLines.fire.some(p => pokemon.includes(p));
            const hasWater = pokemonCategories.kantoStarterLines.water.some(p => pokemon.includes(p));
            return hasGrass && hasFire && hasWater;
        }
    },
    {
        id: 'fossil-revival',
        title: 'Fossil Revival',
        emoji: '🦴',
        description: 'Two or more fossil Pokémon!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.fossils.includes(p)).length;
            return count >= 2;
        }
    },
    {
        id: 'dynamic-duo',
        title: 'Dynamic Duo',
        emoji: '➕➖',
        description: 'Plusle and Minun together!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.includes('plusle') && pokemon.includes('minun');
        }
    },
    // Type specialist
    {
        id: 'dragon-tamer',
        title: 'Dragon Tamer',
        emoji: '🐉',
        description: 'Three or more Dragon types!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.dragons.includes(p)).length;
            return count >= 3;
        }
    },
    // Fun achievements
    {
        id: 'ditto-identity-crisis',
        title: "Ditto's Identity Crisis",
        emoji: '🫠',
        description: 'Ditto is on the team!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.includes('ditto');
        }
    },
    {
        id: 'slowpoke-mode',
        title: 'Slowpoke Mode',
        emoji: '🦥',
        description: 'Slowpoke family on the team!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.some(p => pokemonCategories.slowpokes.includes(p));
        }
    },
    {
        id: 'pretty-in-pink',
        title: 'Pretty in Pink',
        emoji: '🌸',
        description: 'Three or more pink Pokémon!',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.pinkPokemon.includes(p)).length;
            return count >= 3;
        }
    }
];

let isBattleConcluded = false;
let currentBattleAchievements = { team1: [], team2: [] };

// Detect achievements for a team
function detectAchievements(teamData, isWinner) {
    const earned = [];
    const pokemonNames = teamData.pokemon.map(p => p.name.toLowerCase());

    for (const achievement of achievements) {
        if (achievement.check(teamData, isWinner)) {
            // Find which Pokemon triggered this achievement
            const triggeringPokemon = findTriggeringPokemon(achievement.id, teamData, isWinner);
            earned.push({
                id: achievement.id,
                title: achievement.title,
                emoji: achievement.emoji,
                description: achievement.description,
                triggeringPokemon: triggeringPokemon
            });
        }
    }
    return earned;
}

// Find which Pokemon triggered a specific achievement
function findTriggeringPokemon(achievementId, teamData, isWinner) {
    const pokemon = teamData.pokemon;
    const names = pokemon.map(p => p.name.toLowerCase());

    switch (achievementId) {
        case 'legendary-encounter':
        case 'mythical-assembly':
        case 'pantheon':
            return pokemon.filter(p => pokemonCategories.legendaries.includes(p.name.toLowerCase()));
        case 'bird-keeper':
            return pokemon.filter(p => pokemonCategories.legendaryBirds.includes(p.name.toLowerCase()));
        case 'tower-guardians':
            return pokemon.filter(p => pokemonCategories.towerDuo.includes(p.name.toLowerCase()));
        case 'genetic-experiment':
            return pokemon.filter(p => pokemonCategories.mewtwoMew.includes(p.name.toLowerCase()));
        case 'thats-right':
            return pokemon.filter(p => pokemonCategories.teamRocketMeowth.includes(p.name.toLowerCase()));
        case 'prepare-for-trouble':
            return pokemon.filter(p => pokemonCategories.teamRocketOther.includes(p.name.toLowerCase()));
        case 'mighty-sunkern':
            return pokemon.filter(p => p.name.toLowerCase() === 'sunkern');
        case 'splash':
        case 'magikarp-miracle':
            return pokemon.filter(p => p.name.toLowerCase() === 'magikarp');
        case 'underdog-victory':
            return pokemon.filter(p => p.score < 300);
        case 'baby-boom':
            return pokemon.filter(p => pokemonCategories.threeStageFirstEvolutions.includes(p.name.toLowerCase()));
        case 'final-form':
            return pokemon.filter(p => pokemonCategories.finalEvolutions.includes(p.name.toLowerCase()));
        case 'eeveelution-squad':
            return pokemon.filter(p => pokemonCategories.eeveelutions.includes(p.name.toLowerCase()));
        case 'i-choose-you':
            return pokemon.filter(p => p.name.toLowerCase() === 'pikachu');
        case 'pika-family':
            return pokemon.filter(p => pokemonCategories.pikachuFamily.includes(p.name.toLowerCase()));
        case 'kanto-starters':
            return pokemon.filter(p => pokemonCategories.kantoStarters.includes(p.name.toLowerCase()));
        case 'fossil-revival':
            return pokemon.filter(p => pokemonCategories.fossils.includes(p.name.toLowerCase()));
        case 'dynamic-duo':
            return pokemon.filter(p => pokemonCategories.plusleminun.includes(p.name.toLowerCase()));
        case 'dragon-tamer':
            return pokemon.filter(p => pokemonCategories.dragons.includes(p.name.toLowerCase()));
        case 'ditto-identity-crisis':
            return pokemon.filter(p => p.name.toLowerCase() === 'ditto');
        case 'slowpoke-mode':
            return pokemon.filter(p => pokemonCategories.slowpokes.includes(p.name.toLowerCase()));
        case 'pretty-in-pink':
            return pokemon.filter(p => pokemonCategories.pinkPokemon.includes(p.name.toLowerCase()));
        default:
            return [];
    }
}

// Show single achievement detail popup (for history badge clicks)
function showAchievementDetailPopup(achievement) {
    // Remove existing popup
    const existingPopup = document.getElementById('achievement-detail-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'achievement-detail-popup';
    popup.className = 'achievement-detail-popup';

    // Get criteria text based on achievement ID
    const criteria = getAchievementCriteria(achievement.id);

    popup.innerHTML = `
        <div class="achievement-detail-content">
            <button class="achievement-detail-close">&times;</button>
            <div class="achievement-detail-emoji">${achievement.emoji}</div>
            <h3>${achievement.title}</h3>
            <p class="achievement-detail-description">${achievement.description}</p>
            <div class="achievement-detail-criteria">
                <strong>Criteria:</strong> ${criteria}
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Show with animation
    setTimeout(() => popup.classList.add('show'), 10);

    // Close button
    popup.querySelector('.achievement-detail-close').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });

    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }
    });
}

// Get human-readable criteria for each achievement
function getAchievementCriteria(achievementId) {
    const criteriaMap = {
        'legendary-encounter': 'One legendary Pokémon is in your team.',
        'mythical-assembly': 'Two legendary Pokémon are in your team.',
        'pantheon': 'Three or more legendary Pokémon are in your team.',
        'bird-keeper': 'Articuno, Zapdos, and Moltres are all in your team.',
        'tower-guardians': 'Lugia and Ho-Oh are both in your team.',
        'genetic-experiment': 'Mewtwo or Mew is in your team.',
        'thats-right': 'Meowth is in your team.',
        'prepare-for-trouble': 'Two or more Team Rocket Pokémon are in your team.',
        'mighty-sunkern': 'Sunkern is in your team.',
        'splash': 'Magikarp is in your team.',
        'underdog-victory': 'You won with two or more sub-300 stat Pokémon.',
        'magikarp-miracle': 'You won with Magikarp in your team.',
        'baby-boom': 'Four or more first-stage Pokémon from 3-stage lines are in your team.',
        'final-form': 'Four or more fully evolved Pokémon are in your team.',
        'eeveelution-squad': 'Three or more Eeveelutions are in your team.',
        'i-choose-you': 'Pikachu is in your team.',
        'pika-family': 'Two or more Pikachu family members are in your team.',
        'kanto-starters': 'Pokémon from all three Kanto starter lines are in your team.',
        'fossil-revival': 'Two or more fossil Pokémon are in your team.',
        'dynamic-duo': 'Plusle and Minun are both in your team.',
        'dragon-tamer': 'Three or more Dragon-type Pokémon are in your team.',
        'ditto-identity-crisis': 'Ditto is in your team.',
        'slowpoke-mode': 'A Slowpoke family member is in your team.',
        'pretty-in-pink': 'Three or more pink Pokémon are in your team.',
        'mirror-match': 'The same Pokémon appears on both teams.',
        'legendary-standoff': 'The same legendary Pokémon appears on both teams.'
    };
    return criteriaMap[achievementId] || 'Special achievement unlocked.';
}

// Show achievement popup
function showAchievementPopup(allAchievements) {
    if (allAchievements.length === 0) return;

    // Remove existing popup
    const existingPopup = document.getElementById('achievement-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'achievement-popup';
    popup.className = 'achievement-popup';

    const achievementItems = allAchievements.map(a => {
        // Generate sprite images for triggering Pokemon
        const sprites = (a.triggeringPokemon || []).map(p => {
            const pokeName = p.name.toLowerCase();
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonIdByName(pokeName)}.png`;
            return `<img src="${spriteUrl}" alt="${p.name}" title="${p.name}" class="achievement-pokemon-sprite" onerror="this.style.display='none'">`;
        }).join('');

        return `
            <div class="achievement-popup-item">
                <span class="achievement-popup-emoji">${a.emoji}</span>
                <div class="achievement-popup-text">
                    <strong>${a.title}</strong>
                    <span>${a.description}</span>
                    ${sprites ? `<div class="achievement-pokemon-sprites">${sprites}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    popup.innerHTML = `
        <div class="achievement-popup-content">
            <button class="achievement-popup-close">&times;</button>
            <h3>🏅 Achievements Unlocked!</h3>
            <div class="achievement-popup-list">
                ${achievementItems}
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Show with animation
    setTimeout(() => popup.classList.add('show'), 10);

    // Close button
    popup.querySelector('.achievement-popup-close').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });

    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }
    });
}

// Helper to get Pokemon ID by name for sprite URLs
function getPokemonIdByName(name) {
    const index = allPokemonNames.findIndex(n => n.toLowerCase() === name.toLowerCase());
    return index !== -1 ? index + 1 : 1;
}

// Detect achievements that involve both teams
function detectCrossTeamAchievements(team1Data, team2Data) {
    const earned = [];
    const team2Names = team2Data.pokemon.map(p => p.name.toLowerCase());

    // Find Pokemon that appear on both teams
    const commonPokemon = team1Data.pokemon.filter(p =>
        team2Names.includes(p.name.toLowerCase())
    );

    if (commonPokemon.length > 0) {
        // Check if any common Pokemon is a legendary
        const commonLegendaries = commonPokemon.filter(p =>
            pokemonCategories.legendaries.includes(p.name.toLowerCase())
        );

        if (commonLegendaries.length > 0) {
            earned.push({
                id: 'legendary-standoff',
                title: 'Legendary Standoff!',
                emoji: '⚔️',
                description: 'Same legendary Pokémon on both teams!',
                triggeringPokemon: commonLegendaries
            });
        } else {
            earned.push({
                id: 'mirror-match',
                title: 'Mirror Match!',
                emoji: '🪞',
                description: 'Same Pokémon on both teams!',
                triggeringPokemon: commonPokemon
            });
        }
    }

    return earned;
}

// Filter out lower-tier achievements when higher-tier ones are present
function filterTieredAchievements(achievements) {
    const ids = achievements.map(a => a.id);

    // Legendary tiers: pantheon > mythical-assembly > legendary-encounter
    const hasPantheon = ids.includes('pantheon');
    const hasMythical = ids.includes('mythical-assembly');

    // Other superseding achievements
    const hasUnderdogVictory = ids.includes('underdog-victory');
    const hasMagikarpMiracle = ids.includes('magikarp-miracle');
    const hasPikaFamily = ids.includes('pika-family');

    return achievements.filter(a => {
        // Legendary tiers
        if (a.id === 'legendary-encounter' && (hasMythical || hasPantheon)) {
            return false;
        }
        if (a.id === 'mythical-assembly' && hasPantheon) {
            return false;
        }

        // magikarp-miracle supersedes splash
        if (a.id === 'splash' && hasMagikarpMiracle) {
            return false;
        }

        // underdog-victory supersedes single sub-300 Pokemon achievements
        // (Magikarp: 200, Sunkern: 180, Ditto: 288, Meowth: 290)
        if (a.id === 'splash' && hasUnderdogVictory) {
            return false;
        }
        if (a.id === 'mighty-sunkern' && hasUnderdogVictory) {
            return false;
        }
        if (a.id === 'ditto-identity-crisis' && hasUnderdogVictory) {
            return false;
        }
        if (a.id === 'thats-right' && hasUnderdogVictory) {
            return false;
        }

        // pika-family supersedes i-choose-you
        if (a.id === 'i-choose-you' && hasPikaFamily) {
            return false;
        }

        return true;
    });
}

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
        teamContainer.querySelector('.paste-team-btn').disabled = disabled;
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

function pasteTeamFromClipboard(teamId) {
    openPasteModal(teamId);
}

function createPasteModal() {
    if (document.getElementById('paste-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'paste-modal';
    modal.className = 'paste-modal';
    modal.innerHTML = `
        <div class="paste-modal-content">
            <button class="paste-modal-close">&times;</button>
            <h3>Paste Team Screenshot</h3>
            <div id="paste-drop-zone" class="paste-drop-zone" tabindex="0">
                <p>Press <kbd>Ctrl</kbd>+<kbd>V</kbd> or <kbd>Cmd</kbd>+<kbd>V</kbd> to paste image</p>
                <p class="paste-hint">Or click here and paste</p>
            </div>
            <div id="paste-preview-container" class="paste-preview-container" style="display: none;">
                <img id="paste-preview-image" class="paste-preview-image" />
            </div>
            <div id="paste-status" class="paste-status"></div>
            <div id="paste-pokemon-list" class="paste-pokemon-list"></div>
            <div class="paste-modal-actions">
                <button id="paste-cancel-btn" class="paste-cancel-btn">Cancel</button>
                <button id="paste-confirm-btn" class="paste-confirm-btn" disabled>Add to Team</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.paste-modal-close').addEventListener('click', closePasteModal);
    modal.querySelector('#paste-cancel-btn').addEventListener('click', closePasteModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePasteModal();
    });

    // Focus the drop zone for keyboard events
    const dropZone = modal.querySelector('#paste-drop-zone');
    dropZone.addEventListener('click', () => dropZone.focus());
}

let currentPasteTeamId = null;
let detectedPokemonNames = [];
let isProcessingPaste = false;

function openPasteModal(teamId) {
    createPasteModal();
    currentPasteTeamId = teamId;
    detectedPokemonNames = [];
    isProcessingPaste = false;

    const modal = document.getElementById('paste-modal');
    modal.style.display = 'flex';

    // Reset modal state
    document.getElementById('paste-drop-zone').style.display = 'block';
    document.getElementById('paste-preview-container').style.display = 'none';
    document.getElementById('paste-status').textContent = '';
    document.getElementById('paste-pokemon-list').innerHTML = '';
    document.getElementById('paste-confirm-btn').disabled = true;

    // Focus the drop zone
    setTimeout(() => document.getElementById('paste-drop-zone').focus(), 100);

    // Add global paste listener while modal is open
    document.addEventListener('paste', handlePasteEvent);
}

function closePasteModal() {
    const modal = document.getElementById('paste-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentPasteTeamId = null;
    detectedPokemonNames = [];
    document.removeEventListener('paste', handlePasteEvent);
}

async function handlePasteEvent(e) {
    const modal = document.getElementById('paste-modal');
    if (!modal || modal.style.display === 'none') return;
    if (isProcessingPaste) return;

    e.preventDefault();
    isProcessingPaste = true;

    const items = e.clipboardData?.items;
    if (!items) {
        isProcessingPaste = false;
        return;
    }

    let imageBlob = null;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            imageBlob = item.getAsFile();
            break;
        }
    }

    if (!imageBlob) {
        document.getElementById('paste-status').textContent = 'No image found. Please copy an image first.';
        isProcessingPaste = false;
        return;
    }

    // Show image preview
    const previewImg = document.getElementById('paste-preview-image');
    const previewContainer = document.getElementById('paste-preview-container');
    const dropZone = document.getElementById('paste-drop-zone');
    const statusEl = document.getElementById('paste-status');
    const pokemonListEl = document.getElementById('paste-pokemon-list');

    previewImg.src = URL.createObjectURL(imageBlob);
    dropZone.style.display = 'none';
    previewContainer.style.display = 'block';
    statusEl.textContent = 'Reading image...';
    pokemonListEl.innerHTML = '';

    try {
        // Run OCR
        const { data: { text } } = await Tesseract.recognize(imageBlob, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    statusEl.textContent = `Reading... ${Math.round(m.progress * 100)}%`;
                }
            }
        });

        // Parse Pokemon names
        detectedPokemonNames = parsePokemonFromOCR(text);

        if (detectedPokemonNames.length === 0) {
            statusEl.textContent = 'No Pokémon detected. Try a different screenshot.';
            document.getElementById('paste-confirm-btn').disabled = true;
            isProcessingPaste = false;
            return;
        }

        statusEl.textContent = `Found ${detectedPokemonNames.length} Pokémon:`;

        // Show detected Pokemon with sprites
        pokemonListEl.innerHTML = '';
        for (const name of detectedPokemonNames) {
            const item = document.createElement('div');
            item.className = 'paste-pokemon-item';

            // Fetch sprite
            try {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
                const data = await response.json();
                item.innerHTML = `
                    <img src="${data.sprites.front_default}" alt="${name}" class="paste-pokemon-sprite" />
                    <span>${name}</span>
                `;
            } catch {
                item.innerHTML = `<span>${name}</span>`;
            }
            pokemonListEl.appendChild(item);
        }

        document.getElementById('paste-confirm-btn').disabled = false;

        // Set up confirm button
        const confirmBtn = document.getElementById('paste-confirm-btn');
        confirmBtn.onclick = () => applyDetectedPokemon();

        isProcessingPaste = false;

    } catch (error) {
        console.error('OCR failed:', error);
        statusEl.textContent = 'Failed to read image. Please try again.';
        isProcessingPaste = false;
    }
}

async function applyDetectedPokemon() {
    if (!currentPasteTeamId || detectedPokemonNames.length === 0) return;

    // Save values before closing modal (which clears them)
    const teamId = currentPasteTeamId;
    const pokemonToAdd = [...detectedPokemonNames];
    closePasteModal();

    // Clear team and add detected Pokemon
    clearTeam(teamId);
    setTeamControlsState(teamId, true);

    try {
        const promises = pokemonToAdd.slice(0, 6).map(name => fetchPokemon(name.toLowerCase()));
        const pokemonTeam = await Promise.all(promises);
        pokemonTeam.forEach(pokemon => generatePokemonCard(pokemon, teamId));
    } catch (error) {
        console.error('Failed to load Pokemon:', error);
        alert('Failed to load some Pokémon. Please try again.');
        setTeamControlsState(teamId, false);
    }
}

function findClosestPokemonName(name) {
    const lower = name.toLowerCase();

    // 1. Exact match
    let match = allPokemonNames.find(n => n.toLowerCase() === lower);
    if (match) return match;

    // 2. Replace underscores with hyphens (e.g., deoxys_defense → deoxys-defense)
    const hyphenated = lower.replace(/_/g, '-');
    match = allPokemonNames.find(n => n.toLowerCase() === hyphenated);
    if (match) return match;

    // 3. Handle special form names
    const specialForms = {
        'nidoran_male': 'nidoran-m',
        'nidoran-male': 'nidoran-m',
        'nidoran_female': 'nidoran-f',
        'nidoran-female': 'nidoran-f',
        'mr_mime': 'mr-mime',
        'mime_jr': 'mime-jr',
        'type_null': 'type-null',
        'tapu_koko': 'tapu-koko',
        'tapu_lele': 'tapu-lele',
        'tapu_bulu': 'tapu-bulu',
        'tapu_fini': 'tapu-fini',
    };
    if (specialForms[lower]) {
        match = allPokemonNames.find(n => n.toLowerCase() === specialForms[lower]);
        if (match) return match;
    }
    if (specialForms[hyphenated]) {
        match = allPokemonNames.find(n => n.toLowerCase() === specialForms[hyphenated]);
        if (match) return match;
    }

    // 4. Fuzzy match: find names that start with the same base (before underscore/hyphen)
    const baseName = lower.split(/[_-]/)[0];
    if (baseName.length >= 3) {
        // Try to find a Pokemon that starts with the base name and contains similar suffixes
        const candidates = allPokemonNames.filter(n => n.toLowerCase().startsWith(baseName));
        if (candidates.length === 1) return candidates[0];

        // If multiple candidates, try to match the suffix
        const suffix = lower.replace(baseName, '').replace(/^[_-]/, '');
        if (suffix) {
            const suffixMatch = candidates.find(n => n.toLowerCase().includes(suffix.replace(/_/g, '-')));
            if (suffixMatch) return suffixMatch;
        }
    }

    return null;
}

function parsePokemonFromOCR(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const foundPokemon = [];
    const seen = new Set();

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        const defaultIndex = lowerLine.indexOf('default');

        if (defaultIndex !== -1) {
            // Extract the word after "default"
            const afterDefault = lowerLine.substring(defaultIndex + 7).trim();
            const pokemonName = afterDefault.split(/\s+/)[0];

            if (pokemonName && !seen.has(pokemonName)) {
                // Find closest matching Pokemon name
                const match = findClosestPokemonName(pokemonName);
                if (match) {
                    foundPokemon.push(match);
                    seen.add(pokemonName);
                    if (foundPokemon.length >= 6) break;
                }
            }
        }
    }

    return foundPokemon;
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

    let team1IsWinner = false;
    let team2IsWinner = false;

    if (team1Score > team2Score) {
        team1.classList.add("winner");
        team1Text.textContent = "Winner!";
        team1IsWinner = true;
    } else if (team2Score > team1Score) {
        team2.classList.add("winner");
        team2Text.textContent = "Winner!";
        team2IsWinner = true;
    } else {
        // Handle a tie game
        team1.classList.add("tie");
        team2.classList.add("tie");
        team1Text.textContent = "Tie!";
        team2Text.textContent = "Tie!";
    }

    // Detect achievements for both teams
    const team1Data = getTeamData('team1');
    const team2Data = getTeamData('team2');
    currentBattleAchievements.team1 = detectAchievements(team1Data, team1IsWinner);
    currentBattleAchievements.team2 = detectAchievements(team2Data, team2IsWinner);

    // Check for cross-team achievements (Pokemon appearing on both teams)
    const crossTeamAchievements = detectCrossTeamAchievements(team1Data, team2Data);

    // Show achievement popup if any achievements were earned
    const allAchievements = [...currentBattleAchievements.team1, ...currentBattleAchievements.team2, ...crossTeamAchievements];
    // Deduplicate achievements (same achievement can appear for both teams)
    let uniqueAchievements = allAchievements.filter((a, index, self) =>
        index === self.findIndex(t => t.id === a.id)
    );
    // Filter out lower-tier legendary achievements when higher-tier ones are present
    uniqueAchievements = filterTieredAchievements(uniqueAchievements);
    showAchievementPopup(uniqueAchievements);

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

    // Detect cross-team achievements for saving
    const crossTeamAchievements = detectCrossTeamAchievements(team1Data, team2Data);

    const result = {
        id: Date.now(),
        team1: team1Data,
        team2: team2Data,
        winner: winner,
        date: new Date().toISOString(),
        achievements: {
            team1: currentBattleAchievements.team1,
            team2: currentBattleAchievements.team2,
            crossTeam: crossTeamAchievements
        }
    };

    // Reset achievements for next battle
    currentBattleAchievements = { team1: [], team2: [] };

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

    // Generate achievement badges
    let achievementBadgesHTML = '';
    let historyAchievements = [];
    if (result.achievements) {
        const allAchievements = [
            ...(result.achievements.team1 || []),
            ...(result.achievements.team2 || []),
            ...(result.achievements.crossTeam || [])
        ];
        // Deduplicate
        let uniqueAchievements = allAchievements.filter((a, index, self) =>
            index === self.findIndex(t => t.id === a.id)
        );
        // Filter out lower-tier legendary achievements
        uniqueAchievements = filterTieredAchievements(uniqueAchievements);
        historyAchievements = uniqueAchievements;
        if (uniqueAchievements.length > 0) {
            const badges = uniqueAchievements.map((a, idx) =>
                `<span class="achievement-badge" data-achievement-idx="${idx}" title="${a.title}">${a.emoji}</span>`
            ).join('');
            achievementBadgesHTML = `<div class="history-achievements">${badges}</div>`;
        }
    }

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
        </div>
        ${achievementBadgesHTML}
        <span class="load-hint">Click to Load Battle</span>`;

    entry.querySelector('.delete-history-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryEntry(result.id);
    });

    // Click on achievement badges to show detail popup
    entry.querySelectorAll('.achievement-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(badge.dataset.achievementIdx, 10);
            if (historyAchievements[idx]) {
                showAchievementDetailPopup(historyAchievements[idx]);
            }
        });
    });

    // Click to load battle into main page
    entry.addEventListener('click', () => {
        const hint = entry.querySelector('.load-hint');
        hint.textContent = 'Loading...';
        hint.classList.add('loaded');
        hint.style.opacity = '0.8';
        loadBattleFromHistory(result, hint);
    });

    historyList.appendChild(entry);
}

async function loadBattleFromHistory(result, hintElement) {
    // Set team names
    document.querySelector('#team1 .team-name').textContent = result.team1.name;
    document.querySelector('#team2 .team-name').textContent = result.team2.name;

    // Clear both teams
    clearTeam('team1');
    clearTeam('team2');

    // Disable controls while loading
    setTeamControlsState('team1', true);
    setTeamControlsState('team2', true);

    try {
        // Load team 1
        const team1Promises = result.team1.pokemon.map(p => fetchPokemon(p.name.toLowerCase()));
        const team1Pokemon = await Promise.all(team1Promises);
        team1Pokemon.forEach(pokemon => generatePokemonCard(pokemon, 'team1'));

        // Load team 2
        const team2Promises = result.team2.pokemon.map(p => fetchPokemon(p.name.toLowerCase()));
        const team2Pokemon = await Promise.all(team2Promises);
        team2Pokemon.forEach(pokemon => generatePokemonCard(pokemon, 'team2'));

        // Update hint text
        if (hintElement) {
            hintElement.textContent = 'Battle Loaded!';
            setTimeout(() => {
                hintElement.textContent = 'Click to Load Battle';
                hintElement.classList.remove('loaded');
                hintElement.style.opacity = '';
            }, 2000);
        }

        // Scroll to top to see the loaded battle
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Failed to load battle from history:', error);
        alert('Failed to load some Pokémon. The battle data may be corrupted.');
        setTeamControlsState('team1', false);
        setTeamControlsState('team2', false);
        if (hintElement) {
            hintElement.textContent = 'Click to Load Battle';
            hintElement.classList.remove('loaded');
            hintElement.style.opacity = '';
        }
    }
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

let goatWoatLimit = 3; // Default number of entries to show

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

    // Get the limit from the dropdown
    const limitSelect = document.getElementById('goat-woat-limit');
    const limit = limitSelect ? parseInt(limitSelect.value, 10) : goatWoatLimit;

    // Get top X (GOAT) including ties
    let goats = [];
    if (allTeams.length > 0) {
        goats = allTeams.slice(0, limit);
        // If there are more teams, check if the next team(s) are tied with the last one
        if (allTeams.length > limit) {
            const lastScore = goats[goats.length - 1].score;
            let i = limit;
            while (i < allTeams.length && allTeams[i].score === lastScore) {
                goats.push(allTeams[i]);
                i++;
            }
        }
    }

    // Get bottom X (WOAT) including ties
    let woats = [];
    if (allTeams.length > 0) {
        woats = allTeams.slice(-limit).reverse(); // reverse to show worst first
        // If there are more teams, check if teams before the cutoff are tied with the first one
        if (allTeams.length > limit) {
            const worstScore = woats[0].score;
            let i = allTeams.length - limit - 1;
            while (i >= 0 && allTeams[i].score === worstScore) {
                woats.unshift(allTeams[i]); // Add to the beginning
                i--;
            }
        }
    }

    // Create GOAT section
    const goatSection = document.createElement('div');
    goatSection.className = 'goat-section';
    let goatHTML = `
        <h3>🐐 GOAT (Greatest of All Time)</h3>
        <table class="goat-woat-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>`;

    let currentRank = 1;
    goats.forEach((team, index) => {
        // Check if this team's score is different from the previous one
        if (index > 0 && team.score < goats[index - 1].score) {
            currentRank = index + 1; // Skip ranks for ties
        }
        const pokemonList = team.pokemon.map(p => `${p.name} (${p.score})`).join(', ');
        goatHTML += `
            <tr class="goat-woat-row" data-match-id="${team.matchId}">
                <td class="rank-cell">${currentRank}</td>
                <td class="team-info-cell">
                    <div class="pokemon-list-primary">${pokemonList}</div>
                    <div class="team-name-secondary">${team.name}</div>
                </td>
                <td class="score-cell">${team.score}</td>
            </tr>`;
    });

    goatHTML += `
            </tbody>
        </table>
    `;
    goatSection.innerHTML = goatHTML;

    // Create WOAT section
    const woatSection = document.createElement('div');
    woatSection.className = 'woat-section';
    let woatHTML = `
        <h3>🗑️ WOAT (Worst of All Time)</h3>
        <table class="goat-woat-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>`;

    let woatRank = 1;
    woats.forEach((team, index) => {
        // Check if this team's score is different from the previous one
        if (index > 0 && team.score > woats[index - 1].score) {
            woatRank = index + 1; // Skip ranks for ties
        }
        const pokemonList = team.pokemon.map(p => `${p.name} (${p.score})`).join(', ');
        woatHTML += `
            <tr class="goat-woat-row" data-match-id="${team.matchId}">
                <td class="rank-cell">${woatRank}</td>
                <td class="team-info-cell">
                    <div class="pokemon-list-primary">${pokemonList}</div>
                    <div class="team-name-secondary">${team.name}</div>
                </td>
                <td class="score-cell">${team.score}</td>
            </tr>`;
    });

    woatHTML += `
            </tbody>
        </table>
    `;
    woatSection.innerHTML = woatHTML;

    goatWoatContainer.appendChild(goatSection);
    goatWoatContainer.appendChild(woatSection);

    // Add click handlers to navigate to the battle
    goatSection.querySelectorAll('.goat-woat-row').forEach(row => {
        row.addEventListener('click', () => scrollToBattle(parseInt(row.dataset.matchId)));
    });
    woatSection.querySelectorAll('.goat-woat-row').forEach(row => {
        row.addEventListener('click', () => scrollToBattle(parseInt(row.dataset.matchId)));
    });
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
        <div class="goat-woat-header">
            <div class="goat-woat-controls">
                <label for="goat-woat-limit" class="goat-woat-limit-label">Show top/bottom:</label>
                <select id="goat-woat-limit" class="goat-woat-limit-select">
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
            </div>
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
    document.getElementById('goat-woat-limit').addEventListener('change', updateGoatWoat);

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
