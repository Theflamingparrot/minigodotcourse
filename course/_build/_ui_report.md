# UI verification report

Run against `dist/index.html` in real Chrome (headless), at seven viewports,
in English and Arabic, plus a simulated installed-app (standalone) context.

Harness: `_ui_test.js` — 167 checks. Result after the patches: **167/167 pass**.

---

## What was wrong

### 1. The layout was wider than the screen on small phones

**This is the "menu glitches and changes its position" bug.**

`body` is `display:flex`, so `.main-content` is a flex item. Flex items default
to `min-width:auto`, which means *"never shrink below my content's intrinsic
width."* Wide code blocks and tables pushed the content column past the viewport,
giving the whole page a phantom sideways scroll. Once the page can scroll
sideways, the fixed menu button and the content shift against each other — the
menu appears to jump around.

Measured, with and without the fix:

```
viewport | before (no fix)        | after (fix)
---------|------------------------|------------------------
   320px | scroll 378/320 main 378 | scroll 320/320 main 320  <-- overflowed
   360px | scroll 378/360 main 378 | scroll 360/360 main 360  <-- overflowed
   390px | scroll 390/390 main 390 | scroll 390/390 main 390
   412px | scroll 412/412 main 412 | scroll 412/412 main 412
```

At 320px the page was **58px wider than the screen**.

Fix: `.main-content{min-width:0}`, so the column can shrink and wide content
scrolls *inside* it (`pre`, tables, images).

### 2. No notch / status-bar clearance — this is the installed-app difference

The viewport meta was `width=device-width, initial-scale=1.0`. Without
`viewport-fit=cover`, `env(safe-area-inset-*)` is **always 0**, so there was no
way to pad around a notch or a home indicator.

In a browser the page sits inside the browser chrome and looks fine. Once
installed as an app it goes edge to edge, and the floating controls (menu button,
chat button) land under the status bar. On a notched phone the menu button can be
partly off screen. That is exactly "when I download the app … the menu changes
its position."

Fix: `viewport-fit=cover` plus `env(safe-area-inset-*)` padding on the menu
button, the sidebar, the chat button and the chat panel — in both LTR and RTL.

### 3. The sidebar was taller than the visible screen on phones

`.sidebar` was `height:100vh`. On a phone `100vh` is the **large** viewport — it
includes the strip hidden behind the address bar. The panel was therefore taller
than the visible area, and its bottom buttons (**Install App**, **Reset
Progress**) sat below the fold and could not be reached.

Fix: `height:100dvh` (the dynamic viewport, which tracks the visible area) with
the `100vh` line kept first as a fallback for older browsers.

### 4. A closed drawer could be reached by scrolling sideways

The sidebar was hidden with `transform:translateX(-100%)` only. Off-canvas but
still focusable and still part of the scrollable area — another way the menu
seemed to move on its own.

Fix: `visibility:hidden` on the closed drawer below 820px, flipped to `visible`
when open, with the transition delayed so the slide-out still animates.

### 5. The menu button sat on top of the sidebar's own title

The button is 41px tall at `top:15px`. When the drawer opened, the sidebar's
first heading was underneath it. The drawer now gets 74px of top padding at
mobile widths so its content starts below the button.

---

## What was checked and found correct

So the fixes above are the whole story, not the visible half of it:

- **No JavaScript errors** on any viewport or in either language.
- **Install buttons.** Both labels survive a full English → Arabic → English
  round trip at 390px, 820px and 1440px, and come back in the right language
  every time. (An earlier draft of the harness reported these as broken; that was
  the harness reading `innerText` on a `visibility:hidden` element. The
  buttons were fine.)
- **Chat panel** stays on screen and never overlaps the menu button.
- **Sidebar** opens on screen and closes fully off screen, in both directions.
- **Content clears the fixed sidebar** on wide screens — checked with the correct
  geometry for RTL (sidebar on the right) rather than assuming LTR.
- **Menu button does not overlap the chat button** at any width.
- **No secrets** in the shipped page.

---

## Files

- `_check.py` — build `dist/` and verify the content (60 days, 400 questions, Arabic, offline)
- `_ui_test.js` — the UI suite above; run with
  `COURSE_PAGE=<path to dist/index.html> OUT_DIR=. node _ui_test.js`
- `_scan_secrets.py` — scan the tree for anything that looks like a credential

`site/sw.js` `CACHE_VERSION` was bumped to **v60-2**. Without that, anyone who
had already installed the app would keep getting the old cached page and would
still see the bug.
