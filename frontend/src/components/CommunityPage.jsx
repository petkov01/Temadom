import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Heart, Send, Trash2, Image as ImageIcon, Share2,
  ChevronDown, Filter, PlusCircle, X, User, Building2, Clock, Bookmark,
  Euro, CalendarDays, Briefcase, Eye, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../App';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const POST_TYPES = [
  { id: 'all', name: 'Всички' },
  { id: 'text', name: 'Обсъждане' },
  { id: 'project', name: 'Проекти' },
  { id: 'question', name: 'Въпроси' },
  { id: 'before_after', name: 'Преди/След' },
  { id: 'offer', name: 'Оферти' },
];

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'сега';
  if (s < 3600) return `${Math.floor(s / 60)} мин`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч`;
  return `${Math.floor(s / 86400)} дни`;
};

/* ---- New Post Form ---- */
const NewPostForm = ({ onPost }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [posting, setPosting] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const imgRef = useRef(null);
  const token = localStorage.getItem('token');

  const addImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Макс. 5MB'); return; }
    if (images.length >= 4) { toast.error('Макс. 4 снимки'); return; }
    setImages(prev => [...prev, file]);
    setImageUrls(prev => [...prev, URL.createObjectURL(file)]);
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(imageUrls[idx]);
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const loadProjects = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/ai-designer/my-projects`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(res.data.projects || []);
      setShowProjectPicker(true);
    } catch { toast.error('Грешка при зареждане на проекти'); }
  };

  const submit = async () => {
    if (!text.trim() && !selectedProject && images.length === 0) { toast.error('Добавете текст, снимка или проект'); return; }
    if (!token) { toast.error('Влезте в профила'); return; }
    setPosting(true);
    try {
      // Convert images to base64
      const imagesB64 = [];
      for (const img of images) {
        const b64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(img);
        });
        imagesB64.push(b64);
      }

      const res = await axios.post(`${API}/community/posts`, {
        text, type, images: imagesB64,
        project_id: selectedProject?.id || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onPost(res.data);
      setText('');
      setImages([]);
      imageUrls.forEach(u => URL.revokeObjectURL(u));
      setImageUrls([]);
      setSelectedProject(null);
      toast.success('Публикувано!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
    setPosting(false);
  };

  return (
    <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }} data-testid="new-post-form">
      <CardContent className="p-4">
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Споделете нещо с общността..."
          className="min-h-[60px] mb-3 resize-none" maxLength={2000} data-testid="post-text-input" />

        {/* Image previews */}
        {imageUrls.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap" data-testid="image-previews">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-red-500/90 text-white rounded-full p-0.5"
                  data-testid={`remove-img-${i}`}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected project */}
        {selectedProject && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Bookmark className="h-4 w-4 text-[#F97316] flex-shrink-0" />
            <span className="text-xs font-medium flex-1" style={{ color: 'var(--theme-text)' }}>
              Проект: {selectedProject.room_type} | {selectedProject.style}
            </span>
            <button onClick={() => setSelectedProject(null)} style={{ color: 'var(--theme-text-muted)' }}><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Project picker */}
        {showProjectPicker && (
          <div className="mb-3 max-h-40 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--theme-border)' }}>
            {projects.length === 0 ? (
              <p className="p-3 text-xs text-center" style={{ color: 'var(--theme-text-muted)' }}>Нямате проекти</p>
            ) : projects.map(p => (
              <button key={p.id} onClick={() => { setSelectedProject(p); setType('project'); setShowProjectPicker(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                data-testid={`pick-project-${p.id}`}>
                <Bookmark className="h-3 w-3 text-[#F97316]" />
                {p.room_type} | {p.style} | {new Date(p.created_at).toLocaleDateString('bg-BG')}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            {/* Image upload */}
            <button onClick={() => imgRef.current?.click()}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: images.length > 0 ? '#F97316' : 'var(--theme-text-muted)' }}
              data-testid="add-image-btn">
              <ImageIcon className="h-4.5 w-4.5" />
            </button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => addImage(e.target.files?.[0])} />

            {/* Project link */}
            <button onClick={loadProjects}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: selectedProject ? '#F97316' : 'var(--theme-text-muted)' }}
              data-testid="link-project-btn">
              <Bookmark className="h-4.5 w-4.5" />
            </button>

            <div className="w-px h-5 mx-1" style={{ background: 'var(--theme-border)' }} />

            {/* Type pills */}
            {POST_TYPES.filter(t => t.id !== 'all').map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${type === t.id ? 'bg-[#F97316] text-white' : ''}`}
                style={type !== t.id ? { background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' } : {}}
                data-testid={`post-type-${t.id}`}>
                {t.name}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-4"
            onClick={submit} disabled={posting || (!text.trim() && !selectedProject && images.length === 0)} data-testid="submit-post-btn">
            {posting ? '...' : <><Send className="h-3.5 w-3.5 mr-1.5" /> Публикувай</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ---- Comment ---- */
const Comment = ({ comment }) => (
  <div className="flex gap-2 py-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: comment.user_type === 'company' ? '#F97316' : '#4DA6FF' }}>
      {comment.user_avatar ? (
        <img src={`data:image/jpeg;base64,${comment.user_avatar}`} alt="" className="w-7 h-7 rounded-full object-cover" />
      ) : (
        <User className="h-3.5 w-3.5 text-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold truncate" style={{ color: 'var(--theme-text)' }}>{comment.user_name}</span>
        <span className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>{timeAgo(comment.created_at)}</span>
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{comment.text}</p>
    </div>
  </div>
);

/* ---- Offers on a post ---- */
const OffersSection = ({ postId, isCompany }) => {
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState('');
  const [msg, setMsg] = useState('');
  const [days, setDays] = useState('');
  const [sending, setSending] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${API}/community/offers/${postId}`).then(r => setOffers(r.data.offers)).catch(() => {});
  }, [postId]);

  const submit = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/community/offers`, {
        post_id: postId, price_eur: Number(price) || 0, message: msg, timeline_days: Number(days) || 0,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setOffers(prev => [res.data, ...prev]);
      setMsg(''); setPrice(''); setDays(''); setShowForm(false);
      toast.success('Офертата е изпратена!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка'); }
    setSending(false);
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--theme-border)' }} data-testid={`offers-section-${postId}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
          <Briefcase className="h-3 w-3" /> {offers.length} оферти
        </span>
        {isCompany && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-[10px] font-bold text-[#F97316] hover:underline" data-testid={`make-offer-btn-${postId}`}>
            + Направи оферта
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 mb-3 p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена (EUR)" type="number"
              className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--theme-card-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
              data-testid={`offer-price-${postId}`} />
            <input value={days} onChange={e => setDays(e.target.value)} placeholder="Срок (дни)" type="number"
              className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--theme-card-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
              data-testid={`offer-days-${postId}`} />
          </div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Опишете офертата..." rows={2}
            className="w-full text-xs rounded-lg px-3 py-2 resize-none" style={{ background: 'var(--theme-card-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
            data-testid={`offer-msg-${postId}`} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--theme-text-muted)' }}>Отказ</button>
            <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs px-4" onClick={submit} disabled={sending || !msg.trim()}
              data-testid={`submit-offer-${postId}`}>
              {sending ? '...' : 'Изпрати оферта'}
            </Button>
          </div>
        </div>
      )}

      {offers.slice(0, 3).map(o => (
        <div key={o.id} className="flex items-start gap-2 py-2 px-1" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center flex-shrink-0">
            {o.company_avatar ? <img src={`data:image/jpeg;base64,${o.company_avatar}`} alt="" className="w-7 h-7 rounded-full object-cover" /> : <Building2 className="h-3.5 w-3.5 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold truncate" style={{ color: 'var(--theme-text)' }}>{o.company_name}</span>
              {o.company_region && <span className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>{o.company_region}</span>}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{o.message}</p>
            <div className="flex items-center gap-3 mt-1">
              {o.price_eur > 0 && <span className="text-[10px] font-bold text-[#F97316]"><Euro className="inline h-2.5 w-2.5" /> {o.price_eur} EUR</span>}
              {o.timeline_days > 0 && <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}><CalendarDays className="inline h-2.5 w-2.5" /> {o.timeline_days} дни</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---- Post Card ---- */
const PostCard = ({ post, onLike, onComment, onDelete, userId }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const liked = post.likes?.includes(userId);
  const token = localStorage.getItem('token');

  const handleComment = async () => {
    if (!commentText.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/community/posts/${post.id}/comment`, { text: commentText }, { headers: { Authorization: `Bearer ${token}` } });
      onComment(post.id, res.data);
      setCommentText('');
    } catch { toast.error('Грешка'); }
    setSubmitting(false);
  };

  const typeBadge = { text: null, project: 'Проект', question: 'Въпрос', before_after: 'Преди/След', offer: 'Оферта' };
  const typeColor = { project: '#F97316', question: '#4DA6FF', before_after: '#10B981', offer: '#8B5CF6' };

  return (
    <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }} data-testid={`post-${post.id}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: post.user_type === 'company' ? '#F97316' : '#4DA6FF' }}>
              {post.user_avatar ? (
                <img src={`data:image/jpeg;base64,${post.user_avatar}`} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                post.user_type === 'company' ? <Building2 className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>{post.user_name}</span>
                {post.user_type !== 'client' && (
                  <Badge className="text-[9px] px-1.5 py-0" style={{ background: '#F97316', color: 'white' }}>
                    {post.user_type === 'company' ? 'Фирма' : 'Майстор'}
                  </Badge>
                )}
                {typeBadge[post.type] && (
                  <Badge className="text-[9px] px-1.5 py-0" style={{ background: `${typeColor[post.type]}20`, color: typeColor[post.type] }}>
                    {typeBadge[post.type]}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--theme-text-subtle)' }}>
                <Clock className="h-2.5 w-2.5" /> {timeAgo(post.created_at)}
              </span>
            </div>
          </div>
          {post.user_id === userId && (
            <button onClick={() => onDelete(post.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              style={{ color: 'var(--theme-text-muted)' }} data-testid={`delete-post-${post.id}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Text */}
        <p className="text-sm mb-3 whitespace-pre-wrap" style={{ color: 'var(--theme-text)' }}>{post.text}</p>

        {/* Affiliate product suggestions (auto-detected, non-intrusive) */}
        {post.affiliate_links?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3" data-testid={`affiliate-links-${post.id}`}>
            {post.affiliate_links.map((link, li) => (
              <a key={li} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all hover:scale-105 hover:shadow-sm"
                style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
                data-testid={`aff-link-${post.id}-${li}`}>
                <ExternalLink className="h-3 w-3 text-[#F97316]" />
                <span>{link.search_term}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                  {link.store}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Project data */}
        {post.project_data && (
          <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <p className="text-xs font-bold text-[#F97316]">
              Проект: {post.project_data.room_type} | {post.project_data.style} | {post.project_data.budget_eur} EUR
            </p>
          </div>
        )}

        {/* Images */}
        {post.images?.length > 0 && (
          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${Math.min(post.images.length, 3)}, 1fr)` }}>
            {post.images.slice(0, 3).map((img, i) => (
              <img key={i} src={`data:image/jpeg;base64,${img}`} alt="" className="w-full aspect-video object-cover rounded-lg" />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: liked ? '#EF4444' : 'var(--theme-text-muted)' }} data-testid={`like-${post.id}`}>
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {post.likes_count || 0}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--theme-text-muted)' }} data-testid={`comments-toggle-${post.id}`}>
            <MessageSquare className="h-4 w-4" /> {post.comments_count || 0}
          </button>
          {post.type === 'project' && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              <Briefcase className="h-4 w-4" /> Оферти
            </span>
          )}
        </div>

        {/* Offers for project posts */}
        {post.type === 'project' && (
          <OffersSection postId={post.id} isCompany={userId && post.user_id !== userId} />
        )}

        {/* Comments */}
        {showComments && (
          <div className="mt-3 space-y-0" data-testid={`comments-section-${post.id}`}>
            {(post.comments || []).map(c => <Comment key={c.id} comment={c} />)}
            {token && (
              <div className="flex gap-2 pt-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                  placeholder="Напишете коментар..." className="flex-1 text-xs rounded-lg px-3 py-2"
                  style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                  data-testid={`comment-input-${post.id}`} />
                <Button size="sm" className="bg-[#F97316] text-white px-3" onClick={handleComment} disabled={submitting || !commentText.trim()}
                  data-testid={`submit-comment-${post.id}`}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ============ MAIN PAGE ============ */
export const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const fetchPosts = useCallback(async (pg = 1, type = 'all') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/community/posts?page=${pg}&limit=20&post_type=${type}`);
      setPosts(pg === 1 ? res.data.posts : prev => [...prev, ...res.data.posts]);
      setTotalPages(res.data.pages);
      setPage(pg);
    } catch { toast.error('Грешка при зареждане'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(1, filter); }, [filter, fetchPosts]);

  const handleNewPost = (post) => setPosts(prev => [post, ...prev]);

  const handleLike = async (postId) => {
    if (!token) { toast.error('Влезте в профила'); return; }
    try {
      const res = await axios.post(`${API}/community/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p, likes_count: res.data.likes_count,
        likes: res.data.liked ? [...(p.likes || []), user?.id] : (p.likes || []).filter(id => id !== user?.id)
      } : p));
    } catch { toast.error('Грешка'); }
  };

  const handleComment = (postId, comment) => {
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, comments: [...(p.comments || []), comment], comments_count: (p.comments_count || 0) + 1
    } : p));
  };

  const handleDelete = async (postId) => {
    if (!token) return;
    try {
      await axios.delete(`${API}/community/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Изтрито');
    } catch { toast.error('Грешка'); }
  };

  return (
    <div className="min-h-screen py-6 px-3 md:px-6" style={{ background: 'var(--theme-bg)' }} data-testid="community-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--theme-text)' }}>
            <MessageSquare className="inline h-7 w-7 text-[#F97316] mr-2" />
            Общност
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Споделяйте проекти, задавайте въпроси, свързвайте се</p>
        </div>

        {/* New post */}
        {token && <div className="mb-4"><NewPostForm onPost={handleNewPost} /></div>}

        {/* Filters */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" data-testid="post-filters">
          {POST_TYPES.map(t => (
            <button key={t.id} onClick={() => { setFilter(t.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === t.id ? 'bg-[#F97316] text-white' : ''}`}
              style={filter !== t.id ? { background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' } : {}}
              data-testid={`filter-${t.id}`}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {posts.map(p => (
            <PostCard key={p.id} post={p} userId={user?.id}
              onLike={handleLike} onComment={handleComment} onDelete={handleDelete} />
          ))}
        </div>

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--theme-text-subtle)' }} />
              <p className="font-bold" style={{ color: 'var(--theme-text)' }}>Все още няма публикации</p>
              <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Бъдете първият, който ще сподели!</p>
            </CardContent>
          </Card>
        )}

        {/* Load more */}
        {page < totalPages && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => fetchPosts(page + 1, filter)} disabled={loading}
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              data-testid="load-more-btn">
              {loading ? '...' : <><ChevronDown className="h-4 w-4 mr-1.5" /> Зареди още</>}
            </Button>
          </div>
        )}

        {loading && posts.length > 0 && (
          <div className="text-center py-4">
            <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Зареждане...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
