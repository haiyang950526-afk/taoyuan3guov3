// 地图 · ch10m_linju 临沮小道（麦城篇：突围伏击现场/被擒之地）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch10m_linju"] = {
  name: "临沮小道",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R....R.....R...R",
    "R.T..R..T..R.T.R",
    "R....R.....R...R",
    "R..............R",
    "R..T........T..R",
    "R..............R",
    "R....R.....R...R",
    "R.T..R..T..R.T.R",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [],
  transitions: [],
};

if (typeof module !== "undefined") module.exports = MAPS;
