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
const TILE = 32, VW = 15, VH = 11;
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
  t.classList.add("show");
  // 连续触发时重置计时，避免上一条的定时器提前把新提示清掉
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
}

// ---------------- 画布 / 相机 ----------------
// 画布宽度按"窗口宽、HUD+按键+中部对话区剩余高度"双约束，再整体缩 8%
// （手机竖屏留给对话/战斗UI的空间不足时自动收窄画布）
const MID_MIN = 150;  // 中部区最小高度（与 index.html #mid 的 min-height 一致）
function resize() {
  const hudH = $("hud") ? $("hud").offsetHeight : 32;
  const dpadShown = $("dpad") && $("dpad").classList.contains("show");
  const dpadH = dpadShown ? $("dpad").offsetHeight : 0;
  const availH = window.innerHeight - hudH - dpadH - MID_MIN;
  let maxW = Math.min(window.innerWidth, 520);
  if (availH > 160) maxW = Math.min(maxW, Math.floor(availH * VW / VH));
  maxW = Math.floor(maxW * 0.92);
  cv.style.width = maxW + "px";
  cv.style.height = (maxW * VH / VW) + "px";
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
  if (S.mode === "map") openMenu();
  else if (S.mode === "menu" || S.mode === "shop") closePanel();
}

document.addEventListener("keydown", e => {
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
// 标题页展示后后台预载全部贴图（角色 + V4 地块），避免进新场景时逐张"跳变"
function preloadAssets() {
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
  // 去重后小批量错峰加载，不阻塞标题页
  const seen = {}, list = [];
  for (const p of paths) if (!seen[p]) { seen[p] = 1; list.push(p); }
  let i = 0;
  (function step() {
    for (let n = 0; n < 12 && i < list.length; n++, i++) { const im = new Image(); im.src = list[i]; }
    if (i < list.length) setTimeout(step, 40);
  })();
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

  $("btn-new").addEventListener("click", () => {
    newGame();
    hide("scr-title");
    say(TEXT.ch00.intro);
  });
  $("btn-load").addEventListener("click", async () => {
    const r = await loadGame();
    if (r === "ok") { hide("scr-title"); toast("读档成功"); }
    else if (r === "incompatible") toast("旧版本存档不兼容，请开始新游戏");
    else toast("没有找到存档");
  });

  if ("ontouchstart" in window) show("dpad");
  resize();  // 按键区显示后重新计算画布尺寸
  show("scr-title");
  preloadAssets();
  loop();
});
