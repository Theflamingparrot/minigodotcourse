// Full UI verification for the Godot course.
// Drives real Chrome at several viewports, in both languages, and in
// standalone (installed-app) display mode, and reports every layout defect it
// can measure: overflow, overlap, off-screen elements, and elements that move
// when they should not.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + process.env.COURSE_PAGE.replace(/\\/g, '/');
const OUT = process.env.OUT_DIR;

const VIEWPORTS = [
  { name: 'desktop',        width: 1440, height: 900,  mobile: false },
  { name: 'laptop',         width: 1100, height: 800,  mobile: false },
  { name: 'tablet',         width: 820,  height: 1180, mobile: true  },
  { name: 'tablet-edge',    width: 821,  height: 1180, mobile: true  },
  { name: 'phone',          width: 390,  height: 844,  mobile: true  },
  { name: 'phone-small',    width: 360,  height: 640,  mobile: true  },
  { name: 'phone-notched',  width: 390,  height: 844,  mobile: true, inset: true },
];

const results = [];
function record(viewport, lang, mode, test, ok, detail) {
  results.push({ viewport, lang, mode, test, ok, detail: detail || '' });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const findings = [];

  for (const vp of VIEWPORTS) {
    for (const lang of ['en', 'ar']) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

      await page.goto(PAGE, { waitUntil: 'load' });
      await page.waitForTimeout(600);

      if (lang === 'ar') {
        await page.evaluate(() => { if (typeof setLang === 'function') setLang('ar'); });
        await page.waitForTimeout(400);
      }

      const tag = `${vp.name}/${lang}`;

      // ---- 1. page errors
      record(vp.name, lang, 'page', 'no javascript errors', errs.length === 0, errs.slice(0, 3).join(' | '));

      // ---- 2. horizontal overflow
      const ov = await page.evaluate(() => {
        const de = document.documentElement;
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.right > de.clientWidth + 1.5 || r.left < -1.5) {
            bad.push({
              sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
              left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width)
            });
          }
        });
        return { scrollW: de.scrollWidth, clientW: de.clientWidth, bad: bad.slice(0, 12) };
      });
      record(vp.name, lang, 'layout', 'no horizontal page scroll',
        ov.scrollW <= ov.clientW + 1, `scrollW=${ov.scrollW} clientW=${ov.clientW}`);
      if (ov.bad.length) {
        findings.push({ tag, type: 'overflow', items: ov.bad });
      }

      // ---- 3. fixed chrome positions: menu button, chat FAB, sidebar
      const pos = await page.evaluate(() => {
        const g = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom),
                   w: Math.round(r.width), h: Math.round(r.height),
                   disp: cs.display, vis: cs.visibility, pos: cs.position, z: cs.zIndex, tf: cs.transform };
        };
        return { menu: g('.menu-toggle'), fab: g('.chat-fab'), sidebar: g('.sidebar'), main: g('.main-content') };
      });

      const W = vp.width, H = vp.height;
      if (pos.menu && pos.menu.disp !== 'none') {
        record(vp.name, lang, 'layout', 'menu button fully on screen',
          pos.menu.l >= -1 && pos.menu.r <= W + 1 && pos.menu.t >= -1 && pos.menu.b <= H + 1,
          JSON.stringify(pos.menu));
        // the sidebar and the button must be on the same side
        if (pos.sidebar) {
          const sbRight = pos.sidebar.l > W / 2;
          const mnRight = pos.menu.l > W / 2;
          record(vp.name, lang, 'layout', 'menu button on same side as sidebar',
            sbRight === mnRight, `sidebar.left=${pos.sidebar.l} menu.left=${pos.menu.l}`);
        }
        // the menu button must not overlap the chat FAB
        if (pos.fab && pos.fab.disp !== 'none') {
          const overlap = !(pos.menu.r <= pos.fab.l || pos.menu.l >= pos.fab.r ||
                            pos.menu.b <= pos.fab.t || pos.menu.t >= pos.fab.b);
          record(vp.name, lang, 'layout', 'menu button does not overlap chat button',
            !overlap, `menu=${JSON.stringify(pos.menu)} fab=${JSON.stringify(pos.fab)}`);
        }
      }

      // ---- 4. sidebar opens and its contents are reachable
      if (pos.menu && pos.menu.disp !== 'none') {
        await page.evaluate(() => { const b = document.querySelector('.menu-toggle'); if (b) b.click(); });
        await page.waitForTimeout(500);
        const open = await page.evaluate(() => {
          const sb = document.querySelector('.sidebar');
          const r = sb.getBoundingClientRect();
          const cs = getComputedStyle(sb);
          // is it actually visible in the viewport?
          const onScreen = r.left < window.innerWidth - 10 && r.right > 10;
          return { onScreen, left: Math.round(r.left), right: Math.round(r.right), tf: cs.transform, open: sb.classList.contains('open') };
        });
        record(vp.name, lang, 'layout', 'sidebar opens on screen', open.onScreen && open.open, JSON.stringify(open));

        // close it again
        await page.evaluate(() => { const b = document.querySelector('.menu-toggle'); if (b) b.click(); });
        await page.waitForTimeout(500);
        const closed = await page.evaluate(() => {
          const sb = document.querySelector('.sidebar');
          const r = sb.getBoundingClientRect();
          return { offScreen: r.left >= window.innerWidth - 10 || r.right <= 10, left: Math.round(r.left) };
        });
        record(vp.name, lang, 'layout', 'sidebar closes off screen', closed.offScreen, JSON.stringify(closed));
      }

      // ---- 5. main content not hidden behind the sidebar on wide screens
      if (!vp.mobile && pos.main) {
        const m = await page.evaluate(() => {
          const el = document.querySelector('.main-content');
          const r = el.getBoundingClientRect();
          return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
        });
        // LTR: the sidebar is fixed on the left, so content must start past it.
        // RTL: it is on the right, so content must end before it.
        const ok = lang === 'ar' ? (W < 821 || m.r <= W - 295) : (W < 821 || m.l >= 295);
        record(vp.name, lang, 'layout', 'content clears the fixed sidebar',
          ok, `main=${JSON.stringify(m)} viewportW=${W}`);
      }

      // ---- 6. chat panel fits
      await page.evaluate(() => { if (typeof openChat === 'function') openChat(); });
      await page.waitForTimeout(500);
      const chat = await page.evaluate(() => {
        const el = document.querySelector('.chat-panel');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom),
                 w: Math.round(r.width), h: Math.round(r.height), disp: cs.display };
      });
      if (chat && chat.disp !== 'none') {
        record(vp.name, lang, 'layout', 'chat panel fits on screen',
          chat.l >= -1 && chat.r <= W + 1 && chat.t >= -1 && chat.b <= H + 1, JSON.stringify(chat));
      }
      await page.evaluate(() => { if (typeof closeChat === 'function') closeChat(); });
      await page.waitForTimeout(300);

      // ---- 7. install buttons present, readable, and labelled in the right language
      const btns = await page.evaluate(() => {
        const out = {};
        const s = document.getElementById('installBtn');
        const h = document.getElementById('heroInstallBtn');
        const b = document.getElementById('appBanner');
        const txt = (el) => el ? (el.innerText || el.textContent || '').trim() : null;
        out.sidebar = txt(s);
        out.hero = txt(h);
        out.banner = !!b;
        if (b) { const r = b.getBoundingClientRect(); out.bannerW = Math.round(r.width); out.bannerL = Math.round(r.left); out.bannerR = Math.round(r.right); }
        return out;
      });
      record(vp.name, lang, 'i18n', 'sidebar install button has a label',
        !!btns.sidebar && btns.sidebar.length > 0, JSON.stringify(btns.sidebar));
      record(vp.name, lang, 'i18n', 'hero install button has a label',
        !!btns.hero && btns.hero.length > 0, JSON.stringify(btns.hero));
      if (lang === 'ar') {
        record(vp.name, lang, 'i18n', 'install buttons are in Arabic',
          /[\u0600-\u06FF]/.test(btns.sidebar || '') && /[\u0600-\u06FF]/.test(btns.hero || ''),
          `sidebar=${btns.sidebar} hero=${btns.hero}`);
      }
      if (btns.banner) {
        record(vp.name, lang, 'layout', 'install banner fits on screen',
          btns.bannerL >= -1 && btns.bannerR <= W + 1, `l=${btns.bannerL} r=${btns.bannerR} w=${btns.bannerW}`);
      }

      // ---- 8. language round-trip must not break the install buttons
      // Read textContent (not innerText) and open the drawer first: on mobile the
      // sidebar is visibility:hidden when closed, and innerText is empty for that.
      await page.evaluate(() => { if (typeof setLang === 'function') setLang('en'); });
      await page.waitForTimeout(300);
      const menuVisible = pos.menu && pos.menu.disp !== 'none';
      if (menuVisible) {
        await page.evaluate(() => { const b = document.querySelector('.menu-toggle'); if (b) b.click(); });
        await page.waitForTimeout(450);
      }
      const back = await page.evaluate(() => {
        const t = (id) => { const el = document.getElementById(id); return el ? (el.textContent || '').trim() : null; };
        return { sidebar: t('installBtn'), hero: t('heroInstallBtn') };
      });
      if (menuVisible) {
        await page.evaluate(() => { const b = document.querySelector('.menu-toggle'); if (b) b.click(); });
        await page.waitForTimeout(400);
      }
      const isArabic = /[\u0600-\u06FF]/;
      record(vp.name, lang, 'i18n', 'english round-trip keeps button labels',
        !!back.sidebar && back.sidebar.length > 0 && !!back.hero && back.hero.length > 0,
        JSON.stringify(back));
      record(vp.name, lang, 'i18n', 'english round-trip leaves no Arabic behind',
        !isArabic.test(back.sidebar || '') && !isArabic.test(back.hero || ''),
        JSON.stringify(back));

      await ctx.close();
    }
  }

  // ---- standalone / installed-app mode (display-mode: standalone)
  for (const lang of ['en', 'ar']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      // pretend the app is installed and running standalone
      const orig = window.matchMedia;
      window.matchMedia = (q) => q.includes('display-mode: standalone')
        ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }
        : orig.call(window, q);
      Object.defineProperty(navigator, 'standalone', { get: () => true });
    });
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    if (lang === 'ar') { await page.evaluate(() => setLang('ar')); await page.waitForTimeout(400); }

    const st = await page.evaluate(() => {
      const de = document.documentElement;
      const menu = document.querySelector('.menu-toggle');
      const mr = menu ? menu.getBoundingClientRect() : null;
      const banner = document.getElementById('appBanner');
      const br = banner ? banner.getBoundingClientRect() : null;
      return {
        scrollW: de.scrollWidth, clientW: de.clientWidth,
        menu: mr ? { l: Math.round(mr.left), t: Math.round(mr.top), r: Math.round(mr.right) } : null,
        banner: br ? { l: Math.round(br.left), r: Math.round(br.right) } : null,
      };
    });
    record('standalone', lang, 'app', 'no horizontal scroll', st.scrollW <= st.clientW + 1,
      `scrollW=${st.scrollW} clientW=${st.clientW}`);
    if (st.menu) {
      record('standalone', lang, 'app', 'menu button on screen',
        st.menu.l >= -1 && st.menu.r <= 391, JSON.stringify(st.menu));
    }
    await ctx.close();
  }

  await browser.close();

  // ---- report
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  const lines = [];
  lines.push(`UI verification: ${passed}/${results.length} checks passed`);
  lines.push('');
  if (failed.length) {
    lines.push('FAILURES:');
    for (const f of failed) {
      lines.push(`  [${f.viewport} | ${f.lang} | ${f.mode}] ${f.test}`);
      if (f.detail) lines.push(`      ${f.detail}`);
    }
  } else {
    lines.push('No failures.');
  }
  lines.push('');
  lines.push('LAYOUT OVERFLOW FINDINGS:');
  if (findings.length) {
    for (const f of findings) {
      lines.push(`  ${f.tag}:`);
      for (const it of f.items) lines.push(`     ${it.sel}  left=${it.left} right=${it.right} w=${it.w}`);
    }
  } else {
    lines.push('  none');
  }

  const report = lines.join('\n');
  fs.writeFileSync(path.join(OUT, 'ui-report.txt'), report, 'utf8');
  fs.writeFileSync(path.join(OUT, 'ui-results.json'), JSON.stringify(results, null, 1), 'utf8');
  console.log(report);
})();
