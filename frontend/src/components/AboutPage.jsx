import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Heart, CheckCircle, AlertTriangle, ArrowRight, Building2, Star, Eye, Lock, MessageSquare, Calculator, Award } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/i18n/LanguageContext';

const content = {
  bg: {
    heroTitle1: "Защо създадохме ", heroTitle2: "?",
    heroDesc: "Защото вярваме, че всеки заслужава качествен ремонт от коректен майстор. И защото знаем, че добрите фирми заслужават достъп до реални клиенти.",
    problemTitle: "Проблемът, който решаваме",
    problemSub: "Реалността в строителния сектор в България",
    problems: [
      { title: "Некоректни майстори", desc: "Взимат аванс и изчезват. Обещават една цена, после оскъпяват многократно." },
      { title: "Лошо качество", desc: "Бързат, пестят от материали, не спазват технологичните изисквания." },
      { title: "Няма отчетност", desc: "Клиентът не може да провери репутацията. Няма отзиви, няма история." },
      { title: "Липса на прозрачност", desc: "Всеки дава различна цена. Клиентите не знаят дали цената е честна." },
      { title: "Трудно намиране на клиенти", desc: "Добрите фирми губят време. Плащат за реклами без гарантиран резултат." },
      { title: "Прескачане на платформите", desc: "Фирмите си разменят телефони преди ангажимент." }
    ],
    solutionTitle: "Нашето решение",
    solutionSub: "TemaDom променя начина, по който хората намират майстори",
    solutions: [
      { title: "Система за репутация", desc: "Всеки клиент може да остави отзив. Фирмите НЕ могат да изтриват отзиви. Добрите майстори се отличават." },
      { title: "Прозрачни цени", desc: "Калкулаторът е базиран на реални данни за всички 28 области. Клиентите знаят цената ПРЕДИ да се обадят." },
      { title: "Защита от измами", desc: "В чата се филтрират контакти, докато фирмата не заплати за достъп." },
      { title: "Портфолио с доказателства", desc: "Фирмите качват снимки ПРЕДИ и СЛЕД от реални проекти. Не думи - а резултати." },
      { title: "Директна комуникация", desc: "Защитен чат между клиенти и фирми. Цялата история е запазена." }
    ],
    forClients: "За клиентите",
    clientBenefits: [
      "Публикувайте проект безплатно и получете оферти от проверени фирми",
      "Проверете репутацията чрез реални отзиви от други клиенти",
      "Използвайте калкулатора безлимитно и безплатно",
      "Прочетете наръчника за 28 професии",
      "Оценете фирмата след приключване",
      "Защитена комуникация — цялата история запазена"
    ],
    forCompanies: "За фирмите",
    companyBenefits: [
      "Достъп до реални клиенти с конкретни проекти",
      "Първите 3 контакта са безплатни — тествайте без риск",
      "Изградете онлайн портфолио с доказателства",
      "Добрите отзиви привличат повече клиенти",
      "Единично плащане (25 EUR) или абонамент (100 EUR/мес)",
      "Калкулаторът помага за конкурентни оферти"
    ],
    missionTitle: "Нашата мисия",
    missionP1: "Искаме всеки клиент в България да намери качествен и коректен майстор — без стрес, без изненади, без измами.",
    missionP2: "И искаме всеки добър майстор да бъде възнаграден за качеството си.",
    missionFooter: "TemaDom — защото вашият дом заслужава най-доброто.",
    ctaTitle: "Готови ли сте?",
    ctaStart: "Започнете сега",
    ctaCalc: "Опитайте калкулатора"
  },
  en: {
    heroTitle1: "Why we created ", heroTitle2: "?",
    heroDesc: "Because we believe everyone deserves quality renovation from an honest craftsman.",
    problemTitle: "The problem we solve",
    problemSub: "The reality in Bulgaria's construction sector",
    problems: [
      { title: "Dishonest workers", desc: "Take an advance and disappear. Promise one price, then overcharge." },
      { title: "Poor quality", desc: "Rush, save on materials, don't follow requirements." },
      { title: "No accountability", desc: "Client cannot check reputation. No reviews, no history." },
      { title: "No price transparency", desc: "Everyone gives different price. Clients don't know what's fair." },
      { title: "Hard to find clients", desc: "Good companies waste time searching. Pay for ads without results." },
      { title: "Bypassing platforms", desc: "Companies exchange contacts before commitment." }
    ],
    solutionTitle: "Our solution",
    solutionSub: "TemaDom changes the way people find craftsmen",
    solutions: [
      { title: "Reputation system", desc: "Every client can leave a review. Companies CANNOT delete reviews." },
      { title: "Transparent prices", desc: "Calculator based on real data for all 28 regions." },
      { title: "Fraud protection", desc: "Contacts filtered in chat until company pays for access." },
      { title: "Portfolio with proof", desc: "Companies upload BEFORE and AFTER photos from real projects." },
      { title: "Direct communication", desc: "Secure chat. All history saved." }
    ],
    forClients: "For clients",
    clientBenefits: ["Post project free, get offers", "Check reputation via reviews", "Free unlimited calculator", "Guide for 28 professions", "Rate company after completion", "Secure communication"],
    forCompanies: "For companies",
    companyBenefits: ["Access real clients", "First 3 contacts free", "Build online portfolio", "Good reviews attract more", "Pay per contact (25 EUR) or subscribe (100 EUR/mo)", "Calculator for accurate offers"],
    missionTitle: "Our mission",
    missionP1: "We want every client to find a quality craftsman — no stress, no surprises, no fraud.",
    missionP2: "And every good craftsman to be rewarded for quality.",
    missionFooter: "TemaDom — because your home deserves the best.",
    ctaTitle: "Ready?",
    ctaStart: "Get started",
    ctaCalc: "Try the calculator"
  }
};

const sIcons = [Star, Calculator, Lock, Eye, MessageSquare];
const sColors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#14B8A6'];

const AboutPage = () => {
  const { lang } = useLanguage();
  const c = content[lang] || content.bg;

  return (
    <div className="min-h-screen" style={{background: "var(--theme-bg)"}} data-testid="about-page">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF8C42]/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">{c.heroTitle1}<span className="text-[#FF8C42]">TemaDom</span>{c.heroTitle2}</h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">{c.heroDesc}</p>
        </div>
      </section>

      {/* Problems */}
      <section className="py-16 bg-[#1A2535]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{c.problemTitle}</h2>
            <p className="text-slate-400">{c.problemSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {c.problems.map((p, i) => (
              <Card key={i} className="bg-[#253545] border-red-500/20 hover:border-red-500/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-white mb-1">{p.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-16 bg-[#0F1923]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 text-[#FF8C42] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{c.solutionTitle}</h2>
            <p className="text-slate-400">{c.solutionSub}</p>
          </div>
          <div className="space-y-4">
            {c.solutions.map((s, i) => {
              const Icon = sIcons[i];
              return (
                <Card key={i} className="bg-[#1E2A38] border-[#2A3A4C] hover:border-[#FF8C42]/30 transition-colors">
                  <CardContent className="p-5 flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${sColors[i]}15` }}>
                      <Icon className="h-6 w-6" style={{ color: sColors[i] }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{s.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Clients / Companies */}
      <section className="py-16 bg-[#1A2535]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-7 w-7 text-[#FF8C42]" />
                <h2 className="text-xl font-bold text-white">{c.forClients}</h2>
              </div>
              <div className="space-y-3">
                {c.clientBenefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-7 w-7 text-[#FF8C42]" />
                <h2 className="text-xl font-bold text-white">{c.forCompanies}</h2>
              </div>
              <div className="space-y-3">
                {c.companyBenefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-gradient-to-br from-[#FF8C42] to-[#EA580C]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Award className="h-14 w-14 mx-auto mb-6 text-white/90" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">{c.missionTitle}</h2>
          <p className="text-lg leading-relaxed mb-4 text-white/90">{c.missionP1}</p>
          <p className="text-lg leading-relaxed mb-8 text-white/90">{c.missionP2}</p>
          <div className="border-t border-white/20 pt-6">
            <p className="text-sm text-white/70 italic">{c.missionFooter}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0F1923] text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-6">{c.ctaTitle}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-lg px-8 py-3 text-white" data-testid="about-register-btn">
                <ArrowRight className="mr-2 h-5 w-5" /> {c.ctaStart}
              </Button>
            </Link>
            <Link to="/calculator">
              <Button variant="outline" className="text-lg px-8 py-3 border-[#3A4A5C] text-slate-300 hover:text-white hover:bg-white/5" data-testid="about-calculator-btn">
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
