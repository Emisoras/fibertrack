
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { getColumnsForElement } from '@/components/inventario/columns';
import { DataTable } from '@/components/inventario/data-table';
import { collection } from 'firebase/firestore';

const AddElementDialog = dynamic(
  () =>
    import('@/components/inventario/add-element-dialog').then(
      (mod) => mod.AddElementDialog
    ),
  { ssr: false }
);

const elementMap: { [key: string]: { title: string; collection: string } } = {
  odf: { title: 'ODFs (Optical Distribution Frame)', collection: 'odfs' },
  'cajas-nap': {
    title: 'Cajas NAP (Network Access Point)',
    collection: 'cajas_nap',
  },
  mufas: { title: 'Mufas de Empalme', collection: 'muflas' },
  splitters: { title: 'Splitters', collection: 'splitters' },
};

export default function InventarioElementoPage() {
  const params = useParams();
  const elemento = params.elemento as string;

  const { firestore, role } = useFirebase();

  const { title, collection: collectionName } = elementMap[elemento] || {
    title: 'Elemento no encontrado',
    collection: '',
  };

  const collectionRef = useMemoFirebase(
    () =>
      firestore && collectionName ? collection(firestore, collectionName) : null,
    [firestore, collectionName]
  );

  const { data, isLoading } = useCollection(collectionRef);

  const columns = useMemo(() => getColumnsForElement(elemento), [elemento]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza los {elemento.replace('-', ' ')} de tu red.
          </p>
        </div>
        {collectionName && role === 'Admin' && (
          <AddElementDialog elemento={elemento} collectionName={collectionName} />
        )}
      </div>

      <DataTable columns={columns} data={data || []} isLoading={isLoading} />
    </div>
  );
}
