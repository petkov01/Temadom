import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Play, CheckCircle, Lightbulb, Sparkles, Calculator, FileText, Image, ArrowRight } from 'lucide-react';

const VIDEO_TUTORIALS = {
  "ai-designer": {
    title: "Как да използвате AI Дизайнера",
    steps: [
      { title: "Качете снимки", desc: "Направете 1-3 снимки на помещението от различни ъгли. По-качествените снимки дават по-добър резултат.", icon: Image },
      { title: "Изберете параметри", desc: "Изберете тип помещение, стил на дизайн и клас материали. AI ще генерира визуализация според вашия избор.", icon: Sparkles },
      { title: "Генерирайте дизайн", desc: "Натиснете 'Генерирай' и изчакайте 30-60 секунди. AI ще създаде фотореалистична визуализация с количествена сметка.", icon: ArrowRight },
      { title: "Споделете и изтеглете", desc: "Публикувайте в галерията, споделете в социалните мрежи или изтеглете PDF с изображения и материали.", icon: FileText }
    ]
  },
  "ai-sketch": {
    title: "Как работи AI Sketch",
    steps: [
      { title: "Качете скица или чертеж", desc: "Качете 1-3 файла — ръчна скица, чертеж или снимка на реален обект. Поддържа JPG, PNG, WebP.", icon: Image },
      { title: "Изберете тип строеж", desc: "Посочете дали е жилищна сграда, търговски обект, промишлена сграда или ремонт.", icon: CheckCircle },
      { title: "AI анализира", desc: "AI разпознава колони, греди, стълби, фундаменти и покрив с 95-100% точност. Генерира 2D план и 3D визуализация.", icon: Sparkles },
      { title: "Количествена сметка", desc: "Получавате детайлна сметка с цени в EUR от водещи магазини + PDF договор за подписване.", icon: FileText }
    ]
  },
  "calculator": {
    title: "Как да използвате калкулатора",
    steps: [
      { title: "Изберете област", desc: "Изберете от 28 области в България. Цените се различават по региони.", icon: CheckCircle },
      { title: "Въведете параметри", desc: "Площ, тип ремонт, брой стаи, допълнителни услуги.", icon: Calculator },
      { title: "Получете оценка", desc: "Моментална оценка на разходите с разбивка по категории.", icon: ArrowRight },
      { title: "PDF договор", desc: "Генерирайте PDF договор с количествена сметка за 6 EUR, готов за подписване.", icon: FileText }
    ]
  },
  "default": {
    title: "Видео инструкции",
    steps: [
      { title: "Стъпка 1", desc: "Следвайте инструкциите на страницата", icon: CheckCircle },
      { title: "Стъпка 2", desc: "Въведете необходимите данни", icon: ArrowRight },
      { title: "Стъпка 3", desc: "Получете резултат", icon: Sparkles }
    ]
  }
};

export const PageInstructions = ({ title, description, steps = [], benefits = [], tips = [], videoUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  // Determine which tutorial to show based on videoUrl
  const getTutorial = () => {
    if (!videoUrl) return VIDEO_TUTORIALS["default"];
    if (videoUrl.includes('designer')) return VIDEO_TUTORIALS["ai-designer"];
    if (videoUrl.includes('sketch')) return VIDEO_TUTORIALS["ai-sketch"];
    if (videoUrl.includes('calculator') || videoUrl.includes('subscriptions')) return VIDEO_TUTORIALS["calculator"];
    return VIDEO_TUTORIALS["default"];
  };

  const tutorial = getTutorial();

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
              <p className="theme-text-muted text-xs">{description}</p>
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
                Инструкции
              </button>
            )}
            {isOpen ? <ChevronUp className="h-5 w-5 theme-text-muted" /> : <ChevronDown className="h-5 w-5 theme-text-muted" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3  border  rounded-xl p-5 animate-slideDown space-y-5">
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
                    <p className="theme-text-muted text-sm">{step}</p>
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
                  <p key={i} className="theme-text-muted text-sm flex items-center gap-2">
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
                  <p key={i} className="theme-text-muted text-sm italic">- {tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Tutorial Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setVideoOpen(false)}>
          <div className=" border  rounded-xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b ">
              <h3 className="text-white font-semibold">{tutorial.title}</h3>
              <button onClick={() => setVideoOpen(false)} className="theme-text-muted hover:text-white text-lg" data-testid="close-video-modal">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {tutorial.steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-4 group" data-testid={`tutorial-step-${i}`}>
                    <div className="w-12 h-12 rounded-xl bg-[#FF8C42]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF8C42]/25 transition-colors">
                      <Icon className="h-6 w-6 text-[#FF8C42]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#FF8C42] text-xs font-bold bg-[#FF8C42]/10 rounded-full px-2 py-0.5">Стъпка {i + 1}</span>
                        <h4 className="text-white font-medium text-sm">{step.title}</h4>
                      </div>
                      <p className="theme-text-muted text-sm">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t  text-center">
              <button
                onClick={() => setVideoOpen(false)}
                className="bg-[#FF8C42] hover:bg-[#e67a30] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Разбрах, да започнем!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
