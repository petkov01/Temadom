import React, { useState, useRef, useCallback } from 'react';
import { Upload, Sparkles, Loader2, X, FileText, Download, Image, ChevronRight, ExternalLink, Ruler, Building2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PageInstructions } from './PageInstructions';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BUILDING_TYPES = [
  { id: 'residential', name: 'Жилищна сграда', icon: Building2 },
  { id: 'commercial', name: 'Търговски обект', icon: Building2 },
  { id: 'industrial', name: 'Промишлена сграда', icon: Layers },
  { id: 'renovation', name: 'Ремонт на помещение', icon: Ruler },
  { id: 'other', name: 'Друго', icon: Building2 },
];

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

  const handleUpload = useCallback((index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Файлът е твърде голям (макс. 15MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSketches(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
      setPreviews(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
      toast.success(`Файл ${index + 1} качен успешно`);
    };
    reader.readAsDataURL(file);
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
      toast.success('Анализът е готов!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при анализ. Опитайте отново.');
    }
    setLoading(false);
  };

  const reset = () => {
    setSketches([null, null, null]);
    setPreviews([null, null, null]);
    setResults(null);
    setNotes('');
  };

  const analysis = results?.analysis;
  const elements = analysis?.structural_elements;

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ai-sketch-page">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FF8C42]/15 border border-[#FF8C42]/30 rounded-full px-4 py-2 mb-4">
            <Ruler className="h-5 w-5 text-[#FF8C42]" />
            <span className="font-medium text-sm text-[#FF8C42]">AI SKETCH</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Скица &rarr; Чертеж + 3D визуализация
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Качете 1-3 снимки/скици/чертежи. AI ще разпознае колони, греди, стълби, фундаменти и покрив, ще генерира точен структурен чертеж (95-100%) и визуализация.
          </p>
        </div>

        <PageInstructions
          title="Как работи AI Sketch?"
          description="AI анализира вашите скици и чертежи за структурни елементи"
          steps={[
            'Качете 1-3 снимки на скици, чертежи или реални обекти',
            'Изберете тип строеж и добавете бележки',
            'AI анализира и разпознава: колони, греди, стълби, фундаменти, покрив',
            'Получавате: 2D чертеж, 3D визуализация и количествена сметка с 95-100% точност'
          ]}
          benefits={['Бърз анализ с AI', 'Точна количествена сметка', '2D план + 3D визуализация']}
        />

        {!results ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#FF8C42]" />
                  Качете скици/чертежи/снимки (1-3 файла)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      <input
                        ref={fileRefs[idx]}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(idx, e)}
                        data-testid={`sketch-upload-${idx}`}
                      />
                      {previews[idx] ? (
                        <div className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-[#FF8C42]/30">
                            <img src={previews[idx]} alt={`Sketch ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileRefs[idx].current?.click()}
                          className="aspect-square w-full rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#FF8C42]/50 flex flex-col items-center justify-center gap-2 transition-colors bg-[#1E2A38]/50"
                          data-testid={`sketch-upload-btn-${idx}`}
                        >
                          <Upload className="h-6 w-6 text-slate-500" />
                          <span className="text-slate-500 text-xs">Файл {idx + 1}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-3">Поддържа: снимки на скици, ръчни чертежи, реални обекти. Формати: JPG, PNG, WebP (макс. 15MB)</p>
              </CardContent>
            </Card>

            {/* Building Type */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Тип строеж</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {BUILDING_TYPES.map(bt => {
                    const Icon = bt.icon;
                    return (
                      <button
                        key={bt.id}
                        onClick={() => setBuildingType(bt.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          buildingType === bt.id ? 'border-[#FF8C42] bg-[#FF8C42]/10' : 'border-[#3A4A5C] hover:border-[#FF8C42]/30'
                        }`}
                        data-testid={`building-type-${bt.id}`}
                      >
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
                <Label className="text-slate-300 text-sm mb-2 block">Допълнителни бележки (по избор)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Опишете какво вижда скицата, специални изисквания..."
                  className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[80px]"
                  data-testid="sketch-notes"
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white text-lg h-14 shadow-lg shadow-[#FF8C42]/20"
              onClick={handleAnalyze}
              disabled={uploadedCount === 0 || loading}
              data-testid="analyze-btn"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> AI анализира... (30-120 сек)</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" /> Генерирай чертеж + визуализация ({uploadedCount} файла)</>
              )}
            </Button>

            {/* 3D model coming soon notice */}
            <div className="text-center">
              <Badge className="bg-[#8C56FF]/15 text-[#8C56FF] border border-[#8C56FF]/30 px-4 py-2">
                <Layers className="h-4 w-4 mr-2 inline" />
                3D модел (Meshy.ai) - Очаквайте скоро
              </Badge>
            </div>
          </div>
        ) : (
          /* ===== RESULTS ===== */
          <div className="space-y-6">
            {/* Generated Views */}
            {results.generated_views?.length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C] overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Image className="h-5 w-5 text-[#4DA6FF]" />
                    Генерирани визуализации
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {results.generated_views.map((view, i) => (
                      <div key={i}>
                        <p className="text-[#FF8C42] text-xs mb-2 uppercase tracking-wider font-medium">{view.label}</p>
                        <div className="rounded-xl overflow-hidden border border-[#FF8C42]/30">
                          <img
                            src={`data:image/png;base64,${view.image_base64}`}
                            alt={view.label}
                            className="w-full"
                            data-testid={`sketch-view-${i}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Original sketches for reference */}
            {previews.filter(Boolean).length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Оригинални скици</CardTitle>
                </CardHeader>
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

            {/* Structural Analysis */}
            {analysis && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-[#FF8C42]" />
                    Структурен анализ (95-100% точност)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dimensions Summary */}
                  {analysis.dimensions_summary && (
                    <div className="bg-[#1E2A38] rounded-lg p-4">
                      <h4 className="text-white text-sm font-semibold mb-2">Общи размери</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {Object.entries(analysis.dimensions_summary).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-400 capitalize">{key}:</span>{' '}
                            <span className="text-white font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structural Elements */}
                  {elements && (
                    <div className="space-y-3">
                      {elements.columns?.length > 0 && (
                        <div>
                          <h4 className="text-[#FF8C42] text-sm font-semibold mb-1">Колони ({elements.columns.length})</h4>
                          <div className="grid gap-1">
                            {elements.columns.map((c, i) => (
                              <div key={i} className="flex gap-3 text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                                <span className="text-white font-medium">{c.id}</span>
                                <span>{c.type}</span>
                                <span>{c.dimensions}</span>
                                <span className="text-slate-500">{c.position}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {elements.beams?.length > 0 && (
                        <div>
                          <h4 className="text-[#4DA6FF] text-sm font-semibold mb-1">Греди ({elements.beams.length})</h4>
                          <div className="grid gap-1">
                            {elements.beams.map((b, i) => (
                              <div key={i} className="flex gap-3 text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                                <span className="text-white font-medium">{b.id}</span>
                                <span>{b.type}</span>
                                <span>{b.dimensions}</span>
                                <span>L={b.span}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {elements.walls?.length > 0 && (
                        <div>
                          <h4 className="text-[#28A745] text-sm font-semibold mb-1">Стени ({elements.walls.length})</h4>
                          <div className="grid gap-1">
                            {elements.walls.map((w, i) => (
                              <div key={i} className="flex gap-3 text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                                <span className="text-white font-medium">{w.type}</span>
                                <span>{w.material}</span>
                                <span>{w.thickness}</span>
                                <span>L={w.length}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {elements.foundations && (
                        <div>
                          <h4 className="text-[#8C56FF] text-sm font-semibold mb-1">Фундаменти</h4>
                          {(Array.isArray(elements.foundations) ? elements.foundations : [elements.foundations]).map((f, i) => (
                            <div key={i} className="text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                              {f.type} | {f.width} x {f.depth} | {f.material}
                            </div>
                          ))}
                        </div>
                      )}

                      {elements.roof && (
                        <div>
                          <h4 className="text-[#DC3545] text-sm font-semibold mb-1">Покрив</h4>
                          <div className="text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                            {elements.roof.type} | Наклон: {elements.roof.slope} | {elements.roof.material} | Площ: {elements.roof.area}
                          </div>
                        </div>
                      )}

                      {elements.stairs?.length > 0 && (
                        <div>
                          <h4 className="text-yellow-500 text-sm font-semibold mb-1">Стълби</h4>
                          {elements.stairs.map((s, i) => (
                            <div key={i} className="text-xs text-slate-300 bg-[#1E2A38] rounded px-3 py-1.5">
                              {s.type} | Ширина: {s.width} | {s.steps} стъпала | Стъпка: {s.rise}/{s.tread}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Materials Estimate */}
            {analysis?.materials_estimate?.length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#FF8C42]" />
                    Количествена сметка
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="sketch-materials-table">
                      <thead>
                        <tr className="border-b border-[#3A4A5C]">
                          <th className="text-left py-2 text-slate-400 font-medium">Материал</th>
                          <th className="text-left py-2 text-slate-400 font-medium">Кол-во</th>
                          <th className="text-right py-2 text-slate-400 font-medium">Ед. цена</th>
                          <th className="text-right py-2 text-slate-400 font-medium">Общо (лв / EUR)</th>
                          <th className="text-right py-2 text-slate-400 font-medium">Магазин</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.materials_estimate.map((m, i) => (
                          <tr key={i} className="border-b border-[#3A4A5C]/50 hover:bg-[#1E2A38]/50">
                            <td className="py-2 text-white">{m.name}</td>
                            <td className="py-2 text-slate-300">{m.quantity} {m.unit}</td>
                            <td className="py-2 text-slate-300 text-right">
                              {m.price_per_unit_bgn} лв
                              <span className="text-slate-500 text-xs ml-1">/ {m.price_per_unit_eur} EUR</span>
                            </td>
                            <td className="py-2 text-right">
                              <span className="text-[#FF8C42] font-medium">{m.total_bgn} лв</span>
                              <span className="text-slate-400 text-xs block">{m.total_eur} EUR</span>
                            </td>
                            <td className="py-2 text-right text-slate-500 text-xs">{m.store || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#FF8C42]/30">
                          <td colSpan="3" className="py-3 text-white font-bold">Материали:</td>
                          <td className="py-3 text-right text-[#FF8C42] font-bold">{analysis.total_materials_bgn} лв / {analysis.total_materials_eur} EUR</td>
                          <td />
                        </tr>
                        {analysis.labor_bgn && (
                          <tr>
                            <td colSpan="3" className="py-1 text-slate-300">Труд:</td>
                            <td className="py-1 text-right text-slate-300">{analysis.labor_bgn} лв / {analysis.labor_eur} EUR</td>
                            <td />
                          </tr>
                        )}
                        {analysis.grand_total_bgn && (
                          <tr className="border-t border-[#3A4A5C]">
                            <td colSpan="3" className="py-3 text-white font-bold text-lg">ОБЩА СТОЙНОСТ:</td>
                            <td className="py-3 text-right text-[#28A745] font-bold text-xl">{analysis.grand_total_bgn} лв / {analysis.grand_total_eur} EUR</td>
                            <td />
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                  {analysis.accuracy_note && (
                    <p className="text-xs text-slate-500 mt-3">{analysis.accuracy_note}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3D Coming Soon */}
            <div className="text-center py-4">
              <Badge className="bg-[#8C56FF]/15 text-[#8C56FF] border border-[#8C56FF]/30 px-4 py-2">
                <Layers className="h-4 w-4 mr-2 inline" />
                3D модел (.glb) с Meshy.ai - Очаквайте скоро
              </Badge>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={reset} data-testid="new-sketch-btn">
                <Upload className="mr-2 h-4 w-4" /> Нов анализ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISketchPage;
