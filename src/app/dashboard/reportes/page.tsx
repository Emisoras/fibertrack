'use client';

import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/inventario/data-table';
import { getColumnsForElement } from '@/components/inventario/columns';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { convertToCSV, downloadCSV } from '@/lib/utils';
import type { Fiber, InventoryItem, Splitter } from '@/lib/types';
import { getFiberColumns } from '@/components/inventario/fiber-columns';

export default function ReportesPage() {
  const { firestore } = useFirebase();
  const [reportType, setReportType] = useState('inventario-completo');


  const odfsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'odfs') : null),
    [firestore]
  );
  const cajasNapRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'cajas_nap') : null),
    [firestore]
  );
  const mufasRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'muflas') : null),
    [firestore]
  );
    const splittersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'splitters') : null),
    [firestore]
  );
  const fibersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'fibers') : null),
    [firestore]
  );
  
  const { data: odfs, isLoading: loadingOdfs } = useCollection<InventoryItem>(odfsRef);
  const { data: cajasNap, isLoading: loadingCajasNap } = useCollection<InventoryItem>(cajasNapRef);
  const { data: mufas, isLoading: loadingMufas } = useCollection<InventoryItem>(mufasRef);
  const { data: splitters, isLoading: loadingSplitters } = useCollection<Splitter>(splittersRef);
  const { data: fibers, isLoading: loadingFibers } = useCollection<Fiber>(fibersRef);
  
  const allElements: InventoryItem[] = useMemo(() => {
      return [...(odfs || []), ...(cajasNap || []), ...(mufas || []), ...(splitters || [])];
  }, [odfs, cajasNap, mufas, splitters]);
  
  const isLoading = loadingOdfs || loadingCajasNap || loadingMufas || loadingSplitters || loadingFibers;

  const reportData = useMemo(() => {
    switch(reportType) {
      case 'inventario-completo':
        return allElements;
      case 'estado-elementos':
        return allElements.map(e => ({ id: e.id, name: e.name, tipo: e.tipo, estado: e.estado, address: e.address }));
      case 'cortes-fibra':
        return fibers?.filter(f => f.estado === 'Corte') || [];
      default:
        return [];
    }
  }, [reportType, allElements, fibers]);


  const columns = useMemo(() => {
    if (reportType === 'cortes-fibra') {
      return getFiberColumns(allElements);
    }
    if (reportType === 'estado-elementos') {
        return [
            { accessorKey: "name", header: "Nombre", cell: ({ row }: any) => <div className="font-medium">{row.original.name}</div> },
            { accessorKey: "tipo", header: "Tipo", cell: ({ row }: any) => row.original.tipo },
            { accessorKey: "estado", header: "Estado", cell: ({ row }: any) => row.original.estado },
            { accessorKey: "address", header: "Dirección", cell: ({ row }: any) => row.original.address },
        ]
    }
    return getColumnsForElement('all');
  }, [reportType, allElements]);

  const handleDownload = () => {
    if (!reportData || reportData.length === 0) {
        alert('No hay datos para descargar.');
        return;
    }

    const flattenedData = reportData.map(item => {
        const flatItem: any = {};
        for (const key in item) {
            const value = (item as any)[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                for (const subKey in value) {
                    flatItem[`${key}_${subKey}`] = value[subKey];
                }
            } else {
                flatItem[key] = value;
            }
        }
        return flatItem;
    });

    const csv = convertToCSV(flattenedData);
    downloadCSV(csv, `${reportType}.csv`);
  }


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Auditoría y Reportes
        </h1>
        <p className="text-muted-foreground">
          Genera reportes para el control y auditoría de la infraestructura.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte</CardTitle>
          <CardDescription>
            Selecciona el tipo de reporte y aplica filtros para generar un
            informe.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventario-completo">
                  Inventario Completo
                </SelectItem>
                <SelectItem value="estado-elementos">
                  Estado de Elementos
                </SelectItem>
                <SelectItem value="cortes-fibra">
                  Reporte de Cortes de Fibra
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" disabled>
            <Filter className="mr-2 h-4 w-4" />
            Aplicar Filtros
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Generar y Descargar
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold font-headline">
          Vista Previa del Reporte
        </h2>
        <DataTable columns={columns} data={reportData} isLoading={isLoading} />
      </div>
    </div>
  );
}
