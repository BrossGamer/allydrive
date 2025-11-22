
import React from 'react';
import { ChevronUp, Clock } from 'lucide-react';
import { NavigationState } from '../types';

interface TripInfoProps {
  navState: NavigationState;
  onCancel: () => void;
}

const TripInfo: React.FC<TripInfoProps> = ({ navState, onCancel }) => {
  if (navState.status !== 'NAVIGATING') return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-float-up">
        {/* Main Stats Bar */}
        <div className="mx-3 mb-5 bg-slate-900/95 border border-white/15 rounded-[28px] p-1 shadow-2xl backdrop-blur-xl flex items-stretch overflow-hidden">
            
            {/* Time / ETA Section */}
            <div className="flex-1 p-3 pl-6 flex flex-col justify-center">
                <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-bold text-ally-success filter drop-shadow-md tracking-tight">
                        {navState.remainingTime || '-- min'}
                    </span>
                    <span className="text-lg font-medium text-gray-400">
                        {navState.eta || '--:--'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ally-success/90 mt-1 uppercase tracking-wide">
                    <Clock size={12} />
                    <span>Chegada</span>
                </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent my-2" />

            {/* Distance Section */}
            <div className="px-6 flex flex-col justify-center items-center min-w-[100px]">
                <span className="text-2xl font-bold text-white tracking-tight">
                    {navState.remainingDistance || '--'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Restante</span>
            </div>

            {/* Divider */}
            <div className="w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent my-2" />

            {/* Action/Expand */}
            <button 
                className="px-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors hover:bg-white/5"
                onClick={() => {}}
            >
                <ChevronUp size={26} />
            </button>
        </div>
    </div>
  );
};

export default TripInfo;