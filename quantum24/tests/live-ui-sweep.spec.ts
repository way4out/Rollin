import { test, expect } from '@playwright/test';

const BASE = process.env.Q24_BASE_URL || 'https://quantum24-gains.onrender.com';

test.describe('Quantum24 live browser control sweep', () => {
  test('loads, inventories controls, and checks console/page errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageErrors.push(e.message));

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
    await expect(page.locator('body')).toBeVisible();

    const controls = page.locator('button, [role="button"], input, select, textarea');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);

    const inventory = [];
    for (let i = 0; i < count; i++) {
      const el = controls.nth(i);
      inventory.push({
        tag: await el.evaluate(e => e.tagName),
        text: ((await el.innerText().catch(() => '')) || '').trim().slice(0, 120),
        aria: await el.getAttribute('aria-label'),
        id: await el.getAttribute('id')
      });
    }
    console.log('Q24_CONTROL_INVENTORY=' + JSON.stringify(inventory));

    expect(pageErrors, 'uncaught browser exceptions').toEqual([]);
    expect(consoleErrors.filter(x => !/favicon|DevTools/i.test(x)), 'console errors').toEqual([]);
  });

  test('clicks every non-destructive visible button and navigation control', async ({ page }) => {
    const failures: string[] = [];
    const apiResponses: {url:string,status:number}[] = [];
    page.on('response', r => {
      if (r.url().includes('/api/')) apiResponses.push({url:r.url(), status:r.status()});
    });

    // Prevent accidental external/financial side effects while still exercising UI handlers.
    await page.route('**/*', async route => {
      const req = route.request();
      const url = req.url();
      if (req.method() !== 'GET' && (/bankr|stripe|payment|checkout|purchase|transaction|charge/i.test(url))) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
    const buttons = page.locator('button:visible');
    const initial = await buttons.count();

    for (let i = 0; i < initial; i++) {
      const b = page.locator('button:visible').nth(i);
      if (!(await b.count())) continue;
      const label = ((await b.innerText().catch(() => '')) || (await b.getAttribute('aria-label')) || '').trim();
      if (!label) continue;

      // Exercise UI state-changing controls but do not submit real money/auth actions.
      if (/pay|buy|purchase|checkout|connect wallet|authorize payment|send payment|stake/i.test(label)) continue;

      try {
        await b.scrollIntoViewIfNeeded();
        await b.click({ timeout: 5_000 });
        await page.waitForTimeout(150);
      } catch (e) {
        failures.push(label + ': ' + String(e));
      }
    }

    console.log('Q24_CLICKED=' + (initial - failures.length) + '/' + initial);
    console.log('Q24_API_RESPONSES=' + JSON.stringify(apiResponses.slice(-100)));
    expect(failures, 'button click failures').toEqual([]);
  });

  test('exercises form controls, links, responsive layouts, and accessibility basics', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });

    for (const viewport of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]) {
      await page.setViewportSize(viewport);
      await page.reload({waitUntil:'networkidle', timeout:60_000});
      await expect(page.locator('body')).toBeVisible();

      const inputs = page.locator('input:visible, textarea:visible');
      for (let i=0;i<await inputs.count();i++) {
        const el=inputs.nth(i);
        const type=(await el.getAttribute('type'))||'text';
        if (/hidden|submit|button|checkbox|radio|file|range/i.test(type)) continue;
        try { await el.fill('Quantum24 browser verification'); await el.press('Tab'); } catch {}
      }

      const selects=page.locator('select:visible');
      for (let i=0;i<await selects.count();i++) {
        const s=selects.nth(i);
        const opts=s.locator('option');
        if(await opts.count()>1) await s.selectOption({index:1});
      }

      const links=page.locator('a:visible');
      for(let i=0;i<Math.min(await links.count(),80);i++){
        const a=links.nth(i);
        await a.scrollIntoViewIfNeeded().catch(()=>{});
        const href=await a.getAttribute('href');
        expect(href, 'link href missing').toBeTruthy();
      }

      const unnamed=await page.locator('button:visible, input:visible, select:visible, textarea:visible').evaluateAll(els =>
        els.filter(e => !e.getAttribute('aria-label') && !(e as HTMLElement).innerText.trim() && !e.id).length
      );
      expect(unnamed, 'unnamed interactive controls').toBe(0);
    }
  });
});
