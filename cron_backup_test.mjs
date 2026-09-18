import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:4240';
const results = {};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', (msg) => {
  const t = msg.text();
  if (/warn|error/i.test(msg.type())) console.log('  [console]', msg.type(), t.slice(0, 250));
});
page.on('dialog', async (dialog) => { await dialog.accept(); });

// Force LOCAL storage mode
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  window.localStorage.setItem('funnel_site_config_v1', JSON.stringify({ admin: { storageMode: 'local' } }));
});
await page.reload({ waitUntil: 'networkidle' });

console.log('=== Login ===');
await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
await page.locator('input[type="password"]').fill('0969027485Tn@');
await page.getByRole('button', { name: 'Đăng nhập' }).click();
await page.waitForTimeout(3000);

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.locator('button[title="Cấu hình"]').click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: 'Cloud Cron & Backup' }).click();
await page.waitForTimeout(1000);
console.log('Cron modal open:', await page.getByText('Cloud Cron & Backup').count());

// initial snapshot count
console.log('Snapshot text initial:', await page.locator('text=/Snapshot backup local/').textContent().catch(() => null));

// Change something and hit Save to trigger a snapshot (e.g. change backup email)
await page.getByRole('textbox').first().fill('backup-test@example.com');
await page.getByRole('button', { name: 'Lưu' }).first().click().catch(() => {});
await page.waitForTimeout(1500);

// Reopen modal fresh to see snapshot count
await page.reload({ waitUntil: 'networkidle' });
await page.locator('button[title="Cấu hình"]').click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: 'Cloud Cron & Backup' }).click();
await page.waitForTimeout(1000);
const snapshotText = await page.locator('text=/Snapshot backup local/').textContent().catch(() => null);
console.log('Snapshot text after save:', snapshotText);
results.snapshotAfterSave = { text: snapshotText };

const restoreBtn = page.getByRole('button', { name: /Khôi phục #1/ });
results.restoreButtonExists = { count: await restoreBtn.count() };

console.log('\n=== RESULTS ===');
console.log(JSON.stringify(results, null, 2));
await browser.close();
