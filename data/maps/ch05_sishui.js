// 地图 · ch05_sishui 汜水关（第五章第三关：守将卞喜）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch05_sishui"] = {
  name: "汜水关",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "R....T......T....R",
    "R................R",
    "R..T..........T..R",
    "R................R",
    "R................R",
    "#....T......T....R",
    "#................R",
    "G,,,,,,,,,,,,,,,,G",
    "#................R",
    "#..T..........T..R",
    "RRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["汜水守军"], ["汜水守军", "汜水守军"]],
  npcs: [
    { id: "bianxi", x: 15, y: 6, color: "#6a3a3a", name: "卞喜",
      boss: "ch05_bianxi",
      appearIf: { flag: "q5", is: "hanfu" },
      onWin: [{ set: { q5: "bianxi" } }, { toast: "汜水关已过，前往荥阳" }] },
    // 桥段 mt2 · 普净点化关羽：卞喜战后在镇国寺偏殿相候（西北角，避开卞喜战位），一次性
    { id: "pujing", x: 2, y: 2, color: "#a89a6a", name: "普净",
      appearIf: { flag: "q5", not: "hanfu" },
      branches: [
        { if: { flag: "mt2", is: "done" }, say: "ch05.mt2After" },
        { say: "ch05.mt2Meet",
          do: [{ say: "ch05.mt2Talk" }, { giveEquip: "护心镜" },
               { set: { mt2: "done" } }] },
      ] },
  ],
  chests: [
    { x: 2, y: 9, id: "s1", items: { "还魂丹": 1 } },
  ],
  triggers: [
    // 联动彩蛋 C2 · 鸡汤来咯：卞喜战前过场（邻格，一次性；
    // 前置空触发器吞掉已触发状态）
    { x: 14, y: 6, if: { flag: "xj_c2", is: "done" }, do: [] },
    { x: 14, y: 6, if: { flag: "q5", is: "hanfu" },
      do: [{ say: "ch05.xjJitang" }, { set: { xj_c2: "done" } }] },
    { x: 16, y: 6, if: { flag: "xj_c2", is: "done" }, do: [] },
    { x: 16, y: 6, if: { flag: "q5", is: "hanfu" },
      do: [{ say: "ch05.xjJitang" }, { set: { xj_c2: "done" } }] },
    { x: 15, y: 5, if: { flag: "xj_c2", is: "done" }, do: [] },
    { x: 15, y: 5, if: { flag: "q5", is: "hanfu" },
      do: [{ say: "ch05.xjJitang" }, { set: { xj_c2: "done" } }] },
    { x: 15, y: 7, if: { flag: "xj_c2", is: "done" }, do: [] },
    { x: 15, y: 7, if: { flag: "q5", is: "hanfu" },
      do: [{ say: "ch05.xjJitang" }, { set: { xj_c2: "done" } }] },
  ],
  transitions: [
    { x: 0,  y: 8, to: { map: "ch05_luoyang", x: 10, y: 1 } },
    { x: 17, y: 8, if: { flag: "q5", is: "bianxi" }, to: { map: "ch05_xingyang", x: 1, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
