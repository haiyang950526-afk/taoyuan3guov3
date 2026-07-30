// 引擎 · 存档（v5 结构；纯静态部署版：存浏览器 localStorage，无需后端）
// v5 = v4 + 装备五槽（头盔 helmet / 护腿 legs）
// v2/v3/v4 旧档经 formulas.js migrateSave 逐级迁移；v1 提示不兼容
// 三档位：taoyuan3g_save_1/2/3；旧单档 taoyuan3g_save 自动迁入槽 1 后删除
"use strict";

const SAVE_V = 5;
const SAVE_KEY = "taoyuan3g_save";          // 旧单档 key（仅用于迁移）
const SAVE_SLOTS = 3;
function slotKey(slot) { return "taoyuan3g_save_" + slot; }

// 旧单档迁移：存在旧 key 且槽 1 为空时迁入槽 1，随后删除旧 key（老玩家进度不丢）
function migrateOldSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    if (!localStorage.getItem(slotKey(1))) localStorage.setItem(slotKey(1), raw);
    localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* 存储不可用时静默跳过 */ }
}

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

async function saveGame(slot) {
  try {
    migrateOldSave();
    localStorage.setItem(slotKey(slot), JSON.stringify(serialize()));
    return true;
  } catch (e) { return false; }
}

// 读档：返回 "ok" | "none" | "incompatible"
async function loadGame(slot) {
  let state;
  try {
    migrateOldSave();
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return "none";
    state = JSON.parse(raw);
  } catch (e) { return "none"; }
  const migrated = migrateSave(state);
  if (!migrated) return "incompatible";
  applySave(migrated);
  return "ok";
}

// 三槽元信息（只解析不 applySave）：
// [{slot, empty, chapter, mapName, leaderName, leaderLv, ts}]，坏档按空档处理
function listSlots() {
  migrateOldSave();
  const out = [];
  for (let i = 1; i <= SAVE_SLOTS; i++) {
    let state = null;
    try {
      const raw = localStorage.getItem(slotKey(i));
      if (raw) state = JSON.parse(raw);
    } catch (e) { state = null; }
    const migrated = state ? migrateSave(state) : null;
    if (!migrated) { out.push({ slot: i, empty: true }); continue; }
    const ch = typeof CHAPTERS !== "undefined" ? CHAPTERS[migrated.chapter] : null;
    const md = typeof MAPS !== "undefined" ? MAPS[migrated.map] : null;
    const leader = (migrated.party || [])[0] || null;
    out.push({
      slot: i,
      empty: false,
      chapter: ch ? ch.name : String(migrated.chapter || "？？"),
      mapName: md ? md.name : String(migrated.map || "？？"),
      leaderName: leader ? leader.key : "——",
      leaderLv: leader ? leader.lv : 0,
      ts: migrated.ts || 0,
    });
  }
  return out;
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
