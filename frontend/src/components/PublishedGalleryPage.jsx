import React, { useState, useEffect } from 'react';
import { Image, Eye, Download, FileText, FileImage, ChevronLeft, ChevronRight, Sparkles, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PageInstructions } from './PageInstructions';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PublishedGalleryPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/ai-designer/published?page=${page}&limit=12`);
      setProjects(res.data.projects);
      setTotalPages(res.data.pages);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  };

  const openProject = async (projectId) => {
    setDetailLoading(true);
    setSelectedProject(null);
    try {
      const res = await axios.get(`${API}/ai-designer/published/${projectId}`);
      setSelectedProject(res.data);
    } catch {
      setSelectedProject(null);
    }
    setDetailLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="published-gallery-page">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#8C56FF]/15 border border-[#8C56FF]/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#8C56FF]" />
            <span className="font-medium text-sm text-[#8C56FF]">AI ГАЛЕРИЯ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Публикувани AI проекти</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Разгледайте реални проекти, генерирани от AI Дизайнера. Вижте "преди" и "след" снимки и изтеглете PDF с количествени сметки.
          </p>
        </div>

        <PageInstructions
          title="AI Галерия на проекти"
          description="Тук виждате публикувани проекти от потребители на AI Дизайнера"
          steps={['Разгледайте проектите в галерията', 'Кликнете върху проект за детайли', 'Вижте преди/след сравнението', 'Изтеглете PDF с изображения или количествена сметка']}
          benefits={['Реални примери от AI Дизайнера', 'Безплатен достъп', 'PDF с материали и цени']}
        />

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-64 animate-pulse bg-[#253545] border-[#3A4A5C]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center bg-[#253545] border-[#3A4A5C]">
            <Image className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Все още няма публикувани проекти</h3>
            <p className="text-slate-500">Бъдете първите! Генерирайте дизайн и го публикувайте.</p>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Card 
                  key={project.id} 
                  className="overflow-hidden hover:shadow-lg hover:shadow-[#8C56FF]/10 transition-all cursor-pointer group bg-[#253545] border-[#3A4A5C]"
                  onClick={() => openProject(project.id)}
                  data-testid={`gallery-card-${project.id}`}
                >
                  <div className="h-44 bg-gradient-to-br from-[#1E2A38] to-[#253545] flex items-center justify-center relative overflow-hidden">
                    {project.generated_images?.[0]?.image_base64 ? (
                      <img 
                        src={`data:image/png;base64,${project.generated_images[0].image_base64}`}
                        alt="AI Design"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : project.generated_images?.[0]?.angles?.[0]?.image_base64 ? (
                      <img 
                        src={`data:image/png;base64,${project.generated_images[0].angles[0].image_base64}`}
                        alt="AI Design"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Sparkles className="h-12 w-12 text-[#8C56FF]/30" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge className="bg-[#8C56FF]/90 text-white text-[10px]">AI</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white text-sm mb-1">{project.room_type || 'AI Дизайн'}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.style && <Badge variant="outline" className="text-[10px] border-[#3A4A5C] text-slate-400">{project.style}</Badge>}
                      {project.material_class && <Badge variant="outline" className="text-[10px] border-[#3A4A5C] text-slate-400">{project.material_class}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {project.views || 0}</span>
                      <span>{project.generated_images?.length || 0} варианта</span>
                      <span>{new Date(project.created_at).toLocaleDateString('bg-BG')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-[#3A4A5C] text-slate-300">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Назад
                </Button>
                <span className="flex items-center px-4 text-slate-400 text-sm">Стр. {page} от {totalPages}</span>
                <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="border-[#3A4A5C] text-slate-300">
                  Напред <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Project Detail Modal */}
        <Dialog open={!!selectedProject || detailLoading} onOpenChange={() => { setSelectedProject(null); setDetailLoading(false); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E2A38] border-[#3A4A5C]">
            {detailLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 text-[#8C56FF] animate-spin mx-auto mb-3" />
                <p className="text-slate-400">Зареждане...</p>
              </div>
            ) : selectedProject ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedProject.room_type || 'AI Дизайн проект'}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProject.style && <Badge className="bg-[#FF8C42]/10 text-[#FF8C42]">{selectedProject.style}</Badge>}
                    {selectedProject.material_class && <Badge className="bg-[#4DA6FF]/10 text-[#4DA6FF]">{selectedProject.material_class}</Badge>}
                    {selectedProject.dimensions && (
                      <Badge variant="outline" className="border-[#3A4A5C] text-slate-400">
                        {selectedProject.dimensions.width}m x {selectedProject.dimensions.length}m x {selectedProject.dimensions.height}m
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-[#3A4A5C] text-slate-400">
                      <Eye className="h-3 w-3 mr-1" /> {selectedProject.views || 0} прегледа
                    </Badge>
                  </div>
                </div>

                {/* Before/After */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider font-medium">Преди (Оригинал)</p>
                    {selectedProject.before_images?.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border border-[#3A4A5C] mb-2">
                        <img src={img} alt={`Before ${i+1}`} className="w-full" />
                      </div>
                    ))}
                    {(!selectedProject.before_images || selectedProject.before_images.length === 0) && (
                      <div className="h-40 bg-[#253545] rounded-lg flex items-center justify-center border border-[#3A4A5C]">
                        <p className="text-slate-500 text-sm">Няма оригинални снимки</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#FF8C42] text-xs mb-2 uppercase tracking-wider font-medium">След (AI Дизайн)</p>
                    {selectedProject.generated_images?.map((gen, gi) => (
                      <div key={gi} className="mb-3">
                        <p className="text-slate-500 text-[10px] mb-1">Вариант {gi + 1}</p>
                        {gen.angles?.map((ang, ai) => (
                          <div key={ai} className="rounded-lg overflow-hidden border border-[#FF8C42]/30 mb-1">
                            <img src={`data:image/png;base64,${ang.image_base64}`} alt={`V${gi+1} A${ai+1}`} className="w-full" />
                            <p className="text-center text-[10px] text-slate-500 py-1">{ang.angle_label}</p>
                          </div>
                        ))}
                        {!gen.angles && gen.image_base64 && (
                          <div className="rounded-lg overflow-hidden border border-[#FF8C42]/30">
                            <img src={`data:image/png;base64,${gen.image_base64}`} alt={`V${gi+1}`} className="w-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials summary */}
                {selectedProject.materials?.materials?.length > 0 && (
                  <Card className="bg-[#253545] border-[#3A4A5C]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#FF8C42]" />
                        Количествена сметка ({selectedProject.materials.materials.length} позиции)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div><span className="text-slate-400">Материали:</span> <span className="text-white font-medium">{selectedProject.materials.total_estimate_bgn || selectedProject.materials.total_estimate || '-'}</span></div>
                        <div><span className="text-slate-400">Труд:</span> <span className="text-white font-medium">{selectedProject.materials.labor_estimate_bgn || selectedProject.materials.labor_estimate || '-'}</span></div>
                      </div>
                      <div className="text-lg font-bold text-[#28A745]">
                        ОБЩА СТОЙНОСТ: {selectedProject.materials.grand_total_bgn || selectedProject.materials.grand_total || '-'}
                        {selectedProject.materials.grand_total_eur && <span className="text-sm text-[#28A745]/70 ml-2">{selectedProject.materials.grand_total_eur}</span>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PDF Download Buttons */}
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <Button 
                    className="bg-[#4DA6FF] hover:bg-[#3d96ef] text-white"
                    onClick={() => window.open(`${API}/ai-designer/published/${selectedProject.id}/pdf/images`, '_blank')}
                    data-testid="modal-pdf-images"
                  >
                    <FileImage className="mr-2 h-4 w-4" /> PDF с изображения
                  </Button>
                  <Button 
                    className="bg-[#8C56FF] hover:bg-[#7a44ee] text-white"
                    onClick={() => window.open(`${API}/ai-designer/published/${selectedProject.id}/pdf/materials`, '_blank')}
                    data-testid="modal-pdf-materials"
                  >
                    <FileText className="mr-2 h-4 w-4" /> PDF количествена сметка
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PublishedGalleryPage;
