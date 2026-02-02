
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Splitter, Fiber } from '@/lib/types';
import { EditSplitterInputDialog } from './edit-splitter-input-dialog';
import { useFirebase } from '@/firebase';

type SplitterInputManagerProps = {
  splitter: Splitter;
  fibers: Fiber[];
  isLoading: boolean;
};

export function SplitterInputManager({ splitter, fibers, isLoading }: SplitterInputManagerProps) {
  const { role } = useFirebase();

  const inputFiberName = useMemo(() => {
    if (!splitter.inFiberId || !fibers) return 'N/A';
    const fiber = fibers.find(f => f.id === splitter.inFiberId);
    return fiber ? fiber.name : splitter.inFiberId;
  }, [splitter.inFiberId, fibers]);

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
          El hilo de fibra que alimenta este splitter.
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
            <span>{splitter.inFiberThread || 'N/A'}</span>
          </div>
        </div>
        {role === 'Admin' && <EditSplitterInputDialog splitter={splitter} fibers={fibers} />}
      </CardContent>
    </Card>
  );
}
