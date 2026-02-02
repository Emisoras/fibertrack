'use client';

import { CajaNapPort } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CajaNapPortCard } from './caja-nap-port-card';

type CajaNapPortsGridProps = {
  ports: CajaNapPort[] | null;
  isLoading: boolean;
  cajaNapId: string;
};

export function CajaNapPortsGrid({ ports, isLoading, cajaNapId }: CajaNapPortsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (!ports || ports.length === 0) {
    return <p>No se encontraron puertos para esta Caja NAP.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {ports.map((port) => (
        <CajaNapPortCard key={port.id} port={port} cajaNapId={cajaNapId} />
      ))}
    </div>
  );
}
