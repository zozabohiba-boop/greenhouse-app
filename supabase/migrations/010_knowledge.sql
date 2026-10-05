-- =====================================================================
--  Migration 010 — قاعدة المعرفة الزراعية (مولّدة من scripts/knowledge/knowledge.py)
--  * الآفات: حد التدخل على مقياس الشدة + المحاصيل المعنية + التوجيه
--  * المنتجات: حيوي/طبيعي؟ + الجرعة الافتراضية + الاستهداف
--  * pest_controls: خيارات المكافحة لكل آفة (حيوي/طبيعي/كيميائي/مصائد/تغذية)
--  المصادر: ملخص المركبات الحيوية + موازنة احتياجات محاصيل الخضر (روت 2026–2027)
--  فترة الأمان (PHI) لا تُملأ هنا: تُؤخذ من ملصق العبوة المسجلة محليًا.
-- =====================================================================

alter table public.pests
  add column if not exists action_severity smallint check (action_severity between 1 and 4),
  add column if not exists crops text[],
  add column if not exists guidance text;
comment on column public.pests.action_severity is 'حد التدخل الاسترشادي على مقياس الشدة 1–4';
comment on column public.pests.crops is 'رموز المحاصيل المعنية (null = كل المحاصيل)';

alter table public.products
  add column if not exists is_bio boolean not null default false,
  add column if not exists default_dose numeric(10,3) check (default_dose is null or default_dose >= 0),
  add column if not exists targets text;
comment on column public.products.is_bio is 'منتج حيوي أو طبيعي (مقبول في البرامج الحيوية)';

create table if not exists public.pest_controls (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),   -- null = كتالوج عام
  pest_id           uuid not null references public.pests(id),
  product_id        uuid not null references public.products(id),
  approach          text not null check (approach in ('biological','natural','chemical','trap','nutrition')),
  priority          smallint not null default 100,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
comment on table public.pest_controls is 'خيارات المكافحة المقترحة لكل آفة — أساس التوصية التلقائية';
create unique index if not exists pest_controls_uq on public.pest_controls
  (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), pest_id, product_id) where deleted_at is null;
create index if not exists pest_controls_pest_idx on public.pest_controls (pest_id);
create index if not exists pest_controls_product_idx on public.pest_controls (product_id);
create index if not exists pest_controls_farm_idx on public.pest_controls (farm_id);
create index if not exists pest_controls_sync_idx on public.pest_controls (server_updated_at);
create trigger pest_controls_touch before insert or update on public.pest_controls
  for each row execute function app.touch_row();

alter table public.pest_controls enable row level security;
create policy pest_controls_select on public.pest_controls for select to authenticated
  using (farm_id is null or app.is_member(farm_id));
create policy pest_controls_insert on public.pest_controls for insert to authenticated
  with check (farm_id is not null and app.has_role(farm_id, '{admin,farm_manager,consultant}'));
create policy pest_controls_update on public.pest_controls for update to authenticated
  using (farm_id is not null and app.has_role(farm_id, '{admin,farm_manager,consultant}'))
  with check (farm_id is not null and app.has_role(farm_id, '{admin,farm_manager,consultant}'));
grant select, insert, update on public.pest_controls to authenticated;

-- ── معرفة الآفات ─────────────────────────────────────────────
update public.pests set action_severity = 1, crops = null, guidance = 'افحص السطح السفلي لأوراق القمة. ناقلة لفيروس تجعد واصفرار أوراق الطماطم، فالتدخل يبدأ من أول ظهور. شبك محكم على الفتحات، ومصائد صفراء للرصد، وإزالة الحشائش حول الصوبة.' where farm_id is null and code = 'whitefly_bt';
update public.pests set action_severity = 2, crops = null, guidance = 'افحص السطح السفلي لأوراق القمة. مصائد صفراء للرصد، وإطلاق الأعداء الحيوية مبكرًا قبل ارتفاع الكثافة.' where farm_id is null and code = 'whitefly_tv';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص الأزهار. ناقل لفيروس الذبول المتبقع، فالتدخل مبكر. مصائد زرقاء للرصد، وإزالة الحشائش والأزهار المصابة.' where farm_id is null and code = 'thrips_wft';
update public.pests set action_severity = 2, crops = null, guidance = 'افحص الأوراق الحديثة والأزهار. مصائد زرقاء للرصد.' where farm_id is null and code = 'thrips_tabaci';
update public.pests set action_severity = 1, crops = array['tomato','eggplant']::text[], guidance = 'مصائد فرمونية للرصد. افحص الأنفاق في الأوراق العلوية والثمار. أزل الأوراق والثمار المصابة وأعدمها خارج الصوبة، وأحكم الشبك والباب المزدوج.' where farm_id is null and code = 'tuta';
update public.pests set action_severity = 2, crops = null, guidance = 'افحص الأنفاق في الأوراق السفلية والمتوسطة. مصائد صفراء للرصد، وإزالة الأوراق المصابة بشدة.' where farm_id is null and code = 'leafminer';
update public.pests set action_severity = 2, crops = null, guidance = 'افحص القمم النامية والسطح السفلي للأوراق. عالج البؤر موضعيًا مبكرًا، وتجنب الإفراط في التسميد النيتروجيني.' where farm_id is null and code = 'aphids';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص الثمار والقمم. مصائد فرمونية للرصد، وإزالة الثمار المصابة.' where farm_id is null and code = 'helicoverpa';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص لطع البيض واليرقات الصغيرة على الأوراق. مصائد فرمونية للرصد، وجمع اللطع يدويًا عند ظهورها.' where farm_id is null and code = 'spodoptera';
update public.pests set action_severity = 2, crops = null, guidance = 'افحص السطح السفلي للأوراق في البؤر الحارة والجافة وقرب الممرات. عالج البؤرة موضعيًا من أول ظهور، وارفع الرطوبة إن أمكن.' where farm_id is null and code = 'spider_mite';
update public.pests set action_severity = 1, crops = array['tomato']::text[], guidance = 'افحص الساق والأوراق السفلية (لون برونزي). ينتشر بسرعة؛ عالج البؤرة وما حولها فورًا.' where farm_id is null and code = 'russet_mite';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص القمم النامية (تشوه والتواء الأوراق الحديثة). ينتشر بسرعة؛ تدخل فوري.' where farm_id is null and code = 'broad_mite';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص الأوراق السفلية والمتوسطة. تدخل وقائي مبكر، وتحسين التهوية، وتجنب الإجهاد المائي.' where farm_id is null and code = 'powdery_mildew';
update public.pests set action_severity = 1, crops = array['cucumber','melon']::text[], guidance = 'افحص الأوراق بعد ليالي الرطوبة العالية. قلل ساعات ابتلال الأوراق بالتهوية والتدفئة، وتدخل وقائي عند توقع رطوبة عالية.' where farm_id is null and code = 'downy_mildew';
update public.pests set action_severity = 1, crops = array['tomato']::text[], guidance = 'افحص بعد فترات الرطوبة العالية والحرارة المعتدلة. ينتشر بسرعة كبيرة؛ أزل الأجزاء المصابة فورًا وتدخل وقائيًا.' where farm_id is null and code = 'late_blight';
update public.pests set action_severity = 2, crops = array['tomato','eggplant']::text[], guidance = 'افحص الأوراق السفلية. أزل الأوراق المصابة، وتجنب الإجهاد الغذائي.' where farm_id is null and code = 'early_blight';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص جروح التوريق والثمار والساق. قلل الرطوبة وابتلال الأسطح، ونظف جروح التقليم، وأزل المخلفات المصابة.' where farm_id is null and code = 'botrytis';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص الذبول من الأسفل وتلون الأوعية. أزل النباتات المصابة بالجذور، وعقم البيئة بين الدورات، واستخدم أصنافًا أو أصولًا مقاومة.' where farm_id is null and code = 'fusarium_wilt';
update public.pests set action_severity = 1, crops = array['tomato']::text[], guidance = 'لا يوجد علاج للنبات المصاب: أزل النباتات المصابة مبكرًا، واضبط الذبابة البيضاء (الناقل) بشدة، واستخدم أصنافًا متحملة وشتلات خالية من الإصابة.' where farm_id is null and code = 'tylcv';
update public.pests set action_severity = 1, crops = array['tomato','pepper']::text[], guidance = 'لا يوجد علاج: عزل وإزالة النباتات المصابة، وتطهير الأيدي والأدوات والأحذية، ومنع انتقال العمالة بين الصوب، وأصناف مقاومة.' where farm_id is null and code = 'tobrfv';
update public.pests set action_severity = 1, crops = null, guidance = 'افحص العقد على الجذور عند ذبول غير مبرر. عقم التربة أو البيئة بين الدورات، واستخدم أصولًا مقاومة ومركبات النيماتودا مع الري.' where farm_id is null and code = 'root_knot';
update public.pests set action_severity = 1, crops = array['tomato','pepper']::text[], guidance = 'اضطراب فسيولوجي من نقص الكالسيوم في الثمرة: انتظام الري، وضبط EC، وتحسين التهوية والنتح، وكالسيوم ورقي.' where farm_id is null and code = 'blossom_end_rot';

-- ── الأعداء الحيوية الموجودة: حيوي + استهداف ─────────────────
update public.products set is_bio = true, targets = 'مفترس — التوتا والذبابة البيضاء' where farm_id is null and name = 'Nesidiocoris tenuis';
update public.products set is_bio = true, targets = 'مفترس — الذبابة البيضاء والتوتا' where farm_id is null and name = 'Macrolophus pygmaeus';
update public.products set is_bio = true, targets = 'أكاروس مفترس — الذبابة البيضاء والتربس والأكاروس العريض' where farm_id is null and name = 'Amblyseius swirskii';
update public.products set is_bio = true, targets = 'أكاروس مفترس — العنكبوت الأحمر' where farm_id is null and name = 'Phytoseiulus persimilis';
update public.products set is_bio = true, targets = 'بقة مفترسة — التربس' where farm_id is null and name = 'Orius laevigatus';
update public.products set is_bio = true, targets = 'متطفل — الذبابة البيضاء' where farm_id is null and name = 'Encarsia formosa';
update public.products set is_bio = true, targets = 'متطفل — الذبابة البيضاء' where farm_id is null and name = 'Eretmocerus eremicus';
update public.products set is_bio = true, targets = 'متطفل — المن' where farm_id is null and name = 'Aphidius colemani';
update public.products set is_bio = true, targets = 'متطفل بيض — التوتا وحرشفية الأجنحة' where farm_id is null and name = 'Trichogramma achaeae';
update public.products set is_bio = true, targets = 'خلايا النحل الطنان للتلقيح' where farm_id is null and name = 'Bombus terrestris';

-- ── المنتجات الجديدة (تُضاف مرة واحدة فقط) ───────────────────
insert into public.products (name, product_type, is_bio, active_ingredient, moa_code, default_dose, default_dose_unit, targets, bio_species)
select v.name, v.ptype::public.product_type, v.bio, v.ai, v.moa, v.dose, v.unit::public.dose_unit, v.targets, v.species from (values
  ('سيريناد أسو', 'fungicide', true, 'Bacillus subtilis QST 713', 'BM02', null::numeric, null, 'مبيد فطري ورقي ومنشط للجذور: أعفان الثمار، البياض الزغبي، اللطعة الأرجوانية في البصل', null),
  ('بريف إيه إم', 'acaricide', true, null, null, 2.5, 'ml_per_l', 'مركب 3 في 1 (فطري، حشري، أكاروسي): البياض الدقيقي، الذبابة البيضاء، العنكبوت الأحمر', null),
  ('بيوارك', 'fungicide', true, null, null, null::numeric, null, 'أعفان الثمار والندوات: البياض الدقيقي، الندوة المبكرة، الندوة المتأخرة', null),
  ('بيوكونترول', 'fungicide', true, null, null, 1.5, 'g_per_l', 'فطريات التربة: القشرة السوداء، أعفان الثمار والجذور، موت البادرات', null),
  ('بيوزيد', 'fungicide', true, null, null, null::numeric, null, 'الندوات والتبقعات: البياض الدقيقي، الندوة المتأخرة والمبكرة، التبقع البني', null),
  ('بومينال', 'other', true, null, null, null::numeric, null, 'جاذب لذبابة الفاكهة — يُستخدم في المصائد فقط', null),
  ('بايو-دوكون', 'fungicide', true, null, null, null::numeric, null, 'البياض الدقيقي', null),
  ('بايوكيور-إف', 'fungicide', true, 'Pseudomonas fluorescens', null, null::numeric, null, 'مقاومة شاملة: البياض الزغبي، الندوة المتأخرة، أعفان الجذور، موت البادرات، ذبول الشتلات، الصدأ', null),
  ('بايوكيور-بي', 'fungicide', true, 'Bacillus subtilis', null, null::numeric, null, 'الصدأ والتبقعات واللفحة (القمح والأرز ومحاصيل أخرى)', null),
  ('هيليوسوفر', 'fungicide', true, 'كبريت', 'M02', null::numeric, null, 'مبيد فطري وقائي وعلاجي: البياض الدقيقي', null),
  ('سوريل زراعي كرد', 'fungicide', true, null, null, null::numeric, null, 'مسحوق تعفير فطري وحشري وأكاروسي ووقائي', null),
  ('اكسيلان', 'fungicide', true, null, null, null::numeric, null, 'مصل نباتي علاجي ووقائي: البياض الدقيقي والزغبي', null),
  ('إنذار', 'biostimulant', true, null, null, null::numeric, null, 'لقاح نباتي ينشط دفاعات النبات ضد آفات الأوراق والثمار', null),
  ('بوردو كفارو', 'fungicide', false, null, null, 2.5, 'g_per_l', 'وقاية من البياض الزغبي، الندوة المتأخرة، الندوة البدرية، لفحة الأزهار، عفن السرة', null),
  ('فليجرين', 'fungicide', true, null, null, null::numeric, null, 'البياض الدقيقي وبعض الفطريات السطحية', null),
  ('الكبريت النانو', 'fungicide', true, 'كبريت', 'M02', null::numeric, null, 'الأمراض الفطرية والحشرات بدقة أكبر', null),
  ('الكبريت السائل', 'fungicide', true, 'كبريت', 'M02', null::numeric, null, 'الأمراض الفطرية بشكل أسرع', null),
  ('كبريت ميكروني', 'fungicide', true, 'كبريت', 'M02', 2.5, 'g_per_l', 'الحشرات والعناكب مثل العنكبوت الأحمر، وبعض الأمراض الفطرية', null),
  ('بيكربونات البوتاسيوم', 'fungicide', true, 'بيكربونات البوتاسيوم', null, null::numeric, null, 'سماد ومبيد فطري ومنظم للـ pH: البياض الدقيقي', null),
  ('سيليكات البوتاسيوم', 'biostimulant', true, 'سيليكات البوتاسيوم', null, null::numeric, null, 'تعزيز مقاومة النبات للأمراض والحشرات والإجهاد (جفاف، صقيع، ملوحة)', null),
  ('برمنجانات البوتاسيوم', 'other', true, 'برمنجانات البوتاسيوم', null, null::numeric, null, 'تعقيم التربة والبذور، يحد من انتشار الأمراض الفطرية', null),
  ('جلوبر', 'fungicide', false, 'مركب نحاسي', 'M01', null::numeric, null, 'مركب نحاسي يحفز دفاعات النبات ضد الإصابات الفطرية', null),
  ('هيلوتروم', 'fungicide', true, null, null, null::numeric, null, 'العفن الرمادي والألترناريا والصدأ والسكليروتينيا', null),
  ('EQUISTUN', 'fungicide', true, null, null, null::numeric, null, 'مكافحة الفطريات الممرضة: البياض الزغبي', null),
  ('سيليكات الماغنسيوم', 'biostimulant', true, 'سيليكات الماغنسيوم', null, null::numeric, null, 'تقليل البياض الدقيقي والصدأ وبعض مسببات الذبول وضرر الحشرات الثاقبة الماصة، وتحسين صلابة الأنسجة', null),
  ('فوسفات البوتاسيوم', 'fungicide', true, null, null, null::numeric, null, 'مبيد فطري طبيعي: البياض الدقيقي واللفحات', null),
  ('خل الخشب', 'fungicide', true, null, null, 3, 'ml_per_l', 'مطهر طبيعي للتربة: يحد من الأعفان ويقلل نشاط الفطريات ويطرد بعض الحشرات', null),
  ('صابون البوتاسيوم', 'insecticide', true, 'صابون البوتاسيوم', null, null::numeric, null, 'بالملامسة على الحشرات الرخوة: المن، الذبابة البيضاء، العنكبوت الأحمر (خفيف)', null),
  ('أويكوس', 'insecticide', true, 'أزاديراختين', 'UN', null::numeric, null, 'آمن على الأعداء الحيوية: الذبابة البيضاء والنيماتودا', null),
  ('نمبيسيدين', 'insecticide', true, 'أزاديراختين (زيت النيم)', 'UN', 2.5, 'ml_per_l', 'آمن على الحشرات النافعة: الذبابة البيضاء، المن، التربس، البق الدقيقي، نطاطات الأوراق', null),
  ('زنتاري', 'insecticide', true, 'Bacillus thuringiensis subsp. aizawai', '11A', null::numeric, null, 'يرقات حرشفية الأجنحة: فراشة درنات البطاطس، دودة ورق القطن، دودة ثمار العنب', null),
  ('دايبل دي إف', 'insecticide', true, 'Bacillus thuringiensis subsp. kurstaki', '11A', 1, 'g_per_l', 'يرقات حرشفية الأجنحة: دودة ورق القطن، التوتا أبسليوتا', null),
  ('تاجليس', 'nematicide', true, null, null, null::numeric, null, 'جميع أنواع النيماتودا', null),
  ('بيوتكت', 'insecticide', true, null, null, null::numeric, null, 'الديدان: ورق القطن، اللوز، درنات البطاطس، الثمار، البراعم، ديدان الأوراق', null),
  ('بيوسكت', 'insecticide', true, null, null, null::numeric, null, 'الحشرات والعناكب: العنكبوت الأحمر، الذبابة البيضاء، المن، النطاطات', null),
  ('بروتكتو', 'insecticide', true, null, null, 1, 'g_per_l', 'الطور اليرقي لحرشفية الأجنحة: دودة ورق القطن، الحشد، درنات البطاطس، التوتا', null),
  ('تريسر', 'insecticide', true, 'سبينوساد', '5', 0.3, 'ml_per_l', 'بالملامسة أو الابتلاع: ديدان ثمار العنب، درنات البطاطس، ورق القطن، ديدان الطماطم، التربس', null),
  ('بايو-كاتش', 'insecticide', true, 'Lecanicillium (Verticillium) lecanii', null, null::numeric, null, 'الآفات الثاقبة الماصة: الذباب الأبيض، المن، البق الدقيقي', null),
  ('بايو باور', 'insecticide', true, 'Beauveria bassiana', null, null::numeric, null, 'الحفار، الديدان القارضة، اليرقات الجذرية، نطاطات الأوراق، الذبابة البيضاء، المن، التربس، البق الدقيقي', null),
  ('بايو-ماجيك', 'insecticide', true, 'Metarhizium anisopliae', null, null::numeric, null, 'النطاطات والجراد واليرقات الجذرية والبق والخنافس وسوسة النخيل والحفار والديدان القارضة والنمل الأبيض', null),
  ('بايو-نيماتون', 'nematicide', true, 'Purpureocillium (Paecilomyces) lilacinus', null, null::numeric, null, 'النيماتودا بكل أنواعها', null),
  ('فلاي كاب', 'other', true, null, null, null::numeric, null, 'جذب إناث ذبابة الفاكهة', null),
  ('الديترجنت الزراعي المتعادل', 'insecticide', true, null, null, null::numeric, null, 'الحشرات الثاقبة والعنكبوت الأحمر', null),
  ('بروديك', 'insecticide', true, null, null, null::numeric, null, 'مركب حيوي/طبيعي ضد الحشرات الثاقبة الماصة', null),
  ('فاكسيميت', 'insecticide', true, null, null, null::numeric, null, 'عضوي وقائي وعلاجي ضد الحشرات الثاقبة الماصة', null),
  ('سيف بلانت', 'nematicide', true, null, null, 4, 'ml_per_l', 'مركب طبيعي عضوي لجميع أنواع النيماتودا', null),
  ('نيما زيرو', 'nematicide', true, null, null, null::numeric, null, 'مركب نيماتودي ومغذي آمن: أمراض التربة والنيماتودا', null),
  ('زيت التيكنو أوي', 'insecticide', true, null, null, null::numeric, null, 'منتج نباتي وقائي: الحشرات القشرية، البق الدقيقي، دودة ورق القطن', null),
  ('سافيور', 'nematicide', true, null, null, null::numeric, null, 'يطهر الجذور من التلف الناتج عن النيماتودا', null),
  ('زيت النيم', 'insecticide', true, 'زيت النيم', null, null::numeric, null, 'المن، الذبابة البيضاء، التربس، العناكب الحمراء، الديدان القارضة، الخنافس، النيماتودا، والبياض الدقيقي', null),
  ('تارسوس', 'insecticide', true, null, null, null::numeric, null, 'الحشرات صغيرة الحجم: الذبابة البيضاء، المن، العنكبوت الأحمر، البق الدقيقي، التربس', null),
  ('نيماكيل', 'nematicide', true, null, null, null::numeric, null, 'وقاية وعلاج من النيماتودا، ويحد من أعفان الجذور', null),
  ('MUFFLY', 'insecticide', true, null, null, null::numeric, null, 'الحشرات الماصة (المن، الذبابة البيضاء، التربس) + تصحيح نقص الزنك والمنجنيز', null),
  ('URTIQAS', 'acaricide', true, null, null, null::numeric, null, 'مكافحة العنكبوت الأحمر', null),
  ('زيت ريبيماج', 'insecticide', true, null, null, 2.5, 'ml_per_l', 'الحشرات القشرية والبق الدقيقي والحشرات الثاقبة الماصة (2.5 مل/لتر للطماطم، 5 للخيار والفلفل)', null),
  ('فيرمونات التوتا', 'other', true, null, null, null::numeric, null, 'مصائد فرمونية لحافرة أوراق الطماطم Tuta absoluta', null),
  ('فيرمونات دودة ورق القطن', 'other', true, null, null, null::numeric, null, 'مصائد فرمونية لدودة ورق القطن Spodoptera littoralis', null),
  ('المصائد الصفراء', 'other', true, null, null, null::numeric, null, 'رصد وجذب: الذباب الأبيض، المن المجنح، صانعات الأنفاق', null),
  ('المصائد الزرقاء', 'other', true, null, null, null::numeric, null, 'رصد وجذب: التربس', null),
  ('المصائد الحمراء', 'other', true, null, null, null::numeric, null, 'جذب ذبابة الفاكهة والحشرات التي تنجذب للطيف الأحمر', null),
  ('المصائد السوداء', 'other', true, null, null, null::numeric, null, 'جذب التربس وبعض الحشرات الصغيرة التي تنجذب للون الداكن', null),
  ('كروب بلس', 'biostimulant', true, null, null, 1, 'ml_per_l', 'عناصر مغذية تساعد على مقاومة الإجهاد (الجفاف أو الأمراض الخفيفة)', null),
  ('سوبر جرو', 'fertilizer', true, 'فوسفات صخري + كائنات مذيبة للفوسفور', null, null::numeric, null, 'يوفر احتياجات الفوسفور', null),
  ('سمبيون فام', 'biostimulant', true, null, null, null::numeric, null, 'يسهل انتقال الماء والعناصر، يزيد مقاومة الإجهاد، كربوهيدرات وأحماض أمينية', null),
  ('سمبيون الأزوت', 'fertilizer', true, null, null, null::numeric, null, 'مخصب حيوي يثبت النيتروجين الجوي', null),
  ('سمبيون البوتاسيوم', 'fertilizer', true, null, null, null::numeric, null, 'مخصب حيوي يعزز امتصاص البوتاسيوم', null),
  ('سمبيون الفوسفور', 'fertilizer', true, null, null, null::numeric, null, 'يمد النبات بالفوسفور ويحسن خصوبة التربة', null),
  ('رينتال', 'biostimulant', true, null, null, null::numeric, null, 'التغلب على إجهاد ما بعد الزراعة، ينشط التجذير', null),
  ('نيوسترين', 'biostimulant', true, null, null, null::numeric, null, 'يحسن محتوى الكالسيوم ويقلل التشقق والتجعد', null),
  ('جروفول (طحالب بحرية)', 'biostimulant', true, 'مستخلص طحالب بحرية', null, 1, 'ml_per_l', 'تعزيز الإنتاج ونمو الأوراق وجودة الثمار', null),
  ('أجريسترين', 'biostimulant', true, null, null, null::numeric, null, 'يحافظ على معدل النمو في الظروف المختلفة', null),
  ('فورتسترين', 'biostimulant', true, null, null, null::numeric, null, 'التكيف مع الإجهاد الحراري وزيادة التمثيل الضوئي', null),
  ('كولور سيف', 'biostimulant', true, null, null, null::numeric, null, 'تطوير لون الثمار', null),
  ('فيوري', 'biostimulant', true, null, null, null::numeric, null, 'منشط لعملية الإزهار', null),
  ('ماتيور', 'biostimulant', true, null, null, null::numeric, null, 'منشط لنضج الثمار وتحمل الحرارة العالية', null),
  ('كريبتوم', 'adjuvant', true, null, null, null::numeric, null, 'يخفض حموضة محلول الرش ويعزز امتصاص المغذيات والمبيدات', null),
  ('كريبتوم حديد', 'fertilizer', true, null, null, null::numeric, null, 'يحفز نمو الجذور ويخفض حموضة محلول الرش', null),
  ('كويكل', 'biostimulant', true, null, null, null::numeric, null, 'تحفيز الإزهار وعقد الثمار والتعافي بعد الإجهاد الحراري', null),
  ('CRIPTHUM New', 'fertilizer', true, null, null, null::numeric, null, 'تحسين بنية التربة وتغذيتها', null),
  ('HORTUMUS', 'fertilizer', true, null, null, null::numeric, null, 'تعديل هيومي للتربة وتحفيز الجذور', null),
  ('HUMIPOWER سائل', 'fertilizer', true, 'أحماض هيومية', null, null::numeric, null, 'إطلاق العناصر المحجوزة والاحتفاظ بالماء', null),
  ('HUMIPOWER SOLUBLE', 'fertilizer', true, 'أحماض هيومية', null, null::numeric, null, 'إطلاق العناصر المحجوزة والاحتفاظ بالماء', null),
  ('HUMIPOWER SOLID', 'fertilizer', true, 'أحماض هيومية + ميكوريزا', null, null::numeric, null, 'تحسين التربة مع الميكوريزا', null),
  ('ORGAPLANT-Ca', 'fertilizer', true, null, null, null::numeric, null, 'يحسن بنية التربة ونظام الجذور', null),
  ('ORGAPLANT-NK', 'fertilizer', true, null, null, null::numeric, null, 'يحسن خصوبة التربة ويدعم الإنتاجية', null),
  ('ORGAPLANT ORGANIC', 'biostimulant', true, null, null, null::numeric, null, 'نيتروجين عضوي وأحماض أمينية للظروف الصعبة', null),
  ('DISPERSAL', 'other', true, null, null, null::numeric, null, 'مصحح للتربة والمياه المالحة، يزيل أملاح الصوديوم', null),
  ('AQUAPOWER', 'other', true, null, null, null::numeric, null, 'مهيكل تربة: يحسن استهلاك مياه الري ويمنع تراكم الأملاح', null),
  ('ABSORTIM', 'other', true, null, null, null::numeric, null, 'يرفع قدرة الاحتفاظ بالماء في التربة الخفيفة', null),
  ('QUICELU', 'fertilizer', true, null, null, null::numeric, null, 'زيادة الكالسيوم وتحسين جودة الثمار وتقليل التشقق', null),
  ('أسد المن', 'biocontrol_agent', true, null, null, null::numeric, 'individuals_per_m2', 'المن، البق الدقيقي، العناكب، التربس، الذبابة البيضاء، اليرقات الصغيرة', 'Chrysoperla carnea'),
  ('أبو العيد ذو السبع نقاط', 'biocontrol_agent', true, null, null, null::numeric, 'individuals_per_m2', 'المن، الحشرات القشرية، البق الدقيقي، البيض واليرقات الصغيرة', 'Coccinella septempunctata'),
  ('Diglyphus isaea', 'biocontrol_agent', true, null, null, null::numeric, 'individuals_per_m2', 'متطفل — صانعات الأنفاق', 'Diglyphus isaea'),
  ('موسبيلان', 'insecticide', false, 'أسيتامبريد', '4A', 0.25, 'g_per_l', 'الحشرات الثاقبة الماصة: الذبابة البيضاء، المن، التربس، البق الدقيقي', null),
  ('البريتو', 'insecticide', false, null, null, 0.5, 'ml_per_l', 'الحشرات الثاقبة الماصة والتربس', null),
  ('سيفانتو', 'insecticide', false, 'فلوبيراديفيورون', '4D', 0.5, 'ml_per_l', 'الحشرات الثاقبة الماصة: الذبابة البيضاء، المن', null),
  ('كاني مايت', 'acaricide', false, 'أسيكينوسيل', '20B', 0.5, 'ml_per_l', 'العنكبوت الأحمر', null),
  ('فيرتيمك', 'acaricide', false, 'أبامكتين', '6', 0.5, 'ml_per_l', 'العنكبوت الأحمر والأكاروس العريض وصانعات الأنفاق', null),
  ('تيبوسال', 'acaricide', false, null, null, 0.4, 'ml_per_l', 'العناكب والأكاروسات', null),
  ('اسبيدو', 'insecticide', false, null, null, 0.4, 'g_per_l', 'الديدان وحرشفية الأجنحة', null),
  ('أمستار توب', 'fungicide', false, 'أزوكسيستروبين + ديفينوكونازول', '11+3', 0.75, 'ml_per_l', 'البياض الدقيقي والزغبي والندوات', null),
  ('ترافس نحاس', 'fungicide', false, 'نحاس', 'M01', 2.5, 'ml_per_l', 'البياض الدقيقي واللفحات والندوات', null),
  ('باكو بيست', 'fungicide', false, 'جليكونات النحاس', 'M01', 2.5, 'g_per_l', 'البياض واللفحات والندوات', null),
  ('كبريتات النحاس', 'fungicide', false, 'كبريتات النحاس', 'M01', 3, 'ml_per_l', 'أعفان الجذور والتربة والذبول', null),
  ('يوني فورم', 'fungicide', false, 'أزوكسيستروبين + ميفينوكسام', '11+4', null::numeric, null, 'أعفان الجذور وخناق الشتلات والذبول (معاملة تربة)', null),
  ('فيلوم برايم', 'nematicide', false, 'فلوبيرام', '7', 0.5, 'l_per_feddan', 'النيماتودا بكل أنواعها (مع مياه الري)', null),
  ('كوكتيل بيرل', 'fertilizer', false, null, null, 1.5, 'g_per_l', 'عناصر صغرى', null),
  ('فوسترايد كالسيوم', 'fertilizer', false, null, null, 2.5, 'ml_per_l', 'كالسيوم ورقي', null),
  ('فلور استار', 'biostimulant', false, null, null, 1, 'ml_per_l', 'تحفيز الإزهار والعقد', null),
  ('فوسك 50', 'fertilizer', false, null, null, 2.5, 'ml_per_l', 'تغذية ورقية', null),
  ('زنكونيا', 'fertilizer', false, null, null, 1, 'ml_per_l', 'زنك ورقي', null),
  ('كلباك', 'fertilizer', false, null, null, 2.5, 'ml_per_l', 'كالسيوم وبورون', null),
  ('حمض الستريك', 'adjuvant', false, 'حمض الستريك', null, null::numeric, null, 'ضبط حموضة المحلول', null),
  ('جبس زراعي', 'fertilizer', false, 'كبريتات الكالسيوم', null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سوبر فوسفات ناعم', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('كبريت زراعي ناعم', 'fertilizer', false, 'كبريت', null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سبلة (سماد عضوي)', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('حمض فوسفوريك', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سلفات بوتاسيوم', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('نترات كالسيوم', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('يوريا', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('نترات نشادر', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('حمض نيتريك', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('نترات ماغنسيوم', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('ماب (MAP)', 'fertilizer', false, 'فوسفات أحادي الأمونيوم', null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('مونو بوتاسيوم فوسفات (MKP)', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('نترات بوتاسيوم', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سماد مركب 19-19-19', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('حديد مخلبي', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('زنك مخلبي', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('منجنيز مخلبي', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('ال كابلانت', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('هيوميك', 'fertilizer', false, 'أحماض هيومية', null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('فولفيك', 'fertilizer', false, 'أحماض فولفيك', null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('بوراكس', 'fertilizer', false, 'بورون', null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سلفات زنك', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سلفات منجنيز', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('حمض كبريتيك', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سلفات ماغنسيوم', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null),
  ('سلفات حديدوز', 'fertilizer', false, null, null, null::numeric, null, 'برنامج التسميد (موازنة روت)', null)
) as v(name, ptype, bio, ai, moa, dose, unit, targets, species)
where not exists (select 1 from public.products p where p.farm_id is null and p.name = v.name);

-- ── ربط الآفات بخيارات المكافحة (مجمّعة: آفة × أسلوب ← قائمة منتجات بالترتيب) ──
insert into public.pest_controls (pest_id, product_id, approach, priority)
select pe.id, pr.id, v.approach, v.base + u.ord::smallint from (values
  ('whitefly_bt', 'biological', 100, array['Encarsia formosa','Eretmocerus eremicus','Macrolophus pygmaeus','Nesidiocoris tenuis','Amblyseius swirskii','بايو-كاتش','بايو باور','تارسوس','بيوسكت','أسد المن']::text[]),
  ('whitefly_bt', 'natural', 200, array['نمبيسيدين','أويكوس','زيت ريبيماج','صابون البوتاسيوم','زيت النيم','بريف إيه إم','MUFFLY','بروديك','فاكسيميت']::text[]),
  ('whitefly_bt', 'chemical', 500, array['موسبيلان','سيفانتو','البريتو']::text[]),
  ('whitefly_bt', 'trap', 300, array['المصائد الصفراء']::text[]),
  ('whitefly_tv', 'biological', 100, array['Encarsia formosa','Eretmocerus eremicus','Macrolophus pygmaeus','Nesidiocoris tenuis','Amblyseius swirskii','بايو-كاتش','بايو باور','تارسوس','بيوسكت','أسد المن']::text[]),
  ('whitefly_tv', 'natural', 200, array['نمبيسيدين','أويكوس','زيت ريبيماج','صابون البوتاسيوم','زيت النيم','بريف إيه إم','MUFFLY','بروديك','فاكسيميت']::text[]),
  ('whitefly_tv', 'chemical', 500, array['موسبيلان','سيفانتو','البريتو']::text[]),
  ('whitefly_tv', 'trap', 300, array['المصائد الصفراء']::text[]),
  ('aphids', 'biological', 100, array['Aphidius colemani','أسد المن','أبو العيد ذو السبع نقاط','بايو-كاتش','بايو باور','تارسوس','بيوسكت']::text[]),
  ('aphids', 'natural', 200, array['نمبيسيدين','زيت ريبيماج','صابون البوتاسيوم','زيت النيم','MUFFLY']::text[]),
  ('aphids', 'chemical', 500, array['موسبيلان','سيفانتو','البريتو']::text[]),
  ('aphids', 'trap', 300, array['المصائد الصفراء']::text[]),
  ('thrips_wft', 'biological', 100, array['Orius laevigatus','Amblyseius swirskii','بايو باور','تارسوس','أسد المن']::text[]),
  ('thrips_wft', 'natural', 200, array['تريسر','نمبيسيدين','زيت النيم','MUFFLY']::text[]),
  ('thrips_wft', 'chemical', 500, array['موسبيلان','سيفانتو','البريتو']::text[]),
  ('thrips_wft', 'trap', 300, array['المصائد الزرقاء','المصائد السوداء']::text[]),
  ('thrips_tabaci', 'biological', 100, array['Orius laevigatus','Amblyseius swirskii','بايو باور','تارسوس','أسد المن']::text[]),
  ('thrips_tabaci', 'natural', 200, array['تريسر','نمبيسيدين','زيت النيم','MUFFLY']::text[]),
  ('thrips_tabaci', 'chemical', 500, array['موسبيلان','سيفانتو','البريتو']::text[]),
  ('thrips_tabaci', 'trap', 300, array['المصائد الزرقاء','المصائد السوداء']::text[]),
  ('tuta', 'biological', 100, array['Nesidiocoris tenuis','Macrolophus pygmaeus','Trichogramma achaeae','دايبل دي إف','زنتاري','بروتكتو','بيوتكت']::text[]),
  ('tuta', 'natural', 200, array['تريسر']::text[]),
  ('tuta', 'chemical', 500, array['اسبيدو']::text[]),
  ('tuta', 'trap', 300, array['فيرمونات التوتا']::text[]),
  ('helicoverpa', 'biological', 100, array['Trichogramma achaeae','دايبل دي إف','زنتاري','بروتكتو','بيوتكت']::text[]),
  ('helicoverpa', 'natural', 200, array['تريسر']::text[]),
  ('helicoverpa', 'chemical', 500, array['اسبيدو']::text[]),
  ('spodoptera', 'biological', 100, array['Trichogramma achaeae','دايبل دي إف','زنتاري','بروتكتو','بيوتكت']::text[]),
  ('spodoptera', 'natural', 200, array['تريسر','زيت التيكنو أوي']::text[]),
  ('spodoptera', 'chemical', 500, array['اسبيدو']::text[]),
  ('spodoptera', 'trap', 300, array['فيرمونات دودة ورق القطن']::text[]),
  ('leafminer', 'biological', 100, array['Diglyphus isaea']::text[]),
  ('leafminer', 'natural', 200, array['نمبيسيدين','زيت النيم']::text[]),
  ('leafminer', 'chemical', 500, array['فيرتيمك']::text[]),
  ('leafminer', 'trap', 300, array['المصائد الصفراء']::text[]),
  ('spider_mite', 'biological', 100, array['Phytoseiulus persimilis','تارسوس','بيوسكت']::text[]),
  ('spider_mite', 'natural', 200, array['بريف إيه إم','كبريت ميكروني','الكبريت السائل','URTIQAS','صابون البوتاسيوم','الديترجنت الزراعي المتعادل','زيت النيم']::text[]),
  ('spider_mite', 'chemical', 500, array['كاني مايت','فيرتيمك','تيبوسال']::text[]),
  ('broad_mite', 'biological', 100, array['Amblyseius swirskii']::text[]),
  ('broad_mite', 'natural', 200, array['كبريت ميكروني','بريف إيه إم']::text[]),
  ('broad_mite', 'chemical', 500, array['فيرتيمك','تيبوسال','كاني مايت']::text[]),
  ('russet_mite', 'natural', 200, array['كبريت ميكروني','الكبريت السائل','بريف إيه إم']::text[]),
  ('russet_mite', 'chemical', 500, array['فيرتيمك']::text[]),
  ('powdery_mildew', 'natural', 200, array['هيليوسوفر','كبريت ميكروني','الكبريت السائل','الكبريت النانو','بيكربونات البوتاسيوم','فوسفات البوتاسيوم','سيليكات الماغنسيوم','بايو-دوكون','بيوارك','بيوزيد','اكسيلان','فليجرين','بريف إيه إم']::text[]),
  ('powdery_mildew', 'chemical', 500, array['أمستار توب']::text[]),
  ('downy_mildew', 'natural', 200, array['سيريناد أسو','بايوكيور-إف','اكسيلان','EQUISTUN']::text[]),
  ('downy_mildew', 'chemical', 500, array['بوردو كفارو','جلوبر','ترافس نحاس','باكو بيست','أمستار توب']::text[]),
  ('late_blight', 'natural', 200, array['بيوارك','بيوزيد','بايوكيور-إف','فوسفات البوتاسيوم']::text[]),
  ('late_blight', 'chemical', 500, array['بوردو كفارو','ترافس نحاس','باكو بيست','أمستار توب']::text[]),
  ('early_blight', 'natural', 200, array['بيوارك','بيوزيد','هيلوتروم']::text[]),
  ('early_blight', 'chemical', 500, array['أمستار توب','بوردو كفارو','ترافس نحاس']::text[]),
  ('botrytis', 'natural', 200, array['هيلوتروم','سيريناد أسو','بيوارك']::text[]),
  ('fusarium_wilt', 'natural', 200, array['بيوكونترول','بايوكيور-إف','خل الخشب','سيليكات الماغنسيوم']::text[]),
  ('fusarium_wilt', 'chemical', 500, array['كبريتات النحاس','يوني فورم']::text[]),
  ('root_knot', 'natural', 200, array['سيف بلانت','بايو-نيماتون','تاجليس','نيما زيرو','سافيور','نيماكيل','أويكوس','زيت النيم']::text[]),
  ('root_knot', 'chemical', 500, array['فيلوم برايم']::text[]),
  ('tylcv', 'natural', 200, array['نمبيسيدين','زيت ريبيماج']::text[]),
  ('tylcv', 'chemical', 500, array['موسبيلان','سيفانتو']::text[]),
  ('tylcv', 'trap', 300, array['المصائد الصفراء']::text[]),
  ('blossom_end_rot', 'nutrition', 400, array['فوسترايد كالسيوم','كلباك','نيوسترين','QUICELU','نترات كالسيوم']::text[])
) as v(pest, approach, base, names)
cross join lateral unnest(v.names) with ordinality as u(name, ord)
join public.pests pe on pe.farm_id is null and pe.code = v.pest
join public.products pr on pr.farm_id is null and pr.name = u.name
on conflict do nothing;
