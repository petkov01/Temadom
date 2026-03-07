import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Calculator, FileDown, CreditCard, Eye, TrendingUp, MapPin, Clock, Lock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalyticsDashboard = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/analytics/dashboard`, {
        headers: { 'X-Admin-Password': password }
      });
      setData(res.data);
      setIsAuthed(true);
      sessionStorage.setItem('analytics_pw', password);
    } catch (err) {
      setError('Грешна парола');
    }
    setLoading(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('analytics_pw');
    if (saved) {
      axios.get(`${API}/analytics/dashboard`, { headers: { 'X-Admin-Password': saved } })
        .then(res => { setData(res.data); setIsAuthed(true); })
        .catch(() => sessionStorage.removeItem('analytics_pw'));
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthed) return;
    const pw = sessionStorage.getItem('analytics_pw');
    const interval = setInterval(() => {
      axios.get(`${API}/analytics/dashboard`, { headers: { 'X-Admin-Password': pw } })
        .then(res => setData(res.data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthed]);

  if (!isAuthed) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center" data-testid="analytics-login">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="h-8 w-8 text-[#FF8C42] mx-auto mb-2" />
          <CardTitle>Аналитикс</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" placeholder="Парола за достъп" value={password} onChange={e => setPassword(e.target.value)} data-testid="analytics-password" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30]" type="submit" disabled={loading} data-testid="analytics-login-btn">
              {loading ? 'Зареждане...' : 'Вход'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (!data) return <div className="min-h-screen flex items-center justify-center">Зареждане...</div>;

  return (
    <div className="min-h-screen bg-slate-100" data-testid="analytics-dashboard">
      <div className="bg-slate-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-orange-400" />
            <h1 className="text-xl font-bold">Аналитикс</h1>
            <Badge className="bg-green-600 animate-pulse"><Activity className="h-3 w-3 mr-1" /> Live</Badge>
          </div>
          <span className="theme-text-muted text-sm">Последна актуализация: {new Date().toLocaleTimeString('bg-BG')}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Eye className="h-5 w-5" />, label: 'Посещения (днес)', value: data.pageviews_today, color: 'text-blue-600' },
            { icon: <Calculator className="h-5 w-5" />, label: 'Калкулации', value: data.calculator_uses, color: 'text-[#FF8C42]' },
            { icon: <FileDown className="h-5 w-5" />, label: 'PDF изтегляния', value: data.pdf_downloads, color: 'text-green-600' },
            { icon: <CreditCard className="h-5 w-5" />, label: 'Плащания', value: data.payments, color: 'text-[#8C56FF]' }
          ].map((m, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={`${m.color} mb-2`}>{m.icon}</div>
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-xs theme-text-subtle">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users & registrations */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{data.total_users}</p>
              <p className="text-xs theme-text-subtle">Общо потребители</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-[#FF8C42] mb-2" />
              <p className="text-2xl font-bold">{data.total_companies}</p>
              <p className="text-xs theme-text-subtle">Фирми</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-green-600 mb-2" />
              <p className="text-2xl font-bold">{data.total_clients}</p>
              <p className="text-xs theme-text-subtle">Клиенти</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top pages */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" /> Топ страници (днес)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.top_pages?.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm theme-text-muted truncate flex-1">{p.path}</span>
                    <Badge variant="outline" className="text-xs ml-2">{p.views} посещения</Badge>
                  </div>
                ))}
                {(!data.top_pages || data.top_pages.length === 0) && <p className="text-sm theme-text-muted">Няма данни</p>}
              </div>
            </CardContent>
          </Card>

          {/* Recent events */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500" /> Последни събития</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recent_events?.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-white">{e.event_name}</span>
                      {e.metadata && <span className="text-xs theme-text-subtle ml-2">{JSON.stringify(e.metadata).substring(0, 40)}</span>}
                    </div>
                    <span className="text-xs theme-text-muted">{new Date(e.created_at).toLocaleTimeString('bg-BG')}</span>
                  </div>
                ))}
                {(!data.recent_events || data.recent_events.length === 0) && <p className="text-sm theme-text-muted">Няма данни</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top regions */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" /> Топ области (калкулатор)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {data.top_regions?.map((r, i) => (
                <div key={i} className="flex items-center justify-between  rounded-lg p-3">
                  <span className="text-sm font-medium theme-text-muted">{r.region}</span>
                  <Badge className="bg-[#FF8C42]/10 text-[#FF8C42] text-xs">{r.count}</Badge>
                </div>
              ))}
              {(!data.top_regions || data.top_regions.length === 0) && <p className="text-sm theme-text-muted">Няма данни</p>}
            </div>
          </CardContent>
        </Card>

        {/* GA4 + Hotjar placeholder */}
        <Card className=" border-dashed">
          <CardContent className="p-6 text-center theme-text-subtle">
            <p className="font-semibold mb-2">Google Analytics 4 & Hotjar</p>
            <p className="text-sm">За да активирате GA4 и Hotjar, добавете вашите ID-та в <code className="bg-slate-200 px-1 rounded">/app/frontend/public/index.html</code></p>
            <p className="text-xs mt-2">GA4: Заменете <code>G-XXXXXXXXXX</code> с вашия Measurement ID</p>
            <p className="text-xs">Hotjar: Заменете <code>XXXXXXX</code> с вашия Site ID</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
