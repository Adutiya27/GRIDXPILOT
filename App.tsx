import React, { useState, useMemo } from 'react';
import { SimulationParams, WeatherCondition, LoadOverride, SystemScenario, SystemStrategy, TariffOverride } from './types';
import { runSimulation } from './utils/engine';
import InputPanel from './components/InputPanel';
import FinancialAudit from './components/FinancialAudit';
import DispatchTable from './components/DispatchTable';
import Visualizations from './components/Visualizations';
import NeuralStrategist from './components/NeuralStrategist';
import { analyzeSimulation } from './services/geminiService';
import { ShieldAlert, Cpu, Activity, BarChart3, ChevronRight } from 'lucide-react';

// Helper to generate default curves
const generateCurve = (base: number, peak: number, peakHour: number, type: 'bell' | 'inverse') => {
  return Array.from({ length: 24 }, (_, h) => {
    const dist = Math.abs(h - peakHour);
    const factor = Math.max(0, 1 - (dist / 12));
    if (type === 'bell') return base + (peak - base) * Math.sin(factor * Math.PI / 2);
    return peak - (peak - base) * Math.sin(factor * Math.PI / 2);
  });
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    solarCapacityMW: 1.2,
    batteryCapacityMWh: 2.5,
    maxChargeRateMW: 1.0,
    maxDischargeRateMW: 1.0,
    minSocPercent: 20,
    maxSocPercent: 95,
    sunriseHour: 6,
    sunsetHour: 18,
    weather: WeatherCondition.Sunny,
    scenario: SystemScenario.Normal,
    strategy: SystemStrategy.Arbitrage,
    isDynamicTariff: true,
    
    // NEW: 24h Data Arrays (Default: Agra Summer Profile)
    hourlyTemp: generateCurve(28, 42, 14, 'bell'),      // 28C night -> 42C day
    hourlyHumidity: generateCurve(30, 70, 4, 'inverse'), // 70% morning -> 30% afternoon
    hourlyCloud: Array(24).fill(5),                     // 5% cloud cover static baseline

    maxGridImportMW: 2.0,
    feedInTariffINR: 4.8,
    dieselCapacityMW: 0.5,
    dieselFuelCostINR: 95,
    allowBatteryExport: false,
    importOutages: [],
    exportOutages: [],
  });

  const [overrides, setOverrides] = useState<LoadOverride>({});
  const [tariffOverrides, setTariffOverrides] = useState<TariffOverride>({});
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const results = useMemo(() => {
    return runSimulation(params, overrides, tariffOverrides);
  }, [params, overrides, tariffOverrides]);

  const handleConsultAI = async () => {
    setIsAnalyzing(true);
    try {
      const text = await analyzeSimulation(results, params);
      setAiAnalysis(text);
    } catch (e) {
      setAiAnalysis("<p>Intelligence processing failure. Node connectivity timeout.</p>");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isEmergency = params.scenario !== SystemScenario.Normal || params.importOutages.length > 0;

  const handleParamChange = (newParams: SimulationParams) => {
    setParams(newParams);
    setAiAnalysis(null);
  };

  return (
    <div className="min-h-screen text-brand-text font-sans selection:bg-brand-primary/20">
      <header className={`border-b border-brand-border sticky top-0 z-50 bg-white/80 backdrop-blur-md transition-colors duration-300 ${isEmergency ? 'border-brand-danger/30' : ''}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 border ${isEmergency ? 'bg-red-50 text-brand-danger border-red-100 animate-pulse' : 'bg-brand-primary text-white border-brand-primary shadow-sm'}`}>
              {isEmergency ? <ShieldAlert size={16} /> : <Cpu size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h1 className="text-sm font-bold tracking-tight uppercase text-brand-primary tracking-widest">GRIDPILOT <span className={isEmergency ? 'text-brand-danger' : 'text-brand-text'}>X</span></h1>
                 <span className="px-1.5 py-0.5 rounded bg-brand-panel text-brand-text-dim text-[9px] font-bold border border-brand-border uppercase tracking-wide">v3.0.0</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex gap-8 items-center">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-widest">Node</span>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wide">AGRA</span>
             </div>
             <div className="h-6 w-px bg-brand-border"></div>
             <div className="flex items-center gap-3">
               <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isEmergency ? 'text-brand-danger' : 'text-brand-accent'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isEmergency ? 'bg-brand-danger animate-pulse' : 'bg-brand-accent'}`}></span>
                  {isEmergency ? 'System Alert' : 'Normal Ops'}
               </span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        <section className="animate-slide-up">
          <InputPanel params={params} onChange={handleParamChange} />
        </section>

        <section className="animate-slide-up stagger-1">
          <FinancialAudit audit={results.audit} feedInTariff={params.feedInTariffINR} />
        </section>

        {/* Strategist moved here as requested */}
        <section className="animate-slide-up stagger-2">
          <NeuralStrategist 
            analysis={aiAnalysis} 
            isAnalyzing={isAnalyzing} 
            onConsult={handleConsultAI} 
          />
        </section>

        <section className="animate-slide-up stagger-3">
          <Visualizations data={results.hourlyData} audit={results.audit} />
        </section>

        <section className="animate-slide-up stagger-4">
           <DispatchTable 
             data={results.hourlyData} 
             onUpdateLoad={(h, v) => setOverrides(prev => ({ ...prev, [h]: v }))} 
             onUpdateTariff={(h, v) => setTariffOverrides(prev => ({ ...prev, [h]: v }))}
           />
        </section>
      </main>
      
      <footer className="max-w-[1600px] mx-auto px-6 py-10 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-brand-text-dim uppercase tracking-widest font-bold">
        <div className="flex items-center gap-6">
          <span>Simulation Engine v3.0</span>
          <span className="text-brand-border">|</span>
          <span>Latency: 12ms</span>
        </div>
        <span className="opacity-50">Industrial Design System</span>
      </footer>
    </div>
  );
};

export default App;