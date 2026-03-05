import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Eye, Heart, MessageSquare, ChevronRight, ChevronLeft, Sparkles, Image, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
const STYLE_COLORS = {
  modern: '#FF8C42', scandinavian: '#4DA6FF', loft: '#DC3545', classic: '#8C56FF', minimalist: '#28A745'
};

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
            Разгледайте проекти преди и след ремонт, генерирани с AI Дизайнера. Оценявайте, коментирайте и харесвайте.
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-72 animate-pulse bg-[#253545] border-[#3A4A5C]" />
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Link
                  key={project.id}
                  to={`/gallery/${project.id}`}
                  className="group"
                  data-testid={`gallery-project-${project.id}`}
                >
                  <Card className="overflow-hidden bg-[#253545] border-[#3A4A5C] hover:border-[#FF8C42]/50 transition-all duration-300 h-full">
                    {/* Before/After indicator bar */}
                    <div className="h-1.5 bg-gradient-to-r from-[#DC3545] via-[#FF8C42] to-[#28A745]" />

                    <CardContent className="p-4">
                      {/* Top badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: (STYLE_COLORS[project.style] || '#FF8C42') + '20', color: STYLE_COLORS[project.style] || '#FF8C42' }}>
                          {STYLE_LABELS[project.style] || project.style}
                        </Badge>
                        <Badge className="bg-[#4DA6FF]/15 text-[#4DA6FF] text-[10px] px-2 py-0.5">
                          {ROOM_LABELS[project.room_type] || project.room_type}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-[#FF8C42] transition-colors line-clamp-2" data-testid="project-title">
                        {project.title}
                      </h3>

                      {/* Description */}
                      {project.description && (
                        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{project.description}</p>
                      )}

                      {/* Dimensions */}
                      {project.dimensions && (
                        <p className="text-slate-500 text-[10px] mb-3">
                          {project.dimensions.width}x{project.dimensions.length}x{project.dimensions.height} м
                        </p>
                      )}

                      {/* Stats bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#3A4A5C]">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Heart className="h-3 w-3" /> {project.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MessageSquare className="h-3 w-3" /> {project.comments?.length || 0}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Eye className="h-3 w-3" /> {project.views || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {project.avg_rating > 0 && (
                            <>
                              <Star className="h-3 w-3 fill-[#FF8C42] text-[#FF8C42]" />
                              <span className="text-xs text-white font-medium">{project.avg_rating}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Author */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">от {project.user_name}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(project.created_at).toLocaleDateString('bg-BG')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
