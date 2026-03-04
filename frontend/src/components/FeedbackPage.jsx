import React, { useState, useEffect } from 'react';
import { Star, Send, MessageSquare, BarChart3, ThumbsUp, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageInstructions } from './PageInstructions';
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

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const res = await axios.get(`${API}/feedback`);
      setFeedbackList(res.data.feedback || []);
      setAvgRating(res.data.avg_rating || 0);
      setTotal(res.data.total || 0);
    } catch {}
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

  return (
    <div className="min-h-screen bg-[#1E2A38] py-8" data-testid="feedback-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">Обратна връзка</h1>
          <p className="text-slate-400">Помогнете ни да подобрим TemaDom — вашето мнение е важно</p>
        </div>

        <PageInstructions
          title="Дайте обратна връзка"
          description="Вашето мнение ни помага да подобрим платформата"
          steps={[
            'Оценете платформата от 1 до 5 звезди',
            'Напишете какво ви хареса и какво може да се подобри',
            'Кажете ни какво ви липсва',
            'Натиснете "Изпрати"'
          ]}
          benefits={[
            'Директна връзка с екипа на TemaDom',
            'Вашите предложения се разглеждат приоритетно',
            'Помагате на общността от строители и клиенти'
          ]}
        />

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#253545] border-[#3A4A5C] text-center">
            <CardContent className="p-5">
              <Star className="h-8 w-8 text-[#FF8C42] mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{avgRating}</p>
              <p className="text-slate-400 text-xs">Средна оценка</p>
            </CardContent>
          </Card>
          <Card className="bg-[#253545] border-[#3A4A5C] text-center">
            <CardContent className="p-5">
              <Users className="h-8 w-8 text-[#4DA6FF] mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{total}</p>
              <p className="text-slate-400 text-xs">Отзива общо</p>
            </CardContent>
          </Card>
          <Card className="bg-[#253545] border-[#3A4A5C] text-center">
            <CardContent className="p-5">
              <TrendingUp className="h-8 w-8 text-[#28A745] mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">ТЕСТ</p>
              <p className="text-slate-400 text-xs">Режим</p>
            </CardContent>
          </Card>
        </div>

        {/* Feedback form */}
        <Card className="bg-[#253545] border-[#3A4A5C] mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FF8C42]" />
              Оценете платформата
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Stars */}
            <div>
              <p className="text-slate-400 text-sm mb-2">Колко полезна ви е платформата?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`star-${i}`}
                  >
                    <Star className={`h-10 w-10 ${i <= (hoverRating || rating) ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-[#3A4A5C]'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm block mb-1">Вашето име</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="По избор"
                className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-[#FF8C42] focus:outline-none"
                data-testid="feedback-name-input"
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm block mb-1">С какво е полезен сайтът?</label>
              <textarea
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Какво ви хареса? Какво може да подобрим? Какво ви липсва?"
                rows={4}
                className="w-full bg-[#1E2A38] border border-[#3A4A5C] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-[#FF8C42] focus:outline-none resize-none"
                data-testid="feedback-text-input"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#FF8C42] hover:bg-[#e67a30] text-white w-full"
              data-testid="feedback-submit-btn"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Изпращане...' : 'Изпрати обратна връзка'}
            </Button>
          </CardContent>
        </Card>

        {/* Previous feedback */}
        {feedbackList.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Последни отзиви</h2>
            <div className="space-y-3">
              {feedbackList.slice(0, 10).map((fb, i) => (
                <Card key={i} className="bg-[#253545] border-[#3A4A5C]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{fb.name}</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= fb.rating ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-[#3A4A5C]'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs">{new Date(fb.created_at).toLocaleDateString('bg-BG')}</span>
                    </div>
                    {fb.text && <p className="text-slate-300 text-sm">{fb.text}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
