// 地图 · ch00_city 徐州城（序章主城；指引样板城：南北主路+东西横街，店铺下钻，北部太守府）
// 浏览器共享全局 MAPS；node 各自导出，由测试脚本合并
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch00_city"] = {
  name: "徐州城",
  grid: [
    "########################",
    "#.....BBBBBBBBBBBBBB...#",
    "#.....BPPPPPPPPBBBBB...#",
    "#.....BBBBDBBBBBBDBB...#",
    "#.........,,...........#",
    "#....T....,,......T....#",
    "#.BBBBBBBB,,..BBBBBBBB.#",
    "#.BBBBBBBB,,..BBBBBBBB.#",
    "#.BDBBBDBB,,..BDBBBDBB.#",
    "#,,,,,,,,,,,,,,,,,,,,,,#",
    "#.........,,...........#",
    "#.BBBB....,,......BBBB.#",
    "#.BBBB..v.,,......BBBB.#",
    "#.BDBB....,,......BDBB.#",
    "#,,,,,,,,,,,,,,,,,,,,,,#",
    "#.........,,...........#",
    "#....T....,,......T....#",
    "##########GG############",
  ],
  encounterTiles: [],
  // 建筑招牌（画在顶部居中的 B 格上）
  signs: [
    { x: 10, y: 1,  text: "府", color: "#ffd166" },
    { x: 3,  y: 6,  text: "客", color: "#ffd166" },
    { x: 7,  y: 6,  text: "酒", color: "#ffd166" },
    { x: 15, y: 6,  text: "武", color: "#ffd166" },
    { x: 19, y: 6,  text: "装", color: "#ffd166" },
    { x: 3,  y: 11, text: "药", color: "#ffd166" },
    { x: 19, y: 11, text: "训", color: "#ffd166" },
  ],
  npcs: [
    // 城门口告示牌
    { id: "board1", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是徐州城。",
              "南门出去即是徐州城外。",
              "横街西：旅店·酒馆　横街东：武器店·防具店",
              "南横街：杂货店（西）·训练所（东）　北：太守府　东南：编成所（老兵）"] },
    // 主路十字路口告示牌（立在路口东南角，不挡路面）
    { id: "board2", x: 12, y: 10, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：西：旅店·酒馆　东：武器店·防具店",
              "南：杂货店·训练所　北：太守府"] },
    // 村民指路：按序章任务阶段换口风
    { id: "v1", x: 7, y: 11, color: "#4f8cff", name: "村民",
      branches: [
        { if: { flag: "q0", is: "notStarted" }, say: "ch00.v1Before" },
        { if: { flag: "q0", is: "accepted" },   say: "ch00.v1Accepted" },
        { if: { flag: "q0", is: "bossDone" },   say: "ch00.v1BossDone" },
        { say: "ch00.v1Done" },
      ] },
    { id: "v2", x: 15, y: 13, color: "#d88a3a", name: "村民",
      branches: [
        { if: { flag: "q0", is: "notStarted" }, say: "ch00.v2Before" },
        { if: { flag: "q0", is: "accepted" },   say: "ch00.v2Accepted" },
        { if: { flag: "q0", is: "bossDone" },   say: "ch00.v2BossDone" },
        { say: "ch00.v2Done" },
      ] },
    // 编成所（主城设施：出战/后备调换、阵形、军师）
    { id: "camp",   x: 16, y: 11, color: "#7a8a9a", name: "老兵", facility: "camp" },
    // 曹操使者：序章任务发布人；进入第一章后离城
    { id: "envoy",  x: 9, y: 16, color: "#b03a3a", name: "曹操使者",
      hideIf: { flag: "q1", exists: true },
      branches: [
        { if: { flag: "q0", is: "notStarted" }, say: "ch00.envoyOffer",
          do: [{ set: { q0: "accepted" } }, { toast: "接取任务：讨伐黄巾余党" }] },
        { if: { flag: "q0", is: "accepted" }, say: "ch00.envoyAccepted" },
        { if: { flag: "q0", is: "bossDone" }, say: "ch00.envoyReward",
          do: [{ gold: 1000 }, { set: { q0: "done" } }, { toast: "获得 1000 金！" }] },
        { say: "ch00.envoyDone",
          do: [{ chapter: "ch01" }, { set: { q1: "start" } },
               { say: "ch01.intro" }, { toast: "第一章 · 父仇之火" }] },
      ] },
    // 报信兵：第二章接印后出现，引出吕布来投
    { id: "soldier", x: 8, y: 5, color: "#9aa4b8", name: "报信兵",
      appearIf: { flag: "q2", is: "seal" },
      branches: [
        { say: "ch02.soldierLvbu",
          do: [{ set: { q2: "lvbu" } }, { toast: "城外东北方向（小沛）已可通行" }] },
      ] },
    // 报信兵：第四章据徐州后来报曹操亲征
    { id: "soldier4", x: 12, y: 5, color: "#9aa4b8", name: "报信兵",
      appearIf: { flag: "q4", is: "xuzhou" },
      branches: [
        { say: "ch04.baoxin",
          do: [{ set: { q4: "ye" } }, { toast: "出城夜袭曹营（城外北面路口）" }] },
      ] },
    // 彩蛋 · 织席贩履：横街西头街角的卖履老翁（序章起常驻，一次性赠旧草鞋）
    { id: "oldshoes", x: 1, y: 9, color: "#a89a7a", name: "卖履老翁",
      branches: [
        { if: { flag: "egg_shoes", is: "done" }, say: "ch00.oldShoesDone" },
        { say: "ch00.oldShoes1",
          do: [{ say: "ch00.oldShoes2" }, { giveEquip: "旧草鞋" },
               { set: { egg_shoes: "done" } }] },
      ] },
  ],
  chests: [
    { x: 20, y: 5, id: "c1", gold: 150 },
  ],
  transitions: [
    { x: 10, y: 17, to: { map: "ch00_field", x: 11, y: 16 } },
    { x: 11, y: 17, to: { map: "ch00_field", x: 11, y: 16 } },
    // 太守府大殿（朝北向门口多走一步才进）
    { x: 10, y: 4,  face: [0, -1], to: { map: "ch00_palace", x: 5, y: 7 } },
    // 店铺室内下钻（同样朝门才进，路过不触发）
    { x: 3,  y: 9,  face: [0, -1], to: { map: "ch00_inn_in", x: 7, y: 8 } },
    { x: 7,  y: 9,  face: [0, -1], to: { map: "ch00_tavern_in", x: 7, y: 8 } },
    { x: 15, y: 9,  face: [0, -1], to: { map: "ch00_weapon_in", x: 7, y: 8 } },
    { x: 19, y: 9,  face: [0, -1], to: { map: "ch00_armor_in", x: 7, y: 8 } },
    { x: 3,  y: 14, face: [0, -1], to: { map: "ch00_item_in", x: 7, y: 8 } },
    { x: 19, y: 14, face: [0, -1], to: { map: "ch00_dojo_in", x: 7, y: 8 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 17, y: 4, face: [0, -1], to: { map: "ch00_city_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
