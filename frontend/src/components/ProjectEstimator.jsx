import React, { useState, useMemo } from 'react';
import { Calculator, Plus, X, Euro, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Simplified price database for quick estimation
const QUICK_PRICES = {
  painting: { name: "Боядисване", unit: "м²", price: 6 },
  plastering: { name: "Шпакловка", unit: "м²", price: 7 },
  screed: { name: "Замазка", unit: "м²", price: 30 },
  electrical: { name: "Ел. инсталация", unit: "точки", price: 50 },
  plumbing: { name: "ВиК инсталация", unit: "точки", price: 110 },
  tiling: { name: "Фаянс и теракот", unit: "м²", price: 65 },
  flooring: { name: "Подови настилки", unit: "м²", price: 40 },
  demolition: { name: "Изкъртване", unit: "м²", price: 18 },
  drywall: { name: "Гипсокартон", unit: "м²", price: 28 },
  windows: { name: "Дограма", unit: "бр", price: 280 },
  insulation: { name: "Топлоизолация", unit: "м²", price: 40 },
  concrete: { name: "Бетон", unit: "м³", price: 100 },
  excavation: { name: "Изкопни работи", unit: "м³", price: 30 },
  roofing: { name: "Покриви", unit: "м²", price: 70 },
  waterproofing: { name: "Хидроизолация", unit: "м²", price: 25 }
};

const REGIONS = {
  sofia_city: { name: "София (столица)", multiplier: 1.20 },
  sofia_oblast: { name: "Софийска област", multiplier: 1.05 },
  plovdiv: { name: "Пловдив", multiplier: 1.05 },
  varna: { name: "Варна", multiplier: 1.08 },
  burgas: { name: "Бургас", multiplier: 1.05 },
  stara_zagora: { name: "Стара Загора", multiplier: 0.98 },
  ruse: { name: "Русе", multiplier: 0.95 },
  pleven: { name: "Плевен", multiplier: 0.92 },
  blagoevgrad: { name: "Благоевград", multiplier: 0.95 },
  veliko_tarnovo: { name: "Велико Търново", multiplier: 0.93 },
  dobrich: { name: "Добрич", multiplier: 0.95 },
  vidin: { name: "Видин", multiplier: 0.82 },
  montana: { name: "Монтана", multiplier: 0.83 },
  vratsa: { name: "Враца", multiplier: 0.85 },
  lovech: { name: "Ловеч", multiplier: 0.88 },
  gabrovo: { name: "Габрово", multiplier: 0.90 },
  targovishte: { name: "Търговище", multiplier: 0.85 },
  razgrad: { name: "Разград", multiplier: 0.84 },
  shumen: { name: "Шумен", multiplier: 0.88 },
  silistra: { name: "Силистра", multiplier: 0.82 },
  pazardzhik: { name: "Пазарджик", multiplier: 0.92 },
  smolyan: { name: "Смолян", multiplier: 0.88 },
  kardzhali: { name: "Кърджали", multiplier: 0.85 },
  haskovo: { name: "Хасково", multiplier: 0.90 },
  yambol: { name: "Ямбол", multiplier: 0.88 },
  sliven: { name: "Сливен", multiplier: 0.88 },
  pernik: { name: "Перник", multiplier: 0.95 },
  kyustendil: { name: "Кюстендил", multiplier: 0.87 }
};

// Mini calculator for project creation
const ProjectEstimator = ({ onEstimateChange, initialCity = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [region, setRegion] = useState(() => {
    // Try to match city to region
    const cityLower = initialCity.toLowerCase();
    if (cityLower.includes('софия')) return 'sofia';
    if (cityLower.includes('пловдив')) return 'plovdiv';
    if (cityLower.includes('варна')) return 'varna';
    if (cityLower.includes('бургас')) return 'burgas';
    return 'other';
  });

  const addService = (key) => {
    if (!selectedServices.find(s => s.key === key)) {
      setSelectedServices(prev => [...prev, { key, quantity: 0 }]);
    }
  };

  const updateQuantity = (key, quantity) => {
    setSelectedServices(prev => 
      prev.map(s => s.key === key ? { ...s, quantity: parseFloat(quantity) || 0 } : s)
    );
  };

  const removeService = (key) => {
    setSelectedServices(prev => prev.filter(s => s.key !== key));
  };

  const estimate = useMemo(() => {
    const multiplier = REGIONS[region]?.multiplier || 1;
    let total = 0;
    
    selectedServices.forEach(service => {
      const priceData = QUICK_PRICES[service.key];
      if (priceData && service.quantity > 0) {
        total += service.quantity * priceData.price * multiplier;
      }
    });

    return Math.round(total);
  }, [selectedServices, region]);

  // Notify parent of estimate change - use ref to avoid infinite loop
  const prevEstimateRef = React.useRef(null);
  React.useEffect(() => {
    if (onEstimateChange && prevEstimateRef.current !== estimate) {
      prevEstimateRef.current = estimate;
      onEstimateChange(estimate > 0 ? estimate : null);
    }
  }, [estimate]);

  return (
    <Card className="border-[#d4a43a]/20 bg-[#d4a43a]/5/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-[#d4a43a]/10/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="bg-[#d4a43a]/10 p-2 rounded-lg">
                <Calculator className="h-5 w-5 text-[#d4a43a]" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Добави оценка на бюджета</h4>
                <p className="text-sm theme-text-subtle">Помогнете на майсторите да разберат мащаба на проекта</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {estimate > 0 && (
                <Badge className="bg-orange-600 text-white text-base px-3 py-1">
                  ~{estimate} €
                </Badge>
              )}
              {isOpen ? <ChevronUp className="h-5 w-5 theme-text-muted" /> : <ChevronDown className="h-5 w-5 theme-text-muted" />}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="border-t border-[#d4a43a]/20 pt-4">
              {/* Region selector */}
              <div className="mb-4">
                <Label className="text-sm">Регион</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIONS).map(([key, reg]) => (
                      <SelectItem key={key} value={key}>{reg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service buttons */}
              <div className="mb-4">
                <Label className="text-sm mb-2 block">Добави услуги</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(QUICK_PRICES).slice(0, 8).map(([key, service]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addService(key)}
                      disabled={selectedServices.find(s => s.key === key)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {service.name}
                    </Button>
                  ))}
                </div>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-2 text-[#d4a43a]">
                      Още услуги...
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(QUICK_PRICES).slice(8).map(([key, service]) => (
                        <Button
                          key={key}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addService(key)}
                          disabled={selectedServices.find(s => s.key === key)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {service.name}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Selected services */}
              {selectedServices.length > 0 && (
                <div className="space-y-2 mb-4">
                  {selectedServices.map(service => {
                    const priceData = QUICK_PRICES[service.key];
                    return (
                      <div key={service.key} className="flex items-center gap-2  rounded-lg p-2 border border-orange-100">
                        <span className="flex-1 text-sm font-medium">{priceData.name}</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={service.quantity || ''}
                          onChange={(e) => updateQuantity(service.key, e.target.value)}
                          placeholder="0"
                          className="w-20 h-8 text-sm text-right"
                        />
                        <span className="text-xs theme-text-subtle w-12">{priceData.unit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.key)}
                          className="h-8 w-8 p-0 theme-text-muted hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Estimate display */}
              {estimate > 0 && (
                <div className="bg-slate-900 text-white rounded-lg p-4 text-center">
                  <p className="text-sm theme-text-muted mb-1">Приблизителна оценка</p>
                  <p className="text-2xl font-bold">{estimate} €</p>
                  <p className="text-sm theme-text-muted">EUR</p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-3 text-xs theme-text-subtle">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>Цените са ориентировъчни (стандартно качество, труд + материали). Служат за ориентир на майсторите.</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ProjectEstimator;
