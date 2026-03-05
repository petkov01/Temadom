import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Heart, MessageSquare, Eye, Download, ChevronLeft, FileText, Image, Send, User, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  const [activeTab, setActiveTab] = useState('before');

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

  const handleDownloadPdf = (type) => {
    window.open(`${API}/published-projects/${id}/pdf/${type}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E2A38] py-8">
        <div className="max-w-5xl mx-auto px-4">
          <Card className="h-96 animate-pulse bg-[#253545] border-[#3A4A5C]" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  const beforeImages = project.before_images || [];
  const afterImages = project.after_images || [];

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="published-project-detail">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Button variant="ghost" className="mb-4 text-slate-300 hover:text-white" onClick={() => navigate('/gallery')} data-testid="back-to-gallery">
          <ChevronLeft className="h-4 w-4 mr-1" /> Назад към галерията
        </Button>

        {/* Title section */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-[#FF8C42]/15 text-[#FF8C42]">{STYLE_LABELS[project.style] || project.style}</Badge>
            <Badge className="bg-[#4DA6FF]/15 text-[#4DA6FF]">{ROOM_LABELS[project.room_type] || project.room_type}</Badge>
            <Badge className="bg-[#28A745]/15 text-[#28A745]">{MATERIAL_LABELS[project.material_class] || project.material_class}</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="project-title">{project.title}</h1>
          {project.description && <p className="text-slate-400">{project.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {project.user_name}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(project.created_at).toLocaleDateString('bg-BG')}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {project.views}</span>
            {project.dimensions && (
              <span>{project.dimensions.width}x{project.dimensions.length}x{project.dimensions.height} м</span>
            )}
          </div>
        </div>

        {/* Stats & Actions Bar */}
        <Card className="mb-6 bg-[#253545] border-[#3A4A5C]">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Like */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${isLiked ? 'bg-[#DC3545]/15 text-[#DC3545]' : 'bg-[#1E2A38] text-slate-400 hover:text-[#DC3545]'}`}
                  data-testid="like-btn"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-[#DC3545]' : ''}`} />
                  <span className="text-sm font-medium">{project.likes_count || 0}</span>
                </button>

                {/* Rating */}
                <div className="flex items-center gap-1">
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
                        s <= project.avg_rating ? 'fill-[#FF8C42]/40 text-[#FF8C42]/40' : 'text-[#3A4A5C]'
                      }`} />
                    </button>
                  ))}
                  <span className="text-sm text-white font-medium ml-1">{project.avg_rating || 0}</span>
                  <span className="text-xs text-slate-500">({project.rating_count || 0})</span>
                </div>

                {/* Comments count */}
                <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <MessageSquare className="h-4 w-4" /> {project.comments?.length || 0}
                </span>
              </div>

              {/* PDF Downloads */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#FF8C42]/50 text-[#FF8C42] hover:bg-[#FF8C42]/10"
                  onClick={() => handleDownloadPdf('design')}
                  data-testid="download-design-pdf"
                >
                  <Image className="h-3.5 w-3.5 mr-1.5" /> Дизайн PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#4DA6FF]/50 text-[#4DA6FF] hover:bg-[#4DA6FF]/10"
                  onClick={() => handleDownloadPdf('survey')}
                  data-testid="download-survey-pdf"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Количествена сметка PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Before / After Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('before')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'before' ? 'bg-[#DC3545]/15 text-[#DC3545] border border-[#DC3545]/30' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
            data-testid="tab-before"
          >
            ПРЕДИ ({beforeImages.length})
          </button>
          <button
            onClick={() => setActiveTab('after')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'after' ? 'bg-[#28A745]/15 text-[#28A745] border border-[#28A745]/30' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
            data-testid="tab-after"
          >
            СЛЕД ({afterImages.length})
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'compare' ? 'bg-[#FF8C42]/15 text-[#FF8C42] border border-[#FF8C42]/30' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
            data-testid="tab-compare"
          >
            СРАВНЕНИЕ
          </button>
        </div>

        {/* Images Section */}
        <Card className="mb-6 bg-[#253545] border-[#3A4A5C] overflow-hidden">
          <CardContent className="p-4">
            {activeTab === 'before' && (
              <div className="space-y-4">
                <h3 className="text-[#DC3545] font-semibold text-sm uppercase tracking-wider">Преди (Оригинални снимки)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {beforeImages.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-[#3A4A5C]">
                      <img src={img} alt={`Преди ${i+1}`} className="w-full" data-testid={`before-img-${i}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'after' && (
              <div className="space-y-4">
                <h3 className="text-[#28A745] font-semibold text-sm uppercase tracking-wider">След (AI Дизайн)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {afterImages.map((img, i) => {
                    const imgSrc = typeof img === 'object' ? `data:image/png;base64,${img.image_base64}` : img;
                    const label = typeof img === 'object' ? img.angle_label : `Вариант ${i+1}`;
                    return (
                      <div key={i}>
                        <p className="text-slate-500 text-xs mb-1">{label}</p>
                        <div className="rounded-xl overflow-hidden border border-[#28A745]/30">
                          <img src={imgSrc} alt={label} className="w-full" data-testid={`after-img-${i}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'compare' && (
              <div className="space-y-4">
                <h3 className="text-[#FF8C42] font-semibold text-sm uppercase tracking-wider">Сравнение — Преди и След</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#DC3545] text-xs mb-2 font-medium uppercase">Преди</p>
                    {beforeImages[0] && (
                      <div className="rounded-xl overflow-hidden border border-[#DC3545]/30">
                        <img src={beforeImages[0]} alt="Преди" className="w-full" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#28A745] text-xs mb-2 font-medium uppercase">След</p>
                    {afterImages[0] && (
                      <div className="rounded-xl overflow-hidden border border-[#28A745]/30">
                        <img
                          src={typeof afterImages[0] === 'object' ? `data:image/png;base64,${afterImages[0].image_base64}` : afterImages[0]}
                          alt="След" className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materials Summary */}
        {project.materials?.materials?.length > 0 && (
          <Card className="mb-6 bg-[#253545] border-[#3A4A5C]">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#FF8C42]" />
                Количествена сметка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="materials-table">
                  <thead>
                    <tr className="border-b border-[#3A4A5C]">
                      <th className="text-left py-2 text-slate-400 font-medium">Материал</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Кол-во</th>
                      <th className="text-right py-2 text-slate-400 font-medium">Общо (лв / EUR)</th>
                      <th className="text-right py-2 text-slate-400 font-medium">Магазин</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.materials.materials.map((m, i) => (
                      <tr key={i} className="border-b border-[#3A4A5C]/50 hover:bg-[#1E2A38]/50">
                        <td className="py-2 text-white text-xs">{m.name}</td>
                        <td className="py-2 text-slate-300 text-xs">{m.quantity} {m.unit}</td>
                        <td className="py-2 text-right">
                          <span className="text-[#FF8C42] font-medium text-xs">{m.total_price_bgn || m.total_price || '-'}</span>
                          {m.total_price_eur && <span className="text-slate-500 text-[10px] block">{m.total_price_eur}</span>}
                        </td>
                        <td className="py-2 text-right text-xs text-slate-500">{m.store || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {project.materials.grand_total_bgn && (
                      <tr className="border-t-2 border-[#FF8C42]/30">
                        <td colSpan="2" className="py-3 text-white font-bold">ОБЩА СТОЙНОСТ:</td>
                        <td className="py-3 text-right">
                          <span className="text-[#28A745] font-bold">{project.materials.grand_total_bgn}</span>
                          {project.materials.grand_total_eur && <span className="text-[#28A745]/70 text-xs block">{project.materials.grand_total_eur}</span>}
                        </td>
                        <td />
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Section */}
        <Card className="mb-6 bg-[#253545] border-[#3A4A5C]">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-[#FF8C42]" />
              Оценете проекта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onClick={() => handleRate(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star className={`h-8 w-8 transition-colors ${
                      s <= (hoverRating || userRating) ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-[#3A4A5C] hover:text-[#FF8C42]/50'
                    }`} />
                  </button>
                ))}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{project.avg_rating || 0} / 5</p>
                <p className="text-slate-500 text-xs">{project.rating_count || 0} оценки</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mb-6 bg-[#253545] border-[#3A4A5C]">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#4DA6FF]" />
              Коментари ({project.comments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add comment */}
            <div className="mb-6">
              <Textarea
                placeholder={user ? "Напишете коментар..." : "Влезте в профила си, за да коментирате"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!user}
                className="bg-[#1E2A38] border-[#3A4A5C] text-white mb-3 resize-none"
                rows={3}
                data-testid="comment-input"
              />
              <Button
                className="bg-[#4DA6FF] hover:bg-[#3d96ef] text-white"
                onClick={handleComment}
                disabled={!user || !commentText.trim() || submitting}
                data-testid="submit-comment"
              >
                <Send className="h-4 w-4 mr-2" /> Публикувай
              </Button>
            </div>

            <Separator className="bg-[#3A4A5C] mb-4" />

            {/* Comments list */}
            {project.comments?.length > 0 ? (
              <div className="space-y-4">
                {[...project.comments].reverse().map(comment => (
                  <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-[#4DA6FF]/15 text-[#4DA6FF] text-xs">
                        {comment.user_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">{comment.user_name}</span>
                        <Badge className="text-[9px] px-1.5 py-0 bg-[#1E2A38] text-slate-500 border border-[#3A4A5C]">
                          {comment.user_type === 'company' ? 'Фирма' : comment.user_type === 'master' ? 'Майстор' : 'Клиент'}
                        </Badge>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.created_at).toLocaleDateString('bg-BG')}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center text-sm py-4">Все още няма коментари. Бъдете първите!</p>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
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
