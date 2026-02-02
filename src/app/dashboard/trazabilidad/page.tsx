'use client';

import { Tracer } from '@/components/trazabilidad/tracer';

export default function TrazabilidadPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Trazabilidad de Fibra
        </h1>
        <p className="text-muted-foreground">
          Sigue el recorrido de un hilo de fibra o servicio a través de la red.
        </p>
      </div>
      <Tracer />
    </div>
  );
}
