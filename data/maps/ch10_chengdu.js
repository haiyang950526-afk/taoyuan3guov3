// 地图 · ch10_chengdu 成都（第十章主城：大宝库+防具店+铁匠铺+酒馆+训练所；受降文戏）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10_chengdu"] = {
  name: "成都",
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
      lines: ["告示：此处是成都。",
              "南门出去是西川野外；东门通向定军山（时机未到暂不能通行）。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "城东：酒馆（樗蒲）　东南：铁匠铺·训练所·编成所"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    { id: "smith",  x: 12, y: 11, color: "#a87a4a", name: "铁匠", facility: "smith" },
    { id: "camp",   x: 16, y: 13, color: "#7a8a9a", name: "老兵", facility: "camp" },
    // 酒馆（樗蒲）：城东露天酒摊
    { id: "tavern", x: 16, y: 7,  color: "#b08a4a", name: "酒馆老板", facility: "tavern" },
    // 训练所：城东南露天校场（编成所旁）
    { id: "dojo",   x: 17, y: 13, color: "#8a7a6a", name: "教头", facility: "dojo" },
    // 麦城篇入口（10 文档）：定军山之后，荆州信使来报，POV 切关羽
    { id: "mc_start", x: 11, y: 15, color: "#9aa4b8", name: "荆州信使",
      appearIf: { all: [{ flag: "q10", is: "done" }, { flag: "q10m", not: "done" }] },
      branches: [
        { say: "ch10m.intro",
          do: [{ partySwap: { lv: 48, members: ["关羽", "周仓", "关平", "廖化"] } },
               { set: { q10m: "start" } },
               { warp: { map: "ch10m_fanying", x: 8, y: 7 } },
               { toast: "间章 · 麦城悲歌（临时队伍：关羽/周仓/关平/廖化）" }] },
      ] },
    // 开放式选择 · 庞统伤退（12 文档 B-5）：送别 + ch11 病榻探看
    { id: "pt_home", x: 5, y: 7, color: "#9a7ab8", name: "庞统",
      appearIf: { flag: "pt_alive", exists: true },
      branches: [
        { if: { all: [{ flag: "q11", exists: true }, { flag: "mt_phoenix", not: "done" }] },
          say: "ch10.ptCh11Alive",
          do: [{ giveEquip: "凤雏手卷" }, { set: { relic_fengchu: true } },
               { set: { mt_phoenix: "done" } }] },
        { say: "ch10.ptFarewell" },
      ] },
    { id: "pt_bed", x: 5, y: 7, color: "#9a7ab8", name: "庞统",
      appearIf: { flag: "pt_coma", exists: true },
      branches: [
        { if: { flag: "q11", exists: true }, say: "ch10.ptCh11Coma" },
        { say: "ch10.ptFarewellComa" },
      ] },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",
      lines: ["天府之国，总算迎来了明主。", "铁匠铺能强化兵器，就是精铁难得。"] },
    // 联动彩蛋 A6 · 兜售秘籍：巷口精瘦汉子与吐槽路人
    { id: "miji",   x: 19, y: 11, color: "#8a7a5a", name: "精瘦汉子",
      linesKey: "ch10.xjKui1" },
    { id: "luren",  x: 18, y: 12, color: "#7a8a9a", name: "路人",
      linesKey: "ch10.xjKui2" },
    // 渡魂记 · 第十章：卖花女孩（需白莲；买一朵 10 金）
    { id: "flower", x: 17, y: 8, color: "#e8a8b8", name: "卖花女孩",
      appearIf: { flag: "relic_bailian", exists: true },
      branches: [
        { ask: { title: "卖花女孩：将军买朵花吧！", options: [
          { label: "买一朵（10金）", say: "ch10.dhFlower", do: [{ gold: -10 }] },
          { label: "不买", say: "ch10.dhFlowerNo" }] } },
      ] },
    // 刘璋：成都受降
    { id: "liuzhang10", x: 10, y: 1, color: "#b8a05a", name: "刘璋",
      appearIf: { flag: "q10", is: "mianzhu" },
      branches: [
        { say: "ch10.chengdu",
          do: [{ set: { q10: "chengdu" } }, { toast: "东出定军山，争夺汉中（东门）" }] },
      ] },
  ],
  chests: [
    { x: 18, y: 14, id: "c1", items: { "精铁": 2 } },
  ],
    transitions: [
    { x: 21, y: 8,  if: { flag: "q10", is: "chengdu" }, to: { map: "ch10_dingjun", x: 1, y: 8 } },
    { x: 21, y: 9,  if: { flag: "q10", is: "chengdu" }, to: { map: "ch10_dingjun", x: 1, y: 8 } },
    { x: 10, y: 17, to: { map: "ch10_field", x: 22, y: 8 } },
    { x: 11, y: 17, to: { map: "ch10_field", x: 22, y: 8 } },
    // 室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch10_inn_in", x: 7, y: 8 } },
    { x: 4, y: 5, face: [0, -1], to: { map: "ch10_inn_in", x: 7, y: 8 } },
    { x: 10, y: 5, face: [0, -1], to: { map: "ch10_weapon_in", x: 7, y: 8 } },
    { x: 11, y: 5, face: [0, -1], to: { map: "ch10_weapon_in", x: 7, y: 8 } },
    { x: 13, y: 5, face: [0, -1], to: { map: "ch10_armor_in", x: 7, y: 8 } },
    { x: 14, y: 5, face: [0, -1], to: { map: "ch10_armor_in", x: 7, y: 8 } },
    { x: 3, y: 11, face: [0, -1], to: { map: "ch10_item_in", x: 7, y: 8 } },
    { x: 4, y: 11, face: [0, -1], to: { map: "ch10_item_in", x: 7, y: 8 } },
    { x: 2, y: 16, face: [0, -1], to: { map: "ch10_chengdu_house_in", x: 7, y: 8 } },
    { x: 3, y: 16, face: [0, -1], to: { map: "ch10_chengdu_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
