
import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Construction, X } from 'lucide-react';

interface ControlPanelProps {
  onReport: (type: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onReport }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const reportTypes = [
    { id: 'POLICE', label: 'Polícia', icon: <ShieldAlert size={24} />, color: 'bg-blue-500', shadow: 'shadow-blue-500/40' },
    { id: 'ACCIDENT', label: 'Acidente', icon: <AlertTriangle size={24} />, color: 'bg-ally-danger', shadow: 'shadow-rose-500/40' },
    { id: 'HAZARD', label: 'Perigo', icon: <Construction size={24} />, color: 'bg-ally-warning', shadow: 'shadow-amber-500/40' },
  ];

  return (
    <div className="flex flex-col items-end gap-3">
      <div className={`transition-all duration-300 flex flex-col gap-3 ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              onReport(type.id);
              setIsExpanded(false);
            }}
            className={`${type.color} w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg ${type.shadow} hover:scale-110 transition-transform border-2 border-white/20`}
          >
            {type.icon}
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 border border-white/10 backdrop-blur-md ${isExpanded ? 'bg-slate-800 text-gray-400' : 'bg-slate-900/90 text-ally-danger'}`}
      >
        {isExpanded ? <X size={24} /> : <AlertTriangle size={28} />}
      </button>
    </div>
  );
};

export default ControlPanel;