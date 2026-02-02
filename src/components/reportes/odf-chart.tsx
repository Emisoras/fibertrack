
'use client';

import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Odf, OdfPosition, Fiber } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartLayout } from './chart-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const fiberColorMap: { [key: string]: string } = {
    'Azul': 'bg-blue-500',
    'Naranja': 'bg-orange-500',
    'Verde': 'bg-green-500',
    'Marrón': 'bg-yellow-800',
    'Gris': 'bg-gray-500',
    'Blanco': 'bg-white border border-gray-400',
    'Rojo': 'bg-red-500',
    'Negro': 'bg-black',
    'Amarillo': 'bg-yellow-400',
    'Violeta': 'bg-purple-500',
    'Rosa': 'bg-pink-500',
    'Agua': 'bg-cyan-400',
};

const statusColorMap: { [key: string]: string } = {
    'Libre': 'text-green-600',
    'Ocupado': 'text-red-600',
    'Reservado': 'text-yellow-600 dark:text-yellow-400',
    'Dañado': 'text-black dark:text-gray-300 font-bold',
};

export default function OdfChart({ elementId }: { elementId: string }) {
    const { firestore } = useFirebase();

    const odfRef = useMemoFirebase(() => (firestore && elementId ? doc(firestore, 'odfs', elementId) : null), [firestore, elementId]);
    const { data: odf, isLoading: isLoadingOdf } = useDoc<Odf>(odfRef);

    const positionsQuery = useMemoFirebase(() => (firestore && elementId ? query(collection(firestore, 'odfs', elementId, 'positions'), orderBy('positionNumber')) : null), [firestore, elementId]);
    const { data: positions, isLoading: isLoadingPositions } = useCollection<OdfPosition>(positionsQuery);

    const fibersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'fibers') : null), [firestore]);
    const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);


    const getFiberName = (trunkId?: string, threadNumber?: number) => {
        if (!trunkId || !threadNumber || !fibers) return '-';
        const fiber = fibers.find(f => f.id === trunkId);
        if (!fiber) return `${trunkId}-H${threadNumber}`;
        return `${fiber.name} - Hilo ${threadNumber}`;
    }

    if (isLoadingOdf || isLoadingPositions || isLoadingFibers) {
        return (
            <ChartLayout title="Cargando Carta de Empalmes..." subtitle="Por favor, espere." backHref={`/dashboard/inventario/odf/${elementId}`}>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </ChartLayout>
        )
    }

    if (!odf) {
        return (
            <ChartLayout title="Error" subtitle={`ODF con ID ${elementId} no encontrado.`} backHref="/dashboard/inventario/odf">
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>No se pudo generar el reporte</AlertTitle>
                  <AlertDescription>
                    El elemento que intentas visualizar no existe o no tienes permisos para verlo.
                  </AlertDescription>
                </Alert>
            </ChartLayout>
        )
    }
    
    return (
        <ChartLayout title={`Carta de Empalmes - ODF: ${odf.name}`} subtitle={`Capacidad: ${odf.capacity} puertos | Dirección: ${odf.address}`} backHref={`/dashboard/inventario/odf/${elementId}`}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[8%] text-center">Posición</TableHead>
                        <TableHead className="w-[12%]">Color</TableHead>
                        <TableHead className="w-[10%]">Estado</TableHead>
                        <TableHead className="w-[25%]">Servicio / Cliente</TableHead>
                        <TableHead className="w-[25%]">Fibra / Hilo</TableHead>
                        <TableHead className="w-[20%]">Destino</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {positions?.map(pos => (
                         <TableRow key={pos.id}>
                            <TableCell className="font-medium text-center">{pos.positionNumber}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-3 w-3 rounded-full", fiberColorMap[pos.color] || 'bg-gray-300')} />
                                    <span className="text-xs">{pos.color}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className={cn('font-medium', statusColorMap[pos.status])}>
                                    {pos.status}
                                </span>
                            </TableCell>
                            <TableCell>{pos.serviceName || '-'}</TableCell>
                            <TableCell>{getFiberName(pos.fiberTrunkId, pos.fiberThreadNumber)}</TableCell>
                            <TableCell>{pos.destinationLabel || pos.destination || '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ChartLayout>
    )
}
