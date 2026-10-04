// اختبار شامل من البداية للنهاية على نسخة محلية من Supabase
// تسجيل دخول ← تجهيز صوبة ودورة ونباتات ← تسجيل أسبوعي بدون إنترنت ← إعادة فتح التطبيق أوفلاين ← مزامنة ← تحقق من قاعدة البيانات
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { startGateway } from './gateway.mjs';

const APP = 'http://localhost:4173/';
const SHOTS = 'e2e/shots';
mkdirSync(SHOTS, { recursive: true });

const sql = (q) =>
  execFileSync('su', ['postgres', '-s', '/bin/bash', '-c', `psql -h /tmp -p 5544 -d e2e -At -F '|' -c "${q.replace(/"/g, '\\"')}"`]).toString().trim();

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { server } = await startGateway();
const preview = spawn('npx', ['vite', 'preview', '--outDir', 'dist-e2e', '--port', '4173', '--strictPort', '--host', 'localhost'], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(APP)).ok) break; } catch { /* wait */ }
  await sleep(250);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const consoleErrors = [];
async function newTablet(viewport = { width: 1180, height: 820 }) {
  const ctx = await browser.newContext({ viewport, locale: 'ar-EG', hasTouch: true, timezoneId: 'Africa/Cairo' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR/.test(m.text())) consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  return { ctx, page };
}
const waitSynced = async (page, timeout = 15000) => {
  await page.locator('.sync-pill', { hasText: 'متزامن' }).waitFor({ timeout });
};

try {
  // ── 1. الدخول ──────────────────────────────────────────────────────
  const { ctx, page } = await newTablet();
  await page.goto(APP);
  await page.waitForURL(/#\/login/);
  await page.screenshot({ path: `${SHOTS}/01-login.png` });
  await page.fill('input[type=email]', 'admin@test.local');
  await page.fill('input[type=password]', 'wrong');
  await page.click('button:has-text("دخول")');
  ok(await page.locator('.form-error', { hasText: 'غير صحيحة' }).isVisible({ timeout: 5000 }).catch(() => false) || (await page.locator('.form-error').textContent())?.includes('غير صحيحة'), 'كلمة مرور خاطئة تُظهر رسالة واضحة');
  await page.fill('input[type=password]', 'Admin#2026');
  await page.click('button:has-text("دخول")');
  await page.locator('h1', { hasText: 'الأسبوع' }).waitFor({ timeout: 15000 });
  ok(await page.locator('.topbar', { hasText: 'المزرعة الرئيسية' }).isVisible(), 'المزرعة الوحيدة تُختار تلقائيًا والدور ظاهر');
  ok(await page.locator('.topbar', { hasText: 'مدير النظام' }).isVisible(), 'دور مدير النظام ظاهر في الشريط العلوي');
  await page.screenshot({ path: `${SHOTS}/02-home-empty.png` });

  // ── 2. صوبة جديدة ─────────────────────────────────────────────────
  await page.click('text=أضف أول صوبة');
  await page.fill('label:has-text("كود الصوبة") input', 'gh-07');
  await page.fill('label:has-text("المساحة") input', '540');
  await page.fill('label:has-text("عدد البواكي") input', '2');
  await page.fill('label:has-text("عدد الخطوط") input', '6');
  await page.fill('label:has-text("مادة الغطاء") input', 'بولي إيثيلين');
  await page.screenshot({ path: `${SHOTS}/03-greenhouse-form.png` });
  await page.click('button:has-text("إضافة الصوبة")');
  await page.locator('h1', { hasText: 'GH-07' }).waitFor();
  ok(true, 'الكود يتحول لحروف كبيرة GH-07');

  // ── 3. دورة زراعية ────────────────────────────────────────────────
  await page.click('a:has-text("دورة زراعية جديدة") >> nth=0');
  await page.fill('label:has-text("الصنف") input', 'صنف تجريبي F1');
  await page.selectOption('label:has-text("بيئة الزراعة") select', 'volcanic_tuff');
  // الشتل قبل 9 أسابيع
  const planted = new Date(Date.now() - 63 * 86400000).toISOString().slice(0, 10);
  await page.fill('label:has-text("تاريخ الشتل") input', planted);
  await page.fill('label:has-text("عدد النباتات") input', '1500');
  await page.click('button:has-text("إضافة الدورة")');
  await page.locator('h2', { hasText: 'النباتات المرجعية' }).waitFor();

  // ── 4. النباتات المرجعية ──────────────────────────────────────────
  await page.click('.empty button:has-text("إضافة نباتات")');
  await page.fill('label:has-text("الخطوط") input', '1, 3-5');
  await page.fill('label:has-text("عدد النباتات في كل خط") input', '2');
  await page.screenshot({ path: `${SHOTS}/04-generate-plants.png` });
  await page.click('button:has-text("إنشاء 8 نبات")');
  await page.locator('.panel-pad button.chip', { hasText: 'R5-P2' }).waitFor();
  const nPlants = await page.locator('.panel-pad button.chip.ok').count();
  ok(nPlants === 8, `8 نباتات مرجعية (خطوط 1،3،4،5 × 2) — ${nPlants}`);

  // ── 5. القيم المستهدفة ─────────────────────────────────────────────
  await page.click('button:has-text("تحديد القيم")');
  const sheet = page.locator('.sheet');
  await sheet.locator('input[aria-label="الاستطالة الأسبوعية الحد الأدنى"]').fill('10');
  await sheet.locator('input[aria-label="الاستطالة الأسبوعية الحد الأعلى"]').fill('20');
  await sheet.locator('input[aria-label="سمك الساق الحد الأدنى"]').fill('8');
  await sheet.locator('input[aria-label="سمك الساق الحد الأعلى"]').fill('11');
  await sheet.locator('input[aria-label="ارتفاع العنقود المزهر الحد الأدنى"]').fill('10');
  await sheet.locator('input[aria-label="ارتفاع العنقود المزهر الحد الأعلى"]').fill('20');
  await sheet.locator('label:has-text("تبدأ من تاريخ") input').fill(planted);
  await sheet.locator('button:has-text("حفظ")').click();
  await page.locator('.tbl td', { hasText: '10 – 20' }).first().waitFor();
  await page.screenshot({ path: `${SHOTS}/05-cycle-detail.png`, fullPage: true });

  // ── 6. المزامنة للسيرفر ───────────────────────────────────────────
  await page.locator('.sync-pill').click();
  await page.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(page);
  await page.keyboard.press('Escape');
  const counts = sql("select (select count(*) from greenhouses)||','||(select count(*) from crop_cycles)||','||(select count(*) from reference_plants)||','||(select count(*) from balance_targets)||','||(select count(*) from varieties where farm_id is not null)");
  ok(counts === '1,1,8,1,1', `السيرفر استقبل: صوبة، دورة، 8 نباتات، قيم مستهدفة، صنف (${counts})`);
  ok(sql("select code||'|'||created_by from greenhouses") === 'GH-07|aaaaaaaa-0000-0000-0000-000000000001', 'created_by مسجل باسم المستخدم الصحيح');

  // تأكد إن الـ Service Worker جاهز قبل قطع الإنترنت
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.controller != null || new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', () => r(true))));

  // ── 7. تسجيل أسبوعي بدون إنترنت ───────────────────────────────────
  await ctx.setOffline(true);
  await page.goto(APP + '#/');
  await page.locator('.gh', { hasText: 'GH-07' }).waitFor();
  ok(await page.locator('.gh .chip', { hasText: 'لم يُسجّل هذا الأسبوع' }).isVisible(), 'الرئيسية: الصوبة لم تُسجل هذا الأسبوع');
  await page.screenshot({ path: `${SHOTS}/06-home-offline.png` });
  await page.click('.gh:has-text("GH-07")');
  await page.locator('.plant-head .big', { hasText: 'R1-P1' }).waitFor();

  // النبات الأول بلوحة الأرقام على الشاشة
  const tap = async (s) => { for (const ch of s) await page.click(`.keys button:text-is("${ch === '.' ? '.' : ch}")`); };
  await tap('24.5'); await page.click('.keypad button:has-text("التالي")');
  await tap('12.1'); await page.click('.keypad button:has-text("التالي")');
  await page.click('.keypad button:has-text("التالي")'); // طول النبات: فارغ
  ok(await page.locator('.keys button:text-is(".")').isDisabled(), 'الفاصلة العشرية معطلة في الحقول الصحيحة (رقم العنقود)');
  await tap('7'); await page.click('.keypad button:has-text("التالي")');
  await tap('23'); await page.click('.keypad button:has-text("التالي")');
  await tap('4'); await page.click('.keypad button:has-text("التالي")');
  await tap('5'); await page.click('.keypad button:has-text("التالي")');
  await tap('6'); await page.click('.keypad button:has-text("التالي")');
  await tap('5'); await page.click('.keypad button:has-text("التالي")');
  await tap('18'); await page.click('.keypad button:has-text("التالي")');
  await page.click('.keypad button:has-text("التالي")'); // عنقود الحصاد فارغ
  await tap('22'); await page.click('.keypad button:has-text("التالي")');
  await tap('24'); // المتبقية أكبر من الكلي → خطأ
  ok(await page.locator('.mfield[data-err="true"]', { hasText: 'أكبر من عدد الأوراق الكلي' }).isVisible(), 'تحقق: الأوراق المتبقية لا تزيد عن الكلي');
  await page.screenshot({ path: `${SHOTS}/07-register-error.png` });
  await page.click('.keypad button:has-text("مسح الحقل")');
  await tap('18');
  await page.screenshot({ path: `${SHOTS}/08-register-plant1.png` });
  await page.click('.keypad button:has-text("التالي")'); // ينتقل للنبات التالي ويحفظ
  await page.locator('.plant-head .big', { hasText: 'R1-P2' }).waitFor();

  // باقي النباتات بلوحة مفاتيح خارجية (Enter للانتقال)
  const rows = [
    ['23', '11.8', '', '7', '22', '3', '5', '6', '4', '17', '', '21', '17'],
    ['25', '12', '', '7', '24', '4', '5', '5', '5', '19', '', '22', '18'],
    ['22.5', '11.5', '', '6', '21', '3', '4', '6', '5', '16', '', '21', '17'],
    ['24', '12.3', '', '7', '23', '5', '5', '6', '6', '18', '', '22', '18'],
    ['23.5', '11.9', '', '7', '22', '4', '5', '6', '5', '17', '', '22', '18'],
    ['24', '12', '', '7', '23', '4', '5', '5', '4', '18', '', '22', '18'],
  ];
  for (const r of rows) {
    for (const v of r) { if (v) await page.keyboard.type(v); await page.keyboard.press('Enter'); }
  }
  // النبات الأخير R5-P2 يبقى فارغًا عمدًا
  await page.locator('.plant-head .big', { hasText: 'R5-P2' }).waitFor();
  await sleep(1200);
  ok(await page.locator('.page-head .chip', { hasText: '7 من 8 نبات' }).isVisible(), 'العداد: 7 من 8 نباتات');
  ok(await page.locator('.sync-pill', { hasText: 'بدون إنترنت' }).isVisible(), 'شارة المزامنة: بدون إنترنت');
  const pendingTxt = await page.locator('.sync-pill').textContent();
  ok(/معلّق/.test(pendingTxt ?? ''), `السجلات معلقة على الجهاز (${pendingTxt?.trim()})`);
  ok(sql('select count(*) from plant_measurements') === '0', 'لا شيء وصل للسيرفر أثناء انقطاع الإنترنت');
  await page.goto(APP + '#/register/' + page.url().split('/register/')[1]);

  // ── 8. إعادة فتح التطبيق بالكامل بدون إنترنت ──────────────────────
  await page.reload();
  await page.locator('.rail button[data-done="true"]').first().waitFor({ timeout: 10000 });
  ok((await page.locator('.rail button[data-done="true"]').count()) === 7, 'بعد إعادة الفتح أوفلاين: التطبيق اشتغل من الكاش والقياسات السبعة محفوظة');
  await page.click('.rail button:has-text("R1-P2")');
  await page.locator('.plant-head .big', { hasText: 'R1-P2' }).waitFor();
  ok((await page.locator('.mfield', { hasText: 'سمك الساق' }).locator('.v').textContent()) === '11.8', 'القيم المحفوظة تظهر صحيحة عند الرجوع للنبات');
  await page.screenshot({ path: `${SHOTS}/09-register-tablet.png` });

  // ── 9. الملخص أوفلاين ─────────────────────────────────────────────
  await page.click('button:has-text("الملخص")');
  await page.locator('.gauge .verdict').waitFor();
  const verdict = (await page.locator('.gauge .verdict').textContent())?.trim();
  ok(verdict === 'خضري', `حكم التوازن محسوب على الجهاز: ${verdict}`);
  ok(await page.locator('.banner', { hasText: 'تم قياس 7 من 8' }).isVisible(), 'تنبيه النباتات غير المقاسة');
  await page.screenshot({ path: `${SHOTS}/10-summary.png`, fullPage: true });

  // ── 10. رجوع الإنترنت ← مزامنة تلقائية ────────────────────────────
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSynced(page, 20000);
  ok(sql('select count(*) from plant_measurements') === '7', 'المزامنة التلقائية رفعت 7 قياسات');
  ok(sql('select count(*) from crop_registration_sessions') === '1', 'جلسة تسجيل واحدة فقط (لا تكرار)');
  const server = sql("select balance_status||'|'||avg_weekly_growth_cm||'|'||avg_stem_diameter_mm from v_crop_weekly_summary");
  const [st, g, d] = server.split('|');
  ok(st === 'vegetative', `السيرفر يعطي نفس الحكم (vegetative) — متوسط الاستطالة ${g} وسمك الساق ${d}`);
  const pct = sql("select fruit_set_pct from plant_measurements m join reference_plants p on p.id=m.reference_plant_id where p.label='R1-P1'");
  ok(pct === '83.3', `نسبة العقد محسوبة في السيرفر لـ R1-P1: ${pct}%`);
  ok(sql("select leaf_count_remaining from plant_measurements m join reference_plants p on p.id=m.reference_plant_id where p.label='R1-P1'") === '18', 'القيمة المصححة (18) هي اللي اترفعت');

  // ── 11. مهندس الفحص على تابلت آخر (عمودي) ─────────────────────────
  const scout = await newTablet({ width: 800, height: 1280 });
  await scout.page.goto(APP + '#/login');
  await scout.page.fill('input[type=email]', 'scout@test.local');
  await scout.page.fill('input[type=password]', 'Scout#2026');
  await scout.page.click('button:has-text("دخول")');
  await scout.page.locator('.gh', { hasText: 'GH-07' }).waitFor({ timeout: 15000 });
  ok(await scout.page.locator('.gh .chip', { hasText: '7 من 8' }).isVisible(), 'المهندس الثاني يرى تقدم التسجيل من الجهاز الأول');
  ok(!(await scout.page.locator('a:has-text("إدارة الصوب")').count()), 'مهندس الفحص لا يرى إدارة الصوب');
  await scout.page.goto(APP + '#/setup');
  await scout.page.locator('h1', { hasText: 'الأسبوع' }).waitFor();
  ok(true, 'محاولة فتح الإعداد بالرابط ترجعه للرئيسية');
  await scout.page.screenshot({ path: `${SHOTS}/11-scout-home-portrait.png` });

  // المهندس يسجل النبات الأخير
  await scout.page.click('.gh:has-text("GH-07")');
  await scout.page.click('.rail button:has-text("R5-P2")');
  await scout.page.locator('.plant-head .big', { hasText: 'R5-P2' }).waitFor();
  for (const v of ['23', '12', '', '7', '22', '4', '5', '6', '5', '18', '', '22', '18']) {
    if (v) await scout.page.keyboard.type(v);
    await scout.page.keyboard.press('Enter');
  }
  await sleep(1200);
  await scout.page.screenshot({ path: `${SHOTS}/12-register-portrait.png` });
  await waitSynced(scout.page, 20000);
  ok(sql('select count(*) from plant_measurements') === '8', 'قياس المهندس اترفع (8 من 8)');
  ok(sql("select m.created_by from plant_measurements m join reference_plants p on p.id=m.reference_plant_id where p.label='R5-P2'") === 'bbbbbbbb-0000-0000-0000-000000000002', 'القياس مسجل باسم مهندس الفحص');

  // المهندس يحاول تعديل قياس سجله المدير ← السيرفر يرفض (RLS) والتطبيق يوضح السبب
  await scout.page.click('.rail button:has-text("R1-P1")');
  await scout.page.locator('.plant-head .big', { hasText: 'R1-P1' }).waitFor();
  await scout.page.click('.mfield:has-text("الأزهار المتفتحة")');
  await scout.page.keyboard.press('Delete');
  await scout.page.keyboard.type('9');
  await sleep(1500);
  await scout.page.locator('.sync-pill', { hasText: 'مرفوض' }).waitFor({ timeout: 20000 });
  await scout.page.click('.sync-pill');
  const rejectedOk = await scout.page.locator('.sheet', { hasText: 'ليس لديك صلاحية' }).waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
  ok(rejectedOk, 'سجل مرفوض يظهر بسبب واضح بالعربي' + (rejectedOk ? '' : ` — ${(await scout.page.locator('.sheet').innerText().catch(() => '')).replace(/\n+/g, ' / ')}`));
  await scout.page.screenshot({ path: `${SHOTS}/13-rejected.png` });
  await scout.page.click('.sheet button:has-text("تجاهل التعديل")');
  await scout.page.click('.sheet button:has-text("زامن الآن")');
  await scout.page.locator('.sync-pill', { hasText: 'متزامن' }).waitFor({ timeout: 20000 });
  ok(sql("select open_flowers_count from plant_measurements m join reference_plants p on p.id=m.reference_plant_id where p.label='R1-P1'") === '4', 'قيمة المدير الأصلية سليمة على السيرفر');

  // ── 12. المدير يرى قياس المهندس ونسبة الاكتمال ────────────────────
  await page.goto(APP + '#/');
  await page.locator('.sync-pill').click();
  await page.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(page);
  await page.keyboard.press('Escape');
  await page.locator('.gh .chip', { hasText: 'سُجّل هذا الأسبوع' }).waitFor({ timeout: 10000 });
  ok(true, 'المدير يرى الصوبة مكتملة بعد مزامنة قياس المهندس');
  await page.screenshot({ path: `${SHOTS}/14-home-complete.png` });

  // ── 13. موبايل ────────────────────────────────────────────────────
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar-EG', hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pp = await phone.newPage();
  await pp.goto(APP + '#/login');
  await pp.screenshot({ path: `${SHOTS}/15-phone-login.png` });
  const hScroll = await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!hScroll, 'لا يوجد تمرير أفقي على الموبايل');

  ok(consoleErrors.length === 0, `لا أخطاء في الكونسول${consoleErrors.length ? ': ' + consoleErrors.slice(0, 3).join(' | ') : ''}`);
} catch (e) {
  failures++;
  console.error('✘ FAILED:', e.message?.split('\n')[0]);
  let i = 0;
  for (const c of browser.contexts()) for (const pg of c.pages()) {
    await pg.screenshot({ path: `${SHOTS}/fail-${i++}.png` }).catch(() => {});
    console.error('  page', pg.url(), (await pg.locator('body').innerText().catch(() => '')).slice(0, 200).replace(/\n+/g, ' / '));
  }
  console.error('  console errors:', consoleErrors.slice(0, 5));
} finally {
  await browser.close();
  preview.kill();
  server.close();
}
console.log(failures ? `\n${failures} فشل` : '\nكل الاختبارات نجحت');
process.exit(failures ? 1 : 0);
