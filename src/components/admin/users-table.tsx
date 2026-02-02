
'use client';
import { DataTable } from '@/components/inventario/data-table';
import { UserProfile } from '@/lib/types';
import { useMemo } from 'react';
import { getUserColumns } from './user-columns';

type UsersTableProps = {
    users: UserProfile[];
    isLoading: boolean;
};

export function UsersTable({ users, isLoading }: UsersTableProps) {
    const columns = useMemo(() => getUserColumns(), []);
    
    return <DataTable columns={columns} data={users} isLoading={isLoading} />;
}
