import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Play, CheckCircle, Lightbulb } from 'lucide-react';

export const PageInstructions = ({ title, description, steps = [], benefits = [], tips = [], videoUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="mb-8" data-testid="page-instructions">
      <div
        className="glass rounded-xl p-4 cursor-pointer hover:border-[#FF8C42]/30 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4DA6FF]/15 flex items-center justify-center">
              <Info className="h-5 w-5 text-[#4DA6FF]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{title}</h3>
              <p className="text-slate-400 text-xs">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {videoUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); setVideoOpen(true); }}
                className="flex items-center gap-1.5 bg-[#FF8C42]/15 text-[#FF8C42] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#FF8C42]/25 transition-colors"
                data-testid="watch-video-btn"
              >
                <Play className="h-3.5 w-3.5" />
                Видео
              </button>
            )}
            {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 bg-[#253545] border border-[#3A4A5C] rounded-xl p-5 animate-slideDown space-y-5">
          {steps.length > 0 && (
            <div>
              <h4 className="text-[#4DA6FF] font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Стъпки
              </h4>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FF8C42]/15 text-[#FF8C42] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-slate-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {benefits.length > 0 && (
            <div>
              <h4 className="text-[#28A745] font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Ползи
              </h4>
              <div className="space-y-1.5">
                {benefits.map((b, i) => (
                  <p key={i} className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#28A745] flex-shrink-0" />
                    {b}
                  </p>
                ))}
              </div>
            </div>
          )}

          {tips.length > 0 && (
            <div>
              <h4 className="text-[#8C56FF] font-semibold text-sm mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Съвети
              </h4>
              <div className="space-y-1.5">
                {tips.map((tip, i) => (
                  <p key={i} className="text-slate-400 text-sm italic">- {tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Modal */}
      {videoOpen && videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setVideoOpen(false)}>
          <div className="bg-[#1E2A38] border border-[#3A4A5C] rounded-xl p-2 max-w-3xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3">
              <h3 className="text-white font-semibold text-sm">Видео инструкции</h3>
              <button onClick={() => setVideoOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="aspect-video bg-[#0F1923] rounded-lg flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Play className="h-12 w-12 mx-auto mb-2 text-[#FF8C42]" />
                <p className="text-sm">Видео демонстрация ще бъде добавена скоро</p>
                <p className="text-xs text-slate-500 mt-1">{videoUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
