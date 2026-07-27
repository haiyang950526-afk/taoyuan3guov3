// 地图 · ch00_city_house_in 民房（徐州城民居室内；16×10 统一规格，宝箱已启用）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch00_city_house_in"] = {
  name: "民房",
  grid: [
    "BBBBBBBBBBBBBBBB",
    "BrLLLLBbbLLLLLLB",
    "BrLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BBBBLLBLLLctcLLB",
    "BLLLLLLLLLLLLLLB",
    "BLLLLLLLLLLLLLLB",
    "BBBBBBB,,BBBBBBB",
  ],
  encounterTiles: [],
  npcs: [
    { id: "owner", x: 4, y: 2, color: "#9a8a6a", name: "屋主",
      lines: ["徐州地处要冲，南来北往的客商都爱在这儿歇脚。"] },
  ],
  chests: [
    { x: 14, y: 1, id: "c1", items: { "草药": 2 } },
  ], // 宝箱已启用
  transitions: [
    { x: 7, y: 9, to: { map: "ch00_city", x: 18, y: 4 } },
    { x: 8, y: 9, to: { map: "ch00_city", x: 18, y: 4 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
