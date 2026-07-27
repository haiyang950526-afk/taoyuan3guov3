// 地图 · ch00_cave3 藏宝山洞（序章野外 12×9；洞口传送需 tavern_clue：酒馆樗蒲首次全白后生效）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch00_cave3"] = {
  name: "藏宝山洞",
  grid: [
    "RRRRRRRRRRRR",
    "RFFFFFRFFFFR",
    "RRFRRRRRFRRR",
    "RFFFFFFFFFFR",
    "RRRRFRRRRFRR",
    "RFFFFFFFRFFR",
    "RRRRRRFRRFRR",
    "RFFFFEEFFFFR",
    "RRRRRFFRRRRR",
  ],
  encounterTiles: [],
  npcs: [],
  chests: [
    { x: 10, y: 1, id: "c1", gold: 150 },
    { x: 10, y: 5, id: "c2", gold: 150 },
    { x: 1,  y: 1, id: "c3", gold: 100 },
    { x: 1,  y: 5, id: "c4", items: { "草药": 2 } },
  ],
  transitions: [
    { x: 5, y: 7, to: { map: "ch00_field", x: 2, y: 16 } },
    { x: 6, y: 7, to: { map: "ch00_field", x: 3, y: 16 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
