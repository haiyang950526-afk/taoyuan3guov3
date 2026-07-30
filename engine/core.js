// 引擎 · 核心：主循环、状态机、输入（键盘+触屏十字键）、画布/相机/补间、roundRect 垫片
"use strict";

// 老版 Safari 没有 roundRect，补一个
if (typeof CanvasRenderingContext2D !== "undefined" &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// ---------------- 全局状态 ----------------
const TILE = 32, VW = 15, VH = 14;
let cv, ctx;

const S = {
  mode: "title",          // title | map | dialog | shop | menu | battle | minigame
  chapter: "ch00",
  map: "ch00_city", px: 10, py: 16, dir: { x: 0, y: -1 },
  gold: 300,
  inv: {},                // 消耗道具：{物品名: 数量}
  equips: [],             // 装备仓库（实例数组）：[{uid, id, plus}]
  nextUid: 1,             // 装备实例 uid 计数器
  party: [],              // 主战角色（出战位，最多 5 人；前 2 为前排）
  bench: [],              // 后备（编成所轮换，吃 50% 经验）
  strategist: null,       // 军师位（角色 key，不出战，提供全队被动）
  formation: null,        // 阵形（FORMATIONS 键，null=无阵）
  stash: null,            // 分线叙事暂存 {party, bench, strategist}
  dex: {},                // 图鉴：{敌人名: {seen, killed}}
  escape: null,           // 限时脱出倒计时 {left, penalty}
  flags: {},
  steps: 0,               // 距上次战斗的步数（防连续遇敌）
  moving: null,           // 行走补间
  held: { x: 0, y: 0 },
  lastStep: 0,
};

// 装备仓库实例查询（formulas.js 的 equipOf 经此解析 uid → 实例）
function findEquipInst(uid) {
  return S.equips.find(e => e.uid === uid) || null;
}
// 新装备实例入仓库
function addEquipInst(id, plus) {
  const inst = { uid: "e" + (S.nextUid++), id: id, plus: plus || 0 };
  S.equips.push(inst);
  return inst;
}

// 创建角色实例（lv 级，含截至该级的习得谋略）
function newHero(key, lv) {
  const tpl = HERO_TPL[key];
  const h = {
    key: key, lv: lv, exp: expForLevel(lv),
    hp: 0, mp: 0,
    equips: { weapon: null, armor: null, helmet: null, legs: null, acc: null },
    skills: [], auto: !!tpl.auto, color: tpl.color,
  };
  for (let l = 1; l <= lv; l++) {
    // 角色专属习得 + 全员通用计策（COMMON_LEARN）
    const learn = (tpl.learn[l] || []).concat(COMMON_LEARN[l] || []);
    learn.forEach(sid => { if (h.skills.indexOf(sid) < 0) h.skills.push(sid); });
  }
  recalcHero(h);
  return h;
}

function joinHero(key) {
  if (S.party.find(h => h.key === key) || S.bench.find(h => h.key === key)) return;
  const lv = S.party.reduce((m, h) => Math.max(m, h.lv), 1);
  const h = newHero(key, lv);
  // 出战位满 5 人后自动入后备
  if (S.party.length < 5) S.party.push(h);
  else { S.bench.push(h); toast(key + " 加入了后备队伍！"); }
  // 有军师被动者入队时若军师位空缺，自动就任军师（第六章诸葛亮）
  if (HERO_TPL[key].strategistPassive && !S.strategist) {
    S.strategist = key;
    toast(key + " 就任军师！");
  } else if (S.party.indexOf(h) >= 0) {
    toast(key + " 加入了队伍！");
  }
}
function joinBench(key) {   // 收服战：直接加入后备
  if (S.party.find(h => h.key === key) || S.bench.find(h => h.key === key)) return;
  const lv = S.party.reduce((m, h) => Math.max(m, h.lv), 1);
  S.bench.push(newHero(key, lv));
}
// 角色离队/分线暂存前：脱下全部装备，实例放回仓库（防止装备随人"消失"）
function unequipHero(h) {
  for (const slot of SLOTS) {
    const uid = h.equips && h.equips[slot];
    if (!uid) continue;
    const inst = findEquipInst(uid);
    if (inst) inst.on = null;
    h.equips[slot] = null;
  }
}

function leaveHero(key) {
  const leaver = S.party.concat(S.bench).find(h => h.key === key);
  if (leaver) unequipHero(leaver);
  S.party = S.party.filter(h => h.key !== key);
  S.bench = S.bench.filter(h => h.key !== key);
  if (S.strategist === key) S.strategist = null;
}

function addItem(id, n) {
  S.inv[id] = (S.inv[id] || 0) + n;
  toast("获得 " + id + " ×" + n);
  hud();
}

function newGame() {
  const ch = CHAPTERS.ch00;
  S.chapter = "ch00";
  S.map = ch.start.map; S.px = ch.start.x; S.py = ch.start.y;
  S.dir = { x: 0, y: -1 };
  S.gold = 300;
  S.inv = { "草药": 2 };
  S.equips = []; S.nextUid = 1;
  S.party = [newHero("刘备", 1), newHero("关羽", 1), newHero("张飞", 1)];
  S.bench = []; S.strategist = null; S.formation = null;
  S.stash = null; S.dex = {}; S.escape = null;
  S.flags = { q0: "notStarted" };
  S.steps = 99;
  S.mode = "map";
  hud();
}

// ---------------- 面板基础 ----------------
function $(id) { return document.getElementById(id); }
function show(id) { $(id).classList.add("show"); }
function hide(id) { $(id).classList.remove("show"); }
let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  // 定位在主屏幕内部上部（随画布位置动态计算；fixed 层级保证面板打开时也可见）
  if (cv) t.style.top = ($("cv").getBoundingClientRect().top + 8) + "px";
  t.classList.add("show");
  // 连续触发时重置计时，避免上一条的定时器提前把新提示清掉
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
}

// ---------------- 画布 / 相机 ----------------
// 纵向条带布局：可用高度 = 屏高 − HUD(固定两行) − 通知条占位(固定) − 按键区。
// 画布尽量放宽（上限 520、保持 15:14、受可用高度约束）；
// HUD 与通知槽宽度同步为画布宽，整列居中，四条左右边缘对齐
function resize() {
  const hudH = $("hud") ? $("hud").offsetHeight : 48;
  const slotH = $("slot") ? $("slot").offsetHeight : 88;
  const dpadShown = $("dpad") && $("dpad").classList.contains("show");
  const dpadH = dpadShown ? $("dpad").offsetHeight : 0;
  const availH = window.innerHeight - hudH - slotH - dpadH;
  let maxW = Math.min(window.innerWidth, 520);
  if (availH > 120) maxW = Math.min(maxW, Math.floor(availH * VW / VH));
  cv.style.width = maxW + "px";
  cv.style.height = (maxW * VH / VW) + "px";
  $("hud").style.width = maxW + "px";
  $("slot").style.width = maxW + "px";
  const dpr = window.devicePixelRatio || 1;
  cv.width = VW * TILE * dpr;
  cv.height = VH * TILE * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;  // 像素立绘放大保持锐利
}

function cam() {
  const g = mapDef().grid;
  const mw = g[0].length, mh = g.length;
  return {
    x: Math.max(0, Math.min(S.px - (VW >> 1), mw - VW)),
    y: Math.max(0, Math.min(S.py - (VH >> 1), mh - VH)),
  };
}

function loop() {
  requestAnimationFrame(loop);
  if (S.mode === "map") stepLogic();
  else if (S.mode === "minigame") stepMinigame();
  draw();
}

// ---------------- 输入 ----------------
const KEYMAP = {
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
};
const heldKeys = new Set();
const touchDir = { x: 0, y: 0 };

function updateHeld() {
  let x = 0, y = 0;
  for (const k of heldKeys) {
    const v = KEYMAP[k];
    if (v) { x = v[0]; y = v[1]; }
  }
  if (touchDir.x || touchDir.y) { x = touchDir.x; y = touchDir.y; }
  S.held = { x, y };
}

function pressA() {
  if (S.mode === "dialog") { nextLine(); return; }
  if (S.mode === "illust") { advanceIllust(); return; }
  if (S.mode === "map") interact();
  else if (S.mode === "minigame") mgFire();
}
function pressB() {
  // 确认弹窗开着时，Esc/ B 只关弹窗本身（逐层退回）
  if ($("confirm") && $("confirm").classList.contains("show")) { hide("confirm"); return; }
  if (S.mode === "map") openMenu();
  else if (S.mode === "menu" || S.mode === "shop") closePanel();
}

// 开屏页：任意点击/按键跳过，进入标题页
function dismissSplash() {
  if (!$("scr-splash").classList.contains("show")) return;
  hide("scr-splash");
  show("scr-title");
}

document.addEventListener("keydown", e => {
  if ($("scr-splash") && $("scr-splash").classList.contains("show")) {
    dismissSplash();
    e.preventDefault();
    return;
  }
  if (S.mode === "battle") return;
  if (KEYMAP[e.key]) { heldKeys.add(e.key); updateHeld(); e.preventDefault(); }
  else if (e.key === "Enter" || e.key === "z") pressA();
  else if (e.key === "Escape" || e.key === "x") pressB();
});
document.addEventListener("keyup", e => {
  heldKeys.delete(e.key);
  updateHeld();
});

// 触屏十字键
function bindPad(id, x, y) {
  const el = $(id);
  const start = e => { e.preventDefault(); touchDir.x = x; touchDir.y = y; updateHeld(); };
  const end = e => { e.preventDefault(); touchDir.x = 0; touchDir.y = 0; updateHeld(); };
  el.addEventListener("touchstart", start, { passive: false });
  el.addEventListener("touchend", end, { passive: false });
  el.addEventListener("touchcancel", end, { passive: false });
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
  el.addEventListener("mouseleave", end);
}

// ---------------- 资源预载 ----------------
// 两级预载：
//   T1 第一屏必需（ch00 城/野外/村庄地形 + 室内家具 + 序章角色）——脚本加载完立即拉取并预解码，
//      保证点"新游戏"时首屏不跳变；
//   T2 其余全部素材（后续章节）——T1 完成后后台错峰慢慢加载。
// T1 地块清单（相对 assets/gfx/v4/）：序章三种图层的全部打底件
const PRELOAD_T1_TILES = [
  "Derived/grass_center_flat.png", "Derived/grass_alt_center_flat.png",
  "Derived/flower_grass_center_flat.png", "Derived/deep_grass_center_flat.png",
  "Derived/road_horizontal.png", "Derived/road_cross.png",
  "Derived/road_junction_down.png", "Derived/road_junction_up.png",
  "Derived/road_junction_left.png", "Derived/road_junction_right.png",
  "Derived/road_corner_bottom_left.png", "Derived/road_corner_bottom_right.png",
  "Derived/wall_flat.png", "Derived/cave_floor.png",
  "Derived/water_shore_n.png", "Derived/water_shore_s.png",
  "Derived/water_shore_w.png", "Derived/water_shore_e.png",
  "Terrain/Transitions/Grass_Road/grass_road_vertical.png",
  "Terrain/Transitions/Grass_Road/grass_road_corner_top_left.png",
  "Terrain/Transitions/Grass_Road/grass_road_corner_top_right.png",
  "Terrain/Transitions/Grass_Road/grass_road_center_blob.png",
  "Terrain/Water/water_center.png",
  "Terrain/River/river_horizontal.png", "Terrain/River/river_vertical.png",
  "Terrain/River/river_bend_top_left.png", "Terrain/River/river_bend_top_right.png",
  "Terrain/River/river_bend_bottom_left.png", "Terrain/River/river_bend_bottom_right.png",
  "Terrain/Mountain/mountain_brown.png", "Terrain/Mountain/cave_entrance.png",
  "Terrain/Forest/forest_center.png",
  "Terrain/Interior/indoor_floor_center.png",
  "Buildings/Residence/Town/town_residence_blue_roof_a.png",
  "Buildings/Residence/Town/town_residence_gray_roof_b.png",
  "Buildings/Residence/Rural/rural_residence_thatched_roof_a.png",
  "Buildings/Residence/Rural/rural_residence_clay_wall_b.png",
  "Buildings/Large/palace_main_hall_4x2.png", "Buildings/Large/city_gate_4x2.png",
  "Buildings/Shops/weapon_shop_sword_sign_2x2.png",
  "Buildings/Shops/equipment_shop_armor_sign_2x2.png",
  "Buildings/Shops/inn_lantern_sign_2x2.png",
  "Buildings/Shops/medicine_shop_gourd_sign_2x2.png",
  "Buildings/Shops/tavern_wine_jar_sign_2x2.png",
  "Buildings/Shops/training_hall_banner_2x2.png",
  "Props/Outdoor/stone_well.png", "Props/Outdoor/treasure_chest_red.png",
  "Props/Interior/round_wooden_table.png", "Props/Interior/wooden_stool.png",
  "Props/Interior/palace_pillar_red_gold.png", "Props/Interior/palace_pillar_white_jade.png",
  "Props/Interior/imperial_dragon_throne.png",
];
// T1 角色（序章入队/城内常见）：我方全员 + 村民/店主/黄巾
const PRELOAD_T1_CHARS = [
  "liu_bei", "guan_yu", "zhang_fei", "tao_qian", "cao_cao_messenger",
  "villager", "citizen", "village_woman", "elder", "old_man", "house_owner",
  "inn_owner", "weapon_shop_owner", "armor_shop_owner", "general_store_owner",
  "tavern_owner", "medicine_shopkeeper", "trainer", "veteran_formation", "waiter",
  "yellow_turban_bandit", "yellow_turban_archer", "yellow_turban_remnant",
];
const PRELOAD_T1_FACES = ["liu_bei", "guan_yu", "zhang_fei", "tao_qian"];
const PRELOAD_T1_BOSS = ["yellow_turban_leader"];

function preloadAssets() {
  const t1 = PRELOAD_T1_TILES.map(p => "assets/gfx/v4/" + p)
    .concat(PRELOAD_T1_CHARS.map(k => "assets/chars/map/" + k + ".png"))
    .concat(PRELOAD_T1_FACES.map(k => "assets/chars/face/" + k + ".png"))
    .concat(PRELOAD_T1_BOSS.map(k => "assets/chars/boss/" + k + ".png"));
  // T1：立即全量发出（浏览器自管理并发），能 decode 就顺手预解码
  let t1Done = 0;
  const kickT2 = () => {
    const paths = [];
    if (typeof CHAR_ART !== "undefined") {
      for (const k in CHAR_ART) {
        const a = CHAR_ART[k];
        if (a.map) paths.push("assets/chars/map/" + a.map + ".png");
        if (a.face) paths.push("assets/chars/face/" + a.face + ".png");
        const bs = Array.isArray(a.boss) ? a.boss : (a.boss ? [a.boss] : []);
        for (const b of bs) paths.push("assets/chars/boss/" + b + ".png");
      }
    }
    if (typeof V4_ASSETS !== "undefined") for (const p of V4_ASSETS) paths.push("assets/gfx/v4/" + p);
    const seen = {};
    for (const p of t1) seen[p] = 1;
    const list = paths.filter(p => !seen[p]);   // 已载过的跳过
    let i = 0;
    (function step() {
      for (let n = 0; n < 12 && i < list.length; n++, i++) { const im = new Image(); im.src = list[i]; }
      if (i < list.length) setTimeout(step, 60);
    })();
  };
  for (const p of t1) {
    const im = new Image();
    im.onload = () => { if (++t1Done >= t1.length) kickT2(); };
    im.onerror = () => { if (++t1Done >= t1.length) kickT2(); };
    im.src = p;
    if (im.decode) im.decode().catch(() => {});
  }
}

// ---------------- 启动 ----------------
window.addEventListener("DOMContentLoaded", () => {
  cv = $("cv");
  ctx = cv.getContext("2d");
  resize();
  window.addEventListener("resize", resize);

  bindPad("pad-up", 0, -1);
  bindPad("pad-down", 0, 1);
  bindPad("pad-left", -1, 0);
  bindPad("pad-right", 1, 0);
  $("pad-a").addEventListener("click", pressA);
  $("pad-b").addEventListener("click", pressB);
  $("dialog").addEventListener("click", nextLine);
  // 触屏：touchend 拦截默认行为，防止快速连点触发浏览器双击缩放
  $("dialog").addEventListener("touchend", e => {
    e.preventDefault();
    nextLine();
  }, { passive: false });
  // 章节插画：点击/触摸跳过（同样拦截双击缩放）
  $("illust").addEventListener("click", advanceIllust);
  $("illust").addEventListener("touchend", e => {
    e.preventDefault();
    advanceIllust();
  }, { passive: false });

  // 开屏页：点击/触摸进入标题页（拦截默认行为防双击缩放）
  $("scr-splash").addEventListener("click", dismissSplash);
  $("scr-splash").addEventListener("touchend", e => {
    e.preventDefault();
    dismissSplash();
  }, { passive: false });

  // 游戏画面区：拦截双击缩放（iOS Safari 不认 touch-action:none 时兜底；
  // #screen 内只有 canvas，无按钮，不影响交互）
  $("screen").addEventListener("touchend", e => e.preventDefault(), { passive: false });

  $("btn-new").addEventListener("click", () => {
    newGame();
    hide("scr-title");
    say(TEXT.ch00.intro);
  });
  // 继续征途：弹出三档位选择（ui.js openSlotPicker）；返回时只需关掉面板
  $("btn-load").addEventListener("click", () => {
    openSlotPicker("load", {
      onBack: () => hide("panel"),
      onLoaded: () => hide("scr-title"),
    });
  });

  if ("ontouchstart" in window) show("dpad");
  resize();  // 按键区显示后重新计算画布尺寸
  show("scr-splash");
  loop();
});

// T1 立即启动预载（charart/manifest 在本脚本之前已加载，不等 DOMContentLoaded）
preloadAssets();
