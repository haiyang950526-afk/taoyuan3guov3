// 地图 · ch10_dingjun 定军山（第十章末：黄忠斩夏侯渊 Boss 连战）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_dingjun"] = {
  name: "定军山",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "R....T......T....R",
    "R................R",
    "R..T..........T..R",
    "R................R",
    "R................R",
    "#....T......T....R",
    "#................R",
    "G,,,,,,,,,,,,,,,.R",
    "#................R",
    "#..T..........T..R",
    "R................R",
    "R....T......T....R",
    "RRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["蜀军名将"], ["西川兵", "蜀军名将"]],
  npcs: [
    // 夏侯渊（连战：张郃）
    { id: "xiahouyuan", x: 15, y: 8, color: "#4a3a2a", name: "夏侯渊",
      boss: "ch10_dingjun",
      appearIf: { flag: "q10", is: "chengdu" },
      onWin: [{ say: "ch10.dingjunDone" }, { say: "ch10.chapterEnd" },
              { set: { q10: "done" } }, { say: "ch11.intro" },
              { warp: { map: "ch10_chengdu", x: 10, y: 16 } },
              { toast: "回成都休整——北方似乎有信使候着" }] },
  ],
  chests: [
    { x: 2, y: 2, id: "d1", items: { "精铁": 2 } },
  ],
  transitions: [
    { x: 0, y: 8, to: { map: "ch10_chengdu", x: 20, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
