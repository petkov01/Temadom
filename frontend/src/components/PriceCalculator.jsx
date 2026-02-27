import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calculator, Paintbrush, Zap, Droplets, Boxes, LayoutGrid, Square, Layers, ChevronDown, Info, Euro, Hammer, FileDown, Upload, Loader2, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/App';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CALC_API = `${BACKEND_URL}/api`;

// Bulgarian Construction Price Database (2025-2026 market research)
// Prices in EUR, adjusted for regional variations
const PRICE_DATABASE = {
  // БОЯДИСВАНЕ И ШПАКЛОВКА (Painting & Plastering)
  painting: {
    name: "Боядисване",
    icon: "Paintbrush",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 2.5, standard: 3.5, premium: 5 },
      laborAndMaterial: { economy: 4, standard: 6, premium: 10 }
    },
    description: "Латекс боя за стени и тавани"
  },
  plastering: {
    name: "Шпакловка",
    icon: "Layers",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 3, standard: 4, premium: 6 },
      laborAndMaterial: { economy: 5, standard: 7, premium: 12 }
    },
    description: "Гипсова или фина шпакловка"
  },
  screed: {
    name: "Замазка",
    icon: "Square",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 10, standard: 14, premium: 20 },
      laborAndMaterial: { economy: 22, standard: 30, premium: 45 }
    },
    description: "Циментова замазка до 5 см"
  },

  // ЕЛЕКТРИЧЕСТВО (Electrical)
  electrical: {
    name: "Ел. инсталация",
    icon: "Zap",
    unit: "точки",
    unitLabel: "Брой точки (контакти, ключове, осветление)",
    prices: {
      labor: { economy: 25, standard: 40, premium: 65 },
      laborAndMaterial: { economy: 50, standard: 80, premium: 130 }
    },
    description: "Контакти, ключове, осветителни тела"
  },

  // ВиК (Plumbing)
  plumbing: {
    name: "ВиК инсталация",
    icon: "Droplets",
    unit: "точки",
    unitLabel: "Брой точки (кранове, отводи)",
    prices: {
      labor: { economy: 40, standard: 65, premium: 100 },
      laborAndMaterial: { economy: 70, standard: 110, premium: 170 }
    },
    description: "Водопровод и канализация"
  },

  // БЕТОН (Concrete)
  concrete: {
    name: "Бетон",
    icon: "Boxes",
    unit: "м³",
    unitLabel: "Кубични метри",
    prices: {
      labor: { economy: 45, standard: 70, premium: 100 },
      laborAndMaterial: { economy: 110, standard: 160, premium: 230 }
    },
    description: "Изливане на бетон C20/25 - C25/30"
  },

  // АРМАТУРА (Reinforcement)
  reinforcement: {
    name: "Арматура",
    icon: "Hammer",
    unit: "кг",
    unitLabel: "Килограми",
    prices: {
      labor: { economy: 0.5, standard: 0.8, premium: 1.2 },
      laborAndMaterial: { economy: 1.5, standard: 2.2, premium: 3.2 }
    },
    description: "Арматурно желязо и мрежи"
  },

  // КОФРАЖ (Formwork)
  formwork: {
    name: "Кофраж",
    icon: "LayoutGrid",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 20, standard: 32, premium: 48 },
      laborAndMaterial: { economy: 40, standard: 65, premium: 95 }
    },
    description: "Кофражни работи за бетон"
  },

  // ПЛОЧКИ (Tiles)
  tiling: {
    name: "Фаянс и теракот",
    icon: "LayoutGrid",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 18, standard: 28, premium: 42 },
      laborAndMaterial: { economy: 45, standard: 75, premium: 130 }
    },
    description: "Лепене на плочки за стени и под"
  },

  // ПОДОВИ НАСТИЛКИ (Flooring)
  flooring: {
    name: "Подови настилки",
    icon: "Square",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 5, standard: 10, premium: 20 },
      laborAndMaterial: { economy: 20, standard: 40, premium: 80 }
    },
    description: "Ламинат, паркет, мокет"
  },

  // ИЗКЪРТВАНЕ (Demolition)
  demolition: {
    name: "Изкъртване",
    icon: "Hammer",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 8, standard: 12, premium: 18 },
      laborAndMaterial: { economy: 12, standard: 18, premium: 28 }
    },
    description: "Изкъртване на стени, подове, плочки"
  },

  // ЗИДАРИЯ (Masonry)
  masonry: {
    name: "Зидария",
    icon: "Boxes",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 14, standard: 22, premium: 35 },
      laborAndMaterial: { economy: 40, standard: 65, premium: 100 }
    },
    description: "Тухлена или газобетонна зидария"
  },

  // ТОПЛОИЗОЛАЦИЯ (Insulation)
  insulation: {
    name: "Топлоизолация",
    icon: "Layers",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 12, standard: 20, premium: 32 },
      laborAndMaterial: { economy: 35, standard: 55, premium: 85 }
    },
    description: "EPS, XPS или минерална вата"
  },

  // ИЗКОПНИ РАБОТИ (Excavation)
  excavation: {
    name: "Изкопни работи",
    icon: "Hammer",
    unit: "м³",
    unitLabel: "Кубични метри изкоп",
    prices: {
      labor: { economy: 15, standard: 22, premium: 35 },
      laborAndMaterial: { economy: 20, standard: 30, premium: 45 }
    },
    description: "Ръчен или машинен изкоп"
  },

  // ОСНОВИ (Foundations)
  foundations: {
    name: "Основи",
    icon: "Boxes",
    unit: "м³",
    unitLabel: "Кубични метри бетон за основи",
    prices: {
      labor: { economy: 50, standard: 75, premium: 110 },
      laborAndMaterial: { economy: 120, standard: 180, premium: 260 }
    },
    description: "Фундаменти, ивични основи"
  },

  // ПОКРИВИ (Roofing)
  roofing: {
    name: "Покриви",
    icon: "Layers",
    unit: "м²",
    unitLabel: "Квадратни метри покрив",
    prices: {
      labor: { economy: 30, standard: 50, premium: 75 },
      laborAndMaterial: { economy: 65, standard: 100, premium: 160 }
    },
    description: "Керемиди, ламарина, хидроизолация"
  },

  // ДОГРАМА (Windows & Doors)
  windows: {
    name: "Дограма",
    icon: "LayoutGrid",
    unit: "бр",
    unitLabel: "Брой прозорци/врати",
    prices: {
      labor: { economy: 25, standard: 40, premium: 60 },
      laborAndMaterial: { economy: 180, standard: 280, premium: 450 }
    },
    description: "PVC, алуминиева или дървена дограма"
  },

  // ГИПСОКАРТОН (Drywall)
  drywall: {
    name: "Гипсокартон",
    icon: "Square",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 10, standard: 15, premium: 22 },
      laborAndMaterial: { economy: 22, standard: 35, premium: 55 }
    },
    description: "Стени, тавани, преградни стени"
  },

  // МАЗИЛКА (Render/Plaster)
  render: {
    name: "Външна мазилка",
    icon: "Paintbrush",
    unit: "м²",
    unitLabel: "Квадратни метри фасада",
    prices: {
      labor: { economy: 10, standard: 16, premium: 24 },
      laborAndMaterial: { economy: 25, standard: 40, premium: 60 }
    },
    description: "Циментова или варова мазилка"
  },

  // КАНАЛИЗАЦИЯ (Sewage)
  sewage: {
    name: "Канализация",
    icon: "Droplets",
    unit: "м",
    unitLabel: "Линейни метри тръби",
    prices: {
      labor: { economy: 12, standard: 18, premium: 28 },
      laborAndMaterial: { economy: 25, standard: 40, premium: 60 }
    },
    description: "Канализационни тръби и шахти"
  },

  // ОГРАДИ (Fencing)
  fencing: {
    name: "Огради",
    icon: "LayoutGrid",
    unit: "м",
    unitLabel: "Линейни метри ограда",
    prices: {
      labor: { economy: 15, standard: 25, premium: 40 },
      laborAndMaterial: { economy: 50, standard: 85, premium: 140 }
    },
    description: "Метални, бетонни или дървени огради"
  },

  // НАСТИЛКИ ДВОР (Outdoor Paving)
  paving: {
    name: "Настилки двор",
    icon: "Square",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 12, standard: 18, premium: 28 },
      laborAndMaterial: { economy: 35, standard: 55, premium: 90 }
    },
    description: "Павета, бетонни плочи, асфалт"
  },

  // СУХО СТРОИТЕЛСТВО (Prefab Construction)
  prefab: {
    name: "Сухо строителство",
    icon: "Boxes",
    unit: "м²",
    unitLabel: "Квадратни метри РЗП",
    prices: {
      labor: { economy: 80, standard: 120, premium: 180 },
      laborAndMaterial: { economy: 250, standard: 380, premium: 550 }
    },
    description: "Сглобяеми конструкции, контейнери"
  },

  // ДЪРВОДЕЛСКИ РАБОТИ (Carpentry)
  carpentry: {
    name: "Дърводелство",
    icon: "Hammer",
    unit: "м²",
    unitLabel: "Квадратни метри или брой изделия",
    prices: {
      labor: { economy: 20, standard: 35, premium: 55 },
      laborAndMaterial: { economy: 60, standard: 100, premium: 160 }
    },
    description: "Дървени конструкции, мебели по поръчка"
  },

  // ХИДРОИЗОЛАЦИЯ (Waterproofing)
  waterproofing: {
    name: "Хидроизолация",
    icon: "Droplets",
    unit: "м²",
    unitLabel: "Квадратни метри",
    prices: {
      labor: { economy: 10, standard: 18, premium: 28 },
      laborAndMaterial: { economy: 25, standard: 42, premium: 70 }
    },
    description: "Бани, тераси, основи, покриви"
  },

  // ОТОПЛЕНИЕ (Heating)
  heating: {
    name: "Отопление",
    icon: "Zap",
    unit: "точки",
    unitLabel: "Брой радиатори/конвектори",
    prices: {
      labor: { economy: 50, standard: 80, premium: 120 },
      laborAndMaterial: { economy: 150, standard: 250, premium: 400 }
    },
    description: "Радиатори, подово отопление, котли"
  },

  // КЛИМАТИЗАЦИЯ (Air Conditioning)
  aircon: {
    name: "Климатизация",
    icon: "Zap",
    unit: "бр",
    unitLabel: "Брой климатици",
    prices: {
      labor: { economy: 80, standard: 120, premium: 180 },
      laborAndMaterial: { economy: 400, standard: 650, premium: 1000 }
    },
    description: "Монтаж на климатични системи"
  },

  // БАСЕЙНИ (Swimming Pools)
  pools: {
    name: "Басейни",
    icon: "Droplets",
    unit: "м³",
    unitLabel: "Кубични метри вода",
    prices: {
      labor: { economy: 150, standard: 250, premium: 400 },
      laborAndMaterial: { economy: 400, standard: 650, premium: 1000 }
    },
    description: "Изграждане и облицовка на басейни"
  }
};

// Regional price multipliers - ALL 28 Bulgarian oblasts
const REGIONAL_MULTIPLIERS = {
  // Столица и големи градове (по-високи цени)
  sofia_city: { name: "София (столица)", multiplier: 1.20 },
  sofia_oblast: { name: "Софийска област", multiplier: 1.05 },
  plovdiv: { name: "Пловдив", multiplier: 1.05 },
  varna: { name: "Варна", multiplier: 1.08 },
  burgas: { name: "Бургас", multiplier: 1.05 },
  
  // Средни по големина градове
  stara_zagora: { name: "Стара Загора", multiplier: 1.00 },
  ruse: { name: "Русе", multiplier: 0.95 },
  pleven: { name: "Плевен", multiplier: 0.92 },
  blagoevgrad: { name: "Благоевград", multiplier: 0.95 },
  veliko_tarnovo: { name: "Велико Търново", multiplier: 0.93 },
  
  // Черноморски курорти (по-високи заради сезонност)
  dobrich: { name: "Добрич", multiplier: 0.95 },
  
  // Северна България
  vidin: { name: "Видин", multiplier: 0.82 },
  montana: { name: "Монтана", multiplier: 0.83 },
  vratsa: { name: "Враца", multiplier: 0.85 },
  lovech: { name: "Ловеч", multiplier: 0.88 },
  gabrovo: { name: "Габрово", multiplier: 0.90 },
  targovishte: { name: "Търговище", multiplier: 0.85 },
  razgrad: { name: "Разград", multiplier: 0.84 },
  shumen: { name: "Шумен", multiplier: 0.88 },
  silistra: { name: "Силистра", multiplier: 0.82 },
  
  // Южна България
  pazardzhik: { name: "Пазарджик", multiplier: 0.92 },
  smolyan: { name: "Смолян", multiplier: 0.88 },
  kardzhali: { name: "Кърджали", multiplier: 0.85 },
  haskovo: { name: "Хасково", multiplier: 0.90 },
  yambol: { name: "Ямбол", multiplier: 0.88 },
  sliven: { name: "Сливен", multiplier: 0.88 },
  
  // Западна България
  pernik: { name: "Перник", multiplier: 0.95 },
  kyustendil: { name: "Кюстендил", multiplier: 0.87 }
};

const QUALITY_LEVELS = {
  economy: { name: "Икономичен", description: "Базови материали, стандартно изпълнение", color: "bg-blue-100 text-blue-800" },
  standard: { name: "Стандартен", description: "Качествени материали, професионално изпълнение", color: "bg-green-100 text-green-800" },
  premium: { name: "Премиум", description: "Първокласни материали, перфектно изпълнение", color: "bg-amber-100 text-amber-800" }
};

const PRICING_TYPES = {
  labor: { name: "Само труд", description: "Без материали - вие осигурявате материалите" },
  laborAndMaterial: { name: "Труд + материали", description: "Всичко включено - ние осигуряваме материалите" }
};

const PriceCalculator = () => {
  const { user, token } = useAuth();
  const [selectedItems, setSelectedItems] = useState([]);
  const [region, setRegion] = useState('sofia_city');
  const [pricingType, setPricingType] = useState('laborAndMaterial');
  const [qualityLevel, setQualityLevel] = useState('standard');
  
  // AI Blueprint Analysis state
  const [showBlueprintDialog, setShowBlueprintDialog] = useState(false);
  const [blueprintImage, setBlueprintImage] = useState(null);
  const [blueprintPreview, setBlueprintPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const blueprintInputRef = useRef(null);

  const handleBlueprintSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файлът е прекалено голям (макс. 10MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBlueprintImage(reader.result);
      setBlueprintPreview(reader.result);
      setAnalysisResult(null);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeBlueprint = async () => {
    if (!blueprintImage) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const res = await axios.post(`${CALC_API}/blueprint/analyze`, {
        image: blueprintImage
      });
      setAnalysisResult(res.data);
      toast.success('Чертежът е анализиран успешно!');
    } catch (err) {
      setAnalysisError(err.response?.data?.detail || 'Грешка при анализ на чертежа');
      toast.error('Грешка при анализ');
    }
    setAnalyzing(false);
  };

  const applyBlueprintToCalculator = () => {
    if (!analysisResult?.calculator_suggestions) return;
    
    const newItems = [...selectedItems];
    
    for (const suggestion of analysisResult.calculator_suggestions) {
      const category = suggestion.category;
      if (!PRICE_DATABASE[category]) continue;
      
      const existingIdx = newItems.findIndex(i => i.category === category);
      if (existingIdx >= 0) {
        newItems[existingIdx] = { ...newItems[existingIdx], quantity: suggestion.quantity };
      } else {
        newItems.push({
          id: category,
          category: category,
          quantity: suggestion.quantity
        });
      }
    }
    
    setSelectedItems(newItems);
    setShowBlueprintDialog(false);
    toast.success(`${analysisResult.calculator_suggestions.length} дейности са попълнени от чертежа!`);
  };

  const addItem = (categoryKey) => {
    const category = PRICE_DATABASE[categoryKey];
    setSelectedItems(prev => [...prev, {
      id: Date.now(),
      category: categoryKey,
      name: category.name,
      unit: category.unit,
      quantity: 0
    }]);
  };

  const updateQuantity = (id, quantity) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: parseFloat(quantity) || 0 } : item
    ));
  };

  const removeItem = (id) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const calculation = useMemo(() => {
    const regionMultiplier = REGIONAL_MULTIPLIERS[region].multiplier;
    
    let subtotal = 0;
    const itemDetails = selectedItems.map(item => {
      const prices = PRICE_DATABASE[item.category].prices[pricingType];
      const basePrice = prices[qualityLevel];
      const itemTotal = item.quantity * basePrice * regionMultiplier;
      subtotal += itemTotal;
      
      return {
        ...item,
        basePrice,
        total: itemTotal
      };
    });

    return {
      items: itemDetails,
      subtotal,
      regionMultiplier,
      regionName: REGIONAL_MULTIPLIERS[region].name,
      total: subtotal
    };
  }, [selectedItems, region, pricingType, qualityLevel]);

  // GA4: Track calculator submission when total changes
  useEffect(() => {
    if (calculation.total > 0 && selectedItems.length > 0) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'calculator_submit', {
          event_category: 'conversion',
          event_label: 'offer_generated',
          value: 1
        });
      }
    }
  }, [calculation.total]);

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="price-calculator">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <Calculator className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Калкулатор за ремонт
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Изчислете приблизителната цена на вашия строителен или ремонтен проект. 
            Цените са базирани на актуални пазарни данни за България (2025-2026).
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Category Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Изберете услуги
                </CardTitle>
                <CardDescription>Кликнете върху услугите, които ви трябват</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(PRICE_DATABASE).map(([key, category]) => {
                    const IconMap = { Paintbrush, Zap, Droplets, Boxes, LayoutGrid, Square, Layers, Hammer };
                    const Icon = IconMap[category.icon] || Boxes;
                    const isSelected = selectedItems.some(item => item.category === key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => addItem(key)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                          isSelected 
                            ? 'border-orange-400 bg-orange-50' 
                            : 'border-slate-200 hover:border-orange-300'
                        }`}
                        data-testid={`add-${key}`}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-orange-600' : 'text-slate-500'}`} />
                        <p className="font-medium text-sm">{category.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{category.unit}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Enter Quantities */}
            {selectedItems.length > 0 && (
              <Card className="animate-slideUp">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Въведете количества
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedItems.map(item => {
                    const category = PRICE_DATABASE[item.category];
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <Label className="font-medium">{item.name}</Label>
                          <p className="text-xs text-slate-500">{category.unitLabel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.quantity || ''}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-24 text-right"
                            placeholder="0"
                            data-testid={`quantity-${item.category}`}
                          />
                          <span className="text-sm text-slate-500 w-12">{item.unit}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Опции
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Type */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Тип ценообразуване</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(PRICING_TYPES).map(([key, type]) => (
                      <button
                        key={key}
                        onClick={() => setPricingType(key)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          pricingType === key 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`pricing-${key}`}
                      >
                        <p className="font-semibold">{type.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Level */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Ниво на качество</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(QUALITY_LEVELS).map(([key, level]) => (
                      <button
                        key={key}
                        onClick={() => setQualityLevel(key)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          qualityLevel === key 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`quality-${key}`}
                      >
                        <Badge className={`${level.color} mb-2`}>{level.name}</Badge>
                        <p className="text-xs text-slate-500">{level.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Регион</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger data-testid="region-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGIONAL_MULTIPLIERS).map(([key, reg]) => (
                        <SelectItem key={key} value={key}>
                          {reg.name} {reg.multiplier !== 1 && `(${reg.multiplier > 1 ? '+' : ''}${Math.round((reg.multiplier - 1) * 100)}%)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">
                    Цените варират според региона. София е с най-високи цени.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Price Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-orange-600" />
                  Обща цена
                </CardTitle>
                <CardDescription>
                  Ориентировъчна стойност за {calculation.regionName}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {calculation.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Изберете услуги и въведете количества</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {calculation.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                          <div className="flex-1">
                            <span className="text-slate-700 font-medium">{item.name}</span>
                            <span className="text-slate-400 ml-1">({item.quantity} {PRICE_DATABASE[item.category].unit})</span>
                          </div>
                          <span className="font-semibold text-slate-900 ml-3">
                            {item.total.toFixed(0)} €
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex justify-between">
                        <span>Тип:</span>
                        <span>{PRICING_TYPES[pricingType].name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Качество:</span>
                        <span>{QUALITY_LEVELS[qualityLevel].name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Регион:</span>
                        <span>{calculation.regionName}</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-700">
                        <span>Брой дейности:</span>
                        <span>{calculation.items.filter(i => i.quantity > 0).length}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="bg-slate-900 text-white rounded-lg p-5 text-center" data-testid="grand-total-box">
                      <p className="text-sm text-slate-300 mb-1">ОБЩА ЦЕНА ЗА ВСИЧКО</p>
                      <p className="text-4xl font-bold" data-testid="total-price">
                        {calculation.total.toFixed(0)} €
                      </p>
                      <p className="text-lg text-orange-400 font-semibold mt-1">
                        ≈ {(calculation.total * 1.95).toFixed(0)} лв.
                      </p>
                    </div>

                    {/* Download PDF button */}
                    {calculation.total > 0 && (
                      <Button 
                        className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                        onClick={async () => {
                          try {
                            const res = await axios.post(`${CALC_API}/calculator/pdf`, {
                              items: calculation.items,
                              regionName: calculation.regionName,
                              regionMultiplier: calculation.regionMultiplier,
                              pricingType,
                              qualityLevel,
                              total: calculation.total
                            }, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'temadom_kalkulaciya.pdf';
                            link.click();
                            window.URL.revokeObjectURL(url);
                            toast.success('PDF офертата е изтеглена');
                            // GA4: Track PDF download
                            if (typeof window.gtag === 'function') {
                              window.gtag('event', 'pdf_download', {
                                event_category: 'premium',
                                event_label: 'offer_pdf',
                                value: 10
                              });
                            }
                          } catch {
                            toast.error('Грешка при генериране на PDF');
                          }
                        }}
                        data-testid="download-pdf-btn"
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Изтегли PDF оферта
                      </Button>
                    )}

                    <p className="text-xs text-slate-500 mt-4 text-center">
                      * Цените са ориентировъчни и могат да варират в зависимост от специфичните условия на обекта.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Важна информация</p>
                <p>
                  Този калкулатор предоставя ориентировъчни цени базирани на средни пазарни стойности в България за 2025-2026 г. 
                  Реалните цени могат да варират в зависимост от: състоянието на обекта, достъпност, сложност на работата, 
                  сезонност и конкретния изпълнител. За точна оферта, моля свържете се с няколко фирми чрез нашата платформа.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile sticky total bar */}
      {calculation.total > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white px-4 py-3 shadow-2xl z-50 border-t border-slate-700" data-testid="mobile-total-bar">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div>
              <p className="text-xs text-slate-400">ОБЩА ЦЕНА</p>
              <p className="text-2xl font-bold">{calculation.total.toFixed(0)} € <span className="text-sm text-orange-400 font-normal">≈ {(calculation.total * 1.95).toFixed(0)} лв.</span></p>
            </div>
            <span className="text-xs text-slate-400">{calculation.items.filter(i => i.quantity > 0).length} дейности</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default PriceCalculator;
