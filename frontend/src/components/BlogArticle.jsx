import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calculator, MapPin, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BLOG_ARTICLES, REGIONS, SEO_PROFESSIONS } from '@/data/seoData';

const BlogArticle = () => {
  const { slug } = useParams();
  const article = BLOG_ARTICLES.find(a => a.slug === slug);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | TemaDom`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', article.description);
    }
  }, [article]);

  if (!article) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Статията не е намерена</h1>
        <Link to="/blog"><Button>Към блога</Button></Link>
      </div>
    </div>
  );

  const regions = Object.entries(REGIONS);
  const profession = article.professionId ? SEO_PROFESSIONS.find(p => p.id === article.professionId) : null;
  const region = article.regionKey ? REGIONS[article.regionKey] : null;

  return (
    <div className="min-h-screen bg-white" data-testid="blog-article">
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/blog" className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Към блога
        </Link>

        <header className="mb-8">
          <Badge className="bg-orange-100 text-orange-800 mb-3">{article.type === 'profession' ? 'Професия' : article.type === 'region' ? 'Регион' : 'Строителство'}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{article.h1}</h1>
          <p className="text-lg text-slate-600">{article.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Февруари 2026</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> България</span>
          </div>
        </header>

        <Separator className="mb-8" />

        {/* Price comparison table */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {profession ? `Цени ${profession.name.toLowerCase()} по области` : region ? `Строителни цени в ${region.name}` : 'Цени по области 2026'}
          </h2>

          {profession && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 text-left">Област</th>
                    <th className="p-3 text-center">Само труд (EUR/{profession.unit})</th>
                    <th className="p-3 text-center">Труд + материали (EUR/{profession.unit})</th>
                    <th className="p-3 text-center">Труд + материали (BGN/{profession.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.sort((a,b) => b[1].multiplier - a[1].multiplier).map(([key, r], i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3 text-center">{(profession.basePrice.labor * r.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center font-semibold text-orange-600">{(profession.basePrice.full * r.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center text-slate-600">{(profession.basePrice.full * r.multiplier * 1.9558).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {region && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 text-left">Услуга</th>
                    <th className="p-3 text-center">Единица</th>
                    <th className="p-3 text-center">Само труд (EUR)</th>
                    <th className="p-3 text-center">Труд + материали (EUR)</th>
                    <th className="p-3 text-center">Труд + мат. (BGN)</th>
                  </tr>
                </thead>
                <tbody>
                  {SEO_PROFESSIONS.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-3 font-medium">
                        <Link to={`/blog/ceni-${p.slug}-2026`} className="text-orange-600 hover:underline">{p.name}</Link>
                      </td>
                      <td className="p-3 text-center">{p.unit}</td>
                      <td className="p-3 text-center">{(p.basePrice.labor * region.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center font-semibold text-orange-600">{(p.basePrice.full * region.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center text-slate-600">{(p.basePrice.full * region.multiplier * 1.9558).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!profession && !region && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 text-left">Област</th>
                    <th className="p-3 text-center">Коефициент</th>
                    <th className="p-3 text-center">Боядисване EUR/м²</th>
                    <th className="p-3 text-center">Плочки EUR/м²</th>
                    <th className="p-3 text-center">Ел. инсталация EUR/точка</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.sort((a,b) => b[1].multiplier - a[1].multiplier).map(([key, r], i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-3 font-medium">
                        <Link to={`/region/${r.slug}`} className="text-orange-600 hover:underline">{r.name}</Link>
                      </td>
                      <td className="p-3 text-center">x{r.multiplier.toFixed(2)}</td>
                      <td className="p-3 text-center">{(6 * r.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center">{(22 * r.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center">{(14 * r.multiplier).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* How calculator works */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Как работи калкулаторът</h2>
          <div className="space-y-3">
            {[
              'Изберете услугата, от която се нуждаете (28 категории)',
              'Посочете количеството (кв.м., брой точки, линейни метри)',
              'Изберете вашата област за точни регионални цени',
              'Изберете качество (Икономичен, Стандартен, Премиум)',
              'Изберете дали включва материали или само труд',
              'Получете моментална калкулация в EUR и BGN',
              'Изтеглете PDF оферта за сравнение с реални оферти'
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="bg-orange-100 text-orange-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</span>
                <p className="text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Често задавани въпроси</h2>
          <div className="space-y-4">
            {[
              { q: profession ? `Колко струва ${profession.name.toLowerCase()} в България?` : region ? `Колко струва ремонт в ${region.name}?` : 'Колко струва ремонт в България 2026?',
                a: profession ? `Средната цена за ${profession.name.toLowerCase()} е ${profession.basePrice.full} EUR/${profession.unit} (труд + материали). Цените варират от ${(profession.basePrice.full * 0.82).toFixed(2)} EUR в по-малки градове до ${(profession.basePrice.full * 1.20).toFixed(2)} EUR в София.` : 
                region ? `В ${region.name} строителните цени са с коефициент x${region.multiplier.toFixed(2)} спрямо средното за страната. Боядисването е ${(6 * region.multiplier).toFixed(2)} EUR/м², плочките - ${(22 * region.multiplier).toFixed(2)} EUR/м².` :
                'Цените варират по области - от x0.82 (Видин) до x1.20 (София). Средно за апартамент 60 м² пълен ремонт: 8,000-15,000 EUR.'
              },
              { q: 'Как да проверя дали цената е честна?', a: 'Използвайте нашия безплатен калкулатор за ориентировъчна оферта. Сравнете с реални оферти от минимум 3 фирми чрез TemaDom.' },
              { q: 'Включени ли са материалите в цените?', a: 'Калкулаторът дава и двата варианта - "Само труд" и "Труд + материали". Изберете опцията, която ви интересува.' },
              { q: 'Актуални ли са цените?', a: 'Да, базата данни е обновена за 2025-2026 г. на база реални пазарни проучвания.' }
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6 text-center">
            <Calculator className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Изчислете вашата оферта безплатно</h3>
            <p className="text-slate-600 mb-4">28 професии, 28 области, актуални цени 2026</p>
            <Link to="/calculator">
              <Button className="bg-orange-600 hover:bg-orange-700" data-testid="article-calc-btn">
                <Calculator className="mr-2 h-4 w-4" /> Към калкулатора
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Internal links */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Свързани статии</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {BLOG_ARTICLES.filter(a => a.slug !== slug).slice(0, 6).map(a => (
              <Link key={a.slug} to={`/blog/${a.slug}`} className="text-sm text-orange-600 hover:underline flex items-center gap-1">
                <ArrowLeft className="h-3 w-3 rotate-180" /> {a.title.substring(0, 60)}...
              </Link>
            ))}
          </div>
        </section>

        {/* Schema.org structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.h1,
          "description": article.description,
          "datePublished": "2026-02-01",
          "dateModified": "2026-02-27",
          "author": { "@type": "Organization", "name": "TemaDom" },
          "publisher": { "@type": "Organization", "name": "TemaDom", "url": "https://temadom.bg" }
        })}} />
      </article>
    </div>
  );
};

export default BlogArticle;
