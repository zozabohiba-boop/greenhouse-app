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

const gw = await startGateway();
const { server } = gw;
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
  {
    const sub = (await page.locator('.page-head p').first().textContent()) ?? '';
    ok(/^من \d+ (\S+ )?إلى \d+ \S+ \d{4}، اليوم \S+ \d+ \S+$/.test(sub.trim()), `الرئيسية: مدى الأسبوع بالتاريخ (${sub.trim()})`);
  }
  await page.screenshot({ path: `${SHOTS}/02-home-empty.png` });

  // ── 2. صوبة جديدة ─────────────────────────────────────────────────
  await page.click('text=أضف أول صوبة');
  await page.locator('h1', { hasText: 'هيكل الموقع' }).waitFor();
  await page.click('.zone-bar button:has-text("إضافة")');
  ok(await page.getByRole('button', { name: 'قطاع تقسيم كبير داخل الموقع' }).isVisible() && await page.getByRole('button', { name: /^صف / }).isVisible(), 'الإضافة تبدأ باختيار النوع: قطاع / صف / صوبة');
  await page.click('.add-pick button:has-text("صوبة واحدة")');
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
  ok(await scout.page.locator('.gh .chip', { hasText: '7 من 8' }).waitFor({ timeout: 8000 }).then(() => true, () => false), 'المهندس الثاني يرى تقدم التسجيل من الجهاز الأول');
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

  // ── 14. الفحص الحشري بدون إنترنت (المهندس، تابلت عمودي) ───────────
  const sp = scout.page;
  await sp.keyboard.press('Escape');
  await scout.ctx.setOffline(true);
  await sp.goto(APP + '#/');
  await sp.click('a.action:has-text("الفحص الحشري")');
  await sp.locator('.gh', { hasText: 'GH-07' }).locator('.chip', { hasText: 'لم تُفحص هذا الأسبوع' }).waitFor();
  ok(true, 'شاشة الفحص: GH-07 لم تُفحص هذا الأسبوع');
  await sp.click('.gh:has-text("GH-07")');
  await sp.click('button:has-text("ابدأ فحص اليوم")');
  await sp.locator('.rowmap .rcell').first().waitFor();
  ok(true, 'بدء الفحص بضغطة واحدة (بدون نافذة)');
  ok((await sp.locator('.rowmap .rcell').count()) === 6, 'خريطة الصوبة بعدد الخطوط (6)');
  await sp.click('button[aria-label="الخط التالي"]');
  await sp.click('button[aria-label="الخط التالي"]');
  ok((await sp.locator('.stepper b').textContent()) === '3', 'الخط الحالي = 3');
  await sp.click('.pest-btn:has-text("العنكبوت الأحمر")');
  const os = sp.locator('.sheet');
  ok((await os.locator('label:has-text("الخط") input').first().inputValue()) === '3', 'الملاحظة تاخد الخط الحالي تلقائيًا');
  ok(!(await os.locator('label:has-text("وحدة العد")').isVisible()), 'التفاصيل الإضافية مطوية في الملاحظة الجديدة');
  await os.locator('.sev-pick button[data-v="1"]').click();
  await os.locator('.advice.ok').waitFor();
  ok(true, 'شدة خفيفة: أقل من حد التدخل');
  await os.locator('.sev-pick button[data-v="3"]').click();
  await os.locator('.advice.warn .advice-group li', { hasText: 'Phytoseiulus persimilis' }).waitFor();
  ok(await os.locator('.advice-group[data-approach="chemical"] li', { hasText: 'كاني مايت' }).isVisible(), 'شدة شديدة: خيارات المكافحة تظهر (حيوي ثم طبيعي ثم كيميائي)');
  ok(await os.locator('.advice-guide').isVisible(), 'الإجراءات الزراعية للآفة ظاهرة');
  await os.locator('.obs-more summary').click();
  await os.locator('label:has-text("العدد") input').fill('12');
  await os.locator('.chips-pick button:has-text("بالغات")').click();
  await os.locator('.toggle:has-text("بؤرة إصابة") input').check();
  const sharp = (await import('sharp')).default;
  const png = await sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 180, g: 60, b: 40 } } }).png().toBuffer();
  await os.locator('input[type=file]').setInputFiles({ name: 'mite.png', mimeType: 'image/png', buffer: png });
  await os.locator('.thumb img').first().waitFor();
  await sp.screenshot({ path: `${SHOTS}/16-scout-observation.png` });
  await os.locator('button:has-text("تسجيل")').click();
  await sp.locator('.obs-item', { hasText: 'العنكبوت الأحمر' }).waitFor();
  await sp.click('.pest-btn:has-text("ذبابة التبغ")');
  await sp.locator('.sheet .sev-pick button[data-v="1"]').click();
  await sp.locator('.sheet button:has-text("تسجيل")').click();
  await sp.locator('.obs-item', { hasText: 'ذبابة التبغ' }).waitFor();
  ok((await sp.locator('.rowmap .rcell[data-v="3"]').count()) === 1, 'الخريطة تلوّن الخط 3 بأعلى شدة (3)');
  ok(await sp.locator('.obs-item .chip', { hasText: '1' }).first().isVisible(), 'الملاحظة تعرض عدد الصور');
  await sp.screenshot({ path: `${SHOTS}/17-scout-session.png`, fullPage: true });
  await sp.click('button:has-text("إنهاء الجولة")');
  await sp.locator('h1', { hasText: 'فحص' }).waitFor();
  ok(sql('select count(*) from scouting_observations') === '0', 'الفحص محفوظ على الجهاز فقط أثناء الانقطاع');
  await scout.ctx.setOffline(false);
  await sp.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSynced(sp, 20000);
  ok(sql("select count(*)||'|'||max(severity)||'|'||bool_or(is_hotspot) from scouting_observations") === '2|3|true', 'السيرفر استقبل ملاحظتين (أعلى شدة 3 + بؤرة)');
  ok(sql('select count(*) from attachments') === '1' && gw.stats.objects() === 1, 'الصورة اترفعت للتخزين وسجلها وصل');
  ok(sql("select max_severity||'|'||hotspots from v_pest_weekly where pest_name_ar='العنكبوت الأحمر'") === '3|1', 'v_pest_weekly على السيرفر يطابق');

  // ── 15. المدير: مادة جديدة + توصية من ملاحظة الفحص ────────────────
  await page.goto(APP + '#/');
  await page.locator('.sync-pill').click();
  await page.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(page);
  await page.keyboard.press('Escape');
  await page.locator('.gh .sev', { hasText: 'شديد' }).waitFor({ timeout: 10000 });
  ok(true, 'المدير يرى شدة الإصابة على كارت الصوبة');
  await page.goto(APP + '#/products');
  await page.click('button:has-text("مادة جديدة")');
  const ps = page.locator('.sheet');
  await ps.locator('label:has-text("الاسم التجاري") input').fill('فيرتميك');
  await ps.locator('label:has-text("النوع") select').first().selectOption('acaricide');
  await ps.locator('label:has-text("المادة الفعالة") input').fill('أبامكتين');
  await ps.locator('label:has-text("مجموعة IRAC") input').fill('6');
  await ps.locator('label:has-text("فترة الأمان") input').fill('3');
  await ps.locator('label:has-text("وحدة الجرعة المعتادة") select').selectOption('ml_per_100l');
  await ps.locator('button:has-text("حفظ")').click();
  await page.locator('.tbl td', { hasText: 'فيرتميك' }).waitFor();
  await page.goto(APP + '#/scout');
  await page.click('.gh:has-text("GH-07")');
  await page.click('.list-item >> nth=0');
  await page.click('.obs-item:has-text("العنكبوت الأحمر")');
  await page.locator('.sheet .thumb img').first().waitFor({ timeout: 10000 });
  ok(true, 'المدير يرى صورة الإصابة اللي صورها المهندس');
  ok(await page.locator('.sheet .obs-more[open]').isVisible(), 'الملاحظة المسجلة بتفاصيل تفتح مفرودة');
  await page.click('.sheet button:has-text("حوّلها لتوصية")');
  ok((await page.locator('label:has-text("التوصية") input').inputValue()) === 'مكافحة العنكبوت الأحمر', 'التوصية تتعبى من الملاحظة');
  {
    const body = await page.locator('label:has-text("التفاصيل") textarea').inputValue();
    ok(body.includes('تجاوزت حد التدخل') && body.includes('Phytoseiulus persimilis') && body.includes('إجراءات زراعية'), 'تفاصيل التوصية مكتوبة تلقائيًا من قاعدة المعرفة');
  }
  ok((await page.locator('.seg button[aria-pressed="true"]').textContent()) === 'مهمة', 'الأولوية "مهمة" تلقائيًا لشدة 3');
  await page.fill('label:has-text("التفاصيل") textarea', 'رش أكاروسي موضعي للخطوط 2–4');
  await page.click('button:has-text("إرسال التوصية")');
  await page.locator('.rec h3', { hasText: 'مكافحة العنكبوت الأحمر' }).waitFor();
  await waitSynced(page, 20000);
  ok(sql("select status||'|'||priority||'|'||(observation_id is not null) from recommendations") === 'open|high|true', 'التوصية وصلت السيرفر مرتبطة بالملاحظة');

  // ── 16. المهندس ينفذ التوصية: رش + فترة أمان ──────────────────────
  await sp.goto(APP + '#/');
  await sp.locator('.sync-pill').click();
  await sp.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(sp);
  await sp.keyboard.press('Escape');
  await sp.click('a.action:has-text("التوصيات")');
  await sp.click('.rec a:has-text("سجّل التنفيذ")');
  await sp.locator('.gh-pick button[aria-pressed="true"]', { hasText: 'GH-07' }).waitFor();
  ok(true, 'نموذج المعاملة يفتح بالصوبة من التوصية');
  await sp.locator('.line select').first().selectOption({ label: 'فيرتميك — أبامكتين' });
  await sp.locator('.line label:has-text("الجرعة") input').first().fill('40');
  await sp.fill('label:has-text("حجم المحلول") input', '400');
  ok(await sp.locator('.banner', { hasText: 'فترة الأمان 3 يوم' }).isVisible(), 'فترة الأمان المتوقعة تظهر قبل الحفظ');
  await sp.screenshot({ path: `${SHOTS}/18-activity-form.png`, fullPage: true });
  await sp.click('button:has-text("حفظ المعاملة")');
  await sp.locator('.banner.bad', { hasText: 'ممنوع الحصاد' }).waitFor();
  ok(true, 'صفحة المعاملة: ممنوع الحصاد حتى انتهاء فترة الأمان');
  await waitSynced(sp, 20000);
  ok(sql("select a.activity_type||'|'||ap.dose||'|'||ap.dose_unit from activities a join activity_products ap on ap.activity_id=a.id") === 'chemical_spray|40.000|ml_per_100l', 'المعاملة ومادتها وصلت السيرفر');
  ok(sql("select status from recommendations") === 'done', 'التوصية اتقفلت تلقائيًا على السيرفر بعد التنفيذ');
  ok(sql("select harvest_blocked_today from v_greenhouse_phi_status") === 't', 'v_greenhouse_phi_status: الحصاد ممنوع اليوم');

  // رشة ثانية بنفس المجموعة امبارح ← الثالثة تظهر تحذير تبديل المجموعة
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  await sp.goto(APP + '#/activities/new?type=chemical_spray');
  await sp.click('.gh-pick button:has-text("GH-07")');
  await sp.fill('label:has-text("التاريخ") input', yesterday);
  await sp.locator('.line select').first().selectOption({ label: 'فيرتميك — أبامكتين' });
  await sp.click('button:has-text("حفظ المعاملة")');
  await sp.locator('h1', { hasText: 'رش' }).waitFor();
  await sp.goto(APP + '#/activities/new?type=chemical_spray');
  await sp.click('.gh-pick button:has-text("GH-07")');
  await sp.locator('.line select').first().selectOption({ label: 'فيرتميك — أبامكتين' });
  ok(await sp.locator('.banner.warn', { hasText: 'المجموعة 6' }).isVisible(), 'تحذير المقاومة: نفس المجموعة في آخر معاملتين');
  await sp.screenshot({ path: `${SHOTS}/19-moa-warning.png` });
  await sp.goto(APP + '#/activities');
  await sp.locator('.phi-card', { hasText: 'GH-07' }).waitFor();
  ok(true, 'سجل المعاملات: لوحة الصوب الممنوع حصادها');
  await sp.screenshot({ path: `${SHOTS}/20-activity-log.png` });
  await waitSynced(sp, 20000);

  // ── 17. لوحة المتابعة ──────────────────────────────────────────────
  await page.goto(APP + '#/');
  await page.locator('.sync-pill').click();
  await page.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(page);
  await page.keyboard.press('Escape');
  await page.click('a:has-text("لوحة المتابعة")');
  await page.locator('.kpi').first().waitFor();
  ok((await page.locator('.kpi', { hasText: 'ممنوع الحصاد' }).locator('.v').textContent()) === '1', 'اللوحة: صوبة واحدة ممنوع حصادها');
  ok((await page.locator('.kpi', { hasText: 'الفحص الحشري' }).locator('.v').textContent()) === '1 / 1', 'اللوحة: تغطية الفحص 1 / 1');
  ok((await page.locator('.heat .hcell[data-v="3"]').count()) === 1, 'خريطة ضغط الآفات: خلية الأسبوع الحالي بشدة 3');
  ok((await page.locator('.heat.bal .bcell[data-b="vegetative"]').count()) === 1, 'شريط التوازن: الأسبوع الحالي خضري');
  ok((await page.locator('.chart polyline, .chart .dotp').count()) > 0, 'منحنيات النمو مرسومة');
  await page.screenshot({ path: `${SHOTS}/21-dashboard.png`, fullPage: true });


  // ── 18. هيكل الموقع: قطاع ← صفوف ← صوب ─────────────────────────────
  await page.goto(APP + '#/setup');
  await page.locator('h1', { hasText: 'هيكل الموقع' }).waitFor();
  await page.click('.zone-bar button:has-text("إضافة")');
  await page.getByRole('button', { name: 'قطاع تقسيم كبير داخل الموقع' }).click();
  await page.fill('.sheet label:has-text("الاسم") input', '1');
  ok(await page.locator('.sheet', { hasText: 'سيظهر باسم: قطاع 1' }).isVisible(), 'معاينة اسم القطاع: "قطاع 1"');
  await page.click('.sheet button:has-text("إضافة")');
  await page.locator('.crumbs button[aria-current="page"]', { hasText: 'قطاع 1' }).waitFor();
  ok(true, 'بعد إضافة القطاع يدخل التطبيق داخله تلقائيًا');
  await page.click('.zone-bar button:has-text("إضافة")');
  await page.click('.add-pick button:has-text("عدة أماكن")');
  await page.fill('.sheet label:has-text("من") input', 'A');
  await page.fill('.sheet label:has-text("إلى") input', 'C');
  ok(await page.locator('.sheet .preview-codes .chip').count() === 3, 'معاينة 3 صفوف A–C');
  await page.click('.sheet button:has-text("إنشاء")');
  await page.locator('.zone-card', { hasText: 'صف C' }).waitFor();
  await page.click('.zone-card:has-text("صف A")');
  await page.click('.zone-bar button:has-text("إضافة")');
  await page.click('.add-pick button:has-text("عدة صوب")');
  await page.fill('.sheet label:has-text("من") input', '1');
  await page.fill('.sheet label:has-text("إلى") input', '4');
  await page.fill('.sheet label:has-text("المساحة") input', '1000');
  await page.click('.sheet button:has-text("إنشاء الصوب")');
  await page.locator('.gh', { hasText: '4' }).first().waitFor();
  ok(await page.locator('.zone-browser .gh').count() === 4, 'إنشاء 4 صوب دفعة واحدة داخل صف A');
  await page.click('.crumbs button:has-text("قطاع 1")');
  await page.click('.zone-card:has-text("صف B")');
  await page.click('.zone-bar button:has-text("إضافة")');
  await page.click('.add-pick button:has-text("عدة صوب")');
  await page.fill('.sheet label:has-text("من") input', '1');
  await page.fill('.sheet label:has-text("إلى") input', '2');
  await page.click('.sheet button:has-text("إنشاء الصوب")');
  await page.locator('.zone-browser .gh').nth(1).waitFor();
  ok(await page.locator('.zone-browser .gh').count() === 2, 'نفس الأكواد (1، 2) مسموحة في صف مختلف');
  await page.click('.crumbs button:has-text("كل الموقع")');
  ok(await page.locator('.zone-card', { hasText: 'قطاع 1' }).locator('.zone-meta', { hasText: '3 صفوف' }).isVisible()
    && await page.locator('.zone-card', { hasText: 'قطاع 1' }).locator('.zone-meta', { hasText: '6 صوبة' }).isVisible(), 'كارت القطاع: 3 صفوف و 6 صوب');
  await page.screenshot({ path: `${SHOTS}/23-site-structure.png`, fullPage: true });
  await waitSynced(page, 20000).catch(() => {});
  await page.locator('.sync-pill').click();
  await page.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(page);
  await page.keyboard.press('Escape');
  ok(sql("select count(*) from farm_zones where deleted_at is null") === '4', 'السيرفر: 4 أماكن (قطاع + 3 صفوف)');
  ok(sql("select count(*) from farm_zones z join farm_zones p on p.id = z.parent_id where z.kind='row' and p.name='1'") === '3', 'السيرفر: الصفوف تابعة للقطاع');
  ok(sql("select count(*) from greenhouses where zone_id is not null and code in ('1','2')") === '4', 'السيرفر: الكود 1 و 2 موجودان في صفين مختلفين');

  // الرئيسية: تصفح بالتسلسل
  await page.goto(APP + '#/');
  await page.click('.zone-card:has-text("قطاع 1")');
  await page.click('.zone-card:has-text("صف A")');
  ok(await page.locator('.zone-browser .gh').count() === 4 && await page.locator('.crumbs', { hasText: 'صف A' }).isVisible(), 'الرئيسية: الموقع ← قطاع 1 ← صف A ← 4 صوب');
  await page.screenshot({ path: `${SHOTS}/24-home-drilldown.png`, fullPage: true });
  await page.goBack();
  ok(await page.locator('.zone-card', { hasText: 'صف B' }).isVisible(), 'زر الرجوع يرجع مستوى واحد');

  // المعاملة: اختيار كل صوب صف بضغطة
  await page.goto(APP + '#/activities/new');
  const rowA = page.locator('.gh-group', { hasText: 'صف A' });
  await rowA.locator('button:has-text("الكل (4)")').click();
  ok(await rowA.locator('.gh-pick button[aria-pressed="true"]').count() === 4, 'المعاملة: "الكل" يختار صوب الصف الأربعة');
  await page.goto(APP + '#/');

  // ── 19. الملفات: رفع بدون إنترنت ثم مزامنة ─────────────────────────
  await page.goto(APP + '#/files');
  await page.locator('h1', { hasText: 'الملفات والتقارير' }).waitFor();
  await ctx.setOffline(true);
  await page.click('button:has-text("رفع أول ملف")');
  await page.setInputFiles('.sheet input[type=file]', [
    { name: 'تقرير_زيارة_اكتوبر.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test\n') },
    { name: 'تحليل مياه.xlsx', mimeType: '', buffer: Buffer.from('PK\u0003\u0004 test') },
  ]);
  ok(await page.locator('.sheet .upload-item').count() === 2, 'اختيار ملفين PDF و Excel');
  await page.setInputFiles('.sheet input[type=file]', [{ name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') }]);
  ok(await page.locator('.sheet .form-error', { hasText: 'غير مدعوم' }).isVisible(), 'رفض نوع ملف غير مدعوم برسالة واضحة');
  await page.click('.sheet button:has-text("حفظ ورفع")');
  await page.locator('.doc').nth(1).waitFor();
  ok(await page.locator('.doc .chip', { hasText: 'في انتظار الرفع' }).count() === 2, 'الملفات محفوظة على الجهاز وتنتظر الإنترنت');
  ok(await page.locator('.doc .ftype[data-k="pdf"]').isVisible() && await page.locator('.doc .ftype[data-k="excel"]').isVisible(), 'نوع كل ملف ظاهر (PDF / Excel)');
  await page.screenshot({ path: `${SHOTS}/25-files-offline.png`, fullPage: true });
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSynced(page, 20000);
  await page.locator('.doc .chip', { hasText: 'في انتظار الرفع' }).first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
  ok(await page.locator('.doc .chip', { hasText: 'في انتظار الرفع' }).count() === 0, 'بعد رجوع الإنترنت: الملفات اترفعت');
  ok(sql("select count(*) from documents where deleted_at is null and storage_path like '%/%.pdf'") === '1' && sql("select count(*) from documents where mime_type like '%spreadsheetml%'") === '1', 'السيرفر: سجلات الملفات بنوعها الصحيح');
  ok(gw.stats.keys().filter((k) => k.startsWith('farm-files/')).length === 2, 'التخزين: الملفين في bucket farm-files');
  const [download] = await Promise.all([
    page.waitForEvent('popup').catch(() => null),
    page.locator('.doc button[aria-label^="فتح"]').first().click(),
  ]);
  ok(!(await page.locator('.toast', { hasText: 'تعذر' }).isVisible().catch(() => false)), 'فتح الملف من السيرفر برابط مؤقت');
  if (download) await download.close().catch(() => {});

  // ── 20. بيانات الموقع + الطقس ──────────────────────────────────────
  await page.goto(APP + '#/');
  ok(await page.locator('.wx-strip', { hasText: 'حدّد موقع المزرعة' }).waitFor({ timeout: 10000 }).then(() => true, () => false), 'الرئيسية تطلب تحديد موقع المزرعة للطقس');
  await page.click('.wx-strip');
  await page.locator('label:has-text("خط العرض") input').fill('https://www.google.com/maps/@29.3081,30.8421,15z');
  ok(await page.locator('.coords .chip.ok', { hasText: '29.3081, 30.8421' }).isVisible(), 'قراءة الإحداثيات من رابط خرائط جوجل');
  await page.fill('label:has-text("ملوحة المياه") input', '1.8');
  await page.fill('label:has-text("المالك") input', 'شركة اختبار');
  await page.click('button:has-text("حفظ بيانات الموقع")');
  await page.locator('.toast', { hasText: 'تم حفظ بيانات الموقع' }).waitFor();
  await page.locator('.sync-pill').click();
  await page.locator('.sheet button:has-text("زامن الآن")').click();
  await waitSynced(page);
  await page.keyboard.press('Escape');
  ok(sql("select latitude||','||longitude||','||water_ec_ds_m from farm_profiles") === '29.308100,30.842100,1.80', 'السيرفر: الإحداثيات وملوحة المياه محفوظة');
  await page.goto(APP + '#/weather');
  await page.locator('.day-tabs button').nth(6).waitFor({ timeout: 10000 });
  ok(await page.locator('.day-tabs button').count() === 7, 'الطقس: توقعات 7 أيام');
  ok(await page.locator('.wx-alert[data-level="bad"]', { hasText: 'إجهاد حراري' }).isVisible(), 'الطقس: تنبيه إجهاد حراري اليوم مع التوصية');
  ok(await page.locator('.wx-stat', { hasText: 'الاحتياج المائي' }).locator('b', { hasText: 'ل/م²' }).isVisible(), 'الطقس: تقدير الاحتياج المائي');
  ok(await page.locator('.wx-charts .chart polyline').count() === 4, 'الطقس: 4 منحنيات بالساعة (حرارة، رطوبة، VPD، إشعاع)');
  await page.screenshot({ path: `${SHOTS}/26-weather.png`, fullPage: true });
  await page.locator('.day-tabs button').nth(2).click();
  ok(await page.locator('.wx-alert', { hasText: 'رطوبة ≥ 90%' }).isVisible(), 'الطقس: يوم الرطوبة العالية ينبه لخطر الأمراض الفطرية');
  await page.goto(APP + '#/');
  ok(await page.locator('.wx-strip[data-level="bad"]', { hasText: 'إجهاد حراري' }).waitFor({ timeout: 8000 }).then(() => true, () => false), 'الرئيسية: شريط الطقس يعرض أهم تنبيه اليوم');
  await page.screenshot({ path: `${SHOTS}/27-home-weather.png` });
  // أوفلاين: آخر توقعات محفوظة
  await ctx.setOffline(true);
  await page.goto(APP + '#/weather');
  await page.reload();
  await page.locator('.day-tabs button').first().waitFor({ timeout: 15000 });
  ok(true, 'الطقس: آخر توقعات محفوظة تظهر بدون إنترنت');
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  // ── 21. موقع جديد ───────────────────────────────────────────────────
  await page.goto(APP + '#/');
  await page.click('button[aria-label="القائمة"]');
  await page.click('.sheet button:has-text("مشروع جديد")');
  await page.fill('.sheet label:has-text("اسم الموقع") input', 'موقع تجريبي 2');
  await page.click('.sheet button:has-text("إنشاء الموقع")');
  await page.locator('.topbar', { hasText: 'موقع تجريبي 2' }).waitFor({ timeout: 15000 });
  ok(sql("select m.role from farms f join farm_members m on m.farm_id = f.id where f.name = 'موقع تجريبي 2'") === 'admin', 'موقع جديد: المنشئ مدير نظام فيه');
  ok(await page.locator('h1', { hasText: 'موقع تجريبي 2' }).isVisible(), 'بعد الإنشاء يفتح بيانات الموقع الجديد');
  await page.goto(APP + '#/');
  ok(await page.locator('.zone-card').count() === 0 && await page.locator('.gh').count() === 0, 'الموقع الجديد فارغ ومستقل عن الأول');
  await page.click('button[aria-label="القائمة"]');
  await page.click('.sheet button:has-text("كل المشاريع")');
  await page.locator('.proj-card').nth(1).waitFor({ timeout: 10000 });
  ok(await page.locator('.proj-card').count() === 2, 'شاشة المشاريع تعرض المشروعين');
  ok(await page.locator('.proj-card', { hasText: 'المزرعة الرئيسية' }).locator('.chip', { hasText: 'فحص' }).isVisible(), 'كارت المشروع يعرض حالة الفحص هذا الأسبوع');
  await page.screenshot({ path: `${SHOTS}/28-projects.png` });
  await page.click('.proj-card:has-text("المزرعة الرئيسية")');
  await page.locator('.topbar', { hasText: 'المزرعة الرئيسية' }).waitFor();
  ok(true, 'التنقل بين المشاريع من شاشة المشاريع');

  // ── 22. قاعدة المعرفة + الإدخال السريع ─────────────────────────────
  ok(sql('select count(*) from pest_controls') === '209' && sql("select count(*) from products where farm_id is null") === '150', 'قاعدة المعرفة: 150 مادة و209 ربط آفة ← مكافحة');
  await page.goto(APP + '#/products');
  const search = page.locator('input[aria-label="بحث في المواد"]');
  await search.fill('سبينوساد');
  await page.locator('.prod-tbl tbody tr', { hasText: 'تريسر' }).waitFor();
  ok(await page.locator('.prod-tbl tbody tr').count() === 1 && await page.locator('.prod-tbl tr', { hasText: 'تريسر' }).locator('td', { hasText: '0.3 مل/لتر' }).isVisible(), 'المواد: البحث بالمادة الفعالة + الجرعة من برنامج المكافحة');
  await search.fill('');
  await page.click('.filters .seg button:has-text("حيوي وطبيعي")');
  const bioRows = await page.locator('.prod-tbl tbody tr').count();
  ok(bioRows > 80, `فلتر الحيوي والطبيعي (${bioRows} مادة)`);
  await page.click('.filters .seg button:has-text("الكل")');
  await search.fill('كاني مايت');
  await page.click('.prod-tbl tr:has-text("كاني مايت") button:has-text("خصّص")');
  await page.locator('.sheet label:has-text("فترة الأمان") input').fill('3');
  await page.click('.sheet button:has-text("حفظ")');
  await page.locator('.prod-tbl tr', { hasText: 'كاني مايت' }).locator('td', { hasText: '3 يوم' }).waitFor();
  ok(await page.locator('.prod-tbl tbody tr').count() === 1, 'تخصيص مادة عامة: نسخة المزرعة بفترة الأمان تحل محل الأصل');

  await page.goto(APP + '#/activities/new');
  await page.locator('select[aria-label="المادة"]').first().selectOption({ label: 'كاني مايت — أسيكينوسيل' });
  ok(await page.locator('.line label:has-text("الجرعة") input').first().inputValue() === '0.5', 'المعاملة: الجرعة تتملى تلقائيًا من المادة');

  const actsBefore = Number(sql('select count(*) from activities where deleted_at is null'));
  await page.goto(APP + '#/activities');
  await page.locator('.list-item').first().click();
  await page.click('a:has-text("كرّر المعاملة")');
  await page.locator('h1', { hasText: 'معاملة' }).first().waitFor();
  ok(await page.locator('input[type=date]').first().inputValue() === new Date().toLocaleDateString('en-CA'), 'تكرار المعاملة: بتاريخ اليوم');
  ok(await page.locator('.gh-pick button[aria-pressed="true"]').count() >= 1 && await page.locator('select[aria-label="المادة"]').first().inputValue() !== '', 'تكرار المعاملة: نفس الصوب والمواد');
  await page.click('button:has-text("حفظ المعاملة")');
  await page.locator('h1', { hasText: 'رش' }).first().waitFor({ timeout: 10000 }).catch(() => {});
  await waitSynced(page, 20000);
  ok(Number(sql('select count(*) from activities where deleted_at is null')) === actsBefore + 1, 'المعاملة المكررة وصلت السيرفر كسجل جديد');

  // الفحص: الصوبة التالية في نفس الصف
  const gh1 = sql("select g.id from greenhouses g join farm_zones z on z.id = g.zone_id where z.name = 'A' and g.code = '1'");
  await page.goto(APP + `#/scout/gh/${gh1}`);
  await page.click('button:has-text("ابدأ فحص اليوم")');
  await page.locator('.pest-btn').first().waitFor();
  await page.click('button:has-text("إنهاء الجولة")');
  await page.locator('.sheet', { hasText: 'الصوبة التالية' }).waitFor();
  ok(await page.locator('.sheet', { hasText: 'باقي 3 صوبة' }).isVisible(), 'بعد إنهاء الفحص: يقترح الصوبة التالية في نفس الصف');
  await page.click('.sheet button:has-text("ابدأ فحص")');
  await page.locator('h1', { hasText: 'فحص 2' }).waitFor();
  ok(true, 'بدء فحص الصوبة التالية بضغطة');

  // المستهدف غير المنطقي للفلفل
  await page.goto(APP + `#/setup/greenhouses/${gh1}/cycles/new`);
  await page.locator('label:has-text("المحصول") select').selectOption({ label: 'فلفل' });
  await page.click('button:has-text("إضافة الدورة")');
  await page.click('button:has-text("تحديد القيم")');
  await page.locator('input[aria-label="الاستطالة الأسبوعية الحد الأدنى"]').fill('60');
  await page.locator('input[aria-label="الاستطالة الأسبوعية الحد الأعلى"]').fill('75');
  ok(await page.locator('.sheet .banner.warn', { hasText: 'أعلى من المعتاد لمحصول فلفل' }).isVisible(), 'تنبيه: استطالة 60–75 سم غير منطقية للفلفل');
  await page.keyboard.press('Escape');

  // ── 13. موبايل ────────────────────────────────────────────────────
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar-EG', hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pp = await phone.newPage();
  await pp.goto(APP + '#/login');
  await pp.screenshot({ path: `${SHOTS}/15-phone-login.png` });
  const hScroll = await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  // باقي الشاشات على الموبايل بدخول المهندس
  await pp.fill('input[type=email]', 'scout@test.local');
  await pp.fill('input[type=password]', 'Scout#2026');
  await pp.click('button:has-text("دخول")');
  await pp.locator('.gh').first().waitFor({ timeout: 15000 });
  const wide = [];
  for (const r of ['#/', '#/scout', '#/activities', '#/activities/new', '#/recs', '#/dashboard', '#/files', '#/weather', '#/farm']) {
    await pp.goto(APP + r);
    await sleep(700);
    if (await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) wide.push(r);
  }
  ok(wide.length === 0, 'كل الشاشات الجديدة بدون تمرير أفقي على الموبايل' + (wide.length ? ': ' + wide.join(' ') : ''));
  await pp.goto(APP + '#/dashboard');
  await sleep(800);
  await pp.screenshot({ path: `${SHOTS}/22-phone-dashboard.png`, fullPage: true });
  ok(!hScroll, 'لا يوجد تمرير أفقي على الموبايل');

  ok(consoleErrors.length === 0, `لا أخطاء في الكونسول${consoleErrors.length ? ': ' + consoleErrors.slice(0, 3).join(' | ') : ''}`);
} catch (e) {
  failures++;
  console.error('✘ FAILED:', e.message?.split('\n').slice(0, 6).join(' / '));
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
