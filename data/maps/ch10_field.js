// 地图 · ch10_field 西川野外（第十章野外：北通雒城，西通落凤坡，东通绵竹）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_field"] = {
  name: "西川野外",
  grid: [
    "RRRRRRRR##GG##RRRRRRRRRR",
    "R........,,............R",
    "R..T.....,,.....T......R",
    "R........,,,...........R",
    "R....T....,,,....T.....R",
    "R..........,,,.........R",
    "R..T...T....,,.....T...#",
    "R............,,........#",
    "G....T......,,.........G",
    "G...........,,,........G",
    "R..T.........,,...T....#",
    "R.............,,.......#",
    "R......T......,,.......R",
    "R..T....h...,,....T....R",
    "R.......,.....,,.......R",
    "R....T........,,,......R",
    "R.............,,,......R",
    "RRRRRRRR##GG##RRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.11,
  encounterGroups: [["西川兵"], ["西川兵", "蜀军弓手"], ["蜀军弓手", "蜀军弓手"], ["西川兵", "蜀军名将"]],
  npcs: [],
  triggers: [
    // 桥段 mt5 · 义释严颜：雒城入口前的路径格，一次性（B案赠玉佩）
    { x: 10, y: 1, if: { flag: "mt5", not: "done" },
      do: [{ say: "ch10.mt5Pre" }, { say: "ch10.mt5Talk" }, { say: "ch10.mt5Talk2" },
           { giveEquip: "玉佩" }, { set: { mt5: "done" } }] },
    { x: 11, y: 1, if: { flag: "mt5", not: "done" },
      do: [{ say: "ch10.mt5Pre" }, { say: "ch10.mt5Talk" }, { say: "ch10.mt5Talk2" },
           { giveEquip: "玉佩" }, { set: { mt5: "done" } }] },
  ],
  chests: [
    { x: 2, y: 12, id: "f1", items: { "精铁": 1 } },
    { x: 20, y: 4, id: "f2", items: { "精铁": 1 } },
  ],
  transitions: [
    { x: 10, y: 17, to: { map: "ch10_fucheng", x: 10, y: 1 } },
    { x: 11, y: 17, to: { map: "ch10_fucheng", x: 10, y: 1 } },
    // 北门：雒城（涪城宴后开放；张任战前可反复进出）
    { x: 10, y: 0,  if: { flag: "q10", in: ["fu", "luo1", "luofeng"] }, to: { map: "ch10_luocheng", x: 8, y: 10 } },
    { x: 11, y: 0,  if: { flag: "q10", in: ["fu", "luo1", "luofeng"] }, to: { map: "ch10_luocheng", x: 8, y: 10 } },
    // 西门：落凤坡（雒城外围破后开放）
    { x: 0,  y: 8,  if: { flag: "q10", is: "luo1" }, to: { map: "ch10_luofeng", x: 14, y: 6 } },
    { x: 0,  y: 9,  if: { flag: "q10", is: "luo1" }, to: { map: "ch10_luofeng", x: 14, y: 6 } },
    // 东门：绵竹（雒城下后开放）
    { x: 23, y: 8,  if: { flag: "q10", is: "luo2" }, to: { map: "ch10_mianzhu", x: 1, y: 8 } },
    { x: 23, y: 9,  if: { flag: "q10", is: "luo2" }, to: { map: "ch10_mianzhu", x: 1, y: 8 } },
    // 川西村村口（路西）：走上小屋图标即进村
    { x: 8, y: 13, to: { map: "ch10_village", x: 9, y: 12 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
