# Contributing

Thanks for wanting to help. This course is used by beginners, so clarity matters
more than cleverness.

---

## The most useful things you can do

1. **Report a mistake in the teaching.** A wrong API name, something that changed
   in Godot, an explanation that confused you. These are the most valuable reports.
2. **Fix a typo or a clumsy sentence** — in either language.
3. **Improve the Arabic.** The Arabic is a full translation; if a phrase reads
   awkwardly or a term is wrong, say so.
4. **Report a UI bug** on your device, with your browser and screen size.

---

## Reporting a problem

Use the [issue templates](https://github.com/Theflamingparrot/minigodotcourse/issues/new/choose).
For a teaching mistake, please include:

- **Day number and section** (e.g. "Day 12, the section on signals")
- **What it says now**
- **What it should say**, and ideally a link to the Godot docs that proves it

For a UI bug:

- **Browser and version**, and **screen size** if it looks like a layout problem
- **Whether it was the browser or the installed app**
- A screenshot if you can

---

## Making a change

`site/index.html` is the course. It is one large hand-written file — that is
deliberate, because it is what makes the whole course work offline from a single
file. The text lives in a few places inside it:

| What | Where |
|---|---|
| Lesson text (English) | the day cards in the HTML body |
| Arabic translations | `INLINE_AR` — keyed by the `data-i18n` id on each element |
| UI strings | `INLINE_UI`, looked up with `t('English text')` |
| Sidebar/chat/settings markup | `INLINE_MARKUP`, keyed by `data-i18n-markup` |
| Exam questions | `INLINE_BANKS` — 8 banks of 50 |

To translate a new English string, give its element a `data-i18n="<number>"` and add
that number to `INLINE_AR`.

Then:

```bash
python course/_build/_check.py     # must pass
```

If you touched the layout, also run the UI suite (`_ui_test.js`) — it must still be
167/167.

**If you changed anything on the page, bump `CACHE_VERSION` in `site/sw.js`.**
Otherwise people who already installed the app will never see your change.

---

## Rules of the course

Keep these intact when editing — they are deliberate:

- **Godot and programming vocabulary stays in English inside the Arabic text.**
  The editor is English; a student has to recognise `CharacterBody2D` on screen.
- **Every teaching day ends with a task list**, not just reading.
- **Exam Part B stays locked until Part A passes.**
- **No tracking, no accounts, no network calls** except the optional Groq tutor.
- **The course must keep working offline** from a single file.

---

## Licence

By contributing you agree your work is released under the [MIT licence](LICENSE).
