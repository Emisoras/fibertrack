
'use client';

import { MuflaSplice, Fiber, Splitter } from '@/lib/types';
import { DataTable } from '@/components/inventario/data-table';
import { getMuflaSpliceColumns } from './mufla-splice-columns';
import { AddMuflaSpliceDialog } from './add-mufla-splice-dialog';
import { useMemo } from 'react';
import { useFirebase } from '@/firebase';

type MuflaSplicesManagerProps = {
  splices: MuflaSplice[];
  fibers: Fiber[];
  splitters: Splitter[];
  isLoading: boolean;
  muflaId: string;
};

export function MuflaSplicesManager({ splices, fibers, splitters, isLoading, muflaId }: MuflaSplicesManagerProps) {
  const { role } = useFirebase();
  const columns = useMemo(() => getMuflaSpliceColumns(fibers, muflaId, splitters), [fibers, muflaId, splitters]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {role === 'Admin' && <AddMuflaSpliceDialog fibers={fibers} muflaId={muflaId} splitters={splitters} />}
      </div>
      <DataTable columns={columns} data={splices} isLoading={isLoading} />
    </div>
  );
}
