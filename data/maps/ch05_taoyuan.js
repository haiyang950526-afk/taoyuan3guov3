// 地图 · ch05_taoyuan 桃花源（第五章隐藏小图：渡口上游水边两格条件传送进入，参考藏宝山洞结构）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch05_taoyuan"] = {
  name: "桃花源",
  grid: [
    "RRRRRRRRRRRR",
    "RTTTTTTTTTTR",
    "RT........TR",
    "RT.,,,,,,.TR",
    "RT.,.BB.,.TR",
    "RT.,.DB.,.TR",
    "RT.,,,,,,.TR",
    "RE........ER",
    "RRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [
    // 桃源人：首次迎客（桃花酿=全恢复+仙草露×2），之后送客
    { id: "taoyuanren", x: 4, y: 6, color: "#d8a86a", name: "桃源人",
      branches: [
        { if: { flag: "egg_taohua", is: "done" }, say: "ch05.taoyuanOut" },
        { say: "ch05.taoyuanIn",
          do: [{ healAll: true }, { give: ["仙草露", 2] },
               { set: { egg_taohua: "done" } }] },
      ] },
  ],
  chests: [],
    transitions: [
    { x: 1,  y: 7, to: { map: "ch05_ferry", x: 15, y: 8 } },
    { x: 10, y: 7, to: { map: "ch05_ferry", x: 15, y: 8 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
