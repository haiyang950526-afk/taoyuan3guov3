// 数据 · 装备 / 道具 / 商店库存
// 装备代际（02/04 文档）：序章铜 → 第一章铁 → 第二章钢 → 三章精钢/玄铁 → 八章白银 → 十章龙泉。
// 五槽：weapon 加攻 / armor 加防 / helmet 头盔 / legs 护腿（头盔护腿 def 约为同代铠甲一半）/ acc 特殊效果。
// 商店数据驱动：type = inn 旅店 / equip 装备店（title+filter 拆分武器店/防具店）/ item 杂货店。
// 库存原则：每城 = 本代装备 + 上一代装备（只低一等，不再更旧）。
// 定价假设：同代武器 ≈ 本章野怪 12-15 场的收入；旅店 ≈ 2 场，保证
// "出城一波、回城休整"后仍有结余向下一代装备攒钱。
"use strict";

const ITEMS = {
  // 武器（atk）
  "铜剑":   { type: "weapon", atk: 3,  price: 400,  desc: "青铜利剑，攻击+3" },
  "铁剑":   { type: "weapon", atk: 6,  price: 900,  desc: "精铁打造，攻击+6" },
  "钢剑":   { type: "weapon", atk: 10, price: 2000, desc: "百炼钢刃，攻击+10" },
  "精钢剑": { type: "weapon", atk: 20, price: 4500, desc: "精钢百炼，攻击+20" },
  "玄铁剑": { type: "weapon", atk: 26, price: 6800, desc: "玄铁沉锋，攻击+26" },
  "白银剑": { type: "weapon", atk: 32, price: 13000, desc: "白银流光，攻击+32" },
  "龙泉剑": { type: "weapon", atk: 48, price: 22000, desc: "龙泉秋水，攻击+48" },
  "铁刀":   { type: "weapon", arm: "blade", atk: 22, price: 4800, desc: "镔铁长刀，攻击+22（刀系）" },
  "铁矛":   { type: "weapon", arm: "spear", atk: 22, price: 4800, desc: "精铁蛇矛，攻击+22（矛系）" },
  "铁枪":   { type: "weapon", arm: "pike",  atk: 22, price: 4800, desc: "白蜡铁枪，攻击+22（枪系）" },
  "童渊铁枪": { type: "weapon", arm: "pike", atk: 26, grow: 1, price: 0, nosell: true, relic: true, desc: "童渊佩枪：攻击+26 且随持有者等级成长（每级+1），赠子龙单骑救主（枪系，唯一）" },
  "铁脊弓": { type: "weapon", arm: "bow",   atk: 26, price: 5000, desc: "铁脊强弓，攻击+26（弓系）" },
  "羽扇":   { type: "weapon", arm: "fan",   atk: 6, int: 10, price: 3000, desc: "白羽纶扇，攻+6 智+10（扇系）" },
  // 名品（情怀毕业装，不可售；获取：剧情赠送 / 隐藏宝箱 / 汉中军需限量）
  "雌雄双股剑": { type: "weapon", atk: 60, price: 60000, nosell: true, desc: "名品：刘备佩剑，攻击+60" },
  "青龙偃月刀": { type: "weapon", arm: "blade", atk: 65, grow: 0.8, price: 60000, nosell: true, desc: "名品：冷艳锯，攻击+65 且随持有者等级成长（每级+0.8），关羽之本命（刀系，唯一）" },
  "丈八蛇矛":   { type: "weapon", arm: "spear", atk: 62, price: 60000, nosell: true, desc: "名品：燕人神兵，攻击+62（矛系）" },
  "龙胆枪":     { type: "weapon", arm: "pike",  atk: 63, price: 60000, nosell: true, desc: "名品：常山龙胆，攻击+63（枪系）" },
  "落日弓":     { type: "weapon", arm: "bow",   atk: 58, price: 60000, nosell: true, desc: "名品：落日九射，攻击+58（弓系）" },
  "七星杖":     { type: "weapon", arm: "fan",   atk: 20, int: 50, price: 60000, nosell: true, desc: "名品：七星续命，攻+20 智+50（扇系）" },
  "七星剑":     { type: "weapon", atk: 55, price: 50000, nosell: true, desc: "名品彩蛋：七星宝剑，攻击+55" },
  // 成长性武器（樗蒲首次全黑奖励）：攻击 = 6 + 1×持有者等级（formulas.js equipBonus 的 grow 判定）
  // 强度定位：Lv55≈50，介于龙泉(48)与名品(62+)之间——情怀毕业装，不碾压商店与名品
  "时运":   { type: "weapon", atk: 6, grow: 1, price: 0, nosell: true, desc: "樗蒲首奖：攻+6 且随等级成长（每级+1），攻击时偶发眩晕/起火/追加/回血" },
  // 防具（def）
  "布衣":   { type: "armor", def: 2,  price: 150,  desc: "粗布衣裳，防御+2" },
  "皮甲":   { type: "armor", def: 4,  price: 500,  desc: "鞣制皮甲，防御+4" },
  "皮盾":   { type: "armor", def: 5,  price: 700,  desc: "蒙皮木盾，防御+5" },
  "铁甲":   { type: "armor", def: 7,  price: 1200, desc: "铁叶札甲，防御+7" },
  "钢甲":   { type: "armor", def: 11, price: 2400, desc: "钢锻重铠，防御+11" },
  "玄铁甲": { type: "armor", def: 18, price: 5200, desc: "玄铁细铠，防御+18" },
  "白银铠": { type: "armor", def: 30, price: 15000, desc: "白银重铠，防御+30" },
  "龙鳞铠": { type: "armor", def: 45, price: 26000, desc: "龙鳞宝铠，防御+45" },
  // 饰品（特殊效果）
  "护心镜": { type: "acc", def: 3, price: 1500, desc: "护住心口的铜镜，防御+3" },
  "玉佩":   { type: "acc", int: 3, price: 2000, desc: "温润古玉，智力+3" },
  "铁斧头": { type: "acc", crit: 10, price: 0, nosell: true, desc: "河神所赠铁斧，暴击率+10%（唯一）" },
  "旧草鞋": { type: "acc", luck: 1, price: 0, nosell: true, desc: "皇叔亲手所编，运+1（唯一）" },
  "诸葛巾": { type: "acc", int: 20, price: 30000, nosell: true, desc: "名品彩蛋：武侯纶巾，智力+20" },
  // 名品典籍（04 文档：典籍智力饰品 / 器物收藏卖钱；全部唯一，relic 为收集预留标记）
  "六韬残页": { type: "acc", int: 3, price: 6000, relic: true, desc: "名品：太公兵法残页。智+3，军师计策伤害+10%（唯一）" },
  "书经":     { type: "acc", int: 4, def: 2, price: 4000, relic: true, desc: "名品：《尚书》。智+4 防+2（唯一）" },
  "伤寒杂病论": { type: "acc", int: 5, price: 6000, relic: true, desc: "名品：张仲景医书残稿。智+5（唯一）" },
  "淮南子":   { type: "acc", int: 3, luck: 3, price: 5000, relic: true, desc: "名品：'塞翁失马'即出自此书。智+3 运+3（唯一）" },
  "青囊书":   { type: "acc", int: 6, price: 8000, relic: true, desc: "名品：华佗毕生医术。智+6（唯一）" },
  "白羽扇":   { type: "weapon", arm: "fan", atk: 10, int: 25, price: 30000, nosell: true, relic: true, desc: "名品：孔明出山前旧扇。攻+10 智+25（扇系，唯一）" },
  "铜雀":     { type: "acc", luck: 6, price: 9000, relic: true, desc: "名品：邺城新铸铜雀。运+6（唯一）" },
  "的卢马":   { type: "acc", spd: 5, price: 5000, relic: true, desc: "名品：的卢马。速+5，檀溪一跃三丈的传说之驹（唯一）" },
  "春秋左氏传": { type: "acc", int: 4, atk: 2, price: 4000, relic: true, desc: "名品：关云长夜读之书。智+4 攻+2（唯一）" },
  "论语":     { type: "acc", int: 3, luck: 2, price: 3000, relic: true, desc: "名品：半部可治天下。智+3 运+2（唯一）" },
  "易经":     { type: "acc", int: 6, price: 6000, relic: true, desc: "名品：群经之首。智+6（唯一）" },
  "太平清领道": { type: "acc", int: 8, price: 10000, relic: true, desc: "名品：太平道经书。智+8（唯一）" },
  "遁甲天书": { type: "acc", int: 10, price: 15000, relic: true, desc: "名品：遁甲之术，全书价值最高。智+10（唯一）" },
  "毛公鼎":   { type: "acc", price: 12000, relic: true, desc: "名品：西周青铜重器（收藏品，可售高价）" },
  "长信宫灯": { type: "acc", luck: 5, price: 8000, relic: true, desc: "名品：汉宫旧物。运+5（唯一）" },
  "神兽镜":   { type: "acc", def: 3, int: 3, price: 8000, relic: true, desc: "名品：刻神兽纹的铜镜。防+3 智+3（唯一）" },
  "玉玺":     { type: "acc", price: 30000, nosell: true, relic: true, desc: "传国玉玺：受命于天，既寿永昌。（不可装备不可出售，收藏）" },
  // 头盔（def，约为同代铠甲一半）
  "皮帽":   { type: "helmet", def: 1,  price: 100,   desc: "皮革软帽，防御+1" },
  "铁盔":   { type: "helmet", def: 3,  price: 600,   desc: "铁打兜鍪，防御+3" },
  "钢盔":   { type: "helmet", def: 5,  price: 1800,  desc: "钢锻战盔，防御+5" },
  "玄铁盔": { type: "helmet", def: 9,  price: 4000,  desc: "玄铁重盔，防御+9" },
  "白银盔": { type: "helmet", def: 14, price: 9000,  desc: "白银亮盔，防御+14" },
  "龙鳞盔": { type: "helmet", def: 20, price: 20000, desc: "龙鳞宝盔，防御+20" },
  // 护腿（def，约为同代铠甲一半）
  "布护腿":   { type: "legs", def: 1,  price: 120,   desc: "粗布裹腿，防御+1" },
  "皮护腿":   { type: "legs", def: 2,  price: 550,   desc: "皮革护腿，防御+2" },
  "铁护腿":   { type: "legs", def: 4,  price: 1500,  desc: "铁叶护腿，防御+4" },
  "钢护腿":   { type: "legs", def: 8,  price: 3600,  desc: "钢锻护腿，防御+8" },
  "白银护腿": { type: "legs", def: 12, price: 8500,  desc: "白银护腿，防御+12" },
  "龙鳞护腿": { type: "legs", def: 18, price: 19000, desc: "龙鳞护腿，防御+18" },
  // 消耗道具（heal 治疗 / mp 回蓝 / revive 复活比例 / dmgAll 固定群伤 / mat 素材）
  "草药":   { type: "item", heal: 40,  price: 50,  desc: "回复40点HP" },
  "金疮药": { type: "item", heal: 120, price: 180, desc: "回复120点HP" },
  "还魂丹": { type: "item", heal: 300, price: 500, desc: "回复300点HP" },
  "仙草露": { type: "item", heal: "full", price: 1500, desc: "HP 全部回复" },
  "甘露":   { type: "item", mp: 40,    price: 300, desc: "回复40点MP" },
  "清泉":   { type: "item", mp: 15,    price: 120, desc: "回复15点MP" },
  "火药弹": { type: "item", dmgAll: 80, price: 400, desc: "敌全体80点伤害（战斗中用）" },
  "诸葛连弩图": { type: "item", dmgAll: 200, price: 800, desc: "敌全体200点伤害（战斗中用）" },
  "返魂香": { type: "item", revive: 0.5, price: 600, desc: "复活队友并回复50%HP（第九章起售）" },
  "精铁":   { type: "item", mat: true, price: 300, desc: "武器强化素材（第十章铁匠铺）" },
  "箭":     { type: "item", price: 0, nosell: true, desc: "草船借来的箭（剧情道具）" },
  // 渡魂记（05 文档：四遗物 + 关联物件；relic 为收集预留标记，flag 制"得过即算"）
  "焦黑的木牌":   { type: "item", price: 0, nosell: true, relic: true,
                    desc: "渡魂遗物：正面刻着模糊的'心'字，背面小字'若有一日我迷途，请以此牌渡我。'" },
  "黄纸符":       { type: "item", price: 0, nosell: true,
                    desc: "歪歪扭扭的'心'字，笔迹像是在哪儿见过。（泗水古道曹军掉落）" },
  "荀彧的残信":   { type: "item", price: 0, nosell: true, relic: true,
                    desc: "渡魂遗物：烧了一半的信。'荀文若，你已经死了。坐在这里的，只是一个忘了初心的人。'" },
  "郑玄竹简":     { type: "item", price: 0, nosell: true, relic: true,
                    desc: "渡魂遗物：郑玄临终前注的《论语》残卷，'士不可以不弘毅'。" },
  "干枯的白莲":   { type: "item", price: 0, nosell: true, relic: true,
                    desc: "渡魂遗物：花瓣上有墨痕——'生逢其时的人不懂，死在时代前面的人有多累。'" },
  "破碎的铜镜":   { type: "item", price: 0, nosell: true, relic: true,
                    desc: "明镜观旧物。背面刻着：'镜花水月，终不敌人间一瞬烟火。'" },
  "遗物包裹":     { type: "item", price: 0, nosell: true,
                    desc: "诸葛亮托付的布包：四件遗物，一个交代。'埋在花开得最多的地方。'" },
  "白莲之种":     { type: "acc", price: 0, nosell: true, relic: true,
                    desc: "渡魂终章：一片发光的花瓣，上有小字'替我跟师父说——我没忘。'每场战斗一次，全队力竭时自动重整旗鼓，恢复30%兵力（唯一）" },
  // 计策书（type: book，道具页给指定角色习得对应谋略，不可重复）
  "火计书": { type: "book", skill: "huoji",  price: 800,  desc: "习得：火计" },
  "水计书": { type: "book", skill: "shuiji", price: 1000, desc: "习得：水计" },
  "落石书": { type: "book", skill: "luoshi", price: 1000, desc: "习得：落石" },
  "风计书": { type: "book", skill: "fengji", price: 1200, desc: "习得：风计" },
  "雷计书": { type: "book", skill: "leiji",  price: 2000, desc: "习得：雷计" },
  "石阵书": { type: "book", skill: "baguazhen", price: 2500, desc: "习得：八卦阵" },
};

const SHOPS = {
  // 序章 · 徐州城（铜代际；首城只卖本代）
  ch00_inn:    { type: "inn", cost: 30, text: "客官，住店吗？30金一晚，包你精神百倍。" },
  ch00_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["铜剑", "铁剑"], text: "客官，看看兵器？买了立刻给好汉配上。" },
  ch00_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["布衣", "皮甲", "皮帽", "布护腿"], text: "衣甲帽靴，样样保命，客官请。" },
  ch00_item:   { type: "item", stock: ["草药"], text: "草药便宜卖了，出门必备。" },
  // 第一章 · 郯城（铁代际 + 上一代铜）
  ch01_inn:    { type: "inn", cost: 60, text: "兵荒马乱的，60金一晚，热水管够。" },
  ch01_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["铁剑", "铜剑"], text: "曹军势大，不添点铁器怎么行？" },
  ch01_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["皮盾", "铁甲", "铁盔", "皮护腿", "皮甲", "皮帽", "布护腿"], text: "铁器皮货都有，客官慢挑。" },
  ch01_item:   { type: "item", stock: ["草药", "金疮药"], text: "金疮药是新到的伤药，疗伤有奇效。" },
  // 第二章 · 小沛（钢代际 + 上一代铁）
  ch02_inn:    { type: "inn", cost: 80, text: "小沛地方小，80金一晚，委屈客官了。" },
  ch02_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["钢剑", "铁剑"], text: "钢器难得，价钱是不便宜，可保命啊。" },
  ch02_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["钢甲", "钢盔", "铁护腿", "护心镜", "铁甲", "铁盔", "皮护腿"], text: "钢甲铁盔，都是好货色。" },
  ch02_item:   { type: "item", stock: ["草药", "金疮药"], text: "药材都有些，客官看着挑。" },
  // 第二章 · 下邳城（钢代际，与 小沛 同价）
  ch02b_inn:    { type: "inn", cost: 80, text: "下邳大城，80金一晚，住得舒坦。" },
  ch02b_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["钢剑", "铁剑"], text: "钢剑钢甲，都是好货色。" },
  ch02b_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["钢甲", "钢盔", "铁护腿", "护心镜", "铁甲", "铁盔", "皮护腿"], text: "钢甲钢盔护心镜，客官请。" },
  ch02b_item:   { type: "item", stock: ["草药", "金疮药"], text: "药材齐备，客官请便。" },
  // 第三章 · 许都（大商店：钢+代 精钢/玄铁 + 上一代钢）
  ch03_inn:    { type: "inn", cost: 120, text: "许都繁华，120金一晚，酒水齐全。" },
  ch03_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["精钢剑", "钢剑"], text: "许都大店，南北好货都有，客官慢挑。" },
  ch03_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["玄铁甲", "玄铁盔", "钢护腿", "玉佩", "钢甲", "钢盔", "铁护腿", "护心镜"], text: "玄铁精工，京城独一份。" },
  ch03_item:   { type: "item", stock: ["草药", "金疮药", "清泉", "火药弹"], text: "清泉润喉，火药防身，都是时新货。" },
  // 第五章 · 洛阳（精钢/玄铁 + 上一代钢；还魂丹上线）
  ch05_inn:    { type: "inn", cost: 150, text: "洛阳古都，150金一晚，马虎不得。" },
  ch05_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["玄铁剑", "精钢剑", "钢剑"], text: "玄铁精钢，关内难寻。" },
  ch05_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["玄铁甲", "玄铁盔", "钢护腿", "玉佩", "钢甲", "钢盔", "铁护腿"], text: "玄铁细铠，洛阳名品。" },
  ch05_item:   { type: "item", stock: ["金疮药", "还魂丹", "清泉"], text: "还魂丹千金难求，客官要不要备一颗？" },
  // 第五章 · 古城（小旅店）
  ch05g_inn:   { type: "inn", cost: 100, text: "古城虽小，100金一晚，被褥干净。" },
  // 第六章 · 新野 / 襄阳（文房铺卖计策书）
  ch06_inn:    { type: "inn", cost: 150, text: "新野小城，150金一晚，客官歇息。" },
  ch06_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["玄铁剑", "精钢剑", "钢剑"], text: "新野地僻，这些是压箱底的好货。" },
  ch06_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["玄铁甲", "玄铁盔", "钢护腿", "玉佩", "钢甲", "钢盔", "铁护腿"], text: "衣甲齐全，客官请便。" },
  ch06_item:   { type: "item", stock: ["金疮药", "还魂丹", "清泉"], text: "药材齐备，客官请便。" },
  ch06_book:   { type: "item", stock: ["火计书", "水计书", "落石书", "风计书", "雷计书", "石阵书"], text: "文房铺中，计策书六卷，识货的自来。" },
  ch06b_inn:   { type: "inn", cost: 180, text: "襄阳大城，180金一晚。" },
  // 第七章 · 新野战时商店（兵荒马乱，全线 +20%）
  ch07_inn:    { type: "inn", cost: 180, text: "兵荒马乱的，180金一晚，热水照供。" },
  ch07_weapon: { type: "equip", title: "武器店", filter: ["weapon"], priceMult: 1.2, stock: ["玄铁剑", "精钢剑", "钢剑"], text: "战事吃紧，价钱涨了两成，客官莫怪。" },
  ch07_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], priceMult: 1.2, stock: ["玄铁甲", "玄铁盔", "钢护腿", "玉佩", "钢甲", "钢盔", "铁护腿"], text: "物资紧张，涨了两成，仍是保命要紧。" },
  ch07_item:   { type: "item", priceMult: 1.2, stock: ["金疮药", "还魂丹", "清泉", "火药弹"], text: "物资紧张，涨了两成，仍是保命要紧。" },
  // 第八章 · 柴桑（白银代际 + 上一代玄铁）
  ch08_inn:    { type: "inn", cost: 220, text: "柴桑临江，220金一晚，江景上房。" },
  ch08_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["白银剑", "精钢剑"], text: "白银精工，江东最好的铁器都在这了。" },
  ch08_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["白银铠", "白银盔", "白银护腿", "玉佩", "玄铁甲", "玄铁盔", "钢护腿"], text: "白银衣甲，江上无双。" },
  ch08_item:   { type: "item", stock: ["金疮药", "还魂丹", "甘露", "仙草露", "诸葛连弩图"], text: "甘露仙草，连弩图谱，客官好眼光。" },
  // 第九章 · 四郡集市（弓系上线、返魂香开售；黑市游商贵五成）
  ch09_inn:    { type: "inn", cost: 260, text: "荆南地界，260金一晚，图个安稳。" },
  ch09_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["白银剑", "铁刀", "铁矛", "铁枪", "铁脊弓", "羽扇", "精钢剑"], text: "四郡集市，刀枪矛弓扇，各系齐备。" },
  ch09_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["白银铠", "白银盔", "白银护腿", "玉佩", "玄铁甲", "玄铁盔", "钢护腿"], text: "衣甲帽靴，南货北货都有。" },
  ch09_item:   { type: "item", stock: ["金疮药", "还魂丹", "甘露", "返魂香"], text: "返魂香能救命，客官备一支？" },
  ch09_black:  { type: "equip", priceMult: 1.5, stock: ["白银剑", "白银铠", "太平清领道", "毛公鼎", "长信宫灯", "神兽镜", "玉玺"], text: "荆州游商：好货不便宜，概不还价。（固定两件，贵五成）" },
  // 第十章 · 成都大宝库（龙泉代际 + 上一代白银）
  ch10_inn:    { type: "inn", cost: 300, text: "天府之国，300金一晚，巴适得很。" },
  ch10_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["龙泉剑", "白银剑"], text: "成都大宝库，龙泉镇店。" },
  ch10_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["龙鳞铠", "龙鳞盔", "龙鳞护腿", "玉佩", "白银铠", "白银盔", "白银护腿"], text: "龙鳞宝铠，镇店之宝。" },
  ch10_item:   { type: "item", stock: ["还魂丹", "仙草露", "甘露", "返魂香", "精铁"], text: "仙草返魂，还有精铁少许。" },
  ch10b_inn:   { type: "inn", cost: 240, text: "涪城小店，240金一晚。" },
  // 第十一章 · 汉中军需（终极常规装备 + 名品限量）
  ch11_inn:    { type: "inn", cost: 350, text: "汉中军需客栈，350金一晚。" },
  ch11_weapon: { type: "equip", title: "武器店", filter: ["weapon"], stock: ["龙泉剑", "雌雄双股剑", "龙胆枪", "七星剑", "白银剑"], text: "军需官：名品限量，只卖识货之人。" },
  ch11_armor:  { type: "equip", title: "防具店", filter: ["armor", "helmet", "legs", "acc"], stock: ["龙鳞铠", "龙鳞盔", "龙鳞护腿", "诸葛巾", "白银铠", "白银盔", "白银护腿"], text: "军需官：宝铠宝盔，北伐专用。" },
  ch11_item:   { type: "item", stock: ["仙草露", "甘露", "返魂香", "诸葛连弩图"], text: "军需药材，北伐专用。" },
  // 通用村店（所有野外村庄共用）
  vil_inn:     { type: "inn", cost: 50, text: "村店简陋，50金一晚，被褥倒是干净。" },
  vil_item:    { type: "item", stock: ["草药", "金疮药", "清泉"], text: "村里的小药铺，土药齐全。" },
};

if (typeof module !== "undefined") module.exports = { ITEMS: ITEMS, SHOPS: SHOPS };
