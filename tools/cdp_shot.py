# 工具 · CDP 截图：驱动无头 Edge 打开 _smoke_v4.html#地图，等图片加载完再截图
# 用法: python tools/cdp_shot.py ch00_palace,5,5 ch00_field,5,5 ...
import base64, json, subprocess, sys, time, urllib.request, os
import websocket

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9333

proc = subprocess.Popen([EDGE, "--headless", "--disable-gpu",
    "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*",
    "--window-size=560,700", "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
    send("Page.enable")
    for spec in sys.argv[1:]:
        parts = spec.split(",")
        name = parts[0]
        url = "file:///" + os.path.join(ROOT, "tools", "_smoke_v4.html").replace("\\", "/") \
            + "?r=%d#%s" % (sys.argv.index(spec), spec)
        url = url.replace(" ", "%20")
        send("Page.navigate", {"url": url})
        # 等游戏启动 + 图片加载（真实时间）
        ok = False
        for _ in range(100):
            time.sleep(0.3)
            r = send("Runtime.evaluate", {"expression":
                "document.title.startsWith('OK') || document.title.startsWith('ERR') ? document.title : ''"})
            t = r.get("result", {}).get("value", "")
            if t:
                print(name, "->", t[:200])
                ok = True
                break
        time.sleep(0.5)  # 多等一帧绘制
        shot = send("Page.captureScreenshot", {"format": "png"})
        out = os.path.join(ROOT, "tools", "_smoke_%s.png" % name)
        open(out, "wb").write(base64.b64decode(shot["data"]))
        print("saved", out, "(title %s)" % ("ok" if ok else "TIMEOUT"))
    ws.close()
finally:
    proc.terminate()
