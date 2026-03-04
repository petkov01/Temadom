import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Heart, CheckCircle, AlertTriangle, ArrowRight, Building2, Star, Eye, Lock, MessageSquare, Calculator, Award } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from '@/i18n/LanguageContext';

const content = {
  bg: {
    heroTitle1: "Защо създадохме ", heroTitle2: "?",
    heroDesc: "Защото вярваме, че всеки заслужава качествен ремонт от коректен майстор. И защото знаем, че добрите фирми заслужават достъп до реални клиенти.",
    problemTitle: "Проблемът, който решаваме",
    problemSub: "Реалността в строителния сектор в България",
    problems: [
      { title: "Некоректни майстори", desc: "Взимат аванс и изчезват. Обещават една цена, после оскъпяват многократно. Работят без договор и без гаранция." },
      { title: "Лошо качество", desc: "Бързат, пестят от материали, не спазват технологичните изисквания. Резултатът - пукнатини, течове, развалени покрития след месеци." },
      { title: "Няма отчетност", desc: "Клиентът не може да провери репутацията на майстора. Няма отзиви, няма история. Избираш на тъмно." },
      { title: "Липса на прозрачност в цените", desc: "Всеки дава различна цена. Клиентите не знаят дали 50 лв/м² е честна цена или двойно надута." },
      { title: "Трудно намиране на клиенти", desc: "Добрите фирми губят време в търсене на проекти. Плащат за реклами без гарантиран резултат." },
      { title: "Прескачане на платформите", desc: "Фирмите си разменят телефони преди да има ангажимент и платформата няма стойност за никого." }
    ],
    solutionTitle: "Нашето решение",
    solutionSub: "TemaDom е създаден, за да промени начина, по който хората намират майстори",
    solutions: [
      { title: "Система за репутация", desc: "Всеки клиент може да остави отзив и оценка. Фирмите НЕ могат да изтриват или редактират отзиви. С времето, добрите майстори се отличават, а лошите - отпадат." },
      { title: "Прозрачни цени", desc: "Нашият калкулатор е базиран на реални пазарни данни за всички 28 области в България. Клиентите знаят каква е нормалната цена ПРЕДИ да се обадят на майстор." },
      { title: "Защита от измами", desc: "В чата автоматично се филтрират телефони, имейли и координати, докато фирмата не заплати за достъп. Това гарантира, че платформата остава полезна." },
      { title: "Портфолио с доказателства", desc: "Фирмите качват снимки ПРЕДИ и СЛЕД от реални проекти. Не думи - а резултати. Клиентите виждат какво точно може да направи всяка фирма." },
      { title: "Директна комуникация", desc: "Защитен чат между клиенти и фирми. Обсъдете проекта детайлно, без да напускате платформата. Цялата история е запазена." }
    ],
    forClients: "За клиентите",
    clientBenefits: [
      "Публикувайте проект безплатно и получете оферти от проверени фирми",
      "Проверете репутацията на фирмата чрез реални отзиви от други клиенти",
      "Използвайте калкулатора безлимитно и безплатно, за да знаете реалните цени",
      "Прочетете нашия наръчник за 28 професии - разберете как трябва да изглежда качествената работа",
      "Оценете фирмата след приключване - помогнете на следващите клиенти",
      "Защитена комуникация - цялата история в чата е запазена"
    ],
    forCompanies: "За фирмите",
    companyBenefits: [
      "Получете достъп до реални клиенти с конкретни проекти - без да търсите",
      "Първите 3 контакта са безплатни - тествайте платформата без риск",
      "Изградете онлайн портфолио с доказателства за вашата работа",
      "Добрите отзиви привличат повече клиенти - качеството се отплаща",
      "Избирайте между единично плащане (25 EUR) или абонамент (100 EUR/мес) за пълен достъп",
      "Калкулаторът ви помага да давате конкурентни и точни оферти"
    ],
    missionTitle: "Нашата мисия",
    missionP1: "Искаме всеки клиент в България да може да намери качествен и коректен майстор - без стрес, без изненади, без измами.",
    missionP2: "И искаме всеки добър майстор да бъде възнаграден за качеството на работата си - с повече клиенти, по-добра репутация и стабилен бизнес.",
    missionFooter: "TemaDom - защото вашият дом заслужава най-доброто.",
    ctaTitle: "Готови ли сте?",
    ctaStart: "Започнете сега",
    ctaCalc: "Опитайте калкулатора"
  },
  en: {
    heroTitle1: "Why we created ", heroTitle2: "?",
    heroDesc: "Because we believe everyone deserves quality renovation from an honest craftsman. And because we know that good companies deserve access to real clients.",
    problemTitle: "The problem we solve",
    problemSub: "The reality in Bulgaria's construction sector",
    problems: [
      { title: "Dishonest workers", desc: "They take an advance and disappear. Promise one price, then overcharge multiple times. Work without a contract or warranty." },
      { title: "Poor quality", desc: "They rush, save on materials, don't follow technical requirements. The result - cracks, leaks, damaged coatings after months." },
      { title: "No accountability", desc: "The client cannot check the reputation of the worker. No reviews, no history. You choose blindly." },
      { title: "Lack of price transparency", desc: "Everyone gives a different price. Clients don't know if 50 BGN/m\u00B2 is a fair price or double inflated." },
      { title: "Hard to find clients", desc: "Good companies waste time searching for projects. They pay for ads without guaranteed results." },
      { title: "Bypassing platforms", desc: "Companies exchange phone numbers before any commitment and the platform has no value for anyone." }
    ],
    solutionTitle: "Our solution",
    solutionSub: "TemaDom was created to change the way people find craftsmen",
    solutions: [
      { title: "Reputation system", desc: "Every client can leave a review and rating. Companies CANNOT delete or edit reviews. Over time, good craftsmen stand out, and bad ones drop out." },
      { title: "Transparent prices", desc: "Our calculator is based on real market data for all 28 regions in Bulgaria. Clients know the normal price BEFORE calling a worker." },
      { title: "Fraud protection", desc: "In the chat, phone numbers, emails and coordinates are automatically filtered until the company pays for access. This ensures the platform remains useful." },
      { title: "Portfolio with proof", desc: "Companies upload BEFORE and AFTER photos from real projects. Not words - but results. Clients see exactly what each company can do." },
      { title: "Direct communication", desc: "Secure chat between clients and companies. Discuss the project in detail without leaving the platform. All history is saved." }
    ],
    forClients: "For clients",
    clientBenefits: [
      "Post a project for free and get offers from verified companies",
      "Check the company's reputation through real reviews from other clients",
      "Use the calculator unlimited and for free to know real prices",
      "Read our guide for 28 professions - understand what quality work should look like",
      "Rate the company after completion - help the next clients",
      "Secure communication - all chat history is saved"
    ],
    forCompanies: "For companies",
    companyBenefits: [
      "Get access to real clients with specific projects - without searching",
      "First 3 contacts are free - test the platform without risk",
      "Build an online portfolio with proof of your work",
      "Good reviews attract more clients - quality pays off",
      "Choose between single payment (25 EUR) or subscription (100 EUR/mo) for full access",
      "The calculator helps you give competitive and accurate offers"
    ],
    missionTitle: "Our mission",
    missionP1: "We want every client in Bulgaria to find a quality and honest craftsman - without stress, without surprises, without fraud.",
    missionP2: "And we want every good craftsman to be rewarded for the quality of their work - with more clients, better reputation and stable business.",
    missionFooter: "TemaDom - because your home deserves the best.",
    ctaTitle: "Are you ready?",
    ctaStart: "Get started now",
    ctaCalc: "Try the calculator"
  }
};

const solutionIcons = [
  <Star className="h-8 w-8 text-amber-500" />,
  <Calculator className="h-8 w-8 text-blue-500" />,
  <Lock className="h-8 w-8 text-green-500" />,
  <Eye className="h-8 w-8 text-purple-500" />,
  <MessageSquare className="h-8 w-8 text-teal-500" />
];
const solutionColors = ["bg-amber-50 border-amber-200","bg-blue-50 border-blue-200","bg-green-50 border-green-200","bg-purple-50 border-purple-200","bg-teal-50 border-teal-200"];

const AboutPage = () => {
  const { lang } = useLanguage();
  const c = content[lang] || content.bg;

  return (
    <div className="min-h-screen bg-[#253545]" data-testid="about-page">
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF8C42]/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">{c.heroTitle1}<span className="text-orange-400">TemaDom</span>{c.heroTitle2}</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">{c.heroDesc}</p>
        </div>
      </section>

      <section className="py-16 bg-red-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{c.problemTitle}</h2>
            <p className="text-lg text-slate-400">{c.problemSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {c.problems.map((p, i) => (
              <Card key={i} className="bg-[#253545] border-red-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-2">{p.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{c.solutionTitle}</h2>
            <p className="text-lg text-slate-400">{c.solutionSub}</p>
          </div>
          <div className="space-y-8">
            {c.solutions.map((s, i) => (
              <Card key={i} className={`${solutionColors[i]} hover:shadow-md transition-shadow`}>
                <CardContent className="p-6 flex items-start gap-5">
                  <div className="flex-shrink-0">{solutionIcons[i]}</div>
                  <div>
                    <h3 className="font-bold text-lg text-white mb-2">{s.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#1E2A38]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-orange-500" />
                <h2 className="text-2xl font-bold text-white">{c.forClients}</h2>
              </div>
              <div className="space-y-4">
                {c.clientBenefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-8 w-8 text-orange-500" />
                <h2 className="text-2xl font-bold text-white">{c.forCompanies}</h2>
              </div>
              <div className="space-y-4">
                {c.companyBenefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Award className="h-16 w-16 mx-auto mb-6 text-white/90" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">{c.missionTitle}</h2>
          <p className="text-lg leading-relaxed mb-4 text-white/90">{c.missionP1}</p>
          <p className="text-lg leading-relaxed mb-8 text-white/90">{c.missionP2}</p>
          <Separator className="bg-[#253545]/20 mb-8" />
          <p className="text-sm text-white/70 italic">{c.missionFooter}</p>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-6">{c.ctaTitle}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-lg px-8 py-3" data-testid="about-register-btn">
                <ArrowRight className="mr-2 h-5 w-5" /> {c.ctaStart}
              </Button>
            </Link>
            <Link to="/calculator">
              <Button variant="outline" className="text-lg px-8 py-3" data-testid="about-calculator-btn">
                <Calculator className="mr-2 h-5 w-5" /> {c.ctaCalc}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
