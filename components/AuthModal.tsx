import React from 'react';
import { User, Shield } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  onLogin: (user: UserType) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  
  const handleGoogleLogin = () => {
    const mockUser: UserType = {
        id: 'g_123',
        name: 'Motorista Ally',
        email: 'motorista@ally.com',
        avatar: 'https://ui-avatars.com/api/?name=Ally+Driver&background=8b5cf6&color=fff',
        isAnonymous: false
    };
    onLogin(mockUser);
  };

  const handleAnonymous = () => {
    const anonUser: UserType = { id: 'anon_' + Date.now(), name: 'Visitante', isAnonymous: true };
    onLogin(anonUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="glass-panel border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-float-up">
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-ally-primary to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-ally-primary/20 rotate-3">
                <img src="https://img.icons8.com/fluency/96/steering-wheel.png" alt="Logo" className="w-12 h-12 drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ALLYDRIVE</h1>
            <p className="text-gray-400 font-medium">Sua jornada começa com confiança.</p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-gray-50 text-slate-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Entrar com Google
            </button>

            <button 
                onClick={handleAnonymous}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
                <User size={20} />
                Modo Anônimo
            </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
            <Shield size={14} />
            <p className="text-[10px] uppercase tracking-widest font-bold">Privacidade Garantida</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;