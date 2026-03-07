import React, { useState } from 'react';
import { MessageSquare, Star, X, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Моля, изберете оценка');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/feedback`, { rating, text, name: name || 'Анонимен' });
      toast.success('Благодарим за обратната връзка!');
      setIsOpen(false);
      setRating(0);
      setText('');
      setName('');
    } catch {
      toast.error('Грешка при изпращане');
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[130px] left-4 md:bottom-6 md:left-6 z-40 bg-[#8C56FF] hover:bg-[#7a44ee] text-white rounded-full p-3.5 shadow-lg shadow-[#8C56FF]/30 transition-all hover:scale-110"
        data-testid="feedback-btn"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className=" border  rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            data-testid="feedback-modal"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Дай обратна връзка</h3>
              <button onClick={() => setIsOpen(false)} className="theme-text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Star Rating */}
            <div className="mb-5">
              <p className="theme-text-muted text-sm mb-2">Как оценявате платформата?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`feedback-star-${i}`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        i <= (hoverRating || rating)
                          ? 'fill-[#FF8C42] text-[#FF8C42]'
                          : 'theme-text-subtle'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Вашето име (по избор)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full  border  rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-[#FF8C42] focus:outline-none transition-colors"
                data-testid="feedback-name"
              />
            </div>

            {/* Text */}
            <div className="mb-5">
              <textarea
                placeholder="Какво ви хареса или какво можем да подобрим?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full  border  rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-[#FF8C42] focus:outline-none transition-colors resize-none"
                data-testid="feedback-text"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              data-testid="feedback-submit"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Изпращане...' : 'Изпрати'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
