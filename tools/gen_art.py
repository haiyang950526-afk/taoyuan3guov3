#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 美术资产生成器（python tools/gen_art.py，在 rpg/ 目录下运行，依赖 Pillow）
# 生成两类像素风资产，风格与 engine/sprites.js 立绘系统一致：
#   assets/portraits/<名字>.png  对话头像（24×28 胸像点阵 ×6 = 144×168，透明底）
#   assets/illust/chXX.png       章节通关插画（160×90 ×3 = 480×270）
#   assets/illust/end.png        终章谢幕插画（星落五丈原）
# 同时写出 data/portraits.js（说话人 → 头像路径注册表，引擎 ui.js 使用）。
# 头像来源：data/heroes.js 的 look、data/enemies.js 的 Boss（按兵种推导）、
# 以及下方 STORY_LOOKS 的剧情角色；想换更精致的图，直接替换同名 PNG 即可。
import json
import os
import re

from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.abspath(__file__))
RPG = os.path.join(BASE, "..")
OUT_PORTRAIT = os.path.join(RPG, "assets", "portraits")
OUT_ILLUST = os.path.join(RPG, "assets", "illust")

# ---------------- 通用 ----------------
def shade(hexs, f):
    n = int(hexs[1:], 16)
    r, g, b = (n >> 16) & 255, (n >> 8) & 255, n & 255
    return "#%02x%02x%02x" % (int(r * f), int(g * f), int(b * f))


# ---------------- 胸像（24×28 点阵） ----------------
PW, PH, PSCALE = 24, 28, 6


def bust_grid(look, color):
    """按 look（head/beard/hair）与服装色合成胸像点阵，返回字符行列表。"""
    g = [["."] * PW for _ in range(PH)]

    def rect(x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < PW and 0 <= y < PH:
                    g[y][x] = ch

    # 头发（头顶 + 两侧垂发）
    rect(7, 2, 16, 6, "H")
    rect(6, 4, 7, 12, "H")
    rect(16, 4, 17, 12, "H")
    # 脸 + 耳朵
    rect(8, 6, 15, 15, "S")
    rect(7, 10, 7, 11, "S")
    rect(16, 10, 16, 11, "S")
    # 眉、眼、鼻、嘴
    rect(9, 9, 10, 9, "H")
    rect(13, 9, 14, 9, "H")
    rect(9, 10, 10, 11, "E")
    rect(13, 10, 14, 11, "E")
    rect(11, 12, 12, 13, "N")
    rect(10, 14, 13, 14, "N")
    # 颈
    rect(10, 16, 13, 17, "S")
    rect(10, 17, 13, 17, "N")
    # 肩/胸（梯形）
    rect(6, 18, 17, 18, "C")
    rect(5, 19, 18, 19, "C")
    rect(4, 20, 19, 21, "C")
    rect(3, 22, 20, 23, "C")
    rect(2, 24, 21, 27, "C")
    # 领口
    rect(10, 18, 13, 18, "F")
    rect(11, 19, 12, 19, "F")
    # 下摆阴影
    rect(2, 27, 21, 27, "D")

    head = look.get("head", "none")
    if head == "helmet":
        rect(6, 1, 17, 6, "M")
        rect(6, 7, 7, 12, "M")
        rect(16, 7, 17, 12, "M")
        rect(11, 0, 12, 0, "R")
    elif head == "bandana":
        rect(6, 2, 17, 4, "C")
        rect(6, 5, 7, 6, "C")
        rect(16, 5, 17, 6, "C")
    elif head == "crown":
        rect(10, 0, 13, 3, "G")
        rect(7, 4, 16, 4, "G")
    elif head == "lunjin":
        rect(7, 0, 16, 3, "C")
        rect(6, 4, 7, 7, "C")
        rect(16, 4, 17, 7, "C")
    elif head == "hat":
        rect(9, 1, 14, 1, "L")
        rect(6, 2, 17, 2, "L")
        rect(4, 3, 19, 3, "L")

    beard = look.get("beard", "none")
    if beard == "small":
        rect(9, 14, 14, 14, "B")
        rect(10, 15, 13, 15, "B")
    elif beard == "long":
        rect(10, 13, 13, 13, "B")
        rect(9, 14, 14, 15, "B")
        rect(10, 16, 13, 19, "B")
        rect(11, 20, 12, 22, "B")
    elif beard == "bushy":
        rect(9, 13, 14, 13, "B")
        rect(8, 14, 15, 16, "B")
        rect(9, 17, 14, 18, "B")

    return ["".join(row) for row in g]


def bust_palette(look, color):
    skin = "#e8c49a"
    return {
        "H": look.get("hair", "#26201c"), "S": skin, "N": shade(skin, 0.78),
        "E": "#26232a", "C": color, "D": shade(color, 0.62),
        "B": look.get("hair", "#26201c"), "M": "#c9ced8", "G": "#e8c84a",
        "F": "#f2f0e4", "L": "#6a4a2a", "R": "#c0392b",
    }


def render_bust(look, color, path):
    grid = bust_grid(look, color)
    pal = bust_palette(look, color)
    img = Image.new("RGBA", (PW, PH), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch in pal:
                px[x, y] = Image.new("RGBA", (1, 1), pal[ch]).getpixel((0, 0))
    img = img.resize((PW * PSCALE, PH * PSCALE), Image.NEAREST)
    img.save(path)


# ---------------- 数据来源 ----------------
def parse_heroes():
    src = open(os.path.join(RPG, "data", "heroes.js"), encoding="utf-8").read()
    heroes = {}
    for m in re.finditer(
            r'"([^"]+)":\s*\{\s*\n\s*color:\s*"(#[0-9a-fA-F]{6})"(?:[^)]*?)?'
            r'look:\s*\{(.*?)\},', src, re.S):
        name, color, look_raw = m.group(1), m.group(2), m.group(3)
        look = dict(re.findall(r'(\w+):\s*"(\w+)"', look_raw))
        heroes[name] = (look, color)
    return heroes


def parse_enemy_bosses(heroes):
    src = open(os.path.join(RPG, "data", "enemies.js"), encoding="utf-8").read()
    bosses = {}
    by_ai = {
        "archer": {"head": "bandana"},
        "strategist": {"head": "hat"},
        "caster": {"head": "lunjin"},
        "heavy": {"head": "helmet", "beard": "bushy"},
        "brute": {"head": "helmet"},
    }
    for m in re.finditer(r'^\s+"([^"]+)":\s*\{(.*)$', src, re.M):
        name, line = m.group(1), m.group(2)
        if "boss: true" not in line:
            continue
        color = re.search(r'color:\s*"(#[0-9a-fA-F]{6})"', line).group(1)
        ai = re.search(r'ai:\s*"(\w+)"', line).group(1)
        base = re.split(r"[（(]", name)[0]
        if base in heroes:          # 张飞(误会)/黄忠(敌) 等复用角色造型
            bosses[name] = heroes[base]
            continue
        look = dict(by_ai.get(ai, by_ai["brute"]))
        look.setdefault("beard", "small")
        bosses[name] = (look, color)
    return bosses


# 剧情角色（不在 heroes/enemies 表内的说话人）
STORY_LOOKS = {
    "曹操": ({"head": "crown", "beard": "small"}, "#a03428"),
    "献帝": ({"head": "crown"}, "#c8a03a"),
    "司马徽": ({"head": "hat", "beard": "long", "hair": "#cfcfcf"}, "#8a8a7a"),
    "张昭": ({"head": "hat", "beard": "small"}, "#7a6a8a"),
    "吕布": ({"head": "crown", "beard": "small"}, "#b03a3a"),
    "刘表": ({"head": "hat", "beard": "small"}, "#5a7a5a"),
    "鲁肃": ({"head": "hat", "beard": "small"}, "#4a7a8a"),
    "刘璋": ({"head": "crown", "beard": "small"}, "#8a7a5a"),
    "蔡瑁": ({"head": "helmet", "beard": "small"}, "#3a5a5a"),
    "伊籍": ({"head": "hat"}, "#6a8a6a"),
    "虞翻": ({"head": "hat", "beard": "small"}, "#7a7a5a"),
    "步骘": ({"head": "hat"}, "#5a6a7a"),
    "薛综": ({"head": "hat", "beard": "small"}, "#6a5a7a"),
    "孙权": ({"head": "crown", "beard": "bushy", "hair": "#7a5a8a"}, "#3a6a4a"),
    "刘度": ({"head": "crown", "beard": "small"}, "#7a6a5a"),
    "童子": ({}, "#8ab8c8"),
    "士兵": ({"head": "helmet"}, "#7a6a5a"),
    "魏兵": ({"head": "helmet"}, "#4a5a7a"),
    "匪徒": ({"head": "bandana", "beard": "bushy"}, "#7a4a2a"),
}
# 通用称呼 → 复用头像
ALIASES = {
    "守军": "士兵", "追兵": "士兵",
    "魏将": "魏兵", "匪首": "匪徒",
}


# ---------------- 章节插画（160×90 ×3） ----------------
IW, IH, ISCALE = 160, 90, 3


def lerp(c1, c2, t):
    a, b = int(c1[1:], 16), int(c2[1:], 16)
    r = int((a >> 16 & 255) * (1 - t) + (b >> 16 & 255) * t)
    g = int((a >> 8 & 255) * (1 - t) + (b >> 8 & 255) * t)
    bl = int((a & 255) * (1 - t) + (b & 255) * t)
    return "#%02x%02x%02x" % (r, g, bl)


def sky(d, top, bottom, h=IH):
    for y in range(h):
        d.line([(0, y), (IW, y)], fill=lerp(top, bottom, y / max(1, h - 1)))


def starfield(d, seed, n, ymax, bright="#e8ecf4"):
    import random
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = rnd.randrange(IW), rnd.randrange(ymax)
        d.point((x, y), fill=bright)


def flame(d, x, y, s):
    """一簇火苗：外橙内黄。s 为高度（像素）。"""
    d.polygon([(x - s // 2, y), (x, y - s), (x + s // 2, y)], fill="#e86a2a")
    d.polygon([(x - s // 4, y), (x, y - s * 2 // 3), (x + s // 4, y)], fill="#f0c04a")


def scene_ch00(d):  # 序章 · 徐州剿匪：暮色城墙与烽火
    sky(d, "#2a2440", "#b0653a", 64)
    starfield(d, 1, 12, 20)
    d.rectangle([0, 64, IW, IH], fill="#1a1420")
    d.rectangle([20, 46, 140, 66], fill="#14101c")               # 城墙
    for x in range(20, 140, 8):                                  # 垛口
        d.rectangle([x, 42, x + 4, 46], fill="#14101c")
    d.rectangle([70, 52, 90, 66], fill="#0a080e")                # 门洞
    d.rectangle([108, 30, 110, 46], fill="#14101c")              # 旗杆
    d.polygon([(110, 30), (122, 33), (110, 37)], fill="#d8b93a")  # 黄旗
    for x in (34, 62, 98, 126):
        flame(d, x, 46, 6)


def scene_ch01(d):  # 第一章 · 父仇之火：火光中的村庄
    sky(d, "#1c1018", "#8a2a1a", 60)
    d.rectangle([0, 60, IW, IH], fill="#120c12")
    for hx, hw in ((18, 26), (62, 30), (110, 26)):               # 燃烧的屋顶
        d.rectangle([hx, 46, hx + hw, 62], fill="#0c080c")
        d.polygon([(hx - 3, 46), (hx + hw // 2, 34), (hx + hw + 3, 46)], fill="#0c080c")
        flame(d, hx + hw // 2, 40, 16)
        flame(d, hx + hw // 4, 46, 10)
    starfield(d, 2, 20, 30, "#e8a05a")


def scene_ch02(d):  # 第二章 · 三让徐州：雨中城门
    sky(d, "#2a3038", "#4a5560", 70)
    d.rectangle([0, 70, IW, IH], fill="#20242c")
    d.rectangle([48, 40, 112, 72], fill="#161a20")
    d.rectangle([66, 52, 94, 72], fill="#0a0d12")
    for x in range(48, 112, 8):
        d.rectangle([x, 36, x + 4, 40], fill="#161a20")
    import random
    rnd = random.Random(3)
    for _ in range(60):                                          # 雨丝
        x, y = rnd.randrange(IW), rnd.randrange(IH)
        d.line([(x, y), (x - 1, y + 4)], fill="#6a7a8a")
    d.ellipse([122, 46, 128, 52], fill="#e8c84a")                # 灯笼
    d.line([(125, 40), (125, 46)], fill="#161a20")


def scene_ch03(d):  # 第三章 · 寄人篱下：许都宫殿的阴云
    sky(d, "#3a3a44", "#5a5a66", 58)
    d.ellipse([20, 8, 90, 22], fill="#4a4a56")                   # 乌云
    d.ellipse([80, 2, 150, 18], fill="#44444f")
    d.rectangle([0, 58, IW, IH], fill="#262630")
    d.polygon([(30, 58), (80, 26), (130, 58)], fill="#14141c")   # 大殿重檐
    d.polygon([(44, 40), (80, 20), (116, 40)], fill="#1a1a24")
    d.rectangle([50, 58, 110, 74], fill="#101018")
    d.rectangle([76, 62, 84, 74], fill="#08080e")
    d.rectangle([78, 74, 82, 78], fill="#3a3a44")                # 阶下人影


def scene_ch04(d):  # 第四章 · 风云再散：断旗战场
    sky(d, "#6a5a3a", "#b09a5a", 62)
    d.rectangle([0, 62, IW, IH], fill="#3a3226")
    d.ellipse([120, 12, 142, 30], fill="#d8c08a")                # 昏日
    for x, h, torn in ((30, 26, True), (70, 34, True), (118, 22, True)):
        d.line([(x, 62 - h), (x, 62)], fill="#14100c", width=2)
        d.polygon([(x, 62 - h), (x + 14, 62 - h + 4), (x, 62 - h + 8)],
                  fill="#4a2030" if torn else "#20304a")
    for x in (48, 92, 140):                                      # 插地的矛
        d.line([(x, 50), (x + 3, 66)], fill="#14100c", width=1)


def scene_ch05(d):  # 第五章 · 千里走单骑：落日古道上的孤骑
    sky(d, "#4a2a3a", "#d0803a", 66)
    d.ellipse([66, 40, 94, 62], fill="#f0c06a")                  # 落日
    d.rectangle([0, 66, IW, IH], fill="#2a1c1c")
    d.polygon([(60, 90), (78, 66), (82, 66), (100, 90)], fill="#8a6a4a")  # 古道
    d.rectangle([128, 46, 156, 66], fill="#181018")              # 远处城关
    d.rectangle([138, 54, 148, 66], fill="#0a060a")
    # 骑手剪影（侧影奔马）
    h = "#0c080c"
    d.ellipse([28, 62, 48, 70], fill=h)                    # 马身
    d.polygon([(44, 64), (52, 55), (55, 57), (48, 66)], fill=h)  # 马颈
    d.rectangle([52, 54, 56, 58], fill=h)                  # 马头
    d.line([(28, 64), (23, 70)], fill=h, width=1)          # 马尾
    for lx, lo in ((30, 0), (34, 2), (43, 1), (47, 3)):    # 四条马腿
        d.line([(lx, 69), (lx + lo, 79)], fill=h, width=2)
    d.rectangle([36, 54, 41, 62], fill=h)                  # 骑手身体
    d.ellipse([36, 49, 41, 54], fill=h)                    # 骑手头


def scene_ch06(d):  # 第六章 · 卧龙出山：草庐与竹
    sky(d, "#4a6a5a", "#9ab8a0", 58)
    d.rectangle([0, 58, IW, IH], fill="#2a3a2e")
    d.rectangle([0, 50, IW, 56], fill="#7a9484")                 # 晨雾
    d.rectangle([56, 42, 96, 62], fill="#3a2e22")                # 草庐
    d.polygon([(50, 42), (76, 28), (102, 42)], fill="#5a4a32")
    d.rectangle([70, 50, 82, 62], fill="#1a140e")
    for bx in (16, 24, 130, 140):                                # 竹
        d.line([(bx, 20), (bx, 62)], fill="#3a5a3a", width=2)
        for ny in (28, 40, 52):
            d.point((bx - 1, ny), fill="#4a6a4a")


def scene_ch07(d):  # 第七章 · 火烧博望：满山野火
    sky(d, "#1a1420", "#4a1a10", 50)
    d.rectangle([0, 50, IW, IH], fill="#100c10")
    d.polygon([(0, 56), (40, 38), (90, 48), (140, 36), (160, 44), (160, 90), (0, 90)],
              fill="#0a080c")
    for fx, fs in ((24, 18), (52, 26), (84, 20), (116, 28), (142, 16)):
        flame(d, fx, 56, fs)
    starfield(d, 7, 24, 30, "#e8a05a")


def scene_ch08(d):  # 第八章 · 赤壁鏖兵：江上火船
    sky(d, "#141a2a", "#3a2a2a", 52)
    d.rectangle([0, 52, IW, IH], fill="#101826")                 # 江面
    d.ellipse([100, 34, 150, 54], fill="#c0522a")                # 岸边大火光
    for fx in range(104, 150, 7):                                # 火舌（避免读成落日）
        flame(d, fx, 50, 8)
    for y in range(54, 88, 4):                                   # 火光倒影
        d.line([(104, y), (146, y)], fill="#8a4a2a" if y % 8 else "#c06a3a")
    for sx, mh in ((24, 30), (52, 24), (76, 34)):                # 战船剪影
        d.rectangle([sx - 12, 58, sx + 12, 64], fill="#080c14")
        d.line([(sx, 58 - mh // 2), (sx, 58)], fill="#080c14", width=2)
        d.polygon([(sx, 58 - mh // 2), (sx + 8, 58 - mh // 4), (sx, 58 - 2)], fill="#0c1220")
    starfield(d, 8, 16, 24)


def scene_ch09(d):  # 第九章 · 荆南四郡：城头四旗
    sky(d, "#3a3a5a", "#c08a5a", 62)
    d.ellipse([70, 44, 90, 60], fill="#e8b06a")                  # 晨光
    d.rectangle([0, 62, IW, IH], fill="#241c24")
    d.rectangle([16, 44, 144, 64], fill="#181218")
    for x in range(16, 144, 8):
        d.rectangle([x, 40, x + 4, 44], fill="#181218")
    for bx, col in ((36, "#3f9e4d"), (68, "#c0392b"), (100, "#c8a03a"), (128, "#4a6ac0")):
        d.line([(bx, 24), (bx, 42)], fill="#0e0a0e", width=1)
        d.polygon([(bx, 24), (bx + 10, 27), (bx, 31)], fill=col)


def scene_ch10(d):  # 第十章 · 西川风云：蜀道群山
    sky(d, "#3a2a4a", "#c06a4a", 58)
    d.ellipse([66, 40, 94, 62], fill="#e89a5a")                  # 半山落日
    d.polygon([(0, 70), (30, 34), (60, 66), (90, 30), (120, 62), (160, 40), (160, 90), (0, 90)],
              fill="#241a30")
    d.polygon([(0, 80), (40, 56), (80, 78), (120, 52), (160, 74), (160, 90), (0, 90)],
              fill="#181222")
    d.line([(20, 88), (60, 74), (90, 80), (130, 68)], fill="#6a5a4a", width=1)  # 蜀道
    starfield(d, 10, 10, 18)


def scene_ch11(d, falling_big=False):  # 终章 · 五丈原：星落秋风
    sky(d, "#0a0e1c", "#1a2438", 70)
    starfield(d, 11, 90, 56)
    import random
    rnd = random.Random(12)
    for _ in range(30):                                          # 银河
        x = rnd.randrange(40, 130)
        y = int(0.25 * (x - 40) + rnd.randrange(-8, 9))
        if y < 56:
            d.point((x, y), fill="#aab8d8")
    d.rectangle([0, 70, IW, IH], fill="#0e1420")
    for tx in (30, 60, 105, 130):                                # 营帐
        d.polygon([(tx - 8, 72), (tx, 62), (tx + 8, 72)], fill="#1c2430")
    flame(d, 76, 74, 5)                                          # 残营孤火
    # 坠星
    if falling_big:
        d.line([(118, 8), (80, 52)], fill="#e8ecf4", width=2)
        d.ellipse([74, 48, 86, 60], fill="#f4f6ff")
        d.ellipse([70, 44, 90, 64], outline="#8a9ac0")
    else:
        d.line([(120, 10), (92, 40)], fill="#c8d4e8", width=1)
        d.ellipse([88, 38, 96, 46], fill="#e8ecf4")


SCENES = {
    "ch00": scene_ch00, "ch01": scene_ch01, "ch02": scene_ch02,
    "ch03": scene_ch03, "ch04": scene_ch04, "ch05": scene_ch05,
    "ch06": scene_ch06, "ch07": scene_ch07, "ch08": scene_ch08,
    "ch09": scene_ch09, "ch10": scene_ch10, "ch11": scene_ch11,
}


def render_scene(fn, path, **kw):
    img = Image.new("RGB", (IW, IH), "#000000")
    fn(ImageDraw.Draw(img), **kw)
    img.resize((IW * ISCALE, IH * ISCALE), Image.NEAREST).save(path)


# ---------------- 主流程 ----------------
def main():
    os.makedirs(OUT_PORTRAIT, exist_ok=True)
    os.makedirs(OUT_ILLUST, exist_ok=True)

    registry = {}
    heroes = parse_heroes()
    bosses = parse_enemy_bosses(heroes)

    groups = [("英雄", heroes), ("Boss", bosses), ("剧情", STORY_LOOKS)]
    for label, table in groups:
        for name, (look, color) in table.items():
            render_bust(look, color, os.path.join(OUT_PORTRAIT, name + ".png"))
            registry[name] = "assets/portraits/" + name + ".png"
        print("%s头像 %d 个" % (label, len(table)))
    for alias, target in ALIASES.items():
        if target in registry:
            registry[alias] = registry[target]

    for key, fn in SCENES.items():
        render_scene(fn, os.path.join(OUT_ILLUST, key + ".png"))
    render_scene(scene_ch11, os.path.join(OUT_ILLUST, "end.png"), falling_big=True)
    print("章节插画 %d 张" % (len(SCENES) + 1))

    reg_js = "// 由 tools/gen_art.py 自动生成：说话人 → 对话头像路径（勿手改）\n" \
        "\"use strict\";\nconst PORTRAIT_NAMES = " + \
        json.dumps(registry, ensure_ascii=False, indent=2) + ";\n" \
        "if (typeof module !== \"undefined\") module.exports = PORTRAIT_NAMES;\n"
    with open(os.path.join(RPG, "data", "portraits.js"), "w", encoding="utf-8") as f:
        f.write(reg_js)
    print("注册表 data/portraits.js（%d 条）" % len(registry))


if __name__ == "__main__":
    main()
