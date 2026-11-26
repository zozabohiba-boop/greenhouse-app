# -*- coding: utf-8 -*-
"""
شجرة تصنيف مدخلات المزرعة (رئيسي ← فرعي) — مصدر البيانات الذي يولّد migration 013.

  * التصنيفات الرئيسية والفرعية (product_categories، عامة farm_id = null)
  * تصنيف كل منتج عام موجود (knowledge.py ‏P + منتجات 002) في تصنيف فرعي واحد
  * منتجات عامة جديدة مهمة (أسمدة، منشطات، زيوت، أعداء حيوية، مصائد، مواد خدمة الأرض...)
  * عمليات خدمة الأرض وتجهيزها (operation_types، الفئة land_preparation)

قواعد التعبئة (نفس قواعد knowledge.py):
  - لا تُخترع جرعة ولا فترة أمان (PHI): المنتجات الجديدة كلها default_dose = null و phi_days = null.
  - المادة الفعالة تُكتب فقط للمنتج العام الذي هو نفسه المادة (نترات الكالسيوم، كبريت ...).
  - رمز IRAC/FRAC يُكتب فقط عند التأكد التام؛ غير ذلك null.
  - المبيدات الكيميائية المُخلَّقة لا تُضاف هنا (تُسجَّل لكل مزرعة حسب المسجَّل محليًا) — تُصنَّف الموجودة فقط.

تشغيل:  python3 scripts/knowledge/taxonomy.py > supabase/migrations/013_taxonomy_data.sql
(ملخص التغطية يُطبع على stderr، والسكربت يفشل صراحةً عند أي منتج موجود بلا تصنيف.)
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

PRODUCT_TYPES = {'insecticide', 'acaricide', 'fungicide', 'bactericide', 'nematicide', 'herbicide',
                 'fertilizer', 'biostimulant', 'biocontrol_agent', 'pollinator', 'adjuvant', 'other'}
DOSE_UNITS = {'ml_per_l', 'g_per_l', 'ml_per_100l', 'g_per_100l', 'l_per_feddan', 'kg_per_feddan',
              'ml_per_feddan', 'g_per_feddan', 'l_per_ha', 'kg_per_ha', 'individuals_per_m2',
              'individuals_total', 'units_per_greenhouse', 'hives', 'other'}
DOMAINS = {'fertigation', 'ipm', 'operations'}


def load_knowledge():
    """يحمّل knowledge.py كوحدة دون تشغيل main() (محميّة بـ __name__)."""
    spec = importlib.util.spec_from_file_location('gh_knowledge', os.path.join(HERE, 'knowledge.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def seeded_002_products():
    """أسماء المنتجات العامة المزروعة في 002_seed_catalogs.sql."""
    path = os.path.join(ROOT, 'supabase', 'migrations', '002_seed_catalogs.sql')
    with open(path, encoding='utf-8') as f:
        sql = f.read()
    m = re.search(r"insert into public\.products\s*\([^)]*\)\s*values(.*?);", sql, re.S)
    assert m, '002: products insert not found'
    names = re.findall(r"^\s*\(\s*'((?:[^']|'')*)'", m.group(1), re.M)
    assert names, '002: no product rows parsed'
    return [n.replace("''", "'") for n in names]


# ═════════════════════════════════════════════════════════════════════
# 1) التصنيفات الرئيسية: (code, name_ar, name_en, domain, sort_order, notes)
# ═════════════════════════════════════════════════════════════════════
MAJORS = [
    ('fertilizers', 'الأسمدة والعناصر الغذائية', 'Fertilizers & plant nutrition', 'fertigation', 10,
     'الأسمدة المعدنية المفردة والمركبة والأحماض السمادية؛ الأسمدة الورقية تتبع العنصر الذي تمد به النبات'),
    ('biostimulants', 'المنشطات الحيوية ومنظمات النمو', 'Biostimulants & plant growth regulators', 'fertigation', 20, None),
    ('biofertilizers', 'المخصبات الحيوية', 'Bio-fertilizers (microbial inoculants)', 'fertigation', 30,
     'لقاحات ميكروبية تحسن إتاحة العناصر للنبات'),
    ('chemical_pesticides', 'المبيدات الكيميائية المُخلَّقة', 'Synthetic chemical pesticides', 'ipm', 40,
     'تُسجَّل لكل مزرعة حسب المسجَّل محليًا؛ فترة الأمان من ملصق العبوة'),
    ('microbial_biopesticides', 'المبيدات الحيوية الميكروبية', 'Microbial bio-pesticides', 'ipm', 50,
     'كائنات دقيقة حية أو منتجاتها الأيضية'),
    ('natural_enemies', 'الأعداء الحيوية', 'Natural enemies (macrobials)', 'ipm', 60,
     'مفترسات ومتطفلات تُطلق في الصوبة'),
    ('botanicals_oils', 'الزيوت والمستخلصات النباتية والصابون', 'Oils, botanical extracts & soaps', 'ipm', 70, None),
    ('mineral_protectants', 'المركبات المعدنية الواقية', 'Inorganic / mineral protectants', 'ipm', 80,
     'كبريت ونحاس وأملاح وأغشية معدنية (مبيدات غير عضوية متعددة المواقع أو واقية)'),
    ('traps_attractants', 'المصائد والفيرمونات والجواذب', 'Traps, pheromones & attractants', 'ipm', 90,
     'للرصد والاصطياد الجماعي'),
    ('spray_adjuvants', 'المواد المساعدة لمحلول الرش', 'Spray adjuvants', 'ipm', 100, None),
    ('pollination', 'التلقيح', 'Pollination', 'operations', 110, None),
    ('land_preparation', 'مواد الخدمة وتجهيز الأرض', 'Ground service & land-preparation materials', 'operations', 120,
     'مستلزمات تُستخدم قبل الزراعة وبين العروات؛ المستلزمات بدون جرعة'),
]

# ═════════════════════════════════════════════════════════════════════
# 2) التصنيفات الفرعية: (code, parent, name_ar, name_en, default_product_type, is_bio, sort_order, notes)
#    domain يُورث من الرئيسي.
# ═════════════════════════════════════════════════════════════════════
SUBS = [
    # ── الأسمدة ──
    ('fert_nitrogen', 'fertilizers', 'الأسمدة النيتروجينية', 'Nitrogen fertilizers', 'fertilizer', False, 10, None),
    ('fert_phosphate', 'fertilizers', 'الأسمدة الفوسفاتية', 'Phosphate fertilizers', 'fertilizer', False, 20, None),
    ('fert_potassium', 'fertilizers', 'الأسمدة البوتاسية', 'Potassium fertilizers', 'fertilizer', False, 30, None),
    ('fert_secondary', 'fertilizers', 'العناصر الثانوية (كالسيوم، ماغنسيوم، كبريت)', 'Secondary nutrients (Ca, Mg, S)', 'fertilizer', False, 40,
     'نترات الكالسيوم والماغنسيوم تُصنَّف هنا لأن الغرض الأساسي منها الكالسيوم/الماغنسيوم'),
    ('fert_micro', 'fertilizers', 'العناصر الصغرى (مخلبية ومعدنية)', 'Micronutrients (chelated & mineral)', 'fertilizer', False, 50, None),
    ('fert_npk', 'fertilizers', 'الأسمدة المركبة الذائبة (NPK)', 'Compound water-soluble fertilizers (NPK)', 'fertilizer', False, 60,
     'ومنها الأسمدة الورقية المتوازنة'),
    ('fert_acids', 'fertilizers', 'الأحماض السمادية ومعدلات pH مياه الري', 'Fertilizer acids & irrigation-water pH adjusters', 'fertilizer', False, 70,
     'حمض الفوسفوريك يُصنَّف هنا لأنه يُستخدم أساسًا لضبط pH مياه الري مع إمداد الفوسفور'),
    ('fert_organic', 'fertilizers', 'الأسمدة العضوية والعضوية-المعدنية السائلة', 'Liquid organic & organo-mineral fertilizers', 'fertilizer', True, 80, None),
    # ── المنشطات ومنظمات النمو ──
    ('bs_amino', 'biostimulants', 'الأحماض الأمينية', 'Amino acids & protein hydrolysates', 'biostimulant', True, 10, None),
    ('bs_humic', 'biostimulants', 'الأحماض الهيومية والفولفيك', 'Humic & fulvic substances', 'biostimulant', True, 20, None),
    ('bs_seaweed', 'biostimulants', 'مستخلصات الطحالب البحرية', 'Seaweed extracts', 'biostimulant', True, 30, None),
    ('bs_silicon', 'biostimulants', 'السيليكون والعناصر المفيدة', 'Silicon & beneficial elements', 'biostimulant', False, 40,
     'السيليكات تعمل عبر تقوية الأنسجة وتحفيز المقاومة في النبات، لذا تُصنَّف هنا لا ضمن المبيدات'),
    ('bs_complex', 'biostimulants', 'منشطات حيوية مركبة ومحفزات المقاومة', 'Complex biostimulants & resistance inducers', 'biostimulant', True, 50,
     'خلطات تجارية متعددة المكونات (إزهار، عقد، تلوين، تحمل الإجهاد، لقاحات نباتية)'),
    ('pgr', 'biostimulants', 'منظمات النمو النباتية', 'Plant growth regulators', 'other', False, 60,
     'هرمونات ومنظمات نمو مُسجَّلة؛ الجرعة من ملصق العبوة'),
    # ── المخصبات الحيوية ──
    ('biofert_n', 'biofertilizers', 'بكتيريا مثبتة للنيتروجين', 'Nitrogen-fixing bacteria', 'fertilizer', True, 10, None),
    ('biofert_pk', 'biofertilizers', 'كائنات مذيبة للفوسفات ومحررة للبوتاسيوم', 'P-solubilizing & K-releasing microbes', 'fertilizer', True, 20, None),
    ('biofert_myco', 'biofertilizers', 'الميكوريزا', 'Mycorrhizal fungi', 'fertilizer', True, 30, None),
    # ── المبيدات الكيميائية ──
    ('chem_insecticides', 'chemical_pesticides', 'المبيدات الحشرية', 'Insecticides', 'insecticide', False, 10, None),
    ('chem_acaricides', 'chemical_pesticides', 'المبيدات الأكاروسية', 'Acaricides', 'acaricide', False, 20, None),
    ('chem_fungicides', 'chemical_pesticides', 'المبيدات الفطرية', 'Fungicides', 'fungicide', False, 30,
     'المبيدات الفطرية العضوية المُخلَّقة؛ الكبريت والنحاس في «المركبات المعدنية الواقية»'),
    ('chem_bactericides', 'chemical_pesticides', 'المبيدات البكتيرية', 'Bactericides', 'bactericide', False, 40, None),
    ('chem_nematicides', 'chemical_pesticides', 'المبيدات النيماتودية', 'Nematicides', 'nematicide', False, 50, None),
    ('chem_herbicides', 'chemical_pesticides', 'مبيدات الحشائش', 'Herbicides', 'herbicide', False, 60, None),
    ('chem_molluscicides_rodenticides', 'chemical_pesticides', 'مبيدات القواقع والقوارض', 'Molluscicides & rodenticides', 'other', False, 70, None),
    # ── الميكروبية ──
    ('micro_ento_fungi', 'microbial_biopesticides', 'الفطريات الممرضة للحشرات', 'Entomopathogenic fungi', 'insecticide', True, 10,
     'بيوفيريا، ميتاريزيوم، ليكانيسيليوم (فيرتيسيليوم)، إيزاريا (كورديسبس)'),
    ('micro_ento_bacteria', 'microbial_biopesticides', 'البكتيريا الممرضة للحشرات ومنتجاتها', 'Entomopathogenic bacteria & their metabolites', 'insecticide', True, 20,
     'باسيلس ثورينجينسيس (Bt)، والسبينوساد (ناتج تخمر بكتيري)'),
    ('micro_ento_nematodes_viruses', 'microbial_biopesticides', 'النيماتودا والفيروسات الممرضة للحشرات', 'Entomopathogenic nematodes & insect viruses', 'insecticide', True, 30, None),
    ('micro_antagonists', 'microbial_biopesticides', 'مضادات أمراض النبات الحيوية', 'Microbial antagonists of plant diseases', 'fungicide', True, 40,
     'تريكودرما، باسيلس ساتلس/أميلوليكويفاشينس، سودوموناس'),
    ('micro_nematode_antagonists', 'microbial_biopesticides', 'كائنات دقيقة مضادة للنيماتودا', 'Nematode-antagonistic microbes', 'nematicide', True, 50, None),
    # ── الأعداء الحيوية ──
    ('ne_predatory_mites', 'natural_enemies', 'الأكاروسات المفترسة', 'Predatory mites', 'biocontrol_agent', True, 10, None),
    ('ne_predatory_insects', 'natural_enemies', 'الحشرات المفترسة', 'Predatory insects', 'biocontrol_agent', True, 20, None),
    ('ne_parasitoids', 'natural_enemies', 'المتطفلات', 'Parasitoids', 'biocontrol_agent', True, 30, None),
    # ── الزيوت والمستخلصات ──
    ('bot_plant_oils', 'botanicals_oils', 'الزيوت النباتية والعطرية', 'Plant & essential oils', 'insecticide', True, 10, None),
    ('bot_mineral_oils', 'botanicals_oils', 'الزيوت المعدنية (البارافينية/الصيفية)', 'Mineral (paraffinic / summer) oils', 'insecticide', True, 20,
     'الزيوت البارافينية مقبولة في برامج الزراعة العضوية؛ الحيوي/الطبيعي يُحدد لكل منتج'),
    ('bot_extracts', 'botanicals_oils', 'المستخلصات النباتية والمركبات الطبيعية', 'Botanical extracts & natural compounds', 'insecticide', True, 30,
     'أزاديراختين، بيرثرين، ثوم، فلفل حار، ومستحضرات نباتية تجارية'),
    ('bot_soaps_salts', 'botanicals_oils', 'الصابون الزراعي والمنظفات المتعادلة', 'Insecticidal soaps & neutral detergents', 'insecticide', True, 40, None),
    # ── المعدنية الواقية ──
    ('min_sulfur', 'mineral_protectants', 'مركبات الكبريت', 'Sulfur products', 'fungicide', True, 10, None),
    ('min_copper', 'mineral_protectants', 'مركبات النحاس', 'Copper compounds', 'fungicide', False, 20, None),
    ('min_salts', 'mineral_protectants', 'البيكربونات والفوسفيت والأملاح الواقية', 'Bicarbonates, phosphites & protective salts', 'fungicide', True, 30, None),
    ('min_particle_films', 'mineral_protectants', 'الأغشية المعدنية (كاولين، تراب دياتومي)', 'Particle films & mineral dusts', 'other', True, 40, None),
    # ── المصائد ──
    ('trap_sticky', 'traps_attractants', 'المصائد اللاصقة الملونة', 'Coloured sticky traps', 'other', True, 10, None),
    ('trap_pheromones', 'traps_attractants', 'الفيرمونات والجواذب الجنسية', 'Pheromones & sex/para-pheromone lures', 'other', True, 20, None),
    ('trap_food_baits', 'traps_attractants', 'الجواذب الغذائية والطعوم', 'Food attractants & baits', 'other', True, 30, None),
    ('trap_devices', 'traps_attractants', 'هياكل المصائد', 'Trap devices (delta, water, funnel, McPhail, light)', 'other', True, 40, None),
    # ── المواد المساعدة ──
    ('adj_spreader_sticker', 'spray_adjuvants', 'الناشرات واللاصقات ومواد الترطيب', 'Spreaders, stickers & wetting agents', 'adjuvant', False, 10, None),
    ('adj_ph_buffer', 'spray_adjuvants', 'منظمات حموضة ومعالجات مياه الرش', 'Spray-tank pH buffers & water conditioners', 'adjuvant', False, 20, None),
    ('adj_antifoam', 'spray_adjuvants', 'مضادات الرغوة', 'Anti-foam agents', 'adjuvant', False, 30, None),
    # ── التلقيح ──
    ('poll_bees', 'pollination', 'النحل الطنان والملقحات', 'Bumblebees & pollinators', 'pollinator', True, 10, None),
    # ── خدمة الأرض ──
    ('lp_organic_manures', 'land_preparation', 'الأسمدة العضوية (بلدي، كمبوست، دواجن)', 'Organic manures & composts', 'fertilizer', True, 10, None),
    ('lp_soil_amendments', 'land_preparation', 'محسنات التربة ومصححات الملوحة', 'Soil amendments & salinity correctors', 'other', False, 20, None),
    ('lp_growing_media', 'land_preparation', 'بيئات الزراعة', 'Growing media / substrates', 'other', False, 30, None),
    ('lp_disinfectants', 'land_preparation', 'مطهرات ومعقمات التربة والصوب', 'Soil & greenhouse disinfectants / sterilants', 'other', False, 40,
     'للتعقيم بين العروات وتطهير الأدوات والهيكل'),
    ('lp_irrigation_supplies', 'land_preparation', 'مستلزمات شبكة الري', 'Irrigation network supplies', 'other', False, 50, None),
    ('lp_covers', 'land_preparation', 'أغطية التربة والصوب والشبك', 'Mulches, greenhouse covers & nets', 'other', False, 60, None),
    ('lp_support_supplies', 'land_preparation', 'مستلزمات التربية والتدعيم', 'Crop support & training supplies', 'other', False, 70, None),
]

# ═════════════════════════════════════════════════════════════════════
# 3) تصنيف المنتجات العامة الموجودة (الاسم كما هو في قاعدة البيانات حرفيًا)
# ═════════════════════════════════════════════════════════════════════
CLASSIFY = {
    'fert_nitrogen': ['يوريا', 'نترات نشادر'],
    'fert_phosphate': ['سوبر فوسفات ناعم', 'ماب (MAP)', 'مونو بوتاسيوم فوسفات (MKP)'],
    'fert_potassium': ['سلفات بوتاسيوم', 'نترات بوتاسيوم'],
    'fert_secondary': ['نترات كالسيوم', 'نترات ماغنسيوم', 'سلفات ماغنسيوم', 'فوسترايد كالسيوم', 'كلباك', 'QUICELU'],
    'fert_micro': ['حديد مخلبي', 'زنك مخلبي', 'منجنيز مخلبي', 'بوراكس', 'سلفات زنك', 'سلفات منجنيز', 'سلفات حديدوز',
                   'كوكتيل بيرل', 'زنكونيا', 'كريبتوم حديد'],
    'fert_npk': ['سماد مركب 19-19-19', 'فوسك 50', 'ال كابلانت'],
    'fert_acids': ['حمض فوسفوريك', 'حمض نيتريك', 'حمض كبريتيك'],
    'fert_organic': ['ORGAPLANT-Ca', 'ORGAPLANT-NK'],
    'bs_amino': ['سمبيون فام', 'ORGAPLANT ORGANIC'],
    'bs_humic': ['هيوميك', 'فولفيك', 'HUMIPOWER سائل', 'HUMIPOWER SOLUBLE', 'HUMIPOWER SOLID', 'HORTUMUS', 'CRIPTHUM New'],
    'bs_seaweed': ['جروفول (طحالب بحرية)'],
    'bs_silicon': ['سيليكات البوتاسيوم', 'سيليكات الماغنسيوم'],
    'bs_complex': ['إنذار', 'كروب بلس', 'رينتال', 'نيوسترين', 'أجريسترين', 'فورتسترين', 'كولور سيف', 'فيوري', 'ماتيور',
                   'كويكل', 'فلور استار'],
    'biofert_n': ['سمبيون الأزوت'],
    'biofert_pk': ['سوبر جرو', 'سمبيون البوتاسيوم', 'سمبيون الفوسفور'],
    'chem_insecticides': ['موسبيلان', 'البريتو', 'سيفانتو', 'اسبيدو'],
    'chem_acaricides': ['كاني مايت', 'فيرتيمك', 'تيبوسال'],
    'chem_fungicides': ['أمستار توب', 'يوني فورم'],
    'chem_nematicides': ['فيلوم برايم'],
    'micro_ento_fungi': ['بايو-كاتش', 'بايو باور', 'بايو-ماجيك', 'بيوسكت', 'تارسوس'],
    'micro_ento_bacteria': ['زنتاري', 'دايبل دي إف', 'بروتكتو', 'بيوتكت', 'تريسر'],
    'micro_antagonists': ['سيريناد أسو', 'بيوكونترول', 'بيوزيد', 'بيوارك', 'بايو-دوكون', 'بايوكيور-إف', 'بايوكيور-بي'],
    'micro_nematode_antagonists': ['بايو-نيماتون'],
    'ne_predatory_mites': ['Amblyseius swirskii', 'Phytoseiulus persimilis'],
    'ne_predatory_insects': ['Nesidiocoris tenuis', 'Macrolophus pygmaeus', 'Orius laevigatus', 'أسد المن', 'أبو العيد ذو السبع نقاط'],
    'ne_parasitoids': ['Encarsia formosa', 'Eretmocerus eremicus', 'Aphidius colemani', 'Trichogramma achaeae', 'Diglyphus isaea'],
    'bot_plant_oils': ['زيت النيم', 'بريف إيه إم', 'زيت التيكنو أوي', 'زيت ريبيماج'],
    'bot_extracts': ['أويكوس', 'نمبيسيدين', 'خل الخشب', 'اكسيلان', 'فليجرين', 'هيلوتروم', 'EQUISTUN', 'URTIQAS', 'MUFFLY',
                     'بروديك', 'فاكسيميت', 'تاجليس', 'سيف بلانت', 'نيما زيرو', 'سافيور', 'نيماكيل'],
    'bot_soaps_salts': ['صابون البوتاسيوم', 'الديترجنت الزراعي المتعادل'],
    'min_sulfur': ['هيليوسوفر', 'الكبريت النانو', 'الكبريت السائل', 'كبريت ميكروني', 'سوريل زراعي كرد'],
    'min_copper': ['بوردو كفارو', 'جلوبر', 'ترافس نحاس', 'باكو بيست', 'كبريتات النحاس'],
    'min_salts': ['بيكربونات البوتاسيوم', 'فوسفات البوتاسيوم'],
    'trap_sticky': ['المصائد الصفراء', 'المصائد الزرقاء', 'المصائد الحمراء', 'المصائد السوداء'],
    'trap_pheromones': ['فيرمونات التوتا', 'فيرمونات دودة ورق القطن'],
    'trap_food_baits': ['بومينال', 'فلاي كاب'],
    'adj_ph_buffer': ['كريبتوم', 'حمض الستريك'],
    'poll_bees': ['Bombus terrestris'],
    'lp_organic_manures': ['سبلة (سماد عضوي)'],
    'lp_soil_amendments': ['جبس زراعي', 'كبريت زراعي ناعم', 'DISPERSAL', 'AQUAPOWER', 'ABSORTIM'],
    'lp_disinfectants': ['برمنجانات البوتاسيوم'],
}

# تصنيفات اجتهادية (المادة الفعالة غير معروفة أو المنتج متعدد الأغراض) — تُطبع في الملخص للمراجعة
UNSURE = {
    'ال كابلانت': 'fert_npk — تركيبه غير معروف؛ سماد من برنامج التسميد',
    'فوسك 50': 'fert_npk — «تغذية ورقية» دون تركيب معلن',
    'بيوارك': 'micro_antagonists — مبيد فطري حيوي بلا مادة فعالة معلنة',
    'بايو-دوكون': 'micro_antagonists — مبيد فطري حيوي بلا مادة فعالة معلنة',
    'بيوكونترول': 'micro_antagonists — فطريات التربة؛ يُرجَّح تريكودرما',
    'بيوزيد': 'micro_antagonists — يُرجَّح تريكودرما',
    'بيوسكت': 'micro_ento_fungi — مرتبط كخيار «حيوي» ضد الماصة والعنكبوت؛ المادة غير معلنة',
    'تارسوس': 'micro_ento_fungi — مرتبط كخيار «حيوي» ضد الماصة والعنكبوت؛ المادة غير معلنة',
    'بيوتكت': 'micro_ento_bacteria — يستهدف اليرقات كمنتجات Bt',
    'تريسر': 'micro_ento_bacteria — سبينوساد (ناتج تخمر بكتيري، IRAC 5)؛ بديله chem_insecticides',
    'زيت ريبيماج': 'bot_plant_oils — نوع الزيت (نباتي/معدني) غير معلن',
    'خل الخشب': 'bot_extracts — مستخلص نباتي يُستخدم أثناء الموسم؛ بديله lp_disinfectants',
    'اكسيلان': 'bot_extracts — «مصل نباتي» غير معلن التركيب',
    'فليجرين': 'bot_extracts — مبيد فطري طبيعي غير معلن التركيب',
    'هيلوتروم': 'bot_extracts — مبيد فطري طبيعي غير معلن التركيب',
    'MUFFLY': 'bot_extracts — مبيد حشري طبيعي مع زنك ومنجنيز',
    'بروديك': 'bot_extracts — مركب طبيعي غير معلن التركيب',
    'فاكسيميت': 'bot_extracts — مركب عضوي غير معلن التركيب',
    'سيف بلانت': 'bot_extracts — نيماتودي طبيعي غير معلن التركيب',
    'نيما زيرو': 'bot_extracts — نيماتودي طبيعي غير معلن التركيب',
    'سافيور': 'bot_extracts — نيماتودي طبيعي غير معلن التركيب',
    'نيماكيل': 'bot_extracts — نيماتودي طبيعي غير معلن التركيب',
    'تاجليس': 'bot_extracts — نيماتودي طبيعي (يُرجَّح مستخلص طاجيتس)',
    'سوريل زراعي كرد': 'min_sulfur — مسحوق تعفير فطري/حشري/أكاروسي (يُرجَّح كبريت)',
    'سيليكات البوتاسيوم': 'bs_silicon — بديله min_salts (واقٍ)',
    'سيليكات الماغنسيوم': 'bs_silicon — بديله min_salts (واقٍ)',
    'فوسفات البوتاسيوم': 'min_salts — مبيد فطري طبيعي؛ قد يكون فوسفات أو فوسفيت',
    'نيوسترين': 'bs_complex — يحسن محتوى الكالسيوم؛ بديله fert_secondary',
    'CRIPTHUM New': 'bs_humic — «تحسين بنية التربة وتغذيتها»',
    'سبلة (سماد عضوي)': 'lp_organic_manures — السماد العضوي للخدمة',
}

# ═════════════════════════════════════════════════════════════════════
# 4) منتجات عامة جديدة (بدون جرعات ولا فترات أمان)
#    (الاسم، التصنيف الفرعي، النوع أو None = الافتراضي، حيوي أو None = الافتراضي، المادة الفعالة، MOA، الاستهداف/الاستخدام، النوع العلمي، وحدة الجرعة)
# ═════════════════════════════════════════════════════════════════════
NEW = []
def n(name, cat, ptype=None, bio=None, ai=None, moa=None, targets=None, species=None, unit=None):
    NEW.append(dict(name=name, cat=cat, ptype=ptype, bio=bio, ai=ai, moa=moa, targets=targets, species=species, unit=unit))

# ── الأسمدة النيتروجينية ──
n('سلفات النشادر 20.6%', 'fert_nitrogen', ai='كبريتات الأمونيوم', targets='نيتروجين أمونيومي + كبريت؛ ذو تأثير حامضي على التربة')
# ── الفوسفاتية ──
n('فوسفات ثنائي الأمونيوم (DAP) 18-46-0', 'fert_phosphate', ai='فوسفات ثنائي الأمونيوم', targets='سماد أساسي فوسفاتي للتربة')
n('يوريا فوسفات 17-44-0', 'fert_phosphate', ai='يوريا فوسفات', targets='فوسفور ونيتروجين ذائب حامضي؛ يساعد على منع انسداد النقاطات')
n('سوبر فوسفات ثلاثي 46%', 'fert_phosphate', targets='سماد أساسي فوسفاتي مركز للتربة')
# ── البوتاسية ──
n('كلوريد البوتاسيوم (MOP) 0-0-60', 'fert_potassium', ai='كلوريد البوتاسيوم', targets='مصدر بوتاسيوم؛ يُتجنب مع ارتفاع الكلوريد في مياه الري أو حساسية المحصول')
# ── الثانوية ──
n('كلوريد الكالسيوم', 'fert_secondary', ai='كلوريد الكالسيوم', targets='كالسيوم ورقي سريع لعلاج نقص الكالسيوم في الثمار')
n('كالسيوم مخلبي EDTA', 'fert_secondary', targets='كالسيوم مخلبي للرش والتسميد')
# ── الصغرى ──
n('حديد مخلبي EDDHA', 'fert_micro', targets='حديد ثابت في الأراضي والمياه القلوية (pH مرتفع)')
n('حديد مخلبي DTPA', 'fert_micro', targets='حديد للمحاليل المغذية والبيئات الصناعية حتى pH متوسط')
n('حمض البوريك', 'fert_micro', ai='حمض البوريك', targets='مصدر بورون ذائب للرش والتسميد')
n('موليبدات الصوديوم', 'fert_micro', ai='موليبدات الصوديوم', targets='مصدر موليبدنم')
n('نحاس مخلبي EDTA', 'fert_micro', targets='نحاس كعنصر غذائي صغرى')
n('مخلوط عناصر صغرى مخلبية', 'fert_micro', targets='خليط حديد ومنجنيز وزنك ونحاس وبورون وموليبدنم')
# ── المركبة NPK ──
for g, use in [('20-20-20', 'متوازن للنمو الخضري'), ('18-18-18', 'متوازن للنمو الخضري'),
               ('30-10-10', 'عالي النيتروجين للنمو الخضري'), ('10-52-10', 'عالي الفوسفور للتجذير وبداية الإزهار'),
               ('13-40-13', 'عالي الفوسفور للتجذير والإزهار'), ('15-30-15', 'عالي الفوسفور للإزهار والعقد'),
               ('15-15-30', 'عالي البوتاسيوم لمرحلة الإثمار'), ('12-12-36', 'عالي البوتاسيوم لنمو الثمار وتلوينها')]:
    n(f'سماد مركب {g}', 'fert_npk', targets=f'سماد ذائب {use}')
# ── الأحماض ومعدلات pH ──
n('هيدروكسيد البوتاسيوم', 'fert_acids', ai='هيدروكسيد البوتاسيوم', targets='رفع pH المحلول المغذي ومياه الري')
# ── الأسمدة العضوية السائلة: لا جديد ──
# ── المنشطات ──
n('أحماض أمينية حرة', 'bs_amino', ai='أحماض أمينية', targets='تنشيط النمو وتقليل أثر الإجهاد')
n('هيومات البوتاسيوم', 'bs_humic', ai='هيومات البوتاسيوم', targets='تحسين خواص التربة وتنشيط الجذور وإتاحة العناصر')
n('مستخلص طحالب بحرية (أسكوفيلم نودوسوم)', 'bs_seaweed', ai='مستخلص Ascophyllum nodosum', targets='تنشيط النمو وتحمل الإجهاد وتحسين العقد')
n('حمض أورثوسيليسيك مثبت', 'bs_silicon', ai='حمض أورثوسيليسيك', targets='سيليكون سريع الامتصاص لتقوية الأنسجة')
n('شيتوزان', 'bs_complex', ai='شيتوزان', targets='محفز لدفاعات النبات')
# ── منظمات النمو ──
n('حمض الجبريليك (GA3)', 'pgr', ai='حمض الجبريليك', targets='منظم نمو: استطالة وعقد')
n('نفثالين حمض الخليك (NAA)', 'pgr', ai='نفثالين حمض الخليك', targets='أوكسين: تجذير وعقد')
n('إندول حمض البيوتيريك (IBA)', 'pgr', ai='إندول حمض البيوتيريك', targets='أوكسين: تجذير العقل والشتلات')
n('حمض كلوروفينوكسي الخليك (4-CPA)', 'pgr', ai='حمض 4-كلوروفينوكسي الخليك', targets='أوكسين: تحسين عقد ثمار الطماطم في الظروف غير الملائمة')
n('إيثيفون', 'pgr', ai='إيثيفون', targets='مطلق للإيثيلين: تسريع النضج والتلوين')
n('بنزيل أدينين (سيتوكينين)', 'pgr', ai='6-بنزيل أدينين', targets='سيتوكينين: انقسام الخلايا وتنشيط النموات')
# ── المخصبات الحيوية ──
n('نتروبين', 'biofert_n', targets='مخصب حيوي مصري مثبت للنيتروجين الجوي')
n('أزوتوباكتر (Azotobacter chroococcum)', 'biofert_n', ai='Azotobacter chroococcum', targets='تثبيت النيتروجين الجوي لا تكافليًا')
n('أزوسبيريلم (Azospirillum brasilense)', 'biofert_n', ai='Azospirillum brasilense', targets='تثبيت النيتروجين وتنشيط الجذور')
n('فوسفورين', 'biofert_pk', targets='مخصب حيوي مصري مذيب للفوسفات')
n('باسيلس ميجاتيريوم (Bacillus megaterium)', 'biofert_pk', ai='Bacillus megaterium', targets='إذابة الفوسفات المثبت في التربة')
n('بكتيريا محررة للبوتاسيوم (Bacillus circulans)', 'biofert_pk', ai='Bacillus circulans', targets='تحرير البوتاسيوم من معادن التربة')
n('ميكوريزا (Rhizophagus irregularis)', 'biofert_myco', ai='Rhizophagus irregularis (Glomus intraradices)', targets='توسيع المجموع الجذري وزيادة امتصاص الفوسفور والماء')
# ── الفطريات الممرضة للحشرات ──
n('بيوفيريا باسيانا (Beauveria bassiana)', 'micro_ento_fungi', ai='Beauveria bassiana', targets='الذبابة البيضاء، التربس، المن')
n('ميتاريزيوم أنيسوبلي (Metarhizium anisopliae)', 'micro_ento_fungi', ai='Metarhizium anisopliae', targets='حشرات التربة وعذارى التربس')
n('ليكانيسيليوم ليكاني (Lecanicillium lecanii)', 'micro_ento_fungi', ai='Lecanicillium lecanii', targets='الذبابة البيضاء، المن')
n('إيزاريا فيوموزوروزيا (Cordyceps fumosorosea)', 'micro_ento_fungi', ai='Cordyceps (Isaria) fumosorosea', targets='الذبابة البيضاء')
# ── البكتيريا الممرضة للحشرات ──
n('باسيلس ثورينجينسيس كورستاكي (Bt)', 'micro_ento_bacteria', ai='Bacillus thuringiensis subsp. kurstaki', moa='11A', targets='يرقات حرشفية الأجنحة: التوتا، دودة ورق القطن، دودة اللوز')
n('باسيلس ثورينجينسيس أيزاواي (Bt)', 'micro_ento_bacteria', ai='Bacillus thuringiensis subsp. aizawai', moa='11A', targets='يرقات حرشفية الأجنحة وخاصة الدودة الخضراء وأنواع سبودوبترا')
# ── النيماتودا والفيروسات الممرضة للحشرات ──
n('نيماتودا ستاينرنيما فلتيا (Steinernema feltiae)', 'micro_ento_nematodes_viruses', 'biocontrol_agent', species='Steinernema feltiae', unit='individuals_per_m2',
  targets='عذارى التربس في التربة، يرقات ذباب الفطر (السياريد)')
n('نيماتودا هيتيرورابديتس (Heterorhabditis bacteriophora)', 'micro_ento_nematodes_viruses', 'biocontrol_agent', species='Heterorhabditis bacteriophora', unit='individuals_per_m2',
  targets='يرقات الخنافس وحشرات التربة')
n('فيروس البوليهيدروزس النووي لدودة اللوز (HearNPV)', 'micro_ento_nematodes_viruses', ai='Helicoverpa armigera nucleopolyhedrovirus', targets='يرقات دودة اللوز الأمريكية')
n('فيروس البوليهيدروزس النووي لدودة ورق القطن (SpliNPV)', 'micro_ento_nematodes_viruses', ai='Spodoptera littoralis nucleopolyhedrovirus', targets='يرقات دودة ورق القطن')
# ── مضادات الأمراض ──
n('تريكودرما هارزيانوم (Trichoderma harzianum)', 'micro_antagonists', ai='Trichoderma harzianum', targets='فطريات التربة: أعفان الجذور، موت البادرات، الذبول')
n('تريكودرما أسبيريلم (Trichoderma asperellum)', 'micro_antagonists', ai='Trichoderma asperellum', targets='فطريات التربة: أعفان الجذور، الذبول')
n('باسيلس ساتلس (Bacillus subtilis)', 'micro_antagonists', ai='Bacillus subtilis', moa='BM02', targets='أمراض المجموع الخضري والجذري')
n('باسيلس أميلوليكويفاشينس (Bacillus amyloliquefaciens)', 'micro_antagonists', ai='Bacillus amyloliquefaciens', moa='BM02', targets='العفن الرمادي والبياض وأمراض الجذور')
n('سودوموناس فلورسنس (Pseudomonas fluorescens)', 'micro_antagonists', ai='Pseudomonas fluorescens', targets='أمراض الجذور والتربة')
# ── مضادات النيماتودا ──
n('باسيلس فيرمس (Bacillus firmus)', 'micro_nematode_antagonists', ai='Bacillus firmus', targets='النيماتودا')
n('بوكونيا كلاميدوسبوريا (Pochonia chlamydosporia)', 'micro_nematode_antagonists', ai='Pochonia chlamydosporia', targets='بيض نيماتودا تعقد الجذور')
n('بربيوروسيليوم ليلاسينوم (Purpureocillium lilacinum)', 'micro_nematode_antagonists', ai='Purpureocillium lilacinum', targets='بيض ويرقات النيماتودا')
# ── الأكاروسات المفترسة ──
for sp, t in [('Neoseiulus californicus', 'أكاروس مفترس — العنكبوت الأحمر (يتحمل الحرارة والجفاف)'),
              ('Neoseiulus cucumeris', 'أكاروس مفترس — التربس والأكاروس العريض'),
              ('Amblyseius andersoni', 'أكاروس مفترس — العنكبوت الأحمر وأكاروس الصدأ'),
              ('Transeius montdorensis', 'أكاروس مفترس — التربس والذبابة البيضاء'),
              ('Stratiolaelaps scimitus', 'أكاروس مفترس أرضي — عذارى التربس ويرقات ذباب الفطر')]:
    n(sp, 'ne_predatory_mites', species=sp, unit='individuals_per_m2', targets=t)
# ── الحشرات المفترسة ──
for sp, t in [('Orius albidipennis', 'بقة مفترسة محلية — التربس'),
              ('Aphidoletes aphidimyza', 'هاموش مفترس — المن'),
              ('Feltiella acarisuga', 'هاموش مفترس — العنكبوت الأحمر'),
              ('Cryptolaemus montrouzieri', 'خنفساء مفترسة — البق الدقيقي'),
              ('Adalia bipunctata', 'أبو العيد ذو النقطتين — المن')]:
    n(sp, 'ne_predatory_insects', species=sp, unit='individuals_per_m2', targets=t)
# ── المتطفلات ──
for sp, t in [('Eretmocerus mundus', 'متطفل — ذبابة التبغ البيضاء Bemisia tabaci'),
              ('Aphidius ervi', 'متطفل — المن كبير الحجم'),
              ('Aphelinus abdominalis', 'متطفل — المن'),
              ('Dacnusa sibirica', 'متطفل — صانعات الأنفاق'),
              ('Anagyrus vladimiri', 'متطفل — البق الدقيقي'),
              ('Trichogramma evanescens', 'متطفل بيض — حرشفية الأجنحة')]:
    n(sp, 'ne_parasitoids', species=sp, unit='individuals_per_m2', targets=t)
# ── الملقحات ──
n('خلايا نحل العسل (Apis mellifera)', 'poll_bees', species='Apis mellifera', unit='hives', targets='تلقيح القرعيات في الحقل المكشوف والأنفاق')
# ── الزيوت النباتية ──
n('زيت الثوم', 'bot_plant_oils', ai='زيت الثوم', targets='طارد ومبيد بالملامسة للحشرات الرخوة')
n('زيت القرنفل', 'bot_plant_oils', ai='زيت القرنفل (يوجينول)', targets='زيت عطري طارد بالملامسة للحشرات والعناكب')
n('زيت القرفة', 'bot_plant_oils', ai='زيت القرفة', targets='زيت عطري طارد بالملامسة للحشرات والعناكب')
n('زيت البرتقال (د-ليمونين)', 'bot_plant_oils', ai='زيت البرتقال (د-ليمونين)', targets='بالملامسة على الحشرات الرخوة والعناكب والبياض الدقيقي')
n('زيت الخروع', 'bot_plant_oils', ai='زيت الخروع', targets='زيت نباتي طارد')
n('زيت الجوجوبا', 'bot_plant_oils', ai='زيت الجوجوبا', targets='زيت نباتي بالملامسة على الحشرات الرخوة والبياض الدقيقي')
n('زيت بذرة القطن', 'bot_plant_oils', ai='زيت بذرة القطن', targets='زيت نباتي بالملامسة على الحشرات الرخوة')
n('زيت الكانولا', 'bot_plant_oils', ai='زيت الكانولا', targets='زيت نباتي بالملامسة على الحشرات الرخوة والعناكب')
n('زيت شجرة الشاي', 'bot_plant_oils', 'fungicide', ai='زيت شجرة الشاي', targets='أمراض فطرية ورقية: البياض الدقيقي والعفن الرمادي')
n('زيت الزعتر (ثيمول)', 'bot_plant_oils', 'fungicide', ai='زيت الزعتر (ثيمول)', targets='زيت عطري مضاد للفطريات')
# ── الزيوت المعدنية ──
n('زيت معدني صيفي (بارافيني)', 'bot_mineral_oils', ai='زيت بارافيني (معدني)', targets='الحشرات القشرية والبق الدقيقي والذبابة البيضاء والعناكب بالملامسة')
n('زيت KZ (كيه زد)', 'bot_mineral_oils', targets='زيت معدني: الحشرات القشرية والبق الدقيقي')
n('سوبر مصرونا', 'bot_mineral_oils', targets='زيت معدني: الحشرات القشرية والبق الدقيقي')
# ── المستخلصات النباتية ──
n('مستخلص الثوم', 'bot_extracts', ai='مستخلص الثوم', targets='طارد للحشرات ومساعد في مكافحة النيماتودا')
n('مستخلص الفلفل الحار (كابسيسين)', 'bot_extracts', ai='كابسيسين', targets='طارد للحشرات الماصة')
n('بيرثرين طبيعي (مستخلص البيرثرم)', 'bot_extracts', ai='بيرثرينات طبيعية', moa='3A', targets='بالملامسة السريعة على الحشرات الرخوة والتربس')
n('أزاديراختين (مستخلص بذور النيم)', 'bot_extracts', ai='أزاديراختين', moa='UN', targets='منظم نمو حشري ومانع تغذية: الذبابة البيضاء، المن، التربس، صانعات الأنفاق')
n('مستخلص الكيلايا (سابونينات)', 'bot_extracts', 'nematicide', ai='سابونينات Quillaja saponaria', targets='النيماتودا')
# ── الكبريت ──
n('كبريت قابل للبلل (WP/WG)', 'min_sulfur', ai='كبريت', moa='M02', targets='البياض الدقيقي والأكاروسات')
n('كبريت تعفير (زهر الكبريت)', 'min_sulfur', ai='كبريت', moa='M02', targets='تعفير ضد البياض الدقيقي والأكاروسات')
# ── النحاس ──
n('هيدروكسيد النحاس', 'min_copper', ai='هيدروكسيد النحاس', moa='M01', targets='وقائي: البياض الزغبي، الندوات، الأمراض البكتيرية')
n('أوكسي كلوريد النحاس', 'min_copper', ai='أوكسي كلوريد النحاس', moa='M01', targets='وقائي: البياض الزغبي، الندوات، الأمراض البكتيرية')
n('مخلوط بوردو', 'min_copper', ai='كبريتات النحاس + الجير', moa='M01', targets='وقائي: البياض الزغبي والندوات')
# ── الأملاح الواقية ──
n('بيكربونات الصوديوم', 'min_salts', ai='بيكربونات الصوديوم', targets='البياض الدقيقي بالملامسة')
n('فوسفيت البوتاسيوم', 'min_salts', bio=False, ai='فوسفيت البوتاسيوم', moa='P07', targets='البياض الزغبي وأعفان الجذور؛ محفز لدفاعات النبات')
# ── الأغشية المعدنية ──
n('طين الكاولين', 'min_particle_films', ai='كاولين', targets='غشاء واقٍ من لسعة الشمس والحشرات')
n('تراب دياتومي', 'min_particle_films', ai='تراب دياتومي', targets='مسحوق خامل للحشرات الزاحفة وحشرات التربة')
# ── المصائد ──
n('لفائف لاصقة صفراء (رول)', 'trap_sticky', targets='اصطياد جماعي: الذبابة البيضاء، المن المجنح، صانعات الأنفاق')
n('لفائف لاصقة زرقاء (رول)', 'trap_sticky', targets='اصطياد جماعي: التربس')
n('فيرمون دودة اللوز الأمريكية (Helicoverpa armigera)', 'trap_pheromones', targets='رصد ذكور دودة اللوز الأمريكية')
n('فيرمون دودة الحشد الخريفية (Spodoptera frugiperda)', 'trap_pheromones', targets='رصد ذكور دودة الحشد الخريفية')
n('فيرمون الدودة القارضة (Agrotis ipsilon)', 'trap_pheromones', targets='رصد ذكور الدودة القارضة')
n('فيرمون فراشة درنات البطاطس (Phthorimaea operculella)', 'trap_pheromones', targets='رصد ذكور فراشة درنات البطاطس')
n('جاذب ميثيل يوجينول (ذبابة الخوخ)', 'trap_pheromones', ai='ميثيل يوجينول', targets='جذب ذكور ذبابة الخوخ Bactrocera zonata')
n('جاذب ترايميدلور (ذبابة فاكهة البحر المتوسط)', 'trap_pheromones', ai='ترايميدلور', targets='جذب ذكور ذبابة فاكهة البحر المتوسط Ceratitis capitata')
n('طعم بروتيني متحلل (ذباب الفاكهة)', 'trap_food_baits', targets='جذب إناث وذكور ذباب الفاكهة في المصائد أو رش الطعوم')
n('مصيدة دلتا', 'trap_devices', targets='هيكل مصيدة لاصقة للفيرمونات')
n('مصيدة مائية (حوض ماء)', 'trap_devices', targets='اصطياد جماعي للتوتا بالفيرمون فوق حوض ماء')
n('مصيدة قمعية (Funnel)', 'trap_devices', targets='هيكل مصيدة للفيرمونات لحرشفية الأجنحة')
n('مصيدة ماكفيل (McPhail)', 'trap_devices', targets='مصيدة ذباب الفاكهة بالطعوم والجواذب')
n('مصيدة ضوئية', 'trap_devices', targets='اصطياد الفراشات الليلية ومنها التوتا')
# ── المواد المساعدة ──
n('مادة ناشرة غير أيونية', 'adj_spreader_sticker', targets='خفض التوتر السطحي وانتظام تغطية الرش')
n('مادة ناشرة سيليكونية (Organosilicone)', 'adj_spreader_sticker', targets='انتشار فائق للرش وتغطية السطح السفلي للأوراق')
n('مادة لاصقة (Sticker)', 'adj_spreader_sticker', targets='تثبيت المبيد على السطح ومقاومة الغسيل')
n('منظم حموضة محلول الرش (Buffer)', 'adj_ph_buffer', targets='خفض وتثبيت pH محلول الرش ومعادلة عسر الماء')
n('مضاد رغوة', 'adj_antifoam', targets='منع تكون الرغوة في خزان الرش')
# ── الأسمدة العضوية ──
n('سماد بلدي متحلل', 'lp_organic_manures', targets='سماد عضوي للخدمة قبل الزراعة')
n('كمبوست', 'lp_organic_manures', targets='سماد عضوي متحلل لتحسين خواص التربة')
n('سماد دواجن متحلل', 'lp_organic_manures', targets='سماد عضوي غني بالنيتروجين؛ يُستخدم متحللًا تمامًا')
n('فيرمي كمبوست (سماد الديدان)', 'lp_organic_manures', targets='سماد عضوي ناعم غني بالنشاط الحيوي')
# ── محسنات التربة ──
n('بنتونيت', 'lp_soil_amendments', ai='بنتونيت', targets='رفع قدرة الأراضي الرملية على الاحتفاظ بالماء والعناصر')
n('زيوليت', 'lp_soil_amendments', ai='زيوليت', targets='رفع السعة التبادلية والاحتفاظ بالماء والأمونيوم')
n('بوليمر حافظ للماء (هيدروجيل)', 'lp_soil_amendments', targets='الاحتفاظ بالماء في الأراضي الخفيفة')
n('فحم حيوي (بيوتشار)', 'lp_soil_amendments', targets='تحسين بناء التربة والاحتفاظ بالماء')
# ── بيئات الزراعة ──
n('بيتموس', 'lp_growing_media', targets='بيئة إنبات الشتلات وخلطات البيئة')
n('بيرلايت', 'lp_growing_media', targets='تحسين التهوية والصرف في البيئة')
n('فيرميكوليت', 'lp_growing_media', targets='الاحتفاظ بالماء وتغطية البذور')
n('كوكوبيت (ألياف جوز الهند)', 'lp_growing_media', targets='بيئة زراعة بدون تربة (أكياس/ألواح)')
n('صوف صخري (ألواح ومكعبات)', 'lp_growing_media', targets='بيئة زراعة بدون تربة')
n('طف بركاني (حجر بركاني)', 'lp_growing_media', targets='بيئة زراعة بدون تربة قابلة لإعادة الاستخدام بعد الغسيل والتعقيم')
# ── المطهرات ──
n('بيروكسيد الهيدروجين مع الفضة', 'lp_disinfectants', ai='بيروكسيد الهيدروجين + فضة', targets='تعقيم البيئة وشبكة الري والصوبة بين العروات')
n('هيبوكلوريت الصوديوم (كلور)', 'lp_disinfectants', ai='هيبوكلوريت الصوديوم', targets='تطهير الأسطح والأدوات وشبكة الري')
n('مركبات الأمونيوم الرباعية', 'lp_disinfectants', ai='مركبات الأمونيوم الرباعية', targets='تطهير هيكل الصوبة والأرضيات والأدوات')
n('حمض البيروكسي أسيتيك', 'lp_disinfectants', ai='حمض البيروكسي أسيتيك', targets='تطهير الأسطح والأدوات وشبكة الري')
n('بيروكسي مونوسلفات البوتاسيوم', 'lp_disinfectants', ai='بيروكسي مونوسلفات البوتاسيوم', targets='تطهير الأيدي والأدوات والأحذية (مهم ضد فيروس ToBRFV)')
# ── مستلزمات الري ──
n('خراطيم تنقيط (GR)', 'lp_irrigation_supplies', targets='خطوط تنقيط بنقاطات مدمجة')
n('شرائط تنقيط (Drip tape)', 'lp_irrigation_supplies', targets='خطوط تنقيط رقيقة لموسم واحد')
n('نقاطات وأسهم تنقيط', 'lp_irrigation_supplies', targets='تنقيط لأكياس ومراقد البيئة')
n('خراطيم PE رئيسية وفرعية', 'lp_irrigation_supplies', targets='خطوط التوزيع في شبكة الري')
n('فلاتر الري (شبكية/ديسك)', 'lp_irrigation_supplies', targets='ترشيح مياه الري لمنع انسداد النقاطات')
# ── الأغطية والشبك ──
n('ملش بلاستيك (أسود/فضي)', 'lp_covers', targets='تغطية المصاطب لمنع الحشائش وحفظ الرطوبة')
n('بلاستيك شفاف للتعقيم الشمسي', 'lp_covers', targets='تغطية التربة الرطبة في التعقيم الشمسي')
n('بلاستيك تغطية الصوب (UV)', 'lp_covers', targets='الغطاء البلاستيكي لهيكل الصوبة')
n('شبك مانع للحشرات (50 مش)', 'lp_covers', targets='تغطية فتحات التهوية ضد الذبابة البيضاء والتربس')
n('شبك تظليل', 'lp_covers', targets='خفض الإشعاع والحرارة')
n('غطاء أرضية (جراوند كفر)', 'lp_covers', targets='تغطية أرضية الصوبة في الزراعة بدون تربة')
# ── التربية والتدعيم ──
n('دوبار التربيط (بولي بروبيلين)', 'lp_support_supplies', targets='تربيط ولف النباتات')
n('سلك الدعامات المجلفن', 'lp_support_supplies', targets='السلك الحامل للنباتات')
n('كلبسات وحلقات التربيط', 'lp_support_supplies', targets='تثبيت الساق على الدوبار')
n('خطافات وبكرات التنزيل', 'lp_support_supplies', targets='تنزيل النباتات (Layering)')
n('أكياس الزراعة (جرو باج)', 'lp_support_supplies', targets='أكياس تعبئة البيئة')

# أسماء جديدة تشترك في «المفتاح الواسع» مع منتج موجود لكنها منتج مختلف فعلًا (نوع المخلب مختلف)
ALLOW_DISTINCT = {
    ('حديد مخلبي EDDHA', 'حديد مخلبي'),
    ('حديد مخلبي DTPA', 'حديد مخلبي'),
    ('حديد مخلبي DTPA', 'حديد مخلبي EDDHA'),
    ('باسيلس ثورينجينسيس أيزاواي (Bt)', 'باسيلس ثورينجينسيس كورستاكي (Bt)'),
}

# ═════════════════════════════════════════════════════════════════════
# 5) عمليات خدمة الأرض وتجهيزها (category = land_preparation)
#    الترتيب 0–19 قبل «الشتل» (20) حسب تسلسل التنفيذ في الموقع.
# ═════════════════════════════════════════════════════════════════════
OPS_MOVE = {  # عمليات موجودة في 002 تُنقل لفئة land_preparation مع ترتيب جديد
    'greenhouse_disinfect': 0, 'soil_prep': 11, 'substrate_sterilize': 13, 'irrigation_setup': 16,
}
OPS_EXISTING = {'soil_prep', 'substrate_sterilize', 'greenhouse_disinfect', 'irrigation_setup', 'planting', 'stringing',
                'side_shoots', 'deleafing', 'lowering', 'truss_pruning', 'topping', 'hive_placement', 'sticky_traps',
                'crop_hygiene', 'cover_maintenance', 'harvest'}
OPS_NEW = [
    ('cover_net_installation', 'تركيب/تغيير الغطاء البلاستيكي والشبك', 'Cover & insect-net installation / replacement', 1),
    ('plowing', 'الحرث', 'Ploughing', 2),
    ('harrowing', 'التنعيم والتزحيف', 'Harrowing & clod breaking', 3),
    ('laser_leveling', 'التسوية بالليزر', 'Laser levelling', 4),
    ('manure_amendments', 'إضافة السماد البلدي والمحسنات', 'Manure & soil-amendment application', 5),
    ('soil_mixing', 'خلط وتقليب التربة', 'Soil mixing / rotavating', 6),
    ('soil_leaching', 'غسيل التربة من الأملاح', 'Soil salt leaching', 7),
    ('soil_solarization', 'التعقيم الشمسي للتربة', 'Soil solarization', 8),
    ('soil_fumigation', 'التعقيم الكيماوي أو البخاري للتربة', 'Chemical / steam soil sterilization', 9),
    ('bed_forming', 'التخطيط وعمل المصاطب والخطوط', 'Bed / row forming', 10),
    ('substrate_washing', 'غسيل البيئة من الأملاح بين العروات', 'Substrate washing between cycles', 12),
    ('substrate_filling', 'تجهيز وتعبئة البيئة (أكياس/مراقد)', 'Substrate bag / bed filling', 14),
    ('drip_laying', 'فرد خراطيم التنقيط واختبار الشبكة', 'Drip-line laying & network testing', 15),
    ('mulch_laying', 'فرد الملش', 'Mulch laying', 17),
    ('trellis_installation', 'تركيب الدعامات والأسلاك', 'Trellis posts & wire installation', 18),
    ('pre_plant_irrigation', 'رية التجهيز وتشبيع البيئة قبل الشتل', 'Pre-plant irrigation / substrate saturation', 19),
]


# ═════════════════════════════════════════════════════════════════════
# أدوات
# ═════════════════════════════════════════════════════════════════════
def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


_TASHKEEL = re.compile(r'[ؐ-ًؚ-ٰٟـ]')

def norm(s):
    """تطبيع صارم للمقارنة: حذف المسافات والتشكيل وتوحيد الألف والياء والتاء المربوطة."""
    s = _TASHKEEL.sub('', s).casefold()
    s = re.sub('[أإآٱ]', 'ا', s).replace('ى', 'ي').replace('ة', 'ه')
    return re.sub(r'\s+', '', s)

_SYN = [('كبريتات', 'سلفات'), ('نشادر', 'امونيوم'), ('مغنيسيوم', 'ماغنسيوم'), ('ماغنيسيوم', 'ماغنسيوم'),
        ('مغنسيوم', 'ماغنسيوم'), ('فيرمونات', 'فيرمون'), ('مصائد', 'مصيده')]
_GRADE = re.compile(r'\d+(?:\.\d+)?-\d+(?:\.\d+)?-\d+(?:\.\d+)?')

def loose(s):
    """مفتاح واسع لاكتشاف التكرار المعنوي: بدون أقواس ولاتيني وأرقام و«ال» التعريف ومع توحيد المرادفات."""
    t = re.sub(r'\([^)]*\)', ' ', s)
    t = re.sub(r'[A-Za-z0-9%.+\-/]', ' ', t)
    t = _TASHKEEL.sub('', t)
    t = re.sub('[أإآٱ]', 'ا', t).replace('ى', 'ي').replace('ة', 'ه')
    words = [w[2:] if w.startswith('ال') and len(w) > 4 else w for w in t.split()]
    t = ''.join(words)
    for a, b in _SYN:
        t = t.replace(a, b)
    return t

def same_product(a, b):
    """True إذا كان الاسمان على الأرجح نفس المنتج (يُستثنى اختلاف درجة NPK أو ما في ALLOW_DISTINCT)."""
    if norm(a) == norm(b):
        return True
    if not loose(a) or loose(a) != loose(b):
        return False
    ga, gb = _GRADE.findall(a), _GRADE.findall(b)
    if ga and gb and ga != gb:
        return False
    return (a, b) not in ALLOW_DISTINCT and (b, a) not in ALLOW_DISTINCT


def validate(existing_names, existing_by_name):
    major_codes = [m[0] for m in MAJORS]
    sub_codes = [s[0] for s in SUBS]
    all_codes = major_codes + sub_codes
    dup = {c for c in all_codes if all_codes.count(c) > 1}
    assert not dup, f'duplicate category codes: {dup}'
    for c in all_codes:
        assert re.fullmatch(r'[a-z][a-z0-9_]*', c), f'bad code {c}'
    majors = {m[0]: m for m in MAJORS}
    for m in MAJORS:
        assert m[3] in DOMAINS, m
    for s in SUBS:
        assert s[1] in majors, f'sub {s[0]} has unknown parent {s[1]}'
        assert s[4] is None or s[4] in PRODUCT_TYPES, s
    subs = {s[0]: s for s in SUBS}

    # تصنيف الموجود: كل منتج في تصنيف واحد بالضبط
    seen = {}
    for cat, names in CLASSIFY.items():
        assert cat in subs, f'CLASSIFY references unknown sub-category {cat}'
        for nm in names:
            assert nm not in seen, f'{nm!r} classified twice: {seen[nm]} & {cat}'
            seen[nm] = cat
    unknown = set(seen) - set(existing_names)
    assert not unknown, f'CLASSIFY names not in existing catalog: {sorted(unknown)}'
    missing = [nm for nm in existing_names if nm not in seen]
    if missing:
        sys.exit('ERROR: existing global products without a category:\n  ' + '\n  '.join(missing))
    for nm in UNSURE:
        assert nm in seen, f'UNSURE lists unclassified {nm}'

    # المنتجات الجديدة
    new_names = [x['name'] for x in NEW]
    for x in NEW:
        assert x['cat'] in subs, f"new product {x['name']} -> unknown category {x['cat']}"
        pt = x['ptype'] or subs[x['cat']][4]
        assert pt in PRODUCT_TYPES, x
        assert x['unit'] is None or x['unit'] in DOSE_UNITS, x
        assert x['moa'] in (None, '11A', 'M01', 'M02', 'BM02', 'P07', '3A', 'UN'), x
    for i, a in enumerate(new_names):
        for b in new_names[i + 1:]:
            assert not same_product(a, b), f'new products duplicate each other: {a!r} ~ {b!r}'
        for b in existing_names:
            assert not same_product(a, b), f'new product duplicates existing: {a!r} ~ {b!r}'

    # العمليات
    codes = [o[0] for o in OPS_NEW]
    assert len(set(codes)) == len(codes), 'duplicate new op codes'
    assert not set(codes) & OPS_EXISTING, f'op codes clash with 002: {set(codes) & OPS_EXISTING}'
    assert set(OPS_MOVE) <= OPS_EXISTING
    for c in codes:
        assert re.fullmatch(r'[a-z][a-z0-9_]*', c), c
    orders = [o[3] for o in OPS_NEW] + list(OPS_MOVE.values())
    assert len(set(orders)) == len(orders) and all(0 <= x < 20 for x in orders), 'land-prep sort orders must be unique and < 20 (before planting)'
    ar_names = [norm(o[1]) for o in OPS_NEW]
    assert len(set(ar_names)) == len(ar_names)
    return seen


def summary(seen, existing_names):
    from collections import Counter
    ex = Counter(seen.values())
    nw = Counter(x['cat'] for x in NEW)
    e = sys.stderr.write
    e('── taxonomy coverage ─────────────────────────────────────\n')
    for m in MAJORS:
        subs = [s for s in SUBS if s[1] == m[0]]
        te = sum(ex[s[0]] for s in subs)
        tn = sum(nw[s[0]] for s in subs)
        e(f'{m[0]} [{m[3]}] {m[1]} — existing {te}, new {tn}\n')
        for s in subs:
            e(f'    {s[0]:<32} {s[2]:<45} existing {ex[s[0]]:>3}  new {nw[s[0]]:>3}\n')
    e(f'existing products classified: {len(seen)}/{len(existing_names)}\n')
    e(f'new products: {len(NEW)}   new operations: {len(OPS_NEW)}   moved operations: {len(OPS_MOVE)}\n')
    e(f'judgement-call classifications: {len(UNSURE)}\n')
    for k, v in UNSURE.items():
        e(f'    ? {k}: {v}\n')


def render():
    out = []
    w = out.append
    w('''-- =====================================================================
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
''')
    w('-- ── 1) التصنيفات الرئيسية ─────────────────────────────────────')
    w('insert into public.product_categories (code, name_ar, name_en, domain, sort_order, notes) values')
    w(',\n'.join(f'  ({q(c)}, {q(a)}, {q(e)}, {q(d)}, {so}, {q(nt)})' for c, a, e, d, so, nt in MAJORS))
    w('on conflict do nothing;')
    w('')
    w('-- ── 2) التصنيفات الفرعية ──────────────────────────────────────')
    w('insert into public.product_categories (parent_id, code, name_ar, name_en, domain, default_product_type, is_bio, sort_order, notes)')
    w('select parent.id, v.code, v.name_ar, v.name_en, parent.domain, v.ptype::public.product_type, v.bio, v.sort_order::smallint, v.notes from (values')
    w(',\n'.join(f'  ({q(p)}, {q(c)}, {q(a)}, {q(e)}, {q(pt)}, {q(b)}, {so}, {q(nt)})' for c, p, a, e, pt, b, so, nt in SUBS))
    w(') as v(parent, code, name_ar, name_en, ptype, bio, sort_order, notes)')
    w('join public.product_categories parent on parent.farm_id is null and parent.parent_id is null and parent.code = v.parent')
    w('on conflict do nothing;')
    w('')
    w('-- ── 3) تصنيف المنتجات العامة الموجودة (مجمّعة حسب التصنيف الفرعي) ──')
    for cat, names in CLASSIFY.items():
        w(f'update public.products p set category_id = c.id from public.product_categories c')
        w(f'  where c.farm_id is null and c.code = {q(cat)} and p.farm_id is null')
        w(f'    and p.name in ({", ".join(q(x) for x in names)});')
    w('')
    w('-- ── 4) المنتجات العامة الجديدة (تُضاف مرة واحدة؛ بلا جرعة ولا فترة أمان) ──')
    subs = {s[0]: s for s in SUBS}
    w('insert into public.products (name, product_type, is_bio, active_ingredient, moa_code, default_dose, default_dose_unit, targets, bio_species, category_id)')
    w('select v.name, v.ptype::public.product_type, v.bio, v.ai, v.moa, null::numeric, v.unit::public.dose_unit, v.targets, v.species, c.id from (values')
    rows = []
    for x in NEW:
        s = subs[x['cat']]
        pt = x['ptype'] or s[4]
        bio = s[5] if x['bio'] is None else x['bio']
        rows.append(f"  ({q(x['name'])}, {q(x['cat'])}, {q(pt)}, {q(bio)}, {q(x['ai'])}, {q(x['moa'])}, {q(x['unit'])}, {q(x['targets'])}, {q(x['species'])})")
    w(',\n'.join(rows))
    w(') as v(name, cat, ptype, bio, ai, moa, unit, targets, species)')
    w('join public.product_categories c on c.farm_id is null and c.code = v.cat')
    w('where not exists (select 1 from public.products x where x.farm_id is null and x.name = v.name);')
    w('')
    w('-- ── 5) عمليات خدمة الأرض وتجهيزها ─────────────────────────────')
    for code, so in OPS_MOVE.items():
        w(f"update public.operation_types set category = 'land_preparation', sort_order = {so} where farm_id is null and code = {q(code)};")
    w('insert into public.operation_types (code, name_ar, name_en, category, sort_order) values')
    w(',\n'.join(f"  ({q(c)}, {q(a)}, {q(e)}, 'land_preparation', {so})" for c, a, e, so in OPS_NEW))
    w('on conflict do nothing;')
    return '\n'.join(out) + '\n'


def main():
    k = load_knowledge()
    seed002 = seeded_002_products()
    assert set(seed002) == set(k.EXISTING_BIO), 'knowledge.EXISTING_BIO and 002 products differ'
    existing = [x['name'] for x in k.P] + [nm for nm in seed002 if nm not in {x['name'] for x in k.P}]
    assert len(existing) == len(set(existing))
    seen = validate(existing, None)
    summary(seen, existing)
    sys.stdout.write(render())


if __name__ == '__main__':
    main()
