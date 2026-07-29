// 地图 · ch06b_inn_in 襄阳旅店（设施室内；店主原在襄阳城露天摆摊，已迁入）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch06b_inn_in"] = {
  name: "旅店",
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
    { id: "inn", x: 4, y: 2, color: "#c98a4b", name: "旅店老板", shop: "ch06b_inn" },
    { id: "helper", x: 1, y: 3, color: "#7a8a9a", name: "店小二",
      lines: ["客房都打扫过了，客官安心歇脚。"] },
  ],
  chests: [],
  transitions: [
    { x: 7, y: 9, to: { map: "ch06_xiangyang", x: 3, y: 6 } },
    { x: 8, y: 9, to: { map: "ch06_xiangyang", x: 3, y: 6 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
