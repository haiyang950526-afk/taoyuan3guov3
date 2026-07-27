// 地图 · ch11_hanzhong 汉中（终章主城：军需商店；出师表）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch11_hanzhong"] = {
  name: "汉中",
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
    // 北门口告示牌
    { id: "board", x: 12, y: 1, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是汉中。",
              "北门出兵天水（时机未到暂不能通行）。",
              "西街：军需客栈·药材铺　东街：武器·防具",
              "东南：铁匠铺·编成所（老兵）"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    { id: "smith",  x: 16, y: 11, color: "#a87a4a", name: "铁匠", facility: "smith" },
    { id: "camp",   x: 16, y: 13, color: "#7a8a9a", name: "老兵", facility: "camp" },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["丞相《出师表》，军中人人传诵。", "北伐北伐！还于旧都！"] },
    // 诸葛亮：出师表
    { id: "zhuge11", x: 10, y: 1, color: "#e8e8f0", name: "诸葛亮",
      appearIf: { flag: "q11", is: "start" },
      branches: [
        { say: "ch11.intro",
          do: [{ set: { q11: "tianshui" } }, { toast: "出兵天水（北门外）" }] },
      ] },
  ],
  chests: [],
    transitions: [
    { x: 10, y: 0,  if: { flag: "q11", in: ["tianshui", "jiangwei"] }, to: { map: "ch11_tianshui", x: 8, y: 10 } },
    { x: 11, y: 0,  if: { flag: "q11", in: ["tianshui", "jiangwei"] }, to: { map: "ch11_tianshui", x: 8, y: 10 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch11_inn_in", x: 7, y: 8 } },
    { x: 4, y: 5, face: [0, -1], to: { map: "ch11_inn_in", x: 7, y: 8 } },
    { x: 11, y: 5, face: [0, -1], to: { map: "ch11_weapon_in", x: 7, y: 8 } },
    { x: 12, y: 5, face: [0, -1], to: { map: "ch11_weapon_in", x: 7, y: 8 } },
    { x: 14, y: 5, face: [0, -1], to: { map: "ch11_hanzhong_house_in", x: 7, y: 8 } },
    { x: 15, y: 5, face: [0, -1], to: { map: "ch11_hanzhong_house_in", x: 7, y: 8 } },
    { x: 3, y: 11, face: [0, -1], to: { map: "ch11_item_in", x: 7, y: 8 } },
    { x: 4, y: 11, face: [0, -1], to: { map: "ch11_item_in", x: 7, y: 8 } },
    { x: 11, y: 11, face: [0, -1], to: { map: "ch11_armor_in", x: 7, y: 8 } },
    { x: 12, y: 11, face: [0, -1], to: { map: "ch11_armor_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
