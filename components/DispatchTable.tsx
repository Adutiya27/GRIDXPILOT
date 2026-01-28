import React, { useState } from 'react';
import { HourlyData } from '../types';
import { Edit2, Save, CloudUpload, AlertTriangle, Layers, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  data: HourlyData[];
  onUpdateLoad: (hour: number, newLoad: number) => void;
  onUpdateTariff: (hour: number, newTariff: number) => void;
}

const DispatchTable: React.FC<Props> = ({ data, onUpdateLoad, onUpdateTariff }) => {
  const [editingCell, setEditingCell] = useState<{hour: number, field: 'load' | 'tariff'} | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEditStart = (hour: number, currentValue: number, field: 'load' | 'tariff') => {
    setEditingCell({ hour, field });
    setEditValue(currentValue.toString());
  };

  const handleSave = () => {
    if (editingCell) {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val >= 0) {
        if (editingCell.field === 'load') {
          onUpdateLoad(editingCell.hour, val);
        } else {
          onUpdateTariff(editingCell.hour, val);
        }
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const avgPrice = data.reduce((acc, curr) => acc + curr.priceINR, 0) / data.length;

  return (
    <div className="w-full eng-card overflow-hidden flex flex-col">
      <div className="px-6 py-4 bg-brand-panel border-b border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md border border-brand-border text-brand-primary">
             <Layers size={16} />
           </div>
           <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Dispatch Log</h3>
             <p className="text-[9px] font-medium text-brand-text-dim uppercase tracking-wide">Hour-by-Hour Vectors</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wider px-2 py-1 rounded border border-brand-border bg-white">
             Resolution: 60 MIN
           </span>
           <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wider px-2 py-1 rounded border border-brand-border bg-white">
             Unit: MW
           </span>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[1100px] divide-y divide-brand-border text-[11px] font-sans">
          <thead className="bg-white">
            <tr>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-text-dim uppercase tracking-wider">HOUR</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-text-dim uppercase tracking-wider">TARIFF</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-text-dim uppercase tracking-wider">SIGNAL</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-text uppercase tracking-wider">LOAD</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-warning uppercase tracking-wider">SOLAR</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-primary uppercase tracking-wider">GRID</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-danger uppercase tracking-wider">AUX</th>
              <th className="px-4 py-3 text-left text-[9px] font-bold text-brand-text-dim uppercase tracking-wider">SOC %</th>
              <th className="px-4 py-3 text-right text-[9px] font-bold text-brand-accent uppercase tracking-wider">NET SAVING</th>
              <th className="px-4 py-3 text-right text-[9px] font-bold text-brand-text-dim uppercase tracking-wider">STATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border bg-white">
            {data.map((row) => {
              const isCheap = row.priceINR < avgPrice * 0.8;
              const isExpensive = row.priceINR > avgPrice * 1.2;
              const isEditingLoad = editingCell?.hour === row.hour && editingCell?.field === 'load';
              const isEditingTariff = editingCell?.hour === row.hour && editingCell?.field === 'tariff';
              
              return (
                <tr key={row.hour} className={`group hover:bg-slate-50 ${row.dieselMW > 0 ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2.5 text-brand-text-dim font-mono font-medium">{row.hour.toString().padStart(2, '0')}:00</td>
                  <td className="px-4 py-2.5">
                    {isEditingTariff ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-16 eng-input px-2 py-1 text-xs font-mono font-bold text-brand-primary" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button onClick={handleSave} className="text-brand-accent hover:text-emerald-700 transition-colors"><Save size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <span className="font-mono font-medium text-brand-text-dim">₹{row.priceINR.toFixed(2)}</span>
                         <button onClick={() => handleEditStart(row.hour, row.priceINR, 'tariff')} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-primary transition-all">
                           <Edit2 size={10}/>
                         </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {isCheap ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 w-fit rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-200 uppercase tracking-wide">
                        <TrendingDown size={10} /> BUY
                      </div>
                    ) : isExpensive ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 w-fit rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-200 uppercase tracking-wide">
                        <TrendingUp size={10} /> SELL
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 w-fit rounded bg-slate-100 text-slate-600 font-bold text-[9px] border border-slate-200 uppercase tracking-wide">
                        <Minus size={10} /> HOLD
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {isEditingLoad ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-16 eng-input px-2 py-1 text-xs font-mono font-bold text-brand-primary" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button onClick={handleSave} className="text-brand-accent hover:text-emerald-700 transition-colors"><Save size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-medium ${row.isManualOverride ? "text-brand-primary underline decoration-dotted" : "text-brand-text"}`}>
                           {row.adjustedLoadMW.toFixed(3)}
                        </span>
                        <button onClick={() => handleEditStart(row.hour, row.adjustedLoadMW, 'load')} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-primary transition-all">
                           <Edit2 size={10}/>
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-brand-warning font-mono font-medium">{row.solarMW.toFixed(3)}</td>
                  <td className="px-4 py-2.5">
                     {row.gridExportMW > 0 ? (
                        <span className="flex items-center gap-1 text-brand-accent font-mono font-bold">
                          <CloudUpload size={10}/>{row.gridExportMW.toFixed(2)}
                        </span>
                     ) : row.gridImportMW > 0 ? (
                        <span className="text-brand-primary font-mono font-bold">-{row.gridImportMW.toFixed(2)}</span>
                     ) : <span className="opacity-20 font-mono text-slate-300">0.00</span>}
                  </td>
                  <td className="px-4 py-2.5">
                     {row.dieselMW > 0 ? (
                       <span className="flex items-center gap-1 text-brand-danger font-mono font-bold">
                          <AlertTriangle size={10} /> {row.dieselMW.toFixed(2)}
                       </span>
                     ) : <span className="opacity-20 font-mono text-slate-300">0.00</span>}
                  </td>
                  <td className="px-4 py-2.5">
                     <div className="flex items-center gap-2 w-24">
                        <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full ${row.socStatePercent < 30 ? 'bg-brand-danger' : 'bg-brand-accent'}`} style={{ width: `${row.socStatePercent}%` }}></div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-500 w-6 text-right">{Math.round(row.socStatePercent)}%</span>
                     </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-brand-accent">
                    ₹{row.netSavingsINR.toFixed(0)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded inline-block whitespace-nowrap border ${
                      row.batteryReason.includes('Economic') || row.batteryReason.includes('Profit') 
                      ? 'text-brand-primary bg-blue-50 border-blue-200' 
                      : row.batteryReason.includes('Solar') 
                      ? 'text-brand-accent bg-emerald-50 border-emerald-200'
                      : row.batteryReason.includes('Deficit')
                      ? 'text-brand-danger bg-red-50 border-red-200'
                      : 'text-slate-500 bg-slate-50 border-slate-200'
                    }`}>
                      {row.batteryReason}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DispatchTable;