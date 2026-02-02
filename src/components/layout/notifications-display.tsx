'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Box } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Notification = {
    id: string;
    type: 'corte' | 'capacidad';
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}

export function NotificationsDisplay() {
    const { firestore } = useFirebase();

    const fiberCutsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'fibers'), where('estado', '==', 'Corte')) : null,
        [firestore]
    );

    const { data: fiberCuts, isLoading: isLoadingCuts } = useCollection(fiberCutsQuery);

    const notifications: Notification[] = useMemo(() => {
        const cuts: Notification[] = (fiberCuts || []).map(cut => ({
            id: cut.id,
            type: 'corte',
            title: `Corte de Fibra: ${cut.name}`,
            description: `Se ha reportado un corte en el tramo.`,
            href: `/dashboard/inventario/fibras?highlight_fibers=${cut.id}`,
            icon: <AlertTriangle className="h-4 w-4 text-destructive" />
        }));
        // Future notifications can be added here
        return cuts;
    }, [fiberCuts]);

    return (
        <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-4">
                <h3 className="font-semibold">Notificaciones</h3>
                {notifications.length > 0 && (
                    <Badge variant="destructive">{notifications.length}</Badge>
                )}
            </div>
            <Separator />
            <div className="max-h-96 overflow-y-auto">
                {isLoadingCuts ? (
                     <div className="p-4 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                     </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones nuevas.</div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map(notification => (
                             <Link key={notification.id} href={notification.href} passHref>
                                <div className="block p-4 hover:bg-muted/50 border-b last:border-b-0 cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">{notification.icon}</div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground">{notification.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </PopoverContent>
    );
}
