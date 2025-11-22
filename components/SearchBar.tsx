
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Menu, Loader2, Home, Briefcase } from 'lucide-react';
import { SearchResult, User } from '../types';
import { getCoordinatesFromAddress } from '../services/routingService';

interface SearchBarProps {
  user: User | null;
  onSelectDestination: (result: SearchResult) => void;
  onOpenMenu: () => void;
  onNavigateToSaved: (type: 'home' | 'work') => void;
  onSaveLocation: (type: 'home' | 'work', addressQuery: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ user, onSelectDestination, onOpenMenu, onNavigateToSaved, onSaveLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingLocationType, setEditingLocationType] = useState<'home' | 'work' | null>(null);

  useEffect(() => {
      if (query.length < 3) {
          setResults([]);
          return;
      }
      const timer = setTimeout(async () => {
          setLoading(true);
          // Now returns an array of results
          const foundResults = await getCoordinatesFromAddress(query);
          setResults(foundResults);
          setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
      if (editingLocationType) {
          onSaveLocation(editingLocationType, result.name);
          setEditingLocationType(null);
      } else {
          onSelectDestination(result);
      }
      setQuery('');
      setIsExpanded(false);
  };

  const startEditing = (type: 'home' | 'work') => {
      setEditingLocationType(type);
      setQuery('');
      setIsExpanded(true);
  };

  return (
    <>
    {isExpanded && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40" onClick={() => setIsExpanded(false)} />
    )}

    <div className={`absolute left-4 right-4 transition-all duration-500 ease-in-out pb-safe ${isExpanded ? 'bottom-4 top-20 z-50' : 'bottom-6 h-auto z-30'}`}>
        
        <div className={`glass-panel w-full h-full flex flex-col overflow-hidden shadow-2xl border border-white/10 transition-all duration-500 ${isExpanded ? 'rounded-[32px]' : 'rounded-full'}`}>
            
            {/* Input Section */}
            <div className="p-2 flex items-center gap-2">
                <button onClick={onOpenMenu} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Menu size={24} />
                </button>
                
                <div className="flex-1 relative">
                    {editingLocationType && (
                         <span className="absolute -top-3 left-0 text-[10px] font-bold text-ally-secondary uppercase tracking-wider">
                            Definindo {editingLocationType === 'home' ? 'Casa' : 'Trabalho'}
                         </span>
                    )}
                    <input 
                        type="text"
                        placeholder={editingLocationType ? "Digite o endereço..." : "Para onde vamos hoje?"}
                        className="w-full bg-transparent text-white px-2 py-2 focus:outline-none placeholder-gray-400 font-medium text-lg"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!isExpanded) setIsExpanded(true);
                        }}
                        onFocus={() => setIsExpanded(true)}
                        style={{ fontSize: '16px' }} /* Prevents iOS zoom */
                    />
                </div>

                <div className="p-3 rounded-full flex items-center justify-center text-ally-primary">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
                     {/* Shortcuts */}
                    {!query && (
                        <div className="grid grid-cols-2 gap-3 mb-6 mt-2">
                            {['home', 'work'].map((type) => {
                                const t = type as 'home' | 'work';
                                const saved = user?.savedLocations?.[t];
                                return (
                                    <button 
                                        key={type}
                                        onClick={() => saved ? onNavigateToSaved(t) : startEditing(t)}
                                        className="p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col gap-3 transition-all group text-left active:scale-95"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'home' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {type === 'home' ? <Home size={20} /> : <Briefcase size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm capitalize">{type === 'home' ? 'Casa' : 'Trabalho'}</div>
                                            <div className="text-xs text-gray-400 truncate">{saved ? saved.name : 'Toque para definir'}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Results */}
                    <div className="space-y-2 pb-4">
                        {results.map(result => (
                            <button 
                                key={result.id}
                                onClick={() => handleResultClick(result)}
                                className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-4 transition-all active:bg-white/20"
                            >
                                <div className="p-2.5 bg-slate-800 rounded-full text-gray-400 flex-shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-base text-white truncate">{result.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{result.address}</div>
                                </div>
                                <Navigation size={20} className="text-ally-primary flex-shrink-0" />
                            </button>
                        ))}
                         {results.length === 0 && query.length > 2 && !loading && (
                            <div className="text-center text-gray-500 py-8">Nenhum local encontrado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
    </>
  );
};

export default SearchBar;