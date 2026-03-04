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
  ChevronDown, Globe, Sparkles, FileDown, Megaphone, ShoppingCart
} from 'lucide-react';
import PriceCalculator from '@/components/PriceCalculator';
import { PortfolioGallery } from '@/components/PortfolioGallery';
import ProjectEstimator from '@/components/ProjectEstimator';
import ServicesPage from '@/components/ServicesPage';
import ChatPage from '@/components/ChatPage';
import AboutPage from '@/components/AboutPage';
import TermsPage from '@/components/TermsPage';
import ProfessionsPage from '@/components/ProfessionsPage';
import BlogPage from '@/components/BlogPage';
import BlogArticle from '@/components/BlogArticle';
import PricesByRegionPage from '@/components/PricesByRegionPage';
import RegionalPage from '@/components/RegionalPage';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { LanguageProvider, useLanguage } from '@/i18n/LanguageContext';
import { LANGUAGES } from '@/i18n/translations';
import { Chatbot } from '@/components/Chatbot';

// TemaDom Logo Component - Generated logo image with HTML subtitle
const TemaDomLogo = ({ className = "h-12", showSubtitle = false }) => (
  <div className="flex flex-col items-center" data-testid="temadom-logo">
    <img 
      src="/logo-generated.png" 
      alt="TemaDom" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
    {showSubtitle && (
      <span 
        className="text-orange-500 font-bold tracking-[0.18em] uppercase text-center block w-full" 
        style={{ fontSize: '8px', marginTop: '-1px', letterSpacing: '0.15em' }}
      >
        Ремонт и строителство
      </span>
    )}
  </div>
);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (langRef.current && !langRef.current.contains(e.target) && 
          mobileLangRef.current && !mobileLangRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo only */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <TemaDomLogo className="h-10 w-auto" showSubtitle={true} />
            </Link>
          </div>

          {/* Right: Nav links + Language + Auth */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors" data-testid="nav-home">
              Главна
            </Link>
            <Link to="/calculator" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors flex items-center gap-1" data-testid="nav-calculator">
              <Calculator className="h-3.5 w-3.5" />
              Калкулатор
            </Link>
            <Link to="/companies" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors flex items-center gap-1" data-testid="nav-companies">
              <Building2 className="h-3.5 w-3.5" />
              Фирми
            </Link>
            <Link to="/find-master" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors flex items-center gap-1" data-testid="nav-find-master">
              <Wrench className="h-3.5 w-3.5" />
              Дизайнери
            </Link>
            <Link to="/ads" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors flex items-center gap-1" data-testid="nav-ads">
              <Megaphone className="h-3.5 w-3.5" />
              Обяви
            </Link>

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors flex items-center gap-1"
                data-testid="nav-more-btn"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                Още
              </button>
              {moreOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50" data-testid="nav-more-dropdown">
                  <Link to="/ai-designer" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setMoreOpen(false)} data-testid="nav-ai-designer">
                    <Sparkles className="h-4 w-4" /> AI Дизайнер
                  </Link>
                  <Link to="/projects" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setMoreOpen(false)} data-testid="nav-projects">
                    <FolderSearch className="h-4 w-4" /> Проекти
                  </Link>
                  <Link to="/services" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setMoreOpen(false)} data-testid="nav-services">
                    <Hammer className="h-4 w-4" /> Услуги
                  </Link>
                  <Link to="/professions" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setMoreOpen(false)} data-testid="nav-professions">
                    <HardHat className="h-4 w-4" /> Професии
                  </Link>
                  <Link to="/blog" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setMoreOpen(false)} data-testid="nav-blog">
                    <BookOpen className="h-4 w-4" /> Блог
                  </Link>
                  <Link to="/about" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setMoreOpen(false)} data-testid="nav-about">
                    <Info className="h-4 w-4" /> За нас
                  </Link>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
                data-testid="lang-switcher-btn"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium uppercase">{lang}</span>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50" data-testid="lang-dropdown">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { switchLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                        l.code === lang ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
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
                    <Button className="bg-orange-600 hover:bg-orange-700" data-testid="nav-publish-project">
                      + {t('nav_register')}
                    </Button>
                  </Link>
                )}
                <Link to={user.user_type === 'client' ? '/dashboard/client' : '/dashboard'} className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5" data-testid="nav-dashboard">
                  <LayoutGrid className="h-4 w-4" />
                  {t('nav_dashboard')}
                </Link>
                <Link to="/messages" className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5" data-testid="nav-messages">
                  <MessageSquare className="h-4 w-4" />
                  {t('nav_messages')}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{user.name}</span>
                  <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" data-testid="login-btn">{t('nav_login')}</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-orange-600 hover:bg-orange-700" data-testid="register-btn">
                    {t('nav_register')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {/* Mobile language switcher */}
            <div className="relative" ref={mobileLangRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 text-slate-500 hover:text-slate-900"
                data-testid="mobile-lang-btn"
              >
                <Globe className="h-5 w-5" />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { switchLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm ${
                        l.code === lang ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 animate-slideDown">
          <div className="px-4 py-4 space-y-3">
            <Link to="/projects" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <FolderSearch className="h-4 w-4" /> {t('nav_projects')}
            </Link>
            <Link to="/find-master" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-find-master">
              <Wrench className="h-4 w-4" /> {t('nav_find_master')}
            </Link>
            <Link to="/companies" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Building2 className="h-4 w-4" /> {t('nav_companies')}
            </Link>
            <Link to="/calculator" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Calculator className="h-4 w-4" /> {t('nav_calculator')}
            </Link>
            <Link to="/services" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Hammer className="h-4 w-4" /> {t('nav_services')}
            </Link>
            <Link to="/professions" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <HardHat className="h-4 w-4" /> {t('nav_professions')}
            </Link>
            <Link to="/blog" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-blog">
              <BookOpen className="h-4 w-4" /> {t('nav_blog')}
            </Link>
            <Link to="/prices" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-prices">
              <MapPin className="h-4 w-4" /> {t('nav_prices')}
            </Link>
            <Link to="/about" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Info className="h-4 w-4" /> {t('nav_about')}
            </Link>
            {user ? (
              <>
                <Link to={user.user_type === 'client' ? '/dashboard/client' : '/dashboard'} className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutGrid className="h-4 w-4" /> {t('nav_dashboard')}
                </Link>
                <Link to="/messages" className="block py-2 text-slate-600 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <MessageSquare className="h-4 w-4" /> {t('nav_messages')}
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" /> {t('nav_logout')}
                </Button>
              </>
            ) : (
              <div className="flex gap-3 pt-3">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">{t('nav_login')}</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">{t('nav_register_short')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ============== FOOTER ==============
const Footer = () => {
  const { t } = useLanguage();
  return (
  <footer className="bg-slate-900 text-white py-12 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="mb-4 flex flex-col items-start">
            <TemaDomLogo className="h-10 w-auto" />
            <p className="text-orange-400 text-[10px] font-bold tracking-[0.12em] uppercase mt-1">{t('footer_tagline')}</p>
          </div>
          <p className="text-slate-400 text-sm">
            {t('footer_desc')}
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">{t('footer_clients')}</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li><Link to="/register" className="hover:text-white transition-colors">{t('footer_publish')}</Link></li>
            <li><Link to="/companies" className="hover:text-white transition-colors">{t('footer_find_company')}</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">{t('footer_services')}</Link></li>
            <li><Link to="/calculator" className="hover:text-white transition-colors">{t('footer_calculator')}</Link></li>
            <li><Link to="/professions" className="hover:text-white transition-colors">{t('footer_professions_guide')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">{t('footer_for_companies')}</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li><Link to="/register" className="hover:text-white transition-colors">{t('footer_register_link')}</Link></li>
            <li><Link to="/projects" className="hover:text-white transition-colors">{t('footer_view_projects')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">{t('footer_info')}</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li><Link to="/about" className="hover:text-white transition-colors">{t('footer_about')}</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">{t('footer_terms')}</Link></li>
            <li>info@temadom.com</li>
            <li>+359 88 888 8888</li>
          </ul>
        </div>
      </div>
      <Separator className="my-8 bg-slate-700" />
      <p className="text-center text-slate-500 text-sm">
        © 2025-2026 TemaDom. {t('footer_rights')}
      </p>
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
          className={`${sizeClass} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
        />
      ))}
    </div>
  );
};

// ============== LANDING PAGE v10.8 ==============
const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ total_projects: 0, total_companies: 0, total_reviews: 0 });
  const [demoProjects, setDemoProjects] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [aiDesignStatus, setAiDesignStatus] = useState({ global_free_remaining: 100 });

  useEffect(() => {
    axios.get(`${API}/stats`).then(res => setStats(res.data));
    axios.get(`${API}/demo-projects`).then(res => setDemoProjects(res.data.projects));
    axios.get(`${API}/top-companies`).then(res => setTopCompanies(res.data.companies));
    axios.get(`${API}/ai-design/status`).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center text-white">
            {/* Promo banner */}
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-5 py-2.5 mb-8 animate-pulse" data-testid="hero-promo">
              <Award className="h-5 w-5 text-orange-400" />
              <span className="text-orange-300 font-bold text-sm tracking-wide">
                ПЪРВИ 20 ФИРМИ = 1 МЕСЕЦ ПРО ТЕСТОВ РЕЖИМ
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Строителство и ремонти<br/>
              <span className="text-orange-500">с AI технологии</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Калкулатор за цени, AI дизайнер, количествени сметки и свързване с проверени фирми — всичко на едно място.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 h-14" onClick={() => navigate('/calculator')} data-testid="hero-calc-btn">
                <Calculator className="mr-2 h-6 w-6" /> Калкулатор
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 text-lg px-8 h-14" onClick={() => navigate('/register')}>
                Регистрация
              </Button>
            </div>
            
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-orange-400">{stats.total_companies}+</p>
                <p className="text-sm text-slate-400">Фирми</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-orange-400">{stats.total_projects}+</p>
                <p className="text-sm text-slate-400">Проекти</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-orange-400">28</p>
                <p className="text-sm text-slate-400">Области</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-orange-400">{stats.total_reviews}+</p>
                <p className="text-sm text-slate-400">Отзиви</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AI DESIGNER PROMO ===== */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700 py-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium text-sm">AI ДИЗАЙНЕР</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Първите 100 AI дизайна — БЕЗПЛАТНИ
          </h2>
          <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
            Генерирайте 2D визуализации и 3D модели за вашия проект. Изберете стил, бюджет и получете PDF + GLB файл.
          </p>
          <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50" onClick={() => navigate('/ai-designer')} data-testid="ai-designer-cta">
            Опитай AI Дизайнер
          </Button>
        </div>
      </section>

      {/* ===== 4 DEMO PROJECTS ===== */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Демо проекти</h2>
            <p className="text-slate-600">Вижте примерни проекти и оценки от калкулатора</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoProjects.map((project, i) => (
              <Card key={project.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden" data-testid={`demo-project-${i}`}>
                <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-slate-400" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1 text-sm">{project.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" /> {project.city}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-orange-600 font-bold">{project.budget}</span>
                    <Badge variant="outline" className="text-xs">Демо</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Как работи TemaDom?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Calculator className="h-8 w-8" />, title: "Калкулатор", desc: "Изчислете цена с реални данни за 28 области" },
              { icon: <Sparkles className="h-8 w-8" />, title: "AI Дизайнер", desc: "Визуализирайте проекта си с AI технологии" },
              { icon: <Users className="h-8 w-8" />, title: "Намери фирма", desc: "Свържете се с проверени фирми и майстори" },
              { icon: <Star className="h-8 w-8" />, title: "Оценка", desc: "Оценявайте и четете реални отзиви" }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
                  {step.icon}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOP COMPANIES ===== */}
      {topCompanies.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Топ фирми</h2>
              <Button variant="ghost" className="text-orange-600" onClick={() => navigate('/companies')}>
                Виж всички <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {topCompanies.slice(0, 4).map(comp => (
                <Card key={comp.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/company/${comp.id}`)}>
                  <CardContent className="p-5 text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-8 w-8 text-orange-600" />
                    </div>
                    <h4 className="font-semibold">{comp.company_name}</h4>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{comp.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-sm text-slate-500">({comp.review_count || 0})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{comp.city}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== SUBSCRIPTION CTA ===== */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Готови ли сте да започнете?</h2>
          <p className="text-orange-100 mb-8 text-lg">
            Регистрирайте се безплатно • Всички функции в тестов режим
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8" onClick={() => navigate('/register')} data-testid="cta-register">
              Регистрирай се
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" onClick={() => navigate('/companies')}>
              Виж фирми
            </Button>
          </div>
        </div>
      </section>
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
        <div className="aspect-video bg-slate-100 overflow-hidden">
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
            <Badge className="bg-orange-100 text-orange-800">{project.category_name}</Badge>
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
        <CardTitle className="text-lg group-hover:text-orange-600 transition-colors line-clamp-2">
          {project.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-slate-600 text-sm line-clamp-2 mb-4">{project.description}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-4 w-4" />
            <span>{project.city}</span>
          </div>
          
          {/* Show estimated budget if available */}
          {project.estimated_budget && (
            <div className="flex items-center gap-2 text-orange-600 font-medium">
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
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">{project.views} {t('projects_views')}</span>
          <span className="text-orange-600 text-sm font-medium group-hover:underline">
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('projects_title')}</h1>
          <p className="text-slate-600">{t('projects_subtitle')}</p>
        </div>

        {/* Filters */}
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
            
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" data-testid="search-btn">
              <Filter className="mr-2 h-4 w-4" /> {t('projects_filter')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-64 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <Boxes className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('projects_empty')}</h3>
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
                <span className="flex items-center px-4 text-slate-600">
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
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="h-96 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
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
              <Badge className="bg-orange-100 text-orange-800 text-sm">{project.category_name}</Badge>
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
            <div className="flex items-center gap-4 mt-4 text-slate-600">
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
              <p className="text-slate-600 whitespace-pre-wrap">{project.description}</p>
            </div>

            {(project.budget_min || project.budget_max) && (
              <div className="bg-slate-50 rounded-lg p-4 mb-8">
                <h4 className="font-semibold text-slate-700 mb-2">{t('pd_budget')}</h4>
                <p className="text-2xl font-bold text-slate-900">
                  {project.budget_min && `${project.budget_min}€`}
                  {project.budget_min && project.budget_max && ' - '}
                  {project.budget_max && `${project.budget_max}€`}
                </p>
              </div>
            )}

            {/* Estimated Budget from Calculator */}
            {project.estimated_budget && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Calculator className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">{t('pd_calc_estimate')}</h4>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  ~{project.estimated_budget} €
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  ≈ {Math.round(project.estimated_budget * 1.95)} лв. ({t('pd_approx_bgn')})
                </p>
              </div>
            )}

            {/* Contact Info Section */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-semibold mb-4">{t('pd_contact')}</h3>
              
              {/* Free platform notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" data-testid="free-platform-notice">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">{t('pd_free_access')}</span>
                </div>
                <p className="text-sm text-green-700">
                  {t('pd_free_desc')}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6" data-testid="contact-unlocked">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">{t('pd_contacts_unlocked')}</span>
                </div>
                <div className="space-y-4">
                  {project.client_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-slate-600" />
                      <span className="font-medium">{project.client_name}</span>
                    </div>
                  )}
                  {project.client_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-600" />
                      <a href={`tel:${project.client_phone}`} className="text-orange-600 hover:underline">
                        {project.client_phone}
                      </a>
                    </div>
                  )}
                  {project.client_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-slate-600" />
                      <a href={`mailto:${project.client_email}`} className="text-orange-600 hover:underline">
                        {project.client_email}
                      </a>
                    </div>
                  )}
                </div>
                {user && user.id !== project.client_id && (
                  <div className="mt-4 pt-4 border-t border-green-200">
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('comp_title')}</h1>
          <p className="text-slate-600">{t('comp_subtitle')}</p>
        </div>

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
            
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Search className="mr-2 h-4 w-4" /> {t('comp_search')}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Card key={i} className="h-48 animate-pulse bg-slate-100" />)}
          </div>
        ) : companies.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('comp_empty')}</h3>
            <p className="text-slate-500">{t('comp_empty_sub')}</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <Link key={company.id} to={`/companies/${company.id}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
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
                    <span className="text-sm text-slate-600">
                      ({company.review_count} отзива)
                    </span>
                  </div>
                  
                  {company.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{company.description}</p>
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
    <div className="min-h-screen bg-slate-50 py-8" data-testid="find-master-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('fm_title')}</h1>
          <p className="text-slate-600">{t('fm_subtitle')}</p>
        </div>

        {/* Free platform notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" data-testid="find-master-free-notice">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
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
            
            <Button className="bg-orange-600 hover:bg-orange-700" data-testid="filter-search-btn">
              <Search className="mr-2 h-4 w-4" /> {t('fm_search')}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Card key={i} className="h-48 animate-pulse bg-slate-100" />)}
          </div>
        ) : professionals.length === 0 ? (
          <Card className="p-12 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('fm_empty')}</h3>
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
                        <AvatarFallback className={`text-lg ${pro.user_type === 'master' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
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
                          <Badge variant="outline" className={`text-[10px] ${pro.user_type === 'master' ? 'border-blue-300 text-blue-700' : 'border-orange-300 text-orange-700'}`}>
                            {pro.user_type === 'master' ? t('fm_master_badge') : t('fm_company_badge')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={pro.rating} />
                      <span className="text-sm text-slate-600">
                        ({pro.review_count} {t('comp_reviews')})
                      </span>
                    </div>
                    
                    {pro.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{pro.description}</p>
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
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="h-96 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/companies')}>
          {t('cd_back')}
        </Button>

        <Card className="overflow-hidden mb-8" data-testid="company-detail">
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">
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
                  <span className="text-slate-600">
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
                <p className="text-slate-600">{company.description}</p>
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
                className="bg-orange-600 hover:bg-orange-700"
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
                  <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
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
                    <p className="text-slate-600 mt-2">{review.comment}</p>
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
                        className={`h-8 w-8 ${i <= reviewData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
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
                className="bg-orange-600 hover:bg-orange-700"
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md" data-testid="login-form">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-900 p-3 rounded-lg">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none">
                <path d="M12 2L2 10H5V20H19V10H22L12 2Z" fill="white"/>
                <rect x="9" y="11" width="6" height="9" fill="#F59E0B"/>
                <path d="M10 15L12 17L15 13" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
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
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? t('login_loading') : t('login_submit')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-slate-600">
            {t('login_no_account')}{' '}
            <Link to="/register" className="text-orange-600 hover:underline">
              {t('login_register')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md" data-testid="register-form">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-900 p-3 rounded-lg">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none">
                <path d="M12 2L2 10H5V20H19V10H22L12 2Z" fill="white"/>
                <rect x="9" y="11" width="6" height="9" fill="#F59E0B"/>
                <path d="M10 15L12 17L15 13" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl">{t('reg_title')}</CardTitle>
          <CardDescription>{t('reg_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Free platform banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4" data-testid="register-free-banner">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-bold text-green-800">{t('reg_free_banner')}</span>
            </div>
            <p className="text-xs text-green-700">
              {t('reg_free_desc')}
            </p>
          </div>

          {(userType === 'company' || userType === 'master') && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-4 mb-4" data-testid="register-promo-banner">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">&#9889;</span>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    {t('reg_promo_title')}
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t('reg_promo_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs value={userType} onValueChange={setUserType} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client" data-testid="register-client-tab">{t('reg_tab_client')}</TabsTrigger>
              <TabsTrigger value="company" data-testid="register-company-tab">{t('reg_tab_company')}</TabsTrigger>
              <TabsTrigger value="designer" data-testid="register-designer-tab">Дизайнер</TabsTrigger>
              <TabsTrigger value="master" data-testid="register-master-tab">{t('reg_tab_master')}</TabsTrigger>
            </TabsList>
          </Tabs>

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
              <Label>{t('reg_phone')}</Label>
              <Input 
                type="tel"
                placeholder="+359 88 888 8888"
                value={formData.phone}
                onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
                data-testid="register-phone"
              />
            </div>
            <div>
              <Label>{t('reg_city')}</Label>
              <Input 
                placeholder={t('reg_city_placeholder')}
                value={formData.city}
                onChange={(e) => setFormData(d => ({ ...d, city: e.target.value }))}
                data-testid="register-city"
              />
            </div>

            {isProUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="telegram-info-box">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.13l-1.97 9.28c-.15.66-.54.82-1.09.51l-3.01-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.06 5.55-5.01c.24-.22-.05-.33-.37-.13l-6.86 4.32-2.95-.92c-.64-.2-.66-.64.14-.95l11.54-4.45c.53-.2 1-.05.86.93z"/></svg>
                  <span className="text-sm font-semibold text-blue-800">{t('reg_telegram_title')}</span>
                </div>
                <p className="text-xs text-blue-700 mb-2">
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
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? t('reg_loading') : t('reg_submit')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-slate-600">
            Имате профил?{' '}
            <Link to="/login" className="text-orange-600 hover:underline">
              {t('reg_login')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

// ============== DASHBOARD PAGES ==============
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
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <Card className="h-32 bg-slate-100" />
            <Card className="h-64 bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="company-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{t('dash_title')}</h1>
          <p className="text-slate-600">{t('dash_subtitle')}</p>
        </div>

        {/* Free Platform Banner */}
        <Card className="mb-8 overflow-hidden" data-testid="free-platform-dashboard-banner">
          <div className="p-6 bg-green-50 border border-green-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-green-800">
                    {t('dash_welcome')}
                  </h2>
                </div>
                <p className="text-green-700">
                  {t('dash_welcome_desc')}
                </p>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                onClick={() => navigate('/projects')}
              >
                {t('dash_view_projects')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Telegram Link Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="p-6 bg-blue-50 border border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.13l-1.97 9.28c-.15.66-.54.82-1.09.51l-3.01-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.06 5.55-5.01c.24-.22-.05-.33-.37-.13l-6.86 4.32-2.95-.92c-.64-.2-.66-.64.14-.95l11.54-4.45c.53-.2 1-.05.86.93z"/></svg>
                  <h2 className="text-lg font-semibold text-blue-800">{t('dash_telegram')}</h2>
                </div>
                <p className="text-sm text-blue-700">
                  {t('dash_telegram_desc')}
                </p>
              </div>
              <a 
                href={`https://t.me/TemaDomBot?start=${user.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button className="bg-blue-500 hover:bg-blue-600 flex-shrink-0" data-testid="link-telegram-btn">
                  {t('dash_telegram_link')}
                </Button>
              </a>
            </div>
          </div>
        </Card>

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
                    <h3 className="text-lg font-medium text-slate-700 mb-2">{t('dash_no_contacts')}</h3>
                    <p className="text-slate-500 mb-4">{t('dash_no_contacts_sub')}</p>
                    <Button onClick={() => navigate('/projects')} className="bg-orange-600 hover:bg-orange-700">
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
                            <Phone className="h-4 w-4 text-slate-400" />
                            <a href={`tel:${lead.client_phone}`} className="text-orange-600 hover:underline">
                              {lead.client_phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <a href={`mailto:${lead.client_email}`} className="text-orange-600 hover:underline">
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
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="h-64 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="client-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t('cl_my_projects')}</h1>
            <p className="text-slate-600">{t('cl_manage')}</p>
          </div>
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
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
                <h3 className="text-lg font-medium text-slate-700 mb-2">{t('cl_no_projects')}</h3>
                <p className="text-slate-500 mb-4">{t('cl_no_projects_sub')}</p>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
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
                    <p className="text-slate-600 mt-3 line-clamp-2">{project.description}</p>
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
                className="bg-orange-600 hover:bg-orange-700"
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md text-center p-8" data-testid="payment-success">
        {status === 'checking' && (
          <>
            <Clock className="h-16 w-16 mx-auto mb-4 text-orange-500 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_checking')}</h2>
            <p className="text-slate-600">{t('pay_wait')}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_success')}</h2>
            <p className="text-slate-600 mb-6">{t('pay_thanks')}</p>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/dashboard')}>
              {t('pay_to_dash')}
            </Button>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_failed')}</h2>
            <p className="text-slate-600 mb-6">{t('pay_retry')}</p>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/projects')}>
              {t('pay_back')}
            </Button>
          </>
        )}
        
        {status === 'timeout' && (
          <>
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">{t('pay_timeout')}</h2>
            <p className="text-slate-600 mb-6">{t('pay_check_email')}</p>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/dashboard')}>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md text-center p-8" data-testid="payment-cancel">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-400" />
        <h2 className="text-2xl font-bold mb-2">{t('pay_cancelled')}</h2>
        <p className="text-slate-600 mb-6">{t('pay_can_retry')}</p>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/projects')}>
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
    <div className="min-h-screen bg-slate-50 py-8" data-testid="ads-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Обяви</h1>
            <p className="text-slate-600">Безплатни обяви за строителство и ремонти</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => user ? setShowCreate(true) : navigate('/login')} data-testid="create-ad-btn">
            + Нова обява
          </Button>
        </div>

        {/* Test mode banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6" data-testid="test-mode-banner">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Тестов режим — всички обяви са безплатни</span>
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
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleCreate} data-testid="submit-ad-btn">Публикувай</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Няма обяви все още</h3>
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
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{ad.description}</p>
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
const AIDesignerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [designStatus, setDesignStatus] = useState(null);

  useEffect(() => {
    axios.get(`${API}/ai-design/status`).then(res => setDesignStatus(res.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="ai-designer-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700 font-medium text-sm">AI ДИЗАЙНЕР</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">AI Интериорен дизайнер</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Генерирайте 2D визуализации и 3D модели за вашия проект с помощта на изкуствен интелект.
          </p>
        </div>

        {/* Free designs counter */}
        {designStatus && (
          <Card className="mb-8 overflow-hidden" data-testid="design-counter">
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-6 text-white text-center">
              <p className="text-purple-200 text-sm mb-1">Безплатни AI дизайна оставащи</p>
              <p className="text-5xl font-bold">{designStatus.global_free_remaining} / {designStatus.global_limit}</p>
              <p className="text-purple-200 text-xs mt-2">1 безплатен дизайн на профил (Вариант 1)</p>
            </div>
          </Card>
        )}

        {/* Design variants */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { name: 'Вариант 1', items: '1 PDF + 1 GLB', price: 'Тестов режим', highlight: true, desc: 'Първите 100 безплатни. 1 профил = 1 използване.' },
            { name: 'Вариант 3', items: '3 PDF + 3 GLB', price: 'Тестов режим', highlight: false, desc: 'С афилиейт линкове към магазини.' },
            { name: 'Вариант 5', items: '5 PDF + 5 GLB', price: 'Тестов режим', highlight: false, desc: 'С афилиейт линкове + приоритетна генерация.' }
          ].map((variant, i) => (
            <Card key={i} className={`relative overflow-hidden ${variant.highlight ? 'border-purple-300 ring-2 ring-purple-100' : ''}`} data-testid={`design-variant-${i}`}>
              {variant.highlight && (
                <div className="bg-purple-600 text-white text-center text-xs py-1 font-medium">БЕЗПЛАТНО (лимитирано)</div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{variant.name}</h3>
                <p className="text-2xl font-bold text-purple-600 mb-3">{variant.price}</p>
                <p className="text-sm text-slate-600 mb-4">{variant.desc}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {variant.items}</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Избор на стил</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Избор на бюджет</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Линкове към магазини</div>
                </div>
                <Button className={`w-full mt-6 ${variant.highlight ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`} 
                  disabled={!variant.highlight} onClick={() => !user ? navigate('/register') : toast.info('AI Дизайнерът ще бъде активиран скоро!')}>
                  {variant.highlight ? 'Генерирай дизайн' : 'Очаквайте скоро'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <Card className="bg-white">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6 text-center">Какво включва AI дизайна?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: <FileDown className="h-6 w-6" />, title: 'PDF визуализация', desc: '2D рендер на вашето пространство' },
                { icon: <Boxes className="h-6 w-6" />, title: '3D GLB модел', desc: 'Интерактивен 3D модел за преглед' },
                { icon: <Sparkles className="h-6 w-6" />, title: 'Избор на стил', desc: 'Модерен, класически, минималистичен и др.' },
                { icon: <ShoppingCart className="h-6 w-6" />, title: 'Линкове към магазини', desc: 'Директни линкове за закупуване на мебели' }
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="bg-purple-100 rounded-lg p-3 text-purple-600">{f.icon}</div>
                  <div>
                    <h4 className="font-semibold">{f.title}</h4>
                    <p className="text-sm text-slate-600">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

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
      toast.success('Абонаментът е активиран (тестов режим)');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12" data-testid="subscriptions-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Абонаментни планове</h1>
          <p className="text-lg text-slate-600">Всички функции в тестов режим — цените ще се активират след старта</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-center" data-testid="test-mode-notice">
          <span className="text-amber-800 font-medium">Тестов режим — цените ще се активират след старта на фирмата</span>
        </div>

        <h2 className="text-2xl font-bold mb-6">За фирми</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.company && Object.entries(plans.company).map(([key, plan]) => (
            <Card key={key} className={`relative ${key === 'pro' ? 'border-orange-300 ring-2 ring-orange-100' : ''}`} data-testid={`plan-${key}`}>
              {key === 'pro' && <div className="bg-orange-600 text-white text-center text-xs py-1 font-medium">ПРЕПОРЪЧАН</div>}
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-orange-600 mb-4">{plan.price}</p>
                <div className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" /> {f}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => handleActivate(key)} data-testid={`activate-${key}`}>
                  Активирай (тестов)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6">За дизайнери</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.designer && Object.entries(plans.designer).map(([key, plan]) => (
            <Card key={key} data-testid={`plan-designer-${key}`}>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-purple-600 mb-4">{plan.price}</p>
                <div className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" /> {f}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleActivate(key)}>
                  Активирай (тестов)
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
    <LanguageProvider>
      <AuthProvider>
        <div className="App min-h-screen flex flex-col">
          <BrowserRouter>
            <PageTracker />
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/companies/:id" element={<CompanyDetailPage />} />
                <Route path="/find-master" element={<FindMasterPage />} />
                <Route path="/calculator" element={<PriceCalculator />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/messages" element={<ChatPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/professions" element={<ProfessionsPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogArticle />} />
                <Route path="/prices" element={<PricesByRegionPage />} />
                <Route path="/region/:slug" element={<RegionalPage />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<CompanyDashboard />} />
                <Route path="/dashboard/client" element={<ClientDashboard />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/ads" element={<AdsPage />} />
                <Route path="/ai-designer" element={<AIDesignerPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
              </Routes>
            </main>
            <Footer />
            <ChatbotWrapper />
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

// Wrapper to access AuthContext inside BrowserRouter
const ChatbotWrapper = () => {
  const { user } = useAuth();
  return <Chatbot user={user} />;
};

export default App;
