
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Splitter, SplitterOutput, Mufla, Fiber } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import { SplitterOutputsGrid } from '@/components/inventario/splitter-outputs-grid';
import { SplitterInputManager } from '@/components/inventario/splitter-input-manager';
import { EditElementDialog } from '@/components/inventario/edit-element-dialog';

export default function SplitterDetailPage() {
  const params = useParams();
  const splitterId = params.splitterId as string;
  const { firestore, role } = useFirebase();

  const splitterRef = useMemoFirebase(
    () => (firestore && splitterId ? doc(firestore, 'splitters', splitterId) : null),
    [firestore, splitterId]
  );
  const { data: splitter, isLoading: isLoadingSplitter } = useDoc<Splitter>(splitterRef);

  const muflaRef = useMemoFirebase(
    () => (firestore && splitter?.muflaId ? doc(firestore, 'muflas', splitter.muflaId) : null),
    [firestore, splitter?.muflaId]
  );
  const { data: mufla, isLoading: isLoadingMufla } = useDoc<Mufla>(muflaRef);

  const outputsQuery = useMemoFirebase(
    () =>
      firestore && splitterId
        ? query(collection(firestore, 'splitters', splitterId, 'outputs'), orderBy('outputNumber'))
        : null,
    [firestore, splitterId]
  );
  const { data: outputs, isLoading: isLoadingOutputs } = useCollection<SplitterOutput>(outputsQuery);

  const fibersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'fibers') : null),
    [firestore]
  );
  const { data: fibers, isLoading: isLoadingFibers } = useCollection<Fiber>(fibersRef);


  if (isLoadingSplitter || isLoadingMufla || isLoadingFibers) {
    return (
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  if (!splitter) {
    return <div>Splitter no encontrado.</div>;
  }
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/inventario/splitters">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Splitters
            </Link>
        </Button>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">{splitter.name}</h1>
                <p className="text-muted-foreground">{splitter.address}</p>
            </div>
            <div className="flex items-center gap-2">
                 <Button asChild variant="outline">
                    <Link href={`/dashboard/reportes/carta/splitters/${splitter.id}`}>
                        <Printer className="mr-2 h-4 w-4"/>Generar Carta
                    </Link>
                </Button>
                {splitter && role === 'Admin' && (
                    <EditElementDialog item={{...splitter, tipo: 'Splitter'}} collectionName="splitters">
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
              <CardTitle>Detalles del Splitter</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div><span className="font-semibold">Dirección:</span> {splitter.address}</div>
              <div><span className="font-semibold">Relación:</span> {splitter.splittingRatio}</div>
              <div><span className="font-semibold">Coordenadas:</span> {splitter.latitude}, {splitter.longitude}</div>
              <div><span className="font-semibold">Estado:</span> {splitter.estado}</div>
              <div>
                <span className="font-semibold">Ubicado en Mufla:</span>{' '}
                {mufla ? (
                    <Link href={`/dashboard/inventario/mufla/${mufla.id}`} className="text-primary hover:underline">
                        {mufla.name}
                    </Link>
                ) : (
                    splitter.muflaId || 'N/A'
                )}
              </div>
            </CardContent>
          </Card>
          
          <SplitterInputManager 
            splitter={splitter}
            fibers={fibers || []}
            isLoading={isLoadingFibers}
          />
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Salidas del Splitter</CardTitle>
              <CardDescription>Visualización de los puertos de salida.</CardDescription>
            </CardHeader>
            <CardContent>
                <SplitterOutputsGrid outputs={outputs} isLoading={isLoadingOutputs} splitterId={splitterId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
