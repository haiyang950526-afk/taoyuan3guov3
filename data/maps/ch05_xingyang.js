// 地图 · ch05_xingyang 荥阳（第五章第四关：守将王植）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch05_xingyang"] = {
  name: "荥阳",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "R....T......T....R",
    "R................R",
    "R..T..........T..R",
    "R................R",
    "R................R",
    "R....T......T....R",
    "R................R",
    "G,,,,,,,,,,,,,,,,G",
    "R................R",
    "R..T..........T..R",
    "RRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["荥阳守军"], ["荥阳守军", "荥阳守军"]],
  npcs: [
    { id: "wangzhi", x: 15, y: 6, color: "#6a3a3a", name: "王植",
      boss: "ch05_wangzhi",
      appearIf: { flag: "q5", is: "bianxi" },
      onWin: [{ set: { q5: "wangzhi" } }, { toast: "荥阳已过，前往黄河渡口" }] },
    // 渡魂记 · 第五章：城外废弃茶棚的瞎眼老妪（"你身上有她的味道"需木牌）
    { id: "laoyu", x: 2, y: 5, color: "#9a8a7a", name: "瞎眼老妪",
      branches: [
        { if: { flag: "dh_tea", is: "done" },
          say: ["老妪：那句话，老婆子只讲一遍。记下了，就替她好好走。"] },
        { if: { flag: "relic_mupai", exists: true },
          say: "ch05.dhTea", do: [{ set: { dh_tea: "done" } }] },
        { say: ["老妪：过路的军爷，喝口粗茶再走吧……这棚子，好久没人来了。"] },
      ] },
  ],
  chests: [
    { x: 2, y: 2, id: "x1", items: { "还魂丹": 1 } },
  ],
  transitions: [
    { x: 0,  y: 8, to: { map: "ch05_sishui", x: 16, y: 8 } },
    { x: 17, y: 8, if: { flag: "q5", is: "wangzhi" }, to: { map: "ch05_ferry", x: 1, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
