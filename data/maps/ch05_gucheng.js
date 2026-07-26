// 地图 · ch05_gucheng 古城（第五章终：张飞误会演出战 → 释疑重聚 → 章结）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch05_gucheng"] = {
  name: "古城",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R..............R",
    "R..BBBBBBBB....R",
    "R..BBBBBBBBT...R",
    "R..BDBBBDBB....R",
    "R..............R",
    "R...,T.....T...R",
    "R...,..........R",
    "G,,,,,,,,,,,,..R",
    "R..........T...R",
    "R..T........T..R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  // 建筑招牌（画在顶部居中的 B 格上）
  signs: [
    { x: 4,  y: 2, text: "客", color: "#ffd166" },
  ],
  npcs: [
    // 城门口告示牌（西门内侧路旁）
    { id: "board", x: 1, y: 7, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是古城。",
              "西门出去是卧牛山。",
              "城西北有旅店，可歇脚投宿。"] },
    { id: "inn", x: 4, y: 5, color: "#c98a4b", name: "旅店老板", shop: "ch05g_inn" },
    // 张飞：释疑后在城中，收束本章
    { id: "zhangfei5", x: 8, y: 7, color: "#5c6478", name: "张飞",
      appearIf: { flag: "q5", is: "gucheng" },
      branches: [
        { say: "ch05.chapterEnd",
          do: [{ set: { q5: "done" } }, { say: "ch06.intro" },
               { chapter: "ch06" }, { set: { q6: "start" } },
               { warp: { map: "ch06_xinye", x: 10, y: 16 } },
               { toast: "第六章 · 卧龙出山" }] },
      ] },
  ],
  chests: [],
  triggers: [
    // 古城会：张飞误会（演出战：兄弟对打 3 回合）
    { x: 9, y: 8, if: { flag: "q5", is: "zhaoyun" },
      do: [{ battle: "ch05_zhangfei",
             onWin: [{ say: "ch05.shiyi" },
                     { partyRestore: true },
                     { join: "赵云" },
                     { joinBench: "孙乾" },
                     { joinBench: "周仓" },
                     { set: { q5: "gucheng" } },
                     { toast: "兄弟重聚！赵云入队，孙乾、周仓入后备" }] }] },
    { x: 10, y: 8, if: { flag: "q5", is: "zhaoyun" },
      do: [{ battle: "ch05_zhangfei",
             onWin: [{ say: "ch05.shiyi" },
                     { partyRestore: true },
                     { join: "赵云" },
                     { joinBench: "孙乾" },
                     { joinBench: "周仓" },
                     { set: { q5: "gucheng" } },
                     { toast: "兄弟重聚！赵云入队，孙乾、周仓入后备" }] }] },
    { x: 11, y: 8, if: { flag: "q5", is: "zhaoyun" },
      do: [{ battle: "ch05_zhangfei",
             onWin: [{ say: "ch05.shiyi" },
                     { partyRestore: true },
                     { join: "赵云" },
                     { joinBench: "孙乾" },
                     { joinBench: "周仓" },
                     { set: { q5: "gucheng" } },
                     { toast: "兄弟重聚！赵云入队，孙乾、周仓入后备" }] }] },
    // 联动彩蛋 B3 · 俺也一样：重聚后经过城门内侧触发，一次性（前置空触发器吞掉已触发状态）
    { x: 2, y: 8, if: { flag: "xj_b3", is: "done" }, do: [] },
    { x: 2, y: 8, if: { flag: "q5", is: "gucheng" },
      do: [{ say: "ch05.xjYiYang" }, { set: { xj_b3: "done" } }] },
  ],
  transitions: [
    { x: 0, y: 8, to: { map: "ch05_woniu", x: 14, y: 6 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 8, y: 5, face: [0, -1], to: { map: "ch05_gucheng_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
