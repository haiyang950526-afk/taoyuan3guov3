// 地图 · ch11_wuzhang 五丈原（终章大迷宫：八卦阵——按顺序破 4 阵眼，踩错回入口；最终 Boss 司马懿）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 阵眼顺序：生门(东南) → 景门(西北) → 开门(东北) → 杜门(西南)
// 踩错顺序或踩上伪阵眼，阵法逆转，传送回入口。
var WZ_TRIGGERS = (function () {
  var eyes = [[13, 11, "eye1", null, "生门已破"], [5, 4, "eye2", "eye1", "景门已破"],
              [14, 4, "eye3", "eye2", "开门已破"], [6, 11, "eye4", "eye3", "杜门已破"]];
  var list = [];
  eyes.forEach(function (e) {
    var x = e[0], y = e[1], flag = e[2], prev = e[3], label = e[4];
    // 正确顺序：破阵 + 计数（第四眼破后推进主线）
    var acts = [{ set: (function () { var o = {}; o[flag] = true; return o; })() },
                { inc: { eyes: 1 } },
                { toast: label }];
    if (flag === "eye4") acts.push({ set: { q11: "wuzhang" } },
      { toast: "四眼尽破——司马懿现身中军！" });
    list.push({ x: x, y: y, if: prev ? { flag: prev, is: true } : { flag: flag, not: true },
      do: acts });
    // 错误顺序：回入口
    if (prev) list.push({ x: x, y: y, if: { flag: prev, not: true },
      do: [{ toast: "阵法逆转！" }, { warp: { map: "ch11_wuzhang", x: 9, y: 14 } }] });
  });
  // 伪阵眼（障眼法）
  [[10, 7], [7, 8], [12, 8], [10, 3], [4, 7], [15, 7]].forEach(function (d) {
    list.push({ x: d[0], y: d[1],
      do: [{ toast: "伪阵眼——阵法逆转！" }, { warp: { map: "ch11_wuzhang", x: 9, y: 14 } }] });
  });
  return list;
})();

MAPS["ch11_wuzhang"] = {
  name: "五丈原",
  grid: [
    "RRRRRRRRRRRRRRRRRRRR",
    "R....T........T....R",
    "R..................R",
    "R..T............T..R",
    "R..................R",
    "R......T....T......R",
    "R..................R",
    "R..T..........T....R",
    "R..................R",
    "R......T....T......R",
    "R..................R",
    "R..T............T..R",
    "R..................R",
    "R....T........T....R",
    "R........,,........R",
    "RRRRRRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["司马懿亲军"], ["魏军虎贲", "司马懿亲军"]],
  npcs: [
    // 姜维提示破阵顺序
    { id: "jw_hint", x: 9, y: 13, color: "#6ab8a8", name: "姜维",
      appearIf: { flag: "eyes", not: 4 },
      branches: [
        { say: ["姜维：此八卦阵，须按门破之——",
                "先东南生门，再西北景门，再东北开门，末西南杜门。",
                "踩错一步，阵法逆转，便退回入口。"] },
      ] },
    // 最终 Boss：司马懿（四阵眼尽破后现身）
    { id: "simayi", x: 9, y: 1, color: "#2a2a4a", name: "司马懿",
      boss: "ch11_simayi",
      appearIf: { flag: "eyes", is: 4 },
      onWin: [{ say: "ch11.wuzhangStarSelection" },
              { ask: { title: "替丞相拿起哪一件旧物？", options: [
                { label: "半截断弦（长江的风）",
                  do: [{ say: "ch11.starItemZhouYu" }, { set: { star_item: "zhouyu" } }] },
                { label: "一双旧草鞋（隆中的雪）",
                  do: [{ say: "ch11.starItemLiuBei" }, { set: { star_item: "liubei" } }] },
                { label: "半卷焦竹简（街亭的火）",
                  do: [{ say: "ch11.starItemMaSu" }, { set: { star_item: "masu" } }] },
              ] } },
              { say: "ch11.wuzhangStarEndPre" },
              { ask: { title: "七星灯前", options: [
                { label: "缓缓伸出手，替丞相拂灭此灯",
                  do: [{ say: "ch11.wuzhangStarEndA" }] },
                { label: "收回手——丞相还要再与天争一时",
                  do: [{ say: "ch11.wuzhangStarEndB" }] },
              ] } },
              { set: { q11: "done" } }, { theEnd: true }] },
  ],
  chests: [
    { x: 17, y: 11, id: "w1", items: { "七星杖": 1 } },
    { x: 1, y: 1, id: "w2", items: { "遁甲天书": 1 } }, // 名品 · 遁甲天书：西北角深处隐藏箱
  ],
  triggers: WZ_TRIGGERS.concat([
    // 渡魂记 · 终章：托付遗物包裹（需白莲，一次性；已托付则指路）
    { x: 8, y: 3, if: { flag: "relic_package", exists: true },
      do: [{ say: ["（布包在怀里，沉甸甸的。丞相说：埋在洛阳，花开得最多的地方。）",
                   "（西南角似有通路，隐隐透着花香。）"] }] },
    { x: 8, y: 3, if: { flag: "relic_bailian", exists: true },
      do: [{ say: "ch11.dhTrust" }, { give: ["遗物包裹", 1] },
           { set: { relic_package: true } }] },
    // 彩蛋 · 七星灯：主帅帐旁，一次性（护灯得七星杖线索 / 凑近被姜维拦下）
    { x: 8, y: 2, if: { flag: "egg_qixing", not: "done" },
      do: [{ say: "ch11.qiXingDeng" },
           { ask: { title: "七星灯", options: [
             { label: "远远肃立，替丞相护灯", say: "ch11.qiXingHu",
               do: [{ toast: "七星杖的线索：汉中军需" }] },
             { label: "凑近看看", say: "ch11.qiXingKao" }] } },
           { set: { egg_qixing: "done" } }] },
  ]),
  transitions: [
    { x: 9,  y: 14, to: { map: "ch11_qishan", x: 16, y: 8 } },
    { x: 10, y: 14, to: { map: "ch11_qishan", x: 16, y: 8 } },
    // 渡魂记 · 终章：西南角通往洛阳废墟·白莲花海（托付包裹后开放）
    { x: 1, y: 14, if: { flag: "relic_package", exists: true }, to: { map: "ch11_luoyang", x: 2, y: 8 } },
  ],
  // 渡魂记：托付包裹后，西南角荒草间露出一条小路（洞口）
  tileOverrides: [
    { x: 1, y: 14, ch: "C", if: { flag: "relic_package", exists: true } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
