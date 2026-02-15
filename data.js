// data.js
const TYPE_CHART = {
    "Fire":  { "Grass": 2, "Water": 0.5, "Rock": 0.5, "Fire": 0.5 },
    "Water": { "Fire": 2, "Rock": 2, "Grass": 0.5, "Water": 0.5 },
    "Grass": { "Water": 2, "Rock": 2, "Fire": 0.5, "Grass": 0.5 },
    "Rock":  { "Fire": 2, "Grass": 0.5, "Water": 0.5, "Flying": 2 },
    "Flying":{ "Grass": 2, "Rock": 0.5, "Electric": 0.5 },
    "Normal":{} // Neutral
};

const BOSSES = [
    { id: 0, name: "Leader Roxanne", type: "Rock",  hp: 60,  maxHp: 60,  lvl: 12, x: 100, y: 30,  defeated: false },
    { id: 1, name: "Leader Brawly",  type: "Rock",  hp: 90,  maxHp: 90,  lvl: 18, x: 200, y: 60,  defeated: false },
    { id: 2, name: "Leader Wattson", type: "Fire",  hp: 120, maxHp: 120, lvl: 24, x: 100, y: 120, defeated: false },
    { id: 3, name: "Leader Flannery",type: "Fire",  hp: 160, maxHp: 160, lvl: 29, x: 30,  y: 60,  defeated: false },
    { id: 4, name: "Elite Drake",    type: "Grass", hp: 220, maxHp: 220, lvl: 45, x: 120, y: 70,  defeated: false, isElite: true },
    { id: 5, name: "Elite Steven",   type: "Water", hp: 300, maxHp: 300, lvl: 55, x: 200, y: 130, defeated: false, isElite: true }
];

const PLAYER_MOVES = [
    { name: "Ember", type: "Fire", power: 40 },
    { name: "Bubble", type: "Water", power: 40 },
    { name: "Vine Whip", type: "Grass", power: 40 }
];
