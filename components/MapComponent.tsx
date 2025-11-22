
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Alert, Location, RouteEvent } from '../types';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  currentLocation: Location;
  alerts: Alert[];
  routePath?: Location[];
  activeEvent?: RouteEvent | null;
  isFollowing: boolean;
  onMapInteraction: () => void;
}

const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

// --- INDEXED DB CACHING UTILS ---
const DB_NAME = 'AllyDriveMapCache';
const STORE_NAME = 'tiles';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getCachedTile = async (url: string): Promise<Blob | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(url);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
};

const saveTileToCache = async (url: string, blob: Blob) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, url);
    } catch (e) {
        // Ignore cache write errors (quota exceeded, etc)
    }
};

// Custom Tile Layer Class definition setup
const createCachedTileLayerClass = () => {
    return L.TileLayer.extend({
        createTile: function(coords: any, done: any) {
            const url = this.getTileUrl(coords);
            const img = document.createElement('img');

            // Set leaflet classes
            L.DomUtil.addClass(img, 'leaflet-tile');

            // Load logic
            getCachedTile(url).then((blob) => {
                if (blob) {
                    // Cache Hit
                    const objectUrl = URL.createObjectURL(blob);
                    img.src = objectUrl;
                    // Cleanup object URL when image loads to free memory
                    img.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        done(null, img);
                    };
                    img.onerror = () => {
                        // Fallback to network if blob is bad
                         this._loadNetworkTile(img, url, done);
                    }
                } else {
                    // Cache Miss
                    this._loadNetworkTile(img, url, done);
                }
            });

            return img;
        },

        _loadNetworkTile: function(img: HTMLImageElement, url: string, done: any) {
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.blob();
                })
                .then(blob => {
                    saveTileToCache(url, blob);
                    const objectUrl = URL.createObjectURL(blob);
                    img.src = objectUrl;
                    img.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        done(null, img);
                    };
                })
                .catch(() => {
                    // Standard Leaflet error handling logic via src setting for error tile
                    img.src = url; 
                    L.DomEvent.on(img, 'load', L.Util.bind(this._tileOnLoad, this, done, img));
                    L.DomEvent.on(img, 'error', L.Util.bind(this._tileOnError, this, done, img));
                });
        }
    });
};

const MapComponent: React.FC<MapComponentProps> = ({ currentLocation, alerts, routePath, activeEvent, isFollowing, onMapInteraction }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const eventLayerRef = useRef<L.LayerGroup | null>(null);
  
  const polylineRef = useRef<L.Polyline | null>(null);
  const polylineBorderRef = useRef<L.Polyline | null>(null);
  
  const animationFrameRef = useRef<number>(0);
  
  // Animation Refs
  const targetLocationRef = useRef<Location>(currentLocation);
  const visualLocationRef = useRef<Location>(currentLocation);
  
  // Initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([currentLocation.lat, currentLocation.lng], 18);

      // Use Cached Tile Layer
      const CachedTileLayer = createCachedTileLayerClass() as any;

      // 1. Hybrid Satellite Base
      new CachedTileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri',
        maxZoom: 19,
        crossOrigin: true // Important for caching images via fetch
      }).addTo(mapRef.current);

      // 2. Labels Overlay
      new CachedTileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
        crossOrigin: true
      }).addTo(mapRef.current);

      // Custom Attribution Control
      const attribution = L.control.attribution({ prefix: false });
      attribution.addAttribution('<span style="opacity:0.7">Esri, CARTO, OSRM</span>');
      attribution.addTo(mapRef.current);

      eventLayerRef.current = L.layerGroup().addTo(mapRef.current);

      mapRef.current.on('dragstart', onMapInteraction);
      mapRef.current.on('zoomstart', onMapInteraction);

      // Car Icon
      const carIcon = L.divIcon({
        className: 'custom-car-marker',
        html: `
          <div id="car-marker" style="width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; transition: none; will-change: transform;">
            <div style="position: relative; width: 44px; height: 44px; background: white; border-radius: 50%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #8b5cf6, #4c1d95); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(-45deg); margin-top: -2px;">
                        <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="white"/>
                    </svg>
                </div>
                <div class="gps-ring" style="top: -4px; left: -4px; width: 52px; height: 52px;"></div>
            </div>
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
      });

      markerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: carIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Recenter Effect
  useEffect(() => {
    if (isFollowing && mapRef.current) {
       const loc = visualLocationRef.current;
       mapRef.current.panTo([loc.lat, loc.lng], { animate: true, duration: 0.5 });
    }
  }, [isFollowing]);

  // Update Target on GPS change
  useEffect(() => {
    targetLocationRef.current = currentLocation;
    // If distance is huge (jump), snap immediately
    const d = Math.abs(currentLocation.lat - visualLocationRef.current.lat);
    if (d > 0.1) {
        visualLocationRef.current = currentLocation;
    }
  }, [currentLocation]);

  // Animation Loop (LERP)
  useEffect(() => {
    const animate = () => {
      if (markerRef.current && mapRef.current) {
        const target = targetLocationRef.current;
        const visual = visualLocationRef.current;
        
        const t = 0.08; 

        const newLat = lerp(visual.lat, target.lat, t);
        const newLng = lerp(visual.lng, target.lng, t);

        let currentBearing = visual.bearing || 0;
        const targetBearing = target.bearing || 0;
        let diff = targetBearing - currentBearing;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        const newBearing = currentBearing + diff * t;

        visualLocationRef.current = {
          lat: newLat,
          lng: newLng,
          bearing: newBearing
        };

        const newLatLng = new L.LatLng(newLat, newLng);
        markerRef.current.setLatLng(newLatLng);
        
        const carEl = document.getElementById('car-marker');
        if (carEl) {
          carEl.style.transform = `rotate(${newBearing}deg)`;
        }

        if (isFollowing) {
             const center = mapRef.current.getCenter();
             const dist = center.distanceTo(newLatLng);
             if (dist > 2) { 
                mapRef.current.panTo(newLatLng, { animate: false }); 
             }
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isFollowing]);

  // Popups
  useEffect(() => {
      if (!eventLayerRef.current || !mapRef.current || !activeEvent) return;

      let htmlContent = '';
      let className = '';
      const baseStyle = "background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); color: white; font-family: 'Outfit', sans-serif;";

      if (activeEvent.type === 'SPEED_LIMIT') {
          htmlContent = `<div style="${baseStyle} border-color: #fb7185; color: #fb7185; font-weight: 800; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" class="animate-bounce">${activeEvent.value}</div>`;
          className = 'event-speed-limit';
      } else if (activeEvent.type === 'VOICE_TIP') {
          htmlContent = `<div style="${baseStyle} padding: 12px 20px; border-radius: 24px 24px 24px 4px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 8px;"><span style="font-size: 18px;">✨</span> <span>Dica da Alice</span></div>`;
          className = 'event-voice-tip';
      } else if (activeEvent.type === 'TURN_TEXT') {
           htmlContent = `<div style="${baseStyle} padding: 10px 18px; border-radius: 20px; font-size: 15px; font-weight: 600; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color: #a78bfa; border-color: #8b5cf6;">${activeEvent.value}</div>`;
           className = 'event-turn';
      } else if (activeEvent.type === 'STEEP_HILL') {
           htmlContent = `<div style="${baseStyle} padding: 10px; border-radius: 50%; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-color: #fbbf24; color: #fbbf24; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.4 16.6l-1.6-4.3L15 8l-3.5 5L7 5 2.6 16.6a2 2 0 0 0 1.9 2.4h14.9a2 2 0 0 0 1.9-2.4z"/></svg>
           </div>`;
           className = 'event-hazard';
      } else if (activeEvent.type === 'HIGHWAY_ENTRY') {
           htmlContent = `<div style="${baseStyle} padding: 10px; border-radius: 50%; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-color: #3b82f6; color: #3b82f6; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
           </div>`;
           className = 'event-highway';
      } else if (activeEvent.type === 'DANGER_ZONE') {
           htmlContent = `<div style="${baseStyle} padding: 10px; border-radius: 50%; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-color: #ef4444; color: #ef4444; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
           </div>`;
           className = 'event-danger';
      }

      if (htmlContent) {
          const icon = L.divIcon({ className, html: htmlContent, iconSize: [120, 50], iconAnchor: [60, 80] });
          const spawnLoc = visualLocationRef.current;
          const marker = L.marker([spawnLoc.lat, spawnLoc.lng], { icon, zIndexOffset: 2000 }).addTo(eventLayerRef.current);

          setTimeout(() => {
              const el = marker.getElement();
              if (el) {
                  el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                  el.style.opacity = '0';
                  el.style.transform = 'translateY(-30px)';
              }
              setTimeout(() => { if (eventLayerRef.current) eventLayerRef.current.removeLayer(marker); }, 500);
          }, 3500);
      }
  }, [activeEvent]);

  // Draw Route
  useEffect(() => {
    if (!mapRef.current) return;

    if (routePath && routePath.length > 0) {
        // Border
        if (polylineBorderRef.current) polylineBorderRef.current.setLatLngs(routePath);
        else polylineBorderRef.current = L.polyline(routePath, { color: 'white', weight: 10, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(mapRef.current);

        // Main Line
        if (polylineRef.current) polylineRef.current.setLatLngs(routePath);
        else polylineRef.current = L.polyline(routePath, { color: '#8b5cf6', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(mapRef.current);
    } else {
        if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
        if (polylineBorderRef.current) { polylineBorderRef.current.remove(); polylineBorderRef.current = null; }
    }
  }, [routePath]);

  return (
    <div className="relative h-full w-full z-0 bg-slate-950">
        <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default MapComponent;
