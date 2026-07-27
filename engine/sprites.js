// 引擎 · 像素立绘：16×20 点阵小人渲染器（零素材，纯代码绘制，离屏缓存）
// 结构：基础人形 BASE + 头饰 HEADS + 胡须 BEARDS + 手持武器 WEAPONS 分层叠加。
// 外观描述 look = { color, hair, head, beard, weapon }：
//   color  服装主色（沿用角色/敌人已有的 color 字段）
//   hair   发色（同时决定须色），默认黑
//   head   none | bandana头巾 | helmet头盔 | crown金冠 | lunjin纶巾 | hat斗笠
//   beard  none | small短须 | long长髯 | bushy虬髯
//   weapon none | sword剑 | blade大刀 | spear矛 | pike枪 | bow弓 | fan扇 | staff杖
// 供 map.js（行走图，1.5 倍）与 battle.js（战斗立绘，3~4 倍，敌方镜像）调用。
"use strict";

const SPR_W = 16, SPR_H = 20;

// ---------------- 点阵定义（'.' = 透明/不覆盖） ----------------
// 调色板字符：H发 S肤 E眼 C衣 D衣影 L革/木 K鞋 M金属 G金 F扇面 R红缨 B须
const SPR_BASE = [
  "................",
  ".....HHHHHH.....",
  "....HHHHHHHH....",
  "....HHHHHHHH....",
  "....HSSSSSSH....",
  "....SESSSSES....",
  "....SSSSSSSS....",
  ".....SSSSSS.....",
  "...CCCCCCCCCC...",
  "..CCCCCCCCCCCC..",
  "..CCDCCCCCCDCC..",
  "..CCCLLLLLLCCC..",
  "..CCCCCCCCCCCC..",
  "...CCCCCCCCCC...",
  "...CCCC..CCCC...",
  "...CCCC..CCCC...",
  "...CCC....CCC...",
  "...CCC....CCC...",
  "...KKK....KKK...",
  "................",
];

// 背面：后脑勺被头发盖住（仅当头饰遮不住脸时套用）
const SPR_BACK = {
  4: "....HHHHHHHH....",
  5: "....HHHHHHHH....",
  6: "....HHHHHHHH....",
  7: ".....HHHHHH.....",
};

const SPR_HEADS = {
  bandana: {
    1: ".....CCCCCC.....",
    2: "....CCCCCCCC....",
    3: "....CCCCCCCC....",
  },
  helmet: {
    0: "......MMMM......",
    1: "....MMMMMMMM....",
    2: "...MMMMMMMMMM...",
    3: "...MMMMMMMMMM...",
    4: "...MMSSSSSSMM...",
    5: "...MSESSSSESM...",
  },
  crown: {
    0: "......GGGG......",
    1: ".....GGGGGG.....",
    2: "....GGGGGGGG....",
  },
  lunjin: {
    0: ".....CCCCCC.....",
    1: "....CCCCCCCC....",
    2: "....CCCCCCCC....",
    3: "....CCCCCCCC....",
  },
  hat: {
    0: ".....LLLLLL.....",
    1: "...LLLLLLLLLL...",
    2: "..LLLLLLLLLLLL..",
  },
};

const SPR_BEARDS = {
  small: {
    6: "....SSBBBBSS....",
    7: ".....SBBBBS.....",
  },
  long: {
    6: "....SSBBBBSS....",
    7: ".....BBBBBB.....",
    8: ".....BBBBBB.....",
    9: "......BBBB......",
    10: "......BBBB......",
  },
  bushy: {
    6: "....SBBBBBBS....",
    7: "....BBBBBBBB....",
    8: ".....BBBBBB.....",
  },
};

const SPR_WEAPONS = {
  sword: {
    2: ".............M..", 3: ".............M..", 4: ".............M..",
    5: ".............M..", 6: ".............M..", 7: ".............M..",
    8: ".............M..",
    9: "............LLL.",
    10: ".............L..",
  },
  spear: {
    1: ".............M..", 2: ".............M..",
    3: ".............L..", 4: ".............L..", 5: ".............L..",
    6: ".............L..", 7: ".............L..", 8: ".............L..",
    9: ".............L..", 10: ".............L..", 11: ".............L..",
    12: ".............L..", 13: ".............L..", 14: ".............L..",
    15: ".............L..", 16: ".............L..", 17: ".............L..",
  },
  pike: {
    1: ".............M..", 2: "............RM..",
    3: ".............L..", 4: ".............L..", 5: ".............L..",
    6: ".............L..", 7: ".............L..", 8: ".............L..",
    9: ".............L..", 10: ".............L..", 11: ".............L..",
    12: ".............L..", 13: ".............L..", 14: ".............L..",
    15: ".............L..", 16: ".............L..", 17: ".............L..",
  },
  blade: {
    0: "............MM..",
    1: "...........MMM..", 2: "...........MMM..",
    3: "............MM..",
    4: ".............L..", 5: ".............L..", 6: ".............L..",
    7: ".............L..", 8: ".............L..", 9: ".............L..",
    10: ".............L..", 11: ".............L..", 12: ".............L..",
    13: ".............L..", 14: ".............L..", 15: ".............L..",
    16: ".............L..", 17: ".............L..",
  },
  bow: {
    3: "............LL..",
    4: "...........L..M.",
    5: "..........L...M.", 6: "..........L...M.", 7: "..........L...M.",
    8: "...........L..M.",
    9: "............LL..",
  },
  fan: {
    8: "...........FFFF.",
    9: "............FFF.",
    10: ".............FF.",
    11: ".............L..",
  },
  staff: {
    1: ".............G..",
    2: "............GGG.",
    3: ".............G..",
    4: ".............L..", 5: ".............L..", 6: ".............L..",
    7: ".............L..", 8: ".............L..", 9: ".............L..",
    10: ".............L..", 11: ".............L..", 12: ".............L..",
    13: ".............L..", 14: ".............L..", 15: ".............L..",
    16: ".............L..",
  },
};

// ---------------- 外观合成（纯函数，无 DOM，可单测） ----------------
function shadeColor(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round((n >> 16 & 255) * f), g = Math.round((n >> 8 & 255) * f),
    b = Math.round((n & 255) * f);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

function lookDefaults(look) {
  return Object.assign(
    { color: "#8a8a8a", hair: "#26201c", head: "none", beard: "none", weapon: "none" },
    look || {});
}

function spritePalette(look) {
  const c = look.color;
  return {
    H: look.hair, S: "#e8c49a", E: "#26232a", C: c, D: shadeColor(c, 0.62),
    L: "#6a4a2a", K: "#38302a", M: "#c9ced8", G: "#e8c84a", F: "#f2f0e4",
    R: "#c0392b", B: look.hair,
  };
}

// 合成点阵：返回 SPR_H 行字符串数组。back=true 为背面（朝北）。
function composeGrid(lookIn, back) {
  const look = lookDefaults(lookIn);
  const grid = SPR_BASE.slice();
  const overlay = rows => {
    for (const r in rows) {
      const row = rows[r], g = grid[r].split("");
      for (let i = 0; i < SPR_W && i < row.length; i++)
        if (row[i] !== ".") g[i] = row[i];
      grid[r] = g.join("");
    }
  };
  if (SPR_HEADS[look.head]) overlay(SPR_HEADS[look.head]);
  if (back) {
    // 头盔/纶巾背面仍是帽子本身（把眼睛抹掉即可），其余露后脑勺
    if (look.head === "helmet" || look.head === "lunjin" || look.head === "bandana") {
      grid[5] = grid[5].replace(/E/g, "S");
    } else {
      overlay(SPR_BACK);
    }
  } else if (SPR_BEARDS[look.beard]) {
    overlay(SPR_BEARDS[look.beard]);
  }
  if (SPR_WEAPONS[look.weapon]) overlay(SPR_WEAPONS[look.weapon]);
  return grid;
}

// ---------------- 外观来源 ----------------
function heroLook(key) {
  const tpl = HERO_TPL[key] || {};
  return lookDefaults(Object.assign({ color: tpl.color }, tpl.look));
}

function npcLook(n) {
  return lookDefaults(Object.assign({ color: n.color }, n.look));
}

// 敌人：显式 look 优先；张飞(误会)/黄忠(敌) 等复用我方角色造型；否则按 ai 兵种推导
function enemyLook(e) {
  const baseName = e.name.replace(/[（(].*$/, "");
  if (HERO_TPL[baseName]) return heroLook(baseName);
  if (e.look) return lookDefaults(Object.assign({ color: e.color }, e.look));
  const byAi = {
    archer: { head: "bandana", weapon: "bow" },
    strategist: { head: "hat", weapon: "fan" },
    caster: { head: "lunjin", weapon: "fan" },
    heavy: { head: "helmet", weapon: "blade", beard: "bushy" },
    brute: { head: "helmet", weapon: "sword" },
  };
  const lk = lookDefaults(Object.assign({ color: e.color }, byAi[e.ai] || byAi.brute));
  if (e.boss && lk.beard === "none") lk.beard = "small";
  return lk;
}

// 出战第一人 = 地图上的玩家形象
function partyLeaderLook() {
  return S.party.length ? heroLook(S.party[0].key) : lookDefaults({ color: "#e8c84a" });
}

// ---------------- 角色贴图（assets/chars/；未命中/未加载回退程序点阵） ----------------
const CHAR_IMGS = {};
function charImg(path) {
  let rec = CHAR_IMGS[path];
  if (!rec) {
    rec = { img: new Image(), ok: false };
    rec.img.onload = () => { rec.ok = true; };
    rec.img.onerror = () => { rec.dead = true; };
    rec.img.src = "assets/chars/" + path;
    CHAR_IMGS[path] = rec;
  }
  return rec.ok ? rec.img : null;
}
// 名字 → {kind: "map"|"boss", img}；Boss 多形态按 phaseIdx 取（见 data/charart.js）
function charArtImg(name, phaseIdx) {
  if (typeof CHAR_ART === "undefined") return null;
  const a = CHAR_ART[name];
  if (!a) return null;
  if (a.boss) {
    const key = Array.isArray(a.boss)
      ? a.boss[Math.max(0, Math.min((phaseIdx || 0) + 1, a.boss.length - 1))]
      : a.boss;
    const img = charImg("boss/" + key + ".png");
    return img ? { kind: "boss", img } : null;
  }
  if (a.map) {
    const img = charImg("map/" + a.map + ".png");
    return img ? { kind: "map", img } : null;
  }
  return null;
}

// ---------------- 渲染（浏览器专用，离屏缓存） ----------------
const spriteCache = new Map();

function spriteCanvas(lookIn, back) {
  const look = lookDefaults(lookIn);
  const key = JSON.stringify(look) + (back ? "|b" : "");
  let cvs = spriteCache.get(key);
  if (cvs) return cvs;
  const grid = composeGrid(look, back);
  const pal = spritePalette(look);
  cvs = document.createElement("canvas");
  cvs.width = SPR_W; cvs.height = SPR_H;
  const g = cvs.getContext("2d");
  for (let y = 0; y < SPR_H; y++) {
    for (let x = 0; x < SPR_W; x++) {
      const col = pal[grid[y][x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  spriteCache.set(key, cvs);
  return cvs;
}

// 地图行走图：1.5 倍（24×30），脚底对齐格子底边
function drawMapSprite(x, y, look, facing) {
  const back = !!(facing && facing.y < 0);
  const cvs = spriteCanvas(look, back);
  const w = 24, h = 30;
  ctx.drawImage(cvs, Math.round(x + (TILE - w) / 2), y + TILE - h, w, h);
}

// 战斗立绘：scale 倍放大，flip=true 时左右镜像（敌方朝左）
function drawBattleSprite(x, y, scale, look, flip) {
  const cvs = spriteCanvas(look, false);
  const w = SPR_W * scale, h = SPR_H * scale;
  if (flip) {
    ctx.save();
    ctx.translate(Math.round(x) + w, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(cvs, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(cvs, Math.round(x), Math.round(y), w, h);
  }
}

// Node 单测/预览用（tools/sprite_preview.js）
if (typeof module !== "undefined") {
  module.exports = { composeGrid, spritePalette, lookDefaults, shadeColor,
    SPR_BASE, SPR_HEADS, SPR_BEARDS, SPR_WEAPONS };
}
