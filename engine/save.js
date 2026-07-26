// 引擎 · 存档（v5 结构；纯静态部署版：存浏览器 localStorage，无需后端）
// v5 = v4 + 装备五槽（头盔 helmet / 护腿 legs）
// v2/v3/v4 旧档经 formulas.js migrateSave 逐级迁移；v1 提示不兼容
"use strict";

const SAVE_V = 5;
const SAVE_KEY = "taoyuan3g_save";

// 角色实例 → 存档条目
function packHero(h) {
  return { key: h.key, lv: h.lv, exp: h.exp, hp: h.hp, mp: h.mp,
    equips: h.equips, skills: h.skills };
}
function unpackHero(p) {
  const h = newHero(p.key, p.lv);
  h.exp = p.exp;
  h.hp = Math.min(p.hp, h.maxHp);
  h.mp = Math.min(p.mp, h.maxMp);
  // 旧档可能被剧情物品 bug 污染（NaN/Infinity），兜底回满
  if (!isFinite(h.hp)) h.hp = h.maxHp;
  if (!isFinite(h.mp)) h.mp = h.maxMp;
  h.equips = p.equips || { weapon: null, armor: null, helmet: null, legs: null, acc: null };
  h.skills = p.skills || h.skills;
  return h;
}

// 序列化当前进度
function serialize() {
  const enhance = {};
  for (const e of S.equips) if (e.plus) enhance[e.uid] = e.plus;
  return {
    v: SAVE_V,
    chapter: S.chapter,
    map: S.map, x: S.px, y: S.py,
    gold: S.gold,
    inv: S.inv,
    equips: S.equips,          // 实例数组 [{uid,id,plus}]
    enhance: enhance,          // 强化等级索引（与实例冗余，便于校验/迁移）
    nextUid: S.nextUid,
    party: S.party.map(packHero),
    bench: S.bench.map(packHero),
    strategist: S.strategist,
    formation: S.formation,
    stash: S.stash ? { party: S.stash.party.map(packHero),
      bench: S.stash.bench.map(packHero), strategist: S.stash.strategist } : null,
    dex: S.dex,
    flags: S.flags,
    ts: Math.floor(Date.now() / 1000),
  };
}

async function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialize()));
    return true;
  } catch (e) { return false; }
}

// 读档：返回 "ok" | "none" | "incompatible"
async function loadGame() {
  let state;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return "none";
    state = JSON.parse(raw);
  } catch (e) { return "none"; }
  const migrated = migrateSave(state);
  if (!migrated) return "incompatible";
  applySave(migrated);
  return "ok";
}

function applySave(state) {
  S.chapter = state.chapter;
  S.map = state.map; S.px = state.x; S.py = state.y;
  S.dir = { x: 0, y: -1 };
  S.gold = state.gold;
  S.inv = state.inv || {};
  S.equips = state.equips || [];
  S.nextUid = state.nextUid || (S.equips.length + 1);
  S.flags = state.flags || {};
  S.party = (state.party || []).map(unpackHero);
  S.bench = (state.bench || []).map(unpackHero);
  S.strategist = state.strategist || null;
  S.formation = state.formation || null;
  S.dex = state.dex || {};
  S.escape = null;
  S.stash = state.stash ? { party: state.stash.party.map(unpackHero),
    bench: (state.stash.bench || []).map(unpackHero),
    strategist: state.stash.strategist || null } : null;
  S.steps = 99;
  S.moving = null;
  S.mode = "map";
  hud();
}
