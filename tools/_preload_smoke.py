#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""预载顺序冒烟验证（四级：T0 splash → T1u UI kit → T1 首屏素材 → T2 后台错峰）。
抓 CDP Network.requestWillBeSent，断言：
  1. splash.png 首个请求早于全部 T1u UI 文件
  2. 全部 T1u 早于 T1 样本（grass_center_flat / liu_bei）
  3. T1 样本早于 T2 样本（sand_water_narrow_channel，V4_ASSETS 尾部、不在 T1）
  4. #scr-splash 显示时 splash 图已 complete（naturalWidth>0）
并打印关键文件的请求时间顺序表（供报告引用）。
用法：先起 python server.py，再 .venv/Scripts/python tools/_preload_smoke.py
"""
import base64, json, subprocess, sys, time, urllib.request, os
import websocket

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9349
URL = "http://localhost:8322/index.html"

T0 = ["assets/ui/splash.png"]
T1U = [
    "assets/ui/title_bg.png",
    "assets/ui/menu_panel_9slice.png", "assets/ui/popup_panel_9slice.png",
    "assets/ui/confirm_panel_9slice.png", "assets/ui/dialog_wood_gold_clean_9slice.png",
    "assets/ui/title_plaque_9slice.png", "assets/ui/toast_9slice.png",
    "assets/ui/top_hint_bar_9slice.png",
    "assets/ui/option_btn_normal.png", "assets/ui/option_btn_active.png",
    "assets/ui/option_btn_pressed.png", "assets/ui/option_btn_disabled_9slice.png",
    "assets/ui/sel_arrow.png",
    "assets/ui/dpad.png", "assets/ui/btn_a.png", "assets/ui/btn_b.png",
]
T1_SAMPLE = ["assets/gfx/v4/Derived/grass_center_flat.png", "assets/chars/map/liu_bei.png"]
T2_SAMPLE = ["assets/gfx/v4/Terrain/Transitions/Sand_Water/sand_water_narrow_channel.png"]

proc = subprocess.Popen([EDGE, "--headless", "--disable-gpu",
    "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*",
    "--window-size=480,860", "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

fails = []

def check(ok, msg):
    print(("  [PASS] " if ok else "  [FAIL] ") + msg)
    if not ok:
        fails.append(msg)

events = []

try:
    ws_url = None
    for _ in range(50):
        try:
            tabs = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % PORT))
            page = next(t for t in tabs if t["type"] == "page")
            ws_url = page["webSocketDebuggerUrl"]; break
        except Exception:
            time.sleep(0.3)
    ws = websocket.create_connection(ws_url, timeout=30)
    mid = [0]
    def send(method, params=None):
        mid[0] += 1
        ws.send(json.dumps({"id": mid[0], "method": method, "params": params or {}}))
        while True:
            m = json.loads(ws.recv())
            if m.get("id") == mid[0]:
                return m.get("result", {})
            events.append(m)
    def drain(seconds):
        """持续收事件 seconds 秒"""
        ws.settimeout(0.2)
        end = time.time() + seconds
        while time.time() < end:
            try:
                events.append(json.loads(ws.recv()))
            except Exception:
                pass
        ws.settimeout(30)
    def js(expr):
        r = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        return r.get("result", {}).get("value")

    send("Page.enable")
    send("Runtime.enable")
    send("Network.enable")
    send("Page.navigate", {"url": URL})
    # 等预载推进到 T2 样本出现（T0→T1u→T1→T2 串行，T2 错峰 12 张/60ms，给足余量）
    t2_seen = False
    for _ in range(120):   # 最多约 36s
        drain(0.3)
        t2_seen = any(m.get("method") == "Network.requestWillBeSent" and
                      "sand_water_narrow_channel" in m["params"]["request"]["url"]
                      for m in events)
        if t2_seen:
            break
    print("T2 样本请求已出现" if t2_seen else "T2 样本请求未等到")

    # 汇总：URL → 首个 requestWillBeSent 的 monotonic timestamp
    first = {}
    for m in events:
        if m.get("method") != "Network.requestWillBeSent":
            continue
        p = m["params"]
        if p.get("type") not in ("Image", "Other", None) and "png" not in p["request"]["url"]:
            continue
        u = urllib.request.unquote(p["request"]["url"])
        if u.startswith(URL.rsplit("/", 1)[0] + "/"):
            rel = u[len(URL.rsplit("/", 1)[0]) + 1:]
            if rel not in first:
                first[rel] = p["timestamp"]

    def ts(rel):
        return first.get(rel)

    print("-- 请求时间顺序（monotonic s，节选） --")
    rows = [(rel, ts(rel)) for rel in T0 + T1U + T1_SAMPLE + T2_SAMPLE]
    for rel, t in rows:
        print("  %-66s %s" % (rel, ("%.3f" % t) if t else "未见请求"))

    t_splash = ts(T0[0])
    check(t_splash is not None, "splash.png 有请求记录")
    missing_ui = [r for r in T1U if ts(r) is None]
    check(not missing_ui, "T1u 全部 16 个 UI 文件都有请求（缺：%s）" % missing_ui)
    if t_splash is not None and not missing_ui:
        check(all(t_splash <= ts(r) for r in T1U), "splash 首个请求早于全部 T1u")
    t1s = [ts(r) for r in T1_SAMPLE]
    check(all(t is not None for t in t1s), "T1 样本有请求记录")
    if not missing_ui and all(t is not None for t in t1s):
        check(all(max(ts(r) for r in T1U) <= t for t in t1s),
              "T1u 最晚请求早于 T1 样本（T1u_max=%.3f T1=%s）" %
              (max(ts(r) for r in T1U), ["%.3f" % t for t in t1s]))
    t_t2 = ts(T2_SAMPLE[0])
    check(t_t2 is not None and all(t is not None and t <= t_t2 for t in t1s),
          "T1 样本早于 T2 样本（T2=%s）" % ("%.3f" % t_t2 if t_t2 else "未见"))

    print("-- splash 显示时已就绪 --")
    shown = js("document.getElementById('scr-splash').classList.contains('show')")
    ready = js("(() => { const i = new Image(); i.src = 'assets/ui/splash.png';"
               " return i.complete && i.naturalWidth > 0; })()")
    check(shown is True and ready is True, "#scr-splash 显示中且 splash 图 complete")

    print("-- 回归：进标题 → 新游戏进地图 --")
    js("document.getElementById('scr-splash').click()")
    js("document.getElementById('btn-new').click()")
    time.sleep(1.0)
    check(js("S.mode") == "dialog", "新游戏序章对话打开")
    js("while (S.mode === 'dialog') nextLine()")
    check(js("S.mode") == "map", "进入地图模式，全流程无报错")

    ws.close()
finally:
    proc.terminate()

print("\n%d 项失败" % len(fails) if fails else "\n全部通过 [OK]")
sys.exit(1 if fails else 0)
