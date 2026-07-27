// 地图 · ch04_camp 曹营（第四章：约三事期间关羽休整点；先按小村庄搭建，后续换营寨 UI）
// 店内不进室内：四位店主就站在各自房前，对话即开店
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch04_camp"] = {
  name: "曹营",
  grid: [
    "RRRRRRRRRRRRRR",
    "R............R",
    "R.BB...BB....R",
    "R.BD...BD....R",
    "R............R",
    "R.BB...BB....R",
    "R.BD...BD....R",
    "R............R",
    "R............R",
    "RRRRRRGGRRRRRR",
  ],
  encounterTiles: [],
  signs: [
    { x: 2, y: 2, text: "客", color: "#ffd166" },
    { x: 8, y: 2, text: "武", color: "#ffd166" },
    { x: 2, y: 5, text: "装", color: "#ffd166" },
    { x: 8, y: 5, text: "药", color: "#ffd166" },
  ],
  npcs: [
    { id: "camp_inn", x: 2, y: 4, color: "#c98a4b", name: "旅店老板", shop: "ch05_inn" },
    { id: "camp_weapon", x: 8, y: 4, color: "#8a93a8", name: "武器店老板", shop: "ch05_weapon" },
    { id: "camp_armor", x: 2, y: 7, color: "#8a93a8", name: "防具店老板", shop: "ch05_armor" },
    { id: "camp_item", x: 8, y: 7, color: "#8a93a8", name: "杂货店老板", shop: "ch05_item" },
  ],
  transitions: [
    { x: 6, y: 9, to: { map: "ch04_tushan", x: 7, y: 10 } },
    { x: 7, y: 9, to: { map: "ch04_tushan", x: 7, y: 10 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
