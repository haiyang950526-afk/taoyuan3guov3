// 地图 · ch06_xiangyang 襄阳（第六章：文房铺卖计策书；蔡瑁设宴）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch06_xiangyang"] = {
  name: "襄阳",
  grid: [
    "##########GG##########",
    "#.......,,...........#",
    "#.........PP.........#",
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
    // 城门口告示牌（南门内侧路旁）
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是襄阳。",
              "北门出去是新野野外。",
              "西北：旅店　东北：文房铺（计策书）　东南：编成所（老兵）"] },
    // 文房铺老板已迁入店内（门口 D 格朝门下钻）
    { id: "camp", x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    { id: "v1",   x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["文房铺新到了计策书，读书人都去瞧瞧。", "蔡瑁将军设宴，城里最近热闹得很。"] },
    { id: "v2",   x: 15, y: 13, color: "#d88a3a", name: "老者",
      lines: ["司马徽先生住在城东南的水镜庄。", "卧龙凤雏，得一可安天下啊。"] },
    // 蔡瑁：设宴（剧情杀前奏）
    { id: "caimao", x: 10, y: 1, color: "#b03a3a", name: "蔡瑁",
      appearIf: { flag: "q6", is: "feast" },
      branches: [
        { say: "ch06.feast",
          do: [{ set: { q6: "tanxi" } },
               { warp: { map: "ch06_tunnel", x: 1, y: 9 } },
               { toast: "蔡瑁伏兵四起——从地道突围，往檀溪渡口去！" }] },
      ] },
  ],
  chests: [],
    transitions: [
    { x: 10, y: 0,  to: { map: "ch06_field", x: 10, y: 16 } },
    { x: 11, y: 0,  to: { map: "ch06_field", x: 10, y: 16 } },
    // 檀溪脱出期间：回地道入口（宴席突围后若从西口误出襄阳，可由此重返地道，否则卡死）
    { x: 10, y: 3, if: { flag: "q6", is: "tanxi" }, to: { map: "ch06_tunnel", x: 1, y: 9 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch06b_inn_in", x: 7, y: 8 } },
    { x: 4, y: 5, face: [0, -1], to: { map: "ch06b_inn_in", x: 7, y: 8 } },
    { x: 11, y: 5, face: [0, -1], to: { map: "ch06_book_in", x: 7, y: 8 } },
    { x: 12, y: 5, face: [0, -1], to: { map: "ch06_book_in", x: 7, y: 8 } },
    { x: 3, y: 11, face: [0, -1], to: { map: "ch06_xiangyang_house_in", x: 7, y: 8 } },
    { x: 4, y: 11, face: [0, -1], to: { map: "ch06_xiangyang_house_in", x: 7, y: 8 } },
    { x: 11, y: 11, face: [0, -1], to: { map: "ch06_xiangyang_house_in", x: 7, y: 8 } },
    { x: 12, y: 11, face: [0, -1], to: { map: "ch06_xiangyang_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
