
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import { CajaNap, CajaNapPort, Fiber, MuflaSplice } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CajaNapPortsGrid } from '@/components/inventario/caja-nap-ports-grid';
import { CajaNapSplicesManager } from '@/components/inventario/caja-nap-splices-manager';
import { CajaNapInputManager } from '@/components/inventario/caja-nap-input-manager';
import { EditElementDialog } from '@/components/inventario/edit-element-dialog';

export default function CajaNapDetailPage() {
  const params = useParams();
  const cajaNapId = params.cajaNapId as string;
  const { firestore, role } = useFirebase();

  const cajaNapRef = useMemoFirebase(
    () => (firestore && cajaNapId ? doc(firestore, 'cajas_nap', cajaNapId) : null),
    [firestore, cajaNapId]
  );
  const { data: cajaNap, isLoading: isLoadingCajaNap } = useDoc<CajaNap>(cajaNapRef);

  const portsQuery = useMemoFirebase(
    () =>
      firestore && cajaNapId
        ? query(collection(firestore, 'cajas_nap', cajaNapId, 'ports'), orderBy('portNumber'))
        : null,
    [firestore, cajaNapId]
  );
  const { data: ports, isLoading: isLoadingPorts } = useCollection<CajaNapPort>(portsQuery);

  const splicesQuery = useMemoFirebase(
    () =>
      firestore && cajaNapId
        ? query(collection(firestore, 'cajas_nap', cajaNapId, 'splices'))
        : null,
    [firestore, cajaNapId]
  );
  const { data: splices, isLoading: isLoadingSplices } = useCollection<MuflaSplice>(splicesQuery);

  const fibersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'fibers') : null),
    [firestore]
  );
  const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);


  if (isLoadingCajaNap) {
    return (
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  if (!cajaNap) {
    return <div>Caja NAP no encontrada.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/inventario/cajas-nap">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cajas NAP
            </Link>
        </Button>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">{cajaNap.name}</h1>
                <p className="text-muted-foreground">{cajaNap.address}</p>
            </div>
             <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href={`/dashboard/reportes/carta/cajas-nap/${cajaNap.id}`}>
                        <Printer className="mr-2 h-4 w-4"/>Generar Carta
                    </Link>
                </Button>
                {cajaNap && role === 'Admin' && (
                    <EditElementDialog item={{...cajaNap, tipo: 'CajaNap'}} collectionName="cajas_nap">
                        <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                    </EditElementDialog>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col gap-8">
            <Card>
                <CardHeader>
                <CardTitle>Detalles de la Caja NAP</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                <div><span className="font-semibold">Dirección:</span> {cajaNap.address}</div>
                <div><span className="font-semibold">Capacidad:</span> {cajaNap.capacity} puertos</div>
                <div><span className="font-semibold">Coordenadas:</span> {cajaNap.latitude}, {cajaNap.longitude}</div>
                <div><span className="font-semibold">Función:</span> {cajaNap.functionType}</div>
                <div><span className="font-semibold">Estado:</span> {cajaNap.estado}</div>
                </CardContent>
            </Card>

            <CajaNapInputManager 
                cajaNap={cajaNap}
                fibers={fibers || []}
                isLoading={isLoadingFibers}
            />
        </div>
        <div className="md:col-span-2">
            <Tabs defaultValue="ports" className="w-full">
                <TabsList>
                    <TabsTrigger value="ports">Puertos de Cliente</TabsTrigger>
                    <TabsTrigger value="splices">Empalmes de Fibra</TabsTrigger>
                </TabsList>
                <TabsContent value="ports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Puertos de Cliente</CardTitle>
                            <CardDescription>Gestión de los puertos de cliente en la caja.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CajaNapPortsGrid ports={ports} isLoading={isLoadingPorts} cajaNapId={cajaNapId} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="splices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Empalmes de Fibra</CardTitle>
                            <CardDescription>Gestión de los empalmes de fibra (paso o sangría).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CajaNapSplicesManager 
                                splices={splices || []}
                                fibers={fibers || []}
                                isLoading={isLoadingSplices || isLoadingFibers}
                                cajaNapId={cajaNapId}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
