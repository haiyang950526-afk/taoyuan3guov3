// 地图 · ch02_xiaopei_house_in 民房（小沛民居室内；16×10 统一规格，预留宝箱位暂空）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch02_xiaopei_house_in"] = {
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
      lines: ["小沛城小，却是兵家必争之地，城里常住着来往的军爷。"] },
  ],
  chests: [], // 预留宝箱位（未来支线用）
  transitions: [
    // 门口：回小沛（落在民房门旁一格，不踩入口 transition）
    { x: 7, y: 9, to: { map: "ch02_xiaopei", x: 4, y: 16 } },
    { x: 8, y: 9, to: { map: "ch02_xiaopei", x: 4, y: 16 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
