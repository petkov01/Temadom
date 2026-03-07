import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, Upload, CheckCircle, Share2, RotateCcw,
  Copy, Facebook, Twitter, MessageCircle, Mail, Link2, Phone, ArrowLeft, ArrowRight,
  Plus, Trash2, Download, Maximize2, Ruler, Store, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  { id: 1, label: '1 помещение', price: 69, maxRooms: 1 },
  { id: 2, label: '2 помещения', price: 119, maxRooms: 2 },
  { id: 3, label: 'Апартамент', price: 199, maxRooms: 5 },
];

const PHOTO_LABELS = ['Общ план', 'Ъгъл 1', 'Ъгъл 2'];

const EST_TIME_PER_ROOM = 90; // seconds per room

const emptyRoom = () => ({
  id: Date.now() + Math.random(),
  roomType: 'living_room',
  style: 'modern',
  photos: [null, null, null],
  photoUrls: [null, null, null],
  notes: '',
  length: '4.0',
  width: '3.0',
  height: '2.6',
  budget: '',
});

/* ---- Before / After Slider ---- */
const BeforeAfterSlider = ({ before, after, label }) => {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const handleMove = (clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div ref={ref} className="relative aspect-video cursor-col-resize overflow-hidden select-none"
      onMouseMove={e => { if (e.buttons === 1) handleMove(e.clientX); }}
      onTouchMove={e => handleMove(e.touches[0].clientX)}
      data-testid={`slider-${label}`}>
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="w-full h-full object-cover" style={{ width: `${10000 / pos}%`, maxWidth: 'none' }} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
        <div className="h-full w-0.5 bg-white shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ArrowLeft className="h-3 w-3 text-gray-600" /><ArrowRight className="h-3 w-3 text-gray-600" />
        </div>
      </div>
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded">ПРЕДИ</div>
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#c9953a]/90 text-white text-[10px] font-bold rounded">СЛЕД</div>
    </div>
  );
};

/* ---- Share Menu ---- */
const ShareMenu = ({ projectId, onClose }) => {
  const shareUrl = `${SITE_URL}/projects/${projectId}`;
  const shareText = '3D дизайн проект от TemaDom';
  const [copied, setCopied] = useState(false);
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); toast.success('Линкът е копиран!'); setTimeout(() => setCopied(false), 2000); };
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
            <Share2 className="h-4 w-4 text-[#c9953a]" /> Сподели проект
          </h4>
          <button onClick={onClose} style={{ color: 'var(--theme-text-muted)' }}><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2 mb-3">
          <Input value={shareUrl} readOnly className="text-xs flex-1" data-testid="share-url-input" />
          <Button size="sm" className="bg-[#c9953a] hover:bg-[#b8922e] text-white px-3" onClick={copyLink} data-testid="copy-link-btn">
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {links.map(l => (
            <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-xs font-medium hover:opacity-90"
              style={{ background: l.color }} data-testid={`share-${l.name.toLowerCase()}`}>
              <l.icon className="h-3.5 w-3.5" /> {l.name}
            </a>
          ))}
          <button onClick={copyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}>
            <Link2 className="h-3.5 w-3.5" /> Линк
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ---- Room Upload Card ---- */
const RoomUploadCard = ({ room, index, total, onUpdate, onRemove }) => {
  const refs = useRef([]);

  const handlePhoto = (pIdx, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Изберете снимка'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Макс. 10MB'); return; }
    const newPhotos = [...room.photos]; newPhotos[pIdx] = file;
    const newUrls = [...room.photoUrls]; if (newUrls[pIdx]) URL.revokeObjectURL(newUrls[pIdx]); newUrls[pIdx] = URL.createObjectURL(file);
    onUpdate({ ...room, photos: newPhotos, photoUrls: newUrls });
  };

  const removePhoto = (pIdx) => {
    if (room.photoUrls[pIdx]) URL.revokeObjectURL(room.photoUrls[pIdx]);
    const newPhotos = [...room.photos]; newPhotos[pIdx] = null;
    const newUrls = [...room.photoUrls]; newUrls[pIdx] = null;
    onUpdate({ ...room, photos: newPhotos, photoUrls: newUrls });
  };

  const roomTypeName = ROOM_TYPES.find(r => r.id === room.roomType)?.name || 'Помещение';

  return (
    <Card style={{ background: 'var(--theme-card-bg)', border: '2px solid var(--theme-border)' }}
      data-testid={`room-card-${index}`}>
      <CardContent className="p-4 space-y-3">
        {/* Room header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#c9953a]/15 flex items-center justify-center text-[#c9953a] text-sm font-black">{index + 1}</div>
            <span className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>
              {total > 1 ? `Стая ${index + 1}: ${roomTypeName}` : roomTypeName}
            </span>
          </div>
          {total > 1 && (
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-500/10"
              style={{ color: 'var(--theme-text-muted)' }} data-testid={`remove-room-${index}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Room type + Style */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Помещение</Label>
            <Select value={room.roomType} onValueChange={v => onUpdate({ ...room, roomType: v })}>
              <SelectTrigger className="h-9 text-xs" data-testid={`room-type-${index}`}><SelectValue /></SelectTrigger>
              <SelectContent>{ROOM_TYPES.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Стил</Label>
            <Select value={room.style} onValueChange={v => onUpdate({ ...room, style: v })}>
              <SelectTrigger className="h-9 text-xs" data-testid={`style-${index}`}><SelectValue /></SelectTrigger>
              <SelectContent>{STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* DIMENSIONS */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Ruler className="h-3.5 w-3.5 text-[#c9953a]" />
            <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>Размери на помещението</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Дължина (м)</Label>
              <Input type="number" step="0.1" min="1" max="20" value={room.length}
                onChange={e => onUpdate({ ...room, length: e.target.value })}
                className="h-9 text-xs text-center font-bold" data-testid={`length-${index}`} />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Ширина (м)</Label>
              <Input type="number" step="0.1" min="1" max="20" value={room.width}
                onChange={e => onUpdate({ ...room, width: e.target.value })}
                className="h-9 text-xs text-center font-bold" data-testid={`width-${index}`} />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Височина (м)</Label>
              <Input type="number" step="0.1" min="2" max="5" value={room.height}
                onChange={e => onUpdate({ ...room, height: e.target.value })}
                className="h-9 text-xs text-center font-bold" data-testid={`height-${index}`} />
            </div>
          </div>
        </div>

        {/* BUDGET INPUT */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[#c9953a] font-black text-sm">EUR</span>
            <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>Бюджет за материали и обзавеждане</span>
          </div>
          <p className="text-[10px] mb-2" style={{ color: 'var(--theme-text-subtle)' }}>
            Въведете вашия бюджет само за материали и обзавеждане (без труд/монтаж)
          </p>
          <div className="relative">
            <Input
              type="number"
              min="100"
              step="100"
              placeholder="Напр. 5000"
              value={room.budget}
              onChange={e => onUpdate({ ...room, budget: e.target.value })}
              className="h-11 text-sm font-bold pr-14"
              data-testid={`budget-input-${index}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#c9953a]">EUR</span>
          </div>
        </div>

        {/* Photo upload grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>Снимки на помещението</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PHOTO_LABELS.map((label, pIdx) => (
            <div key={pIdx}>
              <Label className="text-[10px] mb-1 block text-center" style={{ color: 'var(--theme-text-subtle)' }}>{label}</Label>
              {room.photoUrls[pIdx] ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden group border-2 border-[#10B981]/40">
                  <img src={room.photoUrls[pIdx]} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button onClick={() => removePhoto(pIdx)}
                    className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5"
                    data-testid={`remove-photo-${index}-${pIdx}`}>
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-[#10B981]/80 text-white text-center text-xs py-1 font-bold">
                    {label} — Качено
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <button onClick={() => refs.current[pIdx]?.click()}
                    className="w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-[#c9953a]/40 transition-colors"
                    style={{ borderColor: 'var(--theme-border)' }}
                    data-testid={`upload-photo-${index}-${pIdx}`}>
                    <Upload className="h-4 w-4" style={{ color: 'var(--theme-text-subtle)' }} />
                    <span className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>Галерия</span>
                  </button>
                  <button onClick={() => refs.current[pIdx + 10]?.click()}
                    className="w-full py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-colors hover:bg-[#c9953a]/10"
                    style={{ background: 'var(--theme-bg-surface)', color: '#c9953a', border: '1px solid var(--theme-border)' }}
                    data-testid={`capture-photo-${index}-${pIdx}`}>
                    <Camera className="h-3 w-3" />
                    Снимай
                  </button>
                </div>
              )}
              <input ref={el => refs.current[pIdx] = el} type="file" accept="image/*" className="hidden"
                onChange={e => { handlePhoto(pIdx, e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={el => refs.current[pIdx + 10] = el} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { handlePhoto(pIdx, e.target.files?.[0]); e.target.value = ''; }} />
            </div>
          ))}
          </div>
        </div>

        {/* Notes */}
        <Textarea value={room.notes} onChange={e => onUpdate({ ...room, notes: e.target.value })}
          placeholder="Бележки (по желание)..." className="min-h-[36px] text-xs"
          data-testid={`notes-${index}`} />
      </CardContent>
    </Card>
  );
};

/* ---- Image compression to <2MB ---- */
const compressImage = (file, maxSizeMB = 2) => {
  return new Promise((resolve) => {
    if (file.size <= maxSizeMB * 1024 * 1024) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.7;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', quality);
        };
        tryCompress();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/* ---- Retry with exponential backoff ---- */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 2000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`, err.message);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

/* ============ MAIN PAGE ============ */
export const AIDesignerPage = () => {
  const [pkg, setPkg] = useState(PACKAGES[0]);
  const [rooms, setRooms] = useState([emptyRoom()]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [results, setResults] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const timerRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (rooms.length > pkg.maxRooms) setRooms(prev => prev.slice(0, pkg.maxRooms));
  }, [pkg, rooms.length]);

  const addRoom = () => {
    if (rooms.length >= pkg.maxRooms) { toast.error(`Максимум ${pkg.maxRooms} помещения`); return; }
    setRooms(prev => [...prev, emptyRoom()]);
  };

  const updateRoom = (idx, room) => setRooms(prev => { const n = [...prev]; n[idx] = room; return n; });

  const removeRoom = (idx) => {
    if (rooms.length <= 1) return;
    rooms[idx].photoUrls.forEach(u => { if (u) URL.revokeObjectURL(u); });
    setRooms(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    const hasAnyPhotos = rooms.some(r => r.photos.some(p => p !== null));
    if (!hasAnyPhotos) { toast.error('Качете поне една снимка'); return; }
    const missingBudget = rooms.some(r => r.photos.some(p => p !== null) && (!r.budget || Number(r.budget) < 100));
    if (missingBudget) { toast.error('Въведете бюджет (мин. 100 EUR)'); return; }

    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    try {
      const allRoomResults = [];
      for (let ri = 0; ri < rooms.length; ri++) {
        const room = rooms[ri];
        if (!room.photos.some(p => p !== null)) continue;

        const fd = new FormData();
        // Compress photos to <2MB before upload
        for (let i = 0; i < room.photos.length; i++) {
          if (room.photos[i]) {
            const compressed = await compressImage(room.photos[i], 2);
            fd.append(`photo${i + 1}`, compressed);
          }
        }
        fd.append('style', room.style);
        fd.append('room_type', room.roomType);
        fd.append('notes', room.notes);
        fd.append('budget_eur', String(room.budget || '2500'));
        fd.append('width', room.length);
        fd.append('length', room.width);
        fd.append('height', room.height);
        if (token) fd.append('authorization', `Bearer ${token}`);

        // Retry with exponential backoff + 5 min timeout
        const res = await retryWithBackoff(async () => {
          return await axios.post(`${API}/ai-designer/photo-generate`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000, // 5 minutes
            onUploadProgress: (e) => { if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100)); },
          });
        }, 3, 2000);

        const roomName = ROOM_TYPES.find(r => r.id === room.roomType)?.name || 'Помещение';
        allRoomResults.push({
          roomIndex: ri,
          roomName,
          style: room.style,
          renders: res.data.renders || [],
          budget: res.data.budget || {},
          dimensions: { length: room.length, width: room.width, height: room.height },
          budgetEur: room.budget,
          id: res.data.id,
        });
        setUploadPct(0);
      }

      setResults({ rooms: allRoomResults });
      toast.success(`${allRoomResults.length} помещени${allRoomResults.length === 1 ? 'е' : 'я'} генерирани!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при генериране');
    }

    clearInterval(timerRef.current);
    setUploadPct(0);
    setLoading(false);
  };

  const reset = () => {
    rooms.forEach(r => r.photoUrls.forEach(u => { if (u) URL.revokeObjectURL(u); }));
    setRooms([emptyRoom()]);
    setResults(null);
    setElapsed(0);
    setShowShare(false);
  };

  const pct = Math.min(100, (elapsed / (rooms.length * 90)) * 100);

  return (
    <div className="min-h-screen py-6 px-3 md:px-6" style={{ background: 'var(--theme-bg)' }} data-testid="ai-designer-page">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Camera className="h-7 w-7 text-[#c9953a]" />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
              <span className="text-[#c9953a]">3D DESIGNER</span>
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Качи снимки + размери + бюджет → получи 3x PNG рендери
          </p>
        </div>

        {/* How it works info */}
        <div className="mb-6 p-4 rounded-xl border" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }} data-testid="designer-how-it-works">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#c9953a]/15 text-[#c9953a] text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
              <p><strong style={{ color: 'var(--theme-text)' }}>Качете снимки</strong> — 1-3 снимки от различни ъгли на помещението</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
              <p><strong style={{ color: 'var(--theme-text)' }}>Въведете размери</strong> — дължина, ширина и височина за точен мащаб</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
              <p><strong style={{ color: 'var(--theme-text)' }}>Изберете стил</strong> — модерен, скандинавски, лофт и още 7 стила</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold flex items-center justify-center flex-shrink-0">4</span>
              <p><strong style={{ color: 'var(--theme-text)' }}>Получете 3D дизайн</strong> — реалистичен рендер + бюджет с цени от 9 магазина</p>
            </div>
          </div>
        </div>

        {!results ? (
          <div className="space-y-4">

            {/* Package Selection */}
            <div className="grid grid-cols-3 gap-2" data-testid="package-selection">
              {PACKAGES.map(p => (
                <button key={p.id} onClick={() => setPkg(p)}
                  className={`p-4 rounded-xl text-center transition-all ${pkg.id === p.id ? 'scale-[1.03] shadow-lg' : 'hover:shadow-md'}`}
                  style={{
                    background: 'var(--theme-card-bg)',
                    border: `2px solid ${pkg.id === p.id ? '#c9953a' : 'var(--theme-border)'}`,
                    boxShadow: pkg.id === p.id ? '0 0 20px rgba(249,115,22,0.2)' : 'none'
                  }}
                  data-testid={`pkg-${p.id}`}>
                  <p className={`text-2xl font-black ${pkg.id === p.id ? 'text-[#c9953a]' : ''}`}
                    style={pkg.id !== p.id ? { color: 'var(--theme-text)' } : {}}>
                    {p.price}<span className="text-xs">EUR</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{p.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--theme-text-subtle)' }}>до {p.maxRooms} стаи</p>
                  {pkg.id === p.id && <div className="w-8 h-0.5 bg-[#c9953a] mx-auto mt-2 rounded-full" />}
                </button>
              ))}
            </div>

            {/* Rooms */}
            <div className="space-y-3" data-testid="rooms-list">
              {rooms.map((room, i) => (
                <RoomUploadCard key={room.id} room={room} index={i} total={rooms.length}
                  onUpdate={(r) => updateRoom(i, r)} onRemove={() => removeRoom(i)} />
              ))}
            </div>

            {/* Add Room button */}
            {rooms.length < pkg.maxRooms && (
              <button onClick={addRoom}
                className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 hover:border-[#c9953a]/40"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                data-testid="add-room-btn">
                <Plus className="h-5 w-5 text-[#c9953a]" />
                <span className="text-sm font-bold">Добави стая ({rooms.length}/{pkg.maxRooms})</span>
              </button>
            )}

            {/* Generate or Progress */}
            {loading ? (
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="py-8 px-6">
                  <div className="w-full" data-testid="progress-bar">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {pct < 20 ? 'Качване и анализ на снимките...' : pct < 45 ? 'AI обработва архитектурата на стаята...' : pct < 70 ? 'Генериране на 3D рендер (запазване на архитектурата 1:1)...' : pct < 90 ? 'Търсене на реални продукти от магазини...' : 'Финализиране на бюджета...'}
                    </span>
                      <span className="text-[#c9953a] font-black text-2xl">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                      <div className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9953a, #10B981)' }} />
                    </div>
                  </div>
                  {uploadPct > 0 && uploadPct < 100 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: 'var(--theme-text-muted)' }}>Качване...</span>
                        <span className="text-[#c9953a] font-bold">{uploadPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                        <div className="h-full bg-[#c9953a] rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-2 mt-6">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-[#c9953a]" />
                      <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                        {rooms.length > 1 ? `Генериране на ${rooms.filter(r => r.photos.some(p => p)).length} помещения...` : 'Генериране на 3D рендер...'}
                      </span>
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>
                        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] ml-2" style={{ color: 'var(--theme-text-muted)' }}>
                        Генериране...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Generate button */}
                <Button className="w-full h-16 text-lg font-black shadow-xl rounded-xl"
                  style={{
                    background: rooms.some(r => r.photos.some(p => p)) ? 'linear-gradient(135deg, #c9953a, #b8922e)' : 'var(--theme-bg-surface)',
                    color: rooms.some(r => r.photos.some(p => p)) ? 'white' : 'var(--theme-text-muted)',
                    boxShadow: rooms.some(r => r.photos.some(p => p)) ? '0 0 40px rgba(249,115,22,0.3)' : 'none',
                  }}
                  onClick={handleGenerate}
                  disabled={!rooms.some(r => r.photos.some(p => p))}
                  data-testid="generate-btn">
                  <Camera className="mr-3 h-6 w-6" />
                  ГЕНЕРИРАЙ 3D — {pkg.price} EUR
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-5" data-testid="results-section">
            {results.rooms.map((roomResult, ri) => (
              <div key={ri} className="space-y-3" data-testid={`result-room-${ri}`}>
                {/* Room header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-[#c9953a]/15 flex items-center justify-center text-[#c9953a] text-sm font-black">{ri + 1}</div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>{roomResult.roomName}</h3>
                  <Badge className="bg-[#10B981]/15 text-[#10B981] text-[10px]">{roomResult.renders.length} PNG</Badge>
                  {roomResult.dimensions && (
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)' }}>
                      {roomResult.dimensions.length}x{roomResult.dimensions.width}x{roomResult.dimensions.height} м
                    </span>
                  )}
                  {roomResult.budgetEur && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(249,115,22,0.1)', color: '#c9953a' }}>
                      {Number(roomResult.budgetEur).toLocaleString()} EUR
                    </span>
                  )}
                </div>

                {/* Renders as PNG */}
                <div className={`grid gap-3 ${roomResult.renders.length === 1 ? 'grid-cols-1' : roomResult.renders.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}
                  data-testid={`renders-grid-${ri}`}>
                  {roomResult.renders.map((r, i) => {
                    const afterImg = `data:image/png;base64,${r.image_base64}`;
                    const beforeImg = r.original_base64 ? `data:image/jpeg;base64,${r.original_base64}` : null;
                    return (
                      <Card key={i} className="overflow-hidden" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}
                        data-testid={`render-card-${ri}-${i}`}>
                        <CardContent className="p-0">
                          {beforeImg ? (
                            <BeforeAfterSlider before={beforeImg} after={afterImg} label={r.label} />
                          ) : (
                            <div className="relative aspect-video">
                              <img src={afterImg} alt={r.label} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>{r.label}</span>
                            <div className="flex gap-1">
                              <button onClick={() => {
                                const a = document.createElement('a');
                                a.href = afterImg;
                                a.download = `temadom-3d-${roomResult.roomName}-${i + 1}.png`;
                                a.click();
                                toast.success('PNG изтеглено!');
                              }}
                                className="p-1.5 rounded-lg hover:bg-[#c9953a]/10"
                                style={{ color: 'var(--theme-text-muted)' }}
                                data-testid={`download-render-${ri}-${i}`}>
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => {
                                const win = window.open('', '_blank');
                                win.document.write(`<html><head><title>TemaDom 3D</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${afterImg}" /></body></html>`);
                              }}
                                className="p-1.5 rounded-lg hover:bg-[#c9953a]/10"
                                style={{ color: 'var(--theme-text-muted)' }}
                                data-testid={`fullscreen-render-${ri}-${i}`}>
                                <Maximize2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Budget info + Materials with links */}
                {roomResult.budget && (
                  <div className="space-y-3" data-testid={`budget-info-${ri}`}>
                    {/* Summary */}
                    {roomResult.budget.summary && (
                      <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                        <p className="font-bold mb-1" style={{ color: 'var(--theme-text)' }}>Бюджет за материали: {Number(roomResult.budgetEur).toLocaleString()} EUR</p>
                        <p>{roomResult.budget.summary}</p>
                        {roomResult.budget.labor_estimate_eur > 0 && (
                          <p className="mt-1 text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>
                            Приблизителна цена за труд: {roomResult.budget.labor_estimate_eur.toLocaleString()} EUR (не е включена в бюджета)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Budget Tiers with Materials */}
                    {roomResult.budget.budget_tiers && roomResult.budget.budget_tiers.length > 0 && (
                      <div className="space-y-3">
                        {roomResult.budget.budget_tiers.map((tier, ti) => (
                          <Card key={ti} className="overflow-hidden" style={{ background: 'var(--theme-card-bg)', border: `2px solid ${ti === 1 ? '#c9953a' : 'var(--theme-border)'}` }}
                            data-testid={`budget-tier-${ri}-${ti}`}>
                            <CardContent className="p-0">
                              {/* Tier header */}
                              <div className="flex items-center justify-between px-4 py-3" style={{
                                background: ti === 0 ? 'rgba(16,185,129,0.08)' : ti === 1 ? 'rgba(249,115,22,0.08)' : 'rgba(139,92,246,0.08)'
                              }}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black" style={{
                                    color: ti === 0 ? '#10B981' : ti === 1 ? '#c9953a' : '#8B5CF6'
                                  }}>
                                    {tier.tier_name || tier.tier}
                                  </span>
                                  {ti === 1 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#c9953a] text-white font-bold">Препоръчан</span>
                                  )}
                                  {tier.materials && tier.materials.some(m => m.verified) && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold"
                                      data-testid={`verified-count-${ri}-${ti}`}>
                                      {tier.materials.filter(m => m.verified).length} реални продукта
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-black" style={{
                                  color: ti === 0 ? '#10B981' : ti === 1 ? '#c9953a' : '#8B5CF6'
                                }}>
                                  {tier.total_eur?.toLocaleString()} EUR
                                </span>
                              </div>

                              {/* Materials list */}
                              {tier.materials && tier.materials.length > 0 && (
                                <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                                  {tier.materials.map((mat, mi) => (
                                    <div key={mi} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#c9953a]/5 transition-colors"
                                      data-testid={`material-${ri}-${ti}-${mi}`}>
                                      <div className="flex-1 min-w-0 mr-3">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-xs font-bold truncate" style={{ color: 'var(--theme-text)' }}>{mat.name}</p>
                                          {mat.verified && (
                                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700"
                                              data-testid={`verified-badge-${ri}-${ti}-${mi}`}>
                                              <CheckCircle className="h-2.5 w-2.5" /> Реален
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {mat.category && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text-subtle)' }}>
                                              {mat.category}
                                            </span>
                                          )}
                                          {mat.quantity && (
                                            <span className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>{mat.quantity}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs font-black text-[#c9953a]">{mat.price_eur} EUR</span>
                                        {mat.product_url && mat.product_url.startsWith('http') ? (
                                          <a href={mat.product_url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:opacity-90 transition-all hover:scale-105"
                                            style={{ background: mat.verified ? '#059669' : (ti === 0 ? '#10B981' : ti === 1 ? '#c9953a' : '#8B5CF6') }}
                                            data-testid={`material-link-${ri}-${ti}-${mi}`}>
                                            <ExternalLink className="h-2.5 w-2.5" /> {mat.verified ? `Купи от ${mat.store || 'Магазин'}` : `Търси в ${mat.store || 'Магазин'}`}
                                          </a>
                                        ) : mat.store ? (
                                          <span className="text-[10px] px-2 py-1 rounded-md font-bold" style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)' }}>
                                            {mat.store}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Share */}
            {showShare && results.rooms[0]?.id && (
              <ShareMenu projectId={results.rooms[0].id} onClose={() => setShowShare(false)} />
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center" data-testid="result-actions">
              <Button className="h-12 px-8 bg-[#c9953a] hover:bg-[#b8922e] text-white font-bold"
                onClick={() => setShowShare(!showShare)} data-testid="share-btn">
                <Share2 className="mr-2 h-4 w-4" /> Сподели
              </Button>
              <Button className="h-12 px-8 font-bold"
                style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
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
