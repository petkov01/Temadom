import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, X, Download, CheckCircle, ClipboardList, BarChart3, Ruler, Building2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AIChartPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showLabor, setShowLabor] = useState(true);
  const [showMaterials, setShowMaterials] = useState(true);
  const fileRef = useRef(null);

  const convertToJpeg = useCallback((file) => {
    return new Promise((resolve) => {
      const img = new Image();
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
        }, 'image/jpeg', 0.92);
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Файлът е твърде голям (макс. 20MB)');
      return;
    }
    try {
      const jpegDataUrl = await convertToJpeg(file);
      setImage(jpegDataUrl);
      setPreview(jpegDataUrl);
      toast.success('Чертежът е качен');
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target.result);
        setPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [convertToJpeg]);

  const handleAnalyze = async () => {
    if (!image) { toast.error('Качете чертеж'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/ai-chart/analyze`, { image, notes }, { timeout: 120000 });
      setResults(res.data);
      toast.success('Анализът е готов!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при анализ');
    }
    setLoading(false);
  };

  const handlePDF = async () => {
    if (!results) return;
    setPdfLoading(true);
    try {
      const res = await axios.post(`${API}/ai-chart/pdf-contract`, {
        title: results.title || 'Количествена сметка',
        description: results.description || '',
        materials: results.materials || [],
        labor: results.labor || [],
        summary: results.summary || {},
        client_name: clientName,
        client_address: clientAddress,
        contractor_name: contractorName,
      }, { responseType: 'blob', timeout: 30000 });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'temadom-dogovor-smetka.pdf';
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PDF договорът е изтеглен!');
    } catch {
      toast.error('Грешка при генериране на PDF');
    }
    setPdfLoading(false);
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResults(null);
    setNotes('');
    setClientName('');
    setClientAddress('');
    setContractorName('');
  };

  const materials = results?.materials || [];
  const labor = results?.labor || [];
  const summary = results?.summary || {};

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ai-chart-page">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#28A745]/15 border border-[#28A745]/30 rounded-full px-5 py-2 mb-4">
            <ClipboardList className="h-4 w-4 text-[#28A745]" />
            <span className="text-xs font-bold text-[#28A745] tracking-wider">AI АНАЛИЗАТОР НА ЧЕРТЕЖИ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Чертеж &rarr; <span className="text-[#28A745]">Количествена сметка</span> + PDF Договор
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Качете технически чертеж или скица. AI ще анализира конструкцията с 95-100% точност и ще генерира пълна количествена сметка с цени и готов PDF договор за подписване.
          </p>
        </div>

        {!results ? (
          /* === Upload & Analyze Phase === */
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardContent className="p-6">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  data-testid="chart-upload-input"
                />
                {preview ? (
                  <div className="relative">
                    <div className="rounded-xl overflow-hidden border-2 border-[#28A745]/30 bg-[#0F1923]">
                      <img src={preview} alt="Чертеж" className="w-full max-h-[400px] object-contain" />
                    </div>
                    <button
                      onClick={() => { setImage(null); setPreview(null); }}
                      className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5"
                      data-testid="remove-chart"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-[#28A745] text-white">
                        <CheckCircle className="h-3 w-3 mr-1" /> Чертеж качен
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#28A745]/50 bg-[#0F1923]/50 hover:bg-[#0F1923] transition-all flex flex-col items-center justify-center gap-4"
                    data-testid="chart-upload-btn"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#28A745]/15 flex items-center justify-center">
                      <Upload className="h-7 w-7 text-[#28A745]" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">Качете технически чертеж</p>
                      <p className="text-slate-500 text-sm mt-1">Стълби, фундаменти, покриви, етажни планове</p>
                      <p className="text-slate-600 text-xs mt-1">JPG, PNG, до 20MB</p>
                    </div>
                  </button>
                )}

                {/* Notes */}
                <div className="mt-5">
                  <Label className="text-slate-300 text-sm">Допълнителни бележки (по избор)</Label>
                  <Textarea
                    placeholder="Напр. стълбище 3 етажа, бетонен фундамент, дървен покрив..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5 bg-[#0F1923] border-[#3A4A5C] text-white"
                    data-testid="chart-notes"
                  />
                </div>

                {/* Analyze button */}
                <Button
                  size="lg"
                  disabled={!image || loading}
                  onClick={handleAnalyze}
                  className="w-full mt-5 bg-[#28A745] hover:bg-[#22943e] text-white h-12 text-base disabled:opacity-40"
                  data-testid="analyze-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI анализира чертежа...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Анализирай с AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Loading state */}
            {loading && (
              <div className="text-center py-8" data-testid="loading-state">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full border-4 border-[#28A745]/20 border-t-[#28A745] animate-spin" />
                  <ClipboardList className="h-7 w-7 text-[#28A745] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-white font-medium mt-4">AI анализира вашия чертеж...</p>
                <p className="text-slate-500 text-sm mt-1">Извличане на конструктивни елементи, размери и количества</p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-[#0F1923] rounded-xl border border-[#2A3A4C] p-4">
              <p className="text-xs font-medium text-[#28A745] mb-2">Какво може да анализира AI:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-[#28A745]" /> Стълбища и стъпала</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-[#28A745]" /> Фундаменти и основи</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-[#28A745]" /> Колони и греди</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-[#28A745]" /> Покривни конструкции</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-[#28A745]" /> Етажни планове</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-[#28A745]" /> Носещи стени</div>
              </div>
            </div>
          </div>
        ) : (
          /* === Results Phase === */
          <div className="space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#28A745]/20 text-[#28A745] border-[#28A745]/30">
                  <CheckCircle className="h-3 w-3 mr-1" /> Анализ готов
                </Badge>
                {results.accuracy_note && (
                  <span className="text-slate-500 text-xs">{results.accuracy_note}</span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="border-[#3A4A5C] text-slate-300 hover:bg-[#253545]" data-testid="reset-btn">
                <X className="mr-1 h-3.5 w-3.5" /> Нов анализ
              </Button>
            </div>

            {/* Title & Description */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardContent className="p-5">
                <h2 className="text-xl font-bold text-white mb-2" data-testid="result-title">{results.title || 'Анализ на чертеж'}</h2>
                {results.description && <p className="text-slate-400 text-sm">{results.description}</p>}
                {results.dimensions && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {results.dimensions.length && <Badge variant="outline" className="text-slate-300 border-[#3A4A5C]"><Ruler className="h-3 w-3 mr-1" /> {results.dimensions.length} x {results.dimensions.width}</Badge>}
                    {results.dimensions.area && <Badge variant="outline" className="text-slate-300 border-[#3A4A5C]">{results.dimensions.area} м²</Badge>}
                    {results.dimensions.height && <Badge variant="outline" className="text-slate-300 border-[#3A4A5C]">H: {results.dimensions.height}</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Uploaded image */}
            {preview && (
              <Card className="bg-[#253545] border-[#3A4A5C] overflow-hidden">
                <div className="bg-[#0F1923] p-1">
                  <img src={preview} alt="Чертеж" className="w-full max-h-[300px] object-contain rounded" />
                </div>
              </Card>
            )}

            {/* Materials Table */}
            {materials.length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C]" data-testid="materials-table">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowMaterials(!showMaterials)}>
                  <CardTitle className="text-white text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#FF8C42]" />
                      Материали ({materials.length} позиции)
                    </span>
                    {showMaterials ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </CardTitle>
                </CardHeader>
                {showMaterials && (
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-400 border-b border-[#3A4A5C]">
                            <th className="text-left py-2 pr-2">#</th>
                            <th className="text-left py-2 pr-2">Материал</th>
                            <th className="text-center py-2 pr-2">Ед.</th>
                            <th className="text-center py-2 pr-2">Кол.</th>
                            <th className="text-right py-2 pr-2">Цена/ед.</th>
                            <th className="text-right py-2">Общо EUR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m, i) => (
                            <tr key={i} className="border-b border-[#3A4A5C]/50 text-slate-300">
                              <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                              <td className="py-2 pr-2 font-medium text-white">{m.name}</td>
                              <td className="py-2 pr-2 text-center text-slate-400">{m.unit}</td>
                              <td className="py-2 pr-2 text-center">{m.quantity}</td>
                              <td className="py-2 pr-2 text-right text-slate-400">{m.price_per_unit}</td>
                              <td className="py-2 text-right font-medium text-[#FF8C42]">{m.total}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[#FF8C42]/30">
                            <td colSpan={5} className="py-2 text-right font-bold text-white">Материали общо:</td>
                            <td className="py-2 text-right font-bold text-[#FF8C42]">{summary.materials_total} EUR</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Labor Table */}
            {labor.length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C]" data-testid="labor-table">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowLabor(!showLabor)}>
                  <CardTitle className="text-white text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-[#4DA6FF]" />
                      Труд ({labor.length} позиции)
                    </span>
                    {showLabor ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </CardTitle>
                </CardHeader>
                {showLabor && (
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-400 border-b border-[#3A4A5C]">
                            <th className="text-left py-2 pr-2">#</th>
                            <th className="text-left py-2 pr-2">Вид работа</th>
                            <th className="text-center py-2 pr-2">Ед.</th>
                            <th className="text-center py-2 pr-2">Кол.</th>
                            <th className="text-right py-2 pr-2">Цена/ед.</th>
                            <th className="text-right py-2">Общо EUR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labor.map((l, i) => (
                            <tr key={i} className="border-b border-[#3A4A5C]/50 text-slate-300">
                              <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                              <td className="py-2 pr-2 font-medium text-white">{l.name}</td>
                              <td className="py-2 pr-2 text-center text-slate-400">{l.unit}</td>
                              <td className="py-2 pr-2 text-center">{l.quantity}</td>
                              <td className="py-2 pr-2 text-right text-slate-400">{l.price_per_unit}</td>
                              <td className="py-2 text-right font-medium text-[#4DA6FF]">{l.total}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[#4DA6FF]/30">
                            <td colSpan={5} className="py-2 text-right font-bold text-white">Труд общо:</td>
                            <td className="py-2 text-right font-bold text-[#4DA6FF]">{summary.labor_total} EUR</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Grand Total */}
            <Card className="bg-gradient-to-r from-[#28A745]/20 to-[#4DA6FF]/10 border-[#28A745]/30" data-testid="grand-total">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-slate-400 text-xs">Материали</p>
                    <p className="text-[#FF8C42] font-bold text-lg">{summary.materials_total || 0} EUR</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Труд</p>
                    <p className="text-[#4DA6FF] font-bold text-lg">{summary.labor_total || 0} EUR</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Непредвидени ({summary.overhead_percent || 10}%)</p>
                    <p className="text-slate-300 font-bold text-lg">{summary.overhead_total || 0} EUR</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">ОБЩА СТОЙНОСТ</p>
                    <p className="text-[#28A745] font-extrabold text-2xl">{summary.grand_total || 0} EUR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Contract Section */}
            <Card className="bg-[#253545] border-[#3A4A5C]" data-testid="contract-section">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#8C56FF]" />
                  PDF Договор за подписване
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 text-xs">Възложител (Клиент)</Label>
                    <Input
                      placeholder="Име на клиента"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-[#0F1923] border-[#3A4A5C] text-white mt-1"
                      data-testid="client-name"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Изпълнител (Фирма)</Label>
                    <Input
                      placeholder="Име на фирмата"
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      className="bg-[#0F1923] border-[#3A4A5C] text-white mt-1"
                      data-testid="contractor-name"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Адрес на обекта</Label>
                  <Input
                    placeholder="Адрес"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="bg-[#0F1923] border-[#3A4A5C] text-white mt-1"
                    data-testid="client-address"
                  />
                </div>
                <Button
                  size="lg"
                  onClick={handlePDF}
                  disabled={pdfLoading}
                  className="w-full bg-[#8C56FF] hover:bg-[#7a44ee] text-white h-12"
                  data-testid="download-pdf-btn"
                >
                  {pdfLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Генериране на PDF...</>
                  ) : (
                    <><Download className="mr-2 h-5 w-5" /> Изтегли PDF Договор + Количествена сметка</>
                  )}
                </Button>
                <p className="text-slate-500 text-xs text-center">
                  Договорът включва: условия за изпълнение, количествена сметка с материали и труд, места за подпис.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
