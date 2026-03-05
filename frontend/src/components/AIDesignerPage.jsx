import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Loader2, X, Download, RotateCcw, Eye, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROOM_TYPES = [
  { id: 'bathroom', name: 'Баня' },
  { id: 'kitchen', name: 'Кухня' },
  { id: 'living_room', name: 'Хол' },
  { id: 'bedroom', name: 'Спалня' },
  { id: 'corridor', name: 'Коридор / Антре' },
  { id: 'balcony', name: 'Балкон / Тераса' },
  { id: 'stairs', name: 'Стълбище' },
  { id: 'facade', name: 'Фасада' },
  { id: 'other', name: 'Друго' },
];

const STYLES = [
  { id: 'modern', name: 'Модерен', color: '#FF8C42' },
  { id: 'scandinavian', name: 'Скандинавски', color: '#4DA6FF' },
  { id: 'loft', name: 'Лофт', color: '#DC3545' },
  { id: 'classic', name: 'Класически', color: '#8C56FF' },
  { id: 'minimalist', name: 'Минималистичен', color: '#28A745' },
];

// Before/After Comparison Slider
const BeforeAfterSlider = ({ beforeSrc, afterSrc }) => {
  const containerRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => handleMove(e.touches ? e.touches[0].clientX : e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, handleMove]);

  return (
    <div ref={containerRef} className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-col-resize select-none"
      onMouseDown={(e) => { setDragging(true); handleMove(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); handleMove(e.touches[0].clientX); }}
      data-testid="before-after-slider">
      {/* After (full) */}
      <img src={afterSrc} alt="След ремонт" className="absolute inset-0 w-full h-full object-cover" />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={beforeSrc} alt="Преди" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current ? containerRef.current.offsetWidth : '100%' }} />
      </div>
      {/* Divider line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-slate-700" />
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Преди</div>
      <div className="absolute top-3 right-3 bg-[#28A745]/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">След</div>
    </div>
  );
};

const ProgressBar = ({ elapsed, total }) => {
  const pct = Math.min(100, (elapsed / total) * 100);
  return (
    <div className="w-full" data-testid="progress-bar">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Генериране: {elapsed} сек</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2.5 bg-[#1E2A38] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FF8C42] to-[#28A745] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const AIDesignerPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [roomType, setRoomType] = useState('bathroom');
  const [style, setStyle] = useState('modern');
  const [renovationText, setRenovationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState(null);
  const [activeAngle, setActiveAngle] = useState(0);
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Файлът е твърде голям (макс. 15MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setPreview(ev.target.result);
      toast.success('Снимка качена');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!image) {
      toast.error('Качете снимка на помещението');
      return;
    }
    if (!renovationText.trim()) {
      toast.error('Опишете какво искате да ремонтирате');
      return;
    }

    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

    try {
      const res = await axios.post(`${API}/ai-designer/generate`, {
        images: [image],
        room_type: roomType,
        style,
        material_class: 'standard',
        renovation_text: renovationText,
        notes: renovationText,
        variants: 1,
        width: '4',
        length: '5',
        height: '2.6',
      }, { timeout: 600000 });

      setResults(res.data);
      toast.success('Ремонт 1:1 генериран!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка. Опитайте отново.');
    }

    clearInterval(timerRef.current);
    setLoading(false);
  };

  const downloadImage = (b64, label) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${b64}`;
    link.download = `temadom-remont-${label}.png`;
    link.click();
    toast.success('Изображение изтеглено');
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResults(null);
    setRenovationText('');
    setElapsed(0);
    setActiveAngle(0);
  };

  const angles = results?.images?.[0]?.angles || [];

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ia-designer-page">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#8C56FF]/15 border border-[#8C56FF]/30 rounded-full px-4 py-2 mb-4">
            <Camera className="h-5 w-5 text-[#8C56FF]" />
            <span className="font-medium text-sm text-[#8C56FF]">IA DESIGNER — РЕМОНТ 1:1</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Ремонт 1:1 за 47 сек
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Качи снимка на обекта (баня, кухня, стълба, фасада). Опиши какво искаш — AI генерира ТОЧНО ТВОЯ обект ремонтиран.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-[#0F1923] rounded-xl border border-[#2A3A4C] p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Качи снимка', desc: 'Баня, кухня, стълба, фасада' },
              { step: '2', title: 'Опиши ремонта', desc: '"Сива боя + нова ограда"' },
              { step: '3', title: 'AI генерира 47с', desc: '4 ъгъла на ремонта' },
              { step: '4', title: 'Изтегли', desc: 'PNG + поискай оферта' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8C56FF] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
                <div>
                  <p className="text-white text-xs font-medium">{s.title}</p>
                  <p className="text-slate-500 text-[10px]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!results ? (
          <div className="space-y-6">
            {/* Upload Photo */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#8C56FF]" />
                  Качи снимка на обекта
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={handleUpload} data-testid="designer-upload" />
                {preview ? (
                  <div className="relative group max-w-md mx-auto">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#8C56FF]/30">
                      <img src={preview} alt="Uploaded" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => { setImage(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[4/3] max-w-md mx-auto rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#8C56FF]/50 flex flex-col items-center justify-center gap-3 transition-colors bg-[#1E2A38]/50"
                    data-testid="designer-upload-btn">
                    <Camera className="h-10 w-10 text-slate-500" />
                    <span className="text-slate-400 text-sm">Натисни за качване</span>
                    <span className="text-slate-600 text-xs">Баня / Кухня / Стълба / Фасада</span>
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Room Type + Style */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader><CardTitle className="text-white text-sm">Тип обект</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {ROOM_TYPES.map(rt => (
                      <button key={rt.id} onClick={() => setRoomType(rt.id)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          roomType === rt.id ? 'border-[#8C56FF] bg-[#8C56FF]/10 text-[#8C56FF]' : 'border-[#3A4A5C] text-slate-300 hover:border-[#8C56FF]/30'
                        }`} data-testid={`room-type-${rt.id}`}>
                        {rt.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader><CardTitle className="text-white text-sm">Стил</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map(s => (
                      <button key={s.id} onClick={() => setStyle(s.id)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          style === s.id ? `border-[${s.color}] bg-[${s.color}]/10` : 'border-[#3A4A5C] text-slate-300 hover:border-[#3A4A5C]'
                        }`} style={style === s.id ? { borderColor: s.color, color: s.color, background: `${s.color}15` } : {}}
                        data-testid={`style-${s.id}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Renovation Text */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardContent className="pt-5">
                <Label className="text-slate-300 text-sm mb-2 block">Какво искаш да ремонтираш?</Label>
                <Textarea value={renovationText} onChange={(e) => setRenovationText(e.target.value)}
                  placeholder="Сива боя + нова ограда (за стълба)&#10;Нови плочки + душ кабина (за баня)&#10;Нови шкафове + плот (за кухня)"
                  className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[100px]" data-testid="renovation-text" />
              </CardContent>
            </Card>

            {/* Generate */}
            {loading ? (
              <div className="space-y-4">
                <ProgressBar elapsed={elapsed} total={60} />
                <div className="flex items-center justify-center gap-3 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8C56FF]" />
                  <span>AI генерира 1:1 ремонт от 4 ъгъла...</span>
                </div>
              </div>
            ) : (
              <Button className="w-full bg-[#8C56FF] hover:bg-[#7a44ee] text-white text-lg h-14 shadow-lg shadow-[#8C56FF]/20"
                onClick={handleGenerate} disabled={!image || !renovationText.trim()} data-testid="generate-btn">
                <Camera className="mr-2 h-5 w-5" /> Генерирай ремонт (47 сек)
              </Button>
            )}
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-6">
            {/* Before / After */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#8C56FF]" />
                  Резултат: 1:1 ремонт ({elapsed} сек)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Angle tabs */}
                {angles.length > 1 && (
                  <div className="flex gap-2 mb-4" data-testid="angle-tabs">
                    {angles.map((a, i) => (
                      <button key={i} onClick={() => setActiveAngle(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeAngle === i ? 'bg-[#8C56FF] text-white' : 'bg-[#1E2A38] text-slate-400 hover:text-white'
                        }`} data-testid={`angle-tab-${i}`}>
                        {a.angle_label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Before/After Slider */}
                {(() => {
                  const afterImg = angles[activeAngle]
                    ? `data:image/png;base64,${angles[activeAngle].image_base64}`
                    : results?.images?.[0]?.image_base64
                      ? `data:image/png;base64,${results.images[0].image_base64}`
                      : null;
                  return afterImg ? (
                    <BeforeAfterSlider beforeSrc={preview} afterSrc={afterImg} />
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-[#1E2A38] flex items-center justify-center text-slate-500">
                      Няма генерирано изображение
                    </div>
                  );
                })()}

                {/* All 4 angles grid */}
                {angles.length > 1 && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-xs mb-2">Всички ъгли:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {angles.map((a, i) => (
                        <button key={i} onClick={() => setActiveAngle(i)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            activeAngle === i ? 'border-[#8C56FF]' : 'border-[#3A4A5C] hover:border-[#8C56FF]/50'
                          }`}>
                          <img src={`data:image/png;base64,${a.image_base64}`}
                            alt={a.angle_label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Renovation info */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#28A745]/15 text-[#28A745] border-[#28A745]/30">1:1 Стриктен режим</Badge>
                </div>
                <p className="text-slate-400 text-xs">Заявка: <span className="text-white">{renovationText}</span></p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white" onClick={reset} data-testid="new-design-btn">
                <RotateCcw className="mr-2 h-4 w-4" /> Нов ремонт
              </Button>
              {angles[activeAngle] && (
                <Button className="bg-[#28A745] hover:bg-[#22943e] text-white"
                  onClick={() => downloadImage(angles[activeAngle].image_base64, angles[activeAngle].angle_label)}
                  data-testid="download-image-btn">
                  <Download className="mr-2 h-4 w-4" /> Изтегли изображение
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
