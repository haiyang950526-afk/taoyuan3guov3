// 地图 · ch00_palace 太守府大殿（徐州城内景；陶谦由 ch00_city 迁入，字段原样保留）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch00_palace"] = {
  name: "太守府",
  grid: [
    "BBBBBBBBBBB",
    "BLLLLPLLLLB",
    "BLLXL,LXLLB",
    "BLLXL,LXLLB",
    "BLLXL,LXLLB",
    "BLLXL,LXLLB",
    "BLLLL,LLLLB",
    "BLLLL,LLLLB",
    "BBBBB,BBBBB",
  ],
  encounterTiles: [],
  npcs: [
    // 陶谦：第一章起在太守府大殿宝座旁；第二章病逝剧情后不再出现
    // （自 ch00_city 整体迁入，branches/appearIf/hideIf 等字段原样未改）
    { id: "taoqian", x: 6, y: 1, color: "#b8a05a", name: "陶谦",
      appearIf: { flag: "q1", exists: true },
      hideIf: { flag: "q2", in: ["seal", "lvbu", "anzhi", "jilingCome", "shed", "lost", "done"] },
      branches: [
        { if: { flag: "q1", is: "start" }, say: "ch01.taoqianAsk",
          do: [{ set: { q1: "accepted" } }, { toast: "接取任务：驰援郯城" }] },
        { if: { flag: "q1", in: ["accepted", "ready", "patrolDone", "march"] },
          say: "ch01.taoqianWait" },
        { if: { flag: "q1", is: "yujinDone" }, say: "ch01.dhTaoqian",
          do: [{ say: "ch01.rangXuzhou" }, { set: { q1: "done" } }, { chapter: "ch02" }, { set: { q2: "start" } },
               { say: "ch02.intro" }, { toast: "第二章 · 三让徐州" }] },
        { if: { flag: "q2", is: "start" }, say: "ch02.taoqianDeath",
          do: [{ set: { q2: "seal" } }, { join: "陈登" }] },
      ] },
    { id: "guard", x: 4, y: 3, color: "#7a8a9a", name: "侍卫",
      lines: ["使君在堂上，上前答话便是。"] },
  ],
  chests: [],
  transitions: [
    { x: 5, y: 8, to: { map: "ch00_city", x: 10, y: 5 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
