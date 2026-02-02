'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Search,
  LoaderCircle,
  Network,
  GitBranch,
  Spline,
  Split,
  Box,
  FlagOff,
  Map,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel as SelectGroupLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type {
  Odf,
  OdfPosition,
  Fiber,
  Mufla,
  MuflaSplice,
  CajaNap,
  CajaNapPort,
  Splitter,
  SplitterOutput,
  TraceStep,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Helper types for aggregated data
type OdfWithPositions = Odf & { positions: OdfPosition[] };
type MuflaWithSplices = Mufla & { splices: MuflaSplice[] };
type CajaNapWithRelations = CajaNap & {
  ports: CajaNapPort[];
  splices: MuflaSplice[];
};
type SplitterWithOutputs = Splitter & { outputs: SplitterOutput[] };

type FullNetworkData = {
  odfs: Record<string, OdfWithPositions>;
  fibers: Record<string, Fiber>;
  muflas: Record<string, MuflaWithSplices>;
  cajasNap: Record<string, CajaNapWithRelations>;
  splitters: Record<string, SplitterWithOutputs>;
};

const TraceStepIcon = ({ type }: { type: TraceStep['type'] }) => {
  const commonClass = 'h-8 w-8';
  switch (type) {
    case 'ODF':
      return <Network className={cn(commonClass, 'text-blue-500')} />;
    case 'Fiber':
      return <GitBranch className={cn(commonClass, 'text-gray-500')} />;
    case 'Mufla':
      return <Spline className={cn(commonClass, 'text-yellow-500')} />;
    case 'Splitter':
      return <Split className={cn(commonClass, 'text-purple-500')} />;
    case 'Caja NAP':
      return <Box className={cn(commonClass, 'text-green-500')} />;
    case 'End':
      return <FlagOff className={cn(commonClass, 'text-red-500')} />;
    default:
      return null;
  }
};

const getName = (el: any): string => el.name || el.nombre || 'Nombre Desconocido';

export function Tracer() {
  const { firestore, user, isUserLoading: isAuthLoading } = useFirebase();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isTracing, setIsTracing] = useState(false);
  const [fullData, setFullData] = useState<FullNetworkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceResults, setTraceResults] = useState<TraceStep[]>([]);

  const [selectedType, setSelectedType] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore) return;
      setIsDataLoading(true);
      setError(null);
      try {
        const data: FullNetworkData = { odfs: {}, fibers: {}, muflas: {}, cajasNap: {}, splitters: {} };

        // 1. Fetch all top-level documents
        const [odfsSnap, fibersSnap, muflasSnap, cajasNapSnap, splittersSnap] = await Promise.all([
          getDocs(collection(firestore, 'odfs')),
          getDocs(collection(firestore, 'fibers')),
          getDocs(collection(firestore, 'muflas')),
          getDocs(collection(firestore, 'cajas_nap')),
          getDocs(collection(firestore, 'splitters')),
        ]);

        // 2. Process top-level documents and prepare sub-collection fetching
        odfsSnap.forEach(doc => data.odfs[doc.id] = { id: doc.id, ...doc.data(), positions: [] } as OdfWithPositions);
        fibersSnap.forEach(doc => data.fibers[doc.id] = { id: doc.id, ...doc.data() } as Fiber);
        muflasSnap.forEach(doc => data.muflas[doc.id] = { id: doc.id, ...doc.data(), splices: [] } as MuflaWithSplices);
        cajasNapSnap.forEach(doc => data.cajasNap[doc.id] = { id: doc.id, ...doc.data(), ports: [], splices: [] } as CajaNapWithRelations);
        splittersSnap.forEach(doc => data.splitters[doc.id] = { id: doc.id, ...doc.data(), outputs: [] } as SplitterWithOutputs);
        
        // 3. Fetch all sub-collections in parallel
        const odfPromises = Object.values(data.odfs).map(async (odf) => {
          const positionsSnap = await getDocs(collection(firestore, 'odfs', odf.id, 'positions'));
          odf.positions = positionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as OdfPosition));
        });

        const muflaPromises = Object.values(data.muflas).map(async (mufla) => {
          const splicesSnap = await getDocs(collection(firestore, 'muflas', mufla.id, 'splices'));
          mufla.splices = splicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as MuflaSplice));
        });

        const cajaNapPromises = Object.values(data.cajasNap).map(async (caja) => {
          const portsSnap = await getDocs(collection(firestore, 'cajas_nap', caja.id, 'ports'));
          caja.ports = portsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CajaNapPort));
          const splicesSnap = await getDocs(collection(firestore, 'cajas_nap', caja.id, 'splices'));
          caja.splices = splicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as MuflaSplice));
        });

        const splitterPromises = Object.values(data.splitters).map(async (splitter) => {
          const outputsSnap = await getDocs(collection(firestore, 'splitters', splitter.id, 'outputs'));
          splitter.outputs = outputsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SplitterOutput));
        });

        await Promise.all([...odfPromises, ...muflaPromises, ...cajaNapPromises, ...splitterPromises]);

        setFullData(data);
      } catch (e) {
        console.error('Error fetching network data:', e);
        setError('No se pudo cargar la información completa de la red. Inténtelo de nuevo.');
      } finally {
        setIsDataLoading(false);
      }
    };

    if (firestore && !isAuthLoading && user) {
      fetchData();
    } else if (!isAuthLoading && !user) {
      setError('Autenticación falló. No se pueden cargar los datos de la red.');
      setIsDataLoading(false);
    }
  }, [firestore, user, isAuthLoading]);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedElementId('');
    setSelectedTarget('');
  };

  const handleElementChange = (value: string) => {
    setSelectedElementId(value);
    setSelectedTarget('');
  };

  const elementOptions = useMemo(() => {
    if (!fullData || !selectedType) return [];
    switch (selectedType) {
      case 'ODF':
        return Object.values(fullData.odfs).map((el) => ({
          value: el.id,
          label: getName(el),
        }));
      case 'Mufla':
        return Object.values(fullData.muflas).map((el) => ({
          value: el.id,
          label: getName(el),
        }));
      case 'Caja NAP':
        return Object.values(fullData.cajasNap).map((el) => ({
          value: el.id,
          label: getName(el),
        }));
      case 'Splitter':
        return Object.values(fullData.splitters).map((el) => ({
          value: el.id,
          label: getName(el),
        }));
      default:
        return [];
    }
  }, [fullData, selectedType]);

  const targetOptions = useMemo(() => {
    if (!fullData || !selectedElementId) return { positions: [], services: [] };

    const positions: { value: string; label: string }[] = [];
    const services: { value: string; label: string }[] = [];

    switch (selectedType) {
      case 'ODF':
        const odf = fullData.odfs[selectedElementId];
        if (odf) {
          odf.positions.forEach((p) => {
            positions.push({
              value: `position_${p.id}`,
              label: `Posición ${p.positionNumber}`,
            });
            if (p.serviceName) {
              services.push({
                value: `position_${p.id}`,
                label: `Servicio: ${p.serviceName} (P. ${p.positionNumber})`,
              });
            }
          });
        }
        break;
      case 'Mufla':
        const mufla = fullData.muflas[selectedElementId];
        if (mufla) {
          mufla.splices.forEach((s) => {
            const outFiber = fullData.fibers[s.outFiberId];
            const outFiberName = outFiber ? getName(outFiber) : s.outFiberId;
            positions.push({
              value: `splice_${s.id}`,
              label: `Salida Empalme (B:${s.trayNumber}, E:${s.spliceNumber}) -> Hilo ${s.outFiberThread}`,
            });
          });
        }
        break;
      case 'Caja NAP':
        const caja = fullData.cajasNap[selectedElementId];
        if (caja) {
          caja.ports.forEach((p) => {
            positions.push({
              value: `port_${p.id}`,
              label: `Puerto ${p.portNumber}`,
            });
            if (p.serviceName) {
              services.push({
                value: `port_${p.id}`,
                label: `Servicio: ${p.serviceName} (P. ${p.portNumber})`,
              });
            }
          });
        }
        break;
      case 'Splitter':
        const splitter = fullData.splitters[selectedElementId];
        if (splitter) {
          splitter.outputs.forEach((o) => {
            positions.push({
              value: `output_${o.id}`,
              label: `Salida ${o.outputNumber}`,
            });
            if (o.serviceName) {
              services.push({
                value: `output_${o.id}`,
                label: `Servicio: ${o.serviceName} (S. ${o.outputNumber})`,
              });
            }
          });
        }
        break;
    }
    return { positions, services };
  }, [fullData, selectedElementId, selectedType]);

  const startTrace = (): TraceStep[] | null => {
    if (!fullData) {
      setError( 'Los datos de la red aún no están listos. Por favor, espere o recargue la página.');
      return null;
    }
    if (!selectedType || !selectedElementId || !selectedTarget) {
      setError('Por favor, completa todos los campos para iniciar la traza.');
      return null;
    }

    setError(null);

    const processSplitterOutputs = (splitter: SplitterWithOutputs): TraceStep[] => {
      const steps: TraceStep[] = [];
      steps.push({
        type: 'Splitter',
        elementId: splitter.id,
        elementName: getName(splitter),
        details: `Entrada al splitter ${splitter.splittingRatio}. La señal se divide en ${splitter.capacity} salidas.`,
        status: splitter.estado,
      });

      if (splitter.outputs && splitter.outputs.length > 0) {
        splitter.outputs.forEach(output => {
          let outputDetails = `Salida ${output.outputNumber}: ${output.status}.`;
          
          if (output.fiberTrunkId && output.fiberThreadNumber) {
              const nextFiber = fullData.fibers[output.fiberTrunkId];
              if (nextFiber) {
                  outputDetails += ` Conectado a fibra: ${getName(nextFiber)} (Hilo ${output.fiberThreadNumber}).`;

                  let destinationElement: any = null;
                  if(nextFiber.destinationType === 'Odf') destinationElement = fullData.odfs[nextFiber.destinationId];
                  else if(nextFiber.destinationType === 'Mufla') destinationElement = fullData.muflas[nextFiber.destinationId];
                  else if(nextFiber.destinationType === 'CajaNap') destinationElement = fullData.cajasNap[nextFiber.destinationId];
                  else if(nextFiber.destinationType === 'Splitter') destinationElement = fullData.splitters[nextFiber.destinationId];

                  if (destinationElement) {
                      outputDetails += ` Destino final del tramo: ${getName(destinationElement)}.`;
                  } else {
                        outputDetails += ` Destino ID: ${nextFiber.destinationId}.`;
                  }
              } else {
                    outputDetails += ` Conectado a fibra ID: ${output.fiberTrunkId} (Hilo ${output.fiberThreadNumber}).`;
              }
          } else if (output.serviceName) {
            outputDetails += ` Servicio: ${output.serviceName}.`;
          } else if (output.destinationLabel) {
            outputDetails += ` Destino: ${output.destinationLabel}.`;
          }

          steps.push({
            type: 'End',
            elementId: output.id,
            elementName: `Salida ${output.outputNumber}`,
            details: outputDetails,
            status: output.status,
          });
        });
      } else {
        steps.push({
          type: 'End',
          elementId: splitter.id,
          elementName: 'Fin de la Traza (Splitter)',
          details: `Splitter no tiene salidas configuradas.`,
        });
      }
      return steps;
    };


    const path: TraceStep[] = [];
    let currentFiberId: string | undefined;
    let currentThread: number | undefined;
    let maxHops = 20; // To prevent infinite loops
    let startFound = false;

    const [targetType, targetId] = selectedTarget.split('_');

    let startElement: OdfPosition | CajaNapPort | SplitterOutput | MuflaSplice | undefined;
    let startParent: Odf | CajaNap | Splitter | Mufla | undefined;

    switch (selectedType) {
      case 'ODF':
        startParent = fullData.odfs[selectedElementId];
        startElement = startParent?.positions.find((p) => p.id === targetId);
        if (startParent && startElement) {
          path.push({
            type: 'ODF',
            elementId: startParent.id,
            elementName: getName(startParent),
            details: `Inicio en Posición ${(startElement as OdfPosition).positionNumber}`,
            status: startElement.status,
          });
          currentFiberId = startElement.fiberTrunkId;
          currentThread = startElement.fiberThreadNumber;
          startFound = true;
        }
        break;
      case 'Mufla':
        startParent = fullData.muflas[selectedElementId];
        startElement = startParent?.splices.find((s) => s.id === targetId);
        if (startParent && startElement) {
            const destinationAsSplitter = fullData.splitters[startElement.outFiberId];
            let destinationName: string;

            if (destinationAsSplitter) {
                destinationName = `Splitter: ${getName(destinationAsSplitter)}`;
            } else {
                const destinationAsFiber = fullData.fibers[startElement.outFiberId];
                destinationName = destinationAsFiber ? getName(destinationAsFiber) : startElement.outFiberId;
            }

            path.push({
                type: 'Mufla',
                elementId: startParent.id,
                elementName: getName(startParent),
                details: `Inicio desde empalme (B:${startElement.trayNumber}, E:${startElement.spliceNumber}) hacia ${destinationName}`,
                status: startParent.estado,
            });

            if (destinationAsSplitter) {
                const splitterSteps = processSplitterOutputs(destinationAsSplitter);
                path.push(...splitterSteps);
                currentFiberId = undefined;
            } else {
                currentFiberId = startElement.outFiberId;
                currentThread = startElement.outFiberThread;
            }
            startFound = true;
        }
        break;
      case 'Caja NAP':
        startParent = fullData.cajasNap[selectedElementId];
        startElement = startParent?.ports.find((p) => p.id === targetId);
        if (startParent && startElement) {
          path.push({
            type: 'Caja NAP',
            elementId: startParent.id,
            elementName: getName(startParent),
            details: `Inicio en Puerto ${(startElement as CajaNapPort).portNumber}`,
            status: startElement.status,
          });
          currentFiberId = startElement.fiberTrunkId;
          currentThread = startElement.fiberThreadNumber;
          startFound = true;
        }
        break;
      case 'Splitter':
        startParent = fullData.splitters[selectedElementId];
        startElement = startParent?.outputs.find((o) => o.id === targetId);
        if (startParent && startElement) {
          path.push({
            type: 'Splitter',
            elementId: startParent.id,
            elementName: getName(startParent),
            details: `Inicio en Salida ${(startElement as SplitterOutput).outputNumber}`,
            status: startElement.status,
          });
          currentFiberId = startElement.fiberTrunkId;
          currentThread = startElement.fiberThreadNumber;
          startFound = true;
        }
        break;
    }

    if (!startFound) {
      setError(`No se pudo encontrar el punto de partida. Por favor, verifica la selección.`);
      return null;
    }

    while (currentFiberId && currentThread && maxHops > 0) {
      maxHops--;
      const fiber = Object.values(fullData.fibers).find(
        (f) => f.id === currentFiberId
      );

      if (!fiber) {
        path.push({
          type: 'End',
          elementId: 'unknown-fiber',
          elementName: 'Fibra Desconocida',
          details: `El hilo #${currentThread} se pierde en el tramo ${currentFiberId} (no encontrado).`,
        });
        break;
      }

      path.push({
        type: 'Fiber',
        elementId: fiber.id,
        elementName: getName(fiber),
        details: `Usando Hilo #${currentThread} (${fiber.distance}m)`,
        status: fiber.estado,
      });

      if (fiber.estado !== 'Activo') {
        path.push({
          type: 'End',
          elementId: fiber.id,
          elementName: 'Fin de la Traza',
          details: `La fibra está en estado "${fiber.estado}".`,
        });
        break;
      }

      const nextElementId = fiber.destinationId;
      const nextElementType = fiber.destinationType;
      let nextHopFound = false;

      switch (nextElementType) {
        case 'Mufla':
            const mufla = fullData.muflas[nextElementId];
            if (mufla) {
                const splice = mufla.splices.find(
                    (s) =>
                    s.inFiberId === currentFiberId &&
                    s.inFiberThread === currentThread
                );
                if (splice) {
                    const destinationAsSplitter = fullData.splitters[splice.outFiberId];
                    let destinationName: string;
                    if (destinationAsSplitter) {
                        destinationName = `Splitter: ${getName(destinationAsSplitter)}`;
                    } else {
                        const destinationAsFiber = fullData.fibers[splice.outFiberId];
                        destinationName = destinationAsFiber ? getName(destinationAsFiber) : splice.outFiberId;
                    }
        
                    path.push({
                        type: 'Mufla',
                        elementId: mufla.id,
                        elementName: getName(mufla),
                        details: `Empalme en B.${splice.trayNumber}, E.${splice.spliceNumber} hacia ${destinationName}`,
                        status: mufla.estado,
                    });
        
                    if (destinationAsSplitter) {
                        const splitterSteps = processSplitterOutputs(destinationAsSplitter);
                        path.push(...splitterSteps);
                        currentFiberId = undefined;
                    } else {
                        currentFiberId = splice.outFiberId;
                        currentThread = splice.outFiberThread;
                    }
                    nextHopFound = true;
                }
            }
            break;
        case 'CajaNap':
          const caja = fullData.cajasNap[nextElementId];
          if (caja) {
            const splice = caja.splices.find(
              (s) =>
                s.inFiberId === currentFiberId &&
                s.inFiberThread === currentThread
            );
            if (splice) {
              path.push({
                type: 'Caja NAP',
                elementId: caja.id,
                elementName: getName(caja),
                details: `Empalme de paso en Bandeja ${splice.trayNumber}, Hilo ${splice.spliceNumber}`,
                status: caja.estado,
              });
              currentFiberId = splice.outFiberId;
              currentThread = splice.outFiberThread;
              nextHopFound = true;
            } else {
              const port = caja.ports.find(
                (p) =>
                  p.fiberTrunkId === currentFiberId &&
                  p.fiberThreadNumber === currentThread
              );
              if (port) {
                path.push({
                  type: 'Caja NAP',
                  elementId: caja.id,
                  elementName: getName(caja),
                  details: `Termina en Puerto ${port.portNumber}`,
                  status: port.status,
                });
                path.push({
                  type: 'End',
                  elementId: port.id,
                  elementName: 'Punto Terminal',
                  details: `Servicio: ${port.serviceName || 'N/A'}`,
                });
                currentFiberId = undefined; // End of trace
                nextHopFound = true;
              }
            }
          }
          break;
        case 'Splitter':
          const splitter = fullData.splitters[nextElementId];
          if (
            splitter &&
            splitter.inFiberId === currentFiberId &&
            splitter.inFiberThread === currentThread
          ) {
            const splitterSteps = processSplitterOutputs(splitter);
            path.push(...splitterSteps);
            currentFiberId = undefined;
            nextHopFound = true;
          }
          break;
      }

      if (!nextHopFound) {
        path.push({
          type: 'End',
          elementId: 'no-connection',
          elementName: 'Conexión Perdida',
          details: `No se encontró conexión de salida para el Hilo #${currentThread} en ${nextElementId}.`,
        });
        break;
      }
    }
    if (maxHops <= 0) {
      path.push({
        type: 'End',
        elementId: 'too-many-hops',
        elementName: 'Límite de Saltos',
        details: 'La traza se detuvo para evitar un bucle infinito.',
      });
    }

    return path;
  }

  const handleTraceAndShowSteps = () => {
    setIsTracing(true);
    setTraceResults([]);
    const path = startTrace();
    if (path) {
      setTraceResults(path);
      if(path.length <= 1) {
        setError('No se pudo generar una ruta con la selección actual. La traza terminó inmediatamente.');
      }
    }
    setIsTracing(false);
  }

  const handleTraceAndShowOnMap = () => {
    setIsTracing(true);
    setTraceResults([]);
    const path = startTrace();
    
    if (path && path.length > 1) {
      const fiberIds = new Set<string>();
      const elementIds = new Set<string>();

      path.forEach(step => {
        if (step.elementId.includes('unknown') || step.elementId.includes('no-connection') || step.elementId.includes('too-many-hops')) return;

        if (step.type === 'Fiber') {
          fiberIds.add(step.elementId);
        } else if (step.type !== 'End') {
          elementIds.add(step.elementId);
        }
      });
      
      elementIds.add(selectedElementId);

      const params = new URLSearchParams();
      if (fiberIds.size > 0) {
        params.set('highlight_fibers', Array.from(fiberIds).join(','));
      }
      if (elementIds.size > 0) {
        params.set('highlight_elements', Array.from(elementIds).join(','));
      }
      
      const firstElement = fullData?.odfs[selectedElementId] || fullData?.muflas[selectedElementId] || fullData?.cajasNap[selectedElementId] || fullData?.splitters[selectedElementId];
      if (firstElement?.latitude && firstElement?.longitude) {
        params.set('focus_lat', firstElement.latitude.toString());
        params.set('focus_lng', firstElement.longitude.toString());
      }

      router.push(`/dashboard?${params.toString()}`);
    } else {
      setError('No se pudo generar una ruta para visualizar en el mapa.');
      setIsTracing(false);
    }
  }


  const isLoading = isAuthLoading || isDataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        <span>Cargando datos de la red...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar Trazabilidad</CardTitle>
          <CardDescription>
            Selecciona un punto de partida para rastrear la ruta de la fibra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row w-full items-start md:items-end gap-2">
            <div className="grid gap-1.5 w-full md:flex-1">
              <Label htmlFor="trace-type">Tipo de Elemento</Label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger id="trace-type">
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ODF">
                    ODF (Optical Distribution Frame)
                  </SelectItem>
                  <SelectItem value="Mufla">
                    Mufla (Caja de Empalme)
                  </SelectItem>
                  <SelectItem value="Caja NAP">
                    Caja NAP (Punto de Acceso)
                  </SelectItem>
                  <SelectItem value="Splitter">Splitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 w-full md:flex-1">
              <Label htmlFor="trace-element">Elemento</Label>
              <Select
                value={selectedElementId}
                onValueChange={handleElementChange}
                disabled={!selectedType || isLoading}
              >
                <SelectTrigger id="trace-element">
                  <SelectValue placeholder="Seleccionar elemento..." />
                </SelectTrigger>
                <SelectContent>
                  {elementOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 w-full md:flex-1">
              <Label htmlFor="trace-target">Puerto / Hilo / Servicio</Label>
              <Select
                value={selectedTarget}
                onValueChange={setSelectedTarget}
                disabled={!selectedElementId}
              >
                <SelectTrigger id="trace-target">
                  <SelectValue placeholder="Seleccionar objetivo..." />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.positions.length > 0 && (
                    <SelectGroup>
                      <SelectGroupLabel>
                        {selectedType === 'Splitter' ? 'Salidas' : 'Puertos / Hilos'}
                      </SelectGroupLabel>
                      {targetOptions.positions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {targetOptions.services.length > 0 && (
                    <SelectGroup>
                      <SelectGroupLabel>Servicios Activos</SelectGroupLabel>
                      {targetOptions.services.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className='flex gap-2'>
              <Button onClick={handleTraceAndShowSteps} disabled={!selectedTarget || isTracing} variant="outline">
                {isTracing ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Trazar Ruta
              </Button>
              <Button onClick={handleTraceAndShowOnMap} disabled={!selectedTarget || isTracing}>
                <Map className="h-4 w-4 mr-2" />
                Ver en Mapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {traceResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de la Trazabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 h-full w-px bg-border -translate-x-1/2 ml-4"></div>
              <ul className="space-y-8">
                {traceResults.map((step, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="absolute left-0 -translate-x-1/2 z-10 bg-background p-1 rounded-full border">
                      <TraceStepIcon type={step.type} />
                    </div>
                    <div className="flex-1 pl-8">
                      <p className="font-bold text-lg">{step.elementName}</p>
                      <p className="text-sm text-muted-foreground">{step.details}</p>
                      {step.status && <Badge variant={step.status === 'Activo' ? 'default' : 'destructive'} className={cn(step.status === 'Activo' && 'bg-green-600')}>{step.status}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
