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
let arcadeMode = false;
let currentSessionId = null; // ID of the active session (null = unsaved new session)
let currentBets = { team1: null, team2: null }; // Side bets for current battle

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

    // Remove arcade bonus indicators
    document.getElementById('team1-arcade-bonuses')?.remove();
    document.getElementById('team2-arcade-bonuses')?.remove();
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
    ],
    cocoons: ['metapod', 'kakuna', 'silcoon', 'cascoon', 'spewpa'],
    pikaclones: ['pichu', 'pikachu', 'raichu', 'plusle', 'minun', 'pachirisu', 'emolga', 'dedenne', 'togedemaru', 'morpeko'],
    catPokemon: ['meowth', 'persian', 'skitty', 'delcatty', 'glameow', 'purugly', 'purrloin', 'liepard',
        'espurr', 'meowstic', 'shinx', 'luxio', 'luxray', 'litten', 'torracat', 'incineroar',
        'sprigatito', 'floragato', 'meowscarada', 'espeon'],
    dogPokemon: ['growlithe', 'arcanine', 'snubbull', 'granbull', 'houndour', 'houndoom', 'poochyena',
        'mightyena', 'electrike', 'manectric', 'lillipup', 'herdier', 'stoutland', 'rockruff',
        'lycanroc', 'yamper', 'boltund', 'fidough', 'dachsbun', 'greavard', 'houndstone',
        'riolu', 'lucario', 'maschiff', 'mabosstiff'],
    eggPokemon: ['togepi', 'togetic', 'togekiss', 'chansey', 'blissey', 'happiny', 'exeggcute', 'exeggutor'],
    pseudoLegendaries: ['dragonite', 'tyranitar', 'salamence', 'metagross', 'garchomp', 'hydreigon',
        'goodra', 'kommo-o', 'dragapult', 'baxcalibur'],
    // Pokemon that can still evolve (first-stage and middle-stage of evolution lines)
    canEvolve: [
        // Gen 1 first stages
        'bulbasaur', 'charmander', 'squirtle', 'caterpie', 'weedle', 'pidgey',
        'rattata', 'spearow', 'ekans', 'pikachu', 'sandshrew', 'nidoran-f', 'nidoran-m',
        'clefairy', 'jigglypuff', 'zubat', 'oddish', 'paras', 'venonat', 'diglett', 'meowth',
        'psyduck', 'mankey', 'growlithe', 'poliwag', 'abra', 'machop', 'bellsprout',
        'tentacool', 'geodude', 'ponyta', 'slowpoke', 'magnemite', 'doduo', 'seel',
        'grimer', 'shellder', 'gastly', 'drowzee', 'krabby', 'voltorb', 'exeggcute',
        'cubone', 'lickitung', 'koffing', 'rhyhorn', 'chansey', 'tangela', 'horsea',
        'goldeen', 'staryu', 'scyther', 'electabuzz', 'magmar', 'eevee', 'omanyte',
        'kabuto', 'dratini', 'porygon',
        // Gen 1 middle stages
        'ivysaur', 'charmeleon', 'wartortle', 'metapod', 'kakuna', 'pidgeotto',
        'nidorina', 'nidorino', 'gloom', 'poliwhirl', 'kadabra', 'machoke',
        'weepinbell', 'graveler', 'haunter', 'dragonair', 'porygon2',
        // Gen 2 first stages
        'chikorita', 'cyndaquil', 'totodile', 'sentret', 'hoothoot', 'ledyba',
        'spinarak', 'chinchou', 'togepi', 'mareep', 'hoppip', 'swinub',
        'teddiursa', 'slugma', 'houndour', 'larvitar', 'sneasel',
        // Gen 2 babies
        'pichu', 'cleffa', 'igglybuff', 'tyrogue', 'smoochum', 'elekid', 'magby',
        // Gen 2 middle stages
        'bayleef', 'quilava', 'croconaw', 'togetic', 'flaaffy', 'skiploom',
        'piloswine', 'pupitar', 'seadra',
        // Gen 3 first stages
        'treecko', 'torchic', 'mudkip', 'poochyena', 'zigzagoon', 'wurmple',
        'lotad', 'seedot', 'ralts', 'shroomish', 'slakoth', 'nincada', 'whismur',
        'makuhita', 'skitty', 'aron', 'electrike', 'gulpin', 'carvanha',
        'wailmer', 'numel', 'spoink', 'trapinch', 'swablu', 'barboach',
        'corphish', 'lileep', 'anorith', 'feebas', 'shuppet', 'duskull', 'snorunt',
        'spheal', 'clamperl', 'bagon', 'beldum',
        // Gen 3 middle stages
        'grovyle', 'combusken', 'marshtomp', 'silcoon', 'cascoon', 'lombre',
        'nuzleaf', 'kirlia', 'vigoroth', 'loudred', 'lairon', 'vibrava',
        'sealeo', 'shelgon', 'metang',
        // Gen 4 first stages / babies
        'turtwig', 'chimchar', 'piplup', 'starly', 'bidoof', 'shinx',
        'cranidos', 'shieldon', 'burmy', 'combee', 'buizel', 'cherubi',
        'gible', 'riolu', 'hippopotas', 'skorupi', 'croagunk', 'snover',
        'happiny', 'munchlax', 'mantyke', 'bonsly', 'mime-jr', 'budew',
        // Gen 4 middle stages
        'grotle', 'monferno', 'prinplup', 'staravia', 'luxio',
        'gabite', 'rhydon', 'magneton', 'roselia',
        // Gen 5 first stages
        'snivy', 'tepig', 'oshawott', 'lillipup', 'purrloin', 'roggenrola',
        'timburr', 'tympole', 'sewaddle', 'venipede', 'sandile', 'darumaka',
        'dwebble', 'scraggy', 'gothita', 'solosis', 'vanillite', 'karrablast',
        'joltik', 'ferroseed', 'klink', 'tynamo', 'litwick', 'axew', 'mienfoo',
        'golett', 'pawniard', 'rufflet', 'vullaby', 'deino', 'larvesta',
        // Gen 5 middle stages
        'servine', 'pignite', 'dewott', 'herdier', 'boldore', 'gurdurr',
        'palpitoad', 'swadloon', 'whirlipede', 'krokorok', 'gothorita',
        'duosion', 'vanillish', 'klang', 'lampent', 'fraxure', 'zweilous',
        // Gen 6+
        'froakie', 'frogadier', 'fennekin', 'braixen', 'chespin', 'quilladin',
        'fletchling', 'fletchinder', 'litleo', 'espurr', 'honedge', 'doublade',
        'inkay', 'rowlet', 'dartrix', 'litten', 'torracat', 'popplio', 'brionne',
        'rockruff', 'grookey', 'thwackey', 'scorbunny', 'raboot', 'sobble', 'drizzile',
        'sprigatito', 'floragato', 'fuecoco', 'crocalor', 'quaxly', 'quaxwell'
    ],
    // Starter Pokemon from all generations (all stages)
    starters: [
        'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard',
        'squirtle', 'wartortle', 'blastoise', 'chikorita', 'bayleef', 'meganium',
        'cyndaquil', 'quilava', 'typhlosion', 'totodile', 'croconaw', 'feraligatr',
        'treecko', 'grovyle', 'sceptile', 'torchic', 'combusken', 'blaziken',
        'mudkip', 'marshtomp', 'swampert', 'turtwig', 'grotle', 'torterra',
        'chimchar', 'monferno', 'infernape', 'piplup', 'prinplup', 'empoleon',
        'snivy', 'servine', 'serperior', 'tepig', 'pignite', 'emboar',
        'oshawott', 'dewott', 'samurott', 'chespin', 'quilladin', 'chesnaught',
        'fennekin', 'braixen', 'delphox', 'froakie', 'frogadier', 'greninja',
        'rowlet', 'dartrix', 'decidueye', 'litten', 'torracat', 'incineroar',
        'popplio', 'brionne', 'primarina', 'grookey', 'thwackey', 'rillaboom',
        'scorbunny', 'raboot', 'cinderace', 'sobble', 'drizzile', 'inteleon',
        'sprigatito', 'floragato', 'meowscarada', 'fuecoco', 'crocalor', 'skeledirge',
        'quaxly', 'quaxwell', 'quaquaval'
    ],
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

// ==================== Arcade Multiplier Sets ====================
// Each set has a check function that receives team data (same format as achievements)
// and returns { matched: boolean, description: string }

// Helper: matches a pokemon name against a list, including form variants (e.g. "meowth-alola" matches "meowth")
function matchesAnyBase(name, baseList) {
    return baseList.some(base => name === base || name.startsWith(base + '-'));
}

const arcadeMultiplierSets = [
    // === Big Bonus (+100/ea) - "Against All Odds" ===
    {
        id: 'baby-brigade',
        name: 'Baby Brigade',
        emoji: '🍼',
        bonus: 100,
        tier: 'against-all-odds',
        flavor: 'Sending babies to war!',
        hint: '3+ first-evolution Pokemon from 3-stage lines',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.threeStageFirstEvolutions.includes(p)).length;
            if (count >= 3) return { matched: true, description: `${count} first-evolution Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'bottom-barrel',
        name: 'Bottom Barrel',
        emoji: '🪣',
        bonus: 100,
        tier: 'against-all-odds',
        flavor: 'Scraping the bottom!',
        hint: 'Team average BST under 350',
        check: (team) => {
            const avgBST = team.pokemon.reduce((sum, p) => sum + p.score, 0) / team.pokemon.length;
            if (avgBST < 350) return { matched: true, description: `Avg BST: ${Math.round(avgBST)}` };
            return { matched: false };
        }
    },
    {
        id: 'bug-catchers',
        name: 'Bug Catchers',
        emoji: '🐛',
        bonus: 100,
        tier: 'against-all-odds',
        flavor: 'Youngster Joey energy!',
        hint: '3+ Bug-type Pokemon',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.includes('bug')).length;
            if (count >= 3) return { matched: true, description: `${count} Bug-type Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'nfe-army',
        name: 'NFE Army',
        emoji: '🚫',
        bonus: 100,
        tier: 'against-all-odds',
        flavor: 'Refusing to evolve!',
        hint: '4+ not fully evolved Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const nfeCount = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.canEvolve)).length;
            if (nfeCount >= 4) return { matched: true, description: `${nfeCount} not fully evolved` };
            return { matched: false };
        }
    },
    {
        id: 'sunkern-special',
        name: 'The Sunkern Special',
        emoji: '🌻',
        bonus: 100,
        tier: 'against-all-odds',
        flavor: 'The greatest upset!',
        hint: 'Win the battle with Sunkern on your team',
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
        bonus: 100,
        tier: 'against-all-odds',
        flavor: '...eventually',
        hint: '2+ Slowpoke family members',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.slowpokes)).length;
            if (count >= 2) return { matched: true, description: `${count} Slowpoke family` };
            return { matched: false };
        }
    },
    {
        id: 'cocoon-chaos',
        name: 'Cocoon Chaos',
        emoji: '🪺',
        bonus: 100,
        tier: 'against-all-odds',
        flavor: 'It used Harden!',
        hint: '2+ cocoon Pokemon (Metapod, Kakuna, etc.)',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.cocoons.includes(p)).length;
            if (count >= 2) return { matched: true, description: `${count} cocoon Pokémon` };
            return { matched: false };
        }
    },

    // === Medium Bonus (+75/ea) - "Thematic Mastery" ===
    {
        id: 'type-specialist',
        name: 'Type Specialist',
        emoji: '🏋️',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Gym Leader energy!',
        hint: '3+ Pokemon sharing one type',
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
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: "Gotta evolve 'em all!",
        hint: '2+ Eeveelutions',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.eeveelutions.includes(p)).length;
            if (count >= 2) return { matched: true, description: `${count} Eeveelutions` };
            return { matched: false };
        }
    },
    {
        id: 'fossil-expedition',
        name: 'Fossil Expedition',
        emoji: '🦴',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Jurassic Park!',
        hint: '2+ Fossil Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.fossils.includes(p)).length;
            if (count >= 2) return { matched: true, description: `${count} Fossil Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'pretty-in-pink',
        name: 'Pretty in Pink',
        emoji: '🌸',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Fabulous!',
        hint: '2+ pink Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.pinkPokemon.includes(p)).length;
            if (count >= 2) return { matched: true, description: `${count} Pink Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'kanto-starters-united',
        name: 'Kanto Starters United',
        emoji: '🎮',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'OG crew!',
        hint: 'All 3 Kanto starter lines represented',
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
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Prepare for trouble!',
        hint: '2+ Team Rocket Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const rocketPokemon = [...pokemonCategories.teamRocketMeowth, ...pokemonCategories.teamRocketOther];
            const count = pokemon.filter(p => rocketPokemon.includes(p)).length;
            if (count >= 2) return { matched: true, description: `${count} Team Rocket Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'pikaclone-parade',
        name: 'Pikaclone Parade',
        emoji: '⚡',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Shocking resemblance!',
        hint: '2+ Pikaclones',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.pikaclones)).length;
            if (count >= 2) return { matched: true, description: `${count} Pikaclones` };
            return { matched: false };
        }
    },
    {
        id: 'cat-cafe',
        name: 'Cat Cafe',
        emoji: '🐱',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Meow meow meow!',
        hint: '2+ cat Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.catPokemon)).length;
            if (count >= 2) return { matched: true, description: `${count} cat Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'good-boys',
        name: 'Good Boys',
        emoji: '🐕',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: "Who's a good team?",
        hint: '2+ dog Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.dogPokemon)).length;
            if (count >= 2) return { matched: true, description: `${count} dog Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'egg-gang',
        name: 'Egg Gang',
        emoji: '🥚',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Which came first?',
        hint: '2+ egg-themed Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.eggPokemon)).length;
            if (count >= 2) return { matched: true, description: `${count} egg Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'gym-leader',
        name: 'Gym Leader',
        emoji: '🏟️',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'One type to rule them all!',
        hint: '5+ Pokemon sharing one type',
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
            if (bestType && bestType[1] >= 5) {
                return { matched: true, description: `${bestType[1]} ${bestType[0].charAt(0).toUpperCase() + bestType[0].slice(1)}-type` };
            }
            return { matched: false };
        }
    },
    {
        id: 'starter-pack',
        name: 'Starter Pack',
        emoji: '🎒',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Choose your adventure!',
        hint: '3+ starter Pokemon',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.starters)).length;
            if (count >= 3) return { matched: true, description: `${count} starter Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'ghost-story',
        name: 'Ghost Story',
        emoji: '👻',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Spooky squad!',
        hint: '2+ Ghost-type',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.includes('ghost')).length;
            if (count >= 2) return { matched: true, description: `${count} Ghost-type Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'fairy-tale',
        name: 'Fairy Tale',
        emoji: '🧚',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Once upon a time...',
        hint: '2+ Fairy-type',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.includes('fairy')).length;
            if (count >= 2) return { matched: true, description: `${count} Fairy-type Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'steel-wall',
        name: 'Wall of Steel',
        emoji: '🔩',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Industrial strength!',
        hint: '2+ Steel-type',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.includes('steel')).length;
            if (count >= 2) return { matched: true, description: `${count} Steel-type Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'fighting-dojo',
        name: 'Fighting Dojo',
        emoji: '🥊',
        bonus: 75,
        tier: 'thematic-mastery',
        flavor: 'Hiyaaa!',
        hint: '2+ Fighting-type',
        check: (team) => {
            const count = team.pokemon.filter(p => p.types && p.types.includes('fighting')).length;
            if (count >= 2) return { matched: true, description: `${count} Fighting-type Pokémon` };
            return { matched: false };
        }
    },

    // === Small Bonus (+50/ea) - "Power Play" ===
    {
        id: 'legendary-assembly',
        name: 'Legendary Assembly',
        emoji: '⭐',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Overkill much?',
        hint: '2+ Legendary Pokemon',
        check: (team) => {
            const count = team.pokemon.filter(p => isLegendary(p.name)).length;
            if (count >= 2) return { matched: true, description: `${count} Legendaries` };
            return { matched: false };
        }
    },
    {
        id: 'final-form-force',
        name: 'Final Form Force',
        emoji: '💪',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Maximum power!',
        hint: '4+ fully evolved Pokemon',
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
        bonus: 50,
        tier: 'power-play',
        flavor: 'Beast mode!',
        hint: '2+ Dragon-type',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => pokemonCategories.dragons.includes(p)).length;
            if (count >= 2) return { matched: true, description: `${count} Dragon-type` };
            return { matched: false };
        }
    },
    {
        id: 'bird-trio-complete',
        name: 'Bird Trio Complete',
        emoji: '🐦',
        bonus: 50,
        tier: 'power-play',
        flavor: "Collector's edition!",
        hint: 'Articuno + Zapdos + Moltres',
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
        bonus: 50,
        tier: 'power-play',
        flavor: "Johto's finest!",
        hint: 'Raikou + Entei + Suicune',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const beasts = ['raikou', 'entei', 'suicune'];
            if (beasts.every(b => pokemon.includes(b))) {
                return { matched: true, description: 'Raikou + Entei + Suicune' };
            }
            return { matched: false };
        }
    },
    {
        id: 'pseudo-legendary-club',
        name: 'Pseudo-Legendary Club',
        emoji: '🏰',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Almost legendary!',
        hint: '2+ pseudo-legendaries',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            const count = pokemon.filter(p => matchesAnyBase(p, pokemonCategories.pseudoLegendaries)).length;
            if (count >= 2) return { matched: true, description: `${count} pseudo-legendaries` };
            return { matched: false };
        }
    },
    {
        id: 'speed-demons',
        name: 'Speed Demons',
        emoji: '💨',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Gotta go fast!',
        hint: '3+ Pokemon with 100+ base Speed',
        check: (team) => {
            const fastCount = team.pokemon.filter(p => {
                const speedStat = p.stats?.find(s => s.name === 'SPE');
                return speedStat && speedStat.value > 100;
            }).length;
            if (fastCount >= 3) return { matched: true, description: `${fastCount} Pokémon with 100+ Speed` };
            return { matched: false };
        }
    },
    {
        id: 'tank-division',
        name: 'Tank Division',
        emoji: '🛡️',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Unmovable objects!',
        hint: '3+ Pokemon with 90+ base Defense',
        check: (team) => {
            const tankCount = team.pokemon.filter(p => {
                const defStat = p.stats?.find(s => s.name === 'DEF');
                return defStat && defStat.value > 90;
            }).length;
            if (tankCount >= 3) return { matched: true, description: `${tankCount} Pokémon with 90+ Defense` };
            return { matched: false };
        }
    },
    {
        id: 'elemental-trio',
        name: 'Elemental Trio',
        emoji: '🔺',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Fire, Water, Grass!',
        hint: 'Fire + Water + Grass types on team',
        check: (team) => {
            const types = new Set(team.pokemon.flatMap(p => p.types || []));
            if (types.has('fire') && types.has('water') && types.has('grass')) {
                return { matched: true, description: 'Fire + Water + Grass types' };
            }
            return { matched: false };
        }
    },
    {
        id: 'glass-cannons',
        name: 'Glass Cannons',
        emoji: '💥',
        bonus: 50,
        tier: 'power-play',
        flavor: 'Hit hard, die fast!',
        hint: '2+ Pokemon with ATK/SPATK >100 and HP <70',
        check: (team) => {
            const count = team.pokemon.filter(p => {
                const atk = Math.max(
                    p.stats?.find(s => s.name === 'ATK')?.value || 0,
                    p.stats?.find(s => s.name === 'SPATK')?.value || 0
                );
                const hp = p.stats?.find(s => s.name === 'HP')?.value || 999;
                return atk > 100 && hp < 70;
            }).length;
            if (count >= 2) return { matched: true, description: `${count} glass cannon Pokémon` };
            return { matched: false };
        }
    },
    {
        id: 'the-impostor',
        name: 'The Impostor',
        emoji: '🫠',
        bonus: 50,
        tier: 'power-play',
        flavor: 'It could be anyone!',
        hint: 'Ditto on the team',
        check: (team) => {
            const pokemon = team.pokemon.map(p => p.name.toLowerCase());
            if (pokemon.includes('ditto')) return { matched: true, description: 'Ditto on the team!' };
            return { matched: false };
        }
    },
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
];

// Identify which Pokemon contributed to a matched multiplier
function getContributingPokemon(setId, team) {
    const pokemon = team.pokemon;
    switch (setId) {
        case 'baby-brigade':
            return pokemon.filter(p => pokemonCategories.threeStageFirstEvolutions.includes(p.name.toLowerCase())).map(p => p.name);
        case 'bottom-barrel':
            return pokemon.map(p => p.name);
        case 'bug-catchers':
            return pokemon.filter(p => p.types?.includes('bug')).map(p => p.name);
        case 'nfe-army':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.canEvolve)).map(p => p.name);
        case 'sunkern-special':
            return pokemon.filter(p => p.name.toLowerCase() === 'sunkern').map(p => p.name);
        case 'slowpoke-parade':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.slowpokes)).map(p => p.name);
        case 'type-specialist':
        case 'gym-leader': {
            const typeCounts = {};
            pokemon.forEach(p => p.types?.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; }));
            const bestType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
            return bestType ? pokemon.filter(p => p.types?.includes(bestType)).map(p => p.name) : [];
        }
        case 'eeveelution-squad':
            return pokemon.filter(p => pokemonCategories.eeveelutions.includes(p.name.toLowerCase())).map(p => p.name);
        case 'fossil-expedition':
            return pokemon.filter(p => pokemonCategories.fossils.includes(p.name.toLowerCase())).map(p => p.name);
        case 'pretty-in-pink':
            return pokemon.filter(p => pokemonCategories.pinkPokemon.includes(p.name.toLowerCase())).map(p => p.name);
        case 'kanto-starters-united':
            return pokemon.filter(p => pokemonCategories.kantoStarters.includes(p.name.toLowerCase())).map(p => p.name);
        case 'rocket-roster': {
            const rocketAll = [...pokemonCategories.teamRocketMeowth, ...pokemonCategories.teamRocketOther];
            return pokemon.filter(p => rocketAll.includes(p.name.toLowerCase())).map(p => p.name);
        }
        case 'legendary-assembly':
            return pokemon.filter(p => isLegendary(p.name)).map(p => p.name);
        case 'final-form-force':
            return pokemon.filter(p => pokemonCategories.finalEvolutions.includes(p.name.toLowerCase())).map(p => p.name);
        case 'dragons-den':
            return pokemon.filter(p => pokemonCategories.dragons.includes(p.name.toLowerCase())).map(p => p.name);
        case 'bird-trio-complete':
            return pokemon.filter(p => pokemonCategories.legendaryBirds.includes(p.name.toLowerCase())).map(p => p.name);
        case 'beast-trio-complete':
            return pokemon.filter(p => ['raikou', 'entei', 'suicune'].includes(p.name.toLowerCase())).map(p => p.name);
        case 'cocoon-chaos':
            return pokemon.filter(p => pokemonCategories.cocoons.includes(p.name.toLowerCase())).map(p => p.name);
        case 'pikaclone-parade':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.pikaclones)).map(p => p.name);
        case 'cat-cafe':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.catPokemon)).map(p => p.name);
        case 'good-boys':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.dogPokemon)).map(p => p.name);
        case 'egg-gang':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.eggPokemon)).map(p => p.name);
        case 'pseudo-legendary-club':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.pseudoLegendaries)).map(p => p.name);
        case 'speed-demons':
            return pokemon.filter(p => (p.stats?.find(s => s.name === 'SPE')?.value || 0) > 100).map(p => p.name);
        case 'tank-division':
            return pokemon.filter(p => (p.stats?.find(s => s.name === 'DEF')?.value || 0) > 90).map(p => p.name);
        case 'starter-pack':
            return pokemon.filter(p => matchesAnyBase(p.name.toLowerCase(), pokemonCategories.starters)).map(p => p.name);
        case 'ghost-story':
            return pokemon.filter(p => p.types?.includes('ghost')).map(p => p.name);
        case 'fairy-tale':
            return pokemon.filter(p => p.types?.includes('fairy')).map(p => p.name);
        case 'steel-wall':
            return pokemon.filter(p => p.types?.includes('steel')).map(p => p.name);
        case 'fighting-dojo':
            return pokemon.filter(p => p.types?.includes('fighting')).map(p => p.name);
        case 'elemental-trio': {
            const typeSet = new Set(pokemon.flatMap(p => p.types || []));
            return pokemon.filter(p => {
                const t = p.types || [];
                return (typeSet.has('fire') && t.includes('fire')) ||
                       (typeSet.has('water') && t.includes('water')) ||
                       (typeSet.has('grass') && t.includes('grass'));
            }).map(p => p.name);
        }
        case 'glass-cannons':
            return pokemon.filter(p => {
                const atk = Math.max(
                    p.stats?.find(s => s.name === 'ATK')?.value || 0,
                    p.stats?.find(s => s.name === 'SPATK')?.value || 0
                );
                const hp = p.stats?.find(s => s.name === 'HP')?.value || 999;
                return atk > 100 && hp < 70;
            }).map(p => p.name);
        case 'the-impostor':
            return pokemon.filter(p => p.name.toLowerCase() === 'ditto').map(p => p.name);
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
        default:
            return [];
    }
}

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
                bonus: set.bonus,
                tier: set.tier,
                flavor: set.flavor,
                description: result.description,
                pokemonNames: getContributingPokemon(set.id, enrichedTeam)
            });
        }
    });
    return matched;
}

function calculateTotalBonus(multipliers) {
    if (multipliers.length === 0) return 0;
    return multipliers.reduce((sum, m) => sum + (m.bonus || 0), 0);
}

// Calculate adjusted score where each bonus adds a fixed amount per contributing Pokemon.
// A Pokemon in multiple bonuses gets the sum of all applicable bonuses added to its score.
// Ditto copies the highest opponent Pokemon's score.
function calculatePerPokemonScore(teamData, multipliers, opponentData) {
    const enrichedTeam = enrichTeamDataForArcade(teamData);
    let opponentMaxScore = 0;
    if (opponentData) {
        const enrichedOpponent = enrichTeamDataForArcade(opponentData);
        opponentMaxScore = Math.max(...enrichedOpponent.pokemon.map(p => p.score));
    }
    return enrichedTeam.pokemon.reduce((total, p) => {
        let score = p.score;
        if (p.name.toLowerCase() === 'ditto' && opponentMaxScore > 0) {
            score = opponentMaxScore;
        }
        const applicable = multipliers.filter(m => m.pokemonNames?.includes(p.name));
        const bonusTotal = applicable.reduce((sum, m) => sum + (m.bonus || 0), 0);
        return total + score + bonusTotal;
    }, 0);
}

function getPokedexIdFromSprite(spriteUrl) {
    const match = spriteUrl?.match(/\/pokemon\/(\d+)\./);
    return match ? parseInt(match[1]) : null;
}

function enrichTeamDataForArcade(teamData) {
    // The team data from getTeamData() only has name, score, sprite.
    // We need types and individual stats for multiplier checks.
    const enriched = { ...teamData };

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

            const pokedexId = getPokedexIdFromSprite(sprite);
            return { name, score, sprite, types, stats, pokedexId };
        });
    }

    return enriched;
}

function evaluateBet(teamId, detectedMultipliers) {
    const bet = currentBets[teamId];
    if (!bet) return 1; // No bet placed
    const betMatched = detectedMultipliers.some(m => m.id === bet.categoryId);
    return betMatched ? 1.2 : 0.9;
}

function showBetModal(teamId) {
    if (isBattleConcluded) return; // Can't bet after battle

    const categories = arcadeMultiplierSets.map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        tier: s.tier,
        bonus: s.bonus,
        flavor: s.flavor,
        hint: s.hint
    }));

    const popup = createPopup('bet-modal', 'bet-modal-popup', `
        <div class="bet-modal-content">
            <h3>🎰 Place Your Bet</h3>
            <p class="bet-modal-desc">Bet on a bonus you think your team qualifies for.<br>Correct: 1.2x bonus | Wrong: 0.9x penalty</p>
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

// ==================== Arcade Reveal Animation ====================

async function showArcadeReveal(
    team1Raw, team2Raw,
    team1Multipliers, team2Multipliers,
    team1Final, team2Final,
    bets, team1BetMult, team2BetMult,
    replayOptions
) {
    return new Promise(async (resolve) => {
        const team1Name = replayOptions?.team1Name || getTeamNameElement('team1')?.textContent || 'Team 1';
        const team2Name = replayOptions?.team2Name || getTeamNameElement('team2')?.textContent || 'Team 2';

        const overlay = document.createElement('div');
        overlay.className = 'arcade-reveal-overlay';
        overlay.innerHTML = `
            <div class="arcade-reveal-container">
                <div class="arcade-reveal-banner">ARCADE BATTLE!</div>
                <div class="arcade-reveal-scores">
                    <div class="arcade-reveal-team">
                        <div class="arcade-reveal-team-name">${team1Name}</div>
                        <div class="arcade-reveal-raw-score">${team1Raw}</div>
                        <div class="arcade-reveal-reels" id="arcade-reveal-t1-reels"></div>
                        <div class="arcade-reveal-final-score" id="arcade-reveal-t1-final"></div>
                    </div>
                    <div class="arcade-reveal-vs">VS</div>
                    <div class="arcade-reveal-team">
                        <div class="arcade-reveal-team-name">${team2Name}</div>
                        <div class="arcade-reveal-raw-score">${team2Raw}</div>
                        <div class="arcade-reveal-reels" id="arcade-reveal-t2-reels"></div>
                        <div class="arcade-reveal-final-score" id="arcade-reveal-t2-final"></div>
                    </div>
                </div>
                <div class="arcade-reveal-winner" id="arcade-reveal-winner"></div>
                <div class="arcade-reveal-buttons">
                    <button class="arcade-reveal-skip" id="arcade-reveal-skip">Skip</button>
                    <button class="arcade-reveal-continue" id="arcade-reveal-continue">Continue</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);

        let skipped = false;
        const skipBtn = document.getElementById('arcade-reveal-skip');
        const continueBtn = document.getElementById('arcade-reveal-continue');

        const cleanup = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            resolve();
        };

        const showContinue = () => {
            skipBtn.style.display = 'none';
            continueBtn.classList.add('visible');
        };

        continueBtn.addEventListener('click', cleanup);

        // Build sprite map from DOM cards (name → sprite URL)
        function buildSpriteMap(teamId) {
            const grid = document.getElementById(`${teamId}-grid`);
            if (!grid) return {};
            const map = {};
            Array.from(grid.children).forEach(card => {
                const name = card.querySelector('.pokemon-name')?.textContent || '';
                const sprite = card.querySelector('.pokemon-sprite')?.src || null;
                if (name && sprite) map[name] = sprite;
            });
            return map;
        }
        const t1Sprites = replayOptions?.team1Sprites || buildSpriteMap('team1');
        const t2Sprites = replayOptions?.team2Sprites || buildSpriteMap('team2');

        function buildBadgeHTML(m, extraClass = '', tooltip = '') {
            const titleAttr = tooltip ? ` title="${tooltip.replace(/"/g, '&quot;')}"` : '';
            return `<div class="arcade-multiplier-badge ${extraClass}"${titleAttr}>${m.emoji} ${m.name} <span class="multiplier-value">+${m.bonus}</span></div>`;
        }

        function buildTooltip(m) {
            const parts = [m.flavor || m.description || ''];
            if (m.pokemonNames?.length) parts.push(m.pokemonNames.join(', '));
            return parts.filter(Boolean).join('\n');
        }

        // Reveal a multiplier: show contributing Pokemon sprites one at a time, then pop in the badge
        async function revealMultiplier(container, multiplier, spriteMap) {
            const group = document.createElement('div');
            group.className = 'arcade-reel-group';
            container.appendChild(group);

            const names = multiplier.pokemonNames || [];

            if (names.length > 0) {
                const spritesRow = document.createElement('div');
                spritesRow.className = 'arcade-reel-sprites';
                group.appendChild(spritesRow);

                for (const name of names) {
                    if (skipped) return;
                    const spriteEl = document.createElement('div');
                    spriteEl.className = 'arcade-reel-sprite';
                    const url = spriteMap[name] || PLACEHOLDER_SPRITE;
                    spriteEl.innerHTML = `<img src="${url}" alt="${name}" title="${name}" onerror="this.src='${PLACEHOLDER_SPRITE}';this.onerror=null"><span class="arcade-sprite-name">${name}</span>`;
                    spritesRow.appendChild(spriteEl);

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => spriteEl.classList.add('landed'));
                    });

                    await new Promise(r => setTimeout(r, 350));
                }
            }

            if (skipped) return;

            const badge = document.createElement('div');
            badge.className = 'arcade-reel-badge';
            badge.innerHTML = buildBadgeHTML(multiplier, 'real-badge', buildTooltip(multiplier));
            group.appendChild(badge);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => badge.classList.add('revealed'));
            });

            await new Promise(r => setTimeout(r, 500));
        }

        // Reveal a bet result (no sprites, just badge pop-in)
        async function revealBet(container, bet, betMult) {
            const correct = betMult === 1.2;
            const group = document.createElement('div');
            group.className = 'arcade-reel-group';
            container.appendChild(group);

            const badge = document.createElement('div');
            badge.className = 'arcade-reel-badge';
            badge.innerHTML = `<div class="arcade-multiplier-badge real-badge bet ${correct ? 'won' : 'lost'}">🎰 Bet: ${bet.categoryName} <span class="multiplier-value">${correct ? '✓ 1.2x' : '✗ 0.9x'}</span></div>`;
            group.appendChild(badge);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => badge.classList.add('revealed'));
            });

            await new Promise(r => setTimeout(r, 500));
        }

        // Instant reveal for skip: show all sprites and badges without animation
        function revealAllInstant(multipliers, prefix, betInfo, spriteMap) {
            const container = document.getElementById(`arcade-reveal-${prefix}-reels`);
            container.innerHTML = '';
            if (multipliers.length === 0 && !betInfo) {
                container.innerHTML = '<div class="arcade-no-bonus">No bonuses</div>';
                return;
            }
            multipliers.forEach(m => {
                const group = document.createElement('div');
                group.className = 'arcade-reel-group instant';

                const names = m.pokemonNames || [];
                if (names.length > 0) {
                    const spritesRow = document.createElement('div');
                    spritesRow.className = 'arcade-reel-sprites';
                    names.forEach(name => {
                        const url = spriteMap[name] || PLACEHOLDER_SPRITE;
                        spritesRow.innerHTML += `<div class="arcade-reel-sprite landed"><img src="${url}" alt="${name}" title="${name}" onerror="this.src='${PLACEHOLDER_SPRITE}';this.onerror=null"><span class="arcade-sprite-name">${name}</span></div>`;
                    });
                    group.appendChild(spritesRow);
                }

                const badge = document.createElement('div');
                badge.className = 'arcade-reel-badge revealed';
                badge.innerHTML = buildBadgeHTML(m, 'real-badge glow', buildTooltip(m));
                group.appendChild(badge);
                container.appendChild(group);
            });
            if (betInfo) {
                const correct = betInfo.mult === 1.2;
                const group = document.createElement('div');
                group.className = 'arcade-reel-group instant';
                const badge = document.createElement('div');
                badge.className = 'arcade-reel-badge revealed';
                badge.innerHTML = `<div class="arcade-multiplier-badge real-badge bet ${correct ? 'won' : 'lost'} glow">🎰 Bet: ${betInfo.name} <span class="multiplier-value">${correct ? '✓ 1.2x' : '✗ 0.9x'}</span></div>`;
                group.appendChild(badge);
                container.appendChild(group);
            }
        }

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

        skipBtn.addEventListener('click', () => {
            skipped = true;
            const t1Bet = bets.team1 ? { name: bets.team1.categoryName, mult: team1BetMult } : null;
            const t2Bet = bets.team2 ? { name: bets.team2.categoryName, mult: team2BetMult } : null;
            revealAllInstant(team1Multipliers, 't1', t1Bet, t1Sprites);
            revealAllInstant(team2Multipliers, 't2', t2Bet, t2Sprites);
            showFinalScoresAndWinner();
            showContinue();
        });

        // Animated reveal sequence with sprites
        async function animateReveal() {
            const t1Container = document.getElementById('arcade-reveal-t1-reels');
            for (const m of team1Multipliers) {
                if (skipped) return;
                await revealMultiplier(t1Container, m, t1Sprites);
                if (skipped) return;
                await new Promise(r => setTimeout(r, 300));
            }

            const t2Container = document.getElementById('arcade-reveal-t2-reels');
            for (const m of team2Multipliers) {
                if (skipped) return;
                await revealMultiplier(t2Container, m, t2Sprites);
                if (skipped) return;
                await new Promise(r => setTimeout(r, 300));
            }

            if (skipped) return;

            // Bet results (no sprites, just badge pop-in)
            if (bets.team1) {
                await revealBet(t1Container, bets.team1, team1BetMult);
                if (skipped) return;
                await new Promise(r => setTimeout(r, 300));
            }
            if (bets.team2) {
                await revealBet(t2Container, bets.team2, team2BetMult);
                if (skipped) return;
                await new Promise(r => setTimeout(r, 300));
            }

            if (skipped) return;

            showFinalScoresAndWinner();
            showContinue();
        }

        const hasAny = team1Multipliers.length > 0 || team2Multipliers.length > 0 || bets.team1 || bets.team2;

        if (!hasAny) {
            // No bonuses: show message with brief delay
            const t1Container = document.getElementById('arcade-reveal-t1-reels');
            const t2Container = document.getElementById('arcade-reveal-t2-reels');
            t1Container.innerHTML = '<div class="arcade-no-bonus">No bonuses</div>';
            t2Container.innerHTML = '<div class="arcade-no-bonus">No bonuses</div>';

            await new Promise(r => setTimeout(r, 800));
            showFinalScoresAndWinner();
            showContinue();
        } else {
            animateReveal();
        }
    });
}

// Show arcade bonus indicators below a team's grid after reveal
function showArcadeBonusIndicators(teamId, multipliers, dittoTransform) {
    // Remove any existing indicator for this team
    document.getElementById(`${teamId}-arcade-bonuses`)?.remove();

    if ((!multipliers || multipliers.length === 0) && !dittoTransform) return;

    const grid = document.getElementById(`${teamId}-grid`);
    if (!grid) return;

    const summary = document.createElement('div');
    summary.id = `${teamId}-arcade-bonuses`;
    summary.className = 'arcade-bonus-summary';

    if (dittoTransform) {
        const tag = document.createElement('span');
        tag.className = 'arcade-bonus-tag ditto';
        tag.title = `Ditto transformed! Copied ${dittoTransform.copiedName}'s score (${dittoTransform.from} → ${dittoTransform.to})`;
        tag.textContent = `🫠 Ditto → ${dittoTransform.copiedName} (${dittoTransform.to})`;
        summary.appendChild(tag);
    }

    (multipliers || []).forEach(m => {
        const tip = [m.flavor || '', m.pokemonNames?.length ? m.pokemonNames.join(', ') : ''].filter(Boolean).join('\n');
        const tag = document.createElement('span');
        tag.className = 'arcade-bonus-tag';
        tag.title = tip;
        tag.textContent = `${m.emoji} ${m.name} +${m.bonus}`;
        summary.appendChild(tag);
    });
    grid.after(summary);
}

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

    const totalGames = Math.floor(allScores.length / 2);
    // Champion & Elite: need 10+ games
    const hasEnoughForElite = totalGames >= 10;
    // Contender: need 50+ games
    const hasEnoughForContender = totalGames >= 50;

    // Not enough games for any ranking
    if (!hasEnoughForElite) return result;

    for (const [teamId, teamData, score] of [['team1', team1Data, team1Score], ['team2', team2Data, team2Score]]) {
        // GOAT ranking (where does this score sit among highest?)
        const goatRank = sortedDesc.indexOf(score) + 1;
        // WOAT ranking (where does this score sit among lowest?)
        const woatRank = sortedAsc.indexOf(score) + 1;

        if (goatRank === 1 && hasEnoughForElite) {
            result[teamId].push({
                id: 'goat-champion',
                title: 'GOAT Champion!',
                emoji: '🐐👑',
                description: `${teamData.name} is the #1 Greatest of All Time!`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (goatRank <= 3 && hasEnoughForElite) {
            result[teamId].push({
                id: 'goat-elite',
                title: 'GOAT Elite',
                emoji: '🐐🏅',
                description: `${teamData.name} ranked #${goatRank} all time!`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (goatRank <= 10 && hasEnoughForContender) {
            result[teamId].push({
                id: 'goat-contender',
                title: 'GOAT Contender',
                emoji: '🐐',
                description: `${teamData.name} cracked the GOAT top 10!`,
                triggeringPokemon: teamData.pokemon
            });
        }

        if (woatRank === 1 && hasEnoughForElite) {
            result[teamId].push({
                id: 'woat-champion',
                title: 'WOAT Champion...',
                emoji: '🗑️👑',
                description: `${teamData.name} is the #1 Worst of All Time...`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (woatRank <= 3 && hasEnoughForElite) {
            result[teamId].push({
                id: 'woat-elite',
                title: 'WOAT Elite',
                emoji: '🗑️🏅',
                description: `${teamData.name} ranked bottom ${woatRank} all time...`,
                triggeringPokemon: teamData.pokemon
            });
        } else if (woatRank <= 10 && hasEnoughForContender) {
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

    const team1Data = getTeamData('team1');
    const team2Data = getTeamData('team2');

    if (arcadeMode) {
        // Arcade mode: detect multipliers, then run slot machine reveal
        const team1MultipliersBase = detectArcadeMultipliers(team1Data, false);
        const team2MultipliersBase = detectArcadeMultipliers(team2Data, false);

        // Apply bets
        const team1BetMultiplier = evaluateBet('team1', team1MultipliersBase);
        const team2BetMultiplier = evaluateBet('team2', team2MultipliersBase);

        // Per-Pokemon scoring: each multiplier only boosts the Pokemon that triggered it
        const team1Adjusted = Math.round(calculatePerPokemonScore(team1Data, team1MultipliersBase, team2Data) * team1BetMultiplier);
        const team2Adjusted = Math.round(calculatePerPokemonScore(team2Data, team2MultipliersBase, team1Data) * team2BetMultiplier);

        // Determine preliminary winner from adjusted scores
        let prelimWinner = null;
        if (team1Adjusted > team2Adjusted) prelimWinner = 'team1';
        else if (team2Adjusted > team1Adjusted) prelimWinner = 'team2';

        // Re-detect with winner info for winner-dependent multipliers (e.g., Sunkern Special)
        const team1IsWinner = prelimWinner === 'team1';
        const team2IsWinner = prelimWinner === 'team2';
        const team1MultipliersFinal = detectArcadeMultipliers(team1Data, team1IsWinner);
        const team2MultipliersFinal = detectArcadeMultipliers(team2Data, team2IsWinner);

        const team1AdjustedFinal = Math.round(calculatePerPokemonScore(team1Data, team1MultipliersFinal, team2Data) * team1BetMultiplier);
        const team2AdjustedFinal = Math.round(calculatePerPokemonScore(team2Data, team2MultipliersFinal, team1Data) * team2BetMultiplier);

        // Detect Ditto transforms for display
        function getDittoTransform(teamData, opponentData) {
            const team = enrichTeamDataForArcade(teamData);
            const opponent = enrichTeamDataForArcade(opponentData);
            const ditto = team.pokemon.find(p => p.name.toLowerCase() === 'ditto');
            if (!ditto) return null;
            const best = opponent.pokemon.reduce((max, p) => p.score > max.score ? p : max, opponent.pokemon[0]);
            if (best) {
                return { from: ditto.score, to: best.score, copiedName: best.name };
            }
            return null;
        }
        const team1Ditto = getDittoTransform(team1Data, team2Data);
        const team2Ditto = getDittoTransform(team2Data, team1Data);

        // Store arcade data for saving later
        window._arcadeBattleData = {
            team1: {
                rawScore: team1Score,
                multipliers: team1MultipliersFinal,
                betMultiplier: team1BetMultiplier,
                adjustedScore: team1AdjustedFinal,
                bet: currentBets.team1,
                dittoTransform: team1Ditto
            },
            team2: {
                rawScore: team2Score,
                multipliers: team2MultipliersFinal,
                betMultiplier: team2BetMultiplier,
                adjustedScore: team2AdjustedFinal,
                bet: currentBets.team2,
                dittoTransform: team2Ditto
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

        // Show bonus indicators on the main grid
        showArcadeBonusIndicators('team1', team1MultipliersFinal, team1Ditto);
        showArcadeBonusIndicators('team2', team2MultipliersFinal, team2Ditto);

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

    // Detect and display achievements (skip in arcade mode — arcade has its own multiplier system)
    if (!arcadeMode) {
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
    }

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
    if (arcadeMode && window._arcadeBattleData) {
        winner = window._arcadeBattleData.winner;
    } else {
        if (team1Score > team2Score) winner = 'team1';
        else if (team2Score > team1Score) winner = 'team2';
        else winner = 'tie';
    }

    // Detect cross-team achievements for saving
    const crossTeamAchievements = detectCrossTeamAchievements(team1Data, team2Data);

    // Arcade mode: detect streak-breaking bonus
    let streakBreakData = null;
    if (arcadeMode && winner !== 'tie') {
        const loserTeamId = winner === 'team1' ? 'team2' : 'team1';
        const loserName = loserTeamId === 'team1' ? team1Data.name : team2Data.name;
        const loserStreak = getStreakBeforeSave(loserName);
        const bonusWins = calculateStreakBreakBonus(loserStreak);
        if (bonusWins > 0) {
            streakBreakData = { broken: loserStreak, bonusWins: bonusWins };
        }
    }

    // Attach streak break to arcade data if present
    const arcadeData = window._arcadeBattleData || null;
    if (arcadeData && streakBreakData) {
        arcadeData.streakBreak = streakBreakData;
    }

    // Detect GOAT/WOAT achievements (needs full history including this battle)
    const historyBeforeSave = JSON.parse(localStorage.getItem('battleHistory')) || [];
    const goatWoatAchievements = detectGoatWoatAchievements(team1Data, team2Data, historyBeforeSave);

    const result = {
        id: Date.now(),
        team1: team1Data,
        team2: team2Data,
        winner: winner,
        mode: arcadeMode ? 'arcade' : 'classic',
        arcade: arcadeData,
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
    window._arcadeBattleData = null;

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

    // Arcade mode display
    let arcadeBadgeHTML = '';
    let arcadeDetailsHTML = '';
    if (result.mode === 'arcade' && result.arcade) {
        arcadeBadgeHTML = '<span class="history-arcade-tag">ARCADE</span>';
        arcadeBadgeHTML += '<button class="replay-reveal-btn" title="Replay arcade reveal animation">Replay</button>';

        const formatMultipliers = (teamArcade) => {
            if (!teamArcade?.multipliers?.length) return '<span class="no-multipliers">No bonuses</span>';
            return teamArcade.multipliers.map(m =>
                `<span class="history-multiplier-badge">${m.emoji} ${m.name} +${m.bonus || m.multiplier + 'x'}</span>`
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
                    ${t1?.adjustedScore && t1.adjustedScore !== t1.rawScore ? `<span class="arcade-total-mult">= ${t1.adjustedScore}</span>` : ''}
                </div>
                <div class="history-arcade-team">
                    <span class="arcade-detail-label">${result.team2.name}:</span>
                    ${formatMultipliers(t2)}
                    ${t2?.adjustedScore && t2.adjustedScore !== t2.rawScore ? `<span class="arcade-total-mult">= ${t2.adjustedScore}</span>` : ''}
                </div>
                ${streakHTML}
            </div>
        `;
    }

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

    // Calculate total wins (including arcade streak-break bonus wins)
    history.forEach(result => {
        if (result.winner === 'tie') return;
        const winnerName = result[result.winner].name;
        const bonusWins = (result.arcade?.streakBreak?.bonusWins) || 0;
        tally[winnerName] = (tally[winnerName] || 0) + 1 + bonusWins;
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

function hideStreakAchievement() {
    const achievementContainer = document.getElementById('streak-achievement');
    if (achievementContainer) {
        achievementContainer.style.display = 'none';
    }
}

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

    const totalGames = Math.floor(history.length);
    let thresholdMsg = '';
    if (totalGames < 10) {
        thresholdMsg = `<p class="goat-threshold-msg">Play ${10 - totalGames} more game${10 - totalGames === 1 ? '' : 's'} to unlock GOAT/WOAT Champion & Elite rankings</p>`;
    } else if (totalGames < 50) {
        thresholdMsg = `<p class="goat-threshold-msg">Play ${50 - totalGames} more game${50 - totalGames === 1 ? '' : 's'} to unlock GOAT/WOAT Contender rankings</p>`;
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

    if (thresholdMsg) {
        goatWoatContainer.insertAdjacentHTML('beforeend', thresholdMsg);
    }
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
    sidebarToggle.innerHTML = '◂ SESSIONS';
    sidebarToggle.title = 'Sessions';
    document.body.appendChild(sidebarToggle);

    // Sidebar toggle
    const openSidebar = () => {
        sessionsSidebar.classList.add('open');
        sidebarToggle.style.display = 'none';
        renderSessionsList();
    };
    const closeSidebar = () => {
        sessionsSidebar.classList.remove('open');
        sidebarToggle.style.display = '';
    };
    document.getElementById('sessions-toggle-btn').addEventListener('click', openSidebar);
    document.getElementById('close-sidebar-btn').addEventListener('click', closeSidebar);

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
