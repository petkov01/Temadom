import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Upload, FileText, BarChart3, Download, User, Loader2, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const convertToJpeg = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const AIChartPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [chartType, setChartType] = useState('auto');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Моля, качете изображение (JPG, PNG)');
      return;
    }
    setFile(f);
    const jpegData = await convertToJpeg(f);
    setPreview(jpegData);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const analyzeChart = async () => {
    if (!preview) {
      toast.error('Качете чертеж първо');
      return;
    }
    if (!clientName.trim()) {
      toast.error('Въведете име на клиента');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress(p => p < 90 ? p + Math.random() * 15 : p);
    }, 400);

    try {
      const res = await axios.post(`${API}/ai-chart/analyze`, {
        image: preview,
        chart_type: chartType === 'auto' ? 'auto' : chartType,
        client_name: clientName.trim()
      }, { timeout: 60000 });

      setProgress(100);
      clearInterval(progressInterval);

      if (res.data.success) {
        setResult(res.data);
        toast.success('Анализът е завършен!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при анализа');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const downloadContractPDF = () => {
    if (!result) return;

    const { analysis, contract } = result;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header
    doc.setFillColor(255, 140, 66);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TemaDom', 105, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('STROITELSTVO I REMONT', 105, 24, { align: 'center' });
    doc.setFontSize(11);
    doc.text('temadom.com/ai-chart', 105, 33, { align: 'center' });

    // Contract title
    doc.setTextColor(30, 42, 56);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DOGOVOR ZA STROITELSTVO', 105, 52, { align: 'center' });

    // Contract details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 65;
    const lines = [
      ['Izpalnitel:', contract.company],
      ['Vazlozhitel:', contract.client],
      ['Obekt:', analysis.type],
      ['Stojnost:', `${analysis.grand_total} lv s DDS ${analysis.vat_percent}%`],
      ['Srok:', contract.duration],
      ['Avans:', contract.advance],
      ['Data:', contract.date]
    ];

    lines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '', 65, y);
      y += 7;
    });

    // Materials table
    y += 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Kolichhestvena smetka', 105, y, { align: 'center' });
    y += 8;

    const tableData = analysis.materials.map(m => [
      m.name,
      `${m.quantity}`,
      m.unit,
      `${m.price} lv`,
      `${m.total} lv`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Material', 'Kol-vo', 'Ed.', 'Cena', 'Suma']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 42, 56], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    y = doc.lastAutoTable.finalY + 8;

    // Totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mezhdinна suma: ${analysis.subtotal} lv`, 140, y, { align: 'right' });
    y += 6;
    doc.text(`DDS ${analysis.vat_percent}%: ${analysis.vat_amount} lv`, 140, y, { align: 'right' });
    y += 7;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 140, 66);
    doc.text(`OBSHTO: ${analysis.grand_total} lv`, 140, y, { align: 'right' });

    // Signatures
    y += 20;
    doc.setTextColor(30, 42, 56);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Podpis Izpalnitel: _______________', 20, y);
    doc.text('Podpis Vazlozhitel: _______________', 115, y);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('* Cenite sa orientirovoachni, bazirani na sredni pazarni ceni za 2025-2026 g.', 105, 280, { align: 'center' });
    doc.text('* Generirano ot TemaDom AI Chart Analyzer - https://temadom.com', 105, 285, { align: 'center' });

    doc.save(`temadom-dogovor-${clientName.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF договорът е изтеглен!');
  };

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ai-chart-page">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FF8C42]/15 border border-[#FF8C42]/30 rounded-full px-5 py-2 mb-4">
            <BarChart3 className="h-5 w-5 text-[#FF8C42]" />
            <span className="text-sm font-semibold text-[#FF8C42]">AI CHART ANALYZER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Чертеж <span className="text-[#FF8C42]">&rarr;</span> Сметка <span className="text-[#FF8C42]">&rarr;</span> Договор
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Качете чертеж на стълби, фундамент или стени. AI анализира и генерира количествена сметка с официален договор за 30 секунди.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="bg-[#253545] border-[#3A4A5C] mb-6" data-testid="chart-upload-section">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Качете чертеж</label>
                <div
                  id="chartUpload"
                  data-testid="chart-upload-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#FF8C42] bg-[#FF8C42]/10'
                      : preview
                        ? 'border-[#28A745]/50 bg-[#28A745]/5'
                        : 'border-[#3A4A5C] hover:border-[#FF8C42]/50 hover:bg-[#FF8C42]/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    data-testid="chart-file-input"
                  />
                  {preview ? (
                    <div>
                      <img src={preview} alt="Чертеж" className="max-h-40 mx-auto rounded-lg mb-3" />
                      <p className="text-[#28A745] text-sm flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4" /> {file?.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-[#FF8C42] mx-auto mb-3" />
                      <p className="text-slate-300 font-medium">Drag & Drop или кликнете</p>
                      <p className="text-slate-500 text-sm mt-1">JPG, PNG до 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Тип чертеж</label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger id="chartType" className="bg-[#1E2A38] border-[#3A4A5C] text-white" data-testid="chart-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Авто (AI разпознаване)</SelectItem>
                      <SelectItem value="Стълби 4248.jpg">Стълби 4248.jpg</SelectItem>
                      <SelectItem value="Фундамент">Фундамент</SelectItem>
                      <SelectItem value="Стени">Стени</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Име на клиента</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="clientName"
                      data-testid="client-name-input"
                      placeholder="Въведете име на клиента..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="pl-10 bg-[#1E2A38] border-[#3A4A5C] text-white"
                    />
                  </div>
                </div>

                <Button
                  data-testid="analyze-btn"
                  onClick={analyzeChart}
                  disabled={loading || !preview}
                  className="w-full h-12 bg-[#FF8C42] hover:bg-[#e67a30] text-white text-base font-bold mt-2"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Анализиране...</>
                  ) : (
                    <><BarChart3 className="mr-2 h-5 w-5" /> АНАЛИЗИРАЙ</>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div className="mt-6" id="progress" data-testid="progress-bar">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>AI анализ на чертежа...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-[#1E2A38] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF8C42] to-[#5BC0EB] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="chart-results">
            {/* Elements Grid */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#5BC0EB]" />
                  Разпознати елементи — {result.analysis.type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">{result.analysis.description}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {result.analysis.elements.map((el, i) => (
                    <div key={i} className="bg-[#1E2A38] border border-[#3A4A5C] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FF8C42]/15 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-[#FF8C42]" />
                        </div>
                        <span className="text-white font-medium text-sm">{el.name}</span>
                      </div>
                      <p className="text-slate-500 text-xs">{el.detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quantity Table */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#FF8C42]" />
                  Количествена сметка
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="quantity-table">
                    <thead>
                      <tr className="bg-[#1E2A38]">
                        <th className="text-left text-slate-400 font-medium p-3 rounded-tl-lg">Материал</th>
                        <th className="text-right text-slate-400 font-medium p-3">Кол-во</th>
                        <th className="text-center text-slate-400 font-medium p-3">Ед.</th>
                        <th className="text-right text-slate-400 font-medium p-3">Цена</th>
                        <th className="text-right text-slate-400 font-medium p-3 rounded-tr-lg">Сума</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.analysis.materials.map((m, i) => (
                        <tr key={i} className="border-t border-[#3A4A5C]">
                          <td className="p-3 text-white">{m.name}</td>
                          <td className="p-3 text-slate-300 text-right">{m.quantity}</td>
                          <td className="p-3 text-slate-400 text-center">{m.unit}</td>
                          <td className="p-3 text-slate-300 text-right">{m.price} лв</td>
                          <td className="p-3 text-white font-semibold text-right">{m.total.toLocaleString()} лв</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#3A4A5C]">
                        <td colSpan={4} className="p-3 text-slate-400 text-right">Междинна сума:</td>
                        <td className="p-3 text-white font-medium text-right">{result.analysis.subtotal.toLocaleString()} лв</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-3 text-slate-400 text-right">ДДС {result.analysis.vat_percent}%:</td>
                        <td className="p-3 text-slate-300 text-right">{result.analysis.vat_amount.toLocaleString()} лв</td>
                      </tr>
                      <tr className="bg-[#FF8C42]/10">
                        <td colSpan={4} className="p-3 text-[#FF8C42] font-bold text-right text-base">ОБЩО:</td>
                        <td className="p-3 text-[#FF8C42] font-bold text-right text-lg">{result.analysis.grand_total.toLocaleString()} лв</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Contract */}
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#28A745]" />
                  Договор за строителство
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#1E2A38] border border-[#3A4A5C] rounded-xl p-6" data-testid="contract-preview">
                  <div className="text-center mb-6">
                    <h3 className="text-[#FF8C42] text-xl font-bold">ДОГОВОР ЗА СТРОИТЕЛСТВО</h3>
                    <p className="text-slate-500 text-sm mt-1">No. TD-{Date.now().toString().slice(-6)}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-slate-500 text-xs">Изпълнител</span>
                      <p className="text-white font-medium">{result.contract.company}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Възложител</span>
                      <p className="text-white font-medium">{result.contract.client}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Обект</span>
                      <p className="text-white font-medium">{result.analysis.type}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Стойност</span>
                      <p className="text-[#FF8C42] font-bold text-lg">{result.analysis.grand_total.toLocaleString()} лв</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Срок</span>
                      <p className="text-white font-medium">{result.contract.duration}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Аванс</span>
                      <p className="text-white font-medium">{result.contract.advance}</p>
                    </div>
                  </div>

                  <Separator className="bg-[#3A4A5C] my-4" />

                  <div className="grid sm:grid-cols-2 gap-8 mt-6">
                    <div className="text-center">
                      <p className="text-slate-500 text-xs mb-8">Подпис Изпълнител</p>
                      <div className="border-b border-[#3A4A5C] mb-1" />
                      <p className="text-slate-400 text-xs">{result.contract.company}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs mb-8">Подпис Възложител</p>
                      <div className="border-b border-[#3A4A5C] mb-1" />
                      <p className="text-slate-400 text-xs">{result.contract.client}</p>
                    </div>
                  </div>

                  <p className="text-center text-slate-600 text-xs mt-6">Дата: {result.contract.date}</p>
                </div>

                {/* Download Button */}
                <Button
                  data-testid="download-pdf-btn"
                  onClick={downloadContractPDF}
                  className="w-full mt-4 h-12 bg-[#28A745] hover:bg-[#22943e] text-white text-base font-bold"
                >
                  <Download className="mr-2 h-5 w-5" /> ИЗТЕГЛИ PDF ДОГОВОР
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChartPage;
