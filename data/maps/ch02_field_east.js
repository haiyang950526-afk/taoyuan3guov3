// 地图 · ch02_field_east 沛县郊野（第二章野外：西通徐州城外，东通小沛；纪灵在此迎战）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch02_field_east"] = {
  name: "沛县郊野",
  grid: [
    "RRRRRRRRRRRRRRRRRRCCRRRR",
    "R...T.....T......T.....R",
    "G,,,,,,,,,.............R",
    "G.........,,,,,....T...R",
    "R..T........,,,........R",
    "R......T......,,..T....R",
    "R.............,,.......R",
    "R..T....T.....,,....T..#",
    "R..............,,......#",
    "R.....T........,,,,,,,,G",
    "R......................G",
    "R..T.......T........T..#",
    "R......................#",
    "R......T......T........R",
    "R..T...................R",
    "R........h.......T.....R",
    "R....T...s.............R",
    "RRRRRRRRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.12,
  encounterGroups: [["袁术兵"], ["袁术兵", "袁术兵"], ["袁术兵", "袁术弓手"]],
  npcs: [
    // 纪灵：报信后出现在东门外，拦路邀战
    { id: "jiling", x: 21, y: 8, color: "#a03a2a", name: "纪灵",
      boss: "ch02_boss",
      appearIf: { flag: "q2", is: "jilingCome" },
      onWin: [{ say: "ch02.sheji" }, { set: { q2: "shed" } },
              { toast: "纪灵退兵！小沛南门已开，可往下邳" }] },
  ],
  chests: [
    { x: 3, y: 13, id: "f1", items: { "草药": 3 } },
  ],
  transitions: [
    { x: 0,  y: 2,  to: { map: "ch00_field", x: 22, y: 2 } },
    { x: 0,  y: 3,  to: { map: "ch00_field", x: 22, y: 2 } },
    { x: 23, y: 9,  to: { map: "ch02_xiaopei", x: 10, y: 1 } },
    { x: 23, y: 10, to: { map: "ch02_xiaopei", x: 10, y: 1 } },
    { x: 18, y: 0,  to: { map: "ch02_cave2", x: 8, y: 11 } },
    { x: 19, y: 0,  to: { map: "ch02_cave2", x: 9, y: 11 } },
    { x: 9, y: 16, to: { map: "ch02e_village", x: 9, y: 12 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
