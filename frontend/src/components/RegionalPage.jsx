import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calculator, ArrowRight, ArrowLeft, Building2, Star, Phone } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { REGIONS, SEO_PROFESSIONS } from '@/data/seoData';

const RegionalPage = () => {
  const { slug } = useParams();
  const regionEntry = Object.entries(REGIONS).find(([, r]) => r.slug === slug);

  useEffect(() => {
    if (regionEntry) {
      document.title = `Строителство ${regionEntry[1].name} 2026 - цени и майстори | TemaDom`;
    }
  }, [regionEntry]);

  if (!regionEntry) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Областта не е намерена</h1>
        <Link to="/prices"><Button>Към цени по области</Button></Link>
      </div>
    </div>
  );

  const [regionKey, region] = regionEntry;
  const otherRegions = Object.entries(REGIONS).filter(([k]) => k !== regionKey).sort((a, b) => b[1].multiplier - a[1].multiplier);

  return (
    <div className="min-h-screen" style={{background: "var(--theme-bg-surface)"}} data-testid="regional-page">
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/prices" className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" /> Всички области
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8 text-orange-400" />
            <h1 className="text-3xl sm:text-4xl font-bold">Строителство и ремонти <span className="text-orange-400">{region.name}</span> 2026</h1>
          </div>
          <p className="text-slate-300 max-w-2xl">{region.description}. Ценови коефициент: <Badge className="bg-orange-600 ml-1">x{region.multiplier.toFixed(2)}</Badge></p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-[#FF8C42]">x{region.multiplier.toFixed(2)}</p><p className="text-xs text-slate-500">Ценови коефициент</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-white">28</p><p className="text-xs text-slate-500">Професии</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-white">{region.population}</p><p className="text-xs text-slate-500">Население</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{(6 * region.multiplier).toFixed(1)}€</p><p className="text-xs text-slate-500">Боядисване/м²</p></CardContent></Card>
        </div>

        {/* Full price table */}
        <h2 className="text-2xl font-bold text-white mb-4">Всички цени в {region.name} за 2026</h2>
        <Card className="mb-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 text-left">Услуга</th>
                  <th className="p-3 text-center">Единица</th>
                  <th className="p-3 text-center">Само труд (EUR)</th>
                  <th className="p-3 text-center">Труд + мат. (EUR)</th>
                  <th className="p-3 text-center">Труд + мат. (BGN)</th>
                </tr>
              </thead>
              <tbody>
                {SEO_PROFESSIONS.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-[#1E2A38]' : 'bg-[#253545]'}>
                    <td className="p-3 font-medium">
                      <Link to={`/blog/ceni-${p.slug}-2026`} className="text-[#FF8C42] hover:underline">{p.name}</Link>
                    </td>
                    <td className="p-3 text-center text-slate-500">{p.unit}</td>
                    <td className="p-3 text-center">{(p.basePrice.labor * region.multiplier).toFixed(2)}</td>
                    <td className="p-3 text-center font-semibold text-[#FF8C42]">{(p.basePrice.full * region.multiplier).toFixed(2)}</td>
                    <td className="p-3 text-center text-slate-400">{(p.basePrice.full * region.multiplier * 1.9558).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Example calculation */}
        <h2 className="text-2xl font-bold text-white mb-4">Примерна калкулация за апартамент 60 м² в {region.name}</h2>
        <Card className="mb-8 bg-[#FF8C42]/5 border-[#FF8C42]/20">
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { name: 'Боядисване (120 м² стени)', price: 6 * region.multiplier * 120 },
                { name: 'Шпакловка (120 м² стени)', price: 7 * region.multiplier * 120 },
                { name: 'Подови настилки (60 м²)', price: 12 * region.multiplier * 60 },
                { name: 'Ел. инсталация (25 точки)', price: 14 * region.multiplier * 25 },
                { name: 'ВиК (10 точки)', price: 18 * region.multiplier * 10 },
                { name: 'Плочки - баня (15 м²)', price: 22 * region.multiplier * 15 },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="font-semibold">{item.price.toFixed(0)} EUR</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-white">ОБЩА СУМА</span>
                <span className="font-bold text-[#FF8C42]">
                  {(6 * region.multiplier * 120 + 7 * region.multiplier * 120 + 12 * region.multiplier * 60 + 14 * region.multiplier * 25 + 18 * region.multiplier * 10 + 22 * region.multiplier * 15).toFixed(0)} EUR
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mb-8">
          <Link to="/calculator">
            <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-lg px-8 py-3" data-testid="region-calc-btn">
              <Calculator className="mr-2 h-5 w-5" /> Изчисли цена за {region.name}
            </Button>
          </Link>
        </div>

        {/* Other regions */}
        <h2 className="text-xl font-bold text-white mb-4">Сравни с други области</h2>
        <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-3">
          {otherRegions.slice(0, 8).map(([k, r]) => (
            <Link key={k} to={`/region/${r.slug}`} className="text-sm text-[#FF8C42] hover:underline flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {r.name} (x{r.multiplier.toFixed(2)})
            </Link>
          ))}
        </div>

        {/* LocalBusiness Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": `TemaDom - Строителство ${region.name}`,
          "description": `Строителни услуги и ремонти в ${region.name}. 28 професии, актуални цени 2026.`,
          "areaServed": { "@type": "AdministrativeArea", "name": region.name },
          "priceRange": `${(6*region.multiplier).toFixed(0)}-${(50*region.multiplier).toFixed(0)} EUR`,
          "url": `https://temadom.com/region/${region.slug}`
        })}} />
      </div>
    </div>
  );
};

export default RegionalPage;
