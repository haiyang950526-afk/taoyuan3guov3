# -*- coding: utf-8 -*-
# BOSS 机制数据接入（07 文档）：按行锚定插入，不依赖具体数值
import io, re

p = 'data/enemies.js'
s = io.open(p, encoding='utf-8').read()

def _tidy(f):
    # 插入块最后一行若以注释结尾，注释前必须有逗号（否则吞掉行内原有内容/破坏语法）
    i = f.rfind('//')
    if i >= 0 and f.rfind('\n') < i:
        head = f[:i].rstrip()
        if not head.endswith(','):
            head += ','
        return head + ' ' + f[i:]
    return f

def add_to_enemy(name, fields):
    """在指定敌人行的 boss: true 后插入机制字段（该行须含 'boss: true'）"""
    global s
    fields = _tidy(fields)
    m = re.search(re.escape('"%s":' % name) + r'[^\n]*?boss: true', s)
    assert m, 'enemy line not found: ' + name
    s = s[:m.end()] + fields + s[m.end():]

def add_to_group(key, fields):
    """在指定编组行的 boss: true/false 后插入机制字段"""
    global s
    fields = _tidy(fields)
    m = re.search('  ' + re.escape(key) + r':(?:[^\n]*\n){0,4}?[^\n]*?boss: (?:true|false)', s)
    assert m, 'group line not found: ' + key
    s = s[:m.end()] + fields + s[m.end():]

# ---- ENEMIES 模板 ----
add_to_enemy('黄巾头目', ',\n                summon: { enemy: "黄巾贼", everyRounds: 3, maxOnField: 2 },    // 妖道聚兵')
add_to_enemy('于禁', ',\n                allyAura: { stat: "def", mult: 1.5 }, weakMagic: { shuiji: 2 },    // 军阵 + 水淹伏笔')
add_to_enemy('车胄', ',\n                heroLink: [{ hero: "关羽", mult: 1.5, say: ["关羽：车胄！可还认得关某？"] }]   // 赚城')
add_to_enemy('颜良', ',\n                heroLink: [{ hero: "关羽", mult: 3, say: ["颜良：赤面长髯者……莫非是——"] }]   // 斩颜良')
add_to_enemy('文丑', ',\n                heroLink: [{ hero: "关羽", mult: 2, say: ["文丑：杀我兄长，拿命来偿！"] }]   // 延津')
add_to_enemy('孔秀', ',\n                phases: [{ hpBelow: 0.5, say: ["孔秀：你、你们究竟是什么人……（胆裂）"], statsMult: { def: 0.7, spd: 0.7 } }]')
add_to_enemy('秦琪', ',\n                flee: { hpBelow: 0.3, rounds: 2 },    // 夺船欲逃')
add_to_enemy('裴元绍', ',\n                heroLink: [{ hero: "赵云", mult: 2, say: ["裴元绍：好个白马银枪的小将！"] }]   // 夺马遇赵云')
add_to_enemy('虎豹骑', ',\n                doubleAction: 0.3   // 奔袭')
add_to_enemy('水师都督', ',\n                weakMagic: { huoji: 3, dongfeng: 3 },    // 铁索连环，遇火则焚')
add_to_enemy('曹操亲卫队', ',\n                heroLink: [{ hero: "关羽", say: ["曹操：云长……别来无恙。"] }]   // 华容道义释')
add_to_enemy('金旋', ',\n                phases: [{ hpBelow: 0.35, say: ["金旋：巩志……连你也要背我？！"], statsMult: { def: 0.6 }, selfDot: 0.03 }]   // 众叛亲离')
add_to_enemy('马超(敌)', ',\n                atkGrow: 0.06,\n                heroLink: [{ hero: "张飞", mult: 1.2, say: ["张飞：好贼子！再接燕人三百回合！"] }]   // 葭萌关夜战')
add_to_enemy('夏侯渊', ',\n                weakMagic: { luoshi: 2 },\n                heroLink: [{ hero: "黄忠", fixed: { round: 4, dmg: 800, say: ["法正：可击矣！黄将军，冲——"], label: "定军一箭" } }]   // 定军山')
add_to_enemy('张郃', ',\n                stanceCycle: true   // 巧变')
add_to_enemy('姜维(敌)', ',\n                magicResist: 0.6, doubleActionEvery: 2   // 识破 + 幼麟')
add_to_enemy('郭淮', ',\n                magicResist: 0.5   // 方策精详')
add_to_enemy('孙礼', ',\n                phases: [{ hpBelow: 0.5, say: ["孙礼：魏之骁将，有死无生——！"], statsMult: { atk: 1.5 }, selfDot: 0.05 }]   // 死战')
add_to_enemy('曹真', ',\n                allyDeathGrow: 0.15   // 督战')
add_to_enemy('匪首张武', ',\n                dodgePhys: 0.15,\n                heroLink: [{ hero: "赵云", mult: 1.5, say: ["赵云：此马，合当随英雄！"] }]   // 的卢')
add_to_enemy('匪首赵慈', ',\n                summon: { enemy: "新野匪徒", count: 2, hpBelow: 0.4, maxOnField: 3 },    // 落草为寇')

# 夏侯惇（weakMagic 挂在 phases 行前，中间允许 drops 行）
m = re.search(r'"夏侯惇":(?:[^\n]*\n)*?(\s*)phases:', s)
assert m
s = s[:m.start(1)] + m.group(1) + 'weakMagic: { huoji: 6, dongfeng: 6 },   // 遇火则焚\n' + s[m.start(1):]

# 司马懿（一形态魔抗 + 二形态反伤）
m = re.search(r'"司马懿":(?:[^\n]*\n)*?(\s*)phases:', s)
assert m
s = s[:m.start(1)] + m.group(1) + 'magicResist: 0.5,   // 一形态"坚守"不中计\n' + s[m.start(1):]
old = 'statsMult: { atk: 1.35, def: 0.75 } },'
assert old in s
s = s.replace(old, 'statsMult: { atk: 1.35, def: 0.75 }, counter: 0.2, magicResist: 0 },   // 二形态"狼顾反击"', 1)

# ---- BATTLE_GROUPS 回合脚本 ----
add_to_group('ch02_boss', ',\n                    script: [{ round: 4, repeat: true,\n                      say: ["纪灵：少、少歇！且容我喘口气——"],\n                      effect: { healPct: 0.05, noAct: true, atkMult: 2, dur: 2 } }]   // 大叫少歇')
add_to_group('ch03_tuwei', ',\n                    script: [{ round: 1, dur: 1,\n                      say: ["（城门初破，敌军立足未稳！）"], effect: { spdMult: 0.5 } }]   // 措手不及')
add_to_group('ch04_chezhou2', ',\n                    script: [{ round: 2,\n                      say: ["（陈登内应已开城门——车胄腹背受敌！）"], effect: { defMult: 0.6 } }]   // 内应')
add_to_group('ch04_yanliang', ',\n                    script: [{ round: 1, dur: 2,\n                      say: ["颜良：河北颜良在此，谁敢决死一战！"], effect: { atkMult: 1.4 } }]   // 河北骁勇')
add_to_group('ch04_wenchou', ',\n                    script: [{ round: 1, dur: 2,\n                      say: ["（文丑军哄抢辎重，阵脚大乱！）"], effect: { defMult: 0.5 } },\n                    { round: 3, ifHpAbove: 0.5,\n                      say: ["文丑：整队！莫要再乱——"], effect: { atkMult: 1.2 } }]   // 抢辎重')
add_to_group('ch05_kongxiu', ',\n                    script: [{ round: 1, dur: 2,\n                      say: ["孔秀：想过东岭关，先问过我手中刀！"], effect: { atkMult: 1.3 } }]   // 虚张声势')
add_to_group('ch05_bianxi', ',\n                    script: [{ round: 1, say: ["卞喜：将军远来，且容我设宴接风——"],\n                      effect: { defMult: 1.5, noAct: true, dur: 2 } },\n                    { round: 3, ifHpBelow: 0.7,\n                      say: ["（普净示警：伏兵之计，已被识破！）"], effect: { spdMult: 0.5 } },\n                    { round: 3, ifHpAbove: 0.7,\n                      say: ["卞喜：掷杯为号——动手！"], effect: { atkMult: 1.8, dur: 1 } }]   // 诈降设伏')
add_to_group('ch05_qinqi', ',\n                    script: [{ round: 1, ifHpAbove: 0.5,\n                      say: ["秦琪：关羽？哼，也不过如此！（嘴硬心虚）"], effect: { atkMult: 1.2, dur: 2 } }]')
add_to_group('ch06_bandit1', ',\n                    script: [{ round: 1, say: ["张武：的卢速度，尔等追得上么！"], effect: { spdMult: 1.5 } }]   // 的卢')
add_to_group('ch06_bandit2', ',\n                    script: [{ round: 1, ifFlag: { flag: "b1", is: true },\n                      say: ["陈孙：杀我兄长，拿命来偿！"], effect: { atkMult: 1.3 } }]   // 复仇')
add_to_group('ch06_caimao', ', forceEndRound: 3   // 的卢跃檀溪：撑 3 回合脱险')
add_to_group('ch08_chibi', ', chainFleet: true   // 铁索连环')
add_to_group('ch08_huarong', ',\n                    script: [{ round: 1, say: ["（败军死战，且行且退……）"],\n                      effect: { atkMult: 0.7 } },\n                    { round: 1, effect: { defMult: 1.3, bossOnly: true } }]   // 残兵死战')
add_to_group('ch09_guiyang', ',\n                    script: [{ round: 2, say: ["赵范部将：将、将军饶命！我等愿降——（眼神闪烁）"],\n                      effect: { noAct: true } },\n                    { round: 3, say: ["赵范部将：中计了吧，哈哈——（反水偷袭！）"],\n                      effect: { atkMult: 1.6, dur: 1 } }]   // 诈降')
add_to_group('ch10_zhangren', ',\n                    script: [{ round: 1, dur: 2,\n                      say: ["（中伏！山路狭窄，军阵展不开——）"], effect: { partySpdMult: 0.7 } },\n                    { round: 4, ifHero: "诸葛亮",\n                      say: ["诸葛亮：张任，中我之计矣——金雁桥在此！"],\n                      effect: { defMult: 0.5, spdMult: 0.5, dur: 1, bossOnly: true } }]   // 伏兵专家 + 金雁桥')
add_to_group('ch10_machao', ',\n                    script: [{ round: 1, dur: 2,\n                      say: ["马超：锦马超在此，谁敢来战！"], effect: { defMult: 1.3, bossOnly: true } }]   // 狮盔银铠')
add_to_group('ch10_dingjun', ',\n                    script: [{ round: 1, dur: 3,\n                      say: ["夏侯渊：鹿角已成，坚守待援！"], effect: { defMult: 2, bossOnly: true } },\n                    { round: 4,\n                      say: ["（夏侯渊分兵补鹿角，阵脚松动！）"], effect: { defMult: 0.5, dur: 1, bossOnly: true } }]   // 鹿角坚守 → 轻出补角')
add_to_group('ch11_caozhen', ',\n                    script: [{ round: 8,\n                      say: ["（孔明来书——曹真阅罢，气冲牛斗，旧疾复发！）"], effect: { atkMult: 0.7, bossOnly: true } }]   // 孔明来书')

io.open(p, 'w', encoding='utf-8').write(s)
print('enemies.js BOSS 机制数据完成')

# ---- 的卢马饰品 ----
p2 = 'data/items.js'
s2 = io.open(p2, encoding='utf-8').read()
old = '  "铜雀":     { type: "acc", luck: 6, price: 9000, relic: true, desc: "名品：邺城新铸铜雀。运+6（唯一）" },'
assert old in s2
s2 = s2.replace(old, old + '\n  "的卢马":   { type: "acc", spd: 5, price: 5000, relic: true, desc: "名品：的卢马。速+5，檀溪一跃三丈的传说之驹（唯一）" },')
io.open(p2, 'w', encoding='utf-8').write(s2)
print('items.js 的卢马完成')
