import React, { useState, useEffect } from 'react';
import { Trophy, Star, Heart, Eye, Building2, User, Crown, Medal, Award, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PERIODS = [
  { id: 'all', label: 'Всички времена' },
  { id: 'month', label: 'Този месец' },
];

const RankIcon = ({ rank }) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--theme-text-muted)' }}>#{rank}</span>;
};

const Avatar = ({ src, name, size = 'md' }) => {
  const sz = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  if (src) return <img src={src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`} alt={name} className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} rounded-full flex items-center justify-center bg-[#F97316]/10 text-[#F97316] font-bold text-sm`}>
      {(name || '?')[0]}
    </div>
  );
};

const ClientRow = ({ entry, isTop3 }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] ${isTop3 ? 'shadow-sm' : ''}`}
    style={{ background: isTop3 ? 'rgba(249,115,22,0.04)' : 'var(--theme-card-bg)', border: `1px solid ${isTop3 ? 'rgba(249,115,22,0.15)' : 'var(--theme-border)'}` }}
    data-testid={`client-rank-${entry.rank}`}>
    <RankIcon rank={entry.rank} />
    <Avatar src={entry.user_avatar} name={entry.user_name} size={isTop3 ? 'lg' : 'md'} />
    <div className="flex-1 min-w-0">
      <p className={`font-bold truncate ${isTop3 ? 'text-sm' : 'text-xs'}`} style={{ color: 'var(--theme-text)' }}>{entry.user_name}</p>
      <div className="flex items-center gap-3 mt-0.5">
        <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--theme-text-muted)' }}>
          <Eye className="h-2.5 w-2.5" /> {entry.projects_count} проекта
        </span>
        <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--theme-text-muted)' }}>
          <Heart className="h-2.5 w-2.5" /> {entry.likes_received}
        </span>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-black text-[#F97316]">{entry.score}</p>
      <p className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>точки</p>
    </div>
  </div>
);

const CompanyRow = ({ entry, isTop3 }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] ${isTop3 ? 'shadow-sm' : ''}`}
    style={{ background: isTop3 ? 'rgba(249,115,22,0.04)' : 'var(--theme-card-bg)', border: `1px solid ${isTop3 ? 'rgba(249,115,22,0.15)' : 'var(--theme-border)'}` }}
    data-testid={`company-rank-${entry.rank}`}>
    <RankIcon rank={entry.rank} />
    <Avatar src={entry.company_avatar} name={entry.company_name} size={isTop3 ? 'lg' : 'md'} />
    <div className="flex-1 min-w-0">
      <p className={`font-bold truncate ${isTop3 ? 'text-sm' : 'text-xs'}`} style={{ color: 'var(--theme-text)' }}>{entry.company_name}</p>
      <div className="flex items-center gap-3 mt-0.5">
        {entry.region && (
          <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            <MapPin className="h-2.5 w-2.5" /> {entry.region}
          </span>
        )}
        <span className="text-[10px] flex items-center gap-0.5 text-yellow-500">
          <Star className="h-2.5 w-2.5 fill-current" /> {entry.avg_rating}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
          ({entry.review_count} отзива)
        </span>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-black text-[#F97316]">{entry.score}</p>
      <p className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>точки</p>
    </div>
  </div>
);

const LeaderboardPage = () => {
  const [tab, setTab] = useState('clients');
  const [period, setPeriod] = useState('all');
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, fRes] = await Promise.all([
        axios.get(`${API}/leaderboard/clients?period=${period}`),
        axios.get(`${API}/leaderboard/companies?period=${period}`),
      ]);
      setClients(cRes.data.entries || []);
      setCompanies(fRes.data.entries || []);
    } catch { /* empty on first load */ }
    setLoading(false);
  };

  const entries = tab === 'clients' ? clients : companies;

  return (
    <div className="min-h-screen py-6 px-3 md:px-6" style={{ background: 'var(--theme-bg)' }} data-testid="leaderboard-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Trophy className="h-4 w-4 text-[#F97316]" />
            <span className="text-xs font-bold text-[#F97316]">Класация</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--theme-text)' }}>Leaderboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Топ дизайнери и фирми в TemaDom</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
            <button onClick={() => setTab('clients')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors ${tab === 'clients' ? 'bg-[#F97316] text-white' : ''}`}
              style={tab !== 'clients' ? { background: 'var(--theme-card-bg)', color: 'var(--theme-text-muted)' } : {}}
              data-testid="tab-clients">
              <User className="h-3.5 w-3.5" /> Клиенти
            </button>
            <button onClick={() => setTab('companies')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors ${tab === 'companies' ? 'bg-[#F97316] text-white' : ''}`}
              style={tab !== 'companies' ? { background: 'var(--theme-card-bg)', color: 'var(--theme-text-muted)' } : {}}
              data-testid="tab-companies">
              <Building2 className="h-3.5 w-3.5" /> Фирми
            </button>
          </div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${period === p.id ? 'bg-[#F97316]/10 text-[#F97316]' : ''}`}
                style={period !== p.id ? { color: 'var(--theme-text-muted)' } : {}}
                data-testid={`period-${p.id}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardContent className="py-12 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 animate-pulse text-[#F97316]" />
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Зареждане...</p>
              </CardContent>
            </Card>
          ) : entries.length === 0 ? (
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardContent className="py-12 text-center">
                <Trophy className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--theme-text-subtle)' }} />
                <p className="font-bold" style={{ color: 'var(--theme-text)' }}>
                  {tab === 'clients' ? 'Все още няма класирани клиенти' : 'Все още няма класирани фирми'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                  Публикувайте проекти и бъдете активни за да влезете в класацията!
                </p>
              </CardContent>
            </Card>
          ) : (
            entries.map((e, i) => (
              tab === 'clients'
                ? <ClientRow key={e.user_id || i} entry={e} isTop3={e.rank <= 3} />
                : <CompanyRow key={e.company_id || i} entry={e} isTop3={e.rank <= 3} />
            ))
          )}
        </div>

        {/* Scoring info */}
        <Card className="mt-6" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
          <CardContent className="p-4">
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--theme-text)' }}>Как се изчисляват точките?</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
              {tab === 'clients' ? (
                <>
                  <span>Публикуван проект: +10 т.</span>
                  <span>Получен лайк: +3 т.</span>
                  <span>Публикация в общност: +2 т.</span>
                  <span>Прегледи: бонус</span>
                </>
              ) : (
                <>
                  <span>Рейтинг (средно): x20 т.</span>
                  <span>Отзив: +5 т.</span>
                  <span>Оферта: +3 т.</span>
                  <span>Завършен проект: +10 т.</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;
