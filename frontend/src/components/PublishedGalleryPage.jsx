import React, { useState, useEffect } from 'react';
import { Image, Eye, FileText, FileImage, ChevronLeft, ChevronRight, Sparkles, Loader2, Share2, Link2, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PageInstructions } from './PageInstructions';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SITE_URL = process.env.REACT_APP_BACKEND_URL;

const ShareButtons = ({ projectId, title }) => {
  const shareUrl = `${SITE_URL}/ai-gallery?project=${projectId}`;
  const shareText = `Вижте AI дизайн проект "${title}" на TemaDom!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Линкът е копиран!');
    }).catch(() => {
      toast.error('Грешка при копиране');
    });
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
  };

  const shareViber = () => {
    window.open(`viber://forward?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center" data-testid="share-buttons">
      <Button size="sm" className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs" onClick={shareFacebook} data-testid="share-facebook">
        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </Button>
      <Button size="sm" className="bg-[#7360F2] hover:bg-[#6050e0] text-white text-xs" onClick={shareViber} data-testid="share-viber">
        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.4 0C9.473.028 5.34.472 3.363 2.345 1.757 3.96 1.124 6.326 1.04 9.243c-.084 2.917-.19 8.39 5.138 9.894h.004l-.004 2.28s-.037.921.572 1.109c.737.228 1.169-.474 1.874-1.229.387-.413.92-.991 1.322-1.44 3.644.307 6.448-.394 6.765-.505.733-.256 4.879-.77 5.556-6.283.697-5.676-.338-9.264-2.2-10.883 0 0 0 .002 0 0C18.455.715 15.36.072 11.4 0z"/></svg>
        Viber
      </Button>
      <Button size="sm" className="bg-[#25D366] hover:bg-[#20c05c] text-white text-xs" onClick={shareWhatsApp} data-testid="share-whatsapp">
        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.624-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
        WhatsApp
      </Button>
      <Button size="sm" className="bg-[#0088CC] hover:bg-[#007ab8] text-white text-xs" onClick={shareTelegram} data-testid="share-telegram">
        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm5.654 8.22l-1.85 8.708c-.14.617-.504.768-.102.48l-2.848-2.1-1.375 1.324c-.152.152-.28.28-.574.28l.204-2.904 5.28-4.772c.23-.204-.05-.318-.356-.114l-6.528 4.11-2.812-.878c-.612-.192-.624-.612.128-.906l10.996-4.238c.508-.184.954.124.786.91z"/></svg>
        Telegram
      </Button>
      <Button size="sm" variant="outline" className=" theme-text-muted hover: text-xs" onClick={handleCopyLink} data-testid="share-copy-link">
        <Copy className="h-3.5 w-3.5 mr-1.5" /> Копирай линк
      </Button>
    </div>
  );
};

export const PublishedGalleryPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    // Auto-open shared project from URL
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    if (projectId) {
      openProject(projectId);
    }
  }, []);

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
    <div className="min-h-screen  py-8" data-testid="published-gallery-page">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#8C56FF]/15 border border-[#8C56FF]/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#8C56FF]" />
            <span className="font-medium text-sm text-[#8C56FF]">AI ГАЛЕРИЯ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold theme-text mb-3">Публикувани AI проекти</h1>
          <p className="theme-text-muted max-w-2xl mx-auto">
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
              <Card key={i} className="h-64 animate-pulse  " />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center  ">
            <Image className="h-12 w-12 mx-auto mb-4 theme-text-subtle" />
            <h3 className="text-xl font-semibold theme-text-muted mb-2">Все още няма публикувани проекти</h3>
            <p className="theme-text-subtle">Бъдете първите! Генерирайте дизайн и го публикувайте.</p>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Card 
                  key={project.id} 
                  className="overflow-hidden hover:shadow-lg hover:shadow-[#8C56FF]/10 transition-all cursor-pointer group  "
                  onClick={() => openProject(project.id)}
                  data-testid={`gallery-card-${project.id}`}
                >
                  <div className="h-44 flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--theme-bg-surface)' }}>
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
                    <h3 className="font-semibold theme-text text-sm mb-1">{project.room_type || 'AI Дизайн'}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.style && <Badge variant="outline" className="text-[10px]  theme-text-muted">{project.style}</Badge>}
                      {project.material_class && <Badge variant="outline" className="text-[10px]  theme-text-muted">{project.material_class}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs theme-text-subtle">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {project.views || 0}</span>
                      <span>{project.generated_images?.length || 0} варианта</span>
                      <button 
                        className="flex items-center gap-1 hover:text-[#FF8C42] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${SITE_URL}/ai-gallery?project=${project.id}`;
                          navigator.clipboard.writeText(url).then(() => toast.success('Линкът е копиран!'));
                        }}
                        data-testid={`share-card-${project.id}`}
                      >
                        <Share2 className="h-3 w-3" /> Сподели
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className=" theme-text-muted">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Назад
                </Button>
                <span className="flex items-center px-4 theme-text-muted text-sm">Стр. {page} от {totalPages}</span>
                <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className=" theme-text-muted">
                  Напред <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Project Detail Modal */}
        <Dialog open={!!selectedProject || detailLoading} onOpenChange={() => { setSelectedProject(null); setDetailLoading(false); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto  ">
            {detailLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 text-[#8C56FF] animate-spin mx-auto mb-3" />
                <p className="theme-text-muted">Зареждане...</p>
              </div>
            ) : selectedProject ? (
              <div className="space-y-6">
                <DialogTitle className="sr-only">Детайли на проект</DialogTitle>
                <div>
                  <h2 className="text-xl font-bold theme-text">{selectedProject.room_type || 'AI Дизайн проект'}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProject.style && <Badge className="bg-[#FF8C42]/10 text-[#FF8C42]">{selectedProject.style}</Badge>}
                    {selectedProject.material_class && <Badge className="bg-[#4DA6FF]/10 text-[#4DA6FF]">{selectedProject.material_class}</Badge>}
                    {selectedProject.dimensions && (
                      <Badge variant="outline" className=" theme-text-muted">
                        {selectedProject.dimensions.width}m x {selectedProject.dimensions.length}m x {selectedProject.dimensions.height}m
                      </Badge>
                    )}
                    <Badge variant="outline" className=" theme-text-muted">
                      <Eye className="h-3 w-3 mr-1" /> {selectedProject.views || 0} прегледа
                    </Badge>
                  </div>
                </div>

                {/* Before/After */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="theme-text-muted text-xs mb-2 uppercase tracking-wider font-medium">Преди (Оригинал)</p>
                    {selectedProject.before_images?.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border  mb-2">
                        <img src={img} alt={`Before ${i+1}`} className="w-full" />
                      </div>
                    ))}
                    {(!selectedProject.before_images || selectedProject.before_images.length === 0) && (
                      <div className="h-40  rounded-lg flex items-center justify-center border ">
                        <p className="theme-text-subtle text-sm">Няма оригинални снимки</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#FF8C42] text-xs mb-2 uppercase tracking-wider font-medium">След (AI Дизайн)</p>
                    {selectedProject.generated_images?.map((gen, gi) => (
                      <div key={gi} className="mb-3">
                        <p className="theme-text-subtle text-[10px] mb-1">Вариант {gi + 1}</p>
                        {gen.angles?.map((ang, ai) => (
                          <div key={ai} className="rounded-lg overflow-hidden border border-[#FF8C42]/30 mb-1">
                            <img src={`data:image/png;base64,${ang.image_base64}`} alt={`V${gi+1} A${ai+1}`} className="w-full" />
                            <p className="text-center text-[10px] theme-text-subtle py-1">{ang.angle_label}</p>
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
                  <Card className=" ">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#FF8C42]" />
                        Количествена сметка ({selectedProject.materials.materials.length} позиции)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div><span className="theme-text-muted">Материали:</span> <span className="text-white font-medium">{selectedProject.materials.total_estimate_bgn || selectedProject.materials.total_estimate || '-'}</span></div>
                        <div><span className="theme-text-muted">Труд:</span> <span className="text-white font-medium">{selectedProject.materials.labor_estimate_bgn || selectedProject.materials.labor_estimate || '-'}</span></div>
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

                {/* Social Share */}
                <div className="pt-2">
                  <p className="theme-text-subtle text-xs text-center mb-2 uppercase tracking-wider">Споделете проекта</p>
                  <ShareButtons projectId={selectedProject.id} title={selectedProject.room_type || 'AI Дизайн'} />
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
