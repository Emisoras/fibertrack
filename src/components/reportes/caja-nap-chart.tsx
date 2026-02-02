'use client';

import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { CajaNap, CajaNapPort, MuflaSplice, Fiber } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartLayout } from './chart-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const statusColorMap: { [key: string]: string } = {
    'Libre': 'text-green-600',
    'Ocupado': 'text-red-600',
    'Reservado': 'text-yellow-600 dark:text-yellow-400',
    'Dañado': 'text-black dark:text-gray-300 font-bold',
};

export default function CajaNapChart({ elementId }: { elementId: string }) {
    const { firestore } = useFirebase();

    const cajaNapRef = useMemoFirebase(() => (firestore && elementId ? doc(firestore, 'cajas_nap', elementId) : null), [firestore, elementId]);
    const { data: cajaNap, isLoading: isLoadingCajaNap } = useDoc<CajaNap>(cajaNapRef);

    const portsQuery = useMemoFirebase(() => (firestore && elementId ? query(collection(firestore, 'cajas_nap', elementId, 'ports'), orderBy('portNumber')) : null), [firestore, elementId]);
    const { data: ports, isLoading: isLoadingPorts } = useCollection<CajaNapPort>(portsQuery);

    const splicesQuery = useMemoFirebase(() => (firestore && elementId ? query(collection(firestore, 'cajas_nap', elementId, 'splices'), orderBy('trayNumber')) : null), [firestore, elementId]);
    const { data: splices, isLoading: isLoadingSplices } = useCollection<MuflaSplice>(splicesQuery);

    const fibersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'fibers') : null), [firestore]);
    const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);

    const getFiberName = (trunkId?: string, threadNumber?: number) => {
        if (!trunkId || !threadNumber || !fibers) return '-';
        const fiber = fibers.find(f => f.id === trunkId);
        if (!fiber) return `${trunkId}-H${threadNumber}`;
        return `${fiber.name} - Hilo ${threadNumber}`;
    }
    
    const isLoading = isLoadingCajaNap || isLoadingPorts || isLoadingSplices || isLoadingFibers;

    if (isLoading) {
        return (
            <ChartLayout title="Cargando Carta de Conexiones..." subtitle="Por favor, espere." backHref={`/dashboard/inventario/cajas-nap/${elementId}`}>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </ChartLayout>
        )
    }

    if (!cajaNap) {
        return (
            <ChartLayout title="Error" subtitle={`Caja NAP con ID ${elementId} no encontrada.`} backHref="/dashboard/inventario/cajas-nap">
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
        <ChartLayout 
            title={`Carta de Conexiones - Caja NAP: ${cajaNap.name}`} 
            subtitle={`Función: ${cajaNap.functionType} | Capacidad: ${cajaNap.capacity} puertos | Dirección: ${cajaNap.address}`} 
            backHref={`/dashboard/inventario/cajas-nap/${elementId}`}
        >
            <div className="space-y-8">
                {cajaNap.functionType !== 'De Paso' && (
                    <div>
                        <h2 className="text-xl font-bold font-headline mb-4">Puertos de Cliente</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[10%] text-center">Puerto</TableHead>
                                    <TableHead className="w-[20%]">Estado</TableHead>
                                    <TableHead className="w-[40%]">Servicio / Cliente</TableHead>
                                    <TableHead className="w-[30%] text-right">Potencia Salida</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ports?.map(port => (
                                    <TableRow key={port.id}>
                                        <TableCell className="font-medium text-center">{port.portNumber}</TableCell>
                                        <TableCell>
                                            <span className={cn('font-medium', statusColorMap[port.status])}>
                                                {port.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{port.serviceName || '-'}</TableCell>
                                        <TableCell className="text-right">{port.outputPower ? `${port.outputPower} dBm` : '-'}</TableCell>
                                    </TableRow>
                                ))}
                                {(!ports || ports.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No hay puertos de cliente configurados en esta caja.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
                
                {cajaNap.functionType !== 'Terminal' && (
                    <div>
                        <h2 className="text-xl font-bold font-headline mb-4">Empalmes de Paso (Sangría)</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[10%] text-center">Bandeja</TableHead>
                                    <TableHead className="w-[10%] text-center">Empalme</TableHead>
                                    <TableHead className="w-[30%]">Fibra Entrante</TableHead>
                                    <TableHead className="w-[30%]">Fibra Saliente</TableHead>
                                    <TableHead className="w-[20%]">Notas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {splices?.map(splice => (
                                    <TableRow key={splice.id}>
                                        <TableCell className="font-medium text-center">{splice.trayNumber}</TableCell>
                                        <TableCell className="text-center">{splice.spliceNumber}</TableCell>
                                        <TableCell>{getFiberName(splice.inFiberId, splice.inFiberThread)}</TableCell>
                                        <TableCell>{getFiberName(splice.outFiberId, splice.outFiberThread)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{splice.notes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                                {(!splices || splices.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No hay empalmes de paso registrados en esta caja.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </ChartLayout>
    )
}

    