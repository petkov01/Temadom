import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Send, Loader2, Image, Upload, X, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ReadyProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const token = localStorage.getItem('token');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ready-projects`);
      setProjects(res.data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleLike = async (projectId) => {
    if (!token) { toast.error('Моля, влезте в профила си'); return; }
    try {
      const res = await axios.post(`${API}/ready-projects/${projectId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, likes: res.data.likes, liked_by_user: res.data.liked } : p));
    } catch { toast.error('Грешка'); }
  };

  const handleComment = async (projectId) => {
    if (!token) { toast.error('Моля, влезте в профила си'); return; }
    const text = commentInputs[projectId];
    if (!text?.trim()) return;
    try {
      const res = await axios.post(`${API}/ready-projects/${projectId}/comment`, { text: text.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, comments: res.data.comments } : p));
      setCommentInputs(prev => ({ ...prev, [projectId]: '' }));
      toast.success('Коментарът е добавен');
    } catch { toast.error('Грешка'); }
  };

  const handleShare = (project) => {
    const url = `${window.location.origin}/ready-projects`;
    const text = `Вижте проект: ${project.title} в TemaDom!`;
    if (navigator.share) {
      navigator.share({ title: project.title, text, url }).catch(() => { });
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success('Линкът е копиран');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8C42]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="ready-projects-page">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#28A745]/15 border border-[#28A745]/30 rounded-full px-5 py-2 mb-4">
            <Image className="h-4 w-4 text-[#28A745]" />
            <span className="text-xs font-bold text-[#28A745] tracking-wider">ГОТОВИ ПРОЕКТИ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Проекти от <span className="text-[#28A745]">общността</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Клиенти споделят своите проекти — AI и ръчни. Харесвай, коментирай, споделяй и намери вдъхновение за своя ремонт.
          </p>
        </div>

        {/* Projects Feed */}
        {projects.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-state">
            <Image className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Все още няма проекти</h3>
            <p className="text-slate-500 text-sm mb-6">Бъдете първи! Качете проект от AI Sketch или Помещения.</p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-[#FF8C42] text-white" onClick={() => window.location.href = '/ai-sketch'}>
                AI Sketch
              </Button>
              <Button className="bg-[#8C56FF] text-white" onClick={() => window.location.href = '/room-scan'}>
                Помещения
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-[#253545] border-[#3A4A5C] overflow-hidden" data-testid={`project-${project.id}`}>
                {/* Author */}
                <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF8C42]/20 flex items-center justify-center text-[#FF8C42] font-bold text-sm">
                    {(project.author_name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{project.author_name || 'Анонимен'}</p>
                    <p className="text-slate-500 text-xs">{project.created_at ? new Date(project.created_at).toLocaleDateString('bg-BG') : ''}</p>
                  </div>
                  {project.source && (
                    <Badge className="ml-auto bg-[#8C56FF]/20 text-[#8C56FF] border-[#8C56FF]/30 text-xs">{project.source}</Badge>
                  )}
                </div>

                {/* Title & Description */}
                <div className="px-5 pb-3">
                  <h3 className="text-white font-bold text-base">{project.title}</h3>
                  {project.description && <p className="text-slate-400 text-sm mt-1">{project.description}</p>}
                </div>

                {/* Images */}
                {project.images && project.images.length > 0 && (
                  <div className="bg-[#0F1923]">
                    {project.images.length === 1 ? (
                      <img src={project.images[0]} alt={project.title} className="w-full max-h-[400px] object-contain" />
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {project.images.slice(0, 4).map((img, i) => (
                          <img key={i} src={img} alt={`${project.title} ${i + 1}`} className="w-full h-48 object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Like, Comment, Share */}
                <div className="px-5 py-3 flex items-center gap-6 border-t border-[#3A4A5C]">
                  <button
                    onClick={() => handleLike(project.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${project.liked_by_user ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}
                    data-testid={`like-${project.id}`}
                  >
                    <Heart className={`h-5 w-5 ${project.liked_by_user ? 'fill-current' : ''}`} />
                    <span>{project.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#4DA6FF] transition-colors"
                    data-testid={`toggle-comments-${project.id}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{project.comments?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => handleShare(project)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#28A745] transition-colors"
                    data-testid={`share-${project.id}`}
                  >
                    <Share2 className="h-5 w-5" />
                    <span>Сподели</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments[project.id] && (
                  <div className="px-5 pb-4 border-t border-[#3A4A5C]">
                    {project.comments && project.comments.length > 0 && (
                      <div className="space-y-3 py-3 max-h-60 overflow-y-auto">
                        {project.comments.map((c, i) => (
                          <div key={i} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#4DA6FF]/20 flex items-center justify-center text-[#4DA6FF] text-xs font-bold flex-shrink-0">
                              {(c.author || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-xs font-medium">{c.author || 'Анонимен'} <span className="text-slate-600 font-normal">{c.created_at ? new Date(c.created_at).toLocaleDateString('bg-BG') : ''}</span></p>
                              <p className="text-slate-300 text-sm">{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Напиши коментар..."
                        value={commentInputs[project.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(project.id)}
                        className="bg-[#0F1923] border-[#3A4A5C] text-white text-sm flex-1"
                        data-testid={`comment-input-${project.id}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(project.id)}
                        className="bg-[#4DA6FF] hover:bg-[#3d96ef] text-white"
                        data-testid={`send-comment-${project.id}`}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
