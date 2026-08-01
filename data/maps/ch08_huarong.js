// 地图 · ch08_huarong 华容道（第八章末：曹操亲卫队"突围"强制结束，义释两种台词）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 马前三抉（12-A）：放 / 杀 / 擒，奖励互斥（铜雀 vs 孟德手书）
var HR_END = [
  { set: { q8: "done" } },
  { say: "ch08.huarongBack" },
  { say: "ch08.chapterEnd" }, { say: "ch09.intro" },
  { chapter: "ch09" }, { set: { q9: "start" } },
  { warp: { map: "ch09_guiyang", x: 10, y: 16 } },
  { toast: "第九章 · 荆南四郡" }];
var HR_ASK = { title: "曹操已在马前——", options: [
  // 放：历史线，铜雀赠别
  { label: "放。昔日之恩，今日已报。",
    say: "ch08.hrRelease",
    do: [{ say: "ch08.huarongTongque" }, { giveEquip: "铜雀" },
         { set: { wh4: "done" } }, { set: { relic_tongque: true } },
         { set: { hr_choice: "release" } }].concat(HR_END) },
  // 杀：刀落至半，终是收刀（斩心魔，关羽攻+2；许田伏笔有闪回差分）
  { label: "杀。为大哥，斩了这汉贼！",
    say: "ch08.hrStay",
    do: [{ if: { flag: "hr_xutian", is: 1 }, do: [{ say: "ch08.flashback" }] },
         { giveEquip: "铜雀" },
         { set: { wh4: "done" } }, { set: { relic_tongque: true } },
         { statUp: { hero: "关羽", stat: "atk", by: 2 } },
         { set: { hr_choice: "stayed" } }].concat(HR_END) },
  // 擒：绑了就走——劫道、脱缚、天意（孟德手书）
  { label: "擒。押回夏口，听凭军师发落！",
    say: "ch08.hrSeized",
    do: [{ giveEquip: "孟德手书" },
         { set: { hr_choice: "seized" } }].concat(HR_END) },
] };

MAPS["ch08_huarong"] = {
  name: "华容道",
  grid: [
    "RRRRRRRRRRRRRRRRRR",
    "R................R",
    "R.T..........T...R",
    "R................R",
    "R....T.....T.....R",
    "R................R",
    "R................R",
    "R..T...........T.R",
    "G,,,,,,,,,,,,,,,.R",
    "R................R",
    "R....T......T....R",
    "R................R",
    "R..T.........T...R",
    "RRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["华容曹兵"], ["华容曹兵", "华容曹兵"]],
  npcs: [
    // 曹操亲卫队：第 6 回合强制结束（突围），按血量给两种义释台词
    { id: "caocao8", x: 16, y: 8, color: "#3a2a3a", name: "曹操",
      boss: "ch08_huarong",
      appearIf: { flag: "q8", is: "wulin" },
      onForceEnd: {
        win: [{ say: "ch08.huarongAsk" }, { ask: HR_ASK }],
        lose: [{ say: "ch08.huarongAsk" }, { ask: HR_ASK }],
      } },
  ],
  chests: [
    { x: 9, y: 1, id: "h1", items: { "诸葛连弩图": 1 } },
  ],
  triggers: [
    // 截击残军（12-A：遭遇曹操前先打残他）
    { x: 12, y: 8, if: { flag: "hr_intercept", not: "done" },
      do: [{ battle: "ch08_huarong1",
             onWin: [{ say: "ch08.interceptDone" }, { set: { hr_intercept: "done" } }] }] },
    { x: 13, y: 8, if: { flag: "hr_intercept", not: "done" },
      do: [{ battle: "ch08_huarong1",
             onWin: [{ say: "ch08.interceptDone" }, { set: { hr_intercept: "done" } }] }] },
  ],
  transitions: [
    { x: 0, y: 8, to: { map: "ch08_xiakou", x: 16, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
