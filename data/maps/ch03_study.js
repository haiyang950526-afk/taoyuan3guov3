// 地图 · ch03_study 荀彧书房（渡魂记 · 第三章：煮酒之后可入，一次性调查得荀彧的残信）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch03_study"] = {
  name: "荀彧书房",
  grid: [
    "BBBBBBBB",
    "BLLLLLLB",
    "BLLLLLLB",
    "BLLLLLLB",
    "BLLLLLLB",
    "BBBB,,BB",
  ],
  encounterTiles: [],
  npcs: [],
  chests: [],
  triggers: [
    // 渡魂记 · 第三章：书案上的残信（一次性调查）
    { x: 4, y: 2, if: { flag: "relic_xin", not: true },
      do: [{ say: "ch03.dhStudy" }, { give: ["荀彧的残信", 1] },
           { set: { relic_xin: true } }] },
  ],
  transitions: [
    { x: 4, y: 5, to: { map: "ch03_xudu", x: 7, y: 15 } },
    { x: 5, y: 5, to: { map: "ch03_xudu", x: 7, y: 15 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
