
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Location {
  lat: number;
  lng: number;
  bearing?: number;
  speed?: number; // m/s
  accuracy?: number; // meters
}

export interface Alert {
  id: string;
  type: 'POLICE' | 'ACCIDENT' | 'HAZARD' | 'TRAFFIC';
  location: Location;
  timestamp: number;
}

export interface LaneConfig {
  totalLanes: number;
  recommendedLanes: number[]; // 0-indexed
  turnDirection?: 'left' | 'right' | 'straight' | 'merge-left' | 'merge-right';
  distanceToNextAction: number; // meters
}

export interface NavigationState {
  status: 'IDLE' | 'NAVIGATING' | 'RECALCULATING';
  currentSpeed: number; // km/h
  speedLimit: number; // km/h
  nextTurnInstruction: string;
  distanceToNextTurn: number; // meters
  laneData: LaneConfig | null;
  destination?: string;
  
  // Trip Stats
  eta?: string; // "14:35"
  remainingTime?: string; // "12 min"
  remainingDistance?: string; // "5.4 km"
  totalDistance: number; // meters
  distanceTraveled: number; // meters
}

export interface RideHistoryItem {
    id: string;
    destination: string;
    date: string;
    duration: string;
    distance: string;
    score: number;
}

export interface SearchResult {
    id: string;
    name: string;
    address: string;
    coords: Location;
    routeId: string; // Links to a predefined route path or 'dynamic_route'
}

export interface RouteEvent {
    distanceFromStart: number; // meters
    type: 'SPEED_LIMIT' | 'LANE_ASSIST' | 'VOICE_TIP' | 'TURN_TEXT' | 'STEEP_HILL' | 'HIGHWAY_ENTRY' | 'DANGER_ZONE';
    value: any;
    spokenText?: string;
    triggered?: boolean;
}

export interface RouteDefinition {
    id: string;
    title: string; // Display name for planner
    description: string; // Detailed description
    difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
    trafficComplexity?: 'Baixo' | 'Médio' | 'Alto' | 'Caótico';
    tags?: string[]; // e.g. "Ladeiras", "Retornos", "Via Rápida"
    totalDistanceKm: number;
    path: Location[];
    events: RouteEvent[];
    maneuvers?: any[]; // Raw OSRM steps
}

export interface SavedLocations {
    home?: SearchResult;
    work?: SearchResult;
}

export interface User {
    id: string;
    name: string;
    email?: string; 
    avatar?: string;
    isAnonymous: boolean;
    savedLocations?: SavedLocations;
    points?: number;
    level?: string;
}

export interface UserSettings {
    soundEnabled: boolean;
    voiceVolume: number; // 0 to 1
    mapTheme: 'dark' | 'light' | 'auto';
    avoidTolls: boolean;
    newDriverMode: boolean; // Enables extra helps for hills, highways, etc.
}
