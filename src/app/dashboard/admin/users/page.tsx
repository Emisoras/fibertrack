
'use client';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { UsersTable } from '@/components/admin/users-table';
import { UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageUsersPage() {
  const { firestore, role, isRoleLoading } = useFirebase();

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersCollection);

  if (isRoleLoading) {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (role !== 'Admin') {
    return (
      <div className="flex flex-col gap-8 items-center justify-center text-center mt-10">
        <ShieldOff className="h-16 w-16 text-destructive" />
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a esta sección. Contacta a un administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Usuarios</h1>
        <p className="text-muted-foreground">
          Asigna roles y administra los usuarios del sistema.
        </p>
      </div>
      <UsersTable users={users || []} isLoading={areUsersLoading} />
    </div>
  );
}
