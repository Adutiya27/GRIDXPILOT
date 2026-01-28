import React from 'react';
import { BrainCircuit, Loader2, Terminal, ShieldAlert, ChevronRight, Activity, Info, X } from 'lucide-react';

interface Props {
  analysis: string | null;
  isAnalyzing: boolean;
  onConsult: () => void;
}

const NeuralStrategist: React.FC<Props> = ({ analysis, isAnalyzing, onConsult }) => {
  return (
    <div className="w-full eng-card overflow-hidden flex flex-col md:flex-row items-stretch relative">
      {/* Control Strip (Left Side) */}
      <div className="bg-brand-panel md:w-72 border-b md:border-b-0 md:border-r border-brand-border p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-brand-primary border border-brand-border shadow-sm">
                  <BrainCircuit size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Strategist</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                     <span className="text-[9px] font-medium text-brand-text-dim uppercase tracking-wide">Online</span>
                  </div>
                </div>
             </div>
           </div>
           
           <div className="space-y-3">
             <p className="text-[10px] text-brand-text-dim font-medium leading-relaxed">
               AI-driven analysis of telemetry data to identify transients and audit stability.
             </p>
             <div className="p-3 bg-white border border-brand-border rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wide">Model</span>
                  <span className="text-[9px] font-bold text-brand-primary uppercase">Gemini 3 Flash</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wide">Status</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Idle</span>
                </div>
             </div>
           </div>
        </div>

        <button 
            onClick={onConsult} 
            disabled={isAnalyzing} 
            className="mt-6 w-full py-2.5 bg-brand-primary text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={12} /> : <Activity size={12} />}
          {isAnalyzing ? "Analyzing..." : "Run Audit"}
        </button>
      </div>

      {/* Output Area (Right Side) */}
      <div className="flex-grow p-8 bg-white min-h-[200px] relative overflow-y-auto max-h-[600px]">
         {analysis ? (
             <div className="animate-slide-up">
                 <div className="flex items-center gap-2 mb-6 pb-4 border-b border-brand-border">
                    <Terminal size={14} className="text-brand-text-dim" />
                    <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">Engineering Report</span>
                 </div>
                 {/* Updated Prose classes for Light Theme and Horizontal Layout */}
                 <div className="prose prose-slate prose-sm max-w-none text-brand-text font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis }} />
             </div>
         ) : isAnalyzing ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 z-10">
                <Loader2 size={32} className="text-brand-primary animate-spin" />
                <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest animate-pulse">Running Physics Audit...</span>
             </div>
         ) : (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-panel flex items-center justify-center border border-brand-border">
                   <ShieldAlert size={20} className="text-slate-400" />
                </div>
                <div className="space-y-1">
                   <p className="text-xs font-bold uppercase tracking-wide text-brand-text">Awaiting Trigger</p>
                   <p className="text-[10px] font-medium text-brand-text-dim">Generate telemetry first</p>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default NeuralStrategist;