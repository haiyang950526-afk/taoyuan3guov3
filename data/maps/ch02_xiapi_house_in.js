// 地图 · ch02_xiapi_house_in 民房（下邳城民居室内；16×10 统一规格，宝箱已启用）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch02_xiapi_house_in"] = {
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
      branches: [
        // 名品 · 易经（wh6）：屋主追加一段，赠家传《易经》
        { if: { flag: "wh6", is: "done" }, say: "ch02.xpHouseDone" },
        { say: ["下邳临着泗水，水运便利，城里铁匠铺的手艺远近闻名。"],
          do: [{ say: "ch02.xpHouse2" }, { giveEquip: "易经" },
               { set: { wh6: "done" } }, { set: { relic_yijing: true } }] },
      ] },
  ],
  chests: [
    { x: 14, y: 1, id: "c1", gold: 120 },
  ], // 宝箱已启用
  transitions: [
    // 门口：回下邳城（落在民房门旁一格，不踩入口 transition）
    { x: 7, y: 9, to: { map: "ch02_xiapi", x: 3, y: 16 } },
    { x: 8, y: 9, to: { map: "ch02_xiapi", x: 3, y: 16 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
