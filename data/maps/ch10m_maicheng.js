// 地图 · ch10m_maicheng 麦城（麦城篇节点五~七：求援/突围/劝降/五结局）
var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// ---- 结局共用收尾：归还主队（关羽一律离队）→ 进终章 ----
var MC_END_COMMON = [
  { set: { q10m: "done" } },
  { partyRestore: true },
  { say: "ch10m.chapterEnd" },
  { say: "ch11.intro" },
  { chapter: "ch11" }, { set: { q11: "start" } },
  { leave: "关羽" },
  { warp: { map: "ch11_hanzhong", x: 10, y: 16 } },
  { toast: "终章 · 出师未捷" },
];

// 结局壹 · 慷慨就义（被擒 + 不屈 + 未许婚）
var MC_END1 = [
  { say: "ch10m.refuse" }, { say: "ch10m.endMartyr" },
  { illust: { file: "assets/illust/ch10m_a.png", caption: "麦城 · 慷慨就义" } },
  { set: { mc_result: "martyred" } },
].concat(MC_END_COMMON);
// 结局贰 · 单骑归蜀（突围成功 + 刘封援军；关平留队）
var MC_END2 = [
  { say: "ch10m.endReturn" },
  { set: { mc_result: "returned" } }, { set: { mc_guanping: 1 } },
  { say: "ch10m.guanyuRetire" },
].concat(MC_END_COMMON, [{ joinBench: "关平" },
  { toast: "关平继承父志，加入后备队伍！" }]);
// 结局叁 · 麦城喋血（突围成功 + 无援军）
var MC_END3 = [
  { say: "ch10m.endFallen" },
  { illust: { file: "assets/illust/ch10m_b.png", caption: "麦城 · 喋血突围" } },
  { set: { mc_result: "fallen" } },
  { say: "ch10m.guanyuRetire" },
].concat(MC_END_COMMON);
// 结局肆 · 忍辱负重（被擒 + 假降；或 被擒 + 不屈但已许婚）
var MC_END4 = [
  { illust: { file: "assets/illust/ch10m_c.png", caption: "麦城 · 忍辱负重" } },
  { set: { mc_result: "feigned" } },
].concat(MC_END_COMMON);
// 生还线分流（突围胜：有援军 → 贰；无援军 → 叁）
var MC_SURVIVE = [
  { if: { flag: "mc_liufeng", is: 1 }, do: MC_END2 },
  { if: { flag: "mc_liufeng", not: 1 }, do: MC_END3 },
];
// 被擒线 → 节点七 · 孙权劝降（三选）
var MC_ASK = { title: "孙权劝降——", options: [
  { label: "碧眼小儿，紫髯鼠辈！吾宁死不降！",
    do: [
      { if: { flag: "mc_yinping", is: 1 }, do: [{ say: "ch10m.refuseSpared" }].concat(MC_END4) },
      { if: { flag: "mc_yinping", not: 1 }, do: MC_END1 },
    ] },
  { label: "……权且应之，以图后举。（假降）",
    if: { flag: "mc_cunning", is: 1 },
    do: [{ say: "ch10m.feign" }].concat(MC_END4) },
  { label: "……（沉默良久）关某，愿降。",
    do: [{ say: "ch10m.betray" }, { toast: "此非云长所为——再想想。" }, { ask: MC_ASK }] },
] };
var MC_CAPTURED = [
  { warp: { map: "ch10m_linju", x: 8, y: 6 } },
  { say: "ch10m.captured" },
  { ask: MC_ASK },
];

MAPS["ch10m_maicheng"] = {
  name: "麦城",
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
    // 节点五 · 上庸求援（选使者）
    { id: "wangfu10m", x: 7, y: 4, color: "#7a8ab8", name: "王甫",
      appearIf: { flag: "q10m", is: "maicheng" },
      branches: [
        { say: "ch10m.envoyAsk",
          ask: { title: "派谁去上庸求援？", options: [
            { label: "关平去（父亲守城，儿去上庸！）",
              do: [{ set: { mc_envoy: "guanping" } }, { set: { q10m: "debate" } },
                   { warp: { map: "ch10m_shangyong", x: 7, y: 7 } }] },
            { label: "廖化去（演义正主）",
              do: [{ set: { mc_envoy: "liaohua" } }, { set: { q10m: "debate" } },
                   { warp: { map: "ch10m_shangyong", x: 7, y: 7 } }] },
          ] } },
      ] },
    // 节点六 · 突围（大路正战 / 小路伏击）
    { id: "wangfu10m2", x: 7, y: 4, color: "#7a8ab8", name: "王甫",
      appearIf: { flag: "q10m", is: "back" },
      branches: [
        { say: "ch10m.breakout",
          ask: { title: "突围路线？", options: [
            { label: "走大路（听王甫的）",
              do: [{ battle: "ch10m_tuwei_big1",
                     onWin: MC_SURVIVE,
                     onLoss: MC_CAPTURED }] },
            { label: "走小路（历史选择）",
              do: [
                { if: { all: [{ flag: "mc_liufeng", is: 1 }, { flag: "mc_see", exists: true }] },
                  do: [{ battle: "ch10m_tuwei_small2",
                         onWin: MC_SURVIVE,
                         onLoss: MC_CAPTURED }] },
                { if: { all: [{ flag: "mc_liufeng", is: 1 }, { flag: "mc_see", not: 1 }] },
                  do: [{ battle: "ch10m_tuwei_small",
                         onLoss: MC_CAPTURED }] },
                { if: { flag: "mc_liufeng", not: 1 },
                  do: [{ battle: "ch10m_tuwei_small",
                         onLoss: MC_CAPTURED }] },
              ] },
          ] } },
      ] },
  ],
  transitions: [],
};

if (typeof module !== "undefined") module.exports = MAPS;
