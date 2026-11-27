-- 016: سجل المبيدات — المواد الفعالة وحدود المتبقيات (مولّد من scripts/knowledge/pesticides_data.json)
-- لا تعدّل يدويًا: عدّل البيانات في JSON وأعد التوليد. كل رقم معه مصدره وتاريخ قراءته.

insert into public.active_substances (farm_id, name_en, name_ar, cas_no, classes, moa_system, moa_code, chemical_group, eu_status, eu_expiry, eu_cfs, notes, source_url, reviewed_on)
values
  (null, 'abamectin', 'أبامكتين', '71751-41-2', array['insecticide', 'acaricide', 'nematicide']::text[], 'IRAC', '6', 'avermectins', 'approved', '2038-03-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://echa.europa.eu/sv/ann-approved-act-subs-plant-prot-prods/-/legislationlist/substance/external/100.113.437', '2026-11-27'),
  (null, 'emamectin benzoate', 'إيمامكتين بنزوات', '155569-91-8', array['insecticide']::text[], 'IRAC', '6', 'avermectins', 'approved', '2029-05-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1326.htm', '2026-11-27'),
  (null, 'chlorantraniliprole', 'كلورانترانيليبرول', '500008-45-7', array['insecticide']::text[], 'IRAC', '28', 'diamides', 'approved', '2027-05-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1138.htm', '2026-11-27'),
  (null, 'cyantraniliprole', 'سيانترانيليبرول', '736994-63-1', array['insecticide']::text[], 'IRAC', '28', 'diamides', 'approved', '2030-03-14', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1662.htm', '2026-11-27'),
  (null, 'spinosad', 'سبينوساد', '168316-95-8', array['insecticide']::text[], 'IRAC', '5', 'spinosyns', 'approved', '2041-04-01', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/596.htm', '2026-11-27'),
  (null, 'spinetoram', 'سبينتورام', '935545-74-7', array['insecticide']::text[], 'IRAC', '5', 'spinosyns', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1144.htm', '2026-11-27'),
  (null, 'indoxacarb', 'إندوكساكارب', '173584-44-6', array['insecticide']::text[], 'IRAC', '22A', 'oxadiazines', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/399.htm', '2026-11-27'),
  (null, 'lufenuron', 'لوفينيورون', '103055-07-8', array['insecticide']::text[], 'IRAC', '15', 'benzoylureas', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/420.htm', '2026-11-27'),
  (null, 'methoxyfenozide', 'ميثوكسي فينوزايد', '161050-58-4', array['insecticide']::text[], 'IRAC', '18', 'diacylhydrazines', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/461.htm', '2026-11-27'),
  (null, 'imidacloprid', 'إيميداكلوبريد', '138261-41-3', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/397.htm', '2026-11-27'),
  (null, 'spirotetramat', 'سبيروتترامات', '203313-25-1', array['insecticide']::text[], 'IRAC', '23', 'tetronic and tetramic acid derivatives', 'not_approved', null, null, 'غير معتمد حاليًا في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1119.htm', '2026-11-27'),
  (null, 'acetamiprid', 'أسيتامبريد', '135410-20-7', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'approved', '2033-02-28', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/11.htm', '2026-11-27'),
  (null, 'thiamethoxam', 'ثياميثوكسام', '153719-23-4', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/631.htm', '2026-11-27'),
  (null, 'dinotefuran', 'دينوتيفوران', '165252-70-0', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1195.htm', '2026-11-27'),
  (null, 'pyriproxyfen', 'بيريبروكسيفين', '95737-68-1', array['insecticide']::text[], 'IRAC', '7C', 'juvenile hormone mimics', 'approved', '2035-07-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/574.htm', '2026-11-27'),
  (null, 'buprofezin', 'بوبروفيزين', null, array['insecticide']::text[], 'IRAC', '16', 'unclassified IGR', 'approved', '2027-03-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/100.htm', '2026-11-27'),
  (null, 'spirodiclofen', 'سبيروديكلوفين', '148477-71-8', array['acaricide', 'insecticide']::text[], 'IRAC', '23', 'tetronic and tetramic acid derivatives', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/597.htm', '2026-11-27'),
  (null, 'spiromesifen', 'سبيروميسيفين', '283594-90-1', array['insecticide', 'acaricide']::text[], 'IRAC', '23', 'tetronic and tetramic acid derivatives', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/598.htm', '2026-11-27'),
  (null, 'flonicamid', 'فلونيكاميد', '158062-67-0', array['insecticide']::text[], 'IRAC', '29', 'pyridine insecticide', 'approved', '2029-10-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/321.htm', '2026-11-27'),
  (null, 'flupyradifurone', 'فلوبيراديفيورون', '951659-40-8', array['insecticide']::text[], 'IRAC', '4D', 'butenolides', 'approved', '2029-06-09', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2620.htm', '2026-11-27'),
  (null, 'sulfoxaflor', 'سلفوكسافلور', '946578-00-3', array['insecticide']::text[], 'IRAC', '4C', 'sulfoximines', 'approved', '2028-01-18', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1669.htm', '2026-11-27'),
  (null, 'pymetrozine', 'بيميتروزين', '123312-89-0', array['insecticide']::text[], 'IRAC', '9B', 'pyridine azomethine derivatives', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/562.htm', '2026-11-27'),
  (null, 'lambda-cyhalothrin', 'لامبدا سيهالوثرين', '91465-08-6', array['insecticide']::text[], 'IRAC', '3A', 'pyrethroids', 'approved', '2029-01-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/415.htm', '2026-11-27'),
  (null, 'alpha-cypermethrin', 'ألفا سيبرمثرين', '67375-30-8', array['insecticide']::text[], 'IRAC', '3A', 'pyrethroids', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/24.htm', '2026-11-27'),
  (null, 'chlorfenapyr', 'كلورفينابير', '122453-73-0', array['insecticide', 'acaricide']::text[], 'IRAC', '13', 'pyrroles', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/136.htm', '2026-11-27'),
  (null, 'hexythiazox', 'هكسيثيازوكس', '78587-05-0', array['acaricide']::text[], 'IRAC', '10A', 'thiazolidines', 'approved', '2027-01-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/385.htm', '2026-11-27'),
  (null, 'etoxazole', 'إيتوكسازول', '153233-91-1', array['acaricide']::text[], 'IRAC', '10B', 'diphenyl oxazolines', 'approved', '2028-01-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/284.htm', '2026-11-27'),
  (null, 'fenpyroximate', 'فينبيروكسيميت', '134098-61-6', array['acaricide', 'insecticide']::text[], 'IRAC', '21A', 'METI acaricides and insecticides', 'approved', '2028-01-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/309.htm', '2026-11-27'),
  (null, 'bifenazate', 'بيفينازيت', '149877-41-8', array['acaricide']::text[], 'IRAC', '20D', 'carbazates', 'approved', '2037-06-30', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/76.htm', '2026-11-27'),
  (null, 'pyridaben', 'بيريدابين', '96489-71-3', array['acaricide', 'insecticide']::text[], 'IRAC', '21A', 'METI acaricides and insecticides', 'approved', '2030-01-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/569.htm', '2026-11-27'),
  (null, 'chlorpyrifos', 'كلوربيريفوس', '2921-88-2', array['insecticide']::text[], 'IRAC', '1B', 'organophosphates', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/154.htm', '2026-11-27'),
  (null, 'profenofos', 'بروفينوفوس', '41198-08-7', array['insecticide', 'acaricide']::text[], 'IRAC', '1B', 'organophosphates', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/538.htm', '2026-11-27'),
  (null, 'methomyl', 'ميثوميل', '16752-77-5', array['insecticide']::text[], 'IRAC', '1A', 'carbamates', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/458.htm', '2026-11-27'),
  (null, 'dimethoate', 'دايميثويت', '60-51-5', array['insecticide', 'acaricide']::text[], 'IRAC', '1B', 'organophosphates', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/244.htm', '2026-11-27'),
  (null, 'oxamyl', 'أوكساميل', '23135-22-0', array['insecticide', 'nematicide']::text[], 'IRAC', '1A', 'carbamates', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/498.htm', '2026-11-27'),
  (null, 'fosthiazate', 'فوستيازيت', '98886-44-3', array['nematicide', 'insecticide']::text[], 'IRAC', '1B', 'organophosphates', 'approved', '2027-01-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/364.htm', '2026-11-27'),
  (null, 'fluopyram', 'فلوبيرام', '658066-35-4', array['fungicide', 'nematicide']::text[], 'FRAC', '7', 'SDHI - pyridinyl-ethylbenzamides', 'approved', '2028-06-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1362.htm', '2026-11-27'),
  (null, 'azoxystrobin', 'أزوكسيستروبين', '131860-33-8', array['fungicide']::text[], 'FRAC', '11', 'QoI - methoxy-acrylates', 'approved', '2027-05-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/54.htm', '2026-11-27'),
  (null, 'pyraclostrobin', 'بيراكلوستروبين', '175013-18-0', array['fungicide']::text[], 'FRAC', '11', 'QoI - methoxy-carbamates', 'approved', '2041-09-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1976 (renewal) — https://www.boe.es/doue/2026/1976/L00001-00006.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/564.htm', '2026-11-27'),
  (null, 'trifloxystrobin', 'ترايفلوكسيستروبين', '141517-21-7', array['fungicide']::text[], 'FRAC', '11', 'QoI - oximino-acetates', 'approved', '2033-07-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/664.htm', '2026-11-27'),
  (null, 'difenoconazole', 'دايفينوكونازول', '119446-68-3', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2028-01-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/230.htm', '2026-11-27'),
  (null, 'tebuconazole', 'تيبوكونازول', '107534-96-3', array['fungicide', 'plant_growth_regulator']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2028-07-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/610.htm', '2026-11-27'),
  (null, 'penconazole', 'بنكونازول', '66246-88-6', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2029-02-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/509.htm', '2026-11-27'),
  (null, 'myclobutanil', 'مايكلوبيوتانيل', '88671-89-0', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/478.htm', '2026-11-27'),
  (null, 'tetraconazole', 'تتراكونازول', '112281-77-3', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2027-03-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/626.htm', '2026-11-27'),
  (null, 'boscalid', 'بوسكاليد', '188425-85-6', array['fungicide']::text[], 'FRAC', '7', 'SDHI - pyridine-carboxamides', 'approved', '2028-03-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/86.htm', '2026-11-27'),
  (null, 'cyprodinil', 'سيبرودينيل', '121552-61-2', array['fungicide']::text[], 'FRAC', '9', 'AP - anilino-pyrimidines', 'approved', '2027-07-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/199.htm', '2026-11-27'),
  (null, 'fludioxonil', 'فلوديوكسونيل', '131341-86-1', array['fungicide']::text[], 'FRAC', '12', 'PP - phenylpyrroles', 'approved', '2027-09-30', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/330.htm', '2026-11-27'),
  (null, 'iprodione', 'إبروديون', '36734-19-7', array['fungicide']::text[], 'FRAC', '2', 'dicarboximides', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/403.htm', '2026-11-27'),
  (null, 'mancozeb', 'مانكوزيب', '8018-01-7', array['fungicide']::text[], 'FRAC', 'M 03', 'dithiocarbamates and relatives', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/424.htm', '2026-11-27'),
  (null, 'chlorothalonil', 'كلوروثالونيل', '1897-45-6', array['fungicide']::text[], 'FRAC', 'M 05', 'chloronitriles (phthalonitriles)', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/150.htm', '2026-11-27'),
  (null, 'copper hydroxide', 'هيدروكسيد النحاس', '20427-59-2', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'مركبات النحاس مرشحة للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/175.htm', '2026-11-27'),
  (null, 'copper oxychloride', 'أوكسي كلوريد النحاس', '1332-40-7', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'مركبات النحاس مرشحة للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/177.htm', '2026-11-27'),
  (null, 'sulfur', 'كبريت', '7704-34-9', array['fungicide', 'acaricide']::text[], 'FRAC', 'M 02', 'inorganic (sulphur)', 'approved', '2027-07-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/605.htm', '2026-11-27'),
  (null, 'metalaxyl-M', 'ميتالاكسيل-إم (ميفينوكسام)', '70630-17-0', array['fungicide']::text[], 'FRAC', '4', 'PA - acylalanines', 'approved', '2035-05-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/445.htm', '2026-11-27'),
  (null, 'cymoxanil', 'سيموكسانيل', '57966-95-7', array['fungicide']::text[], 'FRAC', '27', 'cyanoacetamide-oximes', 'approved', '2027-11-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/196.htm', '2026-11-27'),
  (null, 'dimethomorph', 'دايميثومورف', '110488-70-5', array['fungicide']::text[], 'FRAC', '40', 'CAA - cinnamic acid amides', 'not_approved', null, null, 'غير معتمد حاليًا في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/245.htm', '2026-11-27'),
  (null, 'mandipropamid', 'ماندي بروباميد', '374726-62-2', array['fungicide']::text[], 'FRAC', '40', 'CAA - mandelic acid amides', 'approved', '2029-06-30', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/425.htm', '2026-11-27'),
  (null, 'fosetyl', 'فوسيتيل ألومنيوم', '39148-24-8', array['fungicide']::text[], 'FRAC', 'P 07', 'phosphonates (ethyl phosphonates)', 'approved', '2028-01-31', false, 'البيانات لفوسيتيل-ألومنيوم (fosetyl-aluminium) — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/363.htm', '2026-11-27'),
  (null, 'propamocarb', 'بروباموكارب', '24579-73-5', array['fungicide']::text[], 'FRAC', '28', 'carbamates', 'approved', '2027-01-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1546.htm', '2026-11-27'),
  (null, 'famoxadone', 'فاموكسادون', '131807-57-3', array['fungicide']::text[], 'FRAC', '11', 'QoI - oxazolidine-diones', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/287.htm', '2026-11-27'),
  (null, 'ametoctradin', 'أميتوكترادين', '865318-97-4', array['fungicide']::text[], 'FRAC', '45', 'QoSI - triazolo-pyrimidylamines', 'approved', '2028-05-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1648.htm', '2026-11-27'),
  (null, 'thiophanate-methyl', 'ثيوفانات ميثيل', '23564-05-8', array['fungicide']::text[], 'FRAC', '1', 'MBC - thiophanates', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/640.htm', '2026-11-27'),
  (null, 'carbendazim', 'كاربندازيم', '10605-21-7', array['fungicide']::text[], 'FRAC', '1', 'MBC - benzimidazoles', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/116.htm', '2026-11-27'),
  (null, 'hymexazol', 'هيميكسازول', '10004-44-1', array['fungicide']::text[], 'FRAC', '32', 'isoxazoles', 'approved', '2029-01-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/388.htm', '2026-11-27'),
  (null, 'fluazinam', 'فلوازينام', '79622-59-6', array['fungicide']::text[], 'FRAC', '29', '2,6-dinitro-anilines (uncouplers)', 'approved', '2027-11-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/325.htm', '2026-11-27'),
  (null, 'cyflufenamid', 'سيفلوفيناميد', '180409-60-3', array['fungicide']::text[], 'FRAC', 'U 06', 'phenyl-acetamides', 'approved', '2027-06-30', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/191.htm', '2026-11-27'),
  (null, 'bupirimate', 'بيوبيريميت', '41483-43-6', array['fungicide']::text[], 'FRAC', '8', 'hydroxy-(2-amino-)pyrimidines', 'approved', '2027-01-31', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/99.htm', '2026-11-27'),
  (null, 'milbemectin', 'ميلبيمكتين', '51596-11-3', array['insecticide', 'acaricide']::text[], 'IRAC', '6', 'milbemycins', 'approved', '2040-11-15', false, 'رقم CAS للمكوّن MA4 — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/472.htm', '2026-11-27'),
  (null, 'quinoxyfen', 'كينوكسيفين', '124495-18-7', array['fungicide']::text[], 'FRAC', '13', 'aryloxyquinolines', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/580.htm', '2026-11-27'),
  (null, 'glyphosate', 'جليفوسات', '1071-83-6', array['herbicide']::text[], 'HRAC', '9', 'organophosphonates (phosphonoglycines)', 'approved', '2033-12-15', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/373.htm', '2026-11-27'),
  (null, 'potassium hydrogen carbonate', 'بيكربونات البوتاسيوم', '298-14-6', array['fungicide']::text[], 'FRAC', 'NC', 'inorganic salts', 'approved', '2036-10-31', false, 'مادة منخفضة الخطورة في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1624.htm', '2026-11-27'),
  (null, 'bacillus amyloliquefaciens qst 713', 'باسيلس سبتلس سلالة QST 713', null, array['fungicide', 'biological']::text[], 'FRAC', 'BM 02', 'Bacillus spp. (microbial)', 'approved', '2038-06-30', false, 'كانت تُعرف سابقًا باسم Bacillus subtilis QST 713 — مادة منخفضة الخطورة في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1949.htm', '2026-11-27'),
  (null, 'paraffin oil (cas 8042-47-5)', 'زيت البارافين', '8042-47-5', array['insecticide', 'acaricide']::text[], 'IRAC', 'UNM', 'mineral oils', 'approved', '2041-06-30', false, 'IRAC يصنّف الزيوت المعدنية تحت UNM — تاريخ الانتهاء مراجع في Reg. (EU) 2026/870 (renewal) — https://www.boe.es/doue/2026/870/L00001-00005.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1377.htm', '2026-11-27'),
  (null, 'paraffin oil (cas 64742-46-7)', 'زيت البارافين', '64742-46-7', array['insecticide', 'acaricide', 'fungicide']::text[], 'IRAC', 'UNM', 'mineral oils', 'approved', '2027-03-31', false, 'IRAC يصنّف الزيوت المعدنية تحت UNM — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1376.htm', '2026-11-27'),
  (null, 'azadirachtin', 'أزاديراختين', '11141-17-6', array['insecticide']::text[], 'IRAC', 'UN', 'compounds of unknown or uncertain MoA', 'approved', '2027-01-31', false, 'رقم CAS للأزاديراختين A — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/46.htm', '2026-11-27'),
  (null, 'bacillus thuringiensis subsp. kurstaki abts 351', 'باسيلس ثورينجنسيس (كورستاكي)', null, array['insecticide', 'biological']::text[], 'IRAC', '11A', 'Bacillus thuringiensis and insecticidal proteins', 'approved', '2038-06-30', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/57.htm', '2026-11-27'),
  (null, 'bacillus thuringiensis subsp. aizawai abts-1857', 'باسيلس ثورينجنسيس (أيزاواي)', null, array['insecticide', 'biological']::text[], 'IRAC', '11A', 'Bacillus thuringiensis and insecticidal proteins', 'approved', '2038-06-30', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3221.htm', '2026-11-27'),
  (null, 'bacillus thuringiensis subsp. aizawai gc-91', 'باسيلس ثورينجنسيس (أيزاواي)', null, array['insecticide', 'biological']::text[], 'IRAC', '11A', 'Bacillus thuringiensis and insecticidal proteins', 'approved', '2038-06-30', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1942.htm', '2026-11-27'),
  (null, 'beauveria bassiana atcc 74040', 'بوفيريا باسيانا', null, array['insecticide', 'biological']::text[], 'IRAC', 'UNF', null, 'approved', '2027-09-15', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/1394.htm', '2026-11-27'),
  (null, 'beauveria bassiana gha', 'بوفيريا باسيانا', null, array['insecticide', 'biological']::text[], 'IRAC', 'UNF', null, 'approved', '2027-09-15', false, 'تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/2514.htm', '2026-11-27'),
  (null, 'copper sulphate tribasic', 'كبريتات النحاس الثلاثية القاعدية', '12527-76-3', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'من كتالوج التطبيق (كبريتات النحاس) — مركبات النحاس مرشحة للاستبدال — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/178.htm', '2026-11-27'),
  (null, 'bordeaux mixture', 'مخلوط بوردو', '8011-63-0', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'من كتالوج التطبيق (بوردو) — مركبات النحاس مرشحة للاستبدال — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/85.htm', '2026-11-27'),
  (null, 'fatty acids potassium salts', 'صابون البوتاسيوم (أملاح البوتاسيوم للأحماض الدهنية)', '67701-09-1', array['insecticide', 'fungicide']::text[], null, null, 'fatty acids (potassium salts)', 'approved', '2028-01-31', false, 'من كتالوج التطبيق (صابون البوتاسيوم) — غير مدرج في قائمة IRAC — تاريخ الانتهاء مراجع في تصدير قاعدة بيانات المبيدات الأوروبية ActiveSubstanceExport بتاريخ 2026-11-27', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/3585.htm', '2026-11-27'),
  (null, 'acequinocyl', 'أسيكينوسيل', '57960-19-7', array['acaricide']::text[], 'IRAC', '20B', null, 'approved', '2029-01-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/10.htm', '2026-11-27'),
  (null, 'malathion', 'ملاثيون', '121-75-5', array['insecticide', 'acaricide']::text[], 'IRAC', '1B', 'organophosphates', 'approved', '2028-07-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/421.htm', '2026-11-27'),
  (null, 'deltamethrin', 'دلتامثرين', '52918-63-5', array['insecticide']::text[], 'IRAC', '3A', 'pyrethroids', 'approved', '2028-06-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/205.htm', '2026-11-27')
on conflict (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name_en)) do update set
  name_ar = excluded.name_ar, cas_no = excluded.cas_no, classes = excluded.classes, moa_system = excluded.moa_system,
  moa_code = excluded.moa_code, chemical_group = excluded.chemical_group, eu_status = excluded.eu_status,
  eu_expiry = excluded.eu_expiry, eu_cfs = excluded.eu_cfs, notes = excluded.notes, source_url = excluded.source_url,
  reviewed_on = excluded.reviewed_on, deleted_at = null, updated_at = now(), server_updated_at = now();

with raw as (select l from regexp_split_to_table($d$
abamectin|CODEX|tomato|0.05|x5f509a14-199b-f111-b8dc-70a8a5613865|Tomato|f|2026-11-27
abamectin|CODEX|pepper|0.09|x5f509a14-199b-f111-b8dc-70a8a5613865|Peppers, sweet (including pimento or pimiento)|f|2026-11-27
abamectin|CODEX|cucumber|0.03|x5f509a14-199b-f111-b8dc-70a8a5613865|Cucumber|f|2026-11-27
abamectin|CODEX|strawberry|0.15|x5f509a14-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
abamectin|CODEX|eggplant|0.05|x5f509a14-199b-f111-b8dc-70a8a5613865|Eggplant|f|2026-11-27
abamectin|CODEX|melon|0.01|x5f509a14-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)|f|2026-11-27
abamectin|CODEX|green_bean|0.08|x5f509a14-199b-f111-b8dc-70a8a5613865|Beans with pods (Phaseolus spp.) (immature pods and succulent seeds)|f|2026-11-27
acetamiprid|CODEX|tomato|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
acetamiprid|CODEX|pepper|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
acetamiprid|CODEX|cucumber|0.3|xa3509a14-199b-f111-b8dc-70a8a5613865|Cucumber|f|2026-11-27
acetamiprid|CODEX|strawberry|0.5|xa3509a14-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
acetamiprid|CODEX|eggplant|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
acetamiprid|CODEX|melon|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
acetamiprid|CODEX|green_bean|0.4|xa3509a14-199b-f111-b8dc-70a8a5613865|Beans with pods (Phaseolus spp.) (immature pods and succulent seeds)|f|2026-11-27
ametoctradin|CODEX|tomato|1.5|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
ametoctradin|CODEX|pepper|1.5|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
ametoctradin|CODEX|cucumber|0.4|xb2509a14-199b-f111-b8dc-70a8a5613865|Cucumber|f|2026-11-27
ametoctradin|CODEX|eggplant|1.5|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
ametoctradin|CODEX|melon|3.0|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
azoxystrobin|CODEX|tomato|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
azoxystrobin|CODEX|pepper|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
azoxystrobin|CODEX|cucumber|1.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
azoxystrobin|CODEX|strawberry|10.0|x93509a14-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
azoxystrobin|CODEX|eggplant|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
azoxystrobin|CODEX|melon|5.0|x93509a14-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)|f|2026-11-27
azoxystrobin|CODEX|green_bean|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Legume vegetables (group)|f|2026-11-27
bifenazate|CODEX|tomato|0.5|x88509a14-199b-f111-b8dc-70a8a5613865|Tomato|f|2026-11-27
bifenazate|CODEX|pepper|2.0|x88509a14-199b-f111-b8dc-70a8a5613865|Peppers, sweet (including pimento or pimiento)|f|2026-11-27
bifenazate|CODEX|cucumber|0.5|x88509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
bifenazate|CODEX|strawberry|2.0|x88509a14-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
bifenazate|CODEX|melon|0.5|x88509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
bifenazate|CODEX|green_bean|7.0|x88509a14-199b-f111-b8dc-70a8a5613865|Legume vegetables (group)|f|2026-11-27
boscalid|CODEX|tomato|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
boscalid|CODEX|pepper|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
boscalid|CODEX|cucumber|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
boscalid|CODEX|strawberry|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
boscalid|CODEX|eggplant|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
boscalid|CODEX|melon|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
boscalid|CODEX|green_bean|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Legume vegetables (group)|f|2026-11-27
buprofezin|CODEX|tomato|1.0|x5c509a14-199b-f111-b8dc-70a8a5613865|Tomato|f|2026-11-27
buprofezin|CODEX|pepper|2.0|x5c509a14-199b-f111-b8dc-70a8a5613865|Peppers (subgroup)|f|2026-11-27
buprofezin|CODEX|cucumber|0.7|x5c509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
buprofezin|CODEX|strawberry|3.0|x5c509a14-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
buprofezin|CODEX|melon|0.7|x5c509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
chlorantraniliprole|CODEX|tomato|0.6|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
chlorantraniliprole|CODEX|pepper|0.6|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
chlorantraniliprole|CODEX|cucumber|0.3|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
chlorantraniliprole|CODEX|strawberry|1.0|x94509a14-199b-f111-b8dc-70a8a5613865|Berries and other small fruits|f|2026-11-27
chlorantraniliprole|CODEX|eggplant|0.6|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)|f|2026-11-27
chlorantraniliprole|CODEX|melon|0.3|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)|f|2026-11-27
chlorantraniliprole|CODEX|green_bean|0.8|x94509a14-199b-f111-b8dc-70a8a5613865|Beans with pods (Phaseolus spp.) (immature pods and succulent seeds)|f|2026-11-27
chlorfenapyr|CODEX|tomato|0.4|xab509a14-199b-f111-b8dc-70a8a5613865|Tomato|f|2026-11-27
chlorfenapyr|CODEX|pepper|0.3|xab509a14-199b-f111-b8dc-70a8a5613865|Peppers (subgroup)|f|2026-11-27
chlorfenapyr|CODEX|melon|0.4|xab509a14-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)|f|2026-11-27
chlorothalonil|CODEX|tomato|5.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Tomato|f|2026-11-27
chlorothalonil|CODEX|pepper|7.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Peppers (subgroup)|f|2026-11-27
chlorothalonil|CODEX|cucumber|3.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Cucumber|f|2026-11-27
chlorothalonil|CODEX|strawberry|5.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Strawberry|f|2026-11-27
chlorothalonil|CODEX|melon|2.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)|f|2026-11-27
abamectin|US|tomato|0.07|c449|Vegetable, fruiting, group 8-10|f|2026-11-27
abamectin|US|pepper|0.07|c449|Vegetable, fruiting, group 8-10|f|2026-11-27
abamectin|US|eggplant|0.07|c449|Vegetable, fruiting, group 8-10|f|2026-11-27
abamectin|US|cucumber|0.005|c449|Vegetable, cucurbit, group 9|f|2026-11-27
abamectin|US|melon|0.005|c449|Vegetable, cucurbit, group 9|f|2026-11-27
abamectin|US|green_bean|0.08|c449|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
abamectin|US|strawberry|0.05|c449|Berry, low growing, subgroup 13-07G|f|2026-11-27
emamectin benzoate|US|tomato|0.02|c505|Vegetable, fruiting, group 8-10|f|2026-11-27
emamectin benzoate|US|pepper|0.02|c505|Vegetable, fruiting, group 8-10|f|2026-11-27
emamectin benzoate|US|eggplant|0.02|c505|Vegetable, fruiting, group 8-10|f|2026-11-27
emamectin benzoate|US|cucumber|0.02|c505|Vegetable, cucurbit, group 9|f|2026-11-27
emamectin benzoate|US|melon|0.02|c505|Vegetable, cucurbit, group 9|f|2026-11-27
mandipropamid|US|tomato|1.0|c637|Vegetable, fruiting, group 8-10|f|2026-11-27
mandipropamid|US|pepper|1.0|c637|Vegetable, fruiting, group 8-10|f|2026-11-27
mandipropamid|US|eggplant|1.0|c637|Vegetable, fruiting, group 8-10|f|2026-11-27
mandipropamid|US|cucumber|0.6|c637|Vegetable, cucurbit, group 9|f|2026-11-27
mandipropamid|US|melon|0.6|c637|Vegetable, cucurbit, group 9|f|2026-11-27
mandipropamid|US|green_bean|0.9|c637|Bean (Phaseolus spp.), edible podded|f|2026-11-27
chlorantraniliprole|US|tomato|1.4|c628|Vegetable, fruiting, group 8-10|f|2026-11-27
chlorantraniliprole|US|pepper|1.4|c628|Vegetable, fruiting, group 8-10|f|2026-11-27
chlorantraniliprole|US|eggplant|1.4|c628|Vegetable, fruiting, group 8-10|f|2026-11-27
chlorantraniliprole|US|cucumber|0.5|c628|Vegetable, cucurbit, group 9|f|2026-11-27
chlorantraniliprole|US|melon|0.5|c628|Vegetable, cucurbit, group 9|f|2026-11-27
chlorantraniliprole|US|strawberry|1.0|c628|Berry, low growing, subgroup 13-07G|f|2026-11-27
cyantraniliprole|US|tomato|2.0|c672|Vegetable, fruiting, group 8-10|f|2026-11-27
cyantraniliprole|US|pepper|2.0|c672|Vegetable, fruiting, group 8-10|f|2026-11-27
cyantraniliprole|US|eggplant|2.0|c672|Vegetable, fruiting, group 8-10|f|2026-11-27
cyantraniliprole|US|cucumber|0.7|c672|Vegetable, cucurbit, group 9|f|2026-11-27
cyantraniliprole|US|melon|0.7|c672|Vegetable, cucurbit, group 9|f|2026-11-27
cyantraniliprole|US|strawberry|1.5|c672|Strawberry|f|2026-11-27
cyantraniliprole|US|green_bean|2.0|c672|Vegetable, legume, bean, edible podded, subgroup 6-22A|f|2026-11-27
spinosad|US|tomato|0.4|c495|Vegetable, fruiting, group 8-10|f|2026-11-27
spinosad|US|pepper|0.4|c495|Vegetable, fruiting, group 8-10|f|2026-11-27
spinosad|US|eggplant|0.4|c495|Vegetable, fruiting, group 8-10|f|2026-11-27
spinosad|US|cucumber|0.3|c495|Vegetable, cucurbit, group 9|f|2026-11-27
spinosad|US|melon|0.3|c495|Vegetable, cucurbit, group 9|f|2026-11-27
spinosad|US|strawberry|0.9|c495|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
spinosad|US|green_bean|0.3|c495|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
spinetoram|US|tomato|0.4|c635|Vegetable, fruiting, group 8-10|f|2026-11-27
spinetoram|US|pepper|0.4|c635|Vegetable, fruiting, group 8-10|f|2026-11-27
spinetoram|US|eggplant|0.4|c635|Vegetable, fruiting, group 8-10|f|2026-11-27
spinetoram|US|cucumber|0.3|c635|Vegetable, cucurbit, group 9|f|2026-11-27
spinetoram|US|melon|0.3|c635|Vegetable, cucurbit, group 9|f|2026-11-27
spinetoram|US|strawberry|0.9|c635|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
spinetoram|US|green_bean|0.3|c635|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
indoxacarb|US|tomato|0.5|c564|Vegetable, fruiting, group 8-10|f|2026-11-27
indoxacarb|US|pepper|0.5|c564|Vegetable, fruiting, group 8-10|f|2026-11-27
indoxacarb|US|eggplant|0.5|c564|Vegetable, fruiting, group 8-10|f|2026-11-27
indoxacarb|US|cucumber|0.6|c564|Vegetable, cucurbit, group 9|f|2026-11-27
indoxacarb|US|melon|0.6|c564|Vegetable, cucurbit, group 9|f|2026-11-27
indoxacarb|US|strawberry|4.0|c564|Strawberry|f|2026-11-27
indoxacarb|US|green_bean|0.9|c564|Vegetable, legume, bean, edible podded, subgroup 6-22A|f|2026-11-27
methoxyfenozide|US|tomato|2.0|c544|Vegetable, fruiting, group 8-10|f|2026-11-27
methoxyfenozide|US|pepper|2.0|c544|Vegetable, fruiting, group 8-10|f|2026-11-27
methoxyfenozide|US|eggplant|2.0|c544|Vegetable, fruiting, group 8-10|f|2026-11-27
methoxyfenozide|US|cucumber|0.3|c544|Vegetable, cucurbit, group 9|f|2026-11-27
methoxyfenozide|US|melon|0.3|c544|Vegetable, cucurbit, group 9|f|2026-11-27
methoxyfenozide|US|strawberry|2.0|c544|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
methoxyfenozide|US|green_bean|2.0|c544|Edible podded bean subgroup 6-22A|f|2026-11-27
imidacloprid|US|tomato|1.0|c472|Vegetable, fruiting, group 8|f|2026-11-27
imidacloprid|US|pepper|1.0|c472|Vegetable, fruiting, group 8|f|2026-11-27
imidacloprid|US|eggplant|1.0|c472|Vegetable, fruiting, group 8|f|2026-11-27
imidacloprid|US|cucumber|0.5|c472|Vegetable, cucurbit, group 9|f|2026-11-27
imidacloprid|US|melon|0.5|c472|Vegetable, cucurbit, group 9|f|2026-11-27
imidacloprid|US|strawberry|0.5|c472|Strawberry|f|2026-11-27
spirotetramat|US|tomato|2.5|c641|Vegetable, fruiting, group 8-10|f|2026-11-27
spirotetramat|US|pepper|2.5|c641|Vegetable, fruiting, group 8-10|f|2026-11-27
spirotetramat|US|eggplant|2.5|c641|Vegetable, fruiting, group 8-10|f|2026-11-27
spirotetramat|US|cucumber|0.3|c641|Vegetable, cucurbit, group 9|f|2026-11-27
spirotetramat|US|melon|0.3|c641|Vegetable, cucurbit, group 9|f|2026-11-27
spirotetramat|US|strawberry|0.4|c641|Strawberry — لا تسجيلات أمريكية لهذه السلعة (حاشية اللائحة)|f|2026-11-27
lambda-cyhalothrin|US|tomato|0.1|c438|Tomato|f|2026-11-27
lambda-cyhalothrin|US|pepper|0.2|c438|Vegetable, fruiting, group 8|f|2026-11-27
lambda-cyhalothrin|US|eggplant|0.2|c438|Vegetable, fruiting, group 8|f|2026-11-27
lambda-cyhalothrin|US|cucumber|0.05|c438|Vegetable, cucurbit, group 9|f|2026-11-27
lambda-cyhalothrin|US|melon|0.05|c438|Vegetable, cucurbit, group 9|f|2026-11-27
lambda-cyhalothrin|US|green_bean|0.2|c438|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
alpha-cypermethrin|US|tomato|0.2|c418|Vegetable, fruiting, group 8-10 — سيبرمثرين وأيزومراته|f|2026-11-27
alpha-cypermethrin|US|pepper|0.2|c418|Vegetable, fruiting, group 8-10 — سيبرمثرين وأيزومراته|f|2026-11-27
alpha-cypermethrin|US|eggplant|0.2|c418|Vegetable, fruiting, group 8-10 — سيبرمثرين وأيزومراته|f|2026-11-27
alpha-cypermethrin|US|cucumber|0.2|c418|Vegetable, cucurbit, group 9 — سيبرمثرين وأيزومراته|f|2026-11-27
alpha-cypermethrin|US|melon|0.2|c418|Vegetable, cucurbit, group 9 — سيبرمثرين وأيزومراته|f|2026-11-27
alpha-cypermethrin|US|green_bean|0.7|c418|Bean, green, edible podded — سيبرمثرين وأيزومراته (جدول 2)|f|2026-11-27
chlorfenapyr|US|tomato|2.0|c513|Vegetable, fruiting, group 8-10|f|2026-11-27
chlorfenapyr|US|pepper|2.0|c513|Vegetable, fruiting, group 8-10|f|2026-11-27
chlorfenapyr|US|eggplant|2.0|c513|Vegetable, fruiting, group 8-10|f|2026-11-27
chlorfenapyr|US|cucumber|0.5|c513|Cucumber|f|2026-11-27
hexythiazox|US|strawberry|6.0|c448|Berry, low growing, subgroup 13-07G|f|2026-11-27
hexythiazox|US|tomato|0.5|c448|Tomato|f|2026-11-27
hexythiazox|US|pepper|1.5|c448|Pepper/eggplant subgroup 8-10B|f|2026-11-27
hexythiazox|US|eggplant|1.5|c448|Pepper/eggplant subgroup 8-10B|f|2026-11-27
etoxazole|US|pepper|0.2|c593|Pepper/eggplant subgroup 8-10B|f|2026-11-27
etoxazole|US|eggplant|0.2|c593|Pepper/eggplant subgroup 8-10B|f|2026-11-27
etoxazole|US|tomato|0.2|c593|Tomato|f|2026-11-27
etoxazole|US|cucumber|0.02|c593|Squash/cucumber subgroup 9B|f|2026-11-27
etoxazole|US|melon|0.2|c593|Melon subgroup 9A|f|2026-11-27
etoxazole|US|strawberry|0.5|c593|Berry, low growing, subgroup 13-07G|f|2026-11-27
fenpyroximate|US|tomato|0.2|c566|Vegetable, fruiting, group 8-10|f|2026-11-27
fenpyroximate|US|pepper|0.2|c566|Vegetable, fruiting, group 8-10|f|2026-11-27
fenpyroximate|US|eggplant|0.2|c566|Vegetable, fruiting, group 8-10|f|2026-11-27
fenpyroximate|US|cucumber|0.4|c566|Squash/cucumber subgroup 9B|f|2026-11-27
fenpyroximate|US|melon|0.1|c566|Melon subgroup 9A|f|2026-11-27
fenpyroximate|US|strawberry|1.0|c566|Berry, low growing, subgroup 13-07G|f|2026-11-27
fenpyroximate|US|green_bean|0.4|c566|Bean, snap, succulent|f|2026-11-27
bifenazate|US|tomato|4.0|c572|Vegetable, fruiting, group 8-10|f|2026-11-27
bifenazate|US|pepper|4.0|c572|Vegetable, fruiting, group 8-10|f|2026-11-27
bifenazate|US|eggplant|4.0|c572|Vegetable, fruiting, group 8-10|f|2026-11-27
bifenazate|US|cucumber|0.75|c572|Vegetable, cucurbit, group 9|f|2026-11-27
bifenazate|US|melon|0.75|c572|Vegetable, cucurbit, group 9|f|2026-11-27
bifenazate|US|strawberry|1.5|c572|Strawberry|f|2026-11-27
bifenazate|US|green_bean|6.0|c572|Vegetable, legume, edible-podded, subgroup 6A|f|2026-11-27
pyridaben|US|strawberry|2.5|c494|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
pyridaben|US|cucumber|0.5|c494|Cucumber|f|2026-11-27
pyridaben|US|tomato|0.15|c494|Tomato|f|2026-11-27
chlorpyrifos|US|cucumber|0.05|c342|Cucumber|f|2026-11-27
chlorpyrifos|US|pepper|1.0|c342|Pepper|f|2026-11-27
chlorpyrifos|US|strawberry|0.2|c342|Strawberry|f|2026-11-27
methomyl|US|pepper|2.0|c253|Pepper, bell|f|2026-11-27
methomyl|US|tomato|1.0|c253|Tomato|f|2026-11-27
methomyl|US|eggplant|0.2|c253|Vegetable, fruiting, group 8|f|2026-11-27
methomyl|US|cucumber|0.2|c253|Vegetable, cucurbit, group 9|f|2026-11-27
methomyl|US|melon|0.2|c253|Vegetable, cucurbit, group 9|f|2026-11-27
dimethoate|US|tomato|2.0|c204|Tomato|f|2026-11-27
dimethoate|US|pepper|2.0|c204|Pepper|f|2026-11-27
dimethoate|US|melon|1.0|c204|Melon|f|2026-11-27
dimethoate|US|green_bean|2.0|c204|Bean, snap, succulent|f|2026-11-27
oxamyl|US|tomato|2.0|c303|Tomato|f|2026-11-27
oxamyl|US|pepper|2.0|c303|Pepper, bell — الفلفل الحار 5.0|f|2026-11-27
oxamyl|US|eggplant|2.0|c303|Eggplant|f|2026-11-27
oxamyl|US|cucumber|2.0|c303|Cucumber|f|2026-11-27
oxamyl|US|melon|2.0|c303|Cantaloupe|f|2026-11-27
fosthiazate|US|tomato|0.02|c596|Tomato|f|2026-11-27
fluopyram|US|pepper|4.0|c661|Pepper/eggplant subgroup 8-10B|f|2026-11-27
fluopyram|US|eggplant|4.0|c661|Pepper/eggplant subgroup 8-10B|f|2026-11-27
fluopyram|US|tomato|1.0|c661|Tomato subgroup 8-10A|f|2026-11-27
fluopyram|US|cucumber|0.6|c661|Squash/cucumber subgroup 9B|f|2026-11-27
fluopyram|US|melon|1.0|c661|Melon subgroup 9A|f|2026-11-27
fluopyram|US|strawberry|2.0|c661|Berry, low growing, except cranberry, subgroup 13-07G|f|2026-11-27
fluopyram|US|green_bean|4.0|c661|Vegetable, legume, bean, edible podded, subgroup 6-22A|f|2026-11-27
azoxystrobin|US|pepper|3.0|c507|Pepper/eggplant subgroup 8-10B|f|2026-11-27
azoxystrobin|US|eggplant|3.0|c507|Pepper/eggplant subgroup 8-10B|f|2026-11-27
azoxystrobin|US|tomato|0.2|c507|Tomato subgroup 8-10A|f|2026-11-27
azoxystrobin|US|cucumber|0.3|c507|Vegetable, cucurbit, group 9|f|2026-11-27
azoxystrobin|US|melon|0.3|c507|Vegetable, cucurbit, group 9|f|2026-11-27
azoxystrobin|US|strawberry|10.0|c507|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
azoxystrobin|US|green_bean|3.0|c507|Vegetable, legume, edible podded, subgroup 6A, except soybean|f|2026-11-27
pyraclostrobin|US|tomato|1.4|c582|Vegetable, fruiting, group 8-10|f|2026-11-27
pyraclostrobin|US|pepper|1.4|c582|Vegetable, fruiting, group 8-10|f|2026-11-27
pyraclostrobin|US|eggplant|1.4|c582|Vegetable, fruiting, group 8-10|f|2026-11-27
pyraclostrobin|US|strawberry|1.2|c582|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
pyraclostrobin|US|cucumber|0.5|c582|Vegetable, cucurbit, group 9|f|2026-11-27
pyraclostrobin|US|melon|0.5|c582|Vegetable, cucurbit, group 9|f|2026-11-27
pyraclostrobin|US|green_bean|0.5|c582|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
trifloxystrobin|US|tomato|0.5|c555|Vegetable, fruiting, group 8-10|f|2026-11-27
trifloxystrobin|US|pepper|0.5|c555|Vegetable, fruiting, group 8-10|f|2026-11-27
trifloxystrobin|US|eggplant|0.5|c555|Vegetable, fruiting, group 8-10|f|2026-11-27
trifloxystrobin|US|cucumber|0.5|c555|Vegetable, cucurbit, group 9|f|2026-11-27
trifloxystrobin|US|melon|0.5|c555|Vegetable, cucurbit, group 9|f|2026-11-27
trifloxystrobin|US|strawberry|1.5|c555|Berry, low growing, subgroup 13-07G|f|2026-11-27
trifloxystrobin|US|green_bean|1.5|c555|Vegetable, legume, bean, edible podded, subgroup 6-22A|f|2026-11-27
difenoconazole|US|tomato|0.6|c475|Vegetable, fruiting, group 8-10|f|2026-11-27
difenoconazole|US|pepper|0.6|c475|Vegetable, fruiting, group 8-10|f|2026-11-27
difenoconazole|US|eggplant|0.6|c475|Vegetable, fruiting, group 8-10|f|2026-11-27
difenoconazole|US|cucumber|0.7|c475|Vegetable, cucurbit, group 9|f|2026-11-27
difenoconazole|US|melon|0.7|c475|Vegetable, cucurbit, group 9|f|2026-11-27
difenoconazole|US|strawberry|2.5|c475|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
tebuconazole|US|tomato|1.3|c474|Vegetable, fruiting, group 8-10|f|2026-11-27
tebuconazole|US|pepper|1.3|c474|Vegetable, fruiting, group 8-10|f|2026-11-27
tebuconazole|US|eggplant|1.3|c474|Vegetable, fruiting, group 8-10|f|2026-11-27
tebuconazole|US|cucumber|0.4|c474|Vegetable, cucurbit, group 9|f|2026-11-27
tebuconazole|US|melon|0.4|c474|Vegetable, cucurbit, group 9|f|2026-11-27
tebuconazole|US|green_bean|0.1|c474|Bean, succulent|f|2026-11-27
myclobutanil|US|pepper|4.0|c443|Vegetable, fruiting, group 8, except tomato|f|2026-11-27
myclobutanil|US|eggplant|4.0|c443|Vegetable, fruiting, group 8, except tomato|f|2026-11-27
myclobutanil|US|tomato|0.3|c443|Tomato|f|2026-11-27
myclobutanil|US|cucumber|0.2|c443|Vegetable, cucurbit, group 9|f|2026-11-27
myclobutanil|US|melon|0.2|c443|Vegetable, cucurbit, group 9|f|2026-11-27
myclobutanil|US|strawberry|0.5|c443|Strawberry|f|2026-11-27
myclobutanil|US|green_bean|1.0|c443|Bean, snap, succulent|f|2026-11-27
tetraconazole|US|tomato|0.3|c557|Vegetable, fruiting, group 8-10|f|2026-11-27
tetraconazole|US|pepper|0.3|c557|Vegetable, fruiting, group 8-10|f|2026-11-27
tetraconazole|US|eggplant|0.3|c557|Vegetable, fruiting, group 8-10|f|2026-11-27
tetraconazole|US|cucumber|0.15|c557|Vegetable, cucurbit, group 9|f|2026-11-27
tetraconazole|US|melon|0.15|c557|Vegetable, cucurbit, group 9|f|2026-11-27
tetraconazole|US|strawberry|0.25|c557|Low growing berry subgroup 13-07G, except cranberry|f|2026-11-27
boscalid|US|tomato|3.0|c589|Vegetable, fruiting, group 8-10|f|2026-11-27
boscalid|US|pepper|3.0|c589|Vegetable, fruiting, group 8-10|f|2026-11-27
boscalid|US|eggplant|3.0|c589|Vegetable, fruiting, group 8-10|f|2026-11-27
boscalid|US|cucumber|3.0|c589|Vegetable, cucurbit, group 9|f|2026-11-27
boscalid|US|melon|3.0|c589|Vegetable, cucurbit, group 9|f|2026-11-27
boscalid|US|strawberry|4.5|c589|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
boscalid|US|green_bean|5.0|c589|Vegetable, legume, edible podded subgroup 6A|f|2026-11-27
cyprodinil|US|strawberry|5.0|c532|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
cyprodinil|US|cucumber|0.7|c532|Vegetable, cucurbit, group 9|f|2026-11-27
cyprodinil|US|melon|0.7|c532|Vegetable, cucurbit, group 9|f|2026-11-27
cyprodinil|US|tomato|1.5|c532|Vegetable, fruiting, group 8-10|f|2026-11-27
cyprodinil|US|pepper|1.5|c532|Vegetable, fruiting, group 8-10|f|2026-11-27
cyprodinil|US|eggplant|1.5|c532|Vegetable, fruiting, group 8-10|f|2026-11-27
cyprodinil|US|green_bean|0.6|c532|Bean, succulent|f|2026-11-27
fludioxonil|US|pepper|0.5|c516|Vegetable, fruiting, group 8-10, except tomato|f|2026-11-27
fludioxonil|US|eggplant|0.5|c516|Vegetable, fruiting, group 8-10, except tomato|f|2026-11-27
fludioxonil|US|tomato|5.0|c516|Tomato|f|2026-11-27
fludioxonil|US|cucumber|0.45|c516|Vegetable, cucurbit, group 9|f|2026-11-27
fludioxonil|US|melon|0.45|c516|Vegetable, cucurbit, group 9|f|2026-11-27
fludioxonil|US|strawberry|3.0|c516|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
fludioxonil|US|green_bean|0.4|c516|Bean, succulent|f|2026-11-27
iprodione|US|strawberry|15.0|c399|Strawberry|f|2026-11-27
iprodione|US|green_bean|2.0|c399|Bean, succulent|f|2026-11-27
mancozeb|US|pepper|12.0|c176|Pepper|f|2026-11-27
mancozeb|US|tomato|2.5|c176|Tomato|f|2026-11-27
mancozeb|US|cucumber|2.0|c176|Vegetable, cucurbit, group 9|f|2026-11-27
mancozeb|US|melon|2.0|c176|Vegetable, cucurbit, group 9|f|2026-11-27
chlorothalonil|US|green_bean|5.0|c275|Bean, snap, succulent|f|2026-11-27
chlorothalonil|US|tomato|5.0|c275|Tomato|f|2026-11-27
chlorothalonil|US|cucumber|5.0|c275|Vegetable, cucurbit, group 9|f|2026-11-27
chlorothalonil|US|melon|5.0|c275|Vegetable, cucurbit, group 9|f|2026-11-27
chlorothalonil|US|pepper|6.0|c275|Vegetable, fruiting, group 8, except tomato|f|2026-11-27
chlorothalonil|US|eggplant|6.0|c275|Vegetable, fruiting, group 8, except tomato|f|2026-11-27
metalaxyl-m|US|tomato|1.0|c546|Vegetable, fruiting, group 8-10 — ميفينوكسام (180.546) — ميتالاكسيل-M|f|2026-11-27
metalaxyl-m|US|pepper|1.0|c546|Vegetable, fruiting, group 8-10 — ميفينوكسام (180.546) — ميتالاكسيل-M|f|2026-11-27
metalaxyl-m|US|eggplant|1.0|c546|Vegetable, fruiting, group 8-10 — ميفينوكسام (180.546) — ميتالاكسيل-M|f|2026-11-27
cymoxanil|US|tomato|0.2|c503|Vegetable, fruiting, group 8|f|2026-11-27
cymoxanil|US|pepper|0.2|c503|Vegetable, fruiting, group 8|f|2026-11-27
cymoxanil|US|eggplant|0.2|c503|Vegetable, fruiting, group 8|f|2026-11-27
cymoxanil|US|cucumber|0.05|c503|Vegetable, cucurbit, group 9|f|2026-11-27
cymoxanil|US|melon|0.05|c503|Vegetable, cucurbit, group 9|f|2026-11-27
dimethomorph|US|strawberry|0.9|c493|Strawberry|f|2026-11-27
dimethomorph|US|cucumber|0.5|c493|Vegetable, cucurbit, group 9|f|2026-11-27
dimethomorph|US|melon|0.5|c493|Vegetable, cucurbit, group 9|f|2026-11-27
dimethomorph|US|tomato|1.5|c493|Vegetable, fruiting, group 8|f|2026-11-27
dimethomorph|US|pepper|1.5|c493|Vegetable, fruiting, group 8|f|2026-11-27
dimethomorph|US|eggplant|1.5|c493|Vegetable, fruiting, group 8|f|2026-11-27
propamocarb|US|tomato|4.0|c499|Vegetable, fruiting, group 8-10|f|2026-11-27
propamocarb|US|pepper|4.0|c499|Vegetable, fruiting, group 8-10|f|2026-11-27
propamocarb|US|eggplant|4.0|c499|Vegetable, fruiting, group 8-10|f|2026-11-27
propamocarb|US|cucumber|1.5|c499|Vegetable, cucurbit, group 9|f|2026-11-27
propamocarb|US|melon|1.5|c499|Vegetable, cucurbit, group 9|f|2026-11-27
famoxadone|US|pepper|4.0|c587|Vegetable, fruiting, group 8-10, except tomato|f|2026-11-27
famoxadone|US|eggplant|4.0|c587|Vegetable, fruiting, group 8-10, except tomato|f|2026-11-27
famoxadone|US|tomato|1.0|c587|Tomato|f|2026-11-27
famoxadone|US|cucumber|0.3|c587|Vegetable, cucurbit, group 9|f|2026-11-27
famoxadone|US|melon|0.3|c587|Vegetable, cucurbit, group 9|f|2026-11-27
thiophanate-methyl|US|green_bean|2.0|c371|Bean, snap, succulent|f|2026-11-27
thiophanate-methyl|US|strawberry|7.0|c371|Strawberry|f|2026-11-27
thiophanate-methyl|US|cucumber|1.0|c371|Vegetable, cucurbit, group 9|f|2026-11-27
thiophanate-methyl|US|melon|1.0|c371|Vegetable, cucurbit, group 9|f|2026-11-27
fluazinam|US|tomato|1.5|c574|Tomato subgroup 8-10A|f|2026-11-27
fluazinam|US|pepper|0.09|c574|Pepper/eggplant subgroup 8-10B|f|2026-11-27
fluazinam|US|eggplant|0.09|c574|Pepper/eggplant subgroup 8-10B|f|2026-11-27
fluazinam|US|cucumber|0.07|c574|Vegetable, cucurbit, group 9|f|2026-11-27
fluazinam|US|melon|0.07|c574|Vegetable, cucurbit, group 9|f|2026-11-27
fluazinam|US|green_bean|0.1|c574|Bean, green, edible podded|f|2026-11-27
cyflufenamid|US|strawberry|0.2|c667|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
cyflufenamid|US|cucumber|0.1|c667|Vegetable, cucurbit, group 9|f|2026-11-27
cyflufenamid|US|melon|0.1|c667|Vegetable, cucurbit, group 9|f|2026-11-27
cyflufenamid|US|tomato|0.2|c667|Vegetable, fruiting, group 8-10|f|2026-11-27
cyflufenamid|US|pepper|0.2|c667|Vegetable, fruiting, group 8-10|f|2026-11-27
cyflufenamid|US|eggplant|0.2|c667|Vegetable, fruiting, group 8-10|f|2026-11-27
ametoctradin|US|tomato|1.5|c663|Vegetable, fruiting, group 8-10|f|2026-11-27
ametoctradin|US|pepper|1.5|c663|Vegetable, fruiting, group 8-10|f|2026-11-27
ametoctradin|US|eggplant|1.5|c663|Vegetable, fruiting, group 8-10|f|2026-11-27
ametoctradin|US|cucumber|3.0|c663|Vegetable, cucurbit, group 9|f|2026-11-27
ametoctradin|US|melon|3.0|c663|Vegetable, cucurbit, group 9|f|2026-11-27
acetamiprid|US|strawberry|0.6|c578|Berry, low growing subgroups 13-07G|f|2026-11-27
acetamiprid|US|cucumber|0.5|c578|Vegetable, cucurbit, group 9|f|2026-11-27
acetamiprid|US|melon|0.5|c578|Vegetable, cucurbit, group 9|f|2026-11-27
acetamiprid|US|tomato|0.2|c578|Vegetable, fruiting, group 8-10|f|2026-11-27
acetamiprid|US|pepper|0.2|c578|Vegetable, fruiting, group 8-10|f|2026-11-27
acetamiprid|US|eggplant|0.2|c578|Vegetable, fruiting, group 8-10|f|2026-11-27
acetamiprid|US|green_bean|0.6|c578|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
thiamethoxam|US|tomato|0.25|c565|Vegetable, fruiting, group 8|f|2026-11-27
thiamethoxam|US|pepper|0.25|c565|Vegetable, fruiting, group 8|f|2026-11-27
thiamethoxam|US|eggplant|0.25|c565|Vegetable, fruiting, group 8|f|2026-11-27
thiamethoxam|US|cucumber|0.2|c565|Vegetable, cucurbit, group 9|f|2026-11-27
thiamethoxam|US|melon|0.2|c565|Vegetable, cucurbit, group 9|f|2026-11-27
thiamethoxam|US|strawberry|0.3|c565|Berry, low growing, subgroup 13-07G, except cranberry|f|2026-11-27
thiamethoxam|US|green_bean|0.02|c565|Bean, succulent|f|2026-11-27
dinotefuran|US|tomato|0.7|c603|Vegetable, fruiting, group 8|f|2026-11-27
dinotefuran|US|pepper|0.7|c603|Vegetable, fruiting, group 8|f|2026-11-27
dinotefuran|US|eggplant|0.7|c603|Vegetable, fruiting, group 8|f|2026-11-27
dinotefuran|US|cucumber|0.5|c603|Vegetable, cucurbit, group 9|f|2026-11-27
dinotefuran|US|melon|0.5|c603|Vegetable, cucurbit, group 9|f|2026-11-27
pyriproxyfen|US|tomato|0.8|c510|Vegetable, fruiting, group 8-10|f|2026-11-27
pyriproxyfen|US|pepper|0.8|c510|Vegetable, fruiting, group 8-10|f|2026-11-27
pyriproxyfen|US|eggplant|0.8|c510|Vegetable, fruiting, group 8-10|f|2026-11-27
pyriproxyfen|US|cucumber|0.1|c510|Vegetable, cucurbit, group 9|f|2026-11-27
pyriproxyfen|US|melon|0.1|c510|Vegetable, cucurbit, group 9|f|2026-11-27
pyriproxyfen|US|strawberry|0.3|c510|Strawberry|f|2026-11-27
buprofezin|US|tomato|2.0|c511|Vegetable, fruiting, group 8-10|f|2026-11-27
buprofezin|US|pepper|2.0|c511|Vegetable, fruiting, group 8-10|f|2026-11-27
buprofezin|US|eggplant|2.0|c511|Vegetable, fruiting, group 8-10|f|2026-11-27
buprofezin|US|cucumber|0.5|c511|Vegetable, cucurbit, group 9|f|2026-11-27
buprofezin|US|melon|0.5|c511|Vegetable, cucurbit, group 9|f|2026-11-27
buprofezin|US|strawberry|2.5|c511|Berry, low growing, subgroup 13-07G|f|2026-11-27
buprofezin|US|green_bean|0.02|c511|Bean, green, edible podded|f|2026-11-27
spiromesifen|US|tomato|0.45|c607|Vegetable, fruiting, group 8|f|2026-11-27
spiromesifen|US|pepper|0.45|c607|Vegetable, fruiting, group 8|f|2026-11-27
spiromesifen|US|eggplant|0.45|c607|Vegetable, fruiting, group 8|f|2026-11-27
spiromesifen|US|cucumber|0.1|c607|Vegetable, cucurbit, group 9|f|2026-11-27
spiromesifen|US|melon|0.1|c607|Vegetable, cucurbit, group 9|f|2026-11-27
spiromesifen|US|strawberry|2.0|c607|Berry and small fruit, low growing berry, subgroup 13-07G|f|2026-11-27
spiromesifen|US|green_bean|0.8|c607|Bean, edible podded|f|2026-11-27
flonicamid|US|tomato|0.4|c613|Tomato subgroup 8-10A|f|2026-11-27
flonicamid|US|pepper|3.0|c613|Pepper/Eggplant subgroup 8-10B|f|2026-11-27
flonicamid|US|eggplant|3.0|c613|Pepper/Eggplant subgroup 8-10B|f|2026-11-27
flonicamid|US|cucumber|1.5|c613|Vegetable, cucurbit, group 9|f|2026-11-27
flonicamid|US|melon|1.5|c613|Vegetable, cucurbit, group 9|f|2026-11-27
flonicamid|US|strawberry|2.0|c613|Berry, low-growing, subgroup 13-07G|f|2026-11-27
flonicamid|US|green_bean|4.0|c613|Vegetable, legume, bean, edible podded, subgroup 6-22A|f|2026-11-27
flupyradifurone|US|tomato|1.5|c679|Vegetable, fruiting, group 8-10|f|2026-11-27
flupyradifurone|US|pepper|1.5|c679|Vegetable, fruiting, group 8-10|f|2026-11-27
flupyradifurone|US|eggplant|1.5|c679|Vegetable, fruiting, group 8-10|f|2026-11-27
flupyradifurone|US|cucumber|0.4|c679|Vegetable, cucurbit, group 9|f|2026-11-27
flupyradifurone|US|melon|0.4|c679|Vegetable, cucurbit, group 9|f|2026-11-27
flupyradifurone|US|strawberry|1.5|c679|Berry, low growing, except cranberry subgroup 13-07G|f|2026-11-27
flupyradifurone|US|green_bean|3.0|c679|Vegetable, legume, edible podded, subgroup 6A|f|2026-11-27
sulfoxaflor|US|tomato|0.7|c668|Vegetable, fruiting, group 8-10|f|2026-11-27
sulfoxaflor|US|pepper|0.7|c668|Vegetable, fruiting, group 8-10|f|2026-11-27
sulfoxaflor|US|eggplant|0.7|c668|Vegetable, fruiting, group 8-10|f|2026-11-27
sulfoxaflor|US|cucumber|0.4|c668|Vegetable, cucurbit, group 9|f|2026-11-27
sulfoxaflor|US|melon|0.4|c668|Vegetable, cucurbit, group 9|f|2026-11-27
sulfoxaflor|US|strawberry|0.7|c668|Berry, low growing, subgroup 13-7G|f|2026-11-27
sulfoxaflor|US|green_bean|4.0|c668|Bean, succulent|f|2026-11-27
pymetrozine|US|tomato|0.2|c556|Vegetable, fruiting, group 8|f|2026-11-27
pymetrozine|US|pepper|0.2|c556|Vegetable, fruiting, group 8|f|2026-11-27
pymetrozine|US|eggplant|0.2|c556|Vegetable, fruiting, group 8|f|2026-11-27
pymetrozine|US|cucumber|0.1|c556|Vegetable, cucurbit, group 9|f|2026-11-27
pymetrozine|US|melon|0.1|c556|Vegetable, cucurbit, group 9|f|2026-11-27
acequinocyl|US|tomato|0.7|c599|Vegetable, fruiting, group 8-10|f|2026-11-27
acequinocyl|US|pepper|0.7|c599|Vegetable, fruiting, group 8-10|f|2026-11-27
acequinocyl|US|eggplant|0.7|c599|Vegetable, fruiting, group 8-10|f|2026-11-27
acequinocyl|US|cucumber|0.3|c599|Vegetable, cucurbit, group 9|f|2026-11-27
acequinocyl|US|melon|0.3|c599|Vegetable, cucurbit, group 9|f|2026-11-27
acequinocyl|US|strawberry|0.5|c599|Berry, low growing, subgroup 13-07G|f|2026-11-27
acequinocyl|US|green_bean|0.25|c599|Bean, edible podded|f|2026-11-27
malathion|US|eggplant|8.0|c111|Eggplant|f|2026-11-27
malathion|US|tomato|8.0|c111|Tomato|f|2026-11-27
malathion|US|pepper|8.0|c111|Pepper|f|2026-11-27
malathion|US|cucumber|8.0|c111|Cucumber|f|2026-11-27
malathion|US|melon|8.0|c111|Melon|f|2026-11-27
malathion|US|strawberry|8.0|c111|Strawberry|f|2026-11-27
deltamethrin|US|tomato|0.3|c435|Tomato|f|2026-11-27
deltamethrin|US|pepper|0.3|c435|Vegetable, fruiting, group 8|f|2026-11-27
deltamethrin|US|eggplant|0.3|c435|Vegetable, fruiting, group 8|f|2026-11-27
deltamethrin|US|cucumber|0.2|c435|Vegetable, cucurbit, group 9|f|2026-11-27
deltamethrin|US|melon|0.2|c435|Vegetable, cucurbit, group 9|f|2026-11-27
fosetyl|US|pepper|0.01|c415|Pepper/eggplant, subgroup 8-10B — لا تسجيلات أمريكية (حاشية اللائحة)|f|2026-11-27
fosetyl|US|eggplant|0.01|c415|Pepper/eggplant, subgroup 8-10B — لا تسجيلات أمريكية (حاشية اللائحة)|f|2026-11-27
fosetyl|US|tomato|3.0|c415|Tomato|f|2026-11-27
fosetyl|US|strawberry|75.0|c415|Strawberry|f|2026-11-27
fosetyl|US|cucumber|15.0|c415|Vegetable, cucurbit, group 9|f|2026-11-27
fosetyl|US|melon|15.0|c415|Vegetable, cucurbit, group 9|f|2026-11-27
quinoxyfen|US|tomato|1.7|c588|Vegetable, fruiting, group 8-10|f|2026-11-27
quinoxyfen|US|pepper|1.7|c588|Vegetable, fruiting, group 8-10|f|2026-11-27
quinoxyfen|US|eggplant|1.7|c588|Vegetable, fruiting, group 8-10|f|2026-11-27
quinoxyfen|US|melon|0.08|c588|Melon subgroup 9A|f|2026-11-27
quinoxyfen|US|strawberry|1.0|c588|Berry, low growing, subgroup 13-07G|f|2026-11-27
abamectin|EU|tomato|0.015|e8|Tomatoes — Reg. (EU) 2023/198 — تطبيق 20/08/2023|f|2026-09-13
abamectin|EU|pepper|0.03|e8|Sweet peppers/bell peppers — Reg. (EU) 2023/198 — تطبيق 20/08/2023|f|2026-09-13
abamectin|EU|eggplant|0.09|e8|Aubergines/eggplants — Reg. (EU) 2023/198 — تطبيق 20/08/2023|f|2026-09-13
abamectin|EU|cucumber|0.02|e8|Cucumbers — Reg. (EU) 2023/198 — تطبيق 20/08/2023|f|2026-09-13
abamectin|EU|melon|0.01|e8|Melons — Reg. (EU) 2023/198 — تطبيق 20/08/2023|t|2026-09-13
abamectin|EU|strawberry|0.08|e8|strawberries — Reg. (EU) 2023/198 — تطبيق 20/08/2023|f|2026-09-13
abamectin|EU|green_bean|0.08|e8|Beans (with pods) — Reg. (EU) 2023/198 — تطبيق 20/08/2023|f|2026-09-13
emamectin benzoate|EU|tomato|0.02|e3010|Tomatoes — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
emamectin benzoate|EU|pepper|0.02|e3010|Sweet peppers/bell peppers — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
emamectin benzoate|EU|eggplant|0.02|e3010|Aubergines/eggplants — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
emamectin benzoate|EU|cucumber|0.007|e3010|Cucumbers — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
emamectin benzoate|EU|melon|0.008|e3010|Melons — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
emamectin benzoate|EU|strawberry|0.05|e3010|strawberries — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
emamectin benzoate|EU|green_bean|0.03|e3010|Beans (with pods) — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|tomato|0.6|e2670|Tomatoes — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|pepper|1.0|e2670|Sweet peppers/bell peppers — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|eggplant|0.6|e2670|Aubergines/eggplants — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|cucumber|0.3|e2670|Cucumbers — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|melon|0.3|e2670|Melons — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|strawberry|1.0|e2670|strawberries — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
chlorantraniliprole|EU|green_bean|0.8|e2670|Beans (with pods) — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
cyantraniliprole|EU|tomato|1.0|e2351|Tomatoes — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
cyantraniliprole|EU|pepper|1.5|e2351|Sweet peppers/bell peppers — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
cyantraniliprole|EU|eggplant|1.0|e2351|Aubergines/eggplants — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
cyantraniliprole|EU|cucumber|0.4|e2351|Cucumbers — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
cyantraniliprole|EU|melon|0.4|e2351|Melons — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
cyantraniliprole|EU|strawberry|1.5|e2351|strawberries — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
cyantraniliprole|EU|green_bean|1.5|e2351|Beans (with pods) — Reg (EU) 2025/1164 — تطبيق 06/07/2025|f|2026-09-13
spinosad|EU|tomato|0.7|e373|Tomatoes — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinosad|EU|pepper|0.6|e373|Sweet peppers/bell peppers — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinosad|EU|eggplant|0.7|e373|Aubergines/eggplants — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinosad|EU|cucumber|0.3|e373|Cucumbers — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinosad|EU|melon|1.0|e373|Melons — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinosad|EU|strawberry|0.3|e373|strawberries — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinosad|EU|green_bean|0.3|e373|Beans (with pods) — Reg. (EU) 2022/1406 — تطبيق 28/02/2023|f|2026-09-13
spinetoram|EU|tomato|0.06|e2691|Tomatoes — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
spinetoram|EU|pepper|0.4|e2691|Sweet peppers/bell peppers — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
spinetoram|EU|eggplant|0.05|e2691|Aubergines/eggplants — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
spinetoram|EU|cucumber|0.06|e2691|Cucumbers — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
spinetoram|EU|melon|0.03|e2691|Melons — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
spinetoram|EU|strawberry|0.2|e2691|strawberries — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
spinetoram|EU|green_bean|0.05|e2691|Beans (with pods) — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
indoxacarb|EU|tomato|0.01|e132|Tomatoes — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
indoxacarb|EU|pepper|0.01|e132|Sweet peppers/bell peppers — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
indoxacarb|EU|eggplant|0.01|e132|Aubergines/eggplants — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
indoxacarb|EU|cucumber|0.01|e132|Cucumbers — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
indoxacarb|EU|melon|0.01|e132|Melons — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
indoxacarb|EU|strawberry|0.01|e132|strawberries — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
indoxacarb|EU|green_bean|0.01|e132|Beans (with pods) — Reg. (EU) 2024/376 — تطبيق 14/08/2024|t|2026-09-13
lufenuron|EU|tomato|0.4|e329|Tomatoes — Reg. (EU) 2020/856 — تطبيق 09/07/2020|f|2026-09-13
lufenuron|EU|pepper|0.8|e329|Sweet peppers/bell peppers — Reg. (EU) 2020/856 — تطبيق 09/07/2020|f|2026-09-13
lufenuron|EU|eggplant|0.3|e329|Aubergines/eggplants — Reg. (EU) 2020/856 — تطبيق 09/07/2020|f|2026-09-13
lufenuron|EU|cucumber|0.15|e329|Cucumbers — Reg. (EU) 2020/856 — تطبيق 09/07/2020|f|2026-09-13
lufenuron|EU|melon|0.4|e329|Melons — Reg. (EU) 2020/856 — تطبيق 09/07/2020|f|2026-09-13
lufenuron|EU|strawberry|0.01|e329|strawberries — Reg. (EU) 2020/856 — تطبيق 09/07/2020|t|2026-09-13
lufenuron|EU|green_bean|0.01|e329|Beans (with pods) — Reg. (EU) 2020/856 — تطبيق 09/07/2020|t|2026-09-13
methoxyfenozide|EU|tomato|0.6|e159|Tomatoes — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
methoxyfenozide|EU|pepper|2.0|e159|Sweet peppers/bell peppers — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
methoxyfenozide|EU|eggplant|0.3|e159|Aubergines/eggplants — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
methoxyfenozide|EU|cucumber|0.3|e159|Cucumbers — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
methoxyfenozide|EU|melon|0.3|e159|Melons — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
methoxyfenozide|EU|strawberry|2.0|e159|strawberries — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
methoxyfenozide|EU|green_bean|2.0|e159|Beans (with pods) — Reg (EU) 2025/1163 — تطبيق 06/01/2026|f|2026-09-13
imidacloprid|EU|tomato|0.3|e326|Tomatoes — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|f|2026-09-13
imidacloprid|EU|pepper|0.9|e326|Sweet peppers/bell peppers — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|f|2026-09-13
imidacloprid|EU|eggplant|0.3|e326|Aubergines/eggplants — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|f|2026-09-13
imidacloprid|EU|cucumber|0.5|e326|Cucumbers — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|f|2026-09-13
imidacloprid|EU|melon|0.15|e326|Melons — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|f|2026-09-13
imidacloprid|EU|strawberry|0.01|e326|strawberries — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|t|2026-09-13
imidacloprid|EU|green_bean|5.0|e326|Beans (with pods) — Reg. (EU) 2021/1881 — تطبيق 16/05/2022|f|2026-09-13
spirotetramat|EU|tomato|1.0|e2750|Tomatoes — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
spirotetramat|EU|pepper|1.0|e2750|Sweet peppers/bell peppers — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
spirotetramat|EU|eggplant|1.0|e2750|Aubergines/eggplants — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
spirotetramat|EU|cucumber|0.2|e2750|Cucumbers — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
spirotetramat|EU|melon|0.2|e2750|Melons — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
spirotetramat|EU|strawberry|0.3|e2750|strawberries — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
spirotetramat|EU|green_bean|2.0|e2750|Beans (with pods) — Reg. (EU) 2023/1049 — تطبيق 20/06/2023|f|2026-09-13
acetamiprid|EU|tomato|0.06|e10|Tomatoes — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
acetamiprid|EU|pepper|0.09|e10|Sweet peppers/bell peppers — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
acetamiprid|EU|eggplant|0.2|e10|Aubergines/eggplants — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
acetamiprid|EU|cucumber|0.05|e10|Cucumbers — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
acetamiprid|EU|melon|0.08|e10|Melons — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
acetamiprid|EU|strawberry|0.5|e10|strawberries — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
acetamiprid|EU|green_bean|0.6|e10|Beans (with pods) — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
thiamethoxam|EU|tomato|0.01|e388|Tomatoes — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
thiamethoxam|EU|pepper|0.01|e388|Sweet peppers/bell peppers — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
thiamethoxam|EU|eggplant|0.01|e388|Aubergines/eggplants — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
thiamethoxam|EU|cucumber|0.01|e388|Cucumbers — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
thiamethoxam|EU|melon|0.01|e388|Melons — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
thiamethoxam|EU|strawberry|0.01|e388|strawberries — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
thiamethoxam|EU|green_bean|0.01|e388|Beans (with pods) — Reg. (EU) 2023/334 — تطبيق 07/03/2026|t|2026-09-13
pyriproxyfen|EU|tomato|0.7|e368|Tomatoes — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|f|2026-09-13
pyriproxyfen|EU|pepper|0.6|e368|Sweet peppers/bell peppers — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|f|2026-09-13
pyriproxyfen|EU|eggplant|0.6|e368|Aubergines/eggplants — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|f|2026-09-13
pyriproxyfen|EU|cucumber|0.04|e368|Cucumbers — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|f|2026-09-13
pyriproxyfen|EU|melon|0.07|e368|Melons — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|f|2026-09-13
pyriproxyfen|EU|strawberry|0.05|e368|strawberries — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|f|2026-09-13
pyriproxyfen|EU|green_bean|0.01|e368|Beans (with pods) — Reg. (EU) 2023/1753 — تطبيق 02/04/2024|t|2026-09-13
buprofezin|EU|tomato|0.01|e248|Tomatoes — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
buprofezin|EU|pepper|0.01|e248|Sweet peppers/bell peppers — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
buprofezin|EU|eggplant|0.01|e248|Aubergines/eggplants — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
buprofezin|EU|cucumber|0.01|e248|Cucumbers — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
buprofezin|EU|melon|0.01|e248|Melons — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
buprofezin|EU|strawberry|0.01|e248|strawberries — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
buprofezin|EU|green_bean|0.01|e248|Beans (with pods) — Reg. (EU) 2019/91 — تطبيق 13/08/2019|t|2026-09-13
spirodiclofen|EU|tomato|0.5|e374|Tomatoes — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|f|2026-09-13
spirodiclofen|EU|pepper|0.2|e374|Sweet peppers/bell peppers — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|f|2026-09-13
spirodiclofen|EU|eggplant|0.02|e374|Aubergines/eggplants — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|t|2026-09-13
spirodiclofen|EU|cucumber|0.1|e374|Cucumbers — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|f|2026-09-13
spirodiclofen|EU|melon|0.02|e374|Melons — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|t|2026-09-13
spirodiclofen|EU|strawberry|2.0|e374|strawberries — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|f|2026-09-13
spirodiclofen|EU|green_bean|0.02|e374|Beans (with pods) — Reg. (EU) 2016/1902 — تطبيق 24/11/2016|t|2026-09-13
spiromesifen|EU|tomato|1.0|e375|Tomatoes — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
spiromesifen|EU|pepper|0.5|e375|Sweet peppers/bell peppers — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
spiromesifen|EU|eggplant|0.5|e375|Aubergines/eggplants — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
spiromesifen|EU|cucumber|0.3|e375|Cucumbers — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
spiromesifen|EU|melon|0.3|e375|Melons — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
spiromesifen|EU|strawberry|1.0|e375|strawberries — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
spiromesifen|EU|green_bean|1.0|e375|Beans (with pods) — Reg. (EU) 2024/1355 — تطبيق 11/06/2024|f|2026-09-13
flonicamid|EU|tomato|0.5|e778|Tomatoes — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flonicamid|EU|pepper|0.3|e778|Sweet peppers/bell peppers — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flonicamid|EU|eggplant|0.5|e778|Aubergines/eggplants — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flonicamid|EU|cucumber|0.5|e778|Cucumbers — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flonicamid|EU|melon|0.4|e778|Melons — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flonicamid|EU|strawberry|0.7|e778|strawberries — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flonicamid|EU|green_bean|1.5|e778|Beans (with pods) — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
flupyradifurone|EU|tomato|0.7|e2381|Tomatoes — Regulation (EU) 2026/751 — تطبيق 21/04/2026|f|2026-09-13
flupyradifurone|EU|pepper|0.9|e2381|Sweet peppers/bell peppers — Regulation (EU) 2026/751 — تطبيق 21/04/2026|f|2026-09-13
flupyradifurone|EU|eggplant|1.0|e2381|Aubergines/eggplants — Regulation (EU) 2026/751 — تطبيق 21/04/2026|f|2026-09-13
flupyradifurone|EU|cucumber|0.6|e2381|Cucumbers — Regulation (EU) 2026/751 — تطبيق 21/04/2026|f|2026-09-13
flupyradifurone|EU|melon|0.01|e2381|Melons — Regulation (EU) 2026/751 — تطبيق 21/04/2026|t|2026-09-13
flupyradifurone|EU|strawberry|0.4|e2381|strawberries — Regulation (EU) 2026/751 — تطبيق 21/04/2026|f|2026-09-13
flupyradifurone|EU|green_bean|0.5|e2381|Beans (with pods) — Regulation (EU) 2026/751 — تطبيق 21/04/2026|f|2026-09-13
sulfoxaflor|EU|tomato|0.3|e2370|Tomatoes — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
sulfoxaflor|EU|pepper|0.4|e2370|Sweet peppers/bell peppers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
sulfoxaflor|EU|eggplant|0.3|e2370|Aubergines/eggplants — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
sulfoxaflor|EU|cucumber|0.5|e2370|Cucumbers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
sulfoxaflor|EU|melon|0.5|e2370|Melons — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
sulfoxaflor|EU|strawberry|0.5|e2370|strawberries — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
sulfoxaflor|EU|green_bean|0.01|e2370|Beans (with pods) — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|t|2026-09-13
pymetrozine|EU|tomato|0.02|e194|Tomatoes — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
pymetrozine|EU|pepper|0.02|e194|Sweet peppers/bell peppers — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
pymetrozine|EU|eggplant|0.02|e194|Aubergines/eggplants — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
pymetrozine|EU|cucumber|0.02|e194|Cucumbers — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
pymetrozine|EU|melon|0.02|e194|Melons — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
pymetrozine|EU|strawberry|0.02|e194|strawberries — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
pymetrozine|EU|green_bean|0.02|e194|Beans (with pods) — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
lambda-cyhalothrin|EU|tomato|0.07|e140|Tomatoes — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
lambda-cyhalothrin|EU|pepper|0.1|e140|Sweet peppers/bell peppers — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
lambda-cyhalothrin|EU|eggplant|0.3|e140|Aubergines/eggplants — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
lambda-cyhalothrin|EU|cucumber|0.05|e140|Cucumbers — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
lambda-cyhalothrin|EU|melon|0.06|e140|Melons — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
lambda-cyhalothrin|EU|strawberry|0.2|e140|strawberries — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
lambda-cyhalothrin|EU|green_bean|0.4|e140|Beans (with pods) — Reg. (EU) 2025/115 — تطبيق 11/02/2025|f|2026-09-13
alpha-cypermethrin|EU|tomato|0.5|e65|Tomatoes — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته — تغيير قادم: 0.07 — مقترح لم يُعتمد بعد (PLAN/2023/1863)|f|2026-09-13
alpha-cypermethrin|EU|pepper|0.5|e65|Sweet peppers/bell peppers — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته — تغيير قادم: 0.01* — مقترح لم يُعتمد بعد (PLAN/2023/1863)|f|2026-09-13
alpha-cypermethrin|EU|eggplant|0.5|e65|Aubergines/eggplants — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته — تغيير قادم: 0.07 — مقترح لم يُعتمد بعد (PLAN/2023/1863)|f|2026-09-13
alpha-cypermethrin|EU|cucumber|0.2|e65|Cucumbers — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته — تغيير قادم: 0.01* — مقترح لم يُعتمد بعد (PLAN/2023/1863)|f|2026-09-13
alpha-cypermethrin|EU|melon|0.2|e65|Melons — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته — تغيير قادم: 0.04 — مقترح لم يُعتمد بعد (PLAN/2023/1863)|f|2026-09-13
alpha-cypermethrin|EU|strawberry|0.07|e65|strawberries — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته|f|2026-09-13
alpha-cypermethrin|EU|green_bean|0.7|e65|Beans (with pods) — Reg. (EU) 2017/626 — تطبيق 27/04/2017 — تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته — تغيير قادم: 0.2 — مقترح لم يُعتمد بعد (PLAN/2023/1863)|f|2026-09-13
chlorfenapyr|EU|tomato|0.01|e48|Tomatoes — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
chlorfenapyr|EU|pepper|0.01|e48|Sweet peppers/bell peppers — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
chlorfenapyr|EU|eggplant|0.01|e48|Aubergines/eggplants — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
chlorfenapyr|EU|cucumber|0.01|e48|Cucumbers — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
chlorfenapyr|EU|melon|0.01|e48|Melons — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
chlorfenapyr|EU|strawberry|0.01|e48|strawberries — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
chlorfenapyr|EU|green_bean|0.01|e48|Beans (with pods) — Reg. (EU) No 899/2012 — تطبيق 26/04/2013|t|2026-09-13
hexythiazox|EU|tomato|0.1|e2712|Tomatoes — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
hexythiazox|EU|pepper|0.09|e2712|Sweet peppers/bell peppers — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
hexythiazox|EU|eggplant|0.1|e2712|Aubergines/eggplants — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
hexythiazox|EU|cucumber|0.05|e2712|Cucumbers — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
hexythiazox|EU|melon|0.07|e2712|Melons — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
hexythiazox|EU|strawberry|6.0|e2712|strawberries — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
hexythiazox|EU|green_bean|0.01|e2712|Beans (with pods) — Reg (EU) 2025/1305 — تطبيق 23/07/2025|t|2026-09-13
etoxazole|EU|tomato|0.01|e92|Tomatoes — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
etoxazole|EU|pepper|0.01|e92|Sweet peppers/bell peppers — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
etoxazole|EU|eggplant|0.01|e92|Aubergines/eggplants — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
etoxazole|EU|cucumber|0.01|e92|Cucumbers — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
etoxazole|EU|melon|0.01|e92|Melons — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
etoxazole|EU|strawberry|0.01|e92|strawberries — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
etoxazole|EU|green_bean|0.01|e92|Beans (with pods) — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
fenpyroximate|EU|tomato|0.3|e301|Tomatoes — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
fenpyroximate|EU|pepper|0.3|e301|Sweet peppers/bell peppers — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
fenpyroximate|EU|eggplant|0.3|e301|Aubergines/eggplants — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
fenpyroximate|EU|cucumber|0.08|e301|Cucumbers — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
fenpyroximate|EU|melon|0.01|e301|Melons — Reg (EU) 2023/1069 — تطبيق 22/06/2023|t|2026-09-13
fenpyroximate|EU|strawberry|0.3|e301|strawberries — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
fenpyroximate|EU|green_bean|0.7|e301|Beans (with pods) — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
bifenazate|EU|tomato|0.01|e27|Tomatoes — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
bifenazate|EU|pepper|0.01|e27|Sweet peppers/bell peppers — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
bifenazate|EU|eggplant|0.01|e27|Aubergines/eggplants — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
bifenazate|EU|cucumber|0.01|e27|Cucumbers — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
bifenazate|EU|melon|0.01|e27|Melons — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
bifenazate|EU|strawberry|0.01|e27|strawberries — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
bifenazate|EU|green_bean|0.01|e27|Beans (with pods) — Reg. (EU) 2024/891 — تطبيق 14/10/2024|t|2026-09-13
pyridaben|EU|tomato|0.15|e367|Tomatoes — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|f|2026-09-13
pyridaben|EU|pepper|0.3|e367|Sweet peppers/bell peppers — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|f|2026-09-13
pyridaben|EU|eggplant|0.15|e367|Aubergines/eggplants — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|f|2026-09-13
pyridaben|EU|cucumber|0.15|e367|Cucumbers — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|f|2026-09-13
pyridaben|EU|melon|0.01|e367|Melons — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|t|2026-09-13
pyridaben|EU|strawberry|0.9|e367|strawberries — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|f|2026-09-13
pyridaben|EU|green_bean|0.01|e367|Beans (with pods) — Reg. (EU) 2024/2609 — تطبيق 28/04/2025|t|2026-09-13
chlorpyrifos|EU|tomato|0.01|e56|Tomatoes — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
chlorpyrifos|EU|pepper|0.01|e56|Sweet peppers/bell peppers — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
chlorpyrifos|EU|eggplant|0.01|e56|Aubergines/eggplants — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
chlorpyrifos|EU|cucumber|0.01|e56|Cucumbers — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
chlorpyrifos|EU|melon|0.01|e56|Melons — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
chlorpyrifos|EU|strawberry|0.01|e56|strawberries — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
chlorpyrifos|EU|green_bean|0.01|e56|Beans (with pods) — Reg. (EU) 2020/1085 — تطبيق 13/11/2020|t|2026-09-13
profenofos|EU|tomato|10.0|e186|Tomatoes — Reg. (EU) 2023/377 — تطبيق 14/09/2023|f|2026-09-13
profenofos|EU|pepper|0.01|e186|Sweet peppers/bell peppers — Reg. (EU) 2023/377 — تطبيق 14/09/2023|t|2026-09-13
profenofos|EU|eggplant|0.01|e186|Aubergines/eggplants — Reg. (EU) 2023/377 — تطبيق 14/09/2023|t|2026-09-13
profenofos|EU|cucumber|0.01|e186|Cucumbers — Reg. (EU) 2023/377 — تطبيق 14/09/2023|t|2026-09-13
profenofos|EU|melon|0.01|e186|Melons — Reg. (EU) 2023/377 — تطبيق 14/09/2023|t|2026-09-13
profenofos|EU|strawberry|0.01|e186|strawberries — Reg. (EU) 2023/377 — تطبيق 14/09/2023|t|2026-09-13
profenofos|EU|green_bean|0.01|e186|Beans (with pods) — Reg. (EU) 2023/377 — تطبيق 14/09/2023|t|2026-09-13
methomyl|EU|tomato|0.01|e157|Tomatoes — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
methomyl|EU|pepper|0.01|e157|Sweet peppers/bell peppers — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
methomyl|EU|eggplant|0.01|e157|Aubergines/eggplants — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
methomyl|EU|cucumber|0.01|e157|Cucumbers — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
methomyl|EU|melon|0.01|e157|Melons — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
methomyl|EU|strawberry|0.01|e157|strawberries — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
methomyl|EU|green_bean|0.01|e157|Beans (with pods) — Reg. (EU) 2023/1783 — تطبيق 08/04/2024|t|2026-09-13
dimethoate|EU|tomato|0.01|e76|Tomatoes — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
dimethoate|EU|pepper|0.01|e76|Sweet peppers/bell peppers — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
dimethoate|EU|eggplant|0.01|e76|Aubergines/eggplants — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
dimethoate|EU|cucumber|0.01|e76|Cucumbers — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
dimethoate|EU|melon|0.01|e76|Melons — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
dimethoate|EU|strawberry|0.01|e76|strawberries — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
dimethoate|EU|green_bean|0.01|e76|Beans (with pods) — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
oxamyl|EU|tomato|0.002|e169|Tomatoes — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
oxamyl|EU|pepper|0.001|e169|Sweet peppers/bell peppers — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
oxamyl|EU|eggplant|0.001|e169|Aubergines/eggplants — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
oxamyl|EU|cucumber|0.001|e169|Cucumbers — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
oxamyl|EU|melon|0.001|e169|Melons — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
oxamyl|EU|strawberry|0.001|e169|strawberries — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
oxamyl|EU|green_bean|0.001|e169|Beans (with pods) — Reg. (EU) 2024/331 — تطبيق 11/05/2024|t|2026-09-13
fosthiazate|EU|tomato|0.02|e118|Tomatoes — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fosthiazate|EU|pepper|0.02|e118|Sweet peppers/bell peppers — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fosthiazate|EU|eggplant|0.02|e118|Aubergines/eggplants — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fosthiazate|EU|cucumber|0.02|e118|Cucumbers — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fosthiazate|EU|melon|0.02|e118|Melons — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fosthiazate|EU|strawberry|0.02|e118|strawberries — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fosthiazate|EU|green_bean|0.02|e118|Beans (with pods) — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|t|2026-09-13
fluopyram|EU|tomato|0.5|e2276|Tomatoes — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
fluopyram|EU|pepper|2.0|e2276|Sweet peppers/bell peppers — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
fluopyram|EU|eggplant|0.4|e2276|Aubergines/eggplants — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
fluopyram|EU|cucumber|0.6|e2276|Cucumbers — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
fluopyram|EU|melon|0.9|e2276|Melons — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
fluopyram|EU|strawberry|2.0|e2276|strawberries — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
fluopyram|EU|green_bean|3.0|e2276|Beans (with pods) — Commission Regulation (EU) 2024/2640 — تطبيق 30/04/2025|f|2026-09-13
azoxystrobin|EU|tomato|3.0|e22|Tomatoes — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
azoxystrobin|EU|pepper|3.0|e22|Sweet peppers/bell peppers — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
azoxystrobin|EU|eggplant|3.0|e22|Aubergines/eggplants — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
azoxystrobin|EU|cucumber|1.0|e22|Cucumbers — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
azoxystrobin|EU|melon|6.0|e22|Melons — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
azoxystrobin|EU|strawberry|10.0|e22|strawberries — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
azoxystrobin|EU|green_bean|3.0|e22|Beans (with pods) — Reg (EU) 2025/1305 — تطبيق 23/07/2025|f|2026-09-13
pyraclostrobin|EU|tomato|0.3|e195|Tomatoes — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
pyraclostrobin|EU|pepper|0.5|e195|Sweet peppers/bell peppers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
pyraclostrobin|EU|eggplant|0.3|e195|Aubergines/eggplants — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
pyraclostrobin|EU|cucumber|0.5|e195|Cucumbers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
pyraclostrobin|EU|melon|0.5|e195|Melons — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
pyraclostrobin|EU|strawberry|1.5|e195|strawberries — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
pyraclostrobin|EU|green_bean|0.6|e195|Beans (with pods) — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|tomato|0.7|e3390|Tomatoes — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|pepper|0.9|e3390|Sweet peppers/bell peppers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|eggplant|0.7|e3390|Aubergines/eggplants — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|cucumber|0.3|e3390|Cucumbers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|melon|0.3|e3390|Melons — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|strawberry|1.0|e3390|strawberries — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
trifloxystrobin|EU|green_bean|0.8|e3390|Beans (with pods) — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
difenoconazole|EU|tomato|2.0|e276|Tomatoes — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
difenoconazole|EU|pepper|0.9|e276|Sweet peppers/bell peppers — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
difenoconazole|EU|eggplant|0.6|e276|Aubergines/eggplants — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
difenoconazole|EU|cucumber|0.3|e276|Cucumbers — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
difenoconazole|EU|melon|0.2|e276|Melons — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
difenoconazole|EU|strawberry|2.0|e276|strawberries — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
difenoconazole|EU|green_bean|1.0|e276|Beans (with pods) — Commission Regulation (EU) 2024/2612  — تطبيق 28/10/2024|f|2026-09-13
tebuconazole|EU|tomato|0.9|e379|Tomatoes — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|f|2026-09-13
tebuconazole|EU|pepper|0.6|e379|Sweet peppers/bell peppers — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|f|2026-09-13
tebuconazole|EU|eggplant|0.4|e379|Aubergines/eggplants — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|f|2026-09-13
tebuconazole|EU|cucumber|0.6|e379|Cucumbers — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|f|2026-09-13
tebuconazole|EU|melon|0.2|e379|Melons — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|f|2026-09-13
tebuconazole|EU|strawberry|0.02|e379|strawberries — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|t|2026-09-13
tebuconazole|EU|green_bean|2.0|e379|Beans (with pods) — Reg. (EU) 2018/1514 — تطبيق 01/11/2018|f|2026-09-13
penconazole|EU|tomato|0.1|e175|Tomatoes — Reg.(EU) 2025/195 — تطبيق 24/08/2025|f|2026-09-13
penconazole|EU|pepper|0.2|e175|Sweet peppers/bell peppers — Reg.(EU) 2025/195 — تطبيق 24/08/2025|f|2026-09-13
penconazole|EU|eggplant|0.1|e175|Aubergines/eggplants — Reg.(EU) 2025/195 — تطبيق 24/08/2025|f|2026-09-13
penconazole|EU|cucumber|0.06|e175|Cucumbers — Reg.(EU) 2025/195 — تطبيق 24/08/2025|f|2026-09-13
penconazole|EU|melon|0.15|e175|Melons — Reg.(EU) 2025/195 — تطبيق 24/08/2025|f|2026-09-13
penconazole|EU|strawberry|0.5|e175|strawberries — Reg.(EU) 2025/195 — تطبيق 24/08/2025|f|2026-09-13
penconazole|EU|green_bean|0.01|e175|Beans (with pods) — Reg.(EU) 2025/195 — تطبيق 24/08/2025|t|2026-09-13
myclobutanil|EU|tomato|0.6|e166|Tomatoes — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
myclobutanil|EU|pepper|3.0|e166|Sweet peppers/bell peppers — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
myclobutanil|EU|eggplant|0.2|e166|Aubergines/eggplants — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
myclobutanil|EU|cucumber|0.2|e166|Cucumbers — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
myclobutanil|EU|melon|0.3|e166|Melons — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
myclobutanil|EU|strawberry|1.5|e166|strawberries — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
myclobutanil|EU|green_bean|0.8|e166|Beans (with pods) — Reg. (EU) 2020/770 — تطبيق 02/01/2021|f|2026-09-13
tetraconazole|EU|tomato|0.15|e3131|Tomatoes — Reg. (EU) 2023/466 — تطبيق 26/09/2023|f|2026-09-13
tetraconazole|EU|pepper|0.01|e3131|Sweet peppers/bell peppers — Reg. (EU) 2023/466 — تطبيق 26/09/2023|t|2026-09-13
tetraconazole|EU|eggplant|0.15|e3131|Aubergines/eggplants — Reg. (EU) 2023/466 — تطبيق 26/09/2023|f|2026-09-13
tetraconazole|EU|cucumber|0.15|e3131|Cucumbers — Reg. (EU) 2023/466 — تطبيق 26/09/2023|f|2026-09-13
tetraconazole|EU|melon|0.08|e3131|Melons — Reg. (EU) 2023/466 — تطبيق 26/09/2023|f|2026-09-13
tetraconazole|EU|strawberry|0.15|e3131|strawberries — Reg. (EU) 2023/466 — تطبيق 26/09/2023|f|2026-09-13
tetraconazole|EU|green_bean|0.01|e3131|Beans (with pods) — Reg. (EU) 2023/466 — تطبيق 26/09/2023|t|2026-09-13
boscalid|EU|tomato|3.0|e244|Tomatoes — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
boscalid|EU|pepper|3.0|e244|Sweet peppers/bell peppers — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
boscalid|EU|eggplant|3.0|e244|Aubergines/eggplants — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
boscalid|EU|cucumber|4.0|e244|Cucumbers — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
boscalid|EU|melon|3.0|e244|Melons — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
boscalid|EU|strawberry|6.0|e244|strawberries — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
boscalid|EU|green_bean|5.0|e244|Beans (with pods) — Reg. (EU) 2022/1324 — تطبيق 18/08/2022|f|2026-09-13
cyprodinil|EU|tomato|1.5|e267|Tomatoes — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
cyprodinil|EU|pepper|1.5|e267|Sweet peppers/bell peppers — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
cyprodinil|EU|eggplant|1.5|e267|Aubergines/eggplants — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
cyprodinil|EU|cucumber|0.5|e267|Cucumbers — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
cyprodinil|EU|melon|0.6|e267|Melons — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
cyprodinil|EU|strawberry|5.0|e267|strawberries — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
cyprodinil|EU|green_bean|2.0|e267|Beans (with pods) — Reg (EU) 2023/1069 — تطبيق 22/06/2023|f|2026-09-13
fludioxonil|EU|tomato|3.0|e307|Tomatoes — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
fludioxonil|EU|pepper|1.0|e307|Sweet peppers/bell peppers — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
fludioxonil|EU|eggplant|0.4|e307|Aubergines/eggplants — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
fludioxonil|EU|cucumber|0.4|e307|Cucumbers — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
fludioxonil|EU|melon|0.3|e307|Melons — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
fludioxonil|EU|strawberry|4.0|e307|strawberries — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
fludioxonil|EU|green_bean|1.0|e307|Beans (with pods) — Reg. (EU) 2022/1264 — تطبيق 10/08/2022|f|2026-09-13
iprodione|EU|tomato|0.01|e135|Tomatoes — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
iprodione|EU|pepper|0.01|e135|Sweet peppers/bell peppers — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
iprodione|EU|eggplant|0.01|e135|Aubergines/eggplants — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
iprodione|EU|cucumber|0.01|e135|Cucumbers — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
iprodione|EU|melon|0.01|e135|Melons — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
iprodione|EU|strawberry|0.01|e135|strawberries — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
iprodione|EU|green_bean|0.01|e135|Beans (with pods) — Reg. (EU) 2019/38 — تطبيق 31/07/2019|t|2026-09-13
mancozeb|EU|tomato|3.0|e83|Tomatoes — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
mancozeb|EU|pepper|5.0|e83|Sweet peppers/bell peppers — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
mancozeb|EU|eggplant|3.0|e83|Aubergines/eggplants — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
mancozeb|EU|cucumber|2.0|e83|Cucumbers — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
mancozeb|EU|melon|1.5|e83|Melons — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
mancozeb|EU|strawberry|10.0|e83|strawberries — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
mancozeb|EU|green_bean|1.0|e83|Beans (with pods) — Reg. (EU) 2017/171 — تطبيق 23/02/2017 — تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2|f|2026-09-13
chlorothalonil|EU|tomato|0.01|e53|Tomatoes — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
chlorothalonil|EU|pepper|0.01|e53|Sweet peppers/bell peppers — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
chlorothalonil|EU|eggplant|0.01|e53|Aubergines/eggplants — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
chlorothalonil|EU|cucumber|0.01|e53|Cucumbers — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
chlorothalonil|EU|melon|0.01|e53|Melons — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
chlorothalonil|EU|strawberry|0.01|e53|strawberries — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
chlorothalonil|EU|green_bean|0.01|e53|Beans (with pods) — Reg. (EU) 2021/155 — تطبيق 02/09/2021|t|2026-09-13
copper hydroxide|EU|tomato|10.0|e4050|Tomatoes — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper hydroxide|EU|pepper|20.0|e4050|Sweet peppers/bell peppers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper hydroxide|EU|eggplant|10.0|e4050|Aubergines/eggplants — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper hydroxide|EU|cucumber|5.0|e4050|Cucumbers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper hydroxide|EU|melon|10.0|e4050|Melons — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper hydroxide|EU|strawberry|15.0|e4050|strawberries — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper hydroxide|EU|green_bean|20.0|e4050|Beans (with pods) — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|tomato|10.0|e4050|Tomatoes — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|pepper|20.0|e4050|Sweet peppers/bell peppers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|eggplant|10.0|e4050|Aubergines/eggplants — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|cucumber|5.0|e4050|Cucumbers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|melon|10.0|e4050|Melons — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|strawberry|15.0|e4050|strawberries — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper oxychloride|EU|green_bean|20.0|e4050|Beans (with pods) — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
metalaxyl-m|EU|tomato|0.3|e3370|Tomatoes — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
metalaxyl-m|EU|pepper|0.4|e3370|Sweet peppers/bell peppers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
metalaxyl-m|EU|eggplant|0.01|e3370|Aubergines/eggplants — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|t|2026-09-13
metalaxyl-m|EU|cucumber|0.5|e3370|Cucumbers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
metalaxyl-m|EU|melon|0.15|e3370|Melons — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
metalaxyl-m|EU|strawberry|0.6|e3370|strawberries — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
metalaxyl-m|EU|green_bean|0.02|e3370|Beans (with pods) — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|t|2026-09-13
cymoxanil|EU|tomato|0.4|e265|Tomatoes — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|f|2026-09-13
cymoxanil|EU|pepper|0.01|e265|Sweet peppers/bell peppers — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|t|2026-09-13
cymoxanil|EU|eggplant|0.3|e265|Aubergines/eggplants — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|f|2026-09-13
cymoxanil|EU|cucumber|0.08|e265|Cucumbers — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|f|2026-09-13
cymoxanil|EU|melon|0.4|e265|Melons — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|f|2026-09-13
cymoxanil|EU|strawberry|0.01|e265|strawberries — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|t|2026-09-13
cymoxanil|EU|green_bean|0.05|e265|Beans (with pods) — Reg. (EU) 2022/1363 — تطبيق 25/02/2023|t|2026-09-13
dimethomorph|EU|tomato|1.0|e281|Tomatoes — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|f|2026-09-13
dimethomorph|EU|pepper|1.0|e281|Sweet peppers/bell peppers — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|f|2026-09-13
dimethomorph|EU|eggplant|1.0|e281|Aubergines/eggplants — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|f|2026-09-13
dimethomorph|EU|cucumber|0.5|e281|Cucumbers — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|f|2026-09-13
dimethomorph|EU|melon|0.5|e281|Melons — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|f|2026-09-13
dimethomorph|EU|strawberry|0.7|e281|strawberries — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|f|2026-09-13
dimethomorph|EU|green_bean|0.01|e281|Beans (with pods) — Reg. (EU) 2020/1633 — تطبيق 25/05/2021|t|2026-09-13
mandipropamid|EU|tomato|3.0|e790|Tomatoes — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
mandipropamid|EU|pepper|1.0|e790|Sweet peppers/bell peppers — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
mandipropamid|EU|eggplant|3.0|e790|Aubergines/eggplants — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
mandipropamid|EU|cucumber|0.2|e790|Cucumbers — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
mandipropamid|EU|melon|0.5|e790|Melons — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
mandipropamid|EU|strawberry|0.01|e790|strawberries — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|t|2026-09-13
mandipropamid|EU|green_bean|1.0|e790|Beans (with pods) — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
fosetyl|EU|tomato|70.0|e3430|Tomatoes — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|f|2026-09-13
fosetyl|EU|pepper|70.0|e3430|Sweet peppers/bell peppers — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|f|2026-09-13
fosetyl|EU|eggplant|70.0|e3430|Aubergines/eggplants — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|f|2026-09-13
fosetyl|EU|cucumber|80.0|e3430|Cucumbers — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|f|2026-09-13
fosetyl|EU|melon|60.0|e3430|Melons — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|f|2026-09-13
fosetyl|EU|strawberry|70.0|e3430|strawberries — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|f|2026-09-13
fosetyl|EU|green_bean|1.5|e3430|Beans (with pods) — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)|t|2026-09-13
propamocarb|EU|tomato|4.0|e359|Tomatoes — Regulation (EU) 2026/215  — تطبيق 19/08/2026|f|2026-09-13
propamocarb|EU|pepper|3.0|e359|Sweet peppers/bell peppers — Regulation (EU) 2026/215  — تطبيق 19/08/2026|f|2026-09-13
propamocarb|EU|eggplant|4.0|e359|Aubergines/eggplants — Regulation (EU) 2026/215  — تطبيق 19/08/2026|f|2026-09-13
propamocarb|EU|cucumber|5.0|e359|Cucumbers — Regulation (EU) 2026/215  — تطبيق 19/08/2026|f|2026-09-13
propamocarb|EU|melon|5.0|e359|Melons — Regulation (EU) 2026/215  — تطبيق 19/08/2026|f|2026-09-13
propamocarb|EU|strawberry|0.01|e359|strawberries — Regulation (EU) 2026/215  — تطبيق 19/08/2026|t|2026-09-13
propamocarb|EU|green_bean|0.1|e359|Beans (with pods) — Regulation (EU) 2026/215  — تطبيق 19/08/2026|f|2026-09-13
famoxadone|EU|tomato|2.0|e93|Tomatoes — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
famoxadone|EU|pepper|0.01|e93|Sweet peppers/bell peppers — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|t|2026-09-13
famoxadone|EU|eggplant|0.01|e93|Aubergines/eggplants — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|t|2026-09-13
famoxadone|EU|cucumber|0.2|e93|Cucumbers — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|f|2026-09-13
famoxadone|EU|melon|0.01|e93|Melons — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|t|2026-09-13
famoxadone|EU|strawberry|0.01|e93|strawberries — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|t|2026-09-13
famoxadone|EU|green_bean|0.01|e93|Beans (with pods) — Commission Regulation (EU) 2024/2633 — تطبيق 29/10/2024|t|2026-09-13
ametoctradin|EU|tomato|2.0|e2694|Tomatoes — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|f|2026-09-13
ametoctradin|EU|pepper|1.5|e2694|Sweet peppers/bell peppers — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|f|2026-09-13
ametoctradin|EU|eggplant|2.0|e2694|Aubergines/eggplants — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|f|2026-09-13
ametoctradin|EU|cucumber|2.0|e2694|Cucumbers — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|f|2026-09-13
ametoctradin|EU|melon|3.0|e2694|Melons — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|f|2026-09-13
ametoctradin|EU|strawberry|0.01|e2694|strawberries — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|t|2026-09-13
ametoctradin|EU|green_bean|0.01|e2694|Beans (with pods) — Reg. (EU) 2022/1290 — تطبيق 14/08/2022|t|2026-09-13
thiophanate-methyl|EU|tomato|1.0|e213|Tomatoes — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|f|2026-09-13
thiophanate-methyl|EU|pepper|0.1|e213|Sweet peppers/bell peppers — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
thiophanate-methyl|EU|eggplant|2.0|e213|Aubergines/eggplants — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|f|2026-09-13
thiophanate-methyl|EU|cucumber|0.1|e213|Cucumbers — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
thiophanate-methyl|EU|melon|0.3|e213|Melons — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|f|2026-09-13
thiophanate-methyl|EU|strawberry|0.1|e213|strawberries — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
thiophanate-methyl|EU|green_bean|0.1|e213|Beans (with pods) — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
carbendazim|EU|tomato|0.3|e38|Tomatoes — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|f|2026-09-13
carbendazim|EU|pepper|0.1|e38|Sweet peppers/bell peppers — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
carbendazim|EU|eggplant|0.5|e38|Aubergines/eggplants — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|f|2026-09-13
carbendazim|EU|cucumber|0.1|e38|Cucumbers — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
carbendazim|EU|melon|0.1|e38|Melons — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
carbendazim|EU|strawberry|0.1|e38|strawberries — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|t|2026-09-13
carbendazim|EU|green_bean|0.2|e38|Beans (with pods) — Reg. (EU) No 559/2011 — تطبيق 01/01/2012 — تغيير قادم: 0.01* — يُطبّق من 29/01/2027 (Reg. (EU) No. 2026/1546)|f|2026-09-13
hymexazol|EU|tomato|0.02|e324|Tomatoes — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
hymexazol|EU|pepper|0.02|e324|Sweet peppers/bell peppers — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
hymexazol|EU|eggplant|0.02|e324|Aubergines/eggplants — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
hymexazol|EU|cucumber|0.02|e324|Cucumbers — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
hymexazol|EU|melon|0.02|e324|Melons — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
hymexazol|EU|strawberry|0.02|e324|strawberries — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
hymexazol|EU|green_bean|0.02|e324|Beans (with pods) — Reg. (EU) 2021/644 — تطبيق 10/11/2021|t|2026-09-13
fluazinam|EU|tomato|0.3|e305|Tomatoes — Reg. (EU) 2018/70 — تطبيق 06/02/2018|f|2026-09-13
fluazinam|EU|pepper|0.01|e305|Sweet peppers/bell peppers — Reg. (EU) 2018/70 — تطبيق 06/02/2018|t|2026-09-13
fluazinam|EU|eggplant|0.01|e305|Aubergines/eggplants — Reg. (EU) 2018/70 — تطبيق 06/02/2018|t|2026-09-13
fluazinam|EU|cucumber|0.01|e305|Cucumbers — Reg. (EU) 2018/70 — تطبيق 06/02/2018|t|2026-09-13
fluazinam|EU|melon|0.01|e305|Melons — Reg. (EU) 2018/70 — تطبيق 06/02/2018|t|2026-09-13
fluazinam|EU|strawberry|0.01|e305|strawberries — Reg. (EU) 2018/70 — تطبيق 06/02/2018|t|2026-09-13
fluazinam|EU|green_bean|0.01|e305|Beans (with pods) — Reg. (EU) 2018/70 — تطبيق 06/02/2018|t|2026-09-13
cyflufenamid|EU|tomato|0.04|e776|Tomatoes — Regulation (EU) 2026/742 — تطبيق 20/04/2026|f|2026-09-13
cyflufenamid|EU|pepper|0.06|e776|Sweet peppers/bell peppers — Regulation (EU) 2026/742 — تطبيق 20/04/2026|f|2026-09-13
cyflufenamid|EU|eggplant|0.02|e776|Aubergines/eggplants — Regulation (EU) 2026/742 — تطبيق 20/04/2026|t|2026-09-13
cyflufenamid|EU|cucumber|0.05|e776|Cucumbers — Regulation (EU) 2026/742 — تطبيق 20/04/2026|f|2026-09-13
cyflufenamid|EU|melon|0.05|e776|Melons — Regulation (EU) 2026/742 — تطبيق 20/04/2026|f|2026-09-13
cyflufenamid|EU|strawberry|0.04|e776|strawberries — Regulation (EU) 2026/742 — تطبيق 20/04/2026|f|2026-09-13
cyflufenamid|EU|green_bean|0.01|e776|Beans (with pods) — Regulation (EU) 2026/742 — تطبيق 20/04/2026|t|2026-09-13
bupirimate|EU|tomato|0.8|e2631|Tomatoes — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|f|2026-09-13
bupirimate|EU|pepper|1.5|e2631|Sweet peppers/bell peppers — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|f|2026-09-13
bupirimate|EU|eggplant|1.5|e2631|Aubergines/eggplants — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|f|2026-09-13
bupirimate|EU|cucumber|2.0|e2631|Cucumbers — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|f|2026-09-13
bupirimate|EU|melon|0.3|e2631|Melons — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|f|2026-09-13
bupirimate|EU|strawberry|1.5|e2631|strawberries — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|f|2026-09-13
bupirimate|EU|green_bean|0.01|e2631|Beans (with pods) — Reg. (EU) 2020/1566 — تطبيق 17/05/2021|t|2026-09-13
milbemectin|EU|tomato|0.02|e162|Tomatoes — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
milbemectin|EU|pepper|0.02|e162|Sweet peppers/bell peppers — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
milbemectin|EU|eggplant|0.02|e162|Aubergines/eggplants — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
milbemectin|EU|cucumber|0.02|e162|Cucumbers — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
milbemectin|EU|melon|0.02|e162|Melons — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
milbemectin|EU|strawberry|0.02|e162|strawberries — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
milbemectin|EU|green_bean|0.02|e162|Beans (with pods) — Reg. (EU) No 1317/2013 — تطبيق 06/07/2014|t|2026-09-13
quinoxyfen|EU|tomato|0.02|e201|Tomatoes — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|t|2026-09-13
quinoxyfen|EU|pepper|0.02|e201|Sweet peppers/bell peppers — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|t|2026-09-13
quinoxyfen|EU|eggplant|0.02|e201|Aubergines/eggplants — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|t|2026-09-13
quinoxyfen|EU|cucumber|0.02|e201|Cucumbers — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|t|2026-09-13
quinoxyfen|EU|melon|0.05|e201|Melons — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|f|2026-09-13
quinoxyfen|EU|strawberry|0.3|e201|strawberries — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|f|2026-09-13
quinoxyfen|EU|green_bean|0.02|e201|Beans (with pods) — Reg. (EU) No 36/2014 — تطبيق 10/02/2014|t|2026-09-13
glyphosate|EU|tomato|0.1|e120|Tomatoes — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
glyphosate|EU|pepper|0.1|e120|Sweet peppers/bell peppers — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
glyphosate|EU|eggplant|0.1|e120|Aubergines/eggplants — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
glyphosate|EU|cucumber|0.1|e120|Cucumbers — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
glyphosate|EU|melon|0.1|e120|Melons — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
glyphosate|EU|strawberry|0.1|e120|strawberries — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
glyphosate|EU|green_bean|0.1|e120|Beans (with pods) — Reg. (EU) No 293/2013 — تطبيق 06/04/2013|t|2026-09-13
azadirachtin|EU|tomato|1.0|e239|Tomatoes — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
azadirachtin|EU|pepper|1.0|e239|Sweet peppers/bell peppers — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
azadirachtin|EU|eggplant|1.0|e239|Aubergines/eggplants — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
azadirachtin|EU|cucumber|1.0|e239|Cucumbers — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
azadirachtin|EU|melon|1.0|e239|Melons — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
azadirachtin|EU|strawberry|1.0|e239|strawberries — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
azadirachtin|EU|green_bean|1.0|e239|Beans (with pods) — Reg. (EC) No 149/2008 — تطبيق 01/09/2008|f|2026-09-13
copper sulphate tribasic|EU|tomato|10.0|e4050|Tomatoes — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper sulphate tribasic|EU|pepper|20.0|e4050|Sweet peppers/bell peppers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper sulphate tribasic|EU|eggplant|10.0|e4050|Aubergines/eggplants — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper sulphate tribasic|EU|cucumber|5.0|e4050|Cucumbers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper sulphate tribasic|EU|melon|10.0|e4050|Melons — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper sulphate tribasic|EU|strawberry|15.0|e4050|strawberries — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
copper sulphate tribasic|EU|green_bean|20.0|e4050|Beans (with pods) — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|tomato|10.0|e4050|Tomatoes — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|pepper|20.0|e4050|Sweet peppers/bell peppers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|eggplant|10.0|e4050|Aubergines/eggplants — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|cucumber|5.0|e4050|Cucumbers — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|melon|10.0|e4050|Melons — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|strawberry|15.0|e4050|strawberries — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
bordeaux mixture|EU|green_bean|20.0|e4050|Beans (with pods) — Reg. (EU) 2026/840 — تطبيق 05/05/2026 — تعريف المتبقي: النحاس الكلي|f|2026-09-13
acequinocyl|EU|tomato|0.3|e2930|Tomatoes — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
acequinocyl|EU|pepper|0.3|e2930|Sweet peppers/bell peppers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
acequinocyl|EU|eggplant|0.3|e2930|Aubergines/eggplants — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
acequinocyl|EU|cucumber|0.08|e2930|Cucumbers — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
acequinocyl|EU|melon|0.01|e2930|Melons — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|t|2026-09-13
acequinocyl|EU|strawberry|0.3|e2930|strawberries — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|f|2026-09-13
acequinocyl|EU|green_bean|0.01|e2930|Beans (with pods) — Commission Regulation (EU) 2026/140 — تطبيق 11/02/2026|t|2026-09-13
malathion|EU|tomato|0.02|e143|Tomatoes — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
malathion|EU|pepper|0.02|e143|Sweet peppers/bell peppers — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
malathion|EU|eggplant|0.02|e143|Aubergines/eggplants — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
malathion|EU|cucumber|0.02|e143|Cucumbers — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
malathion|EU|melon|0.02|e143|Melons — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
malathion|EU|strawberry|0.02|e143|strawberries — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
malathion|EU|green_bean|0.02|e143|Beans (with pods) — Regulation (EU) 2015/399 — تطبيق 03/04/2015|t|2026-09-13
deltamethrin|EU|tomato|0.1|e69|Tomatoes — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
deltamethrin|EU|pepper|0.15|e69|Sweet peppers/bell peppers — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
deltamethrin|EU|eggplant|0.4|e69|Aubergines/eggplants — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
deltamethrin|EU|cucumber|0.2|e69|Cucumbers — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
deltamethrin|EU|melon|0.01|e69|Melons — Regulation (EU) 2026/876 — تطبيق 12/05/2026 — تغيير قادم: 0.03 — مقترح لم يُعتمد بعد (PLAN/2025/3053)|t|2026-09-13
deltamethrin|EU|strawberry|0.2|e69|strawberries — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
deltamethrin|EU|green_bean|0.2|e69|Beans (with pods) — Regulation (EU) 2026/876 — تطبيق 12/05/2026|f|2026-09-13
$d$, E'\n') l where l <> ''),
v as (select split_part(l, '|', 1) as name_en, split_part(l, '|', 2) as market, split_part(l, '|', 3) as crop_code,
  split_part(l, '|', 4)::numeric as mrl_mg_kg, split_part(l, '|', 5) as k, split_part(l, '|', 6) as notes,
  split_part(l, '|', 7) = 't' as loq, split_part(l, '|', 8)::date as got from raw)
insert into public.substance_limits (farm_id, substance_id, market, crop_code, mrl_mg_kg, default_loq, source_url, retrieved_on, notes)
select null, s.id, v.market, v.crop_code, v.mrl_mg_kg, v.loq,
  case when v.k like 'c%' then 'https://www.law.cornell.edu/cfr/text/40/180.' || substr(v.k, 2)
       when v.k like 'e%' then 'https://ec.europa.eu/food/plant/pesticides/eu-pesticides-database/start/screen/mrls/details?lg_code=EN&pest_res_id_list=' || substr(v.k, 2)
       else 'https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/pesticide-index/pesticide-details?pestId=' || substr(v.k, 2) end,
  v.got, v.notes
from v join public.active_substances s on s.farm_id is null and lower(s.name_en) = v.name_en
on conflict (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), substance_id, market, crop_code) where deleted_at is null do update set
  mrl_mg_kg = excluded.mrl_mg_kg, default_loq = excluded.default_loq, source_url = excluded.source_url,
  retrieved_on = excluded.retrieved_on, notes = excluded.notes, updated_at = now(), server_updated_at = now();

with np as (
  select p.id, ' ' || regexp_replace(translate(lower(p.active_ingredient), 'أإآىة', 'ااايه'), '[^a-z0-9ء-ي]+', ' ', 'g') || ' ' as t
  from public.products p where p.farm_id is null and p.deleted_at is null and p.active_ingredient is not null
), al(en, nm) as (values
  ('difenoconazole', 'ديفينوكونازول'),
  ('metalaxyl-m', 'ميفينوكسام'),
  ('bordeaux mixture', 'كبريتات النحاس + الجير'),
  ('fatty acids potassium salts', 'صابون البوتاسيوم'),
  ('paraffin oil (cas 8042-47-5)', 'زيت بارافيني (معدني)'),
  ('paraffin oil (cas 64742-46-7)', 'زيت بارافيني (معدني)'),
  ('bacillus amyloliquefaciens qst 713', 'Bacillus subtilis QST 713')
), ns as (
  select s.id, trim(regexp_replace(translate(lower(v.nm), 'أإآىة', 'ااايه'), '[^a-z0-9ء-ي]+', ' ', 'g')) as n
  from public.active_substances s cross join lateral (values (s.name_en), (s.name_ar)) v(nm)
  where s.farm_id is null and s.deleted_at is null and v.nm is not null
  union all
  select s.id, trim(regexp_replace(translate(lower(al.nm), 'أإآىة', 'ااايه'), '[^a-z0-9ء-ي]+', ' ', 'g'))
  from al join public.active_substances s on s.farm_id is null and s.deleted_at is null and lower(s.name_en) = al.en
)
insert into public.product_actives (farm_id, product_id, substance_id)
select distinct null::uuid, np.id, ns.id from np join ns on length(ns.n) >= 4 and np.t like ('% ' || ns.n || ' %')
on conflict (product_id, substance_id) where deleted_at is null do nothing;

