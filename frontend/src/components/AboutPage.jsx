import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Heart, CheckCircle, AlertTriangle, ArrowRight, Building2, Star, Eye, Lock, MessageSquare, Calculator, Award } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Защо създадохме <span className="text-orange-400">TemaDom</span>?
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Защото вярваме, че всеки заслужава качествен ремонт от коректен майстор. 
            И защото знаем, че добрите фирми заслужават достъп до реални клиенти.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 bg-red-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Проблемът, който решаваме</h2>
            <p className="text-lg text-slate-600">Реалността в строителния сектор в България</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Некоректни майстори",
                desc: "Взимат аванс и изчезват. Обещават една цена, после оскъпяват многократно. Работят без договор и без гаранция."
              },
              {
                title: "Лошо качество",
                desc: "Бързат, пестят от материали, не спазват технологичните изисквания. Резултатът - пукнатини, течове, развалени покрития след месеци."
              },
              {
                title: "Няма отчетност",
                desc: "Клиентът не може да провери репутацията на майстора. Няма отзиви, няма история. Избираш на тъмно."
              },
              {
                title: "Липса на прозрачност в цените",
                desc: "Всеки дава различна цена. Клиентите не знаят дали 50 лв/м² е честна цена или двойно надута."
              },
              {
                title: "Трудно намиране на клиенти",
                desc: "Добрите фирми губят време в търсене на проекти. Плащат за реклами без гарантиран резултат."
              },
              {
                title: "Прескачане на платформите",
                desc: "Фирмите си разменят телефони преди да има ангажимент и платформата няма стойност за никого."
              }
            ].map((problem, i) => (
              <Card key={i} className="bg-white border-red-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{problem.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{problem.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Нашето решение</h2>
            <p className="text-lg text-slate-600">TemaDom е създаден, за да промени начина, по който хората намират майстори</p>
          </div>

          <div className="space-y-8">
            {[
              {
                icon: <Star className="h-8 w-8 text-amber-500" />,
                title: "Система за репутация",
                desc: "Всеки клиент може да остави отзив и оценка. Фирмите НЕ могат да изтриват или редактират отзиви. С времето, добрите майстори се отличават, а лошите - отпадат.",
                color: "bg-amber-50 border-amber-200"
              },
              {
                icon: <Calculator className="h-8 w-8 text-blue-500" />,
                title: "Прозрачни цени",
                desc: "Нашият калкулатор е базиран на реални пазарни данни за всички 28 области в България. Клиентите знаят каква е нормалната цена ПРЕДИ да се обадят на майстор. Няма изненади.",
                color: "bg-blue-50 border-blue-200"
              },
              {
                icon: <Lock className="h-8 w-8 text-green-500" />,
                title: "Защита от измами",
                desc: "В чата автоматично се филтрират телефони, имейли и координати, докато фирмата не заплати за достъп. Това гарантира, че платформата остава полезна и фирмите не заобикалят системата.",
                color: "bg-green-50 border-green-200"
              },
              {
                icon: <Eye className="h-8 w-8 text-purple-500" />,
                title: "Портфолио с доказателства",
                desc: "Фирмите качват снимки ПРЕДИ и СЛЕД от реални проекти. Не думи - а резултати. Клиентите виждат какво точно може да направи всяка фирма.",
                color: "bg-purple-50 border-purple-200"
              },
              {
                icon: <MessageSquare className="h-8 w-8 text-teal-500" />,
                title: "Директна комуникация",
                desc: "Защитен чат между клиенти и фирми. Обсъдете проекта детайлно, без да напускате платформата. Цялата история е запазена.",
                color: "bg-teal-50 border-teal-200"
              }
            ].map((solution, i) => (
              <Card key={i} className={`${solution.color} hover:shadow-md transition-shadow`}>
                <CardContent className="p-6 flex items-start gap-5">
                  <div className="flex-shrink-0">{solution.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{solution.title}</h3>
                    <p className="text-slate-700 leading-relaxed">{solution.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Clients & Companies */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Clients */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-orange-500" />
                <h2 className="text-2xl font-bold text-slate-900">За клиентите</h2>
              </div>
              <div className="space-y-4">
                {[
                  "Публикувайте проект безплатно и получете оферти от проверени фирми",
                  "Проверете репутацията на фирмата чрез реални отзиви от други клиенти",
                  "Използвайте калкулатора безлимитно и безплатно, за да знаете реалните цени",
                  "Прочетете нашия наръчник за 28 професии - разберете как трябва да изглежда качествената работа",
                  "Оценете фирмата след приключване - помогнете на следващите клиенти",
                  "Защитена комуникация - цялата история в чата е запазена"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* For Companies */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-8 w-8 text-orange-500" />
                <h2 className="text-2xl font-bold text-slate-900">За фирмите</h2>
              </div>
              <div className="space-y-4">
                {[
                  "Получете достъп до реални клиенти с конкретни проекти - без да търсите",
                  "Първите 3 контакта са безплатни - тествайте платформата без риск",
                  "Изградете онлайн портфолио с доказателства за вашата работа",
                  "Добрите отзиви привличат повече клиенти - качеството се отплаща",
                  "Избирайте между единично плащане (25 EUR) или абонамент (100 EUR/мес) за пълен достъп",
                  "Калкулаторът ви помага да давате конкурентни и точни оферти"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Statement */}
      <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Award className="h-16 w-16 mx-auto mb-6 text-white/90" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Нашата мисия</h2>
          <p className="text-lg leading-relaxed mb-4 text-white/90">
            Искаме всеки клиент в България да може да намери качествен и коректен майстор - без стрес, без изненади, без измами.
          </p>
          <p className="text-lg leading-relaxed mb-8 text-white/90">
            И искаме всеки добър майстор да бъде възнаграден за качеството на работата си - с повече клиенти, по-добра репутация и стабилен бизнес.
          </p>
          <Separator className="bg-white/20 mb-8" />
          <p className="text-sm text-white/70 italic">
            TemaDom - защото вашият дом заслужава най-доброто.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Готови ли сте?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3" data-testid="about-register-btn">
                <ArrowRight className="mr-2 h-5 w-5" />
                Започнете сега
              </Button>
            </Link>
            <Link to="/calculator">
              <Button variant="outline" className="text-lg px-8 py-3" data-testid="about-calculator-btn">
                <Calculator className="mr-2 h-5 w-5" />
                Опитайте калкулатора
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
