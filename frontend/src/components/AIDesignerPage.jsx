import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Loader2, X, Download, ArrowLeft, ArrowRight, Ruler, FileText, Upload, Plus, Minus } from 'lucide-react';
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

const ROOM_TYPES = [
  { id: 'bathroom', name: 'Баня' }, { id: 'kitchen', name: 'Кухня' },
  { id: 'living_room', name: 'Хол' }, { id: 'bedroom', name: 'Спалня' },
  { id: 'corridor', name: 'Коридор' }, { id: 'balcony', name: 'Балкон' },
  { id: 'stairs', name: 'Стълбище' }, { id: 'facade', name: 'Фасада' },
  { id: 'other', name: 'Друго' },
];

const STYLES = [
  { id: 'modern', name: 'Модерен' }, { id: 'scandinavian', name: 'Скандинавски' },
  { id: 'loft', name: 'Лофт' }, { id: 'classic', name: 'Класика' },
  { id: 'minimalist', name: 'Минималистичен' }, { id: 'boho', name: 'Бохо' },
  { id: 'industrial', name: 'Индустриален' }, { id: 'artdeco', name: 'Арт Деко' },
  { id: 'rustic', name: 'Рустик' }, { id: 'hitech', name: 'Хай-тек' },
];

const PACKAGES = [
  { id: 1, rooms: '1', label: '1 помещение', price: 69 },
  { id: 2, rooms: '2-3', label: '2-3 помещения', price: 129 },
  { id: 3, rooms: '4-5', label: '4-5 помещения', price: 220 },
];

const emptyRoom = () => ({
  videoFile: null, videoUrl: null, width: '4', length: '5', height: '2.6',
  style: 'modern', roomType: 'living_room', notes: '',
});

const ProgressBar = ({ elapsed, total }) => {
  const pct = Math.min(100, (elapsed / total) * 100);
  return (
    <div className="w-full" data-testid="progress-bar">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-400">AI обработва видеото...</span>
        <span className="text-[#F97316] font-bold text-base">{Math.round(pct)}%</span>
      </div>
      <div className="h-3 bg-[#1E2A38] rounded-full overflow-hidden border border-[#2A3A4C]">
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #10B981)' }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>0%</span><span>Видео → 360° → 3D ремонт</span><span>100%</span>
      </div>
    </div>
  );
};

const BeforeAfterSlider = ({ before, after }) => {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const handleMove = useCallback((clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);
  return (
    <div ref={ref} className="relative w-full aspect-video rounded-xl overflow-hidden cursor-col-resize select-none border border-[#2A3A4C]"
      onMouseMove={(e) => e.buttons && handleMove(e.clientX)} onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      data-testid="before-after-slider">
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="w-full h-full object-cover" style={{ width: `${(100 * 100) / pos}%`, maxWidth: 'none' }} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
        <div className="w-0.5 h-full bg-white shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <ArrowLeft className="h-3.5 w-3.5 text-slate-700" /><ArrowRight className="h-3.5 w-3.5 text-slate-700" />
        </div>
      </div>
      <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-sm">ПРЕДИ</div>
      <div className="absolute top-3 right-3 bg-[#F97316]/90 text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-sm">СЛЕД</div>
    </div>
  );
};

export const AIDesignerPage = () => {
  const [pkg, setPkg] = useState(PACKAGES[0]);
  const [rooms, setRooms] = useState([emptyRoom()]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState(null);
  const [activeRoom, setActiveRoom] = useState(0);
  const [activeAngle, setActiveAngle] = useState(0);
  const timerRef = useRef(null);
  const fileInputRefs = useRef([]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const maxRooms = pkg.id === 1 ? 1 : pkg.id === 2 ? 3 : 5;

  const selectPackage = (p) => {
    setPkg(p);
    const max = p.id === 1 ? 1 : p.id === 2 ? 3 : 5;
    setRooms(prev => {
      if (prev.length > max) return prev.slice(0, max);
      return prev;
    });
  };

  const addRoom = () => {
    if (rooms.length >= maxRooms) { toast.error(`Максимум ${maxRooms} помещения за пакет "${pkg.label}"`); return; }
    setRooms(p => [...p, emptyRoom()]);
  };

  const removeRoom = (idx) => {
    if (rooms.length <= 1) return;
    setRooms(p => p.filter((_, i) => i !== idx));
    if (activeRoom >= rooms.length - 1) setActiveRoom(Math.max(0, rooms.length - 2));
  };

  const updateRoom = (idx, key, val) => {
    setRooms(p => p.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const handleVideoSelect = (idx, file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('Моля, изберете видео файл'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('Макс. 100MB'); return; }
    updateRoom(idx, 'videoFile', file);
    updateRoom(idx, 'videoUrl', URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    const withVideo = rooms.filter(r => r.videoFile);
    if (!withVideo.length) { toast.error('Качете поне едно видео'); return; }

    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const allResults = [];
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (!room.videoFile) continue;
      const fd = new FormData();
      fd.append('video', room.videoFile);
      fd.append('width', room.width);
      fd.append('length', room.length);
      fd.append('height', room.height);
      fd.append('style', room.style);
      fd.append('room_type', room.roomType);
      fd.append('notes', room.notes);
      try {
        const res = await axios.post(`${API}/ai-designer/video-generate`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }, timeout: 600000,
        });
        allResults.push({ roomIdx: i, roomName: ROOM_TYPES.find(t => t.id === room.roomType)?.name || 'Стая', ...res.data });
      } catch (err) {
        allResults.push({ roomIdx: i, roomName: ROOM_TYPES.find(t => t.id === room.roomType)?.name || 'Стая', error: err.response?.data?.detail || 'Грешка' });
      }
    }
    clearInterval(timerRef.current);
    setResults(allResults);
    setActiveRoom(0);
    setActiveAngle(0);
    setLoading(false);
    toast.success(`${allResults.filter(r => !r.error).length}/${allResults.length} помещения генерирани!`);
  };

  const reset = () => {
    rooms.forEach(r => { if (r.videoUrl) URL.revokeObjectURL(r.videoUrl); });
    setRooms([emptyRoom()]);
    setResults(null);
    setElapsed(0);
    setActiveRoom(0);
    setActiveAngle(0);
    setPkg(PACKAGES[0]);
  };

  const currentResult = results?.[activeRoom];
  const angles = currentResult?.generated_images?.[0]?.angles || [];
  const beforeImg = currentResult?.before_frame ? `data:image/jpeg;base64,${currentResult.before_frame}` : null;

  const downloadPdf = async (result) => {
    try {
      const res = await axios.post(`${API}/ai-designer/video-pdf`, {
        materials: result.materials, dimensions: result.dimensions, style: result.style,
        room_analysis: result.room_analysis,
        image_base64: result.generated_images?.[0]?.angles?.[0]?.image_base64 || '',
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `temadom-project-${result.roomName}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF изтеглен!');
    } catch { toast.error('Грешка при PDF'); }
  };

  return (
    <div className="min-h-screen bg-[#0F1923] py-6 px-3 md:px-6" data-testid="ia-designer-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Video className="h-6 w-6 text-[#F97316]" />
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              TEMADOM <span className="text-[#F97316]">3D VIDEO</span> DESIGNER
            </h1>
            <Badge className="bg-[#F97316]/15 text-[#F97316] text-[10px] font-bold">v6</Badge>
          </div>
          <p className="text-slate-500 text-sm">Drag&Drop видео 15s → AI → 360° панорама → 3D ремонт</p>
        </div>

        {!results ? (
          <div className="space-y-4">
            {/* Package Selection */}
            <div className="grid grid-cols-3 gap-2" data-testid="package-selection">
              {PACKAGES.map(p => (
                <button key={p.id} onClick={() => selectPackage(p)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    pkg.id === p.id ? 'border-[#F97316] bg-[#F97316]/10' : 'border-[#2A3A4C] bg-[#1E2A38] hover:border-[#F97316]/30'
                  }`} data-testid={`pkg-${p.id}`}>
                  <p className={`text-lg font-black ${pkg.id === p.id ? 'text-[#F97316]' : 'text-white'}`}>{p.price} EUR</p>
                  <p className="text-slate-400 text-xs">{p.label}</p>
                </button>
              ))}
            </div>

            {/* Room Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {rooms.map((r, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <button onClick={() => setActiveRoom(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeRoom === i ? 'bg-[#F97316] text-white' : 'bg-[#1E2A38] text-slate-400 border border-[#2A3A4C]'
                    }`} data-testid={`room-tab-${i}`}>
                    {ROOM_TYPES.find(t => t.id === r.roomType)?.name || `Стая ${i + 1}`}
                    {r.videoFile && <span className="ml-1 text-[9px]">*</span>}
                  </button>
                  {rooms.length > 1 && (
                    <button onClick={() => removeRoom(i)} className="text-red-400/50 hover:text-red-400 p-0.5" data-testid={`remove-room-${i}`}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {rooms.length < maxRooms && (
                <button onClick={addRoom}
                  className="px-2 py-1.5 rounded-lg text-xs bg-[#1E2A38] text-[#F97316] border border-[#F97316]/30 hover:bg-[#F97316]/10"
                  data-testid="add-room-btn">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Active Room Form */}
            {rooms[activeRoom] && (() => {
              const room = rooms[activeRoom];
              const idx = activeRoom;
              return (
                <div className="space-y-3" data-testid={`room-form-${idx}`}>
                  {/* Video Upload */}
                  <Card className="bg-[#1E2A38] border-[#2A3A4C] overflow-hidden">
                    <CardContent className="p-0">
                      {!room.videoFile ? (
                        <div className="relative p-6 md:p-10 text-center border-2 border-dashed border-[#2A3A4C] hover:border-[#F97316]/40 hover:bg-[#F97316]/5 cursor-pointer transition-all"
                          onDrop={(e) => { e.preventDefault(); handleVideoSelect(idx, e.dataTransfer.files?.[0]); }}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRefs.current[idx]?.click()} data-testid={`video-drop-${idx}`}>
                          <input ref={el => fileInputRefs.current[idx] = el} type="file" accept="video/*" className="hidden"
                            onChange={e => handleVideoSelect(idx, e.target.files?.[0])} data-testid={`video-input-${idx}`} />
                          <Upload className="h-10 w-10 text-[#F97316] mx-auto mb-3" />
                          <p className="text-white font-bold">Drag & Drop видео тук</p>
                          <p className="text-slate-500 text-sm">макс. 15 секунди — MP4, MOV, WebM</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <video src={room.videoUrl} className="w-full max-h-[220px] object-contain bg-black" controls data-testid={`video-preview-${idx}`} />
                          <button onClick={() => { if (room.videoUrl) URL.revokeObjectURL(room.videoUrl); updateRoom(idx, 'videoFile', null); updateRoom(idx, 'videoUrl', null); }}
                            className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1" data-testid={`remove-video-${idx}`}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dimensions */}
                  <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Ruler className="h-4 w-4 text-[#F97316]" />
                        <span className="text-[#F97316] text-xs font-bold">РАЗМЕРИ (задължителни)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-[10px] text-slate-500 mb-1 block">Ширина (м)</Label>
                          <Input type="number" step="0.1" value={room.width} onChange={e => updateRoom(idx, 'width', e.target.value)}
                            className="h-10 bg-[#0F1923] border-[#F97316]/30 text-white text-center text-lg font-bold" data-testid={`dim-w-${idx}`} />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 mb-1 block">Дължина (м)</Label>
                          <Input type="number" step="0.1" value={room.length} onChange={e => updateRoom(idx, 'length', e.target.value)}
                            className="h-10 bg-[#0F1923] border-[#F97316]/30 text-white text-center text-lg font-bold" data-testid={`dim-l-${idx}`} />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 mb-1 block">Височина (м)</Label>
                          <Input type="number" step="0.1" value={room.height} onChange={e => updateRoom(idx, 'height', e.target.value)}
                            className="h-10 bg-[#0F1923] border-[#F97316]/30 text-white text-center text-lg font-bold" data-testid={`dim-h-${idx}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Style + Room Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                      <CardContent className="pt-3 pb-3">
                        <Label className="text-[10px] text-slate-500 mb-2 block">Тип помещение</Label>
                        <Select value={room.roomType} onValueChange={v => updateRoom(idx, 'roomType', v)}>
                          <SelectTrigger className="bg-[#0F1923] border-[#2A3A4C] text-white h-10" data-testid={`room-type-${idx}`}><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1E2A38] border-[#2A3A4C]">
                            {ROOM_TYPES.map(rt => <SelectItem key={rt.id} value={rt.id} className="text-white hover:bg-[#253545]">{rt.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                      <CardContent className="pt-3 pb-3">
                        <Label className="text-[10px] text-slate-500 mb-2 block">Стил (1-10)</Label>
                        <Select value={room.style} onValueChange={v => updateRoom(idx, 'style', v)}>
                          <SelectTrigger className="bg-[#0F1923] border-[#2A3A4C] text-white h-10" data-testid={`style-${idx}`}><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1E2A38] border-[#2A3A4C]">
                            {STYLES.map((s, si) => <SelectItem key={s.id} value={s.id} className="text-white hover:bg-[#253545]">{si + 1}. {s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notes */}
                  <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                    <CardContent className="pt-3 pb-3">
                      <Label className="text-[10px] text-slate-500 mb-2 block">Бележки (по желание)</Label>
                      <Textarea value={room.notes} onChange={e => updateRoom(idx, 'notes', e.target.value)}
                        placeholder="Напр: нов под, бели стени, LED осветление..."
                        className="bg-[#0F1923] border-[#2A3A4C] text-white min-h-[50px] text-sm" data-testid={`notes-${idx}`} />
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Generate or Progress */}
            {loading ? (
              <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                <CardContent className="py-8 px-6">
                  <ProgressBar elapsed={elapsed} total={120 * rooms.filter(r => r.videoFile).length} />
                  <div className="flex items-center justify-center gap-3 mt-6 text-slate-300">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
                    <span className="text-sm">Видео → AI анализ → 360° рендер...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button className="w-full h-14 text-lg font-black shadow-xl rounded-xl"
                style={{
                  background: rooms.some(r => r.videoFile) ? 'linear-gradient(135deg, #F97316, #EA580C)' : '#253545',
                  boxShadow: rooms.some(r => r.videoFile) ? '0 0 40px rgba(249,115,22,0.25)' : 'none',
                }}
                onClick={handleGenerate} disabled={!rooms.some(r => r.videoFile)} data-testid="generate-btn">
                <Video className="mr-3 h-6 w-6" />
                Генерирай 3D — {pkg.price} EUR ({rooms.filter(r => r.videoFile).length} от {rooms.length} стаи)
              </Button>
            )}
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-4">
            {/* Room result tabs */}
            {results.length > 1 && (
              <div className="flex gap-2 flex-wrap" data-testid="result-room-tabs">
                {results.map((r, i) => (
                  <button key={i} onClick={() => { setActiveRoom(i); setActiveAngle(0); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeRoom === i ? 'bg-[#F97316] text-white' : 'bg-[#1E2A38] text-slate-400 border border-[#2A3A4C]'
                    } ${r.error ? 'opacity-50' : ''}`} data-testid={`result-room-${i}`}>
                    {r.roomName} {r.error ? '(грешка)' : ''}
                  </button>
                ))}
              </div>
            )}

            {currentResult && !currentResult.error ? (
              <>
                {/* Angle tabs */}
                {angles.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto" data-testid="angle-tabs">
                    {angles.map((a, i) => (
                      <button key={i} onClick={() => setActiveAngle(i)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                          activeAngle === i ? 'bg-[#F97316] text-white shadow-lg' : 'bg-[#1E2A38] text-slate-400 border border-[#2A3A4C]'
                        }`} data-testid={`angle-tab-${i}`}>
                        {a.label || `Ъгъл ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Before/After */}
                <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      360° ПРЕД / СЛЕД
                      <Badge className="bg-[#10B981]/15 text-[#10B981] text-[10px] ml-auto">{angles.length} ъгъла</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const afterImg = angles[activeAngle]?.image_base64 ? `data:image/png;base64,${angles[activeAngle].image_base64}` : null;
                      if (!afterImg) return <p className="text-slate-500 text-center py-8">Няма генерирано изображение</p>;
                      if (beforeImg) return <BeforeAfterSlider before={beforeImg} after={afterImg} />;
                      return <img src={afterImg} alt="Renovation" className="w-full rounded-xl" />;
                    })()}
                  </CardContent>
                </Card>

                {/* Materials summary */}
                {currentResult.materials?.grand_total_eur && (
                  <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-xs">Обща оценка на ремонта</p>
                          <p className="text-2xl font-black text-[#F97316]">{currentResult.materials.grand_total_eur} EUR</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 text-xs">Материали</p>
                          <p className="text-white text-sm font-bold">{currentResult.materials.materials?.length || 0} позиции</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Download buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button className="h-12 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold"
                    onClick={() => downloadPdf(currentResult)} data-testid="download-pdf-btn">
                    <FileText className="mr-2 h-4 w-4" /> PDF проект
                  </Button>
                  <Button className="h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold"
                    onClick={() => toast.info('GLB файл — скоро!')} data-testid="download-glb-btn">
                    <Download className="mr-2 h-4 w-4" /> 3D GLB файл
                  </Button>
                </div>
              </>
            ) : currentResult?.error ? (
              <Card className="bg-[#1E2A38] border-red-500/30">
                <CardContent className="py-6 text-center">
                  <p className="text-red-400 font-medium">{currentResult.error}</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Price tag */}
            <div className="text-center">
              <Badge className="bg-[#F97316]/15 text-[#F97316] text-lg px-6 py-2 font-black">
                {pkg.price} EUR → PDF + 3D GLB
              </Badge>
            </div>

            <div className="flex justify-center pt-2">
              <Button variant="outline" className="border-[#2A3A4C] text-slate-400 hover:text-white hover:border-[#F97316]/40"
                onClick={reset} data-testid="new-project-btn">Нов проект</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
