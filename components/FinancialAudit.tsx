import React from 'react';
import { FinancialAudit as AuditType } from '../types';
import { TrendingDown, AlertTriangle, CloudUpload, Zap, TrendingUp, ArrowRight, Minus } from 'lucide-react';

interface Props {
  audit: AuditType;
  feedInTariff: number;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const FinancialAudit: React.FC<Props> = ({ audit, feedInTariff }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      
      {/* 1. Daily Net (Largest - 4 cols) */}
      <div className="lg:col-span-4 bg-brand-primary p-4 rounded-xl shadow-lg relative overflow-hidden group text-white flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2 relative z-10">
           <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">Daily Net</span>
           <Zap size={14} className="text-white" />
        </div>
        <div>
           <div className="text-3xl font-mono font-bold tracking-tight relative z-10">
             {formatCurrency(audit.netSavingsINR)}
           </div>
           <div className="mt-2 relative z-10 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold tracking-wide border border-white/20 uppercase inline-block">
                 Absolute Savings
              </span>
           </div>
        </div>
      </div>

      {/* 2. Utility Import (3 cols) */}
      <div className="lg:col-span-3 eng-card p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
           <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-widest">Utility Import</span>
           <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wide">
             {audit.totalGridImportMWh.toFixed(2)} MWh
           </span>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Scheduled/Actual */}
          <div className="flex items-end justify-between">
             <div className="flex flex-col">
                <span className="text-xl font-mono font-bold text-brand-text leading-none">{formatCurrency(audit.totalBillMicrogrid)}</span>
                <span className="text-[9px] font-bold text-brand-primary uppercase mt-1">Scheduled</span>
             </div>
          </div>
          
          {/* Divider */}
          <div className="h-px w-full bg-slate-100 border-t border-dashed border-slate-200"></div>

          {/* Baseline */}
          <div className="flex items-center justify-between opacity-80">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Baseline</span>
              <span className="text-xs font-mono font-medium text-slate-500">{formatCurrency(audit.baselineBillMicrogrid)}</span>
          </div>
        </div>
      </div>

      {/* 3. Export Revenue (3 cols) */}
      <div className="lg:col-span-3 eng-card p-4 flex flex-col justify-between h-full border-t-2 border-t-brand-accent">
        <div className="flex justify-between items-start mb-2">
           <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-widest">Export Revenue</span>
           <CloudUpload size={14} className="text-brand-accent" />
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Scheduled/Actual */}
          <div className="flex items-end justify-between">
             <div className="flex flex-col">
                <span className="text-xl font-mono font-bold text-brand-accent leading-none">+{formatCurrency(audit.totalRevenueINR)}</span>
                <span className="text-[9px] font-bold text-brand-accent uppercase mt-1">Scheduled</span>
             </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-slate-100 border-t border-dashed border-slate-200"></div>

          {/* Baseline */}
          <div className="flex items-center justify-between opacity-80">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Baseline</span>
              <span className="text-xs font-mono font-medium text-slate-500">{formatCurrency(audit.baselineRevenueINR)}</span>
          </div>
        </div>
      </div>

      {/* 4. Aux OpEx (Smallest - 2 cols) */}
      <div className={`lg:col-span-2 eng-card p-4 flex flex-col justify-between h-full transition-all duration-300 ${audit.totalDieselCostINR > 0 ? 'bg-red-50 border-red-200' : ''}`}>
        <div className="flex justify-between items-start mb-2">
           <span className={`text-[9px] font-bold uppercase tracking-widest truncate ${audit.totalDieselCostINR > 0 ? 'text-brand-danger' : 'text-brand-text-dim'}`}>Aux OpEx</span>
           {audit.totalDieselCostINR > 0 && <AlertTriangle size={14} className="text-brand-danger" />}
        </div>
        
        <div className="flex flex-col gap-2">
           {/* Scheduled */}
           <div className="flex flex-col">
              <span className={`text-xl font-mono font-bold leading-none ${audit.totalDieselCostINR > 0 ? 'text-brand-danger' : 'text-slate-700'}`}>
                {formatCurrency(audit.totalDieselCostINR)}
              </span>
              <span className={`text-[9px] font-bold uppercase mt-1 ${audit.totalDieselCostINR > 0 ? 'text-brand-danger' : 'text-slate-400'}`}>Scheduled</span>
           </div>

           {/* Divider */}
           <div className="h-px w-full bg-slate-200 border-t border-dashed border-slate-300"></div>

           {/* Baseline */}
           <div className="flex items-center justify-between">
               <span className="text-[8px] font-bold text-slate-400 uppercase">Base</span>
               <span className="text-[10px] font-mono font-medium text-slate-500">{formatCurrency(audit.baselineDieselCostINR)}</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default FinancialAudit;