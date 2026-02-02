'use client';

import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Mufla, MuflaSplice, Fiber, Splitter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartLayout } from './chart-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const fiberColors = [
    { name: 'Azul', className: 'bg-blue-500' },
    { name: 'Naranja', className: 'bg-orange-500' },
    { name: 'Verde', className: 'bg-green-500' },
    { name: 'Marrón', className: 'bg-yellow-800' },
    { name: 'Gris', className: 'bg-gray-500' },
    { name: 'Blanco', className: 'bg-white border border-gray-400' },
    { name: 'Rojo', className: 'bg-red-500' },
    { name: 'Negro', className: 'bg-black' },
    { name: 'Amarillo', className: 'bg-yellow-400' },
    { name: 'Violeta', className: 'bg-purple-500' },
    { name: 'Rosa', className: 'bg-pink-500' },
    { name: 'Agua', className: 'bg-cyan-400' },
];

const getThreadColorInfo = (threadNumber: number) => {
    if (!threadNumber || threadNumber <= 0) {
        return { name: 'N/A', className: 'bg-gray-300' };
    }
    return fiberColors[(threadNumber - 1) % 12];
};


export default function MuflaChart({ elementId }: { elementId: string }) {
    const { firestore } = useFirebase();

    const muflaRef = useMemoFirebase(() => (firestore && elementId ? doc(firestore, 'muflas', elementId) : null), [firestore, elementId]);
    const { data: mufla, isLoading: isLoadingMufla } = useDoc<Mufla>(muflaRef);

    const splicesQuery = useMemoFirebase(() => (firestore && elementId ? query(collection(firestore, 'muflas', elementId, 'splices'), orderBy('trayNumber')) : null), [firestore, elementId]);
    const { data: splices, isLoading: isLoadingSplices } = useCollection<MuflaSplice>(splicesQuery);

    const fibersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'fibers') : null), [firestore]);
    const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);
    
    const splittersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'splitters') : null), [firestore]);
    const { data: splitters, isLoading: isLoadingSplitters } = useCollection<Splitter>(splittersRef);

    const elementNameResolver = (elementId?: string, thread?: number) => {
        const colorInfo = getThreadColorInfo(thread || 0);

        if (!elementId || !thread) return <span>-</span>;
        
        const fiber = fibers?.find(f => f.id === elementId);
        if (fiber) {
            return (
                <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", colorInfo.className)} title={colorInfo.name} />
                    <span className="text-xs">{fiber.name} - Hilo {thread}</span>
                </div>
            );
        }

        const splitter = splitters?.find(s => s.id === elementId);
        if (splitter) {
             return (
                <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", colorInfo.className)} title={colorInfo.name} />
                    <span className="text-xs">Splitter: {splitter.name}</span>
                </div>
            );
        }

        return (
             <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", colorInfo.className)} title={colorInfo.name} />
                <span className="text-xs">{elementId} - Hilo {thread}</span>
            </div>
        );
    };

    const isLoading = isLoadingMufla || isLoadingSplices || isLoadingFibers || isLoadingSplitters;

    if (isLoading) {
        return (
            <ChartLayout title="Cargando Carta de Empalmes..." subtitle="Por favor, espere." backHref={`/dashboard/inventario/mufas/${elementId}`}>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </ChartLayout>
        )
    }

    if (!mufla) {
        return (
            <ChartLayout title="Error" subtitle={`Mufla con ID ${elementId} no encontrada.`} backHref="/dashboard/inventario/mufas">
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
        <ChartLayout title={`Carta de Empalmes - Mufla: ${mufla.name}`} subtitle={`Capacidad: ${mufla.capacity} empalmes | Dirección: ${mufla.address}`} backHref={`/dashboard/inventario/mufas/${elementId}`}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[10%] text-center">Bandeja</TableHead>
                        <TableHead className="w-[10%] text-center">Empalme</TableHead>
                        <TableHead className="w-[30%]">Fibra Entrante</TableHead>
                        <TableHead className="w-[30%]">Destino</TableHead>
                        <TableHead className="w-[20%]">Notas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {splices?.map(splice => (
                         <TableRow key={splice.id}>
                            <TableCell className="font-medium text-center">{splice.trayNumber}</TableCell>
                            <TableCell className="text-center">{splice.spliceNumber}</TableCell>
                            <TableCell>{elementNameResolver(splice.inFiberId, splice.inFiberThread)}</TableCell>
                            <TableCell>{elementNameResolver(splice.outFiberId, splice.outFiberThread)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{splice.notes || '-'}</TableCell>
                        </TableRow>
                    ))}
                    {(!splices || splices.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No hay empalmes registrados en esta mufla.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ChartLayout>
    )
}
