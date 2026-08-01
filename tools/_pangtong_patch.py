# -*- coding: utf-8 -*-
# 庞统线（12-B 文档）：text.js 台词 + ch10_field 让马/寻药 + ch10_luofeng 双分支
# + ch10_chengdu 送别/病榻 + items.js 凤雏手卷
import io, re

# ---------------- text.js：ch10.* 新增台词 ----------------
p = 'data/text.js'
s = io.open(p, encoding='utf-8').read()
anchor = '''    pangtongDeath: ["（乱箭齐发！庞统身中数十箭，坠于马下。）",'''
assert anchor in s
block = '''    // —— 开放式选择 · 借的卢救庞统（12 文档 B 线） ——
    lendHorse: ["（庞统的坐骑又老又瘦，走落凤坡那样的险路，实在勉强。）",
                "刘备：士元——骑我的的卢去吧。此马檀溪跃过三丈，灵性得很。",
                "庞统：主公的御马，统，怎敢当……",],
    lendYes:  ["刘备：军情紧急，先生莫推。——驾着它，早去早回。",
               "庞统：（抚鬃长叹）那统，就厚颜受了。",
               "（白马萧萧。这一让，让出的是主公的御马，还是别的什么？）",],
    lendNo:   ["庞统：军师说的哪里话，自家的马骑着踏实。",
               "（庞统拍了拍那匹老马，笑了笑，翻身上鞍。）",],
    ambushHorse: ["（张任：见白马者，便是刘备——射！！）",],
    pangtongWounded: ["（乱箭齐发！庞统座下驽马惊蹶，将他掀入山涧——）",
                      "（魏延、周仓冒死突入箭雨，硬是把人抢了回来。）",
                      "庞统：（气若游丝）马……马死了……主公的马若在……",
                      "（庞统身中数箭，命悬一线。军中没有能救他的人。）",],
    medicIntro: ["医官：将军！庞军师箭伤入腑，非仙草露吊命、金疮药续伤不可。",
                 "医官：军中……没有这些。将军若有药材，或识得名医，或许还有一线生机！",],
    pangtongSaved: ["（仙草露吊住心脉，金疮药续住伤处。三日三夜，人，救回来了。）",
                    "庞统：统这条命……是主公的马换来的——他没借马，倒是救了我。",
                    "（然箭伤入骨，双臂难张。凤雏之翼，折于落凤坡。）",
                    "（军前不可一日无谋——诸葛亮自荆州星夜入川。）",],
    huatuoSave: ["（门外一骑飞至——华佗先生门下弟子闻讯赶来。）",
                 "医童：家师常说，诸位军爷身上有杀气、也有伤病——今日，还到庞军师身上。",
                 "（三年前的善举，今日救人一命。庞统，救回来了。）",
                 "（然箭伤入骨，双臂难张。凤雏之翼，折于落凤坡。）",
                 "（军前不可一日无谋——诸葛亮自荆州星夜入川。）",],
    pangtongComa: ["（药材不济，军医束手。庞统昏迷不醒，高热不退。）",
                   "（军士以板车护送，星夜回成都调养——）",
                   "（军前不可一日无谋——诸葛亮自荆州星夜入川。）",],
    ptFarewell: ["（成都。庞统登车东归养伤，与刘备执手。）",
                 "庞统：统在西川没做完的事，托付孔明了。",
                 "庞统：主公，珍重。待统伤愈——荆州、天下，还陪你走。",
                 "（车轮辚辚。凤雏虽折翼，所幸——人在。）",],
    ptFarewellComa: ["（成都。医馆烛火彻夜不熄。庞统被抬下板车，面色如纸。）",
                     "刘备：（执手良久）士元……你欠我一个太平天下，不许赖。",
                     "（榻前烛影摇曳。人还活着——这就够了。）",],
    ptCh11Alive: ["庞统：（扶杖而出）若统尚能骑马，必不叫伯约孤身守街亭……",
                  "庞统：伯约是块璞玉。丞相，这卷手记你带上——论军争之道，或有一二可用。",
                  "（获得遗物：凤雏手卷。军师计策伤害+10%。）",],
    ptCh11Coma: ["（榻前烛火。诸葛亮点完七星灯，在榻边静坐良久。）",
                 "（榻上人的呼吸很轻，很稳。活着，就好。）",],
'''
s = s.replace(anchor, block + anchor)
io.open(p, 'w', encoding='utf-8').write(s)
print('text.js ok')

# ---------------- items.js：凤雏手卷 ----------------
p = 'data/items.js'
s = io.open(p, encoding='utf-8').read()
old = '  "的卢马":   { type: "acc", spd: 5, price: 5000, relic: true, desc: "名品：的卢马。速+5，檀溪一跃三丈的传说之驹（唯一）" },'
assert old in s and '凤雏手卷' not in s
s = s.replace(old, old + '\n  "凤雏手卷": { type: "acc", int: 2, price: 8000, relic: true, desc: "名品：庞统军争手记。智+2，军师计策伤害+10%（与六韬残页可共存，唯一）" },')
io.open(p, 'w', encoding='utf-8').write(s)
print('items.js ok')

# ---------------- ch10_field：让马 NPC（庞统） + 寻药医官 ----------------
p = 'data/maps/ch10_field.js'
s = io.open(p, encoding='utf-8').read()
old = '''  npcs: [],'''
assert old in s
new = '''  npcs: [
    // 开放式选择 · 让马（12 文档 B-2）：落凤坡出发前，一次性
    { id: "pt_horse", x: 2, y: 8, color: "#9a7ab8", name: "庞统",
      appearIf: { flag: "q10", is: "luo1" },
      hideIf: { flag: "pt_set", is: "done" },
      branches: [
        { say: "ch10.lendHorse",
          ask: { title: "把的卢马让给庞统？", options: [
            { label: "军情紧急，先生莫推。（借）",
              say: "ch10.lendYes",
              do: [{ set: { pt_horse: 1 } }, { set: { pt_set: "done" } },
                   { toast: "的卢马，借予庞统。" }] },
            { label: "军师说的哪里话。（不借）",
              say: "ch10.lendNo",
              do: [{ set: { pt_set: "done" } }] },
          ] } },
      ] },
    // 寻药 mini-arc：伏击归来，随军医官（药方路/故人路/昏迷保底）
    { id: "pt_medic", x: 2, y: 7, color: "#c8c8d8", name: "医官",
      appearIf: { flag: "pt_save", is: "start" },
      hideIf: { flag: "pt_save", is: "done" },
      branches: [
        // 药方路：交出 仙草露×1 + 金疮药×2
        { if: { all: [{ hasItem: ["仙草露", 1] }, { hasItem: ["金疮药", 2] }] },
          say: "ch10.medicIntro",
          ask: { title: "交出药材救治庞统？", options: [
            { label: "交药（仙草露×1 + 金疮药×2）",
              say: "ch10.pangtongSaved",
              do: [{ take: ["仙草露", 1] }, { take: ["金疮药", 2] },
                   { set: { pt_alive: 1 } }, { set: { pt_save: "done" } },
                   { leave: "庞统" }, { set: { q10: "luofeng" } },
                   { toast: "庞统救回来了！（伤退出战斗序列）" }] },
            { label: "再想想……", say: ["医官：请快些……军师他，撑不了太久。"] },
          ] } },
        // 故人路：华佗授五禽戏（mt6）已完成
        { if: { flag: "mt6", is: "done" }, say: "ch10.huatuoSave",
          do: [{ set: { pt_alive: 1 } }, { set: { pt_save: "done" } },
               { leave: "庞统" }, { set: { q10: "luofeng" } },
               { toast: "华佗门下弟子至——庞统救回来了！" }] },
        // 保底：昏迷护送
        { say: "ch10.medicIntro",
          ask: { title: "没有药材，怎么办？", options: [
            { label: "先护送回成都……",
              say: "ch10.pangtongComa",
              do: [{ set: { pt_coma: 1 } }, { set: { pt_save: "done" } },
                   { leave: "庞统" }, { set: { q10: "luofeng" } },
                   { toast: "庞统昏迷中，被护送回成都。" }] },
            { label: "我去找药！", say: ["医官：拜托将军了——军师的命，就悬在这上面。"] },
          ] } },
      ] },
  ],'''
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ch10_field ok')

# ---------------- ch10_luofeng：借/不借 双分支触发 ----------------
p = 'data/maps/ch10_luofeng.js'
s = io.open(p, encoding='utf-8').read()
old = '''  triggers: [
    // 中伏（固定败战：庞统剧情杀，永久离队）
    { x: 12, y: 6, if: { flag: "q10", is: "luo1" },
      do: [{ battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongDeath" }, { leave: "庞统" },
                      { set: { q10: "luofeng" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "化悲痛为力量——再攻雒城！" }] }] },
    { x: 13, y: 6, if: { flag: "q10", is: "luo1" },
      do: [{ battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongDeath" }, { leave: "庞统" },
                      { set: { q10: "luofeng" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "化悲痛为力量——再攻雒城！" }] }] },
  ],'''
assert old in s
new = '''  triggers: [
    // 中伏 · 借的卢支（pt_horse=1）：白马替主——历史殒命线，的卢马同殁
    { x: 12, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", is: 1 }] },
      do: [{ say: "ch10.ambushHorse" }, { battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongDeath" },
                      { say: ["（白马与主，同殁于坡。'妨主'之言，应验在马身上。）"] },
                      { take: ["的卢马", 1] }, { leave: "庞统" },
                      { set: { q10: "luofeng" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "化悲痛为力量——再攻雒城！" }] }] },
    { x: 13, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", is: 1 }] },
      do: [{ say: "ch10.ambushHorse" }, { battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongDeath" },
                      { say: ["（白马与主，同殁于坡。'妨主'之言，应验在马身上。）"] },
                      { take: ["的卢马", 1] }, { leave: "庞统" },
                      { set: { q10: "luofeng" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "化悲痛为力量——再攻雒城！" }] }] },
    // 中伏 · 不借支：伤而不死 → 寻药 arc
    { x: 12, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", not: 1 }] },
      do: [{ battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongWounded" }, { set: { pt_save: "start" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "庞统命悬一线——快随军医官救治！" }] }] },
    { x: 13, y: 6, if: { all: [{ flag: "q10", is: "luo1" }, { flag: "pt_horse", not: 1 }] },
      do: [{ battle: "ch10_luofeng",
             onLoss: [{ say: "ch10.pangtongWounded" }, { set: { pt_save: "start" } },
                      { warp: { map: "ch10_field", x: 1, y: 8 } },
                      { toast: "庞统命悬一线——快随军医官救治！" }] }] },
  ],'''
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ch10_luofeng ok')

# ---------------- ch10_chengdu：庞统送别 + ch11 病榻 ----------------
p = 'data/maps/ch10_chengdu.js'
s = io.open(p, encoding='utf-8').read()
old = '''    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",'''
assert old in s
new = '''    // 开放式选择 · 庞统伤退（12 文档 B-5）：送别 + ch11 病榻探看
    { id: "pt_home", x: 5, y: 7, color: "#9a7ab8", name: "庞统",
      appearIf: { flag: "pt_alive", exists: true },
      branches: [
        { if: { all: [{ flag: "q11", exists: true }, { flag: "mt_phoenix", not: "done" }] },
          say: "ch10.ptCh11Alive",
          do: [{ giveEquip: "凤雏手卷" }, { set: { relic_fengchu: true } },
               { set: { mt_phoenix: "done" } }] },
        { say: "ch10.ptFarewell" },
      ] },
    { id: "pt_bed", x: 5, y: 7, color: "#9a7ab8", name: "庞统",
      appearIf: { flag: "pt_coma", exists: true },
      branches: [
        { if: { flag: "q11", exists: true }, say: "ch10.ptCh11Coma" },
        { say: "ch10.ptFarewellComa" },
      ] },
    { id: "v1",     x: 7,  y: 7,  color: "#4f8cff", name: "市民",'''
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ch10_chengdu ok')
