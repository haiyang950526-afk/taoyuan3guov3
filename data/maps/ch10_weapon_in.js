// 地图 · ch10_weapon_in 武器店（成都设施室内；店主自 ch10_chengdu 迁入，shop id 不变）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_weapon_in"] = {
  name: "武器店",
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
    { id: "weapon", x: 4, y: 2, color: "#8a93a8", name: "武器店老板", shop: "ch10_weapon" },
    { id: "helper", x: 1, y: 3, color: "#7a8a9a", name: "店小二",
      lines: ["买了兵器，要去菜单→装备里给好汉佩上，才算数。"] },
  ],
  chests: [],
  transitions: [
    { x: 7, y: 9, to: { map: "ch10_chengdu", x: 12, y: 5 } },
    { x: 8, y: 9, to: { map: "ch10_chengdu", x: 12, y: 5 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
