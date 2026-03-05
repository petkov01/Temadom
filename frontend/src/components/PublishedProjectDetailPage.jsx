import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Heart, MessageSquare, Eye, Download, ChevronLeft, FileText, Image as ImageIcon, Send, User, Clock, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/App';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROOM_LABELS = {
  bathroom: 'Баня', kitchen: 'Кухня', living_room: 'Хол', bedroom: 'Спалня',
  kids_room: 'Детска стая', office: 'Офис', corridor: 'Коридор', balcony: 'Балкон', other: 'Друго'
};
const STYLE_LABELS = {
  modern: 'Модерен', scandinavian: 'Скандинавски', loft: 'Лофт', classic: 'Класически', minimalist: 'Минималистичен'
};
const MATERIAL_LABELS = { economy: 'Икономичен', standard: 'Стандартен', premium: 'Премиум' };

export const PublishedProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeImg, setActiveImg] = useState('before');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`${API}/published-projects/${id}`);
        setProject(res.data);
        if (user && res.data.ratings) {
          const myRating = res.data.ratings.find(r => r.user_id === user.id);
          if (myRating) setUserRating(myRating.rating);
        }
      } catch {
        toast.error('Проектът не е намерен');
        navigate('/gallery');
      }
      setLoading(false);
    };
    fetchProject();
  }, [id, navigate, user]);

  const isLiked = user && project?.likes?.includes(user.id);

  const handleLike = async () => {
    if (!user) { toast.error('Влезте в профила си, за да харесате'); return; }
    try {
      const res = await axios.post(`${API}/published-projects/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(prev => ({
        ...prev,
        likes: res.data.liked ? [...(prev.likes || []), user.id] : (prev.likes || []).filter(uid => uid !== user.id),
        likes_count: res.data.likes_count
      }));
    } catch {
      toast.error('Грешка');
    }
  };

  const handleComment = async () => {
    if (!user) { toast.error('Влезте в профила си, за да коментирате'); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/published-projects/${id}/comment`, { text: commentText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data.comment]
      }));
      setCommentText('');
      toast.success('Коментарът е добавен');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
    setSubmitting(false);
  };

  const handleRate = async (rating) => {
    if (!user) { toast.error('Влезте в профила си, за да оцените'); return; }
    try {
      const res = await axios.post(`${API}/published-projects/${id}/rate`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(rating);
      setProject(prev => ({ ...prev, avg_rating: res.data.avg_rating, rating_count: res.data.rating_count }));
      toast.success('Оценката е записана');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center">
        <div className="w-full max-w-[700px] h-96 animate-pulse bg-[#253545] rounded-xl mx-4" />
      </div>
    );
  }

  if (!project) return null;

  const beforeImages = project.before_images || [];
  const afterImages = project.after_images || [];
  const dims = project.dimensions || {};
  const area = dims.width && dims.length ? (parseFloat(dims.width) * parseFloat(dims.length)).toFixed(0) : null;
  const matList = project.materials?.materials || [];

  return (
    <div className="min-h-screen bg-[#1E2A38] py-6" data-testid="published-project-detail">
      <div className="max-w-[700px] mx-auto px-4">

        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-3 text-slate-400 hover:text-white p-0" onClick={() => navigate('/gallery')} data-testid="back-to-gallery">
          <ChevronLeft className="h-4 w-4 mr-1" /> Назад към галерията
        </Button>

        {/* ─── Main Card (template-style) ─── */}
        <div className="rounded-xl overflow-hidden bg-white shadow-2xl">

          {/* ── Header: Logo + Company ── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1E2A38]">
            <img src="/logo/temadom-logo-dark.png" alt="TemaDom" className="h-10" />
            <div className="min-w-0">
              <p className="text-white font-bold leading-tight">Temadom.com</p>
              <p className="text-slate-400 text-xs truncate">
                <Building2 className="inline h-3 w-3 mr-1 -mt-px" />
                {project.user_name} &middot; {new Date(project.created_at).toLocaleDateString('bg-BG')}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400 text-xs">{project.views}</span>
            </div>
          </div>

          {/* ── Image Section with Tabs ── */}
          <div className="relative">
            {/* Image tab buttons */}
            <div className="flex bg-slate-100 border-b border-slate-200">
              <button
                onClick={() => setActiveImg('before')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeImg === 'before' ? 'bg-[#DC3545] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                data-testid="tab-before"
              >
                ПРЕДИ ({beforeImages.length})
              </button>
              <button
                onClick={() => setActiveImg('after')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeImg === 'after' ? 'bg-[#28A745] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                data-testid="tab-after"
              >
                СЛЕД ({afterImages.length})
              </button>
              <button
                onClick={() => setActiveImg('compare')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeImg === 'compare' ? 'bg-[#FF8C42] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                data-testid="tab-compare"
              >
                СРАВНЕНИЕ
              </button>
            </div>

            {/* Images */}
            <div className="bg-slate-50 min-h-[200px]">
              {activeImg === 'before' && (
                <div className="p-3 space-y-3">
                  {beforeImages.length > 0 ? beforeImages.map((img, i) => (
                    <img key={i} src={img} alt={`Преди ${i+1}`} className="w-full rounded-lg" data-testid={`before-img-${i}`} />
                  )) : (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Няма оригинални снимки</div>
                  )}
                </div>
              )}
              {activeImg === 'after' && (
                <div className="p-3 space-y-3">
                  {afterImages.length > 0 ? afterImages.map((img, i) => {
                    const src = typeof img === 'object' ? `data:image/png;base64,${img.image_base64}` : img;
                    const label = typeof img === 'object' ? img.angle_label : `Вариант ${i+1}`;
                    return (
                      <div key={i}>
                        <p className="text-xs text-[#28A745] font-medium mb-1">{label}</p>
                        <img src={src} alt={label} className="w-full rounded-lg" data-testid={`after-img-${i}`} />
                      </div>
                    );
                  }) : (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Няма AI дизайн снимки</div>
                  )}
                </div>
              )}
              {activeImg === 'compare' && (
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#DC3545] font-semibold mb-1">ПРЕДИ</p>
                    {beforeImages[0] ? <img src={beforeImages[0]} alt="Преди" className="w-full rounded-lg border-2 border-[#DC3545]/30" /> : <div className="h-32 bg-slate-200 rounded-lg" />}
                  </div>
                  <div>
                    <p className="text-xs text-[#28A745] font-semibold mb-1">СЛЕД</p>
                    {afterImages[0] ? (
                      <img
                        src={typeof afterImages[0] === 'object' ? `data:image/png;base64,${afterImages[0].image_base64}` : afterImages[0]}
                        alt="След" className="w-full rounded-lg border-2 border-[#28A745]/30"
                      />
                    ) : <div className="h-32 bg-slate-200 rounded-lg" />}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Project Info ── */}
          <div className="px-4 py-3 border-b border-slate-100">
            <h1 className="text-[#1E2A38] font-bold text-lg mb-1" data-testid="project-title">{project.title}</h1>
            {project.description && <p className="text-slate-500 text-sm mb-2">{project.description}</p>}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-[#2B2B2B]">
              <div><span className="font-semibold">Стил:</span> {STYLE_LABELS[project.style] || project.style}</div>
              <div><span className="font-semibold">Помещение:</span> {ROOM_LABELS[project.room_type] || project.room_type}</div>
              <div><span className="font-semibold">Площ:</span> {area ? `${area} м²` : `${dims.width || '?'}x${dims.length || '?'} м`}</div>
              <div><span className="font-semibold">Клас:</span> {MATERIAL_LABELS[project.material_class] || project.material_class}</div>
              <div>
                <span className="font-semibold">Бюджет:</span>{' '}
                <span className="text-[#28A745] font-bold">{project.materials?.grand_total_bgn || project.materials?.total_estimate_bgn || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Рейтинг:</span>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(project.avg_rating || 0) ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-slate-300'}`} />
                ))}
                <span className="text-xs text-slate-500 ml-0.5">({project.avg_rating || 0})</span>
              </div>
            </div>
          </div>

          {/* ── Materials Table ── */}
          {matList.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-[#1E2A38] text-sm mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#FF8C42]" /> Количествена сметка
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" data-testid="materials-table">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="text-left py-1.5 px-2 font-medium">Материал</th>
                      <th className="text-left py-1.5 px-2 font-medium">Количество</th>
                      <th className="text-right py-1.5 px-2 font-medium">Цена</th>
                      <th className="text-right py-1.5 px-2 font-medium">Линк</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matList.map((m, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-1.5 px-2 text-[#2B2B2B]">{m.name}</td>
                        <td className="py-1.5 px-2 text-slate-600">{m.quantity} {m.unit}</td>
                        <td className="py-1.5 px-2 text-right">
                          <span className="text-[#1E2A38] font-medium">{m.total_price_bgn || m.total_price || '-'}</span>
                          {m.total_price_eur && <span className="text-slate-400 block text-[10px]">{m.total_price_eur}</span>}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {m.store ? (
                            <span className="text-[#FF8C42] font-medium">{m.store}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Totals */}
              {(project.materials?.grand_total_bgn || project.materials?.total_estimate_bgn) && (
                <div className="flex justify-end mt-2 text-sm">
                  <div className="bg-[#1E2A38] rounded-lg px-4 py-2 text-white inline-flex items-center gap-3">
                    <span className="text-slate-400 text-xs">ОБЩА:</span>
                    <span className="font-bold text-[#FF8C42]">{project.materials.grand_total_bgn || project.materials.total_estimate_bgn}</span>
                    {(project.materials.grand_total_eur || project.materials.total_estimate_eur) && (
                      <span className="text-slate-400 text-xs">/ {project.materials.grand_total_eur || project.materials.total_estimate_eur}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CTA Buttons ── */}
          <div className="px-4 py-3 flex gap-3 border-b border-slate-100">
            <Link to={`/ai-designer?room=${project.room_type}&style=${project.style}`} className="flex-1">
              <button className="w-full py-2.5 bg-[#28A745] hover:bg-[#239a3b] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5" data-testid="generate-similar-btn">
                <Sparkles className="h-4 w-4" /> Генерирай подобен проект
              </button>
            </Link>
            <button
              className="flex-1 py-2.5 bg-[#FF8C42] hover:bg-[#e67a30] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              data-testid="download-survey-pdf"
              onClick={() => window.open(`${API}/published-projects/${id}/pdf/survey`, '_blank')}
            >
              <Download className="h-4 w-4" /> Свали PDF
            </button>
          </div>

          {/* ── Likes, Rating, Stats Footer ── */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-[#DC3545] font-semibold' : 'text-slate-500 hover:text-[#DC3545]'}`}
              data-testid="like-btn"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-[#DC3545]' : ''}`} /> {project.likes_count || 0} Харесвания
            </button>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <MessageSquare className="h-4 w-4 text-[#4DA6FF]" /> {project.comments?.length || 0} Коментара
            </span>
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => handleRate(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                  data-testid={`rate-star-${s}`}
                >
                  <Star className={`h-5 w-5 transition-colors ${
                    s <= (hoverRating || userRating) ? 'fill-[#FF8C42] text-[#FF8C42]' :
                    s <= Math.round(project.avg_rating || 0) ? 'fill-[#FF8C42]/50 text-[#FF8C42]/50' : 'text-slate-300'
                  }`} />
                </button>
              ))}
              <span className="text-sm text-[#2B2B2B] font-medium ml-1">{project.avg_rating || 0} / 5</span>
            </div>
          </div>

          {/* ── Design PDF separate row ── */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500 flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Допълнителни документи:</span>
            <button
              className="text-xs text-[#4DA6FF] hover:underline font-medium flex items-center gap-1"
              data-testid="download-design-pdf"
              onClick={() => window.open(`${API}/published-projects/${id}/pdf/design`, '_blank')}
            >
              <Download className="h-3 w-3" /> Дизайн PDF (снимки преди/след)
            </button>
          </div>

          {/* ── Comments Section ── */}
          <div className="px-4 py-4">
            <h3 className="font-bold text-[#1E2A38] text-sm mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-[#4DA6FF]" />
              Коментари ({project.comments?.length || 0})
            </h3>

            {/* Add comment */}
            <div className="mb-4">
              <Textarea
                placeholder={user ? "Напишете коментар..." : "Влезте в профила си, за да коментирате"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!user}
                className="border-slate-200 text-[#2B2B2B] mb-2 resize-none text-sm bg-white"
                rows={3}
                data-testid="comment-input"
              />
              <Button
                size="sm"
                className="bg-[#4DA6FF] hover:bg-[#3d96ef] text-white"
                onClick={handleComment}
                disabled={!user || !commentText.trim() || submitting}
                data-testid="submit-comment"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Публикувай
              </Button>
            </div>

            {/* Comments list */}
            {project.comments?.length > 0 ? (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                {[...project.comments].reverse().map(comment => (
                  <div key={comment.id} className="flex gap-2.5" data-testid={`comment-${comment.id}`}>
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="bg-[#1E2A38] text-white text-[10px]">
                        {comment.user_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#1E2A38] text-xs font-semibold">{comment.user_name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#1E2A38]/10 rounded text-slate-500">
                          {comment.user_type === 'company' ? 'Фирма' : comment.user_type === 'master' ? 'Майстор' : 'Клиент'}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {new Date(comment.created_at).toLocaleDateString('bg-BG')}
                        </span>
                      </div>
                      <p className="text-[#2B2B2B] text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center text-sm py-6 border-t border-slate-100 mt-2">Все още няма коментари. Бъдете първите!</p>
            )}
          </div>
        </div>

        {/* CTA below card */}
        <div className="text-center mt-6">
          <Link to="/ai-designer">
            <Button className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white">
              <Sparkles className="mr-2 h-4 w-4" /> Създайте свой AI дизайн
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublishedProjectDetailPage;
