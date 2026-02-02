'use client';

import { Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, signOutUser } from '@/firebase';

export function UserProfileButton() {
  const { user, role } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    signOutUser(auth);
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
          <Avatar className="h-8 w-8">
            {/* The user object from Firebase Auth doesn't have an image by default with email/password */}
            <AvatarImage src={undefined} alt={user?.email || 'Usuario'} />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="text-left truncate">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.displayName || user?.email || 'Usuario'}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {role || 'Cargando rol...'}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
