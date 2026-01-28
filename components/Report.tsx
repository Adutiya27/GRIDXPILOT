import React from 'react';
import { BookOpen, Calculator, Zap, Cpu, ShieldAlert, BarChart3, Database, Thermometer, Sun, Battery, DollarSign, Activity, Layers, ArrowRight } from 'lucide-react';

const Report: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-slide-up pb-24">
      
      {/* Header */}
      <header className="text-center space-y-6 pt-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-brand-border shadow-sm">
          <BookOpen size={12} className="text-brand-primary" /> System Documentation
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-primary uppercase">
          GridPilot <span className="text-brand-text">X-7</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          High-Fidelity Microgrid Physics Simulator & Financial Optimization Engine.
          <br/>
          <span className="opacity-60 font-mono mt-1 block">Node: Dayalbagh Educational Institute (DEI), Agra</span>
        </p>
      </header>

      <div className="h-px bg-gradient-to-r from-transparent via-brand-border to-transparent w-full"></div>

      {/* 1. Architecture */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white border border-brand-border flex items-center justify-center text-brand-primary shadow-sm">
            <Cpu size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-text">01. Architecture</h2>
            <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest mt-0.5">Core Engine Logic</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 eng-card hover:border-brand-primary/50 transition-colors group">
             <h3 className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest mb-4 flex items-center gap-2 group-hover:text-brand-primary transition-colors">
               <Zap size={14} className="text-brand-primary"/> Discrete Time Simulation
             </h3>
             <p className="text-xs text-slate-600 leading-relaxed font-medium group-hover:text-slate-800 transition-colors">
               The engine utilizes a <strong>Deterministic Physics Model</strong> running a 24-hour cycle with 1-hour resolution. It performs multi-pass iterations (3 cycles) to stabilize the battery's <em>State of Charge (SoC)</em>, ensuring steady-state accuracy.
             </p>
          </div>
          <div className="p-8 eng-card hover:border-brand-accent/50 transition-colors group">
             <h3 className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest mb-4 flex items-center gap-2 group-hover:text-brand-accent transition-colors">
               <Database size={14} className="text-brand-accent"/> Gemini Neural Layer
             </h3>
             <p className="text-xs text-slate-600 leading-relaxed font-medium group-hover:text-slate-800 transition-colors">
               A dedicated API bridge pipes raw JSON telemetry to <strong>Google Gemini 3 Flash</strong>. This allows the "Neural Strategist" to perform qualitative reasoning and identify power quality violations.
             </p>
          </div>
        </div>
      </section>

      {/* 2. Functional Modules */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white border border-brand-border flex items-center justify-center text-brand-primary shadow-sm">
            <Layers size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-text">02. Modules</h2>
            <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest mt-0.5">Input Vector Components</p>
          </div>
        </div>

        <div className="eng-card overflow-hidden">
           <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-brand-border">
              <div className="p-8 space-y-4 hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-red-50 text-brand-danger"><Thermometer size={16}/></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text">Physics Matrix</span>
                 </div>
                 <p className="text-[11px] text-brand-text-dim leading-relaxed font-medium">
                   Reconstructs the environment. Ingests <strong>Meteorological Data</strong> (Sunrise, Cloud Cover) and calculates <strong>PV De-rating</strong> based on ambient temperature coefficients.
                 </p>
              </div>
              <div className="p-8 space-y-4 hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-blue-50 text-brand-primary"><Activity size={16}/></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text">Mission Profile</span>
                 </div>
                 <p className="text-[11px] text-brand-text-dim leading-relaxed font-medium">
                   Defines the global scenario. <strong>Normal</strong>, <strong>Islanded</strong>, or <strong>Heatwave</strong>. It dictates the "Scenario Load" curve used in dispatch logic.
                 </p>
              </div>
              <div className="p-8 space-y-4 hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-amber-50 text-brand-warning"><ShieldAlert size={16}/></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text">Grid Blockers</span>
                 </div>
                 <p className="text-[11px] text-brand-text-dim leading-relaxed font-medium">
                   Simulates <strong>Forced Outages</strong>. Specific windows where Import or Export is prohibited, testing system resilience.
                 </p>
              </div>
              <div className="p-8 space-y-4 hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-emerald-50 text-brand-accent"><Battery size={16}/></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text">Asset Stack</span>
                 </div>
                 <p className="text-[11px] text-brand-text-dim leading-relaxed font-medium">
                   Configures hardware constraints: Battery MWh, Inverter MW, and Aux Diesel specs. Toggles <strong>Dynamic Pricing</strong> logic.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* 3. Mathematical Logic */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white border border-brand-border flex items-center justify-center text-brand-primary shadow-sm">
            <Calculator size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-text">03. Formulas</h2>
            <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest mt-0.5">Physics & Finance</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Solar Model */}
          <div className="bg-slate-50 border border-brand-border p-8 rounded-xl relative overflow-hidden group eng-card">
             <h4 className="text-brand-text font-bold uppercase tracking-wide text-xs mb-4 flex items-center gap-2 relative z-10">
                <Sun size={14} className="text-brand-warning"/> Solar Generation
             </h4>
             <div className="font-mono text-[10px] bg-white p-4 rounded border border-brand-border mb-6 text-slate-600 overflow-x-auto relative z-10 shadow-sm">
                P_solar(t) = I_base(t) × (1 - Cloud%) × η_temp × Cap_rated
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] leading-relaxed relative z-10">
                <div className="space-y-1">
                   <strong className="text-brand-text uppercase tracking-wide block">Irradiance (I_base)</strong>
                   <p className="text-brand-text-dim">Sinusoidal function from Sunrise/Sunset deltas. 1000 W/m² peak.</p>
                </div>
                <div className="space-y-1">
                   <strong className="text-brand-text uppercase tracking-wide block">Thermal De-rating (η_temp)</strong>
                   <p className="text-brand-text-dim">Efficiency Penalty = max(0, (Temp_Amb - 25) × 0.004).</p>
                </div>
             </div>
          </div>

          {/* Battery Model */}
          <div className="bg-slate-50 border border-brand-border p-8 rounded-xl relative overflow-hidden group eng-card">
             <h4 className="text-brand-text font-bold uppercase tracking-wide text-xs mb-4 flex items-center gap-2 relative z-10">
                <Battery size={14} className="text-brand-accent"/> Storage & BMS Logic
             </h4>
             <div className="font-mono text-[10px] bg-white p-4 rounded border border-brand-border mb-6 text-slate-600 overflow-x-auto relative z-10 shadow-sm">
                P_charge_limit = P_rated × η_thermal × η_cv
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] leading-relaxed relative z-10">
                <div className="space-y-1">
                   <strong className="text-brand-text uppercase tracking-wide block">CC-CV Curve (η_cv)</strong>
                   <p className="text-brand-text-dim">If SoC &gt; 80%, charge rate decays linearly to 0. (Constant Voltage Phase).</p>
                </div>
                <div className="space-y-1">
                   <strong className="text-brand-text uppercase tracking-wide block">Thermal Throttling (η_thermal)</strong>
                   <p className="text-brand-text-dim">If Temp &gt; 35°C, max charge rate reduces by 5% per degree.</p>
                </div>
             </div>
          </div>

           {/* Financial Model */}
           <div className="bg-slate-50 border border-brand-border p-8 rounded-xl relative overflow-hidden group eng-card">
             <h4 className="text-brand-text font-bold uppercase tracking-wide text-xs mb-4 flex items-center gap-2 relative z-10">
                <DollarSign size={14} className="text-brand-primary"/> Arbitrage Logic
             </h4>
             <div className="font-mono text-[10px] bg-white p-4 rounded border border-brand-border mb-6 text-slate-600 overflow-x-auto relative z-10 shadow-sm">
                Net_Savings = Cost_Baseline - (Cost_Microgrid + Cost_Diesel - Rev_Export)
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] leading-relaxed relative z-10">
                <div className="space-y-1">
                   <strong className="text-brand-text uppercase tracking-wide block">Dynamic Pricing</strong>
                   <p className="text-brand-text-dim">Charges battery during troughs, discharges during peaks.</p>
                </div>
                <div className="space-y-1">
                   <strong className="text-brand-text uppercase tracking-wide block">Baseline</strong>
                   <p className="text-brand-text-dim">ROI calculated against 100% Grid Dependency scenario.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <footer className="text-center pt-8 border-t border-brand-border">
        <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-dim">
          DEI AGRA — Microgrid Engineering Dept.
        </p>
      </footer>
    </div>
  );
};

export default Report;