# -*- coding: utf-8 -*-
# 麦城篇（10 文档）：英雄模板 + 敌人/编组 + 章节注册 + text.js 全台词 + 定军山改道成都
import io, re

# ---------------- heroes.js：关平/廖化/王甫/赵累（临时英雄） ----------------
p = 'data/heroes.js'
s = io.open(p, encoding='utf-8').read()
anchor = '  // 赵云：第五章加入，常胜将军（高速高爆发）'
assert anchor in s
block = '''  // —— 麦城篇临时英雄（10 文档） ——
  "关平": {
    color: "#c8a84a", arms: ["blade"],
    look: { head: "helmet", weapon: "blade" },
    base: { hp: 72, mp: 10, atk: 16, int: 5, def: 11, spd: 10, luck: 7 },
    growth: { hp: "A", mp: "D", atk: "A", int: "D", def: "B", spd: "B", luck: "B" },
    learn: {},
  },
  "廖化": {
    color: "#8a7a5a", arms: ["blade"],
    look: { head: "bandana", beard: "small", weapon: "blade" },
    base: { hp: 70, mp: 12, atk: 13, int: 8, def: 12, spd: 9, luck: 8 },
    growth: { hp: "B", mp: "C", atk: "B", int: "C", def: "B", spd: "B", luck: "B" },
    learn: {},
  },
  "王甫": {
    color: "#7a8ab8", arms: ["fan"],
    look: { head: "lunjin", weapon: "fan" },
    base: { hp: 55, mp: 30, atk: 6, int: 16, def: 8, spd: 9, luck: 7 },
    growth: { hp: "C", mp: "A", atk: "D", int: "A", def: "C", spd: "B", luck: "B" },
    learn: {},
  },
  "赵累": {
    color: "#6a7a6a", arms: ["blade"],
    look: { head: "helmet", weapon: "blade" },
    base: { hp: 66, mp: 14, atk: 13, int: 10, def: 12, spd: 9, luck: 7 },
    growth: { hp: "B", mp: "C", atk: "B", int: "C", def: "B", spd: "B", luck: "B" },
    learn: {},
  },
'''
s = s.replace(anchor, block + anchor, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('heroes.js ok')

# ---------------- enemies.js：徐晃/潘璋/朱然/马忠/于禁(樊城) + 编组 ----------------
p = 'data/enemies.js'
s = io.open(p, encoding='utf-8').read()
anchor = '  // —— 第十一章'
assert anchor in s
block = '''  // —— 麦城篇（10 文档） ——
  "于禁(樊城)": { lv: 48, hp: 5200, atk: 86, int: 20, def: 44, spd: 19, luck: 12, gold: [9000, 9000], color: "#3a6a4a", ai: "strategist", boss: true, skill: "zhengshu",
                allyAura: { stat: "def", mult: 1.5 },
                drops: [{ item: "玄铁甲", rate: 1 }] },
  "徐晃":     { lv: 50, hp: 5400, atk: 94, int: 14, def: 48, spd: 21, luck: 12, gold: [9750, 9750], color: "#4a4a3a", ai: "heavy", boss: true,
                drops: [{ item: "龙泉剑", rate: 1 }] },
  "潘璋":     { lv: 50, hp: 3200, atk: 90, int: 12, def: 44, spd: 22, luck: 11, gold: [6000, 6000], color: "#5a3a4a", ai: "brute", boss: true,
                drops: [{ item: "金疮药", rate: 1 }] },
  "朱然":     { lv: 50, hp: 3000, atk: 84, int: 24, def: 42, spd: 22, luck: 13, gold: [6000, 6000], color: "#3a4a6a", ai: "strategist", boss: true, skill: "zhengshu",
                drops: [{ item: "还魂丹", rate: 1 }] },
  "马忠":     { lv: 49, hp: 3400, atk: 88, int: 12, def: 42, spd: 25, luck: 14, gold: [6000, 6000], color: "#4a3a3a", ai: "archer", boss: true,
                drops: [{ item: "铁脊弓", rate: 1 }] },

  // —— 第十一章'''
s = s.replace(anchor, block, 1)
# 编组
anchor2 = '  // —— 第十一章 ——'
assert anchor2 in s
block2 = '''  // —— 麦城篇（10 文档） ——
  ch10m_fancheng: { waves: [["曹军先锋", "曹军精骑", "曹军先锋"], ["于禁(樊城)", "曹军都伯", "曹军虎卫"]],
                    boss: true, pre: "ch10m.fanchengPre", half: "ch10m.fanchengHalf",
                    fire: { round: 3, say: "ch10m.waterAttack", dmg: 1500 } },   // 水淹七军
  ch10m_xuhuang:  { enemies: ["徐晃", "曹军虎卫", "曹军虎卫"], boss: true,
                    pre: "ch10m.xuhuangPre", half: "ch10m.xuhuangHalf" },
  ch10m_tuwei_big1: { enemies: ["荆南兵", "荆南弓手", "荆南兵"], boss: false,
                    chain: ["ch10m_tuwei_big2"] },
  ch10m_tuwei_big2: { enemies: ["潘璋", "朱然"], boss: true,
                    pre: "ch10m.tuweiBigPre" },
  ch10m_tuwei_small: { enemies: ["马忠", "荆南弓手", "荆南弓手"], boss: true,
                    scriptedLoss: true, pre: "ch10m.tuweiSmallPre" },   // 历史线：绊马索
  ch10m_tuwei_small2: { enemies: ["马忠", "荆南弓手"], boss: true,
                    pre: "ch10m.tuweiSmallPre2" },   // 刘封援军侧击，可胜

  // —— 第十一章 ——'''
s = s.replace(anchor2, block2, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('enemies.js ok')

# ---------------- charart：于禁(樊城) 复用立绘 ----------------
p = 'data/charart.js'
s = io.open(p, encoding='utf-8').read()
old = '  "于禁":       { boss: "yu_jin" },'
assert old in s
s = s.replace(old, old + '\n  "于禁(樊城)": { boss: "yu_jin" },')
io.open(p, 'w', encoding='utf-8').write(s)
print('charart ok')

# ---------------- chapters.js：ch10m 注册 ----------------
p = 'data/chapters.js'
s = io.open(p, encoding='utf-8').read()
anchor = '  ch11: {'
assert anchor in s
block = '''  ch10m: {
    name: "间章 · 麦城悲歌",
    maps: ["ch10m_fanying", "ch10m_maicheng", "ch10m_shangyong", "ch10m_linju"],
    start: { map: "ch10m_fanying", x: 8, y: 8 },
    home: { map: "ch10m_maicheng", x: 7, y: 7 },
    questFlag: "q10m",
    questText: {
      start: "樊城大捷在即：击破于禁七军。",
      node1: "威震华夏：江东遣使求婚，帐中诸务，步步留心。",
      maicheng: "荆州已失：困守麦城，遣使上庸求援。",
      back: "援否已分：当夜突围！（大路正战 / 小路伏击）",
      done: "麦城已毕……（五结局已收其一）",
    },
  },
'''
s = s.replace(anchor, block + anchor, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('chapters.js ok')

# ---------------- text.js：ch10m 全台词 ----------------
p = 'data/text.js'
s = io.open(p, encoding='utf-8').read()
anchor = '  ch11: {'
assert anchor in s
block = '''  ch10m: {
    intro: ["间章 · 麦城悲歌",
            "建安二十四年，关羽围樊城，水淹七军，威震华夏——而江东的使船，正悄然北来。"],
    // 序幕 · 樊城大捷
    fanchengPre: ["（樊城外围，秋雨连绵。于禁督七军来救——）",
                  "于禁：关羽！尔孤军悬于坚城之下，还不速退！"],
    fanchengHalf: ["于禁：水……汉水涨了？！全军，结阵！"],
    waterAttack: ["（秋雨暴涨，汉水决堤——七军尽没！）",
                  "（大水漫天，于禁束手就擒，庞德抬榇死节。）"],
    fanchengDone: ["（一时之间，华夏震动——曹操几欲迁都以避其锋。）",
                   "关羽：樊城旦夕可下！传令——",],
    // 节点一 · 求婚
    proposal: ["诸葛瑾：吴侯闻将军有女淑德，特遣瑾来，为世子求婚。",
               "诸葛瑾：曹操方炽，孙刘唇齿——两家结亲，荆州安如泰山，将军北伐亦无后顾之忧。",
               "王甫（低声）：都督，大敌当前，多一门亲事，总好过多一个仇家……",
               "诸葛瑾：吴侯还有一言：婚姻既结，荆州便是两家之荆州——刀兵二字，从此休提。",],
    propScold: ["关羽：吾虎女，安肯嫁犬子乎！回去告诉孙权——守好他的江东！",
                "诸葛瑾：这……这……（抱头鼠窜而去）",
                "（消息传回江东，孙权掷杯于地：好个红脸匹夫！）",],
    propDecline: ["关羽：小女年幼，婚事……容后再议吧。",
                  "诸葛瑾：既如此，瑾，这便回去复命。（躬身而退）",
                  "（诸葛瑾走后，王甫低声：吴侯所图，恐不在婚约……）",],
    propAccept: ["关羽：孙刘本是一家。回去告诉吴侯——这亲事，关某准了。",
                 "诸葛瑾：将军深明大义！'刀兵休提'四字，瑾，必字字带到！（大喜过望）",
                 "（婚书既下。这句话，关平记下了，周仓记下了。）",
                 "（但愿江东，也记着。）",],
    // 节点二 · 陆逊书信
    luxun: ["（陆逊书信：'将军神威，倾世无二。逊一介书生，唯将军马首是瞻……'）",
            "王甫：都督，吕蒙称病来得蹊跷，陆逊又卑辞厚礼——此中恐有诈。",
            "（是否抽调荆州守军，增援樊城前线？）",],
    luxunSee: ["关羽：孺子示弱，意在荆州——守军不动。",
               "（江陵仍留赵累督守，烽火台日夜不熄。）",],
    luxunCounter: ["关羽：将计就计：明抽调，暗布烽火。",
                   "（守军照调，烽火台却添了双倍暗哨。）",],
    luxunFool: ["关羽：一介书生，何足为虑——调兵！",
                "（荆州守军尽赴樊城，后方一空……）",],
    // 节点三 · 治军
    mifang: ["糜芳：都督饶命！是夜风大，火种失控……",
             "王甫（低声）：南郡、公安是荆州根本，此二人守的是命根子，处置不可不慎。",],
    rulePunish: ["关羽：重杖四十，糜芳收押！防务暂交赵累。",
                 "（糜芳被拖了下去。傅士仁在一旁，冷汗涔涔。）",],
    ruleHistory: ["关羽：暂记此过——待我回来，再治尔等！",
                  "（'还当治之'四字，把二人推进了看不见的深渊。）",],
    ruleForgive: ["关羽：胜败兵家常事，赐酒压惊，戴罪立功。",
                  "糜芳、傅士仁：（叩首）谢都督不杀之恩……",],
    // 节点四 · 白衣渡江 + 徐晃
    xuhuangComing: ["（八百里加急：曹操遣徐晃，引精兵援樊城！）",
                    "关羽：徐公明善用兵——来得好！",],
    xuhuangPre: ["徐晃：关云长！你的威名，今日止于樊城！"],
    xuhuangHalf: ["徐晃：好刀……不愧是万人敌！"],
    jingleFall: ["（八百里加急：公安傅士仁，降了！江陵糜芳……也降了！吕蒙白衣渡江——）",
                 "（吕蒙入城，善抚士卒家眷。荆州军闻之，一夜之间逃亡过半……）",
                 "关羽：……回军！先据麦城，再图后计！",],
    jingleFallPunish: ["（八百里加急：公安傅士仁，降了！江陵……糜芳在押，赵累督军死守——）",
                       "（吕蒙围了三日，傅士仁引路，城，还是破了。糜芳于狱中落入吴军之手——他到底没做成叛徒。）",
                       "（吕蒙入城，善抚士卒家眷。荆州军闻之，一夜之间逃亡过半……）",
                       "关羽：……回军！先据麦城，再图后计！",],
    // 节点五 · 求援
    envoyAsk: ["（麦城孤悬，粮草将尽。王甫：须火速往上庸，请刘封、孟达发兵。）",
               "关平：父亲守城，儿去上庸！",
               "廖化：将军！化，请往！",],
    debate1: ["（上庸城中，刘封沉吟不语，孟达在侧冷笑。）",
              "孟达：呵呵……当年汉中王立嗣，你家关将军怎么说的？",
              "孟达：'螟蛉之子，不可僭立。'——这话，刘将军可还记着呢。",],
    d1Right: ["当年之谏，对的是礼法；今日之援，救的是性命——一码归一码。",
              "孟达：（一时语塞）",],
    d1Hard: ["将军若只记得旧怨，那便罢了。",
             "（刘封面色更沉。）",],
    d1Bow: ["（长揖到地，听他发作完再说。）",
            "孟达：（讥讽愈甚）",],
    debate2: ["刘封：……上庸新附，兵马未集，叫我如何轻动？",
              "孟达：将军三思。救，未必救得下；不救，不过听一句埋怨。",],
    d2See: ["荆州若失，上庸唇亡齿寒——将军以为吴人会止步于江陵？",
            "刘封：（沉吟良久）",],
    d2Empathy: ["平与将军，同是螟蛉之子。个中滋味，不必平多说。",
                "刘封：（动容良久）……是啊，你我这样的儿子，才懂彼此。",],
    d2Reward: ["事成之后，汉中王必不吝重赏。",
               "孟达：（嗤笑）上庸缺你那点赏？",],
    debate3: ["刘封（按剑而起，复又坐下）：……叫我想想。叫我想想。",
              "（最后一言，定他去留。）",],
    d3Invest: ["将军今日救的是叔父；他日天下人救的，是将军。",
               "刘封：（缓缓点头）",],
    d3Kneel: ["……平，代父亲，谢过将军。（长跪不起）",
              "刘封：（急忙扶起）贤侄这是何苦——",],
    d3Threat: ["见死不救，汉中王必诛二将军！",
               "孟达：（勃然作色）吓唬我？！",],
    debateWin: ["刘封：……罢了！点兵五千，我亲自接应叔父！",
                "孟达：将军！——唉！（拂袖）",],
    debateLose: ["孟达：上庸新附，不可轻动。刘将军，请回吧。",
                 "（使者望城恸哭，单骑而还。）",],
    // 节点六 · 突围
    breakout: ["王甫：小路必设埋伏——君侯请走大路！",
               "周仓：俺随君侯多年，刀山火海，走哪条不是走！",],
    tuweiBigPre: ["（大路。潘璋、朱然列阵而待——）",
                  "潘璋：关羽！此路不通！"],
    tuweiSmallPre: ["（临沮小道，绊马索起，人马俱翻……）",
                    "马忠：关将军，下马受缚吧！"],
    tuweiSmallPre2: ["（临沮小道，伏兵四起——忽闻山后鼓声：刘封援军自侧击至！）",
                     "马忠：什么？上庸的兵马？！"],
    // 节点七 · 劝降
    captured: ["（突围不成，力竭被擒，押至孙权帐前。）",
               "孙权：云长！孤久慕将军——今日之事，非孤所愿。",
               "孙权：若将军肯降，孤以上宾之礼相待，荆州……还可再议。",],
    refuse: ["关羽：玉可碎，而不可改其白；竹可焚，而不可毁其节！",
             "关羽：吾乃解良一武夫，蒙吾主以手足相待——安肯背义投敌国乎！",
             "孙权（长叹）：……真义士也。可惜了。",],
    refuseSpared: ["关羽：碧眼小儿！吾宁死不降——",
                   "孙权（按剑而起，复又缓缓坐下）：……若非婚约在先，今日必斩你。",
                   "孙权：囚于别馆，好生看管。孤倒要看看——刘备用几座城，来换这位'亲家'。",
                   "（骂声渐远。麦城的雪落了下来。人，保住了。）",],
    feign: ["关羽：……好。关某，降。",
            "（周仓目眦欲裂，关平欲言又止——却见父亲眼色深沉如井。）",
            "（当夜，一封血书缝进渔翁的蓑衣，顺江而下，直奔成都。）",],
    betray: ["（周仓、关平扑通跪倒：将军三思！桃园之义，天地共鉴！）",
             "（你迟疑了。这不是云长该有的选择。）",],
    // 五结局
    endMartyr: ["（父子同斩于临沮。王甫坠城，周仓自刎，赤兔绝食三日而死。）",
                "（麦城悲歌，千古同泣——）",],
    endReturn: ["（关羽、关平杀出重围，望西而去。身后，麦城陷落——周仓、王甫，殉城。）",
                "（成都。关羽请为伐吴先锋，孔明劝留。）",],
    endFallen: ["（惨胜。关羽重伤独骑而归——关平、周仓，俱殁于断后。）",
                "（病榻之上，老将军咬碎钢牙。）",],
    endFeigned: ["（江东别馆。囚室虽小，消息未断。）",
                 "（救云长——成了成都上下心照不宣的执念。）",],
    guanyuRetire: ["（成都。关羽解下青龙偃月刀，双手奉于殿上。）",
                   "关羽：兄长此番伐吴，弟……只能送到这里了。",
                   "（那柄刀从此悬在武侯祠的梁上。再无人见它出鞘。）",],
    chapterEnd: ["（麦城已矣。桃园之义，血仇为引——夷陵的烽烟，不远了。）"],
  },

'''
s = s.replace(anchor, block + anchor, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('text.js ok')

# ---------------- 定军山：ch11 直进改为回成都进间章 ----------------
p = 'data/maps/ch10_dingjun.js'
s = io.open(p, encoding='utf-8').read()
old = '''              { chapter: "ch11" }, { set: { q11: "start" } },
              { warp: { map: "ch11_hanzhong", x: 10, y: 16 } },
              { toast: "终章 · 出师未捷" }] },'''
assert old in s
new = '''              { warp: { map: "ch10_chengdu", x: 10, y: 16 } },
              { toast: "回成都休整——北方似乎有信使候着" }] },'''
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('dingjun ok')
