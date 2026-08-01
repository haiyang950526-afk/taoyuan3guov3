// 地图 · ch08_xiakou 夏口（第八章：乌林追击战）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch08_xiakou"] = {
  name: "夏口",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "R....T......T....R",
    "R................R",
    "R................R",
    "R..T..........T..R",
    "R................R",
    "R................R",
    "R....T......T....R",
    "G,,,,,,,,,,,,,,,,G",
    "R................R",
    "R..T..........T..R",
    "RRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["乌林残军"], ["乌林残军", "水军校尉"]],
  npcs: [
    // 开放式选择 · 军令状（12-A）：乌林追击后、华容道前
    { id: "zhuge8", x: 7, y: 5, color: "#e8e8f0", name: "诸葛亮",
      appearIf: { flag: "q8", is: "wulin" },
      hideIf: { flag: "hr_pledge", exists: true },
      branches: [
        { say: "ch08.lingzhuang",
          ask: { title: "军令状？", options: [
            { label: "拿不下曹操，甘当军令！",
              say: "ch08.pledgeYes",
              do: [{ set: { hr_pledge: 1 } }] },
            { label: "……军师似乎话里有话？",
              say: "ch08.pledgeNo",
              do: [{ set: { hr_pledge: 0 } }] },
          ] } },
      ] },
    { id: "inn", x: 5, y: 5, color: "#c98a4b", name: "旅店老板", shop: "ch08_inn" },
  ],
  chests: [
    { x: 2, y: 2, id: "x1", items: { "仙草露": 1 } },
  ],
  triggers: [
    // 乌林追击战
    { x: 12, y: 8, if: { flag: "q8", is: "chibi" },
      do: [{ battle: "ch08_wulin",
             onWin: [{ say: "ch08.wulinDone" }, { set: { q8: "wulin" } },
                     { toast: "赶往华容道（东门）" }] }] },
    { x: 13, y: 8, if: { flag: "q8", is: "chibi" },
      do: [{ battle: "ch08_wulin",
             onWin: [{ say: "ch08.wulinDone" }, { set: { q8: "wulin" } },
                     { toast: "赶往华容道（东门）" }] }] },
  ],
  transitions: [
    { x: 0,  y: 8, to: { map: "ch08_chaisang", x: 20, y: 8 } },
    { x: 17, y: 8, if: { flag: "q8", is: "wulin" }, to: { map: "ch08_huarong", x: 1, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
