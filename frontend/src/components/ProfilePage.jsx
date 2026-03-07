import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Building2, Hash, Calendar, Shield, Edit2, Save, LogOut, Camera, CreditCard,
  Bookmark, Eye, Trash2, Share2, Settings, Image as ImageIcon, MapPin, Globe, FileText, ExternalLink,
  Gift, Copy, CheckCircle, MessageCircle, Phone, Lock, Zap, BarChart3, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../App';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PLAN_DISPLAY = {
  basic: { name: 'БАЗОВ', color: '#4DA6FF', price: 15 },
  pro: { name: 'ПРО', color: '#F97316', price: 35 },
  premium: { name: 'PREMIUM', color: '#8B5CF6', price: 75 },
};

const FEATURE_LABELS = {
  pdf_contracts: { label: 'PDF Договори', icon: FileText },
  ai_sketches: { label: 'AI Скици', icon: Zap },
  quantitative_estimates: { label: 'Количествени сметки', icon: BarChart3 },
  telegram_notifications: { label: 'Telegram известия', icon: MessageCircle },
  priority_display: { label: 'Приоритетно показване', icon: Eye },
  team_members: { label: 'Членове на екип', icon: UsersIcon },
};

const SubscriptionDashboard = ({ token }) => {
  const [limits, setLimits] = useState(null);
  const [sub, setSub] = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/subscriptions/my-limits`, { headers }).then(r => r.data).catch(() => null),
      axios.get(`${API}/subscriptions/my`, { headers }).then(r => r.data).catch(() => null),
    ]).then(([l, s]) => { setLimits(l); setSub(s); });
  }, [token]);

  if (!limits) return null;

  const plan = limits.plan || 'basic';
  const planInfo = PLAN_DISPLAY[plan] || PLAN_DISPLAY.basic;
  const offers = limits.features?.offers || {};
  const daysLeft = sub?.days_remaining || 0;

  return (
    <Card className="mb-4" style={{ background: 'var(--theme-card-bg)', border: `1px solid ${planInfo.color}30` }}
      data-testid="subscription-dashboard">
      <CardContent className="p-4 space-y-4">
        {/* Plan header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${planInfo.color}15` }}>
              <Shield className="h-5 w-5" style={{ color: planInfo.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>План:</span>
                <Badge className="text-xs font-bold" style={{ background: `${planInfo.color}15`, color: planInfo.color }}>
                  {planInfo.name}
                </Badge>
              </div>
              {sub?.subscription_active && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {daysLeft > 0 ? `Остават ${daysLeft} дни` : 'Изтича днес'}
                </p>
              )}
            </div>
          </div>
          {plan !== 'premium' && (
            <a href="/subscriptions" className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: `${(PLAN_DISPLAY[plan === 'basic' ? 'pro' : 'premium']).color}15`,
                       color: (PLAN_DISPLAY[plan === 'basic' ? 'pro' : 'premium']).color }}
              data-testid="upgrade-plan-link">
              Надгради
            </a>
          )}
        </div>

        {/* Offers usage */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Оферти този месец</span>
            <span className="text-xs font-bold" style={{ color: planInfo.color }}>
              {offers.current || 0} / {offers.max >= 999 ? '∞' : offers.max || 5}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${offers.max >= 999 ? 5 : Math.min(100, ((offers.current || 0) / (offers.max || 5)) * 100)}%`,
              background: planInfo.color
            }} />
          </div>
          {offers.max < 999 && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-subtle)' }}>
              Остават {offers.remaining || 0} оферти
            </p>
          )}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(FEATURE_LABELS).map(([key, { label, icon: Icon }]) => {
            const val = limits.features?.[key];
            const isEnabled = val === true || (typeof val === 'number' && val > 1);
            return (
              <div key={key} className="flex items-center gap-2 p-2 rounded-lg text-xs"
                style={{ background: 'var(--theme-bg-surface)', opacity: isEnabled ? 1 : 0.5 }}
                data-testid={`feature-${key}`}>
                {isEnabled ? (
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                )}
                <span style={{ color: 'var(--theme-text-muted)' }}>{label}</span>
                {typeof val === 'number' && val > 1 && (
                  <span className="ml-auto font-bold" style={{ color: planInfo.color }}>до {val}</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentSection = () => {
  const [loading, setLoading] = useState(null);
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/payments/history`, { headers }).then(r => setHistory(r.data.transactions)).catch(() => {});
  }, []);

  const checkout = async (packageId) => {
    setLoading(packageId);
    try {
      const res = await axios.post(`${API}/payments/checkout?package_type=${packageId}`, {}, { headers });
      if (res.data.checkout_url) window.location.href = res.data.checkout_url;
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка'); }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      {/* Subscription plans */}
      <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>
            <CreditCard className="inline h-4 w-4 text-[#F97316] mr-2" /> Абонаментни планове
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PLAN_DISPLAY).map(([key, plan]) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'var(--theme-bg-surface)', border: `1px solid ${plan.color}20` }}>
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${plan.color}15`, color: plan.color }}>{plan.name}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--theme-text-muted)' }}>от {plan.price} EUR/мес</span>
              </div>
              <div className="flex gap-1">
                {[1, 3, 6, 12].map(m => (
                  <Button key={m} size="sm" className="text-[10px] h-7 px-2"
                    style={{ background: loading === `${key}_${m}` ? plan.color : `${plan.color}10`, color: loading === `${key}_${m}` ? 'white' : plan.color }}
                    onClick={() => checkout(`${key}_${m}`)}
                    disabled={!!loading}
                    data-testid={`buy-${key}-${m}`}>
                    {loading === `${key}_${m}` ? <Loader2 className="h-3 w-3 animate-spin" /> : `${m}м`}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment history */}
      {history.length > 0 && (
        <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>История на плащанията</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-1" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>{tx.package_name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{new Date(tx.created_at).toLocaleDateString('bg-BG')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: '#F97316' }}>{tx.amount} {tx.currency?.toUpperCase()}</p>
                    <Badge className={`text-[9px] ${tx.payment_status === 'paid' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-yellow-500/15 text-yellow-600'}`}>
                      {tx.payment_status === 'paid' ? 'Платено' : 'Очаква'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
const SITE = process.env.REACT_APP_BACKEND_URL;

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [referral, setReferral] = useState(null);
  const [refCode, setRefCode] = useState('');
  const [applyingRef, setApplyingRef] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '', email: '', company_name: '', bulstat: '',
    city: '', description: '', website: '',
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchProfile(); fetchProjects(); fetchReferral(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, { headers });
      setProfile(res.data);
      if (res.data.avatar) setAvatarUrl(`data:image/jpeg;base64,${res.data.avatar}`);
      setForm({
        name: res.data.name || '', email: res.data.email || '',
        company_name: res.data.company_name || '', bulstat: res.data.bulstat || '',
        city: res.data.city || '', description: res.data.description || '',
        website: res.data.website || '',
      });
    } catch { toast.error('Грешка при зареждане на профила'); }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/ai-designer/my-projects`, { headers });
      setProjects(res.data.projects || []);
    } catch { /* no projects */ }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${API}/auth/profile`, form, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setProfile(prev => ({ ...prev, ...res.data }));
      setEditing(false);
      toast.success('Профилът е обновен!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка при запис'); }
    setLoading(false);
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Само снимки (JPG/PNG)'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Макс. 5MB'); return; }
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API}/auth/avatar`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      setAvatarUrl(`data:image/jpeg;base64,${res.data.avatar}`);
      toast.success('Профилната снимка е обновена!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка при качване'); }
    setUploadingAvatar(false);
  };

  const deleteProject = async (id) => {
    try {
      await axios.delete(`${API}/ai-designer/project/${id}`, { headers });
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Проектът е изтрит');
    } catch { toast.error('Грешка при изтриване'); }
  };

  const fetchReferral = async () => {
    try {
      const res = await axios.get(`${API}/referrals/status`, { headers });
      setReferral(res.data);
    } catch { /* no referrals */ }
  };

  const applyReferralCode = async () => {
    if (!refCode.trim()) return;
    setApplyingRef(true);
    try {
      const res = await axios.post(`${API}/referrals/apply`, { code: refCode.trim() }, { headers: { ...headers, 'Content-Type': 'application/json' } });
      toast.success(res.data.reward);
      setRefCode('');
      fetchReferral();
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка'); }
    setApplyingRef(false);
  };

  const copyReferralLink = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.referral_link);
    toast.success('Реферален линк копиран!');
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-bg)' }}>
        <div className="animate-spin h-8 w-8 border-2 border-[#F97316] border-t-transparent rounded-full" />
      </div>
    );
  }

  const isCompany = profile.user_type === 'company';
  const createdDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('bg-BG') : 'N/A';

  return (
    <div className="min-h-screen py-6 px-4" style={{ background: 'var(--theme-bg)' }} data-testid="profile-page">
      <div className="max-w-3xl mx-auto">

        {/* Profile Header with Avatar */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#F97316]/30 shadow-xl mx-auto"
              style={{ background: 'var(--theme-bg-surface)' }} data-testid="avatar-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" data-testid="avatar-image" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-12 w-12 text-[#F97316]" />
                </div>
              )}
            </div>
            <button
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-lg hover:bg-[#EA580C] transition-colors"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              data-testid="upload-avatar-btn"
            >
              {uploadingAvatar ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleAvatarUpload(e.target.files?.[0])} data-testid="avatar-file-input" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }} data-testid="profile-name">{profile.name}</h1>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{profile.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className={`text-xs ${isCompany ? 'bg-[#F97316]/15 text-[#F97316]' : 'bg-[#4DA6FF]/15 text-[#4DA6FF]'}`}>
              {isCompany ? 'Фирма' : 'Клиент'}
            </Badge>
            {profile.subscription_active && (
              <Badge className="text-xs" style={{
                background: `${(PLAN_DISPLAY[profile.subscription_plan] || PLAN_DISPLAY.basic).color}15`,
                color: (PLAN_DISPLAY[profile.subscription_plan] || PLAN_DISPLAY.basic).color
              }} data-testid="plan-badge">
                {(PLAN_DISPLAY[profile.subscription_plan] || PLAN_DISPLAY.basic).name}
              </Badge>
            )}
            {profile.city && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                <MapPin className="h-3 w-3 mr-1" /> {profile.city}
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4" style={{ background: 'var(--theme-bg-secondary)' }}>
            <TabsTrigger value="info" data-testid="tab-info">
              <User className="h-3.5 w-3.5 mr-1.5" /> Профил
            </TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">
              <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Проекти
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Плащания
            </TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">
              <Gift className="h-3.5 w-3.5 mr-1.5" /> Реферали
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-3.5 w-3.5 mr-1.5" /> Настройки
            </TabsTrigger>
          </TabsList>

          {/* TAB: Personal Info */}
          <TabsContent value="info">
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between" style={{ color: 'var(--theme-text)' }}>
                  <span>Лична информация</span>
                  {!editing ? (
                    <Button size="sm" variant="ghost" className="text-[#F97316] hover:text-[#FF8C42] text-xs h-7"
                      onClick={() => setEditing(true)} data-testid="edit-profile-btn">
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Редактирай
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-xs h-7" style={{ color: 'var(--theme-text-muted)' }}
                        onClick={() => setEditing(false)}>Отказ</Button>
                      <Button size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white text-xs h-7"
                        onClick={handleSave} disabled={loading} data-testid="save-profile-btn">
                        <Save className="h-3.5 w-3.5 mr-1" /> {loading ? 'Запис...' : 'Запази'}
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Име</Label>
                    {editing ? (
                      <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="h-9 text-sm" data-testid="profile-input-name" />
                    ) : (
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><User className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-subtle)' }} />{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Имейл</Label>
                    <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><Mail className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-subtle)' }} />{profile.email}</p>
                  </div>
                </div>

                {isCompany && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Фирма</Label>
                      {editing ? (
                        <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                          className="h-9 text-sm" data-testid="profile-input-company" />
                      ) : (
                        <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><Building2 className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-subtle)' }} />{profile.company_name || '—'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>БУЛСТАТ</Label>
                      {editing ? (
                        <Input value={form.bulstat} onChange={e => setForm(p => ({ ...p, bulstat: e.target.value }))}
                          className="h-9 text-sm" data-testid="profile-input-bulstat" />
                      ) : (
                        <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><Hash className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-subtle)' }} />{profile.bulstat || '—'}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Град / Област</Label>
                    {editing ? (
                      <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="София" className="h-9 text-sm" data-testid="profile-input-city" />
                    ) : (
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><MapPin className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-subtle)' }} />{profile.city || '—'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Уебсайт</Label>
                    {editing ? (
                      <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                        placeholder="https://..." className="h-9 text-sm" data-testid="profile-input-website" />
                    ) : (
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                        <Globe className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-subtle)' }} />
                        {profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#4DA6FF] hover:underline">{profile.website}</a> : '—'}
                      </p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div>
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Описание</Label>
                    <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Кратко описание на дейността..." className="min-h-[60px] text-sm" data-testid="profile-input-desc" />
                  </div>
                )}
                {!editing && profile.description && (
                  <div>
                    <Label className="text-[10px] mb-1 block" style={{ color: 'var(--theme-text-subtle)' }}>Описание</Label>
                    <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{profile.description}</p>
                  </div>
                )}

                {/* Account Stats */}
                <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Calendar className="h-5 w-5 text-[#4DA6FF] mx-auto mb-1" />
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>Регистрация</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--theme-text)' }} data-testid="profile-created">{createdDate}</p>
                    </div>
                    <div>
                      <Shield className="h-5 w-5 text-[#10B981] mx-auto mb-1" />
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>Тип акаунт</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>{isCompany ? 'Фирма' : 'Клиент'}</p>
                    </div>
                    <div>
                      <CreditCard className="h-5 w-5 text-[#F97316] mx-auto mb-1" />
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>Абонамент</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>{profile.subscription_active ? 'PREMIUM' : 'Безплатен'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: My Projects */}
          <TabsContent value="projects">
            <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>
                  Моите 3D проекти ({projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--theme-text-subtle)' }} />
                    <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Нямате запазени проекти</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--theme-text-subtle)' }}>Създайте първия си проект в 3D Photo Designer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg transition-colors"
                        style={{ border: '1px solid var(--theme-border)' }} data-testid={`my-project-${p.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>{p.room_type}</p>
                          <div className="flex items-center gap-3 text-[10px] mt-0.5" style={{ color: 'var(--theme-text-subtle)' }}>
                            <span>{p.dimensions?.width}×{p.dimensions?.length}м</span>
                            <span>{p.style}</span>
                            {p.budget_eur && <span className="text-[#F97316] font-bold">€{p.budget_eur}</span>}
                            <span>{new Date(p.created_at).toLocaleDateString('bg-BG')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                          <a href={`${SITE}/projects/${p.id}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--theme-text-muted)' }}
                            data-testid={`view-project-${p.id}`}>
                            <Eye className="h-4 w-4" />
                          </a>
                          <button onClick={() => { navigator.clipboard.writeText(`${SITE}/projects/${p.id}`); toast.success('Линкът е копиран!'); }}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--theme-text-muted)' }}>
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteProject(p.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                            data-testid={`delete-project-${p.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Payments */}
          <TabsContent value="payments">
            {/* Subscription Dashboard */}
            {isCompany && <SubscriptionDashboard token={token} />}
            <PaymentSection />
          </TabsContent>

          {/* TAB: Referrals */}
          <TabsContent value="referrals">
            <div className="space-y-4">
              {/* Your code */}
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                    <Gift className="h-4 w-4 text-[#F97316]" /> Вашият реферален код
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {referral && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 rounded-lg text-center font-mono text-xl font-black tracking-widest text-[#F97316]"
                          style={{ background: 'rgba(249,115,22,0.08)', border: '2px dashed rgba(249,115,22,0.3)' }}
                          data-testid="referral-code">
                          {referral.referral_code}
                        </div>
                        <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white h-12 px-4"
                          onClick={copyReferralLink} data-testid="copy-referral-btn">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Share buttons */}
                      <div className="flex gap-2">
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Регистрирай се в TemaDom с мой код ${referral.referral_code} и получи €3 кредит! ${referral.referral_link}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-xs font-medium"
                          style={{ background: '#25D366' }} data-testid="share-ref-whatsapp">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                        <a href={`viber://forward?text=${encodeURIComponent(`Регистрирай се в TemaDom: ${referral.referral_link}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-xs font-medium"
                          style={{ background: '#7360F2' }} data-testid="share-ref-viber">
                          <Phone className="h-3.5 w-3.5" /> Viber
                        </a>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--theme-bg-surface)' }}>
                          <p className="text-2xl font-black text-[#F97316]">{referral.referral_count}</p>
                          <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Поканени</p>
                        </div>
                        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--theme-bg-surface)' }}>
                          <p className="text-2xl font-black text-[#10B981]">{referral.total_reward_eur} EUR</p>
                          <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Спечелено</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Rewards milestones */}
              {referral?.rewards_table && (
                <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>Награди</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {referral.rewards_table.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                          style={{ background: r.unlocked ? 'rgba(16,185,129,0.08)' : 'var(--theme-bg-surface)', border: `1px solid ${r.unlocked ? 'rgba(16,185,129,0.3)' : 'var(--theme-border)'}` }}>
                          <div className="flex items-center gap-2">
                            {r.unlocked ? <CheckCircle className="h-4 w-4 text-[#10B981]" /> : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--theme-border)' }} />}
                            <span className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>{r.count} реферала</span>
                          </div>
                          <span className={`text-xs font-bold ${r.unlocked ? 'text-[#10B981]' : ''}`}
                            style={!r.unlocked ? { color: 'var(--theme-text-muted)' } : {}}>
                            {r.reward}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Apply code */}
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>Имате реферален код?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase())}
                      placeholder="Въведете код..." className="font-mono uppercase tracking-wider"
                      maxLength={10} data-testid="apply-ref-input" />
                    <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white px-4"
                      onClick={applyReferralCode} disabled={applyingRef || !refCode.trim()}
                      data-testid="apply-ref-btn">
                      {applyingRef ? '...' : 'Приложи'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Settings */}
          <TabsContent value="settings">
            <div className="space-y-4">
              {/* Account type & subscription */}
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>Акаунт & Абонамент</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Тип акаунт</p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{isCompany ? 'Фирмен профил' : 'Клиентски профил'}</p>
                    </div>
                    <Badge className={isCompany ? 'bg-[#F97316]/15 text-[#F97316]' : 'bg-[#4DA6FF]/15 text-[#4DA6FF]'}>
                      {isCompany ? 'Фирма' : 'Клиент'}
                    </Badge>
                  </div>
                  <div className="h-px" style={{ background: 'var(--theme-border)' }} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Абонамент</p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {profile.subscription_active ? `Активен до ${profile.subscription_expires || 'N/A'}` : 'Безплатен план'}
                      </p>
                    </div>
                    <Badge className={profile.subscription_active ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-slate-500/15 text-slate-400'}>
                      {profile.subscription_active ? 'PREMIUM' : 'FREE'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)' }}>
                      <p className="text-xl font-black text-[#F97316]">{projects.length}</p>
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>3D проекта</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)' }}>
                      <p className="text-xl font-black text-[#4DA6FF]">{profile.calculator_uses || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Калкулации</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--theme-bg-surface)' }}>
                      <p className="text-xl font-black text-[#10B981]">{profile.free_leads_used || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Ползвани лийдове</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logout */}
              <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-11"
                onClick={logout} data-testid="logout-btn">
                <LogOut className="mr-2 h-4 w-4" /> Изход от акаунта
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
