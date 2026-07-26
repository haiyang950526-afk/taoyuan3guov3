// 地图 · ch02_xiapi 下邳城（第二章大城：旅店+武器店+防具店+杂货店+铁匠铺；南通淮水渡口）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch02_xiapi"] = {
  name: "下邳城",
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
    { x: 12, y: 8, text: "铁", color: "#ffd166" },
  ],
  npcs: [
    // 北门口告示牌
    { id: "board", x: 12, y: 1, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是下邳城。",
              "北门出去是下邳郊野；南门通向淮水渡口。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "东南：铁匠铺（武器强化）"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    // 失下邳前后，城中人口风不同
    { id: "v1", x: 7, y: 7, color: "#4f8cff", name: "村民",
      branches: [
        { if: { flag: "q2", in: ["lost", "done"] },
          say: ["温侯进了城，秋毫无犯……可大伙儿心里都不踏实。"] },
        { say: "ch02.xiapiVillager" },
      ] },
    { id: "v2", x: 15, y: 13, color: "#d88a3a", name: "老者", linesKey: "ch02.xiapiElder" },
    // 渡魂记 · 第二章：陈登明镜观伏笔（末句"摸木牌"仅持木牌分支出现）
    { id: "chendeng", x: 7, y: 13, color: "#7a9a6a", name: "陈登",
      appearIf: { flag: "q2", exists: true },
      branches: [
        { if: { flag: "relic_mupai", exists: true }, say: "ch02.dhChendeng" },
        { say: "ch02.dhChendengNo" },
      ] },
    // 铁匠铺（武器强化，消耗精铁；第十章正式开放，此处先有设施）：东南楼下
    { id: "smith", x: 12, y: 11, color: "#a87a4a", name: "铁匠", facility: "smith" },
    // 名品 · 密语事件2（wh2）：老儒两次对话赠《书经》（书在人身上，无藏匿点）
    { id: "scholar", x: 17, y: 16, color: "#8a6a8a", name: "老儒",
      branches: [
        { if: { flag: "wh2", is: "done" }, say: "ch02.xpScholarDone" },
        { if: { flag: "wh2", is: "met" }, say: "ch02.xpScholar2",
          do: [{ giveEquip: "书经" }, { set: { wh2: "done" } }, { set: { relic_shujing: true } }] },
        { say: "ch02.xpScholar1", do: [{ set: { wh2: "met" } }] },
      ] },
  ],
  chests: [],
  transitions: [
    { x: 10, y: 0,  to: { map: "ch02_field_south", x: 15, y: 16 } },
    { x: 11, y: 0,  to: { map: "ch02_field_south", x: 15, y: 16 } },
    { x: 10, y: 17, to: { map: "ch02_huaishui", x: 11, y: 1 } },
    { x: 11, y: 17, to: { map: "ch02_huaishui", x: 11, y: 1 } },
    // 店铺室内下钻（朝门才进，路过不触发）
    { x: 4,  y: 5,  face: [0, -1], to: { map: "ch02b_inn_in", x: 7, y: 8 } },
    { x: 12, y: 5,  face: [0, -1], to: { map: "ch02b_weapon_in", x: 7, y: 8 } },
    { x: 13, y: 5,  face: [0, -1], to: { map: "ch02b_armor_in", x: 7, y: 8 } },
    { x: 4,  y: 11, face: [0, -1], to: { map: "ch02b_item_in", x: 7, y: 8 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 2, y: 16, face: [0, -1], to: { map: "ch02_xiapi_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
