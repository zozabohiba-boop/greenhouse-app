# -*- coding: utf-8 -*-
"""
قاعدة المعرفة الزراعية — مصدر البيانات الذي يولّد migration 010.

المصادر:
  1) "ملخص المركبات الحيوية" (PDF) — المبيدات الفطرية والحشرية الحيوية والمخصبات والمفترسات والمصائد.
  2) "موازنة احتياجات محاصيل الخضر لشركة روت 2026–2027" (Excel) — برامج المكافحة والتسميد لكل محصول
     (المادة، التصنيف حيوي/كيميائي، التركيز لكل لتر).

قواعد التعبئة:
  - المادة الفعالة ومجموعة IRAC/FRAC تُكتب فقط عند التأكد منها؛ غير ذلك تُترك فارغة.
  - فترة الأمان (PHI) لا تُملأ أبدًا من هنا: تُؤخذ من ملصق العبوة المسجلة محليًا.
  - "الاستهداف" نص مختصر من المصدر كما هو.

تشغيل:  python3 scripts/knowledge/knowledge.py > supabase/migrations/010_knowledge.sql
"""

# (الاسم، النوع، حيوي/طبيعي؟، المادة الفعالة، MOA، الجرعة، وحدة الجرعة، الاستهداف)
P = []
def p(name, ptype, bio, ai=None, moa=None, dose=None, unit=None, targets=None, species=None):
    P.append(dict(name=name, ptype=ptype, bio=bio, ai=ai, moa=moa, dose=dose, unit=unit, targets=targets, species=species))

# ── 1) مبيدات فطرية حيوية وطبيعية (PDF) ─────────────────────────────
p('سيريناد أسو', 'fungicide', True, 'Bacillus subtilis QST 713', 'BM02', None, None, 'مبيد فطري ورقي ومنشط للجذور: أعفان الثمار، البياض الزغبي، اللطعة الأرجوانية في البصل')
p('بريف إيه إم', 'acaricide', True, None, None, 2.5, 'ml_per_l', 'مركب 3 في 1 (فطري، حشري، أكاروسي): البياض الدقيقي، الذبابة البيضاء، العنكبوت الأحمر')
p('بيوارك', 'fungicide', True, None, None, None, None, 'أعفان الثمار والندوات: البياض الدقيقي، الندوة المبكرة، الندوة المتأخرة')
p('بيوكونترول', 'fungicide', True, None, None, 1.5, 'g_per_l', 'فطريات التربة: القشرة السوداء، أعفان الثمار والجذور، موت البادرات')
p('بيوزيد', 'fungicide', True, None, None, None, None, 'الندوات والتبقعات: البياض الدقيقي، الندوة المتأخرة والمبكرة، التبقع البني')
p('بومينال', 'other', True, None, None, None, None, 'جاذب لذبابة الفاكهة — يُستخدم في المصائد فقط')
p('بايو-دوكون', 'fungicide', True, None, None, None, None, 'البياض الدقيقي')
p('بايوكيور-إف', 'fungicide', True, 'Pseudomonas fluorescens', None, None, None, 'مقاومة شاملة: البياض الزغبي، الندوة المتأخرة، أعفان الجذور، موت البادرات، ذبول الشتلات، الصدأ')
p('بايوكيور-بي', 'fungicide', True, 'Bacillus subtilis', None, None, None, 'الصدأ والتبقعات واللفحة (القمح والأرز ومحاصيل أخرى)')
p('هيليوسوفر', 'fungicide', True, 'كبريت', 'M02', None, None, 'مبيد فطري وقائي وعلاجي: البياض الدقيقي')
p('سوريل زراعي كرد', 'fungicide', True, None, None, None, None, 'مسحوق تعفير فطري وحشري وأكاروسي ووقائي')
p('اكسيلان', 'fungicide', True, None, None, None, None, 'مصل نباتي علاجي ووقائي: البياض الدقيقي والزغبي')
p('إنذار', 'biostimulant', True, None, None, None, None, 'لقاح نباتي ينشط دفاعات النبات ضد آفات الأوراق والثمار')
p('بوردو كفارو', 'fungicide', False, None, None, 2.5, 'g_per_l', 'وقاية من البياض الزغبي، الندوة المتأخرة، الندوة البدرية، لفحة الأزهار، عفن السرة')
p('فليجرين', 'fungicide', True, None, None, None, None, 'البياض الدقيقي وبعض الفطريات السطحية')
p('الكبريت النانو', 'fungicide', True, 'كبريت', 'M02', None, None, 'الأمراض الفطرية والحشرات بدقة أكبر')
p('الكبريت السائل', 'fungicide', True, 'كبريت', 'M02', None, None, 'الأمراض الفطرية بشكل أسرع')
p('كبريت ميكروني', 'fungicide', True, 'كبريت', 'M02', 2.5, 'g_per_l', 'الحشرات والعناكب مثل العنكبوت الأحمر، وبعض الأمراض الفطرية')
p('بيكربونات البوتاسيوم', 'fungicide', True, 'بيكربونات البوتاسيوم', None, None, None, 'سماد ومبيد فطري ومنظم للـ pH: البياض الدقيقي')
p('سيليكات البوتاسيوم', 'biostimulant', True, 'سيليكات البوتاسيوم', None, None, None, 'تعزيز مقاومة النبات للأمراض والحشرات والإجهاد (جفاف، صقيع، ملوحة)')
p('برمنجانات البوتاسيوم', 'other', True, 'برمنجانات البوتاسيوم', None, None, None, 'تعقيم التربة والبذور، يحد من انتشار الأمراض الفطرية')
p('جلوبر', 'fungicide', False, 'مركب نحاسي', 'M01', None, None, 'مركب نحاسي يحفز دفاعات النبات ضد الإصابات الفطرية')
p('هيلوتروم', 'fungicide', True, None, None, None, None, 'العفن الرمادي والألترناريا والصدأ والسكليروتينيا')
p('EQUISTUN', 'fungicide', True, None, None, None, None, 'مكافحة الفطريات الممرضة: البياض الزغبي')
p('سيليكات الماغنسيوم', 'biostimulant', True, 'سيليكات الماغنسيوم', None, None, None, 'تقليل البياض الدقيقي والصدأ وبعض مسببات الذبول وضرر الحشرات الثاقبة الماصة، وتحسين صلابة الأنسجة')
p('فوسفات البوتاسيوم', 'fungicide', True, None, None, None, None, 'مبيد فطري طبيعي: البياض الدقيقي واللفحات')
p('خل الخشب', 'fungicide', True, None, None, 3, 'ml_per_l', 'مطهر طبيعي للتربة: يحد من الأعفان ويقلل نشاط الفطريات ويطرد بعض الحشرات')

# ── 2) مبيدات حشرية ونيماتودية حيوية وطبيعية (PDF) ────────────────────
p('صابون البوتاسيوم', 'insecticide', True, 'صابون البوتاسيوم', None, None, None, 'بالملامسة على الحشرات الرخوة: المن، الذبابة البيضاء، العنكبوت الأحمر (خفيف)')
p('أويكوس', 'insecticide', True, 'أزاديراختين', 'UN', None, None, 'آمن على الأعداء الحيوية: الذبابة البيضاء والنيماتودا')
p('نمبيسيدين', 'insecticide', True, 'أزاديراختين (زيت النيم)', 'UN', 2.5, 'ml_per_l', 'آمن على الحشرات النافعة: الذبابة البيضاء، المن، التربس، البق الدقيقي، نطاطات الأوراق')
p('زنتاري', 'insecticide', True, 'Bacillus thuringiensis subsp. aizawai', '11A', None, None, 'يرقات حرشفية الأجنحة: فراشة درنات البطاطس، دودة ورق القطن، دودة ثمار العنب')
p('دايبل دي إف', 'insecticide', True, 'Bacillus thuringiensis subsp. kurstaki', '11A', 1, 'g_per_l', 'يرقات حرشفية الأجنحة: دودة ورق القطن، التوتا أبسليوتا')
p('تاجليس', 'nematicide', True, None, None, None, None, 'جميع أنواع النيماتودا')
p('بيوتكت', 'insecticide', True, None, None, None, None, 'الديدان: ورق القطن، اللوز، درنات البطاطس، الثمار، البراعم، ديدان الأوراق')
p('بيوسكت', 'insecticide', True, None, None, None, None, 'الحشرات والعناكب: العنكبوت الأحمر، الذبابة البيضاء، المن، النطاطات')
p('بروتكتو', 'insecticide', True, None, None, 1, 'g_per_l', 'الطور اليرقي لحرشفية الأجنحة: دودة ورق القطن، الحشد، درنات البطاطس، التوتا')
p('تريسر', 'insecticide', True, 'سبينوساد', '5', 0.3, 'ml_per_l', 'بالملامسة أو الابتلاع: ديدان ثمار العنب، درنات البطاطس، ورق القطن، ديدان الطماطم، التربس')
p('بايو-كاتش', 'insecticide', True, 'Lecanicillium (Verticillium) lecanii', None, None, None, 'الآفات الثاقبة الماصة: الذباب الأبيض، المن، البق الدقيقي')
p('بايو باور', 'insecticide', True, 'Beauveria bassiana', None, None, None, 'الحفار، الديدان القارضة، اليرقات الجذرية، نطاطات الأوراق، الذبابة البيضاء، المن، التربس، البق الدقيقي')
p('بايو-ماجيك', 'insecticide', True, 'Metarhizium anisopliae', None, None, None, 'النطاطات والجراد واليرقات الجذرية والبق والخنافس وسوسة النخيل والحفار والديدان القارضة والنمل الأبيض')
p('بايو-نيماتون', 'nematicide', True, 'Purpureocillium (Paecilomyces) lilacinus', None, None, None, 'النيماتودا بكل أنواعها')
p('فلاي كاب', 'other', True, None, None, None, None, 'جذب إناث ذبابة الفاكهة')
p('الديترجنت الزراعي المتعادل', 'insecticide', True, None, None, None, None, 'الحشرات الثاقبة والعنكبوت الأحمر')
p('بروديك', 'insecticide', True, None, None, None, None, 'مركب حيوي/طبيعي ضد الحشرات الثاقبة الماصة')
p('فاكسيميت', 'insecticide', True, None, None, None, None, 'عضوي وقائي وعلاجي ضد الحشرات الثاقبة الماصة')
p('سيف بلانت', 'nematicide', True, None, None, 4, 'ml_per_l', 'مركب طبيعي عضوي لجميع أنواع النيماتودا')
p('نيما زيرو', 'nematicide', True, None, None, None, None, 'مركب نيماتودي ومغذي آمن: أمراض التربة والنيماتودا')
p('زيت التيكنو أوي', 'insecticide', True, None, None, None, None, 'منتج نباتي وقائي: الحشرات القشرية، البق الدقيقي، دودة ورق القطن')
p('سافيور', 'nematicide', True, None, None, None, None, 'يطهر الجذور من التلف الناتج عن النيماتودا')
p('زيت النيم', 'insecticide', True, 'زيت النيم', None, None, None, 'المن، الذبابة البيضاء، التربس، العناكب الحمراء، الديدان القارضة، الخنافس، النيماتودا، والبياض الدقيقي')
p('تارسوس', 'insecticide', True, None, None, None, None, 'الحشرات صغيرة الحجم: الذبابة البيضاء، المن، العنكبوت الأحمر، البق الدقيقي، التربس')
p('نيماكيل', 'nematicide', True, None, None, None, None, 'وقاية وعلاج من النيماتودا، ويحد من أعفان الجذور')
p('MUFFLY', 'insecticide', True, None, None, None, None, 'الحشرات الماصة (المن، الذبابة البيضاء، التربس) + تصحيح نقص الزنك والمنجنيز')
p('URTIQAS', 'acaricide', True, None, None, None, None, 'مكافحة العنكبوت الأحمر')
p('زيت ريبيماج', 'insecticide', True, None, None, 2.5, 'ml_per_l', 'الحشرات القشرية والبق الدقيقي والحشرات الثاقبة الماصة (2.5 مل/لتر للطماطم، 5 للخيار والفلفل)')

# ── المصائد والفيرمونات (PDF) ─────────────────────────────────────────
p('فيرمونات التوتا', 'other', True, None, None, None, None, 'مصائد فرمونية لحافرة أوراق الطماطم Tuta absoluta')
p('فيرمونات دودة ورق القطن', 'other', True, None, None, None, None, 'مصائد فرمونية لدودة ورق القطن Spodoptera littoralis')
p('المصائد الصفراء', 'other', True, None, None, None, None, 'رصد وجذب: الذباب الأبيض، المن المجنح، صانعات الأنفاق')
p('المصائد الزرقاء', 'other', True, None, None, None, None, 'رصد وجذب: التربس')
p('المصائد الحمراء', 'other', True, None, None, None, None, 'جذب ذبابة الفاكهة والحشرات التي تنجذب للطيف الأحمر')
p('المصائد السوداء', 'other', True, None, None, None, None, 'جذب التربس وبعض الحشرات الصغيرة التي تنجذب للون الداكن')

# ── 3) مخصبات ومحفزات حيوية (PDF) ───────────────────────────────────
p('كروب بلس', 'biostimulant', True, None, None, 1, 'ml_per_l', 'عناصر مغذية تساعد على مقاومة الإجهاد (الجفاف أو الأمراض الخفيفة)')
p('سوبر جرو', 'fertilizer', True, 'فوسفات صخري + كائنات مذيبة للفوسفور', None, None, None, 'يوفر احتياجات الفوسفور')
p('سمبيون فام', 'biostimulant', True, None, None, None, None, 'يسهل انتقال الماء والعناصر، يزيد مقاومة الإجهاد، كربوهيدرات وأحماض أمينية')
p('سمبيون الأزوت', 'fertilizer', True, None, None, None, None, 'مخصب حيوي يثبت النيتروجين الجوي')
p('سمبيون البوتاسيوم', 'fertilizer', True, None, None, None, None, 'مخصب حيوي يعزز امتصاص البوتاسيوم')
p('سمبيون الفوسفور', 'fertilizer', True, None, None, None, None, 'يمد النبات بالفوسفور ويحسن خصوبة التربة')
p('رينتال', 'biostimulant', True, None, None, None, None, 'التغلب على إجهاد ما بعد الزراعة، ينشط التجذير')
p('نيوسترين', 'biostimulant', True, None, None, None, None, 'يحسن محتوى الكالسيوم ويقلل التشقق والتجعد')
p('جروفول (طحالب بحرية)', 'biostimulant', True, 'مستخلص طحالب بحرية', None, 1, 'ml_per_l', 'تعزيز الإنتاج ونمو الأوراق وجودة الثمار')
p('أجريسترين', 'biostimulant', True, None, None, None, None, 'يحافظ على معدل النمو في الظروف المختلفة')
p('فورتسترين', 'biostimulant', True, None, None, None, None, 'التكيف مع الإجهاد الحراري وزيادة التمثيل الضوئي')
p('كولور سيف', 'biostimulant', True, None, None, None, None, 'تطوير لون الثمار')
p('فيوري', 'biostimulant', True, None, None, None, None, 'منشط لعملية الإزهار')
p('ماتيور', 'biostimulant', True, None, None, None, None, 'منشط لنضج الثمار وتحمل الحرارة العالية')
p('كريبتوم', 'adjuvant', True, None, None, None, None, 'يخفض حموضة محلول الرش ويعزز امتصاص المغذيات والمبيدات')
p('كريبتوم حديد', 'fertilizer', True, None, None, None, None, 'يحفز نمو الجذور ويخفض حموضة محلول الرش')
p('كويكل', 'biostimulant', True, None, None, None, None, 'تحفيز الإزهار وعقد الثمار والتعافي بعد الإجهاد الحراري')
p('CRIPTHUM New', 'fertilizer', True, None, None, None, None, 'تحسين بنية التربة وتغذيتها')
p('HORTUMUS', 'fertilizer', True, None, None, None, None, 'تعديل هيومي للتربة وتحفيز الجذور')
p('HUMIPOWER سائل', 'fertilizer', True, 'أحماض هيومية', None, None, None, 'إطلاق العناصر المحجوزة والاحتفاظ بالماء')
p('HUMIPOWER SOLUBLE', 'fertilizer', True, 'أحماض هيومية', None, None, None, 'إطلاق العناصر المحجوزة والاحتفاظ بالماء')
p('HUMIPOWER SOLID', 'fertilizer', True, 'أحماض هيومية + ميكوريزا', None, None, None, 'تحسين التربة مع الميكوريزا')
p('ORGAPLANT-Ca', 'fertilizer', True, None, None, None, None, 'يحسن بنية التربة ونظام الجذور')
p('ORGAPLANT-NK', 'fertilizer', True, None, None, None, None, 'يحسن خصوبة التربة ويدعم الإنتاجية')
p('ORGAPLANT ORGANIC', 'biostimulant', True, None, None, None, None, 'نيتروجين عضوي وأحماض أمينية للظروف الصعبة')
p('DISPERSAL', 'other', True, None, None, None, None, 'مصحح للتربة والمياه المالحة، يزيل أملاح الصوديوم')
p('AQUAPOWER', 'other', True, None, None, None, None, 'مهيكل تربة: يحسن استهلاك مياه الري ويمنع تراكم الأملاح')
p('ABSORTIM', 'other', True, None, None, None, None, 'يرفع قدرة الاحتفاظ بالماء في التربة الخفيفة')
p('QUICELU', 'fertilizer', True, None, None, None, None, 'زيادة الكالسيوم وتحسين جودة الثمار وتقليل التشقق')

# ── 4) أعداء حيوية إضافية (من جدول المفترسات) ─────────────────────────
p('أسد المن', 'biocontrol_agent', True, None, None, None, 'individuals_per_m2', 'المن، البق الدقيقي، العناكب، التربس، الذبابة البيضاء، اليرقات الصغيرة', 'Chrysoperla carnea')
p('أبو العيد ذو السبع نقاط', 'biocontrol_agent', True, None, None, None, 'individuals_per_m2', 'المن، الحشرات القشرية، البق الدقيقي، البيض واليرقات الصغيرة', 'Coccinella septempunctata')
p('Diglyphus isaea', 'biocontrol_agent', True, None, None, None, 'individuals_per_m2', 'متطفل — صانعات الأنفاق', 'Diglyphus isaea')

# ── 5) مواد برامج المكافحة (موازنة روت) ─────────────────────────────
p('موسبيلان', 'insecticide', False, 'أسيتامبريد', '4A', 0.25, 'g_per_l', 'الحشرات الثاقبة الماصة: الذبابة البيضاء، المن، التربس، البق الدقيقي')
p('البريتو', 'insecticide', False, None, None, 0.5, 'ml_per_l', 'الحشرات الثاقبة الماصة والتربس')
p('سيفانتو', 'insecticide', False, 'فلوبيراديفيورون', '4D', 0.5, 'ml_per_l', 'الحشرات الثاقبة الماصة: الذبابة البيضاء، المن')
p('كاني مايت', 'acaricide', False, 'أسيكينوسيل', '20B', 0.5, 'ml_per_l', 'العنكبوت الأحمر')
p('فيرتيمك', 'acaricide', False, 'أبامكتين', '6', 0.5, 'ml_per_l', 'العنكبوت الأحمر والأكاروس العريض وصانعات الأنفاق')
p('تيبوسال', 'acaricide', False, None, None, 0.4, 'ml_per_l', 'العناكب والأكاروسات')
p('اسبيدو', 'insecticide', False, None, None, 0.4, 'g_per_l', 'الديدان وحرشفية الأجنحة')
p('أمستار توب', 'fungicide', False, 'أزوكسيستروبين + ديفينوكونازول', '11+3', 0.75, 'ml_per_l', 'البياض الدقيقي والزغبي والندوات')
p('ترافس نحاس', 'fungicide', False, 'نحاس', 'M01', 2.5, 'ml_per_l', 'البياض الدقيقي واللفحات والندوات')
p('باكو بيست', 'fungicide', False, 'جليكونات النحاس', 'M01', 2.5, 'g_per_l', 'البياض واللفحات والندوات')
p('كبريتات النحاس', 'fungicide', False, 'كبريتات النحاس', 'M01', 3, 'ml_per_l', 'أعفان الجذور والتربة والذبول')
p('يوني فورم', 'fungicide', False, 'أزوكسيستروبين + ميفينوكسام', '11+4', None, None, 'أعفان الجذور وخناق الشتلات والذبول (معاملة تربة)')
p('فيلوم برايم', 'nematicide', False, 'فلوبيرام', '7', 0.5, 'l_per_feddan', 'النيماتودا بكل أنواعها (مع مياه الري)')
p('كوكتيل بيرل', 'fertilizer', False, None, None, 1.5, 'g_per_l', 'عناصر صغرى')
p('فوسترايد كالسيوم', 'fertilizer', False, None, None, 2.5, 'ml_per_l', 'كالسيوم ورقي')
p('فلور استار', 'biostimulant', False, None, None, 1, 'ml_per_l', 'تحفيز الإزهار والعقد')
p('فوسك 50', 'fertilizer', False, None, None, 2.5, 'ml_per_l', 'تغذية ورقية')
p('زنكونيا', 'fertilizer', False, None, None, 1, 'ml_per_l', 'زنك ورقي')
p('كلباك', 'fertilizer', False, None, None, 2.5, 'ml_per_l', 'كالسيوم وبورون')
p('حمض الستريك', 'adjuvant', False, 'حمض الستريك', None, None, None, 'ضبط حموضة المحلول')

# ── 6) أسمدة برامج التسميد (موازنة روت) ──────────────────────────────
for n, ai in [
    ('جبس زراعي', 'كبريتات الكالسيوم'), ('سوبر فوسفات ناعم', None), ('كبريت زراعي ناعم', 'كبريت'),
    ('سبلة (سماد عضوي)', None), ('حمض فوسفوريك', None), ('سلفات بوتاسيوم', None), ('نترات كالسيوم', None),
    ('يوريا', None), ('نترات نشادر', None), ('حمض نيتريك', None), ('نترات ماغنسيوم', None), ('ماب (MAP)', 'فوسفات أحادي الأمونيوم'),
    ('مونو بوتاسيوم فوسفات (MKP)', None), ('نترات بوتاسيوم', None), ('سماد مركب 19-19-19', None),
    ('حديد مخلبي', None), ('زنك مخلبي', None), ('منجنيز مخلبي', None), ('ال كابلانت', None),
    ('هيوميك', 'أحماض هيومية'), ('فولفيك', 'أحماض فولفيك'), ('بوراكس', 'بورون'), ('سلفات زنك', None),
    ('سلفات منجنيز', None), ('حمض كبريتيك', None), ('سلفات ماغنسيوم', None), ('سلفات حديدوز', None),
]:
    p(n, 'fertilizer', False, ai, None, None, None, 'برنامج التسميد (موازنة روت)')

# الأعداء الحيوية الموجودة أصلًا في الكتالوج (002) — تُحدَّث بالاستهداف فقط
EXISTING_BIO = {
    'Nesidiocoris tenuis': 'مفترس — التوتا والذبابة البيضاء',
    'Macrolophus pygmaeus': 'مفترس — الذبابة البيضاء والتوتا',
    'Amblyseius swirskii': 'أكاروس مفترس — الذبابة البيضاء والتربس والأكاروس العريض',
    'Phytoseiulus persimilis': 'أكاروس مفترس — العنكبوت الأحمر',
    'Orius laevigatus': 'بقة مفترسة — التربس',
    'Encarsia formosa': 'متطفل — الذبابة البيضاء',
    'Eretmocerus eremicus': 'متطفل — الذبابة البيضاء',
    'Aphidius colemani': 'متطفل — المن',
    'Trichogramma achaeae': 'متطفل بيض — التوتا وحرشفية الأجنحة',
    'Bombus terrestris': 'خلايا النحل الطنان للتلقيح',
}

# ── معرفة الآفات: حد التدخل (على مقياس الشدة 0–4) + المحاصيل + التوجيه ─────
# المقياس: 1 خفيف، 2 متوسط، 3 شديد، 4 بؤرة/شديد جدًا
PESTS = {
    'whitefly_bt': (1, None, 'افحص السطح السفلي لأوراق القمة. ناقلة لفيروس تجعد واصفرار أوراق الطماطم، فالتدخل يبدأ من أول ظهور. شبك محكم على الفتحات، ومصائد صفراء للرصد، وإزالة الحشائش حول الصوبة.'),
    'whitefly_tv': (2, None, 'افحص السطح السفلي لأوراق القمة. مصائد صفراء للرصد، وإطلاق الأعداء الحيوية مبكرًا قبل ارتفاع الكثافة.'),
    'thrips_wft': (1, None, 'افحص الأزهار. ناقل لفيروس الذبول المتبقع، فالتدخل مبكر. مصائد زرقاء للرصد، وإزالة الحشائش والأزهار المصابة.'),
    'thrips_tabaci': (2, None, 'افحص الأوراق الحديثة والأزهار. مصائد زرقاء للرصد.'),
    'tuta': (1, ['tomato', 'eggplant'], 'مصائد فرمونية للرصد. افحص الأنفاق في الأوراق العلوية والثمار. أزل الأوراق والثمار المصابة وأعدمها خارج الصوبة، وأحكم الشبك والباب المزدوج.'),
    'leafminer': (2, None, 'افحص الأنفاق في الأوراق السفلية والمتوسطة. مصائد صفراء للرصد، وإزالة الأوراق المصابة بشدة.'),
    'aphids': (2, None, 'افحص القمم النامية والسطح السفلي للأوراق. عالج البؤر موضعيًا مبكرًا، وتجنب الإفراط في التسميد النيتروجيني.'),
    'helicoverpa': (1, None, 'افحص الثمار والقمم. مصائد فرمونية للرصد، وإزالة الثمار المصابة.'),
    'spodoptera': (1, None, 'افحص لطع البيض واليرقات الصغيرة على الأوراق. مصائد فرمونية للرصد، وجمع اللطع يدويًا عند ظهورها.'),
    'spider_mite': (2, None, 'افحص السطح السفلي للأوراق في البؤر الحارة والجافة وقرب الممرات. عالج البؤرة موضعيًا من أول ظهور، وارفع الرطوبة إن أمكن.'),
    'russet_mite': (1, ['tomato'], 'افحص الساق والأوراق السفلية (لون برونزي). ينتشر بسرعة؛ عالج البؤرة وما حولها فورًا.'),
    'broad_mite': (1, None, 'افحص القمم النامية (تشوه والتواء الأوراق الحديثة). ينتشر بسرعة؛ تدخل فوري.'),
    'powdery_mildew': (1, None, 'افحص الأوراق السفلية والمتوسطة. تدخل وقائي مبكر، وتحسين التهوية، وتجنب الإجهاد المائي.'),
    'downy_mildew': (1, ['cucumber', 'melon'], 'افحص الأوراق بعد ليالي الرطوبة العالية. قلل ساعات ابتلال الأوراق بالتهوية والتدفئة، وتدخل وقائي عند توقع رطوبة عالية.'),
    'late_blight': (1, ['tomato'], 'افحص بعد فترات الرطوبة العالية والحرارة المعتدلة. ينتشر بسرعة كبيرة؛ أزل الأجزاء المصابة فورًا وتدخل وقائيًا.'),
    'early_blight': (2, ['tomato', 'eggplant'], 'افحص الأوراق السفلية. أزل الأوراق المصابة، وتجنب الإجهاد الغذائي.'),
    'botrytis': (1, None, 'افحص جروح التوريق والثمار والساق. قلل الرطوبة وابتلال الأسطح، ونظف جروح التقليم، وأزل المخلفات المصابة.'),
    'fusarium_wilt': (1, None, 'افحص الذبول من الأسفل وتلون الأوعية. أزل النباتات المصابة بالجذور، وعقم البيئة بين الدورات، واستخدم أصنافًا أو أصولًا مقاومة.'),
    'tylcv': (1, ['tomato'], 'لا يوجد علاج للنبات المصاب: أزل النباتات المصابة مبكرًا، واضبط الذبابة البيضاء (الناقل) بشدة، واستخدم أصنافًا متحملة وشتلات خالية من الإصابة.'),
    'tobrfv': (1, ['tomato', 'pepper'], 'لا يوجد علاج: عزل وإزالة النباتات المصابة، وتطهير الأيدي والأدوات والأحذية، ومنع انتقال العمالة بين الصوب، وأصناف مقاومة.'),
    'root_knot': (1, None, 'افحص العقد على الجذور عند ذبول غير مبرر. عقم التربة أو البيئة بين الدورات، واستخدم أصولًا مقاومة ومركبات النيماتودا مع الري.'),
    'blossom_end_rot': (1, ['tomato', 'pepper'], 'اضطراب فسيولوجي من نقص الكالسيوم في الثمرة: انتظام الري، وضبط EC، وتحسين التهوية والنتح، وكالسيوم ورقي.'),
}

# ── ربط الآفة ← خيارات المكافحة (approach: biological | natural | chemical | trap | nutrition) ──
L = {}
def link(pest, approach, *names):
    L.setdefault(pest, []).extend((approach, n) for n in names)

SUCKING_CHEM = ('موسبيلان', 'سيفانتو', 'البريتو')
for wf in ('whitefly_bt', 'whitefly_tv'):
    link(wf, 'biological', 'Encarsia formosa', 'Eretmocerus eremicus', 'Macrolophus pygmaeus', 'Nesidiocoris tenuis', 'Amblyseius swirskii', 'بايو-كاتش', 'بايو باور', 'تارسوس', 'بيوسكت', 'أسد المن')
    link(wf, 'natural', 'نمبيسيدين', 'أويكوس', 'زيت ريبيماج', 'صابون البوتاسيوم', 'زيت النيم', 'بريف إيه إم', 'MUFFLY', 'بروديك', 'فاكسيميت')
    link(wf, 'chemical', *SUCKING_CHEM)
    link(wf, 'trap', 'المصائد الصفراء')
link('aphids', 'biological', 'Aphidius colemani', 'أسد المن', 'أبو العيد ذو السبع نقاط', 'بايو-كاتش', 'بايو باور', 'تارسوس', 'بيوسكت')
link('aphids', 'natural', 'نمبيسيدين', 'زيت ريبيماج', 'صابون البوتاسيوم', 'زيت النيم', 'MUFFLY')
link('aphids', 'chemical', *SUCKING_CHEM)
link('aphids', 'trap', 'المصائد الصفراء')
for th in ('thrips_wft', 'thrips_tabaci'):
    link(th, 'biological', 'Orius laevigatus', 'Amblyseius swirskii', 'بايو باور', 'تارسوس', 'أسد المن')
    link(th, 'natural', 'تريسر', 'نمبيسيدين', 'زيت النيم', 'MUFFLY')
    link(th, 'chemical', *SUCKING_CHEM)
    link(th, 'trap', 'المصائد الزرقاء', 'المصائد السوداء')
link('tuta', 'biological', 'Nesidiocoris tenuis', 'Macrolophus pygmaeus', 'Trichogramma achaeae', 'دايبل دي إف', 'زنتاري', 'بروتكتو', 'بيوتكت')
link('tuta', 'natural', 'تريسر')
link('tuta', 'chemical', 'اسبيدو')
link('tuta', 'trap', 'فيرمونات التوتا')
for lep in ('helicoverpa', 'spodoptera'):
    link(lep, 'biological', 'Trichogramma achaeae', 'دايبل دي إف', 'زنتاري', 'بروتكتو', 'بيوتكت')
    link(lep, 'natural', 'تريسر')
    link(lep, 'chemical', 'اسبيدو')
link('spodoptera', 'natural', 'زيت التيكنو أوي')
link('spodoptera', 'trap', 'فيرمونات دودة ورق القطن')
link('leafminer', 'biological', 'Diglyphus isaea')
link('leafminer', 'natural', 'نمبيسيدين', 'زيت النيم')
link('leafminer', 'chemical', 'فيرتيمك')
link('leafminer', 'trap', 'المصائد الصفراء')
link('spider_mite', 'biological', 'Phytoseiulus persimilis', 'تارسوس', 'بيوسكت')
link('spider_mite', 'natural', 'بريف إيه إم', 'كبريت ميكروني', 'الكبريت السائل', 'URTIQAS', 'صابون البوتاسيوم', 'الديترجنت الزراعي المتعادل', 'زيت النيم')
link('spider_mite', 'chemical', 'كاني مايت', 'فيرتيمك', 'تيبوسال')
link('broad_mite', 'biological', 'Amblyseius swirskii')
link('broad_mite', 'natural', 'كبريت ميكروني', 'بريف إيه إم')
link('broad_mite', 'chemical', 'فيرتيمك', 'تيبوسال', 'كاني مايت')
link('russet_mite', 'natural', 'كبريت ميكروني', 'الكبريت السائل', 'بريف إيه إم')
link('russet_mite', 'chemical', 'فيرتيمك')
link('powdery_mildew', 'natural', 'هيليوسوفر', 'كبريت ميكروني', 'الكبريت السائل', 'الكبريت النانو', 'بيكربونات البوتاسيوم', 'فوسفات البوتاسيوم', 'سيليكات الماغنسيوم', 'بايو-دوكون', 'بيوارك', 'بيوزيد', 'اكسيلان', 'فليجرين', 'بريف إيه إم')
link('powdery_mildew', 'chemical', 'أمستار توب')
link('downy_mildew', 'natural', 'سيريناد أسو', 'بايوكيور-إف', 'اكسيلان', 'EQUISTUN')
link('downy_mildew', 'chemical', 'بوردو كفارو', 'جلوبر', 'ترافس نحاس', 'باكو بيست', 'أمستار توب')
link('late_blight', 'natural', 'بيوارك', 'بيوزيد', 'بايوكيور-إف', 'فوسفات البوتاسيوم')
link('late_blight', 'chemical', 'بوردو كفارو', 'ترافس نحاس', 'باكو بيست', 'أمستار توب')
link('early_blight', 'natural', 'بيوارك', 'بيوزيد', 'هيلوتروم')
link('early_blight', 'chemical', 'أمستار توب', 'بوردو كفارو', 'ترافس نحاس')
link('botrytis', 'natural', 'هيلوتروم', 'سيريناد أسو', 'بيوارك')
link('fusarium_wilt', 'natural', 'بيوكونترول', 'بايوكيور-إف', 'خل الخشب', 'سيليكات الماغنسيوم')
link('fusarium_wilt', 'chemical', 'كبريتات النحاس', 'يوني فورم')
link('root_knot', 'natural', 'سيف بلانت', 'بايو-نيماتون', 'تاجليس', 'نيما زيرو', 'سافيور', 'نيماكيل', 'أويكوس', 'زيت النيم')
link('root_knot', 'chemical', 'فيلوم برايم')
link('tylcv', 'natural', 'نمبيسيدين', 'زيت ريبيماج')
link('tylcv', 'chemical', 'موسبيلان', 'سيفانتو')
link('tylcv', 'trap', 'المصائد الصفراء')
link('blossom_end_rot', 'nutrition', 'فوسترايد كالسيوم', 'كلباك', 'نيوسترين', 'QUICELU', 'نترات كالسيوم')


def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, list):
        return "array[" + ','.join(q(x) for x in v) + "]::text[]"
    return "'" + str(v).replace("'", "''") + "'"


def main():
    names = [x['name'] for x in P]
    dup = {n for n in names if names.count(n) > 1}
    assert not dup, dup
    known = set(names) | set(EXISTING_BIO)
    for pest, items in L.items():
        assert pest in PESTS, pest
        for _, n in items:
            assert n in known, (pest, n)

    out = []
    w = out.append
    w('''-- =====================================================================
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
''')
    w('-- ── معرفة الآفات ─────────────────────────────────────────────')
    for code, (sev, crops, guide) in PESTS.items():
        w(f"update public.pests set action_severity = {sev}, crops = {q(crops)}, guidance = {q(guide)} where farm_id is null and code = {q(code)};")
    w('')
    w('-- ── الأعداء الحيوية الموجودة: حيوي + استهداف ─────────────────')
    for n, t in EXISTING_BIO.items():
        w(f"update public.products set is_bio = true, targets = {q(t)} where farm_id is null and name = {q(n)};")
    w('')
    w('-- ── المنتجات الجديدة (تُضاف مرة واحدة فقط) ───────────────────')
    w('insert into public.products (name, product_type, is_bio, active_ingredient, moa_code, default_dose, default_dose_unit, targets, bio_species)')
    w('select v.name, v.ptype::public.product_type, v.bio, v.ai, v.moa, v.dose, v.unit::public.dose_unit, v.targets, v.species from (values')
    rows = []
    for x in P:
        rows.append(f"  ({q(x['name'])}, {q(x['ptype'])}, {q(x['bio'])}, {q(x['ai'])}, {q(x['moa'])}, {q(x['dose']) if x['dose'] is not None else 'null::numeric'}, {q(x['unit'])}, {q(x['targets'])}, {q(x['species'])})")
    w(',\n'.join(rows))
    w(') as v(name, ptype, bio, ai, moa, dose, unit, targets, species)')
    w('where not exists (select 1 from public.products p where p.farm_id is null and p.name = v.name);')
    w('')
    w('-- ── ربط الآفات بخيارات المكافحة (مجمّعة: آفة × أسلوب ← قائمة منتجات بالترتيب) ──')
    w('insert into public.pest_controls (pest_id, product_id, approach, priority)')
    w('select pe.id, pr.id, v.approach, v.base + u.ord::smallint from (values')
    rows = []
    order = {'biological': 100, 'natural': 200, 'trap': 300, 'nutrition': 400, 'chemical': 500}
    for pest, items in L.items():
        groups = {}
        for ap, n in items:
            g = groups.setdefault(ap, [])
            if n not in g:
                g.append(n)
        for ap, names in groups.items():
            rows.append(f"  ({q(pest)}, {q(ap)}, {order[ap]}, {q(names)})")
    w(',\n'.join(rows))
    w(') as v(pest, approach, base, names)')
    w('cross join lateral unnest(v.names) with ordinality as u(name, ord)')
    w('join public.pests pe on pe.farm_id is null and pe.code = v.pest')
    w('join public.products pr on pr.farm_id is null and pr.name = u.name')
    w('on conflict do nothing;')
    print('\n'.join(out))


if __name__ == '__main__':
    main()
