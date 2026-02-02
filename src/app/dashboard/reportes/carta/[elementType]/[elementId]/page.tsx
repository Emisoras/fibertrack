
'use client';
import { useParams } from 'next/navigation';
import OdfChart from '@/components/reportes/odf-chart';
import MuflaChart from '@/components/reportes/mufla-chart';
import CajaNapChart from '@/components/reportes/caja-nap-chart';
import SplitterChart from '@/components/reportes/splitter-chart';
import { ChartLayout } from '@/components/reportes/chart-layout';

export default function ChartPage() {
    const params = useParams();
    const elementType = params.elementType as string;
    const elementId = params.elementId as string;

    const backHref = `/dashboard/inventario/${elementType === 'odf' ? 'odf' : elementType}/${elementId}`;

    switch (elementType) {
        case 'odf':
            return <OdfChart elementId={elementId} />;
        case 'mufas':
             return <MuflaChart elementId={elementId} />;
        case 'cajas-nap':
             return <CajaNapChart elementId={elementId} />;
        case 'splitters':
             return <SplitterChart elementId={elementId} />;
        default:
            return (
                <ChartLayout title="Error" subtitle="Tipo de elemento no reconocido" backHref="/dashboard/inventario">
                    <p>El tipo de elemento "{elementType}" no es válido para generar un reporte.</p>
                </ChartLayout>
            )
    }
}
