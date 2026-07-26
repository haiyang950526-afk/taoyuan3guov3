// 地图 · ch09_changsha 长沙城（第九章：黄忠收服战 + 魏延反水 + 鲁肃讨荆州）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch09_changsha"] = {
  name: "长沙城",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#..BBBB...BBBB.......#",
    "#..BBBB...BBBB....T..#",
    "#..BDBB...BBDB.......#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#...T...,,.....T.....#",
    "#.......,,...........#",
    "#..BBBB.,,BBBB.......#",
    "#..BBBB.,,BBBB....T..#",
    "#..BDBB.,,BBDB.......#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#.....T...,,.T.......#",
    "#.........,,.........#",
    "#.........,,.........#",
    "#....T....,,.T.......#",
    "#.........,,.........#",
    "##########GG##########",
  ],
  encounterTiles: [],
  // 建筑招牌（画在顶部居中的 B 格上）
  signs: [
    { x: 4,  y: 2, text: "客", color: "#ffd166" },
    { x: 12, y: 2, text: "武", color: "#ffd166" },
    { x: 4,  y: 8, text: "药", color: "#ffd166" },
  ],
  npcs: [
    // 城门口告示牌（南门内侧路旁）
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是长沙城。",
              "南门出去是荆南南野；北门通零陵（时机未到暂不能通行）。",
              "西街：旅店·杂货店　东街：武器店",
              "东南：编成所（老兵）"] },
    { id: "inn",    x: 4,  y: 5,  color: "#c98a4b", name: "旅店老板",   shop: "ch09_inn" },
    { id: "weapon", x: 12, y: 5,  color: "#8a93a8", name: "武器店老板", shop: "ch09_weapon" },
    { id: "item",   x: 4,  y: 11, color: "#7ee2a0", name: "杂货店老板", shop: "ch09_item" },
    { id: "camp",   x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["黄老将军箭术通神，就是韩太守待他不好。", "听说关羽也是使刀的好手，这下有好戏看了。"] },
    // 联动彩蛋 D6 · 三国杀：市集打竹牌的孩童（两段口风循环）
    { id: "haitong", x: 6, y: 11, color: "#d8b93a", name: "孩童",
      branches: [
        { if: { flag: "xj_d6", not: "done" }, say: "ch09.xjPai1",
          do: [{ set: { xj_d6: "done" } }] },
        { say: "ch09.xjPai2", do: [{ set: { xj_d6: "p1" } }] },
      ] },
    // 收服战：黄忠（3 回合内逼至三成血即收服；打死则击退可重试）
    { id: "huangzhong", x: 10, y: 1, color: "#c8a03a", name: "黄忠",
      boss: "ch09_huangzhong",
      appearIf: { flag: "q9", is: "wuling" },
      onRecruit: [{ say: "ch09.huangRecruit" }, { join: "魏延" },
                  { giveEquip: "落日弓" }, { set: { q9: "changsha" } },
                  { toast: "黄忠、魏延加入！（黄忠入后备，可去编成所整编）" }],
      onWin: [{ say: "ch09.huangKill" }] },
    // 鲁肃：讨荆州（章末剧情）
    { id: "lusu", x: 8, y: 7, color: "#8ab8d8", name: "鲁肃",
      appearIf: { flag: "q9", is: "lingling" },
      branches: [
        { say: "ch09.lusu",
          do: [{ set: { q9: "done" } }, { say: "ch10.intro" },
               { chapter: "ch10" }, { set: { q10: "start" } }, { join: "庞统" },
               { warp: { map: "ch10_fucheng", x: 10, y: 16 } },
               { toast: "第十章 · 西川风云（庞统随军）" }] },
      ] },
  ],
  chests: [],
  transitions: [
    { x: 10, y: 17, to: { map: "ch09_field_s", x: 16, y: 8 } },
    { x: 11, y: 17, to: { map: "ch09_field_s", x: 16, y: 8 } },
    // 南门：零陵（黄忠收服后开放）
    { x: 10, y: 0,  if: { flag: "q9", is: "changsha" }, to: { map: "ch09_lingling", x: 10, y: 16 } },
    { x: 11, y: 0,  if: { flag: "q9", is: "changsha" }, to: { map: "ch09_lingling", x: 10, y: 16 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 12, y: 11, face: [0, -1], to: { map: "ch09_changsha_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
