'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { DataTable } from '@/components/inventario/data-table';
import { getLogColumns } from '@/components/inventario/log-columns';
import { Log } from '@/lib/types';

export default function AuditoriaPage() {
  const { firestore } = useFirebase();

  const logsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'logs'), orderBy('timestamp', 'desc')) : null),
    [firestore]
  );

  const { data: logs, isLoading } = useCollection<Log>(logsQuery);

  const columns = useMemo(() => getLogColumns(), []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Registro de Auditoría</h1>
        <p className="text-muted-foreground">
          Un registro de todos los cambios realizados en el inventario de la red.
        </p>
      </div>
      <DataTable columns={columns} data={logs || []} isLoading={isLoading} />
    </div>
  );
}

    