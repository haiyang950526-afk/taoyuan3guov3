// 地图 · ch05_luoyang 洛阳（第五章大城：商店+防具店+编成所；守将韩福）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch05_luoyang"] = {
  name: "洛阳",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#....................#",
    "#..BB......BB.BB..T..#",
    "#..DB......DB.DB.....#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#...T...,,.....T.....#",
    "#.......,,...........#",
    "#.......,,...........#",
    "#..BB...,,.BB.....T..#",
    "#..DB...,,.DB........#",
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
    { x: 3, y: 3, text: "客", color: "#ffd166" },
    { x: 11, y: 3, text: "武", color: "#ffd166" },
    { x: 3, y: 9, text: "药", color: "#ffd166" },
    { x: 11, y: 9, text: "装", color: "#ffd166" },
  ],
  npcs: [
    // 城门口告示牌
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是洛阳。",
              "南门出去是东岭关；北门通向汜水关（时机未到暂不能通行）。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "东南：编成所（老兵）"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    { id: "camp",   x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["洛阳刚遭过兵燹，好在店铺都重开了。", "关将军过五关的事，已经传开了。"] },
    { id: "v2",     x: 15, y: 13, color: "#d88a3a", name: "老者",
      lines: ["城里韩太守表面客气，背地里可不是善茬。", "往北出城就是汜水关。"] },
    // 韩福：第二关守将（在城北门拦路）
    { id: "hanfu", x: 10, y: 1, color: "#6a3a3a", name: "韩福",
      boss: "ch05_hanfu",
      appearIf: { flag: "q5", is: "kongxiu" },
      onWin: [{ set: { q5: "hanfu" } }, { toast: "北门已开，前往汜水关" }] },
  ],
  chests: [
    { x: 18, y: 14, id: "l1", gold: 400 },
  ],
    transitions: [
    { x: 10, y: 17, to: { map: "ch05_dongling", x: 16, y: 8 } },
    { x: 11, y: 17, to: { map: "ch05_dongling", x: 16, y: 8 } },
    { x: 10, y: 0,  if: { flag: "q5", is: "hanfu" }, to: { map: "ch05_sishui", x: 1, y: 8 } },
    { x: 11, y: 0,  if: { flag: "q5", is: "hanfu" }, to: { map: "ch05_sishui", x: 1, y: 8 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch05_inn_in", x: 7, y: 8 } },
    { x: 4, y: 5, face: [0, -1], to: { map: "ch05_inn_in", x: 7, y: 8 } },
    { x: 11, y: 5, face: [0, -1], to: { map: "ch05_weapon_in", x: 7, y: 8 } },
    { x: 12, y: 5, face: [0, -1], to: { map: "ch05_weapon_in", x: 7, y: 8 } },
    { x: 14, y: 5, face: [0, -1], to: { map: "ch05_luoyang_house_in", x: 7, y: 8 } },
    { x: 15, y: 5, face: [0, -1], to: { map: "ch05_luoyang_house_in", x: 7, y: 8 } },
    { x: 3, y: 11, face: [0, -1], to: { map: "ch05_item_in", x: 7, y: 8 } },
    { x: 4, y: 11, face: [0, -1], to: { map: "ch05_item_in", x: 7, y: 8 } },
    { x: 11, y: 11, face: [0, -1], to: { map: "ch05_armor_in", x: 7, y: 8 } },
    { x: 12, y: 11, face: [0, -1], to: { map: "ch05_armor_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
