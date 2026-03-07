import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calculator, MapPin, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BLOG_ARTICLES, REGIONS, SEO_PROFESSIONS } from '@/data/seoData';
import { SEO_BLOG_ARTICLES } from '@/data/blogArticles';

const BlogArticle = () => {
  const { slug } = useParams();
  
  // Check new detailed articles first
  const detailedArticle = SEO_BLOG_ARTICLES.find(a => a.slug === slug);
  const seoArticle = BLOG_ARTICLES.find(a => a.slug === slug);
  const article = detailedArticle || seoArticle;

  useEffect(() => {
    if (detailedArticle) {
      document.title = `${detailedArticle.metaTitle} | TemaDom`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', detailedArticle.metaDescription);
    } else if (seoArticle) {
      document.title = `${seoArticle.title} | TemaDom`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', seoArticle.description);
    }
    window.scrollTo(0, 0);
  }, [article]);

  if (!article) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Статията не е намерена</h1>
        <Link to="/blog"><Button>Към блога</Button></Link>
      </div>
    </div>
  );

  // Render detailed article with markdown-like content
  if (detailedArticle) {
    return (
      <div className="min-h-screen" style={{background: "var(--theme-bg-surface)"}} data-testid="blog-article">
        <article className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/blog" className="text-[#d4a43a] hover:text-[#d4a43a] text-sm flex items-center gap-1 mb-6">
            <ArrowLeft className="h-4 w-4" /> Към блога
          </Link>

          <header className="mb-8">
            <Badge className="bg-amber-100 text-amber-800 mb-3">{detailedArticle.category}</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-4">{detailedArticle.title}</h1>
            <p className="text-lg theme-text-muted">{detailedArticle.metaDescription}</p>
            <div className="flex items-center gap-4 mt-4 text-sm theme-text-subtle">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {detailedArticle.readTime}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> България</span>
            </div>
          </header>

          <Separator className="mb-8" />

          {/* Render content as formatted HTML */}
          <div className="prose prose-slate max-w-none prose-headings:text-[var(--theme-text)] prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-[var(--theme-text-muted)] prose-p:leading-relaxed prose-strong:text-[var(--theme-text)] prose-table:border-collapse prose-td:border prose-td:border-[var(--theme-border)] prose-td:p-3 prose-th:border prose-th:border-[var(--theme-border)] prose-th:p-3 prose-li:text-[var(--theme-text-muted)] prose-a:text-[#d4a43a]">
            {detailedArticle.content.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              
              if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold theme-text mt-8 mb-4">{trimmed.slice(3)}</h2>;
              if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold theme-text mt-6 mb-3">{trimmed.slice(4)}</h3>;
              
              if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                // Table row
                const cells = trimmed.split('|').filter(c => c.trim());
                if (cells.every(c => c.trim().match(/^-+$/))) return null; // separator row
                const isHeader = i > 0 && detailedArticle.content.split('\n')[i+1]?.trim().startsWith('|---');
                if (isHeader) {
                  return (
                    <div key={i} className="overflow-x-auto my-4">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="theme-bg-surface theme-text">
                            {cells.map((cell, j) => <th key={j} className="p-3 text-left font-medium">{cell.trim()}</th>)}
                          </tr>
                        </thead>
                      </table>
                    </div>
                  );
                }
                return null; // Table rows handled in a batch below
              }
              
              if (trimmed.startsWith('- **') || trimmed.startsWith('1. **') || trimmed.match(/^\d+\.\s/)) {
                const text = trimmed.replace(/^\d+\.\s/, '').replace(/^-\s/, '');
                return (
                  <div key={i} className="flex items-start gap-2 my-1.5">
                    <span className="text-orange-500 mt-1 flex-shrink-0">&#8226;</span>
                    <p className="theme-text-muted" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                );
              }
              
              return <p key={i} className="theme-text-muted leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#d4a43a] hover:underline">$1</a>') }} />;
            })}
          </div>

          {/* CTA */}
          <Card className="bg-[#d4a43a]/5 border-[#d4a43a]/20 mt-10">
            <CardContent className="p-6 text-center">
              <Calculator className="h-8 w-8 text-[#d4a43a] mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Изчислете вашата оферта безплатно</h3>
              <p className="theme-text-muted mb-4">28 професии, 28 области, актуални цени 2026</p>
              <Link to="/calculator">
                <Button className="bg-[#d4a43a] hover:bg-[#b8922e]" data-testid="article-calc-btn">
                  <Calculator className="mr-2 h-4 w-4" /> Към калкулатора
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Related articles */}
          <section className="mt-10">
            <h2 className="text-xl font-bold theme-text mb-4">Свързани статии</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {SEO_BLOG_ARTICLES.filter(a => a.slug !== slug).slice(0, 6).map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="text-sm text-[#d4a43a] hover:underline flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3 rotate-180" /> {a.title.substring(0, 60)}...
                </Link>
              ))}
            </div>
          </section>

          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": detailedArticle.title,
            "description": detailedArticle.metaDescription,
            "datePublished": detailedArticle.date,
            "dateModified": "2026-02-27",
            "author": { "@type": "Organization", "name": "TemaDom" },
            "publisher": { "@type": "Organization", "name": "TemaDom", "url": "https://temadom.com" },
            "keywords": detailedArticle.keywords
          })}} />
        </article>
      </div>
    );
  }

  const regions = Object.entries(REGIONS);
  const profession = article.professionId ? SEO_PROFESSIONS.find(p => p.id === article.professionId) : null;
  const region = article.regionKey ? REGIONS[article.regionKey] : null;

  return (
    <div className="min-h-screen" style={{background: "var(--theme-bg-surface)"}} data-testid="blog-article">
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/blog" className="text-[#d4a43a] hover:text-[#d4a43a] text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Към блога
        </Link>

        <header className="mb-8">
          <Badge className="bg-[#d4a43a]/10 text-[#d4a43a] mb-3">{article.type === 'profession' ? 'Професия' : article.type === 'region' ? 'Регион' : 'Строителство'}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-4">{article.h1}</h1>
          <p className="text-lg theme-text-muted">{article.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm theme-text-subtle">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Февруари 2026</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> България</span>
          </div>
        </header>

        <Separator className="mb-8" />

        {/* Price comparison table */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold theme-text mb-4">
            {profession ? `Цени ${profession.name.toLowerCase()} по области` : region ? `Строителни цени в ${region.name}` : 'Цени по области 2026'}
          </h2>

          {profession && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="theme-bg-surface theme-text">
                    <th className="p-3 text-left">Област</th>
                    <th className="p-3 text-center">Само труд (EUR/{profession.unit})</th>
                    <th className="p-3 text-center">Труд + материали (EUR/{profession.unit})</th>
                    <th className="p-3 text-center">Труд + материали (EUR/{profession.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.sort((a,b) => b[1].multiplier - a[1].multiplier).map(([key, r], i) => (
                    <tr key={key} className={i % 2 === 0 ? '' : ''}>
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3 text-center">{(profession.basePrice.labor * r.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center font-semibold text-[#d4a43a]">{(profession.basePrice.full * r.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center theme-text-muted">{(profession.basePrice.full * r.multiplier * 1.9558).toFixed(2)}</td>
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
                  <tr className="theme-bg-surface theme-text">
                    <th className="p-3 text-left">Услуга</th>
                    <th className="p-3 text-center">Единица</th>
                    <th className="p-3 text-center">Само труд (EUR)</th>
                    <th className="p-3 text-center">Труд + материали (EUR)</th>
                    <th className="p-3 text-center">Труд + мат. (EUR)</th>
                  </tr>
                </thead>
                <tbody>
                  {SEO_PROFESSIONS.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? '' : ''}>
                      <td className="p-3 font-medium">
                        <Link to={`/blog/ceni-${p.slug}-2026`} className="text-[#d4a43a] hover:underline">{p.name}</Link>
                      </td>
                      <td className="p-3 text-center">{p.unit}</td>
                      <td className="p-3 text-center">{(p.basePrice.labor * region.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center font-semibold text-[#d4a43a]">{(p.basePrice.full * region.multiplier).toFixed(2)}</td>
                      <td className="p-3 text-center theme-text-muted">{(p.basePrice.full * region.multiplier * 1.9558).toFixed(2)}</td>
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
                  <tr className="theme-bg-surface theme-text">
                    <th className="p-3 text-left">Област</th>
                    <th className="p-3 text-center">Коефициент</th>
                    <th className="p-3 text-center">Боядисване EUR/м²</th>
                    <th className="p-3 text-center">Плочки EUR/м²</th>
                    <th className="p-3 text-center">Ел. инсталация EUR/точка</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.sort((a,b) => b[1].multiplier - a[1].multiplier).map(([key, r], i) => (
                    <tr key={key} className={i % 2 === 0 ? '' : ''}>
                      <td className="p-3 font-medium">
                        <Link to={`/region/${r.slug}`} className="text-[#d4a43a] hover:underline">{r.name}</Link>
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
          <h2 className="text-2xl font-bold theme-text mb-4">Как работи калкулаторът</h2>
          <div className="space-y-3">
            {[
              'Изберете услугата, от която се нуждаете (28 категории)',
              'Посочете количеството (кв.м., брой точки, линейни метри)',
              'Изберете вашата област за точни регионални цени',
              'Изберете качество (Икономичен, Стандартен, Премиум)',
              'Изберете дали включва материали или само труд',
              'Получете моментална калкулация в EUR',
              'Изтеглете PDF оферта за сравнение с реални оферти'
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="bg-[#d4a43a]/10 text-[#d4a43a] w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</span>
                <p className="theme-text-muted">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold theme-text mb-4">Често задавани въпроси</h2>
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
                  <h3 className="font-semibold theme-text mb-2">{faq.q}</h3>
                  <p className="theme-text-muted text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="bg-[#d4a43a]/5 border-[#d4a43a]/20">
          <CardContent className="p-6 text-center">
            <Calculator className="h-8 w-8 text-[#d4a43a] mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Изчислете вашата оферта безплатно</h3>
            <p className="theme-text-muted mb-4">28 професии, 28 области, актуални цени 2026</p>
            <Link to="/calculator">
              <Button className="bg-[#d4a43a] hover:bg-[#b8922e]" data-testid="article-calc-btn">
                <Calculator className="mr-2 h-4 w-4" /> Към калкулатора
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Internal links */}
        <section className="mt-10">
          <h2 className="text-xl font-bold theme-text mb-4">Свързани статии</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {BLOG_ARTICLES.filter(a => a.slug !== slug).slice(0, 6).map(a => (
              <Link key={a.slug} to={`/blog/${a.slug}`} className="text-sm text-[#d4a43a] hover:underline flex items-center gap-1">
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
          "publisher": { "@type": "Organization", "name": "TemaDom", "url": "https://temadom.com" }
        })}} />
      </article>
    </div>
  );
};

export default BlogArticle;
