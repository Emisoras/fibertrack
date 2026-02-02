"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryItem, Fiber } from "@/lib/types";

const DynamicMap = dynamic(() => import('./dynamic-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] lg:h-[600px] w-full" />,
});

type MapViewProps = {
  elements: InventoryItem[];
  fibers: Fiber[];
  focusCoords?: { lat: number; lng: number } | null;
  highlightedFiberIds?: string[];
  highlightedElementIds?: string[];
}

export default function MapView({ elements, fibers, focusCoords, highlightedFiberIds, highlightedElementIds }: MapViewProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Mapa de la Red</CardTitle>
        <CardDescription>
          Visualización en tiempo real de los elementos de red y tramos de fibra.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] lg:h-[600px] p-0">
          <DynamicMap 
            elements={elements} 
            fibers={fibers} 
            focusCoords={focusCoords} 
            highlightedFiberIds={highlightedFiberIds}
            highlightedElementIds={highlightedElementIds}
          />
      </CardContent>
    </Card>
  );
}
