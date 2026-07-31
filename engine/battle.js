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
      // ---- BOSS 机制（07 文档 schema；全部缺省即现状） ----
      weakMagic: e.weakMagic || null,      // 指定计策伤害倍率 {huoji: 6}
      magicResist: e.magicResist || 0,     // 敌侧计策减伤 0~0.6
      physResist: e.physResist || 0,       // 敌侧物理减伤 0~0.6
      heroLink: e.heroLink || null,        // 指定角色伤害倍率/固伤 [{hero, mult, say, fixed}]
      summon: e.summon || null,            // 召唤 {enemy, everyRounds|hpBelow, count, maxOnField}
      counter: e.counter || 0,             // 物理反伤比例
      atkGrow: e.atkGrow || 0,             // 每回合攻击叠乘成长（怒气）
      stanceCycle: !!e.stanceCycle,        // 守/攻姿态切换
      doubleAction: e.doubleAction || 0,   // 概率二次行动
      doubleActionEvery: e.doubleActionEvery || 0,  // 每 N 回合连击
      selfDot: e.selfDot || 0,             // 每回合自损最大 HP 比例
      flee: e.flee || null,                // 低血逃跑 {hpBelow, rounds}
      dodgePhys: e.dodgePhys || 0,         // 物理闪避率
      allyAura: e.allyAura || null,        // 友军存活光环 {stat, mult}
      allyDeathGrow: e.allyDeathGrow || 0, // 友军死亡增攻
      _base: { atk: e.atk, def: e.def, spd: e.spd, int: e.int },   // 光环/姿态还原快照
    };
  });
}
// 召唤援军专用：单只生成并入队（图鉴同步）
function spawnOne(key) {
  const e = spawnEnemies([key])[0];
  B.enemies.push(e);
  if (!S.dex[key]) S.dex[key] = { seen: 0, killed: 0 };
  S.dex[key].seen++;
  return e;
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
  // BOSS 机制（07 文档）：回合脚本（克隆防污染编组）/ 铁索连环
  B.grpScript = grp && grp.script ? grp.script.map(o => Object.assign({}, o)) : null;
  B.chainFleet = grp ? !!grp.chainFleet : false;
  // 军师被动快照
  B.strat = S.strategist && HERO_TPL[S.strategist] ? HERO_TPL[S.strategist].strategistPassive : null;
  B.round = 1;
  B.over = false;
  B.heroIdx = 0;
  B.actions = [];
  B.seedUsed = false;   // 白莲之种：每场战斗限触发一次
  S.party.forEach(h => { h.defending = false; h.atkBuff = 1; h.defBuffHero = 1; });
  // Boss 基础防御倍率（编组 bossDefMult，如博望坡夏侯惇×3）
  if (grp && grp.bossDefMult) {
    for (const e of B.enemies) if (e.boss) e.def = Math.round(e.def * grp.bossDefMult);
  }
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
    if (aliveHeroes().length) {
      B.actions.push(enemyAction(e));
      // BOSS 机制：概率二次行动（虎豹骑"奔袭"）/ 每 N 回合连击（姜维"幼麟"）
      if (e.doubleAction && Math.random() < e.doubleAction)
        B.actions.push(Object.assign(enemyAction(e), { label: "追击" }));
      if (e.doubleActionEvery && B.round % e.doubleActionEvery === 0)
        B.actions.push(Object.assign(enemyAction(e), { label: "连击" }));
    }
  }
  B.actions.sort((a, b) => {
    let sa = a.actor.stats ? bStat(a.actor, "spd") : a.actor.spd;
    let sb = b.actor.stats ? bStat(b.actor, "spd") : b.actor.spd;
    // BOSS 机制：回合脚本的 partySpdMult（张任"中伏"减速）
    if (B.partySpdMult && B.round <= B.partySpdMult.until) {
      if (!isEnemy(a.actor)) sa *= B.partySpdMult.v;
      if (!isEnemy(b.actor)) sb *= B.partySpdMult.v;
    }
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

// ---- BOSS 机制：我方对敌伤害的统一修正（闪避/物理减伤/铁索连环/历史克制） ----
function adjustOutgoing(attacker, target, dmg) {
  if (!isEnemy(target)) return { dmg: dmg, dodged: false };
  if (target.dodgePhys && Math.random() < target.dodgePhys) return { dmg: 0, dodged: true };
  if (target.physResist) dmg = Math.max(1, Math.round(dmg * (1 - target.physResist)));
  if (B.chainFleet) dmg = Math.max(1, Math.round(dmg * 0.7));   // 船船相护：单体伤害打折
  if (!isEnemy(attacker) && target.heroLink) {
    for (const lk of target.heroLink) {
      if (lk.hero !== attacker.key) continue;
      if (lk.mult) dmg = Math.round(dmg * lk.mult);
      if (lk.say && !target["_said_" + lk.hero]) {
        target["_said_" + lk.hero] = true;
        resolveText(lk.say).forEach(l => blog(l));
      }
    }
  }
  return { dmg: dmg, dodged: false };
}
// 物理反伤（司马懿二形态 counter）
function counterBack(attacker, target, dmg) {
  if (!isEnemy(target) || !target.counter || dmg <= 0 || target.hp <= 0) return;
  const cd = Math.max(1, Math.round(dmg * target.counter));
  attacker.hp = Math.max(0, attacker.hp - cd);
  blog(target.name + " 的反击！" + actorName(attacker) + " 受到 " + cd + " 点反伤" +
    (attacker.hp <= 0 ? "，倒下了！" : "。"));
  checkProtectDown();
}

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
  const adj = adjustOutgoing(attacker, target, dmg);
  if (adj.dodged) {
    blog(actorName(attacker) + " 的" + (label || "攻击") + "！" + actorName(target) +
      " 身形一闪，闪开了！");
    return;
  }
  dmg = adj.dmg;
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
  counterBack(attacker, target, dmg);
  checkProtectDown();
}

// 敌受伤害后的统一检查：50%血台词 / 多形态切换 / 收服判定 / 友军死亡增攻
function afterEnemyDamaged(target) {
  if (!isEnemy(target)) return;
  checkHalf(target);
  checkPhase(target);
  checkRecruitWin(target);
  // BOSS 机制：友军阵亡增攻（曹真"督战"）
  if (target.hp <= 0) {
    for (const e of aliveEnemies()) {
      if (e.allyDeathGrow) {
        e.atk = Math.round(e.atk * (1 + e.allyDeathGrow));
        blog(e.name + " 见部下战死，攻势更烈！（攻击上升）");
      }
    }
  }
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
    // BOSS 机制：形态挂接自损/魔抗/反伤（金旋/孙礼/司马懿）
    if (ph.selfDot) e.selfDot = ph.selfDot;
    if (ph.magicResist !== undefined) e.magicResist = ph.magicResist;
    if (ph.counter !== undefined) e.counter = ph.counter;
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
      // BOSS 机制：计策弱点/敌侧魔抗/铁索连环
      if (isEnemy(act.target)) {
        const wk = act.target.weakMagic && act.target.weakMagic[act.skill];
        if (wk) dmg = Math.round(dmg * wk);
        if (act.target.magicResist) dmg = Math.max(1, Math.round(dmg * (1 - act.target.magicResist)));
        if (B.chainFleet) dmg = Math.max(1, Math.round(dmg * 0.7));
      }
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
      // 铁索连环 · 延烧：火系计策命中时其余敌人受 30% 溅射
      if (B.chainFleet && (act.skill === "huoji" || act.skill === "dongfeng")) {
        for (const e2 of aliveEnemies()) {
          if (e2 === act.target) continue;
          const sd = Math.max(1, Math.round(dmg * 0.3));
          e2.hp = Math.max(0, e2.hp - sd);
          blog("连环延烧！" + e2.name + " 受到 " + sd + " 点溅射伤害" +
            (e2.hp <= 0 ? "，倒下了！" : "。"));
          afterEnemyDamaged(e2);
        }
      }
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
        // BOSS 机制：计策弱点/敌侧魔抗（全体计策不吃连环单体折扣、不重复延烧）
        const wk = e.weakMagic && e.weakMagic[act.skill];
        if (wk) dmg = Math.round(dmg * wk);
        if (e.magicResist) dmg = Math.max(1, Math.round(dmg * (1 - e.magicResist)));
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
  const adj = adjustOutgoing(attacker, target, r.dmg);
  if (adj.dodged) {
    blog(actorName(attacker) + " 的" + sk.name + "！" + actorName(target) + " 闪开了！");
    return;
  }
  target.hp = Math.max(0, target.hp - adj.dmg);
  if (!quiet) blog(actorName(attacker) + " 的" + sk.name + "！");
  blog(actorName(target) + " 受到 " + adj.dmg + " 点伤害" + (r.crit ? "（暴击！）" : "") +
    (target.hp <= 0 ? "，倒下了！" : "。"));
  afterEnemyDamaged(target);
  counterBack(attacker, target, adj.dmg);
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

// ---------------- BOSS 机制：回合开始钩子（07 文档 schema） ----------------
function bossRoundHooks() {
  const r = B.round;
  // 1) 编组回合脚本（克隆于 startBattle；effect: atkMult/defMult/spdMult/healPct/noAct/partySpdMult，dur 持续回合，缺省永久）
  if (B.grpScript) {
    for (const sc of B.grpScript) {
      const due = sc.repeat ? (r % sc.round === 0) : (r === sc.round);
      if (!due || sc._done) continue;
      const boss = B.enemies.find(x => x.boss && x.hp > 0);
      if (sc.ifFlag && S.flags[sc.ifFlag.flag] !== sc.ifFlag.is) continue;
      if (sc.ifHero && !S.party.some(h => h.key === sc.ifHero && h.hp > 0)) continue;
      if (sc.ifHpAbove !== undefined && !(boss && boss.hp / boss.maxHp > sc.ifHpAbove)) continue;
      if (sc.ifHpBelow !== undefined && !(boss && boss.hp / boss.maxHp < sc.ifHpBelow)) continue;
      if (!sc.repeat) sc._done = true;
      if (sc.say) resolveText(sc.say).forEach(l => blog(l));
      const ef = sc.effect || {};
      if (ef.partySpdMult) B.partySpdMult = { v: ef.partySpdMult, until: r + (ef.dur || 99) - 1 };
      for (const t of aliveEnemies()) {
        if (ef.bossOnly && !t.boss) continue;
        if (ef.atkMult) t.atkMult *= ef.atkMult;
        if (ef.defMult) t.defBuff *= ef.defMult;
        if (ef.spdMult) t.spd = Math.max(1, Math.round(t.spd * ef.spdMult));
        if (ef.healPct) t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * ef.healPct));
        if (ef.noAct) t.stun = ef.dur || 1;
        // dur>0 的属性修改登记还原（atkMult/defBuff/spd 三类）
        if (ef.dur && (ef.atkMult || ef.defMult || ef.spdMult)) {
          (B._reverts = B._reverts || []).push({
            t, until: r + ef.dur - 1,
            atkMult: ef.atkMult, defMult: ef.defMult, spdMult: ef.spdMult,
            oldSpd: ef.spdMult ? t._base.spd : 0,
          });
        }
      }
    }
    // 到期的脚本效果还原
    if (B._reverts) {
      B._reverts = B._reverts.filter(rv => {
        if (r <= rv.until || rv.t.hp <= 0) return true;
        if (rv.atkMult) rv.t.atkMult /= rv.atkMult;
        if (rv.defMult) rv.t.defBuff /= rv.defMult;
        if (rv.spdMult) rv.t.spd = rv.oldSpd;
        return false;
      });
    }
  }
  for (const e of aliveEnemies()) {
    // 2) 怒气成长（马超）
    if (e.atkGrow && (e._growN || 0) < 10) {
      e.atk = Math.round(e.atk * (1 + e.atkGrow));
      e._growN = (e._growN || 0) + 1;
      if (e._growN === 1 || e._growN === 5 || e._growN === 10)
        blog(e.name + " 的怒气在积蓄！（攻击上升）");
    }
    // 3) 姿态切换（张郃"巧变"：守 ↔ 攻）
    if (e.stanceCycle) {
      e._stance = !e._stance;
      if (e._stance) { e.defBuff = 1.5; e.atkMult = 0.7; blog(e.name + " 转为守势。（防御上升）"); }
      else { e.defBuff = 0.8; e.atkMult = 1.3; blog(e.name + " 转为攻势。（攻击上升）"); }
    }
    // 4) 召唤（黄巾头目/赵慈）
    if (e.summon) {
      const sm = e.summon;
      const mobs = () => B.enemies.filter(x => x.hp > 0 && !x.boss).length;
      const due = sm.everyRounds ? (r % sm.everyRounds === 0)
        : (sm.hpBelow && !e._summoned && e.hp <= e.maxHp * sm.hpBelow);
      if (due && mobs() < (sm.maxOnField || 2)) {
        if (sm.hpBelow) e._summoned = true;
        for (let i = 0; i < (sm.count || 1) && mobs() < (sm.maxOnField || 2); i++)
          blog(e.name + " 招呼援军——" + spawnOne(sm.enemy).name + " 杀到！");
      }
    }
    // 5) 友军存活光环（于禁"军阵"）
    if (e.allyAura) {
      const st = e.allyAura.stat || "def";
      const hasAlly = B.enemies.some(x => x !== e && x.hp > 0);
      if (hasAlly && !e._auraOn) {
        e._auraOn = true;
        e[st] = Math.round(e._base[st] * e.allyAura.mult);
        blog(e.name + " 军阵严整，守备森严！");
      } else if (!hasAlly && e._auraOn) {
        e._auraOn = false;
        e[st] = e._base[st];
        blog(e.name + " 的军阵被破了！");
      }
    }
    // 6) 历史克制固伤（夏侯渊"定军一箭"：heroLink.fixed）
    if (e.heroLink) {
      for (const lk of e.heroLink) {
        if (!lk.fixed || e._fixedDone) continue;
        if (r >= lk.fixed.round && S.party.some(h => h.key === lk.hero && h.hp > 0)) {
          e._fixedDone = true;
          if (lk.fixed.say) resolveText(lk.fixed.say).forEach(l => blog(l));
          e.hp = Math.max(0, e.hp - lk.fixed.dmg);
          blog(lk.hero + " 的" + (lk.fixed.label || "奇袭") + "！" + e.name +
            " 受到 " + lk.fixed.dmg + " 点伤害" + (e.hp <= 0 ? "，倒下了！" : "。"));
          afterEnemyDamaged(e);
          if (B.over || !aliveEnemies().length) return true;
        }
      }
    }
    // 7) 低血逃跑（秦琪"夺船欲逃"：限时未杀则脱战，无该敌掉落与金钱）
    if (e.flee && !e.fled) {
      if (e._fleeIn === undefined && e.hp > 0 && e.hp <= e.maxHp * e.flee.hpBelow) {
        e._fleeIn = e.flee.rounds;
        blog(e.name + " 且战且退，想要夺路而逃！（" + e.flee.rounds +
          " 回合内将其击杀，否则会被逃掉）");
      }
      if (e._fleeIn !== undefined && e.hp > 0) {
        e._fleeIn--;
        if (e._fleeIn < 0) {
          e.fled = true;
          e.hp = 0;
          blog(e.name + " 夺路而逃，踪影全无！");
          if (!aliveEnemies().length) { onEnemiesCleared(null); return true; }
        }
      }
    }
    // 8) 每回合自损（孙礼"死战"/金旋"众叛亲离"）
    if (e.selfDot && e.hp > 0) {
      const dd = Math.max(1, Math.round(e.maxHp * e.selfDot));
      e.hp = Math.max(0, e.hp - dd);
      blog(e.name + " 气血翻涌，自损 " + dd + " 点HP" + (e.hp <= 0 ? "，倒下了！" : "。"));
      afterEnemyDamaged(e);
      if (B.over) return true;
    }
  }
  if (!aliveEnemies().length) { onEnemiesCleared(null); return true; }
  return false;
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
  // BOSS 机制：回合开始钩子（脚本/召唤/光环/姿态/怒气/逃跑/自损/固伤）
  if (bossRoundHooks()) return;
  // 固定败战：第 2 回合起敌方属性×3（确保必败）
  if (B.scriptedLoss && B.round >= 2 && !B.buffed3x) {
    B.buffed3x = true;
    for (const e of aliveEnemies()) { e.atk *= 3; e.def *= 3; }
    blog("（敌军真正的实力展露无遗——此战不可胜……）");
  }
  // 火攻演出：到回合自动放火烧敌（博望坡/赤壁教学战；bossMult 对 Boss 加乘，如夏侯惇×6）
  if (B.fire && B.round === B.fire.round) {
    if (B.fire.say) resolveText(B.fire.say).forEach(l => blog(l));
    for (const e of aliveEnemies()) {
      const fdmg = Math.round(B.fire.dmg * (e.boss && B.fire.bossMult ? B.fire.bossMult : 1));
      e.hp = Math.max(0, e.hp - fdmg);
      blog(e.name + " 被烈焰吞没，受到 " + fdmg + " 点伤害" +
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
      s + (e.fled ? 0 : e.gold[0] + Math.floor(Math.random() * (e.gold[1] - e.gold[0] + 1))), 0);
  }
  S.gold += gold;
  blog(survived ? "撑住了！敌军攻势已竭。" : "战斗胜利！");
  blog("获得经验 " + exp + " 点" + (gold ? "、" + gold + " 金" : "") + "。");
  // 图鉴击败数
  for (const e of all) {
    if (!S.dex[e.key]) S.dex[e.key] = { seen: 0, killed: 0 };
    if (!e.fled) S.dex[e.key].killed++;
  }
  // 掉落：逐怪掷点（演出战固定结算不掉落；逃跑的敌人不掉落）；装备实例入仓库，消耗品进背包
  if (!B.fixedReward) {
    const loot = {};
    for (const e of all) {
      if (e.fled) continue;
      const tpl = ENEMIES[e.key];
      for (const d of (tpl.drops || [])) {
        if (Math.random() < d.rate) loot[d.item] = (loot[d.item] || 0) + 1;
      }
    }
    // 渡魂记：泗水首战曹军，若木牌在身，必掉残破黄纸符（一次性）
    if (!S.flags.dh_sishui_paper && S.map === "ch01_sishui" && S.inv["焦黑的木牌"] > 0) {
      loot["黄纸符"] = (loot["黄纸符"] || 0) + 1;
      S.flags.dh_sishui_paper = true;
      blog("（怀中木牌微微发烫——从敌军身上搜出一张残破的黄纸符。）");
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
        if (!it || it.type !== "item" || S.inv[id] <= 0 || it.mat || (!it.heal && !it.revive)) continue;
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
  // BOSS 机制：连战换组时刷新脚本/连环（如 颜良→文丑）
  B.grpScript = grp.script ? grp.script.map(o => Object.assign({}, o)) : null;
  B.chainFleet = !!grp.chainFleet;
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
