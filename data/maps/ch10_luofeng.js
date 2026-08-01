// 地图 · ch10_luofeng 落凤坡（第十章：固定败战——庞统之殁）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_luofeng"] = {
  name: "落凤坡",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R....R......R..R",
    "R....R..T...R..R",
    "R.T..R......R..R",
    "R....R..T...R..R",
    "R....R......R..R",
    "G,,,,,,,,,,,,,,R",
    "R....R......R..R",
    "R..T.R..T...R..R",
    "R....R......R..R",
    "R....R......T..R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [],
  chests: [],
  triggers: [
    // 中伏 · 借的卢支（pt_horse=1）：白马替主——历史殒命线，的卢马同殁
    { x: 12, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", is: 1 }] },
      do: [{ say: "ch10.ambushHorse" }, { battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongDeath" },
                      { say: ["（白马与主，同殁于坡。'妨主'之言，应验在马身上。）"] },
                      { take: ["的卢马", 1] }, { leave: "庞统" },
                      { set: { q10: "luofeng" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "化悲痛为力量——再攻雒城！" }] }] },
    { x: 13, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", is: 1 }] },
      do: [{ say: "ch10.ambushHorse" }, { battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongDeath" },
                      { say: ["（白马与主，同殁于坡。'妨主'之言，应验在马身上。）"] },
                      { take: ["的卢马", 1] }, { leave: "庞统" },
                      { set: { q10: "luofeng" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "化悲痛为力量——再攻雒城！" }] }] },
    // 中伏 · 不借支：伤而不死 → 寻药 arc
    { x: 12, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", not: 1 }] },
      do: [{ battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongWounded" }, { set: { pt_save: "start" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "庞统命悬一线——快随军医官救治！" }] }] },
    { x: 13, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", not: 1 }] },
      do: [{ battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongWounded" }, { set: { pt_save: "start" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "庞统命悬一线——快随军医官救治！" }] }] },
  ],
  transitions: [
    { x: 0, y: 6, to: { map: "ch10_field", x: 1, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
