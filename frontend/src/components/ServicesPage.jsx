import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Paintbrush, Zap, Droplets, Boxes, LayoutGrid, Square, Layers, Hammer,
  Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, ArrowRight,
  Thermometer, Home, Wrench, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from '@/i18n/LanguageContext';

// Comprehensive service information database
const SERVICES_INFO = {
  painting: {
    name: "Боядисване",
    icon: Paintbrush,
    category: "Довършителни работи",
    shortDescription: "Боядисване на стени и тавани с латекс или други бои",
    fullDescription: "Боядисването е финална фаза от ремонта, която придава завършен вид на помещенията. Включва подготовка на повърхностите, грундиране и нанасяне на боя.",
    timeEstimate: "1-2 дни за стая (15-20 м²)",
    priceRange: "4-10 €/м²",
    steps: [
      "Почистване на повърхността от прах и мръсотия",
      "Запълване на пукнатини и дупки с шпакловка",
      "Шлайфане на неравностите",
      "Нанасяне на грунд (праймер)",
      "Първи слой боя - изчакване 4-6 часа",
      "Втори слой боя за равномерно покритие"
    ],
    tips: [
      "Използвайте качествена боя - спестява повторно боядисване",
      "Боядисвайте при температура 15-25°C",
      "Проветрявайте помещението по време на работа",
      "Покрийте мебелите и пода с найлон"
    ],
    warnings: [
      "Не боядисвайте върху влажни стени",
      "Избягвайте евтини бои - бързо се износват",
      "Не смесвайте различни видове бои"
    ],
    materials: ["Латексова боя", "Грунд", "Шпакловка", "Шкурка", "Валяк и четки"]
  },

  plastering: {
    name: "Шпакловка",
    icon: Layers,
    category: "Довършителни работи",
    shortDescription: "Изравняване на стени преди боядисване",
    fullDescription: "Шпакловката е процес на изравняване на стените за постигане на гладка повърхност. Извършва се след мазилка и преди боядисване.",
    timeEstimate: "2-3 дни за стая",
    priceRange: "5-12 €/м²",
    steps: [
      "Почистване на стената от прах",
      "Нанасяне на грунд за по-добро сцепление",
      "Първи слой шпакловка - груба",
      "Изчакване 24 часа за съхнене",
      "Втори слой шпакловка - фина",
      "Шлайфане до гладкост"
    ],
    tips: [
      "Работете на тънки слоеве за по-бързо съхнене",
      "Използвайте LED лампа за откриване на неравности",
      "Шлайфайте с фина шкурка (P180-P240)"
    ],
    warnings: [
      "Не нанасяйте дебели слоеве - пукат се",
      "Не шпакловайте при висока влажност"
    ],
    materials: ["Гипсова шпакловка", "Финишна шпакловка", "Грунд", "Шкурка", "Шпакли"]
  },

  electrical: {
    name: "Електрически инсталации",
    icon: Zap,
    category: "Инсталации",
    shortDescription: "Монтаж на контакти, ключове и осветление",
    fullDescription: "Електрическите инсталации включват полагане на кабели, монтаж на електрическо табло, контакти, ключове и осветителни тела. Работата трябва да се извършва от правоспособен електротехник.",
    timeEstimate: "3-5 дни за апартамент",
    priceRange: "30-80 €/точка",
    steps: [
      "Изготвяне на схема на инсталацията",
      "Маркиране на трасетата по стените",
      "Прорязване на канали (щробиране)",
      "Полагане на гофрирани тръби и кабели",
      "Монтаж на разпределително табло",
      "Монтаж на контакти и ключове",
      "Тестване и измерване"
    ],
    tips: [
      "Планирайте достатъчно контакти - по-добре повече",
      "Използвайте кабели с подходящо сечение",
      "Монтирайте дефектнотокова защита (ДТЗ)"
    ],
    warnings: [
      "Работата да се извършва САМО от правоспособен електротехник",
      "Изключете тока преди всякаква работа",
      "Не използвайте удължители за постоянно"
    ],
    materials: ["Кабели NYM/NYY", "Гофрирани тръби", "Контакти", "Ключове", "Разпределително табло", "Автоматични прекъсвачи"]
  },

  plumbing: {
    name: "ВиК инсталации",
    icon: Droplets,
    category: "Инсталации",
    shortDescription: "Водопровод и канализация",
    fullDescription: "ВиК инсталациите включват полагане на тръби за студена и топла вода, канализация, монтаж на санитарен фаянс и арматура. Правилното изпълнение гарантира дълготрайност без течове.",
    timeEstimate: "4-7 дни за баня",
    priceRange: "70-170 €/точка",
    steps: [
      "Проектиране на разводка",
      "Демонтаж на стари тръби (ако има)",
      "Полагане на канализационни тръби (със наклон!)",
      "Полагане на водопроводни тръби",
      "Монтаж на вентили и спирателни кранове",
      "Изпитване под налягане",
      "Монтаж на санитарен фаянс"
    ],
    tips: [
      "Използвайте PPR тръби за топла вода",
      "Канализацията да има наклон мин. 2%",
      "Монтирайте ревизионни отвори"
    ],
    warnings: [
      "Не използвайте стари метални тръби",
      "Не забравяйте хидроизолацията в мокри помещения",
      "Проверете налягането преди зазиждане"
    ],
    materials: ["PPR тръби", "PVC канализационни тръби", "Фитинги", "Спирателни кранове", "Силикон"]
  },

  tiling: {
    name: "Фаянс и теракот",
    icon: LayoutGrid,
    category: "Довършителни работи",
    shortDescription: "Лепене на плочки за стени и под",
    fullDescription: "Облицовката с плочки е трайно решение за бани, кухни и подове. Изисква прецизност и подготовка на основата. Правилно изпълнение гарантира десетилетия без проблеми.",
    timeEstimate: "3-5 дни за баня",
    priceRange: "40-120 €/м²",
    steps: [
      "Подготовка на основата - трябва да е равна",
      "Нанасяне на хидроизолация (в мокри зони)",
      "Разчертаване и планиране на редовете",
      "Приготвяне на лепило",
      "Лепене на плочки с кръстчета за фуги",
      "Изчакване 24 часа",
      "Фугиране и почистване"
    ],
    tips: [
      "Купете 10% повече плочки за резерв",
      "Използвайте флекс лепило за подово отопление",
      "Фугите в ъглите да са със силикон"
    ],
    warnings: [
      "Не лепете върху неравна основа",
      "Не ходете по плочките 24 часа",
      "Не пропускайте хидроизолацията в банята"
    ],
    materials: ["Плочки", "Лепило за плочки", "Фугираща смес", "Кръстчета", "Силикон", "Хидроизолация"]
  },

  concrete: {
    name: "Бетонови работи",
    icon: Boxes,
    category: "Груб строеж",
    shortDescription: "Изливане на бетон за основи, плочи, колони",
    fullDescription: "Бетоновите работи са основа на всяка сграда. Включват кофражни работи, армировка и изливане на бетон. Качеството зависи от правилното изпълнение и втвърдяване.",
    timeEstimate: "1-3 дни за изливане + 28 дни втвърдяване",
    priceRange: "70-150 €/м³",
    steps: [
      "Подготовка на кофража",
      "Полагане на армировка",
      "Проверка на кофража и армировката",
      "Поръчка на бетон с подходяща марка",
      "Изливане и вибриране",
      "Грижа за бетона (поливане) 7 дни",
      "Декофриране след 7-14 дни"
    ],
    tips: [
      "Използвайте бетон минимум C20/25",
      "Вибрирайте добре за плътност",
      "Поливайте бетона в горещо време"
    ],
    warnings: [
      "Не изливайте при температура под 5°C",
      "Не декофрирайте преждевременно",
      "Не добавяйте вода в готовия бетон"
    ],
    materials: ["Бетон", "Арматурно желязо", "Кофраж", "Дистанционери", "Тел за връзване"]
  },

  excavation: {
    name: "Изкопни работи",
    icon: Hammer,
    category: "Груб строеж",
    shortDescription: "Изкопаване за основи и канали",
    fullDescription: "Изкопните работи са първата стъпка при ново строителство. Включват машинен или ръчен изкоп, извозване на пръст и подготовка на терена за основи.",
    timeEstimate: "1-3 дни за къща",
    priceRange: "20-45 €/м³",
    steps: [
      "Геодезическо заснемане",
      "Маркиране на контурите",
      "Машинен изкоп до проектна дълбочина",
      "Ръчно дооформяне на ъгли",
      "Извозване на излишната пръст",
      "Уплътняване на дъното"
    ],
    tips: [
      "Проверете за подземни комуникации",
      "Запазете хумуса за озеленяване",
      "Осигурете достъп за техника"
    ],
    warnings: [
      "Не копайте при проливен дъжд",
      "Укрепете стените при дълбок изкоп",
      "Внимавайте за съседни сгради"
    ],
    materials: ["Багер/мини багер", "Камиони за извозване"]
  },

  insulation: {
    name: "Топлоизолация",
    icon: Thermometer,
    category: "Изолации",
    shortDescription: "Външна и вътрешна топлоизолация",
    fullDescription: "Топлоизолацията намалява разходите за отопление и охлаждане. Външната изолация е по-ефективна и предпазва от кондензация.",
    timeEstimate: "5-10 дни за фасада",
    priceRange: "25-65 €/м²",
    steps: [
      "Почистване на фасадата",
      "Монтаж на стартов профил",
      "Лепене на топлоизолационни плочи",
      "Дюбелиране",
      "Армираща мрежа + лепило",
      "Грунд",
      "Финишна мазилка"
    ],
    tips: [
      "Използвайте минимум 10 см EPS/XPS",
      "Не оставяйте топлинни мостове",
      "Обработете добре около прозорци"
    ],
    warnings: [
      "Не монтирайте при дъжд или мраз",
      "Не използвайте тънка изолация",
      "Внимание с пожароопасност на EPS"
    ],
    materials: ["EPS/XPS плочи", "Лепило", "Дюбели", "Армираща мрежа", "Грунд", "Декоративна мазилка"]
  },

  roofing: {
    name: "Покривни работи",
    icon: Home,
    category: "Груб строеж",
    shortDescription: "Изграждане и ремонт на покриви",
    fullDescription: "Покривът защитава сградата от атмосферни влияния. Правилното изпълнение е критично за предотвратяване на течове и топлинни загуби.",
    timeEstimate: "5-15 дни за къща",
    priceRange: "45-110 €/м²",
    steps: [
      "Монтаж на носеща конструкция",
      "Полагане на дифузионна мембрана",
      "Монтаж на летви и контралетви",
      "Полагане на покривно покритие",
      "Монтаж на обшивки и водосточни тръби",
      "Топлоизолация (ако има таванско)"
    ],
    tips: [
      "Осигурете вентилация под покритието",
      "Използвайте качествена хидроизолация",
      "Не пестете от обшивки"
    ],
    warnings: [
      "Не работете при дъжд или силен вятър",
      "Използвайте предпазни средства",
      "Не пропускайте вентилацията"
    ],
    materials: ["Дървен материал", "Хидроизолация", "Керемиди/ламарина", "Летви", "Обшивки", "Водосточни тръби"]
  },

  waterproofing: {
    name: "Хидроизолация",
    icon: Shield,
    category: "Изолации",
    shortDescription: "Защита от влага и вода",
    fullDescription: "Хидроизолацията предпазва конструкциите от проникване на вода. Критична е за основи, бани, тераси и покриви.",
    timeEstimate: "1-3 дни за баня",
    priceRange: "15-40 €/м²",
    steps: [
      "Почистване на повърхността",
      "Запълване на пукнатини",
      "Грундиране",
      "Нанасяне на хидроизолация (1-ви слой)",
      "Изчакване за съхнене",
      "Нанасяне на 2-ри слой",
      "Полагане на армираща лента в ъгли"
    ],
    tips: [
      "Нанасяйте минимум 2 слоя",
      "Обработете внимателно ъглите",
      "Тествайте с вода преди облицовка"
    ],
    warnings: [
      "Не пропускайте нито един участък",
      "Не бързайте със следващия слой",
      "Не използвайте неподходящи материали"
    ],
    materials: ["Течна хидроизолация", "Грунд", "Армираща лента", "Четка/валяк"]
  },

  drywall: {
    name: "Гипсокартон",
    icon: Square,
    category: "Довършителни работи",
    shortDescription: "Преградни стени и тавани от гипсокартон",
    fullDescription: "Гипсокартонът е бърз и чист начин за изграждане на стени, тавани и конструкции. Позволява лесно скриване на инсталации.",
    timeEstimate: "2-4 дни за стая",
    priceRange: "18-45 €/м²",
    steps: [
      "Монтаж на метална конструкция",
      "Прокарване на инсталации",
      "Поставяне на изолация (ако има)",
      "Монтаж на гипсокартонени плоскости",
      "Обработка на фуги и ъгли",
      "Шпакловка и шлайфане"
    ],
    tips: [
      "Използвайте влагоустойчив в бани",
      "Укрепете местата за окачване",
      "Обработете фугите с лента"
    ],
    warnings: [
      "Не натоварвайте без укрепване",
      "Не използвайте обикновен в мокри зони",
      "Внимание при рязане - прах"
    ],
    materials: ["Гипсокартон", "Метални профили", "Дюбели", "Винтове", "Фугираща лента", "Шпакловка"]
  },

  flooring: {
    name: "Подови настилки",
    icon: Square,
    category: "Довършителни работи",
    shortDescription: "Монтаж на ламинат, паркет, мокет",
    fullDescription: "Подовите настилки са важен елемент от интериора. Изборът зависи от предназначението на помещението и бюджета.",
    timeEstimate: "1-2 дни за стая",
    priceRange: "20-80 €/м²",
    steps: [
      "Проверка на основата за равност",
      "Полагане на пароизолация",
      "Полагане на подложка",
      "Аклиматизация на материала (24-48ч)",
      "Монтаж на настилката",
      "Монтаж на первази"
    ],
    tips: [
      "Оставете дилатационна фуга край стените",
      "Подът трябва да е сух и равен",
      "Започнете от прозореца към вратата"
    ],
    warnings: [
      "Не монтирайте върху влажна основа",
      "Не пропускайте аклиматизацията",
      "Не забравяйте подложката"
    ],
    materials: ["Ламинат/паркет", "Подложка", "Пароизолация", "Первази", "Лепило (за паркет)"]
  },

  heating: {
    name: "Отоплителни системи",
    icon: Thermometer,
    category: "Инсталации",
    shortDescription: "Радиатори, подово отопление, котли",
    fullDescription: "Отоплителната система осигурява комфорт през зимата. Изборът между радиатори и подово отопление зависи от предпочитанията и бюджета.",
    timeEstimate: "5-10 дни за апартамент",
    priceRange: "150-400 €/точка",
    steps: [
      "Проектиране на системата",
      "Монтаж на котел/термопомпа",
      "Полагане на тръбна разводка",
      "Монтаж на радиатори/колектори",
      "Изпитване под налягане",
      "Пускане и балансиране"
    ],
    tips: [
      "Изолирайте тръбите в студени зони",
      "Монтирайте термостатични вентили",
      "Предвидете автоматично обезвъздушаване"
    ],
    warnings: [
      "Не пускайте без изпитване",
      "Не забравяйте разширителен съд",
      "Внимание с газови инсталации - лицензиран монтаж"
    ],
    materials: ["Котел/термопомпа", "Радиатори", "PPR тръби", "Помпа", "Вентили", "Термостати"]
  }
};

const ServiceCard = ({ serviceKey, service, isExpanded, onToggle, lang }) => {
  const Icon = service.icon;
  const isEn = lang === 'en';
  
  return (
    <Card className="overflow-hidden" data-testid={`service-${serviceKey}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardHeader className="hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Icon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                  <CardDescription className="mt-2">{service.shortDescription}</CardDescription>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="h-4 w-4" /> {service.timeEstimate}
                    </span>
                    <span className="text-orange-600 font-medium">{service.priceRange}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 border-t">
            <div className="grid md:grid-cols-2 gap-8 pt-6">
              {/* Left column */}
              <div>
                <h4 className="font-semibold text-lg mb-3">{isEn ? 'Description' : 'Описание'}</h4>

                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" /> {isEn ? 'Execution steps' : 'Стъпки на изпълнение'}
                </h4>
                <ol className="space-y-2 mb-6">
                  {service.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-slate-600">{step}</span>
                    </li>
                  ))}
                </ol>

                <h4 className="font-semibold text-lg mb-3">{isEn ? 'Required materials' : 'Необходими материали'}</h4>
                <div className="flex flex-wrap gap-2">
                  {service.materials.map((material, idx) => (
                    <Badge key={idx} variant="outline">{material}</Badge>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> {isEn ? 'Useful tips' : 'Полезни съвети'}
                  </h4>
                  <ul className="space-y-2">
                    {service.tips.map((tip, idx) => (
                      <li key={idx} className="text-green-700 text-sm flex items-start gap-2">
                        <span>✓</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> {isEn ? 'Warning' : 'Внимание'}
                  </h4>
                  <ul className="space-y-2">
                    {service.warnings.map((warning, idx) => (
                      <li key={idx} className="text-red-700 text-sm flex items-start gap-2">
                        <span>⚠</span> {warning}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 p-4 bg-slate-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{isEn ? 'Need a craftsman?' : 'Нужда от майстор?'}</p>
                      <p className="text-sm text-slate-600">{isEn ? 'Find a verified specialist' : 'Намерете проверен специалист'}</p>
                    </div>
                    <Link to="/companies">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        {isEn ? 'Find company' : 'Намери фирма'} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const ServicesPage = () => {
  const [expandedService, setExpandedService] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  const categories = ['all', ...new Set(Object.values(SERVICES_INFO).map(s => s.category))];
  
  const filteredServices = Object.entries(SERVICES_INFO).filter(([_, service]) => 
    categoryFilter === 'all' || service.category === categoryFilter
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'Construction & Renovation Guide' : 'Справочник за строителство и ремонт'}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            {isEn 
              ? 'Detailed information about all construction activities - execution technology, duration, materials and useful tips from professionals.'
              : 'Подробна информация за всички строителни дейности - технология на изпълнение, времетраене, материали и полезни съвети от професионалисти.'}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className={categoryFilter === cat ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {cat === 'all' ? 'Всички' : cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {filteredServices.map(([key, service]) => (
            <ServiceCard
              key={key}
              serviceKey={key}
              service={service}
              isExpanded={expandedService === key}
              onToggle={() => setExpandedService(expandedService === key ? null : key)}
            />
          ))}
        </div>

        {/* CTA */}
        <Card className="mt-12 bg-orange-600 text-white">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Готови да започнете вашия проект?</h3>
            <p className="text-orange-100 mb-6">
              Използвайте нашия калкулатор за ориентировъчна цена или публикувайте проект за оферти
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/calculator">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                  Калкулатор за цени
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Публикувай проект
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServicesPage;
