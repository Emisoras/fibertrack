
'use client';
import { doc } from 'firebase/firestore';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/lib/types';

type UserRoleSwitcherProps = {
    targetUserId: string;
    currentRole: UserProfile['role'];
    disabled?: boolean;
};

export function UserRoleSwitcher({ targetUserId, currentRole, disabled = false }: UserRoleSwitcherProps) {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const handleRoleChange = (newRole: UserProfile['role']) => {
        if (!firestore || disabled) return;

        const userRef = doc(firestore, 'users', targetUserId);
        updateDocumentNonBlocking(userRef, { role: newRole });

        toast({
            title: "Rol actualizado",
            description: `El rol del usuario ha sido cambiado a ${newRole}.`,
        });
    };
    
    return (
        <Select onValueChange={handleRoleChange} value={currentRole} disabled={disabled}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
            </SelectContent>
        </Select>
    );
}
