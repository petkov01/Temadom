import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star, Users, Building2, Crown, ArrowUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from '@/components/ThemeContext';
import { useAuth } from '@/App';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = [Crown, Medal, Medal];

const LeaderboardRow = ({ entry, dark }) => {
  const isTop3 = entry.rank <= 3;
  const RankIcon = RANK_ICONS[entry.rank - 1] || null;
  const rankColor = RANK_COLORS[entry.rank - 1] || (dark ? '#94A3B8' : '#64748B');

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: isTop3
          ? (dark ? `${rankColor}15` : `${rankColor}20`)
          : 'transparent',
        border: isTop3 ? `1px solid ${rankColor}40` : '1px solid transparent',
      }}
      data-testid={`leaderboard-row-${entry.rank}`}
    >
      {/* Rank */}
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

      {/* Name */}
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

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-black" style={{ color: '#F97316' }}>
          {entry.leaderboard_points || 0}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--td-text-muted)' }}>точки</p>
      </div>
    </div>
  );
};

const PointsConfig = ({ config, dark }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {Object.entries(config).map(([action, points]) => {
      const labels = {
        register: 'Регистрация',
        create_project: 'Нов проект',
        complete_project: 'Завършен проект',
        leave_review: 'Остави отзив',
        receive_review: 'Получен отзив',
        portfolio_add: 'Портфолио',
        daily_login: 'Дневен вход',
        referral: 'Препоръка',
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

const LeaderboardPage = () => {
  const theme = useTheme();
  const dark = theme?.dark ?? true;
  const { user, token } = useAuth();
  const [tab, setTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [firms, setFirms] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [pointsConfig, setPointsConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [cRes, fRes, pRes] = await Promise.all([
          axios.get(`${API}/leaderboard/clients`),
          axios.get(`${API}/leaderboard/firms`),
          axios.get(`${API}/leaderboard/points-config`),
        ]);
        setClients(cRes.data.leaderboard);
        setFirms(fRes.data.leaderboard);
        setPointsConfig(pRes.data.points);
      } catch {}

      if (token) {
        try {
          const rRes = await axios.get(`${API}/leaderboard/my-rank`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMyRank(rRes.data);
        } catch {}
      }
      setLoading(false);
    };
    fetch();
  }, [token]);

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--td-bg-page)' }} data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 mx-auto mb-3" style={{ color: '#F97316' }} />
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--td-text)' }}>
            Класация
          </h1>
          <p style={{ color: 'var(--td-text-muted)' }}>
            Събирай точки с всяко действие в платформата
          </p>
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
                    <p className="text-sm mt-1" style={{ color: 'var(--td-text-muted)' }}>Регистрирайте се, за да бъдете първи!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {clients.map(entry => (
                      <LeaderboardRow key={entry.id} entry={entry} dark={dark} />
                    ))}
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
                    {firms.map(entry => (
                      <LeaderboardRow key={entry.id} entry={entry} dark={dark} />
                    ))}
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
