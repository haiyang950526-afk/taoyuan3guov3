// 地图 · ch03_hunt 许田猎场（第三章：minigame hunt 围猎）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch03_hunt"] = {
  name: "许田猎场",
  grid: [
    "RRRRRRRRRRRRRRRRRRRRRRRR",
    "R...T.......T......T...R",
    "R......................R",
    "R..T......T......T.....R",
    "R..........T...........R",
    "R...............T......R",
    "G......................R",
    "G.........T..........T.R",
    "R......................R",
    "R..T............T......R",
    "R.........T............R",
    "R......................R",
    "R....T........T....T...R",
    "RRRRRRRRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [],
  chests: [],
  triggers: [
    // 华容道伏笔 · 许田围猎（12-A 可选）：拦 / 不拦，都记下这口刀
    { x: 10, y: 6, if: { all: [{ flag: "q3", is: "audience" }, { flag: "hr_xutian", not: 1 }] },
      do: [{ say: "ch03.xutianAsk" },
           { ask: { title: "关羽按刀欲起——", options: [
             { label: "（刘备死死按住）二弟不可！",
               say: "ch03.xutianStop",
               do: [{ set: { hr_xutian: 1 } }] },
             { label: "（不拦）看他能怎样！",
               say: "ch03.xutianGo",
               do: [{ set: { hr_xutian: 1 } }] },
           ] } }] },
    // 围猎小游戏（20 秒射鹿，分数换赏金）
    { x: 11, y: 6, if: { flag: "q3", is: "audience" },
      do: [{ minigame: { type: "hunt" } },
           { say: "ch03.huntDone" }, { set: { q3: "hunted" } },
           { toast: "回相府赴曹操的酒宴" }] },
    { x: 12, y: 6, if: { flag: "q3", is: "audience" },
      do: [{ minigame: { type: "hunt" } },
           { say: "ch03.huntDone" }, { set: { q3: "hunted" } },
           { toast: "回相府赴曹操的酒宴" }] },
  ],
  transitions: [
    { x: 0, y: 6, to: { map: "ch03_field", x: 22, y: 8 } },
    { x: 0, y: 7, to: { map: "ch03_field", x: 22, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
