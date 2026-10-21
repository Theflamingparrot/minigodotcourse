# 🎮 Godot 4.7.2 + Game Development — 60-Day Course

A complete, self-contained course website. **60 days**: the Godot 4.7.2 engine
(Days 1–30), then game development — design, mechanics, and making assets with no
art skills (Days 31–60).

**It works fully offline.** Install it as an app and study with no Wi-Fi. Every
screenshot is embedded in the page, so nothing is fetched.

---

## 🚀 Deploy this repo

**GitHub Pages**
1. Settings → Pages → Deploy from a branch → `main` / `/(root)`.
2. Add the custom domain `minigodotcourse.com` and enforce HTTPS.

**Netlify** — drag the repo onto `app.netlify.com/drop`.
**Cloudflare Pages** — Create → Upload assets.

No build step, no server. Just static files.

> The install prompt and offline service worker need **HTTPS**. GitHub Pages,
> Netlify and Cloudflare all provide it free. Opening the file straight from disk
> works, but cannot install as an app.

---

## 📦 What's in this repo

```
Arcadia\
├── site\                    ← the course
│   ├── index.html           ← all 60 days, 400 questions, Arabic + English, the AI tutor
│   ├── sw.js                ← offline cache
│   ├── manifest.webmanifest
│   ├── icon-192.png, icon-512.png
│   └── _headers, robots.txt, sitemap.xml, 404.html   ← shipping extras
├── course_img\              ← the 24 screenshots (embedded into the page at build time)
├── course\_content\         ← the source content: English strings, Arabic dictionary,
│                              and the 8 question banks
└── course\_build\_check.py  ← build + verify script
```

**`site/` is the live page — edit it.** `course/_content/` holds the source copies of
the text; they are already baked into the page, so the build does not read them.

---

## 🔨 Rebuild

```
python course/_build/_check.py
```

It wipes `dist/`, writes it from `site/` + `course_img/`, then verifies the result:
60 days, 8 banks, 400 questions, Arabic, offline, every asset resolves. Exits
non-zero if anything fails. `dist/` is generated — never edit it.

---

## 📲 The app

Students press **⬇ Download App** and the course installs like a normal app — all
60 days, 400 questions and their progress then work with no network at all.

- **Android / Chrome:** the banner button shows the install prompt; if not, use the
  menu (⋮) → *Add to Home screen*.
- **iPhone / iPad:** Share → *Add to Home Screen*.
- **Desktop:** the button explains the address-bar install option, or that
  bookmarking works too.

The button never fails silently — it always says exactly what to do instead.

---

## The course in two parts

**Part 1 — The Engine (Days 1–30)** · Godot 4.7.2
Install, the editor, nodes and scenes, GDScript, input and movement, logic, loops,
signals, CharacterBody2D physics, collisions and layers, Area2D, camera, animation,
UI, HUD and autoloads, audio, tilemaps, scene management, particles, Tween, state
machines, save and load, enemy AI, dialogue, menus, polish, and design. Exams on
days 7, 14, 21 and 30.

**Part 2 — Game Development (Days 31–60)** · not Godot — the craft of making games
- **31–36 · Design:** what a game actually is, the core loop, game feel and juice,
  player psychology, difficulty curves, level design without text, pacing.
- **37 · Exam 5 — Design basics.**
- **38–43 · Mechanics:** movement (coyote time, jump buffering, variable jump
  height), combat and telegraphs, enemy and background characters, economy and
  progression, state machines, boss design.
- **44 · Exam 6 — Mechanics.**
- **45–50 · Assets with no art skills:** why you don't need to draw, pixel art,
  vector art and free libraries, 3D-to-2D and procedural art, animation without
  animating, UI/sound/levels without skills.
- **51 · Exam 7 — Assets.**
- **52–59 · Shipping and direction:** scoping a game you can finish, playtesting,
  iteration, case studies of how great games are made, designing a character you
  cannot draw, maps and worlds, UI/menus/onboarding, the road from here.
- **60 · 🎓 Grand Final — everything you have learnt**, across all sixty days.

Every teaching day ends with a revision checklist of things to actually *do*, a
written revision exercise, and key notes.

---

## Features

**🌐 Arabic + English.** Toggle in the sidebar. Arabic switches the whole layout to
RTL. Godot and programming vocabulary (`Node`, `Scene`, `Inspector`, `Viewport`,
`GDScript`, `CharacterBody2D`, `TileMapLayer`, `Tween`, `Autoload`, `Signal`,
`enum`, `match`, `delta`, `int`, `float`, `void`) stays in English inside the
Arabic text, because the Godot editor itself is English — the student must
recognise those words on screen. Game-design vocabulary (`core loop`, `game feel`,
`juice`, `telegraph`, `coyote time`, `hitstop`, `squash and stretch`, `i-frames`,
`parallax`, `silhouette`, `palette`, `playtest`, `tilemap`, `NPC`, `boss`, `HUD`,
`state machine`, `hitbox`, `hurtbox`) is kept in English too.

**🔒 Sequential unlock.** Day 1 is open. Finish a day and the next unlocks. Locked
days are dimmed, cannot be expanded, and say which day to finish first. Exam days
require **both** parts before the next day unlocks.

**✅ Daily revision tasks.** Every teaching day ends with a checklist of things to
actually do, plus a written revision exercise. Ticking every box completes the day
automatically.

**📊 Progress.** Sidebar shows days completed, exams passed, average score, and a
per-exam breakdown with the Part A score and whether Part B is submitted. Finishing
all 60 days and all 8 exams shows a completion banner.

**🧪 Eight two-part exams.** Part A is a 50-question written test (3 attempts, 70%
to pass, then it locks). Part B is a mini-project that is **locked until Part A
passes**. Both must pass before the exam day counts as done.

**💬 Ask Groq.** A chat assistant in the corner. On any question the student gets
wrong, a button appears beside it — **Ask Groq why I got this wrong** — which sends
that question, the student's answer and the correct answer to the tutor. The tutor
refuses to help during exams. *(Needs the network — the rest of the course does not.)*

---

## Setting up the AI tutor (one minute)

1. Go to **console.groq.com/keys** and create a free API key.
2. In the course, click **⚙️ API Settings** in the sidebar.
3. Paste the key and press **Save Key**.

The key is stored only in the student's browser and is sent only to Groq. **If they
skip this, everything else in the course works without it.**

---

## The page's internals, in case you need to edit

- `INLINE_AR` — Arabic dictionary, keyed by the `data-i18n` id
- `INLINE_UI` — UI strings, looked up by `t('English')`
- `INLINE_MARKUP` — sidebar/chat/settings markup, keyed by `data-i18n-markup`
- `INLINE_BANKS` — the 8 question banks, 50 questions each
- `IMG_B64` — the embedded screenshots as data URIs (added at build time)
- `EXAM_DAYS` — `[7,14,21,30,37,44,51,60]`
- `TOTAL` — `60`
- `sw.js` — bump `CACHE_VERSION` whenever the content changes

Progress is stored in the student's browser under the key `godot30_v2`.

---

## Built from

Part 1 follows the official Godot 4.7.2 documentation — introduction, step-by-step
tutorials, GDScript reference, 2D, physics, UI, audio, animation, tilemaps,
particles, and the 4.7 release notes. The screenshots are the real images from the
Godot docs repository.

Where the docs and reality disagree, the course follows reality — and says so. For
example, `AudioStreamPlayer.area_mask` defaults to 0 in 4.7, which silently breaks
reverb zones.

Part 2 is game-development craft: design, psychology, mechanics, making assets
without drawing, and shipping. It assumes no art skill and no programming
background.

---

*Good luck. Now go make something only you would make.* 🌸
