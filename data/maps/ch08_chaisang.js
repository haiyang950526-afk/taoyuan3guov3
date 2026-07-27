// 地图 · ch08_chaisang 柴桑（第八章主城：舌战群儒、七星坛祭风、大商店）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 舌战群儒：三问，答错重来不惩罚（选项只影响一句台词）
var ASK3 = { title: "舌战群儒 · 三", options: [
  { label: "曹军远来疲弊，不习水战！", say: "ch08.debateOpt3R",
    do: [{ set: { q8: "debate" } }, { toast: "去后堂见孙权" }] },
  { label: "兵多未必能胜。", say: "ch08.debateOpt3W" }] };
ASK3.options[1].do = [{ ask: ASK3 }];
var ASK2 = { title: "舌战群儒 · 二", options: [
  { label: "我主汉室之胄，仁义著于四海！", say: "ch08.debateOpt2R", do: [{ ask: ASK3 }] },
  { label: "兵多未必胜。", say: "ch08.debateOpt2W" }] };
ASK2.options[1].do = [{ ask: ASK2 }];
var ASK1 = { title: "舌战群儒 · 一", say: "ch08.debateSay", options: [
  { label: "燕雀安知鸿鹄之志？", say: "ch08.debateOpt1R", do: [{ ask: ASK2 }] },
  { label: "胜败乃兵家常事。", say: "ch08.debateOpt1W" }] };
ASK1.options[1].do = [{ ask: ASK1 }];

// 彩蛋 · 横槊赋诗：三选一，正解得玉佩，两个错项自循环重答（同舌战群儒写法）
var DUANGE_ASK = { title: "鲁肃：下一句是？", options: [
  { label: "慨当以慷，忧思难忘。", say: "ch08.duangeR",
    do: [{ giveEquip: "玉佩" }, { set: { egg_duange: "done" } }] },
  { label: "明明如月，何时可掇。", say: "ch08.duangeW1" },
  { label: "青青子衿，悠悠我心。", say: "ch08.duangeW2" }] };
DUANGE_ASK.options[1].do = [{ ask: DUANGE_ASK }];
DUANGE_ASK.options[2].do = [{ ask: DUANGE_ASK }];

MAPS["ch08_chaisang"] = {
  name: "柴桑",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#....................#",
    "#..BB.....BB.BB...T..#",
    "#..DB.....DB.DB......#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#...T...,,.....T....,#",
    "#.......,,..........,#",
    "#.......,,..........,G",
    "#..BB...,,.BB.....T.,G",
    "#..DB...,,.DB.......,#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#.....T...,,.T.......#",
    "#.........,,.........#",
    "#.BB......,,.........#",
    "#.DB.T....,,.T.......#",
    "#.........,,.........#",
    "##########GG##########",
  ],
  encounterTiles: [],
  // 建筑招牌（画在顶部居中的 B 格上）
  signs: [
    { x: 3, y: 3, text: "客", color: "#ffd166" },
    { x: 10, y: 3, text: "武", color: "#ffd166" },
    { x: 13, y: 3, text: "装", color: "#ffd166" },
    { x: 3, y: 9, text: "药", color: "#ffd166" },
  ],
  npcs: [
    // 城门口告示牌
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是柴桑。",
              "北门通三江口水寨，东门通夏口；时机未到则暂不能通行。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "东南：编成所（老兵）"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    { id: "camp",   x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["曹军八十万压境，城里人心惶惶。", "孙刘联手，才有活路啊。"] },
    { id: "v2",     x: 15, y: 13, color: "#d88a3a", name: "老者",
      lines: ["三江口在北边江上，水寨连绵。", "听说法坛上能借来东风，神了。"] },
    // 张昭：舌战群儒
    { id: "zhangzhao", x: 12, y: 11, color: "#b8a05a", name: "张昭",
      appearIf: { flag: "q8", is: "start" },
      branches: [{ ask: ASK1 }] },
    // 孙权：联盟决断（舌战后的过场）
    { id: "sunquan", x: 10, y: 1, color: "#4a8a5a", name: "孙权",
      appearIf: { flag: "q8", is: "debate" },
      branches: [
        { say: "ch08.debateDone",
          do: [{ toast: "去三江口草船借箭（北门外）" }] },
      ] },
    // 庞统：连环计过场
    { id: "pangtong", x: 8, y: 7, color: "#9a6a8a", name: "庞统",
      appearIf: { flag: "q8", is: "arrows" },
      branches: [
        { say: "ch08.lianhuan",
          do: [{ set: { q8: "lianhuan" } }, { toast: "去七星坛祭风（城东南）" }] },
      ] },
    // 七星坛：祭风
    { id: "qixing", x: 16, y: 13, color: "#e8e8f0", name: "七星坛",
      appearIf: { flag: "q8", is: "lianhuan" },
      branches: [
        { say: "ch08.windSay",
          do: [{ set: { q8: "wind" } }, { toast: "东风已起！去三江口决战" }] },
      ] },
    // 渡魂记 · 第八章：鲁肃传话（需明镜观铜镜）
    { id: "lusu", x: 14, y: 7, color: "#8ab8d8", name: "鲁肃",
      appearIf: { flag: "q8", exists: true },
      branches: [
        { if: { flag: "dh_lusu", is: "done" },
          say: ["鲁肃：于吉道长云游未归。那句话带到了，子敬便安心了。"] },
        { if: { flag: "relic_tongjing", exists: true },
          say: "ch08.dhLusu", do: [{ set: { dh_lusu: "done" } }] },
        { say: ["鲁肃：玄德公，孙刘联盟，唇齿相依。江上的事，包在子敬身上。"] },
      ] },
  ],
  chests: [
    { x: 18, y: 14, id: "c1", gold: 800 },
  ],
  triggers: [
    // 彩蛋 · 横槊赋诗：东北江边隔江闻曹操《短歌行》，一次性（答错重答）
    { x: 18, y: 1, if: { flag: "egg_duange", is: "done" },
      do: [{ say: "ch08.duangeDone" }] },
    { x: 18, y: 1, if: { flag: "egg_duange", not: "done" },
      do: [{ say: "ch08.duange1" }, { ask: DUANGE_ASK }] },
  ],
    transitions: [
    { x: 10, y: 0,  if: { flag: "q8", in: ["debate", "arrows", "lianhuan", "wind"] },
      to: { map: "ch08_shuizhai", x: 1, y: 6 } },
    { x: 11, y: 0,  if: { flag: "q8", in: ["debate", "arrows", "lianhuan", "wind"] },
      to: { map: "ch08_shuizhai", x: 1, y: 6 } },
    { x: 21, y: 8,  if: { flag: "q8", in: ["chibi", "wulin", "done"] },
      to: { map: "ch08_xiakou", x: 1, y: 8 } },
    { x: 21, y: 9,  if: { flag: "q8", in: ["chibi", "wulin", "done"] },
      to: { map: "ch08_xiakou", x: 1, y: 8 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch08_inn_in", x: 7, y: 8 } },
    { x: 4, y: 5, face: [0, -1], to: { map: "ch08_inn_in", x: 7, y: 8 } },
    { x: 10, y: 5, face: [0, -1], to: { map: "ch08_weapon_in", x: 7, y: 8 } },
    { x: 11, y: 5, face: [0, -1], to: { map: "ch08_weapon_in", x: 7, y: 8 } },
    { x: 13, y: 5, face: [0, -1], to: { map: "ch08_armor_in", x: 7, y: 8 } },
    { x: 14, y: 5, face: [0, -1], to: { map: "ch08_armor_in", x: 7, y: 8 } },
    { x: 3, y: 11, face: [0, -1], to: { map: "ch08_item_in", x: 7, y: 8 } },
    { x: 4, y: 11, face: [0, -1], to: { map: "ch08_item_in", x: 7, y: 8 } },
    { x: 2, y: 16, face: [0, -1], to: { map: "ch08_chaisang_house_in", x: 7, y: 8 } },
    { x: 3, y: 16, face: [0, -1], to: { map: "ch08_chaisang_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
