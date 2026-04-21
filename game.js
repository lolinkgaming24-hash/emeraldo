const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1000 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

let p1, p2, cursors, wasd, controls = {};
let gameState = 'MENU';
let mode = 1; // 1 = CPU, 2 = PvP
let timerText, gameStarted = false;

function preload() {
    // Assets would be loaded here. Using Graphics for sprites below.
}

function create() {
    this.cameras.main.setBackgroundColor('#1a1a1a');
    setupMenu.call(this);
}

// --- CHARACTER DATA ---
const CLASSES = {
    Swordman: { color: 0x3498db, skillName: 'Slash', damage: 15, charge: 0 },
    Gunman: { color: 0xe74c3c, skillName: 'Snipe', damage: 20, charge: 1500 },
    Bomber: { color: 0xf1c40f, skillName: 'Explode', damage: 15, charge: 0 },
    Digger: { color: 0x95a5a6, skillName: 'Dig', damage: 10, charge: 0 },
    Engineer: { color: 0x9b59b6, skillName: 'Sentry', damage: 12, charge: 0 }
};

function setupMenu() {
    let title = this.add.text(400, 150, 'STICKMAN BRAWLER', { fontSize: '64px', fountWeight: 'bold' }).setOrigin(0.5);
    let btn1 = createButton(this, 400, 250, '1 PLAYER (vs CPU)', () => startCharSelect.call(this, 1));
    let btn2 = createButton(this, 400, 320, '2 PLAYERS (Local)', () => startCharSelect.call(this, 2));
}

function startCharSelect(m) {
    mode = m;
    this.children.removeAll();
    this.add.text(400, 50, 'SELECT YOUR CHARACTER', { fontSize: '32px' }).setOrigin(0.5);

    Object.keys(CLASSES).forEach((key, i) => {
        let xPos = 150 + (i * 125);
        let btn = createButton(this, xPos, 220, key, () => initMatch.call(this, key));
        // Simple sprite preview
        this.add.circle(xPos, 160, 20, CLASSES[key].color);
    });
}

function initMatch(p1Selection) {
    this.children.removeAll();
    
    // Create Ground
    let ground = this.add.rectangle(400, 440, 2000, 40, 0x333333);
    this.physics.add.existing(ground, true);

    // Initialize Players
    p1 = createPlayer(this, 200, 300, p1Selection, false);
    let p2Class = mode === 1 ? Object.keys(CLASSES)[Math.floor(Math.random()*5)] : p1Selection; 
    p2 = createPlayer(this, 600, 300, p2Class, mode === 1);

    this.physics.add.collider(p1, ground);
    this.physics.add.collider(p2, ground);

    // UI & Controls
    setupUI.call(this);
    setupMobileControls.call(this);
    
    // 3 Second Countdown
    let count = 3;
    let cdText = this.add.text(400, 200, '3', { fontSize: '80px' }).setOrigin(0.5);
    let timer = setInterval(() => {
        count--;
        cdText.setText(count);
        if(count <= 0) {
            cdText.destroy();
            gameStarted = true;
            clearInterval(timer);
        }
    }, 1000);
}

function createPlayer(scene, x, y, type, isCPU) {
    let container = scene.add.container(x, y);
    let bodyCircle = scene.add.circle(0, 0, 20, CLASSES[type].color);
    let head = scene.add.circle(0, -25, 12, CLASSES[type].color);
    container.add([bodyCircle, head]);
    
    scene.physics.world.enable(container);
    container.body.setCollideWorldBounds(true).setBounce(0.1);
    
    container.hp = 100;
    container.charType = type;
    container.isCPU = isCPU;
    container.isBlocking = false;
    container.skillReady = true;
    container.lastDir = 1; // 1 for right, -1 for left

    return container;
}

function update(time, delta) {
    if (!gameStarted) return;

    handleInput(p1, 'WASD');
    if (p2.isCPU) handleAI(p2, p1, time);
    else handleInput(p2, 'ARROWS');

    // Health Bar Updates
    this.p1Bar.width = p1.hp * 2;
    this.p2Bar.width = p2.hp * 2;

    // Dynamic Camera Zoom
    let dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    let zoomTarget = Phaser.Math.Clamp(1.2 - (dist / 1000), 0.6, 1.1);
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, zoomTarget, 0.05));
    this.cameras.main.centerOn((p1.x + p2.x)/2, (p1.y + p2.y)/2 - 50);
}

// --- COMBAT LOGIC ---
function useSkill(user, target, scene) {
    if (!user.skillReady || user.isBlocking) return;
    user.skillReady = false;

    if (user.charType === 'Swordman') {
        // Dash Attack
        scene.tweens.add({
            targets: user,
            x: user.x + (user.lastDir * 100),
            duration: 200,
            onComplete: () => checkHit(user, target, 15, 60)
        });
    } else if (user.charType === 'Bomber') {
        // Self-damage and AOE
        user.hp -= 5;
        let boom = scene.add.circle(user.x, user.y, 80, 0xffa500, 0.5);
        if(Phaser.Math.Distance.Between(user.x, user.y, target.x, target.y) < 80) {
            applyDamage(target, 15);
            target.body.setVelocityY(-200); // Stun/Knockback
        }
        setTimeout(() => boom.destroy(), 200);
    } else if (user.charType === 'Digger') {
        // Invulnerability
        user.alpha = 0.3;
        user.isInvulnerable = true;
        setTimeout(() => { user.alpha = 1; user.isInvulnerable = false; }, 3000);
    }

    // Cooldown logic
    setTimeout(() => { user.skillReady = true; }, 10000);
}

function applyDamage(target, amt) {
    if (target.isBlocking) amt *= 0.2;
    if (target.isInvulnerable) amt = 0;
    target.hp = Math.max(0, target.hp - amt);
}

// --- AI LOGIC ---
function handleAI(cpu, player, time) {
    let dist = Math.abs(cpu.x - player.x);
    
    // Move toward player
    if (dist > 60) {
        cpu.body.setVelocityX(player.x > cpu.x ? 120 : -120);
    } else {
        cpu.body.setVelocityX(0);
        // Attack if close
        if (Math.random() > 0.95) checkHit(cpu, player, 5, 40);
    }

    // Use skill if ready
    if (cpu.skillReady && dist < 100) useSkill(cpu, player, cpu.scene);
}

// Helper: Hit Detection
function checkHit(attacker, target, damage, range) {
    if (Phaser.Math.Distance.Between(attacker.x, attacker.y, target.x, target.y) < range) {
        applyDamage(target, damage);
    }
}

// Helper: Button Creator
function createButton(scene, x, y, text, callback) {
    let b = scene.add.text(x, y, text, { backgroundColor: '#444', padding: 10 })
        .setOrigin(0.5).setInteractive()
        .on('pointerdown', callback);
    return b;
}

function setupUI() {
    this.add.text(20, 20, 'P1');
    this.p1Bar = this.add.rectangle(45, 25, 200, 20, 0x00ff00).setOrigin(0, 0.5);
    this.add.text(780, 20, 'P2').setOrigin(1,0);
    this.p2Bar = this.add.rectangle(755, 25, 200, 20, 0xff0000).setOrigin(1, 0.5);
}

function setupMobileControls() {
    // Add logic here to draw circles on bottom left/right 
    // and bind them to player.body.setVelocity
}
