import React, { useState } from 'react';
import { SimulationParams, SystemScenario, SystemStrategy } from '../types';
import { Sun, Battery, Clock, Loader2, Settings2, TrendingUp, Sparkles, Plus, Trash2, ShieldX, PowerOff, Fuel, ScanLine, ShieldAlert, ArrowUpFromLine, Wand2, ShieldCheck } from 'lucide-react';
import { fetchHourlyWeather } from '../services/geminiService';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  params: SimulationParams;
  onChange: (newParams: SimulationParams) => void;
}

const InputPanel: React.FC<Props> = ({ params, onChange }) => {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const handleChange = (field: keyof SimulationParams, value: any) => {
    onChange({ ...params, [field]: value });
  };

  const handleAutoSync = async () => {
    setIsAutoSyncing(true);
    try {
      const data = await fetchHourlyWeather();
      onChange({
        ...params,
        hourlyTemp: data.hourlyTemp,
        hourlyHumidity: data.hourlyHumidity,
        hourlyCloud: data.hourlyCloud,
        sunriseHour: data.sunriseHour,
        sunsetHour: data.sunsetHour
      });
    } catch (err) {
      alert("Failed to fetch real-time weather data.");
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const addOutage = (type: 'import' | 'export') => {
    const field = type === 'import' ? 'importOutages' : 'exportOutages';
    handleChange(field, [...params[field], { start: 12, end: 14 }]);
  };

  const removeOutage = (type: 'import' | 'export', index: number) => {
    const field = type === 'import' ? 'importOutages' : 'exportOutages';
    const newList = [...params[field]];
    newList.splice(index, 1);
    handleChange(field, newList);
  };

  const updateOutage = (type: 'import' | 'export', index: number, field: 'start' | 'end', value: number) => {
    const outageField = type === 'import' ? 'importOutages' : 'exportOutages';
    const newList = [...params[outageField]];
    newList[index] = { ...newList[index], [field]: Math.min(23, Math.max(0, value)) };
    handleChange(outageField, newList);
  };

  const chartData = params.hourlyTemp.map((t, i) => ({
    hour: i,
    temp: t,
    humid: params.hourlyHumidity[i],
    cloud: params.hourlyCloud[i]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-brand-border p-3 rounded-lg shadow-xl">
          <div className="text-[10px] font-bold text-brand-text-dim mb-2 uppercase tracking-wide">
             {label < 10 ? `0${label}` : label}:00 HOURS
          </div>
          {payload.map((entry: any, index: number) => {
            let name = entry.name;
            let unit = '';
            if (name === 'temp') { name = 'TEMP'; unit = '°C'; }
            if (name === 'humid') { name = 'HUMID'; unit = '%'; }
            if (name === 'cloud') { name = 'CLOUD'; unit = '%'; }
            
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-xs font-mono font-bold mb-1 last:mb-0">
                <span style={{ color: entry.color }} className="uppercase">{name}</span>
                <span className="text-brand-text">
                  {Math.round(entry.value)}<span className="text-brand-text-dim/80 ml-0.5">{unit}</span>
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      
      {/* LEFT: ASSET STACK (Col Span 3) */}
      <div className="xl:col-span-3 eng-card p-6 flex flex-col h-full justify-between">
        <div>
          <h2 className="text-[11px] font-bold text-brand-primary uppercase tracking-widest border-b border-brand-border pb-4 flex items-center gap-2">
            <Battery size={14} className="text-brand-accent" /> Asset Stack
          </h2>
          
          <div className="space-y-6 mt-6">
            <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wide">Storage Capacity (MWh)</label>
                <input 
                  type="number" step="0.1" 
                  value={params.batteryCapacityMWh} 
                  onChange={(e) => handleChange('batteryCapacityMWh', parseFloat(e.target.value))} 
                  className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text" 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-text-dim uppercase">Max Charge (MW)</label>
                <input 
                  type="number" step="0.1" 
                  value={params.maxChargeRateMW} 
                  onChange={(e) => handleChange('maxChargeRateMW', parseFloat(e.target.value))} 
                  className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-text-dim uppercase">Max Discharge (MW)</label>
                <input 
                  type="number" step="0.1" 
                  value={params.maxDischargeRateMW} 
                  onChange={(e) => handleChange('maxDischargeRateMW', parseFloat(e.target.value))} 
                  className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-1.5">
                 <label className="text-[9px] font-bold text-brand-text-dim uppercase">Min SoC (%)</label>
                 <input 
                   type="number" min="0" max="100" step="1" 
                   value={params.minSocPercent} 
                   onChange={(e) => handleChange('minSocPercent', parseFloat(e.target.value))} 
                   className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text" 
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-bold text-brand-text-dim uppercase">Max SoC (%)</label>
                 <input 
                   type="number" min="0" max="100" step="1" 
                   value={params.maxSocPercent} 
                   onChange={(e) => handleChange('maxSocPercent', parseFloat(e.target.value))} 
                   className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text" 
                 />
               </div>
            </div>

            <div className="pt-4 border-t border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine size={14} className="text-brand-text-dim" />
                  <span className="text-[10px] font-bold text-brand-text uppercase">Enable Battery Export</span>
                </div>
                <button 
                  onClick={() => handleChange('allowBatteryExport', !params.allowBatteryExport)} 
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${params.allowBatteryExport ? 'bg-brand-accent' : 'bg-brand-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm`} style={{ left: params.allowBatteryExport ? '22px' : '2px' }}></div>
                </button>
              </div>
              <p className="text-[9px] text-brand-text-dim leading-relaxed font-medium">
                Battery export reduces savings due to tariff mismatch and SOC loss. Enable only for regulatory/mandatory export scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: WEATHER MONITOR ONLY (Col Span 6) */}
      <div className="xl:col-span-6 eng-card p-0 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-[11px] font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
            <ScanLine size={14} /> Weather Monitor
          </h2>
          <button 
            onClick={handleAutoSync} 
            disabled={isAutoSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-primary hover:text-brand-primary transition-all text-[9px] font-bold text-brand-text-dim disabled:opacity-50"
          >
            {isAutoSyncing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            AUTO SYNC
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6 flex-grow">
          {/* Time Controls */}
          <div className="grid grid-cols-3 gap-6 shrink-0">
             <div className="space-y-1">
                 <label className="text-[9px] font-bold text-brand-text-dim uppercase flex items-center gap-1"><Clock size={10}/> Sunrise</label>
                 <input 
                   type="time" 
                   className="w-full eng-input px-3 py-2 text-xs font-mono"
                   value={`${Math.floor(params.sunriseHour).toString().padStart(2,'0')}:${Math.round((params.sunriseHour%1)*60).toString().padStart(2,'0')}`}
                   onChange={(e) => {
                     const [h, m] = e.target.value.split(':').map(Number);
                     handleChange('sunriseHour', h + m/60);
                   }}
                 />
             </div>
             <div className="space-y-1">
                 <label className="text-[9px] font-bold text-brand-text-dim uppercase flex items-center gap-1"><Clock size={10}/> Sunset</label>
                 <input 
                   type="time" 
                   className="w-full eng-input px-3 py-2 text-xs font-mono"
                   value={`${Math.floor(params.sunsetHour).toString().padStart(2,'0')}:${Math.round((params.sunsetHour%1)*60).toString().padStart(2,'0')}`}
                   onChange={(e) => {
                     const [h, m] = e.target.value.split(':').map(Number);
                     handleChange('sunsetHour', h + m/60);
                   }}
                 />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wider flex items-center gap-2">
                  <Sun size={12} className="text-brand-warning" /> Solar Cap (MW)
                </label>
                <input 
                  type="number" step={0.1}
                  value={params.solarCapacityMW}
                  onChange={(e) => handleChange('solarCapacityMW', parseFloat(e.target.value))} 
                  className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text shadow-sm"
                />
             </div>
          </div>

          {/* Visualization - Expanded Height */}
          <div className="flex-grow w-full relative border border-brand-border rounded-lg bg-white overflow-hidden p-2 min-h-[280px]">
             <div className="absolute top-3 left-3 z-10 flex gap-2">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> TEMP
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> HUMID
                </span>
                 <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> CLOUD
                </span>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{top: 30, right: 10, left: -20, bottom: 0}}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                     dataKey="hour" 
                     tick={{fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#94a3b8'}} 
                     axisLine={false} 
                     tickLine={false} 
                     tickFormatter={(val) => val % 4 === 0 ? `${val}:00` : ''} 
                     interval={0}
                   />
                   <YAxis yAxisId="left" domain={[0, 50]} hide />
                   <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                   <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                   <Area yAxisId="right" type="monotone" dataKey="humid" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={1.5} name="humid" />
                   <Bar yAxisId="right" dataKey="cloud" fill="#64748b" opacity={0.2} barSize={6} name="cloud" />
                   <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#dc2626" strokeWidth={2.5} dot={false} name="temp" />
                </ComposedChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RIGHT: GRID CONSTRAINTS & AUX (Col Span 3) */}
      <div className="xl:col-span-3 flex flex-col gap-6 h-full">
         <div className="eng-card p-6 flex flex-col flex-grow">
           <h2 className="text-[11px] font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-brand-border pb-4">
              <ShieldAlert size={14} className="text-brand-danger" /> Grid Constraints
           </h2>
           
           <div className="space-y-8 flex-grow">
              {/* Import Outages */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-text-dim uppercase tracking-wide">
                    <PowerOff size={12} className="text-brand-primary"/> Import Outages
                  </div>
                  <button 
                    onClick={() => addOutage('import')} 
                    className="px-2 py-1 rounded border border-brand-border hover:border-brand-primary hover:text-brand-primary transition-all text-[10px] font-bold flex items-center gap-1 bg-white text-brand-text-dim"
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scroll pr-2">
                  {params.importOutages.map((o, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-brand-panel p-2 rounded-md border border-brand-border">
                      <div className="flex-grow grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-brand-text-dim">START</span>
                          <input type="number" min="0" max="23" value={o.start} onChange={(e) => updateOutage('import', idx, 'start', parseInt(e.target.value))} className="w-10 bg-white border border-brand-border rounded px-1 py-0.5 font-mono text-xs font-medium text-brand-text focus:border-brand-primary outline-none text-center" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-brand-text-dim">END</span>
                          <input type="number" min="0" max="23" value={o.end} onChange={(e) => updateOutage('import', idx, 'end', parseInt(e.target.value))} className="w-10 bg-white border border-brand-border rounded px-1 py-0.5 font-mono text-xs font-medium text-brand-text focus:border-brand-primary outline-none text-center" />
                        </div>
                      </div>
                      <button onClick={() => removeOutage('import', idx)} className="p-1 text-brand-text-dim hover:text-brand-danger transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {params.importOutages.length === 0 && (
                    <div className="py-2.5 text-center border border-dashed border-brand-border rounded-md bg-brand-bg">
                      <p className="text-[10px] text-brand-text-dim font-medium">No outages scheduled</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Outages */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-text-dim uppercase tracking-wide">
                    <ShieldX size={12} className="text-brand-accent"/> Export Limits
                  </div>
                  <button 
                    onClick={() => addOutage('export')} 
                    className="px-2 py-1 rounded border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-all text-[10px] font-bold flex items-center gap-1 bg-white text-brand-text-dim"
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scroll pr-2">
                  {params.exportOutages.map((o, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-brand-panel p-2 rounded-md border border-brand-border">
                      <div className="flex-grow grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-brand-text-dim">START</span>
                          <input type="number" min="0" max="23" value={o.start} onChange={(e) => updateOutage('export', idx, 'start', parseInt(e.target.value))} className="w-10 bg-white border border-brand-border rounded px-1 py-0.5 font-mono text-xs font-medium text-brand-text focus:border-brand-accent outline-none text-center" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-brand-text-dim">END</span>
                          <input type="number" min="0" max="23" value={o.end} onChange={(e) => updateOutage('export', idx, 'end', parseInt(e.target.value))} className="w-10 bg-white border border-brand-border rounded px-1 py-0.5 font-mono text-xs font-medium text-brand-text focus:border-brand-accent outline-none text-center" />
                        </div>
                      </div>
                      <button onClick={() => removeOutage('export', idx)} className="p-1 text-brand-text-dim hover:text-brand-danger transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {params.exportOutages.length === 0 && (
                    <div className="py-2.5 text-center border border-dashed border-brand-border rounded-md bg-brand-bg">
                      <p className="text-[10px] text-brand-text-dim font-medium">Unrestricted export</p>
                    </div>
                  )}
                </div>
              </div>
           </div>

           <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-brand-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={14} className="text-brand-primary" />
                <span className="text-[10px] font-bold text-brand-primary uppercase">System Ready</span>
              </div>
              <p className="text-[9px] text-brand-text-dim font-medium leading-relaxed">
                Active Strategy: Economic Arbitrage Mode (Fixed).
              </p>
           </div>
        </div>

        {/* Aux Gen Spec (Moved from Center to Right) */}
        <div className="eng-card p-6 shrink-0">
          <h3 className="text-[11px] font-bold text-brand-text-dim uppercase tracking-wide flex items-center gap-2 mb-4 border-b border-brand-border pb-2">
             <Fuel size={14} className="text-brand-danger" /> Aux Gen Specification
          </h3>
          <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-brand-text-dim uppercase">Capacity (MW)</label>
                  <input 
                      type="number" step="0.1" 
                      value={params.dieselCapacityMW} 
                      onChange={(e) => handleChange('dieselCapacityMW', parseFloat(e.target.value))} 
                      className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text"
                  />
              </div>
              <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-brand-text-dim uppercase">Fuel Cost (INR/kWh)</label>
                  <input 
                      type="number" step="1" 
                      value={params.dieselFuelCostINR} 
                      onChange={(e) => handleChange('dieselFuelCostINR', parseFloat(e.target.value))} 
                      className="w-full eng-input px-3 py-2 text-xs font-mono font-medium text-brand-text"
                  />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;