// 引擎 · 地图：渲染、行走、NPC、传送、遇敌、宝箱、剧情触发器
"use strict";

// 地图字符说明：
//   # 城墙  B 建筑  D 店门  G 城门  T 树  W 水  R 山石/洞壁  P 宫殿
//   C 山洞入口  F 洞内地面  E 洞内出口  M 渡口木板  . 草地  , 道路（不遇敌）
//   L 室内木地板  X 殿柱
const TILE_META = {
  "#": { pass: false, name: "wall" },
  "B": { pass: false, name: "building" },
  "D": { pass: false, name: "door" },
  "G": { pass: true,  name: "gate" },
  "T": { pass: false, name: "tree" },
  "W": { pass: false, name: "water" },
  "R": { pass: false, name: "rock" },
  "C": { pass: true,  name: "cave_in" },
  "F": { pass: true,  name: "cave_floor" },
  "E": { pass: true,  name: "cave_out" },
  "P": { pass: false, name: "palace" },
  "M": { pass: true,  name: "dock" },
  ".": { pass: true,  name: "grass" },
  ",": { pass: true,  name: "road" },
  "L": { pass: true,  name: "floor" },
  "X": { pass: false, name: "pillar" },
  "v": { pass: false, name: "well" },
  "h": { pass: true,  name: "village_in" },   // 村庄入口小图标（可走进）
  "t": { pass: false, name: "table" },        // 桌子（两格拼一张，不可通行）
  "c": { pass: true,  name: "chair" },        // 座椅（可通行）
  // ---- V4 道具/地形扩展（assets/gfx/v4/，编辑器可直接摆放） ----
  "f": { pass: false, name: "fence" },        // 木栅栏
  "o": { pass: false, name: "rocks" },        // 石堆
  "k": { pass: false, name: "campfire" },     // 篝火
  "a": { pass: false, name: "haystack" },     // 草垛
  "b": { pass: false, name: "barrel" },       // 木桶
  "w": { pass: false, name: "crate" },        // 木箱
  "r": { pass: false, name: "rice_sack" },    // 米袋
  "u": { pass: false, name: "tombstone" },    // 墓碑
  "q": { pass: false, name: "banner" },       // 军旗
  "z": { pass: true,  name: "flowers" },      // 花丛（3 色按坐标散列）
  "s": { pass: true,  name: "sand" },         // 沙地
  "n": { pass: true,  name: "farm" },         // 农田
  "y": { pass: false, name: "bamboo" },       // 竹林
  "i": { pass: false, name: "snow_mountain" },// 雪山
  "j": { pass: false, name: "volcano" },      // 火山
};

// ---------------- 条件 / 文本 / 动作 ----------------
// 条件：{flag, is} | {flag, not} | {flag, in:[...]} | {flag, exists:true}
function evalCond(cond) {
  if (!cond) return true;
  const v = S.flags[cond.flag];
  if (cond.exists) return v !== undefined;
  if (cond.is !== undefined) return v === cond.is;
  if (cond.not !== undefined) return v !== cond.not;
  if (cond.in) return cond.in.indexOf(v) >= 0;
  return true;
}

// 文本路径："ch01.taoqianAsk" → TEXT.ch01.taoqianAsk
function resolveText(path) {
  if (Array.isArray(path)) return path;
  const parts = path.split(".");
  let t = TEXT;
  for (const p of parts) t = t && t[p];
  return t || ["……"];
}

// 顺序执行动作列表（任务链状态机的执行器）
function runActions(list, done, i) {
  i = i || 0;
  if (!list || i >= list.length) { if (done) done(); return; }
  const a = list[i];
  const next = () => runActions(list, done, i + 1);
  if (a.set) { for (const k in a.set) S.flags[k] = a.set[k]; hud(); next(); }
  else if (a.inc) { for (const k in a.inc) S.flags[k] = (S.flags[k] || 0) + a.inc[k]; hud(); next(); }
  else if (a.chapter) {
    // 章节切换 = 上一章通关：先放本章通关插画
    const cleared = S.chapter;
    S.chapter = a.chapter; hud();
    if (CHAPTERS[cleared] && cleared !== a.chapter) {
      showIllust("assets/illust/" + cleared + ".png",
        CHAPTERS[cleared].name + " · 完", next);
    } else next();
  }
  else if (a.gold) { S.gold += a.gold; hud(); next(); }
  else if (a.give) { addItem(a.give[0], a.give[1] || 1); next(); }
  else if (a.giveEquip) { addEquipInst(a.giveEquip); toast("获得装备：" + a.giveEquip + "（已入仓库）"); next(); }
  // 终章谢幕：先放五丈原谢幕插画，再回标题页
  else if (a.theEnd) {
    showIllust("assets/illust/end.png", "星落秋风五丈原", () => {
      S.mode = "title";
      show("scr-title");
      toast("感谢游玩《桃园三国》！");
      next();
    });
  }
  else if (a.toast) { toast(a.toast); next(); }
  else if (a.say) { say(resolveText(a.say), next); }
  else if (a.warp) { warpTo(a.warp.map, a.warp.x, a.warp.y); next(); }
  else if (a.join) { joinHero(a.join); next(); }
  else if (a.joinBench) { joinBench(a.joinBench); next(); }
  else if (a.leave) { leaveHero(a.leave); next(); }
  else if (a.healAll) { S.party.forEach(h => { h.hp = h.maxHp; h.mp = h.maxMp; }); next(); }
  // 分线叙事：暂存当前队伍，换临时队伍（剧情结束用 partyRestore 还原）
  else if (a.partySwap) {
    S.party.forEach(unequipHero);   // 暂存前卸装回仓库，换回不丢装备
    S.bench.forEach(unequipHero);
    S.stash = { party: S.party, bench: S.bench, strategist: S.strategist };
    const lv = a.partySwap.lv || S.party.reduce((m, h) => Math.max(m, h.lv), 1);
    S.party = a.partySwap.members.map(k => newHero(k, lv));
    S.bench = []; S.strategist = null;
    toast("剧情整备中……");
    next();
  }
  else if (a.partyRestore) {
    S.party.forEach(unequipHero);   // 临时队伍的装备也回收进仓库
    S.bench.forEach(unequipHero);
    if (S.stash) {
      S.party = S.stash.party;
      S.bench = S.stash.bench;
      S.strategist = S.stash.strategist;
      S.stash = null;
      toast("队伍回归。（装备已放回仓库，记得重新穿戴）");
    }
    next();
  }
  // 小游戏：hunt 围猎 / collect 接箭（见 engine/minigame.js）
  else if (a.minigame) { startMinigame(a.minigame, next); }
  // 对话选项（仅 flavor：选项不影响结果，只改一句台词）
  else if (a.ask) { askChoice(a.ask, next); }
  else if (a.battle) { startBattle(a.battle, { onWin: a.onWin, onRecruit: a.onRecruit, onLoss: a.onLoss, onForceEnd: a.onForceEnd, after: next }); }
  else next();
}

// ---------------- 地图工具 ----------------
function mapDef() { return MAPS[S.map]; }
function tileAt(x, y) {
  const g = mapDef().grid;
  if (y < 0 || y >= g.length || x < 0 || x >= g[y].length) return "#";
  // 条件地块覆盖（tileOverrides: [{x, y, ch, if, else?}]）：
  // 条件成立显示 ch（如藏宝洞口），否则显示 else 或原格——用于"剧情触发后才出现"的地形
  const ov = mapDef().tileOverrides && mapDef().tileOverrides.find(o => o.x === x && o.y === y);
  if (ov) return evalCond(ov.if) ? ov.ch : (ov.else || g[y][x]);
  return g[y][x];
}
function npcVisible(n) {
  return evalCond(n.appearIf) && !(n.hideIf && evalCond(n.hideIf));
}
function npcAt(x, y) {
  return mapDef().npcs.find(n => n.x === x && n.y === y && npcVisible(n));
}
function chestAt(x, y) {
  const m = mapDef();
  if (!m.chests) return null;
  return m.chests.find(c => c.x === x && c.y === y &&
    !S.flags["chest_" + S.map + "_" + c.id]);
}
function passable(x, y) {
  return TILE_META[tileAt(x, y)].pass && !npcAt(x, y) && !chestAt(x, y);
}
function transitionAt(x, y) {
  // face: [dx,dy] 可选——要求玩家朝该方向移动才触发（进门需"朝门口多走一步"，路过不触发）
  return mapDef().transitions.find(t => t.x === x && t.y === y && evalCond(t.if) &&
    (!t.face || (S.dir.x === t.face[0] && S.dir.y === t.face[1])));
}

function warpTo(mapKey, x, y, useLast) {
  // 记录离开当前图的位置；useLast 时若目标图有记录则落回原位（"从哪里进就从哪里出"）
  if (S.map && MAPS[S.map]) {
    (S.lastPos = S.lastPos || {})[S.map] = { x: S.px, y: S.py };
    if (useLast && S.lastPos[mapKey]) { x = S.lastPos[mapKey].x; y = S.lastPos[mapKey].y; }
  }
  S.map = mapKey; S.px = x; S.py = y;
  S.steps = 99;
  S.moving = null;
  // 传送后锁定：松开方向键前不再移动，防止出城门时长按方向被直接带回城（城门循环）
  S.warpLock = true;
  hud();
}

// ---------------- 渲染 ----------------
const TILE_COLORS = {
  "#": ["#4a5060", "#3a3f4c"], "B": ["#8a6a45", "#6a4f32"],
  "D": ["#3a2a1a", "#2a1f12"], "G": ["#6a7288", "#4a5060"],
  "T": ["#3d7a3d", "#2a5a2a"], "W": ["#3a6ac0", "#2a4f96"],
  "R": ["#6a5a4a", "#4f4336"], "C": ["#1a1410", "#6a5a4a"],
  "F": ["#3a332c", "#332c26"], "E": ["#c9b89a", "#3a332c"],
  "P": ["#7a5a8a", "#5a4068"], "M": ["#a8845a", "#8a6a45"],
  ".": ["#4f8a45", "#467a3d"], ",": ["#a89468", "#9a885e"],
  "L": ["#9a7a52", "#8a6a45"], "X": ["#7a4a3a", "#5a3428"],
  // V4 扩展字符的兜底色（贴图未就绪时程序绘制用）
  "f": ["#8a6a45", "#6a4f32"], "o": ["#8a8a96", "#6a6a76"],
  "k": ["#c06a2a", "#6a4a2a"], "a": ["#c9a84a", "#a8843a"],
  "b": ["#8a5a2a", "#6a4a2a"], "w": ["#9a6a35", "#7a5228"],
  "r": ["#c9b89a", "#a89478"], "u": ["#9a9aa8", "#7a7a88"],
  "q": ["#b03a2a", "#7a2818"], "z": ["#4f8a45", "#c05a8a"],
  "s": ["#d8c08a", "#c9b078"], "n": ["#7a8a3a", "#5a6a2a"],
  "y": ["#3a7a3a", "#2a5a2a"], "i": ["#d8dce8", "#a8b0c0"],
  "j": ["#5a3a3a", "#c04a2a"],
};

// ---------------- 图像 tile（assets/gfx/；未加载完回退程序绘制） ----------------
const TILE_IMGS = {};
function gfxRec(path) {          // path 相对 assets/gfx/，含扩展名
  let rec = TILE_IMGS[path];
  if (!rec) {
    rec = { img: new Image(), ok: false };
    rec.img.onload = () => { rec.ok = true; };
    rec.img.onerror = () => { rec.dead = true; };
    rec.img.src = "assets/gfx/" + path;
    TILE_IMGS[path] = rec;
  }
  return rec;
}
function gfxImg(path) { const r = gfxRec(path); return r.ok ? r.img : null; }
function tileImg(name) { return gfxImg(name + ".png"); }   // 兼容旧调用（已无用例）

// ---------------- V4 素材包渲染（three_kingdoms_tileset_v4，32px 严格格单位） ----------------
const V4 = "v4/";
// 坐标散列：同一格每次取到同一变体
function th(x, y, n) { return (((x * 7 + y * 13) % n) + n) % n; }

// 地图类型：cave(含 F 洞内地面) / interior(含 L 木地板) / outdoor —— 决定贴图策略
let _mapKindKey = null, _mapKind = "outdoor";
function mapKind() {
  if (_mapKindKey !== S.map) {
    const g = mapDef().grid.join("");
    _mapKind = g.indexOf("F") >= 0 ? "cave" : (g.indexOf("L") >= 0 ? "interior" : "outdoor");
    _mapKindKey = S.map;
  }
  return _mapKind;
}

function grassImg(x, y) {
  const h = th(x, y, 16);
  const f = h === 0 ? "flower_grass_center" : h === 1 ? "deep_grass_center"
          : h === 2 ? "grass_alt_center" : "grass_center";
  return gfxImg(V4 + "Derived/" + f + "_flat.png");   // _flat = 去描边可平铺版（离线派生）
}

// 湖泊 = 含 2x2 全水块的水体（水心+岸边过渡件）；1 格宽河道用自带草岸的 river_*
function inWaterBlock(x, y) {
  for (const bd of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) {
    let all = true;
    for (const ad of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      if (tileAt(x + bd[0] + ad[0], y + bd[1] + ad[1]) !== "W") { all = false; break; }
    }
    if (all) return true;
  }
  return false;
}
function isLakeWater(x, y) { return tileAt(x, y) === "W" && inWaterBlock(x, y); }

// 河道走向：水格、图外（河流出图）、渡口 M 都视为水的延续
function riverConn(x, y) {
  const g = mapDef().grid;
  const at = (x, y) => {
    if (y < 0 || y >= g.length || x < 0 || x >= g[y].length) return true;
    const ch = tileAt(x, y);
    return ch === "W" || ch === "M";
  };
  return { U: at(x, y - 1), D: at(x, y + 1), L: at(x - 1, y), R: at(x + 1, y) };
}
function riverImg(x, y) {
  const c = riverConn(x, y);
  let f = "Water/water_center";
  if (c.U && c.D && !c.L && !c.R) f = "River/river_vertical";
  else if (c.L && c.R && !c.U && !c.D) f = "River/river_horizontal";
  else if (c.U && c.L && !c.D && !c.R) f = "River/river_bend_top_left";
  else if (c.U && c.R && !c.D && !c.L) f = "River/river_bend_top_right";
  else if (c.D && c.L && !c.U && !c.R) f = "River/river_bend_bottom_left";
  else if (c.D && c.R && !c.U && !c.L) f = "River/river_bend_bottom_right";
  else if ((c.U || c.D) && !c.L && !c.R) f = "River/river_vertical";
  else if ((c.L || c.R) && !c.U && !c.D) f = "River/river_horizontal";
  return gfxImg(V4 + "Terrain/" + f + ".png");
}

// 湖岸过渡（画在草地之上；河道自带草岸，不叠）
function shoreImgPaths(x, y) {
  const lk = (x, y) => isLakeWater(x, y);
  const U = lk(x, y - 1), D = lk(x, y + 1), L = lk(x - 1, y), R = lk(x + 1, y);
  const d = "Derived/", out = [];
  const sides = (U ? 1 : 0) + (D ? 1 : 0) + (L ? 1 : 0) + (R ? 1 : 0);
  if (sides === 2 && ((U && R) || (R && D) || (D && L) || (L && U))) {
    out.push(d + "water_diagb_" + (U && R ? "ne" : R && D ? "se" : D && L ? "sw" : "nw") + ".png");
  } else {
    if (U) out.push(d + "water_shore_n.png");
    if (D) out.push(d + "water_shore_s.png");
    if (L) out.push(d + "water_shore_w.png");
    if (R) out.push(d + "water_shore_e.png");
    if (sides === 0) {   // 仅对角相邻：角部水湾
      if (lk(x + 1, y - 1)) out.push(d + "water_diagb_ne.png");
      if (lk(x - 1, y - 1)) out.push(d + "water_diagb_nw.png");
      if (lk(x + 1, y + 1)) out.push(d + "water_diagb_se.png");
      if (lk(x - 1, y + 1)) out.push(d + "water_diagb_sw.png");
    }
  }
  return out;
}

// 道路走向：路 , 、城门 G 、渡口 M 、村口 h 视为路的延续；路出图也算延续
function roadConn(x, y) {
  const g = mapDef().grid;
  const at = (x, y) => {
    if (y < 0 || y >= g.length || x < 0 || x >= g[y].length) return true;
    return ",GMh".indexOf(tileAt(x, y)) >= 0;
  };
  return { U: at(x, y - 1), D: at(x, y + 1), L: at(x - 1, y), R: at(x + 1, y) };
}
function roadImg(x, y) {
  const c = roadConn(x, y);
  const n = (c.U ? 1 : 0) + (c.D ? 1 : 0) + (c.L ? 1 : 0) + (c.R ? 1 : 0);
  const GR = "Terrain/Transitions/Grass_Road/", d = "Derived/";
  let f;
  if (n >= 4) f = d + "road_cross.png";
  else if (n === 3) f = d + (!c.U ? "road_junction_down.png" : !c.D ? "road_junction_up.png"
                          : !c.L ? "road_junction_right.png" : "road_junction_left.png");
  else if (c.U && c.D) f = GR + "grass_road_vertical.png";
  else if (c.L && c.R) f = d + "road_horizontal.png";
  else if (c.U && c.R) f = d + "road_corner_bottom_left.png";    // 连 上+右
  else if (c.U && c.L) f = d + "road_corner_bottom_right.png";   // 连 上+左
  else if (c.D && c.R) f = GR + "grass_road_corner_top_left.png";    // 连 下+右
  else if (c.D && c.L) f = GR + "grass_road_corner_top_right.png";   // 连 下+左
  else if (c.U) f = d + "road_corner_bottom_left.png";
  else if (c.D) f = GR + "grass_road_corner_top_left.png";
  else if (c.L) f = GR + "grass_road_corner_top_right.png";
  else if (c.R) f = GR + "grass_road_corner_top_left.png";
  else f = GR + "grass_road_center_blob.png";
  return gfxImg(V4 + f);
}

// ---------------- 建筑图章（多格贴图，锚定左上角，画在地形之上） ----------------
// 自动推导：P 横排→宫殿 4x2；G 横排→城门楼 4x2；D 门+招牌文字→店铺 2x2（底行压门行）
// 地图可选 buildings: [{img, x, y, w, h}] 显式配置（优先生效）
const SHOP_BY_SIGN = {
  "武": "Buildings/Shops/weapon_shop_sword_sign_2x2.png",
  "装": "Buildings/Shops/equipment_shop_armor_sign_2x2.png",
  "客": "Buildings/Shops/inn_lantern_sign_2x2.png",
  "药": "Buildings/Shops/medicine_shop_gourd_sign_2x2.png",
  "酒": "Buildings/Shops/tavern_wine_jar_sign_2x2.png",
  "训": "Buildings/Shops/training_hall_banner_2x2.png",
  "编": "Buildings/Shops/formation_office_flag_roster_2x2.png",
};
let _stampKey = null, _stamps = [], _anchors = {};
function buildingStamps() {
  if (_stampKey === S.map) return _stamps;
  _stampKey = S.map;
  _stamps = [];
  _anchors = {};
  if (mapKind() !== "outdoor") return _stamps;
  const m = mapDef(), g = m.grid;
  const covered = {};
  const cov = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) covered[xx + "," + yy] = true;
  };
  const free = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (yy < 0 || yy >= g.length || xx < 0 || xx >= g[yy].length) return false;
      if (covered[xx + "," + yy]) return false;
      if ("BDGP".indexOf(g[yy][xx]) < 0) return false;
    }
    return true;
  };
  const push = (img, x, y, w, h) => { _stamps.push({ img, x, y, w, h }); cov(x, y, w, h); };
  // 宫殿/城门楼：自带墙体与基座，允许压任意未覆盖格（在界内即可）
  const freeAny = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (yy < 0 || yy >= g.length || xx < 0 || xx >= g[yy].length) return false;
      if (covered[xx + "," + yy]) return false;
    }
    return true;
  };
  for (const b of (m.buildings || [])) if (freeAny(b.x, b.y, b.w, b.h)) push(b.img, b.x, b.y, b.w, b.h);
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) {
      const ch = g[y][x];
      if ((ch === "P" || ch === "G") && (x === 0 || g[y][x - 1] !== ch)) {
        let x1 = x;
        while (x1 + 1 < g[y].length && g[y][x1 + 1] === ch) x1++;
        const img = ch === "P" ? "Buildings/Large/palace_main_hall_4x2.png"
                               : "Buildings/Large/city_gate_4x2.png";
        const cx = Math.floor((x + x1 + 1) / 2) - 2, cy = y > 0 ? y - 1 : y;
        if (freeAny(cx, cy, 4, 2)) push(img, cx, cy, 4, 2);
        x = x1;
      }
    }
  }
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) {
    if (g[y][x] !== "D") continue;
    const sg = (m.signs || []).find(s => SHOP_BY_SIGN[s.text] &&
      Math.abs(s.x - x) <= 2 && s.y <= y && y - s.y <= 3);
    if (!sg) continue;
    if (free(x - 1, y - 1, 2, 2)) push(SHOP_BY_SIGN[sg.text], x - 1, y - 1, 2, 2);
    else if (free(x, y - 1, 2, 2)) push(SHOP_BY_SIGN[sg.text], x, y - 1, 2, 2);
  }
  // 建筑足印锚点：未被图章覆盖的连通 B/D 块，每栋只画 1 个 1x1 民居
  // （锚点 = 门格 D，含 tileOverrides 条件门；无门取最下排最左格）——避免 2x2 房子挤成 4 栋小房
  const ovD = {};
  for (const o of (m.tileOverrides || [])) if (o.ch === "D") ovD[o.x + "," + o.y] = true;
  const isDoor = (x, y) => g[y][x] === "D" || !!ovD[x + "," + y];
  const seen = {};
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) {
    if ((g[y][x] !== "B" && g[y][x] !== "D") || covered[x + "," + y] || seen[x + "," + y]) continue;
    // 洪泛收集一个足印
    const cells = [];
    const stack = [[x, y]];
    seen[x + "," + y] = true;
    while (stack.length) {
      const [cx2, cy2] = stack.pop();
      cells.push([cx2, cy2]);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = cx2 + dx, ny = cy2 + dy, k = nx + "," + ny;
        if (ny < 0 || ny >= g.length || nx < 0 || nx >= g[ny].length) continue;
        if ((g[ny][nx] !== "B" && g[ny][nx] !== "D") || covered[k] || seen[k]) continue;
        seen[k] = true;
        stack.push([nx, ny]);
      }
    }
    let door = null, bl = null;
    for (const [cx2, cy2] of cells) {
      if (isDoor(cx2, cy2) && (!door || cy2 > door[1] || (cy2 === door[1] && cx2 < door[0]))) door = [cx2, cy2];
      if (!bl || cy2 > bl[1] || (cy2 === bl[1] && cx2 < bl[0])) bl = [cx2, cy2];
    }
    const a = door || bl;
    _anchors[a[0] + "," + a[1]] = true;
  }
  return _stamps;
}
function stampCovered(x, y) {
  return buildingStamps().some(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
}
function residenceAnchor(x, y) {   // 本格是否为所在建筑足印的民居锚点
  buildingStamps();
  return !!_anchors[x + "," + y];
}
function signSuppressed(sg) {   // 招牌文字落在图章范围内的不再画（图章自带门面）
  return buildingStamps().some(s =>
    sg.x >= s.x - 1 && sg.x <= s.x + s.w && sg.y >= s.y - 1 && sg.y <= s.y + s.h);
}

// V4 道具字符 → 贴图（1x1，画在地面之上；通行性见 TILE_META）
const PROP_IMG = {
  f: "Props/Outdoor/wooden_fence.png", o: "Props/Outdoor/rocks.png",
  k: "Props/Outdoor/campfire.png",   a: "Props/Outdoor/haystack.png",
  b: "Props/Outdoor/barrel.png",     w: "Props/Outdoor/wooden_crate.png",
  r: "Props/Outdoor/rice_sack.png",  u: "Props/Outdoor/tombstone_stone.png",
  q: "Props/Outdoor/battlefield_banner.png",
};
const FLOWER_IMGS = [
  "Props/Collectibles/flower_red_collectible.png",
  "Props/Collectibles/flower_yellow_collectible.png",
  "Props/Collectibles/flower_purple_collectible.png",
];
// 道具叠画：base 已由调用方画好；返回 false = 贴图未就绪
function drawProp(ch, px, py, gx, gy) {
  let p = PROP_IMG[ch];
  if (ch === "z") p = FLOWER_IMGS[th(gx, gy, 3)];
  if (!p) return false;
  const img = gfxImg(V4 + p);
  if (!img) return false;
  ctx.drawImage(img, px, py);
  return true;
}

// 用 V4 贴图绘制一格；返回 false = 所需图片未就绪（调用方回退程序绘制）
function drawTileImage(ch, px, py, gx, gy) {
  // 美术覆盖层：地图可选 tileArt: {"x,y": "v4相对路径.png"} —— 只换贴图，通行性仍看字符
  const ta = mapDef().tileArt;
  if (ta) {
    const p = ta[gx + "," + gy];
    if (p) {
      const rec = gfxRec(V4 + p);
      if (rec.ok) { ctx.drawImage(rec.img, px, py); return true; }
      if (!rec.dead) return false;   // 加载中：先画程序兜底，好了自动换上
    }
  }
  const kind = mapKind();
  // —— 室内：木地板 + 家具道具；墙体仍程序绘制 ——
  if (kind === "interior") {
    if (ch === "B" || ch === "D" || ch === "#") return false;
    const floor = gfxImg(V4 + "Terrain/Interior/indoor_floor_center.png");
    if (!floor) return false;
    ctx.drawImage(floor, px, py);
    let prop = null;
    if (ch === "t") prop = "Props/Interior/round_wooden_table.png";
    else if (ch === "c") prop = "Props/Interior/wooden_stool.png";
    else if (ch === "X") prop = th(gx, gy, 2) ? "Props/Interior/palace_pillar_white_jade.png"
                                              : "Props/Interior/palace_pillar_red_gold.png";
    else if (ch === "P") prop = "Props/Interior/imperial_dragon_throne.png";
    if (prop) {
      const img = gfxImg(V4 + prop);
      if (!img) return false;
      ctx.drawImage(img, px, py);
      return true;
    }
    if (PROP_IMG[ch] || ch === "z") return drawProp(ch, px, py, gx, gy);
    return true;
  }
  // —— 山洞：泥土地面 + 石山洞壁 + 洞口 ——
  if (kind === "cave") {
    if (ch === "F" || ch === "," || ch === "E") {
      const img = gfxImg(V4 + "Derived/cave_floor.png");
      if (!img) return false;
      ctx.drawImage(img, px, py);
      if (ch === "E") {   // 出口亮光
        ctx.fillStyle = "#c9b89a";
        ctx.fillRect(px + 8, py + 8, 16, 4); ctx.fillRect(px + 8, py + 16, 16, 4);
      }
      return true;
    }
    if (PROP_IMG[ch] || ch === "z") {   // 洞内道具：泥地底
      const img = gfxImg(V4 + "Derived/cave_floor.png");
      if (!img) return false;
      ctx.drawImage(img, px, py);
      return drawProp(ch, px, py, gx, gy);
    }
    if (ch === "R") {
      const img = gfxImg(V4 + "Terrain/Mountain/mountain_brown.png");
      if (!img) return false;
      ctx.drawImage(img, px, py); return true;
    }
    if (ch === "C") {
      const img = gfxImg(V4 + "Terrain/Mountain/cave_entrance.png");
      if (!img) return false;
      ctx.drawImage(img, px, py); return true;
    }
    return false;
  }
  // —— 野外 / 城镇 ——
  const grass = () => {
    const g2 = grassImg(gx, gy);
    if (!g2) return false;
    ctx.drawImage(g2, px, py); return true;
  };
  const shores = () => {   // 湖岸过渡叠在草地上
    for (const p of shoreImgPaths(gx, gy)) {
      const img = gfxImg(V4 + p);
      if (!img) return false;
      ctx.drawImage(img, px, py);
    }
    return true;
  };
  if (ch === ".") return grass() && shores();
  if (ch === "T") {   // 树：整格森林（不透明，无需草地底）
    const img = gfxImg(V4 + "Terrain/Forest/forest_center.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "y") {   // 竹林
    const img = gfxImg(V4 + "Terrain/Forest/bamboo_forest_center.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "i") {   // 雪山
    const img = gfxImg(V4 + "Terrain/Mountain/snow_mountain.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "j") {   // 火山
    const img = gfxImg(V4 + "Terrain/Mountain/volcano_active.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "s") {   // 沙地
    const img = gfxImg(V4 + "Derived/sand_flat.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "n") {   // 农田
    const img = gfxImg(V4 + "Derived/farm_flat.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (PROP_IMG[ch] || ch === "z") {   // 道具/花丛：草地底 + 贴图
    if (!grass() || !shores()) return false;
    return drawProp(ch, px, py, gx, gy);
  }
  if (ch === ",") {
    const r = roadImg(gx, gy);
    if (!r) return false;
    ctx.drawImage(r, px, py); return true;
  }
  if (ch === "W") {
    const w = inWaterBlock(gx, gy) ? gfxImg(V4 + "Terrain/Water/water_center.png") : riverImg(gx, gy);
    if (!w) return false;
    ctx.drawImage(w, px, py); return true;
  }
  if (ch === "R") {
    const img = gfxImg(V4 + "Terrain/Mountain/mountain_brown.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "C") {
    const img = gfxImg(V4 + "Terrain/Mountain/cave_entrance.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "#") {
    const img = gfxImg(V4 + "Derived/wall_flat.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "M") {   // 渡口：水/草底 + 程序木板
    const nb = [tileAt(gx, gy - 1), tileAt(gx, gy + 1), tileAt(gx - 1, gy), tileAt(gx + 1, gy)];
    const base = nb.indexOf("W") >= 0 ? gfxImg(V4 + "Terrain/Water/water_center.png") : grassImg(gx, gy);
    if (!base) return false;
    ctx.drawImage(base, px, py);
    ctx.fillStyle = "#8a6a45";
    ctx.fillRect(px + 2, py + 8, 28, 3);
    ctx.fillRect(px + 2, py + 14, 28, 3);
    ctx.fillRect(px + 2, py + 20, 28, 3);
    return true;
  }
  if (ch === "v") {
    if (!grass() || !shores()) return false;
    const img = gfxImg(V4 + "Props/Outdoor/stone_well.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "h") {
    if (!grass()) return false;
    const img = gfxImg(V4 + "Buildings/Residence/Rural/rural_residence_thatched_roof_a.png");
    if (!img) return false;
    ctx.drawImage(img, px, py); return true;
  }
  if (ch === "G") {   // 城门洞：路面打底，4x2 城门楼图章盖在上面
    const r = roadImg(gx, gy);
    if (!r) return false;
    ctx.drawImage(r, px, py);
    if (!stampCovered(gx, gy)) { ctx.fillStyle = "#4a5060"; ctx.fillRect(px + 4, py + 2, 24, 6); }
    return true;
  }
  if (ch === "B" || ch === "D" || ch === "P") {
    if (stampCovered(gx, gy)) return grass();   // 图章覆盖区：只画草地底
    if (!grass()) return false;
    // 每栋建筑足印只画 1 个 1x1 民居（锚点格），其余格只铺草地（村庄地图用乡村民居）
    if (!residenceAnchor(gx, gy)) return true;
    const rural = S.map.indexOf("village") >= 0;
    const img = gfxImg(V4 + (rural
      ? "Buildings/Residence/Rural/rural_residence_thatched_roof_a.png"
      : "Buildings/Residence/Town/town_residence_blue_roof_a.png"));
    if (!img) return false;
    ctx.drawImage(img, px, py);
    if (ch === "D") { ctx.fillStyle = "#2a1f12"; ctx.fillRect(px + 12, py + 20, 8, 12); }
    return true;
  }
  return false;
}

function draw() {
  if (S.mode === "title") return;
  if (S.mode === "battle") { drawBattle(); return; }
  if (S.mode === "minigame") { drawMinigame(); return; }
  const c = cam();
  ctx.clearRect(0, 0, VW * TILE, VH * TILE);
  for (let ty = 0; ty < VH; ty++) {
    for (let tx = 0; tx < VW; tx++) {
      const ch = tileAt(c.x + tx, c.y + ty);
      if (drawTileImage(ch, tx * TILE, ty * TILE, c.x + tx, c.y + ty)) continue;
      const col = TILE_COLORS[ch] || TILE_COLORS["."];
      ctx.fillStyle = col[0];
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      // 简单纹理
      ctx.fillStyle = col[1];
      if (ch === "T") {
        // 树：程序绘制，3 种构图按坐标混排（同一造型：单棵/双棵堆叠/三棵成簇）
        const variant = ((c.x + tx) * 7 + (c.y + ty) * 13) % 3;
        ctx.fillStyle = "#4f8a45";
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        ctx.fillStyle = "#467a3d";
        ctx.fillRect(tx*TILE+5, ty*TILE+26, 2, 4); ctx.fillRect(tx*TILE+25, ty*TILE+24, 2, 4);
        const tree = (cx, cy, r) => {
          ctx.fillStyle = "#6a4a2a";
          ctx.fillRect(cx - 3, cy + r - 4, 6, 10);
          ctx.fillStyle = "#2a5a2a";
          ctx.beginPath(); ctx.arc(cx, cy + 2, r, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#3d8a3d";
          ctx.beginPath(); ctx.arc(cx - 1, cy, r - 2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#5aaa55";
          ctx.beginPath(); ctx.arc(cx - 3, cy - 3, Math.max(2, r - 7), 0, Math.PI*2); ctx.fill();
        };
        if (variant === 0) {
          tree(tx*TILE+16, ty*TILE+13, 11);
        } else if (variant === 1) {
          tree(tx*TILE+10, ty*TILE+15, 9);   // 左前
          tree(tx*TILE+21, ty*TILE+11, 10);  // 右后（略大略高）
        } else {
          tree(tx*TILE+16, ty*TILE+9, 8);    // 后中
          tree(tx*TILE+9, ty*TILE+16, 9);    // 前左
          tree(tx*TILE+23, ty*TILE+16, 9);   // 前右
        }
      }
      else if (ch === "t") {
        // 桌子（不可通行；相邻两格拼一张完整桌子，桌面无缝、桌腿只画在外侧）
        ctx.fillStyle = "#9a7a52";
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        ctx.fillStyle = "#8a6a45";
        ctx.fillRect(tx * TILE, ty * TILE + 26, TILE, 2);
        const leftT = tileAt(c.x + tx - 1, c.y + ty) === "t";
        const rightT = tileAt(c.x + tx + 1, c.y + ty) === "t";
        ctx.fillStyle = "#8a5a2a";                          // 桌面
        ctx.fillRect(tx * TILE, ty * TILE + 9, TILE, 12);
        ctx.fillStyle = "#a8743a";                          // 桌面高光
        ctx.fillRect(tx * TILE, ty * TILE + 9, TILE, 3);
        ctx.fillStyle = "#5a3a1a";                          // 桌沿阴影
        ctx.fillRect(tx * TILE, ty * TILE + 19, TILE, 2);
        if (!leftT) ctx.fillRect(tx * TILE + 3, ty * TILE + 21, 3, 7);   // 左外腿
        if (!rightT) ctx.fillRect(tx * TILE + 26, ty * TILE + 21, 3, 7); // 右外腿
        if (!leftT) ctx.fillRect(tx * TILE, ty * TILE + 9, 2, 12);       // 左端沿
        if (!rightT) ctx.fillRect(tx * TILE + 30, ty * TILE + 9, 2, 12); // 右端沿
      }
      else if (ch === "c") {
        // 座椅（可通行；小圆凳，木地板底）
        ctx.fillStyle = "#9a7a52";
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        ctx.fillStyle = "#8a6a45";
        ctx.fillRect(tx * TILE, ty * TILE + 26, TILE, 2);
        ctx.fillStyle = "#5a3a1a";                          // 凳腿
        ctx.fillRect(tx*TILE+11, ty*TILE+20, 3, 6);
        ctx.fillRect(tx*TILE+18, ty*TILE+20, 3, 6);
        ctx.fillStyle = "#8a5a2a";                          // 凳面
        ctx.beginPath(); ctx.roundRect(tx*TILE+8, ty*TILE+13, 16, 8, 3); ctx.fill();
        ctx.fillStyle = "#a8743a";                          // 凳面高光
        ctx.fillRect(tx*TILE+9, ty*TILE+14, 14, 2);
      }
      else if (ch === "v") {   // 井（兜底灰块；正常走 V4 石井贴图）
        ctx.fillStyle = "#8a8a96"; ctx.fillRect(tx*TILE+8, ty*TILE+12, 16, 14);
      }
      else if (ch === "h") {
        // 村庄入口图标：草地底 + 精绘小屋（大檐棕瓦屋顶 + 米色墙身 + 门窗）
        ctx.fillStyle = "#4f8a45";
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        ctx.fillStyle = "#467a3d";
        ctx.fillRect(tx*TILE+4, ty*TILE+26, 2, 4); ctx.fillRect(tx*TILE+26, ty*TILE+25, 2, 4);
        // 大檐屋顶（梯形压檐 + 檐口深线 + 瓦楞）
        ctx.fillStyle = "#8a4a2a";
        ctx.beginPath();
        ctx.moveTo(tx*TILE+2, ty*TILE+14); ctx.lineTo(tx*TILE+16, ty*TILE+3);
        ctx.lineTo(tx*TILE+30, ty*TILE+14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#a85a32";
        ctx.fillRect(tx*TILE+9, ty*TILE+8, 2, 6); ctx.fillRect(tx*TILE+15, ty*TILE+5, 2, 9);
        ctx.fillRect(tx*TILE+21, ty*TILE+8, 2, 6);
        ctx.fillStyle = "#6a3420";
        ctx.fillRect(tx*TILE+2, ty*TILE+13, 28, 3);
        // 米色墙身 + 墙裙
        ctx.fillStyle = "#c9a876";
        ctx.fillRect(tx*TILE+6, ty*TILE+16, 20, 12);
        ctx.fillStyle = "#b08a5a";
        ctx.fillRect(tx*TILE+6, ty*TILE+25, 20, 3);
        // 门 + 窗
        ctx.fillStyle = "#3a2a1a";
        ctx.fillRect(tx*TILE+13, ty*TILE+19, 6, 9);
        ctx.fillStyle = "#5a8ac0";
        ctx.fillRect(tx*TILE+8, ty*TILE+18, 4, 4);
        ctx.fillRect(tx*TILE+21, ty*TILE+18, 4, 4);
      }
      else if (ch === "B") ctx.fillRect(tx * TILE, ty * TILE, TILE, 8);
      else if (ch === "P") { ctx.fillRect(tx*TILE, ty*TILE, TILE, 10); ctx.fillRect(tx*TILE+6, ty*TILE+18, 20, 4); }
      else if (ch === "R") { ctx.fillRect(tx*TILE+4, ty*TILE+6, 10, 8); ctx.fillRect(tx*TILE+18, ty*TILE+18, 9, 7); }
      else if (ch === "W" && (tx + ty) % 2 === 0) ctx.fillRect(tx*TILE+6, ty*TILE+14, 20, 2);
      else if (ch === "M") ctx.fillRect(tx*TILE+2, ty*TILE+8, 28, 3);
      else if (ch === ".") { ctx.fillRect(tx*TILE+8, ty*TILE+9, 2, 4); ctx.fillRect(tx*TILE+22, ty*TILE+20, 2, 4); }
      else if (ch === "C") { ctx.beginPath(); ctx.arc(tx*TILE+16, ty*TILE+18, 10, Math.PI, 0); ctx.fill(); }
      else if (ch === "D") ctx.fillRect(tx*TILE+10, ty*TILE+4, 12, 26);
      else if (ch === "G") { ctx.fillRect(tx*TILE+4, ty*TILE+2, 24, 6); }
      else if (ch === "E") { ctx.fillRect(tx*TILE+8, ty*TILE+8, 16, 4); ctx.fillRect(tx*TILE+8, ty*TILE+16, 16, 4); }
      else if (ch === ",") { ctx.fillRect(tx*TILE+2, ty*TILE+6, 12, 9); ctx.fillRect(tx*TILE+18, ty*TILE+17, 12, 9); }
      else if (ch === "L") ctx.fillRect(tx*TILE, ty*TILE+15, TILE, 2);
      else if (ch === "X") { ctx.beginPath(); ctx.arc(tx*TILE+16, ty*TILE+16, 10, 0, Math.PI*2); ctx.fill(); }
    }
  }
  // 建筑图章（多格贴图，画在地形之上、招牌/NPC 之下；见 buildingStamps）
  for (const st of buildingStamps()) {
    const img = gfxImg(V4 + st.img);
    if (!img) continue;
    const sx = (st.x - c.x) * TILE, sy = (st.y - c.y) * TILE;
    if (sx + st.w * TILE < 0 || sy + st.h * TILE < 0 || sx > VW * TILE || sy > VH * TILE) continue;
    ctx.drawImage(img, sx, sy, st.w * TILE, st.h * TILE);
  }
  // 建筑招牌（数据驱动：地图可选字段 signs: [{x, y, text, color}]，画在 tile 之上）
  // 已配店铺图章的招牌不再画（图章自带门面）
  for (const sg of (mapDef().signs || [])) {
    if (signSuppressed(sg)) continue;
    const sgx = (sg.x - c.x) * TILE, sgy = (sg.y - c.y) * TILE;
    if (sgx < -TILE || sgy < -TILE || sgx > VW * TILE || sgy > VH * TILE) continue;
    ctx.fillStyle = sg.color || "#ffd166";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(sg.text, sgx + TILE / 2, sgy + TILE / 2);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }
  // 宝箱（V4 红宝箱贴图；已开启的灰化半透，仍可通行；贴图未就绪回退程序绘制）
  for (const ch2 of (mapDef().chests || [])) {
    const opened = !!S.flags["chest_" + S.map + "_" + ch2.id];
    const bx = (ch2.x - c.x) * TILE, by = (ch2.y - c.y) * TILE;
    const cimg = gfxImg(V4 + "Props/Outdoor/treasure_chest_red.png");
    if (cimg) {
      if (opened) { ctx.save(); ctx.globalAlpha = 0.55; ctx.filter = "grayscale(1)"; }
      ctx.drawImage(cimg, bx, by);
      if (opened) ctx.restore();
      continue;
    }
    // 配色：闭合=棕箱金箍；开启=灰暗
    const body = opened ? "#5a4530" : "#8a5a2a";
    const lid = opened ? "#6a5240" : "#9a6a35";
    const gold = opened ? "#7a6a50" : "#e8c84a";
    const dark = opened ? "#3a2f24" : "#4a2f16";
    // 箱体（下体）
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.roundRect(bx + 4, by + 15, 24, 13, 3); ctx.fill();
    // 箱盖（略亮色，圆顶）
    ctx.fillStyle = lid;
    ctx.beginPath(); ctx.roundRect(bx + 4, by + 6, 24, 11, 4); ctx.fill();
    // 金箍横带（盖身接缝）
    ctx.fillStyle = gold;
    ctx.fillRect(bx + 4, by + 14, 24, 3);
    // 两枚金扣（盖上，胶囊形）
    ctx.beginPath(); ctx.roundRect(bx + 8, by + 8, 6, 5, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(bx + 18, by + 8, 6, 5, 2); ctx.fill();
    // 外描边
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx + 4.5, by + 6.5, 23, 21, 4); ctx.stroke();
  }
  // NPC（角色贴图优先：普通 32x32 一格；Boss 64x64 原大、底部居中于本格；未命中回退点阵）
  for (const n of mapDef().npcs) {
    if (!npcVisible(n)) continue;
    const art = charArtImg(n.name, 0);
    if (art) {
      const nx = (n.x - c.x) * TILE, ny = (n.y - c.y) * TILE;
      if (art.kind === "boss") ctx.drawImage(art.img, nx - 16, ny - 32, 64, 64);
      else ctx.drawImage(art.img, nx, ny, TILE, TILE);
      continue;
    }
    drawMapSprite((n.x - c.x) * TILE, (n.y - c.y) * TILE, npcLook(n), { x: 0, y: 1 });
  }
  // 玩家（补间）
  let rx = S.px, ry = S.py;
  if (S.moving) {
    const t = Math.min(1, (performance.now() - S.moving.t0) / 130);
    rx = S.moving.fx + (S.moving.tx - S.moving.fx) * t;
    ry = S.moving.fy + (S.moving.ty - S.moving.fy) * t;
  }
  const leaderArt = S.party.length ? charArtImg(S.party[0].key, 0) : null;
  if (leaderArt) {
    const lx = (rx - c.x) * TILE, ly = (ry - c.y) * TILE;
    if (leaderArt.kind === "boss") ctx.drawImage(leaderArt.img, lx - 16, ly - 32, 64, 64);
    else ctx.drawImage(leaderArt.img, lx, ly, TILE, TILE);
  } else {
    drawMapSprite((rx - c.x) * TILE, (ry - c.y) * TILE, partyLeaderLook(), S.dir);
  }
}

// ---------------- 行走 ----------------
function stepLogic() {
  if (S.moving && performance.now() - S.moving.t0 >= 130) {
    S.px = S.moving.tx; S.py = S.moving.ty;
    S.moving = null;
    afterStep();
  }
  if (S.moving) return;
  // 传送后锁定：松开方向键/摇杆前不移动（见 warpTo）
  if (S.warpLock) {
    if (!S.held.x && !S.held.y) S.warpLock = false;
    return;
  }
  if (!S.held.x && !S.held.y) return;
  if (performance.now() - S.lastStep < 140) return;
  S.lastStep = performance.now();
  S.dir = { x: S.held.x, y: S.held.y };
  const nx = S.px + S.dir.x, ny = S.py + S.dir.y;
  if (!passable(nx, ny)) {
    // 已站在入口格上、朝门被挡（D 不可踩）也触发传送——不用先退一格
    const tr = transitionAt(S.px, S.py);
    if (tr && tr.face) warpTo(tr.to.map, tr.to.x, tr.to.y, true);
    return;
  }
  S.moving = { fx: S.px, fy: S.py, tx: nx, ty: ny, t0: performance.now() };
}

function afterStep() {
  // 传送点
  const tr = transitionAt(S.px, S.py);
  if (tr) { warpTo(tr.to.map, tr.to.x, tr.to.y, true); return; }
  const m = mapDef();
  // 剧情触发器（踩点）
  const trig = (m.triggers || []).find(t => t.x === S.px && t.y === S.py && evalCond(t.if));
  if (trig) {
    // 限时脱出：到达出口，解除倒计时
    if (trig.escapeGoal && S.escape) {
      S.escape = null;
      toast("摆脱了追兵！");
    }
    // 限时脱出：启动倒计时（rounds 按步数计，1 步 = 1 回合）
    if (trig.escapeTimer) {
      S.escape = { left: trig.escapeTimer.rounds, penalty: trig.escapeTimer.penalty,
        onWin: trig.escapeTimer.onWin || null };
      toast("追兵将至——限 " + trig.escapeTimer.rounds + " 步内抵达出口！");
    }
    if (trig.do) { runActions(trig.do); return; }
  }
  // 限时脱出倒计时推进：归零且未达出口 → 强制遇敌
  if (S.escape) {
    S.escape.left--;
    if (S.escape.left <= 0) {
      const penalty = S.escape.penalty, onWin = S.escape.onWin;
      S.escape = null;
      blog2startBattle(penalty, onWin);
      return;
    }
  }
  // Boss 触发（走到相邻格）
  const boss = m.npcs.find(n => n.boss && npcVisible(n) &&
    Math.abs(n.x - S.px) + Math.abs(n.y - S.py) === 1);
  if (boss) { triggerBoss(boss); return; }
  // 随机遇敌
  S.steps++;
  if ((m.encounterTiles || []).indexOf(tileAt(S.px, S.py)) >= 0 &&
      S.steps > 4 && Math.random() < (m.encounterRate || 0)) {
    S.steps = 0;
    const grp = m.encounterGroups[Math.floor(Math.random() * m.encounterGroups.length)];
    startBattle(null, { enemies: grp });
  }
}

// 脱出失败的伏击战（编组 key 或敌人数组均可；可带 onWin 追加奖励）
function blog2startBattle(penalty, onWin) {
  if (typeof penalty === "string") startBattle(penalty, onWin ? { onWin: onWin } : undefined);
  else startBattle(null, { enemies: penalty, onWin: onWin });
}

function triggerBoss(n) {
  const grp = BATTLE_GROUPS[n.boss];
  const go = () => startBattle(n.boss, {
    onWin: n.onWin, onRecruit: n.onRecruit, onLoss: n.onLoss, onForceEnd: n.onForceEnd });
  if (grp.pre) say(resolveText(grp.pre), go);
  else go();
}

// ---------------- 交互（A键） ----------------
function interact() {
  const x = S.px + S.dir.x, y = S.py + S.dir.y;
  // 宝箱：面对按 A 开启
  const chest = chestAt(x, y);
  if (chest) {
    S.flags["chest_" + S.map + "_" + chest.id] = true;
    if (chest.gold) { S.gold += chest.gold; toast("打开宝箱：获得 " + chest.gold + " 金！"); }
    if (chest.items) for (const id in chest.items) {
      // 装备类进仓库（实例化），消耗品进背包
      if (ITEMS[id] && ITEMS[id].type !== "item" && ITEMS[id].type !== "book") {
        for (let i = 0; i < chest.items[id]; i++) addEquipInst(id);
        toast("打开宝箱：获得 " + id + "！");
      } else addItem(id, chest.items[id]);
    }
    hud();
    return;
  }
  const n = npcAt(x, y);
  if (!n) return;
  if (n.shop) { openShop(n.shop); return; }
  // 设施：编成所（第五章起开放，由 flags.sys_camp 门控）/ 铁匠铺（只存在于主城地图）
  if (n.facility === "camp") {
    if (!S.flags.sys_camp) {
      say(["（老兵：编成所尚未开放——待你们到了洛阳，再来整编不迟。）"]);
      return;
    }
    openCamp(); return;
  }
  if (n.facility === "smith") { openSmith(); return; }
  // 酒馆（樗蒲赌局）/ 训练所（花钱买经验），面板见 ui.js
  if (n.facility === "tavern") { openGamble(); return; }
  if (n.facility === "dojo") { openDojo(); return; }
  if (n.boss) { triggerBoss(n); return; }
  if (n.branches) {
    const br = n.branches.find(b => !b.if || evalCond(b.if));
    if (br) {
      const acts = (br.do || []).slice();
      if (br.say) acts.unshift({ say: br.say });
      if (br.ask) acts.unshift({ ask: br.ask });
      runActions(acts);
      return;
    }
  }
  if (n.lines) say(n.lines);
  else if (n.linesKey) say(resolveText(n.linesKey));
}
