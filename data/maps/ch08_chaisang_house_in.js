// 地图 · ch08_chaisang_house_in 民房（柴桑民居室内；16×10 统一规格，宝箱已启用）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch08_chaisang_house_in"] = {
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
      lines: ["柴桑临江，东吴水师常在江上演习，楼船一眼望不到头。"] },
  ],
  chests: [
    { x: 14, y: 1, id: "c1", gold: 500 },
  ], // 宝箱已启用
  transitions: [
    // 门口：回柴桑（落在民房门旁一格，不踩入口 transition）
    { x: 7, y: 9, to: { map: "ch08_chaisang", x: 4, y: 16 } },
    { x: 8, y: 9, to: { map: "ch08_chaisang", x: 4, y: 16 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
