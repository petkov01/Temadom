import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Loader2, X, Download, ArrowLeft, ArrowRight, Ruler, FileText, Upload, Play, Pause } from 'lucide-react';
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
  { id: 'bathroom', name: 'Баня' },
  { id: 'kitchen', name: 'Кухня' },
  { id: 'living_room', name: 'Хол' },
  { id: 'bedroom', name: 'Спалня' },
  { id: 'corridor', name: 'Коридор' },
  { id: 'balcony', name: 'Балкон' },
  { id: 'stairs', name: 'Стълбище' },
  { id: 'facade', name: 'Фасада' },
  { id: 'other', name: 'Друго' },
];

const STYLES = [
  { id: 'modern', name: 'Модерен' },
  { id: 'scandinavian', name: 'Скандинавски' },
  { id: 'loft', name: 'Лофт' },
  { id: 'classic', name: 'Класика' },
  { id: 'minimalist', name: 'Минималистичен' },
  { id: 'boho', name: 'Бохо' },
  { id: 'industrial', name: 'Индустриален' },
  { id: 'artdeco', name: 'Арт Деко' },
  { id: 'rustic', name: 'Рустик' },
  { id: 'hitech', name: 'Хай-тек' },
];

const ProgressBar = ({ elapsed, total }) => {
  const pct = Math.min(100, (elapsed / total) * 100);
  return (
    <div className="w-full" data-testid="progress-bar">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-400">AI обработва видеото...</span>
        <span className="text-[#F97316] font-bold text-base">{Math.round(pct)}%</span>
      </div>
      <div className="h-3 bg-[#1E2A38] rounded-full overflow-hidden border border-[#2A3A4C]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #F97316, #10B981)',
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>0%</span>
        <span>Видео → 360° → 3D ремонт</span>
        <span>100%</span>
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
    <div
      ref={ref}
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-col-resize select-none border border-[#2A3A4C]"
      onMouseMove={(e) => e.buttons && handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      data-testid="before-after-slider"
    >
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt="Before"
          className="w-full h-full object-cover"
          style={{ width: `${(100 * 100) / pos}%`, maxWidth: 'none' }}
        />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
        <div className="w-0.5 h-full bg-white shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <ArrowLeft className="h-3.5 w-3.5 text-slate-700" />
          <ArrowRight className="h-3.5 w-3.5 text-slate-700" />
        </div>
      </div>
      <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-sm">
        ПРЕДИ
      </div>
      <div className="absolute top-3 right-3 bg-[#F97316]/90 text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-sm">
        СЛЕД
      </div>
    </div>
  );
};

export const AIDesignerPage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [width, setWidth] = useState('4');
  const [length, setLength] = useState('5');
  const [height, setHeight] = useState('2.6');
  const [style, setStyle] = useState('modern');
  const [roomType, setRoomType] = useState('living_room');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState(null);
  const [activeAngle, setActiveAngle] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleVideoSelect = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Моля, изберете видео файл');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Видеото е твърде голямо (макс. 100MB)');
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      handleVideoSelect(file);
    },
    [handleVideoSelect]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
  };

  const handleGenerate = async () => {
    if (!videoFile) { toast.error('Качете видео'); return; }
    if (!width || !length || !height) { toast.error('Попълнете размерите на помещението'); return; }

    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('width', width);
    formData.append('length', length);
    formData.append('height', height);
    formData.append('style', style);
    formData.append('room_type', roomType);
    formData.append('notes', notes);

    try {
      const res = await axios.post(`${API}/ai-designer/video-generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      });
      setResults(res.data);
      setActiveAngle(0);
      toast.success('3D проект генериран!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при генериране');
    }
    clearInterval(timerRef.current);
    setLoading(false);
  };

  const reset = () => {
    removeVideo();
    setResults(null);
    setNotes('');
    setElapsed(0);
    setActiveAngle(0);
  };

  const angles = results?.generated_images?.[0]?.angles || [];
  const beforeImg = results?.before_frame ? `data:image/jpeg;base64,${results.before_frame}` : null;

  return (
    <div className="min-h-screen bg-[#0F1923] py-6 px-3 md:px-6" data-testid="ia-designer-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Video className="h-6 w-6 text-[#F97316]" />
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              TEMADOM <span className="text-[#F97316]">3D VIDEO</span> DESIGNER
            </h1>
            <Badge className="bg-[#F97316]/15 text-[#F97316] text-[10px] font-bold">v6</Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Drag&Drop видео 15s → AI → 360° панорама → 3D ремонт
          </p>
        </div>

        {!results ? (
          <div className="space-y-5">
            {/* Video Upload Area */}
            <Card className="bg-[#1E2A38] border-[#2A3A4C] overflow-hidden">
              <CardContent className="p-0">
                {!videoFile ? (
                  <div
                    className={`relative p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${
                      isDragOver
                        ? 'bg-[#F97316]/10 border-2 border-dashed border-[#F97316]'
                        : 'border-2 border-dashed border-[#2A3A4C] hover:border-[#F97316]/40 hover:bg-[#F97316]/5'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="video-drop-zone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleVideoSelect(e.target.files?.[0])}
                      data-testid="video-input"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-[#F97316]/10 flex items-center justify-center">
                        <Upload className="h-10 w-10 text-[#F97316]" />
                      </div>
                      <div>
                        <p className="text-white text-lg font-bold mb-1">
                          Drag & Drop видео тук
                        </p>
                        <p className="text-slate-500 text-sm">
                          или кликнете за избор — макс. 15 секунди
                        </p>
                      </div>
                      <Badge className="bg-[#253545] text-slate-400 text-xs">
                        MP4, MOV, WebM — до 100MB
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={videoPreviewUrl}
                      className="w-full max-h-[300px] object-contain bg-black"
                      controls
                      data-testid="video-preview"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeVideo(); }}
                      className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                      data-testid="remove-video-btn"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg">
                      {videoFile.name} — {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card className="bg-[#1E2A38] border-[#2A3A4C]">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="h-4 w-4 text-[#F97316]" />
                  <span className="text-[#F97316] text-xs font-bold tracking-wider">
                    РАЗМЕРИ (задължителни)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[10px] text-slate-500 mb-1 block">Ширина (м)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="h-10 bg-[#0F1923] border-[#F97316]/30 text-white text-center text-lg font-bold"
                      data-testid="dimension-width"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500 mb-1 block">Дължина (м)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="h-10 bg-[#0F1923] border-[#F97316]/30 text-white text-center text-lg font-bold"
                      data-testid="dimension-length"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500 mb-1 block">Височина (м)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="h-10 bg-[#0F1923] border-[#F97316]/30 text-white text-center text-lg font-bold"
                      data-testid="dimension-height"
                    />
                  </div>
                </div>
                <p className="text-center text-slate-600 text-[10px] mt-2">
                  {width} x {length} x {height} м
                </p>
              </CardContent>
            </Card>

            {/* Style + Room Type */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                <CardContent className="pt-4 pb-4">
                  <Label className="text-[10px] text-slate-500 mb-2 block">Тип помещение</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger
                      className="bg-[#0F1923] border-[#2A3A4C] text-white h-10"
                      data-testid="room-type-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E2A38] border-[#2A3A4C]">
                      {ROOM_TYPES.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id} className="text-white hover:bg-[#253545]">
                          {rt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                <CardContent className="pt-4 pb-4">
                  <Label className="text-[10px] text-slate-500 mb-2 block">Стил (1-10)</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger
                      className="bg-[#0F1923] border-[#2A3A4C] text-white h-10"
                      data-testid="style-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E2A38] border-[#2A3A4C]">
                      {STYLES.map((s, i) => (
                        <SelectItem key={s.id} value={s.id} className="text-white hover:bg-[#253545]">
                          {i + 1}. {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <Card className="bg-[#1E2A38] border-[#2A3A4C]">
              <CardContent className="pt-4 pb-4">
                <Label className="text-[10px] text-slate-500 mb-2 block">Бележки (по желание)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Напр: нов под, бели стени, LED осветление..."
                  className="bg-[#0F1923] border-[#2A3A4C] text-white min-h-[60px] text-sm"
                  data-testid="notes-input"
                />
              </CardContent>
            </Card>

            {/* Generate or Progress */}
            {loading ? (
              <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                <CardContent className="py-8 px-6">
                  <ProgressBar elapsed={elapsed} total={120} />
                  <div className="flex items-center justify-center gap-3 mt-6 text-slate-300">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
                    <span className="text-sm">Видео → AI анализ → 360° рендер...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                className="w-full h-16 text-lg font-black shadow-xl rounded-xl"
                style={{
                  background: videoFile ? 'linear-gradient(135deg, #F97316, #EA580C)' : '#253545',
                  boxShadow: videoFile ? '0 0 40px rgba(249,115,22,0.25)' : 'none',
                }}
                onClick={handleGenerate}
                disabled={!videoFile}
                data-testid="generate-btn"
              >
                <Video className="mr-3 h-6 w-6" />
                Генерирай 3D проект — 69 EUR
              </Button>
            )}
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-5">
            {/* Angle Tabs */}
            {angles.length > 1 && (
              <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                <CardContent className="py-3 px-4">
                  <div className="flex gap-2 overflow-x-auto" data-testid="angle-tabs">
                    {angles.map((a, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveAngle(i)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                          activeAngle === i
                            ? 'bg-[#F97316] text-white shadow-lg'
                            : 'bg-[#0F1923] text-slate-400 border border-[#2A3A4C] hover:border-[#F97316]/30'
                        }`}
                        data-testid={`angle-tab-${i}`}
                      >
                        {a.label || `Ъгъл ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Before/After */}
            <Card className="bg-[#1E2A38] border-[#2A3A4C]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  360° ПРЕД / СЛЕД
                  <Badge className="bg-[#10B981]/15 text-[#10B981] text-[10px] ml-auto">
                    {angles.length} ъгъла
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const afterImg = angles[activeAngle]?.image_base64
                    ? `data:image/png;base64,${angles[activeAngle].image_base64}`
                    : null;
                  if (!afterImg) return <p className="text-slate-500 text-center py-8">Няма генерирано изображение</p>;
                  if (beforeImg) return <BeforeAfterSlider before={beforeImg} after={afterImg} />;
                  return <img src={afterImg} alt="Renovation" className="w-full rounded-xl" />;
                })()}
              </CardContent>
            </Card>

            {/* Materials summary */}
            {results.materials?.grand_total_eur && (
              <Card className="bg-[#1E2A38] border-[#2A3A4C]">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs">Обща оценка на ремонта</p>
                      <p className="text-2xl font-black text-[#F97316]">
                        {results.materials.grand_total_eur} EUR
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Материали</p>
                      <p className="text-white text-sm font-bold">
                        {results.materials.materials?.length || 0} позиции
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Download buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-12 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold"
                onClick={async () => {
                  try {
                    const payload = {
                      materials: results.materials,
                      dimensions: results.dimensions,
                      style: results.style,
                      room_analysis: results.room_analysis,
                      image_base64: angles[activeAngle]?.image_base64 || '',
                    };
                    const res = await axios.post(`${API}/ai-designer/video-pdf`, payload, { responseType: 'blob' });
                    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                    const a = document.createElement('a'); a.href = url; a.download = 'temadom-video-project.pdf'; a.click();
                    URL.revokeObjectURL(url);
                    toast.success('PDF проект изтеглен!');
                  } catch { toast.error('Грешка при генериране на PDF'); }
                }}
                data-testid="download-pdf-btn"
              >
                <FileText className="mr-2 h-4 w-4" /> PDF проект
              </Button>
              <Button
                className="h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold"
                onClick={() => toast.info('GLB файл — скоро!')}
                data-testid="download-glb-btn"
              >
                <Download className="mr-2 h-4 w-4" /> 3D GLB файл
              </Button>
            </div>

            {/* Price tag */}
            <div className="text-center">
              <Badge className="bg-[#F97316]/15 text-[#F97316] text-lg px-6 py-2 font-black">
                69 EUR → PDF + 3D GLB
              </Badge>
            </div>

            {/* New project button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="border-[#2A3A4C] text-slate-400 hover:text-white hover:border-[#F97316]/40"
                onClick={reset}
                data-testid="new-project-btn"
              >
                Нов проект
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
