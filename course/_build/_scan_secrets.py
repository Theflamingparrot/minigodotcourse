import io, os, re

ROOT = "D:/Arcadia"
patterns = [
    r"ghp_[A-Za-z0-9]{20,}",
    r"github_pat_[A-Za-z0-9_]{20,}",
    r"sk-[A-Za-z0-9]{20,}",
    r"gsk_[A-Za-z0-9]{20,}",
    r"AKIA[0-9A-Z]{16}",
    r"Bearer\s+[A-Za-z0-9_\-]{20,}",
]
hits = []
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ("dist", ".git", "node_modules")]
    for f in files:
        p = os.path.join(root, f)
        try:
            s = io.open(p, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        for pat in patterns:
            for m in re.finditer(pat, s):
                hits.append((os.path.relpath(p, ROOT), pat, m.group(0)[:12] + "..."))

print("secrets found:", len(hits))
for h in hits:
    print("  ", h)

# how the Groq key is handled
s = io.open(os.path.join(ROOT, "site", "index.html"), encoding="utf-8").read()
print()
print("localStorage keys used:", sorted(set(re.findall(r"localStorage\.(?:get|set)Item\(([^)]+)\)", s)))[:10])
print("any hardcoded 'api_key = <literal>':", bool(re.search(r"api_key\s*=\s*['\"][A-Za-z0-9_\-]{20,}['\"]", s)))
