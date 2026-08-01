// 引擎 · UI：对话框、面板、商店、旅店、菜单、状态页、任务页、编成占位、HUD
"use strict";

// ---------------- 对话框 ----------------
let dlgQueue = [], dlgCb = null;
function say(lines, cb) {
  dlgQueue = lines.slice();
  dlgCb = cb || null;
  S.mode = "dialog";
  nextLine();
}
function nextLine() {
  const line0 = dlgQueue.shift();
  if (line0 === undefined) {
    hide("dialog");
    S.mode = "map";
    const cb = dlgCb; dlgCb = null;
    if (cb) cb();
    return;
  }
  // 说话人头像："名字：……" 开头——优先 assets/chars/face/ 新像素立绘，回退 assets/portraits/ 旧头像
  const m = line0.match(/^(.{1,8})：/);
  const face = $("dialog-face");
  const art = m && typeof CHAR_ART !== "undefined" ? CHAR_ART[m[1]] : null;
  if (art && art.face) {
    face.src = "assets/chars/face/" + art.face + ".png";
    face.style.display = "block";
  } else if (m && typeof PORTRAIT_NAMES !== "undefined" && PORTRAIT_NAMES[m[1]]) {
    face.src = PORTRAIT_NAMES[m[1]];
    face.style.display = "block";
  } else {
    face.style.display = "none";
  }
  $("dialog-text").textContent = line0;
  show("dialog");
}

// ---------------- 章节插画 ----------------
let illustCb = null;
function showIllust(file, caption, cb) {
  S.mode = "illust";
  $("illust-img").src = file;
  $("illust-cap").textContent = caption || "";
  show("illust");
  illustCb = cb || null;
}
function advanceIllust() {
  if (S.mode !== "illust") return;
  hide("illust");
  S.mode = "map";
  const cb = illustCb; illustCb = null;
  if (cb) cb();
}

// ---------------- 面板 ----------------
function openPanel(title, build) {
  $("panel-title").textContent = title;
  const body = $("panel-body");
  body.innerHTML = "";
  body.className = "";
  build(body);
  show("panel");
}
function closePanel() {
  hide("panel");
  S.mode = "map";
}
function btn(text, fn, cls) {
  const b = document.createElement("button");
  b.textContent = text;
  if (cls) b.className = cls;
  b.addEventListener("click", fn);
  return b;
}
function line(text) {
  const d = document.createElement("div");
  d.className = "pline";
  d.textContent = text;
  return d;
}

// ---------------- 通用确认弹窗 ----------------
// confirmBox({title, lines, okText, cancelText, onOk, onCancel})
// 独立 #confirm 层（z-index 高于 #panel），可叠在面板之上；取消只关闭自身，逐层退回
function confirmBox(opt) {
  $("confirm-title").textContent = opt.title || "确认";
  const body = $("confirm-body");
  body.innerHTML = "";
  (opt.lines || []).forEach(t => body.appendChild(line(t)));
  body.appendChild(btn(opt.okText || "确认", () => {
    hide("confirm");
    if (opt.onOk) opt.onOk();
  }));
  body.appendChild(btn(opt.cancelText || "取消", () => {
    hide("confirm");
    if (opt.onCancel) opt.onCancel();
  }, "ghost"));
  show("confirm");
}

// ---------------- 存档档位 ----------------
function fmtSaveTs(ts) {
  if (!ts) return "时间未知";
  const d = new Date(ts * 1000);
  const p = n => (n < 10 ? "0" : "") + n;
  return (d.getMonth() + 1) + "-" + p(d.getDate()) + " " +
    p(d.getHours()) + ":" + p(d.getMinutes());
}
// 档位卡片文案：第X章 · 地图名 · 队长名 LvN · 存档时间
function slotDesc(meta) {
  return meta.chapter + " · " + meta.mapName + " · " +
    meta.leaderName + " Lv" + meta.leaderLv + " · " + fmtSaveTs(meta.ts);
}

async function doSaveSlot(meta, mode, opt) {
  const ok = await saveGame(meta.slot);
  toast(ok ? "✔ 已保存到 档位 " + meta.slot : "✖ 存档失败：浏览器存储不可用");
  if (ok) openSlotPicker(mode, opt);   // 刷新档位信息
}

// 档位选择层。mode: "load" | "save"
// opt.onBack：返回回调（逐层退回，默认 closePanel）；opt.onLoaded：读档成功后的额外回调
function openSlotPicker(mode, opt) {
  opt = opt || {};
  openPanel(mode === "load" ? "读取存档" : "保存存档", body => {
    body.appendChild(line(mode === "load" ? "选择要读取的档位：" : "选择要保存到的档位："));
    for (const meta of listSlots()) {
      if (meta.empty) {
        if (mode === "load") {
          const b = btn("档位 " + meta.slot + "：—— 空档位 ——", () => {});
          b.disabled = true;   // 空档位置灰不可点
          body.appendChild(b);
        } else {
          // 空槽直接写入
          body.appendChild(btn("档位 " + meta.slot + "：—— 空档位 ——",
            () => doSaveSlot(meta, mode, opt)));
        }
        continue;
      }
      body.appendChild(btn("档位 " + meta.slot + "：" + slotDesc(meta), () => {
        if (mode === "load") {
          confirmBox({
            title: "读取存档",
            lines: ["读取此档？将回到：", slotDesc(meta), "当前未保存的进度将丢失。"],
            okText: "确认读取",
            onOk: async () => {
              const r = await loadGame(meta.slot);
              if (r === "ok") {
                hide("panel");
                if (opt.onLoaded) opt.onLoaded();
                toast("读档成功");
              } else if (r === "incompatible") toast("旧版本存档不兼容，请开始新游戏");
              else toast("没有找到存档");
            },
          });
        } else {
          // 已占用槽：覆盖前确认
          confirmBox({
            title: "覆盖存档",
            lines: ["该档位已有记录：", slotDesc(meta), "覆盖后旧档无法恢复。"],
            okText: "确认覆盖",
            onOk: () => doSaveSlot(meta, mode, opt),
          });
        }
      }));
    }
    body.appendChild(btn("返回", () => {
      if (opt.onBack) opt.onBack();
      else closePanel();
    }, "ghost"));
  });
}

// ---------------- 商店 / 旅店 ----------------
function openShop(shopId) {
  S.mode = "shop";
  const shop = SHOPS[shopId];
  if (shop.type === "inn") {
    openPanel("旅店", body => {
      body.appendChild(line(shop.text));
      body.appendChild(line("住宿费：" + shop.cost + " 金（全体完全恢复）"));
      body.appendChild(btn("住店（" + shop.cost + "金）", () => {
        if (S.gold < shop.cost) { toast("钱不够！"); return; }
        S.gold -= shop.cost;
        for (const h of S.party) { h.hp = h.maxHp; h.mp = h.maxMp; }
        toast("睡了个好觉，全恢复了！");
        hud();
        closePanel();
      }));
      body.appendChild(btn("离开", closePanel, "ghost"));
    });
  } else if (shop.type === "equip") {
    const pm = shop.priceMult || 1;   // 战时加价（第七章 priceMult 1.2）
    openPanel(shop.title || "武器店", body => {
      body.appendChild(line(shop.text));
      body.appendChild(line("所持金：" + S.gold + "（购买后放入装备仓库，菜单→装备 穿戴）"));
      for (const id of shop.stock) {
        const it = ITEMS[id];
        // filter：拆分武器店/防具店后按装备类型过滤（如 ["weapon"] / ["armor","helmet","legs","acc"]）
        if (shop.filter && shop.filter.indexOf(it.type) < 0) continue;
        const price = Math.floor(it.price * pm);
        body.appendChild(btn(id + "　" + it.desc + "　" + price + "金", () => {
          if (S.gold < price) { toast("钱不够！"); return; }
          S.gold -= price;
          addEquipInst(id);
          toast("已购入 " + id + "，放入装备仓库");
          hud();
          openShop(shopId);
        }));
      }
      body.appendChild(btn("出售装备/道具", () => openSell(shopId)));
      body.appendChild(btn("离开", closePanel, "ghost"));
    });
  } else {
    const pm = shop.priceMult || 1;
    openPanel(shop.title || "杂货店", body => {
      body.appendChild(line(shop.text));
      body.appendChild(line("所持金：" + S.gold));
      for (const id of shop.stock) {
        const it = ITEMS[id];
        const price = Math.floor(it.price * pm);
        body.appendChild(btn(id + "　" + it.desc + "　" + price + "金（现有 " +
          (S.inv[id] || 0) + "）", () => {
          if (S.gold < price) { toast("钱不够！"); return; }
          S.gold -= price;
          S.inv[id] = (S.inv[id] || 0) + 1;
          toast("买了 1 个" + id);
          hud();
          openShop(shopId);
        }));
      }
      body.appendChild(btn("出售装备/道具", () => openSell(shopId)));
      body.appendChild(btn("离开", closePanel, "ghost"));
    });
  }
}

// 出售页：仓库装备（未穿戴的实例）+ 背包消耗品，售价=买价 50%（向下取整）；nosell 不可售
function openSell(shopId) {
  S.mode = "shop";
  openPanel("出售", body => {
    body.appendChild(line("收购价为售价的五成。所持金：" + S.gold));
    let any = false;
    // 仓库里未穿戴的装备实例（含强化品，按基础价算）
    S.equips.filter(e => !e.on && !ITEMS[e.id].nosell).forEach(inst => {
      const it = ITEMS[inst.id];
      const price = Math.floor(it.price * 0.5);
      any = true;
      body.appendChild(btn(inst.id + (inst.plus ? "+" + inst.plus : "") + "　卖 " + price + " 金", () => {
        S.equips.splice(S.equips.indexOf(inst), 1);
        S.gold += price;
        toast("卖出 " + inst.id + "，得 " + price + " 金");
        hud();
        openSell(shopId);
      }));
    });
    for (const id in S.inv) {
      const it = ITEMS[id];
      if (!it || S.inv[id] <= 0 || it.nosell || it.type !== "item") continue;
      const price = Math.floor(it.price * 0.5);
      any = true;
      body.appendChild(btn(id + " ×" + S.inv[id] + "　卖 " + price + " 金/件", () => {
        S.inv[id]--;
        if (S.inv[id] <= 0) delete S.inv[id];
        S.gold += price;
        toast("卖出 " + id + "，得 " + price + " 金");
        hud();
        openSell(shopId);
      }));
    }
    if (!any) body.appendChild(line("（没有可出售的东西）"));
    body.appendChild(btn("返回", () => openShop(shopId), "ghost"));
  });
}

// ---------------- 装备页（仓库实例穿戴/卸下/换装） ----------------
const SLOTS = ["weapon", "armor", "helmet", "legs", "acc"];
const SLOT_LABEL = { weapon: "武器", armor: "防具", helmet: "头盔", legs: "护腿", acc: "饰品" };

// 槽位显示名：uid → 实例 → "铁剑+2"
function equipName(h, slot) {
  const uid = h.equips[slot];
  if (!uid) return "（无）";
  const inst = findEquipInst(uid);
  if (!inst) return String(uid);   // 兼容旧档：槽里直接是物品 id
  return inst.id + (inst.plus ? "+" + inst.plus : "");
}

function showEquip() {
  openPanel("装备", body => {
    for (const h of S.party) {
      body.appendChild(btn(h.key + "　" +
        SLOTS.map(s => equipName(h, s)).join(" / "), () => showEquipHero(h.key)));
    }
    body.appendChild(line("—— 装备仓库 ——"));
    const spare = S.equips.filter(e => !e.on);
    // 同类合并显示：铁剑+2×3
    const cnt = {};
    spare.forEach(e => {
      const k = e.id + (e.plus ? "+" + e.plus : "");
      cnt[k] = (cnt[k] || 0) + 1;
    });
    const keys = Object.keys(cnt);
    body.appendChild(line(keys.length ?
      keys.map(k => k + (cnt[k] > 1 ? "×" + cnt[k] : "")).join("、") : "（空）"));
    body.appendChild(btn("返回", openMenu, "ghost"));
  });
}

function showEquipHero(key) {
  const h = S.party.find(x => x.key === key);
  openPanel(h.key + " 的装备", body => {
    for (const slot of SLOTS) {
      body.appendChild(btn(SLOT_LABEL[slot] + "：" + equipName(h, slot),
        () => showEquipSlot(h, slot)));
    }
    body.appendChild(btn("返回", showEquip, "ghost"));
  });
}

function showEquipSlot(h, slot) {
  openPanel(SLOT_LABEL[slot] + "（" + h.key + "）", body => {
    const cur = h.equips[slot] ? findEquipInst(h.equips[slot]) : null;
    if (cur) {
      body.appendChild(btn("卸下 " + cur.id + (cur.plus ? "+" + cur.plus : ""), () => {
        cur.on = null;
        h.equips[slot] = null;
        toast("已卸下，放回仓库");
        showEquipHero(h.key);
      }));
    }
    const spare = S.equips.filter(e => !e.on && ITEMS[e.id].type === slot &&
      (slot !== "weapon" || canWield(h.key, e.id)));
    if (!spare.length) body.appendChild(line("仓库里没有可装备的" + SLOT_LABEL[slot] +
      (slot === "weapon" ? "（注意武器系别限定）" : "")));
    // 同类（id+强化）合并为一行，数量标 ×N；点击装备该组第一个
    const groups = {};
    spare.forEach(e => {
      const k = e.id + "|" + (e.plus || 0);
      (groups[k] = groups[k] || []).push(e);
    });
    for (const k in groups) {
      const insts = groups[k];
      const inst = insts[0];
      const it = ITEMS[inst.id];
      body.appendChild(btn(inst.id + (inst.plus ? "+" + inst.plus : "") +
        "（" + it.desc + "）" + (insts.length > 1 ? " ×" + insts.length : ""), () => {
        if (cur) cur.on = null;               // 换下的旧件回仓库
        inst.on = h.key;
        h.equips[slot] = inst.uid;
        toast(h.key + " 装备了 " + inst.id);
        showEquipHero(h.key);
      }));
    }
    body.appendChild(btn("返回", () => showEquipHero(h.key), "ghost"));
  });
}

// ---------------- 编成所（facility: "camp"，仅主城设施可开） ----------------
let campSel = null;   // 当前选中的成员 {from, idx, label}

function openCamp() {
  S.mode = "menu";
  openPanel("编成所", body => {
    body.appendChild(line("出战位（前 2 人为前排，受击率高）" +
      (campSel ? "　已选：" + campSel.label : "")));
    S.party.forEach((h, i) => {
      body.appendChild(btn((i < FRONT_COUNT ? "【前排】" : "【后排】") +
        h.key + " Lv" + h.lv + " HP" + h.hp + "/" + h.maxHp, () => {
        campSel = { from: "party", idx: i, label: h.key };
        openCamp();
      }));
    });
    body.appendChild(line("后备（吃 50% 经验）"));
    if (!S.bench.length) body.appendChild(line("（无后备）"));
    S.bench.forEach((h, i) => {
      body.appendChild(btn("备·" + h.key + " Lv" + h.lv, () => {
        if (campSel && campSel.from === "party") {
          // 出战位 ↔ 后备 互换
          const old = S.party[campSel.idx];
          S.party[campSel.idx] = h;
          S.bench[i] = old;
          campSel = null;
          toast("已调换");
          openCamp();
        } else {
          campSel = { from: "bench", idx: i, label: h.key };
          openCamp();
        }
      }));
    });
    if (campSel && campSel.from === "bench" && S.party.length < 5) {
      body.appendChild(btn("让 " + campSel.label + " 上阵", () => {
        S.party.push(S.bench.splice(campSel.idx, 1)[0]);
        campSel = null;
        openCamp();
      }));
    }
    if (campSel && campSel.from === "party" && S.party.length > 1) {
      body.appendChild(btn("让 " + campSel.label + " 入后备", () => {
        S.bench.push(S.party.splice(campSel.idx, 1)[0]);
        campSel = null;
        openCamp();
      }));
    }
    body.appendChild(btn("阵形：" + (S.formation ? FORMATIONS[S.formation].name : "无"), campFormation));
    body.appendChild(btn("军师：" + (S.strategist || "无"), campStrategist));
    body.appendChild(btn("关闭", () => { campSel = null; closePanel(); }, "ghost"));
  });
}

function campFormation() {
  openPanel("选择阵形（战前设定，战斗中不可变更）", body => {
    body.appendChild(btn("无阵形", () => { S.formation = null; openCamp(); }));
    for (const k in FORMATIONS) {
      body.appendChild(btn(FORMATIONS[k].name + "（" + FORMATIONS[k].desc + "）", () => {
        S.formation = k;
        toast("已布下 " + FORMATIONS[k].name);
        openCamp();
      }));
    }
    body.appendChild(btn("返回", openCamp, "ghost"));
  });
}

function passiveDesc(p) {
  return p.type === "magicDmg" ? "计策伤害+" + Math.round(p.value * 100) + "%"
    : p.type === "mpRegen" ? "每回合 MP+" + p.value
    : "全属性+" + Math.round(p.value * 100) + "%";
}

function campStrategist() {
  openPanel("选择军师（不出战，提供全队被动）", body => {
    body.appendChild(btn("无", () => { S.strategist = null; openCamp(); }));
    for (const h of S.party.concat(S.bench)) {
      const p = HERO_TPL[h.key].strategistPassive;
      if (!p) continue;
      body.appendChild(btn(h.key + "（" + passiveDesc(p) + "）", () => {
        S.strategist = h.key;
        toast(h.key + " 就任军师");
        openCamp();
      }));
    }
    body.appendChild(btn("返回", openCamp, "ghost"));
  });
}

// ---------------- 铁匠铺（facility: "smith"，第十章开放；此处先有框架） ----------------
function openSmith() {
  S.mode = "menu";
  openPanel("铁匠铺", body => {
    body.appendChild(line("消耗精铁×1 + 费用，武器强化 +1（上限 +" + ENHANCE_MAX +
      "，必定成功）。持有精铁：" + (S.inv["精铁"] || 0)));
    const list = S.equips.filter(e => ITEMS[e.id].type === "weapon" && (e.plus || 0) < ENHANCE_MAX);
    if (!list.length) body.appendChild(line("（没有可强化的武器）"));
    for (const inst of list) {
      const it = ITEMS[inst.id];
      const fee = enhanceFee(it.price, inst.plus || 0);
      body.appendChild(btn(inst.id + (inst.plus ? "+" + inst.plus : "") +
        (inst.on ? "（" + inst.on + "装备中）" : "") +
        " → 攻" + enhancedAtk(it.atk, (inst.plus || 0) + 1) + "　费用" + fee + "金", () => {
        if ((S.inv["精铁"] || 0) < 1) { toast("精铁不足！"); return; }
        if (S.gold < fee) { toast("钱不够！"); return; }
        S.inv["精铁"]--;
        S.gold -= fee;
        inst.plus = (inst.plus || 0) + 1;
        toast(inst.id + " 强化到 +" + inst.plus + "！");
        hud();
        openSmith();
      }));
    }
    body.appendChild(btn("离开", closePanel, "ghost"));
  });
}

// ---------------- 酒馆 · 樗蒲（facility: "tavern"） ----------------
// 五木各黑白两面，按黑面数判定。本钱不足 500 不招待；赌注 30/50/100。
// 首次全黑：赠成长性武器【时运】（替代奖金）；首次全白：额外扣 500 金但获得藏宝线索。
// 常规：4黑/3黑 赢单倍；2黑/1黑 输单倍；之后全黑赢 3 倍、全白输 3 倍。
function openGamble() {
  S.mode = "menu";
  openPanel("酒馆 · 樗蒲", body => {
    body.appendChild(line("店家：五木一掷，黑多者胜！押 30 / 50 / 100 金，客官请。"));
    body.appendChild(line("所持金：" + S.gold + "（本钱不足 500 金，恕不招待）"));
    for (const bet of [30, 50, 100]) {
      body.appendChild(btn("押 " + bet + " 金", () => {
        if (S.gold < 500) { toast("本钱不足 500，恕不招待！"); return; }
        rollChupu(bet);
      }));
    }
    body.appendChild(btn("离开", closePanel, "ghost"));
  });
}

function rollChupu(bet) {
  const woods = [0, 1, 2, 3, 4].map(() => Math.random() < 0.5);
  const black = woods.filter(Boolean).length;
  const face = woods.map(b => b ? "黑" : "白").join(" ");
  let msg;
  if (black === 5) {
    if (!S.flags.chupu_first_black) {
      S.flags.chupu_first_black = true;
      addEquipInst("时运");
      msg = "五木全黑！天降鸿运——店家捧出宝刃【时运】相赠！（已入装备仓库）";
    } else {
      S.gold += bet * 3;
      msg = "五木全黑！大杀三方，赢 " + (bet * 3) + " 金！";
    }
  } else if (black === 0) {
    if (!S.flags.chupu_first_white) {
      S.flags.chupu_first_white = true;
      S.flags.tavern_clue = true;
      S.gold -= (bet + 500);
      msg = "五木全白！晦气透顶，额外赔上 500 金……店家看你可怜，附耳一句：" +
        "城西山洞深处藏着前朝遗宝。（藏宝洞已现于徐州野外）";
    } else {
      S.gold -= bet * 3;
      msg = "五木全白！血本无归，输 " + (bet * 3) + " 金……";
    }
  } else if (black >= 3) {
    S.gold += bet;
    msg = black + " 黑！小胜一手，赢 " + bet + " 金。";
  } else {
    S.gold -= bet;
    msg = black + " 黑……输了 " + bet + " 金。";
  }
  hud();
  openPanel("樗蒲 · 开！", body => {
    body.appendChild(line("五木：" + face + "（" + black + " 黑）"));
    body.appendChild(line(msg));
    body.appendChild(line("所持金：" + S.gold));
    body.appendChild(btn("再来一局", openGamble));
    body.appendChild(btn("离开", closePanel, "ghost"));
  });
}

// ---------------- 训练所（facility: "dojo"） ----------------
// 花钱买经验：出战全员各得 expToNext(队均Lv)×25%（后备减半），收费 = 经验 × 6 金
// （刷怪约 2 金/经验，训练所 3 倍价——买的是省事与安全）
function dojoOffer() {
  const avgLv = Math.max(1, Math.round(S.party.reduce((s, h) => s + h.lv, 0) / S.party.length));
  const exp = Math.round(expToNext(avgLv) * 0.25);
  // 单价随等级上浮（约 6→9 金/经验），保住后期刷怪价值
  return { exp: exp, fee: Math.round(exp * (6 + avgLv * 0.06)) };
}
function openDojo() {
  S.mode = "menu";
  const o = dojoOffer();
  openPanel("训练所", body => {
    if (!isFinite(o.exp)) {
      body.appendChild(line("教头：诸位已臻化境，老夫没什么可教的了。"));
      body.appendChild(btn("离开", closePanel, "ghost"));
      return;
    }
    body.appendChild(line("教头：流血流汗不流泪！特训一次，出战全员各得 " + o.exp +
      " 经验（后备减半），收费 " + o.fee + " 金。"));
    body.appendChild(line("所持金：" + S.gold));
    body.appendChild(btn("特训一次（" + o.fee + " 金）", () => {
      if (S.gold < o.fee) { toast("钱不够！"); return; }
      S.gold -= o.fee;
      for (const h of S.party) {
        const r = gainExp(h, o.exp);
        if (r.levels > 0) toast(h.key + " 升到了 Lv " + h.lv + "！");
        if (r.learned.length) toast(h.key + " 习得 " + r.learned.join("、"));
      }
      for (const h of S.bench) gainExp(h, Math.round(o.exp / 2));
      toast("特训完成，全员经验 +" + o.exp);
      hud();
      openDojo();
    }));
    body.appendChild(btn("离开", closePanel, "ghost"));
  });
}

// ---------------- 对话选项（flavor：只改一句台词，不影响结果） ----------------
// schema：{ask: {title?, say?, options: [{label, say?, do?}]}}，选完继续后续动作
function askChoice(ask, done) {
  S.mode = "menu";
  openPanel(ask.title || "如何应答？", body => {
    if (ask.say) body.appendChild(line(resolveText(ask.say).join("　")));
    for (const op of ask.options) {
      if (op.if && !evalCond(op.if)) continue;   // 选项条件显隐（假降/共情等）
      body.appendChild(btn(op.label, () => {
        hide("panel");
        S.mode = "map";
        const acts = [];
        if (op.say) acts.push({ say: op.say });
        if (op.do) for (const d of op.do) acts.push(d);
        runActions(acts, done);
      }));
    }
  });
}

// ---------------- 图鉴 ----------------
function showDex() {
  openPanel("图鉴", body => {
    let total = 0, opened = 0;
    for (const mk in MAPS) {
      for (const c of (MAPS[mk].chests || [])) {
        total++;
        if (S.flags["chest_" + mk + "_" + c.id]) opened++;
      }
    }
    body.appendChild(line("宝箱收集：" + opened + " / " + total));
    body.appendChild(line("—— 敌人图鉴 ——"));
    for (const k in ENEMIES) {
      const d = S.dex[k];
      if (!d || !d.seen) { body.appendChild(line("？？？")); continue; }
      body.appendChild(line(k + "（击败 " + d.killed + "）"));
      if (d.killed > 0) {
        const e = ENEMIES[k];
        body.appendChild(line("　HP" + e.hp + " 攻" + e.atk + " 防" + e.def +
          " 智" + e.int + " 速" + e.spd));
      }
    }
    body.appendChild(btn("返回", openMenu, "ghost"));
  });
}

// ---------------- 菜单 ----------------
function openMenu() {
  S.mode = "menu";
  openPanel("菜单", body => {
    body.className = "menu-grid";   // 双列网格（样式见 index.html）
    body.appendChild(btn("状态", showStatus));
    body.appendChild(btn("装备", showEquip));
    body.appendChild(btn("道具", showItems));
    body.appendChild(btn("谋略", showSkills));
    body.appendChild(btn("任务", showQuest));
    body.appendChild(btn("编成", () => {
      if (!S.flags.sys_camp) { toast("编成所尚未开放（第五章起）"); return; }
      openCamp();
    }));
    body.appendChild(btn("图鉴", () => {
      if (!S.flags.sys_dex) { toast("图鉴尚未开放（第七章起）"); return; }
      showDex();
    }));
    body.appendChild(btn("存档", () => openSlotPicker("save", { onBack: openMenu })));
    body.appendChild(btn("读档", () => openSlotPicker("load", { onBack: openMenu })));
    body.appendChild(btn("关闭", closePanel, "ghost"));
  });
}

// 谋略详情页：出战全员（含自动队友）的习得列表，含 MP 消耗与效果说明
function showSkills() {
  openPanel("谋略", body => {
    for (const h of S.party) {
      body.appendChild(line(h.key + "（MP " + h.mp + "/" + h.maxMp + "）" +
        (h.auto ? "（自动）" : "")));
      if (!h.skills.length) body.appendChild(line("　（尚未习得）"));
      for (const sid of h.skills) {
        const sk = SKILLS[sid];
        if (!sk) continue;
        body.appendChild(line("　" + sk.name + "　MP " + sk.cost + "　" + sk.desc));
      }
    }
    body.appendChild(line("（通用计策：火计 Lv6 / 落石 Lv10 / 水计 Lv14 全员自动习得）"));
    body.appendChild(btn("返回", openMenu, "ghost"));
  });
}

function showStatus() {
  openPanel("状态", body => {
    for (const h of S.party) {
      const next = expToNext(h.lv);
      body.appendChild(line(h.key + "　等级 " + h.lv + (h.auto ? "（自动）" : "") +
        "　经验 " + (next === Infinity ? "MAX" :
          (h.exp - expForLevel(h.lv)) + "/" + next)));
      body.appendChild(line("　兵 " + h.hp + "/" + h.maxHp + "　谋 " + h.mp + "/" + h.maxMp));
      body.appendChild(line("　攻" + atkTotal(h) + "　防" + defTotal(h) + "　智" + intTotal(h) +
        "　速" + spdTotal(h) + "　运" + luckTotal(h)));
      body.appendChild(line("　装备：" +
        SLOTS.map(s => equipName(h, s)).join(" / ")));
      body.appendChild(line("　谋略：" + h.skills.map(sid => SKILLS[sid].name).join("、")));
    }
    body.appendChild(btn("返回", openMenu, "ghost"));
  });
}

function showItems() {
  openPanel("道具", body => {
    let any = false;
    for (const id in S.inv) {
      const it = ITEMS[id];
      if (!it || S.inv[id] <= 0 || it.mat || it.dmgAll) continue;
      // 计策书：指定角色习得对应谋略（已习得则提示）
      if (it.type === "book") {
        any = true;
        body.appendChild(line(id + " × " + S.inv[id] + "（" + it.desc + "）"));
        for (const h of S.party.concat(S.bench)) {
          const known = h.skills.indexOf(it.skill) >= 0;
          body.appendChild(btn("给" + h.key + "学习（" + (known ? "已习得" : SKILLS[it.skill].name) + "）", () => {
            if (known) { toast(h.key + " 已经会了，不可重复学习"); return; }
            h.skills.push(it.skill);
            S.inv[id]--;
            toast(h.key + " 习得 " + SKILLS[it.skill].name + "！");
            showItems();
          }));
        }
        continue;
      }
      if (it.type !== "item") continue;
      any = true;
      // 剧情物品：只展示，不可使用（没有 heal/mp/revive/dmgAll 字段，用了会算出 NaN）
      if (!it.heal && !it.mp && !it.revive && !it.dmgAll) {
        body.appendChild(line(id + " × " + S.inv[id] + "（剧情物品：" + it.desc + "）"));
        continue;
      }
      body.appendChild(line(id + " × " + S.inv[id] + "（" + it.desc + "）"));
      if (it.revive) {
        // 复活类：只能给阵亡队友用
        const dead = S.party.filter(h => h.hp <= 0);
        if (!dead.length) body.appendChild(line("　（没有阵亡的队友）"));
        for (const h of dead) {
          body.appendChild(btn("复活 " + h.key, () => {
            S.inv[id]--;
            h.hp = Math.round(h.maxHp * it.revive);
            toast(h.key + " 复活了！");
            showItems();
          }));
        }
        continue;
      }
      if (it.mp) {
        for (const h of S.party) {
          if (h.hp <= 0) continue;
          body.appendChild(btn("给" + h.key + "用（MP " + h.mp + "/" + h.maxMp + "）", () => {
            S.inv[id]--;
            h.mp = Math.min(h.maxMp, h.mp + it.mp);
            toast(h.key + " 回复了 " + it.mp + " 点MP");
            showItems();
          }));
        }
        continue;
      }
      for (const h of S.party) {
        if (h.hp <= 0) continue;
        body.appendChild(btn("给" + h.key + "用（HP " + h.hp + "/" + h.maxHp + "）", () => {
          S.inv[id]--;
          h.hp = Math.min(h.maxHp, h.hp + it.heal);
          toast(h.key + " 回复了 " + it.heal + " 点HP");
          showItems();
        }));
      }
    }
    if (!any) body.appendChild(line("（背包空空如也）"));
    body.appendChild(btn("返回", openMenu, "ghost"));
  });
}

function showQuest() {
  openPanel("任务", body => {
    const ch = CHAPTERS[S.chapter];
    body.appendChild(line("【" + ch.name + "】"));
    body.appendChild(line(ch.questText[S.flags[ch.questFlag]] || "……"));
    body.appendChild(btn("关闭", openMenu, "ghost"));
  });
}

// ---------------- HUD ----------------
function hud() {
  $("hud-map").textContent = mapDef().name;
  $("hud-gold").textContent = S.gold + " 金";
  const ch = CHAPTERS[S.chapter];
  $("hud-quest").textContent = ch.questText[S.flags[ch.questFlag]] || "";
}
