
import React from 'react';
import { X, Volume2, Moon, Shield, Sun, Navigation, Baby } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="glass-panel border border-white/10 w-full max-w-md rounded-[32px] shadow-2xl flex flex-col max-h-[80vh] animate-float-up">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Ajustes</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60">
                <X size={24} />
            </button>
        </div>

        <div className="p-0 overflow-y-auto">
             {/* New Driver Mode (Featured) */}
             <div className="p-6 border-b border-white/5 bg-ally-primary/10">
                <h3 className="text-ally-primary font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Baby size={14} /> Modo Recém-Habilitado
                </h3>
                <div className="flex items-center justify-between">
                    <div className="pr-4">
                        <span className="text-white font-medium block">Proteção Extra</span>
                        <span className="text-xs text-gray-400">Alertas de ladeiras, rodovias e zonas de perigo.</span>
                    </div>
                    <button 
                        onClick={() => onUpdateSettings({...settings, newDriverMode: !settings.newDriverMode})}
                        className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 ${settings.newDriverMode ? 'bg-ally-primary' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${settings.newDriverMode ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Sound */}
            <div className="p-6 border-b border-white/5">
                <h3 className="text-ally-secondary font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Volume2 size={14} /> Voz e Som
                </h3>
                <div className="flex items-center justify-between mb-6">
                    <span className="text-white font-medium">Instruções por voz</span>
                    <button 
                        onClick={() => onUpdateSettings({...settings, soundEnabled: !settings.soundEnabled})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings.soundEnabled ? 'bg-ally-success' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${settings.soundEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>Volume</span>
                        <span>{Math.round(settings.voiceVolume * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.1"
                        value={settings.voiceVolume}
                        onChange={(e) => onUpdateSettings({...settings, voiceVolume: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-ally-primary"
                    />
                </div>
            </div>

            {/* Map */}
            <div className="p-6">
                <h3 className="text-ally-secondary font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Moon size={14} /> Aparência
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {['auto', 'light', 'dark'].map((theme) => (
                        <button
                            key={theme}
                            onClick={() => onUpdateSettings({...settings, mapTheme: theme as any})}
                            className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                settings.mapTheme === theme 
                                ? 'bg-ally-primary/20 border-ally-primary text-white shadow-lg shadow-ally-primary/10' 
                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {theme === 'auto' && <Shield size={20} />}
                            {theme === 'light' && <Sun size={20} />}
                            {theme === 'dark' && <Moon size={20} />}
                            <span className="text-xs font-bold capitalize">{theme === 'auto' ? 'Auto' : theme === 'light' ? 'Dia' : 'Noite'}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;