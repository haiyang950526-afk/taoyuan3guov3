// 地图 · ch01_tancheng 郯城（第一章主城：旅店+武器店+防具店+杂货店+守将；招牌+主路+告示牌）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch01_tancheng"] = {
  name: "郯城",
  grid: [
    "######################",
    "#....T..,,......T....#",
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
    "#.BBBB....,,.........#",
    "#.BBBB....,,.........#",
    "#.BDBB....,,.........#",
    "#v........,,.........#",
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
    // 城门口告示牌
    { id: "board", x: 12, y: 16, color: "#8a7a5a", name: "告示牌",
      lines: ["告示：此处是郯城。",
              "南门出去即是郯城野外。",
              "西街：旅店·杂货店　东街：武器店·防具店",
              "东南府邸：郯城守将"] },
    // 店主已迁入各自店内（门口 D 格朝门下钻）
    // 名品 · 密语事件1（wh1）：同一村民两次对话——寒暄 → 密语（城西枯井藏六韬残页）
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "村民",
      branches: [
        { if: { flag: "wh1", in: ["told", "done"] }, say: "ch01.tanVillagerDone" },
        { if: { flag: "wh1", is: "met" }, say: "ch01.tanVillager2",
          do: [{ set: { wh1: "told" } }, { toast: "城西枯井边，似有旧物" }] },
        { say: "ch01.tanVillager", do: [{ set: { wh1: "met" } }] },
      ] },
    { id: "v2",     x: 15, y: 13, color: "#d88a3a", name: "老者", linesKey: "ch01.tanElder" },
    // 郯城守将：第一章任务链引导人
    { id: "general", x: 12, y: 11, color: "#b03a3a", name: "郯城守将",
      branches: [
        { if: { flag: "q1", is: "accepted" }, say: "ch01.tanGeneral1",
          do: [{ set: { q1: "ready" } }, { toast: "出城在大路上巡哨一遭" }] },
        { if: { flag: "q1", is: "ready" }, say: "ch01.tanGeneral1" },
        { if: { flag: "q1", is: "patrolDone" }, say: "ch01.tanGeneral2",
          do: [{ set: { q1: "march" } }, { toast: "泗水古道（野外东门）已可通行" }] },
        { if: { flag: "q1", is: "march" }, say: "ch01.tanGeneral2" },
        { if: { flag: "q1", is: "yujinDone" },
          say: ["于禁已退，曹操大军拔营东归！", "快回徐州城，向陶使君报捷吧。"] },
      ] },
  ],
  chests: [],
  triggers: [
    // 名品 · 密语事件1：城西枯井（v 格旁）摸到油布包——六韬残页（引擎挂钩 relic_liutao）
    { x: 2, y: 16, if: { flag: "wh1", is: "told" },
      do: [{ say: "ch01.liuTao" }, { giveEquip: "六韬残页" },
           { set: { wh1: "done" } }, { set: { relic_liutao: true } }] },
  ],
  transitions: [
    { x: 10, y: 17, to: { map: "ch01_field", x: 11, y: 1 } },
    { x: 11, y: 17, to: { map: "ch01_field", x: 11, y: 1 } },
    // 店铺室内下钻（朝门才进，路过不触发）
    { x: 4,  y: 5,  face: [0, -1], to: { map: "ch01_inn_in", x: 7, y: 8 } },
    { x: 12, y: 5,  face: [0, -1], to: { map: "ch01_weapon_in", x: 7, y: 8 } },
    { x: 13, y: 5,  face: [0, -1], to: { map: "ch01_armor_in", x: 7, y: 8 } },
    { x: 4,  y: 11, face: [0, -1], to: { map: "ch01_item_in", x: 7, y: 8 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 3, y: 16, face: [0, -1], to: { map: "ch01_tancheng_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
