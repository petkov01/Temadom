import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image, Plus, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';

// Portfolio Project Component
const PortfolioProject = ({ project, onDelete, isOwner }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = [
    ...(project.before_images || []).map(img => ({ url: img, type: 'before' })),
    ...(project.after_images || []).map(img => ({ url: img, type: 'after' }))
  ];

  const navigateImage = (direction) => {
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <Card className="overflow-hidden group" data-testid={`portfolio-project-${project.id}`}>
      <div className="relative">
        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
          {/* Before Image */}
          <div 
            className="relative bg-slate-200 cursor-pointer"
            onClick={() => { setCurrentImageIndex(0); setLightboxOpen(true); }}
          >
            {project.before_images?.[0] ? (
              <img 
                src={project.before_images[0]} 
                alt="Преди" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <Image className="h-8 w-8 theme-text-muted" />
              </div>
            )}
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
              ПРЕДИ
            </Badge>
          </div>

          {/* After Image */}
          <div 
            className="relative bg-slate-200 cursor-pointer"
            onClick={() => { 
              setCurrentImageIndex(project.before_images?.length || 0); 
              setLightboxOpen(true); 
            }}
          >
            {project.after_images?.[0] ? (
              <img 
                src={project.after_images[0]} 
                alt="След" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <Image className="h-8 w-8 theme-text-muted" />
              </div>
            )}
            <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
              СЛЕД
            </Badge>
          </div>
        </div>

        {/* View overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setLightboxOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" /> Виж всички ({allImages.length})
          </Button>
        </div>

        {/* Delete button for owner */}
        {isOwner && onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent className="p-4">
        <h4 className="font-semibold mb-1">{project.title}</h4>
        {project.description && (
          <p className="text-sm theme-text-muted line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {project.category && (
            <Badge variant="secondary" className="text-xs">{project.category}</Badge>
          )}
          {project.location && (
            <span className="text-xs theme-text-subtle">{project.location}</span>
          )}
        </div>
      </CardContent>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <div className="relative">
            {/* Main Image */}
            <div className="aspect-[16/10] relative">
              {allImages[currentImageIndex] && (
                <>
                  <img 
                    src={allImages[currentImageIndex].url} 
                    alt={`${allImages[currentImageIndex].type === 'before' ? 'Преди' : 'След'}`}
                    className="w-full h-full object-contain"
                  />
                  <Badge 
                    className={`absolute top-4 left-4 ${
                      allImages[currentImageIndex].type === 'before' 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                    } text-white`}
                  >
                    {allImages[currentImageIndex].type === 'before' ? 'ПРЕДИ' : 'СЛЕД'}
                  </Badge>
                </>
              )}
            </div>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:/20"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:/20"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm">
              {currentImageIndex + 1} / {allImages.length}
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Project info */}
          <div className="p-4 theme-bg-surface theme-text">
            <h3 className="font-semibold text-lg">{project.title}</h3>
            {project.description && (
              <p className="theme-text-muted text-sm mt-1">{project.description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Add Portfolio Project Form
const AddPortfolioForm = ({ onSubmit, onCancel, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages, setAfterImages] = useState([]);

  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  const handleImageUpload = (files, type) => {
    const newImages = Array.from(files).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImages).then(images => {
      if (type === 'before') {
        setBeforeImages(prev => [...prev, ...images].slice(0, 5));
      } else {
        setAfterImages(prev => [...prev, ...images].slice(0, 5));
      }
    });
  };

  const removeImage = (index, type) => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Моля, въведете заглавие');
      return;
    }
    if (beforeImages.length === 0 && afterImages.length === 0) {
      toast.error('Моля, добавете поне една снимка');
      return;
    }

    onSubmit({
      title,
      description,
      category,
      location,
      before_images: beforeImages,
      after_images: afterImages
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Заглавие на проекта *</Label>
        <Input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Напр. Ремонт на баня в София"
          data-testid="portfolio-title"
        />
      </div>

      <div>
        <Label>Описание</Label>
        <Textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опишете накратко извършената работа..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Категория</Label>
          <Input 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Напр. Боядисване"
          />
        </div>
        <div>
          <Label>Локация</Label>
          <Input 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Напр. София"
          />
        </div>
      </div>

      {/* Before Images */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Badge className="bg-red-500">ПРЕДИ</Badge>
          Снимки преди ремонта (до 5)
        </Label>
        <div className="flex flex-wrap gap-3">
          {beforeImages.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden group">
              <img src={img} alt={`Before ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(idx, 'before')}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          ))}
          {beforeImages.length < 5 && (
            <button
              onClick={() => beforeInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed  rounded-lg flex flex-col items-center justify-center theme-text-muted hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-xs">Добави</span>
            </button>
          )}
          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files, 'before')}
          />
        </div>
      </div>

      {/* After Images */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Badge className="bg-green-500">СЛЕД</Badge>
          Снимки след ремонта (до 5)
        </Label>
        <div className="flex flex-wrap gap-3">
          {afterImages.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden group">
              <img src={img} alt={`After ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(idx, 'after')}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          ))}
          {afterImages.length < 5 && (
            <button
              onClick={() => afterInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed  rounded-lg flex flex-col items-center justify-center theme-text-muted hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-xs">Добави</span>
            </button>
          )}
          <input
            ref={afterInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files, 'after')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Отказ</Button>
        <Button 
          className="bg-[#d4a43a] hover:bg-[#b8922e]"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="submit-portfolio"
        >
          {loading ? 'Запазване...' : 'Добави проект'}
        </Button>
      </div>
    </div>
  );
};

// Portfolio Gallery Component
const PortfolioGallery = ({ projects, isOwner, onAddProject, onDeleteProject }) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (projectData) => {
    setLoading(true);
    try {
      await onAddProject(projectData);
      setAddDialogOpen(false);
      toast.success('Проектът е добавен успешно!');
    } catch (error) {
      toast.error('Грешка при добавяне на проекта');
    }
    setLoading(false);
  };

  return (
    <div data-testid="portfolio-gallery">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Портфолио</h3>
          <p className="text-sm theme-text-subtle">Снимки преди и след извършени проекти</p>
        </div>
        {isOwner && (
          <Button 
            className="bg-[#d4a43a] hover:bg-[#b8922e]"
            onClick={() => setAddDialogOpen(true)}
            data-testid="add-portfolio-btn"
          >
            <Plus className="h-4 w-4 mr-2" /> Добави проект
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <Camera className="h-12 w-12 mx-auto mb-4 theme-text-muted" />
          <h4 className="text-lg font-medium theme-text-muted mb-2">Няма проекти в портфолиото</h4>
          <p className="theme-text-subtle">
            {isOwner 
              ? 'Добавете снимки от вашите проекти за да покажете работата си'
              : 'Тази фирма все още не е добавила проекти'}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <PortfolioProject 
              key={project.id} 
              project={project}
              isOwner={isOwner}
              onDelete={onDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добави проект в портфолиото</DialogTitle>
            <DialogDescription>
              Качете снимки преди и след извършената работа
            </DialogDescription>
          </DialogHeader>
          <AddPortfolioForm 
            onSubmit={handleSubmit}
            onCancel={() => setAddDialogOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { PortfolioGallery, PortfolioProject, AddPortfolioForm };
export default PortfolioGallery;
