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
  npcs: [
    // 开放式选择 · 让马（12 文档 B-2）：落凤坡出发前，一次性
    { id: "pt_horse", x: 2, y: 8, color: "#9a7ab8", name: "庞统",
      appearIf: { flag: "q10", is: "luo1" },
      hideIf: { flag: "pt_set", is: "done" },
      branches: [
        { say: "ch10.lendHorse",
          ask: { title: "把的卢马让给庞统？", options: [
            { label: "军情紧急，先生莫推。（借）",
              say: "ch10.lendYes",
              do: [{ set: { pt_horse: 1 } }, { set: { pt_set: "done" } },
                   { toast: "的卢马，借予庞统。" }] },
            { label: "军师说的哪里话。（不借）",
              say: "ch10.lendNo",
              do: [{ set: { pt_set: "done" } }] },
          ] } },
      ] },
    // 寻药 mini-arc：伏击归来，随军医官（药方路/故人路/昏迷保底）
    { id: "pt_medic", x: 2, y: 7, color: "#c8c8d8", name: "医官",
      appearIf: { flag: "pt_save", is: "start" },
      hideIf: { flag: "pt_save", is: "done" },
      branches: [
        // 药方路：交出 仙草露×1 + 金疮药×2
        { if: { all: [{ hasItem: ["仙草露", 1] }, { hasItem: ["金疮药", 2] }] },
          say: "ch10.medicIntro",
          ask: { title: "交出药材救治庞统？", options: [
            { label: "交药（仙草露×1 + 金疮药×2）",
              say: "ch10.pangtongSaved",
              do: [{ take: ["仙草露", 1] }, { take: ["金疮药", 2] },
                   { set: { pt_alive: 1 } }, { set: { pt_save: "done" } },
                   { leave: "庞统" }, { set: { q10: "luofeng" } },
                   { toast: "庞统救回来了！（伤退出战斗序列）" }] },
            { label: "再想想……", say: ["医官：请快些……军师他，撑不了太久。"] },
          ] } },
        // 故人路：华佗授五禽戏（mt6）已完成
        { if: { flag: "mt6", is: "done" }, say: "ch10.huatuoSave",
          do: [{ set: { pt_alive: 1 } }, { set: { pt_save: "done" } },
               { leave: "庞统" }, { set: { q10: "luofeng" } },
               { toast: "华佗门下弟子至——庞统救回来了！" }] },
        // 保底：昏迷护送
        { say: "ch10.medicIntro",
          ask: { title: "没有药材，怎么办？", options: [
            { label: "先护送回成都……",
              say: "ch10.pangtongComa",
              do: [{ set: { pt_coma: 1 } }, { set: { pt_save: "done" } },
                   { leave: "庞统" }, { set: { q10: "luofeng" } },
                   { toast: "庞统昏迷中，被护送回成都。" }] },
            { label: "我去找药！", say: ["医官：拜托将军了——军师的命，就悬在这上面。"] },
          ] } },
      ] },
  ],
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
