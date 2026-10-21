# MiniGodotCourse — the deployable course

**Upload this folder. Nothing else.**

The whole course is one file. Every screenshot is embedded inside it as a data
URI, so the page runs with no network at all once it has loaded.

---

## What's here

| File | Purpose |
|---|---|
| `index.html` | **The whole course** — 60 days, 8 question banks, two-part exams, Arabic + English, embedded screenshots, the AI tutor. |
| `manifest.webmanifest` | Makes it an installable app (name, icons, theme colour). |
| `sw.js` | Service worker — caches the course so it runs with no network. |
| `icon-192.png`, `icon-512.png` | The app icon, shown on home screens and install prompts. |
| `_headers` | HSTS, CSP, X-Frame-Options, Referrer-Policy for Cloudflare Pages / Netlify. |
| `robots.txt` | Points crawlers at the domain and the sitemap. |
| `sitemap.xml` | Single URL entry for the domain. |
| `404.html` | Friendly not-found page with a link back to the course. |

`course_img/` is **not** needed — the images are inside `index.html`.

---

## Deploy

**GitHub Pages**
1. Push this folder to a repo.
2. Settings → Pages → Deploy from a branch → `main` / `/(root)`.
3. Add the custom domain `minigodotcourse.com`, enforce HTTPS.

**Netlify** — drag this folder onto `app.netlify.com/drop`, then add the domain in
Domain settings. The certificate provisions automatically.

**Cloudflare Pages** — Create → Upload assets → drag this folder, then add the
domain. The certificate is automatic.

The CSP in `_headers` allows the page's own inline scripts and styles plus
`connect-src https://api.groq.com` for the chat.

> The install prompt and offline service worker require **HTTPS**. All three hosts
> above provide it free. Opening the file directly from disk works, but cannot
> install as an app.

---

## The course

**Part 1 — The Engine (Days 1–30)** · Godot 4.7.2 — install, the editor, nodes and
scenes, GDScript, input, logic, loops, signals, CharacterBody2D physics, collisions,
Area2D, camera, animation, UI, HUD, audio, tilemaps, scene management, particles,
Tween, state machines, save/load, enemy AI, dialogue, menus, polish, design.

**Part 2 — Game Development (Days 31–60)** — design, mechanics, making assets with
no art skills, and shipping.

**Exams** on days 7, 14, 21, 30, 37, 44, 51, 60. Each is two parts: a 50-question
written test (3 attempts, 70% to pass) and a mini-project locked until Part A
passes.

---

## Features

- **📲 Offline app** — install it and all 60 days, 400 questions and your progress
  work with no network.
- **🌐 Arabic + English** — full RTL support. Godot and programming vocabulary
  stays in English inside the Arabic text, because the editor itself is English.
- **🔒 Sequential unlock** — you cannot open a day before finishing the previous one.
- **✅ Daily revision tasks** — every day ends with a checklist of things to do.
- **📊 Progress tracking** — days completed, exams passed, average score.
- **💬 Ask Groq** — a chat tutor (needs your own free API key).

---

## Using the AI tutor

1. Get a free key at **console.groq.com/keys**.
2. In the course, click **⚙️ API Settings** in the sidebar.
3. Paste the key and press **Save Key**.

The key stays in your browser and is sent only to Groq. Everything else works
without it.

---

*Built from the official Godot 4.7.2 documentation and real game-development craft.*
