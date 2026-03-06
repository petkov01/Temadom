import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Heart, Send, Trash2, Image as ImageIcon, Share2,
  ChevronDown, Filter, PlusCircle, X, User, Building2, Clock, Bookmark } from 'lucide-react';
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
  const token = localStorage.getItem('token');

  const submit = async () => {
    if (!text.trim()) { toast.error('Напишете нещо'); return; }
    if (!token) { toast.error('Влезте в профила'); return; }
    setPosting(true);
    try {
      const res = await axios.post(`${API}/community/posts`, { text, type }, { headers: { Authorization: `Bearer ${token}` } });
      onPost(res.data);
      setText('');
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
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
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
            onClick={submit} disabled={posting || !text.trim()} data-testid="submit-post-btn">
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

  const typeBadge = { text: null, project: 'Проект', question: 'Въпрос', before_after: 'Преди/След' };
  const typeColor = { project: '#F97316', question: '#4DA6FF', before_after: '#10B981' };

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
        </div>

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
