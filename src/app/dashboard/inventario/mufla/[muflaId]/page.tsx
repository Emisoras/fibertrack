
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import { MuflaSplicesManager } from '@/components/inventario/mufla-splices-manager';
import { MuflaSplice, Fiber, Splitter } from '@/lib/types';
import { EditElementDialog } from '@/components/inventario/edit-element-dialog';


export default function MuflaDetailPage() {
  const params = useParams();
  const muflaId = params.muflaId as string;
  const { firestore, role } = useFirebase();

  const muflaRef = useMemoFirebase(
    () => (firestore && muflaId ? doc(firestore, 'muflas', muflaId) : null),
    [firestore, muflaId]
  );
  const { data: mufla, isLoading: isLoadingMufla } = useDoc<any>(muflaRef);

  const splicesQuery = useMemoFirebase(
    () =>
      firestore && muflaId
        ? query(collection(firestore, 'muflas', muflaId, 'splices'))
        : null,
    [firestore, muflaId]
  );
  const { data: splices, isLoading: isLoadingSplices } = useCollection<MuflaSplice>(splicesQuery);

  const fibersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'fibers') : null),
    [firestore]
  );
  const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);

  const splittersInMuflaQuery = useMemoFirebase(
    () => (firestore && muflaId ? query(collection(firestore, 'splitters'), where('muflaId', '==', muflaId)) : null),
    [firestore, muflaId]
  );
  const { data: splitters, isLoading: isLoadingSplitters } = useCollection<Splitter>(splittersInMuflaQuery);


  if (isLoadingMufla) {
    return (
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  if (!mufla) {
    return <div>Mufla no encontrada.</div>;
  }
  
  const muflaData = {
      name: mufla.name,
      id: mufla.id,
      address: mufla.address,
      capacity: mufla.capacity,
      latitude: mufla.latitude,
      longitude: mufla.longitude,
      estado: mufla.estado || 'N/A'
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/inventario/mufas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Mufas
            </Link>
        </Button>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">{muflaData.name}</h1>
                <p className="text-muted-foreground">{muflaData.address}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href={`/dashboard/reportes/carta/mufas/${mufla.id}`}>
                        <Printer className="mr-2 h-4 w-4"/>Generar Carta
                    </Link>
                </Button>
                {mufla && role === 'Admin' && (
                    <EditElementDialog item={{...mufla, tipo: 'Mufla'}} collectionName="muflas">
                        <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                    </EditElementDialog>
                )}
            </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Mufla</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold">Dirección:</span> {muflaData.address}</div>
          <div><span className="font-semibold">Capacidad:</span> {muflaData.capacity} empalmes</div>
          <div><span className="font-semibold">Coordenadas:</span> {muflaData.latitude}, {muflaData.longitude}</div>
          <div><span className="font-semibold">Estado:</span> {muflaData.estado}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empalmes de la Mufla</CardTitle>
          <CardDescription>Gestión de los empalmes de fibra.</CardDescription>
        </CardHeader>
        <CardContent>
            <MuflaSplicesManager 
                splices={splices || []}
                fibers={fibers || []}
                splitters={splitters || []}
                isLoading={isLoadingSplices || isLoadingFibers || isLoadingSplitters}
                muflaId={muflaId}
            />
        </CardContent>
      </Card>
    </div>
  );
}
