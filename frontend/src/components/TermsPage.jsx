import React from 'react';
import { Shield, FileText, CreditCard, MessageSquare, Star, Calculator, AlertTriangle, Users, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from '@/i18n/LanguageContext';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50" data-testid="terms-page">
      {/* Header */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="h-10 w-10 text-orange-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Правила и условия</h1>
          <p className="text-slate-400">Последна актуализация: февруари 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        
        {/* 1. General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-500" />
              1. Общи условия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>TemaDom е онлайн платформа, която свързва клиенти, търсещи строителни и ремонтни услуги, с фирми и майстори, предлагащи тези услуги.</p>
            <p>С регистрацията си в платформата, всеки потребител приема настоящите правила и условия.</p>
            <p>TemaDom не е пряк изпълнител на строителни работи. Платформата е посредник, който улеснява връзката между клиенти и фирми.</p>
            <p>Платформата поддържа два типа акаунти:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Клиент</strong> - физическо или юридическо лице, което търси строителни или ремонтни услуги</li>
              <li><strong>Фирма/Майстор</strong> - юридическо лице или самоосигуряващо се лице, предлагащо строителни или ремонтни услуги</li>
            </ul>
          </CardContent>
        </Card>

        {/* 2. Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-orange-500" />
              2. Регистрация и акаунти
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>За регистрация е необходимо: имейл адрес, парола, име и телефонен номер.</p>
            <p>Всеки потребител е отговорен за точността на предоставената информация.</p>
            <p>Един имейл адрес може да бъде свързан само с един акаунт.</p>
            <p>TemaDom си запазва правото да деактивира акаунти, които нарушават правилата на платформата, включително но не ограничено до:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Предоставяне на фалшива информация</li>
              <li>Опит за заобикаляне на платежната система</li>
              <li>Обидно или агресивно поведение</li>
              <li>Системно предоставяне на некачествени услуги</li>
            </ul>
          </CardContent>
        </Card>

        {/* 3. Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-orange-500" />
              3. Публикуване на проекти
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>Клиентите могат да публикуват проекти безплатно.</p>
            <p>Всеки проект може да съдържа: заглавие, описание, категория, местоположение и до 10 снимки/чертежи.</p>
            <p>Контактната информация на клиента (телефон, имейл) е видима САМО за фирми, които са заплатили за достъп или имат активен абонамент.</p>
            <p>Системата автоматично предоставя ориентировъчна оценка на бюджета на базата на въведените данни.</p>
            <p>Клиентът е отговорен за точността на описанието на проекта.</p>
          </CardContent>
        </Card>

        {/* 4. Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-orange-500" />
              4. Плащания и абонаменти
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p className="font-semibold">Ценова политика за фирми:</p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p><strong>Безплатен старт:</strong> Първите 3 контакта на клиенти са безплатни за всяка нова фирма.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <p><strong>Единичен контакт:</strong> 25 EUR за достъп до контактната информация на конкретен клиент.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <p><strong>Месечен абонамент:</strong> 100 EUR на месец за неограничен достъп до всички контакти и калкулатора.</p>
              </div>
            </div>
            <Separator />
            <p className="font-semibold">Калкулатор за фирми:</p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p><strong>5 безплатни калкулации</strong> за всяка нова фирма.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <p><strong>10 EUR</strong> за 5 допълнителни калкулации след изчерпване на безплатните.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <p>Абонатите имат <strong>неограничен достъп</strong> до калкулатора.</p>
              </div>
            </div>
            <Separator />
            <p className="font-semibold">За клиенти:</p>
            <p>Публикуването на проекти и използването на калкулатора са напълно <strong>безплатни и без ограничения</strong> за клиенти.</p>
            <Separator />
            <p>Всички плащания се обработват чрез Stripe. TemaDom не съхранява данни за банкови карти.</p>
            <p>Възстановяване на средства се разглежда индивидуално при основателни причини.</p>
          </CardContent>
        </Card>

        {/* 5. Chat Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-orange-500" />
              5. Правила за комуникация (Чат)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Автоматично филтриране на контактна информация</p>
                  <p className="text-amber-700 text-sm mt-1">За да се предотврати заобикалянето на платежната система, чатът автоматично скрива телефонни номера, имейл адреси, социални мрежи и други координати за контакт в съобщенията, когато фирмата НЕ е заплатила за достъп.</p>
                </div>
              </div>
            </div>
            <p>Тази мярка е необходима за:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Защита на бизнес модела на платформата</li>
              <li>Гарантиране на качеството на обслужване</li>
              <li>Стимулиране на фирмите да поддържат профилите си актуални</li>
            </ul>
            <p>Забранено е използването на кодирани или маскирани начини за споделяне на контактна информация.</p>
            <p>Съобщенията трябва да са свързани с обсъждания проект и да са в уважителен тон.</p>
          </CardContent>
        </Card>

        {/* 6. Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Star className="h-6 w-6 text-orange-500" />
              6. Отзиви и оценки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>Клиентите имат право да оставят отзив и оценка (от 1 до 5 звезди) за всяка фирма, с която са работили.</p>
            <p className="font-semibold text-red-700">Фирмите НЕ могат да изтриват, редактират или оспорват отзиви.</p>
            <p>Това гарантира обективност и изгражда доверие в платформата.</p>
            <p>TemaDom си запазва правото да премахва отзиви, които:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Съдържат обидни или нецензурни изрази</li>
              <li>Са очевидно фалшиви или манипулативни</li>
              <li>Нямат връзка с реално извършена услуга</li>
            </ul>
          </CardContent>
        </Card>

        {/* 7. Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-orange-500" />
              7. Ценови калкулатор
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>Калкулаторът предоставя ориентировъчни цени, базирани на средни пазарни стойности за 2025-2026 г. за всички 28 области в България.</p>
            <p>Цените са индикативни и НЕ представляват оферта или гаранция за крайна цена.</p>
            <p>Реалните цени могат да варират в зависимост от: състоянието на обекта, достъпност, сезонност, конкретния изпълнител и сложността на работата.</p>
            <p>PDF офертите, генерирани от калкулатора, са ориентировъчни документи и нямат правна стойност.</p>
          </CardContent>
        </Card>

        {/* 8. Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-500" />
              8. Ограничение на отговорността
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>TemaDom е посредник и не носи отговорност за:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Качеството на извършените строителни или ремонтни работи</li>
              <li>Спазването на уговорените срокове между клиент и фирма</li>
              <li>Точността на информацията, предоставена от фирмите</li>
              <li>Спорове между клиенти и фирми</li>
            </ul>
            <p>Препоръчваме на клиентите винаги да сключват писмен договор с избраната фирма.</p>
            <p>TemaDom не гарантира наличието на фирми за всяка категория услуги или регион.</p>
          </CardContent>
        </Card>

        {/* 9. Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-500" />
              9. Защита на личните данни
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>TemaDom обработва лични данни в съответствие с GDPR и Закона за защита на личните данни.</p>
            <p>Събирани данни: имейл, име, телефон. Тези данни се използват единствено за функционирането на платформата.</p>
            <p>Контактната информация на клиентите се предоставя САМО на фирми, които са заплатили за достъп.</p>
            <p>Плащанията се обработват изцяло от Stripe. TemaDom няма достъп до данни за банкови карти.</p>
          </CardContent>
        </Card>

        {/* 10. Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-orange-500" />
              10. Промени в условията
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 leading-relaxed">
            <p>TemaDom си запазва правото да променя настоящите правила и условия по всяко време.</p>
            <p>При съществени промени, потребителите ще бъдат уведомени по имейл.</p>
            <p>Продължаването на използването на платформата след промяна в условията означава приемане на новите условия.</p>
          </CardContent>
        </Card>

        <div className="text-center text-slate-500 text-sm pt-8">
          <p>При въпроси относно правилата и условията, моля свържете се с нас на info@temadom.com</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
