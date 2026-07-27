// 地图 · ch09_lingling 零陵（第九章：传檄而定，文戏）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch09_lingling"] = {
  name: "零陵",
  grid: [
    "##########GG##########",
    "#.......,,...........#",
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
  ],
  npcs: [
    // 城门口告示牌（南门内侧路旁）
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是零陵。",
              "南门出去是长沙城。",
              "城西北有旅店，可歇脚投宿。"] },
    { id: "inn",  x: 4, y: 5, color: "#c98a4b", name: "旅店老板", shop: "ch09_inn" },
    // 刘度：传檄而定
    { id: "liudu", x: 10, y: 1, color: "#b8a05a", name: "刘度",
      appearIf: { flag: "q9", is: "changsha" },
      branches: [
        { say: "ch09.lingling",
          do: [{ set: { q9: "lingling" } }, { toast: "四郡悉平！回长沙见鲁肃" }] },
      ] },
    { id: "v1", x: 7, y: 7, color: "#4f8cff", name: "市民",
      lines: ["不战而降，是全城百姓的福气。", "刘使君仁义，名不虚传。"] },
  ],
  chests: [],
    transitions: [
    { x: 10, y: 17, to: { map: "ch09_changsha", x: 10, y: 1 } },
    { x: 11, y: 17, to: { map: "ch09_changsha", x: 10, y: 1 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 11, y: 11, face: [0, -1], to: { map: "ch09_lingling_house_in", x: 7, y: 8 } },
    { x: 12, y: 11, face: [0, -1], to: { map: "ch09_lingling_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
