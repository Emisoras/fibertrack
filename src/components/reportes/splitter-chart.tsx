'use client';

import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Splitter, SplitterOutput, Fiber, Mufla } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartLayout } from './chart-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const statusColorMap: { [key: string]: string } = {
    'Libre': 'text-green-600',
    'Ocupado': 'text-red-600',
    'Reservado': 'text-yellow-600 dark:text-yellow-400',
    'Dañado': 'text-black dark:text-gray-300 font-bold',
};

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

export default function SplitterChart({ elementId }: { elementId: string }) {
    const { firestore } = useFirebase();

    const splitterRef = useMemoFirebase(() => (firestore && elementId ? doc(firestore, 'splitters', elementId) : null), [firestore, elementId]);
    const { data: splitter, isLoading: isLoadingSplitter } = useDoc<Splitter>(splitterRef);

    const outputsQuery = useMemoFirebase(() => (firestore && elementId ? query(collection(firestore, 'splitters', elementId, 'outputs'), orderBy('outputNumber')) : null), [firestore, elementId]);
    const { data: outputs, isLoading: isLoadingOutputs } = useCollection<SplitterOutput>(outputsQuery);

    const fibersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'fibers') : null), [firestore]);
    const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);
    
    const muflaRef = useMemoFirebase(
        () => (firestore && splitter?.muflaId ? doc(firestore, 'muflas', splitter.muflaId) : null),
        [firestore, splitter?.muflaId]
    );
    const { data: mufla, isLoading: isLoadingMufla } = useDoc<Mufla>(muflaRef);

    const getFiberName = (trunkId?: string, threadNumber?: number) => {
        const colorInfo = getThreadColorInfo(threadNumber || 0);
        if (!trunkId || !threadNumber || !fibers) return <span>-</span>;
        
        const fiber = fibers.find(f => f.id === trunkId);
        const fiberName = fiber ? fiber.name : trunkId;

        return (
            <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", colorInfo.className)} title={colorInfo.name} />
                <span className="text-xs">{fiberName} - Hilo {threadNumber}</span>
            </div>
        );
    }
    
    const isLoading = isLoadingSplitter || isLoadingOutputs || isLoadingFibers || isLoadingMufla;

    if (isLoading) {
        return (
            <ChartLayout title="Cargando Carta de Splitter..." subtitle="Por favor, espere." backHref={`/dashboard/inventario/splitters/${elementId}`}>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </ChartLayout>
        )
    }

    if (!splitter) {
        return (
            <ChartLayout title="Error" subtitle={`Splitter con ID ${elementId} no encontrado.`} backHref="/dashboard/inventario/splitters">
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

    const inputFiberName = getFiberName(splitter.inFiberId, splitter.inFiberThread);
    
    return (
        <ChartLayout 
            title={`Carta de Splitter - ${splitter.name}`} 
            subtitle={`Relación: ${splitter.splittingRatio} | Ubicado en: ${mufla?.name || splitter.muflaId}`}
            backHref={`/dashboard/inventario/splitters/${elementId}`}
        >
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-bold font-headline mb-4">Entrada</h2>
                    <div className="flex items-center gap-4 text-sm border p-4 rounded-lg">
                        <div className="font-semibold">Fibra de Entrada:</div>
                        <div>{inputFiberName}</div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div className="font-semibold text-primary">{splitter.name}</div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold font-headline mb-4">Salidas</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[10%] text-center">Salida</TableHead>
                                <TableHead className="w-[15%]">Estado</TableHead>
                                <TableHead className="w-[25%]">Servicio / Cliente</TableHead>
                                <TableHead className="w-[25%]">Fibra / Hilo</TableHead>
                                <TableHead className="w-[25%]">Destino</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outputs?.map(output => (
                                <TableRow key={output.id}>
                                    <TableCell className="font-medium text-center">{output.outputNumber}</TableCell>
                                    <TableCell>
                                        <span className={cn('font-medium', statusColorMap[output.status])}>
                                            {output.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{output.serviceName || '-'}</TableCell>
                                    <TableCell>{getFiberName(output.fiberTrunkId, output.fiberThreadNumber)}</TableCell>
                                    <TableCell>{output.destinationLabel || output.destination || '-'}</TableCell>
                                </TableRow>
                            ))}
                            {(!outputs || outputs.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No hay salidas configuradas para este splitter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </ChartLayout>
    )
}
