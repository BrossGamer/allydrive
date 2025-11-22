
import React from 'react';
import { ArrowUp, ArrowUpRight, ArrowUpLeft } from 'lucide-react';
import { LaneConfig } from '../types';

interface LaneAssistProps {
  config: LaneConfig | null;
}

const LaneAssist: React.FC<LaneAssistProps> = ({ config }) => {
  if (!config) return null;

  return (
    /* REMOVED: absolute top-24 left-0 w-full */
    /* ADDED: w-full flex justify-center pointer-events-none mb-4 (margin bottom ensures space for next element) */
    <div className="w-full z-20 px-4 flex justify-center animate-float-up pointer-events-none mb-4">
      <div className="bg-slate-900/90 border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col items-center min-w-[260px] max-w-sm backdrop-blur-xl pointer-events-auto">
        
        {/* Header info */}
        <div className="w-full flex justify-between items-center mb-4 border-b border-white/10 pb-3">
             <div className="flex flex-col">
                <span className="text-ally-primary font-bold text-4xl leading-none font-sans tracking-tight">
                    {config.distanceToNextAction}<span className="text-lg ml-0.5 text-gray-400">m</span>
                </span>
             </div>
             <div className="flex-1 text-right">
                <span className="text-white text-sm font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                    {config.turnDirection === 'straight' ? 'Siga' : 
                    config.turnDirection === 'left' ? 'Esquerda' :
                    config.turnDirection === 'right' ? 'Direita' :
                    config.turnDirection === 'merge-left' ? 'Entrada Esq' : 'Mantenha'}
                </span>
             </div>
        </div>

        {/* Lanes Visual */}
        <div className="flex justify-center gap-2 w-full">
          {Array.from({ length: config.totalLanes }).map((_, index) => {
            const isRecommended = config.recommendedLanes.includes(index);
            
            return (
              <div 
                key={index} 
                className={`
                  relative flex items-center justify-center
                  w-12 h-16 rounded-xl transition-all duration-500
                  ${isRecommended 
                    ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-105 z-10 border-2 border-white' 
                    : 'bg-slate-800/60 border border-white/10 text-slate-500'}
                `}
              >
                <div>
                    {config.turnDirection === 'left' && isRecommended ? <ArrowUpLeft size={30} strokeWidth={3} /> :
                     config.turnDirection === 'right' && isRecommended ? <ArrowUpRight size={30} strokeWidth={3} /> :
                     config.turnDirection === 'merge-left' && isRecommended ? <ArrowUpLeft size={30} strokeWidth={3} className="-rotate-45" /> :
                     <ArrowUp size={30} strokeWidth={isRecommended ? 3 : 2} />
                    }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LaneAssist;