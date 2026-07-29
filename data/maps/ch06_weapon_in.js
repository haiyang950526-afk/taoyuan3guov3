// 地图 · ch06_weapon_in 武器店（新野城设施室内；店主自 ch06_xinye 迁入，shop id 不变）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch06_weapon_in"] = {
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
    { id: "weapon6", x: 4, y: 2, color: "#8a93a8", name: "武器店老板", shop: "ch06_weapon",
      hideIf: { flag: "q7", exists: true } },
    { id: "weapon7", x: 4, y: 2, color: "#8a93a8", name: "武器店老板", shop: "ch07_weapon",
      appearIf: { flag: "q7", exists: true } },
    { id: "book_xy", x: 11, y: 2, color: "#b8a05a", name: "文房铺老板", shop: "ch06_book" },
    { id: "helper", x: 1, y: 3, color: "#7a8a9a", name: "店小二",
      lines: ["买了兵器，要去菜单→装备里给好汉佩上，才算数。"] },
  ],
  chests: [],
  transitions: [
    { x: 7, y: 9, to: { map: "ch06_xinye", x: 13, y: 5 } },
    { x: 8, y: 9, to: { map: "ch06_xinye", x: 13, y: 5 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
