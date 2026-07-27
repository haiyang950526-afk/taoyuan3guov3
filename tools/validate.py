#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""桃园三国 · 数据校验（Python 标准库，正则提取，不解析 JS）

校验项：
  1. 地图所有行等宽、字符均为已知地块
  2. 传送点目标存在、落点可通行、且不在目标图的传送块上
  3. NPC 落在可通行格且至少有一格可通行邻格
  4. 商店/宝箱/遇敌组/Boss 编组/触发器引用的物品与敌人 ID 都存在
  5. 章节任务链引用的地图存在；say/linesKey 台词路径存在
用法：python tools/validate.py（在 rpg/ 目录下运行）
"""

import glob
import io
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
RPG = os.path.dirname(BASE)

PASS_TILES = set("GCEFM.,Lhczsn")   # TILE_META 中 pass:true 的字符
ALL_TILES = set("#BDGTWRCEFPM.,LXvhtcfokabwrquzsnyij")

errors = []
checks = [0]

def check(ok, msg):
    checks[0] += 1
    if not ok:
        errors.append(msg)
        print("  [FAIL] " + msg)

def read(path):
    with io.open(path, encoding="utf-8") as f:
        return f.read()

# ---------- 解析数据文件 ----------
def parse_enemies():
    src = read(os.path.join(RPG, "data", "enemies.js"))
    names = set(re.findall(r'"([^"]+)":\s*\{\s*lv:', src))
    groups = set(re.findall(r'(\w+):\s*\{\s*(?:enemies|waves):', src))
    group_members = {}
    for m in re.finditer(r'(\w+):\s*\{\s*enemies:\s*\[([^\]]*)\]', src):
        group_members[m.group(1)] = re.findall(r'"([^"]+)"', m.group(2))
    for m in re.finditer(r'(\w+):\s*\{\s*waves:\s*(\[.*?\])\s*,', src):
        group_members[m.group(1)] = re.findall(r'"([^"]+)"', m.group(2))
    # 去掉注释行再匹配，避免命中头注释里的 schema 示例
    code = "\n".join(l for l in src.splitlines() if not l.strip().startswith("//"))
    drop_items = []
    for d in re.findall(r'drops:\s*\[([^\]]*)\]', code):
        drop_items += re.findall(r'item:\s*"([^"]+)"', d)
    # 连战 chain 引用的编组
    chain_refs = []
    for c in re.findall(r'chain:\s*\[([^\]]*)\]', code):
        chain_refs += re.findall(r'"([^"]+)"', c)
    # 波次 waves 引用的敌人
    wave_enemies = []
    for wline in re.findall(r'waves:\s*(\[.+?\])\s*[,}]', code):
        wave_enemies += re.findall(r'"([^"]+)"', wline)
    # 收服战 joins 引用的角色
    recruit_joins = re.findall(r'joins:\s*"([^"]+)"', code)
    # 多形态 phases 引用的技能
    phase_skills = []
    for p in re.findall(r'phases:\s*(\[.+?\])\s*[,}]', code):
        for sk in re.findall(r'skills:\s*\[([^\]]*)\]', p):
            phase_skills += re.findall(r'"([^"]+)"', sk)
    return names, group_members, drop_items, chain_refs, wave_enemies, recruit_joins, phase_skills

def parse_heroes():
    src = read(os.path.join(RPG, "data", "heroes.js"))
    return set(re.findall(r'"([^"]+)":\s*\{', src))

def parse_skills():
    src = read(os.path.join(RPG, "data", "skills.js"))
    return set(re.findall(r'(\w+):\s*\{\s*name:', src))

def parse_items():
    src = read(os.path.join(RPG, "data", "items.js"))
    items = set(re.findall(r'"([^"]+)":\s*\{\s*type:', src))
    shops = set(re.findall(r'(\w+):\s*\{\s*type:\s*"(?:inn|equip|item)"', src))
    stocks = re.findall(r'stock:\s*\[([^\]]*)\]', src)
    stock_ids = []
    for s in stocks:
        stock_ids += re.findall(r'"([^"]+)"', s)
    return items, shops, stock_ids

def parse_text():
    src = read(os.path.join(RPG, "data", "text.js"))
    sections = re.findall(r'^  (\w+): \{$', src, re.M)
    keys = re.findall(r'^    (\w+): \[$', src, re.M)
    # 内层键归属最近的分节（按出现顺序即可满足校验需求）
    paths = set()
    cur = None
    for m in re.finditer(r'^(  (\w+): \{|    (\w+): \[)', src, re.M):
        if m.group(2):
            cur = m.group(2)
        elif m.group(3) and cur:
            paths.add(cur + "." + m.group(3))
    return paths

def parse_chapters():
    src = read(os.path.join(RPG, "data", "chapters.js"))
    maps_lists = re.findall(r'maps:\s*\[([^\]]*)\]', src)
    chapter_maps = []
    for m in maps_lists:
        chapter_maps += re.findall(r'"([^"]+)"', m)
    points = re.findall(r'(?:start|home):\s*\{\s*map:\s*"([^"]+)",\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}', src)
    return chapter_maps, points

def parse_map(path):
    src = read(path)
    key = os.path.splitext(os.path.basename(path))[0]
    grid_m = re.search(r'grid:\s*\[(.*?)\]', src, re.S)
    grid = re.findall(r'"([^"]*)"', grid_m.group(1)) if grid_m else []
    npcs = [(m.group(1), int(m.group(2)), int(m.group(3)))
            for m in re.finditer(r'\{\s*id:\s*"([^"]+)",\s*x:\s*(\d+),\s*y:\s*(\d+)', src)]
    transitions = []
    triggers = []
    for line in src.splitlines():
        if "to:" in line:
            sm = re.search(r'\{\s*x:\s*(\d+),\s*y:\s*(\d+)', line)
            dm = re.search(r'to:\s*\{\s*map:\s*"([^"]+)",\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}', line)
            if sm and dm:
                transitions.append((int(sm.group(1)), int(sm.group(2)),
                                    dm.group(1), int(dm.group(2)), int(dm.group(3))))
        elif re.search(r'\{\s*x:\s*(\d+),\s*y:\s*(\d+),\s*if:', line):
            tm = re.search(r'\{\s*x:\s*(\d+),\s*y:\s*(\d+)', line)
            triggers.append((int(tm.group(1)), int(tm.group(2))))
    chests = []
    for m in re.finditer(r'\{\s*x:\s*(\d+),\s*y:\s*(\d+),\s*id:\s*"([^"]+)"([^}]*)\}', src):
        items = re.findall(r'"([^"]+)":\s*\d+', m.group(4))
        chests.append((int(m.group(1)), int(m.group(2)), m.group(3), items))
    shops = re.findall(r'shop:\s*"([^"]+)"', src)
    bosses = re.findall(r'boss:\s*"([^"]+)"', src)
    battles = re.findall(r'battle:\s*"([^"]+)"', src)
    says = re.findall(r'say:\s*"([^"]+)"', src) + re.findall(r'linesKey:\s*"([^"]+)"', src)
    encounters = []
    em = re.search(r'encounterGroups:\s*(\[.*\])', src)
    if em:
        encounters = re.findall(r'"([^"]+)"', em.group(1))
    facilities = re.findall(r'facility:\s*"(\w+)"', src)
    minigames = re.findall(r'minigame:\s*"(\w+)"', src)
    escape_penalties = re.findall(r'penalty:\s*"([^"]+)"', src)
    # 条件地块覆盖（tileOverrides）：{(x, y): ch}，条件地块按 ch 的通行性计
    overrides = {}
    for m in re.finditer(r'\{\s*x:\s*(\d+),\s*y:\s*(\d+),\s*ch:\s*"([^"]+)",\s*if:', src):
        overrides[(int(m.group(1)), int(m.group(2)))] = m.group(3)
    return {"key": key, "grid": grid, "npcs": npcs, "transitions": transitions,
            "triggers": triggers, "chests": chests, "shops": shops,
            "bosses": bosses, "battles": battles, "says": says,
            "encounters": encounters, "facilities": facilities,
            "minigames": minigames, "escape_penalties": escape_penalties,
            "overrides": overrides}

# ---------- 主流程 ----------
def main():
    (enemy_names, battle_groups, drop_items, chain_refs,
     wave_enemies, recruit_joins, phase_skills) = parse_enemies()
    item_ids, shop_ids, stock_ids = parse_items()
    hero_keys = parse_heroes()
    skill_ids = parse_skills()
    text_paths = parse_text()
    chapter_maps, chapter_points = parse_chapters()

    # Boss 编组引用的敌人必须存在
    for g, members in battle_groups.items():
        for e in members:
            check(e in enemy_names, "编组 %s 引用了不存在的敌人：%s" % (g, e))
    # 商店库存引用的物品必须存在
    for sid in stock_ids:
        check(sid in item_ids, "商店库存引用了不存在的物品：%s" % sid)
    # 掉落表引用的物品必须存在
    for d in drop_items:
        check(d in item_ids, "掉落表引用了不存在的物品：%s" % d)
    # 连战/波次/收服/多形态引用
    for c in chain_refs:
        check(c in battle_groups, "连战 chain 引用了不存在的编组：%s" % c)
    for e in wave_enemies:
        check(e in enemy_names, "波次 waves 引用了不存在的敌人：%s" % e)
    for j in recruit_joins:
        check(j in hero_keys, "收服战 joins 引用了不存在的角色：%s" % j)
    for s in phase_skills:
        check(s in skill_ids, "多形态 phases 引用了不存在的技能：%s" % s)
    # 强化素材必须存在
    check("精铁" in item_ids, "强化素材 精铁 未在 items.js 定义")

    maps = {}
    for path in sorted(glob.glob(os.path.join(RPG, "data", "maps", "*.js"))):
        m = parse_map(path)
        maps[m["key"]] = m
        print("校验地图 %s（%d 行）" % (m["key"], len(m["grid"])))

        # 1. 等宽 + 字符合法
        widths = set(len(r) for r in m["grid"])
        check(len(widths) == 1, "%s：地图行宽不一致 %s" % (m["key"], sorted(widths)))
        for y, row in enumerate(m["grid"]):
            for ch in row:
                check(ch in ALL_TILES, "%s：第 %d 行含未知地块字符 %r" % (m["key"], y, ch))

        h = len(m["grid"])
        w = len(m["grid"][0]) if h else 0

        def tile(x, y):
            if y < 0 or y >= h or x < 0 or x >= w:
                return "#"
            return m["overrides"].get((x, y), m["grid"][y][x])

        trans_src = set((t[0], t[1]) for t in m["transitions"])
        # 2. 传送点：源格可通行；目标图存在、落点可通行、不在目标图传送块上
        for (sx, sy, dmap, dx, dy) in m["transitions"]:
            check(tile(sx, sy) in PASS_TILES,
                  "%s：传送源 (%d,%d) 不可通行" % (m["key"], sx, sy))
            check(dmap in maps or os.path.exists(
                os.path.join(RPG, "data", "maps", dmap + ".js")),
                "%s：传送目标地图不存在：%s" % (m["key"], dmap))
        # 3. NPC：可通行格 + 有可通行邻格
        for (nid, nx, ny) in m["npcs"]:
            check(tile(nx, ny) in PASS_TILES,
                  "%s：NPC %s 落在不可通行格 (%d,%d)" % (m["key"], nid, nx, ny))
            nb = any(tile(nx + d[0], ny + d[1]) in PASS_TILES
                     for d in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            check(nb, "%s：NPC %s 四周无可通行格 (%d,%d)" % (m["key"], nid, nx, ny))
        # 触发器坐标可通行
        for (tx, ty) in m["triggers"]:
            check(tile(tx, ty) in PASS_TILES,
                  "%s：触发器 (%d,%d) 不可通行" % (m["key"], tx, ty))
        # 宝箱在界内
        for (cx, cy, cid, items) in m["chests"]:
            check(0 <= cx < w and 0 <= cy < h,
                  "%s：宝箱 %s 越界 (%d,%d)" % (m["key"], cid, cx, cy))
            for it in items:
                check(it in item_ids, "%s：宝箱 %s 含未知物品 %s" % (m["key"], cid, it))
        # 4. 引用存在
        for sid in m["shops"]:
            check(sid in shop_ids, "%s：引用了不存在的商店 %s" % (m["key"], sid))
        for b in m["bosses"] + m["battles"]:
            check(b in battle_groups, "%s：引用了不存在的战斗编组 %s" % (m["key"], b))
        for e in m["encounters"]:
            check(e in enemy_names, "%s：遇敌组含未知敌人 %s" % (m["key"], e))
        for p in m["says"]:
            check(p in text_paths, "%s：台词路径不存在 %s" % (m["key"], p))
        # 设施类型合法；限时脱出惩罚编组存在；小游戏类型合法
        for f in m["facilities"]:
            check(f in ("camp", "smith", "tavern", "dojo"), "%s：未知设施类型 %s" % (m["key"], f))
        for p in m["escape_penalties"]:
            check(p in battle_groups, "%s：限时脱出 penalty 引用未知编组 %s" % (m["key"], p))
        for g in m["minigames"]:
            check(g in ("hunt", "collect"), "%s：未知小游戏类型 %s" % (m["key"], g))

    # 跨图校验：传送落点可通行、且不在目标图传送块上
    for m in maps.values():
        for (sx, sy, dmap, dx, dy) in m["transitions"]:
            if dmap not in maps:
                continue
            t = maps[dmap]
            th = len(t["grid"]); tw = len(t["grid"][0]) if th else 0
            ok = 0 <= dx < tw and 0 <= dy < th and t["grid"][dy][dx] in PASS_TILES
            check(ok, "%s→%s：落点 (%d,%d) 不可通行" % (m["key"], dmap, dx, dy))
            t_src = set((tt[0], tt[1]) for tt in t["transitions"])
            check((dx, dy) not in t_src,
                  "%s→%s：落点 (%d,%d) 踩在目标图传送块上" % (m["key"], dmap, dx, dy))

    # 5. 章节任务链引用的地图存在；start/home 落点可通行
    for cm in chapter_maps:
        check(cm in maps, "章节表引用了不存在的地图：%s" % cm)
    for (pmap, px, py) in chapter_points:
        if pmap in maps:
            t = maps[pmap]
            ok = 0 <= int(px) < len(t["grid"][0]) and 0 <= int(py) < len(t["grid"]) \
                and t["grid"][int(py)][int(px)] in PASS_TILES
            check(ok, "章节落点 %s (%s,%s) 不可通行" % (pmap, px, py))
        else:
            check(False, "章节落点地图不存在：%s" % pmap)

    print("\n共 %d 项检查，%d 项失败" % (checks[0], len(errors)))
    # 图鉴用：宝箱总数统计（图鉴页显示 X/Y 的 Y）
    chest_total = sum(len(m["chests"]) for m in maps.values())
    print("宝箱总数：%d（图鉴收集计数基数）" % chest_total)
    if errors:
        print("校验未通过：")
        for e in errors:
            print("  - " + e)
        sys.exit(1)
    print("全部通过 [OK]")

if __name__ == "__main__":
    main()
