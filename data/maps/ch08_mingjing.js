// 地图 · ch08_mingjing 明镜观（渡魂记 · 第八章：郯城北郊野道观旧址，铜镜补完背景）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch08_mingjing"] = {
  name: "明镜观",
  grid: [
    "BBBBBBBB",
    "BLLLLLLB",
    "BLLLLLLB",
    "BLLLLLLB",
    "BLLLLLLB",
    "BBBB,,BB",
  ],
  encounterTiles: [],
  npcs: [],
  chests: [],
  triggers: [
    // 已取镜：空殿
    { x: 4, y: 2, if: { flag: "relic_tongjing", exists: true },
      do: [{ say: ["（殿内空空，蒲团上只余一圈薄尘。）"] }] },
    // 四遗物 flag 齐（以最晚的白莲为凭）：取镜后追加共鸣
    { x: 4, y: 2, if: { flag: "relic_bailian", exists: true },
      do: [{ say: "ch08.dhMirror" }, { give: ["破碎的铜镜", 1] },
           { set: { relic_tongjing: true } }, { say: "ch08.dhMirrorAll" }] },
    // 取镜（一次性）
    { x: 4, y: 2, do: [{ say: "ch08.dhMirror" }, { give: ["破碎的铜镜", 1] },
                       { set: { relic_tongjing: true } }] },
  ],
  transitions: [
    { x: 4, y: 5, to: { map: "ch01_field", x: 2, y: 1 } },
    { x: 5, y: 5, to: { map: "ch01_field", x: 2, y: 1 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
