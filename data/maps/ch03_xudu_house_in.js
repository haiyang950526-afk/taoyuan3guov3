// 地图 · ch03_xudu_house_in 民房（许都民居室内；16×10 统一规格，宝箱已启用）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch03_xudu_house_in"] = {
  name: "民房",
  grid: [
    "BBBBBBBBBBBBBBBB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BBBBLLBLLLcttcLB",
    "BLLLLLLLLLLLLLLB",
    "BLLLLLLLLLLLLLLB",
    "BBBBBBB,,BBBBBBB",
  ],
  encounterTiles: [],
  npcs: [
    { id: "owner", x: 4, y: 2, color: "#9a8a6a", name: "屋主",
      lines: ["许都是天子脚下，街市繁华，夜里灯火通明。"] },
  ],
  chests: [
    { x: 1,  y: 1, id: "c1", items: { "还魂丹": 1 } },
    { x: 14, y: 1, id: "c2", gold: 250 },
  ], // 宝箱已启用
  transitions: [
    // 门口：回许都（落在民房门旁一格，不踩入口 transition）
    { x: 7, y: 9, to: { map: "ch03_xudu", x: 16, y: 13 } },
    { x: 8, y: 9, to: { map: "ch03_xudu", x: 16, y: 13 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
