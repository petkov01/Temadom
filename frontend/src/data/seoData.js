// SEO Data - Regions, professions, and content for SEO pages
export const REGIONS = {
  sofia_city: { name: "София", slug: "sofia", multiplier: 1.20, population: "1,300,000", description: "Столицата на България с най-високи строителни цени" },
  sofia_oblast: { name: "Софийска област", slug: "sofiyska-oblast", multiplier: 1.05, population: "225,000", description: "Областта около столицата с умерени цени" },
  plovdiv: { name: "Пловдив", slug: "plovdiv", multiplier: 1.05, population: "340,000", description: "Вторият по големина град в България" },
  varna: { name: "Варна", slug: "varna", multiplier: 1.08, population: "335,000", description: "Морската столица на България" },
  burgas: { name: "Бургас", slug: "burgas", multiplier: 1.05, population: "200,000", description: "Голям черноморски град с развит строителен сектор" },
  stara_zagora: { name: "Стара Загора", slug: "stara-zagora", multiplier: 1.00, population: "135,000", description: "Важен индустриален и търговски център" },
  ruse: { name: "Русе", slug: "ruse", multiplier: 0.95, population: "144,000", description: "Дунавска перла с достъпни строителни цени" },
  pleven: { name: "Плевен", slug: "pleven", multiplier: 0.92, population: "100,000", description: "Голям град в Северна България" },
  blagoevgrad: { name: "Благоевград", slug: "blagoevgrad", multiplier: 0.95, population: "70,000", description: "Университетски град в Югозападна България" },
  veliko_tarnovo: { name: "Велико Търново", slug: "veliko-tarnovo", multiplier: 0.93, population: "68,000", description: "Историческата столица с активен строителен пазар" },
  dobrich: { name: "Добрич", slug: "dobrich", multiplier: 0.95, population: "88,000", description: "Град в Североизточна България" },
  vidin: { name: "Видин", slug: "vidin", multiplier: 0.82, population: "45,000", description: "Най-достъпни строителни цени в страната" },
  montana: { name: "Монтана", slug: "montana", multiplier: 0.83, population: "40,000", description: "Достъпни цени в Северозападна България" },
  vratsa: { name: "Враца", slug: "vratsa", multiplier: 0.85, population: "55,000", description: "Град с умерени строителни цени" },
  lovech: { name: "Ловеч", slug: "lovech", multiplier: 0.88, population: "35,000", description: "Централна Северна България" },
  gabrovo: { name: "Габрово", slug: "gabrovo", multiplier: 0.90, population: "55,000", description: "Индустриален град с добри строителни традиции" },
  targovishte: { name: "Търговище", slug: "targovishte", multiplier: 0.85, population: "36,000", description: "Град в Североизточна България" },
  razgrad: { name: "Разград", slug: "razgrad", multiplier: 0.84, population: "30,000", description: "Достъпни строителни услуги" },
  shumen: { name: "Шумен", slug: "shumen", multiplier: 0.88, population: "80,000", description: "Голям град в Североизточна България" },
  silistra: { name: "Силистра", slug: "silistra", multiplier: 0.82, population: "33,000", description: "Дунавски град с ниски цени" },
  pazardzhik: { name: "Пазарджик", slug: "pazardzhik", multiplier: 0.92, population: "68,000", description: "Град в Тракийската низина" },
  smolyan: { name: "Смолян", slug: "smolyan", multiplier: 0.88, population: "28,000", description: "Родопски град с планински специфики" },
  kardzhali: { name: "Кърджали", slug: "kardzhali", multiplier: 0.85, population: "42,000", description: "Център на Източните Родопи" },
  haskovo: { name: "Хасково", slug: "haskovo", multiplier: 0.90, population: "75,000", description: "Голям град в Южна България" },
  yambol: { name: "Ямбол", slug: "yambol", multiplier: 0.88, population: "72,000", description: "Тракийски град с активен пазар" },
  sliven: { name: "Сливен", slug: "sliven", multiplier: 0.88, population: "88,000", description: "Подбалкански град" },
  pernik: { name: "Перник", slug: "pernik", multiplier: 0.95, population: "80,000", description: "Близо до София, добри цени" },
  kyustendil: { name: "Кюстендил", slug: "kyustendil", multiplier: 0.87, population: "42,000", description: "Югозападен град с достъпни цени" }
};

export const SEO_PROFESSIONS = [
  { id: "painter", name: "Бояджия", slug: "boyadzhiya", searchTerms: ["боядисване", "латекс", "боя стени"], basePrice: { labor: 3.5, full: 6 }, unit: "м²" },
  { id: "plasterer", name: "Шпакловчик", slug: "shpaklovchik", searchTerms: ["шпакловка", "гипсова шпакловка"], basePrice: { labor: 4, full: 7 }, unit: "м²" },
  { id: "tiler", name: "Фаянсаджия", slug: "fayansdzhiya", searchTerms: ["плочки", "фаянс", "гранитогрес"], basePrice: { labor: 28, full: 75 }, unit: "м²" },
  { id: "electrician", name: "Електротехник", slug: "elektrotehnik", searchTerms: ["ел. инсталация", "контакти", "осветление"], basePrice: { labor: 40, full: 80 }, unit: "точка" },
  { id: "plumber", name: "Водопроводчик", slug: "vodoprovodchik", searchTerms: ["ВиК", "водопровод", "канализация"], basePrice: { labor: 45, full: 85 }, unit: "точка" },
  { id: "hvac", name: "Климатик монтаж", slug: "klimatik-montazh", searchTerms: ["климатик", "отопление", "ОВК"], basePrice: { labor: 150, full: 250 }, unit: "бр." },
  { id: "roofer", name: "Покривджия", slug: "pokrivdzhiya", searchTerms: ["покрив", "ремонт покрив", "керемиди"], basePrice: { labor: 50, full: 100 }, unit: "м²" },
  { id: "mason", name: "Зидар", slug: "zidar", searchTerms: ["зидане", "тухли", "стени"], basePrice: { labor: 22, full: 65 }, unit: "м²" },
  { id: "screed", name: "Замазчик", slug: "zamazchik", searchTerms: ["замазка", "циментова замазка", "подове"], basePrice: { labor: 14, full: 28 }, unit: "м²" },
  { id: "insulation", name: "Изолатор", slug: "izolator", searchTerms: ["топлоизолация", "стиропор", "фасада"], basePrice: { labor: 20, full: 55 }, unit: "м²" },
  { id: "waterproof", name: "Хидроизолатор", slug: "hidroizolator", searchTerms: ["хидроизолация", "баня", "тераса"], basePrice: { labor: 18, full: 42 }, unit: "м²" },
  { id: "drywall", name: "Гипскартонист", slug: "gipskartонist", searchTerms: ["гипсокартон", "окачен таван", "преградни стени"], basePrice: { labor: 15, full: 35 }, unit: "м²" },
  { id: "flooring", name: "Подови настилки", slug: "podovi-nastilki", searchTerms: ["ламинат", "паркет", "подова настилка"], basePrice: { labor: 6, full: 12 }, unit: "м²" },
  { id: "window", name: "Дограмаджия", slug: "dogramdzhiya", searchTerms: ["PVC дограма", "прозорци", "врати"], basePrice: { labor: 30, full: 45 }, unit: "бр." },
  { id: "demolition", name: "Демонтаж", slug: "demontazh", searchTerms: ["събаряне", "демонтаж", "извозване"], basePrice: { labor: 8, full: 12 }, unit: "м²" },
  { id: "concrete", name: "Бетонджия", slug: "betondzhiya", searchTerms: ["бетон", "фундамент", "плоча"], basePrice: { labor: 70, full: 160 }, unit: "м³" },
  { id: "excavation", name: "Изкопни работи", slug: "izkopni-raboti", searchTerms: ["изкопаване", "основи", "нивелиране"], basePrice: { labor: 15, full: 30 }, unit: "м³" },
  { id: "facade", name: "Фасаден работник", slug: "fasaden-rabotnik", searchTerms: ["фасада", "мазилка фасада", "декоративна мазилка"], basePrice: { labor: 16, full: 40 }, unit: "м²" },
  { id: "furniture", name: "Мебелист", slug: "mebelist", searchTerms: ["мебели по поръчка", "кухня", "гардероб"], basePrice: { labor: 150, full: 300 }, unit: "л.м." },
  { id: "alarm", name: "Алармена система", slug: "alarmena-sistema", searchTerms: ["СОТ", "видеонаблюдение", "камери"], basePrice: { labor: 80, full: 120 }, unit: "бр." },
  { id: "solar", name: "Соларни системи", slug: "solarni-sistemi", searchTerms: ["фотоволтаици", "соларни панели", "слънчева енергия"], basePrice: { labor: 1000, full: 1400 }, unit: "kW" },
  { id: "door", name: "Интериорни врати", slug: "interiorni-vrati", searchTerms: ["врати монтаж", "интериорна врата"], basePrice: { labor: 35, full: 55 }, unit: "бр." },
  { id: "decorative", name: "Декоративни покрития", slug: "dekorativni-pokritiya", searchTerms: ["венецианска мазилка", "микроцимент"], basePrice: { labor: 18, full: 35 }, unit: "м²" },
  { id: "stone", name: "Каменоделец", slug: "kamenodelets", searchTerms: ["камък облицовка", "мрамор", "каменна настилка"], basePrice: { labor: 25, full: 55 }, unit: "м²" },
  { id: "steel", name: "Заварчик/Метал", slug: "zavarchik-metal", searchTerms: ["метална конструкция", "ограда", "навес"], basePrice: { labor: 40, full: 70 }, unit: "м" },
  { id: "garden", name: "Озеленяване", slug: "ozelenyavane", searchTerms: ["градина", "поливна система", "тревен чим"], basePrice: { labor: 12, full: 30 }, unit: "м²" },
  { id: "sound", name: "Шумоизолация", slug: "shumoizolatsiya", searchTerms: ["шумоизолация", "звукоизолация"], basePrice: { labor: 22, full: 40 }, unit: "м²" },
  { id: "pool", name: "Басейни", slug: "baseyni", searchTerms: ["басейн", "строителство басейн"], basePrice: { labor: 250, full: 450 }, unit: "м³" }
];

// Generate blog articles data
export const generateBlogArticles = () => {
  const articles = [];
  const topRegions = ['sofia_city', 'plovdiv', 'varna', 'burgas', 'stara_zagora', 'ruse'];
  
  // Article 1: Main overview
  articles.push({
    slug: 'kalkulator-ceni-stroitelstvo-2026',
    title: 'Калкулатор цени строителство 2026 | 28 професии | Всички области България',
    h1: 'Калкулатор за строителни цени 2026 – изчисли оферта онлайн',
    description: 'Безплатен онлайн калкулатор за строителни цени в България 2026. Покрива 28 професии и всички 28 области. Изчислете точна оферта за ремонт.',
    keywords: 'калкулатор строителство, цени ремонт 2026, оферта строителство България',
    type: 'overview'
  });

  // Article 2: Rough construction prices
  articles.push({
    slug: 'grub-stroezh-ceni-2026',
    title: 'Груб строеж цени кв.м 2026 – оферта за цялата страна',
    h1: 'Груб строеж цени на кв.м 2026 – сравнение по области',
    description: 'Актуални цени за груб строеж в България 2026. Зидане, бетон, кофраж, изкопни работи – сравнение по всички 28 области.',
    keywords: 'груб строеж цени, зидане цена кв.м, бетон цена',
    type: 'category',
    category: 'Груб строеж'
  });

  // Article 3: Finishing work prices  
  articles.push({
    slug: 'dovarshitelni-raboti-ceni-2026',
    title: 'Довършителни работи цени 2026 – боядисване, шпакловка, подове',
    h1: 'Довършителни работи цени 2026 – пълен ценоразпис',
    description: 'Цени за довършителни работи в България 2026. Боядисване, шпакловка, подови настилки, плочки – по всички области.',
    keywords: 'довършителни работи цени, ремонт апартамент цена',
    type: 'category',
    category: 'Довършителни'
  });

  // Article per profession
  SEO_PROFESSIONS.forEach(prof => {
    articles.push({
      slug: `ceni-${prof.slug}-2026`,
      title: `Цени ${prof.name.toLowerCase()} по области 2026 – София, Пловдив, Варна, Бургас...`,
      h1: `Калкулатор ${prof.name.toLowerCase()} 2026 – цени по области`,
      description: `Актуални цени за ${prof.name.toLowerCase()} в България 2026. Сравнение на цените във всички 28 области. ${prof.basePrice.full} EUR/${prof.unit} средна цена.`,
      keywords: `${prof.name.toLowerCase()} цена, ${prof.searchTerms.join(', ')}`,
      type: 'profession',
      professionId: prof.id
    });
  });

  // Article per top region
  topRegions.forEach(regionKey => {
    const region = REGIONS[regionKey];
    articles.push({
      slug: `stroitelstvo-${region.slug}-2026`,
      title: `Строителство ${region.name} 2026 – цени, майстори, оферти`,
      h1: `Строителство и ремонти ${region.name} 2026 – актуални цени`,
      description: `Всичко за строителство и ремонти в ${region.name} 2026. Цени за 28 професии, калкулатор за оферти, проверени фирми.`,
      keywords: `строителство ${region.name.toLowerCase()}, ремонт ${region.name.toLowerCase()}, майстори ${region.name.toLowerCase()}`,
      type: 'region',
      regionKey: regionKey
    });
  });

  return articles;
};

export const BLOG_ARTICLES = generateBlogArticles();
