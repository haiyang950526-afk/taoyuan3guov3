// 引擎 · 纯逻辑公式库（不碰 DOM，node 可直接 require）
// 经验口径（按 02 文档）：采用【累计制】——
//   升到 L 级所需累计总经验 EXP(L) = round(80 × L^1.8)
//   即 1→2 级需累计 279；hero.exp 存累计值，exp >= EXP(lv+1) 即升级。
// 小怪经验 = 怪物等级 × 8；精英 ×1.5；Boss = 怪物等级 × 20。
"use strict";

var MAX_LV = 55;

// 升到 L 级所需累计总经验
function expForLevel(L) { return Math.round(80 * Math.pow(L, 1.8)); }
// 当前等级到下一级还差多少（用于状态页显示）
function expToNext(lv) {
  if (lv >= MAX_LV) return Infinity;
  return expForLevel(lv + 1) - expForLevel(lv);
}

// 成长率（02 文档）：S=1.30 A=1.15 B=1.00 C=0.85 D=0.70
var GROWTH_RATE = { S: 1.30, A: 1.15, B: 1.00, C: 0.85, D: 0.70 };
// 每级基准：HP 8 / MP 3 / 攻智防速运 1.2
var GROWTH_BASE = { hp: 8, mp: 3, atk: 1.2, int: 1.2, def: 1.2, spd: 1.2, luck: 1.2 };

// 某属性在 lv 级的值：基础 + floor(成长 × (lv-1))（确定性累计，小数不累丢）
function statAt(tpl, stat, lv) {
  var per = GROWTH_BASE[stat] * GROWTH_RATE[tpl.growth[stat]];
  return tpl.base[stat] + Math.floor(per * (lv - 1) + 1e-6);
}

// 按模板和等级重算角色面板（h.stats = 裸装面板；h.hp/mp 为当前值）
function recalcHero(h) {
  var tpl = HERO_TPL[h.key];
  var old = h.stats;
  var st = {};
  ["hp", "mp", "atk", "int", "def", "spd", "luck"].forEach(function (k) {
    st[k] = statAt(tpl, k, h.lv) + ((h.statBonus || {})[k] || 0);   // statUp 永久加成
  });
  h.stats = st;
  h.maxHp = st.hp; h.maxMp = st.mp;
  if (old) { // 升级时把上限增量补到当前值上
    h.hp = Math.min(h.maxHp, h.hp + (h.maxHp - old.hp));
    h.mp = Math.min(h.maxMp, h.mp + (h.maxMp - old.mp));
  } else {
    h.hp = h.maxHp; h.mp = h.maxMp;
  }
}

// 装备加成（三槽：weapon/armor/acc；槽内存仓库实例 uid，兼容直接存物品 id）
function equipOf(h, slot) {
  var v = h.equips && h.equips[slot];
  if (!v) return null;
  var id = v, plus = 0;
  if (typeof findEquipInst === "function") {   // 引擎层注入：按 uid 查仓库实例
    var inst = findEquipInst(v);
    if (inst) { id = inst.id; plus = inst.plus || 0; }
  }
  var it = ITEMS[id];
  return it ? { id: id, item: it, plus: plus } : null;
}
function equipBonus(h, key) {
  var total = 0;
  ["weapon", "armor", "helmet", "legs", "acc"].forEach(function (s) {
    var e = equipOf(h, s);
    if (e && e.item[key]) {
      var v = e.item[key];
      // 成长性武器（时运）：攻击随持有者等级成长，atk + grow×Lv
      if (key === "atk" && e.item.grow) v += Math.floor(e.item.grow * h.lv);
      // 武器强化：每级基础攻击 +5%
      if (s === "weapon" && key === "atk") v = enhancedAtk(v, e.plus);
      total += v;
    }
  });
  return total;
}
function atkTotal(h) { return h.stats.atk + equipBonus(h, "atk"); }
function defTotal(h) { return h.stats.def + equipBonus(h, "def"); }
function intTotal(h) { return h.stats.int + equipBonus(h, "int"); }
function spdTotal(h) { return h.stats.spd + equipBonus(h, "spd"); }
function luckTotal(h) { return h.stats.luck + equipBonus(h, "luck"); }

// 物理伤害（03 文档）：
//   基础 = 攻 × 倍率 × (0.90~1.10)；伤害 = max(1, 基础 - 防/2)
//   暴击：概率 运/2 %（+ 装备暴击率加成 critB，如铁斧头），伤害 ×1.5（先取整再乘）
// rand 可注入（测试用），返回 {dmg, crit}
function physDmg(atk, mult, def, luck, rand, critB) {
  rand = rand || Math.random;
  var base = atk * (mult || 1) * (0.9 + rand() * 0.2);
  var dmg = Math.max(1, Math.round(base - def / 2));
  var crit = rand() * 100 < luck / 2 + (critB || 0);
  if (crit) dmg = Math.round(dmg * 1.5);
  return { dmg: dmg, crit: crit };
}

// 攻击者的装备暴击率加成（目前只有饰品位铁斧头）
function critBonusOf(h) {
  if (typeof equipOf !== "function" || !h || !h.equips) return 0;
  var e = equipOf(h, "acc");
  return e && e.item.crit ? e.item.crit : 0;
}

// 计策伤害（03 文档）：基础 = 智 × 系数 × (0.90~1.10)；伤害 = max(1, 基础 - 敌智/3)
// 地形联动：linked=true（如火计对林中敌）时 ×1.5
function magicDmg(intv, coef, targetInt, linked, rand) {
  rand = rand || Math.random;
  var base = intv * coef * (0.9 + rand() * 0.2);
  var dmg = Math.max(1, Math.round(base - targetInt / 3));
  if (linked) dmg = Math.round(dmg * 1.5);
  return dmg;
}

// 技能随等级缩放（定案口径）：所有谋略/武技/计策/治疗的最终效果 × skillScale(施术者等级)
// Lv1 = 1.00，每级 +3%（Lv8 ≈ 1.21，Lv20 ≈ 1.57）
function skillScale(lv) { return 1 + (lv - 1) * 0.03; }

// 治疗量（03 文档）：智 × 系数 × (0.95~1.05)
function healAmount(intv, coef, rand) {
  rand = rand || Math.random;
  return Math.max(1, Math.round(intv * coef * (0.95 + rand() * 0.1)));
}

// 单敌经验：小怪 lv×10，精英 ×1.5，Boss lv×20
function enemyExp(e) {
  return Math.round(e.lv * (e.boss ? 20 : 10) * (e.elite ? 1.5 : 1));
}

// 逃跑率（03 文档）：50% + (我方均速 - 敌方均速)×1%，夹在 5%~95%
function fleeChance(pSpd, eSpd) {
  var c = 0.5 + (pSpd - eSpd) * 0.01;
  return Math.max(0.05, Math.min(0.95, c));
}

// ---------------- 阵形 / 军师 / 受击权重（03 文档） ----------------
// 出战位前 FRONT_COUNT 人为前排；前排受击权重默认 65%（阵形可用 aggroFront 覆盖）
var FRONT_COUNT = 2;

// 阵形 + 军师 allStats 被动对属性的修正（战斗中调用，base 为含装备的面板值）
function formStat(base, key, idx, formationKey, strategist) {
  var v = base;
  var f = formationKey && typeof FORMATIONS !== "undefined" && FORMATIONS[formationKey];
  if (f) {
    var mult = 1;
    if (f.all && f.all[key]) mult *= f.all[key];
    var grp = idx < FRONT_COUNT ? f.front : f.back;
    if (grp && grp[key]) mult *= grp[key];
    var sm = f.slotMods && f.slotMods[String(idx)];
    if (sm && sm[key]) mult *= sm[key];
    else if (f.other && f.other[key]) mult *= f.other[key];
    v *= mult;
  }
  if (strategist && strategist.type === "allStats") v *= (1 + strategist.value);
  return v;
}

// 各出战位的受击权重（前排均分 aggroFront，后排均分其余）
function aggroWeight(idx, frontAlive, backAlive, formationKey) {
  var f = formationKey && typeof FORMATIONS !== "undefined" && FORMATIONS[formationKey];
  var af = (f && f.aggroFront) || 0.65;
  return idx < FRONT_COUNT ? af / Math.max(1, frontAlive) : (1 - af) / Math.max(1, backAlive);
}

// 加权随机抽取（rand 可注入，测试用）
function pickWeightedIndex(weights, rand) {
  rand = rand || Math.random;
  var sum = 0, i;
  for (i = 0; i < weights.length; i++) sum += weights[i];
  if (sum <= 0) return -1;
  var r = rand() * sum;
  for (i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
  return weights.length - 1;
}

// ---------------- 武器强化（第十章铁匠铺） ----------------
// 100% 成功、失败不掉级（简化玩家友好）、上限 +5、每级基础值 +5%、费用递增
var ENHANCE_MAX = 5;
function enhanceFee(price, plus) { return Math.floor((price || 20000) * 0.3 * (plus + 1)); }
function enhancedAtk(baseAtk, plus) { return Math.round(baseAtk * (1 + 0.05 * (plus || 0))); }

// ---------------- 收服战 / 多形态 Boss ----------------
// 收服判定：限定回合内把目标打到血线以下（且未击杀）
function checkRecruit(recruit, round, hp, maxHp) {
  return !!(recruit && round <= recruit.withinRounds && hp > 0 && hp <= maxHp * recruit.hpBelow);
}
// 多形态：返回当前血量应处于的形态序号（-1 = 初始形态，可三段以上）
function phaseIndex(phases, hp, maxHp) {
  if (!phases) return -1;
  var idx = -1;
  for (var i = 0; i < phases.length; i++) {
    if (hp <= maxHp * phases[i].hpBelow) idx = i;
  }
  return idx;
}

// 加经验并处理升级，返回 {levels: 升了几级, learned: [新谋略名]}
// 习得 = 角色专属习得表 + 全员通用计策表（COMMON_LEARN，data/skills.js）
function gainExp(h, amount) {
  h.exp += amount;
  var res = { levels: 0, learned: [] };
  var tpl = HERO_TPL[h.key];
  while (h.lv < MAX_LV && h.exp >= expForLevel(h.lv + 1)) {
    h.lv++;
    res.levels++;
    recalcHero(h);
    var learn = (tpl.learn[h.lv] || []).concat(COMMON_LEARN[h.lv] || []);
    if (learn.length) {
      learn.forEach(function (sid) {
        if (h.skills.indexOf(sid) < 0) {
          h.skills.push(sid);
          res.learned.push(SKILLS[sid].name);
        }
      });
    }
  }
  return res;
}

// 武器系别限定（02 文档）：剑系通用，其余系别需角色模板 arms 包含
// 系别：sword 剑(通用) / blade 刀(关羽周仓魏延) / spear 矛(张飞) / pike 枪(赵云马超姜维) / bow 弓(黄忠) / fan 扇(诸葛亮庞统)
function canWield(heroKey, itemId) {
  var it = ITEMS[itemId];
  if (!it || it.type !== "weapon") return false;
  if (!it.arm || it.arm === "sword") return true;
  var tpl = HERO_TPL[heroKey];
  return !!(tpl && tpl.arms && tpl.arms.indexOf(it.arm) >= 0);
}

// ---------------- 存档版本与迁移（纯逻辑，前端 save.js 调用） ----------------
// v2 → v3：补装备仓库字段 equips；v3 → v4：装备实例化展开 + 编成/军师/阵形/强化/图鉴/分线字段
// v4 → v5：装备五槽，补头盔/护腿槽位
// v1 及未知版本返回 null（前端提示不兼容）
var SAVE_VERSION = 5;

// 装备实例化：旧的 {物品id: 数量} 展开为实例数组 [{uid,id,plus:0}]（强化以实例为单位）
function expandEquips(old, startUid) {
  var list = [], uid = startUid || 1;
  if (Array.isArray(old)) return { list: old, nextUid: uid + old.length };
  for (var id in old) {
    for (var i = 0; i < old[id]; i++) list.push({ uid: "e" + (uid++), id: id, plus: 0 });
  }
  return { list: list, nextUid: uid };
}

function migrateSave(state) {
  if (!state || typeof state !== "object") return null;
  if (state.v === 2) {
    state.v = 3;
    if (!state.equips) state.equips = {};
  }
  if (state.v === 3) {
    state.v = 4;
    var expanded = expandEquips(state.equips || {});
    state.equips = expanded.list;
    state.nextUid = expanded.nextUid;
    if (!state.bench) state.bench = [];
    if (state.formation === undefined) state.formation = null;
    if (state.strategist === undefined) state.strategist = null;
    if (!state.enhance) state.enhance = {};
    if (!state.dex) state.dex = {};
    if (state.stash === undefined) state.stash = null;
  }
  if (state.v === 4) {
    state.v = 5;
    // 装备五槽：给所有成员（含后备、分线暂存）补头盔/护腿槽
    var fixSlots = function (list) {
      (list || []).forEach(function (h) {
        h.equips = h.equips || {};
        if (h.equips.helmet === undefined) h.equips.helmet = null;
        if (h.equips.legs === undefined) h.equips.legs = null;
      });
    };
    fixSlots(state.party); fixSlots(state.bench);
    if (state.stash) { fixSlots(state.stash.party); fixSlots(state.stash.bench); }
  }
  return state.v === SAVE_VERSION ? state : null;
}

if (typeof module !== "undefined") {
  module.exports = {
    MAX_LV: MAX_LV, expForLevel: expForLevel, expToNext: expToNext,
    GROWTH_RATE: GROWTH_RATE, GROWTH_BASE: GROWTH_BASE, statAt: statAt,
    recalcHero: recalcHero, equipOf: equipOf, equipBonus: equipBonus,
    atkTotal: atkTotal, defTotal: defTotal, intTotal: intTotal,
    spdTotal: spdTotal, luckTotal: luckTotal,
    physDmg: physDmg, magicDmg: magicDmg, skillScale: skillScale,
    healAmount: healAmount, enemyExp: enemyExp,
    fleeChance: fleeChance, gainExp: gainExp,
    FRONT_COUNT: FRONT_COUNT, formStat: formStat, aggroWeight: aggroWeight,
    pickWeightedIndex: pickWeightedIndex,
    ENHANCE_MAX: ENHANCE_MAX, enhanceFee: enhanceFee, enhancedAtk: enhancedAtk,
    checkRecruit: checkRecruit, phaseIndex: phaseIndex, canWield: canWield,
    SAVE_VERSION: SAVE_VERSION, expandEquips: expandEquips, migrateSave: migrateSave,
  };
}
