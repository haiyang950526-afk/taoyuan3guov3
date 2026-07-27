// 引擎 · 战斗系统（回合制指令驱动）
// 已支持机制（全部由 data/enemies.js 编组 schema 驱动，不写死内容）：
//   基础：攻击/谋略/道具/防御/逃跑，速度排序，Boss 台词（战前+50%血）
//   军师位被动（magicDmg/mpRegen/allStats）、阵形修正与前/后排受击权重
//   演出战（unbeatable 撑回合）、连战（chain，场间可用 1 道具）、波次战（waves）
//   收服战（recruit）、固定败战（scriptedLoss）、多形态 Boss（phases）
//   后备 50% 经验、掉落入装备仓库、图鉴记录
"use strict";

const B = {
  enemies: [], actions: [], heroIdx: 0, round: 1,
  boss: false, unbeatable: false, surviveRounds: 0, fixedReward: null,
  halfText: null, over: false, onWin: null, after: null, terrain: null,
  chain: [], waves: [], accEnemies: [],
  recruit: null, onRecruit: null,
  scriptedLoss: false, buffed3x: false, onLoss: null,
  protect: null,          // 护送：该角色阵亡即失败重来（编组 protect: "百姓"）
  restart: null,          // 护送失败重开所需 {groupKey, opts}
  forceEndRound: 0, onForceEnd: null,  // 强制结束（华容道"突围"）
  fire: null,             // 火攻演出 {round, say, dmg}
  strat: null,
};

function aliveHeroes() { return S.party.filter(h => h.hp > 0); }
function aliveEnemies() { return B.enemies.filter(e => e.hp > 0); }

// 战斗中属性：装备面板 × 阵形 × 军师 allStats
function bStat(h, key) {
  const base = { atk: atkTotal, def: defTotal, int: intTotal, spd: spdTotal, luck: luckTotal }[key](h);
  return formStat(base, key, S.party.indexOf(h), S.formation, B.strat);
}

// 生成敌方实例（skills 数组化以支持多形态换技能表；phases 为多形态配置）
function spawnEnemies(names) {
  return names.map((k, i) => {
    const e = ENEMIES[k];
    return {
      key: k, lv: e.lv,
      name: k + (names.filter(x => x === k).length > 1 ? " " + "甲乙丙丁"[i] : ""),
      hp: e.hp, maxHp: e.hp, atk: e.atk, int: e.int, def: e.def,
      spd: e.spd, luck: e.luck, gold: e.gold, color: e.color,
      ai: e.ai, boss: !!e.boss, elite: !!e.elite,
      skills: e.skill ? [e.skill] : [],
      phases: e.phases || null, phaseIdx: -1,
      defBuff: 1, atkMult: 1, halfSaid: false,
      stun: 0, burn: 0,       // 时运武器特效：眩晕（下回合无法行动）/ 起火（3 回合灼烧）
    };
  });
}

// groupKey：BATTLE_GROUPS 的键；随机遇敌时传 null + opts.enemies
function startBattle(groupKey, opts) {
  opts = opts || {};
  const grp = groupKey ? BATTLE_GROUPS[groupKey] : null;
  const names = grp ? (grp.waves ? grp.waves[0] : grp.enemies) : opts.enemies;
  S.mode = "battle";
  B.enemies = spawnEnemies(names);
  B.boss = grp ? !!grp.boss : false;
  B.unbeatable = grp ? !!grp.unbeatable : false;
  B.surviveRounds = grp ? (grp.surviveRounds || 0) : 0;
  B.fixedReward = grp ? (grp.fixedReward || null) : null;
  B.halfText = grp && grp.half ? resolveText(grp.half) : null;
  B.onWin = opts.onWin || null;
  B.after = opts.after || null;
  B.terrain = (grp && grp.terrain) || TERRAIN_BY_TILE[tileAt(S.px, S.py)] || null;
  // 连战/波次/收服/固定败
  B.chain = grp && grp.chain ? grp.chain.slice() : [];
  B.waves = grp && grp.waves ? grp.waves.slice(1) : [];
  B.accEnemies = [];
  B.recruit = grp ? (grp.recruit || null) : null;
  B.onRecruit = opts.onRecruit || null;
  B.scriptedLoss = grp ? !!grp.scriptedLoss : false;
  B.buffed3x = false;
  B.onLoss = opts.onLoss || null;
  // 护送 / 强制结束 / 火攻演出
  B.protect = grp ? (grp.protect || null) : null;
  B.restart = { groupKey: groupKey, opts: opts };
  B.forceEndRound = grp ? (grp.forceEndRound || 0) : 0;
  B.onForceEnd = opts.onForceEnd || null;
  B.fire = grp ? (grp.fire || null) : null;
  // 军师被动快照
  B.strat = S.strategist && HERO_TPL[S.strategist] ? HERO_TPL[S.strategist].strategistPassive : null;
  B.round = 1;
  B.over = false;
  B.heroIdx = 0;
  B.actions = [];
  B.seedUsed = false;   // 白莲之种：每场战斗限触发一次
  S.party.forEach(h => { h.defending = false; h.atkBuff = 1; h.defBuffHero = 1; });
  // 图鉴：见过即录
  for (const k of names) {
    if (!S.dex[k]) S.dex[k] = { seen: 0, killed: 0 };
    S.dex[k].seen++;
  }
  $("battle-log").innerHTML = "";
  if (grp && grp.pre) resolveText(grp.pre).forEach(l => blog(l));
  else blog(B.boss ? "强敌拦住了去路！" : "遭遇了敌人！");
  if (B.unbeatable) blog("（敌军势大，不可力敌——尽力支撑 " + B.surviveRounds + " 回合！）");
  if (B.recruit) blog("（若能在 " + B.recruit.withinRounds + " 回合内将其逼至三成血以下，或可说降……）");
  show("battle-ui");
  battleInput();
}

function blog(msg) {
  const d = $("battle-log");
  d.innerHTML += msg + "<br>";
  d.scrollTop = d.scrollHeight;
}

// ---------------- 指令输入 ----------------
function battleInput() {
  if (B.over) return;
  if (!aliveEnemies().length) { onEnemiesCleared(null); return; }
  if (!aliveHeroes().length) { battleLose(); return; }
  // 跳过阵亡角色；自动队友（如陈登）直接出招
  while (B.heroIdx < S.party.length) {
    const h = S.party[B.heroIdx];
    if (h.hp <= 0) { B.heroIdx++; continue; }
    if (h.auto) { B.actions.push(autoAction(h)); B.heroIdx++; continue; }
    break;
  }
  if (B.heroIdx >= S.party.length) { battleExec(); return; }
  const h = S.party[B.heroIdx];
  const done = act => { B.actions.push(act); B.heroIdx++; battleInput(); };
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— " + h.key + " 行动（第" + B.round + "回合）——"));
  cmd.appendChild(btn("攻击", () => pickTarget(t => done({ actor: h, type: "atk", target: t }))));
  cmd.appendChild(btn("谋略", () => pickSkill(h, done)));
  cmd.appendChild(btn("道具", () => pickItem(h, done)));
  cmd.appendChild(btn("防御", () => done({ actor: h, type: "defend" })));
  cmd.appendChild(btn("逃跑", () => {
    if (B.boss) { blog("逃不掉！只能一战！"); return; }
    const pSpd = avg(aliveHeroes().map(h => bStat(h, "spd")));
    const eSpd = avg(aliveEnemies().map(e => e.spd));
    if (Math.random() < fleeChance(pSpd, eSpd)) {
      blog("成功逃走了！");
      B.over = true;
      setTimeout(() => endBattle("fled"), 700);
    } else {
      blog("逃跑失败！");
      B.heroIdx = S.party.length;
      battleExec();
    }
  }));
}

function avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }

function pickSkill(h, done) {
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— 选择谋略（MP " + h.mp + "/" + h.maxMp + "）——"));
  for (const sid of h.skills) {
    const sk = SKILLS[sid];
    cmd.appendChild(btn(sk.name + "（" + sk.cost + "MP，" + sk.desc + "）", () => {
      if (h.mp < sk.cost) { toast("MP不足！"); return; }
      if (sk.type === "dmg" || sk.type === "magic")
        pickTarget(t => done({ actor: h, type: "skill", skill: sid, target: t }));
      else if (sk.type === "buffAtk" || (sk.target === "one" && sk.type !== "dmg"))
        pickAlly(t => done({ actor: h, type: "skill", skill: sid, target: t }));
      else done({ actor: h, type: "skill", skill: sid });
    }));
  }
  cmd.appendChild(btn("返回", battleInput, "ghost"));
}

// 道具：治疗选存活队友；返魂香类（revive）可选阵亡队友
function pickItem(h, done) {
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— 选择道具 ——"));
  let any = false;
  for (const id in S.inv) {
    const it = ITEMS[id];
    // 剧情物品（无任何使用效果字段）不进战斗道具栏
    if (!it || it.type !== "item" || S.inv[id] <= 0 || it.mat ||
        (!it.heal && !it.mp && !it.revive && !it.dmgAll)) continue;
    any = true;
    cmd.appendChild(btn(id + " ×" + S.inv[id] + "（" + it.desc + "）", () => {
      if (it.revive) pickDeadAlly(t => done({ actor: h, type: "item", item: id, target: t }));
      else if (it.dmgAll) done({ actor: h, type: "item", item: id });
      else pickAlly(t => done({ actor: h, type: "item", item: id, target: t }));
    }));
  }
  if (!any) cmd.appendChild(line("（没有可用的道具）"));
  cmd.appendChild(btn("返回", battleInput, "ghost"));
}

function pickTarget(cb) {
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— 选择目标 ——"));
  for (const e of aliveEnemies()) {
    cmd.appendChild(btn(e.name, () => cb(e)));
  }
  cmd.appendChild(btn("返回", battleInput, "ghost"));
}
function pickAlly(cb) {
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— 选择队友 ——"));
  for (const h of S.party) {
    if (h.hp > 0) cmd.appendChild(btn(h.key, () => cb(h)));
  }
  cmd.appendChild(btn("返回", battleInput, "ghost"));
}
function pickDeadAlly(cb) {
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— 复活谁 ——"));
  const dead = S.party.filter(h => h.hp <= 0);
  if (!dead.length) cmd.appendChild(line("（没有阵亡的队友）"));
  for (const h of dead) cmd.appendChild(btn(h.key + "（阵亡）", () => cb(h)));
  cmd.appendChild(btn("返回", battleInput, "ghost"));
}

// 自动队友：有队友血量低于七成且 MP 够就放治疗，否则普攻血最少的敌人
function autoAction(h) {
  const healSid = h.skills.find(sid => SKILLS[sid].type.indexOf("heal") === 0);
  const wounded = aliveHeroes().filter(x => x.hp < x.maxHp * 0.7)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (healSid && wounded && h.mp >= SKILLS[healSid].cost) {
    const sk = SKILLS[healSid];
    return { actor: h, type: "skill", skill: healSid, target: sk.target === "one" ? wounded : null };
  }
  const t = aliveEnemies().slice().sort((a, b) => a.hp - b.hp)[0];
  return { actor: h, type: "atk", target: t };
}

// ---------------- 敌方 AI ----------------
// 前/后排受击权重（前排 65%/后排 35%，阵形可覆盖）；弓手额外偏好后排
function pickDefender(backBias) {
  const heroes = aliveHeroes();
  const frontAlive = heroes.filter(h => S.party.indexOf(h) < FRONT_COUNT).length;
  const backAlive = heroes.length - frontAlive;
  const weights = heroes.map(h => {
    let w = aggroWeight(S.party.indexOf(h), frontAlive, backAlive, S.formation);
    if (backBias && S.party.indexOf(h) >= FRONT_COUNT) w *= 2;
    return w;
  });
  return heroes[Math.max(0, pickWeightedIndex(weights))];
}

function enemyAction(e) {
  const lowestHp = aliveHeroes().slice().sort((a, b) => a.hp - b.hp)[0];
  // caster：每回合施放技能表第一式（司马懿"天命"全屏计策）
  if (e.ai === "caster" && e.skills.length) return { actor: e, type: "enemySkill" };
  if (e.ai === "strategist" && e.skills.length && B.round % 3 === 1 && e.defBuff === 1) {
    return { actor: e, type: "enemySkill" };
  }
  if (e.ai === "heavy" && B.round % 2 === 0) {
    return { actor: e, type: "atk", target: lowestHp, mult: 1.6, label: "奋力一击" };
  }
  if (e.ai === "archer") return { actor: e, type: "atk", target: pickDefender(true) };
  if (e.ai === "brute") return { actor: e, type: "atk", target: lowestHp };
  return { actor: e, type: "atk", target: pickDefender(false) };
}

function battleExec() {
  for (const e of aliveEnemies()) {
    if (aliveHeroes().length) B.actions.push(enemyAction(e));
  }
  B.actions.sort((a, b) => {
    const sa = a.actor.stats ? bStat(a.actor, "spd") : a.actor.spd;
    const sb = b.actor.stats ? bStat(b.actor, "spd") : b.actor.spd;
    return sb - sa || Math.random() - 0.5;
  });
  const queue = B.actions;
  B.actions = [];
  B.heroIdx = 0;
  runQueue(queue);
}

// ---------------- 行动结算 ----------------
function actorName(a) { return a.key || a.name; }
function isEnemy(a) { return !!a.gold; }

function physAtk(attacker, target, mult, label) {
  const atk = isEnemy(attacker)
    ? attacker.atk * attacker.atkMult
    : bStat(attacker, "atk") * (attacker.atkBuff || 1);
  const def = isEnemy(target)
    ? target.def * target.defBuff
    : bStat(target, "def") * (target.defBuffHero || 1);
  const luck = isEnemy(attacker) ? attacker.luck : bStat(attacker, "luck");
  const r = physDmg(atk, mult, def, luck, undefined,
    isEnemy(attacker) ? 0 : critBonusOf(attacker));
  let dmg = r.dmg;
  if (target.defending) dmg = Math.max(1, Math.floor(dmg / 2));
  target.hp = Math.max(0, target.hp - dmg);
  blog(actorName(attacker) + " 的" + (label || "攻击") + "！" + actorName(target) +
    " 受到 " + dmg + " 点伤害" + (r.crit ? "（暴击！）" : "") +
    (target.defending ? "（防御中，伤害减半）" : "") +
    (target.hp <= 0 ? "，倒下了！" : "。"));
  // 时运（樗蒲首奖成长武器）：我方普攻命中存活敌人时 20% 触发一种时运效果
  if (!isEnemy(attacker) && isEnemy(target) && target.hp > 0) {
    const w = equipOf(attacker, "weapon");
    if (w && w.id === "时运" && Math.random() < 0.2) {
      const roll = Math.floor(Math.random() * 4);
      if (roll === 0 && !target.boss) {
        target.stun = 1;
        blog("时运发动：" + actorName(target) + " 被震晕了！（下回合无法行动）");
      } else if (roll === 1) {
        target.burn = 3;
        blog("时运发动：" + actorName(target) + " 起火了！（3 回合灼烧）");
      } else if (roll === 2 || roll === 0) {   // Boss 免眩晕，转为追加伤害
        target.hp = Math.max(0, target.hp - 5);
        blog("时运发动：追加 5 点伤害！");
      } else {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + 5);
        blog("时运发动：" + actorName(attacker) + " 回复 5 点HP！");
      }
    }
  }
  afterEnemyDamaged(target);
  checkProtectDown();
}

// 敌受伤害后的统一检查：50%血台词 / 多形态切换 / 收服判定
function afterEnemyDamaged(target) {
  if (!isEnemy(target)) return;
  checkHalf(target);
  checkPhase(target);
  checkRecruitWin(target);
}

function checkHalf(target) {
  if (!B.halfText || !target.boss || target.halfSaid) return;
  if (target.hp > 0 && target.hp <= target.maxHp / 2) {
    target.halfSaid = true;
    B.halfText.forEach(l => blog(l));
  }
}

function checkPhase(e) {
  if (!e.phases || e.hp <= 0) return;
  const idx = phaseIndex(e.phases, e.hp, e.maxHp);
  while (e.phaseIdx < idx) {
    e.phaseIdx++;
    const ph = e.phases[e.phaseIdx];
    if (ph.say) resolveText(ph.say).forEach(l => blog(l));
    if (ph.statsMult) for (const k in ph.statsMult) e[k] = Math.round(e[k] * ph.statsMult[k]);
    if (ph.skills) e.skills = ph.skills.slice();
    blog("（" + e.name + " 的气势变了！）");
  }
}

function checkRecruitWin(target) {
  if (!B.recruit || B.over || !target.boss) return;
  if (checkRecruit(B.recruit, B.round, target.hp, target.maxHp)) {
    B.over = true;
    blog(target.name + " 收住兵器，露出了敬佩之色……");
    if (B.recruit.joins) {
      joinBench(B.recruit.joins);
      blog(B.recruit.joins + " 愿随刘使君左右！（加入后备队伍）");
    }
    hud();
    setTimeout(() => endBattle("recruit"), 1400);
  }
}

function runQueue(queue) {
  const act = queue.shift();
  if (!act) { roundEnd(); return; }
  const a = act.actor;
  if (a.hp <= 0) { runQueue(queue); return; }
  // 时运·眩晕：跳过本回合行动
  if (a.stun > 0) {
    a.stun--;
    blog(actorName(a) + " 晕头转向，无法行动！");
    runQueue(queue); return;
  }
  if (act.type === "atk") {
    if (act.target.hp <= 0) { runQueue(queue); return; }
    physAtk(a, act.target, act.mult || 1, act.label);
  } else if (act.type === "skill") {
    const sk = SKILLS[act.skill];
    a.mp -= sk.cost;
    if (sk.type === "dmg") {
      if (act.target.hp <= 0) { runQueue(queue); return; }
      a.mp = Math.max(0, a.mp);
      physAtkSkill(a, act.target, sk);
    } else if (sk.type === "magic") {
      if (act.target.hp <= 0) { runQueue(queue); return; }
      // 计策：智驱动，吃地形联动、军师 magicDmg 被动与等级缩放
      const linked = sk.terrain && sk.terrain === B.terrain;
      const tInt = isEnemy(act.target) ? act.target.int : bStat(act.target, "int");
      let coef = sk.coef * skillScale(a.lv);
      if (B.strat && B.strat.type === "magicDmg") coef *= (1 + B.strat.value);
      let dmg = magicDmg(bStat(a, "int"), coef, tInt, linked);
      // 名品 · 六韬残页被动：军师计策伤害+10%（全游戏唯一百分比被动，relic_liutao flag）
      if (S.flags.relic_liutao) dmg = Math.round(dmg * 1.1);
      // 八卦阵等计策抗性（敌方施放时对我方生效，预留）
      if (!isEnemy(act.target) && S.formation && FORMATIONS[S.formation] &&
          FORMATIONS[S.formation].magicResist) {
        dmg = Math.max(1, Math.round(dmg * (1 - FORMATIONS[S.formation].magicResist)));
      }
      act.target.hp = Math.max(0, act.target.hp - dmg);
      blog(actorName(a) + " 祭起" + sk.name + "！" + actorName(act.target) +
        " 受到 " + dmg + " 点伤害" + (linked ? "（地形联动！）" : "") +
        (act.target.hp <= 0 ? "，倒下了！" : "。"));
      afterEnemyDamaged(act.target);
    } else if (sk.type === "dmgAll") {
      blog(actorName(a) + " 使出" + sk.name + "，横扫敌阵！");
      for (const e of aliveEnemies()) physAtkSkill(a, e, sk, true);
    } else if (sk.type === "magicAll") {
      // 全体计策（东风/星落）：智驱动 × 等级缩放（×军师被动）
      let coef = sk.coef * skillScale(a.lv);
      if (B.strat && B.strat.type === "magicDmg") coef *= (1 + B.strat.value);
      blog(actorName(a) + " 祭起" + sk.name + "！");
      for (const e of aliveEnemies()) {
        const linked = sk.terrain && sk.terrain === B.terrain;
        let dmg = magicDmg(bStat(a, "int"), coef, e.int, linked);
        // 名品 · 六韬残页被动：军师计策伤害+10%（同上，全体计策也生效）
        if (S.flags.relic_liutao) dmg = Math.round(dmg * 1.1);
        e.hp = Math.max(0, e.hp - dmg);
        blog(e.name + " 受到 " + dmg + " 点伤害" + (linked ? "（地形联动！）" : "") +
          (e.hp <= 0 ? "，倒下了！" : "。"));
        afterEnemyDamaged(e);
      }
    } else if (sk.type === "buffDefAll") {
      for (const h of aliveHeroes()) h.defBuffHero = (h.defBuffHero || 1) * sk.mult;
      blog(actorName(a) + " 布下" + sk.name + "，全军防御上升！");
    } else if (sk.type === "healFixed") {
      const pw = Math.round(sk.power * skillScale(a.lv));
      const targets = sk.target === "all" ? aliveHeroes() : [act.target];
      for (const h of targets) h.hp = Math.min(h.maxHp, h.hp + pw);
      blog(actorName(a) + " 使用" + sk.name + "，回复 " + pw + " 点HP！");
    } else if (sk.type === "healInt") {
      const targets = sk.target === "all" ? aliveHeroes() : [act.target];
      for (const h of targets) {
        const amt = healAmount(bStat(a, "int"), sk.coef * skillScale(a.lv));
        h.hp = Math.min(h.maxHp, h.hp + amt);
        blog(actorName(a) + " 使用" + sk.name + "，" + h.key + " 回复 " + amt + " 点HP！");
      }
    } else if (sk.type === "buffAtk") {
      act.target.atkBuff = (act.target.atkBuff || 1) * sk.mult;
      blog(actorName(a) + " 使用" + sk.name + "，" + act.target.key + " 攻击上升！");
    } else if (sk.type === "debuffAtkAll") {
      for (const e of aliveEnemies()) e.atkMult *= sk.mult;
      blog(actorName(a) + " 使出" + sk.name + "，敌全军攻击下降！");
    }
  } else if (act.type === "enemySkill") {
    const sk = SKILLS[a.skills[0]];
    if (sk.type === "enemyMagicAll") {
      // 敌方全屏计策（司马懿·天命）：智驱动，吃八卦阵抗性
      blog(actorName(a) + " 祭起" + sk.name + "，天地变色！");
      for (const h of aliveHeroes()) {
        let dmg = magicDmg(a.int, sk.coef, bStat(h, "int"), false);
        if (S.formation && FORMATIONS[S.formation] && FORMATIONS[S.formation].magicResist) {
          dmg = Math.max(1, Math.round(dmg * (1 - FORMATIONS[S.formation].magicResist)));
        }
        if (h.defending) dmg = Math.max(1, Math.floor(dmg / 2));
        h.hp = Math.max(0, h.hp - dmg);
        blog(h.key + " 受到 " + dmg + " 点伤害" + (h.hp <= 0 ? "，倒下了！" : "。"));
      }
      checkProtectDown();
    } else {
      for (const e of aliveEnemies()) e.defBuff = sk.mult;
      blog(actorName(a) + " 喝令" + sk.name + "，敌全军防御上升！");
    }
  } else if (act.type === "defend") {
    a.defending = true;
    a.mp = Math.min(a.maxMp, a.mp + Math.ceil(a.maxMp * 0.05));
    blog(actorName(a) + " 摆开守势。（本回合受伤减半，MP 回复 5%）");
  } else if (act.type === "item") {
    const it = ITEMS[act.item];
    S.inv[act.item]--;
    if (it.revive) {
      act.target.hp = Math.round(act.target.maxHp * it.revive);
      blog(actorName(a) + " 燃起返魂香，" + actorName(act.target) + " 重新站了起来！");
    } else if (it.mp) {
      act.target.mp = Math.min(act.target.maxMp, act.target.mp + it.mp);
      blog(actorName(a) + " 饮下" + act.item + "，" + actorName(act.target) +
        " 回复 " + it.mp + " 点MP。");
    } else if (it.dmgAll) {
      blog(actorName(a) + " 掷出" + act.item + "，敌阵一片火海！");
      for (const e of aliveEnemies()) {
        e.hp = Math.max(0, e.hp - it.dmgAll);
        blog(e.name + " 受到 " + it.dmgAll + " 点伤害" + (e.hp <= 0 ? "，倒下了！" : "。"));
        afterEnemyDamaged(e);
      }
    } else {
      const hv = it.heal === "full" ? act.target.maxHp : it.heal;
      act.target.hp = Math.min(act.target.maxHp, act.target.hp + hv);
      blog(actorName(a) + " 给 " + actorName(act.target) + " 用了" + act.item +
        "，回复" + hv + "点HP。");
    }
  }
  hud();
  if (B.over) return;   // 收服/演出等特殊终局已接管
  if (!aliveEnemies().length) { onEnemiesCleared(queue); return; }
  if (!aliveHeroes().length) { battleLose(); return; }
  setTimeout(() => runQueue(queue), 450);
}

// 护送：被护送角色阵亡即失败（battleLose 内按 protect 重打）
function checkProtectDown() {
  if (!B.protect || B.over) return;
  const p = S.party.find(h => h.key === B.protect);
  if (p && p.hp <= 0) battleLose();
}

function physAtkSkill(attacker, target, sk, quiet) {
  const atk = bStat(attacker, "atk") * (attacker.atkBuff || 1);
  const def = isEnemy(target)
    ? target.def * target.defBuff
    : bStat(target, "def") * (target.defBuffHero || 1);
  // 武技倍率 × 等级缩放
  const r = physDmg(atk, sk.mult * skillScale(attacker.lv), def, bStat(attacker, "luck"),
    undefined, critBonusOf(attacker));
  target.hp = Math.max(0, target.hp - r.dmg);
  if (!quiet) blog(actorName(attacker) + " 的" + sk.name + "！");
  blog(actorName(target) + " 受到 " + r.dmg + " 点伤害" + (r.crit ? "（暴击！）" : "") +
    (target.hp <= 0 ? "，倒下了！" : "。"));
  afterEnemyDamaged(target);
}

// 敌全灭时的分流：还有波次 → 直接续战；否则胜利结算/连战
function onEnemiesCleared(queue) {
  if (B.waves.length) {
    B.accEnemies = B.accEnemies.concat(B.enemies);
    const names = B.waves.shift();
    B.enemies = spawnEnemies(names);
    blog("—— 下一波敌军杀到！——");
    for (const k of names) {
      if (!S.dex[k]) S.dex[k] = { seen: 0, killed: 0 };
      S.dex[k].seen++;
    }
    if (queue) setTimeout(() => runQueue(queue), 600);
    else battleInput();
    return;
  }
  battleWin(false);
}

function roundEnd() {
  S.party.forEach(h => { h.defending = false; });
  // 军师 mpRegen 被动
  if (B.strat && B.strat.type === "mpRegen") {
    for (const h of aliveHeroes()) h.mp = Math.min(h.maxMp, h.mp + B.strat.value);
  }
  // 时运·起火灼烧：每回合 5 伤
  for (const e of aliveEnemies()) {
    if (e.burn > 0) {
      e.burn--;
      e.hp = Math.max(0, e.hp - 5);
      blog(e.name + " 被火焰灼烧，受到 5 点伤害" + (e.hp <= 0 ? "，倒下了！" : "。"));
      afterEnemyDamaged(e);
    }
  }
  if (B.over) return;
  if (!aliveEnemies().length) { onEnemiesCleared(null); return; }
  B.round++;
  // 固定败战：第 2 回合起敌方属性×3（确保必败）
  if (B.scriptedLoss && B.round >= 2 && !B.buffed3x) {
    B.buffed3x = true;
    for (const e of aliveEnemies()) { e.atk *= 3; e.def *= 3; }
    blog("（敌军真正的实力展露无遗——此战不可胜……）");
  }
  // 火攻演出：到回合自动放火烧敌（博望坡/赤壁教学战）
  if (B.fire && B.round === B.fire.round) {
    if (B.fire.say) resolveText(B.fire.say).forEach(l => blog(l));
    for (const e of aliveEnemies()) {
      e.hp = Math.max(0, e.hp - B.fire.dmg);
      blog(e.name + " 被烈焰吞没，受到 " + B.fire.dmg + " 点伤害" +
        (e.hp <= 0 ? "，倒下了！" : "。"));
      afterEnemyDamaged(e);
    }
    if (B.over) return;
    if (!aliveEnemies().length) { onEnemiesCleared(null); return; }
  }
  // 强制结束（华容道"突围"）：到回合按剧情结束战斗
  if (B.forceEndRound && B.round >= B.forceEndRound) {
    B.over = true;
    blog("（曹军且战且退，夺路突围而去……）");
    setTimeout(() => endBattle("force"), 1200);
    return;
  }
  if (B.unbeatable && B.round > B.surviveRounds) { battleWin(true); return; }
  if (B.unbeatable) blog("—— 第 " + B.round + " 回合（还需支撑 " +
    (B.surviveRounds - B.round + 1) + " 回合）——");
  battleInput();
}

// ---------------- 胜负结算 ----------------
function battleWin(survived) {
  if (B.over) return;
  // 连战：还有下一场 → 不结算，进入场间整备
  if (B.chain.length && !survived) {
    B.over = true;
    B.accEnemies = B.accEnemies.concat(B.enemies);
    blog("—— 连战间隙：可紧急使用 1 个道具 ——");
    chainBreak();
    return;
  }
  B.over = true;
  const all = B.accEnemies.concat(B.enemies);
  let exp, gold;
  if (B.fixedReward) {
    exp = B.fixedReward.exp; gold = B.fixedReward.gold;
  } else {
    exp = all.reduce((s, e) => s + enemyExp(e), 0);
    gold = all.reduce((s, e) =>
      s + e.gold[0] + Math.floor(Math.random() * (e.gold[1] - e.gold[0] + 1)), 0);
  }
  S.gold += gold;
  blog(survived ? "撑住了！敌军攻势已竭。" : "战斗胜利！");
  blog("获得经验 " + exp + " 点" + (gold ? "、" + gold + " 金" : "") + "。");
  // 图鉴击败数
  for (const e of all) {
    if (!S.dex[e.key]) S.dex[e.key] = { seen: 0, killed: 0 };
    S.dex[e.key].killed++;
  }
  // 掉落：逐怪掷点（演出战固定结算不掉落）；装备实例入仓库，消耗品进背包
  if (!B.fixedReward) {
    const loot = {};
    for (const e of all) {
      const tpl = ENEMIES[e.key];
      for (const d of (tpl.drops || [])) {
        if (Math.random() < d.rate) loot[d.item] = (loot[d.item] || 0) + 1;
      }
    }
    const ids = Object.keys(loot);
    if (ids.length) {
      for (const id of ids) {
        if (ITEMS[id].type === "item") S.inv[id] = (S.inv[id] || 0) + loot[id];
        else for (let i = 0; i < loot[id]; i++) addEquipInst(id);
      }
      blog("战利品：" + ids.map(id => id + "×" + loot[id]).join("、"));
    }
  }
  // 经验即时结算：主战全员全额，后备 50%；升级即学新谋略并提示
  for (const h of S.party) {
    const r = gainExp(h, exp);
    if (r.levels > 0) blog(h.key + " 升到了 Lv " + h.lv + "！");
    if (r.learned.length) {
      blog(h.key + " 习得新谋略：" + r.learned.join("、") + "！");
      toast(h.key + " 习得 " + r.learned.join("、"));
    }
  }
  if (S.bench.length) {
    for (const h of S.bench) gainExp(h, Math.round(exp / 2));
    blog("后备队员获得一半经验。");
  }
  hud();
  setTimeout(() => endBattle("won"), 1400);
}

// 连战场间：可紧急使用 1 个道具，然后继续下一场
function chainBreak() {
  const cmd = $("battle-cmd");
  cmd.innerHTML = "";
  cmd.appendChild(line("—— 连战间隙（可先用 1 个道具）——"));
  let used = false;
  const render = () => {
    cmd.innerHTML = "";
    cmd.appendChild(line("—— 连战间隙（可先用 1 个道具）——"));
    if (!used) {
      for (const id in S.inv) {
        const it = ITEMS[id];
        if (!it || it.type !== "item" || S.inv[id] <= 0 || it.mat) continue;
        cmd.appendChild(btn(id + " ×" + S.inv[id], () => {
          const pick = it.revive ? pickDeadAlly : pickAlly;
          pick(t => {
            S.inv[id]--;
            if (it.revive) t.hp = Math.round(t.maxHp * it.revive);
            else t.hp = Math.min(t.maxHp, t.hp + it.heal);
            blog("使用了 " + id + "。");
            used = true;
            render();
          });
        }));
      }
    }
    cmd.appendChild(btn("继续战斗 →", () => nextChainBattle()));
  };
  render();
}

function nextChainBattle() {
  const key = B.chain.shift();
  const grp = BATTLE_GROUPS[key];
  // 与 startBattle 同口径：waves 组先上第 1 波，余波挂 B.waves
  const names = grp.waves ? grp.waves[0] : grp.enemies;
  B.enemies = spawnEnemies(names);
  B.waves = grp.waves ? grp.waves.slice(1) : [];
  for (const k of names) {
    if (!S.dex[k]) S.dex[k] = { seen: 0, killed: 0 };
    S.dex[k].seen++;
  }
  if (grp.half) B.halfText = resolveText(grp.half);
  S.party.forEach(h => { h.defending = false; h.atkBuff = 1; h.defBuffHero = 1; });
  B.round = 1;
  B.heroIdx = 0;
  B.actions = [];
  B.over = false;
  blog("—— 第二阵！" + (grp.pre ? "" : "敌军再度杀到！") + " ——");
  if (grp.pre) resolveText(grp.pre).forEach(l => blog(l));
  battleInput();
}

function battleLose() {
  if (B.over) return;
  B.over = true;
  if (B.protect) {
    // 护送失败：不扣资源，满状态重打这一场
    blog(B.protect + " 倒下了……护送失败！");
    setTimeout(() => {
      S.party.forEach(h => { h.hp = h.maxHp; h.mp = h.maxMp; });
      blog("（重新整队，再护一程！）");
      startBattle(B.restart.groupKey, B.restart.opts);
    }, 1200);
    return;
  }
  if (B.scriptedLoss) {
    // 固定败战：不回城、不掉资源，走剧情动作
    blog("兵败如山倒……");
    setTimeout(() => {
      S.party.forEach(h => { h.hp = Math.max(1, h.hp); });
      endBattle("loss");
    }, 1500);
    return;
  }
  // 白莲之种：队伍里有人饰品位装备且本场未触发过——全队力竭时自动重整旗鼓
  if (!B.seedUsed && S.party.some(h => { const a = equipOf(h, "acc"); return a && a.id === "白莲之种"; })) {
    S.party.forEach(h => { h.hp = Math.ceil(h.maxHp * 0.3); });
    blog("（白莲之种泛起微光——'渡人，不必非用命。'）");
    blog("（全军重整旗鼓！）");
    B.seedUsed = true;
    B.over = false;
    B.heroIdx = 0;
    B.actions = [];
    battleInput();
    return;
  }
  blog("全军覆没……");
  setTimeout(() => {
    // 零惩罚：回到本章主城，金钱道具不掉
    const home = CHAPTERS[S.chapter].home;
    S.party.forEach(h => { h.hp = Math.max(1, h.hp); });
    hide("battle-ui");
    $("battle-cmd").innerHTML = "";
    S.mode = "map";
    warpTo(home.map, home.x, home.y);
    toast("被抬回了主城……（Boss 战前记得存档）");
  }, 1500);
}

// result: won | fled | recruit | loss | force
function endBattle(result) {
  hide("battle-ui");
  $("battle-cmd").innerHTML = "";
  S.mode = "map";
  hud();
  const onWin = B.onWin, after = B.after;
  const onRecruit = B.onRecruit, onLoss = B.onLoss, onForceEnd = B.onForceEnd;
  B.onWin = null; B.after = null; B.onRecruit = null; B.onLoss = null; B.onForceEnd = null;
  B.chain = []; B.waves = []; B.accEnemies = [];
  if (result === "won" && onWin) runActions(onWin, after || null);
  else if (result === "recruit" && onRecruit) runActions(onRecruit, after || null);
  else if (result === "loss" && onLoss) runActions(onLoss, after || null);
  else if (result === "force" && onForceEnd) {
    // 华容道分支：Boss 血量过半被压制为"胜"，否则为"负"（义释两种台词）
    const boss = B.enemies.find(e => e.boss);
    const branch = boss && boss.hp <= boss.maxHp / 2 ? "win" : "lose";
    runActions(onForceEnd[branch] || onForceEnd.win || [], after || null);
  }
  else if (after) after();
}

// ---------------- 战斗画面 ----------------
function drawBattle() {
  ctx.clearRect(0, 0, VW * TILE, VH * TILE);
  // 背景
  const g = ctx.createLinearGradient(0, 0, 0, VH * TILE);
  g.addColorStop(0, "#1a2238");
  g.addColorStop(1, "#2c3a2a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW * TILE, VH * TILE);
  // 演出战回合进度 / 阵形军师标识
  ctx.font = "14px sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffd166";
  if (B.unbeatable) {
    ctx.fillText("支撑回合 " + Math.min(B.round, B.surviveRounds) + "/" + B.surviveRounds,
      VW * TILE - 12, 22);
  } else if (S.formation || S.strategist) {
    const f = S.formation ? FORMATIONS[S.formation].name : "";
    ctx.fillText(f + (S.strategist ? " 军师:" + S.strategist : ""), VW * TILE - 12, 22);
  }
  ctx.textAlign = "left";
  // 敌人（上排，角色贴图优先：小兵 32x32×2，Boss 64x64×1.5 镜像朝左；未命中回退点阵）
  B.enemies.forEach((e, i) => {
    const x = 60 + i * 120, y = 50;
    const art = charArtImg(e.key, e.phaseIdx);   // 按基础 key 取图（重名"黄巾贼 甲/乙"共用黄巾贼贴图）
    ctx.globalAlpha = e.hp > 0 ? 1 : 0.25;
    if (art) {
      const bw = art.kind === "boss" ? 96 : 64;
      ctx.save();
      ctx.translate(x + (e.boss ? 80 : 64) / 2, y + 84);
      ctx.scale(-1, 1);
      ctx.drawImage(art.img, -bw / 2, -bw, bw, bw);
      ctx.restore();
    } else {
      const sc = e.boss ? 4 : 3;
      const w = 16 * sc, h = 20 * sc;
      const sx = x + ((e.boss ? 80 : 64) - w) / 2;
      const sy = y + (e.boss ? 4 : 20);
      drawBattleSprite(sx, sy, sc, enemyLook(e), true);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y + 100, e.boss ? 80 : 64, 6);
    ctx.fillStyle = "#7ee2a0";
    ctx.fillRect(x, y + 100, (e.boss ? 80 : 64) * Math.max(0, e.hp / e.maxHp), 6);
    ctx.fillStyle = "#e8ecf4";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(e.name + "  " + e.hp + "/" + e.maxHp, x + (e.boss ? 40 : 32), y + 122);
  });
  // 我方（下排，最多 5 人 + 军师标识；角色贴图 32x32×2，未命中回退点阵）
  S.party.forEach((h, i) => {
    const x = 20 + i * 88, y = 220;
    const art = charArtImg(h.key, 0);
    ctx.globalAlpha = h.hp > 0 ? 1 : 0.3;
    if (art) ctx.drawImage(art.img, x - 6, y - 20, 64, 64);
    else drawBattleSprite(x + 2, y - 16, 3, heroLook(h.key), false);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e8ecf4";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(h.key + (h.auto ? "·援" : "") + "  " + h.hp + "/" + h.maxHp, x + 26, y + 58);
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y + 64, 52, 5);
    ctx.fillStyle = "#7ee2a0";
    ctx.fillRect(x, y + 64, 52 * Math.max(0, h.hp / h.maxHp), 5);
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y + 72, 52, 4);
    ctx.fillStyle = "#6ab0ff";
    ctx.fillRect(x, y + 72, 52 * Math.max(0, h.mp / h.maxMp), 4);
  });
  ctx.textAlign = "left";
}
