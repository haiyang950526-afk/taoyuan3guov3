// 地图 · ch02_xiaopei 小沛（第二章主城：旅店+武器店+防具店+杂货店；吕布、报信兵、简雍在此）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 彩蛋 · 塞翁失马：慰/贺只改一句台词（参考舌战群儒 ASK 写法）
var SAI_ASK = { title: "塞上老翁：这是祸么？", say: "ch02.saiWengAsk1", options: [
  { label: "慰问老丈", say: "ch02.saiWengWei" },
  { label: "恭贺老丈", say: "ch02.saiWengHe" }] };

MAPS["ch02_xiaopei"] = {
  name: "小沛",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#..BBBB...BBBB.......#",
    "#..BBBB...BBBB....T..#",
    "#..BDBB...BBDD.......#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#...T...,,.....T.....#",
    "#.......,,...........#",
    "#..BBBB.,,BBBB.......#",
    "#..BBBB.,,BBBB....T..#",
    "#..BDBB.,,BBDB.......#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#.....T...,,.T.......#",
    "#BBBB.....,,.........#",
    "#BBBB.....,,.........#",
    "#BDBBT....,,.T.......#",
    "#.........,,.........#",
    "##########GG##########",
  ],
  encounterTiles: [],
  // 建筑招牌（画在顶部居中的 B 格上）
  signs: [
    { x: 4,  y: 2, text: "客", color: "#ffd166" },
    { x: 12, y: 2, text: "武", color: "#ffd166" },
    { x: 13, y: 2, text: "装", color: "#ffd166" },
    { x: 4,  y: 8, text: "药", color: "#ffd166" },
  ],
  npcs: [
    // 北门口告示牌
    { id: "board", x: 12, y: 1, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是小沛。",
              "北门出去是沛县郊野；南门通往下邳郊野（时机未到暂不能通行）。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "东南：编成所（老兵）"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    { id: "v1",     x: 6,  y: 7,  color: "#4f8cff", name: "村民", linesKey: "ch02.xpVillager" },
    { id: "v2",     x: 15, y: 13, color: "#d88a3a", name: "老者", linesKey: "ch02.xpElder" },
    // 编成所
    { id: "camp",   x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    // 吕布：来投后在小沛安置
    { id: "lvbu",   x: 12, y: 11, color: "#c03a5a", name: "吕布",
      appearIf: { flag: "q2", is: "lvbu" },
      branches: [
        { say: "ch02.lvbuSettle",
          do: [{ set: { q2: "anzhi" } }, { toast: "吕布一军暂驻小沛" }] },
      ] },
    // 报信兵：吕布安置后来报纪灵来攻
    { id: "soldier2", x: 8, y: 7, color: "#9aa4b8", name: "报信兵",
      appearIf: { flag: "q2", is: "anzhi" },
      branches: [
        { say: "ch02.jilingCome",
          do: [{ set: { q2: "jilingCome" } }, { toast: "出小沛北门，迎战纪灵！" }] },
      ] },
    // 简雍：失下邳后收束本章，并衔接第三章（陈登留徐州，离队）
    { id: "jianyong", x: 14, y: 12, color: "#6a8a5a", name: "简雍",
      appearIf: { flag: "q2", is: "lost" },
      branches: [
        { say: "ch02.chapterEnd",
          do: [{ set: { q2: "done" } }, { leave: "陈登" },
               { say: "ch03.intro" }, { chapter: "ch03" }, { set: { q3: "start" } },
               { warp: { map: "ch03_xudu", x: 10, y: 16 } },
               { toast: "第三章 · 寄人篱下" }] },
      ] },
    // 彩蛋 · 塞翁失马：村边老翁，两段式（失马 → 吕布袭下邳后回访领赏）
    { id: "saiweng", x: 17, y: 16, color: "#a89a7a", name: "塞上老翁",
      branches: [
        { if: { flag: "egg_saiweng", is: "done" }, say: "ch02.saiWengDone" },
        { if: { flag: "q2", in: ["lost", "done"] }, say: "ch02.saiWeng2",
          do: [{ give: ["精铁", 2] }, { giveEquip: "淮南子" },
               { set: { relic_huainanzi: true } }, { set: { egg_saiweng: "done" } }] },
        { if: { flag: "egg_saiweng", is: "lost" }, say: "ch02.saiWeng1" },
        { say: "ch02.saiWeng1",
          do: [{ ask: SAI_ASK }, { set: { egg_saiweng: "lost" } }] },
      ] },
    // 名品 · 春秋左氏传（wh5）：老学究两次对话赠书（关羽夜读《春秋》梗）
    { id: "oldman", x: 7, y: 13, color: "#8a7a9a", name: "老学究",
      branches: [
        { if: { flag: "wh5", is: "done" }, say: "ch02.xpOldManDone" },
        { if: { flag: "wh5", is: "met" }, say: "ch02.xpOldMan2",
          do: [{ giveEquip: "春秋左氏传" }, { set: { wh5: "done" } }, { set: { relic_chunqiu: true } }] },
        { say: "ch02.xpOldMan1", do: [{ set: { wh5: "met" } }] },
      ] },
  ],
  chests: [],
  transitions: [
    { x: 10, y: 0,  to: { map: "ch02_field_east", x: 22, y: 9 } },
    { x: 11, y: 0,  to: { map: "ch02_field_east", x: 22, y: 9 } },
    // 南门：辕门射戟后才可往下邳方向
    { x: 10, y: 17, if: { flag: "q2", in: ["shed", "lost", "done"] }, to: { map: "ch02_field_south", x: 10, y: 1 } },
    { x: 11, y: 17, if: { flag: "q2", in: ["shed", "lost", "done"] }, to: { map: "ch02_field_south", x: 10, y: 1 } },
    // 店铺室内下钻（朝门才进，路过不触发）
    { x: 4,  y: 5,  face: [0, -1], to: { map: "ch02_inn_in", x: 7, y: 8 } },
    { x: 12, y: 5,  face: [0, -1], to: { map: "ch02_weapon_in", x: 7, y: 8 } },
    { x: 13, y: 5,  face: [0, -1], to: { map: "ch02_armor_in", x: 7, y: 8 } },
    { x: 4,  y: 11, face: [0, -1], to: { map: "ch02_item_in", x: 7, y: 8 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 2, y: 16, face: [0, -1], to: { map: "ch02_xiaopei_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
