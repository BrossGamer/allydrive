
import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './components/MapComponent';
import LaneAssist from './components/LaneAssist';
// import ChatAssistant from './components/ChatAssistant'; // REMOVED
import ControlPanel from './components/ControlPanel';
import RideHistory from './components/RideHistory';
import SearchBar from './components/SearchBar';
import AuthModal from './components/AuthModal';
import SideMenu from './components/SideMenu';
import TripPlanner from './components/TripPlanner';
import SettingsModal from './components/SettingsModal';
import TripInfo from './components/TripInfo';
import { Location, Alert, NavigationState, SearchResult, RideHistoryItem, RouteDefinition, User, RouteEvent, UserSettings } from './types';
import { X, RotateCcw, Navigation, Locate } from 'lucide-react';
import { getRouteFromOSRM, getCoordinatesFromAddress, getDistanceMeters } from './services/routingService';

// MOCK TRAINING ROUTES DATA
const TRAINING_ROUTES: RouteDefinition[] = [
    {
        id: 'route_pampulha',
        title: 'Circuito da Pampulha',
        description: 'Uma rota plana e visualmente aberta ao redor da lagoa. Ideal para quem está começando e precisa treinar manutenção de faixa, controle de velocidade constante e curvas suaves sem a pressão de cruzamentos complexos.',
        difficulty: 'Iniciante',
        trafficComplexity: 'Baixo',
        tags: ['Plano', 'Curvas Suaves', 'Semáforos', 'Ciclistas'],
        totalDistanceKm: 18.0,
        path: [{ lat: -19.8583, lng: -43.9762 }, { lat: -19.8422, lng: -43.9715 }], 
        events: []
    },
    {
        id: 'route_mangabeiras',
        title: 'Desafio das Mangabeiras',
        description: 'Enfrente o relevo característico de BH. Esta rota é focada no controle de embreagem, arranque em subidas íngremes (pare e arranque) e curvas fechadas em declive. Perfeito para perder o medo de ladeira.',
        difficulty: 'Intermediário',
        trafficComplexity: 'Médio',
        tags: ['Ladeiras', 'Controle de Embreagem', 'Curvas Fechadas', 'Freio Motor'],
        totalDistanceKm: 5.5,
        path: [{ lat: -19.9546, lng: -43.9144 }, { lat: -19.9498, lng: -43.9055 }],
        events: []
    },
    {
        id: 'route_centro',
        title: 'Caos do Centro (Avançado)',
        description: 'O teste definitivo de atenção. Navegue por avenidas movimentadas como a Amazonas e Afonso Pena. Treine a interação com pedestres, faixas exclusivas de ônibus e mudanças rápidas de faixa em trânsito intenso.',
        difficulty: 'Avançado',
        trafficComplexity: 'Caótico',
        tags: ['Trânsito Intenso', 'Pedestres', 'Cruzamentos', 'Atenção Difusa'],
        totalDistanceKm: 4.2,
        path: [{ lat: -19.9228, lng: -43.9400 }, { lat: -19.9167, lng: -43.9345 }],
        events: []
    }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({ soundEnabled: true, voiceVolume: 1.0, mapTheme: 'auto', avoidTolls: false, newDriverMode: true });
  
  // Core Location State
  const [location, setLocation] = useState<Location>({ lat: -19.9320, lng: -43.9380, bearing: 0, speed: 0 });
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(true); // Tracks if map follows car

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<RideHistoryItem[]>([]);
  
  // UI States
  // const [isChatOpen, setIsChatOpen] = useState(false); // REMOVED
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Navigation Engine State
  const [activeRoute, setActiveRoute] = useState<RouteDefinition | null>(null);
  const [lastEvent, setLastEvent] = useState<RouteEvent | null>(null);
  const [initialRouteLocation, setInitialRouteLocation] = useState<Location | null>(null);
  
  const [navState, setNavState] = useState<NavigationState>({
    status: 'IDLE',
    currentSpeed: 0,
    speedLimit: 60,
    nextTurnInstruction: '',
    distanceToNextTurn: 0,
    laneData: null,
    totalDistance: 0,
    distanceTraveled: 0
  });

  const lastSpokenInstructionRef = useRef<string>("");

  // --------------------------------------------------------------------------------
  // 1. GPS & SENSORS ENGINE
  // --------------------------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
        setGpsError("GPS não suportado.");
        return;
    }

    // Initial quick fix to center map
    navigator.geolocation.getCurrentPosition(
        (p) => {
            setLocation({ 
                lat: p.coords.latitude, 
                lng: p.coords.longitude, 
                bearing: p.coords.heading || 0, 
                speed: p.coords.speed || 0 
            });
        },
        (e) => console.log("Initial GPS fetch failed, waiting for watch"),
        { enableHighAccuracy: true, timeout: 5000 }
    );

    const handleSuccess = (p: GeolocationPosition) => {
        if (gpsError) setGpsError(null); // Clear error immediately on success
        
        const speedKmh = (p.coords.speed || 0) * 3.6;
        
        // Update location state
        setLocation(prev => ({ 
            lat: p.coords.latitude, 
            lng: p.coords.longitude,
            bearing: p.coords.heading || prev.bearing, // Keep last bearing if stationary
            speed: p.coords.speed || 0,
            accuracy: p.coords.accuracy
        }));

        // Direct speed update for UI responsiveness
        setNavState(prev => ({ ...prev, currentSpeed: Math.round(speedKmh) }));
    };

    const handleError = (e: GeolocationPositionError) => {
        console.warn("GPS Error", e);
        if (e.code === 1) setGpsError("GPS negado. Habilite nas configurações.");
        // else if (e.code === 2) setGpsError("Buscando satélites..."); // Removed to avoid annoyance
    };

    // High frequency tracking
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 0
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []); 

  // --------------------------------------------------------------------------------
  // 2. NAVIGATION LOGIC LOOP (Updates when Location Changes)
  // --------------------------------------------------------------------------------
  useEffect(() => {
    if (navState.status !== 'NAVIGATING' || !activeRoute) return;

    // A. Calculate Progress (Simple snapping to nearest point on route path for demo logic)
    let minDistance = Infinity;
    let closestIndex = 0;
    
    // In a real app, we would project point to segment. Here we find closest node.
    activeRoute.path.forEach((p, idx) => {
        const d = getDistanceMeters(location, p);
        if (d < minDistance) {
            minDistance = d;
            closestIndex = idx;
        }
    });

    // Approximate distance traveled
    let distTraveled = 0;
    for(let i=0; i<closestIndex; i++) {
        distTraveled += getDistanceMeters(activeRoute.path[i], activeRoute.path[i+1]);
    }

    const distRemaining = activeRoute.totalDistanceKm * 1000 - distTraveled;
    
    // B. Check Arrival
    if (distRemaining < 50 && closestIndex > activeRoute.path.length - 3) {
        handleStopNavigation(true);
        return;
    }

    // C. ETA Calculation
    // Use actual speed, but clamp to min 15km/h for realistic stationary ETA
    const calcSpeedMps = Math.max(location.speed || 0, 4.1); 
    const timeRemainingSec = distRemaining / calcSpeedMps;
    const etaDate = new Date(Date.now() + timeRemainingSec * 1000);

    // D. Process Events
    activeRoute.events.forEach((ev) => {
        // Check if we passed the event distance
        if (!ev.triggered && distTraveled >= ev.distanceFromStart) {
            
            // Check settings filter: Only show hills/highways if New Driver Mode is ON
            if (['STEEP_HILL', 'HIGHWAY_ENTRY', 'DANGER_ZONE'].includes(ev.type) && !settings.newDriverMode) {
                ev.triggered = true; // Silently consume event
                return;
            }

            ev.triggered = true; 
            
            if (ev.spokenText) speakNavigation(ev.spokenText);
            setLastEvent(ev);
            
            if (ev.type === 'SPEED_LIMIT') setNavState(s => ({ ...s, speedLimit: ev.value }));
            if (ev.type === 'LANE_ASSIST') setNavState(s => ({ ...s, laneData: ev.value }));
            if (ev.type === 'TURN_TEXT') setNavState(s => ({ ...s, nextTurnInstruction: ev.value, laneData: null })); 
        }
    });

    setNavState(prev => ({
        ...prev,
        distanceTraveled: distTraveled,
        remainingDistance: distRemaining > 1000 ? `${(distRemaining/1000).toFixed(1)} km` : `${Math.round(distRemaining)} m`,
        remainingTime: `${Math.ceil(timeRemainingSec / 60)} min`,
        eta: etaDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));

  }, [location, activeRoute, settings.newDriverMode]);


  // --------------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------------
  const speakNavigation = (text: string) => {
    if (!settings.soundEnabled || !('speechSynthesis' in window)) return;
    
    // Basic debounce to avoid repeating same instruction instantly
    if (lastSpokenInstructionRef.current === text) return;
    
    lastSpokenInstructionRef.current = text;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; 
    
    const voices = window.speechSynthesis.getVoices();
    // Try to find a female/google voice if possible
    const preferredVoice = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Female')));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStopNavigation = (completed = false) => {
    setNavState(prev => ({ ...prev, status: 'IDLE', laneData: null, nextTurnInstruction: '' }));
    setActiveRoute(null);
    setIsFollowing(true);
    setLastEvent(null);
    
    if (completed && activeRoute) {
        speakNavigation("Você chegou ao seu destino. Parabéns!");
        const newHistory: RideHistoryItem = {
            id: Date.now().toString(),
            destination: activeRoute.title,
            date: new Date().toLocaleDateString(),
            duration: '15 min', // Mocked
            distance: `${activeRoute.totalDistanceKm} km`,
            score: 5.0
        };
        setHistory(prev => [...prev, newHistory]);
        // Add points
        if (user) {
            setUser({ ...user, points: (user.points || 0) + 50 });
        }
    } else {
        speakNavigation("Rota cancelada.");
    }
  };

  const handleRestartNavigation = () => {
      if (initialRouteLocation) {
          // In a real GPS scenario, we can't teleport the user.
          // But we can reset the route state to "start".
          speakNavigation("Reiniciando rota.");
          if (activeRoute) {
               // Reset events
               activeRoute.events.forEach(e => e.triggered = false);
               setLastEvent(null);
               setNavState(prev => ({ 
                   ...prev, 
                   distanceTraveled: 0,
                   laneData: null,
                   nextTurnInstruction: ''
                }));
          }
      }
  };

  const handleStartRoute = async (routeDef: RouteDefinition) => {
    setNavState(prev => ({ ...prev, status: 'RECALCULATING' }));
    setIsPlannerOpen(false);
    setInitialRouteLocation(location);
    
    try {
        // If the route is dynamic (from search) or pre-defined
        let finalRoute = routeDef;
        
        if (routeDef.id === 'dynamic_route' || routeDef.path.length < 2) {
            // Calculate real route from current location to destination
            const endPoint = routeDef.path[routeDef.path.length - 1];
            finalRoute = await getRouteFromOSRM(location, endPoint, routeDef.title);
        } else {
             // For training routes, we might want to navigate TO the start point first
             // But for simplicity in this demo, we assume we start the route logic immediately
             // or we could calculate route from current loc to start of training route.
             const startOfRoute = routeDef.path[0];
             // Calculate route from current GPS to start of training
             const routeToStart = await getRouteFromOSRM(location, startOfRoute, `Ir para ${routeDef.title}`);
             // Merging logic is complex, so let's just use the calculated route directly 
             // assuming the user wants to go there.
             finalRoute = routeToStart; 
             // Override events with training events if we were close? 
             // For v1.4, let's stick to OSRM generation which includes standard turn events.
             // We can inject the custom training events if needed manually.
        }

        setActiveRoute(finalRoute);
        setNavState(prev => ({ 
            ...prev, 
            status: 'NAVIGATING', 
            destination: finalRoute.title,
            totalDistance: finalRoute.totalDistanceKm * 1000
        }));
        speakNavigation(`Iniciando rota para ${finalRoute.title}.`);
        setIsFollowing(true);

    } catch (e) {
        console.error(e);
        speakNavigation("Erro ao calcular rota.");
        setNavState(prev => ({ ...prev, status: 'IDLE' }));
    }
  };

  const handleSelectDestination = async (result: SearchResult) => {
      const mockRouteDef: RouteDefinition = {
          id: result.routeId,
          title: result.name,
          description: result.address,
          difficulty: 'Iniciante',
          totalDistanceKm: 0, // calculated later
          path: [location, result.coords],
          events: []
      };
      handleStartRoute(mockRouteDef);
  };

  const handleReport = (type: string) => {
      const newAlert: Alert = {
          id: Date.now().toString(),
          type: type as any,
          location: location,
          timestamp: Date.now()
      };
      setAlerts(prev => [...prev, newAlert]);
      speakNavigation("Alerta reportado. Obrigado.");
  };

  const handleSaveLocation = (type: 'home' | 'work', addressQuery: string) => {
      getCoordinatesFromAddress(addressQuery).then(results => {
          if (results.length > 0) {
              const loc = results[0];
              const newSaved = { ...user?.savedLocations, [type]: loc };
              const newUser = { ...user!, savedLocations: newSaved };
              setUser(newUser);
              speakNavigation(`${type === 'home' ? 'Casa' : 'Trabalho'} salvo com sucesso.`);
          }
      });
  };

  const handleNavigateToSaved = (type: 'home' | 'work') => {
      const loc = user?.savedLocations?.[type];
      if (loc) handleSelectDestination(loc);
      else speakNavigation(`Endereço de ${type === 'home' ? 'Casa' : 'Trabalho'} não definido.`);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      
      {/* 1. Map Layer (Bottom) */}
      <MapComponent 
        currentLocation={location} 
        alerts={alerts}
        routePath={activeRoute?.path}
        activeEvent={lastEvent}
        isFollowing={isFollowing}
        onMapInteraction={() => setIsFollowing(false)}
      />

      {/* 2. UI Overlays */}
      
      {/* Top GPS Error Banner */}
      {gpsError && (
          <div className="absolute top-0 left-0 right-0 bg-ally-danger text-white text-center p-2 text-xs font-bold z-50 animate-in slide-in-from-top">
              {gpsError}
          </div>
      )}

      {/* --- TOP UI STACK --- */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe flex flex-col items-center pointer-events-none">
          
          {/* A. Header / Nav Bar */}
          <div className="w-full flex justify-between items-start mb-4 pointer-events-auto">
               {navState.status === 'NAVIGATING' ? (
                   <>
                    <button 
                        onClick={handleRestartNavigation}
                        className="w-12 h-12 rounded-full bg-slate-900/80 border border-white/10 text-white flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all"
                    >
                        <RotateCcw size={20} />
                    </button>

                    {/* Speed Pill */}
                    <div className="glass-panel px-6 py-3 rounded-full flex flex-col items-center shadow-2xl border-white/10 animate-in zoom-in duration-300">
                        <span className="text-3xl font-bold text-white leading-none tabular-nums tracking-tighter">
                            {Math.round(location.speed ? location.speed * 3.6 : 0)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">km/h</span>
                    </div>

                    <button 
                        onClick={() => handleStopNavigation(false)}
                        className="w-12 h-12 rounded-full bg-ally-danger text-white flex items-center justify-center shadow-lg shadow-ally-danger/30 active:scale-95 transition-all"
                    >
                        <X size={24} />
                    </button>
                   </>
               ) : (
                   /* Empty header when idle, or maybe just menu button handled by search bar */
                   <div />
               )}
          </div>

          {/* B. Lane Assist HUD (Floats below header) */}
          {navState.laneData && <LaneAssist config={navState.laneData} />}

          {/* C. Turn Instruction (Floats below Lane Assist) */}
          {navState.nextTurnInstruction && (
             <div className="mt-2 animate-float-up pointer-events-auto">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-xs mx-auto">
                     <div className="w-10 h-10 rounded-full bg-ally-primary flex items-center justify-center shrink-0">
                         <Navigation className="text-white" size={20} fill="currentColor" />
                     </div>
                     <span className="text-lg font-bold text-white leading-tight">
                         {navState.nextTurnInstruction}
                     </span>
                </div>
             </div>
          )}
      </div>

      {/* --- RIGHT SIDEBAR CONTROLS --- */}
      {/* This container stacks buttons vertically and ensures they don't overlap with bottom elements */}
      <div 
        className={`absolute right-4 flex flex-col items-end gap-3 transition-all duration-500 pointer-events-none z-30 ${
            navState.status === 'NAVIGATING' ? 'bottom-36' : 'bottom-28' /* Adjust based on what's at the bottom */
        }`}
      >
        {/* Pointer events auto re-enabled for buttons */}
        <div className="pointer-events-auto flex flex-col items-end gap-3">
            {/* Chat Assistant REMOVED */}
            
            <div className={`${isMenuOpen ? 'opacity-0 translate-x-10' : 'opacity-100'} transition-all duration-300 delay-75`}>
                <ControlPanel onReport={handleReport} />
            </div>

            {/* Recenter Button (GPS) */}
            <button
                onClick={() => setIsFollowing(true)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all pointer-events-auto ${
                    isFollowing 
                    ? 'bg-white text-ally-primary border-2 border-ally-primary' 
                    : 'bg-slate-800 text-white border border-white/20 animate-bounce'
                }`}
            >
                {isFollowing ? <Navigation size={20} fill="currentColor" /> : <Locate size={20} />}
            </button>
        </div>
      </div>

      {/* --- BOTTOM SHEET AREA --- */}
      {/* Z-index high to cover map but below modals */}
      {navState.status === 'NAVIGATING' ? (
          <TripInfo navState={navState} onCancel={() => handleStopNavigation(false)} />
      ) : (
          <SearchBar 
            user={user} 
            onSelectDestination={handleSelectDestination} 
            onOpenMenu={() => setIsMenuOpen(true)}
            onNavigateToSaved={handleNavigateToSaved}
            onSaveLocation={handleSaveLocation}
          />
      )}

      {/* 3. Full Screen Modals */}
      {!user && <AuthModal onLogin={(u) => setUser(u)} />}
      
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={user}
        onLogout={() => setUser(null)}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <TripPlanner 
        isOpen={isPlannerOpen} 
        onClose={() => setIsPlannerOpen(false)} 
        routes={TRAINING_ROUTES} 
        onSelectRoute={handleStartRoute} 
      />

      <RideHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
      />

    </div>
  );
};

export default App;
