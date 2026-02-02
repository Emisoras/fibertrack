
"use client";

import type { Fiber, InventoryItem } from "@/lib/types";
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
import { MoreHorizontal, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientFormattedDate } from "./ClientFormattedDate";
import { DeleteElementDialog } from "./delete-element-dialog";
import { EditFiberDialog } from "./edit-fiber-dialog";
import dynamic from "next/dynamic";
import Link from "next/link";
import { UpdateFiberStatusMenuItem } from "./update-fiber-status-menu-item";
import { useFirebase } from "@/firebase";


const EditFiberDialogWithNoSSR = dynamic(
  () => import('./edit-fiber-dialog').then(mod => mod.EditFiberDialog),
  { ssr: false }
);


type Column<T> = {
    accessorKey: keyof T | string;
    header: string;
    cell: (props: { row: { original: T } }) => React.ReactNode;
}

export const getFiberColumns = (allElements: InventoryItem[]): Column<Fiber>[] => {
    const nameResolver = (id: string, type: string) => {
        const element = allElements.find(el => el.id === id && el.tipo === type);
        return element?.name || id;
    }

    return [
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
        accessorKey: "origin",
        header: "Origen",
        cell: ({ row }) => <div>{nameResolver(row.original.originId, row.original.originType)}</div>,
    },
    {
        accessorKey: "destination",
        header: "Destino",
        cell: ({ row }) => <div>{nameResolver(row.original.destinationId, row.original.destinationType)}</div>,
    },
    {
        accessorKey: "distance",
        header: "Distancia",
        cell: ({ row }) => <div>{row.original.distance} m</div>,
    },
    {
        accessorKey: "threadCount",
        header: "Hilos",
        cell: ({ row }) => <div>{row.original.threadCount}</div>,
    },
    {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
            const estado = row.original.estado;
            return (
                <Badge 
                    variant={estado === 'Activo' ? 'default' : estado === 'Inactivo' ? 'destructive' : 'secondary'}
                    className={cn(estado === 'Activo' && 'bg-green-600 text-white', estado === 'Corte' && 'bg-yellow-500 text-black')}
                >
                    {estado}
                </Badge>
            );
        },
    },
    {
        accessorKey: "fechaCreacion",
        header: "Fecha de Creación",
        cell: ({ row }) => <ClientFormattedDate dateString={row.original.fechaCreacion} />,
    },
    {
        accessorKey: "actions",
        header: "Acciones",
        cell: ({ row }) => {
            const item = row.original;
            const { role } = useFirebase();
            
            const getCoords = (el: InventoryItem | undefined) => {
                if (!el) return null;
                const lat = (el as any).latitude;
                const lng = (el as any).longitude;
                if (typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)) {
                    return { lat, lng };
                }
                return null;
            }

            const originElement = allElements.find(el => el.id === item.originId && el.tipo === item.originType);
            const destElement = allElements.find(el => el.id === item.destinationId && el.tipo === item.destinationType);
            
            const originCoords = getCoords(originElement);
            const destCoords = getCoords(destElement);

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
                        {role === 'Admin' && (
                            <>
                                <UpdateFiberStatusMenuItem fiber={item} newStatus="Corte">
                                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                                    <span>Reportar Corte</span>
                                </UpdateFiberStatusMenuItem>
                                <UpdateFiberStatusMenuItem fiber={item} newStatus="Activo">
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Marcar como Solucionado</span>
                                </UpdateFiberStatusMenuItem>
                                <DropdownMenuSeparator />
                                <EditFiberDialogWithNoSSR fiber={item} allElements={allElements}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        Editar todos los campos...
                                    </DropdownMenuItem>
                                </EditFiberDialogWithNoSSR>
                                <DeleteElementDialog item={{...item, tipo: 'Fiber' as any}} collectionName="fibers" />
                            </>
                        )}
                         <DropdownMenuSeparator />
                         {originCoords && (
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard?focus_lat=${originCoords.lat}&focus_lng=${originCoords.lng}`}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Ver origen en mapa
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {destCoords && (
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard?focus_lat=${destCoords.lat}&focus_lng=${destCoords.lng}`}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Ver destino en mapa
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                            Copiar ID
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
]};
