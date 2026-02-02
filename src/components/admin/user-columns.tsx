
"use client";
import { UserProfile } from "@/lib/types";
import { ClientFormattedDate } from "@/components/inventario/ClientFormattedDate";
import { UserRoleSwitcher } from "./user-role-switcher";
import { useFirebase } from "@/firebase";
import { UserStatusSwitcher } from "./user-status-switcher";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { DeleteElementDialog } from "../inventario/delete-element-dialog";

type Column<T> = {
    accessorKey: keyof T | string;
    header: string;
    cell: (props: { row: { original: T } }) => React.ReactNode;
}

export const getUserColumns = (): Column<UserProfile>[] => {
    
    return [
        {
            accessorKey: "email",
            header: "Correo Electrónico",
            cell: ({ row }) => {
                const { user } = useFirebase();
                const isCurrentUser = user?.uid === row.original.id;
                return (
                    <div className="font-medium">
                        {row.original.email}
                        {isCurrentUser && <span className="text-muted-foreground text-xs ml-2">(Tú)</span>}
                    </div>
                )
            },
        },
        {
            accessorKey: "role",
            header: "Rol",
            cell: ({ row }) => {
                const { user } = useFirebase();
                const isCurrentUser = user?.uid === row.original.id;
                
                return (
                    <UserRoleSwitcher
                        targetUserId={row.original.id}
                        currentRole={row.original.role}
                        disabled={isCurrentUser}
                    />
                );
            },
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                 const { user } = useFirebase();
                const isCurrentUser = user?.uid === row.original.id;
                return (
                    <UserStatusSwitcher
                        targetUserId={row.original.id}
                        currentStatus={row.original.status}
                        disabled={isCurrentUser}
                    />
                )
            }
        },
        {
            accessorKey: "createdAt",
            header: "Fecha de Registro",
            cell: ({ row }) => <ClientFormattedDate dateString={row.original.createdAt} />,
        },
        {
            accessorKey: "actions",
            header: "Acciones",
            cell: ({row}) => {
                const { user, role } = useFirebase();
                const profile = row.original;
                const isCurrentUser = user?.uid === profile.id;

                if (isCurrentUser || role !== 'Admin') return null;

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
                            <DeleteElementDialog
                                item={{
                                    id: profile.id, 
                                    name: `usuario ${profile.email}`, 
                                    tipo: 'User' as any
                                }}
                                collectionName={`users`}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]
};
