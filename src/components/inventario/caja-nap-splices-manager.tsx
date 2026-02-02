
'use client';

import { MuflaSplice, Fiber } from '@/lib/types';
import { DataTable } from '@/components/inventario/data-table';
import { getCajaNapSpliceColumns } from './caja-nap-splice-columns';
import { AddCajaNapSpliceDialog } from './add-caja-nap-splice-dialog';
import { useMemo } from 'react';
import { useFirebase } from '@/firebase';

type CajaNapSplicesManagerProps = {
  splices: MuflaSplice[];
  fibers: Fiber[];
  isLoading: boolean;
  cajaNapId: string;
};

export function CajaNapSplicesManager({ splices, fibers, isLoading, cajaNapId }: CajaNapSplicesManagerProps) {
  const { role } = useFirebase();
  const columns = useMemo(() => getCajaNapSpliceColumns(fibers, cajaNapId), [fibers, cajaNapId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {role === 'Admin' && <AddCajaNapSpliceDialog fibers={fibers} cajaNapId={cajaNapId} />}
      </div>
      <DataTable columns={columns} data={splices} isLoading={isLoading} />
    </div>
  );
}
