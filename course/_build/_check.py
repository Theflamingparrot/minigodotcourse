import io, re, os, json, base64, mimetypes, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))       # .../course/_build
ROOT = os.path.dirname(os.path.dirname(HERE))           # D:/Arcadia

# ---------------------------------------------------------------- sources
PAGE = os.path.join(ROOT, "site", "index.html")        # the course, hand-written
IMG  = os.path.join(ROOT, "course_img")                # the 24 screenshots

DIST = os.path.join(ROOT, "dist")                      # what gets uploaded

# ---------------------------------------------------------------- what is embedded
# Everything the student needs is inside index.html. These are the only inputs the
# build reads. course/_content/ holds older source-of-record copies of the text,
# the Arabic dictionary and the question banks — all of which are already baked
# into the page, so the build does not touch them.
NEEDED = [
    ("site/index.html",         "the whole course — text, exams, Arabic, the app"),
    ("course_img/ (24 files)",  "the Godot documentation screenshots"),
    ("site/manifest.webmanifest", "makes it an installable app"),
    ("site/sw.js",              "offline cache"),
    ("site/icon-192.png",       "app icon"),
    ("site/icon-512.png",       "app icon"),
]

def build():
    html = io.open(PAGE, encoding="utf-8").read()

    # the page may carry an image dictionary from an earlier run -- drop it so a
    # rebuild never stacks a second copy on top of the first
    prev = re.search(r'<script>\r?\n/\* ---- offline image dictionary.*?</script>\r?\n', html, re.S)
    if prev:
        html = html[:prev.start()] + html[prev.end():]

    # images -> data URIs
    img_js = {}
    for name in sorted(os.listdir(IMG)):
        p = os.path.join(IMG, name)
        if not os.path.isfile(p):
            continue
        # guess_type returns None for .webp on a bare Windows Python, which would
        # embed the screenshots as application/octet-stream and break them in the
        # browser. Fill in the two types we actually ship.
        mime = mimetypes.guess_type(name)[0]
        if mime is None:
            mime = "image/webp" if name.lower().endswith(".webp") else "application/octet-stream"
        img_js["course_img/" + name] = "data:%s;base64,%s" % (
            mime, base64.b64encode(io.open(p, "rb").read()).decode("ascii"))

    loader = (
        '<script>\n'
        '/* ---- offline image dictionary ------------------------------------------\n'
        '   Every screenshot is embedded as a base64 data URI so the course runs with\n'
        '   no network. Image tags carry data-src-course instead of src; this fills it. */\n'
        'const IMG_B64 = %s;\n'
        'function __loadCourseImages(){\n'
        "  document.querySelectorAll('img[data-src-course]').forEach(function(el){\n"
        "    var key = el.getAttribute('data-src-course');\n"
        '    if(IMG_B64[key]) el.src = IMG_B64[key];\n'
        '  });\n'
        '}\n'
        "if(document.readyState === 'loading'){\n"
        "  document.addEventListener('DOMContentLoaded', __loadCourseImages);\n"
        '}else{\n'
        '  __loadCourseImages();\n'
        '}\n'
        '</script>\n'
    ) % json.dumps(img_js, ensure_ascii=False, separators=(",", ":"))

    anchor = '<button class="menu-toggle"'
    assert anchor in html, "menu-toggle anchor missing from the page"
    html = html.replace(anchor, loader + anchor, 1)

    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    io.open(os.path.join(DIST, "index.html"), "w", encoding="utf-8").write(html)

    io.open(os.path.join(DIST, "_headers"), "w", encoding="utf-8").write(
        "/*\n"
        "  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\n"
        "  X-Content-Type-Options: nosniff\n"
        "  X-Frame-Options: DENY\n"
        "  Referrer-Policy: strict-origin-when-cross-origin\n"
        "  Permissions-Policy: camera=(), microphone=(), geolocation=()\n"
        "  Content-Security-Policy: default-src 'self'; img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; "
        "connect-src 'self' https://api.groq.com; base-uri 'self'; frame-ancestors 'none'\n")

    io.open(os.path.join(DIST, "robots.txt"), "w", encoding="utf-8").write(
        "User-agent: *\nAllow: /\n\nSitemap: https://minigodotcourse.com/sitemap.xml\n")

    io.open(os.path.join(DIST, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '  <url>\n    <loc>https://minigodotcourse.com/</loc>\n'
        '    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n'
        '</urlset>\n')

    io.open(os.path.join(DIST, "404.html"), "w", encoding="utf-8").write(
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>Page not found — MiniGodotCourse</title>\n'
        '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;'
        'justify-content:center;background:#15161e;color:#e2e8f5;'
        'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}'
        'a{color:#7aa2f7;text-decoration:none;font-weight:600}'
        'h1{font-size:3rem;margin:0 0 .5rem}p{color:#a9b1d6;line-height:1.6}</style>\n'
        '</head>\n<body>\n<div>\n<h1>404</h1>\n<p>That page does not exist.</p>\n'
        '<p><a href="/">← Back to the 60-day Godot &amp; game development course</a></p>\n'
        '</div>\n</body>\n</html>\n')

    for f in ("manifest.webmanifest", "icon-192.png", "icon-512.png", "sw.js"):
        shutil.copy2(os.path.join(ROOT, "site", f), os.path.join(DIST, f))
    shutil.copy2(os.path.join(ROOT, "site", "README.md"), os.path.join(DIST, "README.md"))

    # the screenshots live inside index.html as data URIs, so dist/ does not need a
    # second copy of them -- but the folder is cheap and keeps the shipped files
    # self-describing for anyone browsing the repo.
    shutil.copytree(IMG, os.path.join(DIST, "course_img"))

    return html, img_js


def verify(html, img_js):
    fails = []
    def check(label, cond, detail=""):
        print(("  PASS  " if cond else "  FAIL  ") + label + (("  -- " + detail) if detail else ""))
        if not cond:
            fails.append(label)

    h = io.open(os.path.join(DIST, "index.html"), encoding="utf-8").read()

    print("\n=== dist/ ===")
    for f in sorted(os.listdir(DIST)):
        print("  %-24s %12s bytes" % (f, f"{os.path.getsize(os.path.join(DIST, f)):,}"))

    print("\n=== course ===")
    check("60 day cards", len(re.findall(r'id="day-\d+"', h)) == 60)
    check("TOTAL = 60", re.search(r'const TOTAL = (\d+);', h).group(1) == "60")
    check("EXAM_DAYS correct",
          json.loads("[" + re.search(r'const EXAM_DAYS=\[([^\]]+)\]', h).group(1) + "]")
          == [7, 14, 21, 30, 37, 44, 51, 60])
    banks = json.loads(re.search(r'const INLINE_BANKS = (\{.*?\});\r?\n', h, re.S).group(1))
    check("8 question banks", len(banks) == 8)
    check("400 questions", sum(len(v) for v in banks.values()) == 400)
    check("Arabic dictionary", len(json.loads(re.search(r'const INLINE_AR = (\{.*?\});\r?\n', h, re.S).group(1))) > 3000)

    print("\n=== offline ===")
    check("IMG_B64 defined once", h.count("const IMG_B64") == 1, str(h.count("const IMG_B64")))
    check("24 images embedded", len(img_js) == 24)
    check("every data-src-course has a key",
          set(re.findall(r'data-src-course="([^"]+)"', h)) <= set(img_js))
    check("no plain <img src=", not re.search(r'<img[^>]*\ssrc="', h))
    check("manifest linked", 'rel="manifest"' in h)
    check("service worker registered", 'serviceWorker.register' in h)
    check("no http:// links", "http://" not in h)
    check("Groq endpoint", "https://api.groq.com/openai/v1/chat/completions" in h)
    check("install banner", all(k in h for k in ('id="appBanner"', 'id="installBtn"', 'id="heroInstallBtn"')))
    check("progress key", "godot30_v2" in h)
    check("no duplicate element ids",
          not [k for k, v in __import__("collections").Counter(re.findall(r'\bid="([^"]+)"', h)).items() if v > 1])
    check("MARKUP_EN declared before use",
          h.find("const MARKUP_EN") != -1 and h.find("const MARKUP_EN") < h.find("MARKUP_EN[idx]"))
    check("MARKUP_EN declared once", h.count("const MARKUP_EN") == 1)
    check("images are typed, not octet-stream",
          all(v.startswith(("data:image/", "data:application/")) and
              "application/octet-stream" not in v
              for v in json.loads(re.search(r'const IMG_B64 = (\{.*?\});\r?\n', h, re.S).group(1)).values()))

    print("\n=== shipped files ===")
    for f in ("manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png",
              "_headers", "robots.txt", "sitemap.xml", "404.html"):
        check("present: " + f, os.path.exists(os.path.join(DIST, f)))
    sw = io.open(os.path.join(DIST, "sw.js"), encoding="utf-8").read()
    for a in re.findall(r"'\./([^']+)'", sw):
        check("sw asset: ./" + a, os.path.exists(os.path.join(DIST, a)))

    tot = sum(os.path.getsize(os.path.join(DIST, f)) for f in os.listdir(DIST))
    print("\n=== dist/ total: %s bytes (%.1f MB) ===" % (f"{tot:,}", tot / 1024 / 1024))

    if fails:
        print("\nFAILURES (%d):" % len(fails))
        for f in fails:
            print("  -", f)
        return False
    print("\nALL CHECKS PASSED")
    return True


if __name__ == "__main__":
    print("=== what the page needs ===")
    for path, why in NEEDED:
        print("  %-28s %s" % (path, why))

    html, img_js = build()
    print("\nbuilt dist/index.html: %s bytes" % f"{len(html):,}")
    ok = verify(html, img_js)
    sys.exit(0 if ok else 1)
