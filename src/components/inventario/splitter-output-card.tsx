
'use client';

import { SplitterOutput } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EditSplitterOutputDialog } from './edit-splitter-output-dialog';
import { useFirebase } from '@/firebase';

const statusColorMap: { [key: string]: string } = {
    'Libre': 'text-green-600',
    'Ocupado': 'text-red-600',
    'Reservado': 'text-yellow-600 dark:text-yellow-400',
    'Dañado': 'text-black dark:text-gray-300 font-bold bg-destructive/20 px-2 rounded',
};


type SplitterOutputCardProps = {
  output: SplitterOutput;
  splitterId: string;
};

export function SplitterOutputCard({ output, splitterId }: SplitterOutputCardProps) {
    const { role } = useFirebase();
    return (
        <Card className="flex flex-col">
            <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                <CardTitle className="text-lg">Salida {output.outputNumber}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow text-xs space-y-2">
                <p>
                    <span className="font-semibold">Estado: </span> 
                    <span className={cn(statusColorMap[output.status] || 'text-gray-500')}>
                        {output.status}
                    </span>
                </p>
                <p><span className="font-semibold">Servicio:</span> {output.serviceName || 'N/A'}</p>
                <p><span className="font-semibold">Destino:</span> {output.destinationLabel || output.destination || 'N/A'}</p>
                <p><span className="font-semibold">Fibra:</span> {output.fiberId || 'N/A'}</p>
            </CardContent>
            {role === 'Admin' && (
                <CardFooter className="p-2">
                    <EditSplitterOutputDialog output={output} splitterId={splitterId} />
                </CardFooter>
            )}
        </Card>
    )
}
