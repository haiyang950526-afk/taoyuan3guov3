// 地图 · ch07_changban 长坂坡（第七章大战场：赵云分线，连闯五阵）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch07_changban"] = {
  name: "长坂坡",
  grid: [
    "RRRRRRRRRRRRRRRRRRRRRRRR",
    "R...T......T......T....R",
    "G,,,,,,,,,,,,,,,,,,,,,,G",
    "R..T......T.......T....R",
    "R......................R",
    "R.....T......T.....T...R",
    "R......................R",
    "R..T....T.......T......R",
    "R......................R",
    "R......T.......T.......R",
    "R......................R",
    "R..T........T......T...R",
    "R......................R",
    "R.....T........T.......R",
    "R......................R",
    "RRRRRRRRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["曹军残兵"], ["博望曹军", "曹军残兵"]],
  npcs: [
    // 渡魂记 · 第七章：难民群中的老妪（第四件遗物；竹简也在手则追加集齐共鸣）
    { id: "laoyu", x: 2, y: 4, color: "#9a8a7a", name: "老妪",
      appearIf: { flag: "relic_mupai", exists: true },
      branches: [
        { if: { flag: "relic_bailian", exists: true },
          say: ["老妪：花给你了，老婆子就放心喽。替她……好好看看以后的洛阳。"] },
        { if: { flag: "relic_zhujian", exists: true },
          say: "ch07.dhGranny",
          do: [{ give: ["干枯的白莲", 1] }, { set: { relic_bailian: true } },
               { say: "ch07.dhAll" }] },
        { if: { flag: "relic_xin", exists: true },
          say: "ch07.dhGranny",
          do: [{ give: ["干枯的白莲", 1] }, { set: { relic_bailian: true } }] },
        { say: ["老妪：逃难的人啊，一茬接一茬……将军，珍重。"] },
      ] },
  ],
  chests: [],
  triggers: [
    // 赵云单骑救主：分线 + 五连战（末阵虎豹骑双波）
    { x: 10, y: 2, if: { flag: "q7", is: "changban" },
      do: [{ partySwap: { members: ["赵云"] } },
           { battle: "ch07_cb1",
             onWin: [{ say: "ch07.dangyang" }, { giveEquip: "丈八蛇矛" },
                     { warp: { map: "ch07_hanjin", x: 1, y: 6 } }] }] },
    { x: 11, y: 2, if: { flag: "q7", is: "changban" },
      do: [{ partySwap: { members: ["赵云"] } },
           { battle: "ch07_cb1",
             onWin: [{ say: "ch07.dangyang" }, { giveEquip: "丈八蛇矛" },
                     { warp: { map: "ch07_hanjin", x: 1, y: 6 } }] }] },
    { x: 12, y: 2, if: { flag: "q7", is: "changban" },
      do: [{ partySwap: { members: ["赵云"] } },
           { battle: "ch07_cb1",
             onWin: [{ say: "ch07.dangyang" }, { giveEquip: "丈八蛇矛" },
                     { warp: { map: "ch07_hanjin", x: 1, y: 6 } }] }] },
  ],
  transitions: [
    { x: 0, y: 2, to: { map: "ch06_field", x: 10, y: 15 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
