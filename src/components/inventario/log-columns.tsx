"use client";

import * as React from 'react';
import type { Log } from "@/lib/types";
import { Skeleton } from '../ui/skeleton';

type Column<T> = {
    accessorKey: keyof T | string;
    header: string;
    cell: (props: { row: { original: T } }) => React.ReactNode;
}

export const getLogColumns = (): Column<Log>[] => {
    return [
        {
            accessorKey: "timestamp",
            header: "Fecha y Hora",
            cell: ({ row }) => {
                const [clientDate, setClientDate] = React.useState('');
                const [clientTime, setClientTime] = React.useState('');

                React.useEffect(() => {
                    const date = new Date(row.original.timestamp);
                    setClientDate(date.toLocaleDateString());
                    setClientTime(date.toLocaleTimeString());
                }, [row.original.timestamp]);

                if (!clientDate) {
                    return <Skeleton className="h-4 w-24" />;
                }
                
                return (
                    <div>
                        <div>{clientDate}</div>
                        <div className="text-xs text-muted-foreground">{clientTime}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "elementType",
            header: "Tipo de Elemento",
            cell: ({ row }) => <div className="font-medium">{row.original.elementType}</div>,
        },
        {
            accessorKey: "elementName",
            header: "Nombre del Elemento",
            cell: ({ row }) => <div>{row.original.elementName}</div>,
        },
        {
            accessorKey: "details",
            header: "Detalles del Cambio",
            cell: ({ row }) => <div className="text-sm">{row.original.details}</div>,
        },
        {
            accessorKey: "user",
            header: "Usuario",
            cell: ({ row }) => <div>{row.original.user}</div>,
        },
    ]
};

    