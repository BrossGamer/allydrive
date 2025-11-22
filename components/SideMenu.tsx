import React from 'react';
import { X, User as UserIcon, Map, Clock, Settings, LogOut, ChevronRight, Award } from 'lucide-react';
import { User } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenPlanner: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, user, onLogout, onOpenPlanner, onOpenHistory, onOpenSettings }) => {
  const menuItems = [
    { icon: <Map size={20} />, label: 'Planejar Percurso', action: onOpenPlanner },
    { icon: <Clock size={20} />, label: 'Histórico', action: onOpenHistory },
    { icon: <Settings size={20} />, label: 'Configurações', action: onOpenSettings },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 left-0 h-full w-80 glass-panel border-r border-white/10 z-50 transform transition-transform duration-300 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-8 pt-12 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-ally-primary/20 to-transparent z-0" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-white/50 z-10">
                <X size={20} />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-ally-primary to-ally-secondary shadow-xl mb-4">
                     {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-slate-900" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-gray-400">
                            <UserIcon size={32} />
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white">{user?.name || 'Convidado'}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-ally-secondary mt-2">
                    <Award size={12} />
                    <span>{user?.level || 'Explorador'}</span>
                </div>
            </div>
        </div>

        <div className="p-4 space-y-2 flex-1">
            {menuItems.map((item, idx) => (
                <button 
                    key={idx}
                    onClick={() => { item.action(); onClose(); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group border border-transparent hover:border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="text-gray-400 group-hover:text-ally-primary transition-colors">{item.icon}</div>
                        <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                </button>
            ))}
        </div>

        <div className="p-6">
            <button 
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-white/60 hover:bg-ally-danger/10 hover:text-ally-danger transition-all font-medium text-sm border border-transparent hover:border-ally-danger/20"
            >
                <LogOut size={16} />
                Sair da conta
            </button>
        </div>
      </div>
    </>
  );
};

export default SideMenu;