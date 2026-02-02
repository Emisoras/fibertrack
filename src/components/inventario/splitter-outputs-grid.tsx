'use client';

import { SplitterOutput } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SplitterOutputCard } from './splitter-output-card';

type SplitterOutputsGridProps = {
  outputs: SplitterOutput[] | null;
  isLoading: boolean;
  splitterId: string;
};

export function SplitterOutputsGrid({ outputs, isLoading, splitterId }: SplitterOutputsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (!outputs || outputs.length === 0) {
    return <p>No se encontraron salidas para este splitter.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {outputs.map((output) => (
        <SplitterOutputCard key={output.id} output={output} splitterId={splitterId} />
      ))}
    </div>
  );
}
