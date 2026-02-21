// ==================== Global State ====================
let isBattleConcluded = false;
let currentBattleAchievements = { team1: [], team2: [] };
let fullHistory = [];
let currentPage = 1;
let historyPageSize = 5;
let graphData = [];
let allPokemonNames = [];
let normalizedPokemonLookup = new Map();
let pokemonIdLookup = new Map(); // Maps lowercase name -> actual PokeAPI ID
let currentPasteTeamId = null;
let detectedPokemonNames = [];
let isProcessingPaste = false;
let goatWoatLimit = 3;
let celebrationTestMode = false; // Set to true to test the 100 wins celebration
let tesseractWorker = null; // Pre-loaded OCR worker
let ocrDebug = true; // Set to true to show OCR detection debug logs

const DEFAULT_PAGE_SIZE = 5;
const CENTURY_WINS_MILESTONE = 100;
const PLACEHOLDER_SPRITE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect fill='%23e0e0e0' width='96' height='96' rx='8'/%3E%3Ctext x='48' y='56' text-anchor='middle' font-size='40' fill='%23999'%3E%3F%3C/text%3E%3C/svg%3E";

// ==================== 100 Wins Celebration ====================
// Cookie rain celebration for reaching 100 wins

function createCelebrationOverlay() {
    const existing = document.getElementById('century-celebration');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'century-celebration';
    overlay.innerHTML = `
        <div class="century-content">
            <div class="century-fireworks"></div>
            <div class="century-text">
                <div class="century-emoji">🎉🏆🍪</div>
                <h1 class="century-title">CENTURY!</h1>
                <p class="century-subtitle"><span class="century-team-name"></span> has reached <strong>100 WINS!</strong></p>
                <p class="century-flavor">It's ButterBoy time! 🍪</p>
            </div>
            <button class="century-close">Continue</button>
        </div>
        <div class="cookie-rain-container"></div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.id = 'century-celebration-styles';
    style.textContent = `
        #century-celebration {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .century-content {
            text-align: center;
            z-index: 10001;
            position: relative;
        }
        .century-emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 0.6s ease infinite alternate;
        }
        @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-20px); }
        }
        .century-title {
            font-size: 5rem;
            color: #ffd700;
            text-shadow: 0 0 20px #ffd700, 0 0 40px #ff8c00, 0 0 60px #ff4500;
            margin: 0;
            animation: pulse 1s ease infinite;
            font-family: 'Arial Black', sans-serif;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .century-subtitle {
            font-size: 1.5rem;
            color: #fff;
            margin: 1rem 0;
        }
        .century-team-name {
            color: #ffd700;
            font-weight: bold;
            font-size: 1.8rem;
        }
        .century-flavor {
            font-size: 1.2rem;
            color: #ccc;
            margin: 0.5rem 0 2rem;
        }
        .century-close {
            padding: 1rem 3rem;
            font-size: 1.2rem;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            border: none;
            border-radius: 50px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .century-close:hover {
            transform: scale(1.1);
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
        }
        .cookie-rain-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 9999;
        }
        .falling-cookie {
            position: absolute;
            font-size: 2rem;
            animation: cookieFall linear forwards;
            z-index: 9999;
        }
        @keyframes cookieFall {
            0% {
                transform: translateY(-50px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(110vh) rotate(720deg);
                opacity: 0.8;
            }
        }
        .century-fireworks {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        }
        .firework {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: explode 1s ease-out forwards;
        }
        @keyframes explode {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(1) translate(var(--tx), var(--ty));
                opacity: 0;
            }
        }
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            animation: confettiFall linear forwards;
        }
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;

    if (!document.getElementById('century-celebration-styles')) {
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    return overlay;
}

function spawnCookies(container, count = 50) {
    const cookieEmojis = ['🍪', '🍪', '🍪', '🎂', '🧁', '🍰'];

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const cookie = document.createElement('div');
            cookie.className = 'falling-cookie';
            cookie.textContent = cookieEmojis[Math.floor(Math.random() * cookieEmojis.length)];
            cookie.style.left = Math.random() * 100 + '%';
            cookie.style.fontSize = (1.5 + Math.random() * 2) + 'rem';
            cookie.style.animationDuration = (3 + Math.random() * 4) + 's';
            cookie.style.animationDelay = '0s';
            container.appendChild(cookie);

            setTimeout(() => cookie.remove(), 8000);
        }, i * 100);
    }
}

function spawnConfetti(container, count = 100) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff8c00'];

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = (5 + Math.random() * 10) + 'px';
            confetti.style.height = (5 + Math.random() * 10) + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.animationDuration = (2 + Math.random() * 3) + 's';
            container.appendChild(confetti);

            setTimeout(() => confetti.remove(), 6000);
        }, i * 30);
    }
}

function spawnFireworks(container) {
    const colors = ['#ff0000', '#ffd700', '#00ff00', '#00bfff', '#ff00ff', '#ff8c00'];

    for (let burst = 0; burst < 5; burst++) {
        setTimeout(() => {
            const x = (Math.random() - 0.5) * 300;
            const y = (Math.random() - 0.5) * 200;

            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.left = `calc(50% + ${x}px)`;
                particle.style.top = `calc(50% + ${y}px)`;

                const angle = (i / 20) * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
                particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');

                container.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }
        }, burst * 500);
    }
}

function showCenturyCelebration(teamName) {
    const overlay = createCelebrationOverlay();
    const cookieContainer = overlay.querySelector('.cookie-rain-container');
    const fireworksContainer = overlay.querySelector('.century-fireworks');

    // Set the team name
    overlay.querySelector('.century-team-name').textContent = teamName;

    // Start the effects
    spawnCookies(cookieContainer, 60);
    spawnConfetti(cookieContainer, 80);
    spawnFireworks(fireworksContainer);

    // Continue spawning cookies periodically
    const cookieInterval = setInterval(() => {
        spawnCookies(cookieContainer, 20);
    }, 3000);

    // Close button
    overlay.querySelector('.century-close').addEventListener('click', () => {
        clearInterval(cookieInterval);
        overlay.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => overlay.remove(), 300);
    });

    // Also close on clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            clearInterval(cookieInterval);
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => overlay.remove(), 300);
        }
    });
}

// Check if any team just reached exactly 100 wins
function checkForCenturyMilestone(previousTally) {
    const currentTally = {};

    fullHistory.forEach(result => {
        if (result.winner === 'tie') return;
        const winnerName = result[result.winner].name;
        currentTally[winnerName] = (currentTally[winnerName] || 0) + 1;
    });

    // Find teams that just crossed 100
    for (const [teamName, wins] of Object.entries(currentTally)) {
        const previousWins = previousTally[teamName] || 0;
        if (wins >= CENTURY_WINS_MILESTONE && previousWins < CENTURY_WINS_MILESTONE) {
            // This team just hit 100!
            setTimeout(() => showCenturyCelebration(teamName), 500);
            return; // Only celebrate one at a time
        }
    }
}

// Get current win tally (for comparison before saving)
function getCurrentWinTally() {
    const tally = {};
    fullHistory.forEach(result => {
        if (result.winner === 'tie') return;
        const winnerName = result[result.winner].name;
        tally[winnerName] = (tally[winnerName] || 0) + 1;
    });
    return tally;
}

// Test function - call from browser console: testCenturyCelebration('Team Name')
function testCenturyCelebration(teamName = 'Test Team') {
    showCenturyCelebration(teamName);
}

// Enable test mode from console: enableCelebrationTestMode()
function enableCelebrationTestMode() {
    celebrationTestMode = true;
    console.log('🍪 Celebration test mode enabled! The next saved battle will trigger the century celebration.');
}

// ==================== Constants ====================
const STAT_MAPPINGS = {
    'hp': { short: 'HP', className: 'stat-hp' },
    'attack': { short: 'ATK', className: 'stat-attack' },
    'defense': { short: 'DEF', className: 'stat-defense' },
    'special-attack': { short: 'SP. ATK', className: 'stat-sp-atk' },
    'special-defense': { short: 'SP. DEF', className: 'stat-sp-def' },
    'speed': { short: 'SPE', className: 'stat-speed' }
};

// ==================== DOM Helper Functions ====================
// Centralized DOM access to reduce selector duplication

function getTeamElement(teamId) {
    return document.getElementById(teamId);
}

function getTeamGrid(teamId) {
    return document.getElementById(`${teamId}-grid`);
}

function getTeamScoreElement(teamId) {
    return document.getElementById(`${teamId}-score`);
}

function getTeamNameElement(teamId) {
    return document.querySelector(`#${teamId} .team-name`);
}

function getWinnerTextElement(teamId) {
    return document.querySelector(`#${teamId} .winner-text`);
}

function getSaveButton() {
    return document.getElementById('save-results-btn');
}

// ==================== Popup Utilities ====================
// Creates a popup with standard behavior (close button, click outside to close)
function createPopup(id, className, content) {
    const existingPopup = document.getElementById(id);
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = id;
    popup.className = className;
    popup.innerHTML = content;
    document.body.appendChild(popup);

    // Show with animation
    setTimeout(() => popup.classList.add('show'), 10);

    return popup;
}

function setupPopupCloseHandlers(popup, closeButtonSelector) {
    const closePopup = () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    };

    popup.querySelector(closeButtonSelector)?.addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
        if (e.target === popup) closePopup();
    });

    return closePopup;
}

// Removes duplicate achievements by ID
function deduplicateAchievements(achievements) {
    return achievements.filter((achievement, index, self) =>
        index === self.findIndex(a => a.id === achievement.id)
    );
}

// Resets the winner/tie state for both teams
function resetBattleState() {
    const team1 = getTeamElement('team1');
    const team2 = getTeamElement('team2');

    team1.classList.remove('winner', 'tie');
    team2.classList.remove('winner', 'tie');
    getWinnerTextElement('team1').textContent = '';
    getWinnerTextElement('team2').textContent = '';

    const saveBtn = getSaveButton();
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
    isBattleConcluded = false;
}

// Comprehensive Pokemon name variants map
// Maps common alternative spellings/formats to PokeAPI format
// Sourced from: https://github.com/jakobhoeg/vscode-pokemon
const POKEMON_NAME_VARIANTS = {
    // Nidoran variants
    'nidoran_female': 'nidoran-f',
    'nidoran_male': 'nidoran-m',
    'nidoran-female': 'nidoran-f',
    'nidoran-male': 'nidoran-m',
    'nidoranf': 'nidoran-f',
    'nidoranm': 'nidoran-m',
    'nidoran♀': 'nidoran-f',
    'nidoran♂': 'nidoran-m',
    // Mr. Mime variants
    'mrmime': 'mr-mime',
    'mr_mime': 'mr-mime',
    'mr.mime': 'mr-mime',
    // Farfetch'd variants
    'farfetchd': 'farfetchd',
    "farfetch'd": 'farfetchd',
    // Ho-Oh variants
    'hooh': 'ho-oh',
    // Mime Jr. variants
    'mimejr': 'mime-jr',
    'mime_jr': 'mime-jr',
    'mime.jr': 'mime-jr',
    // Type: Null variants
    'typenull': 'type-null',
    'type_null': 'type-null',
    'type:null': 'type-null',
    // Tapu variants
    'tapukoko': 'tapu-koko',
    'tapu_koko': 'tapu-koko',
    'tapulele': 'tapu-lele',
    'tapu_lele': 'tapu-lele',
    'tapubulu': 'tapu-bulu',
    'tapu_bulu': 'tapu-bulu',
    'tapufini': 'tapu-fini',
    'tapu_fini': 'tapu-fini',
    // Porygon variants
    'porygon2': 'porygon2',
    'porygon-2': 'porygon2',
    'porygon_2': 'porygon2',
    'porygonz': 'porygon-z',
    'porygon_z': 'porygon-z',
    // Deoxys forms (base "deoxys" handled by base-form fallback in findClosestPokemonName)
    'deoxys_normal': 'deoxys-normal',
    'deoxys_attack': 'deoxys-attack',
    'deoxys_defense': 'deoxys-defense',
    'deoxys_speed': 'deoxys-speed',
    'deoxysnormal': 'deoxys-normal',
    'deoxysattack': 'deoxys-attack',
    'deoxysdefense': 'deoxys-defense',
    'deoxysspeed': 'deoxys-speed',
    // OCR error corrections (l/i confusion, missing letters)
    'biastoise': 'blastoise',
    'biastoie': 'blastoise',
    'biastolse': 'blastoise',
    'otad': 'lotad',
    'iotad': 'lotad',
    'iapras': 'lapras',
    'edicott': 'ledian',
    'edian': 'ledian',
    'edyba': 'ledyba',
    'udicolo': 'ludicolo',
    'iudicolo': 'ludicolo',
    'ombre': 'lombre',
    'iombre': 'lombre',
    'ucario': 'lucario',
    'iucario': 'lucario',
    'ugia': 'lugia',
    'iugia': 'lugia',
    'uxray': 'luxray',
    'iuxray': 'luxray',
    'uxio': 'luxio',
    'iuxio': 'luxio',
    'opunny': 'lopunny',
    'iopunny': 'lopunny',
    'anturn': 'lanturn',
    'ianturn': 'lanturn',
    'arvitar': 'larvitar',
    'iarvitar': 'larvitar',
    // Unown variants (all map to base unown for PokeAPI)
    'unown_a': 'unown', 'unown_b': 'unown', 'unown_c': 'unown', 'unown_d': 'unown',
    'unown_e': 'unown', 'unown_f': 'unown', 'unown_g': 'unown', 'unown_h': 'unown',
    'unown_i': 'unown', 'unown_j': 'unown', 'unown_k': 'unown', 'unown_l': 'unown',
    'unown_m': 'unown', 'unown_n': 'unown', 'unown_o': 'unown', 'unown_p': 'unown',
    'unown_q': 'unown', 'unown_r': 'unown', 'unown_s': 'unown', 'unown_t': 'unown',
    'unown_u': 'unown', 'unown_v': 'unown', 'unown_w': 'unown', 'unown_x': 'unown',
    'unown_y': 'unown', 'unown_z': 'unown', 'unown_exclamation': 'unown', 'unown_question': 'unown',
    // Flabébé variants
    'flabebe': 'flabebe',
    'flabébé': 'flabebe',
    // Kommo-o variants
    'kommoo': 'kommo-o',
    'kommo_o': 'kommo-o',
    // Jangmo-o variants
    'jangmoo': 'jangmo-o',
    'jangmo_o': 'jangmo-o',
    // Hakamo-o variants
    'hakamoo': 'hakamo-o',
    'hakamo_o': 'hakamo-o',
    // Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu variants
    'wochien': 'wo-chien',
    'wo_chien': 'wo-chien',
    'chienpao': 'chien-pao',
    'chien_pao': 'chien-pao',
    'tinglu': 'ting-lu',
    'ting_lu': 'ting-lu',
    'chiyu': 'chi-yu',
    'chi_yu': 'chi-yu',
    // Nidoran display names that might appear
    'nidoran (female)': 'nidoran-f',
    'nidoran (male)': 'nidoran-m',
};

// Helper function to check if a Pokemon is legendary (handles formes like deoxys-speed)
function isLegendary(pokemonName) {
    const lower = pokemonName.toLowerCase();
    // Direct match
    if (pokemonCategories.legendaries.includes(lower)) return true;
    // Check if base name (before hyphen) is legendary
    const baseName = lower.split('-')[0];
    return pokemonCategories.legendaries.includes(baseName);
}

// Easter Egg Pokemon Categories
const pokemonCategories = {
    legendaries: [
        // Gen 1
        'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
        // Gen 2
        'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'celebi',
        // Gen 3
        'regirock', 'regice', 'registeel', 'latias', 'latios',
        'kyogre', 'kyogre-primal', 'groudon', 'groudon-primal', 'rayquaza', 'rayquaza-mega', 'jirachi',
        'deoxys', 'deoxys-normal', 'deoxys-attack', 'deoxys-defense', 'deoxys-speed',
        // Gen 4
        'uxie', 'mesprit', 'azelf', 'dialga', 'dialga-origin', 'palkia', 'palkia-origin', 'heatran',
        'regigigas', 'giratina', 'giratina-altered', 'giratina-origin',
        'cresselia', 'phione', 'manaphy', 'darkrai',
        'shaymin', 'shaymin-land', 'shaymin-sky', 'arceus',
        // Gen 5
        'victini', 'cobalion', 'terrakion', 'virizion',
        'tornadus', 'tornadus-incarnate', 'tornadus-therian',
        'thundurus', 'thundurus-incarnate', 'thundurus-therian',
        'reshiram', 'zekrom',
        'landorus', 'landorus-incarnate', 'landorus-therian',
        'kyurem', 'kyurem-black', 'kyurem-white',
        'keldeo', 'keldeo-ordinary', 'keldeo-resolute',
        'meloetta', 'meloetta-aria', 'meloetta-pirouette', 'genesect',
        // Gen 6
        'xerneas', 'yveltal', 'zygarde', 'zygarde-10', 'zygarde-50', 'zygarde-complete',
        'diancie', 'hoopa', 'hoopa-unbound', 'volcanion',
        // Gen 7
        'tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini', 'cosmog', 'cosmoem',
        'solgaleo', 'lunala', 'nihilego', 'buzzwole', 'pheromosa', 'xurkitree',
        'celesteela', 'kartana', 'guzzlord',
        'necrozma', 'necrozma-dusk', 'necrozma-dawn', 'necrozma-ultra',
        'magearna', 'marshadow', 'poipole', 'naganadel', 'stakataka', 'blacephalon', 'zeraora',
        // Gen 8
        'zacian', 'zacian-crowned', 'zamazenta', 'zamazenta-crowned', 'eternatus', 'eternatus-eternamax',
        'kubfu', 'urshifu', 'urshifu-single-strike', 'urshifu-rapid-strike', 'zarude',
        'regieleki', 'regidrago', 'glastrier', 'spectrier',
        'calyrex', 'calyrex-ice', 'calyrex-shadow',
        // Gen 9
        'koraidon', 'miraidon', 'wo-chien', 'chien-pao', 'ting-lu', 'chi-yu',
        'ogerpon', 'ogerpon-wellspring', 'ogerpon-hearthflame', 'ogerpon-cornerstone',
        'terapagos', 'terapagos-terastal', 'terapagos-stellar', 'pecharunt'
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
            const count = team.pokemon.filter(p => isLegendary(p.name)).length;
            return count === 1;
        }
    },
    {
        id: 'mythical-assembly',
        title: 'Mythical Assembly',
        emoji: '🌟',
        description: 'Two legendary Pokémon unite!',
        check: (team) => {
            const count = team.pokemon.filter(p => isLegendary(p.name)).length;
            return count === 2;
        }
    },
    {
        id: 'pantheon',
        title: 'Pantheon',
        emoji: '👑',
        description: 'Three or more legendaries assembled!',
        check: (team) => {
            const count = team.pokemon.filter(p => isLegendary(p.name)).length;
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
        description: 'Won with 2+ sub-250 stat Pokémon!',
        check: (team, isWinner) => {
            if (!isWinner) return false;
            const count = team.pokemon.filter(p => p.score < 250).length;
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
    // Battle result achievements
    {
        id: 'stalemate',
        title: 'Stalemate',
        emoji: '🤝',
        description: 'The battle ended in a tie!',
        check: (team, isWinner, isTie) => isTie
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
        id: 'not-again-unown',
        title: 'Not Again...',
        emoji: '😩',
        description: 'An Unown appeared. Of course it did.',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            return pokemon.some(p => p === 'unown' || p.startsWith('unown-'));
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

// Detect achievements for a team
function detectAchievements(teamData, isWinner, isTie = false) {
    const earned = [];

    for (const achievement of achievements) {
        if (achievement.check(teamData, isWinner, isTie)) {
            const triggeringPokemon = findTriggeringPokemon(achievement.id, teamData);
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

// Maps achievement IDs to their triggering Pokemon filter criteria
const ACHIEVEMENT_TRIGGER_MAP = {
    'legendary-encounter': p => isLegendary(p.name),
    'mythical-assembly': p => isLegendary(p.name),
    'pantheon': p => isLegendary(p.name),
    'bird-keeper': p => pokemonCategories.legendaryBirds.includes(p.name.toLowerCase()),
    'tower-guardians': p => pokemonCategories.towerDuo.includes(p.name.toLowerCase()),
    'genetic-experiment': p => pokemonCategories.mewtwoMew.includes(p.name.toLowerCase()),
    'thats-right': p => pokemonCategories.teamRocketMeowth.includes(p.name.toLowerCase()),
    'prepare-for-trouble': p => pokemonCategories.teamRocketOther.includes(p.name.toLowerCase()),
    'mighty-sunkern': p => p.name.toLowerCase() === 'sunkern',
    'splash': p => p.name.toLowerCase() === 'magikarp',
    'magikarp-miracle': p => p.name.toLowerCase() === 'magikarp',
    'underdog-victory': p => p.score < 250,
    'baby-boom': p => pokemonCategories.threeStageFirstEvolutions.includes(p.name.toLowerCase()),
    'final-form': p => pokemonCategories.finalEvolutions.includes(p.name.toLowerCase()),
    'eeveelution-squad': p => pokemonCategories.eeveelutions.includes(p.name.toLowerCase()),
    'i-choose-you': p => p.name.toLowerCase() === 'pikachu',
    'pika-family': p => pokemonCategories.pikachuFamily.includes(p.name.toLowerCase()),
    'kanto-starters': p => pokemonCategories.kantoStarters.includes(p.name.toLowerCase()),
    'fossil-revival': p => pokemonCategories.fossils.includes(p.name.toLowerCase()),
    'dynamic-duo': p => pokemonCategories.plusleminun.includes(p.name.toLowerCase()),
    'not-again-unown': p => p.name.toLowerCase() === 'unown' || p.name.toLowerCase().startsWith('unown-'),
    'dragon-tamer': p => pokemonCategories.dragons.includes(p.name.toLowerCase()),
    'ditto-identity-crisis': p => p.name.toLowerCase() === 'ditto',
    'slowpoke-mode': p => pokemonCategories.slowpokes.includes(p.name.toLowerCase()),
    'pretty-in-pink': p => pokemonCategories.pinkPokemon.includes(p.name.toLowerCase())
};

// Find which Pokemon triggered a specific achievement
function findTriggeringPokemon(achievementId, teamData) {
    const filterFn = ACHIEVEMENT_TRIGGER_MAP[achievementId];
    if (!filterFn) return [];
    return teamData.pokemon.filter(filterFn);
}

// Show single achievement detail popup (for history badge clicks)
function showAchievementDetailPopup(achievement) {
    const criteria = getAchievementCriteria(achievement.id);
    const content = `
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

    const popup = createPopup('achievement-detail-popup', 'achievement-detail-popup', content);
    setupPopupCloseHandlers(popup, '.achievement-detail-close');
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
        'underdog-victory': 'You won with two or more sub-250 stat Pokémon.',
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
        'legendary-standoff': 'The same legendary Pokémon appears on both teams.',
        'not-again-unown': 'An Unown is in your team.',
        'stalemate': 'Both teams have the same total score.',
        'goat-contender': 'Your team made the GOAT top 10!',
        'goat-elite': 'Your team made the GOAT top 3!',
        'goat-champion': 'Your team is the #1 GOAT!',
        'woat-contender': 'Your team made the WOAT bottom 10...',
        'woat-elite': 'Your team made the WOAT bottom 3...',
        'woat-champion': 'Your team is the #1 WOAT...'
    };
    return criteriaMap[achievementId] || 'Special achievement unlocked.';
}

// Show achievement popup
function showAchievementPopup(allAchievements) {
    if (allAchievements.length === 0) return;

    const achievementItems = allAchievements.map(a => {
        const sprites = (a.triggeringPokemon || []).map(p => {
            const spriteUrl = p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonIdByName(p.name)}.png`;
            return `<img src="${spriteUrl}" alt="${p.name}" title="${p.name}" class="achievement-pokemon-sprite" onerror="this.src='${PLACEHOLDER_SPRITE}';this.onerror=null">`;
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

    const content = `
        <div class="achievement-popup-content">
            <button class="achievement-popup-close">&times;</button>
            <h3>Achievements Unlocked!</h3>
            <div class="achievement-popup-list">
                ${achievementItems}
            </div>
        </div>
    `;

    const popup = createPopup('achievement-popup', 'achievement-popup', content);
    setupPopupCloseHandlers(popup, '.achievement-popup-close');
}

// Helper to get Pokemon ID by name for sprite URLs
function getPokemonIdByName(name) {
    return pokemonIdLookup.get(name.toLowerCase()) || 1;
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
        const commonLegendaries = commonPokemon.filter(p => isLegendary(p.name));

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

// Detect GOAT/WOAT ranking achievements for both teams
function detectGoatWoatAchievements(team1Data, team2Data, existingHistory) {
    const result = { team1: [], team2: [] };

    // Build all historical team scores including the new battle
    const allScores = [];
    existingHistory.forEach(h => {
        allScores.push(parseInt(h.team1.score));
        allScores.push(parseInt(h.team2.score));
    });
    const team1Score = parseInt(team1Data.score);
    const team2Score = parseInt(team2Data.score);
    allScores.push(team1Score, team2Score);

    // Sort descending for GOAT ranking
    const sortedDesc = [...allScores].sort((a, b) => b - a);
    // Sort ascending for WOAT ranking
    const sortedAsc = [...allScores].sort((a, b) => a - b);

    // Need enough history for rankings to be meaningful (at least 10 teams = 5 battles)
    if (allScores.length < 10) return result;

    for (const [teamId, teamData, score] of [['team1', team1Data, team1Score], ['team2', team2Data, team2Score]]) {
        // GOAT ranking (where does this score sit among highest?)
        const goatRank = sortedDesc.indexOf(score) + 1;
        // WOAT ranking (where does this score sit among lowest?)
        const woatRank = sortedAsc.indexOf(score) + 1;

        if (goatRank === 1) {
            result[teamId].push({
                id: 'goat-champion',
                title: 'GOAT Champion!',
                emoji: '🐐👑',
                description: `${teamData.name} is the #1 Greatest of All Time!`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (goatRank <= 3) {
            result[teamId].push({
                id: 'goat-elite',
                title: 'GOAT Elite',
                emoji: '🐐🏅',
                description: `${teamData.name} ranked #${goatRank} all time!`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (goatRank <= 10) {
            result[teamId].push({
                id: 'goat-contender',
                title: 'GOAT Contender',
                emoji: '🐐',
                description: `${teamData.name} cracked the GOAT top 10!`,
                triggeringPokemon: teamData.pokemon
            });
        }

        if (woatRank === 1) {
            result[teamId].push({
                id: 'woat-champion',
                title: 'WOAT Champion...',
                emoji: '🗑️👑',
                description: `${teamData.name} is the #1 Worst of All Time...`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (woatRank <= 3) {
            result[teamId].push({
                id: 'woat-elite',
                title: 'WOAT Elite',
                emoji: '🗑️🏅',
                description: `${teamData.name} ranked bottom ${woatRank} all time...`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (woatRank <= 10) {
            result[teamId].push({
                id: 'woat-contender',
                title: 'WOAT Contender',
                emoji: '🗑️',
                description: `${teamData.name} sank to the WOAT bottom 10...`,
                triggeringPokemon: teamData.pokemon
            });
        }
    }

    return result;
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

        // underdog-victory supersedes single sub-250 Pokemon achievements
        // (Magikarp: 200, Sunkern: 180)
        if (a.id === 'splash' && hasUnderdogVictory) {
            return false;
        }
        if (a.id === 'mighty-sunkern' && hasUnderdogVictory) {
            return false;
        }

        // pika-family supersedes i-choose-you
        if (a.id === 'i-choose-you' && hasPikaFamily) {
            return false;
        }

        // GOAT tiers: champion > elite > contender
        const hasGoatChampion = ids.includes('goat-champion');
        const hasGoatElite = ids.includes('goat-elite');
        if (a.id === 'goat-contender' && (hasGoatElite || hasGoatChampion)) return false;
        if (a.id === 'goat-elite' && hasGoatChampion) return false;

        // WOAT tiers: champion > elite > contender
        const hasWoatChampion = ids.includes('woat-champion');
        const hasWoatElite = ids.includes('woat-elite');
        if (a.id === 'woat-contender' && (hasWoatElite || hasWoatChampion)) return false;
        if (a.id === 'woat-elite' && hasWoatChampion) return false;

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
        if (STAT_MAPPINGS[statName]) {
            processedStats.push({
                name: STAT_MAPPINGS[statName].short,
                value: statValue,
                className: STAT_MAPPINGS[statName].className
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

function getTeamPokemonNames(teamId) {
    const grid = getTeamGrid(teamId);
    return Array.from(grid.children).map(card =>
        card.querySelector('.pokemon-name').textContent.toLowerCase()
    );
}

async function addPokemon(teamId) {
    const teamGrid = getTeamGrid(teamId);
    if (teamGrid.children.length >= 6) return;

    const existingNames = getTeamPokemonNames(teamId);
    let pokemon;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    do {
        const id = Math.floor(Math.random() * 251) + 1;
        pokemon = await fetchPokemon(id);
        attempts++;
    } while (existingNames.includes(pokemon.name.toLowerCase()) && attempts < MAX_ATTEMPTS);

    generatePokemonCard(pokemon, teamId);
}

function setTeamControlsState(teamId, disabled) {
    const teamContainer = getTeamElement(teamId);
    if (!teamContainer) return;

    const controls = [
        `#${teamId}-btn`,
        '.randomise-btn',
        '.paste-team-btn',
        '.poke-input'
    ];

    controls.forEach(selector => {
        const element = teamContainer.querySelector(selector);
        if (element) element.disabled = disabled;
    });
}

function generatePokemonCard(pokemon, teamId) {
    const teamGrid = getTeamGrid(teamId);
    const teamScore = getTeamScoreElement(teamId);

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
    const teamScoreEl = getTeamScoreElement(teamId);
    const pokemonStats = parseInt(card.dataset.totalStats, 10);

    teamScoreEl.textContent = parseInt(teamScoreEl.textContent, 10) - pokemonStats;
    card.remove();
    setTeamControlsState(teamId, false);
    resetBattleState();
}

function clearTeam(teamId) {
    const teamGrid = getTeamGrid(teamId);
    const teamScoreEl = getTeamScoreElement(teamId);

    teamGrid.innerHTML = '';
    teamScoreEl.textContent = '0';
    setTeamControlsState(teamId, false);
    resetBattleState();
}

async function randomiseTeam(teamId) {
    clearTeam(teamId);

    // Disable controls while the team is being generated
    setTeamControlsState(teamId, true);

    try {
        // Generate 6 unique random IDs
        const usedIds = new Set();
        while (usedIds.size < 6) {
            usedIds.add(Math.floor(Math.random() * 251) + 1);
        }

        const promises = Array.from(usedIds).map(id => fetchPokemon(id));
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

function openPasteModal(teamId) {
    createPasteModal();
    clearAllSuggestions(); // Close any open search dropdowns
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
        // Preprocess image for better OCR accuracy
        statusEl.textContent = 'Processing image...';
        const processedBlob = await preprocessForOCR(imageBlob);

        // Run OCR using pre-loaded worker (falls back to creating one if not ready)
        statusEl.textContent = 'Reading image...';
        let text;
        if (tesseractWorker) {
            const { data } = await tesseractWorker.recognize(processedBlob);
            text = data.text;
        } else {
            statusEl.textContent = 'Initializing OCR...';
            await initTesseractWorker();
            const { data } = await tesseractWorker.recognize(processedBlob);
            text = data.text;
        }

        if (ocrDebug) {
            console.log('=== OCR DEBUG: Raw text from Tesseract ===');
            console.log(text);
            console.log('=== End raw text ===');
        }

        // Parse Pokemon names
        detectedPokemonNames = parsePokemonFromOCR(text);

        if (detectedPokemonNames.length === 0) {
            statusEl.textContent = 'No Pokémon detected. Try a different screenshot.';
            document.getElementById('paste-confirm-btn').disabled = true;
            isProcessingPaste = false;
            return;
        }

        statusEl.textContent = `Found ${detectedPokemonNames.length} Pokémon:`;

        // Show detected Pokemon with sprites (using direct URL, no API calls)
        pokemonListEl.innerHTML = '';
        for (const name of detectedPokemonNames) {
            const item = document.createElement('div');
            item.className = 'paste-pokemon-item';
            const pokedexNum = getPokemonIdByName(name);
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexNum}.png`;
            item.innerHTML = `
                <img src="${spriteUrl}" alt="${name}" class="paste-pokemon-sprite" onerror="this.src='${PLACEHOLDER_SPRITE}';this.onerror=null" />
                <span>${name}</span>
            `;
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

        // Re-enable controls if team has fewer than 6 Pokemon
        const teamGrid = document.querySelector(`#${teamId} .pokemon-grid`);
        if (teamGrid.children.length < 6) {
            setTeamControlsState(teamId, false);
        }
    } catch (error) {
        console.error('Failed to load Pokemon:', error);
        alert('Failed to load some Pokémon. Please try again.');
        setTeamControlsState(teamId, false);
    }
}

// Pokemon name matching - exact matches first, then Levenshtein fuzzy fallback
function findClosestPokemonName(name) {
    if (!name || typeof name !== 'string') return null;

    // Clean the input: remove non-alphanumeric chars except hyphen/underscore, then normalize
    const cleaned = name.replace(/[^a-zA-Z0-9\-_]/g, '').toLowerCase().trim();
    if (cleaned.length === 0) return null;

    // 1. Check variant mappings first (handles special cases like nidoran, mr-mime, etc.)
    if (POKEMON_NAME_VARIANTS[cleaned]) {
        const mapped = POKEMON_NAME_VARIANTS[cleaned];
        if (ocrDebug) console.log(`    [match] variant map: "${cleaned}" -> "${mapped}"`);
        // Try Map first, then fall back to array search
        if (normalizedPokemonLookup.has(mapped)) {
            return normalizedPokemonLookup.get(mapped);
        }
        const arrayMatch = allPokemonNames.find(n => n.toLowerCase() === mapped);
        if (arrayMatch) return arrayMatch;
    }

    // 2. Direct lookup in normalized map (with array fallback)
    if (normalizedPokemonLookup.has(cleaned)) {
        if (ocrDebug) console.log(`    [match] direct lookup: "${cleaned}"`);
        return normalizedPokemonLookup.get(cleaned);
    }
    let arrayMatch = allPokemonNames.find(n => n.toLowerCase() === cleaned);
    if (arrayMatch) return arrayMatch;

    // 3. Try with underscores replaced by hyphens
    const hyphenated = cleaned.replace(/_/g, '-');
    if (normalizedPokemonLookup.has(hyphenated)) {
        if (ocrDebug) console.log(`    [match] hyphenated: "${cleaned}" -> "${hyphenated}"`);
        return normalizedPokemonLookup.get(hyphenated);
    }
    arrayMatch = allPokemonNames.find(n => n.toLowerCase() === hyphenated);
    if (arrayMatch) return arrayMatch;

    // 4. Try stripped version (no hyphens, underscores)
    const stripped = cleaned.replace(/[-_]/g, '');
    for (const pokemonName of allPokemonNames) {
        if (pokemonName.toLowerCase().replace(/[-_]/g, '') === stripped) {
            if (ocrDebug) console.log(`    [match] stripped: "${cleaned}" -> "${stripped}" = ${pokemonName}`);
            return pokemonName;
        }
    }

    // 5. Base form match: "wormadam" -> "wormadam-plant", "giratina" -> "giratina-altered", etc.
    for (const pokemonName of allPokemonNames) {
        const pokeLower = pokemonName.toLowerCase();
        if (pokeLower.startsWith(cleaned + '-')) {
            if (ocrDebug) console.log(`    [match] base form: "${cleaned}" -> "${pokemonName}"`);
            return pokemonName;
        }
    }

    // 6. Fuzzy match using Levenshtein distance (catches OCR errors like "beedril" -> "beedrill")
    if (cleaned.length >= 3) {
        let bestMatch = null;
        let bestDist = Infinity;
        const maxDist = cleaned.length <= 5 ? 1 : 2; // Stricter for short names
        for (const pokemonName of allPokemonNames) {
            const pokeLower = pokemonName.toLowerCase();
            // Skip if length difference alone exceeds max distance
            if (Math.abs(pokeLower.length - cleaned.length) > maxDist) continue;
            const d = levenshtein(cleaned, pokeLower);
            if (d < bestDist) {
                bestDist = d;
                bestMatch = pokemonName;
            }
            if (d === 1) break; // Can't do better than distance 1
        }
        if (bestMatch && bestDist <= maxDist) {
            if (ocrDebug) console.log(`    [match] fuzzy (distance ${bestDist}): "${cleaned}" -> "${bestMatch}"`);
            return bestMatch;
        }
    }

    // No match found
    if (ocrDebug) console.log(`    [no match] "${name}" (cleaned: "${cleaned}")`);
    return null;
}

function parsePokemonFromOCR(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const foundPokemon = [];

    if (ocrDebug) console.log(`=== OCR DEBUG: Parsing ${lines.length} lines ===`);

    for (const line of lines) {
        const words = line.split(/\s+/);

        if (ocrDebug) console.log(`  Line: "${line}" | Words: [${words.map(w => `"${w}"`).join(', ')}]`);

        // Try multi-word combinations first (e.g., "deoxys defense" -> "deoxys-defense")
        let matchFound = null;
        for (let i = 0; i < words.length && !matchFound; i++) {
            // Try 3-word, 2-word, then 1-word combos starting at position i
            for (let len = Math.min(3, words.length - i); len >= 1; len--) {
                const combined = words.slice(i, i + len).join('-').toLowerCase();
                if (combined) {
                    const match = findClosestPokemonName(combined);
                    if (match) {
                        if (ocrDebug && len > 1) console.log(`    [multi-word] "${words.slice(i, i + len).join(' ')}" -> "${combined}"`);
                        matchFound = match;
                        break;
                    }
                }
            }
        }

        if (matchFound) {
            if (ocrDebug) console.log(`  -> MATCHED: ${matchFound}`);
            foundPokemon.push(matchFound);
            if (foundPokemon.length >= 6) break;
        } else {
            if (ocrDebug) console.log(`  -> NO MATCH on this line`);
        }
    }

    if (ocrDebug) console.log(`=== OCR DEBUG: Found ${foundPokemon.length} Pokemon: [${foundPokemon.join(', ')}] ===`);
    return foundPokemon;
}

function checkForWinner() {
    const team1Full = getTeamGrid('team1').children.length === 6;
    const team2Full = getTeamGrid('team2').children.length === 6;

    if (team1Full && team2Full) {
        setTimeout(determineWinner, 250);
    }
}

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

    // A short delay for suspense before showing the result
    await new Promise(resolve => setTimeout(resolve, 500));

    let team1IsWinner = false;
    let team2IsWinner = false;

    if (team1Score > team2Score) {
        team1.classList.add('winner');
        team1Text.textContent = 'Winner!';
        team1IsWinner = true;
    } else if (team2Score > team1Score) {
        team2.classList.add('winner');
        team2Text.textContent = 'Winner!';
        team2IsWinner = true;
    } else {
        team1.classList.add('tie');
        team2.classList.add('tie');
        team1Text.textContent = 'Tie!';
        team2Text.textContent = 'Tie!';
    }

    // Detect and display achievements
    const team1Data = getTeamData('team1');
    const team2Data = getTeamData('team2');
    const isTie = !team1IsWinner && !team2IsWinner;
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

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Battle History Logic ---

function getTeamData(teamId) {
    const name = getTeamNameElement(teamId).textContent;
    const score = getTeamScoreElement(teamId).textContent;
    const pokemonGrid = getTeamGrid(teamId);
    const pokemon = Array.from(pokemonGrid.children).map(card => ({
        name: card.querySelector('.pokemon-name').textContent,
        score: parseInt(card.dataset.totalStats, 10),
        sprite: card.querySelector('.pokemon-sprite')?.src || null
    }));
    return { name, score, pokemon };
}

async function saveCurrentBattle() {
    if (!isBattleConcluded) return;

    // Hide any existing streak achievement notification
    hideStreakAchievement();

    // Capture current win tally BEFORE saving (for milestone detection)
    const previousTally = getCurrentWinTally();

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

    // Detect GOAT/WOAT achievements (needs full history including this battle)
    const historyBeforeSave = JSON.parse(localStorage.getItem('battleHistory')) || [];
    const goatWoatAchievements = detectGoatWoatAchievements(team1Data, team2Data, historyBeforeSave);

    const result = {
        id: Date.now(),
        team1: team1Data,
        team2: team2Data,
        winner: winner,
        date: new Date().toISOString(),
        achievements: {
            team1: [...currentBattleAchievements.team1, ...goatWoatAchievements.team1],
            team2: [...currentBattleAchievements.team2, ...goatWoatAchievements.team2],
            crossTeam: crossTeamAchievements
        }
    };

    // Show GOAT/WOAT achievements if any were earned
    const allGoatWoat = [...goatWoatAchievements.team1, ...goatWoatAchievements.team2];
    if (allGoatWoat.length > 0) {
        const uniqueGoatWoat = filterTieredAchievements(deduplicateAchievements(allGoatWoat));
        if (uniqueGoatWoat.length > 0) {
            setTimeout(() => showAchievementPopup(uniqueGoatWoat), 600);
        }
    }

    // Reset achievements for next battle
    currentBattleAchievements = { team1: [], team2: [] };

    const history = historyBeforeSave;
    history.push(result);
    localStorage.setItem('battleHistory', JSON.stringify(history));

    loadHistory(true); // Reload to show the new entry and check for streak breaks

    // Check for century milestone (100 wins)
    if (celebrationTestMode) {
        // Test mode: trigger celebration for the winning team
        celebrationTestMode = false;
        const winnerName = winner !== 'tie' ? result[winner].name : team1Data.name;
        setTimeout(() => showCenturyCelebration(winnerName), 500);
    } else {
        checkForCenturyMilestone(previousTally);
    }

    getSaveButton().disabled = true;
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
        historyAchievements = filterTieredAchievements(
            deduplicateAchievements(allAchievements)
        );
        if (historyAchievements.length > 0) {
            const badges = historyAchievements.map((a, idx) =>
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
    getTeamNameElement('team1').textContent = result.team1.name;
    getTeamNameElement('team2').textContent = result.team2.name;

    clearTeam('team1');
    clearTeam('team2');
    setTeamControlsState('team1', true);
    setTeamControlsState('team2', true);

    const resetHint = () => {
        if (!hintElement) return;
        hintElement.textContent = 'Click to Load Battle';
        hintElement.classList.remove('loaded');
        hintElement.style.opacity = '';
    };

    try {
        const team1Promises = result.team1.pokemon.map(p => fetchPokemon(p.name.toLowerCase()));
        const team2Promises = result.team2.pokemon.map(p => fetchPokemon(p.name.toLowerCase()));

        const [team1Pokemon, team2Pokemon] = await Promise.all([
            Promise.all(team1Promises),
            Promise.all(team2Promises)
        ]);

        team1Pokemon.forEach(pokemon => generatePokemonCard(pokemon, 'team1'));
        team2Pokemon.forEach(pokemon => generatePokemonCard(pokemon, 'team2'));

        if (hintElement) {
            hintElement.textContent = 'Battle Loaded!';
            setTimeout(resetHint, 2000);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Failed to load battle from history:', error);
        alert('Failed to load some Pokemon. The battle data may be corrupted.');
        setTeamControlsState('team1', false);
        setTeamControlsState('team2', false);
        resetHint();
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

function createPaginationEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'pagination-ellipsis';
    return ellipsis;
}

function createNavButton(text, disabled, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'pagination-btn';
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
}

function calculatePageRange(totalPages, currentPage, maxPagesToShow) {
    if (totalPages <= maxPagesToShow) {
        return { startPage: 1, endPage: totalPages };
    }

    const maxBefore = Math.floor(maxPagesToShow / 2);
    const maxAfter = Math.ceil(maxPagesToShow / 2) - 1;

    if (currentPage <= maxBefore) {
        return { startPage: 1, endPage: maxPagesToShow };
    }
    if (currentPage + maxAfter >= totalPages) {
        return { startPage: totalPages - maxPagesToShow + 1, endPage: totalPages };
    }
    return { startPage: currentPage - maxBefore, endPage: currentPage + maxAfter };
}

function renderPaginationControls() {
    const controlsContainer = document.getElementById('pagination-controls');
    controlsContainer.innerHTML = '';
    const totalPages = Math.ceil(fullHistory.length / historyPageSize);

    if (totalPages <= 1) return;

    const MAX_PAGES_TO_SHOW = 5;
    const { startPage, endPage } = calculatePageRange(totalPages, currentPage, MAX_PAGES_TO_SHOW);

    // Previous Button
    controlsContainer.appendChild(createNavButton('Previous', currentPage === 1, () => {
        if (currentPage > 1) {
            currentPage--;
            renderHistoryWithPagination();
        }
    }));

    // Page Numbers
    const pageNumbersContainer = document.createElement('div');
    pageNumbersContainer.className = 'page-numbers';

    if (startPage > 1) {
        pageNumbersContainer.appendChild(createPageButton(1));
        if (startPage > 2) {
            pageNumbersContainer.appendChild(createPaginationEllipsis());
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbersContainer.appendChild(createPageButton(i));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbersContainer.appendChild(createPaginationEllipsis());
        }
        pageNumbersContainer.appendChild(createPageButton(totalPages));
    }

    controlsContainer.appendChild(pageNumbersContainer);

    // Next Button
    controlsContainer.appendChild(createNavButton('Next', currentPage === totalPages, () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderHistoryWithPagination();
        }
    }));
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

async function loadAllPokemonNames() {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
    const data = await res.json();

    // Include base Pokemon (ID < 10000) and official alternate forms (10000-10300 range)
    // IDs 10001-10300 are real alternate forms (megas, form variants like shaymin-sky, rotom-wash, etc.)
    const filtered = data.results.filter(p => {
        const id = parseInt(p.url.split('/').filter(Boolean).pop());
        return id < 10300;
    });

    allPokemonNames = filtered.map(p => capitalize(p.name));

    // Build normalized lookup map for O(1) matching
    normalizedPokemonLookup.clear();
    pokemonIdLookup.clear();
    for (const p of filtered) {
        const name = p.name.toLowerCase();
        normalizedPokemonLookup.set(name, capitalize(p.name));
        // Extract ID from URL (e.g., "https://pokeapi.co/api/v2/pokemon/10001/" -> 10001)
        const id = parseInt(p.url.split('/').filter(Boolean).pop());
        pokemonIdLookup.set(name, id);
    }
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
    getSaveButton().addEventListener('click', saveCurrentBattle);
    document.getElementById('import-history-btn').addEventListener('click', importHistory);
    document.getElementById('export-history-btn').addEventListener('click', exportHistory);
    document.getElementById('graph-limit').addEventListener('change', renderWinDifferenceGraph);
    document.getElementById('goat-woat-limit').addEventListener('change', updateGoatWoat);

    const inputs = document.querySelectorAll(".poke-input");
    inputs.forEach(input => setupAutocomplete(input));

    document.querySelector('.teams').addEventListener('click', handleTeamNameClick);

    // Graph tooltip and click handlers
    const graphContainer = document.getElementById('win-graph-container');
    const tooltip = document.getElementById('graph-tooltip');

    graphContainer.addEventListener('mouseover', e => {
        if (e.target.classList.contains('graph-point-hover-target')) {
            const index = parseInt(e.target.dataset.index, 10);
            const data = graphData[index];
            if (!data) return;

            const team1Name = getTeamNameElement('team1').textContent;
            const team2Name = getTeamNameElement('team2').textContent;

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

// Initialize Tesseract worker with restricted character set for faster OCR
async function initTesseractWorker() {
    try {
        tesseractWorker = await Tesseract.createWorker('eng');
        await tesseractWorker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz- ',
            tessedit_pageseg_mode: '6', // Assume uniform block of text
        });
        console.log('Tesseract worker initialized');
    } catch (error) {
        console.error('Failed to initialize Tesseract worker:', error);
    }
}

// Preprocess image for better OCR accuracy: upscale, grayscale, binarize
function preprocessForOCR(imageBlob) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Upscale 2x for better OCR on small text
            const scale = 2;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            // Draw upscaled with grayscale + high contrast
            ctx.filter = 'grayscale(100%) contrast(200%)';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none';

            // Manual binarization for cleaner text
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const threshold = 128;
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const val = gray >= threshold ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob(resolve, 'image/png');
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(imageBlob);
    });
}

// Levenshtein distance for fuzzy matching OCR errors against known Pokemon names
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => i);
    for (let j = 1; j <= n; j++) {
        let prev = dp[0];
        dp[0] = j;
        for (let i = 1; i <= m; i++) {
            const temp = dp[i];
            dp[i] = a[i - 1] === b[j - 1]
                ? prev
                : 1 + Math.min(prev, dp[i], dp[i - 1]);
            prev = temp;
        }
    }
    return dp[m];
}

// Load history after other scripts have set up the page
window.addEventListener('load', () => {
    // Always hide the streak notification on page load
    hideStreakAchievement();
    loadHistory();
    initTesseractWorker(); // Pre-load OCR engine
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

function clearAllSuggestions() {
    document.querySelectorAll('.suggestions').forEach(list => list.innerHTML = '');
}

function setupAutocomplete(input) {
    const wrapper = input.parentElement;
    const list = wrapper.querySelector(".suggestions");
    let currentIndex = -1;

    // Close suggestions when clicking outside or losing focus
    input.addEventListener("blur", () => {
        // Delay to allow click on suggestion to register first
        setTimeout(() => { list.innerHTML = ""; }, 150);
    });

    input.addEventListener("input", () => {
        const val = input.value.toLowerCase();
        list.innerHTML = "";
        currentIndex = -1;
        if (!val) return;

        const matches = allPokemonNames.filter(name => name.toLowerCase().startsWith(val)).slice(0, 6);
        matches.forEach(name => {
            const li = document.createElement("li");
            const pokedexNum = getPokemonIdByName(name);
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexNum}.png`;
            li.innerHTML = `<img src="${spriteUrl}" alt="${name}" class="suggestion-sprite" onerror="this.src='${PLACEHOLDER_SPRITE}';this.onerror=null"><span class="suggestion-name">${name}</span><span class="suggestion-number">#${pokedexNum}</span>`;
            li.dataset.name = name;
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
                const selectedName = selectedItem.dataset.name;
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
    const teamId = input.closest('.team').id;
    const teamGrid = getTeamGrid(teamId);

    if (teamGrid.children.length >= 6) return;
    input.value = '';

    try {
        const pokemon = await fetchPokemon(name.toLowerCase());
        generatePokemonCard(pokemon, teamId);

        // If team 1 is now full, focus team 2's input for a smoother workflow
        if (teamId === 'team1' && teamGrid.children.length === 6) {
            document.querySelector('#team2 .poke-input')?.focus();
        }
    } catch (err) {
        console.error(err);
        alert(`Could not find a Pokemon named "${name}". Please try again.`);
    }
}

function renderWinDifferenceGraph() {
    const wrapper = document.getElementById('graph-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = ''; // Clear previous graph

    const team1Name = getTeamNameElement('team1').textContent;
    const team2Name = getTeamNameElement('team2').textContent;

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
