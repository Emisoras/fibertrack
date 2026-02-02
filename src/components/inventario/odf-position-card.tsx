
'use client';

import { OdfPosition } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EditOdfPositionDialog } from './edit-odf-position-dialog';
import { useFirebase } from '@/firebase';

const fiberColorMap: { [key: string]: string } = {
    'Azul': 'bg-blue-500',
    'Naranja': 'bg-orange-500',
    'Verde': 'bg-green-500',
    'Marrón': 'bg-yellow-800',
    'Gris': 'bg-gray-500',
    'Blanco': 'bg-white border',
    'Rojo': 'bg-red-500',
    'Negro': 'bg-black',
    'Amarillo': 'bg-yellow-400',
    'Violeta': 'bg-purple-500',
    'Rosa': 'bg-pink-500',
    'Agua': 'bg-cyan-400',
};

const statusColorMap: { [key: string]: string } = {
    'Libre': 'text-green-600',
    'Ocupado': 'text-red-600',
    'Reservado': 'text-yellow-600 dark:text-yellow-400',
    'Dañado': 'text-black dark:text-gray-300 font-bold bg-destructive/20 px-2 rounded',
};


type OdfPositionCardProps = {
  position: OdfPosition;
  odfId: string;
};

export function OdfPositionCard({ position, odfId }: OdfPositionCardProps) {
    const colorClass = fiberColorMap[position.color] || 'bg-gray-200';
    const { role } = useFirebase();

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                <div className={cn("h-4 w-4 rounded-full", colorClass)}></div>
                <CardTitle className="text-lg">P. {position.positionNumber}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow text-xs space-y-2">
                <p>
                    <span className="font-semibold">Estado: </span> 
                    <span className={cn(statusColorMap[position.status] || 'text-gray-500')}>
                        {position.status}
                    </span>
                </p>
                <p><span className="font-semibold">Servicio:</span> {position.serviceName || 'N/A'}</p>
                <p><span className="font-semibold">Destino:</span> {position.destinationLabel || position.destination || 'N/A'}</p>
                <p><span className="font-semibold">Fibra:</span> {position.fiberId || 'N/A'}</p>
            </CardContent>
            {role === 'Admin' && (
                <CardFooter className="p-2">
                    <EditOdfPositionDialog position={position} odfId={odfId} />
                </CardFooter>
            )}
        </Card>
    )
}
