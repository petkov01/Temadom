import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Sparkles, Download, RefreshCw, ChevronDown, ExternalLink, Star, Play, Image, Loader2, X, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PageInstructions } from './PageInstructions';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = [
  { id: 'modern', name: 'Модерен', desc: 'Чисти линии, неутрални цветове', color: '#FF8C42' },
  { id: 'scandinavian', name: 'Скандинавски', desc: 'Бяло, дърво, минимализъм', color: '#4DA6FF' },
  { id: 'loft', name: 'Лофт', desc: 'Тухла, метал, индустриален', color: '#DC3545' },
  { id: 'classic', name: 'Класически', desc: 'Елегантност и традиция', color: '#8C56FF' },
  { id: 'minimalist', name: 'Минималистичен', desc: 'Простота и функционалност', color: '#28A745' },
];

const MATERIAL_CLASSES = [
  { id: 'economy', name: 'Икономичен', desc: 'Достъпни цени', icon: '1' },
  { id: 'standard', name: 'Стандартен', desc: 'Добро качество', icon: '2' },
  { id: 'premium', name: 'Премиум', desc: 'Луксозни материали', icon: '3' },
];

const VARIANTS = [
  { count: 1, label: 'Вариант 1', desc: '1 проект' },
  { count: 3, label: 'Вариант 3', desc: '3 проекта' },
  { count: 5, label: 'Вариант 5', desc: '5 проекта' },
];

export const AIDesignerPage = () => {
  const [step, setStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [style, setStyle] = useState('modern');
  const [materialClass, setMaterialClass] = useState('standard');
  const [variants, setVariants] = useState(1);
  const [dimensions, setDimensions] = useState({ width: '4', length: '5', height: '2.6' });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файлът е твърде голям (макс. 10MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target.result);
      setImagePreview(ev.target.result);
      setStep(2);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast.error('Моля, качете снимка');
      return;
    }
    setLoading(true);
    setStep(4);
    try {
      const res = await axios.post(`${API}/ai-designer/generate`, {
        image: uploadedImage,
        style,
        material_class: materialClass,
        width: dimensions.width,
        length: dimensions.length,
        height: dimensions.height,
        variants,
        notes
      }, { timeout: 180000 });
      setResults(res.data);
      toast.success(`Генерирани ${res.data.generated_images?.length || 0} варианта!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при генерация');
      setStep(3);
    }
    setLoading(false);
  };

  const resetDesigner = () => {
    setStep(1);
    setUploadedImage(null);
    setImagePreview(null);
    setResults(null);
    setActiveImage(0);
  };

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ai-designer-page">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#8C56FF]/15 border border-[#8C56FF]/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#8C56FF]" />
            <span className="text-[#8C56FF] font-medium text-sm">AI ДИЗАЙНЕР</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Интериорен дизайнер</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Качете снимка на вашето помещение и AI ще генерира нов дизайн в избрания от вас стил
          </p>
        </div>

        <PageInstructions
          title="Как да използвате AI Дизайнера"
          description="Пълно ръководство стъпка по стъпка"
          steps={[
            'Качете снимка на помещението (JPG/PNG, до 10MB)',
            'Въведете размери: дължина, ширина, височина в метри',
            'Изберете стил: Модерен, Скандинавски, Лофт, Класически или Минималистичен',
            'Изберете клас материали: Икономичен, Стандартен или Премиум',
            'Изберете колко варианта искате: 1, 3 или 5',
            'Натиснете "Генерирай" и изчакайте AI да създаде дизайна',
            'Разгледайте резултатите: сравнение Преди/След, материали, цени'
          ]}
          benefits={[
            'AI анализира ВАШАТА снимка и генерира дизайн на СЪЩОТО помещение',
            'Списък с материали и реални цени от български магазини',
            'Линкове към Praktiker, Bauhaus, IKEA, Mr. Bricolage и други',
            'Безплатно в тестов режим — без ограничения'
          ]}
          tips={[
            'Използвайте снимка с добро осветление за по-точен анализ',
            'Опитайте различни стилове за да сравните варианти',
            'Добавете бележки за специални изисквания'
          ]}
          videoUrl="https://temadom.com/videos/ai-designer"
        />

        {/* Test mode banner */}
        <div className="bg-[#FF8C42]/10 border border-[#FF8C42]/20 rounded-xl p-4 mb-8 text-center">
          <p className="text-[#FF8C42] font-bold text-sm">
            ТЕСТОВ РЕЖИМ — AI Дизайнер е безплатен и без ограничения
          </p>
          <p className="text-slate-400 text-xs mt-1">
            AI Designer е отделен платен модул. В тестовия период е достъпен за всички потребители.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-[#FF8C42] text-white' : 'bg-[#253545] text-slate-500'
              }`} data-testid={`step-${s}`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#FF8C42]' : 'bg-[#3A4A5C]'}`} />}
            </div>
          ))}
        </div>

        {/* ===== STEP 1: Upload Photo ===== */}
        {step === 1 && (
          <Card className="bg-[#253545] border-[#3A4A5C] max-w-2xl mx-auto" data-testid="upload-section">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#FF8C42]" />
                Стъпка 1: Качете снимка на помещението
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-[#3A4A5C] rounded-xl p-12 text-center cursor-pointer hover:border-[#FF8C42]/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-area"
              >
                <Upload className="h-12 w-12 text-[#4DA6FF] mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Кликнете или плъзнете снимка тук</p>
                <p className="text-slate-400 text-sm">JPG, PNG — до 10 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleImageUpload}
                data-testid="file-input"
              />
            </CardContent>
          </Card>
        )}

        {/* ===== STEP 2: Parameters ===== */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Uploaded image preview */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Image className="h-4 w-4 text-[#4DA6FF]" />
                  Качена снимка
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Uploaded room" className="w-full rounded-lg" data-testid="preview-image" />
                    <button
                      onClick={resetDesigner}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Параметри на помещението</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs block mb-1">Ширина (м)</label>
                    <input
                      type="number" step="0.1" value={dimensions.width}
                      onChange={(e) => setDimensions(d => ({ ...d, width: e.target.value }))}
                      className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none"
                      data-testid="input-width"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs block mb-1">Дължина (м)</label>
                    <input
                      type="number" step="0.1" value={dimensions.length}
                      onChange={(e) => setDimensions(d => ({ ...d, length: e.target.value }))}
                      className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none"
                      data-testid="input-length"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs block mb-1">Височина (м)</label>
                    <input
                      type="number" step="0.1" value={dimensions.height}
                      onChange={(e) => setDimensions(d => ({ ...d, height: e.target.value }))}
                      className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none"
                      data-testid="input-height"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-xs block mb-2">Допълнителни бележки</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Напр. искам вана вместо душ, предпочитам дървен под..."
                    className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none resize-none"
                    rows={2}
                    data-testid="input-notes"
                  />
                </div>

                <Button
                  className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white"
                  onClick={() => setStep(3)}
                  data-testid="next-to-style"
                >
                  Напред: Избор на стил
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== STEP 3: Style + Material + Variants ===== */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Style selection */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Изберете стил</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        style === s.id
                          ? 'border-[#FF8C42] bg-[#FF8C42]/10'
                          : 'border-[#3A4A5C] hover:border-[#4DA6FF]/50'
                      }`}
                      data-testid={`style-${s.id}`}
                    >
                      <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color + '30', border: `2px solid ${s.color}` }} />
                      <p className="text-white text-xs font-medium">{s.name}</p>
                      <p className="text-slate-500 text-[10px]">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Material class */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Клас материали</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {MATERIAL_CLASSES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterialClass(m.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        materialClass === m.id
                          ? 'border-[#FF8C42] bg-[#FF8C42]/10'
                          : 'border-[#3A4A5C] hover:border-[#4DA6FF]/50'
                      }`}
                      data-testid={`material-${m.id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FF8C42]/15 text-[#FF8C42] flex items-center justify-center mx-auto mb-2 font-bold">
                        {m.icon}
                      </div>
                      <p className="text-white text-sm font-medium">{m.name}</p>
                      <p className="text-slate-500 text-xs">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Брой варианти</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {VARIANTS.map(v => (
                    <button
                      key={v.count}
                      onClick={() => setVariants(v.count)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        variants === v.count
                          ? 'border-[#FF8C42] bg-[#FF8C42]/10'
                          : 'border-[#3A4A5C] hover:border-[#4DA6FF]/50'
                      }`}
                      data-testid={`variant-${v.count}`}
                    >
                      <p className="text-2xl font-bold text-white">{v.count}</p>
                      <p className="text-slate-400 text-xs">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate button */}
            <div className="flex gap-3">
              <Button variant="outline" className="border-[#3A4A5C] text-slate-300 hover:bg-[#253545]" onClick={() => setStep(2)}>
                Назад
              </Button>
              <Button
                className="flex-1 bg-[#8C56FF] hover:bg-[#7a44ee] text-white text-lg h-14 shadow-lg shadow-[#8C56FF]/20"
                onClick={handleGenerate}
                data-testid="generate-btn"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Генерирай AI дизайн
              </Button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Results / Loading ===== */}
        {step === 4 && (
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center py-20" data-testid="loading-state">
                <div className="w-20 h-20 rounded-full bg-[#8C56FF]/15 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-10 w-10 text-[#8C56FF] animate-spin" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">AI генерира вашия дизайн...</h3>
                <p className="text-slate-400">Това може да отнеме 30-90 секунди. Моля, изчакайте.</p>
                <div className="mt-6 max-w-xs mx-auto">
                  <div className="h-2 bg-[#253545] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8C56FF] to-[#FF8C42] rounded-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
            ) : results ? (
              <div className="space-y-8">
                {/* Before/After comparison */}
                <Card className="bg-[#253545] border-[#3A4A5C] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Image className="h-5 w-5 text-[#4DA6FF]" />
                      Преди и след — {results.room_analysis?.room_type || 'Помещение'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Before */}
                      <div>
                        <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Преди</p>
                        <div className="rounded-xl overflow-hidden border border-[#3A4A5C]">
                          {imagePreview && <img src={imagePreview} alt="Before" className="w-full" data-testid="before-image" />}
                        </div>
                      </div>
                      {/* After */}
                      <div>
                        <p className="text-[#FF8C42] text-xs mb-2 font-medium uppercase tracking-wider">
                          След — Вариант {activeImage + 1}
                        </p>
                        <div className="rounded-xl overflow-hidden border border-[#FF8C42]/30">
                          {results.generated_images?.[activeImage] && (
                            <img
                              src={`data:image/png;base64,${results.generated_images[activeImage].image_base64}`}
                              alt={`Design variant ${activeImage + 1}`}
                              className="w-full"
                              data-testid="after-image"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variant selector */}
                    {results.generated_images?.length > 1 && (
                      <div className="flex gap-2 mt-4 justify-center">
                        {results.generated_images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              activeImage === i ? 'border-[#FF8C42] ring-2 ring-[#FF8C42]/30' : 'border-[#3A4A5C]'
                            }`}
                            data-testid={`variant-thumb-${i}`}
                          >
                            <img
                              src={`data:image/png;base64,${img.image_base64}`}
                              alt={`Variant ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Materials table */}
                {results.materials?.materials?.length > 0 && (
                  <Card className="bg-[#253545] border-[#3A4A5C]">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-[#FF8C42]" />
                        Списък материали и цени
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#3A4A5C]">
                              <th className="text-left py-2 text-slate-400 font-medium">Материал</th>
                              <th className="text-left py-2 text-slate-400 font-medium">Количество</th>
                              <th className="text-right py-2 text-slate-400 font-medium">Ед. цена</th>
                              <th className="text-right py-2 text-slate-400 font-medium">Общо</th>
                              <th className="text-right py-2 text-slate-400 font-medium">Магазин</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.materials.materials.map((m, i) => (
                              <tr key={i} className="border-b border-[#3A4A5C]/50">
                                <td className="py-2 text-white">{m.name}</td>
                                <td className="py-2 text-slate-300">{m.quantity} {m.unit}</td>
                                <td className="py-2 text-slate-300 text-right">{m.price_per_unit}</td>
                                <td className="py-2 text-[#FF8C42] font-medium text-right">{m.total_price}</td>
                                <td className="py-2 text-right">
                                  {m.store_url ? (
                                    <a href={m.store_url} target="_blank" rel="noopener noreferrer" className="text-[#4DA6FF] hover:underline text-xs flex items-center justify-end gap-1">
                                      {m.store} <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-500 text-xs">{m.store || '-'}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-[#FF8C42]/30">
                              <td colSpan="3" className="py-3 text-white font-bold">Обща стойност материали:</td>
                              <td className="py-3 text-[#FF8C42] font-bold text-right text-lg">{results.materials.total_estimate}</td>
                              <td />
                            </tr>
                            {results.materials.labor_estimate && (
                              <tr>
                                <td colSpan="3" className="py-1 text-slate-300">Труд (приблизително):</td>
                                <td className="py-1 text-slate-300 text-right">{results.materials.labor_estimate}</td>
                                <td />
                              </tr>
                            )}
                            {results.materials.grand_total && (
                              <tr className="border-t border-[#3A4A5C]">
                                <td colSpan="3" className="py-3 text-white font-bold text-lg">ОБЩО:</td>
                                <td className="py-3 text-[#28A745] font-bold text-right text-xl">{results.materials.grand_total}</td>
                                <td />
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Store links */}
                {results.stores?.length > 0 && (
                  <Card className="bg-[#253545] border-[#3A4A5C]">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-[#4DA6FF]" />
                        Магазини за материали и оборудване
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {results.stores.map((store, i) => (
                          <a
                            key={i}
                            href={store.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg bg-[#1E2A38] border border-[#3A4A5C] hover:border-[#FF8C42]/50 transition-colors"
                            data-testid={`store-${i}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#FF8C42]/10 flex items-center justify-center flex-shrink-0">
                              <ExternalLink className="h-4 w-4 text-[#FF8C42]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-medium truncate">{store.name}</p>
                              <p className="text-slate-500 text-[10px] truncate">{store.category}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={resetDesigner} data-testid="new-design-btn">
                    <RefreshCw className="mr-2 h-4 w-4" /> Нов дизайн
                  </Button>
                  <Button className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white" onClick={() => setStep(3)}>
                    <Sparkles className="mr-2 h-4 w-4" /> Редактирай параметри
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
