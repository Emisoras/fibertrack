
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { OdfPosition } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OdfPositionsGrid } from '@/components/inventario/odf-positions-grid';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import { EditElementDialog } from '@/components/inventario/edit-element-dialog';

export default function OdfDetailPage() {
  const params = useParams();
  const odfId = params.odfId as string;
  const { firestore, role } = useFirebase();

  const odfRef = useMemoFirebase(
    () => (firestore && odfId ? doc(firestore, 'odfs', odfId) : null),
    [firestore, odfId]
  );
  const { data: odf, isLoading: isLoadingOdf } = useDoc<any>(odfRef);

  const positionsQuery = useMemoFirebase(
    () =>
      firestore && odfId
        ? query(collection(firestore, 'odfs', odfId, 'positions'), orderBy('positionNumber'))
        : null,
    [firestore, odfId]
  );
  const { data: positions, isLoading: isLoadingPositions } = useCollection<OdfPosition>(positionsQuery);

  if (isLoadingOdf) {
    return (
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  if (!odf) {
    return <div>ODF no encontrado.</div>;
  }
  
  // Handle both old and new data structures for backward compatibility
  const odfData = {
      name: odf.name || odf.nombre,
      id: odf.id,
      address: odf.address || odf.ubicacion?.direccion,
      capacity: odf.capacity,
      latitude: odf.latitude || odf.ubicacion?.lat,
      longitude: odf.longitude || odf.ubicacion?.lng,
      estado: odf.estado || 'N/A'
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/inventario/odf">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a ODFs
            </Link>
        </Button>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">{odfData.name}</h1>
                <p className="text-muted-foreground">{odfData.address}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href={`/dashboard/reportes/carta/odf/${odf.id}`}>
                        <Printer className="mr-2 h-4 w-4"/>Generar Carta
                    </Link>
                </Button>
                {odf && role === 'Admin' && (
                    <EditElementDialog item={{...odf, tipo: 'Odf'}} collectionName="odfs">
                        <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                    </EditElementDialog>
                )}
            </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del ODF</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold">Dirección:</span> {odfData.address}</div>
          <div><span className="font-semibold">Capacidad:</span> {odfData.capacity} puertos</div>
          <div><span className="font-semibold">Coordenadas:</span> {odfData.latitude}, {odfData.longitude}</div>
          <div><span className="font-semibold">Estado:</span> {odfData.estado}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posiciones del ODF</CardTitle>
          <CardDescription>Visualización de los puertos de fibra.</CardDescription>
        </CardHeader>
        <CardContent>
            <OdfPositionsGrid positions={positions} isLoading={isLoadingPositions} odfId={odfId} />
        </CardContent>
      </Card>
    </div>
  );
}
