import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Heart, Briefcase, MessageSquare, Gift, CreditCard, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ICONS = {
  like: Heart,
  offer: Briefcase,
  comment: MessageSquare,
  referral: Gift,
  payment: CreditCard,
  default: Bell,
};

const COLORS = {
  like: '#EF4444',
  offer: '#c9953a',
  comment: '#4DA6FF',
  referral: '#10B981',
  payment: '#8B5CF6',
  default: '#c9953a',
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'сега';
  if (s < 3600) return `${Math.floor(s / 60)} мин`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч`;
  return `${Math.floor(s / 86400)} д`;
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    const poll = () => {
      axios.get(`${API}/notifications/unread-count`, { headers }).then(r => setUnread(r.data.unread)).catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (open && token) {
      axios.get(`${API}/notifications?limit=15`, { headers }).then(r => setNotifs(r.data.notifications)).catch(() => {});
    }
  }, [open, token]);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const markAllRead = async () => {
    await axios.post(`${API}/notifications/mark-read`, {}, { headers }).catch(() => {});
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = async (id) => {
    await axios.delete(`${API}/notifications/${id}`, { headers }).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  if (!token) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        data-testid="notification-bell">
        <Bell className="h-5 w-5" style={{ color: 'var(--theme-text-muted)' }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
            data-testid="unread-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl z-50"
          style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}
          data-testid="notifications-dropdown">
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 z-10"
            style={{ background: 'var(--theme-card-bg)', borderBottom: '1px solid var(--theme-border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>Уведомления</span>
            <div className="flex gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-medium text-[#c9953a] hover:underline px-2 py-1"
                  data-testid="mark-all-read">
                  <Check className="inline h-3 w-3 mr-0.5" /> Прочети всички
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />
              </button>
            </div>
          </div>

          {notifs.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--theme-text-subtle)' }} />
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Няма уведомления</p>
            </div>
          ) : (
            notifs.map(n => {
              const Icon = ICONS[n.type] || ICONS.default;
              const color = COLORS[n.type] || COLORS.default;
              return (
                <div key={n.id}
                  className={`flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-black/3 dark:hover:bg-white/3 ${!n.read ? 'bg-[#c9953a]/[0.03]' : ''}`}
                  style={{ borderBottom: '1px solid var(--theme-border)' }}
                  data-testid={`notif-${n.id}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.read ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--theme-text)' }}>{n.title}</p>
                    <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>{n.message}</p>
                    <span className="text-[9px] mt-1 block" style={{ color: 'var(--theme-text-subtle)' }}>{timeAgo(n.created_at)}</span>
                  </div>
                  <button onClick={() => deleteNotif(n.id)} className="p-1 rounded hover:bg-red-500/10 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    style={{ color: 'var(--theme-text-subtle)' }}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#c9953a] flex-shrink-0 mt-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
