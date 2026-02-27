import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calculator, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from "@/components/ui/badge";
import { REGIONS, SEO_PROFESSIONS } from '@/data/seoData';

const PricesByRegionPage = () => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const regions = Object.entries(REGIONS).sort((a, b) => b[1].multiplier - a[1].multiplier);

  const getTrend = (m) => {
    if (m >= 1.05) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (m <= 0.90) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="prices-by-region">
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <MapPin className="h-10 w-10 text-orange-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{isEn ? <>Construction prices by <span className="text-orange-400">regions</span> 2026</> : <>Строителни цени по <span className="text-orange-400">области</span> 2026</>}</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">Сравнение на строителните цени във всички 28 области на България</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-red-800">Най-скъпи</p>
              <p className="text-sm text-red-600">София (x1.20), Варна (x1.08)</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Minus className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="font-bold text-yellow-800">Средни</p>
              <p className="text-sm text-yellow-600">Пловдив (x1.05), Стара Загора (x0.98)</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <TrendingDown className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-green-800">Най-достъпни</p>
              <p className="text-sm text-green-600">Видин (x0.82), Силистра (x0.82)</p>
            </CardContent>
          </Card>
        </div>

        {/* Main comparison table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 text-left sticky left-0 bg-slate-900 z-10">Област</th>
                  <th className="p-3 text-center">Коеф.</th>
                  <th className="p-3 text-center">Боядисване<br/><span className="text-xs text-slate-300">EUR/м²</span></th>
                  <th className="p-3 text-center">Шпакловка<br/><span className="text-xs text-slate-300">EUR/м²</span></th>
                  <th className="p-3 text-center">Плочки<br/><span className="text-xs text-slate-300">EUR/м²</span></th>
                  <th className="p-3 text-center">Ел. инст.<br/><span className="text-xs text-slate-300">EUR/точка</span></th>
                  <th className="p-3 text-center">ВиК<br/><span className="text-xs text-slate-300">EUR/точка</span></th>
                  <th className="p-3 text-center">Замазка<br/><span className="text-xs text-slate-300">EUR/м²</span></th>
                  <th className="p-3 text-center whitespace-nowrap">Действие</th>
                </tr>
              </thead>
              <tbody>
                {regions.map(([key, r], i) => (
                  <tr key={key} className={`${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-orange-50 transition-colors`}>
                    <td className="p-3 font-medium sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2">
                        {getTrend(r.multiplier)}
                        <Link to={`/region/${r.slug}`} className="text-orange-600 hover:underline">{r.name}</Link>
                      </div>
                    </td>
                    <td className="p-3 text-center"><Badge variant="outline" className="text-xs">x{r.multiplier.toFixed(2)}</Badge></td>
                    <td className="p-3 text-center">{(6 * r.multiplier).toFixed(1)}</td>
                    <td className="p-3 text-center">{(7 * r.multiplier).toFixed(1)}</td>
                    <td className="p-3 text-center">{(22 * r.multiplier).toFixed(1)}</td>
                    <td className="p-3 text-center">{(14 * r.multiplier).toFixed(1)}</td>
                    <td className="p-3 text-center">{(18 * r.multiplier).toFixed(1)}</td>
                    <td className="p-3 text-center">{(30 * r.multiplier).toFixed(1)}</td>
                    <td className="p-3 text-center">
                      <Link to={`/region/${r.slug}`}>
                        <Button size="sm" variant="ghost" className="text-orange-600 hover:text-orange-700 text-xs">
                          Детайли <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link to="/calculator">
            <Button className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3" data-testid="prices-calc-btn">
              <Calculator className="mr-2 h-5 w-5" /> Изчисли точна оферта за твоята област
            </Button>
          </Link>
        </div>

        {/* Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Строителни цени по области 2026 - TemaDom",
          "description": "Сравнение на строителните цени във всички 28 области на България за 2026 г.",
          "url": "https://temadom.com/prices"
        })}} />
      </div>
    </div>
  );
};

export default PricesByRegionPage;
