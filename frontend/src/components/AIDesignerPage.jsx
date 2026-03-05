import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Sparkles, Download, RefreshCw, ExternalLink, Star, Play, Image, Loader2, X, CheckCircle, FileText, ChevronRight, Share2, FileImage } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageInstructions } from './PageInstructions';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SITE_URL = process.env.REACT_APP_BACKEND_URL;

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
  { count: 1, label: '1', desc: '1 проект' },
  { count: 3, label: '3', desc: '3 проекта' },
  { count: 5, label: '5', desc: '5 проекта' },
];

const ROOM_TYPES = [
  { id: 'bathroom', name: 'Баня' },
  { id: 'kitchen', name: 'Кухня' },
  { id: 'living_room', name: 'Хол' },
  { id: 'bedroom', name: 'Спалня' },
  { id: 'kids_room', name: 'Детска стая' },
  { id: 'office', name: 'Офис / Кабинет' },
  { id: 'corridor', name: 'Коридор / Антре' },
  { id: 'balcony', name: 'Балкон / Тераса' },
  { id: 'other', name: 'Друго' },
];

const ANGLE_LABELS = ['Ъгъл 1 (Фронтален)', 'Ъгъл 2 (Ляв/Десен)', 'Ъгъл 3 (Обратен)'];

// Video instruction data for each step
const VIDEO_STEPS = [
  {
    title: 'Как да снимате помещението',
    duration: '0:45',
    points: [
      'Снимайте от 3 различни ъгъла за пълно покритие',
      'Използвайте добро осветление — включете всички лампи',
      'Снимайте хоризонтално за по-добър резултат',
      'Уловете подовата настилка, стените и тавана',
    ]
  },
  {
    title: 'Как да въведете параметри',
    duration: '0:30',
    points: [
      'Измерете стаята с ролетка — ширина, дължина, височина',
      'Изберете тип помещение от списъка',
      'Добавете бележки за специални изисквания',
    ]
  },
  {
    title: 'Избор на стил и материали',
    duration: '0:40',
    points: [
      'Изберете стил — всеки има различен характер',
      'Класът материали определя бюджета',
      'Повече варианти = повече избор за сравнение',
    ]
  },
  {
    title: 'Генериране и преглед',
    duration: '0:50',
    points: [
      'Натиснете "Генерирай" и изчакайте 30-90 секунди',
      'Сравнете "Преди" и "След" за всеки вариант',
      'Разгледайте таблицата с материали и цени',
      'Кликнете върху магазин за повече информация',
    ]
  },
];

export const AIDesignerPage = () => {
  const [step, setStep] = useState(1);
  // 3 images from 3 angles
  const [images, setImages] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [roomType, setRoomType] = useState('bathroom');
  const [style, setStyle] = useState('modern');
  const [materialClass, setMaterialClass] = useState('standard');
  const [variants, setVariants] = useState(1);
  const [dimensions, setDimensions] = useState({ width: '4', length: '5', height: '2.6' });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  const fileRef0 = useRef(null);
  const fileRef1 = useRef(null);
  const fileRef2 = useRef(null);
  const fileRefs = [fileRef0, fileRef1, fileRef2];

  const handleImageUpload = useCallback((index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файлът е твърде голям (макс. 10MB)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Моля, качете изображение');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImages(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
      setPreviews(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
      toast.success(`Снимка ${index + 1} качена успешно`);
    };
    reader.onerror = () => {
      toast.error('Грешка при четене на файла');
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = (index) => {
    setImages(prev => { const n = [...prev]; n[index] = null; return n; });
    setPreviews(prev => { const n = [...prev]; n[index] = null; return n; });
  };

  const uploadedCount = images.filter(Boolean).length;
  const canProceed = uploadedCount >= 1; // At least 1 image required, 3 recommended

  const handleGenerate = async () => {
    if (uploadedCount === 0) {
      toast.error('Качете поне 1 снимка');
      return;
    }
    setLoading(true);
    setStep(5);
    try {
      const validImages = images.filter(Boolean);
      const res = await axios.post(`${API}/ai-designer/generate`, {
        images: validImages,
        image: validImages[0], // primary image for backward compat
        style,
        material_class: materialClass,
        room_type: roomType,
        width: dimensions.width,
        length: dimensions.length,
        height: dimensions.height,
        variants,
        notes
      }, { timeout: 300000 });
      setResults(res.data);
      toast.success(`Генерирани ${res.data.generated_images?.length || 0} варианта!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при генерация. Опитайте отново.');
      setStep(4);
    }
    setLoading(false);
  };

  const resetDesigner = () => {
    setStep(1);
    setImages([null, null, null]);
    setPreviews([null, null, null]);
    setResults(null);
    setActiveImage(0);
    setPublished(false);
    setPublishing(false);
  };

  const handlePublish = async () => {
    if (!results) return;
    setPublishing(true);
    try {
      const res = await axios.post(`${API}/ai-designer/publish`, {
        design_id: results.id,
        before_images: previews.filter(Boolean),
        generated_images: results.generated_images,
        materials: results.materials,
        room_type: ROOM_TYPES.find(r => r.id === roomType)?.name || roomType,
        style: STYLES.find(s => s.id === style)?.name || style,
        material_class: MATERIAL_CLASSES.find(m => m.id === materialClass)?.name || materialClass,
        dimensions: results.dimensions || dimensions,
        room_analysis: results.room_analysis,
        author_name: "TemaDom потребител"
      });
      setPublished(true);
      setPublishedId(res.data.project_id);
      toast.success(res.data.message || 'Публикувано успешно!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при публикуване');
    }
    setPublishing(false);
  };

  const handleDownloadPDF = async (type) => {
    if (!published && !results?.id) {
      // Publish first, then download
      toast.info('Първо публикувайте проекта, за да изтеглите PDF');
      return;
    }
    // If not published yet, publish first
    if (!published) {
      await handlePublish();
    }
    // Now find the project id from publish response or results
    try {
      // Get the latest published project
      const listRes = await axios.get(`${API}/ai-designer/published?limit=1`);
      const latestProject = listRes.data.projects?.[0];
      if (!latestProject) {
        toast.error('Проектът не е намерен');
        return;
      }
      const pdfUrl = `${API}/ai-designer/published/${latestProject.id}/pdf/${type}`;
      window.open(pdfUrl, '_blank');
      toast.success(`PDF ${type === 'images' ? 'с изображения' : 'с количествена сметка'} се изтегля...`);
    } catch (err) {
      toast.error('Грешка при изтегляне на PDF');
    }
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
            Снимайте помещението от 3 ъгъла — AI генерира проект с максимална точност
          </p>
        </div>

        <PageInstructions
          title="Как да използвате AI Дизайнера"
          description="Пълно ръководство стъпка по стъпка — от снимка до готов проект"
          steps={[
            'Снимайте помещението от 3 различни ъгъла (JPG/PNG, до 10MB)',
            'Изберете тип помещение и въведете размери (ширина, дължина, височина)',
            'Изберете стил: Модерен, Скандинавски, Лофт, Класически или Минималистичен',
            'Изберете клас материали: Икономичен, Стандартен или Премиум',
            'Изберете колко варианта искате: 1, 3 или 5',
            'Натиснете "Генерирай" — AI анализира всичките снимки и създава дизайн',
            'Разгледайте "Преди/След", таблица с материали, цени и линкове към магазини'
          ]}
          benefits={[
            '3 снимки от различни ъгли = по-точен анализ на помещението',
            'AI генерира дизайн на ВАШЕТО помещение, не на случайна стая',
            'Списък с материали и реални цени от 18 български магазина',
            'Безплатно в тестов режим — без ограничения'
          ]}
          tips={[
            'Снимайте с добро осветление за по-точен резултат',
            'Включете подовата настилка, стените и тавана в снимките',
            'Добавете бележки ако искате нещо специално (вана, душ-кабина и т.н.)'
          ]}
          videoUrl="https://temadom.com/videos/ai-designer"
        />

        {/* Test mode banner */}
        <div className="bg-[#FF8C42]/10 border border-[#FF8C42]/20 rounded-xl p-4 mb-8 text-center">
          <p className="text-[#FF8C42] font-bold text-sm">
            ТЕСТОВ РЕЖИМ — AI Дизайнер безплатен и без ограничения
          </p>
          <p className="text-slate-400 text-xs mt-1">
            AI Designer е отделен платен модул. В тестовия период е достъпен за всички.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {['Снимки', 'Параметри', 'Стил', 'Варианти', 'Резултат'].map((label, s) => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => { if (s + 1 < step || (s + 1 <= 4 && uploadedCount > 0)) setStep(s + 1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step === s + 1 ? 'bg-[#FF8C42] text-white' : step > s + 1 ? 'bg-[#28A745]/20 text-[#28A745]' : 'bg-[#253545] text-slate-500'
                }`}
                data-testid={`step-${s + 1}`}
              >
                {step > s + 1 ? <CheckCircle className="h-3 w-3" /> : <span>{s + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </button>
              {s < 4 && <ChevronRight className="h-3 w-3 text-[#3A4A5C]" />}
            </div>
          ))}
        </div>

        {/* ===== VIDEO INSTRUCTIONS PANEL ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Play className="h-4 w-4 text-[#FF8C42]" />
            <h3 className="text-white font-semibold text-sm">Видео инструкции</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VIDEO_STEPS.map((vid, i) => (
              <button
                key={i}
                onClick={() => setActiveVideo(activeVideo === i ? null : i)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeVideo === i ? 'border-[#FF8C42] bg-[#FF8C42]/10' : 'border-[#3A4A5C] bg-[#253545] hover:border-[#4DA6FF]/50'
                }`}
                data-testid={`video-step-${i}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#FF8C42]/15 flex items-center justify-center">
                    <Play className="h-3 w-3 text-[#FF8C42]" />
                  </div>
                  <span className="text-slate-500 text-[10px]">{vid.duration}</span>
                </div>
                <p className="text-white text-xs font-medium leading-tight">{vid.title}</p>
              </button>
            ))}
          </div>
          {activeVideo !== null && (
            <div className="mt-3 bg-[#253545] border border-[#3A4A5C] rounded-xl p-4 animate-slideDown" data-testid="video-content">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#FF8C42]/15 flex items-center justify-center">
                  <Play className="h-5 w-5 text-[#FF8C42]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{VIDEO_STEPS[activeVideo].title}</h4>
                  <p className="text-slate-500 text-xs">{VIDEO_STEPS[activeVideo].duration}</p>
                </div>
              </div>
              <div className="space-y-2">
                {VIDEO_STEPS[activeVideo].points.map((p, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF8C42]/15 text-[#FF8C42] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    <p className="text-slate-300 text-sm">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== STEP 1: Upload 3 Photos ===== */}
        {step === 1 && (
          <Card className="bg-[#253545] border-[#3A4A5C]" data-testid="upload-section">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#FF8C42]" />
                Стъпка 1: Снимайте от 3 ъгъла
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                Качете снимки от 3 различни ъгъла за максимална точност. Минимум 1 снимка.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[0, 1, 2].map(idx => (
                  <div key={idx}>
                    <p className="text-slate-400 text-xs mb-2 font-medium">{ANGLE_LABELS[idx]}</p>
                    {previews[idx] ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#3A4A5C]">
                        <img src={previews[idx]} alt={`Angle ${idx + 1}`} className="w-full h-48 object-cover" data-testid={`preview-${idx}`} />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-[#DC3545]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-[#28A745] text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="h-3 w-3 inline mr-1" />Качена
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-[#3A4A5C] rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF8C42]/50 transition-colors"
                        onClick={() => fileRefs[idx].current?.click()}
                        data-testid={`upload-area-${idx}`}
                      >
                        <Upload className="h-8 w-8 text-[#4DA6FF] mb-2" />
                        <p className="text-slate-400 text-xs">{idx === 0 ? 'Задължителна' : 'Препоръчителна'}</p>
                      </div>
                    )}
                    <input
                      ref={fileRefs[idx]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(idx, e)}
                      data-testid={`file-input-${idx}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-400">
                  Качени: <span className="text-[#FF8C42] font-bold">{uploadedCount}/3</span>
                  {uploadedCount < 3 && uploadedCount > 0 && <span className="text-slate-500 ml-2">(може да продължите)</span>}
                </p>
                <Button
                  className="bg-[#FF8C42] hover:bg-[#e67a30] text-white"
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  data-testid="next-to-params"
                >
                  Напред: Параметри <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== STEP 2: Parameters ===== */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Thumbnails of uploaded images */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Image className="h-4 w-4 text-[#4DA6FF]" />
                  Качени снимки ({uploadedCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((p, i) => (
                    <div key={i} className={`rounded-lg overflow-hidden border ${p ? 'border-[#28A745]/50' : 'border-[#3A4A5C]'} h-24`}>
                      {p ? (
                        <img src={p} alt={`Angle ${i+1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1E2A38] flex items-center justify-center">
                          <Camera className="h-5 w-5 text-[#3A4A5C]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Parameters form */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Параметри на помещението</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Room type */}
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Тип помещение</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none"
                    data-testid="room-type-select"
                  >
                    {ROOM_TYPES.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'width', label: 'Ширина (м)' },
                    { key: 'length', label: 'Дължина (м)' },
                    { key: 'height', label: 'Височина (м)' },
                  ].map(d => (
                    <div key={d.key}>
                      <label className="text-slate-400 text-xs block mb-1">{d.label}</label>
                      <input
                        type="number" step="0.1" value={dimensions[d.key]}
                        onChange={(e) => setDimensions(prev => ({ ...prev, [d.key]: e.target.value }))}
                        className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none"
                        data-testid={`input-${d.key}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Допълнителни бележки</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Напр. искам вана вместо душ, предпочитам дървен под..."
                    className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF8C42] focus:outline-none resize-none"
                    rows={2}
                    data-testid="input-notes"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="border-[#3A4A5C] text-slate-300 hover:bg-[#1E2A38]" onClick={() => setStep(1)}>
                    Назад
                  </Button>
                  <Button className="flex-1 bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={() => setStep(3)} data-testid="next-to-style">
                    Напред: Стил <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== STEP 3: Style ===== */}
        {step === 3 && (
          <div className="space-y-6 max-w-4xl mx-auto">
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
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        style === s.id ? 'border-[#FF8C42] bg-[#FF8C42]/10' : 'border-[#3A4A5C] hover:border-[#4DA6FF]/50'
                      }`}
                      data-testid={`style-${s.id}`}
                    >
                      <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color + '25', border: `2px solid ${s.color}` }} />
                      <p className="text-white text-xs font-medium">{s.name}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Клас материали / оборудване</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {MATERIAL_CLASSES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterialClass(m.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        materialClass === m.id ? 'border-[#FF8C42] bg-[#FF8C42]/10' : 'border-[#3A4A5C] hover:border-[#4DA6FF]/50'
                      }`}
                      data-testid={`material-${m.id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FF8C42]/15 text-[#FF8C42] flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                        {m.icon}
                      </div>
                      <p className="text-white text-sm font-medium">{m.name}</p>
                      <p className="text-slate-500 text-xs">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="border-[#3A4A5C] text-slate-300 hover:bg-[#253545]" onClick={() => setStep(2)}>
                Назад
              </Button>
              <Button className="flex-1 bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={() => setStep(4)} data-testid="next-to-variants">
                Напред: Варианти <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Variants + Generate ===== */}
        {step === 4 && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Брой варианти за генерация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {VARIANTS.map(v => (
                    <button
                      key={v.count}
                      onClick={() => setVariants(v.count)}
                      className={`p-5 rounded-xl border-2 text-center transition-all ${
                        variants === v.count ? 'border-[#FF8C42] bg-[#FF8C42]/10' : 'border-[#3A4A5C] hover:border-[#4DA6FF]/50'
                      }`}
                      data-testid={`variant-${v.count}`}
                    >
                      <p className="text-3xl font-bold text-white">{v.count}</p>
                      <p className="text-slate-400 text-xs mt-1">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary before generation */}
            <Card className="bg-gradient-to-r from-[#8C56FF]/10 to-[#4DA6FF]/10 border-[#8C56FF]/20">
              <CardContent className="p-5">
                <h4 className="text-white font-semibold text-sm mb-3">Обобщение на проекта</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">Снимки:</span> <span className="text-white font-medium">{uploadedCount} от 3</span></div>
                  <div><span className="text-slate-400">Помещение:</span> <span className="text-white font-medium">{ROOM_TYPES.find(r => r.id === roomType)?.name}</span></div>
                  <div><span className="text-slate-400">Размери:</span> <span className="text-white font-medium">{dimensions.width} x {dimensions.length} x {dimensions.height} м</span></div>
                  <div><span className="text-slate-400">Стил:</span> <span className="text-white font-medium">{STYLES.find(s => s.id === style)?.name}</span></div>
                  <div><span className="text-slate-400">Материали:</span> <span className="text-white font-medium">{MATERIAL_CLASSES.find(m => m.id === materialClass)?.name}</span></div>
                  <div><span className="text-slate-400">Варианти:</span> <span className="text-white font-medium">{variants}</span></div>
                </div>
                {notes && <div className="mt-2"><span className="text-slate-400 text-sm">Бележки:</span> <span className="text-slate-300 text-sm">{notes}</span></div>}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="border-[#3A4A5C] text-slate-300 hover:bg-[#253545]" onClick={() => setStep(3)}>
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

        {/* ===== STEP 5: Results / Loading ===== */}
        {step === 5 && (
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center py-20" data-testid="loading-state">
                <div className="w-20 h-20 rounded-full bg-[#8C56FF]/15 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-10 w-10 text-[#8C56FF] animate-spin" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">AI генерира вашия дизайн...</h3>
                <p className="text-slate-400 mb-1">Анализ на {uploadedCount} снимки от различни ъгли</p>
                <p className="text-slate-500 text-sm">Това може да отнеме 30-120 секунди</p>
                <div className="mt-6 max-w-xs mx-auto">
                  <div className="h-2 bg-[#253545] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8C56FF] to-[#FF8C42] rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            ) : results ? (
              <div className="space-y-8">
                {/* Before/After */}
                <Card className="bg-[#253545] border-[#3A4A5C] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Image className="h-5 w-5 text-[#4DA6FF]" />
                      Преди и след — {results.room_analysis?.room_type || ROOM_TYPES.find(r => r.id === roomType)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Преди (Оригинал)</p>
                        <div className="rounded-xl overflow-hidden border border-[#3A4A5C]">
                          {previews[0] && <img src={previews[0]} alt="Before" className="w-full" data-testid="before-image" />}
                        </div>
                        {uploadedCount > 1 && (
                          <div className="flex gap-2 mt-2">
                            {previews.filter(Boolean).slice(1).map((p, i) => (
                              <div key={i} className="w-16 h-12 rounded-lg overflow-hidden border border-[#3A4A5C]">
                                <img src={p} alt={`Angle ${i+2}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[#FF8C42] text-xs mb-2 font-medium uppercase tracking-wider">
                          След — Вариант {activeImage + 1} / {results.generated_images?.length || 0}
                        </p>
                        {/* 2 angles for the active variant */}
                        {results.generated_images?.[activeImage]?.angles?.length > 1 ? (
                          <div className="space-y-3">
                            {results.generated_images[activeImage].angles.map((ang, ai) => (
                              <div key={ai}>
                                <p className="text-slate-500 text-[10px] mb-1 uppercase tracking-wider">
                                  {ang.angle_label || (ai === 0 ? 'Фронтален ъгъл' : 'Страничен ъгъл')}
                                </p>
                                <div className="rounded-xl overflow-hidden border border-[#FF8C42]/30">
                                  <img
                                    src={`data:image/png;base64,${ang.image_base64}`}
                                    alt={`V${activeImage+1} angle ${ai+1}`}
                                    className="w-full"
                                    data-testid={`after-image-angle-${ai}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-[#FF8C42]/30">
                            {results.generated_images?.[activeImage] && (
                              <img
                                src={`data:image/png;base64,${results.generated_images[activeImage].image_base64}`}
                                alt={`Design ${activeImage + 1}`}
                                className="w-full"
                                data-testid="after-image"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

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
                            <img src={`data:image/png;base64,${img.image_base64}`} alt={`V${i+1}`} className="w-full h-full object-cover" />
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
                        <FileText className="h-4 w-4 text-[#FF8C42]" />
                        Материали, оборудване и цени
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" data-testid="materials-table">
                          <thead>
                            <tr className="border-b border-[#3A4A5C]">
                              <th className="text-left py-2 text-slate-400 font-medium">Материал</th>
                              <th className="text-left py-2 text-slate-400 font-medium">Кол-во</th>
                              <th className="text-right py-2 text-slate-400 font-medium">Ед. цена</th>
                              <th className="text-right py-2 text-slate-400 font-medium">Общо (лв / €)</th>
                              <th className="text-right py-2 text-slate-400 font-medium">Магазин</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.materials.materials.map((m, i) => (
                              <tr key={i} className="border-b border-[#3A4A5C]/50 hover:bg-[#1E2A38]/50">
                                <td className="py-2 text-white">{m.name}</td>
                                <td className="py-2 text-slate-300">{m.quantity} {m.unit}</td>
                                <td className="py-2 text-slate-300 text-right">
                                  {m.price_per_unit_bgn || m.price_per_unit || '-'}
                                  {m.price_per_unit_eur && <span className="text-slate-500 text-xs ml-1">/ {m.price_per_unit_eur}</span>}
                                </td>
                                <td className="py-2 text-right">
                                  <span className="text-[#FF8C42] font-medium">{m.total_price_bgn || m.total_price || '-'}</span>
                                  {m.total_price_eur && <span className="text-slate-400 text-xs block">{m.total_price_eur}</span>}
                                </td>
                                <td className="py-2 text-right">
                                  {m.store_url ? (
                                    <a href={m.store_url} target="_blank" rel="noopener noreferrer" className="text-[#4DA6FF] hover:underline text-xs inline-flex items-center gap-1">
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
                              <td colSpan="3" className="py-3 text-white font-bold">Материали:</td>
                              <td className="py-3 text-right">
                                <span className="text-[#FF8C42] font-bold text-lg">{results.materials.total_estimate_bgn || results.materials.total_estimate}</span>
                                {results.materials.total_estimate_eur && <span className="text-slate-400 text-sm block">{results.materials.total_estimate_eur}</span>}
                              </td>
                              <td />
                            </tr>
                            {(results.materials.labor_estimate_bgn || results.materials.labor_estimate) && (
                              <tr>
                                <td colSpan="3" className="py-1 text-slate-300">Труд:</td>
                                <td className="py-1 text-right">
                                  <span className="text-slate-300">{results.materials.labor_estimate_bgn || results.materials.labor_estimate}</span>
                                  {results.materials.labor_estimate_eur && <span className="text-slate-500 text-sm block">{results.materials.labor_estimate_eur}</span>}
                                </td>
                                <td />
                              </tr>
                            )}
                            {(results.materials.grand_total_bgn || results.materials.grand_total) && (
                              <tr className="border-t border-[#3A4A5C]">
                                <td colSpan="3" className="py-3 text-white font-bold text-lg">ОБЩА СТОЙНОСТ:</td>
                                <td className="py-3 text-right">
                                  <span className="text-[#28A745] font-bold text-xl">{results.materials.grand_total_bgn || results.materials.grand_total}</span>
                                  {results.materials.grand_total_eur && <span className="text-[#28A745]/70 text-sm block">{results.materials.grand_total_eur}</span>}
                                </td>
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
                        Магазини за материали, техника и оборудване
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
                            className="flex items-center gap-2 p-3 rounded-lg bg-[#1E2A38] border border-[#3A4A5C] hover:border-[#FF8C42]/50 transition-colors group"
                            data-testid={`store-${i}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#FF8C42]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF8C42]/20">
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

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {!published ? (
                    <Button 
                      className="bg-[#28A745] hover:bg-[#22943e] text-white" 
                      onClick={handlePublish} 
                      disabled={publishing}
                      data-testid="publish-btn"
                    >
                      {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                      {publishing ? 'Публикуване...' : 'Публикувай в галерията'}
                    </Button>
                  ) : (
                    <Button className="bg-[#28A745]/20 text-[#28A745] cursor-default border border-[#28A745]/30" disabled data-testid="published-badge">
                      <CheckCircle className="mr-2 h-4 w-4" /> Публикуван
                    </Button>
                  )}
                  <Button 
                    className="bg-[#4DA6FF] hover:bg-[#3d96ef] text-white" 
                    onClick={() => handleDownloadPDF('images')}
                    data-testid="pdf-images-btn"
                  >
                    <FileImage className="mr-2 h-4 w-4" /> PDF с изображения
                  </Button>
                  <Button 
                    className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white" 
                    onClick={() => handleDownloadPDF('materials')}
                    data-testid="pdf-materials-btn"
                  >
                    <FileText className="mr-2 h-4 w-4" /> PDF количествена сметка
                  </Button>
                  <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={resetDesigner} data-testid="new-design-btn">
                    <RefreshCw className="mr-2 h-4 w-4" /> Нов дизайн
                  </Button>
                </div>

                {/* Social Sharing */}
                {published && publishedId && (
                  <div className="bg-[#253545] rounded-xl p-5 border border-[#3A4A5C]" data-testid="share-section">
                    <p className="text-white text-sm font-medium text-center mb-3">
                      <Share2 className="h-4 w-4 inline mr-2" />Споделете вашия проект
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button size="sm" className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs" 
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/ai-gallery?project=${publishedId}`)}`, '_blank', 'width=600,height=400')}
                        data-testid="designer-share-facebook">
                        Facebook
                      </Button>
                      <Button size="sm" className="bg-[#7360F2] hover:bg-[#6050e0] text-white text-xs"
                        onClick={() => window.open(`viber://forward?text=${encodeURIComponent(`Вижте AI дизайн на TemaDom! ${SITE_URL}/ai-gallery?project=${publishedId}`)}`)}>
                        Viber
                      </Button>
                      <Button size="sm" className="bg-[#25D366] hover:bg-[#20c05c] text-white text-xs"
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Вижте AI дизайн на TemaDom! ${SITE_URL}/ai-gallery?project=${publishedId}`)}`, '_blank')}>
                        WhatsApp
                      </Button>
                      <Button size="sm" className="bg-[#0088CC] hover:bg-[#007ab8] text-white text-xs"
                        onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(`${SITE_URL}/ai-gallery?project=${publishedId}`)}`, '_blank')}>
                        Telegram
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#3A4A5C] text-slate-300 text-xs"
                        onClick={() => { navigator.clipboard.writeText(`${SITE_URL}/ai-gallery?project=${publishedId}`); toast.success('Линкът е копиран!'); }}
                        data-testid="designer-share-copy">
                        Копирай линк
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignerPage;
