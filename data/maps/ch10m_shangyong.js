// 地图 · ch10m_shangyong 上庸（麦城篇节点五：刘封/孟达，三轮辩论）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 第三轮落定：对路 ≥2 → 刘封出兵
var MC_DEBATE_END = [
  { if: { flag: "mc_right", in: [2, 3] }, do: [
    { set: { mc_liufeng: 1 } }, { say: "ch10m.debateWin" }] },
  { if: { flag: "mc_right", in: [0, 1] }, do: [
    { say: "ch10m.debateLose" }] },
  { set: { q10m: "back" } },
  { warp: { map: "ch10m_maicheng", x: 7, y: 6 } },
  { toast: "援否已分——当夜突围！" },
];

MAPS["ch10m_shangyong"] = {
  name: "上庸",
  grid: [
    "RRRRRRRRRRRRRR",
    "R............R",
    "R..T......T..R",
    "R............R",
    "R............R",
    "R....T..T....R",
    "R............R",
    "R............R",
    "R............R",
    "RRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [
    // 刘封：三轮辩论（每轮设一个对路选项，对路≥2出兵）
    { id: "liufeng", x: 7, y: 3, color: "#8a6a5a", name: "刘封",
      appearIf: { flag: "q10m", is: "debate" },
      branches: [
        // 第一轮 · 孟达发难（立嗣旧怨）
        { if: { flag: "mc_d1", not: 1 }, say: "ch10m.debate1",
          ask: { title: "第一轮 · 立嗣旧怨", options: [
            { label: "当年之谏对的是礼法，今日之援救的是性命。",
              say: "ch10m.d1Right",
              do: [{ set: { mc_d1: 1 } }, { inc: { mc_right: 1 } }] },
            { label: "将军若只记得旧怨，那便罢了。",
              say: "ch10m.d1Hard",
              do: [{ set: { mc_d1: 1 } }] },
            { label: "……（长揖到地，听他发作完再说）",
              say: "ch10m.d1Bow",
              do: [{ set: { mc_d1: 1 } }] },
          ] } },
        // 第二轮 · 刘封动摇（利害与共情）
        { if: { all: [{ flag: "mc_d1", is: 1 }, { flag: "mc_d2", not: 1 }] }, say: "ch10m.debate2",
          ask: { title: "第二轮 · 利害与共情", options: [
            { label: "荆州若失，上庸唇亡齿寒！",
              if: { flag: "mc_cunning", is: 1 },
              say: "ch10m.d2See",
              do: [{ set: { mc_d2: 1 } }, { inc: { mc_right: 1 } }] },
            { label: "平与将军，同是螟蛉之子。（共情）",
              if: { flag: "mc_envoy", is: "guanping" },
              say: "ch10m.d2Empathy",
              do: [{ set: { mc_d2: 1 } }, { inc: { mc_right: 1 } }] },
            { label: "事成之后，汉中王必不吝重赏。",
              say: "ch10m.d2Reward",
              do: [{ set: { mc_d2: 1 } }] },
          ] } },
        // 第三轮 · 最终陈词
        { if: { all: [{ flag: "mc_d2", is: 1 }, { flag: "mc_d3", not: 1 }] }, say: "ch10m.debate3",
          ask: { title: "第三轮 · 最终陈词", options: [
            { label: "将军今日救的是叔父；他日天下人救的，是将军。",
              say: "ch10m.d3Invest",
              do: [{ set: { mc_d3: 1 } }, { inc: { mc_right: 1 } }].concat(MC_DEBATE_END) },
            { label: "……平，代父亲，谢过将军。（长跪不起）",
              if: { flag: "mc_envoy", is: "guanping" },
              say: "ch10m.d3Kneel",
              do: [{ set: { mc_d3: 1 } }, { inc: { mc_right: 1 } }].concat(MC_DEBATE_END) },
            { label: "见死不救，汉中王必诛二将军！",
              say: "ch10m.d3Threat",
              do: [{ set: { mc_d3: 1 } }, { set: { mc_grudge: 1 } }].concat(MC_DEBATE_END) },
          ] } },
      ] },
    { id: "mengda", x: 9, y: 3, color: "#5a4a3a", name: "孟达",
      appearIf: { flag: "q10m", is: "debate" },
      branches: [
        { say: ["孟达：上庸新附，兵马未集。刘将军，请三思。"] },
      ] },
  ],
  transitions: [
    { x: 7, y: 8, to: { map: "ch10m_maicheng", x: 7, y: 6 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
