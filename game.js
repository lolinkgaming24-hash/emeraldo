// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let state = "EXPLORE"; 
let player = { x: 20, y: 80, hp: 100, maxHp: 100, badges: 0 };
let activeBoss = null;

// --- INITIALIZATION & SAVE ---
function init() {
    const saved = localStorage.getItem('emerald_hack_save');
    if (saved) {
        const d = JSON.parse(saved);
        player = { ...player, x: d.x, y: d.y, badges: d.badges };
        d.defeatedList.forEach((def, i) => BOSSES[i].defeated = def);
    }
    render();
}

function save() {
    const data = { 
        x: player.x, y: player.y, badges: player.badges, 
        defeatedList: BOSSES.map(b => b.defeated) 
    };
    localStorage.setItem('emerald_hack_save', JSON.stringify(data));
}

// --- MOVEMENT & COLLISION ---
function move(dx, dy) {
    if (state !== "EXPLORE") return;
    
    // Boundary Checks (Keep player on screen)
    let nextX = player.x + dx;
    let nextY = player.y + dy;
    if (nextX < 0 || nextX > 220 || nextY < 0 || nextY > 140) return;

    player.x = nextX;
    player.y = nextY;

    // Check for Boss Encounters
    BOSSES.forEach(boss => {
        if (!boss.defeated) {
            // If it's an Elite, only fight if 4 badges are held
            if (boss.isElite && player.badges < 4) return;
            
            const dist = Math.sqrt((player.x - boss.x)**2 + (player.y - boss.y)**2);
            if (dist < 15) startBattle(boss);
        }
    });
}

// --- BATTLE SYSTEM ---
function startBattle(boss) {
    state = "BATTLE";
    activeBoss = boss;
    document.getElementById('explore-ui').style.display = 'none';
    document.getElementById('battle-ui').style.display = 'block';
    document.getElementById('msg').innerText = `Leader challenges you!`;
    updateBars();
}

function handleAttack(moveIndex) {
    if (state !== "BATTLE") return;
    const move = PLAYER_MOVES[moveIndex];
    
    // Damage Calculation
    let multiplier = (TYPE_CHART[move.type] && TYPE_CHART[move.type][activeBoss.type]) || 1;
    let damage = Math.floor(move.power * multiplier * 0.6);
    activeBoss.hp -= damage;

    document.getElementById('msg').innerText = `${move.name}! ${multiplier > 1 ? "It's super effective!" : ""}`;
    updateBars();

    if (activeBoss.hp <= 0) {
        setTimeout(victory, 1000);
    } else {
        state = "WAITING"; // Prevent spam
        setTimeout(bossTurn, 1000);
    }
}

function bossTurn() {
    let dmg = 10 + (player.badges * 4);
    player.hp -= dmg;
    document.getElementById('msg').innerText = `${activeBoss.name} attacks back!`;
    updateBars();
    
    if (player.hp <= 0) {
        alert("You whited out!");
        location.reload();
    } else {
        state = "BATTLE";
    }
}

function victory() {
    activeBoss.defeated = true;
    player.badges++;
    player.hp = player.maxHp;
    state = "EXPLORE";
    save();
    alert(`Received the Badge! Total: ${player.badges}/4`);
    document.getElementById('battle-ui').style.display = 'none';
    document.getElementById('explore-ui').style.display = 'grid';
    document.getElementById('msg').innerText = "Keep exploring!";
}

// --- UI & RENDERING ---
function updateBars() {
    document.getElementById('p-hp-bar').style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById('b-hp-bar').style.width = (activeBoss.hp / activeBoss.maxHp * 100) + "%";
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grass/Floor
    ctx.fillStyle = "#5db971";
    ctx.fillRect(0,0, 240, 160);

    // Draw Player
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, 16, 16);

    // Draw Bosses
    BOSSES.forEach(b => {
        if (!b.defeated) {
            if (b.isElite && player.badges < 4) return; // Hide Elite 2
            ctx.fillStyle = b.isElite ? "gold" : "red";
            ctx.fillRect(b.x, b.y, 16, 16);
        }
    });
    requestAnimationFrame(render);
}

init();
