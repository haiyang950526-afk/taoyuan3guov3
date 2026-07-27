// 地图 · ch02_armor_in 防具店（小沛设施室内；店主自 ch02_xiaopei 迁入，shop id 不变）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch02_armor_in"] = {
  name: "防具店",
  grid: [
    "BBBBBBBBBBBBBBBB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLBBBBBB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BBBBLLBLLLcttcLB",
    "BLLLLLLLLLLLLLLB",
    "BLLLLLLLLLLLLLLB",
    "BBBBBBB,,BBBBBBB",
  ],
  encounterTiles: [],
  npcs: [
    { id: "armor", x: 4, y: 2, color: "#b08a5a", name: "防具店老板", shop: "ch02_armor" },
    { id: "helper", x: 1, y: 3, color: "#7a8a9a", name: "店小二",
      lines: ["衣甲盔盾配齐全，上阵才扛得住刀砍箭射。"] },
  ],
  chests: [],
  transitions: [
    { x: 7, y: 9, to: { map: "ch02_xiaopei", x: 15, y: 5 } },
    { x: 8, y: 9, to: { map: "ch02_xiaopei", x: 15, y: 5 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
