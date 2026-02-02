'use client';

import { OdfPosition } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { OdfPositionCard } from './odf-position-card';

type OdfPositionsGridProps = {
  positions: OdfPosition[] | null;
  isLoading: boolean;
  odfId: string;
};

export function OdfPositionsGrid({ positions, isLoading, odfId }: OdfPositionsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return <p>No se encontraron posiciones para este ODF.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {positions.map((position) => (
        <OdfPositionCard key={position.id} position={position} odfId={odfId} />
      ))}
    </div>
  );
}

    