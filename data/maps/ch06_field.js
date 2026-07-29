// 地图 · ch06_field 新野野外（第六章野外：北通襄阳，东通隆中；三处匪首+水镜庄；第七章护送路线）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 联动彩蛋 A2 · 珍珑棋局：细看棋理可再选（自循环），随手一子破局赠玉佩
var ZHEN_ASK = { title: "珍珑棋局", options: [
  { label: "随手下一子", say: "ch06.xjZhenR",
    do: [{ giveEquip: "玉佩" }, { set: { xj_a2: "done" } }] },
  { label: "细看棋理", say: "ch06.xjZhenW" }] };
ZHEN_ASK.options[1].do = [{ ask: ZHEN_ASK }];

MAPS["ch06_field"] = {
  name: "新野野外",
  grid: [
    "RRRRRRRR##GG##RRRRRRRRRR",
    "R........,,............R",
    "R..T.....,,.....T......R",
    "R........,,,...........R",
    "R....T....,,,....T.....R",
    "R..........,,,.........R",
    "R..T...T....,,.....T...R",
    "R............,,........R",
    "R....T......,,.........G",
    "R...........,,,........G",
    "R..T.........,,...T....R",
    "R.............,,.......R",
    "R......T......,,.......R",
    "R..T....h...,,....T....R",
    "R.......,.....,,.......R",
    "R.h..T........,,,......R",
    "R.............,,,......R",
    "RRRRRRRR##GG##RRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.12,
  encounterGroups: [["新野匪徒"], ["新野匪徒", "新野匪徒"], ["新野匪徒", "博望曹军"]],
  npcs: [
    // 三处匪首（自由讨伐，杀完即消失）
    { id: "bandit1", x: 5, y: 3, color: "#7a4a2a", name: "匪首张武",
      boss: "ch06_bandit1",
      appearIf: { flag: "q6", is: "bandits" }, hideIf: { flag: "b1", is: true },
      onWin: [{ set: { b1: true } }, { inc: { bandits: 1 } }, { toast: "匪首张武已平（还有两处）" }] },
    { id: "bandit2", x: 18, y: 11, color: "#7a4a2a", name: "匪首陈孙",
      boss: "ch06_bandit2",
      appearIf: { flag: "q6", is: "bandits" }, hideIf: { flag: "b2", is: true },
      onWin: [{ set: { b2: true } }, { inc: { bandits: 1 } }, { toast: "匪首陈孙已平" }] },
    { id: "bandit3", x: 6, y: 14, color: "#7a4a2a", name: "匪首赵慈",
      boss: "ch06_bandit3",
      appearIf: { flag: "q6", is: "bandits" }, hideIf: { flag: "b3", is: true },
      onWin: [{ set: { b3: true } }, { inc: { bandits: 1 } }, { toast: "匪首赵慈已平" }] },
    // 水镜庄：司马徽
    { id: "shuijing", x: 17, y: 15, color: "#8ab8d8", name: "司马徽",
      appearIf: { flag: "q6", is: "shuijing" },
      branches: [
        { say: "ch06.shuijing",
          do: [{ set: { q6: "gu1" } }, { toast: "隆中已可通行（野外东门）" }] },
      ] },
    // 联动彩蛋 A2 · 珍珑棋局：松下一局残棋
    { id: "zhenlong", x: 2, y: 2, color: "#b8a05a", name: "对弈老叟",
      branches: [
        { if: { flag: "xj_a2", is: "done" },
          say: ["（老叟对着残局喃喃自语：先舍后得，妙哉……）"] },
        { say: "ch06.xjZhen1", do: [{ ask: ZHEN_ASK }] },
      ] },
  ],
  triggers: [
    // 第七章：携民渡江 · 三场护送遭遇战（百姓阵亡即重来）
    { x: 12, y: 9, if: { flag: "q7", is: "escort" },
      do: [{ battle: "ch07_escort1", onWin: [{ set: { e1: true } }, { say: "ch07.escortDone" }] }] },
    { x: 13, y: 9, if: { flag: "e1", is: true },
      do: [{ battle: "ch07_escort2", onWin: [{ set: { e2: true } }] }] },
    { x: 14, y: 9, if: { flag: "e2", is: true },
      do: [{ battle: "ch07_escort3",
             onWin: [{ set: { q7: "changban" } },
                     { warp: { map: "ch07_changban", x: 1, y: 2 } },
                     { say: "ch07.changbanPre" }] }] },
  ],
  chests: [
    { x: 2, y: 12, id: "f1", items: { "还魂丹": 1 } },
  ],
  transitions: [
    // 北门：新野
    { x: 10, y: 0,  to: { map: "ch06_xinye", x: 10, y: 16 } },
    { x: 11, y: 0,  to: { map: "ch06_xinye", x: 10, y: 16 } },
    // 南门：襄阳（蔡瑁设宴后开放）
    { x: 10, y: 17, if: { flag: "q6", in: ["feast", "tanxi", "shuijing", "gu1", "gu2", "gu3", "done"] },
      to: { map: "ch06_xiangyang", x: 10, y: 1 } },
    { x: 11, y: 17, if: { flag: "q6", in: ["feast", "tanxi", "shuijing", "gu1", "gu2", "gu3", "done"] },
      to: { map: "ch06_xiangyang", x: 10, y: 1 } },
    // 东门：隆中（水镜指点后开放）
    { x: 23, y: 8,  if: { flag: "q6", in: ["gu1", "gu2", "gu3"] }, to: { map: "ch06_longzhong", x: 1, y: 2 } },
    { x: 23, y: 9,  if: { flag: "q6", in: ["gu1", "gu2", "gu3"] }, to: { map: "ch06_longzhong", x: 1, y: 2 } },
    // 新西村村口（路西）：走上小屋图标即进村
    { x: 8, y: 13, to: { map: "ch06_village", x: 9, y: 12 } },
    // 渡魂记 · 第六章：西南破败学堂（无前置可进，正篇需荀彧残信）
    { x: 2, y: 15, to: { map: "ch06_school", x: 5, y: 5 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
