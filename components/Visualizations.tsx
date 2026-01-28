import React from 'react';
import { HourlyData, FinancialAudit } from '../types';
import {
  ComposedChart,
  LineChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
} from 'recharts';
import { Table, ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  data: HourlyData[];
  audit?: FinancialAudit;
}

const Visualizations: React.FC<Props> = ({ data, audit }) => {
  // INDUSTRIAL PALETTE
  const COLORS = {
    primary: '#1e3a8a', // Navy
    accent: '#059669',  // Emerald
    danger: '#dc2626',  // Red
    warning: '#d97706', // Amber
    slate: '#64748b',   // Slate 500
    grid: '#e2e8f0',    // Slate 200
    text: '#64748b',    // Slate 500
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1'
  };

  const formatNum = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 1 });
  const formatCurrency = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Comparison Table */}
      {audit && (
        <div className="eng-card overflow-hidden h-full flex flex-col">
          <div className="px-6 py-4 bg-brand-panel border-b border-brand-border flex items-center gap-3 shrink-0">
             <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md border border-brand-border text-brand-primary">
               <Table size={16} />
             </div>
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Performance Benchmark</h3>
               <p className="text-[9px] font-medium text-brand-text-dim uppercase tracking-wide">Baseline (Standard) vs. Scheduled (Arbitrage)</p>
             </div>
          </div>
          <div className="overflow-x-auto flex-grow">
             <table className="w-full text-left text-[11px] font-sans h-full">
                <thead className="bg-white border-b border-brand-border">
                  <tr>
                    <th className="px-6 py-3 font-bold text-brand-text-dim uppercase tracking-wider w-1/4">Metric</th>
                    <th className="px-6 py-3 font-bold text-brand-text-dim uppercase tracking-wider w-1/4">Baseline</th>
                    <th className="px-6 py-3 font-bold text-brand-primary uppercase tracking-wider w-1/4 bg-blue-50/50">Scheduled</th>
                    <th className="px-6 py-3 font-bold text-brand-accent uppercase tracking-wider w-1/4">Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border bg-white">
                   <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-brand-text">Grid Energy (kWh)</td>
                      <td className="px-6 py-3 font-mono text-slate-500">{(audit.baselineGridImportMWh * 1000).toFixed(0)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-primary bg-blue-50/30">{(audit.totalGridImportMWh * 1000).toFixed(0)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-accent flex items-center gap-1">
                        {(audit.baselineGridImportMWh - audit.totalGridImportMWh) * 1000 > 0 ? <ArrowDownRight size={12}/> : <ArrowUpRight size={12}/>}
                        {Math.abs((audit.baselineGridImportMWh - audit.totalGridImportMWh) * 1000).toFixed(0)}
                      </td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-brand-text">Diesel Energy (kWh)</td>
                      <td className="px-6 py-3 font-mono text-slate-500">{(audit.baselineDieselMWh * 1000).toFixed(0)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-primary bg-blue-50/30">{(audit.totalDieselMWh * 1000).toFixed(0)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-accent flex items-center gap-1">
                         {(audit.baselineDieselMWh - audit.totalDieselMWh) * 1000 > 0 ? <ArrowDownRight size={12}/> : <ArrowRight size={12} className="text-slate-300"/>}
                         {Math.abs((audit.baselineDieselMWh - audit.totalDieselMWh) * 1000).toFixed(0)}
                      </td>
                   </tr>
                   <tr className="hover:bg-slate-50 bg-slate-50/50">
                      <td className="px-6 py-3 font-bold text-brand-text">Total Cost (INR)</td>
                      <td className="px-6 py-3 font-mono text-slate-500">{formatCurrency(audit.baselineNetCost)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-primary bg-blue-50/30">{formatCurrency(audit.actualNetCost)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-accent flex items-center gap-1">
                         {audit.arbitrageSavings >= 0 ? <ArrowDownRight size={12}/> : <ArrowUpRight size={12} className="text-red-500"/>}
                         {formatCurrency(Math.abs(audit.arbitrageSavings))}
                      </td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-brand-text">Battery Cycles</td>
                      <td className="px-6 py-3 font-mono text-slate-500">{audit.baselineBatteryCycles.toFixed(2)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-primary bg-blue-50/30">{audit.actualBatteryCycles.toFixed(2)}</td>
                      <td className="px-6 py-3 font-mono text-slate-400">—</td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-brand-text">Peak Grid Import (MW)</td>
                      <td className="px-6 py-3 font-mono text-slate-500">{audit.baselinePeakGridMW.toFixed(2)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-primary bg-blue-50/30">{audit.actualPeakGridMW.toFixed(2)}</td>
                      <td className="px-6 py-3 font-mono font-bold text-brand-accent flex items-center gap-1">
                         {audit.baselinePeakGridMW - audit.actualPeakGridMW > 0.01 ? <ArrowDownRight size={12}/> : <ArrowRight size={12} className="text-slate-300"/>}
                         {Math.abs(audit.baselinePeakGridMW - audit.actualPeakGridMW).toFixed(2)}
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* 2. Power Dispatch Graph */}
      <div className="eng-card p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
             <div className="space-y-0.5">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-dim">Power Dispatch</h3>
                <p className="text-[9px] text-brand-primary font-bold tracking-wide uppercase">24-Hour Generation vs Load (MW)</p>
             </div>
             <div className="flex gap-4 text-[9px] uppercase font-mono font-bold text-brand-text-dim">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-brand-warning rounded-full"></span> GEN</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-800 rounded-full"></span> LOAD</div>
             </div>
          </div>
          <div className="h-[300px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="hour" stroke={COLORS.text} tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="power" stroke={COLORS.text} tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.tooltipBorder}`, fontSize: '12px', backgroundColor: '#fff', color: '#0f172a', fontFamily: 'JetBrains Mono', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '12px' }}
                  cursor={{ stroke: COLORS.grid, strokeWidth: 1 }}
                />
                <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={8} wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', fontWeight: 700, opacity: 0.6, paddingBottom: '10px'}}/>
                <Area yAxisId="power" type="monotone" dataKey="solarMW" fill={COLORS.warning} stroke={COLORS.warning} fillOpacity={0.15} name="SOLAR" strokeWidth={2} />
                <Line yAxisId="power" type="stepAfter" dataKey="adjustedLoadMW" stroke="#1e293b" strokeWidth={2} dot={false} name="LOAD" strokeDasharray="4 4" opacity={0.8} />
                <Bar yAxisId="power" dataKey="gridImportMW" stackId="a" fill={COLORS.primary} name="GRID IMPORT" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar yAxisId="power" dataKey="dieselMW" stackId="a" fill={COLORS.danger} name="AUX GEN" barSize={12} />
                <Bar yAxisId="power" dataKey="gridExportMW" fill={COLORS.accent} name="EXPORT" barSize={12} radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* 3. Storage SoC Profile */}
      <div className="eng-card p-6 h-full flex flex-col">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-dim mb-8 shrink-0">Storage SoC Profile</h3>
          <div className="h-[300px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="hour" stroke={COLORS.text} tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} stroke={COLORS.text} tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.tooltipBorder}`, fontSize: '12px', backgroundColor: '#fff', color: '#0f172a', fontFamily: 'JetBrains Mono', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="socStatePercent" stroke={COLORS.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorSoc)" name="CHARGE LEVEL %" />
                <ReferenceLine y={20} stroke={COLORS.danger} strokeDasharray="3 3" />
                <ReferenceLine y={95} stroke={COLORS.accent} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Tariff Structure */}
        <div className="eng-card p-6 border-l-4 border-l-brand-primary h-full flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
             <div className="space-y-0.5 max-w-[80%]">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-text-dim">Research Tariff Model (24-Hour Granular ToU Pricing)</h3>
                <p className="text-[9px] text-brand-primary font-bold tracking-wide uppercase leading-relaxed mt-1">
                  Used to test arbitrage performance. Actual grid tariffs follow broader time blocks. You may manually change tariff price in dispatch log.
                </p>
             </div>
          </div>
          <div className="h-[300px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="hour" stroke={COLORS.text} tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600}} axisLine={false} tickLine={false} />
                <YAxis stroke={COLORS.text} tick={{fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toFixed(2)}/kWh`]}
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.tooltipBorder}`, fontSize: '12px', backgroundColor: '#fff', color: '#0f172a', fontFamily: 'JetBrains Mono', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Legend verticalAlign="top" align="right" height={30} iconType="line" iconSize={12} wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', fontWeight: 700, opacity: 0.6, paddingBottom: '10px'}}/>
                <Line type="stepAfter" dataKey="priceINR" stroke={COLORS.primary} strokeWidth={3} dot={false} name="IMPORT RATE" />
                <ReferenceLine y={4.8} stroke={COLORS.accent} strokeDasharray="3 3" label={{ value: 'FEED-IN (₹4.8)', position: 'insideTopRight', fill: COLORS.accent, fontSize: 9, fontWeight: 700 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
    </div>
  );
};

export default Visualizations;