// 地图 · ch03_field 许都野外（第三章野外：北回许都，东通许田猎场；突围战在此）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch03_field"] = {
  name: "许都野外",
  grid: [
    "RRRRRRRRR##GG##RRRRRRRRR",
    "R.........,,...........R",
    "R..T......,,.....T.....R",
    "R.........,,...........R",
    "R.....T....,,....T.....R",
    "R..........,,,.........R",
    "R..T...T....,,.....T...R",
    "R.............,,.......R",
    "R.....T......,,........G",
    "R............,,,.......G",
    "R..T.........,,...T....R",
    "R.............,,.......R",
    "R......T......,,.......R",
    "R..T........,,....T....R",
    "R.............,,.......R",
    "R....T........,,,......R",
    "R........h.....,,,.....R",
    "RRRRRRRRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.12,
  encounterGroups: [["曹军精锐"], ["曹军精锐", "曹军精骑"], ["曹军精骑", "曹军精骑"], ["曹军精锐", "曹军都伯"]],
  npcs: [
    // 突围战：离许时车胄先锋拦路
    { id: "chezhou_van", x: 13, y: 16, color: "#3a4a6a", name: "车胄先锋",
      boss: "ch03_tuwei",
      appearIf: { flag: "q3", is: "leave" },
      onWin: [{ say: "ch03.tuweiDone" }, { set: { q3: "done" } },
              { chapter: "ch04" }, { set: { q4: "start" } },
              { say: "ch04.intro" }, { warp: { map: "ch00_field", x: 11, y: 15 } },
              { toast: "第四章 · 风云再散" }] },
    // 桥段 mt6 · 华佗授五禽戏：独立挂许都野外西南角，一次性（B案赠仙草露×2 + 青囊书）
    { id: "huatuo", x: 2, y: 15, color: "#6a9a7a", name: "华佗",
      branches: [
        { if: { flag: "mt6", is: "done" }, say: "ch03.mt6After" },
        { say: "ch03.mt6Meet",
          do: [{ say: "ch03.mt6Talk" }, { give: ["仙草露", 2] },
               { giveEquip: "青囊书" }, { set: { relic_qingnang: true } },
               { set: { mt6: "done" } }] },
      ] },
  ],
  chests: [
    { x: 2, y: 13, id: "f1", items: { "金疮药": 2 } },
  ],
  triggers: [
    // 联动彩蛋 C1 · 打的就是精锐：突围战前过场（车胄先锋邻格，一次性；
    // 前置空触发器吞掉已触发状态）
    { x: 13, y: 15, if: { flag: "xj_c1", is: "done" }, do: [] },
    { x: 13, y: 15, if: { flag: "q3", is: "leave" },
      do: [{ say: "ch03.xjJingrui" }, { toast: "士气+1（并不存在的数值）" },
           { set: { xj_c1: "done" } }] },
    { x: 12, y: 16, if: { flag: "xj_c1", is: "done" }, do: [] },
    { x: 12, y: 16, if: { flag: "q3", is: "leave" },
      do: [{ say: "ch03.xjJingrui" }, { toast: "士气+1（并不存在的数值）" },
           { set: { xj_c1: "done" } }] },
    { x: 14, y: 16, if: { flag: "xj_c1", is: "done" }, do: [] },
    { x: 14, y: 16, if: { flag: "q3", is: "leave" },
      do: [{ say: "ch03.xjJingrui" }, { toast: "士气+1（并不存在的数值）" },
           { set: { xj_c1: "done" } }] },
  ],
  transitions: [
    { x: 11, y: 0,  to: { map: "ch03_xudu", x: 10, y: 18 } },
    { x: 12, y: 0,  to: { map: "ch03_xudu", x: 10, y: 18 } },
    // 东门：围猎期间开放
    { x: 23, y: 8,  if: { flag: "q3", is: "audience" }, to: { map: "ch03_hunt", x: 1, y: 6 } },
    { x: 23, y: 9,  if: { flag: "q3", is: "audience" }, to: { map: "ch03_hunt", x: 1, y: 6 } },
    // 许南村村口（南部）：走上小屋图标即进村
    { x: 9, y: 16, to: { map: "ch03_village", x: 9, y: 12 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
