// 地图 · ch10m_fanying 樊城蜀军营寨（麦城篇序幕~节点四：大捷/求婚/陆逊/治军/白衣）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 白衣渡江演出 → 退守麦城（mc_rule=1 时糜芳名节差分）
var MC_JINGLE = [
  { if: { flag: "mc_rule", is: 1 }, do: [{ say: "ch10m.jingleFallPunish" }] },
  { if: { flag: "mc_rule", not: 1 }, do: [{ say: "ch10m.jingleFall" }] },
  { set: { q10m: "maicheng" } },
  { warp: { map: "ch10m_maicheng", x: 7, y: 7 } },
  { toast: "困守麦城——遣使上庸求援" },
];

MAPS["ch10m_fanying"] = {
  name: "樊城营寨",
  grid: [
    "RRRRRRRRRRRRRRRR",
    "R..............R",
    "R..T........T..R",
    "R..............R",
    "R....T....T....R",
    "R..............R",
    "R.T...........TR",
    "R..............R",
    "G,,,,,,,,,,,,,GR",
    "RRRRRRRRRRRRRRRR",
  ],
  encounterTiles: [],
  npcs: [
    // 序幕 · 樊城大捷（水淹七军擒于禁）
    { id: "yujin10m", x: 8, y: 3, color: "#3a6a4a", name: "于禁", boss: "ch10m_fancheng",
      appearIf: { flag: "q10m", is: "start" },
      onWin: [{ say: "ch10m.fanchengDone" }, { set: { q10m: "node1" } }] },
    // 节点一 · 孙权求婚（许婚★引导项）
    { id: "zhugejin", x: 6, y: 5, color: "#b8a05a", name: "诸葛瑾",
      appearIf: { flag: "q10m", is: "node1" },
      hideIf: { flag: "mc_marriage", exists: true },
      branches: [
        { say: "ch10m.proposal",
          ask: { title: "孙权遣使求婚，如何回复？", options: [
            { label: "虎女安肯嫁犬子！滚回去！",
              say: "ch10m.propScold",
              do: [{ set: { mc_marriage: "scold" } }, { set: { q10m: "node2" } }] },
            { label: "小女年幼，婚事容后再议。",
              say: "ch10m.propDecline",
              do: [{ set: { mc_marriage: "decline" } }, { set: { q10m: "node2" } }] },
            { label: "好。孙刘既为唇齿——这亲事，关某准了。",
              say: "ch10m.propAccept",
              do: [{ set: { mc_marriage: "accept" } }, { set: { mc_yinping: 1 } },
                   { set: { mc_cunning: 1 } }, { set: { q10m: "node2" } },
                   { toast: "关银屏赴吴待嫁……（伏笔已埋）" }] },
          ] } },
      ] },
    // 节点二 · 陆逊的书信（骄兵计）
    { id: "wangfu2", x: 9, y: 5, color: "#7a8ab8", name: "王甫",
      appearIf: { flag: "q10m", is: "node2" },
      hideIf: { flag: "mc_see", exists: true },
      branches: [
        { say: "ch10m.luxun",
          ask: { title: "荆州守军，调还是不调？", options: [
            { label: "孺子示弱，意在荆州——守军不动。",
              say: "ch10m.luxunSee",
              do: [{ set: { mc_see: 1 } }, { set: { mc_cunning: 1 } }, { set: { q10m: "node3" } }] },
            { label: "将计就计：明抽调，暗布烽火。",
              say: "ch10m.luxunCounter",
              do: [{ set: { mc_see: 2 } }, { set: { q10m: "node3" } }] },
            { label: "一介书生，何足为虑——调兵！",
              say: "ch10m.luxunFool",
              do: [{ set: { mc_see: 0 } }, { set: { q10m: "node3" } }] },
          ] } },
      ] },
    // 节点三 · 治军（糜芳、傅士仁）
    { id: "mifang", x: 8, y: 6, color: "#8a5a3a", name: "糜芳",
      appearIf: { flag: "q10m", is: "node3" },
      hideIf: { flag: "q10m", is: "node4" },
      branches: [
        { say: "ch10m.mifang",
          ask: { title: "糜芳、傅士仁失职，如何处置？", options: [
            { label: "重杖四十，糜芳收押！防务暂交赵累。",
              say: "ch10m.rulePunish",
              do: [{ set: { mc_rule: 1 } }, { set: { mc_cunning: 1 } }, { set: { q10m: "node4" } }] },
            { label: "暂记此过——待我回来，再治尔等！",
              say: "ch10m.ruleHistory",
              do: [{ set: { q10m: "node4" } }] },
            { label: "胜败兵家常事，赐酒压惊，戴罪立功。",
              say: "ch10m.ruleForgive",
              do: [{ set: { mc_rule: 2 } }, { set: { q10m: "node4" } }] },
          ] } },
      ] },
    // 节点四 · 白衣渡江 + 徐晃战（不可选事件）
    { id: "scout10m", x: 5, y: 7, color: "#9aa4b8", name: "探马",
      appearIf: { flag: "q10m", is: "node4" },
      branches: [
        { say: "ch10m.xuhuangComing",
          do: [{ battle: "ch10m_xuhuang",
                 onWin: [{ set: { mc_xuhuang_win: 1 } }, { say: ["（徐晃败走。然而——）"] }].concat(MC_JINGLE),
                 onLoss: MC_JINGLE }] },
      ] },
  ],
  transitions: [
    { x: 0, y: 8, to: { map: "ch10_chengdu", x: 10, y: 15 } },
    { x: 14, y: 8, to: { map: "ch10_chengdu", x: 10, y: 15 } },
  ],
};

if (typeof module !== "undefined") module.exports = MAPS;
