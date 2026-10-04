-- =====================================================================
--  Migration 002 — بيانات الكتالوجات العامة (farm_id = null)
--  المبيدات الكيميائية لا تُضاف هنا: تُسجّل لكل مزرعة حسب المسجّل محليًا
--  وفترات الأمان المعتمدة على العبوة.
-- =====================================================================

insert into public.crops (code, name_ar, name_en) values
  ('tomato',     'طماطم',   'Tomato'),
  ('cucumber',   'خيار',    'Cucumber'),
  ('pepper',     'فلفل',    'Sweet pepper'),
  ('eggplant',   'باذنجان', 'Eggplant'),
  ('melon',      'كنتالوب', 'Melon'),
  ('strawberry', 'فراولة',  'Strawberry');

insert into public.pests (code, name_ar, name_en, scientific_name, category, default_count_unit, sort_order) values
  ('whitefly_bt',     'الذبابة البيضاء (ذبابة التبغ)',      'Tobacco whitefly',            'Bemisia tabaci',                    'insect',        'per_leaf',       10),
  ('whitefly_tv',     'ذبابة الصوب البيضاء',                 'Greenhouse whitefly',         'Trialeurodes vaporariorum',         'insect',        'per_leaf',       11),
  ('thrips_wft',      'تربس الأزهار الغربي',                 'Western flower thrips',       'Frankliniella occidentalis',        'insect',        'per_flower',     20),
  ('thrips_tabaci',   'تربس البصل',                          'Onion thrips',                'Thrips tabaci',                     'insect',        'per_leaf',       21),
  ('tuta',            'صانعة أنفاق الطماطم (توتا أبسلوتا)', 'Tomato leafminer',            'Tuta absoluta',                     'insect',        'per_plant',      30),
  ('leafminer',       'صانعة أنفاق الأوراق',                 'Leafminer flies',             'Liriomyza spp.',                    'insect',        'per_leaf',       31),
  ('aphids',          'المن',                                'Aphids',                      'Aphididae',                         'insect',        'per_leaf',       40),
  ('helicoverpa',     'دودة اللوز الأمريكية',                'Cotton bollworm',             'Helicoverpa armigera',              'insect',        'per_plant',      50),
  ('spodoptera',      'دودة ورق القطن',                      'Cotton leafworm',             'Spodoptera littoralis',             'insect',        'per_plant',      51),
  ('spider_mite',     'العنكبوت الأحمر',                     'Two-spotted spider mite',     'Tetranychus urticae',               'mite',          'per_leaf',       60),
  ('russet_mite',     'أكاروس الطماطم الصدئي',               'Tomato russet mite',          'Aculops lycopersici',               'mite',          'presence',       61),
  ('broad_mite',      'الأكاروس العريض',                     'Broad mite',                  'Polyphagotarsonemus latus',         'mite',          'presence',       62),
  ('powdery_mildew',  'البياض الدقيقي',                      'Powdery mildew',              'Leveillula taurica / Oidium spp.',  'fungus',        'percent_plants', 70),
  ('downy_mildew',    'البياض الزغبي',                       'Downy mildew',                'Pseudoperonospora cubensis',        'oomycete',      'percent_plants', 71),
  ('late_blight',     'الندوة المتأخرة',                     'Late blight',                 'Phytophthora infestans',            'oomycete',      'percent_plants', 72),
  ('early_blight',    'الندوة المبكرة',                      'Early blight',                'Alternaria solani',                 'fungus',        'percent_plants', 73),
  ('botrytis',        'العفن الرمادي',                       'Grey mould',                  'Botrytis cinerea',                  'fungus',        'percent_plants', 74),
  ('fusarium_wilt',   'الذبول الفيوزارمي',                   'Fusarium wilt',               'Fusarium oxysporum',                'fungus',        'percent_plants', 75),
  ('tylcv',           'فيروس تجعد واصفرار أوراق الطماطم',    'Tomato yellow leaf curl virus','TYLCV',                            'virus',         'percent_plants', 80),
  ('tobrfv',          'فيروس تبرقش الطماطم البني المجعد',    'Tomato brown rugose fruit virus','ToBRFV',                         'virus',         'percent_plants', 81),
  ('root_knot',       'نيماتودا تعقد الجذور',                'Root-knot nematode',          'Meloidogyne spp.',                  'nematode',      'percent_plants', 90),
  ('blossom_end_rot', 'عفن الطرف الزهري',                    'Blossom-end rot',             null,                                'physiological', 'percent_plants', 95);

insert into public.products (name, product_type, bio_species, default_dose_unit, notes) values
  ('Nesidiocoris tenuis',  'biocontrol_agent', 'Nesidiocoris tenuis',  'individuals_per_m2', 'مفترس — توتا والذبابة البيضاء'),
  ('Macrolophus pygmaeus', 'biocontrol_agent', 'Macrolophus pygmaeus', 'individuals_per_m2', 'مفترس — الذبابة البيضاء والتوتا'),
  ('Amblyseius swirskii',  'biocontrol_agent', 'Amblyseius swirskii',  'individuals_per_m2', 'أكاروس مفترس — الذبابة البيضاء والتربس'),
  ('Phytoseiulus persimilis','biocontrol_agent','Phytoseiulus persimilis','individuals_per_m2','أكاروس مفترس — العنكبوت الأحمر'),
  ('Orius laevigatus',     'biocontrol_agent', 'Orius laevigatus',     'individuals_per_m2', 'بقة مفترسة — التربس'),
  ('Encarsia formosa',     'biocontrol_agent', 'Encarsia formosa',     'individuals_per_m2', 'متطفل — الذبابة البيضاء'),
  ('Eretmocerus eremicus', 'biocontrol_agent', 'Eretmocerus eremicus', 'individuals_per_m2', 'متطفل — الذبابة البيضاء'),
  ('Aphidius colemani',    'biocontrol_agent', 'Aphidius colemani',    'individuals_per_m2', 'متطفل — المن'),
  ('Trichogramma achaeae', 'biocontrol_agent', 'Trichogramma achaeae', 'individuals_per_m2', 'متطفل بيض — توتا'),
  ('Bombus terrestris',    'pollinator',       'Bombus terrestris',    'hives',              'خلايا النحل الطنان للتلقيح');

insert into public.operation_types (code, name_ar, name_en, category, sort_order) values
  ('soil_prep',            'تجهيز التربة / البيئة',              'Soil / substrate preparation', 'establishment',    10),
  ('substrate_sterilize',  'تعقيم البيئة',                       'Substrate sterilization',      'establishment',    11),
  ('greenhouse_disinfect', 'تطهير الصوبة',                       'Greenhouse disinfection',      'hygiene',          12),
  ('irrigation_setup',     'تجهيز/غسيل شبكة الري',               'Irrigation setup / flushing',  'establishment',    13),
  ('planting',             'الشتل',                              'Planting',                     'establishment',    20),
  ('stringing',            'التربيط واللف',                      'Stringing / twisting',         'crop_maintenance', 30),
  ('side_shoots',          'إزالة الفروع الجانبية (السرطانات)',  'Side-shoot removal',           'crop_maintenance', 31),
  ('deleafing',            'التوريق',                            'Deleafing',                    'crop_maintenance', 32),
  ('lowering',             'تنزيل النباتات',                     'Lowering / layering',          'crop_maintenance', 33),
  ('truss_pruning',        'خف العناقيد / الثمار',               'Truss / fruit pruning',        'crop_maintenance', 34),
  ('topping',              'التطويش',                            'Topping',                      'crop_maintenance', 35),
  ('hive_placement',       'وضع خلايا النحل الطنان',             'Bumblebee hive placement',     'pollination',      40),
  ('sticky_traps',         'تعليق المصائد اللاصقة',              'Sticky trap installation',     'hygiene',          50),
  ('crop_hygiene',         'إزالة النباتات المصابة والمخلفات',   'Crop hygiene / removal',       'hygiene',          51),
  ('cover_maintenance',    'صيانة الغطاء والشبك',                'Cover & net maintenance',      'hygiene',          52),
  ('harvest',              'الحصاد',                             'Harvest',                      'harvest',          60);
