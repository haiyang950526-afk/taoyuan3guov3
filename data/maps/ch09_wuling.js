// 地图 · ch09_wuling 武陵（第九章：Boss 金旋）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch09_wuling"] = {
  name: "武陵",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#....................#",
    "#..BB......BB.....T..#",
    "#..DB......DB........#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#...T...,,.....T.....#",
    "#.......,,...........#",
    "#.......,,...........#",
    "#..BB...,,.BB.....T..#",
    "#..DB...,,.DB........#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#.....T...,,.T.......#",
    "#.........,,.........#",
    "#.........,,.........#",
    "#....T....,,.T.......#",
    "#.........,,.........#",
    "##########GG##########",
  ],
  encounterTiles: [],
  // 建筑招牌（画在顶部居中的 B 格上）
  signs: [
    { x: 3, y: 3, text: "客", color: "#ffd166" },
    { x: 11, y: 3, text: "武", color: "#ffd166" },
    { x: 3, y: 9, text: "药", color: "#ffd166" },
  ],
  npcs: [
    // 城门口告示牌（南门内侧路旁）
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是武陵。",
              "南门出去是荆南北野；北门通荆南南野（时机未到暂不能通行）。",
              "西街：旅店·杂货店　东街：武器店"] },
    { id: "inn",    x: 4,  y: 5,  color: "#c98a4b", name: "旅店老板",   shop: "ch09_inn" },
    { id: "weapon", x: 12, y: 5,  color: "#8a93a8", name: "武器店老板", shop: "ch09_weapon" },
    { id: "item",   x: 4,  y: 11, color: "#7ee2a0", name: "杂货店老板", shop: "ch09_item" },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["金太守弃城而逃，武陵百姓总算松了口气。", "长沙韩玄苛暴，黄老将军却是条好汉。"] },
    // Boss：金旋（张飞取武陵）
    { id: "jinxuan", x: 10, y: 1, color: "#6a5a3a", name: "金旋",
      boss: "ch09_wuling",
      appearIf: { flag: "q9", is: "guiyang" },
      onWin: [{ set: { q9: "wuling" } }, { toast: "武陵已定，东取长沙（东门）" }] },
  ],
  chests: [
    { x: 18, y: 14, id: "w1", items: { "返魂香": 1 } },
  ],
    transitions: [
    { x: 10, y: 17, to: { map: "ch09_field_n", x: 10, y: 1 } },
    { x: 11, y: 17, to: { map: "ch09_field_n", x: 10, y: 1 } },
    { x: 10, y: 0,  if: { flag: "q9", is: "wuling" }, to: { map: "ch09_field_s", x: 1, y: 8 } },
    { x: 11, y: 0,  if: { flag: "q9", is: "wuling" }, to: { map: "ch09_field_s", x: 1, y: 8 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 11, y: 11, face: [0, -1], to: { map: "ch09_wuling_house_in", x: 7, y: 8 } },
    { x: 12, y: 11, face: [0, -1], to: { map: "ch09_wuling_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
