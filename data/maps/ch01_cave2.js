// 地图 · ch01_cave2 郯城山窟（第一章野外迷宫 18×13；入口在郯城野外南缘山地）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch01_cave2"] = {
  name: "郯城山窟",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "RFFFFFRFFRFFFFFFFR",
    "RRRRFRRFRRFRRRFRRR",
    "RFFFFFFFFFFFFFFFFR",
    "RRRFRRRFRRRRFRRRRR",
    "RFFFFFFFFRFFFFFFFR",
    "RFRRRRRFRRRFRRRRFR",
    "RFFFFFFFFFFFFFFFFR",
    "RRRRFRRRRRFRRRFRRR",
    "RFFFFFFFFFFFFFFFFR",
    "RFRRRRRFRRRRRRFRRR",
    "RFFFFFFFFFFFFFFFFR",
    "RRRRRRREERRRRRRRRR",
  ],
  encounterTiles: ["F"],
  encounterRate: 0.10,
  encounterGroups: [["曹兵", "曹兵"], ["曹兵", "曹军弓手"], ["曹军什长", "曹兵"]],
  npcs: [],
  chests: [
    { x: 8,  y: 1, id: "c1", items: { "铁甲": 1 } },
    { x: 16, y: 5, id: "c2", items: { "金疮药": 1 } },
    { x: 16, y: 9, id: "c3", gold: 200 },
  ],
  transitions: [
    { x: 7, y: 12, to: { map: "ch01_field", x: 5, y: 16 } },
    { x: 8, y: 12, to: { map: "ch01_field", x: 6, y: 16 } },
  ],
  triggers: [
    // 彩蛋 · 洞中小孩（一次性：带走则小豆子入后备）
    { x: 7, y: 1, if: { flag: "cave_boy", not: "done" },
      do: [{ say: "ch01.caveChild" },
           { ask: { title: "带上这孩子？", options: [
             { label: "带上他，吃馒头去",
               do: [{ say: "ch01.caveTake" }, { joinBench: "小豆子" },
                    { set: { cave_boy: "done" } },
                    { toast: "小豆子加入了队伍（后备）" }] },
             { label: "自身难保，转身离开",
               do: [{ say: "ch01.caveLeave" }, { set: { cave_boy: "done" } }] },
           ] } }] },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
