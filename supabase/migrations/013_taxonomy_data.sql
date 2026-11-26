-- =====================================================================
--  Migration 013 — شجرة تصنيف المدخلات (مولّدة من scripts/knowledge/taxonomy.py)
--  لا تُعدَّل يدويًا: عدّل taxonomy.py ثم أعد التوليد.
--
--  * التصنيفات العامة (farm_id = null) على مستويين: رئيسي ← فرعي، لكل فرعي
--    مجال (تسميد/مكافحة/عمليات) ونوع المنتج الافتراضي وعلامة حيوي/طبيعي الافتراضية.
--  * تصنيف كل منتج عام موجود (من 002 و010) في تصنيف فرعي واحد.
--  * إضافة منتجات عامة جديدة مهمة (أسمدة مفردة ومركبة، منشطات، مخصبات حيوية،
--    زيوت ومستخلصات، أعداء حيوية، مصائد وفيرمونات، مواد مساعدة، مواد خدمة الأرض).
--  * إضافة عمليات خدمة الأرض وتجهيزها (الفئة land_preparation) ونقل العمليات
--    التحضيرية الموجودة إليها.
--
--  الجرعات وفترات الأمان (PHI) لم تُخترع: المنتجات الجديدة كلها بلا جرعة افتراضية
--  وبلا فترة أمان — تُؤخذ من ملصق العبوة المسجلة محليًا. رموز IRAC/FRAC فقط عند التأكد.
--  المبيدات الكيميائية المُخلَّقة لا تُضاف هنا؛ تُصنَّف الموجودة فقط.
--  آمنة لإعادة التشغيل (idempotent). تعتمد على 011 (قيمة land_preparation) و012 (الجداول).
-- =====================================================================

-- ── 1) التصنيفات الرئيسية ─────────────────────────────────────
insert into public.product_categories (code, name_ar, name_en, domain, sort_order, notes) values
  ('fertilizers', 'الأسمدة والعناصر الغذائية', 'Fertilizers & plant nutrition', 'fertigation', 10, 'الأسمدة المعدنية المفردة والمركبة والأحماض السمادية؛ الأسمدة الورقية تتبع العنصر الذي تمد به النبات'),
  ('biostimulants', 'المنشطات الحيوية ومنظمات النمو', 'Biostimulants & plant growth regulators', 'fertigation', 20, null),
  ('biofertilizers', 'المخصبات الحيوية', 'Bio-fertilizers (microbial inoculants)', 'fertigation', 30, 'لقاحات ميكروبية تحسن إتاحة العناصر للنبات'),
  ('chemical_pesticides', 'المبيدات الكيميائية المُخلَّقة', 'Synthetic chemical pesticides', 'ipm', 40, 'تُسجَّل لكل مزرعة حسب المسجَّل محليًا؛ فترة الأمان من ملصق العبوة'),
  ('microbial_biopesticides', 'المبيدات الحيوية الميكروبية', 'Microbial bio-pesticides', 'ipm', 50, 'كائنات دقيقة حية أو منتجاتها الأيضية'),
  ('natural_enemies', 'الأعداء الحيوية', 'Natural enemies (macrobials)', 'ipm', 60, 'مفترسات ومتطفلات تُطلق في الصوبة'),
  ('botanicals_oils', 'الزيوت والمستخلصات النباتية والصابون', 'Oils, botanical extracts & soaps', 'ipm', 70, null),
  ('mineral_protectants', 'المركبات المعدنية الواقية', 'Inorganic / mineral protectants', 'ipm', 80, 'كبريت ونحاس وأملاح وأغشية معدنية (مبيدات غير عضوية متعددة المواقع أو واقية)'),
  ('traps_attractants', 'المصائد والفيرمونات والجواذب', 'Traps, pheromones & attractants', 'ipm', 90, 'للرصد والاصطياد الجماعي'),
  ('spray_adjuvants', 'المواد المساعدة لمحلول الرش', 'Spray adjuvants', 'ipm', 100, null),
  ('pollination', 'التلقيح', 'Pollination', 'operations', 110, null),
  ('land_preparation', 'مواد الخدمة وتجهيز الأرض', 'Ground service & land-preparation materials', 'operations', 120, 'مستلزمات تُستخدم قبل الزراعة وبين العروات؛ المستلزمات بدون جرعة')
on conflict do nothing;

-- ── 2) التصنيفات الفرعية ──────────────────────────────────────
insert into public.product_categories (parent_id, code, name_ar, name_en, domain, default_product_type, is_bio, sort_order, notes)
select parent.id, v.code, v.name_ar, v.name_en, parent.domain, v.ptype::public.product_type, v.bio, v.sort_order::smallint, v.notes from (values
  ('fertilizers', 'fert_nitrogen', 'الأسمدة النيتروجينية', 'Nitrogen fertilizers', 'fertilizer', false, 10, null),
  ('fertilizers', 'fert_phosphate', 'الأسمدة الفوسفاتية', 'Phosphate fertilizers', 'fertilizer', false, 20, null),
  ('fertilizers', 'fert_potassium', 'الأسمدة البوتاسية', 'Potassium fertilizers', 'fertilizer', false, 30, null),
  ('fertilizers', 'fert_secondary', 'العناصر الثانوية (كالسيوم، ماغنسيوم، كبريت)', 'Secondary nutrients (Ca, Mg, S)', 'fertilizer', false, 40, 'نترات الكالسيوم والماغنسيوم تُصنَّف هنا لأن الغرض الأساسي منها الكالسيوم/الماغنسيوم'),
  ('fertilizers', 'fert_micro', 'العناصر الصغرى (مخلبية ومعدنية)', 'Micronutrients (chelated & mineral)', 'fertilizer', false, 50, null),
  ('fertilizers', 'fert_npk', 'الأسمدة المركبة الذائبة (NPK)', 'Compound water-soluble fertilizers (NPK)', 'fertilizer', false, 60, 'ومنها الأسمدة الورقية المتوازنة'),
  ('fertilizers', 'fert_acids', 'الأحماض السمادية ومعدلات pH مياه الري', 'Fertilizer acids & irrigation-water pH adjusters', 'fertilizer', false, 70, 'حمض الفوسفوريك يُصنَّف هنا لأنه يُستخدم أساسًا لضبط pH مياه الري مع إمداد الفوسفور'),
  ('fertilizers', 'fert_organic', 'الأسمدة العضوية والعضوية-المعدنية السائلة', 'Liquid organic & organo-mineral fertilizers', 'fertilizer', true, 80, null),
  ('biostimulants', 'bs_amino', 'الأحماض الأمينية', 'Amino acids & protein hydrolysates', 'biostimulant', true, 10, null),
  ('biostimulants', 'bs_humic', 'الأحماض الهيومية والفولفيك', 'Humic & fulvic substances', 'biostimulant', true, 20, null),
  ('biostimulants', 'bs_seaweed', 'مستخلصات الطحالب البحرية', 'Seaweed extracts', 'biostimulant', true, 30, null),
  ('biostimulants', 'bs_silicon', 'السيليكون والعناصر المفيدة', 'Silicon & beneficial elements', 'biostimulant', false, 40, 'السيليكات تعمل عبر تقوية الأنسجة وتحفيز المقاومة في النبات، لذا تُصنَّف هنا لا ضمن المبيدات'),
  ('biostimulants', 'bs_complex', 'منشطات حيوية مركبة ومحفزات المقاومة', 'Complex biostimulants & resistance inducers', 'biostimulant', true, 50, 'خلطات تجارية متعددة المكونات (إزهار، عقد، تلوين، تحمل الإجهاد، لقاحات نباتية)'),
  ('biostimulants', 'pgr', 'منظمات النمو النباتية', 'Plant growth regulators', 'other', false, 60, 'هرمونات ومنظمات نمو مُسجَّلة؛ الجرعة من ملصق العبوة'),
  ('biofertilizers', 'biofert_n', 'بكتيريا مثبتة للنيتروجين', 'Nitrogen-fixing bacteria', 'fertilizer', true, 10, null),
  ('biofertilizers', 'biofert_pk', 'كائنات مذيبة للفوسفات ومحررة للبوتاسيوم', 'P-solubilizing & K-releasing microbes', 'fertilizer', true, 20, null),
  ('biofertilizers', 'biofert_myco', 'الميكوريزا', 'Mycorrhizal fungi', 'fertilizer', true, 30, null),
  ('chemical_pesticides', 'chem_insecticides', 'المبيدات الحشرية', 'Insecticides', 'insecticide', false, 10, null),
  ('chemical_pesticides', 'chem_acaricides', 'المبيدات الأكاروسية', 'Acaricides', 'acaricide', false, 20, null),
  ('chemical_pesticides', 'chem_fungicides', 'المبيدات الفطرية', 'Fungicides', 'fungicide', false, 30, 'المبيدات الفطرية العضوية المُخلَّقة؛ الكبريت والنحاس في «المركبات المعدنية الواقية»'),
  ('chemical_pesticides', 'chem_bactericides', 'المبيدات البكتيرية', 'Bactericides', 'bactericide', false, 40, null),
  ('chemical_pesticides', 'chem_nematicides', 'المبيدات النيماتودية', 'Nematicides', 'nematicide', false, 50, null),
  ('chemical_pesticides', 'chem_herbicides', 'مبيدات الحشائش', 'Herbicides', 'herbicide', false, 60, null),
  ('chemical_pesticides', 'chem_molluscicides_rodenticides', 'مبيدات القواقع والقوارض', 'Molluscicides & rodenticides', 'other', false, 70, null),
  ('microbial_biopesticides', 'micro_ento_fungi', 'الفطريات الممرضة للحشرات', 'Entomopathogenic fungi', 'insecticide', true, 10, 'بيوفيريا، ميتاريزيوم، ليكانيسيليوم (فيرتيسيليوم)، إيزاريا (كورديسبس)'),
  ('microbial_biopesticides', 'micro_ento_bacteria', 'البكتيريا الممرضة للحشرات ومنتجاتها', 'Entomopathogenic bacteria & their metabolites', 'insecticide', true, 20, 'باسيلس ثورينجينسيس (Bt)، والسبينوساد (ناتج تخمر بكتيري)'),
  ('microbial_biopesticides', 'micro_ento_nematodes_viruses', 'النيماتودا والفيروسات الممرضة للحشرات', 'Entomopathogenic nematodes & insect viruses', 'insecticide', true, 30, null),
  ('microbial_biopesticides', 'micro_antagonists', 'مضادات أمراض النبات الحيوية', 'Microbial antagonists of plant diseases', 'fungicide', true, 40, 'تريكودرما، باسيلس ساتلس/أميلوليكويفاشينس، سودوموناس'),
  ('microbial_biopesticides', 'micro_nematode_antagonists', 'كائنات دقيقة مضادة للنيماتودا', 'Nematode-antagonistic microbes', 'nematicide', true, 50, null),
  ('natural_enemies', 'ne_predatory_mites', 'الأكاروسات المفترسة', 'Predatory mites', 'biocontrol_agent', true, 10, null),
  ('natural_enemies', 'ne_predatory_insects', 'الحشرات المفترسة', 'Predatory insects', 'biocontrol_agent', true, 20, null),
  ('natural_enemies', 'ne_parasitoids', 'المتطفلات', 'Parasitoids', 'biocontrol_agent', true, 30, null),
  ('botanicals_oils', 'bot_plant_oils', 'الزيوت النباتية والعطرية', 'Plant & essential oils', 'insecticide', true, 10, null),
  ('botanicals_oils', 'bot_mineral_oils', 'الزيوت المعدنية (البارافينية/الصيفية)', 'Mineral (paraffinic / summer) oils', 'insecticide', true, 20, 'الزيوت البارافينية مقبولة في برامج الزراعة العضوية؛ الحيوي/الطبيعي يُحدد لكل منتج'),
  ('botanicals_oils', 'bot_extracts', 'المستخلصات النباتية والمركبات الطبيعية', 'Botanical extracts & natural compounds', 'insecticide', true, 30, 'أزاديراختين، بيرثرين، ثوم، فلفل حار، ومستحضرات نباتية تجارية'),
  ('botanicals_oils', 'bot_soaps_salts', 'الصابون الزراعي والمنظفات المتعادلة', 'Insecticidal soaps & neutral detergents', 'insecticide', true, 40, null),
  ('mineral_protectants', 'min_sulfur', 'مركبات الكبريت', 'Sulfur products', 'fungicide', true, 10, null),
  ('mineral_protectants', 'min_copper', 'مركبات النحاس', 'Copper compounds', 'fungicide', false, 20, null),
  ('mineral_protectants', 'min_salts', 'البيكربونات والفوسفيت والأملاح الواقية', 'Bicarbonates, phosphites & protective salts', 'fungicide', true, 30, null),
  ('mineral_protectants', 'min_particle_films', 'الأغشية المعدنية (كاولين، تراب دياتومي)', 'Particle films & mineral dusts', 'other', true, 40, null),
  ('traps_attractants', 'trap_sticky', 'المصائد اللاصقة الملونة', 'Coloured sticky traps', 'other', true, 10, null),
  ('traps_attractants', 'trap_pheromones', 'الفيرمونات والجواذب الجنسية', 'Pheromones & sex/para-pheromone lures', 'other', true, 20, null),
  ('traps_attractants', 'trap_food_baits', 'الجواذب الغذائية والطعوم', 'Food attractants & baits', 'other', true, 30, null),
  ('traps_attractants', 'trap_devices', 'هياكل المصائد', 'Trap devices (delta, water, funnel, McPhail, light)', 'other', true, 40, null),
  ('spray_adjuvants', 'adj_spreader_sticker', 'الناشرات واللاصقات ومواد الترطيب', 'Spreaders, stickers & wetting agents', 'adjuvant', false, 10, null),
  ('spray_adjuvants', 'adj_ph_buffer', 'منظمات حموضة ومعالجات مياه الرش', 'Spray-tank pH buffers & water conditioners', 'adjuvant', false, 20, null),
  ('spray_adjuvants', 'adj_antifoam', 'مضادات الرغوة', 'Anti-foam agents', 'adjuvant', false, 30, null),
  ('pollination', 'poll_bees', 'النحل الطنان والملقحات', 'Bumblebees & pollinators', 'pollinator', true, 10, null),
  ('land_preparation', 'lp_organic_manures', 'الأسمدة العضوية (بلدي، كمبوست، دواجن)', 'Organic manures & composts', 'fertilizer', true, 10, null),
  ('land_preparation', 'lp_soil_amendments', 'محسنات التربة ومصححات الملوحة', 'Soil amendments & salinity correctors', 'other', false, 20, null),
  ('land_preparation', 'lp_growing_media', 'بيئات الزراعة', 'Growing media / substrates', 'other', false, 30, null),
  ('land_preparation', 'lp_disinfectants', 'مطهرات ومعقمات التربة والصوب', 'Soil & greenhouse disinfectants / sterilants', 'other', false, 40, 'للتعقيم بين العروات وتطهير الأدوات والهيكل'),
  ('land_preparation', 'lp_irrigation_supplies', 'مستلزمات شبكة الري', 'Irrigation network supplies', 'other', false, 50, null),
  ('land_preparation', 'lp_covers', 'أغطية التربة والصوب والشبك', 'Mulches, greenhouse covers & nets', 'other', false, 60, null),
  ('land_preparation', 'lp_support_supplies', 'مستلزمات التربية والتدعيم', 'Crop support & training supplies', 'other', false, 70, null)
) as v(parent, code, name_ar, name_en, ptype, bio, sort_order, notes)
join public.product_categories parent on parent.farm_id is null and parent.parent_id is null and parent.code = v.parent
on conflict do nothing;

-- ── 3) تصنيف المنتجات العامة الموجودة (مجمّعة حسب التصنيف الفرعي) ──
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_nitrogen' and p.farm_id is null
    and p.name in ('يوريا', 'نترات نشادر');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_phosphate' and p.farm_id is null
    and p.name in ('سوبر فوسفات ناعم', 'ماب (MAP)', 'مونو بوتاسيوم فوسفات (MKP)');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_potassium' and p.farm_id is null
    and p.name in ('سلفات بوتاسيوم', 'نترات بوتاسيوم');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_secondary' and p.farm_id is null
    and p.name in ('نترات كالسيوم', 'نترات ماغنسيوم', 'سلفات ماغنسيوم', 'فوسترايد كالسيوم', 'كلباك', 'QUICELU');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_micro' and p.farm_id is null
    and p.name in ('حديد مخلبي', 'زنك مخلبي', 'منجنيز مخلبي', 'بوراكس', 'سلفات زنك', 'سلفات منجنيز', 'سلفات حديدوز', 'كوكتيل بيرل', 'زنكونيا', 'كريبتوم حديد');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_npk' and p.farm_id is null
    and p.name in ('سماد مركب 19-19-19', 'فوسك 50', 'ال كابلانت');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_acids' and p.farm_id is null
    and p.name in ('حمض فوسفوريك', 'حمض نيتريك', 'حمض كبريتيك');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'fert_organic' and p.farm_id is null
    and p.name in ('ORGAPLANT-Ca', 'ORGAPLANT-NK');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bs_amino' and p.farm_id is null
    and p.name in ('سمبيون فام', 'ORGAPLANT ORGANIC');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bs_humic' and p.farm_id is null
    and p.name in ('هيوميك', 'فولفيك', 'HUMIPOWER سائل', 'HUMIPOWER SOLUBLE', 'HUMIPOWER SOLID', 'HORTUMUS', 'CRIPTHUM New');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bs_seaweed' and p.farm_id is null
    and p.name in ('جروفول (طحالب بحرية)');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bs_silicon' and p.farm_id is null
    and p.name in ('سيليكات البوتاسيوم', 'سيليكات الماغنسيوم');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bs_complex' and p.farm_id is null
    and p.name in ('إنذار', 'كروب بلس', 'رينتال', 'نيوسترين', 'أجريسترين', 'فورتسترين', 'كولور سيف', 'فيوري', 'ماتيور', 'كويكل', 'فلور استار');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'biofert_n' and p.farm_id is null
    and p.name in ('سمبيون الأزوت');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'biofert_pk' and p.farm_id is null
    and p.name in ('سوبر جرو', 'سمبيون البوتاسيوم', 'سمبيون الفوسفور');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'chem_insecticides' and p.farm_id is null
    and p.name in ('موسبيلان', 'البريتو', 'سيفانتو', 'اسبيدو');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'chem_acaricides' and p.farm_id is null
    and p.name in ('كاني مايت', 'فيرتيمك', 'تيبوسال');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'chem_fungicides' and p.farm_id is null
    and p.name in ('أمستار توب', 'يوني فورم');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'chem_nematicides' and p.farm_id is null
    and p.name in ('فيلوم برايم');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'micro_ento_fungi' and p.farm_id is null
    and p.name in ('بايو-كاتش', 'بايو باور', 'بايو-ماجيك', 'بيوسكت', 'تارسوس');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'micro_ento_bacteria' and p.farm_id is null
    and p.name in ('زنتاري', 'دايبل دي إف', 'بروتكتو', 'بيوتكت', 'تريسر');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'micro_antagonists' and p.farm_id is null
    and p.name in ('سيريناد أسو', 'بيوكونترول', 'بيوزيد', 'بيوارك', 'بايو-دوكون', 'بايوكيور-إف', 'بايوكيور-بي');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'micro_nematode_antagonists' and p.farm_id is null
    and p.name in ('بايو-نيماتون');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'ne_predatory_mites' and p.farm_id is null
    and p.name in ('Amblyseius swirskii', 'Phytoseiulus persimilis');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'ne_predatory_insects' and p.farm_id is null
    and p.name in ('Nesidiocoris tenuis', 'Macrolophus pygmaeus', 'Orius laevigatus', 'أسد المن', 'أبو العيد ذو السبع نقاط');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'ne_parasitoids' and p.farm_id is null
    and p.name in ('Encarsia formosa', 'Eretmocerus eremicus', 'Aphidius colemani', 'Trichogramma achaeae', 'Diglyphus isaea');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bot_plant_oils' and p.farm_id is null
    and p.name in ('زيت النيم', 'بريف إيه إم', 'زيت التيكنو أوي', 'زيت ريبيماج');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bot_extracts' and p.farm_id is null
    and p.name in ('أويكوس', 'نمبيسيدين', 'خل الخشب', 'اكسيلان', 'فليجرين', 'هيلوتروم', 'EQUISTUN', 'URTIQAS', 'MUFFLY', 'بروديك', 'فاكسيميت', 'تاجليس', 'سيف بلانت', 'نيما زيرو', 'سافيور', 'نيماكيل');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'bot_soaps_salts' and p.farm_id is null
    and p.name in ('صابون البوتاسيوم', 'الديترجنت الزراعي المتعادل');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'min_sulfur' and p.farm_id is null
    and p.name in ('هيليوسوفر', 'الكبريت النانو', 'الكبريت السائل', 'كبريت ميكروني', 'سوريل زراعي كرد');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'min_copper' and p.farm_id is null
    and p.name in ('بوردو كفارو', 'جلوبر', 'ترافس نحاس', 'باكو بيست', 'كبريتات النحاس');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'min_salts' and p.farm_id is null
    and p.name in ('بيكربونات البوتاسيوم', 'فوسفات البوتاسيوم');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'trap_sticky' and p.farm_id is null
    and p.name in ('المصائد الصفراء', 'المصائد الزرقاء', 'المصائد الحمراء', 'المصائد السوداء');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'trap_pheromones' and p.farm_id is null
    and p.name in ('فيرمونات التوتا', 'فيرمونات دودة ورق القطن');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'trap_food_baits' and p.farm_id is null
    and p.name in ('بومينال', 'فلاي كاب');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'adj_ph_buffer' and p.farm_id is null
    and p.name in ('كريبتوم', 'حمض الستريك');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'poll_bees' and p.farm_id is null
    and p.name in ('Bombus terrestris');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'lp_organic_manures' and p.farm_id is null
    and p.name in ('سبلة (سماد عضوي)');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'lp_soil_amendments' and p.farm_id is null
    and p.name in ('جبس زراعي', 'كبريت زراعي ناعم', 'DISPERSAL', 'AQUAPOWER', 'ABSORTIM');
update public.products p set category_id = c.id from public.product_categories c
  where c.farm_id is null and c.code = 'lp_disinfectants' and p.farm_id is null
    and p.name in ('برمنجانات البوتاسيوم');

-- ── 4) المنتجات العامة الجديدة (تُضاف مرة واحدة؛ بلا جرعة ولا فترة أمان) ──
insert into public.products (name, product_type, is_bio, active_ingredient, moa_code, default_dose, default_dose_unit, targets, bio_species, category_id)
select v.name, v.ptype::public.product_type, v.bio, v.ai, v.moa, null::numeric, v.unit::public.dose_unit, v.targets, v.species, c.id from (values
  ('سلفات النشادر 20.6%', 'fert_nitrogen', 'fertilizer', false, 'كبريتات الأمونيوم', null, null, 'نيتروجين أمونيومي + كبريت؛ ذو تأثير حامضي على التربة', null),
  ('فوسفات ثنائي الأمونيوم (DAP) 18-46-0', 'fert_phosphate', 'fertilizer', false, 'فوسفات ثنائي الأمونيوم', null, null, 'سماد أساسي فوسفاتي للتربة', null),
  ('يوريا فوسفات 17-44-0', 'fert_phosphate', 'fertilizer', false, 'يوريا فوسفات', null, null, 'فوسفور ونيتروجين ذائب حامضي؛ يساعد على منع انسداد النقاطات', null),
  ('سوبر فوسفات ثلاثي 46%', 'fert_phosphate', 'fertilizer', false, null, null, null, 'سماد أساسي فوسفاتي مركز للتربة', null),
  ('كلوريد البوتاسيوم (MOP) 0-0-60', 'fert_potassium', 'fertilizer', false, 'كلوريد البوتاسيوم', null, null, 'مصدر بوتاسيوم؛ يُتجنب مع ارتفاع الكلوريد في مياه الري أو حساسية المحصول', null),
  ('كلوريد الكالسيوم', 'fert_secondary', 'fertilizer', false, 'كلوريد الكالسيوم', null, null, 'كالسيوم ورقي سريع لعلاج نقص الكالسيوم في الثمار', null),
  ('كالسيوم مخلبي EDTA', 'fert_secondary', 'fertilizer', false, null, null, null, 'كالسيوم مخلبي للرش والتسميد', null),
  ('حديد مخلبي EDDHA', 'fert_micro', 'fertilizer', false, null, null, null, 'حديد ثابت في الأراضي والمياه القلوية (pH مرتفع)', null),
  ('حديد مخلبي DTPA', 'fert_micro', 'fertilizer', false, null, null, null, 'حديد للمحاليل المغذية والبيئات الصناعية حتى pH متوسط', null),
  ('حمض البوريك', 'fert_micro', 'fertilizer', false, 'حمض البوريك', null, null, 'مصدر بورون ذائب للرش والتسميد', null),
  ('موليبدات الصوديوم', 'fert_micro', 'fertilizer', false, 'موليبدات الصوديوم', null, null, 'مصدر موليبدنم', null),
  ('نحاس مخلبي EDTA', 'fert_micro', 'fertilizer', false, null, null, null, 'نحاس كعنصر غذائي صغرى', null),
  ('مخلوط عناصر صغرى مخلبية', 'fert_micro', 'fertilizer', false, null, null, null, 'خليط حديد ومنجنيز وزنك ونحاس وبورون وموليبدنم', null),
  ('سماد مركب 20-20-20', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب متوازن للنمو الخضري', null),
  ('سماد مركب 18-18-18', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب متوازن للنمو الخضري', null),
  ('سماد مركب 30-10-10', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب عالي النيتروجين للنمو الخضري', null),
  ('سماد مركب 10-52-10', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب عالي الفوسفور للتجذير وبداية الإزهار', null),
  ('سماد مركب 13-40-13', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب عالي الفوسفور للتجذير والإزهار', null),
  ('سماد مركب 15-30-15', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب عالي الفوسفور للإزهار والعقد', null),
  ('سماد مركب 15-15-30', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب عالي البوتاسيوم لمرحلة الإثمار', null),
  ('سماد مركب 12-12-36', 'fert_npk', 'fertilizer', false, null, null, null, 'سماد ذائب عالي البوتاسيوم لنمو الثمار وتلوينها', null),
  ('هيدروكسيد البوتاسيوم', 'fert_acids', 'fertilizer', false, 'هيدروكسيد البوتاسيوم', null, null, 'رفع pH المحلول المغذي ومياه الري', null),
  ('أحماض أمينية حرة', 'bs_amino', 'biostimulant', true, 'أحماض أمينية', null, null, 'تنشيط النمو وتقليل أثر الإجهاد', null),
  ('هيومات البوتاسيوم', 'bs_humic', 'biostimulant', true, 'هيومات البوتاسيوم', null, null, 'تحسين خواص التربة وتنشيط الجذور وإتاحة العناصر', null),
  ('مستخلص طحالب بحرية (أسكوفيلم نودوسوم)', 'bs_seaweed', 'biostimulant', true, 'مستخلص Ascophyllum nodosum', null, null, 'تنشيط النمو وتحمل الإجهاد وتحسين العقد', null),
  ('حمض أورثوسيليسيك مثبت', 'bs_silicon', 'biostimulant', false, 'حمض أورثوسيليسيك', null, null, 'سيليكون سريع الامتصاص لتقوية الأنسجة', null),
  ('شيتوزان', 'bs_complex', 'biostimulant', true, 'شيتوزان', null, null, 'محفز لدفاعات النبات', null),
  ('حمض الجبريليك (GA3)', 'pgr', 'other', false, 'حمض الجبريليك', null, null, 'منظم نمو: استطالة وعقد', null),
  ('نفثالين حمض الخليك (NAA)', 'pgr', 'other', false, 'نفثالين حمض الخليك', null, null, 'أوكسين: تجذير وعقد', null),
  ('إندول حمض البيوتيريك (IBA)', 'pgr', 'other', false, 'إندول حمض البيوتيريك', null, null, 'أوكسين: تجذير العقل والشتلات', null),
  ('حمض كلوروفينوكسي الخليك (4-CPA)', 'pgr', 'other', false, 'حمض 4-كلوروفينوكسي الخليك', null, null, 'أوكسين: تحسين عقد ثمار الطماطم في الظروف غير الملائمة', null),
  ('إيثيفون', 'pgr', 'other', false, 'إيثيفون', null, null, 'مطلق للإيثيلين: تسريع النضج والتلوين', null),
  ('بنزيل أدينين (سيتوكينين)', 'pgr', 'other', false, '6-بنزيل أدينين', null, null, 'سيتوكينين: انقسام الخلايا وتنشيط النموات', null),
  ('نتروبين', 'biofert_n', 'fertilizer', true, null, null, null, 'مخصب حيوي مصري مثبت للنيتروجين الجوي', null),
  ('أزوتوباكتر (Azotobacter chroococcum)', 'biofert_n', 'fertilizer', true, 'Azotobacter chroococcum', null, null, 'تثبيت النيتروجين الجوي لا تكافليًا', null),
  ('أزوسبيريلم (Azospirillum brasilense)', 'biofert_n', 'fertilizer', true, 'Azospirillum brasilense', null, null, 'تثبيت النيتروجين وتنشيط الجذور', null),
  ('فوسفورين', 'biofert_pk', 'fertilizer', true, null, null, null, 'مخصب حيوي مصري مذيب للفوسفات', null),
  ('باسيلس ميجاتيريوم (Bacillus megaterium)', 'biofert_pk', 'fertilizer', true, 'Bacillus megaterium', null, null, 'إذابة الفوسفات المثبت في التربة', null),
  ('بكتيريا محررة للبوتاسيوم (Bacillus circulans)', 'biofert_pk', 'fertilizer', true, 'Bacillus circulans', null, null, 'تحرير البوتاسيوم من معادن التربة', null),
  ('ميكوريزا (Rhizophagus irregularis)', 'biofert_myco', 'fertilizer', true, 'Rhizophagus irregularis (Glomus intraradices)', null, null, 'توسيع المجموع الجذري وزيادة امتصاص الفوسفور والماء', null),
  ('بيوفيريا باسيانا (Beauveria bassiana)', 'micro_ento_fungi', 'insecticide', true, 'Beauveria bassiana', null, null, 'الذبابة البيضاء، التربس، المن', null),
  ('ميتاريزيوم أنيسوبلي (Metarhizium anisopliae)', 'micro_ento_fungi', 'insecticide', true, 'Metarhizium anisopliae', null, null, 'حشرات التربة وعذارى التربس', null),
  ('ليكانيسيليوم ليكاني (Lecanicillium lecanii)', 'micro_ento_fungi', 'insecticide', true, 'Lecanicillium lecanii', null, null, 'الذبابة البيضاء، المن', null),
  ('إيزاريا فيوموزوروزيا (Cordyceps fumosorosea)', 'micro_ento_fungi', 'insecticide', true, 'Cordyceps (Isaria) fumosorosea', null, null, 'الذبابة البيضاء', null),
  ('باسيلس ثورينجينسيس كورستاكي (Bt)', 'micro_ento_bacteria', 'insecticide', true, 'Bacillus thuringiensis subsp. kurstaki', '11A', null, 'يرقات حرشفية الأجنحة: التوتا، دودة ورق القطن، دودة اللوز', null),
  ('باسيلس ثورينجينسيس أيزاواي (Bt)', 'micro_ento_bacteria', 'insecticide', true, 'Bacillus thuringiensis subsp. aizawai', '11A', null, 'يرقات حرشفية الأجنحة وخاصة الدودة الخضراء وأنواع سبودوبترا', null),
  ('نيماتودا ستاينرنيما فلتيا (Steinernema feltiae)', 'micro_ento_nematodes_viruses', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'عذارى التربس في التربة، يرقات ذباب الفطر (السياريد)', 'Steinernema feltiae'),
  ('نيماتودا هيتيرورابديتس (Heterorhabditis bacteriophora)', 'micro_ento_nematodes_viruses', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'يرقات الخنافس وحشرات التربة', 'Heterorhabditis bacteriophora'),
  ('فيروس البوليهيدروزس النووي لدودة اللوز (HearNPV)', 'micro_ento_nematodes_viruses', 'insecticide', true, 'Helicoverpa armigera nucleopolyhedrovirus', null, null, 'يرقات دودة اللوز الأمريكية', null),
  ('فيروس البوليهيدروزس النووي لدودة ورق القطن (SpliNPV)', 'micro_ento_nematodes_viruses', 'insecticide', true, 'Spodoptera littoralis nucleopolyhedrovirus', null, null, 'يرقات دودة ورق القطن', null),
  ('تريكودرما هارزيانوم (Trichoderma harzianum)', 'micro_antagonists', 'fungicide', true, 'Trichoderma harzianum', null, null, 'فطريات التربة: أعفان الجذور، موت البادرات، الذبول', null),
  ('تريكودرما أسبيريلم (Trichoderma asperellum)', 'micro_antagonists', 'fungicide', true, 'Trichoderma asperellum', null, null, 'فطريات التربة: أعفان الجذور، الذبول', null),
  ('باسيلس ساتلس (Bacillus subtilis)', 'micro_antagonists', 'fungicide', true, 'Bacillus subtilis', 'BM02', null, 'أمراض المجموع الخضري والجذري', null),
  ('باسيلس أميلوليكويفاشينس (Bacillus amyloliquefaciens)', 'micro_antagonists', 'fungicide', true, 'Bacillus amyloliquefaciens', 'BM02', null, 'العفن الرمادي والبياض وأمراض الجذور', null),
  ('سودوموناس فلورسنس (Pseudomonas fluorescens)', 'micro_antagonists', 'fungicide', true, 'Pseudomonas fluorescens', null, null, 'أمراض الجذور والتربة', null),
  ('باسيلس فيرمس (Bacillus firmus)', 'micro_nematode_antagonists', 'nematicide', true, 'Bacillus firmus', null, null, 'النيماتودا', null),
  ('بوكونيا كلاميدوسبوريا (Pochonia chlamydosporia)', 'micro_nematode_antagonists', 'nematicide', true, 'Pochonia chlamydosporia', null, null, 'بيض نيماتودا تعقد الجذور', null),
  ('بربيوروسيليوم ليلاسينوم (Purpureocillium lilacinum)', 'micro_nematode_antagonists', 'nematicide', true, 'Purpureocillium lilacinum', null, null, 'بيض ويرقات النيماتودا', null),
  ('Neoseiulus californicus', 'ne_predatory_mites', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'أكاروس مفترس — العنكبوت الأحمر (يتحمل الحرارة والجفاف)', 'Neoseiulus californicus'),
  ('Neoseiulus cucumeris', 'ne_predatory_mites', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'أكاروس مفترس — التربس والأكاروس العريض', 'Neoseiulus cucumeris'),
  ('Amblyseius andersoni', 'ne_predatory_mites', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'أكاروس مفترس — العنكبوت الأحمر وأكاروس الصدأ', 'Amblyseius andersoni'),
  ('Transeius montdorensis', 'ne_predatory_mites', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'أكاروس مفترس — التربس والذبابة البيضاء', 'Transeius montdorensis'),
  ('Stratiolaelaps scimitus', 'ne_predatory_mites', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'أكاروس مفترس أرضي — عذارى التربس ويرقات ذباب الفطر', 'Stratiolaelaps scimitus'),
  ('Orius albidipennis', 'ne_predatory_insects', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'بقة مفترسة محلية — التربس', 'Orius albidipennis'),
  ('Aphidoletes aphidimyza', 'ne_predatory_insects', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'هاموش مفترس — المن', 'Aphidoletes aphidimyza'),
  ('Feltiella acarisuga', 'ne_predatory_insects', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'هاموش مفترس — العنكبوت الأحمر', 'Feltiella acarisuga'),
  ('Cryptolaemus montrouzieri', 'ne_predatory_insects', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'خنفساء مفترسة — البق الدقيقي', 'Cryptolaemus montrouzieri'),
  ('Adalia bipunctata', 'ne_predatory_insects', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'أبو العيد ذو النقطتين — المن', 'Adalia bipunctata'),
  ('Eretmocerus mundus', 'ne_parasitoids', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'متطفل — ذبابة التبغ البيضاء Bemisia tabaci', 'Eretmocerus mundus'),
  ('Aphidius ervi', 'ne_parasitoids', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'متطفل — المن كبير الحجم', 'Aphidius ervi'),
  ('Aphelinus abdominalis', 'ne_parasitoids', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'متطفل — المن', 'Aphelinus abdominalis'),
  ('Dacnusa sibirica', 'ne_parasitoids', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'متطفل — صانعات الأنفاق', 'Dacnusa sibirica'),
  ('Anagyrus vladimiri', 'ne_parasitoids', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'متطفل — البق الدقيقي', 'Anagyrus vladimiri'),
  ('Trichogramma evanescens', 'ne_parasitoids', 'biocontrol_agent', true, null, null, 'individuals_per_m2', 'متطفل بيض — حرشفية الأجنحة', 'Trichogramma evanescens'),
  ('خلايا نحل العسل (Apis mellifera)', 'poll_bees', 'pollinator', true, null, null, 'hives', 'تلقيح القرعيات في الحقل المكشوف والأنفاق', 'Apis mellifera'),
  ('زيت الثوم', 'bot_plant_oils', 'insecticide', true, 'زيت الثوم', null, null, 'طارد ومبيد بالملامسة للحشرات الرخوة', null),
  ('زيت القرنفل', 'bot_plant_oils', 'insecticide', true, 'زيت القرنفل (يوجينول)', null, null, 'زيت عطري طارد بالملامسة للحشرات والعناكب', null),
  ('زيت القرفة', 'bot_plant_oils', 'insecticide', true, 'زيت القرفة', null, null, 'زيت عطري طارد بالملامسة للحشرات والعناكب', null),
  ('زيت البرتقال (د-ليمونين)', 'bot_plant_oils', 'insecticide', true, 'زيت البرتقال (د-ليمونين)', null, null, 'بالملامسة على الحشرات الرخوة والعناكب والبياض الدقيقي', null),
  ('زيت الخروع', 'bot_plant_oils', 'insecticide', true, 'زيت الخروع', null, null, 'زيت نباتي طارد', null),
  ('زيت الجوجوبا', 'bot_plant_oils', 'insecticide', true, 'زيت الجوجوبا', null, null, 'زيت نباتي بالملامسة على الحشرات الرخوة والبياض الدقيقي', null),
  ('زيت بذرة القطن', 'bot_plant_oils', 'insecticide', true, 'زيت بذرة القطن', null, null, 'زيت نباتي بالملامسة على الحشرات الرخوة', null),
  ('زيت الكانولا', 'bot_plant_oils', 'insecticide', true, 'زيت الكانولا', null, null, 'زيت نباتي بالملامسة على الحشرات الرخوة والعناكب', null),
  ('زيت شجرة الشاي', 'bot_plant_oils', 'fungicide', true, 'زيت شجرة الشاي', null, null, 'أمراض فطرية ورقية: البياض الدقيقي والعفن الرمادي', null),
  ('زيت الزعتر (ثيمول)', 'bot_plant_oils', 'fungicide', true, 'زيت الزعتر (ثيمول)', null, null, 'زيت عطري مضاد للفطريات', null),
  ('زيت معدني صيفي (بارافيني)', 'bot_mineral_oils', 'insecticide', true, 'زيت بارافيني (معدني)', null, null, 'الحشرات القشرية والبق الدقيقي والذبابة البيضاء والعناكب بالملامسة', null),
  ('زيت KZ (كيه زد)', 'bot_mineral_oils', 'insecticide', true, null, null, null, 'زيت معدني: الحشرات القشرية والبق الدقيقي', null),
  ('سوبر مصرونا', 'bot_mineral_oils', 'insecticide', true, null, null, null, 'زيت معدني: الحشرات القشرية والبق الدقيقي', null),
  ('مستخلص الثوم', 'bot_extracts', 'insecticide', true, 'مستخلص الثوم', null, null, 'طارد للحشرات ومساعد في مكافحة النيماتودا', null),
  ('مستخلص الفلفل الحار (كابسيسين)', 'bot_extracts', 'insecticide', true, 'كابسيسين', null, null, 'طارد للحشرات الماصة', null),
  ('بيرثرين طبيعي (مستخلص البيرثرم)', 'bot_extracts', 'insecticide', true, 'بيرثرينات طبيعية', '3A', null, 'بالملامسة السريعة على الحشرات الرخوة والتربس', null),
  ('أزاديراختين (مستخلص بذور النيم)', 'bot_extracts', 'insecticide', true, 'أزاديراختين', 'UN', null, 'منظم نمو حشري ومانع تغذية: الذبابة البيضاء، المن، التربس، صانعات الأنفاق', null),
  ('مستخلص الكيلايا (سابونينات)', 'bot_extracts', 'nematicide', true, 'سابونينات Quillaja saponaria', null, null, 'النيماتودا', null),
  ('كبريت قابل للبلل (WP/WG)', 'min_sulfur', 'fungicide', true, 'كبريت', 'M02', null, 'البياض الدقيقي والأكاروسات', null),
  ('كبريت تعفير (زهر الكبريت)', 'min_sulfur', 'fungicide', true, 'كبريت', 'M02', null, 'تعفير ضد البياض الدقيقي والأكاروسات', null),
  ('هيدروكسيد النحاس', 'min_copper', 'fungicide', false, 'هيدروكسيد النحاس', 'M01', null, 'وقائي: البياض الزغبي، الندوات، الأمراض البكتيرية', null),
  ('أوكسي كلوريد النحاس', 'min_copper', 'fungicide', false, 'أوكسي كلوريد النحاس', 'M01', null, 'وقائي: البياض الزغبي، الندوات، الأمراض البكتيرية', null),
  ('مخلوط بوردو', 'min_copper', 'fungicide', false, 'كبريتات النحاس + الجير', 'M01', null, 'وقائي: البياض الزغبي والندوات', null),
  ('بيكربونات الصوديوم', 'min_salts', 'fungicide', true, 'بيكربونات الصوديوم', null, null, 'البياض الدقيقي بالملامسة', null),
  ('فوسفيت البوتاسيوم', 'min_salts', 'fungicide', false, 'فوسفيت البوتاسيوم', 'P07', null, 'البياض الزغبي وأعفان الجذور؛ محفز لدفاعات النبات', null),
  ('طين الكاولين', 'min_particle_films', 'other', true, 'كاولين', null, null, 'غشاء واقٍ من لسعة الشمس والحشرات', null),
  ('تراب دياتومي', 'min_particle_films', 'other', true, 'تراب دياتومي', null, null, 'مسحوق خامل للحشرات الزاحفة وحشرات التربة', null),
  ('لفائف لاصقة صفراء (رول)', 'trap_sticky', 'other', true, null, null, null, 'اصطياد جماعي: الذبابة البيضاء، المن المجنح، صانعات الأنفاق', null),
  ('لفائف لاصقة زرقاء (رول)', 'trap_sticky', 'other', true, null, null, null, 'اصطياد جماعي: التربس', null),
  ('فيرمون دودة اللوز الأمريكية (Helicoverpa armigera)', 'trap_pheromones', 'other', true, null, null, null, 'رصد ذكور دودة اللوز الأمريكية', null),
  ('فيرمون دودة الحشد الخريفية (Spodoptera frugiperda)', 'trap_pheromones', 'other', true, null, null, null, 'رصد ذكور دودة الحشد الخريفية', null),
  ('فيرمون الدودة القارضة (Agrotis ipsilon)', 'trap_pheromones', 'other', true, null, null, null, 'رصد ذكور الدودة القارضة', null),
  ('فيرمون فراشة درنات البطاطس (Phthorimaea operculella)', 'trap_pheromones', 'other', true, null, null, null, 'رصد ذكور فراشة درنات البطاطس', null),
  ('جاذب ميثيل يوجينول (ذبابة الخوخ)', 'trap_pheromones', 'other', true, 'ميثيل يوجينول', null, null, 'جذب ذكور ذبابة الخوخ Bactrocera zonata', null),
  ('جاذب ترايميدلور (ذبابة فاكهة البحر المتوسط)', 'trap_pheromones', 'other', true, 'ترايميدلور', null, null, 'جذب ذكور ذبابة فاكهة البحر المتوسط Ceratitis capitata', null),
  ('طعم بروتيني متحلل (ذباب الفاكهة)', 'trap_food_baits', 'other', true, null, null, null, 'جذب إناث وذكور ذباب الفاكهة في المصائد أو رش الطعوم', null),
  ('مصيدة دلتا', 'trap_devices', 'other', true, null, null, null, 'هيكل مصيدة لاصقة للفيرمونات', null),
  ('مصيدة مائية (حوض ماء)', 'trap_devices', 'other', true, null, null, null, 'اصطياد جماعي للتوتا بالفيرمون فوق حوض ماء', null),
  ('مصيدة قمعية (Funnel)', 'trap_devices', 'other', true, null, null, null, 'هيكل مصيدة للفيرمونات لحرشفية الأجنحة', null),
  ('مصيدة ماكفيل (McPhail)', 'trap_devices', 'other', true, null, null, null, 'مصيدة ذباب الفاكهة بالطعوم والجواذب', null),
  ('مصيدة ضوئية', 'trap_devices', 'other', true, null, null, null, 'اصطياد الفراشات الليلية ومنها التوتا', null),
  ('مادة ناشرة غير أيونية', 'adj_spreader_sticker', 'adjuvant', false, null, null, null, 'خفض التوتر السطحي وانتظام تغطية الرش', null),
  ('مادة ناشرة سيليكونية (Organosilicone)', 'adj_spreader_sticker', 'adjuvant', false, null, null, null, 'انتشار فائق للرش وتغطية السطح السفلي للأوراق', null),
  ('مادة لاصقة (Sticker)', 'adj_spreader_sticker', 'adjuvant', false, null, null, null, 'تثبيت المبيد على السطح ومقاومة الغسيل', null),
  ('منظم حموضة محلول الرش (Buffer)', 'adj_ph_buffer', 'adjuvant', false, null, null, null, 'خفض وتثبيت pH محلول الرش ومعادلة عسر الماء', null),
  ('مضاد رغوة', 'adj_antifoam', 'adjuvant', false, null, null, null, 'منع تكون الرغوة في خزان الرش', null),
  ('سماد بلدي متحلل', 'lp_organic_manures', 'fertilizer', true, null, null, null, 'سماد عضوي للخدمة قبل الزراعة', null),
  ('كمبوست', 'lp_organic_manures', 'fertilizer', true, null, null, null, 'سماد عضوي متحلل لتحسين خواص التربة', null),
  ('سماد دواجن متحلل', 'lp_organic_manures', 'fertilizer', true, null, null, null, 'سماد عضوي غني بالنيتروجين؛ يُستخدم متحللًا تمامًا', null),
  ('فيرمي كمبوست (سماد الديدان)', 'lp_organic_manures', 'fertilizer', true, null, null, null, 'سماد عضوي ناعم غني بالنشاط الحيوي', null),
  ('بنتونيت', 'lp_soil_amendments', 'other', false, 'بنتونيت', null, null, 'رفع قدرة الأراضي الرملية على الاحتفاظ بالماء والعناصر', null),
  ('زيوليت', 'lp_soil_amendments', 'other', false, 'زيوليت', null, null, 'رفع السعة التبادلية والاحتفاظ بالماء والأمونيوم', null),
  ('بوليمر حافظ للماء (هيدروجيل)', 'lp_soil_amendments', 'other', false, null, null, null, 'الاحتفاظ بالماء في الأراضي الخفيفة', null),
  ('فحم حيوي (بيوتشار)', 'lp_soil_amendments', 'other', false, null, null, null, 'تحسين بناء التربة والاحتفاظ بالماء', null),
  ('بيتموس', 'lp_growing_media', 'other', false, null, null, null, 'بيئة إنبات الشتلات وخلطات البيئة', null),
  ('بيرلايت', 'lp_growing_media', 'other', false, null, null, null, 'تحسين التهوية والصرف في البيئة', null),
  ('فيرميكوليت', 'lp_growing_media', 'other', false, null, null, null, 'الاحتفاظ بالماء وتغطية البذور', null),
  ('كوكوبيت (ألياف جوز الهند)', 'lp_growing_media', 'other', false, null, null, null, 'بيئة زراعة بدون تربة (أكياس/ألواح)', null),
  ('صوف صخري (ألواح ومكعبات)', 'lp_growing_media', 'other', false, null, null, null, 'بيئة زراعة بدون تربة', null),
  ('طف بركاني (حجر بركاني)', 'lp_growing_media', 'other', false, null, null, null, 'بيئة زراعة بدون تربة قابلة لإعادة الاستخدام بعد الغسيل والتعقيم', null),
  ('بيروكسيد الهيدروجين مع الفضة', 'lp_disinfectants', 'other', false, 'بيروكسيد الهيدروجين + فضة', null, null, 'تعقيم البيئة وشبكة الري والصوبة بين العروات', null),
  ('هيبوكلوريت الصوديوم (كلور)', 'lp_disinfectants', 'other', false, 'هيبوكلوريت الصوديوم', null, null, 'تطهير الأسطح والأدوات وشبكة الري', null),
  ('مركبات الأمونيوم الرباعية', 'lp_disinfectants', 'other', false, 'مركبات الأمونيوم الرباعية', null, null, 'تطهير هيكل الصوبة والأرضيات والأدوات', null),
  ('حمض البيروكسي أسيتيك', 'lp_disinfectants', 'other', false, 'حمض البيروكسي أسيتيك', null, null, 'تطهير الأسطح والأدوات وشبكة الري', null),
  ('بيروكسي مونوسلفات البوتاسيوم', 'lp_disinfectants', 'other', false, 'بيروكسي مونوسلفات البوتاسيوم', null, null, 'تطهير الأيدي والأدوات والأحذية (مهم ضد فيروس ToBRFV)', null),
  ('خراطيم تنقيط (GR)', 'lp_irrigation_supplies', 'other', false, null, null, null, 'خطوط تنقيط بنقاطات مدمجة', null),
  ('شرائط تنقيط (Drip tape)', 'lp_irrigation_supplies', 'other', false, null, null, null, 'خطوط تنقيط رقيقة لموسم واحد', null),
  ('نقاطات وأسهم تنقيط', 'lp_irrigation_supplies', 'other', false, null, null, null, 'تنقيط لأكياس ومراقد البيئة', null),
  ('خراطيم PE رئيسية وفرعية', 'lp_irrigation_supplies', 'other', false, null, null, null, 'خطوط التوزيع في شبكة الري', null),
  ('فلاتر الري (شبكية/ديسك)', 'lp_irrigation_supplies', 'other', false, null, null, null, 'ترشيح مياه الري لمنع انسداد النقاطات', null),
  ('ملش بلاستيك (أسود/فضي)', 'lp_covers', 'other', false, null, null, null, 'تغطية المصاطب لمنع الحشائش وحفظ الرطوبة', null),
  ('بلاستيك شفاف للتعقيم الشمسي', 'lp_covers', 'other', false, null, null, null, 'تغطية التربة الرطبة في التعقيم الشمسي', null),
  ('بلاستيك تغطية الصوب (UV)', 'lp_covers', 'other', false, null, null, null, 'الغطاء البلاستيكي لهيكل الصوبة', null),
  ('شبك مانع للحشرات (50 مش)', 'lp_covers', 'other', false, null, null, null, 'تغطية فتحات التهوية ضد الذبابة البيضاء والتربس', null),
  ('شبك تظليل', 'lp_covers', 'other', false, null, null, null, 'خفض الإشعاع والحرارة', null),
  ('غطاء أرضية (جراوند كفر)', 'lp_covers', 'other', false, null, null, null, 'تغطية أرضية الصوبة في الزراعة بدون تربة', null),
  ('دوبار التربيط (بولي بروبيلين)', 'lp_support_supplies', 'other', false, null, null, null, 'تربيط ولف النباتات', null),
  ('سلك الدعامات المجلفن', 'lp_support_supplies', 'other', false, null, null, null, 'السلك الحامل للنباتات', null),
  ('كلبسات وحلقات التربيط', 'lp_support_supplies', 'other', false, null, null, null, 'تثبيت الساق على الدوبار', null),
  ('خطافات وبكرات التنزيل', 'lp_support_supplies', 'other', false, null, null, null, 'تنزيل النباتات (Layering)', null),
  ('أكياس الزراعة (جرو باج)', 'lp_support_supplies', 'other', false, null, null, null, 'أكياس تعبئة البيئة', null)
) as v(name, cat, ptype, bio, ai, moa, unit, targets, species)
join public.product_categories c on c.farm_id is null and c.code = v.cat
where not exists (select 1 from public.products x where x.farm_id is null and x.name = v.name);

-- ── 5) عمليات خدمة الأرض وتجهيزها ─────────────────────────────
update public.operation_types set category = 'land_preparation', sort_order = 0 where farm_id is null and code = 'greenhouse_disinfect';
update public.operation_types set category = 'land_preparation', sort_order = 11 where farm_id is null and code = 'soil_prep';
update public.operation_types set category = 'land_preparation', sort_order = 13 where farm_id is null and code = 'substrate_sterilize';
update public.operation_types set category = 'land_preparation', sort_order = 16 where farm_id is null and code = 'irrigation_setup';
insert into public.operation_types (code, name_ar, name_en, category, sort_order) values
  ('cover_net_installation', 'تركيب/تغيير الغطاء البلاستيكي والشبك', 'Cover & insect-net installation / replacement', 'land_preparation', 1),
  ('plowing', 'الحرث', 'Ploughing', 'land_preparation', 2),
  ('harrowing', 'التنعيم والتزحيف', 'Harrowing & clod breaking', 'land_preparation', 3),
  ('laser_leveling', 'التسوية بالليزر', 'Laser levelling', 'land_preparation', 4),
  ('manure_amendments', 'إضافة السماد البلدي والمحسنات', 'Manure & soil-amendment application', 'land_preparation', 5),
  ('soil_mixing', 'خلط وتقليب التربة', 'Soil mixing / rotavating', 'land_preparation', 6),
  ('soil_leaching', 'غسيل التربة من الأملاح', 'Soil salt leaching', 'land_preparation', 7),
  ('soil_solarization', 'التعقيم الشمسي للتربة', 'Soil solarization', 'land_preparation', 8),
  ('soil_fumigation', 'التعقيم الكيماوي أو البخاري للتربة', 'Chemical / steam soil sterilization', 'land_preparation', 9),
  ('bed_forming', 'التخطيط وعمل المصاطب والخطوط', 'Bed / row forming', 'land_preparation', 10),
  ('substrate_washing', 'غسيل البيئة من الأملاح بين العروات', 'Substrate washing between cycles', 'land_preparation', 12),
  ('substrate_filling', 'تجهيز وتعبئة البيئة (أكياس/مراقد)', 'Substrate bag / bed filling', 'land_preparation', 14),
  ('drip_laying', 'فرد خراطيم التنقيط واختبار الشبكة', 'Drip-line laying & network testing', 'land_preparation', 15),
  ('mulch_laying', 'فرد الملش', 'Mulch laying', 'land_preparation', 17),
  ('trellis_installation', 'تركيب الدعامات والأسلاك', 'Trellis posts & wire installation', 'land_preparation', 18),
  ('pre_plant_irrigation', 'رية التجهيز وتشبيع البيئة قبل الشتل', 'Pre-plant irrigation / substrate saturation', 'land_preparation', 19)
on conflict do nothing;
