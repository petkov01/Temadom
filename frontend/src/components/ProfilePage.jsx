import React, { useState, useEffect } from 'react';
import { User, Mail, Building2, Hash, Calendar, Shield, Edit2, Save, LogOut, Camera, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../App';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', company_name: '', bulstat: '',
    city: '', description: '', website: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        company_name: res.data.company_name || '',
        bulstat: res.data.bulstat || '',
        city: res.data.city || '',
        description: res.data.description || '',
        website: res.data.website || '',
      });
    } catch {
      toast.error('Грешка при зареждане на профила');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/auth/profile`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setProfile(res.data);
      setEditing(false);
      toast.success('Профилът е обновен!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при запис');
    }
    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0F1923] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#F97316] border-t-transparent rounded-full" />
      </div>
    );
  }

  const isCompany = profile.user_type === 'company';
  const createdDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('bg-BG') : 'N/A';

  return (
    <div className="min-h-screen bg-[#0F1923] py-8 px-4" data-testid="profile-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#F97316]/10 flex items-center justify-center mx-auto mb-4 border-2 border-[#F97316]/30">
            <User className="h-10 w-10 text-[#F97316]" />
          </div>
          <h1 className="text-2xl font-bold text-white" data-testid="profile-name">{profile.name}</h1>
          <p className="text-slate-400 text-sm">{profile.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className={`text-xs ${isCompany ? 'bg-[#F97316]/15 text-[#F97316]' : 'bg-[#4DA6FF]/15 text-[#4DA6FF]'}`}>
              {isCompany ? 'Фирма' : 'Клиент'}
            </Badge>
            {profile.subscription_active && (
              <Badge className="bg-[#10B981]/15 text-[#10B981] text-xs">Активен абонамент</Badge>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <Card className="bg-[#1E2A38] border-[#2A3A4C] mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center justify-between">
              <span>Лична информация</span>
              {!editing ? (
                <Button size="sm" variant="ghost" className="text-[#F97316] hover:text-[#FF8C42] text-xs h-7"
                  onClick={() => setEditing(true)} data-testid="edit-profile-btn">
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Редактирай
                </Button>
              ) : (
                <Button size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white text-xs h-7"
                  onClick={handleSave} disabled={loading} data-testid="save-profile-btn">
                  <Save className="h-3.5 w-3.5 mr-1" /> {loading ? 'Запис...' : 'Запази'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] text-slate-500 mb-1 block">Име</Label>
                {editing ? (
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="h-9 bg-[#0F1923] border-[#3A4A5C] text-white text-sm" data-testid="profile-input-name" />
                ) : (
                  <p className="text-white text-sm flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-500" />{profile.name}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500 mb-1 block">Имейл</Label>
                <p className="text-white text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-500" />{profile.email}</p>
              </div>
            </div>

            {isCompany && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] text-slate-500 mb-1 block">Фирма</Label>
                  {editing ? (
                    <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                      className="h-9 bg-[#0F1923] border-[#3A4A5C] text-white text-sm" data-testid="profile-input-company" />
                  ) : (
                    <p className="text-white text-sm flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-500" />{profile.company_name || '—'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500 mb-1 block">БУЛСТАТ</Label>
                  {editing ? (
                    <Input value={form.bulstat} onChange={e => setForm(p => ({ ...p, bulstat: e.target.value }))}
                      className="h-9 bg-[#0F1923] border-[#3A4A5C] text-white text-sm" data-testid="profile-input-bulstat" />
                  ) : (
                    <p className="text-white text-sm flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-slate-500" />{profile.bulstat || '—'}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] text-slate-500 mb-1 block">Град</Label>
                {editing ? (
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="София" className="h-9 bg-[#0F1923] border-[#3A4A5C] text-white text-sm" data-testid="profile-input-city" />
                ) : (
                  <p className="text-white text-sm">{profile.city || '—'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500 mb-1 block">Уебсайт</Label>
                {editing ? (
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://..." className="h-9 bg-[#0F1923] border-[#3A4A5C] text-white text-sm" data-testid="profile-input-website" />
                ) : (
                  <p className="text-white text-sm">{profile.website || '—'}</p>
                )}
              </div>
            </div>

            {editing && (
              <div>
                <Label className="text-[10px] text-slate-500 mb-1 block">Описание</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Кратко описание на дейността..."
                  className="bg-[#0F1923] border-[#3A4A5C] text-white min-h-[60px] text-sm" data-testid="profile-input-desc" />
              </div>
            )}
            {!editing && profile.description && (
              <div>
                <Label className="text-[10px] text-slate-500 mb-1 block">Описание</Label>
                <p className="text-slate-300 text-sm">{profile.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="bg-[#1E2A38] border-[#2A3A4C] mb-4">
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Calendar className="h-5 w-5 text-[#4DA6FF] mx-auto mb-1" />
                <p className="text-slate-500 text-[10px]">Регистрация</p>
                <p className="text-white text-xs font-medium" data-testid="profile-created">{createdDate}</p>
              </div>
              <div>
                <Shield className="h-5 w-5 text-[#10B981] mx-auto mb-1" />
                <p className="text-slate-500 text-[10px]">Тип акаунт</p>
                <p className="text-white text-xs font-medium">{isCompany ? 'Фирма' : 'Клиент'}</p>
              </div>
              <div>
                <CreditCard className="h-5 w-5 text-[#F97316] mx-auto mb-1" />
                <p className="text-slate-500 text-[10px]">Абонамент</p>
                <p className="text-white text-xs font-medium">{profile.subscription_active ? 'Активен' : 'Безплатен'}</p>
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
    </div>
  );
};

export default ProfilePage;
