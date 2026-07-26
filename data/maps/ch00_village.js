// 地图 · ch00_village 徐家庄（ch00_field 徐州城外的村庄；序章；迷你城镇布局 20×14）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch00_village"] = {
  name: "徐家庄",
  grid: [
    "RRRRRRRRRRRRRRRRRRRR",
    "R..T...........T...R",
    "R.BBBB.....BBBB....R",
    "R.BBBB.....BBBB....R",
    "R.BDBB.....BDBB....R",
    "R..,........,......R",
    "R..,........,...T..R",
    "R..,,,,,,,,,,......R",
    "R.BBBB...,,........R",
    "R.BBBB...,,....v...R",
    "R.BDBB...,,....T...R",
    "R..,,,,,,,.........R",
    "R........,,.....T..R",
    "RRRRRRRRRGGRRRRRRRRR",
  ],
  encounterTiles: [],
  // 建筑招牌（画在建筑顶格）
  signs: [
    { x: 3, y: 2, text: "客", color: "#ffd166" },
    { x: 12, y: 2, text: "药", color: "#ffd166" },
  ],
  // 左下民房：原预留宝箱房，现已可进入（室内 ch00_village_house_in，宝箱位预留）
  npcs: [
    { id: "vil1", x: 14, y: 9, color: "#9a8a6a", name: "老汉",
      lines: ["村里日子还算安稳，就是山里的黄巾余党时不时下来抢粮。"] },
    { id: "vil2", x: 6, y: 7, color: "#8a7a9a", name: "村妇",
      lines: ["曹老太爷在境内遇害，曹将军怕是要兴兵报仇，徐州要遭殃喽。"] },
    { id: "vil3", x: 11, y: 12, color: "#7a8a9a", name: "樵夫",
      lines: ["北边山里有处山洞，黑黢黢的，村里人砍柴都绕着走。"] },
    // 支线 sq1 · 流民聚落：寄居村边的流民（头领发布支线）
    { id: "sq1_boss", x: 13, y: 10, color: "#a89a7a", name: "流民头领",
      branches: [
        { if: { flag: "sq1", is: "done" }, say: "ch00.sq1After" },
        { if: { flag: "sq1", is: "bag" }, say: "ch00.sq1Done",
          do: [{ gold: 800 }, { give: ["金疮药", 2] },
               { set: { sq1: "done" } }, { toast: "流民心意：800 金 + 金疮药×2" }] },
        { if: { flag: "sq1", is: "accept" }, say: "ch00.sq1Accepted" },
        { say: "ch00.sq1Ask",
          do: [{ set: { sq1: "accept" } }, { toast: "接取支线：夺回粮袋（西北山洞深处）" }] },
      ] },
    { id: "sq1_granny", x: 15, y: 12, color: "#9a8a8a", name: "流民老婆婆",
      linesKey: "ch00.sq1Granny" },
    { id: "sq1_kid", x: 13, y: 12, color: "#d8b93a", name: "流民孩童",
      linesKey: "ch00.sq1Kid" },
  ],
  chests: [],
  transitions: [
    // 村口：回徐州城外（落在村图标旁的路上）
    { x: 9, y: 13, to: { map: "ch00_field", x: 4, y: 14 } },
    { x: 10, y: 13, to: { map: "ch00_field", x: 4, y: 14 } },
    // 客栈/药铺室内下钻（朝门才进，路过不触发）
    { x: 3, y: 5, face: [0, -1], to: { map: "ch00_village_inn_in", x: 7, y: 8 } },
    { x: 12, y: 5, face: [0, -1], to: { map: "ch00_village_item_in", x: 7, y: 8 } },
    // 民房下钻（朝门才进，路过不触发）
    { x: 3, y: 11, face: [0, -1], to: { map: "ch00_village_house_in", x: 7, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
