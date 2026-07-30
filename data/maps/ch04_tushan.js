// 地图 · ch04_tushan 土山（第四章：关羽困守，约三事；曹操在此）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch04_tushan"] = {
  name: "土山",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R....R......R..R",
    "G...R..T....R..G",
    "R...R.......R..R",
    "R.T.R..T....R..R",
    "R...R.......R..R",
    "R...R..T....R..R",
    "R..............R",
    "R..T........T..R",
    "R......h.......R",
    "R....T......T..R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: ["."],
  encounterRate: 0.10,
  encounterGroups: [["曹军先锋"], ["曹军先锋", "曹军虎卫"], ["黄巾残党", "黄巾残党"]],
  npcs: [
    // 曹操：约三事 → 暂归曹营；白马坡立功后挂印封金
    { id: "caocao4", x: 7, y: 7, color: "#b03a3a", name: "曹操",
      branches: [
        { if: { flag: "q4", is: "split" },
          do: [{ say: "ch04.yunChangHeart" },
               { ask: { title: "降，还是不降？", options: [
                 { label: "降汉不降曹——约三事",
                   do: [{ say: "ch04.tushan" }, { set: { q4: "tushan" } },
                        { toast: "东门已开：随军去白马坡" }] },
                 { label: "杀出去！关某岂是背义之人",
                   do: [{ battle: "ch04_tuwei",
                          onWin: [{ say: "ch04.tuWeiWin" }, { gold: -1000 },
                                  { toast: "突围耗尽盘缠（金币 -1000）" },
                                  { say: "ch04.tushan" }, { set: { q4: "tushan" } },
                                  { toast: "东门已开：随军去白马坡" }],
                          onLoss: [{ say: "ch04.tuWeiLoss" }, { gold: -3000 },
                                   { toast: "辎重尽失（金币 -3000）" },
                                   { say: "ch04.tushan" }, { set: { q4: "tushan" } },
                                   { toast: "东门已开：随军去白马坡" }] }] },
               ] } }] },
        { if: { flag: "q4", is: "baima" }, say: "ch04.guayin",
          do: [{ set: { q4: "done" } }, { set: { sys_camp: true } },
               { say: "ch05.intro" }, { chapter: "ch05" }, { set: { q5: "start" } },
               { warp: { map: "ch05_dongling", x: 2, y: 8 } },
               { toast: "第五章 · 千里走单骑（编成所开放）" }] },
        { say: ["曹操：云长但放宽心，三事之约，曹某一诺千金。"] },
      ] },
  ],
  chests: [
    { x: 13, y: 9, id: "t1", items: { "还魂丹": 1 } },
  ],
  transitions: [
    // 曹营（约三事期间休整点：客栈/武器/防具/杂货）
    { x: 7, y: 9, to: { map: "ch04_camp", x: 6, y: 8 } },
    // 西门：经芒砀山回徐州城外
    { x: 0,  y: 2, to: { map: "ch04_mangdang", x: 14, y: 2 } },
    // 东门：约三事后通白马坡
    { x: 15, y: 2, if: { flag: "q4", is: "tushan" }, to: { map: "ch04_baima", x: 1, y: 2 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
