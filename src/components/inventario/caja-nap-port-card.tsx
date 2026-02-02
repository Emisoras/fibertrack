
'use client';

import { CajaNapPort } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EditCajaNapPortDialog } from './edit-caja-nap-port-dialog';
import { useFirebase } from '@/firebase';

const statusColorMap: { [key: string]: string } = {
    'Libre': 'text-green-600',
    'Ocupado': 'text-red-600',
    'Reservado': 'text-yellow-600 dark:text-yellow-400',
    'Dañado': 'text-black dark:text-gray-300 font-bold bg-destructive/20 px-2 rounded',
};


type CajaNapPortCardProps = {
  port: CajaNapPort;
  cajaNapId: string;
};

export function CajaNapPortCard({ port, cajaNapId }: CajaNapPortCardProps) {
    const { role } = useFirebase();

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                <CardTitle className="text-lg">Puerto {port.portNumber}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow text-xs space-y-2">
                <p>
                    <span className="font-semibold">Estado: </span> 
                    <span className={cn(statusColorMap[port.status] || 'text-gray-500')}>
                        {port.status}
                    </span>
                </p>
                <p><span className="font-semibold">Servicio:</span> {port.serviceName || 'N/A'}</p>
                <p><span className="font-semibold">Potencia:</span> {port.outputPower ? `${port.outputPower} dBm` : 'N/A'}</p>
            </CardContent>
            {role === 'Admin' && (
                <CardFooter className="p-2">
                    <EditCajaNapPortDialog port={port} cajaNapId={cajaNapId} />
                </CardFooter>
            )}
        </Card>
    )
}
