
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CajaNap, Fiber } from '@/lib/types';
import { EditCajaNapInputDialog } from './edit-caja-nap-input-dialog';
import { useFirebase } from '@/firebase';

type CajaNapInputManagerProps = {
  cajaNap: CajaNap;
  fibers: Fiber[];
  isLoading: boolean;
};

export function CajaNapInputManager({ cajaNap, fibers, isLoading }: CajaNapInputManagerProps) {
  const { role } = useFirebase();

  const inputFiberName = useMemo(() => {
    if (!cajaNap.inFiberId || !fibers) return 'N/A';
    const fiber = fibers.find(f => f.id === cajaNap.inFiberId);
    return fiber ? fiber.name : cajaNap.inFiberId;
  }, [cajaNap.inFiberId, fibers]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fibra de Entrada</CardTitle>
        <CardDescription>
          El hilo de fibra que alimenta esta caja NAP (sangría).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div>
            <span className="font-semibold">Tramo de Fibra: </span>
            <span>{inputFiberName}</span>
          </div>
          <div>
            <span className="font-semibold">Hilo: </span>
            <span>{cajaNap.inFiberThread || 'N/A'}</span>
          </div>
        </div>
        {role === 'Admin' && <EditCajaNapInputDialog cajaNap={cajaNap} fibers={fibers} />}
      </CardContent>
    </Card>
  );
}
