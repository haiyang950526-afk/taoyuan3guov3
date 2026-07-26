// 地图 · ch00_weapon_in 武器店（徐州城设施室内；店主自 ch00_city 迁入，shop id 不变）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch00_weapon_in"] = {
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
    { id: "weapon", x: 4, y: 2, color: "#8a93a8", name: "武器店老板", shop: "ch00_weapon" },
    { id: "helper", x: 1, y: 3, color: "#7a8a9a", name: "店小二",
      lines: ["买了装备，要去菜单→装备里给好汉穿戴整齐，才算配上。"] },
  ],
  chests: [],
  triggers: [
    // 渡魂记 · 序章：武器店铺垫（老板 shop 字段优先于 branches，
    // 故用地面触发器实现一次性氛围对话，不影响开店——同旅店 D7 写法）
    { x: 7, y: 8, if: { flag: "dhShop", not: "done" },
      do: [{ say: "ch00.dhShop" }, { set: { dhShop: "done" } }] },
  ],
  transitions: [
    { x: 7, y: 9, to: { map: "ch00_city", x: 16, y: 9 } },
    { x: 8, y: 9, to: { map: "ch00_city", x: 16, y: 9 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
