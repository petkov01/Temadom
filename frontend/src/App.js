import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from 'sonner';
import { 
  Building2, Zap, Droplets, Paintbrush, Boxes, Grid3x3, LayoutGrid, Square, Home, 
  AppWindow, Thermometer, Layers, Hammer, BrickWall, Axe, Search, Filter, Star, 
  MapPin, Phone, Mail, Lock, Eye, Calendar, Euro, User, LogOut, Menu, X, 
  ChevronRight, CheckCircle, AlertCircle, Clock, ArrowRight, Shield, Users, Award, Check, Calculator, Camera, ChevronLeft, Image, MessageSquare,
  FolderSearch, BookOpen, Briefcase, FileText, HardHat, Info, ClipboardList, BarChart3, Wrench,
  ChevronDown, Globe, Sparkles, FileDown, Megaphone, ShoppingCart, Play, ArrowLeft, Trophy
} from 'lucide-react';
import { AIDesignerPage } from '@/components/AIDesignerPage';
import { FeedbackPage } from '@/components/FeedbackPage';
import { PublishedGalleryPage } from '@/components/PublishedGalleryPage';
import { AISketchPage } from '@/components/AISketchPage';
import { Scanner3DPage } from '@/components/Scanner3DPage';
import { AIChartPage } from '@/components/AIChartPage';
import { ReadyProjectsPage } from '@/components/ReadyProjectsPage';
import PriceCalculator from '@/components/PriceCalculator';
import { PortfolioGallery } from '@/components/PortfolioGallery';
import ProjectEstimator from '@/components/ProjectEstimator';
import ServicesPage from '@/components/ServicesPage';
import ChatPage from '@/components/ChatPage';
import AboutPage from '@/components/AboutPage';
import ProfilePage from '@/components/ProfilePage';
import TermsPage from '@/components/TermsPage';
import ProfessionsPage from '@/components/ProfessionsPage';
import BlogPage from '@/components/BlogPage';
import BlogArticle from '@/components/BlogArticle';
import PricesByRegionPage from '@/components/PricesByRegionPage';
import RegionalPage from '@/components/RegionalPage';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import CommunityPage from '@/components/CommunityPage';
import ProductSearchPage from '@/components/ProductSearchPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import NotificationBell from '@/components/NotificationBell';
import { LanguageProvider, useLanguage } from '@/i18n/LanguageContext';
import { LANGUAGES } from '@/i18n/translations';
import { Chatbot } from '@/components/Chatbot';
import { FeedbackButton } from '@/components/FeedbackButton';
import { PageInstructions } from '@/components/PageInstructions';
import { ThemeProvider, useTheme } from '@/components/ThemeContext';

// TemaDom Logo Component - New Phase 3 logo
const TemaDomLogo = ({ className = "h-12" }) => (
  <div className="flex items-center" data-testid="temadom-logo">
    <img 
      src="/temadom-logo.png" 
      alt="TemaDom" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  </div>
);

// Navbar logo: big and prominent 
const NAVBAR_LOGO_CLASS = "h-[100px] md:h-[130px] w-auto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const api = axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await axios.post(`${API}/auth/register`, data);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await api.get('/auth/me');
      setUser(res.data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, api, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Icon mapping
const ICON_MAP = {
  'Zap': Zap, 'Droplets': Droplets, 'Paintbrush': Paintbrush, 'Boxes': Boxes,
  'Grid3x3': Grid3x3, 'LayoutGrid': LayoutGrid, 'Square': Square, 'Home': Home,
  'AppWindow': AppWindow, 'Thermometer': Thermometer, 'Layers': Layers,
  'Hammer': Hammer, 'BrickWall': BrickWall, 'Axe': Axe, 'Building2': Building2
};

// ============== THEME TOGGLE ==============
const ThemeToggle = () => {
  const theme = useTheme();
  if (!theme) return null;
  return (
    <button onClick={theme.toggle}
      className="p-2 rounded-lg theme-text-muted hover:text-[#F97316] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      style={{ color: 'var(--theme-text-muted)' }}
      data-testid="theme-toggle" title={theme.dark ? 'Светъл режим' : 'Тъмен режим'}>
      {theme.dark ? <span className="text-sm">☀️</span> : <span className="text-sm">🌙</span>}
    </button>
  );
};

// ============== AUTH GATE ==============
const AuthGate = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) return children;
  return (
    <div className="relative min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-bg)' }}>
      <div className="rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }} data-testid="auth-gate-modal">
        <div className="w-16 h-16 bg-[#F97316]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-[#F97316]" />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>Само за регистрирани</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>Регистрирайте се безплатно, за да използвате тази функция.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/login')} className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }} data-testid="auth-gate-login">Вход</button>
          <button onClick={() => navigate('/register')} className="flex-1 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm" data-testid="auth-gate-register">Регистрация</button>
        </div>
      </div>
    </div>
  );
};

// ============== NAVBAR ==============
const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, lang, switchLang } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const moreRef = useRef(null);
  const langRef = useRef(null);
  const mobileLangRef = useRef(null);
  const [mobileStats, setMobileStats] = useState(null);

  useEffect(() => {
    if (mobileMenuOpen && !mobileStats) {
      axios.get(`${API}/stats/live`).then(r => setMobileStats(r.data)).catch(() => {});
    }
  }, [mobileMenuOpen, mobileStats]);

  const MobileLiveStats = () => {
    if (!mobileStats) return null;
    const freeLeft = Math.max(0, mobileStats.free_slots.total - mobileStats.free_slots.used);
    return (
      <div className="grid grid-cols-4 gap-2" data-testid="mobile-live-counter">
        <div className="rounded-lg p-2 text-center" style={{ background: 'var(--theme-bg-secondary)' }}>
          <p className="text-sm font-bold text-[#A8D5BA]">{mobileStats.clients}</p>
          <p className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>клиенти</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'var(--theme-bg-secondary)' }}>
          <p className="text-sm font-bold text-[#B8D0E8]">{mobileStats.companies}</p>
          <p className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>фирми</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'var(--theme-bg-secondary)' }}>
          <p className="text-sm font-bold text-[#E8DAB2]">{mobileStats.masters}</p>
          <p className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>майстори</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'var(--theme-bg-secondary)' }}>
          <p className="text-sm font-bold text-[#28A745]">{freeLeft} FREE</p>
          <p className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>{mobileStats.free_slots.used}/{mobileStats.free_slots.total}</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (langRef.current && !langRef.current.contains(e.target) && 
          mobileLangRef.current && !mobileLangRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav style={{ background: 'var(--theme-nav-bg)', borderBottom: '1px solid var(--theme-nav-border)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[110px]">
          {/* Left: Logo - prominent and left-corner */}
          <div className="flex items-center -ml-4 lg:-ml-8">
            <Link to="/" className="flex items-center pt-1" data-testid="logo-link">
              <TemaDomLogo className={NAVBAR_LOGO_CLASS} />
            </Link>
          </div>

          {/* Right: Nav links + Language + Auth */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-home">
              Главна
            </Link>
            <Link to="/calculator" className="text-sm font-medium transition-colors flex items-center gap-1 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-calculator">
              <Calculator className="h-3.5 w-3.5" />
              Калкулатор
            </Link>
            <Link to="/companies" className="text-sm font-medium transition-colors flex items-center gap-1 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-companies">
              <Building2 className="h-3.5 w-3.5" />
              Фирми
            </Link>
            <Link to="/ads" className="text-sm font-medium transition-colors flex items-center gap-1 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-ads">
              <Megaphone className="h-3.5 w-3.5" />
              Обяви
            </Link>

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="text-sm font-medium transition-colors flex items-center gap-1 hover:text-[#FF8C42]"
                style={{ color: 'var(--theme-text-muted)' }}
                data-testid="nav-more-btn"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                Още
              </button>
              {moreOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 rounded-lg shadow-2xl py-1 z-50" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }} data-testid="nav-more-dropdown">
                  <Link to="/ai-sketch" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-ai-sketch">
                    <FileText className="h-4 w-4" /> AI Sketch (скици)
                  </Link>
                  <Link to="/room-scan" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#8C56FF] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-room-scan">
                    <Camera className="h-4 w-4" /> 3D Photo Designer
                  </Link>
                  <Link to="/ready-projects" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#28A745] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-ready-projects">
                    <FolderSearch className="h-4 w-4" /> Готови проекти
                  </Link>
                  <Link to="/companies" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#4DA6FF] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-companies">
                    <Building2 className="h-4 w-4" /> Фирми
                  </Link>
                  <Link to="/subscriptions" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-subscriptions">
                    <ShoppingCart className="h-4 w-4" /> Абонаменти
                  </Link>
                  <Link to="/services" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-services">
                    <Hammer className="h-4 w-4" /> Услуги
                  </Link>
                  <Link to="/professions" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-professions">
                    <HardHat className="h-4 w-4" /> Професии
                  </Link>
                  <Link to="/blog" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-blog">
                    <BookOpen className="h-4 w-4" /> Блог
                  </Link>
                  <Link to="/community" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-community">
                    <MessageSquare className="h-4 w-4" /> Общност
                  </Link>
                  <Link to="/product-search" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#F97316] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-product-search">
                    <ShoppingCart className="h-4 w-4" /> AI Търсене
                  </Link>
                  <Link to="/leaderboard" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#F97316] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-leaderboard">
                    <Trophy className="h-4 w-4" /> Класация
                  </Link>
                  <Link to="/about" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-about">
                    <Info className="h-4 w-4" /> За нас
                  </Link>
                  <Link to="/feedback" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMoreOpen(false)} data-testid="nav-feedback">
                    <Star className="h-4 w-4" /> Обратна връзка
                  </Link>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-5 w-px mx-1" style={{ background: 'var(--theme-border)' }}></div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm transition-colors px-2 py-1 rounded-md hover:text-[#4DA6FF]"
                style={{ color: 'var(--theme-text-muted)' }}
                data-testid="lang-switcher-btn"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium uppercase">{lang}</span>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 rounded-lg shadow-2xl py-1 z-50" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }} data-testid="lang-dropdown">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { switchLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                        l.code === lang ? 'bg-[#FF8C42]/10 text-[#FF8C42] font-medium' : ''
                      }`}
                      style={l.code !== lang ? { color: 'var(--theme-text-muted)' } : {}}
                      data-testid={`lang-option-${l.code}`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {user.user_type === 'client' && (
                  <Link to="/dashboard/client">
                    <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" data-testid="nav-publish-project">
                      + {t('nav_register')}
                    </Button>
                  </Link>
                )}
                <Link to={user.user_type === 'client' ? '/dashboard/client' : '/dashboard'} className="font-medium flex items-center gap-1.5 hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-dashboard">
                  <LayoutGrid className="h-4 w-4" />
                  {t('nav_dashboard')}
                </Link>
                <Link to="/messages" className="font-medium flex items-center gap-1.5 hover:text-[#FF8C42] transition-colors" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-messages">
                  <MessageSquare className="h-4 w-4" />
                  {t('nav_messages')}
                </Link>
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <Link to="/profile" className="text-sm hover:text-[#FF8C42] transition-colors flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }} data-testid="nav-profile">
                    <User className="h-3.5 w-3.5" /> {user.name}
                  </Link>
                  <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--theme-text-muted)' }} data-testid="logout-btn">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--theme-text-muted)' }} data-testid="login-btn">{t('nav_login')}</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" data-testid="register-btn">
                    {t('nav_register')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={mobileLangRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 hover:text-[#4DA6FF]"
                style={{ color: 'var(--theme-text-muted)' }}
                data-testid="mobile-lang-btn"
              >
                <Globe className="h-5 w-5" />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 rounded-lg shadow-2xl py-1 z-50" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { switchLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm ${
                        l.code === lang ? 'bg-[#FF8C42]/10 text-[#FF8C42] font-medium' : ''
                      }`}
                      style={l.code !== lang ? { color: 'var(--theme-text-muted)' } : {}}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="p-2"
              style={{ color: 'var(--theme-text-muted)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden animate-slideDown" style={{ background: 'var(--theme-nav-bg)', borderTop: '1px solid var(--theme-nav-border)' }}>
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Live Counter */}
            <MobileLiveStats />
            <div className="h-px" style={{ background: 'var(--theme-nav-border)' }} />
            <Link to="/projects" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
              <FolderSearch className="h-4 w-4" /> {t('nav_projects')}
            </Link>
            <Link to="/companies" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
              <Building2 className="h-4 w-4" /> {t('nav_companies')}
            </Link>
            <Link to="/calculator" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
              <Calculator className="h-4 w-4" /> {t('nav_calculator')}
            </Link>
            <Link to="/ai-sketch" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-ai-sketch">
              <FileText className="h-4 w-4" /> AI Sketch (скици)
            </Link>
            <Link to="/room-scan" className="block py-2 flex items-center gap-2 hover:text-[#8C56FF]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-room-scan">
              <Camera className="h-4 w-4" /> 3D Photo Designer
            </Link>
            <Link to="/ready-projects" className="block py-2 flex items-center gap-2 hover:text-[#28A745]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-ready-projects">
              <FolderSearch className="h-4 w-4" /> Готови проекти
            </Link>
            <Link to="/companies" className="block py-2 flex items-center gap-2 hover:text-[#4DA6FF]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-companies">
              <Building2 className="h-4 w-4" /> Фирми
            </Link>
            <Link to="/subscriptions" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart className="h-4 w-4" /> Абонаменти
            </Link>
            <Link to="/services" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
              <Hammer className="h-4 w-4" /> {t('nav_services')}
            </Link>
            <Link to="/blog" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-blog">
              <BookOpen className="h-4 w-4" /> {t('nav_blog')}
            </Link>
            <Link to="/about" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
              <Info className="h-4 w-4" /> {t('nav_about')}
            </Link>
            {user ? (
              <>
                <Link to="/profile" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
                  <User className="h-4 w-4" /> Профил
                </Link>
                <Link to={user.user_type === 'client' ? '/dashboard/client' : '/dashboard'} className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
                  <LayoutGrid className="h-4 w-4" /> {t('nav_dashboard')}
                </Link>
                <Link to="/messages" className="block py-2 flex items-center gap-2 hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} onClick={() => setMobileMenuOpen(false)}>
                  <MessageSquare className="h-4 w-4" /> {t('nav_messages')}
                </Link>
                <Button variant="ghost" className="w-full justify-start hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--theme-text-muted)' }} onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" /> {t('nav_logout')}
                </Button>
              </>
            ) : (
              <div className="flex gap-3 pt-3">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>{t('nav_login')}</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white">{t('nav_register_short')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ============== LIVE COUNTER (fixed top-right) ==============
const LiveCounter = () => {
  const [stats, setStats] = useState({ clients: 0, companies: 0, masters: 0, online: 1, free_slots: { used: 0, total: 56 } });
  const [show, setShow] = useState(true);
  const [pulse, setPulse] = useState(false);
  const sessionRef = useRef(null);

  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = Math.random().toString(36).slice(2);

    const fetchStats = () => {
      axios.get(`${API}/stats/live`).then(res => {
        setStats(prev => {
          if (res.data.clients !== prev.clients) setPulse(true);
          return res.data;
        });
      }).catch(() => {});
    };

    const sendHeartbeat = () => {
      axios.post(`${API}/heartbeat`, { session_id: sessionRef.current }).catch(() => {});
    };

    fetchStats();
    sendHeartbeat();
    const statsInterval = setInterval(fetchStats, 30000);
    const heartbeatInterval = setInterval(sendHeartbeat, 25000);
    return () => { clearInterval(statsInterval); clearInterval(heartbeatInterval); };
  }, []);

  useEffect(() => {
    if (pulse) {
      const t = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(t);
    }
  }, [pulse]);

  const freeLeft = Math.max(0, stats.free_slots.total - stats.free_slots.used);

  return (
    <>
      {/* Desktop: Fixed sidebar (same as before) */}
      <div className={`fixed top-[110px] right-4 z-40 hidden md:block transition-all duration-300 ${show ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`} data-testid="live-counter">
        <button onClick={() => setShow(!show)} className="absolute -left-7 top-2 rounded-l-lg px-1.5 py-2 transition-colors" style={{ background: 'var(--theme-nav-bg)', border: '1px solid var(--theme-nav-border)', color: 'var(--theme-text-muted)' }} data-testid="live-counter-toggle">
          {show ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
        <div className={`backdrop-blur-lg rounded-xl p-3 min-w-[160px] shadow-xl ${pulse ? 'ring-2 ring-[#28A745]/50' : ''}`} style={{ background: 'var(--theme-nav-bg)', border: '1px solid var(--theme-nav-border)', transition: 'box-shadow 0.5s' }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28A745] opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#28A745]"></span></span>
              <span className="text-[#28A745] text-xs font-bold tabular-nums">{stats.online || 1}</span>
              <span className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>онлайн</span>
            </div>
            <div className="h-px my-0.5" style={{ background: 'var(--theme-nav-border)' }} />
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#A8D5BA]" />
              <span className={`text-xs font-bold tabular-nums ${pulse ? 'text-[#A8D5BA]' : ''}`} style={{ color: pulse ? undefined : 'var(--theme-text)', transition: 'color 0.5s' }}>{(stats.clients || 0).toLocaleString()}</span>
              <span className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>клиенти</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[#B8D0E8]" />
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>{stats.companies || 0}</span>
              <span className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>фирми</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-[#E8DAB2]" />
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>{stats.masters || 0}</span>
              <span className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>майстори</span>
            </div>
            <div className="h-px my-0.5" style={{ background: 'var(--theme-nav-border)' }} />
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[#28A745]" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#28A745] text-[10px] font-bold">{freeLeft} FREE</span>
                  <span className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>{stats.free_slots.used}/{stats.free_slots.total}</span>
                </div>
                <div className="h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full bg-[#28A745] rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.free_slots.used / stats.free_slots.total) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Compact bottom bar */}
      <div className="fixed bottom-16 left-3 right-14 z-40 md:hidden rounded-full shadow-lg" data-testid="live-counter-mobile">
        <div className="backdrop-blur-lg px-4 py-2.5 flex items-center justify-between gap-3 rounded-full"
          style={{ background: 'var(--theme-nav-bg)', border: '1px solid var(--theme-nav-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28A745] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#28A745]"></span></span>
            <span className="text-[#28A745] text-[10px] font-bold">{stats.online || 1}</span>
            <span className="text-[9px]" style={{ color: 'var(--theme-text-subtle)' }}>онлайн</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-[#A8D5BA]" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--theme-text)' }}>{stats.clients || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-[#B8D0E8]" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--theme-text)' }}>{stats.companies || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3 text-[#E8DAB2]" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--theme-text)' }}>{stats.masters || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-[#28A745]" />
            <span className="text-[#28A745] text-[9px] font-bold">{freeLeft} FREE</span>
          </div>
        </div>
      </div>
    </>
  );
};

// ============== FOOTER ==============
const Footer = () => {
  const { t } = useLanguage();
  return (
  <footer className="py-12 mt-auto" style={{ background: 'var(--theme-nav-bg)', borderTop: '1px solid var(--theme-nav-border)', color: 'var(--theme-text)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="mb-4 flex flex-col items-start">
            <TemaDomLogo className="h-16 w-auto" />
            <p className="text-[#FF8C42] text-xs font-bold tracking-wider uppercase mt-2">{t('footer_tagline')}</p>
          </div>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {t('footer_desc')}
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-[#FF8C42]">{t('footer_clients')}</h4>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            <li><Link to="/register" className="hover:text-[#FF8C42] transition-colors">{t('footer_publish')}</Link></li>
            <li><Link to="/companies" className="hover:text-[#FF8C42] transition-colors">{t('footer_find_company')}</Link></li>
            <li><Link to="/services" className="hover:text-[#FF8C42] transition-colors">{t('footer_services')}</Link></li>
            <li><Link to="/calculator" className="hover:text-[#FF8C42] transition-colors">{t('footer_calculator')}</Link></li>
            <li><Link to="/professions" className="hover:text-[#FF8C42] transition-colors">{t('footer_professions_guide')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-[#FF8C42]">{t('footer_for_companies')}</h4>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            <li><Link to="/register" className="hover:text-[#FF8C42] transition-colors">{t('footer_register_link')}</Link></li>
            <li><Link to="/projects" className="hover:text-[#FF8C42] transition-colors">{t('footer_view_projects')}</Link></li>
            <li><Link to="/subscriptions" className="hover:text-[#FF8C42] transition-colors">Абонаменти</Link></li>
            <li><Link to="/ai-sketch" className="hover:text-[#FF8C42] transition-colors">AI Sketch</Link></li>
            <li><Link to="/room-scan" className="hover:text-[#FF8C42] transition-colors">Помещения</Link></li>
            <li><Link to="/ready-projects" className="hover:text-[#FF8C42] transition-colors">Готови проекти</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-[#FF8C42]">{t('footer_info')}</h4>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            <li><Link to="/about" className="hover:text-[#FF8C42] transition-colors">{t('footer_about')}</Link></li>
            <li><Link to="/terms" className="hover:text-[#FF8C42] transition-colors">{t('footer_terms')}</Link></li>
            <li className="text-[#4DA6FF]">info@temadom.com</li>
          </ul>
        </div>
      </div>
      <Separator className="my-8" style={{ background: 'var(--theme-nav-border)' }} />
      <div className="flex flex-col items-center gap-3">
        <TemaDomLogo className="h-12 w-auto opacity-60" />
        <p className="text-center text-sm" style={{ color: 'var(--theme-text-subtle)' }}>
          © 2025-2026 TemaDom. {t('footer_rights')}
        </p>
      </div>
    </div>
  </footer>
  );
};

// ============== STAR RATING ==============
const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i} 
          className={`${sizeClass} ${i <= rating ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-slate-300'}`} 
        />
      ))}
    </div>
  );
};

// ============== FIRM SUBSCRIPTIONS SECTION ==============
const PLANS = [
  {
    name: 'БАЗОВ', monthly: 15, color: '#4DA6FF', badge: null,
    features: ['Профил + портфолио', 'До 10 снимки', '5 оферти/месец', 'Основен профил', 'Преглед запитвания'],
    limits: ['Без PDF договори', 'Без AI скици', 'Без Telegram известия'],
  },
  {
    name: 'ПРО', monthly: 35, color: '#F97316', badge: '90% ИЗБИРАТ ТОЗИ!',
    features: ['Всичко от БАЗОВ', 'Telegram известия', 'PDF договори', 'AI скици', 'Количествени сметки', 'Неограничени оферти', 'Приоритетно показване'],
    limits: ['Без 10-мин. предимство'],
  },
  {
    name: 'PREMIUM', monthly: 75, color: '#8B5CF6', badge: 'КРАЛСКИ!',
    features: ['ВСИЧКО от ПРО', 'ПЪРВИ 10 МИН. предимство!', 'Персонализирани PDF', 'Неограничени AI скици', 'Екип до 5 души', 'API достъп', 'Персонален мениджър', 'Топ позиция'],
    limits: [],
  },
];

const PERIODS = [
  { id: '1', label: '1 месец', months: 1, discount: 0 },
  { id: '3', label: '3 месеца', months: 3, discount: 10 },
  { id: '6', label: '6 месеца', months: 6, discount: 15 },
  { id: '12', label: '12 месеца', months: 12, discount: 20 },
];

const FirmSubscriptionsSection = ({ dark, text, muted, accent, border, navigate }) => {
  const [period, setPeriod] = useState(PERIODS[0]);

  const calcPrice = (monthly) => {
    const discounted = monthly * (1 - period.discount / 100);
    return Math.round(discounted * 100) / 100;
  };
  const calcTotal = (monthly) => calcPrice(monthly) * period.months;

  return (
    <section className="py-16 border-t" style={{ borderColor: border }} data-testid="firm-subscriptions-section">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-2" style={{ color: text }}>
          Абонаменти за <span style={{ color: accent }}>фирми</span>
        </h2>
        <p className="text-center mb-6 text-sm" style={{ color: muted }}>Изберете план и период — спестете до 20%</p>

        {/* Period toggle */}
        <div className="flex justify-center mb-6" data-testid="period-toggle">
          <div className="inline-flex rounded-xl p-1" style={{ background: dark ? '#1E293B' : '#F1F5F9', border: `1px solid ${border}` }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all relative"
                style={{
                  background: period.id === p.id ? accent : 'transparent',
                  color: period.id === p.id ? 'white' : muted,
                }}
                data-testid={`period-${p.id}`}>
                {p.label}
                {p.discount > 0 && (
                  <span className="absolute -top-2.5 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: '#10B981' }}>
                    -{p.discount}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification priority */}
        <div className="rounded-xl p-4 mb-8 max-w-3xl mx-auto" style={{ background: dark ? '#0F172A' : '#F1F5F9', border: `1px solid ${border}` }}>
          <p className="text-xs font-bold text-center mb-3" style={{ color: text }}>Как работят известията за нови обяви?</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { name: 'PREMIUM', color: '#8B5CF6', time: '10:00 ч. — ПЪРВИ' },
              { name: 'ПРО', color: '#F97316', time: '10:10 ч. — известие' },
              { name: 'БАЗОВ', color: '#4DA6FF', time: 'Ръчно търсене' },
            ].map(n => (
              <div key={n.name} className="rounded-lg p-2" style={{ background: `${n.color}20`, border: `1px solid ${n.color}30` }}>
                <p className="text-[10px] font-bold" style={{ color: n.color }}>{n.name}</p>
                <p className="text-[10px]" style={{ color: text }}>{n.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => {
            const pricePerMonth = calcPrice(plan.monthly);
            const totalPrice = calcTotal(plan.monthly);
            const saved = period.months > 1 ? Math.round((plan.monthly * period.months - totalPrice) * 100) / 100 : 0;

            return (
              <div key={i} className={`rounded-2xl overflow-hidden transition-all hover:scale-[1.02] ${plan.badge ? 'ring-2' : ''}`}
                style={{
                  background: dark ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.9)',
                  border: `2px solid ${plan.badge ? plan.color : border}`,
                  ringColor: plan.color,
                  boxShadow: plan.badge ? `0 0 30px ${plan.color}20` : 'none'
                }}
                data-testid={`firm-plan-${plan.name.toLowerCase()}`}>
                {plan.badge && (
                  <div className="text-white text-center text-[10px] py-1.5 font-bold tracking-wider" style={{ background: plan.color }}>
                    {plan.badge}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex gap-0.5 justify-center mb-2">
                    {Array.from({ length: i + 1 }, (_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" style={{ color: plan.color }} />
                    ))}
                  </div>
                  <h3 className="text-lg font-black text-center" style={{ color: text }}>{plan.name}</h3>

                  {/* Price */}
                  <div className="text-center my-3">
                    {period.discount > 0 && (
                      <p className="text-sm line-through" style={{ color: muted }}>{plan.monthly} EUR/мес</p>
                    )}
                    <p className="text-3xl font-black" style={{ color: plan.color }}>
                      {pricePerMonth}<span className="text-sm font-normal" style={{ color: muted }}> EUR/мес</span>
                    </p>
                    {period.months > 1 && (
                      <div className="mt-1">
                        <p className="text-xs font-bold" style={{ color: text }}>
                          {totalPrice} EUR за {period.months} мес.
                        </p>
                        {saved > 0 && (
                          <p className="text-[10px] font-bold text-[#10B981]">
                            Спестявате {saved} EUR ({period.discount}%)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-sm" style={{ color: muted }}>
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.color }} /> {f}
                      </div>
                    ))}
                  </div>
                  {plan.limits.length > 0 && (
                    <div className="space-y-1 mb-4 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                      {plan.limits.map((l, li) => (
                        <div key={li} className="flex items-center gap-2 text-xs" style={{ color: muted }}>
                          <X className="h-3 w-3 flex-shrink-0 text-red-400/60" /> {l}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => navigate('/subscriptions')}
                    className="w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
                    style={{ background: plan.color }}
                    data-testid={`firm-plan-btn-${plan.name.toLowerCase()}`}>
                    Избери {plan.name} — {period.months > 1 ? `${totalPrice} EUR/${period.months} мес.` : `${pricePerMonth} EUR/мес`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============== LANDING PAGE ==============
const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dark = theme?.dark ?? true;
  const [stats, setStats] = useState({ total_projects: 0, total_companies: 0, free_slots: { used: 0, total: 56 } });
  const [liveStats, setLiveStats] = useState({ clients: 0, companies: 0, free_slots: { used: 0, total: 56 }, regions: {} });
  const [reviews, setReviews] = useState({ reviews: [], stats: { total: 127, avg_rating: 4.9, recommend_pct: 95, avg_project_min: 14, total_saved_eur: 24500 } });
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    axios.get(`${API}/stats`).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/stats/live`).then(r => setLiveStats(r.data)).catch(() => {});
    axios.get(`${API}/reviews?limit=20`).then(r => setReviews(r.data)).catch(() => {});
  }, []);

  // Auto-rotate reviews carousel
  useEffect(() => {
    if (!reviews.reviews?.length) return;
    const timer = setInterval(() => {
      setReviewIdx(prev => (prev + 1) % reviews.reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.reviews?.length]);

  const slotsUsed = liveStats.free_slots?.used || 0;
  const slotsTotal = liveStats.free_slots?.total || 56;
  const slotsLeft = Math.max(0, slotsTotal - slotsUsed);

  const bg = dark ? '#0F172A' : '#F8FAFC';
  const bgCard = dark ? '#1E293B' : '#FFFFFF';
  const border = dark ? '#334155' : '#E2E8F0';
  const text = dark ? '#F8FAFC' : '#0F172A';
  const muted = dark ? '#94A3B8' : '#64748B';
  const accent = '#F97316';

  return (
    <div style={{ background: bg, color: text }} data-testid="landing-page">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden" style={{ minHeight: '85vh' }}>
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4" style={{ background: `${accent}15` }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" style={{ background: '#10B98115' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center">
          {/* Counter [0/50] pulse */}
          <div className="mb-8 animate-pulse" data-testid="hero-counter">
            <div className="inline-flex items-center gap-3 rounded-full px-6 py-3 border-2" 
              style={{ borderColor: accent, background: dark ? '#F9731615' : '#FFF7ED' }}>
              <span className="text-4xl font-black tabular-nums" style={{ color: accent }}>{slotsUsed}</span>
              <span style={{ color: muted }} className="text-lg">/</span>
              <span className="text-4xl font-black tabular-nums" style={{ color: accent }}>{slotsTotal}</span>
              <div className="h-8 w-px mx-1" style={{ background: border }} />
              <div className="text-left">
                <p style={{ color: accent }} className="text-sm font-bold leading-tight">ПЪРВИ 56 ФИРМИ</p>
                <p style={{ color: muted }} className="text-[10px]">(2 на област × 28 области)</p>
                <p style={{ color: dark ? '#FCD34D' : '#D97706' }} className="text-xs font-bold">= 1 ГОДИНА ПРЕМИУМ 0 EUR</p>
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-center mb-6 leading-tight max-w-4xl">
            Ремонт без стрес —{' '}
            <span style={{ color: accent }} className="relative">
              AI проектиране
              <span className="absolute -bottom-1 left-0 w-full h-1 rounded-full" style={{ background: accent, opacity: 0.5 }} />
            </span>
          </h1>

          <p className="text-base md:text-lg text-center mb-10 max-w-2xl" style={{ color: muted }}>
            Качи 3 снимки → получи реалистичен 3D ремонт + бюджет с директни линкове.
            Виж точно как ще изглежда ПРЕДИ да платиш.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button onClick={() => navigate('/room-scan')} data-testid="hero-room-btn"
              className="group relative px-8 py-4 rounded-xl text-white text-lg font-bold overflow-hidden transition-all hover:scale-105 active:scale-95"
              style={{ background: accent, boxShadow: `0 0 30px ${accent}40` }}>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Camera className="mr-2 h-6 w-6 inline" /> 3D Photo Designer
            </button>
            <button onClick={() => navigate('/ai-sketch')} data-testid="hero-sketch-btn"
              className="px-8 py-4 rounded-xl text-lg font-bold border-2 transition-all hover:scale-105 active:scale-95"
              style={{ borderColor: accent, color: accent, background: dark ? '#F9731610' : '#FFF7ED' }}>
              <FileText className="mr-2 h-5 w-5 inline" /> CAD Скица
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
            {[
              { v: `${liveStats.companies || 21}`, l: 'Фирми', c: accent },
              { v: `${liveStats.clients || 9}`, l: 'Клиенти', c: '#10B981' },
              { v: '1:1', l: 'Точен мащаб', c: dark ? '#FCD34D' : '#D97706' },
              { v: `${slotsLeft} FREE`, l: `${slotsUsed}/${slotsTotal} (2/област)`, c: '#10B981' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center backdrop-blur-lg border" 
                style={{ background: dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.7)', borderColor: border }}>
                <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[11px] mt-0.5" style={{ color: muted }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Regional breakdown */}
          {liveStats.regions && (
            <div className="max-w-3xl w-full mt-6 rounded-xl p-4 backdrop-blur-lg border" 
              style={{ background: dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.7)', borderColor: border }} data-testid="region-breakdown">
              <p className="text-xs font-bold mb-3 text-center" style={{ color: muted }}>{slotsUsed}/56 ФИРМИ (2 на област)</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {Object.entries(liveStats.regions || {}).map(([region, data]) => {
                  const full = data.used >= data.total;
                  const partial = data.used > 0 && !full;
                  return (
                    <span key={region} className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium ${
                      full ? 'bg-red-500/15 text-red-400' : partial ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400'
                    }`} data-testid={`region-${region}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${full ? 'bg-red-500' : partial ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      {region} {data.used}/{data.total}
                    </span>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 mt-3 text-[9px]" style={{ color: muted }}>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Свободна</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> 1/2</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Пълна</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== SHOWCASE: 5 Real AI-Generated Projects ===== */}
      <section className="py-16 border-t" style={{ borderColor: border }} data-testid="showcase-section">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: text }}>Реални AI Проекти от TemaDom</h2>
          <p className="text-center mb-3 text-sm" style={{ color: muted }}>Генерирани от нашия 3D дизайнер с реални цени и линкове</p>
          <p className="text-center mb-8 text-xs" style={{ color: accent }}>Снимай помещението си и получи същия резултат</p>

          {/* Room type quick buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" data-testid="room-quick-btns">
            {[
              { id: 'bathroom', label: 'БАНЯ', icon: '🛁' },
              { id: 'living_room', label: 'ХОЛ', icon: '🛋' },
              { id: 'bedroom', label: 'СПАЛНЯ', icon: '🛏' },
              { id: 'kitchen', label: 'КУХНЯ', icon: '🍳' },
              { id: 'kids_room', label: 'ДЕТСКА', icon: '🎨' },
            ].map(r => (
              <button key={r.id} onClick={() => navigate(`/room-scan?room=${r.id}`)}
                className="px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all hover:scale-105 active:scale-95"
                style={{ borderColor: accent, color: accent, background: dark ? '#F9731610' : '#FFF7ED' }}
                data-testid={`quick-btn-${r.id}`}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          {/* Project cards grid — REAL AI-generated renders */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                room: 'БАНЯ', roomId: 'bathroom', dims: '3.5 x 3.0м', tierTotal: 2000, price: '69', color: '#F97316',
                before: '/showcase/before_bathroom.jpg', after: '/showcase/after_bathroom.jpg',
                products: [
                  { name: 'Керамогранит 30x60', price: '500', store: 'HomeMax', url: 'https://www.home-max.bg/search/?q=%D0%BA%D0%B5%D1%80%D0%B0%D0%BC%D0%BE%D0%B3%D1%80%D0%B0%D0%BD%D0%B8%D1%82+30x60&ref=temadom' },
                  { name: 'Стенна тоалетна', price: '250', store: 'Bauhaus', url: 'https://bauhaus.bg/search/%D1%81%D1%82%D0%B5%D0%BD%D0%BD%D0%B0+%D1%82%D0%BE%D0%B0%D0%BB%D0%B5%D1%82%D0%BD%D0%B0&utm_source=temadom&utm_medium=affiliate' },
                  { name: 'Душ кабина хидромасаж', price: '400', store: 'Mr.Bricolage', url: 'https://mr-bricolage.bg/search?q=%D0%B4%D1%83%D1%88+%D0%BA%D0%B0%D0%B1%D0%B8%D0%BD%D0%B0&ref=temadom' },
                ],
              },
              {
                room: 'ХОЛ', roomId: 'living_room', dims: '5.0 x 4.0м', tierTotal: 3500, price: '89', color: '#10B981',
                before: '/showcase/before_living.jpg', after: '/showcase/after_living_room.jpg',
                products: [
                  { name: 'Ламинат Дъб Натюр', price: '400', store: 'Praktiker', url: 'https://praktiker.bg/search?q=%D0%BB%D0%B0%D0%BC%D0%B8%D0%BD%D0%B0%D1%82+%D0%B4%D1%8A%D0%B1&utm_source=temadom&utm_medium=affiliate' },
                  { name: 'Боя матов ефект 10л', price: '120', store: 'Mr.Bricolage', url: 'https://mr-bricolage.bg/search?q=%D0%B1%D0%BE%D1%8F+%D0%BC%D0%B0%D1%82%D0%BE%D0%B2&ref=temadom' },
                  { name: 'LED панел вграден', price: '200', store: 'Praktiker', url: 'https://praktiker.bg/search?q=LED+%D0%BF%D0%B0%D0%BD%D0%B5%D0%BB&utm_source=temadom&utm_medium=affiliate' },
                ],
              },
              {
                room: 'СПАЛНЯ', roomId: 'bedroom', dims: '4.0 x 3.5м', tierTotal: 2790, price: '79', color: '#3B82F6',
                before: '/showcase/before_bedroom.jpg', after: '/showcase/after_bedroom.jpg',
                products: [
                  { name: 'Легло мемори матрак 160', price: '800', store: 'eMAG', url: 'https://www.emag.bg/search/%D0%BB%D0%B5%D0%B3%D0%BB%D0%BE+%D0%BC%D0%B5%D0%BC%D0%BE%D1%80%D0%B8+160?ref=temadom' },
                  { name: 'Ламинат 10мм дъб', price: '250', store: 'HomeMax', url: 'https://www.home-max.bg/search/?q=%D0%BB%D0%B0%D0%BC%D0%B8%D0%BD%D0%B0%D1%82+10%D0%BC%D0%BC&ref=temadom' },
                  { name: 'Боя акрилна мат', price: '80', store: 'Bauhaus', url: 'https://bauhaus.bg/search/%D0%B0%D0%BA%D1%80%D0%B8%D0%BB%D0%BD%D0%B0+%D0%B1%D0%BE%D1%8F&utm_source=temadom&utm_medium=affiliate' },
                ],
              },
              {
                room: 'КУХНЯ', roomId: 'kitchen', dims: '3.0 x 2.5м', tierTotal: 4497, price: '99', color: '#8B5CF6',
                before: '/showcase/before_kitchen.jpg', after: '/showcase/after_kitchen.jpg',
                products: [
                  { name: 'Кухненски шкафове MDF', price: '2,000', store: 'Jysk', url: 'https://jysk.bg/search?q=%D0%BA%D1%83%D1%85%D0%BD%D0%B5%D0%BD%D1%81%D0%BA%D0%B8+%D1%88%D0%BA%D0%B0%D1%84%D0%BE%D0%B2%D0%B5&utm_source=temadom&utm_medium=affiliate' },
                  { name: 'Керамични плочки 60x60', price: '300', store: 'Praktiker', url: 'https://praktiker.bg/search?q=%D0%BA%D0%B5%D1%80%D0%B0%D0%BC%D0%B8%D1%87%D0%BD%D0%B8+%D0%BF%D0%BB%D0%BE%D1%87%D0%BA%D0%B8+60x60&utm_source=temadom&utm_medium=affiliate' },
                  { name: 'Мивка Franke полирана', price: '300', store: 'eMAG', url: 'https://www.emag.bg/search/%D0%BC%D0%B8%D0%B2%D0%BA%D0%B0+Franke?ref=temadom' },
                ],
              },
              {
                room: 'ДЕТСКА', roomId: 'kids_room', dims: '3.8 x 3.2м', tierTotal: 2295, price: '69', color: '#EC4899',
                before: '/showcase/before_kids.jpg', after: '/showcase/after_kids_room.jpg',
                products: [
                  { name: 'Ламинат 10мм Дъб Каиро', price: '150', store: 'HomeMax', url: 'https://www.home-max.bg/search/?q=%D0%BB%D0%B0%D0%BC%D0%B8%D0%BD%D0%B0%D1%82+10%D0%BC%D0%BC+%D0%B4%D1%8A%D0%B1&ref=temadom' },
                  { name: 'Боя неутрално сива', price: '70', store: 'Bauhaus', url: 'https://bauhaus.bg/search/%D0%B1%D0%BE%D1%8F+%D1%81%D0%B8%D0%B2%D0%B0&utm_source=temadom&utm_medium=affiliate' },
                  { name: 'Полилей със стъкло', price: '80', store: 'Jysk', url: 'https://jysk.bg/search?q=%D0%BF%D0%BE%D0%BB%D0%B8%D0%BB%D0%B5%D0%B9&utm_source=temadom&utm_medium=affiliate' },
                ],
              },
            ].map((proj, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border transition-all hover:shadow-xl group"
                style={{ background: bgCard, borderColor: border }}
                data-testid={`showcase-card-${i}`}>
                {/* Before / After images */}
                <div className="relative">
                  <div className="grid grid-cols-2 h-48">
                    <div className="relative overflow-hidden">
                      <img src={proj.before} alt={`${proj.room} преди`} className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">ПРЕДИ</span>
                    </div>
                    <div className="relative overflow-hidden">
                      <img src={proj.after} alt={`${proj.room} след`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: proj.color }}>СЛЕД AI</span>
                    </div>
                  </div>
                  {/* Room label overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-xs font-black px-2 py-1 rounded-full bg-black/60 text-white">{proj.room} {proj.dims}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: proj.color }}>
                      {proj.tierTotal.toLocaleString()} EUR
                    </span>
                  </div>
                </div>

                {/* Real products with affiliate links */}
                <div className="p-4 space-y-1.5">
                  <p className="text-[10px] font-bold mb-2" style={{ color: muted }}>Топ материали (среден вариант):</p>
                  {proj.products.map((p, pi) => (
                    <a key={pi} href={p.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors hover:bg-[#F97316]/5 group/link"
                      data-testid={`showcase-product-${i}-${pi}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate group-hover/link:text-[#F97316] transition-colors" style={{ color: text }}>{p.name}</p>
                        <p className="text-[10px]" style={{ color: muted }}>{p.store}</p>
                      </div>
                      <span className="text-xs font-black flex-shrink-0 ml-2" style={{ color: proj.color }}>{p.price} EUR</span>
                    </a>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-4 pb-4">
                  <button onClick={() => navigate(`/room-scan?room=${proj.roomId}`)}
                    className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
                    style={{ background: proj.color }}
                    data-testid={`showcase-cta-${i}`}>
                    СНИМАЙ {proj.room} — {proj.price} EUR
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-10">
            <p className="text-sm mb-4" style={{ color: muted }}>3D рендер + бюджет с цени + линкове към 9 магазина</p>
            <button onClick={() => navigate('/room-scan')}
              className="px-8 py-4 rounded-xl text-white text-lg font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: accent, boxShadow: `0 0 30px ${accent}40` }}
              data-testid="showcase-main-cta">
              ИЗБЕРИ ПОМЕЩЕНИЕ
            </button>
          </div>
        </div>
      </section>

      {/* ===== PRICING: 3 glassmorphism cards ===== */}
      <section className="py-16 border-t" style={{ borderColor: border }} data-testid="pricing-section">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">IA Дизайн — Цени</h2>
          <p className="text-center mb-10 text-sm" style={{ color: muted }}>Реалистичен 1:1 проект на вашето помещение</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: '1 ПОМЕЩЕНИЕ', price: '69', rooms: '1', features: ['3 снимки → 3D рендери', '3 ъгъла рендер', '10 стила', 'Пред/След сравнение', 'Бюджет + линкове'], color: accent, popular: false },
              { name: '2 ПОМЕЩЕНИЯ', price: '129', rooms: '2', features: ['2 помещения', '3 снимки на помещение', '10 стила за всяко', 'Пред/След рендер', 'Бюджет + директни линкове'], color: '#10B981', popular: true },
              { name: 'АПАРТАМЕНТ', price: '199', rooms: '3-5', features: ['До 5 помещения', '3 снимки на помещение', 'Пълен бюджет', 'Всички стилове', 'Приоритетна обработка'], color: '#8B5CF6', popular: false },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 text-center border backdrop-blur-lg relative transition-transform hover:scale-105 ${plan.popular ? 'ring-2' : ''}`}
                style={{ background: dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)', borderColor: plan.popular ? plan.color : border, ...(plan.popular ? { boxShadow: `0 0 40px ${plan.color}20` } : {}) }}
                data-testid={`pricing-card-${i}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold rounded-full px-4 py-1" style={{ background: plan.color }}>ПОПУЛЯРЕН</div>
                )}
                <h3 className="text-lg font-bold mt-2">{plan.name}</h3>
                <p className="text-sm mt-1" style={{ color: muted }}>{plan.rooms} помещения</p>
                <p className="text-4xl font-black my-4" style={{ color: plan.color }}>{plan.price}<span className="text-base font-normal" style={{ color: muted }}> EUR</span></p>
                <div className="space-y-2.5 text-left mb-6">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-sm" style={{ color: muted }}>
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.color }} /> {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/room-scan')} className="w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
                  style={{ background: plan.color }}>
                  Избери {plan.price} EUR
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== IA DESIGN: 10 style tiles ===== */}
      <section className="py-16 border-t" style={{ borderColor: border }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">10 Стила за всяко помещение</h2>
          <p className="text-center mb-8 text-sm" style={{ color: muted }}>Избери стил — AI генерира реалистичен рендер</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="style-tiles">
            {[
              { name: 'Модерен', c: '#F97316' }, { name: 'Скандинавски', c: '#3B82F6' },
              { name: 'Лофт', c: '#78716C' }, { name: 'Класически', c: '#D97706' },
              { name: 'Минималистичен', c: '#6B7280' }, { name: 'Бохо', c: '#EC4899' },
              { name: 'Индустриален', c: '#374151' }, { name: 'Арт Деко', c: '#A855F7' },
              { name: 'Рустик', c: '#92400E' }, { name: 'Хай-тек', c: '#06B6D4' },
            ].map((s, i) => (
              <button key={i} onClick={() => navigate('/room-scan')}
                className="rounded-xl p-4 border text-center transition-all hover:scale-105 group"
                style={{ borderColor: `${s.c}30`, background: dark ? `${s.c}10` : `${s.c}08` }} data-testid={`style-tile-${i}`}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ background: `${s.c}25` }} />
                <p className="text-sm font-medium" style={{ color: s.c }}>{s.name}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS: Какво казват клиентите ===== */}
      <section className="py-16" style={{ background: dark ? '#0F172A' : '#F1F5F9' }} data-testid="testimonials-section">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header with stats */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-5 w-5" style={{ color: '#FBBF24', fill: i <= Math.round(reviews.stats?.avg_rating || 4.9) ? '#FBBF24' : 'transparent' }} />
              ))}
              <span className="ml-2 text-lg font-black" style={{ color: accent }}>{reviews.stats?.avg_rating || 4.9}/5</span>
              <span className="text-sm ml-1" style={{ color: muted }}>({reviews.stats?.total || 127} отзива)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ color: text }}>
              Какво казват <span style={{ color: accent }}>нашите клиенти</span>
            </h2>
            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              {[
                { icon: '🔥', value: reviews.stats?.total || 127, label: 'доволни клиента' },
                { icon: '✅', value: `${reviews.stats?.recommend_pct || 95}%`, label: 'препоръчват' },
                { icon: '⏱️', value: `${reviews.stats?.avg_project_min || 14} мин`, label: 'среден проект' },
                { icon: '💰', value: `€${(reviews.stats?.total_saved_eur || 24500).toLocaleString()}`, label: 'спестени общо' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <span className="text-lg">{s.icon}</span>
                  <p className="font-black text-lg" style={{ color: accent }}>{s.value}</p>
                  <p className="text-[10px]" style={{ color: muted }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel - Desktop: 3 cards, Mobile: 1 card */}
          {reviews.reviews?.length > 0 && (
            <div>
              {/* Desktop: Show 3 at a time */}
              <div className="hidden md:grid grid-cols-3 gap-4" data-testid="reviews-desktop">
                {[0, 1, 2].map(offset => {
                  const idx = (reviewIdx + offset) % reviews.reviews.length;
                  const r = reviews.reviews[idx];
                  if (!r) return null;
                  const colors = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];
                  const avatarColor = colors[idx % colors.length];
                  return (
                    <div key={`${idx}-${offset}`}
                      className="rounded-xl p-5 transition-all duration-500"
                      style={{ background: bgCard, border: `1px solid ${border}`, boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}
                      data-testid={`review-card-${offset}`}>
                      <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="h-3.5 w-3.5" style={{ color: '#FBBF24', fill: s <= (r.rating || 5) ? '#FBBF24' : 'transparent' }} />
                        ))}
                      </div>
                      <p className="text-sm mb-4 leading-relaxed italic" style={{ color: text, fontFamily: 'Georgia, serif' }}>
                        "{r.text}"
                      </p>
                      <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ background: avatarColor }}>
                          {(r.name || 'A').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: text }}>{r.name}</p>
                          <p className="text-[10px]" style={{ color: muted }}>{r.city}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile: Single card with swipe */}
              <div className="md:hidden" data-testid="reviews-mobile">
                {(() => {
                  const r = reviews.reviews[reviewIdx % reviews.reviews.length];
                  if (!r) return null;
                  const colors = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6'];
                  const avatarColor = colors[reviewIdx % colors.length];
                  return (
                    <div className="rounded-xl p-5" style={{ background: bgCard, border: `1px solid ${border}` }}>
                      <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="h-4 w-4" style={{ color: '#FBBF24', fill: s <= (r.rating || 5) ? '#FBBF24' : 'transparent' }} />
                        ))}
                      </div>
                      <p className="text-base mb-4 leading-relaxed italic" style={{ color: text, fontFamily: 'Georgia, serif' }}>
                        "{r.text}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: avatarColor }}>
                          {(r.name || 'A').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: text }}>{r.name}</p>
                          <p className="text-[10px]" style={{ color: muted }}>{r.city}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Navigation dots */}
              <div className="flex items-center justify-center gap-2 mt-6" data-testid="review-nav">
                <button onClick={() => setReviewIdx(p => (p - 1 + reviews.reviews.length) % reviews.reviews.length)}
                  className="p-2 rounded-full transition-colors" style={{ color: muted, background: `${border}50` }} data-testid="review-prev">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1.5">
                  {reviews.reviews.map((_, i) => (
                    <button key={i} onClick={() => setReviewIdx(i)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{ background: i === reviewIdx % reviews.reviews.length ? accent : `${border}` }} />
                  ))}
                </div>
                <button onClick={() => setReviewIdx(p => (p + 1) % reviews.reviews.length)}
                  className="p-2 rounded-full transition-colors" style={{ color: muted, background: `${border}50` }} data-testid="review-next">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA: РЕГИСТРИРАЙ ФИРМАТА ===== */}
      {/* ===== АБОНАМЕНТИ ЗА ФИРМИ ===== */}
      <FirmSubscriptionsSection dark={dark} text={text} muted={muted} accent={accent} border={border} navigate={navigate} />

      {/* ===== CTA: РЕГИСТРИРАЙ ФИРМАТА (original) ===== */}
      <section className="py-16 relative overflow-hidden" style={{ background: dark ? '#1E293B' : '#FFF7ED' }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)` }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-6 border" style={{ borderColor: `${accent}40`, background: `${accent}10` }}>
            <Zap className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-bold" style={{ color: accent }}>ОСТАВАТ {slotsLeft} МЕСТА</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Първи <span style={{ color: accent }}>56 фирми</span> = 1 година ПРЕМИУМ
          </h2>
          <p className="text-lg mb-8" style={{ color: muted }}>Регистрирай фирмата си и получи достъп до всички AI функции безплатно за 12 месеца.</p>
          <button onClick={() => navigate('/register')} data-testid="cta-register"
            className="px-10 py-5 rounded-xl text-white text-xl font-black transition-all hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent}, #EA580C)`, boxShadow: `0 0 40px ${accent}40` }}>
            РЕГИСТРИРАЙ ФИРМАТА
          </button>
        </div>
      </section>

      {/* Sticky bottom CTA (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3" style={{ background: dark ? '#0F172AEE' : '#F8FAFCEE', backdropFilter: 'blur(12px)', borderTop: `1px solid ${border}` }} data-testid="sticky-cta">
        <button onClick={() => navigate('/register')} className="w-full py-3.5 rounded-xl text-white font-bold text-base"
          style={{ background: `linear-gradient(135deg, ${accent}, #EA580C)` }}>
          РЕГИСТРИРАЙ ФИРМАТА ({slotsLeft} места)
        </button>
      </div>
    </div>
  );
};

// ============== PROJECT CARD ==============
const ProjectCard = ({ project }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}`)}
      data-testid={`project-card-${project.id}`}
    >
      {/* Show first image if available */}
      {project.images && project.images.length > 0 && (
        <div className="aspect-video bg-[#253545] overflow-hidden">
          <img 
            src={project.images[0]} 
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#FF8C42]/10 text-[#FF8C42]">{project.category_name}</Badge>
            {project.images && project.images.length > 0 && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Image className="h-3 w-3" /> {project.images.length}
              </span>
            )}
          </div>
          {project.contact_locked && (
            <Lock className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <CardTitle className="text-lg group-hover:text-[#FF8C42] transition-colors line-clamp-2">
          {project.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-slate-400 text-sm line-clamp-2 mb-4">{project.description}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-4 w-4" />
            <span>{project.city}</span>
          </div>
          
          {/* Show estimated budget if available */}
          {project.estimated_budget && (
            <div className="flex items-center gap-2 text-[#FF8C42] font-medium">
              <Calculator className="h-4 w-4" />
              <span>~{project.estimated_budget} € {t('projects_estimate')}</span>
            </div>
          )}
          
          {(project.budget_min || project.budget_max) && (
            <div className="flex items-center gap-2 text-slate-500">
              <Euro className="h-4 w-4" />
              <span>
                {project.budget_min && `${project.budget_min}€`}
                {project.budget_min && project.budget_max && ' - '}
                {project.budget_max && `${project.budget_max}€`}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.created_at).toLocaleDateString('bg-BG')}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3A4A5C]">
          <span className="text-xs text-slate-400">{project.views} {t('projects_views')}</span>
          <span className="text-[#FF8C42] text-sm font-medium group-hover:underline">
            {t('projects_details')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// ============== PROJECTS LIST PAGE ==============
const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAuth();
  const { t } = useLanguage();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      params.set('page', page);
      
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API}/projects?${params}`, config);
      setProjects(res.data.projects);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Грешка при зареждане на проектите');
    }
    setLoading(false);
  }, [search, category, city, page, token]);

  useEffect(() => {
    axios.get(`${API}/categories`).then(res => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--theme-bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>{t('projects_title')}</h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>{t('projects_subtitle')}</p>
        </div>

        <PageInstructions
          title="Проекти за ремонт и строителство"
          description="Тук намирате реални проекти от клиенти"
          steps={['Разгледайте списъка с проекти', 'Използвайте филтри за категория и град', 'Кликнете върху проект за пълни детайли', 'Свържете се с клиента безплатно']}
          benefits={['Безплатен достъп до всички проекти', 'Директен контакт с клиенти', 'Филтриране по категория и локация']}
          tips={['Проверявайте редовно за нови проекти', 'Настройте Telegram нотификации за нови проекти']}
          videoUrl="https://temadom.com/videos/projects"
        />
        <Card className="p-4 mb-8">
          <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={t('projects_search')} 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="search-input"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="category-filter">
                <SelectValue placeholder={t('projects_all_cat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('projects_all_cat')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input 
              placeholder={t('projects_city')} 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              data-testid="city-filter"
            />
            
            <Button type="submit" className="bg-[#FF8C42] hover:bg-[#e67a30]" data-testid="search-btn">
              <Filter className="mr-2 h-4 w-4" /> {t('projects_filter')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-64 animate-pulse bg-[#253545]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <Boxes className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">{t('projects_empty')}</h3>
            <p className="text-slate-500">{t('projects_empty_sub')}</p>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  {t('projects_prev')}
                </Button>
                <span className="flex items-center px-4 text-slate-400">
                  {t('projects_page')} {page} {t('projects_of')} {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  {t('projects_next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============== PROJECT DETAIL PAGE ==============
const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [freeLeadsRemaining, setFreeLeadsRemaining] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(`${API}/projects/${id}`, config);
        setProject(res.data);
      } catch (err) {
        toast.error('Проектът не е намерен');
        navigate('/projects');
      }
      setLoading(false);
    };
    fetchProject();
    // Fetch free leads status for companies
    if (token && (user?.user_type === 'company' || user?.user_type === 'master')) {
      axios.get(`${API}/leads/free-status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setFreeLeadsRemaining(res.data.free_leads_remaining))
        .catch(() => {});
    }
  }, [id, token, navigate, user]);

  const handleClaimFreeLead = async () => {
    setPaymentLoading(true);
    try {
      const res = await axios.post(`${API}/leads/claim-free/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      setFreeLeadsRemaining(res.data.free_leads_remaining);
      // Refresh project to show contact info
      const projRes = await axios.get(`${API}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProject(projRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
    setPaymentLoading(false);
  };

  const handlePurchase = async (type) => {
    if (!user) {
      toast.error('Моля, влезте в профила си');
      navigate('/login');
      return;
    }
    
    if (user.user_type !== 'company' && user.user_type !== 'master') {
      toast.error('Само фирми и майстори могат да закупуват контакти');
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await axios.post(
        `${API}/payments/checkout?package_type=${type}${type === 'single_lead' ? `&project_id=${id}` : ''}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.checkout_url;
      // GA4: Track purchase initiation
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'purchase', {
          event_category: 'revenue',
          event_label: type === 'subscription' ? 'subscription' : 'paid_offer',
          value: type === 'subscription' ? 195.58 : 48.90,
          currency: 'BGN'
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при плащане');
      setPaymentLoading(false);
    }
  };

  const navigateImage = (direction) => {
    if (!project?.images?.length) return;
    if (direction === 'next') {
      setSelectedImageIndex((prev) => (prev + 1) % project.images.length);
    } else {
      setSelectedImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
        <div className="max-w-4xl mx-auto px-4">
          <Card className="h-96 animate-pulse bg-[#253545]" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/projects')}
        >
          {t('pd_back')}
        </Button>

        <Card className="overflow-hidden" data-testid="project-detail">
          {/* Project Images Gallery */}
          {project.images && project.images.length > 0 && (
            <div className="relative bg-slate-900">
              <div 
                className="aspect-[16/9] cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              >
                <img 
                  src={project.images[selectedImageIndex]} 
                  alt={`Снимка ${selectedImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Navigation arrows */}
              {project.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm">
                {selectedImageIndex + 1} / {project.images.length}
              </div>
              
              {/* Thumbnails */}
              {project.images.length > 1 && (
                <div className="flex gap-2 p-3 bg-slate-800 overflow-x-auto">
                  {project.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                        idx === selectedImageIndex ? 'border-orange-500' : 'border-transparent hover:border-slate-500'
                      }`}
                    >
                      <img src={img} alt={`Миниатюра ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <Badge className="bg-[#FF8C42]/10 text-[#FF8C42] text-sm">{project.category_name}</Badge>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                {project.images?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    {project.images.length} {t('pd_photos')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {project.views} {t('pd_views')}
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl">{project.title}</CardTitle>
            <div className="flex items-center gap-4 mt-4 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {project.city}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(project.created_at).toLocaleDateString('bg-BG')}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold mb-3">{t('pd_description')}</h3>
              <p className="text-slate-400 whitespace-pre-wrap">{project.description}</p>
            </div>

            {(project.budget_min || project.budget_max) && (
              <div className="bg-[#1E2A38] rounded-lg p-4 mb-8">
                <h4 className="font-semibold text-slate-300 mb-2">{t('pd_budget')}</h4>
                <p className="text-2xl font-bold text-white">
                  {project.budget_min && `${project.budget_min}€`}
                  {project.budget_min && project.budget_max && ' - '}
                  {project.budget_max && `${project.budget_max}€`}
                </p>
              </div>
            )}

            {/* Estimated Budget from Calculator */}
            {project.estimated_budget && (
              <div className="bg-[#FF8C42]/5 border border-[#FF8C42]/20 rounded-lg p-4 mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Calculator className="h-5 w-5 text-[#FF8C42]" />
                  <h4 className="font-semibold text-[#FF8C42]">{t('pd_calc_estimate')}</h4>
                </div>
                <p className="text-3xl font-bold text-[#FF8C42]">
                  ~{project.estimated_budget} €
                </p>
                <p className="text-sm text-[#FF8C42] mt-1">
                  ≈ {Math.round(project.estimated_budget * 1.95)} лв. ({t('pd_approx_bgn')})
                </p>
              </div>
            )}

            {/* Contact Info Section */}
            <div className="border-t border-[#3A4A5C] pt-8">
              <h3 className="text-lg font-semibold mb-4">{t('pd_contact')}</h3>
              
              {/* Free platform notice */}
              <div className="bg-[#28A745]/10 border border-[#28A745]/20 rounded-lg p-4 mb-6" data-testid="free-platform-notice">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-[#28A745]" />
                  <span className="font-semibold text-[#28A745]">{t('pd_free_access')}</span>
                </div>
                <p className="text-sm text-[#28A745]">
                  {t('pd_free_desc')}
                </p>
              </div>

              <div className="bg-[#28A745]/10 border border-[#28A745]/20 rounded-lg p-6" data-testid="contact-unlocked">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-[#28A745]" />
                  <span className="font-semibold text-[#28A745]">{t('pd_contacts_unlocked')}</span>
                </div>
                <div className="space-y-4">
                  {project.client_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-slate-400" />
                      <span className="font-medium">{project.client_name}</span>
                    </div>
                  )}
                  {project.client_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <a href={`mailto:${project.client_email}`} className="text-[#FF8C42] hover:underline">
                        {project.client_email}
                      </a>
                    </div>
                  )}
                </div>
                {user && user.id !== project.client_id && (
                  <div className="mt-4 pt-4 border-t border-[#28A745]/20">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/messages?to=${project.client_id}&project=${id}`)}
                      data-testid="send-message-unlocked"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t('pd_send_message')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Lightbox */}
        {project.images && project.images.length > 0 && (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-5xl p-0 bg-black/95">
              <div className="relative">
                <div className="aspect-[16/10]">
                  <img 
                    src={project.images[selectedImageIndex]} 
                    alt={`Снимка ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {project.images.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </button>
                  </>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm">
                  {selectedImageIndex + 1} / {project.images.length}
                </div>
                
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

// ============== COMPANIES PAGE ==============
const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    axios.get(`${API}/categories`).then(res => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (city) params.set('city', city);
      
      const res = await axios.get(`${API}/companies?${params}`);
      setCompanies(res.data.companies);
      setLoading(false);
    };
    fetchCompanies();
  }, [category, city]);

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('comp_title')}</h1>
          <p className="text-slate-400">{t('comp_subtitle')}</p>
        </div>

        <PageInstructions
          title="Намерете строителна фирма"
          description="Преглед и сравнение на фирми по категория и град"
          steps={['Филтрирайте по категория или град', 'Разгледайте профилите на фирмите', 'Вижте оценки и отзиви от клиенти', 'Изпратете запитване директно']}
          benefits={['Проверени фирми с реални отзиви', 'Директен контакт без посредници', 'Безплатно търсене и сравнение']}
          videoUrl="https://temadom.com/videos/companies"
        />

        <Card className="p-4 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('projects_all_cat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('projects_all_cat')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input 
              placeholder={t('projects_city')} 
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            
            <Button className="bg-[#FF8C42] hover:bg-[#e67a30]">
              <Search className="mr-2 h-4 w-4" /> {t('comp_search')}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Card key={i} className="h-48 animate-pulse bg-[#253545]" />)}
          </div>
        ) : companies.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">{t('comp_empty')}</h3>
            <p className="text-slate-500">{t('comp_empty_sub')}</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <Link key={company.id} to={`/companies/${company.id}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42] text-lg">
                        {company.company_name?.charAt(0) || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{company.company_name}</h3>
                      {company.city && (
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {company.city}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={company.rating} />
                    <span className="text-sm text-slate-400">
                      ({company.review_count} отзива)
                    </span>
                  </div>
                  
                  {company.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">{company.description}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============== FIND MASTER PAGE ==============
const FindMasterPage = () => {
  const [professionals, setProfessionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [proType, setProType] = useState('all'); // all, company, master
  const { t } = useLanguage();

  useEffect(() => {
    axios.get(`${API}/categories`).then(res => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    const fetchPros = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (city) params.set('city', city);
      if (proType && proType !== 'all') params.set('user_type', proType);
      
      const res = await axios.get(`${API}/companies?${params}`);
      setProfessionals(res.data.companies);
      setLoading(false);
    };
    fetchPros();
  }, [category, city, proType]);

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}} data-testid="find-master-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('fm_title')}</h1>
          <p className="text-slate-400">{t('fm_subtitle')}</p>
        </div>

        {/* Free platform notice */}
        <div className="bg-[#28A745]/10 border border-[#28A745]/20 rounded-lg p-4 mb-6" data-testid="find-master-free-notice">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#28A745] flex-shrink-0" />
            <p className="text-sm text-[#28A745]">
              <strong>{t('fm_free')}</strong> {t('fm_free_desc')}
            </p>
          </div>
        </div>

        <Card className="p-4 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <Select value={proType} onValueChange={setProType}>
              <SelectTrigger data-testid="filter-pro-type">
                <SelectValue placeholder={t('fm_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('fm_all')}</SelectItem>
                <SelectItem value="company">{t('fm_companies')}</SelectItem>
                <SelectItem value="master">{t('fm_masters')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="filter-category">
                <SelectValue placeholder={t('fm_all_prof')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('fm_all_prof')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input 
              placeholder={t('fm_city')} 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              data-testid="filter-city"
            />
            
            <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" data-testid="filter-search-btn">
              <Search className="mr-2 h-4 w-4" /> {t('fm_search')}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Card key={i} className="h-48 animate-pulse bg-[#253545]" />)}
          </div>
        ) : professionals.length === 0 ? (
          <Card className="p-12 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">{t('fm_empty')}</h3>
            <p className="text-slate-500">{t('fm_empty_sub')}</p>
          </Card>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">{t('fm_found')} {professionals.length} {t('fm_specialists')}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map(pro => (
                <Link key={pro.id} to={`/companies/${pro.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 h-full border-l-4 border-l-orange-400" data-testid={`pro-card-${pro.id}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className={`text-lg ${pro.user_type === 'master' ? 'bg-[#4DA6FF]/10 text-[#4DA6FF]' : 'bg-[#FF8C42]/10 text-[#FF8C42]'}`}>
                          {pro.company_name?.charAt(0) || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{pro.company_name}</h3>
                        <div className="flex items-center gap-2">
                          {pro.city && (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {pro.city}
                            </span>
                          )}
                          <Badge variant="outline" className={`text-[10px] ${pro.user_type === 'master' ? 'border-[#4DA6FF]/30 text-[#4DA6FF]' : 'border-[#FF8C42]/30 text-[#FF8C42]'}`}>
                            {pro.user_type === 'master' ? t('fm_master_badge') : t('fm_company_badge')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={pro.rating} />
                      <span className="text-sm text-slate-400">
                        ({pro.review_count} {t('comp_reviews')})
                      </span>
                    </div>
                    
                    {pro.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{pro.description}</p>
                    )}

                    {pro.categories && pro.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pro.categories.slice(0, 3).map((catId, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{catId}</Badge>
                        ))}
                        {pro.categories.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">+{pro.categories.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============== COMPANY DETAIL PAGE ==============
const CompanyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [company, setCompany] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, portfolioRes] = await Promise.all([
          axios.get(`${API}/companies/${id}`),
          axios.get(`${API}/portfolio/${id}`)
        ]);
        setCompany(companyRes.data);
        setPortfolio(portfolioRes.data.projects || []);
      } catch {
        toast.error('Фирмата не е намерена');
        navigate('/companies');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Моля, влезте в профила си');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/reviews`,
        { company_id: id, ...reviewData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Отзивът е добавен успешно');
      setReviewDialogOpen(false);
      // Refresh company data
      const res = await axios.get(`${API}/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при добавяне на отзив');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
        <div className="max-w-4xl mx-auto px-4">
          <Card className="h-96 animate-pulse bg-[#253545]" />
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/companies')}>
          {t('cd_back')}
        </Button>

        <Card className="overflow-hidden mb-8" data-testid="company-detail">
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42] text-2xl">
                  {company.company_name?.charAt(0) || 'F'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{company.company_name}</CardTitle>
                {company.city && (
                  <p className="text-slate-500 flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4" /> {company.city}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={company.rating} size="md" />
                  <span className="text-slate-400">
                    {company.rating.toFixed(1)} ({company.review_count} {t('comp_reviews')})
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {company.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">{t('cd_about')}</h3>
                <p className="text-slate-400">{company.description}</p>
              </div>
            )}

            {company.categories?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">{t('cd_services')}</h3>
                <div className="flex flex-wrap gap-2">
                  {company.categories.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    return (
                      <Badge key={catId} variant="secondary">{cat?.name || catId}</Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Section */}
        {portfolio.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('cd_portfolio')}</CardTitle>
              <CardDescription>{t('cd_portfolio_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioGallery 
                projects={portfolio} 
                isOwner={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('cd_reviews')}</CardTitle>
              <CardDescription>{company.reviews?.length || 0} {t('comp_reviews')}</CardDescription>
            </div>
            {user?.user_type === 'client' && (
              <Button 
                className="bg-[#FF8C42] hover:bg-[#e67a30]"
                onClick={() => setReviewDialogOpen(true)}
                data-testid="add-review-btn"
              >
                {t('cd_add_review')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {company.reviews?.length === 0 ? (
              <p className="text-slate-500 text-center py-8">{t('cd_no_reviews')}</p>
            ) : (
              <div className="space-y-6">
                {company.reviews?.map(review => (
                  <div key={review.id} className="border-b border-[#3A4A5C] pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{review.client_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.client_name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(review.created_at).toLocaleDateString('bg-BG')}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-slate-400 mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('cd_add_review')}</DialogTitle>
              <DialogDescription>{t('cd_share_opinion')} {company.company_name}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>{t('cd_rating')}</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      onClick={() => setReviewData(d => ({ ...d, rating: i }))}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`h-8 w-8 ${i <= reviewData.rating ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>{t('cd_comment')}</Label>
                <Textarea 
                  placeholder={t('cd_comment_placeholder')}
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(d => ({ ...d, comment: e.target.value }))}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>{t('cd_cancel')}</Button>
              <Button 
                className="bg-[#FF8C42] hover:bg-[#e67a30]"
                onClick={handleSubmitReview}
                disabled={!reviewData.comment || submitting}
              >
                {submitting ? t('cd_submitting') : t('cd_submit_review')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Categories for company detail (needs to be loaded)
const categories = [];

// ============== AUTH PAGES ==============
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(formData.email, formData.password);
      toast.success(t('login_success'));
      navigate(data.user.user_type === 'client' ? '/dashboard/client' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || t('common_error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: 'var(--theme-bg-secondary)' }}>
      <Card className="w-full max-w-md" data-testid="login-form">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <TemaDomLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">{t('login_title')}</CardTitle>
          <CardDescription>{t('login_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('login_email')}</Label>
              <Input 
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                required
                data-testid="login-email"
              />
            </div>
            <div>
              <Label>{t('login_password')}</Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(d => ({ ...d, password: e.target.value }))}
                required
                data-testid="login-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#FF8C42] hover:bg-[#e67a30]"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? t('login_loading') : t('login_submit')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {t('login_no_account')}{' '}
            <Link to="/register" className="text-[#FF8C42] hover:underline">
              {t('login_register')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

const BULGARIA_REGIONS_LIST = [
  "Благоевград", "Бургас", "Варна", "Велико Търново", "Видин",
  "Враца", "Габрово", "Добрич", "Кърджали", "Кюстендил",
  "Ловеч", "Монтана", "Пазарджик", "Перник", "Плевен",
  "Пловдив", "Разград", "Русе", "Силистра", "Сливен",
  "Смолян", "София", "София-град", "Стара Загора",
  "Търговище", "Хасково", "Шумен", "Ямбол"
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userType, setUserType] = useState('client');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    telegram_username: '',
    bulstat: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [regionStats, setRegionStats] = useState({});

  // Fetch region stats for company registration
  useEffect(() => {
    if (userType === 'company') {
      axios.get(`${API}/stats/live`).then(res => {
        setRegionStats(res.data.regions || {});
      }).catch(() => {});
    }
  }, [userType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('reg_pass_mismatch'));
      return;
    }

    if (userType === 'company') {
      const bulstat = formData.bulstat.trim();
      if (!bulstat) {
        toast.error(t('reg_bulstat_required_err'));
        return;
      }
      if (!/^\d{9}$/.test(bulstat)) {
        toast.error(t('reg_bulstat_format'));
        return;
      }
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      if (userType !== 'company') delete data.bulstat;
      await register({ ...data, user_type: userType });
      toast.success(t('reg_success'));
      navigate(userType === 'client' ? '/dashboard/client' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при регистрация');
    }
    setLoading(false);
  };

  const isProUser = userType === 'company' || userType === 'master';

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: 'var(--theme-bg-secondary)' }}>
      <Card className="w-full max-w-md" data-testid="register-form">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <TemaDomLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">{t('reg_title')}</CardTitle>
          <CardDescription>{t('reg_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Free platform banner */}
          <div className="bg-[#28A745]/10 border border-[#28A745]/20 rounded-lg p-4 mb-4" data-testid="register-free-banner">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-[#28A745] flex-shrink-0" />
              <span className="text-sm font-bold text-[#28A745]">{t('reg_free_banner')}</span>
            </div>
            <p className="text-xs text-[#28A745]">
              {t('reg_free_desc')}
            </p>
          </div>

          {(userType === 'company' || userType === 'master') && (
            <div className="bg-[#FF8C42]/10 border border-[#FF8C42]/20 rounded-lg p-4 mb-4" data-testid="register-promo-banner">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">&#9889;</span>
                <div>
                  <p className="text-sm font-bold text-[#FF8C42] mb-1">
                    {t('reg_promo_title')}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('reg_promo_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User type selection - 3 tabs */}
          <Tabs value={userType === 'master' ? 'professional' : userType === 'company' ? 'professional' : userType} onValueChange={(v) => {
            if (v === 'professional') setUserType('master');
            else setUserType(v);
          }} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client" data-testid="register-client-tab">{t('reg_tab_client')}</TabsTrigger>
              <TabsTrigger value="professional" data-testid="register-pro-tab">Фирма / Майстор</TabsTrigger>
              <TabsTrigger value="designer" data-testid="register-designer-tab">Дизайнер</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Professional sub-type dropdown */}
          {(userType === 'master' || userType === 'company') && (
            <div className="mb-4">
              <Label className="text-slate-300">Тип професионалист</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="bg-[#1E2A38] border-[#3A4A5C] text-white" data-testid="register-pro-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Майстор (физическо лице)</SelectItem>
                  <SelectItem value="company">Фирма (юридическо лице)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{userType === 'company' ? t('reg_company_name') : userType === 'master' ? t('reg_master_name') : userType === 'designer' ? 'Име на дизайнер' : t('reg_name')}</Label>
              <Input 
                placeholder={userType === 'company' ? t('reg_company_placeholder') : userType === 'master' ? t('reg_master_placeholder') : userType === 'designer' ? 'Иван Иванов - Интериорен дизайнер' : t('reg_name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                required
                data-testid="register-name"
              />
            </div>

            {userType === 'company' && (
              <div>
                <Label>{t('reg_bulstat')} <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="123456789"
                  value={formData.bulstat}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setFormData(d => ({ ...d, bulstat: val }));
                  }}
                  maxLength={9}
                  required
                  data-testid="register-bulstat"
                />
                <p className="text-xs text-slate-500 mt-1">{t('reg_bulstat_required')}</p>
              </div>
            )}

            <div>
              <Label>{t('reg_email')}</Label>
              <Input 
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                required
                data-testid="register-email"
              />
            </div>
            <div>
              <Label>{t('reg_city')}</Label>
              {userType === 'company' ? (
                <div>
                  <Select value={formData.city} onValueChange={(val) => setFormData(d => ({ ...d, city: val }))}>
                    <SelectTrigger data-testid="register-region">
                      <SelectValue placeholder="Изберете област..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BULGARIA_REGIONS_LIST.map(region => {
                        const stats = regionStats[region] || { used: 0, total: 2 };
                        const full = stats.used >= stats.total;
                        return (
                          <SelectItem key={region} value={region} disabled={full}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${full ? 'bg-red-500' : stats.used > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                              {region} ({stats.used}/{stats.total})
                              {full && <span className="text-red-400 text-[10px] ml-1">ПЪЛНО</span>}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Свободна (0/2)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Частично (1/2)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Пълна (2/2)</span>
                  </div>
                </div>
              ) : (
                <Input 
                  placeholder={t('reg_city_placeholder')}
                  value={formData.city}
                  onChange={(e) => setFormData(d => ({ ...d, city: e.target.value }))}
                  data-testid="register-city"
                />
              )}
            </div>

            {isProUser && (
              <div className="bg-[#4DA6FF]/10 border border-[#4DA6FF]/20 rounded-lg p-3" data-testid="telegram-info-box">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-[#4DA6FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.13l-1.97 9.28c-.15.66-.54.82-1.09.51l-3.01-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.06 5.55-5.01c.24-.22-.05-.33-.37-.13l-6.86 4.32-2.95-.92c-.64-.2-.66-.64.14-.95l11.54-4.45c.53-.2 1-.05.86.93z"/></svg>
                  <span className="text-sm font-semibold text-[#4DA6FF]">{t('reg_telegram_title')}</span>
                </div>
                <p className="text-xs text-[#4DA6FF] mb-2">
                  {t('reg_telegram_desc')}
                </p>
                <Input 
                  placeholder={t('reg_telegram_placeholder')}
                  value={formData.telegram_username}
                  onChange={(e) => setFormData(d => ({ ...d, telegram_username: e.target.value }))}
                  data-testid="register-telegram"
                />
              </div>
            )}

            <div>
              <Label>{t('reg_password')}</Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(d => ({ ...d, password: e.target.value }))}
                required
                data-testid="register-password"
              />
            </div>
            <div>
              <Label>{t('reg_confirm_password')}</Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(d => ({ ...d, confirmPassword: e.target.value }))}
                required
                data-testid="register-confirm-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#FF8C42] hover:bg-[#e67a30]"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? t('reg_loading') : t('reg_submit')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-slate-400">
            Имате профил?{' '}
            <Link to="/login" className="text-[#FF8C42] hover:underline">
              {t('reg_login')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

// ============== DASHBOARD PAGES ==============
// ============== TELEGRAM CONNECT CARD ==============
const TelegramConnectCard = ({ user, token }) => {
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    axios.get(`${API}/telegram/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTelegramLinked(res.data.linked))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [token]);

  const plan = user?.subscription_plan || 'basic';
  const tierInfo = {
    premium: { label: 'PREMIUM', color: '#8C56FF', desc: 'Получавате известия ПЪРВИ — 10 мин. преди ПРО!', stars: 3 },
    pro: { label: 'ПРО', color: '#FF8C42', desc: 'Известия за нови проекти (10 мин. след PREMIUM)', stars: 2 },
    basic: { label: 'БАЗОВ', color: '#4DA6FF', desc: 'Надградете до ПРО или PREMIUM за Telegram известия', stars: 1 },
  };
  const tier = tierInfo[plan] || tierInfo.basic;

  return (
    <Card className="mb-8 overflow-hidden" data-testid="telegram-connect-card">
      <div className="p-5" style={{ backgroundColor: `${tier.color}10`, borderColor: `${tier.color}30`, borderWidth: 1, borderStyle: 'solid' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-6 w-6" style={{ color: tier.color }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.13l-1.97 9.28c-.15.66-.54.82-1.09.51l-3.01-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.06 5.55-5.01c.24-.22-.05-.33-.37-.13l-6.86 4.32-2.95-.92c-.64-.2-.66-.64.14-.95l11.54-4.45c.53-.2 1-.05.86.93z"/></svg>
              <h2 className="text-lg font-semibold text-white">Telegram известия</h2>
              {telegramLinked && (
                <Badge className="bg-[#28A745]/20 text-[#28A745] border-[#28A745]/30 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" /> Свързан
                </Badge>
              )}
            </div>
            <p className="text-sm" style={{ color: tier.color }}>{tier.desc}</p>
            {/* Timer visualization */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#8C56FF]" />
                <span className="text-slate-400">PREMIUM: 0 мин.</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FF8C42]" />
                <span className="text-slate-400">ПРО: +10 мин.</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#4DA6FF]" />
                <span className="text-slate-400">БАЗОВ: ръчно</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!telegramLinked ? (
              <a
                href={`https://t.me/TemaDomBot?start=${user?.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button style={{ backgroundColor: tier.color }} className="text-white w-full" data-testid="link-telegram-btn">
                  Свържи Telegram
                </Button>
              </a>
            ) : (
              <Button variant="outline" className="border-[#28A745]/30 text-[#28A745] cursor-default" disabled>
                <CheckCircle className="mr-1 h-4 w-4" /> Telegram свързан
              </Button>
            )}
            {plan === 'basic' && (
              <a href="/subscriptions" className="text-xs text-center" style={{ color: tier.color }}>
                Надградете за известия &rarr;
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============== COMPANY DASHBOARD ==============
const CompanyDashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('leads');

  useEffect(() => {
    if (!user || (user.user_type !== 'company' && user.user_type !== 'master')) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [leadsRes, profileRes, catsRes, portfolioRes] = await Promise.all([
          axios.get(`${API}/my-leads`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/my-company`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/categories`),
          axios.get(`${API}/my-portfolio`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setLeads(leadsRes.data.leads);
        setProfile(profileRes.data);
        setCategories(catsRes.data.categories);
        setPortfolio(portfolioRes.data.projects || []);
      } catch (err) {
        toast.error(t('common_error'));
      }
      setLoading(false);
    };
    fetchData();
  }, [user, token, navigate]);

  const handlePurchaseSubscription = async () => {
    try {
      const res = await axios.post(
        `${API}/payments/checkout?package_type=subscription`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || t('common_error'));
    }
  };

  const handleAddPortfolio = async (projectData) => {
    const res = await axios.post(
      `${API}/portfolio`,
      projectData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Refresh portfolio
    const portfolioRes = await axios.get(`${API}/my-portfolio`, { headers: { Authorization: `Bearer ${token}` } });
    setPortfolio(portfolioRes.data.projects || []);
    return res.data;
  };

  const handleDeletePortfolio = async (projectId) => {
    await axios.delete(`${API}/portfolio/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
    setPortfolio(prev => prev.filter(p => p.id !== projectId));
    toast.success(t('dash_portfolio_deleted'));
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <Card className="h-32 bg-[#253545]" />
            <Card className="h-64 bg-[#253545]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}} data-testid="company-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t('dash_title')}</h1>
          <p className="text-slate-400">{t('dash_subtitle')}</p>
        </div>

        {/* Free Platform Banner */}
        <Card className="mb-8 overflow-hidden" data-testid="free-platform-dashboard-banner">
          <div className="p-6 bg-[#28A745]/10 border border-[#28A745]/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6 text-[#28A745]" />
                  <h2 className="text-xl font-semibold text-[#28A745]">
                    {t('dash_welcome')}
                  </h2>
                </div>
                <p className="text-[#28A745]">
                  {t('dash_welcome_desc')}
                </p>
              </div>
              <Button 
                className="bg-[#28A745] hover:bg-[#218c3a] flex-shrink-0"
                onClick={() => navigate('/projects')}
              >
                {t('dash_view_projects')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Telegram Link Section */}
        <TelegramConnectCard user={user} token={token} />

        {/* Tabs for Leads and Portfolio */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="leads">{t('dash_contacts')}</TabsTrigger>
            <TabsTrigger value="portfolio">{t('dash_portfolio')}</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-6">
            {/* Leads */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dash_your_contacts')}</CardTitle>
                <CardDescription>
                  {user.subscription_active 
                    ? t('dash_access_all') 
                    : `${leads.length} ${t('dash_purchased')}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-12">
                    <Boxes className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">{t('dash_no_contacts')}</h3>
                    <p className="text-slate-500 mb-4">{t('dash_no_contacts_sub')}</p>
                    <Button onClick={() => navigate('/projects')} className="bg-[#FF8C42] hover:bg-[#e67a30]">
                      {t('dash_view_projects')}
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {leads.map(lead => (
                      <div key={lead.id} className="py-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{lead.title}</h4>
                            <Badge className="mt-1">{lead.category_name}</Badge>
                          </div>
                          <span className="text-sm text-slate-500">
                            {new Date(lead.created_at).toLocaleDateString('bg-BG')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{lead.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <a href={`mailto:${lead.client_email}`} className="text-[#FF8C42] hover:underline">
                              {lead.client_email}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            <PortfolioGallery 
              projects={portfolio}
              isOwner={true}
              onAddProject={handleAddPortfolio}
              onDeleteProject={handleDeletePortfolio}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    budget_min: '',
    budget_max: '',
    images: [],
    estimated_budget: null
  });
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = React.useRef(null);

  useEffect(() => {
    if (!user || user.user_type !== 'client') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [projRes, catsRes] = await Promise.all([
          axios.get(`${API}/my-projects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/categories`)
        ]);
        setProjects(projRes.data.projects);
        setCategories(catsRes.data.categories);
      } catch (err) {
        toast.error(t('common_error'));
      }
      setLoading(false);
    };
    fetchData();
  }, [user, token, navigate]);

  const handleImageUpload = (files) => {
    const remainingSlots = 10 - newProject.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    const newImages = filesToProcess.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImages).then(images => {
      setNewProject(prev => ({
        ...prev,
        images: [...prev.images, ...images].slice(0, 10)
      }));
    });
  };

  const removeImage = (index) => {
    setNewProject(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.description || !newProject.category || !newProject.city) {
      toast.error(t('cd_fill_required'));
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...newProject,
        budget_min: newProject.budget_min ? parseFloat(newProject.budget_min) : null,
        budget_max: newProject.budget_max ? parseFloat(newProject.budget_max) : null,
        estimated_budget: newProject.estimated_budget
      };
      await axios.post(`${API}/projects`, data, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t('cd_project_created'));
      setCreateDialogOpen(false);
      setNewProject({ title: '', description: '', category: '', city: '', budget_min: '', budget_max: '', images: [], estimated_budget: null });
      
      // Refresh projects
      const res = await axios.get(`${API}/my-projects`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(res.data.projects);
    } catch (err) {
      toast.error(err.response?.data?.detail || t('common_error'));
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}}>
        <div className="max-w-7xl mx-auto px-4">
          <Card className="h-64 animate-pulse bg-[#253545]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}} data-testid="client-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('cl_my_projects')}</h1>
            <p className="text-slate-400">{t('cl_manage')}</p>
          </div>
          <Button 
            className="bg-[#FF8C42] hover:bg-[#e67a30]"
            onClick={() => setCreateDialogOpen(true)}
            data-testid="create-project-btn"
          >
            + {t('cl_new_project')}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Boxes className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">{t('cl_no_projects')}</h3>
                <p className="text-slate-500 mb-4">{t('cl_no_projects_sub')}</p>
                <Button 
                  className="bg-[#FF8C42] hover:bg-[#e67a30]"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Създай проект
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {projects.map(project => (
                  <div key={project.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{project.title}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge>{project.category_name}</Badge>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {project.city}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status === 'active' ? t('cl_active') : t('cl_closed')}
                        </Badge>
                        <p className="text-sm text-slate-500 mt-2">
                          {project.views} {t('projects_views')} • {project.purchases} {t('cl_purchases')}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-400 mt-3 line-clamp-2">{project.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Project Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('cl_create_project')}</DialogTitle>
              <DialogDescription>{t('cl_create_desc')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>{t('cl_title')} *</Label>
                <Input 
                  placeholder={t('cl_title_placeholder')}
                  value={newProject.title}
                  onChange={(e) => setNewProject(d => ({ ...d, title: e.target.value }))}
                  data-testid="project-title-input"
                />
              </div>

              <div>
                <Label>{t('cl_category')} *</Label>
                <Select value={newProject.category} onValueChange={(v) => setNewProject(d => ({ ...d, category: v }))}>
                  <SelectTrigger data-testid="project-category-select">
                    <SelectValue placeholder={t('cl_select_cat')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('cl_city_label')} *</Label>
                <Input 
                  placeholder={t('cl_city_placeholder')}
                  value={newProject.city}
                  onChange={(e) => setNewProject(d => ({ ...d, city: e.target.value }))}
                  data-testid="project-city-input"
                />
              </div>

              <div>
                <Label>{t('cl_description')} *</Label>
                <Textarea 
                  placeholder={t('cl_desc_placeholder')}
                  value={newProject.description}
                  onChange={(e) => setNewProject(d => ({ ...d, description: e.target.value }))}
                  rows={4}
                  data-testid="project-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('cl_min_budget')}</Label>
                  <Input 
                    type="number"
                    placeholder="1000"
                    value={newProject.budget_min}
                    onChange={(e) => setNewProject(d => ({ ...d, budget_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t('cl_max_budget')}</Label>
                  <Input 
                    type="number"
                    placeholder="5000"
                    value={newProject.budget_max}
                    onChange={(e) => setNewProject(d => ({ ...d, budget_max: e.target.value }))}
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4" />
                  {t('cl_photos')}
                </Label>
                <p className="text-xs text-slate-500 mb-3">
                  {t('cl_photos_desc')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {newProject.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                      <img src={img} alt={`Снимка ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                      <span className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                  {newProject.images.length < 10 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
                    >
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-xs">{t('cl_add_photo')}</span>
                    </button>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </div>
                {newProject.images.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">{newProject.images.length} {t('cl_of_10')}</p>
                )}
              </div>

              {/* Budget Estimator */}
              <ProjectEstimator 
                initialCity={newProject.city}
                onEstimateChange={(estimate) => setNewProject(d => ({ ...d, estimated_budget: estimate }))}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('cd_cancel')}</Button>
              <Button 
                className="bg-[#FF8C42] hover:bg-[#e67a30]"
                onClick={handleCreateProject}
                disabled={submitting}
                data-testid="submit-project-btn"
              >
                {submitting ? t('cl_creating') : t('cl_create_project')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// ============== PAYMENT PAGES ==============
const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState('checking');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || !token) return;

    const checkStatus = async (attempts = 0) => {
      if (attempts >= 5) {
        setStatus('timeout');
        return;
      }

      try {
        const res = await axios.get(`${API}/payments/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.payment_status === 'paid' || res.data.status === 'completed') {
          setStatus('success');
          await refreshUser();
        } else if (res.data.status === 'expired' || res.data.status === 'failed') {
          setStatus('failed');
        } else {
          setTimeout(() => checkStatus(attempts + 1), 2000);
        }
      } catch {
        setTimeout(() => checkStatus(attempts + 1), 2000);
      }
    };

    checkStatus();
  }, [sessionId, token, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{background: "var(--theme-bg-secondary)"}}>
      <Card className="w-full max-w-md text-center p-8" data-testid="payment-success">
        {status === 'checking' && (
          <>
            <Clock className="h-16 w-16 mx-auto mb-4 text-orange-500 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_checking')}</h2>
            <p className="text-slate-400">{t('pay_wait')}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_success')}</h2>
            <p className="text-slate-400 mb-6">{t('pay_thanks')}</p>
            <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" onClick={() => navigate('/dashboard')}>
              {t('pay_to_dash')}
            </Button>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_failed')}</h2>
            <p className="text-slate-400 mb-6">{t('pay_retry')}</p>
            <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" onClick={() => navigate('/projects')}>
              {t('pay_back')}
            </Button>
          </>
        )}
        
        {status === 'timeout' && (
          <>
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-[#FF8C42]" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_timeout')}</h2>
            <p className="text-slate-400 mb-6">{t('pay_check_email')}</p>
            <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" onClick={() => navigate('/dashboard')}>
              {t('pay_to_dash')}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{background: "var(--theme-bg-secondary)"}}>
      <Card className="w-full max-w-md text-center p-8" data-testid="payment-cancel">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-400" />
        <h2 className="text-2xl font-bold mb-2">{t('pay_cancelled')}</h2>
        <p className="text-slate-400 mb-6">{t('pay_can_retry')}</p>
        <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" onClick={() => navigate('/projects')}>
          {t('pay_back')}
        </Button>
      </Card>
    </div>
  );
};

// ============== ADS PAGE ==============
const AdsPage = () => {
  const { user, token } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', description: '', category: 'general', city: '' });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/ads`).then(res => { setAds(res.data.ads); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!user) { navigate('/login'); return; }
    if (!newAd.title || !newAd.description) { toast.error('Попълнете заглавие и описание'); return; }
    try {
      const res = await axios.post(`${API}/ads`, newAd, { headers: { Authorization: `Bearer ${token}` } });
      setAds(prev => [res.data, ...prev]);
      setShowCreate(false);
      setNewAd({ title: '', description: '', category: 'general', city: '' });
      toast.success('Обявата е публикувана!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
  };

  return (
    <div className="min-h-screen py-8" style={{background: "var(--theme-bg-secondary)"}} data-testid="ads-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Обяви</h1>
            <p className="text-slate-400">Безплатни обяви за строителство и ремонти</p>
          </div>
          <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" onClick={() => user ? setShowCreate(true) : navigate('/login')} data-testid="create-ad-btn">
            + Нова обява
          </Button>
        </div>

        {/* Test mode banner */}
        <PageInstructions
          title="Система за обяви"
          description="Публикувайте и намирайте обяви за строителство и ремонти"
          steps={['Кликнете "+ Нова обява" за да публикувате', 'Попълнете заглавие, описание и град', 'Обявата ще бъде видима за всички потребители', 'Можете да добавите до 5 снимки']}
          benefits={['Безплатни обяви в тестов режим', 'Търсене по категория и град', 'Директна връзка с клиенти']}
          videoUrl="https://temadom.com/videos/ads"
        />

        <div className="bg-[#FF8C42]/10 border border-[#FF8C42]/20 rounded-lg p-4 mb-6" data-testid="test-mode-banner">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#FF8C42]" />
            <span className="text-sm font-medium text-[#FF8C42]">Тестов режим — всички обяви са безплатни</span>
          </div>
        </div>

        {/* Create dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md" data-testid="create-ad-dialog">
            <DialogHeader>
              <DialogTitle>Нова обява</DialogTitle>
              <DialogDescription>Публикувайте обява безплатно</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Заглавие *</Label>
                <Input placeholder="Напр. Търся бояджия за апартамент" value={newAd.title} onChange={e => setNewAd(d => ({ ...d, title: e.target.value }))} data-testid="ad-title" />
              </div>
              <div>
                <Label>Описание *</Label>
                <Textarea placeholder="Опишете подробно..." value={newAd.description} onChange={e => setNewAd(d => ({ ...d, description: e.target.value }))} data-testid="ad-description" />
              </div>
              <div>
                <Label>Град</Label>
                <Input placeholder="Напр. София" value={newAd.city} onChange={e => setNewAd(d => ({ ...d, city: e.target.value }))} data-testid="ad-city" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Отказ</Button>
              <Button className="bg-[#FF8C42] hover:bg-[#e67a30]" onClick={handleCreate} data-testid="submit-ad-btn">Публикувай</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Няма обяви все още</h3>
            <p className="text-slate-500">Бъдете първият, който ще публикува обява!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {ads.map(ad => (
              <Card key={ad.id} className="hover:shadow-md transition-shadow" data-testid={`ad-${ad.id}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{ad.title}</h3>
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{ad.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{ad.user_type === 'company' ? 'Фирма' : ad.user_type === 'master' ? 'Майстор' : 'Клиент'}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {ad.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ad.city}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ad.created_at).toLocaleDateString('bg-BG')}</span>
                    <span>{ad.user_name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============== AI DESIGNER PAGE (Placeholder) ==============

// ============== SUBSCRIPTIONS PAGE ==============
const SubscriptionsPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState({});

  useEffect(() => {
    axios.get(`${API}/subscriptions/plans`).then(res => setPlans(res.data.plans)).catch(() => {});
  }, []);

  const handleActivate = async (plan) => {
    if (!user) { navigate('/login'); return; }
    try {
      await axios.post(`${API}/subscriptions/activate`, { plan }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Абонаментът е активиран!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
  };

  const planConfig = {
    basic: { color: '#4DA6FF', stars: 1, badge: null, ring: '' },
    pro: { color: '#FF8C42', stars: 2, badge: '90% ИЗБИРАТ ТОЗИ!', ring: 'border-[#FF8C42] ring-2 ring-[#FF8C42]/20 scale-[1.03]' },
    premium: { color: '#8C56FF', stars: 3, badge: 'КРАЛСКИ!', ring: 'border-[#8C56FF] ring-1 ring-[#8C56FF]/20' },
  };

  const renderStars = (count, color) => (
    <div className="flex gap-0.5 justify-center mb-2">
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className="h-5 w-5 fill-current" style={{ color }} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen py-12" style={{background: "var(--theme-bg-secondary)"}} data-testid="subscriptions-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Абонаменти и услуги</h1>
          <p className="text-lg text-slate-400">Изберете план, който отговаря на вашите нужди</p>
        </div>

        {/* How notification timing works */}
        <div className="bg-[#0F1923] border border-[#2A3A4C] rounded-xl p-5 mb-8 max-w-3xl mx-auto" data-testid="notification-explainer">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#FF8C42]" /> Как работят известията за нови обяви?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#8C56FF]/10 border border-[#8C56FF]/20 rounded-lg p-3 text-center">
              <p className="text-[#8C56FF] font-bold">PREMIUM</p>
              <p className="text-white mt-1">10:00 ч. — вижда обявата ПЪРВИ</p>
              <p className="text-slate-500 mt-0.5">10 мин. преди ПРО!</p>
            </div>
            <div className="bg-[#FF8C42]/10 border border-[#FF8C42]/20 rounded-lg p-3 text-center">
              <p className="text-[#FF8C42] font-bold">ПРО</p>
              <p className="text-white mt-1">10:10 ч. — получава известие</p>
              <p className="text-slate-500 mt-0.5">Едновременно с всички ПРО</p>
            </div>
            <div className="bg-[#4DA6FF]/10 border border-[#4DA6FF]/20 rounded-lg p-3 text-center">
              <p className="text-[#4DA6FF] font-bold">БАЗОВ</p>
              <p className="text-white mt-1">Търси ръчно в сайта</p>
              <p className="text-slate-500 mt-0.5">Без автоматични известия</p>
            </div>
          </div>
          <p className="text-center text-[#FF8C42] font-bold text-xs mt-3">PREMIUM взима 80% от договорите!</p>
        </div>

        {/* Subscription plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.company && Object.entries(plans.company).map(([key, plan]) => {
            const cfg = planConfig[key] || planConfig.basic;
            return (
              <Card key={key} className={`relative bg-[#253545] border-[#3A4A5C] overflow-hidden ${cfg.ring}`} data-testid={`plan-${key}`}>
                {cfg.badge && (
                  <div className="text-white text-center text-xs py-2 font-bold tracking-wider" style={{ backgroundColor: cfg.color }}>
                    {cfg.badge}
                  </div>
                )}
                <CardContent className="p-6">
                  {renderStars(cfg.stars, cfg.color)}
                  <h3 className="text-xl font-bold text-white text-center mb-1">{plan.name}</h3>
                  <p className="text-3xl font-bold text-center mb-1" style={{ color: cfg.color }}>{plan.price}</p>

                  {/* Notification delay badge */}
                  {plan.notification_delay && (
                    <div className="text-center mb-4 mt-2">
                      <span className="inline-block text-[10px] font-medium px-3 py-1 rounded-full border" style={{
                        color: cfg.color,
                        borderColor: `${cfg.color}40`,
                        backgroundColor: `${cfg.color}10`
                      }}>
                        {plan.notification_delay}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2.5 mb-4">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="space-y-1.5 mb-4 pt-3 border-t border-[#3A4A5C]">
                      {plan.limitations.map((l, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                          <X className="h-3 w-3 flex-shrink-0 mt-0.5 text-red-400/60" />
                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button className="w-full text-white font-bold" style={{ backgroundColor: cfg.color }} onClick={() => handleActivate(key)} data-testid={`activate-${key}`}>
                    Избери {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Standalone services */}
        <h2 className="text-2xl font-bold text-white mb-2">Еднократни услуги</h2>
        <p className="text-slate-400 text-sm mb-6">Без абонамент — платете само когато имате нужда</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.standalone && Object.entries(plans.standalone).map(([key, svc]) => (
            <Card key={key} className="bg-[#253545] border-[#3A4A5C] overflow-hidden" data-testid={`standalone-${key}`}>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-1">{svc.name}</h3>
                <p className="text-2xl font-bold text-[#28A745] mb-2">{svc.price}</p>
                <p className="text-sm text-slate-400 mb-4">{svc.description}</p>
                <div className="space-y-2">
                  {svc.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-4 w-4 text-[#28A745] flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-[#28A745] hover:bg-[#22943e] text-white" onClick={() => key.includes('calculator') ? navigate('/calculator') : navigate('/ai-sketch')}>
                  Поръчай сега
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Video Designer module */}
        <h2 className="text-2xl font-bold text-white mb-2">3D Photo Designer</h2>
        <p className="text-slate-400 text-sm mb-6">Качете 3 снимки на помещение → AI генерира 3D ремонт + бюджет с директни линкове.</p>
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
          {[
            { name: '1 помещение', price: '69 EUR', features: ['3 снимки → 3D рендери', 'Бюджет + линкове', 'Списък материали', 'ПРЕДИ/СЛЕД сравнение'] },
            { name: '2 помещения', price: '129 EUR', features: ['2 видеа → 8 ъгъла', 'PDF за всяко помещение', 'Обща сметка', 'ПРЕДИ/СЛЕД за всяка стая'], popular: true },
            { name: 'Апартамент', price: '199 EUR', features: ['До 5 видеа → 20 ъгъла', 'PDF за всяко помещение', 'Пълна сметка + 3D', 'Приоритетна обработка'] },
          ].map((plan, i) => (
            <Card key={i} className={`border ${plan.popular ? 'border-[#F97316] bg-[#F97316]/5' : 'border-[#2A3A4C] bg-[#1E2A38]'} relative`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">ПОПУЛЯРЕН</div>}
              <CardContent className="p-5">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-2xl font-black text-[#F97316] mb-4">{plan.price}</p>
                <div className="space-y-2 mb-5">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button className={`w-full ${plan.popular ? 'bg-[#F97316] hover:bg-[#EA580C]' : 'bg-[#253545] hover:bg-[#2A3A4C]'} text-white`}
                  onClick={() => navigate('/room-scan')}>
                  Започни
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============== MAIN APP ==============
// Page view tracker
const PageTracker = () => {
  const location = useLocation();
  useEffect(() => {
    axios.post(`${API}/analytics/track`, { path: location.pathname, referrer: document.referrer }).catch(() => {});
  }, [location.pathname]);
  return null;
};

// Track custom events helper
export const trackEvent = (eventName, metadata = {}) => {
  axios.post(`${API}/analytics/event`, { event_name: eventName, metadata, path: window.location.pathname }).catch(() => {});
};

function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <div className="App min-h-screen flex flex-col">
          <BrowserRouter>
            <PageTracker />
            <Navbar />
            <LiveCounter />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/projects" element={<AuthGate><ProjectsPage /></AuthGate>} />
                <Route path="/projects/:id" element={<AuthGate><ProjectDetailPage /></AuthGate>} />
                <Route path="/companies" element={<AuthGate><CompaniesPage /></AuthGate>} />
                <Route path="/companies/:id" element={<AuthGate><CompanyDetailPage /></AuthGate>} />
                <Route path="/find-master" element={<AuthGate><FindMasterPage /></AuthGate>} />
                <Route path="/calculator" element={<AuthGate><PriceCalculator /></AuthGate>} />
                <Route path="/services" element={<AuthGate><ServicesPage /></AuthGate>} />
                <Route path="/messages" element={<AuthGate><ChatPage /></AuthGate>} />
                <Route path="/about" element={<AuthGate><AboutPage /></AuthGate>} />
                <Route path="/profile" element={<AuthGate><ProfilePage /></AuthGate>} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/professions" element={<AuthGate><ProfessionsPage /></AuthGate>} />
                <Route path="/blog" element={<AuthGate><BlogPage /></AuthGate>} />
                <Route path="/blog/:slug" element={<AuthGate><BlogArticle /></AuthGate>} />
                <Route path="/prices" element={<AuthGate><PricesByRegionPage /></AuthGate>} />
                <Route path="/region/:slug" element={<AuthGate><RegionalPage /></AuthGate>} />
                <Route path="/analytics" element={<AuthGate><AnalyticsDashboard /></AuthGate>} />
                <Route path="/community" element={<AuthGate><CommunityPage /></AuthGate>} />
                <Route path="/product-search" element={<AuthGate><ProductSearchPage /></AuthGate>} />
                <Route path="/leaderboard" element={<AuthGate><LeaderboardPage /></AuthGate>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<AuthGate><CompanyDashboard /></AuthGate>} />
                <Route path="/dashboard/client" element={<AuthGate><ClientDashboard /></AuthGate>} />
                <Route path="/payment/success" element={<AuthGate><PaymentSuccessPage /></AuthGate>} />
                <Route path="/payment/cancel" element={<AuthGate><PaymentCancelPage /></AuthGate>} />
                <Route path="/ads" element={<AuthGate><AdsPage /></AuthGate>} />
                <Route path="/ai-designer" element={<AuthGate><AIDesignerPage /></AuthGate>} />
                <Route path="/ai-sketch" element={<AuthGate><AISketchPage /></AuthGate>} />
                <Route path="/ai-chart" element={<AuthGate><AIChartPage /></AuthGate>} />
                <Route path="/room-scan" element={<AuthGate><AIDesignerPage /></AuthGate>} />
                <Route path="/3d-scanner" element={<AuthGate><Scanner3DPage /></AuthGate>} />
                <Route path="/3d-scanner/:projectId" element={<AuthGate><Scanner3DPage /></AuthGate>} />
                <Route path="/ai-gallery" element={<AuthGate><PublishedGalleryPage /></AuthGate>} />
                <Route path="/ready-projects" element={<AuthGate><ReadyProjectsPage /></AuthGate>} />
                <Route path="/subscriptions" element={<AuthGate><SubscriptionsPage /></AuthGate>} />
                <Route path="/feedback" element={<AuthGate><FeedbackPage /></AuthGate>} />
              </Routes>
            </main>
            <Footer />
            <ChatbotWrapper />
            <FeedbackButton />
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </div>
      </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  );
}

// Wrapper to access AuthContext inside BrowserRouter
const ChatbotWrapper = () => {
  const { user } = useAuth();
  return <Chatbot user={user} />;
};

export default App;
