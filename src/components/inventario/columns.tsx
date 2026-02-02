
"use client";

import type { InventoryItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientFormattedDate } from "./ClientFormattedDate";
import Link from "next/link";
import { EditElementDialog } from "./edit-element-dialog";
import { DeleteElementDialog } from "./delete-element-dialog";
import { useFirebase } from "@/firebase";

type Column<T> = {
    accessorKey: keyof T | string;
    header: string;
    cell: (props: { row: { original: T } }) => React.ReactNode;
}

const getCollectionNameFromTipo = (tipo?: InventoryItem['tipo']): string => {
    if (!tipo) return '';
    switch (tipo) {
        case 'Odf': return 'odfs';
        case 'CajaNap': return 'cajas_nap';
        case 'Mufla': return 'muflas';
        case 'Splitter': return 'splitters';
        default: return '';
    }
}

const commonColumns: Column<InventoryItem>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
            const estado = row.original.estado;
            return (
                <Badge 
                    variant={estado === 'Activo' ? 'default' : estado === 'Inactivo' ? 'destructive' : 'secondary'}
                    className={cn(estado === 'Activo' && 'bg-green-600 text-white')}
                >
                    {estado}
                </Badge>
            );
        },
    },
    {
        accessorKey: "address",
        header: "Ubicación",
        cell: ({ row }) => {
            const item = row.original;
            return <div>{item.address || `Lat: ${item.latitude}, Lng: ${item.longitude}`}</div>
        },
    },
    {
        accessorKey: "fechaCreacion",
        header: "Fecha de Creación",
        cell: ({ row }) => <div><ClientFormattedDate dateString={row.original.fechaCreacion} /></div>,
    },
];


export const getColumnsForElement = (elemento: string): Column<any>[] => {
    
    const actionsColumn: Column<InventoryItem> = {
        accessorKey: "actions",
        header: "Acciones",
        cell: ({ row }) => {
            const item = row.original;
            const { role } = useFirebase();

            const tipoMapping: { [key: string]: InventoryItem['tipo'] | undefined } = {
                odf: 'Odf',
                'cajas-nap': 'CajaNap',
                mufas: 'Mufla',
                splitters: 'Splitter',
            };
            
            const inferredTipo = tipoMapping[elemento];
            const rawItemTipo = item.tipo || inferredTipo;
            let normalizedItemTipo: InventoryItem['tipo'] | undefined;
            if (rawItemTipo) {
                const lowerTipo = rawItemTipo.toLowerCase().replace(/[-_]/g, '');
                if (lowerTipo === 'odf') {
                    normalizedItemTipo = 'Odf';
                } else if (lowerTipo === 'cajanap') {
                    normalizedItemTipo = 'CajaNap';
                } else if (lowerTipo === 'mufla') {
                    normalizedItemTipo = 'Mufla';
                } else if (lowerTipo === 'splitter') {
                    normalizedItemTipo = 'Splitter';
                }
            }
            
            if (!normalizedItemTipo) {
                 return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                    </DropdownMenu>
                 );
            }

            const collectionName = getCollectionNameFromTipo(normalizedItemTipo);
            const itemWithTipo = { ...item, tipo: normalizedItemTipo };

            const getDetailsPath = (item: InventoryItem) => {
                switch (item.tipo) {
                    case 'Odf':
                        return `/dashboard/inventario/odf/${item.id}`;
                    case 'Mufla':
                        return `/dashboard/inventario/mufla/${item.id}`;
                    case 'Splitter':
                        return `/dashboard/inventario/splitter/${item.id}`;
                    case 'CajaNap':
                        return `/dashboard/inventario/caja-nap/${item.id}`;
                    default:
                        return null;
                }
            }
            const detailsPath = getDetailsPath(itemWithTipo);

            const getCoords = (el: InventoryItem) => {
                const lat = (el as any).latitude;
                const lng = (el as any).longitude;
                if (typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)) {
                    return { lat, lng };
                }
                return null;
            }
            const coords = getCoords(item);

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
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {detailsPath ? (
                            <DropdownMenuItem asChild>
                                <Link href={detailsPath}>Ver detalles</Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem disabled>Ver detalles</DropdownMenuItem>
                        )}
                        {coords && (
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard?focus_lat=${coords.lat}&focus_lng=${coords.lng}`}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Ver en mapa
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {role === 'Admin' && (
                            <>
                                <DropdownMenuSeparator />
                                {collectionName ? (
                                    <EditElementDialog item={itemWithTipo} collectionName={collectionName}>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            Editar
                                        </DropdownMenuItem>
                                    </EditElementDialog>
                                ) : <DropdownMenuItem disabled>Editar</DropdownMenuItem>}
                                {collectionName ? <DeleteElementDialog item={itemWithTipo} collectionName={collectionName} /> : <DropdownMenuItem disabled className="text-red-500">Eliminar</DropdownMenuItem>}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    };

    if (elemento === 'all') {
        return [
            ...commonColumns,
             {
                accessorKey: "tipo",
                header: "Tipo",
                cell: ({ row }) => <div>{row.original.tipo || 'N/A'}</div>,
            },
           actionsColumn
        ]
    }
    return [...commonColumns, actionsColumn];
};
