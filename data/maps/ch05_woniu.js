// 地图 · ch05_woniu 卧牛山（第五章：裴元绍；战后赵云登场归队）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch05_woniu"] = {
  name: "卧牛山",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R...T......T...R",
    "G..............R",
    "R..T......T....R",
    "R..............#",
    "R.T....T....T..#",
    "R..............G",
    "R....T.........#",
    "R...........T..#",
    "R..T...........R",
    "R........T.....R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.11,
  encounterGroups: [["黄巾残党"], ["黄巾残党", "黄巾残党"]],
  npcs: [
    { id: "peiyuan", x: 12, y: 1, color: "#8a6a2a", name: "裴元绍",
      boss: "ch05_peiyuan",
      appearIf: { flag: "q5", is: "sunqian" },
      onWin: [{ say: "ch05.zhaoyunJoin" }, { join: "赵云" }, { set: { q5: "zhaoyun" } },
              { toast: "赵云同行！东出山口往古城" }] },
    // 桥段 mt4 · 童渊试枪：赵云入队后现身山道旁，一次性（B案赠铁枪）
    { id: "tongyuan", x: 2, y: 10, color: "#c8c8d8", name: "白髯老翁",
      appearIf: { flag: "q5", in: ["zhaoyun", "gucheng", "done"] },
      branches: [
        { if: { flag: "mt4", is: "done" }, say: "ch05.mt4After" },
        { say: "ch05.mt4Meet",
          do: [{ say: "ch05.mt4Talk" }, { giveEquip: "铁枪" },
               { set: { mt4: "done" } }] },
      ] },
  ],
  chests: [
    { x: 8, y: 10, id: "w1", items: { "还魂丹": 1 } },
  ],
  transitions: [
    { x: 0,  y: 2, to: { map: "ch05_ferry", x: 16, y: 8 } },
    { x: 15, y: 6, if: { flag: "q5", is: "zhaoyun" }, to: { map: "ch05_gucheng", x: 1, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
