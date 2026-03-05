import React, { useState, useRef, useCallback, Suspense } from 'react';
import { Upload, Loader2, X, Download, Ruler, Building2, Layers, RotateCcw, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BUILDING_TYPES = [
  { id: 'residential', name: 'Жилищна сграда', icon: Building2 },
  { id: 'commercial', name: 'Търговски обект', icon: Building2 },
  { id: 'industrial', name: 'Промишлена сграда', icon: Layers },
  { id: 'renovation', name: 'Ремонт на помещение', icon: Ruler },
  { id: 'other', name: 'Друго', icon: Building2 },
];

// Three.js GLB Viewer component
const GlbViewer = ({ glbBase64 }) => {
  const [scene, setScene] = useState(null);

  React.useEffect(() => {
    if (!glbBase64) return;
    const binary = atob(glbBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      setScene(gltf.scene);
      URL.revokeObjectURL(url);
    });
  }, [glbBase64]);

  if (!scene) return null;
  return <primitive object={scene} />;
};

export const AISketchPage = () => {
  const [sketches, setSketches] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [buildingType, setBuildingType] = useState('residential');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef0 = useRef(null);
  const fileRef1 = useRef(null);
  const fileRef2 = useRef(null);
  const fileRefs = [fileRef0, fileRef1, fileRef2];

  const convertToJpeg = (file) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = useCallback(async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Файлът е твърде голям (макс. 15MB)');
      return;
    }
    try {
      const jpegDataUrl = await convertToJpeg(file);
      setSketches(prev => { const n = [...prev]; n[index] = jpegDataUrl; return n; });
      setPreviews(prev => { const n = [...prev]; n[index] = jpegDataUrl; return n; });
      toast.success(`Файл ${index + 1} качен`);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSketches(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
        setPreviews(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeFile = (index) => {
    setSketches(prev => { const n = [...prev]; n[index] = null; return n; });
    setPreviews(prev => { const n = [...prev]; n[index] = null; return n; });
  };

  const uploadedCount = sketches.filter(Boolean).length;

  const handleAnalyze = async () => {
    if (uploadedCount === 0) {
      toast.error('Качете поне 1 скица или чертеж');
      return;
    }
    setLoading(true);
    try {
      const validSketches = sketches.filter(Boolean);
      const res = await axios.post(`${API}/ai-sketch/analyze`, {
        sketches: validSketches,
        building_type: buildingType,
        notes
      }, { timeout: 300000 });
      setResults(res.data);
      toast.success('3D модел генериран успешно!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при анализ. Опитайте отново.');
    }
    setLoading(false);
  };

  const downloadGlb = () => {
    if (!results?.glb_base64) return;
    const binary = atob(results.glb_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temadom-sketch-${results.id || 'model'}.glb`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('.glb файл изтеглен');
  };

  const reset = () => {
    setSketches([null, null, null]);
    setPreviews([null, null, null]);
    setResults(null);
    setNotes('');
  };

  const summary = results?.summary;
  const geometry = results?.geometry;

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ai-sketch-page">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FF8C42]/15 border border-[#FF8C42]/30 rounded-full px-4 py-2 mb-4">
            <Ruler className="h-5 w-5 text-[#FF8C42]" />
            <span className="font-medium text-sm text-[#FF8C42]">AI SKETCH — CV/OCR Pipeline</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Скица &rarr; 3D модел (.glb)
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Качете ръчна скица или чертеж. OpenCV разпознава линии, Tesseract чете размери — генерира се ТОЧЕН 3D модел без халюцинации.
          </p>
        </div>

        {/* 4 steps */}
        <div className="bg-[#0F1923] rounded-xl border border-[#2A3A4C] p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Качете скица', desc: 'Химикал, молив или маркер' },
              { step: '2', title: 'CV анализира линии', desc: 'OpenCV + Tesseract OCR' },
              { step: '3', title: '360 3D модел готов', desc: 'Въртете и мащабирайте' },
              { step: '4', title: 'Изтегли .glb файл', desc: 'Телефон + десктоп' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF8C42] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
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
            {/* Upload */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#FF8C42]" />
                  Качете скици/чертежи (1-3 файла)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      <input ref={fileRefs[idx]} type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleUpload(idx, e)} data-testid={`sketch-upload-${idx}`} />
                      {previews[idx] ? (
                        <div className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-[#FF8C42]/30">
                            <img src={previews[idx]} alt={`Sketch ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                          <button onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => fileRefs[idx].current?.click()}
                          className="aspect-square w-full rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#FF8C42]/50 flex flex-col items-center justify-center gap-2 transition-colors bg-[#1E2A38]/50"
                          data-testid={`sketch-upload-btn-${idx}`}>
                          <Upload className="h-6 w-6 text-slate-500" />
                          <span className="text-slate-500 text-xs">Файл {idx + 1}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-3">JPG, PNG, WebP (макс. 15MB). Ръчни скици, чертежи с размери.</p>
              </CardContent>
            </Card>

            {/* Building Type */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader><CardTitle className="text-white text-sm">Тип строеж</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {BUILDING_TYPES.map(bt => {
                    const Icon = bt.icon;
                    return (
                      <button key={bt.id} onClick={() => setBuildingType(bt.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          buildingType === bt.id ? 'border-[#FF8C42] bg-[#FF8C42]/10' : 'border-[#3A4A5C] hover:border-[#FF8C42]/30'
                        }`} data-testid={`building-type-${bt.id}`}>
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${buildingType === bt.id ? 'text-[#FF8C42]' : 'text-slate-500'}`} />
                        <p className="text-white text-xs font-medium">{bt.name}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardContent className="pt-5">
                <Label className="text-slate-300 text-sm mb-2 block">Бележки (по избор)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Допълнителни размери, бележки..."
                  className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[80px]" data-testid="sketch-notes" />
              </CardContent>
            </Card>

            {/* Generate */}
            <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white text-lg h-14 shadow-lg shadow-[#FF8C42]/20"
              onClick={handleAnalyze} disabled={uploadedCount === 0 || loading} data-testid="analyze-btn">
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> CV анализира... (5-15 сек)</>
              ) : (
                <><Ruler className="mr-2 h-5 w-5" /> Генерирай 3D модел ({uploadedCount} файла)</>
              )}
            </Button>
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-6">
            {/* 3D Viewer */}
            <Card className="bg-[#253545] border-[#3A4A5C] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#4DA6FF]" />
                    360 3D модел
                  </CardTitle>
                  <Button onClick={downloadGlb} className="bg-[#28A745] hover:bg-[#22943e] text-white" data-testid="download-glb-btn">
                    <Download className="mr-2 h-4 w-4" /> Изтегли .glb
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px] md:h-[500px] bg-[#0F1923] rounded-xl overflow-hidden border border-[#3A4A5C]" data-testid="3d-viewer">
                  <Canvas camera={{ position: [15, 12, 15], fov: 50 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 20, 10]} intensity={0.8} />
                    <Suspense fallback={null}>
                      <GlbViewer glbBase64={results.glb_base64} />
                    </Suspense>
                    <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={1} />
                  </Canvas>
                </div>
                <p className="text-slate-500 text-xs mt-2 text-center">
                  Задръжте мишката за въртене | Скролване за zoom | Среден бутон за преместване
                </p>
              </CardContent>
            </Card>

            {/* Summary */}
            {summary && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-[#FF8C42]" />
                    Резултат от анализа (CV/OCR)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1E2A38] rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[#FF8C42]">{summary.walls_detected}</p>
                      <p className="text-slate-400 text-xs">Стени</p>
                    </div>
                    <div className="bg-[#1E2A38] rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[#4DA6FF]">{summary.stairs_detected}</p>
                      <p className="text-slate-400 text-xs">Стълби</p>
                    </div>
                    <div className="bg-[#1E2A38] rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[#28A745]">{summary.dimensions_found}</p>
                      <p className="text-slate-400 text-xs">Размери (OCR)</p>
                    </div>
                    <div className="bg-[#1E2A38] rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[#8C56FF]">{summary.floor_area_sqm || '-'}</p>
                      <p className="text-slate-400 text-xs">Площ (м2)</p>
                    </div>
                  </div>
                  {summary.unknowns > 0 && (
                    <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-400 text-xs">{summary.unknowns} неразпознати елементи маркирани като "unknown"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detected geometry details */}
            {geometry && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Разпознати елементи</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {geometry.walls?.length > 0 && (
                    <div>
                      <h4 className="text-[#FF8C42] text-xs font-semibold mb-1">Стени ({geometry.walls.length})</h4>
                      <div className="grid gap-1">
                        {geometry.walls.map((w, i) => (
                          <div key={i} className="flex gap-3 text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                            <span className="text-white font-medium">Стена {i+1}</span>
                            <span>{w.orientation === 'horizontal' ? 'Хоризонтална' : 'Вертикална'}</span>
                            <span className="text-[#FF8C42]">{w.length_m}м</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {geometry.stairs?.length > 0 && (
                    <div>
                      <h4 className="text-[#4DA6FF] text-xs font-semibold mb-1">Стълби ({geometry.stairs.length})</h4>
                      {geometry.stairs.map((s, i) => (
                        <div key={i} className="text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                          Дължина: {s.length_m}м | Ъгъл: {s.angle}°
                        </div>
                      ))}
                    </div>
                  )}
                  {geometry.slab && (
                    <div>
                      <h4 className="text-[#28A745] text-xs font-semibold mb-1">Подова плоча</h4>
                      <div className="text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                        {geometry.slab.width_m}м x {geometry.slab.depth_m}м = {geometry.slab.area_sqm} м2
                      </div>
                    </div>
                  )}
                  {geometry.detected_dimensions?.length > 0 && (
                    <div>
                      <h4 className="text-[#8C56FF] text-xs font-semibold mb-1">OCR размери ({geometry.detected_dimensions.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {geometry.detected_dimensions.map((d, i) => (
                          <Badge key={i} className="bg-[#8C56FF]/15 text-[#8C56FF] border-[#8C56FF]/30">
                            {d.raw} = {d.value_m}м
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {geometry.unknowns?.length > 0 && (
                    <div>
                      <h4 className="text-yellow-500 text-xs font-semibold mb-1">Неразпознати ({geometry.unknowns.length})</h4>
                      {geometry.unknowns.map((u, i) => (
                        <div key={i} className="text-xs text-yellow-400 bg-yellow-500/10 rounded px-3 py-1.5">
                          {u.description}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Original sketches */}
            {previews.filter(Boolean).length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader><CardTitle className="text-white text-sm">Оригинални скици</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {previews.filter(Boolean).map((p, i) => (
                      <div key={i} className="w-24 h-24 rounded-lg overflow-hidden border border-[#3A4A5C]">
                        <img src={p} alt={`Sketch ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={reset} data-testid="new-sketch-btn">
                <RotateCcw className="mr-2 h-4 w-4" /> Нов анализ
              </Button>
              <Button className="bg-[#28A745] hover:bg-[#22943e] text-white" onClick={downloadGlb} data-testid="download-glb-btn-2">
                <Download className="mr-2 h-4 w-4" /> Изтегли .glb
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISketchPage;
