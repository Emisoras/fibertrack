
'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { getFiberColumns } from '@/components/inventario/fiber-columns';
import { DataTable } from '@/components/inventario/data-table';
import { AddFiberDialog } from '@/components/inventario/add-fiber-dialog';
import { InventoryItem } from '@/lib/types';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const AddFiberDialogWithNoSSR = dynamic(
  () => import('@/components/inventario/add-fiber-dialog').then(mod => mod.AddFiberDialog),
  { ssr: false }
);

export default function FibrasPage() {
  const { firestore, role } = useFirebase();
  const searchParams = useSearchParams();

  // Fetch all required data
  const fibersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'fibers') : null), [firestore]);
  const odfsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'odfs') : null), [firestore]);
  const mufasRef = useMemoFirebase(() => (firestore ? collection(firestore, 'muflas') : null), [firestore]);
  const cajasNapRef = useMemoFirebase(() => (firestore ? collection(firestore, 'cajas_nap') : null), [firestore]);
  const splittersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'splitters') : null), [firestore]);

  const { data: fibers, isLoading: isLoadingFibers } = useCollection(fibersRef);
  const { data: odfs, isLoading: isLoadingOdfs } = useCollection(odfsRef);
  const { data: mufas, isLoading: isLoadingMufas } = useCollection(mufasRef);
  const { data: cajasNap, isLoading: isLoadingCajasNap } = useCollection(cajasNapRef);
  const { data: splitters, isLoading: isLoadingSplitters } = useCollection(splittersRef);


  const allElements = useMemo(() => {
    const elements: InventoryItem[] = [];
    if (odfs) elements.push(...odfs);
    if (mufas) elements.push(...mufas);
    if (cajasNap) elements.push(...cajasNap);
    if (splitters) elements.push(...splitters);
    return elements;
  }, [odfs, mufas, cajasNap, splitters]);

  const highlightedFiberId = useMemo(() => {
    return searchParams.get('highlight_fibers');
  }, [searchParams]);
  
  const columns = useMemo(() => getFiberColumns(allElements), [allElements]);
  const isLoading = isLoadingFibers || isLoadingOdfs || isLoadingMufas || isLoadingCajasNap || isLoadingSplitters;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Tramos de Fibra</h1>
          <p className="text-muted-foreground">Gestiona los segmentos de fibra de tu red.</p>
        </div>
        {role === 'Admin' && <AddFiberDialogWithNoSSR allElements={allElements} />}
      </div>
      <DataTable columns={columns} data={fibers || []} isLoading={isLoading} highlightedRowId={highlightedFiberId}/>
    </div>
  );
}
