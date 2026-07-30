// 数据 · 角色模板（成长率按 02 文档角色表）
// base 为 Lv1 面板。序章三人的 HP/攻/防/速沿用旧序章手感，
// 新增智/运两项并按 02 文档定位回填（刘备运偏高、诸葛亮智最高），
// 旧序章无等级成长，改为成长率驱动后数值会随等级略有上浮，属预期差异。
// auto: true 表示 NPC 队友（自动行动，不占玩家指令，见 engine/battle.js）。
// arms：武器系别限定（剑系通用不写；张飞矛、黄忠弓、赵云/马超/姜维枪、魏延刀、军师扇）。
// look：像素立绘外观（head 头饰 / beard 胡须 / weapon 手持 / hair 发色，见 engine/sprites.js）。
"use strict";

const HERO_TPL = {
  "刘备": {
    color: "#e8c84a",
    look: { head: "crown", beard: "small", weapon: "sword" },
    base: { hp: 55, mp: 24, atk: 9, int: 9, def: 8, spd: 7, luck: 10 },
    growth: { hp: "A", mp: "B", atk: "B", int: "B", def: "B", spd: "B", luck: "A" },
    learn: { 1: ["rende"], 8: ["jili"], 16: ["dade"] },
  },
  "关羽": {
    color: "#3f9e4d", arms: ["blade"],
    look: { head: "bandana", beard: "long", weapon: "blade" },
    base: { hp: 70, mp: 12, atk: 14, int: 6, def: 9, spd: 8, luck: 8 },
    growth: { hp: "A", mp: "C", atk: "S", int: "C", def: "A", spd: "B", luck: "B" },
    learn: { 1: ["qinglong"], 10: ["yanyue"] },
  },
  "张飞": {
    color: "#5c6478", arms: ["spear"],
    look: { beard: "bushy", weapon: "spear" },
    base: { hp: 75, mp: 8, atk: 16, int: 4, def: 6, spd: 9, luck: 5 },
    growth: { hp: "S", mp: "D", atk: "S", int: "D", def: "C", spd: "A", luck: "C" },
    learn: { 1: ["shemao"], 12: ["dahe"] },
  },
  // 陈登：第二章自动队友，首位智力型（铺垫军师概念）
  "陈登": {
    color: "#4aa8a0", auto: true,
    look: { head: "hat", weapon: "fan" },
    base: { hp: 48, mp: 30, atk: 6, int: 15, def: 7, spd: 7, luck: 8 },
    growth: { hp: "B", mp: "A", atk: "C", int: "A", def: "B", spd: "B", luck: "B" },
    learn: { 1: ["qingzhang"] },
  },
  // 周仓：第四章加入，前排肉盾
  "周仓": {
    color: "#6a5a3a", arms: ["blade"],
    look: { head: "bandana", beard: "small", weapon: "blade" },
    base: { hp: 68, mp: 10, atk: 13, int: 4, def: 10, spd: 6, luck: 5 },
    growth: { hp: "B", mp: "D", atk: "B", int: "D", def: "B", spd: "C", luck: "C" },
    learn: {},
  },
  // 赵云：第五章加入，常胜将军（高速高爆发）
  "赵云": {
    color: "#7ab8e8", arms: ["pike"],
    look: { head: "helmet", weapon: "pike" },
    base: { hp: 65, mp: 14, atk: 15, int: 6, def: 9, spd: 12, luck: 10 },
    growth: { hp: "A", mp: "C", atk: "A", int: "C", def: "B", spd: "S", luck: "A" },
    learn: { 1: ["longdan"] },
  },
  // 孙乾：第五章入后备，谋士型（治疗辅助）
  "孙乾": {
    color: "#9a8ab8", auto: true, arms: ["fan"],
    look: { head: "hat", weapon: "fan" },
    base: { hp: 46, mp: 32, atk: 5, int: 14, def: 7, spd: 8, luck: 8 },
    growth: { hp: "C", mp: "A", atk: "D", int: "A", def: "C", spd: "B", luck: "B" },
    learn: { 1: ["qingzhang"] },
  },
  // 诸葛亮：第六章加入（智 S，全书最高；自动就任军师）
  "诸葛亮": {
    color: "#e8e8f0", arms: ["fan"],
    look: { head: "lunjin", weapon: "fan" },
    base: { hp: 40, mp: 40, atk: 5, int: 18, def: 6, spd: 8, luck: 10 },
    growth: { hp: "C", mp: "S", atk: "D", int: "S", def: "C", spd: "B", luck: "A" },
    learn: { 6: ["huoji"], 26: ["shuiji"], 30: ["luoshi"], 34: ["baguazhen"],
             40: ["dongfeng"], 50: ["xingluo"] },
    strategistPassive: { type: "magicDmg", value: 0.15 },  // 计策伤害+15%
  },
  // 百姓：第七章携民渡江的护送对象（auto，极脆弱，阵亡即失败重来）
  "百姓": {
    color: "#b8b09a", auto: true,
    look: {},
    base: { hp: 40, mp: 0, atk: 2, int: 2, def: 3, spd: 4, luck: 2 },
    growth: { hp: "D", mp: "D", atk: "D", int: "D", def: "D", spd: "D", luck: "D" },
    learn: {},
  },
  // 黄忠：第九章收服，神射（弓系限定；必中词条暂以高运体现）
  "黄忠": {
    color: "#c8a03a", arms: ["bow"],
    look: { head: "helmet", beard: "small", weapon: "bow", hair: "#cfcfcf" },
    base: { hp: 62, mp: 12, atk: 16, int: 5, def: 9, spd: 11, luck: 12 },
    growth: { hp: "B", mp: "C", atk: "A", int: "C", def: "B", spd: "A", luck: "S" },
    learn: { 1: ["lianzhu"], 20: ["baibu"] },
  },
  // 魏延：第九章加入，狂战型（高攻低防）
  "魏延": {
    color: "#8a5a3a", arms: ["blade"],
    look: { head: "bandana", weapon: "blade" },
    base: { hp: 70, mp: 8, atk: 16, int: 5, def: 6, spd: 11, luck: 5 },
    growth: { hp: "A", mp: "D", atk: "A", int: "C", def: "D", spd: "A", luck: "C" },
    learn: { 1: ["kuangzhan"] },
  },
  // 庞统：第十章随军入蜀（限时），第二军师（MP 回复被动）
  "庞统": {
    color: "#9a6a8a", arms: ["fan"],
    look: { head: "hat", weapon: "fan" },
    base: { hp: 42, mp: 38, atk: 5, int: 17, def: 6, spd: 7, luck: 9 },
    growth: { hp: "C", mp: "S", atk: "D", int: "S", def: "C", spd: "C", luck: "B" },
    learn: { 1: ["qingzhang"] },
    strategistPassive: { type: "mpRegen", value: 2 },  // 每回合 MP+2
  },
  // 马超：第十章收服，西凉锦马超
  "马超": {
    color: "#d8d8e8", arms: ["pike"],
    look: { head: "helmet", weapon: "pike" },
    base: { hp: 68, mp: 12, atk: 17, int: 5, def: 10, spd: 11, luck: 8 },
    growth: { hp: "A", mp: "C", atk: "S", int: "C", def: "B", spd: "A", luck: "B" },
    learn: { 1: ["jinma"] },
  },
  // 马岱：第十章加入，中庸副将
  "马岱": {
    color: "#8a9a7a", arms: ["pike"],
    look: { head: "helmet", weapon: "pike" },
    base: { hp: 60, mp: 14, atk: 13, int: 6, def: 9, spd: 9, luck: 8 },
    growth: { hp: "B", mp: "C", atk: "B", int: "C", def: "B", spd: "B", luck: "B" },
    learn: {},
  },
  // 姜维：第十一章收服，文武双全（末代主角）
  "姜维": {
    color: "#6ab8a8", arms: ["pike"],
    look: { head: "helmet", weapon: "pike" },
    base: { hp: 58, mp: 26, atk: 14, int: 14, def: 9, spd: 11, luck: 9 },
    growth: { hp: "B", mp: "A", atk: "A", int: "A", def: "B", spd: "A", luck: "B" },
    learn: { 1: ["qilin", "youlin"] },
  },
  // 小丫：第四章路旁遗孤（彩蛋队友，自动行动；纪念意义大于战力）
  "小丫": {
    color: "#d8a8b8", auto: true,
    look: {},
    base: { hp: 30, mp: 10, atk: 3, int: 6, def: 3, spd: 6, luck: 12 },
    growth: { hp: "B", mp: "C", atk: "C", int: "B", def: "C", spd: "B", luck: "A" },
    learn: {},
  },
  // 小豆子：第一章洞中小孩（彩蛋队友，自动行动；纪念意义大于战力）
  "小豆子": {
    color: "#b8a888", auto: true,
    look: {},
    base: { hp: 28, mp: 6, atk: 5, int: 3, def: 3, spd: 8, luck: 8 },
    growth: { hp: "B", mp: "D", atk: "B", int: "D", def: "C", spd: "A", luck: "B" },
    learn: {},
  },
};

if (typeof module !== "undefined") module.exports = HERO_TPL;
