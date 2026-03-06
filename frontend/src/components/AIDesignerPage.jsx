import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Loader2, X, Download, ArrowLeft, ArrowRight, Ruler, FileText, Upload, Plus,
  ImageIcon, RotateCcw, CheckCircle, Info, ChevronDown, ChevronUp, Share2, ExternalLink,
  ShoppingCart, Bookmark, Heart, Facebook, Twitter, Instagram, Link2, Copy, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const SITE_URL = process.env.REACT_APP_BACKEND_URL;

const ROOM_TYPES = [
  { id: 'bathroom', name: 'Баня' }, { id: 'kitchen', name: 'Кухня' },
  { id: 'living_room', name: 'Хол' }, { id: 'bedroom', name: 'Спалня' },
  { id: 'corridor', name: 'Коридор' }, { id: 'balcony', name: 'Балкон' },
  { id: 'stairs', name: 'Стълбище' }, { id: 'facade', name: 'Фасада' },
  { id: 'other', name: 'Друго' },
];

const STYLES = [
  { id: 'modern', name: 'Модерен' },
  { id: 'minimalist', name: 'Минималист' },
  { id: 'classic', name: 'Класически' },
  { id: 'boho', name: 'Бохо' },
  { id: 'hitech', name: 'Хай-тек' },
  { id: 'industrial', name: 'Индустриален' },
  { id: 'scandinavian', name: 'Скандинавски' },
  { id: 'loft', name: 'Лофт' },
  { id: 'neoclassic', name: 'Неокласически' },
  { id: 'artdeco', name: 'Арт Деко' },
];

const PACKAGES = [
  { id: 1, label: '1 помещение', price: 69, max: 1 },
  { id: 2, label: '2 помещения', price: 129, max: 2 },
  { id: 3, label: 'Апартамент', price: 199, max: 5 },
];

/* ---- Upload Progress ---- */
const UploadProgress = ({ pct }) => (
  <div className="w-full mt-2">
    <div className="flex justify-between text-[10px] mb-1">
      <span style={{ color: 'var(--theme-text-muted)' }}>Качване...</span>
      <span className="text-[#F97316] font-bold">{Math.round(pct)}%</span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
      <div className="h-full bg-[#F97316] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  </div>
);

/* ---- Gen Progress ---- */
const GenProgress = ({ elapsed, total }) => {
  const pct = Math.min(100, (elapsed / total) * 100);
  return (
    <div className="w-full" data-testid="progress-bar">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>AI генерира 360° дизайн...</span>
        <span className="text-[#F97316] font-black text-2xl">{Math.round(pct)}%</span>
      </div>
      <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #10B981)' }} />
      </div>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--theme-text-subtle)' }}>
        <span>0%</span>
        <span>Снимки → AI анализ → 360° рендер → Бюджет → Линкове</span>
        <span>100%</span>
      </div>
    </div>
  );
};

/* ---- Before / After Slider ---- */
const BeforeAfterSlider = ({ before, after, label }) => {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const handleMove = useCallback((clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  }, []);
  return (
    <div ref={ref} className="relative w-full aspect-video rounded-xl overflow-hidden cursor-col-resize select-none"
      style={{ border: '1px solid var(--theme-border)' }}
      onMouseMove={(e) => e.buttons && handleMove(e.clientX)} onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      data-testid="before-after-slider">
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="w-full h-full object-cover" style={{ width: `${(100 * 100) / Math.max(pos, 1)}%`, maxWidth: 'none' }} draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
        <div className="w-0.5 h-full bg-white shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <ArrowLeft className="h-3 w-3 text-slate-700" /><ArrowRight className="h-3 w-3 text-slate-700" />
        </div>
      </div>
      <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-sm">ПРЕДИ</div>
      <div className="absolute top-3 right-3 bg-[#F97316]/90 text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-sm">СЛЕД</div>
      {label && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-3 py-1 rounded-lg backdrop-blur-sm">{label}</div>}
    </div>
  );
};

/* ---- Photo Guide ---- */
const PhotoGuide = () => {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid rgba(249,115,22,0.2)' }}>
      <CardContent className="p-0">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left" data-testid="guide-toggle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-[#F97316]" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>КАК ДА СНИМАШ ЗА ПЕРФЕКТЕН 3D ДИЗАЙН</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>3 снимки = 1 идеален 360° изглед</p>
            </div>
          </div>
          {open ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} /> : <ChevronDown className="h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />}
        </button>
        {open && (
          <div className="px-4 pb-4 space-y-3" data-testid="guide-content">
            {[
              { icon: '1', title: 'ОБЩ ПЛАН', text: 'Застани в ДОСТЪПНА точка с НАЙ-ПЪЛЕН ИЗГЛЕД. Снимай цялото помещение наведнъж. Включи колкото се може повече стени/обекти.' },
              { icon: '2', title: 'ЪГЪЛ 1 (напред-дясно)', text: 'Застани в ЕДИН ЪГЪЛ на помещението. Снимай НАПРЕД-ДЯСНО с максимален обхват (180°).' },
              { icon: '3', title: 'ЪГЪЛ 2 (напред-ляво)', text: 'Застани в ПРОТИВОПОЛОЖЕН ЪГЪЛ. Снимай НАПРЕД-ЛЯВО (180° обхват). AI ще създаде ПЪЛНИЯ 360° ИЗГЛЕД.' },
            ].map((step, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F97316]/15 flex items-center justify-center text-[#F97316] text-xs font-black flex-shrink-0">{step.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-[#F97316] mb-0.5">{step.title}</p>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-red-400 text-[10px] font-bold">НЕ: 3 снимки от едно място</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-green-400 text-[10px] font-bold">ДА: 1 общ + 2 от ъгли</p>
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <p className="text-[#F97316] text-xs font-medium">JPG/PNG (макс 10MB) | Поне 1 снимка задължителна | Хоризонтално (landscape) за 360°</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ---- Budget Tier Card ---- */
const BudgetTierCard = ({ tier, isActive, onClick }) => {
  if (!tier) return null;
  const colors = { economy: '#10B981', medium: '#F97316', premium: '#8B5CF6' };
  const icons = { economy: '💰', medium: '⭐', premium: '👑' };
  const color = colors[tier.tier] || '#F97316';

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl text-left transition-all w-full ${isActive ? 'ring-2 scale-[1.02]' : 'hover:shadow-md'}`}
      style={{
        background: 'var(--theme-card-bg)',
        border: `2px solid ${isActive ? color : 'var(--theme-border)'}`,
        ringColor: color
      }}
      data-testid={`budget-tier-${tier.tier}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icons[tier.tier] || '⭐'}</span>
        <span className="font-black text-xl" style={{ color }}>{tier.total_eur || 0}€</span>
      </div>
      <p className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>{tier.tier_name}</p>
      <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>{tier.materials?.length || 0} материала</p>
    </button>
  );
};

/* ---- Product Link Row ---- */
const ProductLink = ({ material }) => (
  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5" 
    style={{ borderBottom: '1px solid var(--theme-border)' }}
    data-testid={`product-${material.name}`}>
    <div className="flex-1 min-w-0 mr-3">
      <p className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>{material.name}</p>
      <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>
        {material.quantity} | {material.store}
      </p>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[#F97316] font-bold text-sm">{material.price_eur}€</span>
      {material.product_url && (
        <a href={material.product_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F97316]/10 text-[#F97316] text-[10px] font-bold hover:bg-[#F97316]/20 transition-colors"
          data-testid={`buy-link-${material.name}`}>
          <ExternalLink className="h-3 w-3" /> КУПИ
        </a>
      )}
    </div>
  </div>
);

/* ---- Share Modal ---- */
const SharePanel = ({ projectId, onClose }) => {
  const shareUrl = `${SITE_URL}/projects/${projectId}`;
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Линкът е копиран!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
            <Share2 className="h-4 w-4 text-[#F97316]" /> Сподели проект
          </h4>
          <button onClick={onClose} style={{ color: 'var(--theme-text-muted)' }}><X className="h-4 w-4" /></button>
        </div>
        {/* Copy link */}
        <div className="flex gap-2 mb-3">
          <Input value={shareUrl} readOnly className="text-xs flex-1" data-testid="share-url-input" />
          <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white px-3" onClick={copyLink} data-testid="copy-link-btn">
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {/* Social links */}
        <div className="flex gap-2">
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1877F2] text-white text-xs font-medium hover:opacity-90" data-testid="share-fb">
            <Facebook className="h-3.5 w-3.5" /> Facebook
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Вижте моя 3D дизайн проект в TemaDom!')}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-black text-white text-xs font-medium hover:opacity-90" data-testid="share-twitter">
            <Twitter className="h-3.5 w-3.5" /> Twitter
          </a>
          <button onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium" 
            style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)' }} data-testid="share-link">
            <Link2 className="h-3.5 w-3.5" /> Линк
          </button>
        </div>
      </CardContent>
    </Card>
  );
};


/* ============ MAIN PAGE ============ */
export const AIDesignerPage = () => {
  const [pkg, setPkg] = useState(PACKAGES[0]);
  const [photos, setPhotos] = useState([null, null, null]);
  const [photoUrls, setPhotoUrls] = useState([null, null, null]);
  const [width, setWidth] = useState('4');
  const [length, setLength] = useState('5');
  const [height, setHeight] = useState('2.7');
  const [style, setStyle] = useState('modern');
  const [roomType, setRoomType] = useState('living_room');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [results, setResults] = useState(null);
  const [activeAngle, setActiveAngle] = useState(0);
  const [activeTier, setActiveTier] = useState('medium');
  const [showShare, setShowShare] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const timerRef = useRef(null);
  const fileInputRefs = useRef([]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const token = localStorage.getItem('token');

  const handlePhotoSelect = (idx, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Моля, изберете снимка (JPG/PNG)'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Макс. 10MB на снимка'); return; }
    setPhotos(prev => { const n = [...prev]; n[idx] = file; return n; });
    setPhotoUrls(prev => { const n = [...prev]; if (n[idx]) URL.revokeObjectURL(n[idx]); n[idx] = URL.createObjectURL(file); return n; });
  };

  const removePhoto = (idx) => {
    if (photoUrls[idx]) URL.revokeObjectURL(photoUrls[idx]);
    setPhotos(prev => { const n = [...prev]; n[idx] = null; return n; });
    setPhotoUrls(prev => { const n = [...prev]; n[idx] = null; return n; });
  };

  const handleGenerate = async () => {
    const hasPhotos = photos.some(p => p !== null);
    if (!hasPhotos) { toast.error('Качете поне една снимка'); return; }

    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const fd = new FormData();
    photos.forEach((p, i) => { if (p) fd.append(`photo${i + 1}`, p); });
    fd.append('width', width);
    fd.append('length', length);
    fd.append('height', height);
    fd.append('style', style);
    fd.append('room_type', roomType);
    fd.append('notes', notes);
    fd.append('budget_tier', activeTier);
    if (token) fd.append('authorization', `Bearer ${token}`);

    try {
      const res = await axios.post(`${API}/ai-designer/photo-generate`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
        onUploadProgress: (e) => { if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100)); },
      });
      setResults(res.data);
      setActiveAngle(0);
      toast.success('360° дизайн генериран успешно!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при генериране');
    }
    clearInterval(timerRef.current);
    setUploadPct(0);
    setLoading(false);
  };

  const reset = () => {
    photoUrls.forEach(u => { if (u) URL.revokeObjectURL(u); });
    setPhotos([null, null, null]);
    setPhotoUrls([null, null, null]);
    setResults(null);
    setElapsed(0);
    setActiveAngle(0);
    setShowShare(false);
  };

  const loadMyProjects = async () => {
    if (!token) { toast.error('Влезте в профила за да видите проектите'); return; }
    try {
      const res = await axios.get(`${API}/ai-designer/my-projects`, { headers: { Authorization: `Bearer ${token}` } });
      setMyProjects(res.data.projects || []);
      setShowProjects(true);
    } catch { toast.error('Грешка при зареждане'); }
  };

  const loadProject = async (projectId) => {
    try {
      const res = await axios.get(`${API}/ai-designer/project/${projectId}`);
      setResults(res.data);
      setShowProjects(false);
      setActiveAngle(0);
    } catch { toast.error('Грешка при зареждане на проект'); }
  };

  const angles = results?.generated_images?.[0]?.angles || [];
  const beforeImg = results?.before_photo ? `data:image/jpeg;base64,${results.before_photo}` : null;
  const budgetTiers = results?.budget?.budget_tiers || [];
  const currentTierData = budgetTiers.find(t => t.tier === activeTier) || budgetTiers[0];

  const photoLabels = ['Общ план', 'Ъгъл 1', 'Ъгъл 2'];

  return (
    <div className="min-h-screen py-6 px-3 md:px-6" style={{ background: 'var(--theme-bg)' }} data-testid="ia-designer-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Camera className="h-7 w-7 text-[#F97316]" />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
              TEMADOM <span className="text-[#F97316]">3D DESIGNER</span>
            </h1>
            <Badge className="bg-[#F97316]/15 text-[#F97316] text-[10px] font-bold">v7.0</Badge>
          </div>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>3 снимки → РЕАЛИСТИЧЕН 360° дизайн + бюджет с директни линкове</p>
        </div>

        {/* My Projects Button */}
        {token && (
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" onClick={loadMyProjects} style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }} data-testid="my-projects-btn">
              <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Моите проекти
            </Button>
          </div>
        )}

        {/* My Projects List */}
        {showProjects && (
          <Card className="mb-4" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>Моите проекти ({myProjects.length})</CardTitle>
                <button onClick={() => setShowProjects(false)} style={{ color: 'var(--theme-text-muted)' }}><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent>
              {myProjects.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-muted)' }}>Нямате запазени проекти</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {myProjects.map(p => (
                    <button key={p.id} onClick={() => loadProject(p.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ border: '1px solid var(--theme-border)' }}
                      data-testid={`project-${p.id}`}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{p.room_type}</p>
                        <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>
                          {p.dimensions?.width}x{p.dimensions?.length}м | {p.style} | {new Date(p.created_at).toLocaleDateString('bg-BG')}
                        </p>
                      </div>
                      <Eye className="h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!results ? (
          <div className="space-y-4">
            {/* Photo Guide */}
            <PhotoGuide />

            {/* Package Selection */}
            <div className="grid grid-cols-3 gap-2" data-testid="package-selection">
              {PACKAGES.map(p => (
                <button key={p.id} onClick={() => setPkg(p)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    pkg.id === p.id ? 'scale-[1.03] shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    background: 'var(--theme-card-bg)',
                    border: `2px solid ${pkg.id === p.id ? '#F97316' : 'var(--theme-border)'}`,
                    boxShadow: pkg.id === p.id ? '0 0 20px rgba(249,115,22,0.2)' : 'none'
                  }}
                  data-testid={`pkg-${p.id}`}>
                  <p className={`text-2xl font-black ${pkg.id === p.id ? 'text-[#F97316]' : ''}`} style={pkg.id !== p.id ? { color: 'var(--theme-text)' } : {}}>{p.price}<span className="text-xs">EUR</span></p>
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{p.label}</p>
                  {pkg.id === p.id && <div className="w-8 h-0.5 bg-[#F97316] mx-auto mt-2 rounded-full" />}
                </button>
              ))}
            </div>

            {/* Photo Upload Grid (3 slots) */}
            <div className="grid grid-cols-3 gap-3" data-testid="photo-upload-grid">
              {[0, 1, 2].map(idx => (
                <div key={idx} className="relative">
                  <Label className="text-[10px] mb-1 block font-bold" style={{ color: 'var(--theme-text-subtle)' }}>
                    {photoLabels[idx]} {idx === 0 && <span className="text-red-400">*</span>}
                  </Label>
                  {!photos[idx] ? (
                    <div
                      className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#F97316]/40"
                      style={{ background: 'var(--theme-card-bg)', border: '2px dashed var(--theme-border)' }}
                      onDrop={(e) => { e.preventDefault(); handlePhotoSelect(idx, e.dataTransfer.files?.[0]); }}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      data-testid={`photo-drop-${idx}`}
                    >
                      <input ref={el => fileInputRefs.current[idx] = el} type="file" accept="image/*"
                        capture="environment" className="hidden"
                        onChange={e => handlePhotoSelect(idx, e.target.files?.[0])} data-testid={`photo-input-${idx}`} />
                      <Upload className="h-6 w-6 text-[#F97316] mb-1" />
                      <p className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>Качи</p>
                    </div>
                  ) : (
                    <div className="relative aspect-square rounded-xl overflow-hidden" style={{ border: '2px solid #10B981' }}>
                      <img src={photoUrls[idx]} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1"
                        data-testid={`remove-photo-${idx}`}>
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-[#10B981] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        <CheckCircle className="h-2.5 w-2.5 inline mr-0.5" />{photoLabels[idx]}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dimensions */}
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="h-4 w-4 text-[#F97316]" />
                  <span className="text-[#F97316] text-xs font-bold">ТОЧНИ РАЗМЕРИ</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Ширина (м)', val: width, set: setWidth, key: 'width' },
                    { label: 'Дължина (м)', val: length, set: setLength, key: 'length' },
                    { label: 'Височина (м)', val: height, set: setHeight, key: 'height' },
                  ].map(d => (
                    <div key={d.key}>
                      <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>{d.label}</Label>
                      <Input type="number" step="0.1" value={d.val} onChange={e => d.set(e.target.value)}
                        className="h-10 text-center text-lg font-bold" data-testid={`dim-${d.key}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Style + Room Type */}
            <div className="grid grid-cols-2 gap-3">
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="pt-3 pb-3">
                  <Label className="text-[10px] mb-2 block" style={{ color: 'var(--theme-text-subtle)' }}>Тип помещение</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger className="h-10" data-testid="room-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="pt-3 pb-3">
                  <Label className="text-[10px] mb-2 block" style={{ color: 'var(--theme-text-subtle)' }}>Стил</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-10" data-testid="style-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardContent className="pt-3 pb-3">
                <Label className="text-[10px] mb-2 block" style={{ color: 'var(--theme-text-subtle)' }}>Бележки (по желание)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Напр: нов под, бели стени, LED осветление, бойлер 80л..."
                  className="min-h-[50px] text-sm" data-testid="notes-input" />
              </CardContent>
            </Card>

            {/* Generate or Progress */}
            {loading ? (
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="py-8 px-6">
                  <GenProgress elapsed={elapsed} total={120} />
                  {uploadPct > 0 && uploadPct < 100 && <UploadProgress pct={uploadPct} />}
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
                    <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>AI анализира снимки → 360° рендер → Бюджет с линкове...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button className="w-full h-16 text-lg font-black shadow-xl rounded-xl"
                style={{
                  background: photos.some(p => p) ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'var(--theme-bg-surface)',
                  color: photos.some(p => p) ? 'white' : 'var(--theme-text-muted)',
                  boxShadow: photos.some(p => p) ? '0 0 40px rgba(249,115,22,0.3)' : 'none',
                }}
                onClick={handleGenerate} disabled={!photos.some(p => p)} data-testid="generate-btn">
                <Camera className="mr-3 h-6 w-6" />
                ГЕНЕРИРАНЕ — {pkg.price} EUR
              </Button>
            )}
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-4">

            {/* 360° Angle tabs */}
            {angles.length > 1 && (
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="py-2 px-3">
                  <div className="flex gap-1.5 overflow-x-auto" data-testid="angle-tabs">
                    {angles.map((a, i) => (
                      <button key={i} onClick={() => setActiveAngle(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          activeAngle === i ? 'bg-[#F97316] text-white' : ''
                        }`}
                        style={activeAngle !== i ? { background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' } : {}}
                        data-testid={`angle-tab-${i}`}>
                        {a.label || `Ъгъл ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 360° Before/After */}
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                  360° ПРЕДИ / СЛЕД
                  <Badge className="bg-[#10B981]/15 text-[#10B981] text-[10px] ml-auto">
                    {angles.length} ъгъла | {results?.photos_count || 3} снимки
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const afterImg = angles[activeAngle]?.image_base64 ? `data:image/png;base64,${angles[activeAngle].image_base64}` : null;
                  if (!afterImg) return <p className="text-center py-8" style={{ color: 'var(--theme-text-muted)' }}>Няма генерирано изображение</p>;
                  if (beforeImg) return <BeforeAfterSlider before={beforeImg} after={afterImg} label={`360° ротация | ${angles[activeAngle]?.label || ''}`} />;
                  return <img src={afterImg} alt="Renovation" className="w-full rounded-xl" />;
                })()}
              </CardContent>
            </Card>

            {/* BUDGET SECTION with 3 tiers */}
            {budgetTiers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#F97316]" />
                  <h3 className="font-black text-sm" style={{ color: 'var(--theme-text)' }}>БЮДЖЕТ МАТЕРИАЛИ + ДИРЕКТНИ ЛИНКОВЕ</h3>
                </div>

                {/* Tier selection */}
                <div className="grid grid-cols-3 gap-2" data-testid="budget-tiers">
                  {budgetTiers.map(tier => (
                    <BudgetTierCard
                      key={tier.tier}
                      tier={tier}
                      isActive={activeTier === tier.tier}
                      onClick={() => setActiveTier(tier.tier)}
                    />
                  ))}
                </div>

                {/* Active tier materials with links */}
                {currentTierData && (
                  <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>
                          {currentTierData.tier_name} — {currentTierData.materials?.length || 0} материала
                        </CardTitle>
                        <span className="text-[#F97316] font-black text-xl">{currentTierData.total_eur}€</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-0">
                        {(currentTierData.materials || []).map((m, i) => (
                          <ProductLink key={i} material={m} />
                        ))}
                      </div>
                      {results?.budget?.labor_estimate_eur && (
                        <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '2px solid var(--theme-border)' }}>
                          <span className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>Труд (ориентировъчно):</span>
                          <span className="text-[#F97316] font-bold">{results.budget.labor_estimate_eur}€</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: '2px solid var(--theme-border)' }}>
                        <span className="font-bold" style={{ color: 'var(--theme-text)' }}>ОБЩО:</span>
                        <span className="text-[#F97316] font-black text-2xl">
                          {(currentTierData.total_eur || 0) + (results?.budget?.labor_estimate_eur || 0)}€
                        </span>
                      </div>
                      <p className="text-[9px] mt-2 text-center" style={{ color: 'var(--theme-text-subtle)' }}>
                        Кликнете КУПИ за директно закупуване. Цените са ориентировъчни.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Share section */}
            {showShare && results?.id && <SharePanel projectId={results.id} onClose={() => setShowShare(false)} />}

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button className="h-12 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm"
                onClick={() => setShowShare(!showShare)} data-testid="share-btn">
                <Share2 className="mr-1.5 h-4 w-4" /> Сподели
              </Button>
              <Button className="h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm"
                onClick={() => {
                  const afterImg = angles[activeAngle]?.image_base64;
                  if (afterImg) {
                    const link = document.createElement('a');
                    link.href = `data:image/png;base64,${afterImg}`;
                    link.download = `temadom-3d-${results?.id || 'design'}.png`;
                    link.click();
                    toast.success('Изтеглено!');
                  }
                }} data-testid="download-btn">
                <Download className="mr-1.5 h-4 w-4" /> Свали
              </Button>
              <Button className="h-12 font-bold text-sm"
                style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                onClick={() => toast.info('Запазено в Моите проекти!')} data-testid="save-btn">
                <Bookmark className="mr-1.5 h-4 w-4" /> Запази
              </Button>
            </div>

            {/* New project */}
            <div className="flex justify-center pt-2">
              <Button variant="outline" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                onClick={reset} data-testid="new-project-btn">
                <RotateCcw className="mr-2 h-4 w-4" /> Нов проект
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
