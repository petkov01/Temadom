import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star, Users, Building2, Crown, ArrowUp, Zap, Target, Clock, Copy, Check, UserPlus, Briefcase, MessageSquare, Images, Calendar, Gift, Share2, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTheme } from '@/components/ThemeContext';
import { useAuth } from '@/App';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = [Crown, Medal, Medal];

const CHALLENGE_ICONS = {
  Briefcase: Briefcase,
  MessageSquare: MessageSquare,
  Images: Images,
  Calendar: Calendar,
  UserPlus: UserPlus,
};

const LeaderboardRow = ({ entry, dark }) => {
  const isTop3 = entry.rank <= 3;
  const RankIcon = RANK_ICONS[entry.rank - 1] || null;
  const rankColor = RANK_COLORS[entry.rank - 1] || (dark ? '#94A3B8' : '#64748B');

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: isTop3 ? (dark ? `${rankColor}15` : `${rankColor}20`) : 'transparent',
        border: isTop3 ? `1px solid ${rankColor}40` : '1px solid transparent',
      }}
      data-testid={`leaderboard-row-${entry.rank}`}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isTop3 ? `${rankColor}25` : (dark ? '#334155' : '#E2E8F0'),
          border: isTop3 ? `2px solid ${rankColor}` : 'none'
        }}>
        {isTop3 && RankIcon ? (
          <RankIcon className="h-5 w-5" style={{ color: rankColor }} />
        ) : (
          <span className="text-sm font-bold" style={{ color: 'var(--td-text-muted)' }}>{entry.rank}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: isTop3 ? rankColor : 'var(--td-text)' }}>
          {entry.name || 'Потребител'}
        </p>
        <p className="text-xs" style={{ color: 'var(--td-text-muted)' }}>
          {entry.city || 'България'}
          {entry.user_type === 'company' && ' | Фирма'}
          {entry.user_type === 'master' && ' | Майстор'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-black" style={{ color: '#F97316' }}>{entry.leaderboard_points || 0}</p>
        <p className="text-[10px]" style={{ color: 'var(--td-text-muted)' }}>точки</p>
      </div>
    </div>
  );
};

const PointsConfig = ({ config, dark }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {Object.entries(config).filter(([k]) => k !== 'challenge_complete').map(([action, points]) => {
      const labels = {
        register: 'Регистрация', create_project: 'Нов проект', complete_project: 'Завършен проект',
        leave_review: 'Остави отзив', receive_review: 'Получен отзив', portfolio_add: 'Портфолио',
        daily_login: 'Дневен вход', referral: 'Препоръка',
      };
      return (
        <div key={action} className="rounded-xl p-3 text-center"
          style={{ backgroundColor: dark ? '#F9731610' : '#FFF7ED', border: '1px solid #F9731630' }}>
          <p className="text-xl font-black" style={{ color: '#F97316' }}>+{points}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--td-text-muted)' }}>{labels[action] || action}</p>
        </div>
      );
    })}
  </div>
);

const WeeklyTimer = ({ weekEnd }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const end = new Date(weekEnd);
      const now = new Date();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft('Приключи!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d}д ${h}ч ${m}м`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [weekEnd]);
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--td-text-muted)' }}>
      <Clock className="h-3 w-3" /> {timeLeft}
    </span>
  );
};

const ChallengeCard = ({ ch, dark, token, onClaim }) => {
  const Icon = CHALLENGE_ICONS[ch.icon] || Target;
  const pct = ch.target > 0 ? Math.round((ch.current / ch.target) * 100) : 0;
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await axios.post(`${API}/challenges/claim`, { challenge_id: ch.challenge_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onClaim();
    } catch {}
    setClaiming(false);
  };

  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: ch.claimed ? (dark ? '#05966915' : '#F0FDF4') : (dark ? '#1e293b' : '#F8FAFC'),
      border: `1px solid ${ch.completed ? (ch.claimed ? '#059669' : '#F97316') : 'var(--td-border)'}`,
    }} data-testid={`challenge-${ch.challenge_id}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg" style={{
          backgroundColor: ch.completed ? '#F9731620' : (dark ? '#334155' : '#E2E8F0')
        }}>
          <Icon className="h-5 w-5" style={{ color: ch.completed ? '#F97316' : 'var(--td-text-muted)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm" style={{ color: 'var(--td-text)' }}>{ch.title}</p>
            <Badge style={{
              backgroundColor: ch.claimed ? '#05966920' : '#F9731615',
              color: ch.claimed ? '#059669' : '#F97316',
              border: 'none'
            }}>
              {ch.claimed ? 'Получено' : `+${ch.bonus_points}`}
            </Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--td-text-muted)' }}>{ch.description}</p>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: 'var(--td-text-secondary)' }}>
                {ch.current}/{ch.target}
              </span>
              <span className="text-xs" style={{ color: 'var(--td-text-muted)' }}>{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
          {ch.completed && !ch.claimed && (
            <Button size="sm" className="mt-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs h-7 px-3"
              onClick={handleClaim} disabled={claiming} data-testid={`claim-${ch.challenge_id}`}>
              <Gift className="h-3 w-3 mr-1" /> {claiming ? '...' : 'Вземи наградата!'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ReferralSection = ({ dark, token }) => {
  const [refData, setRefData] = useState(null);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [linkRes, statsRes] = await Promise.all([
          axios.get(`${API}/referrals/my-link`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/referrals/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setRefData(linkRes.data);
        setStats(statsRes.data);
      } catch {}
    };
    load();
  }, [token]);

  const copyLink = () => {
    if (refData?.referral_link) {
      navigator.clipboard.writeText(refData.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!token || !refData) return null;

  return (
    <Card className="mb-6" data-testid="referral-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-5 w-5 text-[#F97316]" /> Покани приятели — спечели точки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm truncate"
            style={{ backgroundColor: dark ? '#1e293b' : '#F1F5F9', border: '1px solid var(--td-border)', color: 'var(--td-text-secondary)' }}>
            <Link2 className="h-3.5 w-3.5 inline mr-1.5" style={{ verticalAlign: 'middle' }} />
            {refData.referral_link}
          </div>
          <Button size="sm" onClick={copyLink}
            className={copied ? 'bg-green-600 hover:bg-green-700' : 'bg-[#F97316] hover:bg-[#EA580C]'}
            data-testid="copy-referral-link">
            {copied ? <><Check className="h-4 w-4 mr-1" /> Копирано</> : <><Copy className="h-4 w-4 mr-1" /> Копирай</>}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl p-3" style={{ backgroundColor: dark ? '#F9731610' : '#FFF7ED', border: '1px solid #F9731630' }}>
            <p className="text-2xl font-black" style={{ color: '#F97316' }}>{stats?.referral_count || 0}</p>
            <p className="text-[10px]" style={{ color: 'var(--td-text-muted)' }}>Поканени</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: dark ? '#F9731610' : '#FFF7ED', border: '1px solid #F9731630' }}>
            <p className="text-2xl font-black" style={{ color: '#F97316' }}>{stats?.total_points_earned || 0}</p>
            <p className="text-[10px]" style={{ color: 'var(--td-text-muted)' }}>Точки от покани</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: dark ? '#F9731610' : '#FFF7ED', border: '1px solid #F9731630' }}>
            <p className="text-2xl font-black" style={{ color: '#F97316' }}>+{refData.points_per_referral}</p>
            <p className="text-[10px]" style={{ color: 'var(--td-text-muted)' }}>На покана</p>
          </div>
        </div>

        {stats?.recent_referrals?.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--td-text-muted)' }}>Последни покани:</p>
            <div className="space-y-1">
              {stats.recent_referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: dark ? '#1e293b' : '#F8FAFC' }}>
                  <span style={{ color: 'var(--td-text-secondary)' }}>{r.referred_name}</span>
                  <span style={{ color: 'var(--td-text-muted)' }}>{new Date(r.created_at).toLocaleDateString('bg-BG')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LeaderboardPage = () => {
  const theme = useTheme();
  const dark = theme?.dark ?? true;
  const { user, token } = useAuth();
  const [tab, setTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [firms, setFirms] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [pointsConfig, setPointsConfig] = useState({});
  const [challenges, setChallenges] = useState([]);
  const [challengeProgress, setChallengeProgress] = useState([]);
  const [weekEnd, setWeekEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [cRes, fRes, pRes, chRes] = await Promise.all([
        axios.get(`${API}/leaderboard/clients`),
        axios.get(`${API}/leaderboard/firms`),
        axios.get(`${API}/leaderboard/points-config`),
        axios.get(`${API}/challenges/active`),
      ]);
      setClients(cRes.data.leaderboard);
      setFirms(fRes.data.leaderboard);
      setPointsConfig(pRes.data.points);
      setChallenges(chRes.data.challenges);
      setWeekEnd(chRes.data.week_end);
    } catch {}

    if (token) {
      try {
        const [rRes, cpRes] = await Promise.all([
          axios.get(`${API}/leaderboard/my-rank`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/challenges/my-progress`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setMyRank(rRes.data);
        setChallengeProgress(cpRes.data.progress);
      } catch {}
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--td-bg-page)' }} data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 mx-auto mb-3" style={{ color: '#F97316' }} />
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--td-text)' }}>Класация</h1>
          <p style={{ color: 'var(--td-text-muted)' }}>Събирай точки с всяко действие в платформата</p>
          <Badge className="mt-2 bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30">
            <Zap className="h-3 w-3 mr-1" /> Тестов период — всички точки се запазват
          </Badge>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <Card className="mb-6 overflow-hidden" data-testid="my-rank-card">
            <div className="p-5" style={{ background: dark ? 'linear-gradient(135deg, #F9731615, #F9731605)' : 'linear-gradient(135deg, #FFF7ED, #FFFBEB)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--td-text-muted)' }}>Твоята позиция</p>
                  <p className="text-4xl font-black" style={{ color: '#F97316' }}>#{myRank.rank}</p>
                  <p className="text-xs" style={{ color: 'var(--td-text-muted)' }}>от {myRank.total_participants} {myRank.user_type === 'client' ? 'клиенти' : 'фирми'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--td-text-muted)' }}>Общо точки</p>
                  <p className="text-4xl font-black" style={{ color: '#F97316' }}>{myRank.total_points}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">Активен</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Challenges */}
        <Card className="mb-6" data-testid="weekly-challenges">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-[#F97316]" /> Седмично предизвикателство
              </CardTitle>
              {weekEnd && <WeeklyTimer weekEnd={weekEnd} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {token && challengeProgress.length > 0 ? (
              challengeProgress.map(ch => (
                <ChallengeCard key={ch.challenge_id} ch={ch} dark={dark} token={token} onClaim={loadData} />
              ))
            ) : challenges.length > 0 ? (
              challenges.map(ch => (
                <div key={ch.id} className="rounded-xl p-4 flex items-center gap-3"
                  style={{ backgroundColor: dark ? '#1e293b' : '#F8FAFC', border: '1px solid var(--td-border)' }}>
                  <Target className="h-5 w-5" style={{ color: 'var(--td-text-muted)' }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--td-text)' }}>{ch.title}</p>
                    <p className="text-xs" style={{ color: 'var(--td-text-muted)' }}>{ch.description}</p>
                  </div>
                  <Badge style={{ backgroundColor: '#F9731615', color: '#F97316', border: 'none' }}>+{ch.bonus_points}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--td-text-muted)' }}>Влезте, за да видите предизвикателствата</p>
            )}
          </CardContent>
        </Card>

        {/* Referral Section */}
        <ReferralSection dark={dark} token={token} />

        {/* How to earn points */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-[#F97316]" /> Как се печелят точки?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PointsConfig config={pointsConfig} dark={dark} />
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="clients" data-testid="tab-clients">
              <Users className="h-4 w-4 mr-2" /> Клиенти
            </TabsTrigger>
            <TabsTrigger value="firms" data-testid="tab-firms">
              <Building2 className="h-4 w-4 mr-2" /> Фирми & Майстори
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardContent className="p-2 sm:p-4">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: dark ? '#253545' : '#F1F5F9' }} />)}
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--td-text-muted)' }} />
                    <p style={{ color: 'var(--td-text-muted)' }}>Все още няма участници</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {clients.map(entry => <LeaderboardRow key={entry.id} entry={entry} dark={dark} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firms">
            <Card>
              <CardContent className="p-2 sm:p-4">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: dark ? '#253545' : '#F1F5F9' }} />)}
                  </div>
                ) : firms.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--td-text-muted)' }} />
                    <p style={{ color: 'var(--td-text-muted)' }}>Все още няма участници</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {firms.map(entry => <LeaderboardRow key={entry.id} entry={entry} dark={dark} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeaderboardPage;
