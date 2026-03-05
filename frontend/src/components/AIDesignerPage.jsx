import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Loader2, X, Download, ArrowLeft, ArrowRight, Plus, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ROOM_TYPES = [
  { id: 'bathroom', name: 'Баня' }, { id: 'kitchen', name: 'Кухня' },
  { id: 'living_room', name: 'Хол' }, { id: 'bedroom', name: 'Спалня' },
  { id: 'corridor', name: 'Коридор' }, { id: 'balcony', name: 'Балкон' },
  { id: 'stairs', name: 'Стълбище' }, { id: 'facade', name: 'Фасада' },
  { id: 'other', name: 'Друго' },
];

const STYLES = [
  { id: 'modern', name: 'Модерен', color: '#F97316' },
  { id: 'scandinavian', name: 'Сканди', color: '#3B82F6' },
  { id: 'loft', name: 'Лофт', color: '#78716C' },
  { id: 'classic', name: 'Класика', color: '#D97706' },
  { id: 'minimalist', name: 'Минимал', color: '#6B7280' },
  { id: 'boho', name: 'Бохо', color: '#EC4899' },
  { id: 'industrial', name: 'Индустр.', color: '#374151' },
  { id: 'artdeco', name: 'Арт Деко', color: '#A855F7' },
  { id: 'rustic', name: 'Рустик', color: '#92400E' },
  { id: 'hitech', name: 'Хай-тек', color: '#06B6D4' },
];

const PLANS = [
  { id: 1, label: '1 помещение', price: 69, maxRooms: 1, color: '#F97316' },
  { id: 2, label: '2-3 помещения', price: 129, maxRooms: 3, color: '#10B981' },
  { id: 3, label: '4-5 помещения', price: 220, maxRooms: 5, color: '#8B5CF6' },
];

const EMPTY_ROOM = () => ({ photos: [null, null, null, null], previews: [null, null, null, null], roomType: 'bathroom' });

const ProgressBar = ({ elapsed, total }) => {
  const pct = Math.min(100, (elapsed / total) * 100);
  return (
    <div className="w-full" data-testid="progress-bar">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>AI генерира проекта...</span>
        <span className="text-[#F97316] font-bold">{Math.round(pct)}%</span>
      </div>
      <div className="h-2.5 bg-[#1E2A38] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#F97316] to-[#10B981] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// Compress image to max 1MB for API
function compressImage(dataUrl, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
  });
}

// Before/After slider
const BeforeAfterSlider = ({ before, after }) => {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const handleMove = useCallback((clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);
  return (
    <div ref={ref} className="relative w-full aspect-video rounded-lg overflow-hidden cursor-col-resize select-none"
      onMouseMove={e => e.buttons && handleMove(e.clientX)}
      onTouchMove={e => handleMove(e.touches[0].clientX)} data-testid="before-after-slider">
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="w-full h-full object-cover" style={{ width: `${100 * 100 / pos}%`, maxWidth: 'none' }} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
        <div className="w-0.5 h-full bg-white shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ArrowLeft className="h-3 w-3 text-slate-700" /><ArrowRight className="h-3 w-3 text-slate-700" />
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">ПРЕДИ</div>
      <div className="absolute top-2 right-2 bg-[#F97316]/80 text-white text-[10px] px-2 py-0.5 rounded">СЛЕД</div>
    </div>
  );
};

// Room upload card (4 photos per room)
const RoomCard = ({ room, roomIndex, totalRooms, onUpdatePhoto, onUpdateType, onRemove }) => (
  <Card className="bg-[#253545] border-[#3A4A5C]" data-testid={`room-card-${roomIndex}`}>
    <CardHeader className="pb-2 pt-3 px-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-white text-sm">Помещение {roomIndex + 1}</CardTitle>
        {totalRooms > 1 && (
          <button onClick={() => onRemove(roomIndex)} className="text-red-400 hover:text-red-300" data-testid={`remove-room-${roomIndex}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {/* Room type */}
      <div className="flex flex-wrap gap-1 mb-3">
        {ROOM_TYPES.map(rt => (
          <button key={rt.id} onClick={() => onUpdateType(roomIndex, rt.id)}
            className={`text-[10px] px-2 py-1 rounded border transition-all ${
              room.roomType === rt.id ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]' : 'border-[#3A4A5C] text-slate-400 hover:border-[#F97316]/30'
            }`} data-testid={`room-${roomIndex}-type-${rt.id}`}>
            {rt.name}
          </button>
        ))}
      </div>
      {/* 4 photo upload slots */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map(pi => (
          <div key={pi}>
            <input type="file" accept="image/*" className="hidden" id={`photo-${roomIndex}-${pi}`}
              onChange={e => onUpdatePhoto(roomIndex, pi, e)} data-testid={`photo-input-${roomIndex}-${pi}`} />
            {room.previews[pi] ? (
              <div className="relative group aspect-square rounded-lg overflow-hidden border border-[#F97316]/30">
                <img src={room.previews[pi]} alt="" className="w-full h-full object-cover" />
                <button onClick={() => onUpdatePhoto(roomIndex, pi, null)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-2.5 w-2.5" />
                </button>
                <div className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[8px] px-1 rounded">#{pi + 1}</div>
              </div>
            ) : (
              <label htmlFor={`photo-${roomIndex}-${pi}`}
                className="aspect-square w-full rounded-lg border-2 border-dashed border-[#3A4A5C] hover:border-[#F97316]/40 flex flex-col items-center justify-center gap-0.5 bg-[#1E2A38]/50 cursor-pointer transition-colors"
                data-testid={`photo-upload-${roomIndex}-${pi}`}>
                <Camera className="h-4 w-4 text-slate-600" />
                <span className="text-slate-600 text-[8px]">#{pi + 1}</span>
              </label>
            )}
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-[9px] mt-1.5">4 снимки от различни ъгли за по-добра визуализация</p>
    </CardContent>
  </Card>
);

export const AIDesignerPage = () => {
  const [plan, setPlan] = useState(PLANS[0]);
  const [rooms, setRooms] = useState([EMPTY_ROOM()]);
  const [style, setStyle] = useState('modern');
  const [renovationText, setRenovationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [activeAngle, setActiveAngle] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // When plan changes, adjust rooms count
  useEffect(() => {
    setRooms(prev => {
      if (prev.length > plan.maxRooms) return prev.slice(0, plan.maxRooms);
      return prev;
    });
  }, [plan]);

  const updatePhoto = useCallback(async (roomIdx, photoIdx, e) => {
    if (e === null) {
      setRooms(prev => prev.map((r, ri) => {
        if (ri !== roomIdx) return r;
        const photos = [...r.photos]; photos[photoIdx] = null;
        const previews = [...r.previews]; previews[photoIdx] = null;
        return { ...r, photos, previews };
      }));
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15e6) { toast.error('Макс. 15MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result);
      setRooms(prev => prev.map((r, ri) => {
        if (ri !== roomIdx) return r;
        const photos = [...r.photos]; photos[photoIdx] = compressed;
        const previews = [...r.previews]; previews[photoIdx] = ev.target.result;
        return { ...r, photos, previews };
      }));
      toast.success(`Снимка ${photoIdx + 1} качена`);
    };
    reader.readAsDataURL(file);
  }, []);

  const updateRoomType = (roomIdx, type) => {
    setRooms(prev => prev.map((r, i) => i === roomIdx ? { ...r, roomType: type } : r));
  };

  const addRoom = () => {
    if (rooms.length >= plan.maxRooms) { toast.error(`Макс. ${plan.maxRooms} помещения за ${plan.label}`); return; }
    setRooms(prev => [...prev, EMPTY_ROOM()]);
  };

  const removeRoom = (idx) => {
    if (rooms.length <= 1) return;
    setRooms(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    const allPhotos = rooms.flatMap(r => r.photos.filter(Boolean));
    if (!allPhotos.length) { toast.error('Качете поне 1 снимка'); return; }
    if (!renovationText.trim()) { toast.error('Опишете желания ремонт'); return; }

    setLoading(true); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    try {
      const res = await axios.post(`${API}/ai-designer/generate`, {
        images: allPhotos,
        room_type: rooms[0].roomType,
        style,
        material_class: 'standard',
        renovation_text: renovationText,
        notes: renovationText,
        variants: rooms.length,
        width: '2', length: '4', height: '2.6',
        rooms: rooms.map(r => ({ room_type: r.roomType, photo_count: r.photos.filter(Boolean).length })),
      }, { timeout: 600000 });
      setResults(res.data);
      setActiveVariant(0); setActiveAngle(0);
      toast.success('Проект генериран!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при генериране');
    }
    clearInterval(timerRef.current); setLoading(false);
  };

  const reset = () => { setRooms([EMPTY_ROOM()]); setResults(null); setRenovationText(''); setElapsed(0); setActiveVariant(0); setActiveAngle(0); };

  const totalPhotos = rooms.reduce((sum, r) => sum + r.photos.filter(Boolean).length, 0);
  const currentVariant = results?.generated_images?.[activeVariant];
  const angles = currentVariant?.angles || [];
  const totalVariants = results?.generated_images?.length || 0;

  return (
    <div className="min-h-screen bg-[#1E2A38] py-4 px-2 md:px-4" data-testid="ia-designer-page">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">IA Дизайн на помещения</h1>
          <p className="text-slate-500 text-sm">Реалистичен 1:1 ремонтиран проект от вашите снимки</p>
        </div>

        {!results ? (
          <div className="space-y-4">
            {/* Plan selector */}
            <div className="flex gap-3 justify-center" data-testid="plan-selector">
              {PLANS.map(p => (
                <button key={p.id} onClick={() => setPlan(p)}
                  className={`rounded-xl px-5 py-3 border-2 text-center transition-all hover:scale-105 ${
                    plan.id === p.id ? 'scale-105 shadow-lg' : 'opacity-70'
                  }`}
                  style={{ borderColor: plan.id === p.id ? p.color : '#334155', background: plan.id === p.id ? `${p.color}15` : '#1E293B' }}
                  data-testid={`plan-${p.id}`}>
                  <p className="text-white text-sm font-bold">{p.label}</p>
                  <p className="text-2xl font-black mt-0.5" style={{ color: p.color }}>{p.price} EUR</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">до {p.maxRooms * 4} снимки</p>
                </button>
              ))}
            </div>

            {/* Rooms */}
            <div className="space-y-3">
              {rooms.map((room, i) => (
                <RoomCard key={i} room={room} roomIndex={i} totalRooms={rooms.length}
                  onUpdatePhoto={updatePhoto} onUpdateType={updateRoomType} onRemove={removeRoom} />
              ))}
              {rooms.length < plan.maxRooms && (
                <button onClick={addRoom} data-testid="add-room-btn"
                  className="w-full rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#F97316]/40 p-4 text-center transition-colors">
                  <Plus className="h-5 w-5 mx-auto text-slate-500 mb-1" />
                  <span className="text-slate-500 text-sm">Добави помещение ({rooms.length}/{plan.maxRooms})</span>
                </button>
              )}
            </div>

            {/* Style + Description */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Стил</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4" data-testid="style-selector">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        style === s.id ? 'ring-2 scale-105' : 'opacity-60 hover:opacity-80'
                      }`}
                      style={style === s.id ? { borderColor: s.color, background: `${s.color}15`, ringColor: s.color } : { borderColor: '#3A4A5C' }}
                      data-testid={`style-${s.id}`}>
                      <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ background: `${s.color}35` }} />
                      <span className="text-[9px] font-medium block truncate" style={{ color: style === s.id ? s.color : '#94A3B8' }}>{s.name}</span>
                    </button>
                  ))}
                </div>
                <Textarea value={renovationText} onChange={e => setRenovationText(e.target.value)}
                  placeholder="Опишете желания ремонт: нов под, стени, мебели, осветление..."
                  className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[80px] text-sm" data-testid="renovation-text" />
              </CardContent>
            </Card>

            {/* Generate */}
            {loading ? (
              <div className="space-y-4 py-4">
                <ProgressBar elapsed={elapsed} total={60 * rooms.length} />
                <div className="flex items-center justify-center gap-3 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
                  <span>{rooms.length} помещения x 4 ъгъла...</span>
                </div>
              </div>
            ) : (
              <Button className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white text-lg h-14 shadow-lg shadow-[#F97316]/20"
                onClick={handleGenerate} disabled={!totalPhotos || !renovationText.trim()} data-testid="generate-btn">
                <Camera className="mr-2 h-5 w-5" /> Генерирай проект ({plan.price} EUR) — {totalPhotos} снимки
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Variant tabs */}
            {totalVariants > 1 && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardContent className="pt-4 pb-3">
                  <p className="text-slate-400 text-xs mb-2">Варианти:</p>
                  <div className="flex gap-2" data-testid="variant-tabs">
                    {results.generated_images.map((_, i) => (
                      <button key={i} onClick={() => { setActiveVariant(i); setActiveAngle(0); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeVariant === i ? 'bg-[#F97316] text-white' : 'bg-[#1E2A38] text-slate-400 hover:text-white border border-[#3A4A5C]'
                        }`} data-testid={`variant-tab-${i}`}>
                        Вариант {i + 1}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Before / After */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#F97316]" /> Резултат
                </CardTitle>
              </CardHeader>
              <CardContent>
                {angles.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto">
                    {angles.map((a, i) => (
                      <button key={i} onClick={() => setActiveAngle(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                          activeAngle === i ? 'bg-[#F97316] text-white' : 'bg-[#1E2A38] text-slate-400 border border-[#3A4A5C]'
                        }`}>{a.label || `Ъгъл ${i + 1}`}</button>
                    ))}
                  </div>
                )}
                {(() => {
                  const afterImg = angles[activeAngle]
                    ? `data:image/png;base64,${angles[activeAngle].image_base64}`
                    : currentVariant?.image_base64
                      ? `data:image/png;base64,${currentVariant.image_base64}`
                      : null;
                  const beforeImg = rooms[0]?.previews?.find(Boolean);
                  if (!afterImg) return <p className="text-slate-500 text-center py-8">Няма генерирано изображение</p>;
                  if (beforeImg) return <BeforeAfterSlider before={beforeImg} after={afterImg} />;
                  return <img src={afterImg} alt="Renovation" className="w-full rounded-lg" />;
                })()}
                {angles[activeAngle]?.image_base64 && (
                  <Button className="mt-3 w-full bg-[#10B981] text-white" onClick={() => {
                    const b64 = angles[activeAngle].image_base64;
                    const link = document.createElement('a'); link.href = `data:image/png;base64,${b64}`;
                    link.download = `temadom-${activeAngle + 1}.png`; link.click();
                  }} data-testid="download-render-btn">
                  <Download className="mr-2 h-4 w-4" /> Изтегли рендер
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button className="bg-[#F97316] text-white" onClick={reset} data-testid="new-project-btn">Нов проект</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
