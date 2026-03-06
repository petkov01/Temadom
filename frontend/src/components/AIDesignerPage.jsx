import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, Upload, CheckCircle, Share2, RotateCcw,
  Copy, Facebook, Twitter, MessageCircle, Mail, Link2, Phone, ArrowLeft, ArrowRight,
  Plus, Trash2 } from 'lucide-react';
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
  { id: 2, label: '2 помещения', price: 129, maxRooms: 2 },
  { id: 3, label: 'Апартамент', price: 199, maxRooms: 5 },
];

const PHOTO_LABELS = ['Общ план', 'Ъгъл 1', 'Ъгъл 2'];

const emptyRoom = () => ({
  id: Date.now() + Math.random(),
  roomType: 'living_room',
  style: 'modern',
  photos: [null, null, null],
  photoUrls: [null, null, null],
  notes: '',
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
    <div ref={ref} className="relative w-full aspect-video rounded-xl overflow-hidden cursor-col-resize select-none"
      style={{ border: '1px solid var(--theme-border)' }}
      onMouseMove={(e) => e.buttons && handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      data-testid="before-after-slider">
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="w-full h-full object-cover"
          style={{ width: `${(100 * 100) / Math.max(pos, 1)}%`, maxWidth: 'none' }} draggable={false} />
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

/* ---- Share Menu ---- */
const ShareMenu = ({ projectId, onClose }) => {
  const shareUrl = `${SITE_URL}/projects/${projectId}`;
  const shareText = '3D дизайн проект от TemaDom';
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Линкът е копиран!');
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex gap-2 mb-3">
          <Input value={shareUrl} readOnly className="text-xs flex-1" data-testid="share-url-input" />
          <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white px-3" onClick={copyLink} data-testid="copy-link-btn">
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
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
          <Button variant="outline" className="w-full text-xs mt-2" onClick={() => navigator.share({ title: 'TemaDom 3D', url: shareUrl, text: shareText })} data-testid="share-native">
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Още...
          </Button>
        )}
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
      <CardContent className="p-4">
        {/* Room header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F97316]/15 flex items-center justify-center text-[#F97316] text-sm font-black">{index + 1}</div>
            <span className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>
              {total > 1 ? `Стая ${index + 1}: ${roomTypeName}` : roomTypeName}
            </span>
          </div>
          {total > 1 && (
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              style={{ color: 'var(--theme-text-muted)' }} data-testid={`remove-room-${index}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Room type + Style selectors */}
        <div className="grid grid-cols-2 gap-2 mb-3">
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

        {/* 3 Photo slots */}
        <div className="grid grid-cols-3 gap-2" data-testid={`photo-grid-${index}`}>
          {[0, 1, 2].map(pIdx => (
            <div key={pIdx}>
              <Label className="text-[9px] mb-0.5 block font-bold" style={{ color: 'var(--theme-text-subtle)' }}>
                {PHOTO_LABELS[pIdx]} {pIdx === 0 && <span className="text-red-400">*</span>}
              </Label>
              {!room.photos[pIdx] ? (
                <div className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#F97316]/40"
                  style={{ background: 'var(--theme-card-bg)', border: '2px dashed var(--theme-border)' }}
                  onDrop={(e) => { e.preventDefault(); handlePhoto(pIdx, e.dataTransfer.files?.[0]); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => refs.current[pIdx]?.click()}
                  data-testid={`photo-drop-${index}-${pIdx}`}>
                  <input ref={el => refs.current[pIdx] = el} type="file" accept="image/*"
                    capture="environment" className="hidden"
                    onChange={e => handlePhoto(pIdx, e.target.files?.[0])} />
                  <Upload className="h-5 w-5 text-[#F97316] mb-0.5" />
                  <p className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>Качи</p>
                </div>
              ) : (
                <div className="relative aspect-square rounded-lg overflow-hidden" style={{ border: '2px solid #10B981' }}>
                  <img src={room.photoUrls[pIdx]} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(pIdx)}
                    className="absolute top-0.5 right-0.5 bg-red-500/90 text-white rounded-full p-0.5"
                    data-testid={`remove-photo-${index}-${pIdx}`}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                  <div className="absolute bottom-0.5 left-0.5 bg-[#10B981] text-white text-[8px] font-bold px-1 py-0.5 rounded">
                    <CheckCircle className="h-2 w-2 inline mr-0.5" />{PHOTO_LABELS[pIdx]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-2">
          <Textarea value={room.notes} onChange={e => onUpdate({ ...room, notes: e.target.value })}
            placeholder="Бележки (по желание)..." className="min-h-[36px] text-xs"
            data-testid={`notes-${index}`} />
        </div>
      </CardContent>
    </Card>
  );
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

  // Sync rooms count with package
  useEffect(() => {
    if (rooms.length < pkg.maxRooms && pkg.maxRooms > 1 && rooms.length === 1) {
      // Don't auto-add, let user add manually
    }
    // Trim rooms if package downgraded
    if (rooms.length > pkg.maxRooms) {
      setRooms(prev => prev.slice(0, pkg.maxRooms));
    }
  }, [pkg, rooms.length]);

  const addRoom = () => {
    if (rooms.length >= pkg.maxRooms) { toast.error(`Максимум ${pkg.maxRooms} помещения за този пакет`); return; }
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

    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    try {
      // Generate for each room sequentially
      const allRoomResults = [];
      for (let ri = 0; ri < rooms.length; ri++) {
        const room = rooms[ri];
        const hasPhotos = room.photos.some(p => p !== null);
        if (!hasPhotos) continue;

        const fd = new FormData();
        room.photos.forEach((p, i) => { if (p) fd.append(`photo${i + 1}`, p); });
        fd.append('style', room.style);
        fd.append('room_type', room.roomType);
        fd.append('notes', room.notes);
        fd.append('budget_eur', '0');
        if (token) fd.append('authorization', `Bearer ${token}`);

        const res = await axios.post(`${API}/ai-designer/photo-generate`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600000,
          onUploadProgress: (e) => { if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100)); },
        });

        const roomName = ROOM_TYPES.find(r => r.id === room.roomType)?.name || 'Помещение';
        allRoomResults.push({
          roomIndex: ri,
          roomName,
          style: room.style,
          renders: res.data.renders || [],
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
            <Camera className="h-7 w-7 text-[#F97316]" />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
              TEMADOM <span className="text-[#F97316]">3D DESIGNER</span>
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Качи снимки → получи реалистични 3D рендери
          </p>
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
                    border: `2px solid ${pkg.id === p.id ? '#F97316' : 'var(--theme-border)'}`,
                    boxShadow: pkg.id === p.id ? '0 0 20px rgba(249,115,22,0.2)' : 'none'
                  }}
                  data-testid={`pkg-${p.id}`}>
                  <p className={`text-2xl font-black ${pkg.id === p.id ? 'text-[#F97316]' : ''}`}
                    style={pkg.id !== p.id ? { color: 'var(--theme-text)' } : {}}>
                    {p.price}<span className="text-xs">EUR</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{p.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--theme-text-subtle)' }}>до {p.maxRooms} стаи</p>
                  {pkg.id === p.id && <div className="w-8 h-0.5 bg-[#F97316] mx-auto mt-2 rounded-full" />}
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
                className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:border-[#F97316]/40"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                data-testid="add-room-btn">
                <Plus className="h-5 w-5 text-[#F97316]" />
                <span className="text-sm font-bold">Добави стая ({rooms.length}/{pkg.maxRooms})</span>
              </button>
            )}

            {/* Generate or Progress */}
            {loading ? (
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="py-8 px-6">
                  <div className="w-full" data-testid="progress-bar">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>AI генерира 3D рендери...</span>
                      <span className="text-[#F97316] font-black text-2xl">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                      <div className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #10B981)' }} />
                    </div>
                  </div>
                  {uploadPct > 0 && uploadPct < 100 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: 'var(--theme-text-muted)' }}>Качване...</span>
                        <span className="text-[#F97316] font-bold">{uploadPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                        <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
                    <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      {rooms.length > 1 ? `Генериране на ${rooms.filter(r => r.photos.some(p => p)).length} помещения...` : 'Генериране на 3D рендери...'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button className="w-full h-16 text-lg font-black shadow-xl rounded-xl"
                style={{
                  background: rooms.some(r => r.photos.some(p => p)) ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'var(--theme-bg-surface)',
                  color: rooms.some(r => r.photos.some(p => p)) ? 'white' : 'var(--theme-text-muted)',
                  boxShadow: rooms.some(r => r.photos.some(p => p)) ? '0 0 40px rgba(249,115,22,0.3)' : 'none',
                }}
                onClick={handleGenerate}
                disabled={!rooms.some(r => r.photos.some(p => p))}
                data-testid="generate-btn">
                <Camera className="mr-3 h-6 w-6" />
                ГЕНЕРИРАЙ 3D — {pkg.price} EUR
              </Button>
            )}
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-5" data-testid="results-section">

            {results.rooms.map((roomResult, ri) => (
              <div key={ri} className="space-y-3" data-testid={`result-room-${ri}`}>
                {/* Room header */}
                {results.rooms.length > 1 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/15 flex items-center justify-center text-[#F97316] text-sm font-black">{ri + 1}</div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>{roomResult.roomName}</h3>
                    <Badge className="bg-[#10B981]/15 text-[#10B981] text-[10px]">{roomResult.renders.length} рендера</Badge>
                  </div>
                )}

                {/* Renders */}
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
                          <div className="px-3 py-2 text-center">
                            <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>{r.label}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Share */}
            {showShare && results.rooms[0]?.id && (
              <ShareMenu projectId={results.rooms[0].id} onClose={() => setShowShare(false)} />
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center" data-testid="result-actions">
              <Button className="h-12 px-8 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold"
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
