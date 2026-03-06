import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Loader2, X, Download, ArrowLeft, ArrowRight, Ruler, Upload,
  CheckCircle, ChevronDown, ChevronUp, Share2, ExternalLink,
  ShoppingCart, Bookmark, RotateCcw, Eye, FileText, Maximize2, Copy,
  Facebook, Twitter, MessageCircle, Mail, Link2, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  { id: 'modern', name: 'Модерен' }, { id: 'minimalist', name: 'Минималист' },
  { id: 'classic', name: 'Класически' }, { id: 'boho', name: 'Бохо' },
  { id: 'hitech', name: 'Хай-тек' }, { id: 'industrial', name: 'Индустриален' },
  { id: 'scandinavian', name: 'Скандинавски' }, { id: 'loft', name: 'Лофт' },
  { id: 'neoclassic', name: 'Неокласически' }, { id: 'artdeco', name: 'Арт Деко' },
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
        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>AI генерира 3D рендери...</span>
        <span className="text-[#F97316] font-black text-2xl">{Math.round(pct)}%</span>
      </div>
      <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #10B981)' }} />
      </div>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--theme-text-subtle)' }}>
        <span>0%</span>
        <span>Снимки → AI анализ → 3D рендери → Бюджет → Линкове</span>
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
              <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>3 снимки = 3 реалистични 3D рендера</p>
            </div>
          </div>
          {open ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} /> : <ChevronDown className="h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />}
        </button>
        {open && (
          <div className="px-4 pb-4 space-y-3" data-testid="guide-content">
            {[
              { icon: '1', title: 'ОБЩ ПЛАН', text: 'Застани в ДОСТЪПНА точка с НАЙ-ПЪЛЕН ИЗГЛЕД. Снимай цялото помещение наведнъж.' },
              { icon: '2', title: 'ЪГЪЛ 1 (напред-дясно)', text: 'Застани в ЕДИН ЪГЪЛ на помещението. Снимай НАПРЕД-ДЯСНО с максимален обхват.' },
              { icon: '3', title: 'ЪГЪЛ 2 (напред-ляво)', text: 'Застани в ПРОТИВОПОЛОЖЕН ЪГЪЛ. Снимай НАПРЕД-ЛЯВО.' },
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
              <p className="text-[#F97316] text-xs font-medium">JPG/PNG (макс 10MB) | Поне 1 снимка задължителна</p>
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
  const colorsMap = { economy: '#10B981', medium: '#F97316', premium: '#8B5CF6' };
  const icons = { economy: '(E)', medium: '(S)', premium: '(P)' };
  const color = colorsMap[tier.tier] || '#F97316';
  return (
    <button onClick={onClick}
      className={`p-4 rounded-xl text-left transition-all w-full ${isActive ? 'ring-2 scale-[1.02]' : 'hover:shadow-md'}`}
      style={{ background: 'var(--theme-card-bg)', border: `2px solid ${isActive ? color : 'var(--theme-border)'}`, ringColor: color }}
      data-testid={`budget-tier-${tier.tier}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold" style={{ color }}>{icons[tier.tier]}</span>
        <span className="font-black text-xl" style={{ color }}>{tier.total_eur || 0}EUR</span>
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
      <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>{material.quantity} | {material.store}</p>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[#F97316] font-bold text-sm">{material.price_eur}EUR</span>
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

/* ---- Fullscreen Image Viewer ---- */
const FullscreenViewer = ({ renders, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const touchStart = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(p => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setIdx(p => Math.min(renders.length - 1, p + 1));
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [onClose, renders.length]);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && idx < renders.length - 1) setIdx(idx + 1);
      if (diff < 0 && idx > 0) setIdx(idx - 1);
    }
    touchStart.current = null;
  };

  const downloadCurrent = () => {
    const r = renders[idx];
    if (!r?.image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${r.image_base64}`;
    link.download = `temadom_3D_projekt_${idx + 1}.jpg`;
    link.click();
    toast.success('Изтеглено!');
  };

  const current = renders[idx];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      data-testid="fullscreen-viewer">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <span className="text-white text-sm font-bold">{current.label} ({idx + 1}/{renders.length})</span>
        <div className="flex items-center gap-3">
          <button onClick={downloadCurrent} className="text-white/80 hover:text-white p-2" data-testid="fullscreen-download">
            <Download className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2" data-testid="fullscreen-close">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <img src={`data:image/png;base64,${current.image_base64}`} alt={current.label}
          className="max-w-full max-h-full object-contain" draggable={false} />
        {/* Nav arrows */}
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            data-testid="fullscreen-prev">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {idx < renders.length - 1 && (
          <button onClick={() => setIdx(idx + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            data-testid="fullscreen-next">
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* Bottom dots */}
      <div className="flex justify-center gap-2 py-3 bg-black/80">
        {renders.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? 'bg-[#F97316] scale-125' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

/* ---- Share Menu ---- */
const ShareMenu = ({ projectId, budget, onClose }) => {
  const shareUrl = `${SITE_URL}/projects/${projectId}`;
  const shareText = `3D дизайн проект от TemaDom${budget ? ` | Бюджет: ${budget}EUR` : ''}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Линкът е копиран!');
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Моят 3D проект от TemaDom', url: shareUrl, text: shareText });
    }
  };

  const links = [
    { name: 'Facebook', icon: Facebook, color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'WhatsApp', icon: MessageCircle, color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
    { name: 'Viber', icon: Phone, color: '#7360F2', url: `viber://forward?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
    { name: 'Twitter', icon: Twitter, color: '#000', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { name: 'Email', icon: Mail, color: '#EA4335', url: `mailto:?subject=${encodeURIComponent('Моят 3D проект от TemaDom')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}` },
  ];

  return (
    <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }} data-testid="share-menu">
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
        {/* Social links grid */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {links.map(l => (
            <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-opacity"
              style={{ background: l.color }} data-testid={`share-${l.name.toLowerCase()}`}>
              <l.icon className="h-3.5 w-3.5" /> {l.name}
            </a>
          ))}
          <button onClick={copyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
            data-testid="share-link">
            <Link2 className="h-3.5 w-3.5" /> Линк
          </button>
        </div>
        {navigator.share && (
          <Button variant="outline" className="w-full text-xs" onClick={nativeShare} data-testid="share-native">
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Още опции...
          </Button>
        )}
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
  const [budget, setBudget] = useState('2500');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [results, setResults] = useState(null);
  const [activeTier, setActiveTier] = useState('medium');
  const [showShare, setShowShare] = useState(false);
  const [fullscreenIdx, setFullscreenIdx] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
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
    fd.append('budget_eur', budget);
    fd.append('budget_tier', activeTier);
    if (token) fd.append('authorization', `Bearer ${token}`);

    try {
      const res = await axios.post(`${API}/ai-designer/photo-generate`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
        onUploadProgress: (e) => { if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100)); },
      });
      setResults(res.data);
      toast.success('3D рендери генерирани успешно!');
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
    setShowShare(false);
    setFullscreenIdx(null);
  };

  const downloadRender = (render, idx) => {
    if (!render?.image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${render.image_base64}`;
    link.download = `temadom_3D_projekt_${idx + 1}.jpg`;
    link.click();
    toast.success('Изтеглено!');
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    setPdfLoading(true);
    try {
      const budgetTiers = results.budget?.budget_tiers || [];
      const currentTier = budgetTiers.find(t => t.tier === activeTier) || budgetTiers[0];
      const res = await axios.post(`${API}/ai-designer/photo-pdf`, {
        renders: (results.renders || []).map(r => ({ label: r.label, image_base64: r.image_base64 })),
        budget: results.budget || {},
        dimensions: results.dimensions || {},
        style: results.style || 'modern',
        budget_eur: budget,
        project_id: results.id || '',
        active_tier: activeTier,
      }, { responseType: 'blob' });

      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `temadom_3D_projekt_${results.id?.slice(0, 8) || 'new'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF изтеглен!');
    } catch {
      toast.error('Грешка при генериране на PDF');
    }
    setPdfLoading(false);
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
    } catch { toast.error('Грешка при зареждане на проект'); }
  };

  const renders = results?.renders || [];
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
            <Badge className="bg-[#F97316]/15 text-[#F97316] text-[10px] font-bold">v8.0</Badge>
          </div>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>3 снимки → 3 РЕАЛИСТИЧНИ 3D рендера + бюджет с директни линкове</p>
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
            <PhotoGuide />

            {/* Package Selection */}
            <div className="grid grid-cols-3 gap-2" data-testid="package-selection">
              {PACKAGES.map(p => (
                <button key={p.id} onClick={() => setPkg(p)}
                  className={`p-4 rounded-xl text-center transition-all ${pkg.id === p.id ? 'scale-[1.03] shadow-lg' : 'hover:shadow-md'}`}
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

            {/* Photo Upload Grid */}
            <div className="grid grid-cols-3 gap-3" data-testid="photo-upload-grid">
              {[0, 1, 2].map(idx => (
                <div key={idx} className="relative">
                  <Label className="text-[10px] mb-1 block font-bold" style={{ color: 'var(--theme-text-subtle)' }}>
                    {photoLabels[idx]} {idx === 0 && <span className="text-red-400">*</span>}
                  </Label>
                  {!photos[idx] ? (
                    <div className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#F97316]/40"
                      style={{ background: 'var(--theme-card-bg)', border: '2px dashed var(--theme-border)' }}
                      onDrop={(e) => { e.preventDefault(); handlePhotoSelect(idx, e.dataTransfer.files?.[0]); }}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      data-testid={`photo-drop-${idx}`}>
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

            {/* Budget Input */}
            <Card style={{ background: 'var(--theme-card-bg)', border: '2px solid #F97316' }}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="h-4 w-4 text-[#F97316]" />
                  <span className="text-[#F97316] text-xs font-bold">БЮДЖЕТ ЗА РЕМОНТ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Твоят бюджет (EUR)</Label>
                    <div className="relative">
                      <Input type="number" step="100" min="500" max="50000" value={budget} onChange={e => setBudget(e.target.value)}
                        className="h-14 text-center text-2xl font-black pl-8" data-testid="budget-input" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F97316] font-bold text-lg">EUR</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1000, 2000, 3000, 5000, 10000].map(v => (
                    <button key={v} onClick={() => setBudget(String(v))}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${budget === String(v) ? 'bg-[#F97316] text-white' : ''}`}
                      style={budget !== String(v) ? { background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' } : {}}
                      data-testid={`budget-${v}`}>
                      EUR{v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--theme-text-subtle)' }}>
                  AI ще подбере материали в рамките на бюджета с директни линкове
                </p>
              </CardContent>
            </Card>

            {/* Style + Room Type */}
            <div className="grid grid-cols-2 gap-3">
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="pt-3 pb-3">
                  <Label className="text-[10px] mb-2 block" style={{ color: 'var(--theme-text-subtle)' }}>Тип помещение</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger className="h-10" data-testid="room-type"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROOM_TYPES.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="pt-3 pb-3">
                  <Label className="text-[10px] mb-2 block" style={{ color: 'var(--theme-text-subtle)' }}>Стил</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-10" data-testid="style-select"><SelectValue /></SelectTrigger>
                    <SelectContent>{STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
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
                  <GenProgress elapsed={elapsed} total={180} />
                  {uploadPct > 0 && uploadPct < 100 && <UploadProgress pct={uploadPct} />}
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
                    <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>AI генерира 3D рендери + бюджет с линкове...</span>
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

            {/* === 3 SEPARATE 3D RENDERS === */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#F97316]" />
                <h3 className="font-black text-sm" style={{ color: 'var(--theme-text)' }}>3D РЕНДЕРИ ({renders.length})</h3>
                <Badge className="bg-[#10B981]/15 text-[#10B981] text-[10px] ml-auto">
                  {results?.photos_count || 0} снимки → {renders.length} рендера
                </Badge>
              </div>

              {/* Render grid */}
              <div className={`grid gap-3 ${renders.length === 1 ? 'grid-cols-1' : renders.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}
                data-testid="renders-grid">
                {renders.map((r, i) => {
                  const afterImg = `data:image/png;base64,${r.image_base64}`;
                  const beforeImg = r.original_base64 ? `data:image/jpeg;base64,${r.original_base64}` : null;
                  return (
                    <Card key={i} className="overflow-hidden" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}
                      data-testid={`render-card-${i}`}>
                      <CardContent className="p-0">
                        {/* Before/After or just render */}
                        {beforeImg ? (
                          <BeforeAfterSlider before={beforeImg} after={afterImg} label={r.label} />
                        ) : (
                          <div className="relative aspect-video">
                            <img src={afterImg} alt={r.label} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Actions bar */}
                        <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
                          <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>{r.label}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setFullscreenIdx(i)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--theme-text-muted)' }}
                              data-testid={`fullscreen-btn-${i}`}>
                              <Maximize2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => downloadRender(r, i)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--theme-text-muted)' }}
                              data-testid={`download-render-${i}`}>
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {renders.length === 0 && (
                <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                  <CardContent className="py-8 text-center">
                    <p style={{ color: 'var(--theme-text-muted)' }}>Няма генерирани рендери. Опитайте отново.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* BUDGET SECTION */}
            {budgetTiers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#F97316]" />
                  <h3 className="font-black text-sm" style={{ color: 'var(--theme-text)' }}>БЮДЖЕТ МАТЕРИАЛИ + ДИРЕКТНИ ЛИНКОВЕ</h3>
                </div>
                <div className="grid grid-cols-3 gap-2" data-testid="budget-tiers">
                  {budgetTiers.map(tier => (
                    <BudgetTierCard key={tier.tier} tier={tier} isActive={activeTier === tier.tier} onClick={() => setActiveTier(tier.tier)} />
                  ))}
                </div>
                {currentTierData && (
                  <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>
                          {currentTierData.tier_name} — {currentTierData.materials?.length || 0} материала
                        </CardTitle>
                        <span className="text-[#F97316] font-black text-xl">{currentTierData.total_eur}EUR</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-0">
                        {(currentTierData.materials || []).map((m, i) => <ProductLink key={i} material={m} />)}
                      </div>
                      {results?.budget?.labor_estimate_eur && (
                        <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '2px solid var(--theme-border)' }}>
                          <span className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>Труд (ориентировъчно):</span>
                          <span className="text-[#F97316] font-bold">{results.budget.labor_estimate_eur}EUR</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: '2px solid var(--theme-border)' }}>
                        <span className="font-bold" style={{ color: 'var(--theme-text)' }}>ОБЩО:</span>
                        <span className="text-[#F97316] font-black text-2xl">
                          {(currentTierData.total_eur || 0) + (results?.budget?.labor_estimate_eur || 0)}EUR
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
            {showShare && results?.id && (
              <ShareMenu
                projectId={results.id}
                budget={currentTierData?.total_eur}
                onClose={() => setShowShare(false)}
              />
            )}

            {/* Action buttons: PDF + Share + Save */}
            <div className="grid grid-cols-3 gap-2" data-testid="result-actions">
              <Button className="h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm"
                onClick={handleDownloadPDF} disabled={pdfLoading} data-testid="pdf-btn">
                {pdfLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
                {pdfLoading ? 'PDF...' : 'PDF'}
              </Button>
              <Button className="h-12 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm"
                onClick={() => setShowShare(!showShare)} data-testid="share-btn">
                <Share2 className="mr-1.5 h-4 w-4" /> Сподели
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

      {/* Fullscreen Viewer */}
      {fullscreenIdx !== null && renders.length > 0 && (
        <FullscreenViewer renders={renders} startIndex={fullscreenIdx} onClose={() => setFullscreenIdx(null)} />
      )}
    </div>
  );
};

export default AIDesignerPage;
