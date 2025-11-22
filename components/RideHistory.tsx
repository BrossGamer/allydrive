import React from 'react';
import { Clock, MapPin, Star, X, Ban } from 'lucide-react';
import { RideHistoryItem } from '../types';

interface RideHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: RideHistoryItem[];
}

const RideHistory: React.FC<RideHistoryProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 w-full md:w-96 bg-slate-950/95 backdrop-blur-xl z-40 shadow-2xl flex flex-col animate-in slide-in-from-left border-r border-white/10">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock size={20} className="text-ally-primary" />
          Suas Viagens
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {history.length === 0 ? (
            <div className="text-center text-gray-500 mt-20 flex flex-col items-center gap-4 opacity-50">
                <Ban size={48} strokeWidth={1} />
                <p>Nenhuma corrida concluída.</p>
            </div>
        ) : (
            history.slice().reverse().map((ride) => (
            <div key={ride.id} className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-ally-primary/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-800 rounded-full text-ally-secondary">
                            <MapPin size={16} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white leading-tight">{ride.destination}</h3>
                            <p className="text-xs text-gray-400 mt-1">{ride.date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-ally-success/20 px-2 py-1 rounded-lg">
                        <span className="text-xs font-bold text-ally-success">{ride.score}</span>
                        <Star size={10} className="text-ally-success fill-ally-success" />
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-white/5">
                    <span>⏱ {ride.duration}</span>
                    <span>📏 {ride.distance}</span>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RideHistory;