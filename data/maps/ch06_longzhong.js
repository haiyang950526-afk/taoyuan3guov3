// 地图 · ch06_longzhong 隆中（第六章：竹林小迷宫，三顾茅庐）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch06_longzhong"] = {
  name: "隆中",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R..T..T..T..T..R",
    "G,,,,,,,,,,,,,,R",
    "R.T..T..T..T...R",
    "R,,,,,,,,,,,,,,R",
    "R..T..T..T..T..R",
    "R,,,,,,,,,,,,,,R",
    "R.T..T..T..T...R",
    "R,,,,,,,,,,,,,,R",
    "R..T..T..T..T..R",
    "R..............R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [
    // 草庐：三顾茅庐
    { id: "zhuge", x: 14, y: 1, color: "#e8e8f0", name: "草庐",
      branches: [
        { if: { flag: "q6", is: "gu1" }, say: "ch06.gu1",
          do: [{ set: { q6: "gu2" } }, { toast: "改日再来（二顾）" }] },
        { if: { flag: "q6", is: "gu2" }, say: "ch06.gu2",
          do: [{ set: { q6: "gu3" } }, { toast: "改日再来（三顾）" }] },
        { if: { flag: "q6", is: "gu3" }, say: "ch06.gu3",
          do: [{ join: "诸葛亮" }, { set: { q6: "done" } },
               { say: "ch07.intro" }, { chapter: "ch07" }, { set: { q7: "start" } },
               { warp: { map: "ch06_xinye", x: 10, y: 16 } },
               { toast: "第七章 · 火烧博望（军师/图鉴就绪）" }] },
      ] },
    // 桥段 mt3 · 黄承彦授阵图：三顾完成后现身草庐旁，一次性（B案赠《石阵书》）
    { id: "huangcy", x: 13, y: 1, color: "#b8a05a", name: "黄承彦",
      appearIf: { flag: "q6", is: "done" },
      branches: [
        { if: { flag: "mt3", is: "done" }, say: "ch06.mt3After" },
        { say: "ch06.mt3Meet",
          do: [{ say: "ch06.mt3Talk" }, { give: ["石阵书", 1] },
               { giveEquip: "白羽扇" }, { set: { relic_baiyushan: true } },
               { set: { mt3: "done" } }] },
      ] },
  ],
  chests: [
    { x: 1, y: 10, id: "l1", items: { "石阵书": 1 } },
  ],
  transitions: [
    { x: 0, y: 2, to: { map: "ch06_field", x: 22, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
