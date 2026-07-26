// 地图 · ch06_school 破败学堂（渡魂记 · 第六章：南阳老书生，需残信方得郑玄竹简）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 老书生两套分支（单条件限制：mt1 互锁台词用双 NPC 同位互斥实现）
var SCHOOL_DONE = ["老书生：书已托付将军。'士不可以不弘毅'——老夫余下的日子，再注一遍。"];
var SCHOOL_NONE = ["老书生：这学堂空了些年……将军若是路过歇脚，请自便。"];

MAPS["ch06_school"] = {
  name: "破败学堂",
  grid: [
    "BBBBBBBBBB",
    "BLLLLLLLLB",
    "BLLLLLLLLB",
    "BLLLLLLLLB",
    "BLLLLLLLLB",
    "BLLLLLLLLB",
    "BBBBB,,BBB",
  ],
  encounterTiles: [],
  npcs: [
    // 见过郑玄（mt1 完成）的老书生：dhSchool 与 dhSchool2 之间插入互锁一段
    { id: "scholar_mt1", x: 4, y: 2, color: "#b8a87a", name: "老书生",
      appearIf: { flag: "mt1", is: "done" },
      branches: [
        { if: { flag: "relic_zhujian", exists: true }, say: SCHOOL_DONE },
        { if: { flag: "relic_xin", exists: true },
          say: "ch06.dhSchool",
          do: [{ say: "ch06.dhSchoolMt1" }, { say: "ch06.dhSchool2" },
               { give: ["郑玄竹简", 1] }, { set: { relic_zhujian: true } }] },
        { say: SCHOOL_NONE },
      ] },
    // 未见过郑玄的老书生：无互锁台词
    { id: "scholar", x: 4, y: 2, color: "#b8a87a", name: "老书生",
      hideIf: { flag: "mt1", is: "done" },
      branches: [
        { if: { flag: "relic_zhujian", exists: true }, say: SCHOOL_DONE },
        { if: { flag: "relic_xin", exists: true },
          say: "ch06.dhSchool",
          do: [{ say: "ch06.dhSchool2" },
               { give: ["郑玄竹简", 1] }, { set: { relic_zhujian: true } }] },
        { say: SCHOOL_NONE },
      ] },
  ],
  chests: [],
  transitions: [
    { x: 5, y: 6, to: { map: "ch06_field", x: 3, y: 15 } },
    { x: 6, y: 6, to: { map: "ch06_field", x: 3, y: 15 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
