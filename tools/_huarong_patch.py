# -*- coding: utf-8 -*-
# 华容道杀放（12-A 文档）：text.js + enemies.js 编组 + items.js 遗物
# + ch08_xiakou 军令状 + ch08_huarong 截击战/马前三抉 + ch03_hunt 许田伏笔
import io, re

# ---------------- text.js：ch08 新增 + ch03 许田 ----------------
p = 'data/text.js'
s = io.open(p, encoding='utf-8').read()
anchor = '''    huarongPre: ["（华容道。关羽横刀立马，拦住曹操去路。）",'''
assert anchor in s
block = '''    // —— 开放式选择 · 华容道杀放（12 文档 A 线） ——
    lingzhuang: ["诸葛亮：曹操新败，必走华容小道。云长——",
                 "关羽：军师放心，关羽此去，必取曹操首级回来！",
                 "（诸葛亮欲言又止，羽扇轻摇：夜观乾象，操贼未合身亡……）",
                 "诸葛亮：既如此，请立军令状。",],
    pledgeYes: ["关羽：拿不下曹操，甘当军令！",
                "（诸葛亮收下军令状，目送出帐，轻轻叹了口气。）",],
    pledgeNo:  ["关羽：……军师似乎话里有话？",
                "（诸葛亮笑而不答，只把军令状收进了袖中。）",],
    interceptPre: ["（华容道入口。曹军残部自相践踏，死者蔽道……）"],
    interceptDone: ["（曹军十停去了八停。曹操身边，已没几个能战的兵了。）"],
    huarongAsk: ["（曹操坐骑中箭，滚鞍落马。左右亲卫，已不足十人。）",
                 "曹操：云长……别来无恙。",
                 "张辽：云长兄！当年白门楼，辽已当死，是谁保我一命——今日，还到文远身上！",
                 "（青龙偃月刀，缓缓抬起。全场的呼吸都停了。）",],
    hrRelease: ["关羽：（长叹）……放他们过去。",
                "关羽：昔日之恩，今日已报，从此两不相欠。",
                "（曹操狼狈北还。华容义释，传为佳话。）",],
    hrStay:   ["（刀落至半——关羽眼前闪过许田围猎、闪过白门楼、闪过那碗未曾入口的羹。）",
               "关羽：（缓缓收刀）杀你……如杀关某自己。",
               "曹操：（呆立良久，深深一拜）云长高义……（拜谢而去）",
               "（斩的是心魔，留的是千秋义名。）",],
    flashback: ["（许田围猎，那口被按住的刀……主公当日按的是刀，今日按不住的是关某自己。）",],
    hrSeized: ["（绑了就走。行不十里，许褚残部拼死劫道，张辽断后死战——）",
               "（乱军中，曹操滚鞍脱缚。北邙方向尘烟大起：北方已乱。）",
               "关羽：（按剑良久）……天意。",
               "（释缚纵之。曹操掷下一卷手书，勒马北还。）",],
    huarongBack: ["（夏口。关羽回营缴令。）",
                  "诸葛亮：亮夜观乾象，操贼未合身亡——留这桩人情，教云长亲手做了，也是美事。",
                  "（华容一道，义字千秋。）",],
'''
s = s.replace(anchor, block + anchor)
# ch03 许田伏笔：加在 ch03 段末尾前（hunt 相关文本后）
anchor2 = '''  ch04: {'''
assert anchor2 in s
block2 = '''    // —— 华容道伏笔 · 许田围猎（12 文档 A 线可选） ——
    xutianAsk: ["（围猎场上，曹操夺天子宝雕弓射中大鹿，群臣山呼万岁——）",
                "关羽：（按刀欲起）曹贼僭越！某这便斩了他！",
                "刘备：（死死按住）二弟不可！投鼠忌器，此时动不得！",],
    xutianStop: ["关羽：（恨恨收刀）……今日暂且记下。",
                 "（那口被按住的刀，从此留在了关某心里。）",],
    xutianGo: ["周仓：（抢步上前，死死抱住）将军！使不得啊——！",
               "关羽：（被众人力劝方止）哼！",
               "（那口被按住的刀，从此留在了关某心里。）",],

'''
s = s.replace(anchor2, block2 + anchor2, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('text.js ok')

# ---------------- enemies.js：截击编组 ----------------
p = 'data/enemies.js'
s = io.open(p, encoding='utf-8').read()
old = '  ch08_huarong:   { enemies: ["曹操亲卫队", "华容曹兵", "华容曹兵"], boss: true,'
assert old in s
s = s.replace(old, '''  ch08_huarong1:  { waves: [["华容曹兵", "华容曹兵"], ["华容曹兵", "华容曹兵", "华容曹兵"]],
                    boss: false, pre: "ch08.interceptPre" },   // 截击残军（12-A）
''' + old)
io.open(p, 'w', encoding='utf-8').write(s)
print('enemies.js ok')

# ---------------- items.js：孟德手书 ----------------
p = 'data/items.js'
s = io.open(p, encoding='utf-8').read()
old = '  "凤雏手卷": { type: "acc", int: 2, price: 8000, relic: true,'
assert old in s and '孟德手书' not in s
old2 = '  "铜雀":     { type: "acc", luck: 6, price: 9000, relic: true, desc: "名品：邺城新铸铜雀。运+6（唯一）" },'
assert old2 in s
s = s.replace(old2, old2 + '\n  "孟德手书": { type: "acc", int: 4, price: 9000, relic: true, desc: "名品：华容道曹操掷谢的手书。智+4（与铜雀二选一，唯一）" },')
io.open(p, 'w', encoding='utf-8').write(s)
print('items.js ok')

# ---------------- ch08_xiakou：军令状 NPC ----------------
p = 'data/maps/ch08_xiakou.js'
s = io.open(p, encoding='utf-8').read()
old = '''    { id: "inn", x: 5, y: 5, color: "#c98a4b", name: "旅店老板", shop: "ch08_inn" },'''
assert old in s
new = '''    // 开放式选择 · 军令状（12-A）：乌林追击后、华容道前
    { id: "zhuge8", x: 7, y: 5, color: "#e8e8f0", name: "诸葛亮",
      appearIf: { flag: "q8", is: "wulin" },
      hideIf: { flag: "hr_pledge", exists: true },
      branches: [
        { say: "ch08.lingzhuang",
          ask: { title: "军令状？", options: [
            { label: "拿不下曹操，甘当军令！",
              say: "ch08.pledgeYes",
              do: [{ set: { hr_pledge: 1 } }] },
            { label: "……军师似乎话里有话？",
              say: "ch08.pledgeNo",
              do: [{ set: { hr_pledge: 0 } }] },
          ] } },
      ] },
''' + old
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ch08_xiakou ok')

# ---------------- ch08_huarong：截击触发 + 马前三抉 ----------------
p = 'data/maps/ch08_huarong.js'
s = io.open(p, encoding='utf-8').read()
# 1) 截击战触发器（主路两格，一次性）
old = '''  transitions: ['''
assert old in s
new = '''  triggers: [
    // 截击残军（12-A：遭遇曹操前先打残他）
    { x: 12, y: 8, if: { flag: "hr_intercept", not: "done" },
      do: [{ battle: "ch08_huarong1",
             onWin: [{ say: "ch08.interceptDone" }, { set: { hr_intercept: "done" } }] }] },
    { x: 13, y: 8, if: { flag: "hr_intercept", not: "done" },
      do: [{ battle: "ch08_huarong1",
             onWin: [{ say: "ch08.interceptDone" }, { set: { hr_intercept: "done" } }] }] },
  ],
  transitions: ['''
s = s.replace(old, new, 1)
# 2) onForceEnd 改三抉（win/lose 同流程：马前三抉 → 分支结算 → 缴令）
old = '''      onForceEnd: {
        win: [{ say: "ch08.huarongWin" },
              // 名品 · 铜雀（wh4）：曹操北还前赠别（义释分支内，战后即离图，不能放踩点触发器）
              { say: "ch08.huarongTongque" }, { giveEquip: "铜雀" },
              { set: { wh4: "done" } }, { set: { relic_tongque: true } },
              { set: { q8: "done" } },
              { say: "ch08.chapterEnd" }, { say: "ch09.intro" },
              { chapter: "ch09" }, { set: { q9: "start" } },
              { warp: { map: "ch09_guiyang", x: 10, y: 16 } },
              { toast: "第九章 · 荆南四郡" }],
        lose: [{ say: "ch08.huarongLose" },
               { say: "ch08.huarongTongque" }, { giveEquip: "铜雀" },
               { set: { wh4: "done" } }, { set: { relic_tongque: true } },
               { set: { q8: "done" } },
               { say: "ch08.chapterEnd" }, { say: "ch09.intro" },
               { chapter: "ch09" }, { set: { q9: "start" } },
               { warp: { map: "ch09_guiyang", x: 10, y: 16 } },
               { toast: "第九章 · 荆南四郡" }],
      } },'''
assert old in s
new = '''      onForceEnd: {
        win: [{ say: "ch08.huarongAsk" }, { ask: HR_ASK }],
        lose: [{ say: "ch08.huarongAsk" }, { ask: HR_ASK }],
      } },'''
s = s.replace(old, new, 1)
# 3) 顶部注入 HR_ASK 定义
old = '''var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

MAPS["ch08_huarong"] = {'''
assert old in s
new = '''var MAPS = typeof MAPS !== "undefined" ? MAPS : {};

// 马前三抉（12-A）：放 / 杀 / 擒，奖励互斥（铜雀 vs 孟德手书）
var HR_END = [
  { set: { q8: "done" } },
  { say: "ch08.huarongBack" },
  { say: "ch08.chapterEnd" }, { say: "ch09.intro" },
  { chapter: "ch09" }, { set: { q9: "start" } },
  { warp: { map: "ch09_guiyang", x: 10, y: 16 } },
  { toast: "第九章 · 荆南四郡" }];
var HR_ASK = { title: "曹操已在马前——", options: [
  // 放：历史线，铜雀赠别
  { label: "放。昔日之恩，今日已报。",
    say: "ch08.hrRelease",
    do: [{ say: "ch08.huarongTongque" }, { giveEquip: "铜雀" },
         { set: { wh4: "done" } }, { set: { relic_tongque: true } },
         { set: { hr_choice: "release" } }].concat(HR_END) },
  // 杀：刀落至半，终是收刀（斩心魔，关羽攻+2；许田伏笔有闪回差分）
  { label: "杀。为大哥，斩了这汉贼！",
    say: "ch08.hrStay",
    do: [{ if: { flag: "hr_xutian", is: 1 }, do: [{ say: "ch08.flashback" }] },
         { giveEquip: "铜雀" },
         { set: { wh4: "done" } }, { set: { relic_tongque: true } },
         { statUp: { hero: "关羽", stat: "atk", by: 2 } },
         { set: { hr_choice: "stayed" } }].concat(HR_END) },
  // 擒：绑了就走——劫道、脱缚、天意（孟德手书）
  { label: "擒。押回夏口，听凭军师发落！",
    say: "ch08.hrSeized",
    do: [{ giveEquip: "孟德手书" },
         { set: { hr_choice: "seized" } }].concat(HR_END) },
] };

MAPS["ch08_huarong"] = {'''
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ch08_huarong ok')

# ---------------- ch03_hunt：许田伏笔 ----------------
p = 'data/maps/ch03_hunt.js'
s = io.open(p, encoding='utf-8').read()
old = '''    // 围猎小游戏（20 秒射鹿，分数换赏金）'''
assert old in s
new = '''    // 华容道伏笔 · 许田围猎（12-A 可选）：拦 / 不拦，都记下这口刀
    { x: 10, y: 6, if: { all: [{ flag: "q3", is: "audience" }, { flag: "hr_xutian", not: 1 }] },
      do: [{ say: "ch03.xutianAsk" },
           { ask: { title: "关羽按刀欲起——", options: [
             { label: "（刘备死死按住）二弟不可！",
               say: "ch03.xutianStop",
               do: [{ set: { hr_xutian: 1 } }] },
             { label: "（不拦）看他能怎样！",
               say: "ch03.xutianGo",
               do: [{ set: { hr_xutian: 1 } }] },
           ] } }] },
    // 围猎小游戏（20 秒射鹿，分数换赏金）'''
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ch03_hunt ok')
