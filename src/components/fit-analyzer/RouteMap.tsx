import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GpsPoint {
  lat: number;
  lng: number;
  time?: number;
}

interface RouteMapProps {
  gpsData: GpsPoint[];
  hoveredPoint?: { lat: number; lng: number } | null;
}

const RouteMap: React.FC<RouteMapProps> = ({ gpsData, hoveredPoint }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || gpsData.length === 0) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Filter valid GPS points
    const validPoints = gpsData.filter(
      point => point.lat && point.lng && 
      Math.abs(point.lat) <= 90 && 
      Math.abs(point.lng) <= 180 &&
      point.lat !== 0 && point.lng !== 0
    );

    if (validPoints.length === 0) return;

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add tile layer with dark theme support
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create polyline coordinates
    const routeCoordinates: L.LatLngExpression[] = validPoints.map(point => [point.lat, point.lng]);

    // Add route polyline with gradient effect
    const routePolyline = L.polyline(routeCoordinates, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Create custom icons for start and end markers
    const startIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const endIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add start marker
    const startPoint = validPoints[0];
    L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
      .bindPopup('<strong>Départ</strong>')
      .addTo(map);

    // Add end marker
    const endPoint = validPoints[validPoints.length - 1];
    L.marker([endPoint.lat, endPoint.lng], { icon: endIcon })
      .bindPopup('<strong>Arrivée</strong>')
      .addTo(map);

    // Fit map to route bounds
    map.fitBounds(routePolyline.getBounds(), {
      padding: [30, 30],
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpsData]);

  // Handle hovered point marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing hover marker
    if (hoverMarkerRef.current) {
      hoverMarkerRef.current.remove();
      hoverMarkerRef.current = null;
    }

    // Add new hover marker if point is valid
    if (hoveredPoint && hoveredPoint.lat && hoveredPoint.lng) {
      const hoverIcon = L.divIcon({
        className: 'hover-marker',
        html: `<div style="
          width: 16px;
          height: 16px;
          background: #f59e0b;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.8), 0 2px 8px rgba(0,0,0,0.3);
          animation: pulse 1s ease-in-out infinite;
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      hoverMarkerRef.current = L.marker([hoveredPoint.lat, hoveredPoint.lng], { 
        icon: hoverIcon,
        zIndexOffset: 1000 
      }).addTo(mapInstanceRef.current);
    }
  }, [hoveredPoint]);

  if (gpsData.length === 0) {
    return null;
  }

  // Check if we have valid GPS data
  const validPoints = gpsData.filter(
    point => point.lat && point.lng && 
    Math.abs(point.lat) <= 90 && 
    Math.abs(point.lng) <= 180 &&
    point.lat !== 0 && point.lng !== 0
  );

  if (validPoints.length === 0) {
    return null;
  }

  // Calculate distance (approximate)
  const calculateTotalDistance = () => {
    let totalDistance = 0;
    for (let i = 1; i < validPoints.length; i++) {
      const lat1 = validPoints[i - 1].lat * Math.PI / 180;
      const lat2 = validPoints[i].lat * Math.PI / 180;
      const deltaLat = (validPoints[i].lat - validPoints[i - 1].lat) * Math.PI / 180;
      const deltaLng = (validPoints[i].lng - validPoints[i - 1].lng) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += 6371 * c; // Earth's radius in km
    }
    return totalDistance;
  };

  const distance = calculateTotalDistance();

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <MapPin className="h-5 w-5 text-blue-400" />
          </div>
          Parcours GPS
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {distance.toFixed(2)} km • {validPoints.length} points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.8; }
          }
        `}</style>
        <div 
          ref={mapRef} 
          className="h-[400px] w-full"
          style={{ zIndex: 0 }}
        />
      </CardContent>
    </Card>
  );
};

export default RouteMap;
