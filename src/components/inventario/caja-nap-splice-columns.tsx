
"use client";

import { MuflaSplice, Fiber } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { DeleteElementDialog } from "./delete-element-dialog";
import { EditCajaNapSpliceDialog } from "./edit-caja-nap-splice-dialog";
import { useFirebase } from "@/firebase";

type Column<T> = {
    accessorKey: keyof T | string;
    header: string;
    cell: (props: { row: { original: T } }) => React.ReactNode;
}

export const getCajaNapSpliceColumns = (allFibers: Fiber[], cajaNapId: string): Column<MuflaSplice>[] => {
    const fiberNameResolver = (fiberId: string, thread: number) => {
        if (!fiberId) return 'N/A';
        const fiber = allFibers.find(f => f.id === fiberId);
        if (!fiber) return `${fiberId} - Hilo ${thread}`;
        return `${fiber.name} - Hilo ${thread}`;
    };

    return [
    {
        accessorKey: "trayNumber",
        header: "Bandeja",
        cell: ({ row }) => <div className="font-medium text-center">{row.original.trayNumber}</div>,
    },
    {
        accessorKey: "spliceNumber",
        header: "Empalme",
        cell: ({ row }) => <div className="text-center">{row.original.spliceNumber}</div>,
    },
    {
        accessorKey: "inFiber",
        header: "Fibra Entrante",
        cell: ({ row }) => <div>{fiberNameResolver(row.original.inFiberId, row.original.inFiberThread)}</div>,
    },
    {
        accessorKey: "outFiber",
        header: "Fibra Saliente",
        cell: ({ row }) => <div>{fiberNameResolver(row.original.outFiberId, row.original.outFiberThread)}</div>,
    },
    {
        accessorKey: "notes",
        header: "Notas",
        cell: ({ row }) => <div className="text-muted-foreground truncate max-w-xs">{row.original.notes}</div>,
    },
    {
        accessorKey: "actions",
        header: "Acciones",
        cell: ({ row }) => {
            const { role } = useFirebase();
            const splice = row.original;

            if (role !== 'Admin') return null;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <EditCajaNapSpliceDialog
                            splice={splice}
                            fibers={allFibers}
                            cajaNapId={cajaNapId}
                        />
                        <DeleteElementDialog
                            item={{
                                id: splice.id, 
                                name: `Empalme ${splice.spliceNumber} (Bandeja ${splice.trayNumber})`, 
                                tipo: 'Splice' as any
                            }}
                            collectionName={`cajas_nap/${cajaNapId}/splices`}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
]};
