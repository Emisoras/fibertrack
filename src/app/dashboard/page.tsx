'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HardDrive, Network, Box, AlertTriangle, Split } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import MapView from '@/components/dashboard/map-view';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, where, query } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const searchParams = useSearchParams();
  const router = useRouter();

  const odfsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'odfs') : null),
    [firestore]
  );
  const cajasNapRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'cajas_nap') : null),
    [firestore]
  );
  const mufasRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'muflas') : null),
    [firestore]
  );
  const splittersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'splitters') : null),
    [firestore]
  );
  const fibersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'fibers') : null),
    [firestore]
  );

  const { data: odfs } = useCollection(odfsRef);
  const { data: cajasNap } = useCollection(cajasNapRef);
  const { data: mufas } = useCollection(mufasRef);
  const { data: splitters } = useCollection(splittersRef);
  const { data: fibras } = useCollection(fibersRef);

  const activeOdfsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'odfs'), where('estado', '==', 'Activo'))
        : null,
    [firestore]
  );
  const activeNAPsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'cajas_nap'), where('estado', '==', 'Activo'))
        : null,
    [firestore]
  );
  const fiberCutsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'fibers'), where('estado', '==', 'Corte'))
        : null,
    [firestore]
  );

  const { data: activeOdfs } = useCollection(activeOdfsQuery);
  const { data: activeNAPs } = useCollection(activeNAPsQuery);
  const { data: fiberCuts } = useCollection(fiberCutsQuery);

  const totalElements =
    (odfs?.length || 0) +
    (cajasNap?.length || 0) +
    (mufas?.length || 0) +
    (splitters?.length || 0);
  const allElements = [
    ...(odfs || []),
    ...(cajasNap || []),
    ...(mufas || []),
    ...(splitters || []),
  ];

  const focusCoords = useMemo(() => {
    const lat = searchParams.get('focus_lat');
    const lng = searchParams.get('focus_lng');
    if (lat && lng) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    }
    return null;
  }, [searchParams]);

  const highlightedFiberIds = useMemo(() => {
    const param = searchParams.get('highlight_fibers');
    return param ? param.split(',') : [];
  }, [searchParams]);

  const highlightedElementIds = useMemo(() => {
      const param = searchParams.get('highlight_elements');
      return param ? param.split(',') : [];
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general del estado de tu infraestructura de red.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Elementos"
          value={totalElements.toString()}
          icon={HardDrive}
          description="ODFs, Cajas NAP, Mufas y Splitters"
        />
        <StatsCard
          title="Splitters"
          value={(splitters?.length || 0).toString()}
          icon={Split}
          description="Divisores de fibra óptica"
        />
        <StatsCard
          title="Cajas NAP"
          value={(cajasNap?.length || 0).toString()}
          icon={Box}
          description={`${activeNAPs?.length || 0} activas`}
        />
        <StatsCard
          title="Cortes de Fibra"
          value={(fiberCuts?.length || 0).toString()}
          icon={AlertTriangle}
          description="Fibras que requieren atención"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MapView 
            elements={allElements} 
            fibers={fibras || []} 
            focusCoords={focusCoords}
            highlightedFiberIds={highlightedFiberIds}
            highlightedElementIds={highlightedElementIds}
        />
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Alertas Recientes</CardTitle>
            <CardDescription>
              Eventos importantes y cortes en la red.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fibra</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiberCuts?.length ? (
                  fiberCuts.map((fibra) => (
                    <TableRow
                      key={fibra.id}
                      onClick={() =>
                        router.push(
                          `/dashboard/inventario/fibras?highlight_fibers=${fibra.id}`
                        )
                      }
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="font-medium">{fibra.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Tipo: {fibra.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={'secondary'}
                          className={cn('bg-yellow-500 text-black')}
                        >
                          {fibra.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No hay cortes de fibra activos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
