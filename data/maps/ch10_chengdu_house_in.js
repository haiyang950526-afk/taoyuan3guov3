// 地图 · ch10_chengdu_house_in 民房（成都民居室内；16×10 统一规格，宝箱已启用）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_chengdu_house_in"] = {
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
      lines: ["成都天府之国，锦官城里蜀锦名动天下。"] },
  ],
  chests: [
    { x: 1,  y: 1, id: "c1", items: { "仙草露": 1 } },
    { x: 14, y: 1, id: "c2", gold: 800 },
  ], // 宝箱已启用
  transitions: [
    // 门口：回成都（落在民房门旁一格，不踩入口 transition）
    { x: 7, y: 9, to: { map: "ch10_chengdu", x: 4, y: 16 } },
    { x: 8, y: 9, to: { map: "ch10_chengdu", x: 4, y: 16 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
