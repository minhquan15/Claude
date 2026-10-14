#!/usr/bin/env python3
"""Grok Studio: local web UI for the xAI image and video API. Standard library only."""
import base64
import hmac
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)
HISTORY = OUT / "history.json"
API = os.environ.get("XAI_BASE_URL", "https://api.x.ai/v1")


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env()


def xai(method, path, body=None):
    key = os.environ.get("XAI_API_KEY")
    if not key:
        raise RuntimeError("Thiếu XAI_API_KEY. Tạo file .env (xem .env.example).")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        API + path, data=data, method=method,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "User-Agent": "grok-studio/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"xAI {e.code}: {e.read().decode(errors='replace')}")


def save_url(url, ext):
    name = f"{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}.{ext}"
    req = urllib.request.Request(url, headers={"User-Agent": "grok-studio/1.0"})
    with urllib.request.urlopen(req, timeout=300) as r:
        (OUT / name).write_bytes(r.read())
    return name


def save_b64(b64, ext="jpg"):
    name = f"{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}.{ext}"
    (OUT / name).write_bytes(base64.b64decode(b64))
    return name


def add_history(kind, prompt, files, model):
    items = json.loads(HISTORY.read_text()) if HISTORY.exists() else []
    items.insert(0, {"kind": kind, "prompt": prompt, "files": files, "model": model,
                     "time": time.strftime("%Y-%m-%d %H:%M:%S")})
    HISTORY.write_text(json.dumps(items[:200], ensure_ascii=False))


def image_ref(data_uri_or_url):
    return {"url": data_uri_or_url, "type": "image_url"}


def do_image(p):
    body = {"model": p["model"], "prompt": p["prompt"]}
    if p.get("n"):
        body["n"] = int(p["n"])
    if p.get("aspect_ratio"):
        body["aspect_ratio"] = p["aspect_ratio"]
    if p.get("resolution"):
        body["resolution"] = p["resolution"]
    if p.get("image"):  # reference image -> edit endpoint
        body["image"] = image_ref(p["image"])
        res = xai("POST", "/images/edits", body)
    else:
        res = xai("POST", "/images/generations", body)
    files = []
    for d in res.get("data", []):
        if d.get("url"):
            files.append(save_url(d["url"], "jpg"))
        elif d.get("b64_json"):
            files.append(save_b64(d["b64_json"]))
    if not files:
        raise RuntimeError("Không có ảnh trong phản hồi: " + json.dumps(res)[:500])
    add_history("image", p["prompt"], files, p["model"])
    return {"files": files}


def do_video_start(p):
    body = {"model": p["model"], "prompt": p["prompt"]}
    if p.get("duration"):
        body["duration"] = int(p["duration"])
    if p.get("aspect_ratio"):
        body["aspect_ratio"] = p["aspect_ratio"]
    if p.get("resolution"):
        body["resolution"] = p["resolution"]
    if p.get("image"):
        body["image"] = {"url": p["image"]}
    res = xai("POST", "/videos/generations", body)
    return {"request_id": res.get("request_id"), "raw": res}


def do_video_extend(p):
    src = OUT / Path(p.get("file", "")).name
    if not src.is_file() or src.suffix != ".mp4":
        raise RuntimeError("Không tìm thấy video gốc trên server (có thể đã mất sau khi khởi động lại).")
    uri = "data:video/mp4;base64," + base64.b64encode(src.read_bytes()).decode()
    body = {"model": p["model"], "prompt": p["prompt"], "video": {"url": uri}}
    if p.get("duration"):
        body["duration"] = int(p["duration"])
    res = xai("POST", "/videos/extensions", body)
    return {"request_id": res.get("request_id"), "raw": res}


# request_id -> source file, for "cheap" extensions that get stitched after download.
CHEAP_JOBS = {}
CHEAP_LOCK = threading.Lock()


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        exe = shutil.which("ffmpeg")
        if not exe:
            raise RuntimeError("Thiếu ffmpeg: chạy pip install -r requirements.txt")
        return exe


def run_ffmpeg(*args):
    r = subprocess.run([ffmpeg_exe(), "-hide_banner", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError("ffmpeg lỗi: " + r.stderr[-800:])
    return r.stderr


def probe(path):
    """Width, height, fps and whether there is an audio stream, parsed from ffmpeg's banner."""
    err = subprocess.run([ffmpeg_exe(), "-hide_banner", "-i", str(path)],
                         capture_output=True, text=True).stderr
    vline = next((l for l in err.splitlines() if "Video:" in l), "")
    size = re.search(r", (\d{2,5})x(\d{2,5})", vline)
    fps = re.search(r"([\d.]+) fps", vline)
    if not size:
        raise RuntimeError("Không đọc được video: " + err[-300:])
    return int(size[1]), int(size[2]), float(fps[1]) if fps else 24.0, "Audio:" in err


def last_frame_data_uri(src):
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "last.jpg"
        run_ffmpeg("-sseof", "-1", "-i", str(src), "-update", "1", "-q:v", "2", str(out))
        return "data:image/jpeg;base64," + base64.b64encode(out.read_bytes()).decode()


def stitch(first, second):
    w, h, fps, a1 = probe(first)
    a2 = probe(second)[3]
    norm = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={fps}"
    audio = a1 and a2
    graph = f"[0:v]{norm}[v0];[1:v]{norm}[v1];" + (
        "[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]" if audio else "[v0][v1]concat=n=2:v=1:a=0[v]")
    name = f"{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}.mp4"
    args = ["-i", str(first), "-i", str(second), "-filter_complex", graph, "-map", "[v]"]
    if audio:
        args += ["-map", "[a]", "-c:a", "aac", "-b:a", "128k"]
    run_ffmpeg(*args, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
               "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUT / name))
    return name


def do_video_extend_cheap(p):
    src = OUT / Path(p.get("file", "")).name
    if not src.is_file() or src.suffix != ".mp4":
        raise RuntimeError("Không tìm thấy video gốc trên server (có thể đã mất sau khi khởi động lại).")
    body = {"model": p["model"], "prompt": p["prompt"], "image": {"url": last_frame_data_uri(src)}}
    if p.get("duration"):
        body["duration"] = int(p["duration"])
    if p.get("resolution"):
        body["resolution"] = p["resolution"]
    res = xai("POST", "/videos/generations", body)
    rid = res.get("request_id")
    if rid:
        with CHEAP_LOCK:
            CHEAP_JOBS[rid] = src.name
    return {"request_id": rid, "raw": res}


def do_video_poll(rid, prompt, model):
    res = xai("GET", f"/videos/{rid}")
    status = res.get("status", "pending")
    out = {"status": status}
    if status == "done":
        url = (res.get("video") or {}).get("url")
        if not url:
            raise RuntimeError("Video xong nhưng không có URL: " + json.dumps(res)[:500])
        f = save_url(url, "mp4")
        with CHEAP_LOCK:
            base = CHEAP_JOBS.pop(rid, None)
        if base:
            seg = OUT / f
            try:
                f = stitch(OUT / base, seg)
            finally:
                seg.unlink(missing_ok=True)
        add_history("video", prompt, [f], model)
        out["files"] = [f]
    elif status in ("failed", "expired"):
        out["error"] = json.dumps(res)[:500]
    return out


class H(BaseHTTPRequestHandler):
    def log_message(self, fmt, *a):
        sys.stderr.write("%s\n" % (fmt % a))

    def authorized(self):
        pw = os.environ.get("APP_PASSWORD")
        if not pw:
            return True
        h = self.headers.get("Authorization", "")
        try:
            user_pass = base64.b64decode(h.split(" ", 1)[1]).decode()
            given = user_pass.split(":", 1)[1]
        except Exception:
            return False
        return hmac.compare_digest(given.encode(), pw.encode())

    def deny(self):
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Grok Studio"')
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send(self, code, data, ctype="application/json"):
        if not isinstance(data, (bytes, bytearray)):
            data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if not self.authorized():
            return self.deny()
        path = self.path.split("?")[0]
        if path == "/":
            return self.send(200, (ROOT / "index.html").read_bytes(), "text/html; charset=utf-8")
        if path == "/api/history":
            return self.send(200, json.loads(HISTORY.read_text()) if HISTORY.exists() else [])
        m = re.fullmatch(r"/api/video/([\w-]+)", path)
        if m:
            q = dict(x.split("=", 1) for x in self.path.partition("?")[2].split("&") if "=" in x)
            from urllib.parse import unquote
            try:
                return self.send(200, do_video_poll(m.group(1), unquote(q.get("prompt", "")),
                                                    unquote(q.get("model", ""))))
            except Exception as e:
                return self.send(500, {"error": str(e)})
        if path.startswith("/outputs/"):
            f = OUT / Path(path[len("/outputs/"):]).name
            if f.is_file():
                return self.send(200, f.read_bytes(),
                                 mimetypes.guess_type(f.name)[0] or "application/octet-stream")
        self.send(404, {"error": "not found"})

    def do_POST(self):
        if not self.authorized():
            return self.deny()
        try:
            p = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            if self.path == "/api/image":
                return self.send(200, do_image(p))
            if self.path == "/api/video":
                return self.send(200, do_video_start(p))
            if self.path == "/api/video/extend-cheap":
                return self.send(200, do_video_extend_cheap(p))
            if self.path == "/api/video/extend":
                return self.send(200, do_video_extend(p))
            self.send(404, {"error": "not found"})
        except Exception as e:
            self.send(500, {"error": str(e)})


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 8000))
    if host not in ("127.0.0.1", "localhost") and not os.environ.get("APP_PASSWORD"):
        sys.exit("Từ chối chạy công khai khi chưa đặt APP_PASSWORD.")
    print(f"Grok Studio: http://{host}:{port}")
    ThreadingHTTPServer((host, port), H).serve_forever()
