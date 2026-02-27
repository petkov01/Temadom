import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_ARTICLES } from '@/data/seoData';
import { SEO_BLOG_ARTICLES } from '@/data/blogArticles';

const typeLabels = { overview: 'Обзор', category: 'Категория', profession: 'Професия', region: 'Регион', article: 'Статия' };
const typeColors = { overview: 'bg-blue-100 text-blue-800', category: 'bg-green-100 text-green-800', profession: 'bg-orange-100 text-orange-800', region: 'bg-purple-100 text-purple-800', article: 'bg-amber-100 text-amber-800' };

const catLabels = { 'ремонт': 'Ремонт', 'покриви': 'Покриви', 'изолация': 'Изолация', 'инсталации': 'Инсталации', 'груб строеж': 'Груб строеж', 'строителство': 'Строителство', 'съвети': 'Съвети', 'довършителни': 'Довършителни', 'подове': 'Подове' };

// Merge old SEO articles with new detailed articles
const allArticles = [
  ...SEO_BLOG_ARTICLES.map(a => ({
    slug: a.slug,
    title: a.title,
    description: a.metaDescription,
    type: 'article',
    category: a.category,
    date: a.date,
    readTime: a.readTime
  })),
  ...BLOG_ARTICLES
];

const BlogPage = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  const filtered = allArticles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
      (a.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50" data-testid="blog-page">
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <BookOpen className="h-10 w-10 text-orange-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isEn 
              ? <>{`Blog about construction & `}<span className="text-orange-400">renovations</span></>
              : <>Блог за строителство и <span className="text-orange-400">ремонти</span></>}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {isEn 
              ? 'Current prices, tips and guides for construction and renovations in Bulgaria 2026.'
              : 'Актуални цени, съвети и ръководства за строителство и ремонти в България 2026.'}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder={isEn ? 'Search article...' : 'Търси статия...'} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="blog-search" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(isEn 
              ? [['all','All'],['article','Articles'],['profession','Professions'],['region','Regions'],['overview','Overviews']]
              : [['all','Всички'],['article','Статии'],['profession','Професии'],['region','Региони'],['overview','Обзори']]
            ).map(([v,l]) => (
              <Button key={v} variant={filter===v?'default':'outline'} size="sm" className={filter===v?'bg-orange-600 hover:bg-orange-700':''} onClick={() => setFilter(v)}>{l}</Button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">{filtered.length} статии</p>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(article => (
            <Link key={article.slug} to={`/blog/${article.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer" data-testid={`blog-card-${article.slug}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={typeColors[article.type] || typeColors.article}>
                      {article.category ? catLabels[article.category] || article.category : typeLabels[article.type]}
                    </Badge>
                    {article.readTime && (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> 2026</span>
                  </div>
                  <h2 className="font-bold text-slate-900 mb-2 line-clamp-2">{article.title}</h2>
                  <p className="text-sm text-slate-600 line-clamp-2">{article.description}</p>
                  <div className="mt-3 flex items-center text-orange-600 text-sm font-medium">
                    Прочети повече <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
