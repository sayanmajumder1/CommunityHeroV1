import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Custom Marker Generator
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'Critical': return '#e11d48'; // Red
    case 'High': return '#f97316'; // Orange
    case 'Medium': return '#eab308'; // Yellow
    default: return '#10b981'; // Emerald
  }
};

const createCustomIcon = (severity: string, status: string) => {
  const color = getSeverityColor(severity);
  const opacity = status === 'Resolved' ? '0.4' : '1';
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      opacity: ${opacity};
    "></div>`,
    className: 'custom-leaflet-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function CitizenMapView() {
  const issues = useStore((state) => state.issues);
  const fetchIssues = useStore((state) => state.fetchIssues);
  const [mapMode, setMapMode] = useState<'standard' | 'heatmap'>('standard');

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
        <div class="text-left font-sans min-w-[150px] space-y-1.5 p-0.5">
          <div class="flex justify-between items-center gap-2 mb-1">
            <span class="text-[9px] font-black uppercase bg-neutral-150 px-1 rounded text-neutral-700">
              ${issue.category}
            </span>
            <span class="text-[8px] font-black uppercase px-1 rounded ${
              issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
            }">
              ${issue.status}
            </span>
          </div>
          <h4 class="text-xs font-black text-neutral-900 m-0 leading-tight">${issue.title}</h4>
          <p class="text-[10px] text-neutral-500 m-0 leading-normal line-clamp-2">${issue.description}</p>
          ${issue.imageUrl && issue.imageUrl.length < 50000 ? `<img src="${issue.imageUrl}" alt="" class="w-full h-16 object-cover rounded mt-1.5" />` : ''}
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
            toast.success('Centered on your GPS location');
          }
        },
        () => {
          toast.error('Unable to retrieve GPS coordinates');
        }
      );
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4 font-sans" id="citizen-map-workspace">
      
      {/* Map Control Board */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-xs text-left flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Ward Issue Map</h3>
          <p className="text-[10px] text-neutral-400 font-semibold">Track resolving activity near you</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setMapMode(prev => prev === 'standard' ? 'heatmap' : 'standard');
              toast.success(`Switched map layer to ${mapMode === 'standard' ? 'Heatmap visualization' : 'Standard marker layout'}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-[10px] font-black uppercase text-neutral-700 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapMode === 'standard' ? 'Heatmap' : 'Standard'}</span>
          </button>
          
          <button
            onClick={handleLocateUser}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Pure Leaflet Map Frame */}
      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden h-96 shadow-xs relative z-10">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Map Legend */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-xs text-left grid grid-cols-4 gap-2">
        {[
          { label: 'Critical', color: 'bg-rose-600' },
          { label: 'High', color: 'bg-orange-500' },
          { label: 'Medium', color: 'bg-yellow-500' },
          { label: 'Low', color: 'bg-emerald-500' }
        ].map(leg => (
          <div key={leg.label} className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded-full ${leg.color} border-2 border-white shadow-xs shrink-0`} />
            <span className="text-[10px] font-bold text-neutral-500">{leg.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
