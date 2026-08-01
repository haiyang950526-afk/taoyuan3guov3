// 地图 · ch06_tunnel 襄阳地道（第六章：蔡瑁设宴伏杀，刘备从地道突围往檀溪；小迷宫，有伏兵与宝箱）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch06_tunnel"] = {
  name: "地道",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "RFRFFFRFFFRFFFFFRR",
    "RFRFRFRFRFRFRFRFRR",
    "RFRFRFRFRFRFFFRFRR",
    "RFRFRFRFRFRRRFRFRR",
    "RFFFRFFFRFRFFFRFRR",
    "RRRRRRRFRFRFRRRFRR",
    "RFFFFFFFRFFFRFRFRR",
    "RFRRRFRRRRRFRFRFFR",
    "RCFFRFFFFFFFFFFFER",
    "RRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["F"],
  encounterRate: 0.14,
  encounterGroups: [["曹军先锋", "曹军先锋"], ["曹军什长", "曹军先锋"], ["曹军虎卫"]],
  npcs: [],
  chests: [
    { x: 3, y: 1, id: "t1", items: { "金疮药": 2 } },
    { x: 15, y: 5, id: "t2", items: { "钢剑": 1 } },
    { x: 7, y: 9, id: "t3", items: { "还魂丹": 1 } },
  ],
  transitions: [
    // 西口：回襄阳（宴席已散，不宜久留）
    { x: 1, y: 9, to: { map: "ch06_xiangyang", x: 10, y: 4 } },
    // 东口：出地道往檀溪渡口
    { x: 16, y: 9, to: { map: "ch06_tanxi", x: 1, y: 6 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
