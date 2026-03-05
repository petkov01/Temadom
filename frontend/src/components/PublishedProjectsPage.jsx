import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, MessageSquare, ChevronRight, ChevronLeft, Sparkles, Image, SlidersHorizontal, Download, ExternalLink, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageInstructions } from './PageInstructions';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROOM_LABELS = {
  bathroom: 'Баня', kitchen: 'Кухня', living_room: 'Хол', bedroom: 'Спалня',
  kids_room: 'Детска стая', office: 'Офис', corridor: 'Коридор', balcony: 'Балкон', other: 'Друго'
};
const STYLE_LABELS = {
  modern: 'Модерен', scandinavian: 'Скандинавски', loft: 'Лофт', classic: 'Класически', minimalist: 'Минималистичен'
};

/* ─── Single Project Card (matches user HTML template) ─── */
const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const dims = project.dimensions || {};
  const area = dims.width && dims.length ? (parseFloat(dims.width) * parseFloat(dims.length)).toFixed(0) : null;

  return (
    <div
      className="rounded-xl overflow-hidden bg-white max-w-[400px] w-full cursor-pointer hover:shadow-xl transition-shadow duration-300"
      data-testid={`gallery-project-${project.id}`}
      onClick={() => navigate(`/gallery/${project.id}`)}
    >
      {/* ── Header: Logo + Company ── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#1E2A38]">
        <img src="/logo/temadom-logo-dark.png" alt="TemaDom" className="h-8" />
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">Temadom.com</p>
          <p className="text-slate-400 text-[10px] leading-tight truncate">
            <Building2 className="inline h-2.5 w-2.5 mr-0.5 -mt-px" />
            {project.user_name}
          </p>
        </div>
      </div>

      {/* ── Image Section: Before / Ъгъл / След ── */}
      <div className="relative bg-slate-100">
        {project.first_before_image ? (
          <img src={project.first_before_image} alt="Преди" className="w-full aspect-[4/3] object-cover" data-testid="card-before-img" />
        ) : (
          <div className="w-full aspect-[4/3] bg-slate-200 flex items-center justify-center">
            <Image className="h-10 w-10 text-slate-400" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-[#FF8C42] text-white text-[10px] font-semibold px-2 py-1 rounded">
          Преди / Ъгъл / След
        </span>
        <div className="absolute bottom-2 right-2 flex gap-1">
          <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{project.before_count || 0} сн.</span>
          <span className="bg-[#28A745]/90 text-white text-[10px] px-1.5 py-0.5 rounded">{project.after_count || 0} AI</span>
        </div>
      </div>

      {/* ── Project Info ── */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <h3 className="text-[#1E2A38] font-bold text-sm mb-1.5 line-clamp-1" data-testid="project-title">{project.title}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#2B2B2B]">
          <div><span className="font-semibold">Стил:</span> {STYLE_LABELS[project.style] || project.style}</div>
          <div><span className="font-semibold">Площ:</span> {area ? `${area} м²` : '-'}</div>
          <div><span className="font-semibold">Бюджет:</span> {project.budget || '-'}</div>
          <div className="flex items-center gap-0.5">
            <span className="font-semibold">Рейтинг:</span>
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`h-3 w-3 ${s <= Math.round(project.avg_rating || 0) ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-slate-300'}`} />
            ))}
            <span className="ml-0.5 text-[10px] text-slate-500">({project.avg_rating || 0})</span>
          </div>
        </div>
      </div>

      {/* ── Materials Preview Table ── */}
      {project.materials_preview?.length > 0 && (
        <div className="px-3 py-2">
          <table className="w-full text-[11px]" data-testid="card-materials-table">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-1 px-1.5 text-slate-500 font-medium">Материал</th>
                <th className="text-left py-1 px-1.5 text-slate-500 font-medium">Кол-во</th>
                <th className="text-right py-1 px-1.5 text-slate-500 font-medium">Цена</th>
                <th className="text-right py-1 px-1.5 text-slate-500 font-medium">Линк</th>
              </tr>
            </thead>
            <tbody>
              {project.materials_preview.map((m, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-1 px-1.5 text-[#2B2B2B] truncate max-w-[100px]">{m.name}</td>
                  <td className="py-1 px-1.5 text-slate-600">{m.quantity} {m.unit}</td>
                  <td className="py-1 px-1.5 text-right text-[#1E2A38] font-medium">{m.total_price_bgn || m.total_price || '-'}</td>
                  <td className="py-1 px-1.5 text-right">
                    {m.store ? (
                      <span className="text-[#FF8C42] hover:underline">{m.store}</span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {project.materials_count > 3 && (
            <p className="text-[10px] text-slate-400 text-right mt-0.5">+{project.materials_count - 3} материала</p>
          )}
        </div>
      )}

      {/* ── CTA Buttons ── */}
      <div className="px-3 py-2 flex gap-2">
        <Link
          to={`/ai-designer?room=${project.room_type}&style=${project.style}`}
          className="flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="w-full py-2 bg-[#28A745] hover:bg-[#239a3b] text-white text-xs font-semibold rounded-md transition-colors" data-testid="card-generate-similar-btn">
            <Sparkles className="inline h-3 w-3 mr-1 -mt-px" /> Генерирай подобен
          </button>
        </Link>
        <button
          className="flex-1 py-2 bg-[#FF8C42] hover:bg-[#e67a30] text-white text-xs font-semibold rounded-md transition-colors"
          data-testid="card-download-pdf-btn"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`${API}/published-projects/${project.id}/pdf/survey`, '_blank');
          }}
        >
          <Download className="inline h-3 w-3 mr-1 -mt-px" /> Свали PDF
        </button>
      </div>

      {/* ── Stats Footer ── */}
      <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#2B2B2B]">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-[#DC3545]" /> {project.likes_count || 0} Харесвания
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-[#4DA6FF]" /> {project.comments?.length || 0} Коментара
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-[#FF8C42] text-[#FF8C42]" /> {project.avg_rating || 0} / 5
        </span>
      </div>
    </div>
  );
};

/* ─── Main Gallery Page ─── */
export const PublishedProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomType, setRoomType] = useState('all');
  const [style, setStyle] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roomType !== 'all') params.set('room_type', roomType);
      if (style !== 'all') params.set('style', style);
      params.set('sort_by', sortBy);
      params.set('page', page);
      const res = await axios.get(`${API}/published-projects?${params}`);
      setProjects(res.data.projects);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  }, [roomType, style, sortBy, page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="published-projects-page">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FF8C42]/15 border border-[#FF8C42]/30 rounded-full px-4 py-2 mb-4">
            <Image className="h-5 w-5 text-[#FF8C42]" />
            <span className="text-[#FF8C42] font-medium text-sm">ГАЛЕРИЯ ПРОЕКТИ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Реализирани проекти</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Преди и след ремонт — разгледайте, оценете и вземете идеи за вашия проект.
          </p>
        </div>

        <PageInstructions
          title="Галерия с AI проекти"
          description="Всички публикувани проекти от AI Дизайнера — преди и след ремонт"
          steps={[
            'Разгледайте галерията с публикувани проекти',
            'Филтрирайте по тип помещение или стил',
            'Кликнете на проект за детайлен преглед',
            'Оценете, коментирайте и харесайте проекти',
            'Изтеглете PDF с дизайн или количествена сметка'
          ]}
          benefits={[
            'Преди и след снимки за всеки проект',
            'Реални цени на материали от български магазини',
            'Два PDF-а: дизайн + количествена сметка'
          ]}
          videoUrl="https://temadom.com/videos/gallery"
        />

        {/* Filters */}
        <Card className="p-4 mb-8 bg-[#253545] border-[#3A4A5C]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={roomType} onValueChange={(v) => { setRoomType(v); setPage(1); }}>
              <SelectTrigger className="bg-[#1E2A38] border-[#3A4A5C] text-white" data-testid="filter-room-type">
                <SelectValue placeholder="Тип помещение" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички помещения</SelectItem>
                {Object.entries(ROOM_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={style} onValueChange={(v) => { setStyle(v); setPage(1); }}>
              <SelectTrigger className="bg-[#1E2A38] border-[#3A4A5C] text-white" data-testid="filter-style">
                <SelectValue placeholder="Стил" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички стилове</SelectItem>
                {Object.entries(STYLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="bg-[#1E2A38] border-[#3A4A5C] text-white" data-testid="filter-sort">
                <SelectValue placeholder="Сортиране" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Най-нови</SelectItem>
                <SelectItem value="popular">Най-харесвани</SelectItem>
                <SelectItem value="top_rated">Най-високо оценени</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-center text-sm text-slate-400">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {total} проекта
            </div>
          </div>
        </Card>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 w-full max-w-[400px] animate-pulse bg-[#253545] rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-16 text-center bg-[#253545] border-[#3A4A5C]">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-[#3A4A5C]" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Все още няма публикувани проекти</h3>
            <p className="text-slate-500 mb-6">Бъдете първите, които ще публикуват AI дизайн!</p>
            <Link to="/ai-designer">
              <Button className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white">
                <Sparkles className="mr-2 h-4 w-4" /> Създай AI дизайн
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  className="border-[#3A4A5C] text-slate-300"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Назад
                </Button>
                <span className="flex items-center px-4 text-slate-400 text-sm">
                  Стр. {page} от {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="border-[#3A4A5C] text-slate-300"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Напред <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublishedProjectsPage;
