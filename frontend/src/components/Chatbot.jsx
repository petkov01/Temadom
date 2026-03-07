import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Chatbot = ({ user }) => {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'bot', text: t('chatbot_welcome') }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/chatbot/message`, {
        message: text,
        session_id: sessionId,
        user_id: user?.id || null,
        user_name: user?.name || null,
        user_type: user?.user_type || 'guest',
        lang
      });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: t('chatbot_error') }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          data-testid="chatbot-open-btn"
          className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-[100] w-14 h-14 rounded-full bg-[#FF8C42] hover:bg-[#e67a30] text-white shadow-lg shadow-[#FF8C42]/20 flex items-center justify-center transition-transform hover:scale-110"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div 
          className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-[100] w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)]  rounded-2xl shadow-2xl border  flex flex-col overflow-hidden"
          data-testid="chatbot-window"
        >
          {/* Header */}
          <div className=" text-white px-4 py-3 flex items-center justify-between flex-shrink-0 border-b ">
            <div>
              <p className="font-semibold text-sm" data-testid="chatbot-title">{t('chatbot_title')}</p>
              <p className="text-xs theme-text-muted">{t('chatbot_subtitle')}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              data-testid="chatbot-close-btn"
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" data-testid="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#FF8C42] text-white rounded-br-sm'
                      : ' text-slate-200 rounded-bl-sm'
                  }`}
                  data-testid={`chatbot-msg-${msg.role}-${i}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className=" theme-text-muted px-3 py-2 rounded-xl rounded-bl-sm text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('chatbot_sending')}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t  px-3 py-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chatbot_placeholder')}
                disabled={loading}
                data-testid="chatbot-input"
                className="flex-1 text-sm  border  rounded-lg px-3 py-2 outline-none text-white placeholder-slate-500 focus:border-[#FF8C42] transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                data-testid="chatbot-send-btn"
                className="p-2 bg-[#FF8C42] hover:bg-[#e67a30] disabled:bg-[#2B3A4A] text-white rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
