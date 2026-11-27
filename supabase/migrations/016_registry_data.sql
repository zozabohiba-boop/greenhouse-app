-- 016: سجل المبيدات — المواد الفعالة وحدود المتبقيات (مولّد من scripts/knowledge/pesticides_data.json)
-- لا تعدّل يدويًا: عدّل البيانات في JSON وأعد التوليد. كل رقم معه مصدره وتاريخ قراءته.

insert into public.active_substances (farm_id, name_en, name_ar, cas_no, classes, moa_system, moa_code, chemical_group, eu_status, eu_expiry, eu_cfs, notes, source_url, reviewed_on)
values
  (null, 'abamectin', 'أبامكتين', '71751-41-2', array['insecticide', 'acaricide', 'nematicide']::text[], 'IRAC', '6', 'avermectins', 'approved', '2038-03-31', false, null, 'https://echa.europa.eu/sv/ann-approved-act-subs-plant-prot-prods/-/legislationlist/substance/external/100.113.437', '2026-11-27'),
  (null, 'emamectin benzoate', 'إيمامكتين بنزوات', '155569-91-8', array['insecticide']::text[], 'IRAC', '6', 'avermectins', 'approved', '2029-05-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1326.htm', '2026-11-27'),
  (null, 'chlorantraniliprole', 'كلورانترانيليبرول', '500008-45-7', array['insecticide']::text[], 'IRAC', '28', 'diamides', 'approved', '2027-05-31', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1138.htm', '2026-11-27'),
  (null, 'cyantraniliprole', 'سيانترانيليبرول', '736994-63-1', array['insecticide']::text[], 'IRAC', '28', 'diamides', 'approved', '2030-03-14', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1662.htm', '2026-11-27'),
  (null, 'spinosad', 'سبينوساد', '168316-95-8', array['insecticide']::text[], 'IRAC', '5', 'spinosyns', 'approved', '2041-04-01', false, null, 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/596.htm', '2026-11-27'),
  (null, 'spinetoram', 'سبينتورام', '935545-74-7', array['insecticide']::text[], 'IRAC', '5', 'spinosyns', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1144.htm', '2026-11-27'),
  (null, 'indoxacarb', 'إندوكساكارب', '173584-44-6', array['insecticide']::text[], 'IRAC', '22A', 'oxadiazines', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/399.htm', '2026-11-27'),
  (null, 'lufenuron', 'لوفينيورون', '103055-07-8', array['insecticide']::text[], 'IRAC', '15', 'benzoylureas', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/420.htm', '2026-11-27'),
  (null, 'methoxyfenozide', 'ميثوكسي فينوزايد', '161050-58-4', array['insecticide']::text[], 'IRAC', '18', 'diacylhydrazines', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/461.htm', '2026-11-27'),
  (null, 'imidacloprid', 'إيميداكلوبريد', '138261-41-3', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/397.htm', '2026-11-27'),
  (null, 'spirotetramat', 'سبيروتترامات', '203313-25-1', array['insecticide']::text[], 'IRAC', '23', 'tetronic and tetramic acid derivatives', 'not_approved', null, null, 'غير معتمد حاليًا في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1119.htm', '2026-11-27'),
  (null, 'acetamiprid', 'أسيتامبريد', '135410-20-7', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'approved', '2033-02-28', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/11.htm', '2026-11-27'),
  (null, 'thiamethoxam', 'ثياميثوكسام', '153719-23-4', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/631.htm', '2026-11-27'),
  (null, 'dinotefuran', 'دينوتيفوران', '165252-70-0', array['insecticide']::text[], 'IRAC', '4A', 'neonicotinoids', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1195.htm', '2026-11-27'),
  (null, 'pyriproxyfen', 'بيريبروكسيفين', '95737-68-1', array['insecticide']::text[], 'IRAC', '7C', 'juvenile hormone mimics', 'approved', '2035-07-31', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/574.htm', '2026-11-27'),
  (null, 'buprofezin', 'بوبروفيزين', null, array['insecticide']::text[], 'IRAC', '16', 'unclassified IGR', 'approved', '2027-03-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/100.htm', '2026-11-27'),
  (null, 'spirodiclofen', 'سبيروديكلوفين', '148477-71-8', array['acaricide', 'insecticide']::text[], 'IRAC', '23', 'tetronic and tetramic acid derivatives', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/597.htm', '2026-11-27'),
  (null, 'spiromesifen', 'سبيروميسيفين', '283594-90-1', array['insecticide', 'acaricide']::text[], 'IRAC', '23', 'tetronic and tetramic acid derivatives', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/598.htm', '2026-11-27'),
  (null, 'flonicamid', 'فلونيكاميد', '158062-67-0', array['insecticide']::text[], 'IRAC', '29', 'pyridine insecticide', 'approved', '2029-10-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/321.htm', '2026-11-27'),
  (null, 'flupyradifurone', 'فلوبيراديفيورون', '951659-40-8', array['insecticide']::text[], 'IRAC', '4D', 'butenolides', 'approved', '2029-06-09', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2620.htm', '2026-11-27'),
  (null, 'sulfoxaflor', 'سلفوكسافلور', '946578-00-3', array['insecticide']::text[], 'IRAC', '4C', 'sulfoximines', 'approved', '2028-01-18', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1669.htm', '2026-11-27'),
  (null, 'pymetrozine', 'بيميتروزين', '123312-89-0', array['insecticide']::text[], 'IRAC', '9B', 'pyridine azomethine derivatives', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/562.htm', '2026-11-27'),
  (null, 'lambda-cyhalothrin', 'لامبدا سيهالوثرين', '91465-08-6', array['insecticide']::text[], 'IRAC', '3A', 'pyrethroids', 'approved', '2029-01-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/415.htm', '2026-11-27'),
  (null, 'alpha-cypermethrin', 'ألفا سيبرمثرين', '67375-30-8', array['insecticide']::text[], 'IRAC', '3A', 'pyrethroids', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/24.htm', '2026-11-27'),
  (null, 'chlorfenapyr', 'كلورفينابير', '122453-73-0', array['insecticide', 'acaricide']::text[], 'IRAC', '13', 'pyrroles', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/136.htm', '2026-11-27'),
  (null, 'hexythiazox', 'هكسيثيازوكس', '78587-05-0', array['acaricide']::text[], 'IRAC', '10A', 'thiazolidines', 'approved', '2027-01-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/385.htm', '2026-11-27'),
  (null, 'etoxazole', 'إيتوكسازول', '153233-91-1', array['acaricide']::text[], 'IRAC', '10B', 'diphenyl oxazolines', 'approved', '2028-01-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/284.htm', '2026-11-27'),
  (null, 'fenpyroximate', 'فينبيروكسيميت', '134098-61-6', array['acaricide', 'insecticide']::text[], 'IRAC', '21A', 'METI acaricides and insecticides', 'approved', '2028-01-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/309.htm', '2026-11-27'),
  (null, 'bifenazate', 'بيفينازيت', '149877-41-8', array['acaricide']::text[], 'IRAC', '20D', 'carbazates', 'approved', '2037-06-30', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/76.htm', '2026-11-27'),
  (null, 'pyridaben', 'بيريدابين', '96489-71-3', array['acaricide', 'insecticide']::text[], 'IRAC', '21A', 'METI acaricides and insecticides', 'approved', '2030-01-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/569.htm', '2026-11-27'),
  (null, 'chlorpyrifos', 'كلوربيريفوس', '2921-88-2', array['insecticide']::text[], 'IRAC', '1B', 'organophosphates', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/154.htm', '2026-11-27'),
  (null, 'profenofos', 'بروفينوفوس', '41198-08-7', array['insecticide', 'acaricide']::text[], 'IRAC', '1B', 'organophosphates', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/538.htm', '2026-11-27'),
  (null, 'methomyl', 'ميثوميل', '16752-77-5', array['insecticide']::text[], 'IRAC', '1A', 'carbamates', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/458.htm', '2026-11-27'),
  (null, 'dimethoate', 'دايميثويت', '60-51-5', array['insecticide', 'acaricide']::text[], 'IRAC', '1B', 'organophosphates', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/244.htm', '2026-11-27'),
  (null, 'oxamyl', 'أوكساميل', '23135-22-0', array['insecticide', 'nematicide']::text[], 'IRAC', '1A', 'carbamates', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/498.htm', '2026-11-27'),
  (null, 'fosthiazate', 'فوستيازيت', '98886-44-3', array['nematicide', 'insecticide']::text[], 'IRAC', '1B', 'organophosphates', 'approved', '2027-01-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/364.htm', '2026-11-27'),
  (null, 'fluopyram', 'فلوبيرام', '658066-35-4', array['fungicide', 'nematicide']::text[], 'FRAC', '7', 'SDHI - pyridinyl-ethylbenzamides', 'approved', '2028-06-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1362.htm', '2026-11-27'),
  (null, 'azoxystrobin', 'أزوكسيستروبين', '131860-33-8', array['fungicide']::text[], 'FRAC', '11', 'QoI - methoxy-acrylates', 'approved', '2027-05-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/54.htm', '2026-11-27'),
  (null, 'pyraclostrobin', 'بيراكلوستروبين', '175013-18-0', array['fungicide']::text[], 'FRAC', '11', 'QoI - methoxy-carbamates', 'approved', '2041-09-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1976 (renewal) — https://www.boe.es/doue/2026/1976/L00001-00006.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/564.htm', '2026-11-27'),
  (null, 'trifloxystrobin', 'ترايفلوكسيستروبين', '141517-21-7', array['fungicide']::text[], 'FRAC', '11', 'QoI - oximino-acetates', 'approved', '2033-07-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/664.htm', '2026-11-27'),
  (null, 'difenoconazole', 'دايفينوكونازول', '119446-68-3', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2028-01-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/230.htm', '2026-11-27'),
  (null, 'tebuconazole', 'تيبوكونازول', '107534-96-3', array['fungicide', 'plant_growth_regulator']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2028-07-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/610.htm', '2026-11-27'),
  (null, 'penconazole', 'بنكونازول', '66246-88-6', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2029-02-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/509.htm', '2026-11-27'),
  (null, 'myclobutanil', 'مايكلوبيوتانيل', '88671-89-0', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/478.htm', '2026-11-27'),
  (null, 'tetraconazole', 'تتراكونازول', '112281-77-3', array['fungicide']::text[], 'FRAC', '3', 'DMI - triazoles', 'approved', '2027-03-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/626.htm', '2026-11-27'),
  (null, 'boscalid', 'بوسكاليد', '188425-85-6', array['fungicide']::text[], 'FRAC', '7', 'SDHI - pyridine-carboxamides', 'approved', '2028-03-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/86.htm', '2026-11-27'),
  (null, 'cyprodinil', 'سيبرودينيل', '121552-61-2', array['fungicide']::text[], 'FRAC', '9', 'AP - anilino-pyrimidines', 'approved', '2027-07-31', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/199.htm', '2026-11-27'),
  (null, 'fludioxonil', 'فلوديوكسونيل', '131341-86-1', array['fungicide']::text[], 'FRAC', '12', 'PP - phenylpyrroles', 'approved', '2027-09-30', true, 'مرشح للاستبدال في الاتحاد الأوروبي — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/330.htm', '2026-11-27'),
  (null, 'iprodione', 'إبروديون', '36734-19-7', array['fungicide']::text[], 'FRAC', '2', 'dicarboximides', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/403.htm', '2026-11-27'),
  (null, 'mancozeb', 'مانكوزيب', '8018-01-7', array['fungicide']::text[], 'FRAC', 'M 03', 'dithiocarbamates and relatives', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/424.htm', '2026-11-27'),
  (null, 'chlorothalonil', 'كلوروثالونيل', '1897-45-6', array['fungicide']::text[], 'FRAC', 'M 05', 'chloronitriles (phthalonitriles)', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/150.htm', '2026-11-27'),
  (null, 'copper hydroxide', 'هيدروكسيد النحاس', '20427-59-2', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'مركبات النحاس مرشحة للاستبدال في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/175.htm', '2026-11-27'),
  (null, 'copper oxychloride', 'أوكسي كلوريد النحاس', '1332-40-7', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'مركبات النحاس مرشحة للاستبدال في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/177.htm', '2026-11-27'),
  (null, 'sulfur', 'كبريت', '7704-34-9', array['fungicide', 'acaricide']::text[], 'FRAC', 'M 02', 'inorganic (sulphur)', 'approved', '2027-07-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/605.htm', '2026-11-27'),
  (null, 'metalaxyl-M', 'ميتالاكسيل-إم (ميفينوكسام)', '70630-17-0', array['fungicide']::text[], 'FRAC', '4', 'PA - acylalanines', 'approved', '2035-05-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/445.htm', '2026-11-27'),
  (null, 'cymoxanil', 'سيموكسانيل', '57966-95-7', array['fungicide']::text[], 'FRAC', '27', 'cyanoacetamide-oximes', 'approved', '2027-11-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/196.htm', '2026-11-27'),
  (null, 'dimethomorph', 'دايميثومورف', '110488-70-5', array['fungicide']::text[], 'FRAC', '40', 'CAA - cinnamic acid amides', 'not_approved', null, null, 'غير معتمد حاليًا في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/245.htm', '2026-11-27'),
  (null, 'mandipropamid', 'ماندي بروباميد', '374726-62-2', array['fungicide']::text[], 'FRAC', '40', 'CAA - mandelic acid amides', 'approved', '2029-06-30', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/425.htm', '2026-11-27'),
  (null, 'fosetyl', 'فوسيتيل ألومنيوم', '39148-24-8', array['fungicide']::text[], 'FRAC', 'P 07', 'phosphonates (ethyl phosphonates)', 'approved', '2028-01-31', false, 'البيانات لفوسيتيل-ألومنيوم (fosetyl-aluminium) — تاريخ الانتهاء مراجع في Reg. (EU) 2026/1826 — https://www.boe.es/doue/2026/1826/L00001-00014.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/363.htm', '2026-11-27'),
  (null, 'propamocarb', 'بروباموكارب', '24579-73-5', array['fungicide']::text[], 'FRAC', '28', 'carbamates', 'approved', '2027-01-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1546.htm', '2026-11-27'),
  (null, 'famoxadone', 'فاموكسادون', '131807-57-3', array['fungicide']::text[], 'FRAC', '11', 'QoI - oxazolidine-diones', 'not_approved', null, null, 'غير معتمد في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/287.htm', '2026-11-27'),
  (null, 'ametoctradin', 'أميتوكترادين', '865318-97-4', array['fungicide']::text[], 'FRAC', '45', 'QoSI - triazolo-pyrimidylamines', 'approved', '2028-05-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1648.htm', '2026-11-27'),
  (null, 'thiophanate-methyl', 'ثيوفانات ميثيل', '23564-05-8', array['fungicide']::text[], 'FRAC', '1', 'MBC - thiophanates', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/640.htm', '2026-11-27'),
  (null, 'carbendazim', 'كاربندازيم', '10605-21-7', array['fungicide']::text[], 'FRAC', '1', 'MBC - benzimidazoles', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/116.htm', '2026-11-27'),
  (null, 'hymexazol', 'هيميكسازول', '10004-44-1', array['fungicide']::text[], 'FRAC', '32', 'isoxazoles', 'approved', '2029-01-31', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/388.htm', '2026-11-27'),
  (null, 'fluazinam', 'فلوازينام', '79622-59-6', array['fungicide']::text[], 'FRAC', '29', '2,6-dinitro-anilines (uncouplers)', 'approved', '2027-11-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/325.htm', '2026-11-27'),
  (null, 'cyflufenamid', 'سيفلوفيناميد', '180409-60-3', array['fungicide']::text[], 'FRAC', 'U 06', 'phenyl-acetamides', 'approved', '2027-06-30', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/191.htm', '2026-11-27'),
  (null, 'bupirimate', 'بيوبيريميت', '41483-43-6', array['fungicide']::text[], 'FRAC', '8', 'hydroxy-(2-amino-)pyrimidines', 'approved', '2027-01-31', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/99.htm', '2026-11-27'),
  (null, 'milbemectin', 'ميلبيمكتين', '51596-11-3', array['insecticide', 'acaricide']::text[], 'IRAC', '6', 'milbemycins', 'approved', '2040-11-15', false, 'رقم CAS للمكوّن MA4', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/472.htm', '2026-11-27'),
  (null, 'quinoxyfen', 'كينوكسيفين', '124495-18-7', array['fungicide']::text[], 'FRAC', '13', 'aryloxyquinolines', 'not_approved', null, null, 'انتهى اعتماده في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/580.htm', '2026-11-27'),
  (null, 'glyphosate', 'جليفوسات', '1071-83-6', array['herbicide']::text[], 'HRAC', '9', 'organophosphonates (phosphonoglycines)', 'approved', '2033-12-15', false, null, 'https://sitem.herts.ac.uk/aeru/iupac/Reports/373.htm', '2026-11-27'),
  (null, 'potassium hydrogen carbonate', 'بيكربونات البوتاسيوم', '298-14-6', array['fungicide']::text[], 'FRAC', 'NC', 'inorganic salts', 'approved', '2036-10-31', false, 'مادة منخفضة الخطورة في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1624.htm', '2026-11-27'),
  (null, 'bacillus amyloliquefaciens qst 713', 'باسيلس سبتلس سلالة QST 713', null, array['fungicide', 'biological']::text[], 'FRAC', 'BM 02', 'Bacillus spp. (microbial)', 'approved', '2038-06-30', false, 'كانت تُعرف سابقًا باسم Bacillus subtilis QST 713 — مادة منخفضة الخطورة في الاتحاد الأوروبي', 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1949.htm', '2026-11-27'),
  (null, 'paraffin oil (cas 8042-47-5)', 'زيت البارافين', '8042-47-5', array['insecticide', 'acaricide']::text[], 'IRAC', 'UNM', 'mineral oils', 'approved', '2041-06-30', false, 'IRAC يصنّف الزيوت المعدنية تحت UNM — تاريخ الانتهاء مراجع في Reg. (EU) 2026/870 (renewal) — https://www.boe.es/doue/2026/870/L00001-00005.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1377.htm', '2026-11-27'),
  (null, 'paraffin oil (cas 64742-46-7)', 'زيت البارافين', '64742-46-7', array['insecticide', 'acaricide', 'fungicide']::text[], 'IRAC', 'UNM', 'mineral oils', 'approved', '2027-03-31', false, 'IRAC يصنّف الزيوت المعدنية تحت UNM', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/1376.htm', '2026-11-27'),
  (null, 'azadirachtin', 'أزاديراختين', '11141-17-6', array['insecticide']::text[], 'IRAC', 'UN', 'compounds of unknown or uncertain MoA', 'approved', '2027-01-31', false, 'رقم CAS للأزاديراختين A', 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/46.htm', '2026-11-27'),
  (null, 'bacillus thuringiensis subsp. kurstaki abts 351', 'باسيلس ثورينجنسيس (كورستاكي)', null, array['insecticide', 'biological']::text[], 'IRAC', '11A', 'Bacillus thuringiensis and insecticidal proteins', 'approved', '2038-06-30', false, null, 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/57.htm', '2026-11-27'),
  (null, 'bacillus thuringiensis subsp. aizawai abts-1857', 'باسيلس ثورينجنسيس (أيزاواي)', null, array['insecticide', 'biological']::text[], 'IRAC', '11A', 'Bacillus thuringiensis and insecticidal proteins', 'approved', '2038-06-30', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/3221.htm', '2026-11-27'),
  (null, 'bacillus thuringiensis subsp. aizawai gc-91', 'باسيلس ثورينجنسيس (أيزاواي)', null, array['insecticide', 'biological']::text[], 'IRAC', '11A', 'Bacillus thuringiensis and insecticidal proteins', 'approved', '2038-06-30', false, null, 'https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/1942.htm', '2026-11-27'),
  (null, 'beauveria bassiana atcc 74040', 'بوفيريا باسيانا', null, array['insecticide', 'biological']::text[], 'IRAC', 'UNF', null, 'approved', '2027-09-30', false, null, 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/1394.htm', '2026-11-27'),
  (null, 'beauveria bassiana gha', 'بوفيريا باسيانا', null, array['insecticide', 'biological']::text[], 'IRAC', 'UNF', null, 'approved', '2027-09-15', false, null, 'https://sitem.herts.ac.uk/aeru/bpdb/Reports/2514.htm', '2026-11-27'),
  (null, 'copper sulphate tribasic', 'كبريتات النحاس الثلاثية القاعدية', '12527-76-3', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'من كتالوج التطبيق (كبريتات النحاس) — مركبات النحاس مرشحة للاستبدال', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/178.htm', '2026-11-27'),
  (null, 'bordeaux mixture', 'مخلوط بوردو', '8011-63-0', array['fungicide']::text[], 'FRAC', 'M 01', 'inorganic (copper)', 'approved', '2029-06-30', true, 'من كتالوج التطبيق (بوردو) — مركبات النحاس مرشحة للاستبدال', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/85.htm', '2026-11-27'),
  (null, 'fatty acids potassium salts', 'صابون البوتاسيوم (أملاح البوتاسيوم للأحماض الدهنية)', '67701-09-1', array['insecticide', 'fungicide']::text[], null, null, 'fatty acids (potassium salts)', 'approved', '2028-01-31', false, 'من كتالوج التطبيق (صابون البوتاسيوم) — غير مدرج في قائمة IRAC', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/3585.htm', '2026-11-27'),
  (null, 'acequinocyl', 'أسيكينوسيل', '57960-19-7', array['acaricide']::text[], 'IRAC', '20B', null, 'approved', '2029-01-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/2348 — https://eur-lex.europa.eu/eli/reg_impl/2026/2348/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/10.htm', '2026-11-27'),
  (null, 'malathion', 'ملاثيون', '121-75-5', array['insecticide', 'acaricide']::text[], 'IRAC', '1B', 'organophosphates', 'approved', '2028-07-15', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/372 — https://www.boe.es/doue/2026/372/L00001-00011.pdf', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/421.htm', '2026-11-27'),
  (null, 'deltamethrin', 'دلتامثرين', '52918-63-5', array['insecticide']::text[], 'IRAC', '3A', 'pyrethroids', 'approved', '2028-06-30', false, 'تاريخ الانتهاء مراجع في Reg. (EU) 2026/1421 — https://eur-lex.europa.eu/eli/reg_impl/2026/1421/oj/eng', 'https://sitem.herts.ac.uk/aeru/iupac/Reports/205.htm', '2026-11-27')
on conflict (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name_en)) do update set
  name_ar = excluded.name_ar, cas_no = excluded.cas_no, classes = excluded.classes, moa_system = excluded.moa_system,
  moa_code = excluded.moa_code, chemical_group = excluded.chemical_group, eu_status = excluded.eu_status,
  eu_expiry = excluded.eu_expiry, eu_cfs = excluded.eu_cfs, notes = excluded.notes, source_url = excluded.source_url,
  reviewed_on = excluded.reviewed_on, deleted_at = null, updated_at = now(), server_updated_at = now();

with raw as (select l from regexp_split_to_table($d$
abamectin|CODEX|tomato|0.05|x5f509a14-199b-f111-b8dc-70a8a5613865|Tomato
abamectin|CODEX|pepper|0.09|x5f509a14-199b-f111-b8dc-70a8a5613865|Peppers, sweet (including pimento or pimiento)
abamectin|CODEX|cucumber|0.03|x5f509a14-199b-f111-b8dc-70a8a5613865|Cucumber
abamectin|CODEX|strawberry|0.15|x5f509a14-199b-f111-b8dc-70a8a5613865|Strawberry
abamectin|CODEX|eggplant|0.05|x5f509a14-199b-f111-b8dc-70a8a5613865|Eggplant
abamectin|CODEX|melon|0.01|x5f509a14-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)
abamectin|CODEX|green_bean|0.08|x5f509a14-199b-f111-b8dc-70a8a5613865|Beans with pods (Phaseolus spp.) (immature pods and succulent seeds)
acetamiprid|CODEX|tomato|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
acetamiprid|CODEX|pepper|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
acetamiprid|CODEX|cucumber|0.3|xa3509a14-199b-f111-b8dc-70a8a5613865|Cucumber
acetamiprid|CODEX|strawberry|0.5|xa3509a14-199b-f111-b8dc-70a8a5613865|Strawberry
acetamiprid|CODEX|eggplant|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
acetamiprid|CODEX|melon|0.2|xa3509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
acetamiprid|CODEX|green_bean|0.4|xa3509a14-199b-f111-b8dc-70a8a5613865|Beans with pods (Phaseolus spp.) (immature pods and succulent seeds)
ametoctradin|CODEX|tomato|1.5|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
ametoctradin|CODEX|pepper|1.5|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
ametoctradin|CODEX|cucumber|0.4|xb2509a14-199b-f111-b8dc-70a8a5613865|Cucumber
ametoctradin|CODEX|eggplant|1.5|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
ametoctradin|CODEX|melon|3.0|xb2509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
azoxystrobin|CODEX|tomato|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
azoxystrobin|CODEX|pepper|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
azoxystrobin|CODEX|cucumber|1.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
azoxystrobin|CODEX|strawberry|10.0|x93509a14-199b-f111-b8dc-70a8a5613865|Strawberry
azoxystrobin|CODEX|eggplant|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
azoxystrobin|CODEX|melon|5.0|x93509a14-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)
azoxystrobin|CODEX|green_bean|3.0|x93509a14-199b-f111-b8dc-70a8a5613865|Legume vegetables (group)
bifenazate|CODEX|tomato|0.5|x88509a14-199b-f111-b8dc-70a8a5613865|Tomato
bifenazate|CODEX|pepper|2.0|x88509a14-199b-f111-b8dc-70a8a5613865|Peppers, sweet (including pimento or pimiento)
bifenazate|CODEX|cucumber|0.5|x88509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
bifenazate|CODEX|strawberry|2.0|x88509a14-199b-f111-b8dc-70a8a5613865|Strawberry
bifenazate|CODEX|melon|0.5|x88509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
bifenazate|CODEX|green_bean|7.0|x88509a14-199b-f111-b8dc-70a8a5613865|Legume vegetables (group)
boscalid|CODEX|tomato|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
boscalid|CODEX|pepper|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
boscalid|CODEX|cucumber|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
boscalid|CODEX|strawberry|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Strawberry
boscalid|CODEX|eggplant|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
boscalid|CODEX|melon|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
boscalid|CODEX|green_bean|3.0|x8e509a14-199b-f111-b8dc-70a8a5613865|Legume vegetables (group)
buprofezin|CODEX|tomato|1.0|x5c509a14-199b-f111-b8dc-70a8a5613865|Tomato
buprofezin|CODEX|pepper|2.0|x5c509a14-199b-f111-b8dc-70a8a5613865|Peppers (subgroup)
buprofezin|CODEX|cucumber|0.7|x5c509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
buprofezin|CODEX|strawberry|3.0|x5c509a14-199b-f111-b8dc-70a8a5613865|Strawberry
buprofezin|CODEX|melon|0.7|x5c509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
chlorantraniliprole|CODEX|tomato|0.6|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
chlorantraniliprole|CODEX|pepper|0.6|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
chlorantraniliprole|CODEX|cucumber|0.3|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
chlorantraniliprole|CODEX|strawberry|1.0|x94509a14-199b-f111-b8dc-70a8a5613865|Berries and other small fruits
chlorantraniliprole|CODEX|eggplant|0.6|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, other than cucurbits (group)
chlorantraniliprole|CODEX|melon|0.3|x94509a14-199b-f111-b8dc-70a8a5613865|Fruiting vegetables, cucurbits (group)
chlorantraniliprole|CODEX|green_bean|0.8|x94509a14-199b-f111-b8dc-70a8a5613865|Beans with pods (Phaseolus spp.) (immature pods and succulent seeds)
chlorfenapyr|CODEX|tomato|0.4|xab509a14-199b-f111-b8dc-70a8a5613865|Tomato
chlorfenapyr|CODEX|pepper|0.3|xab509a14-199b-f111-b8dc-70a8a5613865|Peppers (subgroup)
chlorfenapyr|CODEX|melon|0.4|xab509a14-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)
chlorothalonil|CODEX|tomato|5.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Tomato
chlorothalonil|CODEX|pepper|7.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Peppers (subgroup)
chlorothalonil|CODEX|cucumber|3.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Cucumber
chlorothalonil|CODEX|strawberry|5.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Strawberry
chlorothalonil|CODEX|melon|2.0|x028f9f0e-199b-f111-b8dc-70a8a5613865|Melons (except watermelon)
abamectin|US|tomato|0.07|c449|Vegetable, fruiting, group 8-10
abamectin|US|pepper|0.07|c449|Vegetable, fruiting, group 8-10
abamectin|US|eggplant|0.07|c449|Vegetable, fruiting, group 8-10
abamectin|US|cucumber|0.005|c449|Vegetable, cucurbit, group 9
abamectin|US|melon|0.005|c449|Vegetable, cucurbit, group 9
abamectin|US|green_bean|0.08|c449|Vegetable, legume, edible podded, subgroup 6A
abamectin|US|strawberry|0.05|c449|Berry, low growing, subgroup 13-07G
emamectin benzoate|US|tomato|0.02|c505|Vegetable, fruiting, group 8-10
emamectin benzoate|US|pepper|0.02|c505|Vegetable, fruiting, group 8-10
emamectin benzoate|US|eggplant|0.02|c505|Vegetable, fruiting, group 8-10
emamectin benzoate|US|cucumber|0.02|c505|Vegetable, cucurbit, group 9
emamectin benzoate|US|melon|0.02|c505|Vegetable, cucurbit, group 9
mandipropamid|US|tomato|1.0|c637|Vegetable, fruiting, group 8-10
mandipropamid|US|pepper|1.0|c637|Vegetable, fruiting, group 8-10
mandipropamid|US|eggplant|1.0|c637|Vegetable, fruiting, group 8-10
mandipropamid|US|cucumber|0.6|c637|Vegetable, cucurbit, group 9
mandipropamid|US|melon|0.6|c637|Vegetable, cucurbit, group 9
mandipropamid|US|green_bean|0.9|c637|Bean (Phaseolus spp.), edible podded
chlorantraniliprole|US|tomato|1.4|c628|Vegetable, fruiting, group 8-10
chlorantraniliprole|US|pepper|1.4|c628|Vegetable, fruiting, group 8-10
chlorantraniliprole|US|eggplant|1.4|c628|Vegetable, fruiting, group 8-10
chlorantraniliprole|US|cucumber|0.5|c628|Vegetable, cucurbit, group 9
chlorantraniliprole|US|melon|0.5|c628|Vegetable, cucurbit, group 9
chlorantraniliprole|US|strawberry|1.0|c628|Berry, low growing, subgroup 13-07G
cyantraniliprole|US|tomato|2.0|c672|Vegetable, fruiting, group 8-10
cyantraniliprole|US|pepper|2.0|c672|Vegetable, fruiting, group 8-10
cyantraniliprole|US|eggplant|2.0|c672|Vegetable, fruiting, group 8-10
cyantraniliprole|US|cucumber|0.7|c672|Vegetable, cucurbit, group 9
cyantraniliprole|US|melon|0.7|c672|Vegetable, cucurbit, group 9
cyantraniliprole|US|strawberry|1.5|c672|Strawberry
cyantraniliprole|US|green_bean|2.0|c672|Vegetable, legume, bean, edible podded, subgroup 6-22A
spinosad|US|tomato|0.4|c495|Vegetable, fruiting, group 8-10
spinosad|US|pepper|0.4|c495|Vegetable, fruiting, group 8-10
spinosad|US|eggplant|0.4|c495|Vegetable, fruiting, group 8-10
spinosad|US|cucumber|0.3|c495|Vegetable, cucurbit, group 9
spinosad|US|melon|0.3|c495|Vegetable, cucurbit, group 9
spinosad|US|strawberry|0.9|c495|Berry, low growing, subgroup 13-07G, except cranberry
spinosad|US|green_bean|0.3|c495|Vegetable, legume, edible podded, subgroup 6A
spinetoram|US|tomato|0.4|c635|Vegetable, fruiting, group 8-10
spinetoram|US|pepper|0.4|c635|Vegetable, fruiting, group 8-10
spinetoram|US|eggplant|0.4|c635|Vegetable, fruiting, group 8-10
spinetoram|US|cucumber|0.3|c635|Vegetable, cucurbit, group 9
spinetoram|US|melon|0.3|c635|Vegetable, cucurbit, group 9
spinetoram|US|strawberry|0.9|c635|Berry, low growing, subgroup 13-07G, except cranberry
spinetoram|US|green_bean|0.3|c635|Vegetable, legume, edible podded, subgroup 6A
indoxacarb|US|tomato|0.5|c564|Vegetable, fruiting, group 8-10
indoxacarb|US|pepper|0.5|c564|Vegetable, fruiting, group 8-10
indoxacarb|US|eggplant|0.5|c564|Vegetable, fruiting, group 8-10
indoxacarb|US|cucumber|0.6|c564|Vegetable, cucurbit, group 9
indoxacarb|US|melon|0.6|c564|Vegetable, cucurbit, group 9
indoxacarb|US|strawberry|4.0|c564|Strawberry
indoxacarb|US|green_bean|0.9|c564|Vegetable, legume, bean, edible podded, subgroup 6-22A
methoxyfenozide|US|tomato|2.0|c544|Vegetable, fruiting, group 8-10
methoxyfenozide|US|pepper|2.0|c544|Vegetable, fruiting, group 8-10
methoxyfenozide|US|eggplant|2.0|c544|Vegetable, fruiting, group 8-10
methoxyfenozide|US|cucumber|0.3|c544|Vegetable, cucurbit, group 9
methoxyfenozide|US|melon|0.3|c544|Vegetable, cucurbit, group 9
methoxyfenozide|US|strawberry|2.0|c544|Berry, low growing, subgroup 13-07G, except cranberry
methoxyfenozide|US|green_bean|2.0|c544|Edible podded bean subgroup 6-22A
imidacloprid|US|tomato|1.0|c472|Vegetable, fruiting, group 8
imidacloprid|US|pepper|1.0|c472|Vegetable, fruiting, group 8
imidacloprid|US|eggplant|1.0|c472|Vegetable, fruiting, group 8
imidacloprid|US|cucumber|0.5|c472|Vegetable, cucurbit, group 9
imidacloprid|US|melon|0.5|c472|Vegetable, cucurbit, group 9
imidacloprid|US|strawberry|0.5|c472|Strawberry
spirotetramat|US|tomato|2.5|c641|Vegetable, fruiting, group 8-10
spirotetramat|US|pepper|2.5|c641|Vegetable, fruiting, group 8-10
spirotetramat|US|eggplant|2.5|c641|Vegetable, fruiting, group 8-10
spirotetramat|US|cucumber|0.3|c641|Vegetable, cucurbit, group 9
spirotetramat|US|melon|0.3|c641|Vegetable, cucurbit, group 9
spirotetramat|US|strawberry|0.4|c641|Strawberry — لا تسجيلات أمريكية لهذه السلعة (حاشية اللائحة)
lambda-cyhalothrin|US|tomato|0.1|c438|Tomato
lambda-cyhalothrin|US|pepper|0.2|c438|Vegetable, fruiting, group 8
lambda-cyhalothrin|US|eggplant|0.2|c438|Vegetable, fruiting, group 8
lambda-cyhalothrin|US|cucumber|0.05|c438|Vegetable, cucurbit, group 9
lambda-cyhalothrin|US|melon|0.05|c438|Vegetable, cucurbit, group 9
lambda-cyhalothrin|US|green_bean|0.2|c438|Vegetable, legume, edible podded, subgroup 6A
alpha-cypermethrin|US|tomato|0.2|c418|Vegetable, fruiting, group 8-10 — سيبرمثرين وأيزومراته
alpha-cypermethrin|US|pepper|0.2|c418|Vegetable, fruiting, group 8-10 — سيبرمثرين وأيزومراته
alpha-cypermethrin|US|eggplant|0.2|c418|Vegetable, fruiting, group 8-10 — سيبرمثرين وأيزومراته
alpha-cypermethrin|US|cucumber|0.2|c418|Vegetable, cucurbit, group 9 — سيبرمثرين وأيزومراته
alpha-cypermethrin|US|melon|0.2|c418|Vegetable, cucurbit, group 9 — سيبرمثرين وأيزومراته
alpha-cypermethrin|US|green_bean|0.7|c418|Bean, green, edible podded — سيبرمثرين وأيزومراته (جدول 2)
chlorfenapyr|US|tomato|2.0|c513|Vegetable, fruiting, group 8-10
chlorfenapyr|US|pepper|2.0|c513|Vegetable, fruiting, group 8-10
chlorfenapyr|US|eggplant|2.0|c513|Vegetable, fruiting, group 8-10
chlorfenapyr|US|cucumber|0.5|c513|Cucumber
hexythiazox|US|strawberry|6.0|c448|Berry, low growing, subgroup 13-07G
hexythiazox|US|tomato|0.5|c448|Tomato
hexythiazox|US|pepper|1.5|c448|Pepper/eggplant subgroup 8-10B
hexythiazox|US|eggplant|1.5|c448|Pepper/eggplant subgroup 8-10B
etoxazole|US|pepper|0.2|c593|Pepper/eggplant subgroup 8-10B
etoxazole|US|eggplant|0.2|c593|Pepper/eggplant subgroup 8-10B
etoxazole|US|tomato|0.2|c593|Tomato
etoxazole|US|cucumber|0.02|c593|Squash/cucumber subgroup 9B
etoxazole|US|melon|0.2|c593|Melon subgroup 9A
etoxazole|US|strawberry|0.5|c593|Berry, low growing, subgroup 13-07G
fenpyroximate|US|tomato|0.2|c566|Vegetable, fruiting, group 8-10
fenpyroximate|US|pepper|0.2|c566|Vegetable, fruiting, group 8-10
fenpyroximate|US|eggplant|0.2|c566|Vegetable, fruiting, group 8-10
fenpyroximate|US|cucumber|0.4|c566|Squash/cucumber subgroup 9B
fenpyroximate|US|melon|0.1|c566|Melon subgroup 9A
fenpyroximate|US|strawberry|1.0|c566|Berry, low growing, subgroup 13-07G
fenpyroximate|US|green_bean|0.4|c566|Bean, snap, succulent
bifenazate|US|tomato|4.0|c572|Vegetable, fruiting, group 8-10
bifenazate|US|pepper|4.0|c572|Vegetable, fruiting, group 8-10
bifenazate|US|eggplant|4.0|c572|Vegetable, fruiting, group 8-10
bifenazate|US|cucumber|0.75|c572|Vegetable, cucurbit, group 9
bifenazate|US|melon|0.75|c572|Vegetable, cucurbit, group 9
bifenazate|US|strawberry|1.5|c572|Strawberry
bifenazate|US|green_bean|6.0|c572|Vegetable, legume, edible-podded, subgroup 6A
pyridaben|US|strawberry|2.5|c494|Berry, low growing, subgroup 13-07G, except cranberry
pyridaben|US|cucumber|0.5|c494|Cucumber
pyridaben|US|tomato|0.15|c494|Tomato
chlorpyrifos|US|cucumber|0.05|c342|Cucumber
chlorpyrifos|US|pepper|1.0|c342|Pepper
chlorpyrifos|US|strawberry|0.2|c342|Strawberry
methomyl|US|pepper|2.0|c253|Pepper, bell
methomyl|US|tomato|1.0|c253|Tomato
methomyl|US|eggplant|0.2|c253|Vegetable, fruiting, group 8
methomyl|US|cucumber|0.2|c253|Vegetable, cucurbit, group 9
methomyl|US|melon|0.2|c253|Vegetable, cucurbit, group 9
dimethoate|US|tomato|2.0|c204|Tomato
dimethoate|US|pepper|2.0|c204|Pepper
dimethoate|US|melon|1.0|c204|Melon
dimethoate|US|green_bean|2.0|c204|Bean, snap, succulent
oxamyl|US|tomato|2.0|c303|Tomato
oxamyl|US|pepper|2.0|c303|Pepper, bell — الفلفل الحار 5.0
oxamyl|US|eggplant|2.0|c303|Eggplant
oxamyl|US|cucumber|2.0|c303|Cucumber
oxamyl|US|melon|2.0|c303|Cantaloupe
fosthiazate|US|tomato|0.02|c596|Tomato
fluopyram|US|pepper|4.0|c661|Pepper/eggplant subgroup 8-10B
fluopyram|US|eggplant|4.0|c661|Pepper/eggplant subgroup 8-10B
fluopyram|US|tomato|1.0|c661|Tomato subgroup 8-10A
fluopyram|US|cucumber|0.6|c661|Squash/cucumber subgroup 9B
fluopyram|US|melon|1.0|c661|Melon subgroup 9A
fluopyram|US|strawberry|2.0|c661|Berry, low growing, except cranberry, subgroup 13-07G
fluopyram|US|green_bean|4.0|c661|Vegetable, legume, bean, edible podded, subgroup 6-22A
azoxystrobin|US|pepper|3.0|c507|Pepper/eggplant subgroup 8-10B
azoxystrobin|US|eggplant|3.0|c507|Pepper/eggplant subgroup 8-10B
azoxystrobin|US|tomato|0.2|c507|Tomato subgroup 8-10A
azoxystrobin|US|cucumber|0.3|c507|Vegetable, cucurbit, group 9
azoxystrobin|US|melon|0.3|c507|Vegetable, cucurbit, group 9
azoxystrobin|US|strawberry|10.0|c507|Berry, low growing, subgroup 13-07G, except cranberry
azoxystrobin|US|green_bean|3.0|c507|Vegetable, legume, edible podded, subgroup 6A, except soybean
pyraclostrobin|US|tomato|1.4|c582|Vegetable, fruiting, group 8-10
pyraclostrobin|US|pepper|1.4|c582|Vegetable, fruiting, group 8-10
pyraclostrobin|US|eggplant|1.4|c582|Vegetable, fruiting, group 8-10
pyraclostrobin|US|strawberry|1.2|c582|Berry, low growing, subgroup 13-07G, except cranberry
pyraclostrobin|US|cucumber|0.5|c582|Vegetable, cucurbit, group 9
pyraclostrobin|US|melon|0.5|c582|Vegetable, cucurbit, group 9
pyraclostrobin|US|green_bean|0.5|c582|Vegetable, legume, edible podded, subgroup 6A
trifloxystrobin|US|tomato|0.5|c555|Vegetable, fruiting, group 8-10
trifloxystrobin|US|pepper|0.5|c555|Vegetable, fruiting, group 8-10
trifloxystrobin|US|eggplant|0.5|c555|Vegetable, fruiting, group 8-10
trifloxystrobin|US|cucumber|0.5|c555|Vegetable, cucurbit, group 9
trifloxystrobin|US|melon|0.5|c555|Vegetable, cucurbit, group 9
trifloxystrobin|US|strawberry|1.5|c555|Berry, low growing, subgroup 13-07G
trifloxystrobin|US|green_bean|1.5|c555|Vegetable, legume, bean, edible podded, subgroup 6-22A
difenoconazole|US|tomato|0.6|c475|Vegetable, fruiting, group 8-10
difenoconazole|US|pepper|0.6|c475|Vegetable, fruiting, group 8-10
difenoconazole|US|eggplant|0.6|c475|Vegetable, fruiting, group 8-10
difenoconazole|US|cucumber|0.7|c475|Vegetable, cucurbit, group 9
difenoconazole|US|melon|0.7|c475|Vegetable, cucurbit, group 9
difenoconazole|US|strawberry|2.5|c475|Berry, low growing, subgroup 13-07G, except cranberry
tebuconazole|US|tomato|1.3|c474|Vegetable, fruiting, group 8-10
tebuconazole|US|pepper|1.3|c474|Vegetable, fruiting, group 8-10
tebuconazole|US|eggplant|1.3|c474|Vegetable, fruiting, group 8-10
tebuconazole|US|cucumber|0.4|c474|Vegetable, cucurbit, group 9
tebuconazole|US|melon|0.4|c474|Vegetable, cucurbit, group 9
tebuconazole|US|green_bean|0.1|c474|Bean, succulent
myclobutanil|US|pepper|4.0|c443|Vegetable, fruiting, group 8, except tomato
myclobutanil|US|eggplant|4.0|c443|Vegetable, fruiting, group 8, except tomato
myclobutanil|US|tomato|0.3|c443|Tomato
myclobutanil|US|cucumber|0.2|c443|Vegetable, cucurbit, group 9
myclobutanil|US|melon|0.2|c443|Vegetable, cucurbit, group 9
myclobutanil|US|strawberry|0.5|c443|Strawberry
myclobutanil|US|green_bean|1.0|c443|Bean, snap, succulent
tetraconazole|US|tomato|0.3|c557|Vegetable, fruiting, group 8-10
tetraconazole|US|pepper|0.3|c557|Vegetable, fruiting, group 8-10
tetraconazole|US|eggplant|0.3|c557|Vegetable, fruiting, group 8-10
tetraconazole|US|cucumber|0.15|c557|Vegetable, cucurbit, group 9
tetraconazole|US|melon|0.15|c557|Vegetable, cucurbit, group 9
tetraconazole|US|strawberry|0.25|c557|Low growing berry subgroup 13-07G, except cranberry
boscalid|US|tomato|3.0|c589|Vegetable, fruiting, group 8-10
boscalid|US|pepper|3.0|c589|Vegetable, fruiting, group 8-10
boscalid|US|eggplant|3.0|c589|Vegetable, fruiting, group 8-10
boscalid|US|cucumber|3.0|c589|Vegetable, cucurbit, group 9
boscalid|US|melon|3.0|c589|Vegetable, cucurbit, group 9
boscalid|US|strawberry|4.5|c589|Berry, low growing, subgroup 13-07G, except cranberry
boscalid|US|green_bean|5.0|c589|Vegetable, legume, edible podded subgroup 6A
cyprodinil|US|strawberry|5.0|c532|Berry, low growing, subgroup 13-07G, except cranberry
cyprodinil|US|cucumber|0.7|c532|Vegetable, cucurbit, group 9
cyprodinil|US|melon|0.7|c532|Vegetable, cucurbit, group 9
cyprodinil|US|tomato|1.5|c532|Vegetable, fruiting, group 8-10
cyprodinil|US|pepper|1.5|c532|Vegetable, fruiting, group 8-10
cyprodinil|US|eggplant|1.5|c532|Vegetable, fruiting, group 8-10
cyprodinil|US|green_bean|0.6|c532|Bean, succulent
fludioxonil|US|pepper|0.5|c516|Vegetable, fruiting, group 8-10, except tomato
fludioxonil|US|eggplant|0.5|c516|Vegetable, fruiting, group 8-10, except tomato
fludioxonil|US|tomato|5.0|c516|Tomato
fludioxonil|US|cucumber|0.45|c516|Vegetable, cucurbit, group 9
fludioxonil|US|melon|0.45|c516|Vegetable, cucurbit, group 9
fludioxonil|US|strawberry|3.0|c516|Berry, low growing, subgroup 13-07G, except cranberry
fludioxonil|US|green_bean|0.4|c516|Bean, succulent
iprodione|US|strawberry|15.0|c399|Strawberry
iprodione|US|green_bean|2.0|c399|Bean, succulent
mancozeb|US|pepper|12.0|c176|Pepper
mancozeb|US|tomato|2.5|c176|Tomato
mancozeb|US|cucumber|2.0|c176|Vegetable, cucurbit, group 9
mancozeb|US|melon|2.0|c176|Vegetable, cucurbit, group 9
chlorothalonil|US|green_bean|5.0|c275|Bean, snap, succulent
chlorothalonil|US|tomato|5.0|c275|Tomato
chlorothalonil|US|cucumber|5.0|c275|Vegetable, cucurbit, group 9
chlorothalonil|US|melon|5.0|c275|Vegetable, cucurbit, group 9
chlorothalonil|US|pepper|6.0|c275|Vegetable, fruiting, group 8, except tomato
chlorothalonil|US|eggplant|6.0|c275|Vegetable, fruiting, group 8, except tomato
metalaxyl-m|US|tomato|1.0|c546|Vegetable, fruiting, group 8-10 — ميفينوكسام (180.546) — ميتالاكسيل-M
metalaxyl-m|US|pepper|1.0|c546|Vegetable, fruiting, group 8-10 — ميفينوكسام (180.546) — ميتالاكسيل-M
metalaxyl-m|US|eggplant|1.0|c546|Vegetable, fruiting, group 8-10 — ميفينوكسام (180.546) — ميتالاكسيل-M
cymoxanil|US|tomato|0.2|c503|Vegetable, fruiting, group 8
cymoxanil|US|pepper|0.2|c503|Vegetable, fruiting, group 8
cymoxanil|US|eggplant|0.2|c503|Vegetable, fruiting, group 8
cymoxanil|US|cucumber|0.05|c503|Vegetable, cucurbit, group 9
cymoxanil|US|melon|0.05|c503|Vegetable, cucurbit, group 9
dimethomorph|US|strawberry|0.9|c493|Strawberry
dimethomorph|US|cucumber|0.5|c493|Vegetable, cucurbit, group 9
dimethomorph|US|melon|0.5|c493|Vegetable, cucurbit, group 9
dimethomorph|US|tomato|1.5|c493|Vegetable, fruiting, group 8
dimethomorph|US|pepper|1.5|c493|Vegetable, fruiting, group 8
dimethomorph|US|eggplant|1.5|c493|Vegetable, fruiting, group 8
propamocarb|US|tomato|4.0|c499|Vegetable, fruiting, group 8-10
propamocarb|US|pepper|4.0|c499|Vegetable, fruiting, group 8-10
propamocarb|US|eggplant|4.0|c499|Vegetable, fruiting, group 8-10
propamocarb|US|cucumber|1.5|c499|Vegetable, cucurbit, group 9
propamocarb|US|melon|1.5|c499|Vegetable, cucurbit, group 9
famoxadone|US|pepper|4.0|c587|Vegetable, fruiting, group 8-10, except tomato
famoxadone|US|eggplant|4.0|c587|Vegetable, fruiting, group 8-10, except tomato
famoxadone|US|tomato|1.0|c587|Tomato
famoxadone|US|cucumber|0.3|c587|Vegetable, cucurbit, group 9
famoxadone|US|melon|0.3|c587|Vegetable, cucurbit, group 9
thiophanate-methyl|US|green_bean|2.0|c371|Bean, snap, succulent
thiophanate-methyl|US|strawberry|7.0|c371|Strawberry
thiophanate-methyl|US|cucumber|1.0|c371|Vegetable, cucurbit, group 9
thiophanate-methyl|US|melon|1.0|c371|Vegetable, cucurbit, group 9
fluazinam|US|tomato|1.5|c574|Tomato subgroup 8-10A
fluazinam|US|pepper|0.09|c574|Pepper/eggplant subgroup 8-10B
fluazinam|US|eggplant|0.09|c574|Pepper/eggplant subgroup 8-10B
fluazinam|US|cucumber|0.07|c574|Vegetable, cucurbit, group 9
fluazinam|US|melon|0.07|c574|Vegetable, cucurbit, group 9
fluazinam|US|green_bean|0.1|c574|Bean, green, edible podded
cyflufenamid|US|strawberry|0.2|c667|Berry, low growing, subgroup 13-07G, except cranberry
cyflufenamid|US|cucumber|0.1|c667|Vegetable, cucurbit, group 9
cyflufenamid|US|melon|0.1|c667|Vegetable, cucurbit, group 9
cyflufenamid|US|tomato|0.2|c667|Vegetable, fruiting, group 8-10
cyflufenamid|US|pepper|0.2|c667|Vegetable, fruiting, group 8-10
cyflufenamid|US|eggplant|0.2|c667|Vegetable, fruiting, group 8-10
ametoctradin|US|tomato|1.5|c663|Vegetable, fruiting, group 8-10
ametoctradin|US|pepper|1.5|c663|Vegetable, fruiting, group 8-10
ametoctradin|US|eggplant|1.5|c663|Vegetable, fruiting, group 8-10
ametoctradin|US|cucumber|3.0|c663|Vegetable, cucurbit, group 9
ametoctradin|US|melon|3.0|c663|Vegetable, cucurbit, group 9
acetamiprid|US|strawberry|0.6|c578|Berry, low growing subgroups 13-07G
acetamiprid|US|cucumber|0.5|c578|Vegetable, cucurbit, group 9
acetamiprid|US|melon|0.5|c578|Vegetable, cucurbit, group 9
acetamiprid|US|tomato|0.2|c578|Vegetable, fruiting, group 8-10
acetamiprid|US|pepper|0.2|c578|Vegetable, fruiting, group 8-10
acetamiprid|US|eggplant|0.2|c578|Vegetable, fruiting, group 8-10
acetamiprid|US|green_bean|0.6|c578|Vegetable, legume, edible podded, subgroup 6A
thiamethoxam|US|tomato|0.25|c565|Vegetable, fruiting, group 8
thiamethoxam|US|pepper|0.25|c565|Vegetable, fruiting, group 8
thiamethoxam|US|eggplant|0.25|c565|Vegetable, fruiting, group 8
thiamethoxam|US|cucumber|0.2|c565|Vegetable, cucurbit, group 9
thiamethoxam|US|melon|0.2|c565|Vegetable, cucurbit, group 9
thiamethoxam|US|strawberry|0.3|c565|Berry, low growing, subgroup 13-07G, except cranberry
thiamethoxam|US|green_bean|0.02|c565|Bean, succulent
dinotefuran|US|tomato|0.7|c603|Vegetable, fruiting, group 8
dinotefuran|US|pepper|0.7|c603|Vegetable, fruiting, group 8
dinotefuran|US|eggplant|0.7|c603|Vegetable, fruiting, group 8
dinotefuran|US|cucumber|0.5|c603|Vegetable, cucurbit, group 9
dinotefuran|US|melon|0.5|c603|Vegetable, cucurbit, group 9
pyriproxyfen|US|tomato|0.8|c510|Vegetable, fruiting, group 8-10
pyriproxyfen|US|pepper|0.8|c510|Vegetable, fruiting, group 8-10
pyriproxyfen|US|eggplant|0.8|c510|Vegetable, fruiting, group 8-10
pyriproxyfen|US|cucumber|0.1|c510|Vegetable, cucurbit, group 9
pyriproxyfen|US|melon|0.1|c510|Vegetable, cucurbit, group 9
pyriproxyfen|US|strawberry|0.3|c510|Strawberry
buprofezin|US|tomato|2.0|c511|Vegetable, fruiting, group 8-10
buprofezin|US|pepper|2.0|c511|Vegetable, fruiting, group 8-10
buprofezin|US|eggplant|2.0|c511|Vegetable, fruiting, group 8-10
buprofezin|US|cucumber|0.5|c511|Vegetable, cucurbit, group 9
buprofezin|US|melon|0.5|c511|Vegetable, cucurbit, group 9
buprofezin|US|strawberry|2.5|c511|Berry, low growing, subgroup 13-07G
buprofezin|US|green_bean|0.02|c511|Bean, green, edible podded
spiromesifen|US|tomato|0.45|c607|Vegetable, fruiting, group 8
spiromesifen|US|pepper|0.45|c607|Vegetable, fruiting, group 8
spiromesifen|US|eggplant|0.45|c607|Vegetable, fruiting, group 8
spiromesifen|US|cucumber|0.1|c607|Vegetable, cucurbit, group 9
spiromesifen|US|melon|0.1|c607|Vegetable, cucurbit, group 9
spiromesifen|US|strawberry|2.0|c607|Berry and small fruit, low growing berry, subgroup 13-07G
spiromesifen|US|green_bean|0.8|c607|Bean, edible podded
flonicamid|US|tomato|0.4|c613|Tomato subgroup 8-10A
flonicamid|US|pepper|3.0|c613|Pepper/Eggplant subgroup 8-10B
flonicamid|US|eggplant|3.0|c613|Pepper/Eggplant subgroup 8-10B
flonicamid|US|cucumber|1.5|c613|Vegetable, cucurbit, group 9
flonicamid|US|melon|1.5|c613|Vegetable, cucurbit, group 9
flonicamid|US|strawberry|2.0|c613|Berry, low-growing, subgroup 13-07G
flonicamid|US|green_bean|4.0|c613|Vegetable, legume, bean, edible podded, subgroup 6-22A
flupyradifurone|US|tomato|1.5|c679|Vegetable, fruiting, group 8-10
flupyradifurone|US|pepper|1.5|c679|Vegetable, fruiting, group 8-10
flupyradifurone|US|eggplant|1.5|c679|Vegetable, fruiting, group 8-10
flupyradifurone|US|cucumber|0.4|c679|Vegetable, cucurbit, group 9
flupyradifurone|US|melon|0.4|c679|Vegetable, cucurbit, group 9
flupyradifurone|US|strawberry|1.5|c679|Berry, low growing, except cranberry subgroup 13-07G
flupyradifurone|US|green_bean|3.0|c679|Vegetable, legume, edible podded, subgroup 6A
sulfoxaflor|US|tomato|0.7|c668|Vegetable, fruiting, group 8-10
sulfoxaflor|US|pepper|0.7|c668|Vegetable, fruiting, group 8-10
sulfoxaflor|US|eggplant|0.7|c668|Vegetable, fruiting, group 8-10
sulfoxaflor|US|cucumber|0.4|c668|Vegetable, cucurbit, group 9
sulfoxaflor|US|melon|0.4|c668|Vegetable, cucurbit, group 9
sulfoxaflor|US|strawberry|0.7|c668|Berry, low growing, subgroup 13-7G
sulfoxaflor|US|green_bean|4.0|c668|Bean, succulent
pymetrozine|US|tomato|0.2|c556|Vegetable, fruiting, group 8
pymetrozine|US|pepper|0.2|c556|Vegetable, fruiting, group 8
pymetrozine|US|eggplant|0.2|c556|Vegetable, fruiting, group 8
pymetrozine|US|cucumber|0.1|c556|Vegetable, cucurbit, group 9
pymetrozine|US|melon|0.1|c556|Vegetable, cucurbit, group 9
acequinocyl|US|tomato|0.7|c599|Vegetable, fruiting, group 8-10
acequinocyl|US|pepper|0.7|c599|Vegetable, fruiting, group 8-10
acequinocyl|US|eggplant|0.7|c599|Vegetable, fruiting, group 8-10
acequinocyl|US|cucumber|0.3|c599|Vegetable, cucurbit, group 9
acequinocyl|US|melon|0.3|c599|Vegetable, cucurbit, group 9
acequinocyl|US|strawberry|0.5|c599|Berry, low growing, subgroup 13-07G
acequinocyl|US|green_bean|0.25|c599|Bean, edible podded
malathion|US|eggplant|8.0|c111|Eggplant
malathion|US|tomato|8.0|c111|Tomato
malathion|US|pepper|8.0|c111|Pepper
malathion|US|cucumber|8.0|c111|Cucumber
malathion|US|melon|8.0|c111|Melon
malathion|US|strawberry|8.0|c111|Strawberry
deltamethrin|US|tomato|0.3|c435|Tomato
deltamethrin|US|pepper|0.3|c435|Vegetable, fruiting, group 8
deltamethrin|US|eggplant|0.3|c435|Vegetable, fruiting, group 8
deltamethrin|US|cucumber|0.2|c435|Vegetable, cucurbit, group 9
deltamethrin|US|melon|0.2|c435|Vegetable, cucurbit, group 9
fosetyl|US|pepper|0.01|c415|Pepper/eggplant, subgroup 8-10B — لا تسجيلات أمريكية (حاشية اللائحة)
fosetyl|US|eggplant|0.01|c415|Pepper/eggplant, subgroup 8-10B — لا تسجيلات أمريكية (حاشية اللائحة)
fosetyl|US|tomato|3.0|c415|Tomato
fosetyl|US|strawberry|75.0|c415|Strawberry
fosetyl|US|cucumber|15.0|c415|Vegetable, cucurbit, group 9
fosetyl|US|melon|15.0|c415|Vegetable, cucurbit, group 9
quinoxyfen|US|tomato|1.7|c588|Vegetable, fruiting, group 8-10
quinoxyfen|US|pepper|1.7|c588|Vegetable, fruiting, group 8-10
quinoxyfen|US|eggplant|1.7|c588|Vegetable, fruiting, group 8-10
quinoxyfen|US|melon|0.08|c588|Melon subgroup 9A
quinoxyfen|US|strawberry|1.0|c588|Berry, low growing, subgroup 13-07G
$d$, E'\n') l where l <> ''),
v as (select split_part(l, '|', 1) as name_en, split_part(l, '|', 2) as market, split_part(l, '|', 3) as crop_code,
  split_part(l, '|', 4)::numeric as mrl_mg_kg, split_part(l, '|', 5) as k, split_part(l, '|', 6) as notes from raw)
insert into public.substance_limits (farm_id, substance_id, market, crop_code, mrl_mg_kg, default_loq, source_url, retrieved_on, notes)
select null, s.id, v.market, v.crop_code, v.mrl_mg_kg, false,
  case when v.k like 'c%' then 'https://www.law.cornell.edu/cfr/text/40/180.' || substr(v.k, 2)
       else 'https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/pesticide-index/pesticide-details?pestId=' || substr(v.k, 2) end,
  date '2026-11-27', v.notes
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

