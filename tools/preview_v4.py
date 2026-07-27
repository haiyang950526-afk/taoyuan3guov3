# 工具 · V4 贴图静态预览：镜像 engine/map.js 的贴图逻辑，把整张地图渲成 PNG 供目检
# 用法: python tools/preview_v4.py ch00_city ch00_field ...
import re, sys, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GFX = os.path.join(ROOT, "assets", "gfx")
V4 = "v4/"
TILE = 32

PROP_IMG = {"f": "Props/Outdoor/wooden_fence.png", "o": "Props/Outdoor/rocks.png",
            "k": "Props/Outdoor/campfire.png", "a": "Props/Outdoor/haystack.png",
            "b": "Props/Outdoor/barrel.png", "w": "Props/Outdoor/wooden_crate.png",
            "r": "Props/Outdoor/rice_sack.png", "u": "Props/Outdoor/tombstone_stone.png",
            "q": "Props/Outdoor/battlefield_banner.png"}
FLOWERS = ["Props/Collectibles/flower_red_collectible.png",
           "Props/Collectibles/flower_yellow_collectible.png",
           "Props/Collectibles/flower_purple_collectible.png"]

_cache = {}
def img(path):
    if path not in _cache:
        _cache[path] = Image.open(os.path.join(GFX, path)).convert("RGBA")
    return _cache[path]

def th(x, y, n):
    return ((x * 7 + y * 13) % n + n) % n

def load_map(key):
    src = open(os.path.join(ROOT, "data", "maps", key + ".js"), encoding="utf-8").read()
    g = re.search(r'grid:\s*\[(.*?)\]', src, re.S).group(1)
    grid = re.findall(r'"([^"]*)"', g)
    signs = [{"x": int(x), "y": int(y), "text": t}
             for x, y, t in re.findall(r'\{\s*x:\s*(\d+),\s*y:\s*(\d+),\s*text:\s*"([^"]+)"', src)]
    bld = [{"img": i, "x": int(x), "y": int(y), "w": int(w), "h": int(h)}
           for i, x, y, w, h in re.findall(
               r'\{\s*img:\s*"([^"]+)",\s*x:\s*(\d+),\s*y:\s*(\d+),\s*w:\s*(\d+),\s*h:\s*(\d+)\s*\}', src)]
    ta = {}
    mta = re.search(r'tileArt:\s*\{([\s\S]*?)\}', src)
    if mta:
        for k, v in re.findall(r'"(\d+,\d+)":\s*"([^"]+)"', mta.group(1)):
            ta[k] = v
    return {"grid": grid, "signs": signs, "tileArt": ta, "buildings": bld}

class R:
    def __init__(self, m):
        self.g = m["grid"]; self.signs = m["signs"]; self.tileArt = m.get("tileArt", {})
        self.explicit_bld = m.get("buildings", [])
        js = "".join(self.g)
        self.kind = "cave" if "F" in js else ("interior" if "L" in js else "outdoor")
        self.stamps = []
        if self.kind == "outdoor":
            self._stamps()

    def tile(self, x, y):
        if y < 0 or y >= len(self.g) or x < 0 or x >= len(self.g[y]):
            return "#"
        return self.g[y][x]

    # ---- 建筑图章（镜像 buildingStamps） ----
    def _stamps(self):
        g = self.g; covered = set()
        def free(x, y, w, h):
            for yy in range(y, y + h):
                for xx in range(x, x + w):
                    if yy < 0 or yy >= len(g) or xx < 0 or xx >= len(g[yy]): return False
                    if (xx, yy) in covered: return False
                    if g[yy][xx] not in "BDGP": return False
            return True
        def push(im, x, y, w, h):
            self.stamps.append((im, x, y, w, h))
            for yy in range(y, y + h):
                for xx in range(x, x + w): covered.add((xx, yy))
        def free_any(x, y, w, h):
            return all(0 <= yy < len(g) and 0 <= xx < len(g[yy]) and (xx, yy) not in covered
                       for yy in range(y, y + h) for xx in range(x, x + w))
        for b in self.explicit_bld:
            if free_any(b["x"], b["y"], b["w"], b["h"]): push(b["img"], b["x"], b["y"], b["w"], b["h"])
        SHOP = {"武": "Buildings/Shops/weapon_shop_sword_sign_2x2.png",
                "装": "Buildings/Shops/equipment_shop_armor_sign_2x2.png",
                "客": "Buildings/Shops/inn_lantern_sign_2x2.png",
                "药": "Buildings/Shops/medicine_shop_gourd_sign_2x2.png",
                "酒": "Buildings/Shops/tavern_wine_jar_sign_2x2.png",
                "训": "Buildings/Shops/training_hall_banner_2x2.png",
                "编": "Buildings/Shops/formation_office_flag_roster_2x2.png"}
        for y in range(len(g)):
            x = 0
            while x < len(g[y]):
                ch = g[y][x]
                if ch in "PG" and (x == 0 or g[y][x - 1] != ch):
                    x1 = x
                    while x1 + 1 < len(g[y]) and g[y][x1 + 1] == ch: x1 += 1
                    im = "Buildings/Large/palace_main_hall_4x2.png" if ch == "P" \
                        else "Buildings/Large/city_gate_4x2.png"
                    cx, cy = (x + x1 + 1) // 2 - 2, (y - 1 if y > 0 else y)
                    ok = all(0 <= yy < len(g) and 0 <= xx < len(g[yy]) and (xx, yy) not in covered
                             for yy in range(cy, cy+2) for xx in range(cx, cx+4))
                    if ok: push(im, cx, cy, 4, 2)
                    x = x1
                x += 1
        for y in range(len(g)):
            for x in range(len(g[y])):
                if g[y][x] != "D": continue
                sg = next((s for s in self.signs if s["text"] in SHOP
                           and abs(s["x"] - x) <= 2 and s["y"] <= y and y - s["y"] <= 3), None)
                if not sg: continue
                if free(x - 1, y - 1, 2, 2): push(SHOP[sg["text"]], x - 1, y - 1, 2, 2)
                elif free(x, y - 1, 2, 2): push(SHOP[sg["text"]], x, y - 1, 2, 2)
        self.covered = covered
        # 足印锚点：连通 B/D 块每栋 1 个民居（门格/条件门优先，否则最下最左）
        ov_d = set()
        for o in getattr(self, "overrides", []): ov_d.add(o)
        seen = set(); self.anchors = set()
        for y in range(len(g)):
            for x in range(len(g[y])):
                if g[y][x] not in "BD" or (x, y) in covered or (x, y) in seen: continue
                cells, stack = [], [(x, y)]
                seen.add((x, y))
                while stack:
                    cx2, cy2 = stack.pop()
                    cells.append((cx2, cy2))
                    for dx, dy in ((0,-1),(0,1),(-1,0),(1,0)):
                        nx, ny = cx2+dx, cy2+dy
                        if ny < 0 or ny >= len(g) or nx < 0 or nx >= len(g[ny]): continue
                        if g[ny][nx] not in "BD" or (nx, ny) in covered or (nx, ny) in seen: continue
                        seen.add((nx, ny)); stack.append((nx, ny))
                door = next(((cx2, cy2) for cx2, cy2 in sorted(cells, key=lambda c: (-c[1], c[0]))
                             if g[cy2][cx2] == "D" or (cx2, cy2) in ov_d), None)
                self.anchors.add(door or sorted(cells, key=lambda c: (-c[1], c[0]))[0])

    def stamp_covered(self, x, y):
        return any(x >= s[1] and x < s[1] + s[3] and y >= s[2] and y < s[2] + s[4]
                   for s in self.stamps)

    # ---- 地形（镜像 map.js） ----
    def grass(self):
        h = th(self.x, self.y, 16)
        f = {0: "flower_grass_center", 1: "deep_grass_center", 2: "grass_alt_center"}.get(h, "grass_center")
        return img(V4 + "Derived/" + f + "_flat.png")

    def prop(self, ch, x, y):
        p = PROP_IMG.get(ch) or (FLOWERS[th(x, y, 3)] if ch == "z" else None)
        return img(V4 + p) if p else None

    def in_water_block(self, x, y):
        for bx, by in ((0, 0), (-1, 0), (0, -1), (-1, -1)):
            if all(self.tile(x + bx + ax, y + by + ay) == "W"
                   for ax, ay in ((0, 0), (1, 0), (0, 1), (1, 1))):
                return True
        return False

    def is_lake(self, x, y):
        return self.tile(x, y) == "W" and self.in_water_block(x, y)

    def river(self, x, y):
        g = self.g
        def at(x, y):
            if y < 0 or y >= len(g) or x < 0 or x >= len(g[y]): return True
            return self.tile(x, y) in "WM"
        U, D, L, Rr = at(x, y-1), at(x, y+1), at(x-1, y), at(x+1, y)
        f = "Water/water_center"
        if U and D and not L and not Rr: f = "River/river_vertical"
        elif L and Rr and not U and not D: f = "River/river_horizontal"
        elif U and L and not D and not Rr: f = "River/river_bend_top_left"
        elif U and Rr and not D and not L: f = "River/river_bend_top_right"
        elif D and L and not U and not Rr: f = "River/river_bend_bottom_left"
        elif D and Rr and not U and not L: f = "River/river_bend_bottom_right"
        elif (U or D) and not L and not Rr: f = "River/river_vertical"
        elif (L or Rr) and not U and not D: f = "River/river_horizontal"
        return img(V4 + "Terrain/" + f + ".png")

    def shores(self, x, y):
        lk = self.is_lake
        U, D, L, Rr = lk(x, y-1), lk(x, y+1), lk(x-1, y), lk(x+1, y)
        d = "Derived/"; out = []
        sides = U + D + L + Rr
        if sides == 2 and ((U and Rr) or (Rr and D) or (D and L) or (L and U)):
            c = "ne" if U and Rr else ("se" if Rr and D else ("sw" if D and L else "nw"))
            out.append(d + "water_diagb_" + c + ".png")
        else:
            if U: out.append(d + "water_shore_n.png")
            if D: out.append(d + "water_shore_s.png")
            if L: out.append(d + "water_shore_w.png")
            if Rr: out.append(d + "water_shore_e.png")
            if sides == 0:
                if lk(x+1, y-1): out.append(d + "water_diagb_ne.png")
                if lk(x-1, y-1): out.append(d + "water_diagb_nw.png")
                if lk(x+1, y+1): out.append(d + "water_diagb_se.png")
                if lk(x-1, y+1): out.append(d + "water_diagb_sw.png")
        return out

    def road(self, x, y):
        g = self.g
        def at(x, y):
            if y < 0 or y >= len(g) or x < 0 or x >= len(g[y]): return True
            return self.tile(x, y) in ",GMh"
        U, D, L, Rr = at(x, y-1), at(x, y+1), at(x-1, y), at(x+1, y)
        n = U + D + L + Rr
        GRp, d = "Terrain/Transitions/Grass_Road/", "Derived/"
        if n >= 4: f = d + "road_cross.png"
        elif n == 3:
            f = d + ("road_junction_down.png" if not U else "road_junction_up.png" if not D
                     else "road_junction_right.png" if not L else "road_junction_left.png")
        elif U and D: f = GRp + "grass_road_vertical.png"
        elif L and Rr: f = d + "road_horizontal.png"
        elif U and Rr: f = d + "road_corner_bottom_left.png"
        elif U and L: f = d + "road_corner_bottom_right.png"
        elif D and Rr: f = GRp + "grass_road_corner_top_left.png"
        elif D and L: f = GRp + "grass_road_corner_top_right.png"
        elif U: f = d + "road_corner_bottom_left.png"
        elif D: f = GRp + "grass_road_corner_top_left.png"
        elif L: f = GRp + "grass_road_corner_top_right.png"
        elif Rr: f = GRp + "grass_road_corner_top_left.png"
        else: f = GRp + "grass_road_center_blob.png"
        return img(V4 + f)

    def render(self, out_path):
        W, H = len(self.g[0]), len(self.g)
        cv = Image.new("RGBA", (W * TILE, H * TILE), (0, 0, 0, 255))
        FB = {  # 程序兜底色（预览用，表示贴图逻辑未覆盖）
            "#": (74, 80, 96), "B": (138, 106, 69), "D": (58, 42, 26), "G": (106, 114, 136),
            "R": (106, 90, 74), "E": (201, 184, 154), "M": (168, 132, 90), "X": (122, 74, 58),
        }
        for y in range(H):
            for x in range(W):
                self.x, self.y = x, y
                ch = self.tile(x, y)
                art = self.tileArt.get("%d,%d" % (x, y))
                if art:   # 美术覆盖：整格换贴图
                    cv.alpha_composite(img(V4 + art), (x * TILE, y * TILE))
                    continue
                layers = []
                if self.kind == "interior":
                    if ch in "BD#":
                        layers = [("C", FB.get(ch, FB["B"]))]
                    else:
                        layers = [("I", img(V4 + "Terrain/Interior/indoor_floor_center.png"))]
                        prop = {"t": "Props/Interior/round_wooden_table.png",
                                "c": "Props/Interior/wooden_stool.png",
                                "X": "Props/Interior/palace_pillar_red_gold.png" if th(x, y, 2) == 0
                                     else "Props/Interior/palace_pillar_white_jade.png",
                                "P": "Props/Interior/imperial_dragon_throne.png"}.get(ch)
                        if prop: layers.append(("I", img(V4 + prop)))
                        elif ch in PROP_IMG or ch == "z": layers.append(("I", self.prop(ch, x, y)))
                elif self.kind == "cave":
                    if ch in "F,E": layers = [("I", img(V4 + "Derived/cave_floor.png"))]
                    elif ch == "C": layers = [("I", img(V4 + "Terrain/Mountain/cave_entrance.png"))]
                    elif ch == "R": layers = [("I", img(V4 + "Terrain/Mountain/mountain_brown.png"))]
                    elif ch in PROP_IMG or ch == "z":
                        layers = [("I", img(V4 + "Derived/cave_floor.png")), ("I", self.prop(ch, x, y))]
                    else: layers = [("C", FB.get(ch, FB["R"]))]
                else:
                    if ch == ".": layers = [("I", self.grass())]
                    elif ch == "T": layers = [("I", img(V4 + "Terrain/Forest/forest_center.png"))]
                    elif ch == "y": layers = [("I", img(V4 + "Terrain/Forest/bamboo_forest_center.png"))]
                    elif ch == "i": layers = [("I", img(V4 + "Terrain/Mountain/snow_mountain.png"))]
                    elif ch == "j": layers = [("I", img(V4 + "Terrain/Mountain/volcano_active.png"))]
                    elif ch == "s": layers = [("I", img(V4 + "Derived/sand_flat.png"))]
                    elif ch == "n": layers = [("I", img(V4 + "Derived/farm_flat.png"))]
                    elif ch in PROP_IMG or ch == "z":
                        layers = [("I", self.grass()), ("I", self.prop(ch, x, y))]
                    elif ch == ",": layers = [("I", self.road(x, y))]
                    elif ch == "W":
                        layers = [("I", img(V4 + "Terrain/Water/water_center.png"))] if self.in_water_block(x, y) \
                            else [("I", self.river(x, y))]
                    elif ch == "R": layers = [("I", img(V4 + "Terrain/Mountain/mountain_brown.png"))]
                    elif ch == "C": layers = [("I", img(V4 + "Terrain/Mountain/cave_entrance.png"))]
                    elif ch == "#": layers = [("I", img(V4 + "Derived/wall_flat.png"))]
                    elif ch == "M": layers = [("I", self.grass())]
                    elif ch == "v": layers = [("I", self.grass()), ("I", img(V4 + "Props/Outdoor/stone_well.png"))]
                    elif ch == "h": layers = [("I", self.grass()),
                                              ("I", img(V4 + "Buildings/Residence/Rural/rural_residence_thatched_roof_a.png"))]
                    elif ch == "G": layers = [("I", self.road(x, y))]
                    elif ch in "BDP":
                        layers = [("I", self.grass())]
                        if not self.stamp_covered(x, y) and (x, y) in self.anchors:
                            rural = "village" in self.key
                            rs = ("Buildings/Residence/Rural/rural_residence_thatched_roof_a.png" if rural
                                  else "Buildings/Residence/Town/town_residence_blue_roof_a.png")
                            layers.append(("I", img(V4 + rs)))
                    else: layers = [("C", FB.get(ch, (79, 138, 69)))]
                    if ch == "." or ch == "v" or ch in PROP_IMG or ch == "z":
                        for p in self.shores(x, y): layers.append(("I", img(V4 + p)))
                for kind2, ob in layers:
                    if kind2 == "I":
                        cv.alpha_composite(ob, (x * TILE, y * TILE))
                    else:
                        for yy in range(TILE):
                            for xx in range(TILE):
                                cv.putpixel((x * TILE + xx, y * TILE + yy), ob + (255,))
        # 图章
        for im, x, y, w, h in self.stamps:
            st = img(V4 + im)
            cv.alpha_composite(st, (x * TILE, y * TILE))
        cv.convert("RGB").save(out_path)
        print(out_path, "stamps:", [(os.path.basename(s[0]), s[1], s[2]) for s in self.stamps])

if __name__ == "__main__":
    for key in sys.argv[1:]:
        m = load_map(key)
        r = R(m)
        r.key = key
        r.render(os.path.join(ROOT, "tools", "_prev_%s.png" % key))
