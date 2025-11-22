
import React from 'react';
import { X, MapPin, TrendingUp, Navigation, Activity, Tag } from 'lucide-react';
import { RouteDefinition } from '../types';

interface TripPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  routes: RouteDefinition[];
  onSelectRoute: (route: RouteDefinition) => void;
}

const TripPlanner: React.FC<TripPlannerProps> = ({ isOpen, onClose, routes, onSelectRoute }) => {
  if (!isOpen) return null;

  const getComplexityColor = (level?: string) => {
      switch(level) {
          case 'Baixo': return 'bg-ally-success';
          case 'Médio': return 'bg-ally-warning';
          case 'Alto': return 'bg-orange-500';
          case 'Caótico': return 'bg-ally-danger';
          default: return 'bg-gray-500';
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="glass-panel border border-white/10 w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
                <h2 className="text-2xl font-bold text-white">Rotas de Treino</h2>
                <p className="text-gray-400 text-sm">Pratique em ambientes controlados e ganhe confiança.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60">
                <X size={24} />
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
            {routes.map((route) => (
                <div key={route.id} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:border-ally-primary/50 hover:bg-white/5 transition-all group relative overflow-hidden shadow-lg">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${route.difficulty === 'Iniciante' ? 'bg-ally-success' : route.difficulty === 'Intermediário' ? 'bg-ally-warning' : 'bg-ally-danger'}`} />
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3 pl-3">
                        <div className="w-full">
                             <h3 className="text-xl font-bold text-white group-hover:text-ally-primary transition-colors">{route.title}</h3>
                             <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    route.difficulty === 'Iniciante' ? 'bg-ally-success/10 text-ally-success border-ally-success/20' :
                                    route.difficulty === 'Intermediário' ? 'bg-ally-warning/10 text-ally-warning border-ally-warning/20' :
                                    'bg-ally-danger/10 text-ally-danger border-ally-danger/20'
                                }`}>
                                    {route.difficulty}
                                </span>
                                
                                {route.trafficComplexity && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                        <Activity size={10} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-300 font-medium">Tráfego {route.trafficComplexity}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${getComplexityColor(route.trafficComplexity)}`} />
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div className="pl-3 mb-4">
                        <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-white/10 pl-3 py-2 bg-white/5 rounded-r-lg pr-2">
                            {route.description}
                        </p>
                    </div>

                    {/* Tags */}
                    {route.tags && (
                        <div className="flex flex-wrap gap-2 pl-3 mb-5">
                            {route.tags.map((tag, i) => (
                                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-medium text-ally-secondary border border-white/5">
                                    <Tag size={10} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* Footer stats */}
                    <div className="flex items-center justify-between pl-3 pt-4 border-t border-white/5">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={16} className="text-ally-primary" />
                                <span className="text-gray-400 text-xs">{route.totalDistanceKm} km</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin size={16} className="text-ally-primary" />
                                <span className="text-gray-400 text-xs">Belo Horizonte</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => { onSelectRoute(route); onClose(); }}
                            className="px-6 py-2.5 bg-ally-primary hover:bg-ally-primary/90 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-ally-primary/20 active:scale-95"
                        >
                            <Navigation size={16} />
                            Iniciar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
