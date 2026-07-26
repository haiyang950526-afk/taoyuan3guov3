// 地图 · ch00_inn_in 旅店（徐州城设施室内；店主自 ch00_city 迁入，shop id 不变）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 联动彩蛋 D1 · 英雄坛说：拜师请教（MUD 梗），之后再对话换口风
var KE_ASK = { title: "独行客：要不要拜我为师，学功夫？", options: [
  { label: "拜师请教", say: "ch00.xjKe2",
    do: [{ give: ["金疮药", 2] },
         { toast: "你获得了 50 点潜能。（好像并没有什么用）" },
         { set: { xj_d1: "done" } }] },
  { label: "婉拒离开" }] };

MAPS["ch00_inn_in"] = {
  name: "旅店",
  grid: [
    "BBBBBBBBBBBBBBBB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLBBBBBB",
    "BLLLLLBLLLLLLLLB",
    "BLLLLLBLLLLLLLLB",
    "BBBBLLBLLLcttcLB",
    "BLLLLLLLLLLLLLLB",
    "BLLLLLLLLLLLLLLB",
    "BBBBBBB,,BBBBBBB",
  ],
  encounterTiles: [],
  npcs: [
    { id: "inn", x: 4, y: 2, color: "#c98a4b", name: "旅店老板", shop: "ch00_inn" },
    // 联动彩蛋 D1 · 英雄坛说：角落里的独行客
    { id: "duxingke", x: 13, y: 1, color: "#7a6a5a", name: "独行客",
      branches: [
        { if: { flag: "xj_d1", is: "done" }, say: "ch00.xjKe3" },
        { say: "ch00.xjKe1", do: [{ ask: KE_ASK }] },
      ] },
  ],
  chests: [],
  triggers: [
    // 联动彩蛋 D7 · 读档哲学：进店一次性（老板 shop 字段优先于 branches，
    // 故用地面触发器实现，保住住店功能）
    { x: 7, y: 8, if: { flag: "xj_d7", not: "done" },
      do: [{ say: "ch00.xjInn" }, { set: { xj_d7: "done" } }] },
  ],
  transitions: [
    { x: 7, y: 9, to: { map: "ch00_city", x: 4, y: 9 } },
    { x: 8, y: 9, to: { map: "ch00_city", x: 4, y: 9 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
