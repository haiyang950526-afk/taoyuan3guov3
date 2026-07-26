// 地图 · ch11_luoyang 洛阳废墟·白莲花海（渡魂记终点：托付包裹后自五丈原来，埋花得白莲之种）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch11_luoyang"] = {
  name: "洛阳废墟",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "RBB.TTTTTTTT.BBR",
    "R...TTTTTTTT...R",
    "R.TTTTTT,TTTTT.R",
    "R.TTTTT,,,TTTT.R",
    "R.TTTTT,,,TTTT.R",
    "R.TTTTT,,,TTTT.R",
    "R.TTTTTT,TTTTT.R",
    "RE....,,,,,....R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [
    // 渡魂记 · 终章：张姓炊饼翁（木牌"姓张的"回收；包裹入土，得白莲之种）
    { id: "oldman", x: 8, y: 5, color: "#b8a05a", name: "卖炊饼的老者",
      branches: [
        { if: { flag: "relic_seed", exists: true },
          say: ["老者：下回来，带块热的炊饼。"] },
        { if: { flag: "relic_package", exists: true },
          say: "ch11.dhField",
          do: [{ say: "ch11.dhBury" }, { say: "ch11.dhSeed" },
               { giveEquip: "白莲之种" }, { set: { relic_seed: true } }] },
        { say: ["（花海中央，老者对着空凳子喃喃自语，听不真切。）"] },
      ] },
  ],
  chests: [],
  transitions: [
    { x: 1, y: 8, to: { map: "ch11_wuzhang", x: 2, y: 14 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
