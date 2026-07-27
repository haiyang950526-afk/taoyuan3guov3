// 地图 · ch03_armor_in 防具店（许都设施室内；店主自 ch03_xudu 迁入，shop id 不变）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch03_armor_in"] = {
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
    { id: "armor", x: 4, y: 2, color: "#b08a5a", name: "防具店老板", shop: "ch03_armor" },
    { id: "helper", x: 1, y: 3, color: "#7a8a9a", name: "店小二",
      lines: ["衣甲盔盾配齐全，上阵才扛得住刀砍箭射。"] },
  ],
  chests: [],
  transitions: [
    { x: 7, y: 9, to: { map: "ch03_xudu", x: 16, y: 9 } },
    { x: 8, y: 9, to: { map: "ch03_xudu", x: 16, y: 9 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
