// 地图 · ch03_palace 许都皇宫内殿（第三章；献帝在内，曹操专权时期的傀儡朝廷）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch03_palace"] = {
  name: "皇宫内殿",
  grid: [
    "BBBBBBBBBBB",
    "BLLLLPLLLLB",
    "BLLXL,LXLLB",
    "BLLXL,LXLLB",
    "BLLXL,LXLLB",
    "BLLXL,LXLLB",
    "BLLLL,LLLLB",
    "BLLLL,LLLLB",
    "BBBBB,BBBBB",
  ],
  encounterTiles: [],
  npcs: [
    { id: "xiandi", x: 6, y: 1, color: "#b8a05a", name: "献帝",
      lines: ["献帝：朕居此宫，如坐笼中。朝堂之事，皆决于曹公……",
              "献帝：刘使君同为宗室，见之如见亲人。愿卿等早日勘定乱世，救朕于水火。"] },
    { id: "sg1", x: 2, y: 3, color: "#8a93a8", name: "侍卫",
      lines: ["侍卫：宫中耳目众多，将军说话请小声些。"] },
    { id: "sg2", x: 8, y: 3, color: "#8a93a8", name: "侍卫",
      lines: ["侍卫：丞相有令，陛下起居，皆有记录在案。"] },
  ],
  transitions: [
    { x: 5, y: 8, to: { map: "ch03_xudu", x: 10, y: 4 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
