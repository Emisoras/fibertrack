'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryItem, Fiber } from "@/lib/types";
import { Network, Box, Spline, Split, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const getElementIconComponent = (tipo: InventoryItem["tipo"]) => {
  switch (tipo) {
    case "Odf":
      return <Network className="h-4 w-4" />;
    case "CajaNap":
      return <Box className="h-4 w-4" />;
    case "Mufla":
      return <Spline className="h-4 w-4" />;
    case "Splitter":
        return <Split className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
};

const getFiberStyle = (threadCount: number, isHighlighted: boolean) => {
  if (isHighlighted) {
    return { color: '#00ffff', weight: 6, opacity: 1 };
  }
  if (threadCount >= 288) {
    return { color: 'hsl(var(--destructive))', weight: 5, opacity: 0.8 };
  }
  if (threadCount >= 144) {
    return { color: 'hsl(var(--chart-1))', weight: 4, opacity: 0.8 };
  }
  if (threadCount >= 48) {
    return { color: 'hsl(var(--chart-2))', weight: 3, opacity: 0.7 };
  }
  if (threadCount >= 12) {
    return { color: 'hsl(var(--chart-4))', weight: 2.5, opacity: 0.7 };
  }
  return { color: 'hsl(var(--primary))', weight: 2, opacity: 0.6 };
};

function FlyToController({ coords }: { coords: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], 18);
  }, [coords, map]);

  return null;
}

type DynamicMapProps = {
  elements: InventoryItem[];
  fibers: Fiber[];
  focusCoords?: { lat: number; lng: number } | null;
  highlightedFiberIds?: string[];
  highlightedElementIds?: string[];
}

export default function DynamicMap({ elements, fibers, focusCoords, highlightedFiberIds = [], highlightedElementIds = [] }: DynamicMapProps) {
    const [L, setL] = useState<typeof import('leaflet') | null>(null);

    useEffect(() => {
        import('leaflet').then(leaflet => {
            setL(leaflet);
        });
    }, []);

    if (!L) {
        return <Skeleton className="h-full w-full rounded-lg" />;
    }

    const createIcon = (element: InventoryItem, isHighlighted: boolean) => {
        const iconComponent = getElementIconComponent(element.tipo);
        const highlightClass = isHighlighted ? 'shadow-[0_0_15px_3px_rgba(0,255,255,0.9)]' : '';
        const iconHtml = renderToStaticMarkup(
            <div className={cn("rounded-full p-2 flex items-center justify-center text-white shadow-lg", 
                element.estado === 'Activo' ? 'bg-green-500' :
                element.estado === 'Corte' ? 'bg-orange-500' :
                element.estado === 'Inactivo' ? 'bg-red-500' :
                'bg-gray-500',
                highlightClass
            )}>
                {iconComponent}
            </div>
        );
        
        return L.divIcon({
            html: iconHtml,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    };
    
    const getCoords = (el: InventoryItem): [number, number] | null => {
        const lat = (el as any).latitude;
        const lng = (el as any).longitude;
        if (typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)) {
            return [lat, lng];
        }
        return null;
    }

    // Group elements by coordinate string
    const coordsMap = new Map<string, (InventoryItem & { coords: [number, number] })[]>();
    elements
        .map(el => ({ ...el, coords: getCoords(el) }))
        .filter(el => el.coords !== null)
        .forEach(el => {
            const castEl = el as (InventoryItem & { coords: [number, number] });
            const key = castEl.coords!.join(',');
            if (!coordsMap.has(key)) {
                coordsMap.set(key, []);
            }
            coordsMap.get(key)!.push(castEl);
        });

    // Jitter overlapping elements
    const validElements: (InventoryItem & { coords: [number, number] })[] = [];
    const JITTER_AMOUNT = 0.00015; // Leaflet map offset
    
    const hierarchy: Record<string, number> = {
        "Splitter": 1,
        "CajaNap": 2,
        "Odf": 3,
        "Mufla": 4,
    };

    coordsMap.forEach((elementsAtCoord) => {
        if (elementsAtCoord.length > 1) {
            // Sort elements based on hierarchy before applying jitter
            // Lower hierarchy items are rendered first (bottom), higher ones last (top)
            elementsAtCoord.sort((a, b) => (hierarchy[a.tipo] || 0) - (hierarchy[b.tipo] || 0));

            elementsAtCoord.forEach((element, index) => {
                // Apply a spiral jitter to visually separate the icons
                const angle = index * (Math.PI * (3 - Math.sqrt(5))); // Golden angle for spiral distribution
                const radius = JITTER_AMOUNT * Math.sqrt(index);
                const newLat = element.coords[0] + radius * Math.cos(angle);
                const newLng = element.coords[1] + radius * Math.sin(angle);
                validElements.push({ ...element, coords: [newLat, newLng] });
            });
        } else {
            validElements.push(...elementsAtCoord);
        }
    });
    
    const fiberLines = (fibers || []).map(fiber => {
        const originEl = elements.find(el => el.id === fiber.originId && el.tipo === fiber.originType);
        const destEl = elements.find(el => el.id === fiber.destinationId && el.tipo === fiber.destinationType);

        if (!originEl || !destEl) return null;

        const originCoords = getCoords(originEl);
        const destCoords = getCoords(destEl);

        if (!originCoords || !destCoords) return null;

        const isHighlighted = highlightedFiberIds.includes(fiber.id);
        const style = getFiberStyle(fiber.threadCount, isHighlighted);

        return (
            <Polyline key={fiber.id} positions={[originCoords, destCoords]} pathOptions={style} zIndexOffset={isHighlighted ? 500 : 0}>
                <Popup>
                    <div className="font-bold">{fiber.name}</div>
                    <div>{fiber.threadCount} hilos ({fiber.distance}m)</div>
                     <Badge
                        variant={fiber.estado === "Activo" ? "default" : "destructive"}
                        className={cn(
                            fiber.estado === "Activo" && "bg-green-600 hover:bg-green-700",
                            fiber.estado === 'Corte' && 'bg-orange-500 hover:bg-orange-600 text-white',
                            fiber.estado === 'Inactivo' && 'bg-red-600 hover:bg-red-700'
                        )}
                    >
                        {fiber.estado}
                    </Badge>
                </Popup>
            </Polyline>
        )
    }).filter(Boolean);


    if (validElements.length === 0 && highlightedFiberIds.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted rounded-lg">No hay elementos con coordenadas para mostrar.</div>
    }

    const latitudes = validElements.map(el => el.coords[0]);
    const longitudes = validElements.map(el => el.coords[1]);
    const centerLat = latitudes.length > 0 ? latitudes.reduce((acc, val) => acc + val, 0) / latitudes.length : -34.6037;
    const centerLng = longitudes.length > 0 ? longitudes.reduce((acc, val) => acc + val, 0) / longitudes.length : -58.3816;

    const initialCenter: [number, number] = focusCoords ? [focusCoords.lat, focusCoords.lng] : [centerLat, centerLng];
    const initialZoom = focusCoords ? 18 : 13;

    return (
        <MapContainer center={initialCenter} zoom={initialZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {focusCoords && <FlyToController coords={focusCoords} />}
            {fiberLines}
            {validElements.map(element => {
                 const isHighlighted = highlightedElementIds.includes(element.id);
                 const itemName = element.name;
                 const itemAddress = element.address || 'Dirección no disponible';
                 return (
                    <Marker 
                        key={element.id} 
                        position={element.coords} 
                        icon={createIcon(element, isHighlighted)}
                        zIndexOffset={isHighlighted ? 1000 : 0}
                    >
                        <Popup>
                            <div className="font-bold">{itemName}</div>
                            <div className="text-sm text-muted-foreground">{itemAddress}</div>
                            <div>Tipo: {element.tipo}</div>
                             <Badge
                                variant={
                                element.estado === "Activo"
                                    ? "default"
                                    : "destructive"
                                }
                                className={cn(
                                    element.estado === "Activo" && "bg-green-600 hover:bg-green-700",
                                    element.estado === 'Corte' && 'bg-orange-500 hover:bg-orange-600 text-white',
                                    element.estado === 'Inactivo' && 'bg-red-600 hover:bg-red-700'
                                )}
                            >
                                {element.estado || 'N/A'}
                            </Badge>
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    );
}
