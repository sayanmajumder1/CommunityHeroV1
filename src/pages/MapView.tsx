import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { 
  MapPin, AlertCircle, ThumbsUp, Calendar, 
  Layers, Compass, Flame, ShieldAlert, Navigation,
  Crosshair, ChevronRight, CheckCircle, RefreshCw, Sun, Moon 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import L from 'leaflet';

// Custom HTML vector marker icon generator for issues
const createIssueIcon = (severity: string, isSelected: boolean) => {
  const colorMap: Record<string, string> = {
    Critical: '#ef4444', // Red
    High: '#f59e0b',     // Amber
    Medium: '#eab308',   // Yellow
    Low: '#3b82f6',      // Blue
  };
  const color = colorMap[severity] || '#3b82f6';
  const size = isSelected ? 32 : 24;
  
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
        ${severity === 'Critical' ? `
          <div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${color};"></div>
        ` : ''}
        <div class="absolute rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white" 
             style="background-color: ${color}; width: ${size}px; height: ${size}px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 16 : 12}" height="${isSelected ? 16 : 12}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Custom HTML marker for the current user location
const createUserIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse"></div>
        <div class="absolute inset-1.5 rounded-full bg-blue-500/50 animate-ping"></div>
        <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom HTML marker for clustered issues
const createClusterIcon = (count: number) => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <div class="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse"></div>
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs border-2 border-white shadow-lg hover:scale-110 transition-transform">
          ${count}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function MapView() {
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);

  // Active Map Mode: 'standard' | 'heatmap' | 'cluster'
  const [mapMode, setMapMode] = useState<'standard' | 'heatmap' | 'cluster'>('standard');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [routingTargetId, setRoutingTargetId] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');

  // References for Leaflet integration
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Find currently selected issue
  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Compute Grid Clusters dynamically in coordinate space
  const clusters = useMemo(() => {
    if (mapMode !== 'cluster') return [];
    const step = 0.015; // Grid spacing in degrees
    const grid: { [key: string]: typeof issues } = {};

    issues.forEach(issue => {
      const col = Math.floor(issue.location.lng / step);
      const row = Math.floor(issue.location.lat / step);
      const key = `${col}_${row}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(issue);
    });

    return Object.values(grid).map(items => {
      const avgLat = items.reduce((sum, item) => sum + item.location.lat, 0) / items.length;
      const avgLng = items.reduce((sum, item) => sum + item.location.lng, 0) / items.length;
      return {
        id: `cluster_${items[0].id}`,
        lat: avgLat,
        lng: avgLng,
        count: items.length,
        items,
      };
    });
  }, [issues, mapMode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center map around first seed issue or Bengaluru center
    const defaultCenter: L.LatLngExpression = issues.length > 0 
      ? [issues[0].location.lat, issues[0].location.lng]
      : [12.9716, 77.5946];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    // Custom placement for the standard zoom buttons
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer setup (Command Dark by default)
    const initialTileUrl = mapTheme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(initialTileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    layerGroupRef.current = layerGroup;

    // Zoom out map bounds to frame all active reported coordinates elegantly
    if (issues.length > 0) {
      const coordinates = issues.map(i => [i.location.lat, i.location.lng] as L.LatLngExpression);
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Map base-click to clear selected issue state
    map.on('click', () => {
      setSelectedIssueId(null);
    });

    // Trigger invalidateSize to properly calculate bounding container in dynamic layouts
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Sync Map Theme changes dynamically
  useEffect(() => {
    if (tileLayerRef.current) {
      const newUrl = mapTheme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(newUrl);
    }
  }, [mapTheme]);

  // Sync Map Layers & Markers when state parameters alter
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clean preceding layers
    layerGroup.clearLayers();

    // 1. Draw individual Markers (Standard Mode)
    if (mapMode === 'standard') {
      issues.forEach(issue => {
        const isSelected = issue.id === selectedIssueId;
        const marker = L.marker([issue.location.lat, issue.location.lng], {
          icon: createIssueIcon(issue.severity, isSelected)
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedIssueId(issue.id);
        });

        marker.addTo(layerGroup);
      });
    }

    // 2. Draw Concentric Pulsing Heatmap Overlays (Heatmap Mode)
    if (mapMode === 'heatmap') {
      issues.forEach(issue => {
        const outerCircle = L.circle([issue.location.lat, issue.location.lng], {
          radius: 300,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          weight: 1,
        });

        const innerCircle = L.circle([issue.location.lat, issue.location.lng], {
          radius: 100,
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.25,
          weight: 1,
        });

        outerCircle.addTo(layerGroup);
        innerCircle.addTo(layerGroup);
      });
    }

    // 3. Draw Dynamic Coordinate Clusters (Clustering Mode)
    if (mapMode === 'cluster') {
      clusters.forEach(c => {
        const clusterMarker = L.marker([c.lat, c.lng], {
          icon: createClusterIcon(c.count)
        });

        clusterMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedIssueId(c.items[0].id);
          map.setView([c.lat, c.lng], map.getZoom() + 1, { animate: true });
        });

        clusterMarker.addTo(layerGroup);
      });
    }

    // 4. Draw Current Live User Tracker location
    if (myLocation) {
      const userMarker = L.marker([myLocation.lat, myLocation.lng], {
        icon: createUserIcon()
      });
      userMarker.addTo(layerGroup);

      // 5. Draw dispatch path router line overlay
      if (routingTargetId) {
        const target = issues.find(i => i.id === routingTargetId);
        if (target) {
          const polyline = L.polyline([
            [myLocation.lat, myLocation.lng],
            [target.location.lat, target.location.lng]
          ], {
            color: '#2563eb',
            weight: 5,
            dashArray: '8, 6',
            opacity: 0.8
          });
          polyline.addTo(layerGroup);
        }
      }
    }
  }, [issues, mapMode, selectedIssueId, myLocation, routingTargetId, clusters]);

  // Animate Map Pan to newly focused issue coordinate
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssueId) return;

    const issue = issues.find(i => i.id === selectedIssueId);
    if (issue) {
      map.setView([issue.location.lat, issue.location.lng], 15, {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedIssueId]);

  // Toggle GPS Connection
  const handleToggleGPS = () => {
    if (gpsTracking) {
      setGpsTracking(false);
      setMyLocation(null);
      setRoutingTargetId(null);
      toast.success('GPS tracking disconnected');
    } else {
      setGpsTracking(true);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setMyLocation(userLoc);
            toast.success('GPS live connection acquired');
            if (mapRef.current) {
              mapRef.current.setView([userLoc.lat, userLoc.lng], 14, { animate: true });
            }
          },
          () => {
            // Fallback coordinate inside Bengaluru bounds for previewing
            const fallbackLoc = { lat: 12.9716, lng: 77.5946 };
            setMyLocation(fallbackLoc);
            toast.success('Simulated GPS connection loaded (Bengaluru Center)');
            if (mapRef.current) {
              mapRef.current.setView([fallbackLoc.lat, fallbackLoc.lng], 14, { animate: true });
            }
          }
        );
      } else {
        const fallbackLoc = { lat: 12.9716, lng: 77.5946 };
        setMyLocation(fallbackLoc);
        toast.success('Simulated GPS connection loaded');
        if (mapRef.current) {
          mapRef.current.setView([fallbackLoc.lat, fallbackLoc.lng], 14, { animate: true });
        }
      }
    }
  };

  // Route Planning Calculations
  const activeRoute = useMemo(() => {
    if (!myLocation || !routingTargetId) return null;
    const target = issues.find(i => i.id === routingTargetId);
    if (!target) return null;

    // Metric approximation calculations
    const latDiff = Math.abs(myLocation.lat - target.location.lat) * 111;
    const lngDiff = Math.abs(myLocation.lng - target.location.lng) * 88;
    const kmDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    return {
      km: kmDistance.toFixed(2),
      targetTitle: target.title,
      targetAddress: target.location.address || 'Report Location',
      steps: [
        { text: 'Depart current location onto adjacent arterial municipal street', dist: '150m' },
        { text: `Turn toward intersection heading for target coordinates: ${target.location.lat.toFixed(4)}, ${target.location.lng.toFixed(4)}`, dist: '600m' },
        { text: `Arrive at dispatched community report destination: ${target.title}`, dist: 'Destination' },
      ],
    };
  }, [myLocation, routingTargetId, issues]);

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-12rem)] max-w-7xl mx-auto space-y-4">
      {/* Premium Navigation and Command Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-600 animate-spin-slow" />
            Geospatial Civic Command Grid
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Real-time interactive GIS mapping of active municipal infractions, heatmap density projections, and live route navigation.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMapMode('standard')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              mapMode === 'standard' 
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            <Layers className="w-4 h-4" /> Standard Map
          </button>
          <button
            onClick={() => setMapMode('heatmap')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              mapMode === 'heatmap' 
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            <Flame className="w-4 h-4" /> Density Heatmap
          </button>
          <button
            onClick={() => setMapMode('cluster')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              mapMode === 'cluster' 
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            <Compass className="w-4 h-4" /> Clustering Grid
          </button>
          <button
            onClick={handleToggleGPS}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              gpsTracking 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/10' 
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            <Crosshair className="w-4 h-4" /> {gpsTracking ? 'GPS Active' : 'Enable GPS'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:overflow-hidden overflow-visible">
        
        {/* Leaflet Map Interactive viewport */}
        <div className="lg:col-span-2 bg-neutral-900 rounded-2xl border border-neutral-200/80 shadow-md relative overflow-hidden flex flex-col min-h-[350px] sm:min-h-[450px] lg:h-full">
          
          {/* Tile Layer Premium Theme Selector overlay */}
          <div className="absolute top-4 left-4 z-[1000] flex gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200/80 shadow-md">
            <button
              onClick={() => setMapTheme('dark')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapTheme === 'dark' 
                  ? 'bg-neutral-900 text-white shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Command Dark
            </button>
            <button
              onClick={() => setMapTheme('light')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapTheme === 'light' 
                  ? 'bg-neutral-900 text-white shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Civic Light
            </button>
          </div>

          {/* Map HUD telemetry telemetry details */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-neutral-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 font-mono text-[10px] flex items-center gap-2.5 shadow-xl">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-200">REAL-TIME GIS FEED</span>
              <span className="text-neutral-400 text-[9px]">Map center: Bengaluru Metropolitan</span>
            </div>
          </div>

          {/* Leaflet container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] flex-1 z-0" id="leaflet-main-viewport" />

          {/* Footer indicators */}
          <div className="bg-neutral-950 px-4 py-2 border-t border-neutral-800 flex items-center justify-between text-neutral-400 text-[10px] font-mono z-10 select-none">
            <span>Rendered Infractions: {issues.length}</span>
            <span>Scale Limit: Normal</span>
          </div>
        </div>

        {/* Dynamic Detail HUD Inspector */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 overflow-y-auto flex flex-col gap-5">
          {selectedIssue ? (
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 uppercase tracking-wide border border-blue-100">
                    {selectedIssue.category}
                  </span>
                  <h3 className="text-md font-bold text-neutral-900 mt-1">{selectedIssue.title}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  selectedIssue.severity === 'Critical' 
                    ? 'bg-rose-50 text-rose-800 border border-rose-100' 
                    : selectedIssue.severity === 'High'
                    ? 'bg-amber-50 text-amber-800 border border-amber-100'
                    : 'bg-neutral-50 text-neutral-700 border border-neutral-100'
                }`}>
                  {selectedIssue.severity} Severity
                </span>
              </div>

              {selectedIssue.imageUrl && (
                <div className="rounded-xl overflow-hidden h-32 bg-neutral-100 border border-neutral-200">
                  <img src={selectedIssue.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-neutral-100">
                {selectedIssue.description}
              </p>

              <div className="text-xs space-y-2 border-t border-neutral-100 pt-3 text-neutral-500 font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" /> 
                  <span className="truncate text-neutral-700 font-semibold">{selectedIssue.location.address || 'Address Provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" /> 
                  <span>Reported {format(selectedIssue.createdAt, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-500 shrink-0" /> 
                  <span className="text-emerald-700">Verified by {selectedIssue.upvotes} neighbors</span>
                </div>
              </div>

              {/* Routing Controls */}
              {myLocation ? (
                <div className="border-t border-neutral-100 pt-3 flex gap-2">
                  {routingTargetId === selectedIssue.id ? (
                    <button
                      onClick={() => setRoutingTargetId(null)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 rounded-xl py-2.5 text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Cancel Navigation
                    </button>
                  ) : (
                    <button
                      onClick={() => setRoutingTargetId(selectedIssue.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg ring-2 ring-blue-500/10"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Navigate to Issue
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs text-neutral-600 text-center leading-normal">
                  💡 <strong>Tip:</strong> Enable GPS in the top controls to calculate dispatch directions and navigation steps to this issue location.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
              <MapPin className="w-10 h-10 text-neutral-300 mb-2.5 animate-bounce" />
              <h4 className="text-sm font-bold text-neutral-800">Map Inspection HUD</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-[200px]">
                Select an active vector pin on the map to display report details or plan your dispatch path.
              </p>
            </div>
          )}

          {/* Active Navigation Steps Panel */}
          {activeRoute && (
            <div className="border-t border-neutral-200/80 pt-4 space-y-3">
              <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl">
                <h4 className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Navigation className="w-3.5 h-3.5 fill-blue-700 animate-pulse" />
                  Active Dispatch Router
                </h4>
                <div className="flex justify-between items-center text-xs mt-1.5 text-blue-600 font-medium">
                  <span className="truncate max-w-[150px]">To: {activeRoute.targetTitle}</span>
                  <span>Est: {activeRoute.km} km</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-mono text-[9px] font-bold text-blue-700 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-neutral-700 font-medium leading-normal">{step.text}</p>
                      <span className="text-[10px] text-neutral-400 font-bold">{step.dist}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
