
'use client';
import { doc } from 'firebase/firestore';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/lib/types';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type UserStatusSwitcherProps = {
    targetUserId: string;
    currentStatus: UserProfile['status'];
    disabled?: boolean;
};

export function UserStatusSwitcher({ targetUserId, currentStatus, disabled = false }: UserStatusSwitcherProps) {
    const { firestore, role } = useFirebase();
    const { toast } = useToast();

    const handleStatusChange = (newStatus: UserProfile['status']) => {
        if (!firestore || disabled || role !== 'Admin') return;

        const userRef = doc(firestore, 'users', targetUserId);
        updateDocumentNonBlocking(userRef, { status: newStatus });

        toast({
            title: "Estado actualizado",
            description: `El estado del usuario ha sido cambiado a ${newStatus}.`,
        });
    };
    
    if (role !== 'Admin' || disabled) {
        return (
             <Badge 
                variant={currentStatus === 'Activo' ? 'default' : 'destructive'}
                className={cn(currentStatus === 'Activo' && 'bg-green-600 text-white')}
             >
                {currentStatus}
            </Badge>
        );
    }
    
    return (
        <Select onValueChange={handleStatusChange} value={currentStatus} disabled={disabled}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
        </Select>
    );
}
