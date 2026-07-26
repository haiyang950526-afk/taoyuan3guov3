// ============================================================
// 地图模板（全要素注释版）
// 用法：复制本文件到 data/maps/ 下，改成你的文件名（=地图 key），
//       然后照着注释改内容。改完记得：
//       1) index.html 加 <script src="data/maps/你的图.js"></script>（chapters.js 之前）
//       2) data/chapters.js 对应章节 maps 数组加你的 key
//       3) 跑 python tools/validate.py 自查
// ============================================================
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["my_map"] = {
  name: "示例房间",          // HUD 显示的地名

  // ---------- 地图本体（字符画，每行必须等宽！） ----------
  // 图例：# 城墙  B 建筑  D 门  G 城门  T 树  W 水  R 山石
  //       C 洞口  F 洞地  E 洞出口  M 桥  P 宫殿  . 草地  , 土路
  //       L 室内地板  X 殿柱  s 石板路  v 井  h 村庄图标
  grid: [
    "BBBBBBBBBB",
    "BLLLLLLLLB",
    "BLLBBBBLLB",   // 中间可以用 B 做柜台/隔断
    "BLLBBBBLLB",
    "BLLLLLLLLB",
    "BLLLLLLLLB",
    "BBBBB,BBBB",   // 门口那格用可通行字符（这里用 ,）
  ],

  // ---------- 随机遇敌（室内一般不要，删掉这三行即可） ----------
  // encounterTiles: ["."],          // 哪些格子会遇敌
  // encounterRate: 0.10,            // 每步遇敌概率
  // encounterGroups: [["黄巾贼"]],  // 敌人名必须在 data/enemies.js 里

  // ---------- NPC ----------
  npcs: [
    // 店主：面对按 A 开店（shop id 在 data/items.js 的 SHOPS 里）
    { id: "keeper", x: 4, y: 1, color: "#c98a4b", name: "店主", shop: "vil_item" },
    // 设施：facility 可选 camp(编成所) / smith(铁匠) / tavern(酒馆樗蒲) / dojo(训练所)
    // { id: "smith", x: 6, y: 1, color: "#a87a4a", name: "铁匠", facility: "smith" },
    // 说话 NPC（静态台词）
    { id: "hint", x: 1, y: 1, color: "#4f8cff", name: "路人",
      lines: ["这是一句台词。", "第二句。"] },
    // 条件台词 NPC（按剧情旗标换口风；兜底分支必须放最后）
    // { id: "v1", x: 2, y: 4, color: "#d88a3a", name: "村民",
    //   branches: [
    //     { if: { flag: "q0", is: "accepted" }, say: "接了任务的样子。" },
    //     { say: "平常的样子。" },
    //   ] },
    // 条件出现/消失：appearIf / hideIf，条件写法 {flag, is} {flag, not} {flag, in:[..]} {flag, exists:true}
    // { id: "ghost", x: 8, y: 1, color: "#9aa4b8", name: "神秘人",
    //   appearIf: { flag: "river_god", is: "done" }, lines: ["你见到过河神了？"] },
  ],

  // ---------- 宝箱（宝箱格不可通行，别堵路；物品必须在 data/items.js 里） ----------
  chests: [
    { x: 8, y: 1, id: "c1", gold: 100 },
    // { x: 1, y: 5, id: "c2", items: { "草药": 2, "铜剑": 1 } },
  ],

  // ---------- 招牌（画在某格上方的一个字；用字见指南：客/武/装/药/酒/训/府/铁/书/军/编） ----------
  // signs: [ { x: 5, y: 0, text: "药", color: "#ffd166" } ],

  // ---------- 触发器（踩上去触发剧情；一次性用 flag 控制） ----------
  triggers: [
    // { x: 5, y: 3, if: { flag: "my_event", not: "done" },
    //   do: [{ say: "ch00.riverGod" },                      // 台词路径 data/text.js 里的
    //        { gold: 100 },
    //        { set: { my_event: "done" } },
    //        { toast: "发生了什么！" }] },
  ],

  // ---------- 传送点 ----------
  transitions: [
    // 回城：门口格 → 城外门口旁边一格（不要踩在城外那个"进城传送格"上！）
    { x: 5, y: 6, to: { map: "ch00_city", x: 4, y: 10 } },
    // 进店的标准写法（写在城外）：face 表示朝这个方向走才触发
    // { x: 3, y: 10, face: [0, -1], to: { map: "my_map", x: 5, y: 5 } },
    // 条件传送（剧情解锁才生效）：
    // { x: 0, y: 0, if: { flag: "q1", exists: true }, to: { map: "ch01_field", x: 1, y: 8 } },
  ],

  // ---------- 条件地块（平时显示 A，条件成立才显示 B） ----------
  // tileOverrides: [
  //   { x: 1, y: 1, ch: "C", if: { flag: "tavern_clue", exists: true } },
  // ],
};

if (typeof module !== "undefined") module.exports = MAPS;
