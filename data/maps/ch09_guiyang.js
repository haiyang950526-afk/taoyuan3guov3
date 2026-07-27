// 地图 · ch09_guiyang 桂阳（第九章首城：四郡集市+黑市游商；Boss 赵范部将）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch09_guiyang"] = {
  name: "桂阳",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#....................#",
    "#..BB.....BB.BB...T..#",
    "#..DB.....DB.DB......#",
    "#,,,,,,,,,,,,,,,,,,,,#",
    "#...T...,,.....T.....#",
    "#.......,,...........#",
    "#.......,,...........#",
    "#..BB...,,.BB.....T..#",
    "#..DB...,,.DB........#",
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
    // 北门口告示牌
    { id: "board", x: 12, y: 1, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是桂阳。",
              "北门出去是荆南北野，往北可取武陵。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "东南：荆州游商·编成所（老兵）"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    { id: "black",  x: 12, y: 11, color: "#b85a8a", name: "荆州游商",   shop: "ch09_black" },
    { id: "camp",   x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["城里来了个荆州游商，东西好是好，就是贵。", "赵云将军取桂阳，百姓都盼着太平。"] },
    // Boss：赵范部将（赵云取桂阳）
    { id: "zhaofan", x: 10, y: 1, color: "#5a6a4a", name: "赵范部将",
      boss: "ch09_guiyang",
      appearIf: { flag: "q9", is: "start" },
      onWin: [{ set: { q9: "guiyang" } }, { toast: "桂阳已定，北取武陵（野外北门）" }] },
  ],
  chests: [
    { x: 18, y: 14, id: "g1", gold: 900 },
  ],
    transitions: [
    { x: 10, y: 0,  to: { map: "ch09_field_n", x: 10, y: 10 } },
    { x: 11, y: 0,  to: { map: "ch09_field_n", x: 10, y: 10 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch09_inn_in", x: 7, y: 8 } },
    { x: 4, y: 5, face: [0, -1], to: { map: "ch09_inn_in", x: 7, y: 8 } },
    { x: 10, y: 5, face: [0, -1], to: { map: "ch09_weapon_in", x: 7, y: 8 } },
    { x: 11, y: 5, face: [0, -1], to: { map: "ch09_weapon_in", x: 7, y: 8 } },
    { x: 13, y: 5, face: [0, -1], to: { map: "ch09_armor_in", x: 7, y: 8 } },
    { x: 14, y: 5, face: [0, -1], to: { map: "ch09_armor_in", x: 7, y: 8 } },
    { x: 3, y: 11, face: [0, -1], to: { map: "ch09_item_in", x: 7, y: 8 } },
    { x: 4, y: 11, face: [0, -1], to: { map: "ch09_item_in", x: 7, y: 8 } },
    { x: 2, y: 16, face: [0, -1], to: { map: "ch09_guiyang_house_in", x: 7, y: 8 } },
    { x: 3, y: 16, face: [0, -1], to: { map: "ch09_guiyang_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
