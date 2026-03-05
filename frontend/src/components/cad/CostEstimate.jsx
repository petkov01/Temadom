// TemaDom IA CAD v5.1 — Auto Cost Estimate with Regional Pricing
import React from 'react';
import { EUR_TO_BGN } from './constants';
import { calculateCosts, REGIONS } from './utils';

export const CostEstimate = ({ els, scale, region, onRegionChange }) => {
  const { items, totalEur, totalBgn } = calculateCosts(els, scale, region);
  const currentRegion = REGIONS.find(r => r.id === region) || REGIONS[1];

  if (!items.length) return null;

  return (
    <div data-testid="cost-estimate">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">Авто-сметка</span>
        <span className="text-[#28A745] text-xs font-bold">{totalEur.toLocaleString()} EUR / {totalBgn.toLocaleString()} BGN</span>
      </div>

      {/* Region selector */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-slate-500 text-[10px]">Регион:</span>
        <select
          value={region}
          onChange={e => onRegionChange(e.target.value)}
          className="bg-[#1E2A38] border border-[#3A4A5C] text-white text-[10px] rounded px-2 py-1 outline-none"
          data-testid="region-select"
        >
          {REGIONS.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.multiplier > 1 ? '+' : ''}{((r.multiplier - 1) * 100).toFixed(0)}%)</option>
          ))}
        </select>
        <span className="text-slate-600 text-[9px]">x{currentRegion.multiplier}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-slate-500 border-b border-[#2A3A4C]">
              <th className="text-left py-1 font-medium">Позиция</th>
              <th className="text-right py-1 font-medium">Кол.</th>
              <th className="text-right py-1 font-medium">Ед.</th>
              <th className="text-right py-1 font-medium">Цена</th>
              <th className="text-right py-1 font-medium">Сума EUR</th>
              <th className="text-right py-1 font-medium">Сума BGN</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-[#2A3A4C]/50 text-slate-300">
                <td className="py-1">{it.label}</td>
                <td className="text-right py-1">{it.qty}</td>
                <td className="text-right py-1 text-slate-500">{it.unit}</td>
                <td className="text-right py-1">{it.price} EUR</td>
                <td className="text-right py-1 text-[#FF8C42] font-medium">{it.total.toLocaleString()}</td>
                <td className="text-right py-1 text-[#4DA6FF]">{(it.total * EUR_TO_BGN).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#FF8C42]/30 font-bold text-white">
              <td colSpan={4} className="py-2">ОБЩО</td>
              <td className="text-right py-2 text-[#FF8C42]">{totalEur.toLocaleString()} EUR</td>
              <td className="text-right py-2 text-[#4DA6FF]">{totalBgn.toLocaleString()} BGN</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
