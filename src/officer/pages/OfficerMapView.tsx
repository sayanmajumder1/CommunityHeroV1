import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Custom Marker Generator
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'Critical': return '#f43f5e'; // rose-500
    case 'High': return '#f97316'; // orange-500
    case 'Medium': return '#eab308'; // yellow-500
    default: return '#3b82f6'; // blue-500
  }
};

const createCustomIcon = (severity: string, status: string) => {
  const color = getSeverityColor(severity);
  const opacity = status === 'Resolved' ? '0.3' : '1';
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3.5px solid #18181b;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
      opacity: ${opacity};
    "></div>`,
    className: 'custom-leaflet-marker-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

export default function OfficerMapView() {
  const issues = useStore((state) => state.issues);
  const [mapMode, setMapMode] = useState<'standard' | 'heatmap'>('standard');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = issues.length > 0 
      ? [issues[0].location.lat, issues[0].location.lng]
      : [12.9716, 77.5946];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark styled basemaps for Officer Portal theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    // Zoom to fit bounds if issues exist
    if (issues.length > 0) {
      const coords = issues.map(i => [i.location.lat, i.location.lng] as L.LatLngExpression);
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 14 });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Update Markers when issues alter
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    issues.forEach((issue) => {
      const marker = L.marker([issue.location.lat, issue.location.lng], {
        icon: createCustomIcon(issue.severity, issue.status)
      });

      const popupContent = `
        <div class="text-left font-sans min-w-[170px] space-y-1.5 p-1 text-zinc-100 bg-zinc-900 rounded">
          <div class="flex justify-between items-center gap-2 mb-1">
            <span class="text-[9px] font-black uppercase bg-zinc-800 px-1 rounded text-zinc-300">
              ${issue.category}
            </span>
            <span class="text-[8px] font-black uppercase px-1 rounded ${
              issue.status === 'Resolved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
            }">
              ${issue.status}
            </span>
          </div>
          <h4 class="text-xs font-black text-white m-0 leading-tight">${issue.title}</h4>
          <p class="text-[10px] text-zinc-400 m-0 leading-normal line-clamp-2">${issue.description}</p>
          ${issue.imageUrl ? `<img src="${issue.imageUrl}" alt="" class="w-full h-16 object-cover rounded mt-1.5" />` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      layerGroupRef.current?.addLayer(marker);
    });
  }, [issues]);

  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapRef.current) {
            const coords: L.LatLngExpression = [position.coords.latitude, position.coords.longitude];
            mapRef.current.setView(coords, 15);
            toast.success('Operational map centered on GPS coordinates');
          }
        },
        () => {
          toast.error('Unable to retrieve operational coordinates');
        }
      );
    }
  };

  return (
    <div className="space-y-6 text-left font-sans" id="officer-map-view">
      
      {/* Top control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">GIS COMMAND CONTROL</span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Zone 4 GIS Geofence Stream</h1>
          <p className="text-xs text-slate-500 font-semibold">Track outstanding dispatches and verify real-time report locations.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => {
              setMapMode(prev => prev === 'standard' ? 'heatmap' : 'standard');
              toast.success(`Operational GIS view switched to ${mapMode === 'standard' ? 'Heatmap overlay' : 'Standard dispatch'}`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Mode: {mapMode === 'standard' ? 'Standard' : 'Heatmap'}</span>
          </button>
          
          <button
            onClick={handleLocateUser}
            className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>GPS Locate</span>
          </button>
        </div>
      </div>

      {/* Pure Leaflet Map Frame */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden h-96 shadow-sm relative z-10">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Map Legend */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left grid grid-cols-4 gap-2">
        {[
          { label: 'Critical Alert', color: 'bg-red-500' },
          { label: 'High Priority', color: 'bg-orange-500' },
          { label: 'Medium Ticket', color: 'bg-yellow-500' },
          { label: 'Routine SLA', color: 'bg-sky-500' }
        ].map(leg => (
          <div key={leg.label} className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded-full ${leg.color} border-2 border-white shadow-xs shrink-0`} />
            <span className="text-[10px] font-bold text-slate-500">{leg.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
