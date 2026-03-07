import React, { useState, useRef, useCallback, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Camera, Upload, RotateCcw, FileText, Building2, Share2, ChevronRight, CheckCircle, Loader2, X, Eye, Move3D, MousePointer, Save, Link2, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SITE_URL = process.env.REACT_APP_BACKEND_URL;

// --- Swappable element definitions ---
const SWAP_CATEGORIES = {
  shower: {
    label: 'Душ кабина',
    icon: '🚿',
    options: [
      { id: 'glass_modern', name: 'Стъклена модерна', color: '#88ccee', price: 450 },
      { id: 'classic_white', name: 'Класическа бяла', color: '#f0f0f0', price: 320 },
      { id: 'black_frame', name: 'Черна рамка', color: '#333333', price: 580 },
      { id: 'walk_in', name: 'Walk-in (отворена)', color: '#aaddff', price: 720 },
    ],
  },
  wc: {
    label: 'Тоалетна',
    icon: '🚽',
    options: [
      { id: 'wall_hung', name: 'Стенна конзолна', color: '#f5f5f5', price: 380 },
      { id: 'classic_floor', name: 'Подова класическа', color: '#e8e8e8', price: 220 },
      { id: 'smart_bidet', name: 'Smart с биде', color: '#d0e8ff', price: 950 },
    ],
  },
  tiles: {
    label: 'Плочки',
    icon: '🔲',
    options: [
      { id: 'marble_white', name: 'Мрамор бял', color: '#f0ece4', price: 45 },
      { id: 'wood_look', name: 'Дървесен декор', color: '#b08050', price: 35 },
      { id: 'dark_slate', name: 'Тъмен шисти', color: '#3a3a3a', price: 55 },
      { id: 'terrazzo', name: 'Терацо', color: '#d4c8b8', price: 65 },
    ],
  },
  sink: {
    label: 'Мивка',
    icon: '🪥',
    options: [
      { id: 'countertop', name: 'Върху плот', color: '#fafafa', price: 280 },
      { id: 'wall_mount', name: 'Стенна', color: '#e0e0e0', price: 190 },
      { id: 'double', name: 'Двойна мивка', color: '#f0f0f0', price: 420 },
    ],
  },
  furniture: {
    label: 'Мебели',
    icon: '🪑',
    options: [
      { id: 'modern_cabinet', name: 'Модерен шкаф', color: '#8B7355', price: 550 },
      { id: 'floating_shelf', name: 'Плаващ рафт', color: '#A0522D', price: 180 },
      { id: 'mirror_cabinet', name: 'Огледален шкаф', color: '#C0C0C0', price: 320 },
    ],
  },
};

// Default hotspot positions (angles on the panorama sphere) 
const DEFAULT_HOTSPOTS = [
  { id: 'shower', phi: Math.PI / 2, theta: -0.5, y: 0 },
  { id: 'wc', phi: Math.PI / 2, theta: 0.6, y: -0.2 },
  { id: 'tiles', phi: Math.PI / 2.5, theta: 0, y: -0.8 },
  { id: 'sink', phi: Math.PI / 2, theta: -1.8, y: 0.1 },
  { id: 'furniture', phi: Math.PI / 2, theta: 2.0, y: 0 },
];

// --- Panorama Sphere Component ---
const PanoramaSphere = ({ textureUrl, swaps }) => {
  const meshRef = useRef();
  const texture = useMemo(() => {
    if (!textureUrl) return null;
    const tex = new THREE.TextureLoader().load(textureUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }, [textureUrl]);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// --- Hotspot Marker in 3D Space ---
const HotspotMarker = ({ hotspot, onSelect, isActive, selectedOption }) => {
  const category = SWAP_CATEGORIES[hotspot.id];
  if (!category) return null;

  const r = 12;
  const x = r * Math.sin(hotspot.phi) * Math.cos(hotspot.theta);
  const y = hotspot.y * r;
  const z = r * Math.sin(hotspot.phi) * Math.sin(hotspot.theta);

  return (
    <Html position={[x, y, z]} center distanceFactor={20}>
      <button
        data-testid={`hotspot-${hotspot.id}`}
        onClick={(e) => { e.stopPropagation(); onSelect(hotspot.id); }}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold 
          transition-all duration-300 cursor-pointer whitespace-nowrap select-none
          ${isActive 
            ? 'bg-[#FF8C42] text-white scale-110 shadow-lg shadow-[#FF8C42]/40' 
            : 'bg-black/70 text-white hover:bg-[#FF8C42]/80 hover:scale-105 backdrop-blur-sm'
          }
        `}
        style={{ border: isActive ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)' }}
      >
        <span className="text-sm">{category.icon}</span>
        <span>{category.label}</span>
        {selectedOption && (
          <CheckCircle className="h-3 w-3 text-green-300 ml-0.5" />
        )}
      </button>
    </Html>
  );
};

// --- 3D Scene ---
const Scene3D = ({ textureUrl, swaps, activeHotspot, setActiveHotspot, selections }) => {
  return (
    <>
      <ambientLight intensity={1} />
      <PanoramaSphere textureUrl={textureUrl} swaps={swaps} />
      {DEFAULT_HOTSPOTS.map((hs) => (
        <HotspotMarker
          key={hs.id}
          hotspot={hs}
          onSelect={setActiveHotspot}
          isActive={activeHotspot === hs.id}
          selectedOption={selections[hs.id]}
        />
      ))}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={40}
        rotateSpeed={-0.3}
        zoomSpeed={0.5}
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  );
};

// --- Image Upload Step ---
const UploadStep = ({ photos, setPhotos, onComplete }) => {
  const fileRefs = [useRef(), useRef(), useRef()];
  const labels = ['Ляв ъгъл', 'Фронтален', 'Десен ъгъл'];
  const descriptions = ['Снимайте от ляво', 'Снимайте отпред', 'Снимайте от дясно'];
  const icons = ['←', '↑', '→'];

  const convertToJpeg = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.92);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFile = useCallback(async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const jpegFile = await convertToJpeg(file);
    const url = URL.createObjectURL(jpegFile);
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = { file: jpegFile, url };
      return next;
    });
  }, [convertToJpeg, setPhotos]);

  const removePhoto = useCallback((index) => {
    setPhotos((prev) => {
      const next = [...prev];
      if (next[index]?.url) URL.revokeObjectURL(next[index].url);
      next[index] = null;
      return next;
    });
  }, [setPhotos]);

  const allUploaded = photos.every(Boolean);

  return (
    <div className="space-y-6" data-testid="upload-step">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[#8C56FF]/15 border border-[#8C56FF]/30 rounded-full px-4 py-1.5 mb-4">
          <Camera className="h-4 w-4 text-[#8C56FF]" />
          <span className="text-xs font-medium text-[#8C56FF]">СТЪПКА 1: КАЧЕТЕ СНИМКИ</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Заснемете помещението от 3 ъгъла</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Снимайте стаята от ляво, фронтално и от дясно. AI ще създаде 360° панорама от вашите снимки.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative group">
            <input
              ref={fileRefs[i]}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(i, e)}
              data-testid={`upload-input-${i}`}
            />
            {photos[i] ? (
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#8C56FF]/50 bg-[#253545]">
                <img src={photos[i].url} alt={labels[i]} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-[#8C56FF] text-white text-xs">{labels[i]}</Badge>
                </div>
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                  data-testid={`remove-photo-${i}`}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-400" /> Качена
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRefs[i].current?.click()}
                className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#8C56FF]/50 bg-[#253545]/50 hover:bg-[#253545] transition-all flex flex-col items-center justify-center gap-3 group"
                data-testid={`upload-btn-${i}`}
              >
                <div className="w-14 h-14 rounded-full bg-[#8C56FF]/15 flex items-center justify-center text-3xl font-bold text-[#8C56FF]/60 group-hover:text-[#8C56FF] transition-colors">
                  {icons[i]}
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">{labels[i]}</p>
                  <p className="text-slate-500 text-xs">{descriptions[i]}</p>
                </div>
                <Upload className="h-4 w-4 text-slate-500 group-hover:text-[#8C56FF] transition-colors" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          disabled={!allUploaded}
          onClick={onComplete}
          className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white px-10 h-12 text-base disabled:opacity-40"
          data-testid="generate-3d-btn"
        >
          <Move3D className="mr-2 h-5 w-5" />
          Генерирай 3D модел
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-[#0F1923] rounded-xl border border-[#2A3A4C] p-4 mt-4">
        <p className="text-xs font-medium text-[#FF8C42] mb-2">Съвети за по-добър резултат:</p>
        <ul className="text-xs text-slate-400 space-y-1.5">
          <li className="flex items-start gap-2"><CheckCircle className="h-3 w-3 text-[#28A745] mt-0.5 flex-shrink-0" /> Снимайте при дневна светлина за най-добро качество</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-3 w-3 text-[#28A745] mt-0.5 flex-shrink-0" /> Дръжте камерата на нивото на очите</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-3 w-3 text-[#28A745] mt-0.5 flex-shrink-0" /> Включете 50% припокриване между снимките</li>
        </ul>
      </div>
    </div>
  );
};

// --- Swap Panel ---
const SwapPanel = ({ activeHotspot, selections, setSelections, onClose }) => {
  const category = SWAP_CATEGORIES[activeHotspot];
  if (!category) return null;

  return (
    <div className="absolute right-4 top-4 w-72 bg-[#1E2A38]/95 backdrop-blur-md border border-[#3A4A5C] rounded-xl shadow-2xl z-20 overflow-hidden" data-testid="swap-panel">
      <div className="bg-[#0F1923] px-4 py-3 flex items-center justify-between border-b border-[#2A3A4C]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <h3 className="text-white font-semibold text-sm">{category.label}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" data-testid="close-swap-panel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {category.options.map((opt) => {
          const isSelected = selections[activeHotspot]?.id === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelections((prev) => ({ ...prev, [activeHotspot]: opt }))}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                isSelected
                  ? 'bg-[#FF8C42]/20 border border-[#FF8C42]/50'
                  : 'bg-[#253545]/50 border border-transparent hover:border-[#3A4A5C] hover:bg-[#253545]'
              }`}
              data-testid={`swap-option-${opt.id}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/10"
                style={{ backgroundColor: opt.color }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isSelected ? 'text-[#FF8C42]' : 'text-white'}`}>{opt.name}</p>
                <p className="text-xs text-slate-400">{opt.price} EUR</p>
              </div>
              {isSelected && <CheckCircle className="h-4 w-4 text-[#FF8C42] flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Results Summary ---
const ResultsSummary = ({ selections, onPDF, onShare, onSave, projectId }) => {
  const selected = Object.entries(selections).filter(([, v]) => v);
  const total = selected.reduce((sum, [, opt]) => sum + (opt?.price || 0), 0);

  if (selected.length === 0) return null;

  return (
    <div className="bg-[#0F1923] rounded-xl border border-[#2A3A4C] p-5" data-testid="results-summary">
      <h3 className="text-white font-bold text-base mb-4">Избрани елементи</h3>
      <div className="space-y-3 mb-4">
        {selected.map(([key, opt]) => {
          const cat = SWAP_CATEGORIES[key];
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{cat?.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{cat?.label}</p>
                  <p className="text-slate-500 text-xs">{opt.name}</p>
                </div>
              </div>
              <span className="text-[#FF8C42] font-bold text-sm">{opt.price} EUR</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[#2A3A4C]">
        <span className="text-slate-400 text-sm">Общо:</span>
        <span className="text-white font-bold text-lg">{total.toLocaleString()} EUR</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <Button
          onClick={onPDF}
          className="bg-[#28A745] hover:bg-[#22943e] text-white text-xs h-10"
          data-testid="pdf-btn"
        >
          <FileText className="mr-1 h-3.5 w-3.5" /> PDF Сметка
        </Button>
        <Button
          onClick={() => window.open('/companies', '_blank')}
          className="bg-[#4DA6FF] hover:bg-[#3d96ef] text-white text-xs h-10"
          data-testid="companies-btn"
        >
          <Building2 className="mr-1 h-3.5 w-3.5" /> Фирми
        </Button>
        <Button
          onClick={onShare}
          className="bg-[#FF8C42] hover:bg-[#e67a30] text-white text-xs h-10"
          data-testid="share-btn"
        >
          <Share2 className="mr-1 h-3.5 w-3.5" /> Сподели
        </Button>
        <Button
          onClick={onSave}
          className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white text-xs h-10"
          data-testid="save-project-btn"
        >
          <Save className="mr-1 h-3.5 w-3.5" /> Запази
        </Button>
      </div>
      {projectId && (
        <div className="mt-3 flex items-center gap-2 bg-[#253545] rounded-lg p-3 border border-[#3A4A5C]">
          <Link2 className="h-4 w-4 text-[#8C56FF] flex-shrink-0" />
          <span className="text-slate-400 text-xs">Линк за споделяне:</span>
          <code className="text-[#8C56FF] text-xs flex-1 truncate">{`${window.location.origin}/3d-scanner/${projectId}`}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/3d-scanner/${projectId}`); toast.success('Линкът е копиран'); }}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="copy-link-btn"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---
export const Scanner3DPage = () => {
  const [photos, setPhotos] = useState([null, null, null]);
  const [panoramaUrl, setPanoramaUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [selections, setSelections] = useState({});
  const [projectId, setProjectId] = useState(null);
  const canvasRef = useRef();

  // Stitch 3 images into one panoramic strip
  const stitchPanorama = useCallback((photoObjects) => {
    return new Promise((resolve) => {
      const images = [];
      let loaded = 0;

      photoObjects.forEach((p, i) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          images[i] = img;
          loaded++;
          if (loaded === 3) {
            // Create a wide canvas: left | front | right
            const h = Math.max(...images.map((im) => im.height));
            const scale = (idx) => h / images[idx].height;
            const widths = images.map((im, idx) => Math.round(im.width * scale(idx)));
            const totalW = widths.reduce((a, b) => a + b, 0);

            const canvas = document.createElement('canvas');
            canvas.width = totalW;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            // Draw: left → front → right
            let offsetX = 0;
            [0, 1, 2].forEach((idx) => {
              ctx.drawImage(images[idx], offsetX, 0, widths[idx], h);
              offsetX += widths[idx];
            });

            resolve(canvas.toDataURL('image/jpeg', 0.9));
          }
        };
        img.src = p.url;
      });
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!photos.every(Boolean)) return;
    setGenerating(true);
    try {
      const url = await stitchPanorama(photos);
      setPanoramaUrl(url);
      toast.success('3D модел генериран успешно!');
    } catch {
      toast.error('Грешка при генериране');
    }
    setGenerating(false);
  }, [photos, stitchPanorama]);

  const handleReset = useCallback(() => {
    photos.forEach((p) => p?.url && URL.revokeObjectURL(p.url));
    setPhotos([null, null, null]);
    setPanoramaUrl(null);
    setActiveHotspot(null);
    setSelections({});
  }, [photos]);

  const handlePDF = useCallback(async () => {
    const selected = Object.entries(selections).filter(([, v]) => v);
    if (selected.length === 0) {
      toast.error('Изберете поне един елемент');
      return;
    }
    try {
      const items = selected.map(([key, opt]) => ({
        category: SWAP_CATEGORIES[key]?.label || key,
        name: opt.name,
        price: opt.price,
      }));
      const res = await axios.post(`${API}/scanner3d/pdf`, { items }, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'temadom-3d-smetka.pdf';
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PDF сметката е изтеглена');
    } catch {
      toast.error('Грешка при генериране на PDF');
    }
  }, [selections]);

  const handleShare = useCallback(() => {
    const text = `Вижте моя 3D проект в TemaDom!`;
    const url = `${SITE_URL}/3d-scanner`;
    if (navigator.share) {
      navigator.share({ title: 'TemaDom 3D Скенер', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success('Линкът е копиран');
    }
  }, []);

  const handleSave = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Моля, влезте в профила си за да запазите проекта');
      return;
    }
    try {
      const res = await axios.post(`${API}/scanner3d/projects`, {
        title: '3D Проект',
        selections,
        photos: [],
      }, { headers: { Authorization: `Bearer ${token}` } });
      setProjectId(res.data.id);
      toast.success('Проектът е запазен! Споделете линка.');
    } catch {
      toast.error('Грешка при запазване');
    }
  }, [selections]);

  return (
    <div className="min-h-screen bg-[#1E2A38]" data-testid="scanner-3d-page">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0F1923] to-[#1E2A38] border-b border-[#2A3A4C]">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#8C56FF]/15 border border-[#8C56FF]/30 rounded-full px-5 py-2 mb-5">
            <Move3D className="h-4 w-4 text-[#8C56FF]" />
            <span className="text-xs font-bold text-[#8C56FF] tracking-wider">3D МУЛТИ-ЪГЛОВ СКЕНЕР</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            360° Виртуален <span className="text-[#8C56FF]">3D модел</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Качете 3 снимки на помещението и получете интерактивен 3D модел. 
            Сменяйте мебели, плочки и оборудване с едно кликване.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!panoramaUrl ? (
          /* Upload phase */
          generating ? (
            <div className="flex flex-col items-center justify-center py-24" data-testid="generating-spinner">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-[#8C56FF]/20 border-t-[#8C56FF] animate-spin" />
                <Move3D className="h-8 w-8 text-[#8C56FF] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-white font-medium mt-6">Генериране на 3D модел...</p>
              <p className="text-slate-500 text-sm mt-1">Обработка на снимките и създаване на панорама</p>
            </div>
          ) : (
            <UploadStep photos={photos} setPhotos={setPhotos} onComplete={handleGenerate} />
          )
        ) : (
          /* 3D View phase */
          <div className="space-y-6">
            {/* Controls bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#28A745]/20 text-[#28A745] border-[#28A745]/30">
                  <Eye className="h-3 w-3 mr-1" /> 3D Преглед
                </Badge>
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <MousePointer className="h-3 w-3" /> Плъзнете за въртене | Scroll за мащаб
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-[#3A4A5C] text-slate-300 hover:bg-[#253545]"
                data-testid="reset-btn"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Нов проект
              </Button>
            </div>

            {/* 3D Canvas + Swap Panel */}
            <div className="relative">
              <div
                className="w-full rounded-2xl overflow-hidden border border-[#3A4A5C] bg-black"
                style={{ height: 'min(65vh, 550px)' }}
                data-testid="canvas-3d"
              >
                <Canvas
                  ref={canvasRef}
                  camera={{ fov: 75, position: [0, 0, 0.1], near: 0.1, far: 100 }}
                  gl={{ antialias: true, alpha: false }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Suspense fallback={null}>
                    <Scene3D
                      textureUrl={panoramaUrl}
                      swaps={selections}
                      activeHotspot={activeHotspot}
                      setActiveHotspot={setActiveHotspot}
                      selections={selections}
                    />
                  </Suspense>
                </Canvas>
              </div>

              {activeHotspot && (
                <SwapPanel
                  activeHotspot={activeHotspot}
                  selections={selections}
                  setSelections={setSelections}
                  onClose={() => setActiveHotspot(null)}
                />
              )}
            </div>

            {/* Hotspot quick-select chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {DEFAULT_HOTSPOTS.map((hs) => {
                const cat = SWAP_CATEGORIES[hs.id];
                const sel = selections[hs.id];
                return (
                  <button
                    key={hs.id}
                    onClick={() => setActiveHotspot(activeHotspot === hs.id ? null : hs.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all ${
                      activeHotspot === hs.id
                        ? 'bg-[#FF8C42] text-white'
                        : sel
                        ? 'bg-[#253545] text-[#FF8C42] border border-[#FF8C42]/30'
                        : 'bg-[#253545] text-slate-300 border border-[#3A4A5C] hover:border-[#FF8C42]/30'
                    }`}
                    data-testid={`chip-${hs.id}`}
                  >
                    <span>{cat?.icon}</span>
                    <span>{cat?.label}</span>
                    {sel && <CheckCircle className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <ResultsSummary selections={selections} onPDF={handlePDF} onShare={handleShare} onSave={handleSave} projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
};
