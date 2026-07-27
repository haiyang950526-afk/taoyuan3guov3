// 地图 · ch09_guiyang_house_in 民房（桂阳民居室内；16×10 统一规格，宝箱已启用）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch09_guiyang_house_in"] = {
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
      lines: ["桂阳山清水秀，一到秋天，桂花香飘十里。"] },
  ],
  chests: [
    { x: 14, y: 1, id: "c1", items: { "还魂丹": 2 } },
  ], // 宝箱已启用
  transitions: [
    // 门口：回桂阳（落在民房门旁一格，不踩入口 transition）
    { x: 7, y: 9, to: { map: "ch09_guiyang", x: 4, y: 16 } },
    { x: 8, y: 9, to: { map: "ch09_guiyang", x: 4, y: 16 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
