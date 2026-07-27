// 地图 · ch10_fucheng 涪城（第十章：涪城宴，庞统随军）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_fucheng"] = {
  name: "涪城",
  grid: [
    "##########GG##########",
    "#.......,,,,.........#",
    "#....................#",
    "#..BB......BB.....T..#",
    "#..DB......DB........#",
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
  ],
  npcs: [
    // 城门口告示牌（北门内侧路旁）
    { id: "board", x: 12, y: 1, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是涪城。",
              "北门出去是西川野外。",
              "城西北有旅店，可歇脚投宿。"] },
    { id: "inn", x: 4, y: 5, color: "#c98a4b", name: "旅店老板", shop: "ch10b_inn" },
    { id: "v1",  x: 7, y: 7, color: "#4f8cff", name: "市民",
      lines: ["刘使君与我家主公同宗，此番入蜀是客。", "张任将军镇守雒城，是蜀中第一忠勇。"] },
    // 刘璋：涪城宴
    { id: "liuzhang", x: 10, y: 1, color: "#b8a05a", name: "刘璋",
      appearIf: { flag: "q10", is: "start" },
      branches: [
        { say: "ch10.fu",
          do: [{ set: { q10: "fu" } }, { toast: "北攻雒城（野外北门）" }] },
      ] },
  ],
  chests: [],
    transitions: [
    { x: 10, y: 0,  to: { map: "ch10_field", x: 10, y: 16 } },
    { x: 11, y: 0,  to: { map: "ch10_field", x: 10, y: 16 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 11, y: 11, face: [0, -1], to: { map: "ch10_fucheng_house_in", x: 7, y: 8 } },
    { x: 12, y: 11, face: [0, -1], to: { map: "ch10_fucheng_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
