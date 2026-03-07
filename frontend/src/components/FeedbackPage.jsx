import React, { useState, useEffect } from 'react';
import { Star, Send, MessageSquare, TrendingUp, Users, Lightbulb, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);

  // Suggestions state
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    loadFeedback();
    loadSuggestions();
    loadAiAnalysis();
  }, []);

  const loadFeedback = async () => {
    try {
      const res = await axios.get(`${API}/feedback`);
      setFeedbackList(res.data.feedback || []);
      setAvgRating(res.data.avg_rating || 0);
      setTotal(res.data.total || 0);
    } catch {}
  };

  const loadSuggestions = async () => {
    try {
      const res = await axios.get(`${API}/suggestions`);
      setSuggestions(res.data.suggestions || []);
    } catch {}
  };

  const loadAiAnalysis = async () => {
    try {
      const res = await axios.get(`${API}/suggestions/analysis`);
      if (res.data.analysis) setAiAnalysis(res.data);
    } catch {}
  };

  const runAiAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const res = await axios.post(`${API}/suggestions/analyze`);
      setAiAnalysis(res.data);
      toast.success('AI анализът е готов!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при AI анализа');
    }
    setAnalyzingAI(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Моля, изберете оценка'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/feedback`, { rating, text, name: name || 'Анонимен' });
      toast.success('Благодарим за обратната връзка!');
      setRating(0); setText(''); setName('');
      loadFeedback();
    } catch { toast.error('Грешка при изпращане'); }
    setSubmitting(false);
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionText.trim()) { toast.error('Моля, напишете предложение'); return; }
    setSubmittingSuggestion(true);
    try {
      await axios.post(`${API}/suggestions`, { text: suggestionText, name: suggestionName || 'Анонимен' });
      toast.success('Благодарим за предложението!');
      setSuggestionText(''); setSuggestionName('');
      loadSuggestions();
    } catch { toast.error('Грешка при изпращане'); }
    setSubmittingSuggestion(false);
  };

  const handleVoteSuggestion = async (id) => {
    try {
      await axios.post(`${API}/suggestions/${id}/vote`);
      loadSuggestions();
    } catch { toast.error('Грешка при гласуване'); }
  };

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}} data-testid="feedback-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--theme-text)' }}>Обратна връзка и Предложения</h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>Помогнете ни да подобрим TemaDom — вашето мнение е важно</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-5">
              <Star className="h-8 w-8 text-[#FF8C42] mx-auto mb-2" />
              <p className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>{avgRating}</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Средна оценка</p>
            </CardContent>
          </Card>
          <Card className="text-center" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-5">
              <Users className="h-8 w-8 text-[#4DA6FF] mx-auto mb-2" />
              <p className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>{total}</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Отзива</p>
            </CardContent>
          </Card>
          <Card className="text-center" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-5">
              <Lightbulb className="h-8 w-8 text-[#28A745] mx-auto mb-2" />
              <p className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>{suggestions.length}</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Предложения</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Обратна връзка / Предложения */}
        <Tabs defaultValue="feedback" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="feedback" data-testid="tab-feedback">
              <MessageSquare className="h-4 w-4 mr-2" /> Обратна връзка
            </TabsTrigger>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">
              <Lightbulb className="h-4 w-4 mr-2" /> Предложения
            </TabsTrigger>
          </TabsList>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                  <MessageSquare className="h-5 w-5 text-[#FF8C42]" />
                  Оценете платформата
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm mb-2" style={{ color: 'var(--theme-text-muted)' }}>Колко полезна ви е платформата?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i)}
                        className="p-1 transition-transform hover:scale-110" data-testid={`star-${i}`}>
                        <Star className={`h-10 w-10 ${i <= (hoverRating || rating) ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1" style={{ color: 'var(--theme-text-muted)' }}>Вашето име</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="По избор"
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                    style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                    data-testid="feedback-name-input" />
                </div>
                <div>
                  <label className="text-sm block mb-1" style={{ color: 'var(--theme-text-muted)' }}>Коментар</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Какво ви хареса? Какво може да подобрим?"
                    rows={4}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C42] resize-none"
                    style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                    data-testid="feedback-text-input" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#FF8C42] hover:bg-[#e67a30] text-white w-full" data-testid="feedback-submit-btn">
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? 'Изпращане...' : 'Изпрати обратна връзка'}
                </Button>
              </CardContent>
            </Card>

            {feedbackList.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Последни отзиви</h2>
                <div className="space-y-3">
                  {feedbackList.slice(0, 10).map((fb, i) => (
                    <Card key={i} style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{fb.name}</span>
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`h-3.5 w-3.5 ${s <= fb.rating ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-slate-600'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--theme-text-subtle)' }}>{new Date(fb.created_at).toLocaleDateString('bg-BG')}</span>
                        </div>
                        {fb.text && <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{fb.text}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <Card style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                  <Lightbulb className="h-5 w-5 text-[#28A745]" />
                  Какво ви липсва? Как да подобрим платформата?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-sm block mb-1" style={{ color: 'var(--theme-text-muted)' }}>Вашето име</label>
                  <input type="text" value={suggestionName} onChange={(e) => setSuggestionName(e.target.value)} placeholder="По избор"
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#28A745]"
                    style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                    data-testid="suggestion-name-input" />
                </div>
                <div>
                  <label className="text-sm block mb-1" style={{ color: 'var(--theme-text-muted)' }}>Вашето предложение</label>
                  <textarea value={suggestionText} onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Какво бихте искали да видите в TemaDom? Какви функции ви липсват? Как можем да направим платформата по-полезна за вас?"
                    rows={5}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#28A745] resize-none"
                    style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                    data-testid="suggestion-text-input" />
                </div>
                <Button onClick={handleSuggestionSubmit} disabled={submittingSuggestion} className="bg-[#28A745] hover:bg-[#219a3b] text-white w-full" data-testid="suggestion-submit-btn">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {submittingSuggestion ? 'Изпращане...' : 'Изпрати предложение'}
                </Button>
              </CardContent>
            </Card>

            {suggestions.length > 0 && (
              <div>
                {/* AI Analysis */}
                <Card className="mb-6" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--theme-text)' }}>
                        <TrendingUp className="h-5 w-5 text-[#FF8C42]" />
                        AI Анализ на предложенията
                      </CardTitle>
                      <Button onClick={runAiAnalysis} disabled={analyzingAI} size="sm" 
                        className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" data-testid="ai-analyze-btn">
                        {analyzingAI ? 'Анализиране...' : 'Анализирай с AI'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {aiAnalysis?.analysis ? (
                      <div className="prose prose-sm max-w-none" style={{ color: 'var(--theme-text-muted)' }}>
                        <pre className="whitespace-pre-wrap text-sm font-sans p-4 rounded-lg" 
                          style={{ background: 'var(--theme-bg)', color: 'var(--theme-text-muted)' }}>
                          {aiAnalysis.analysis}
                        </pre>
                        <p className="text-xs mt-2" style={{ color: 'var(--theme-text-subtle)' }}>
                          Анализирани: {aiAnalysis.total_suggestions} предложения, {aiAnalysis.total_votes} гласа
                          {aiAnalysis.analyzed_at && ` · ${new Date(aiAnalysis.analyzed_at).toLocaleDateString('bg-BG')}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                        Натиснете "Анализирай с AI" за да получите автоматичен анализ и препоръки от всички предложения.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Предложения от потребители</h2>
                <div className="space-y-3">
                  {suggestions.map((s, i) => (
                    <Card key={i} style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <button onClick={() => handleVoteSuggestion(s.id)}
                          className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-[#28A745]/10"
                          data-testid={`vote-suggestion-${i}`}>
                          <ChevronUp className="h-5 w-5 text-[#28A745]" />
                          <span className="text-sm font-bold text-[#28A745]">{s.votes || 0}</span>
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{s.name}</span>
                            <span className="text-xs" style={{ color: 'var(--theme-text-subtle)' }}>{new Date(s.created_at).toLocaleDateString('bg-BG')}</span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{s.text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeedbackPage;
