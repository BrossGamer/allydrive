
import { Location, RouteDefinition, RouteEvent, SearchResult } from '../types';

// Haversine formula to calculate distance between two points in meters
export const getDistanceMeters = (p1: Location, p2: Location): number => {
  const R = 6371e3; // metres
  const φ1 = p1.lat * Math.PI/180; // φ, λ in radians
  const φ2 = p2.lat * Math.PI/180;
  const Δφ = (p2.lat-p1.lat) * Math.PI/180;
  const Δλ = (p2.lng-p1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Calculate bearing between two points
export const getBearing = (start: Location, end: Location): number => {
  const startLat = start.lat * Math.PI / 180;
  const startLng = start.lng * Math.PI / 180;
  const endLat = end.lat * Math.PI / 180;
  const endLng = end.lng * Math.PI / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
};

export const getCoordinatesFromAddress = async (query: string): Promise<SearchResult[]> => {
  try {
    // Optimize search: Focus on Brazil, limit 5 results to give options, detail address
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=br`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    
    if (data && Array.isArray(data)) {
      return data.map((item: any) => {
          const addr = item.address || {};
          
          // Smart Name Construction: Prefer "Road, Number" or "POI Name"
          let mainName = item.name;
          
          // If the 'name' returned is just the road, or if we have a road but no specific POI name
          if (!mainName || (addr.road && item.display_name.startsWith(addr.road))) {
              mainName = addr.road || addr.pedestrian || addr.street || item.name;
          }
          
          // Append house number if available and not already in name
          if (addr.house_number && mainName && !mainName.includes(addr.house_number)) {
              mainName += `, ${addr.house_number}`;
          }

          // Fallback if name is still empty
          if (!mainName) mainName = item.display_name.split(',')[0];

          // Smart Subtitle Construction: Neighborhood, City - State
          const subtitleParts = [];
          if (addr.suburb) subtitleParts.push(addr.suburb);
          else if (addr.neighbourhood) subtitleParts.push(addr.neighbourhood);
          else if (addr.city_district) subtitleParts.push(addr.city_district);
          
          if (addr.city) subtitleParts.push(addr.city);
          else if (addr.town) subtitleParts.push(addr.town);
          else if (addr.municipality) subtitleParts.push(addr.municipality);

          // State abbreviation is usually better
          const state = addr.state_code || (addr.state ? addr.state.substring(0,2).toUpperCase() : "");
          if (state) subtitleParts.push(state);
          else if (addr.postcode) subtitleParts.push(addr.postcode);

          return {
            id: item.place_id || Math.random().toString(),
            name: mainName,
            address: subtitleParts.join(', ') || "Endereço encontrado",
            coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
            routeId: 'dynamic_route'
          };
      });
    }
    return [];
  } catch (e) {
    console.error("Geocoding error", e);
    return [];
  }
};

export const getRouteFromOSRM = async (start: Location, end: Location, destinationName: string): Promise<RouteDefinition> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
    
    const events: RouteEvent[] = [];
    let accumulatedDistance = 0;

    route.legs[0].steps.forEach((step: any) => {
        const distance = step.distance;
        const name = step.name || "";
        const lowerName = name.toLowerCase();

        // 1. Turn Instructions & Lane Assist
        if (step.maneuver) {
            const type = step.maneuver.type;
            const modifier = step.maneuver.modifier;
            
            let turnText = "";
            if (type === 'turn' || type === 'merge') {
                if (modifier && modifier.includes('left')) turnText = "Vire à esquerda";
                if (modifier && modifier.includes('right')) turnText = "Vire à direita";
                if (modifier && modifier.includes('slight left')) turnText = "Mantenha à esquerda";
                if (modifier && modifier.includes('slight right')) turnText = "Mantenha à direita";
            } else if (type === 'roundabout') {
                 turnText = "Na rotatória, pegue a saída";
            } else if (type === 'arrive') {
                turnText = "Você chegou";
            }

            if (turnText) {
                // Trigger alert 150m before the turn
                const triggerDist = Math.max(0, accumulatedDistance - 150);
                
                events.push({
                    distanceFromStart: triggerDist, 
                    type: 'TURN_TEXT',
                    value: turnText,
                    spokenText: turnText,
                    triggered: false
                });
                
                // Lane Assist Logic
                if ((type === 'turn' || type === 'merge') && modifier) {
                     events.push({
                        distanceFromStart: Math.max(0, accumulatedDistance - 300),
                        type: 'LANE_ASSIST',
                        value: {
                            totalLanes: 3,
                            recommendedLanes: modifier.includes('left') ? [0] : [2],
                            turnDirection: modifier.includes('left') ? 'left' : 'right',
                            distanceToNextAction: 200
                        },
                        triggered: false
                    });
                }
            }
        }

        // 2. New Driver Protection System (Heuristics)
        const triggerDist = Math.max(0, accumulatedDistance - 100); // Alert 100m before entering the road segment

        // A. STEEP HILLS (Ladeiras)
        if (lowerName.includes('ladeira') || lowerName.includes('serra') || lowerName.includes('morro') || lowerName.includes('alto da')) {
            events.push({
                distanceFromStart: triggerDist,
                type: 'STEEP_HILL',
                value: 'Subida Íngreme',
                spokenText: 'Atenção, subida forte à frente. Reduza a marcha e mantenha distância.',
                triggered: false
            });
        }

        // B. HIGHWAY ENTRY (Rodovias)
        if (lowerName.includes('br-') || lowerName.includes('rodovia') || lowerName.includes('anel') || lowerName.includes('via expressa')) {
            // Avoid duplicate highway alerts if we are already on one (check previous events roughly)
            const alreadyWarned = events.some(e => e.type === 'HIGHWAY_ENTRY' && Math.abs(e.distanceFromStart - triggerDist) < 2000);
            
            if (!alreadyWarned) {
                events.push({
                    distanceFromStart: triggerDist,
                    type: 'HIGHWAY_ENTRY',
                    value: 'Entrando em Rodovia',
                    spokenText: 'Entrando em via rápida. Acelere para acompanhar o fluxo e use a seta.',
                    triggered: false
                });
            }
        }

        // C. DANGER ZONES (Roundabouts or Complex Intersections)
        if (step.maneuver.type === 'roundabout') {
             events.push({
                distanceFromStart: Math.max(0, accumulatedDistance - 200),
                type: 'DANGER_ZONE',
                value: 'Atenção: Rotatória',
                spokenText: 'Rotatória à frente. A preferência é de quem já está nela.',
                triggered: false
             });
        }

        accumulatedDistance += step.distance;
    });

    // Basic Speed Limits (Mocked logic since OSRM free doesn't provide it accurately everywhere)
    events.push({ distanceFromStart: 0, type: 'SPEED_LIMIT', value: 60, triggered: false });

    return {
        id: `route_${Date.now()}`,
        title: destinationName,
        description: `Distância: ${Math.round(route.distance/1000)}km`,
        difficulty: 'Iniciante',
        totalDistanceKm: parseFloat((route.distance / 1000).toFixed(1)),
        path: coordinates,
        events: events.sort((a, b) => a.distanceFromStart - b.distanceFromStart),
        maneuvers: route.legs[0].steps
    };

  } catch (error) {
    console.error("Routing error", error);
    // Very simple fallback straight line
    return {
        id: 'fallback',
        title: destinationName,
        description: "Rota direta (Offline)",
        difficulty: 'Iniciante',
        totalDistanceKm: 0.5,
        path: [start, end],
        events: []
    };
  }
};