'use client';

import { doc, collection } from 'firebase/firestore';
import { useFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Fiber } from '@/lib/types';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

type UpdateFiberStatusMenuItemProps = {
  fiber: Fiber;
  newStatus: 'Activo' | 'Inactivo' | 'Corte';
  children: React.ReactNode;
};

export function UpdateFiberStatusMenuItem({ fiber, newStatus, children }: UpdateFiberStatusMenuItemProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSelect = (event: Event) => {
    event.preventDefault();

    if (!firestore || fiber.estado === newStatus || !user) return;

    const docRef = doc(firestore, 'fibers', fiber.id);

    // Update the fiber document
    updateDocumentNonBlocking(docRef, { estado: newStatus });

    // Create a log entry for the status change
    const logData = {
      timestamp: new Date().toISOString(),
      user: user.email || user.uid,
      action: 'UPDATE_STATUS',
      elementId: fiber.id,
      elementName: fiber.name,
      elementType: 'Fiber',
      details: `Estado de la fibra cambiado de '${fiber.estado}' a '${newStatus}'.`
    };
    addDocumentNonBlocking(collection(firestore, 'logs'), logData);

    toast({
      title: 'Estado de la Fibra Actualizado',
      description: `El estado de "${fiber.name}" ahora es "${newStatus}".`,
    });
  };

  if (fiber.estado === newStatus) {
    return null; // Don't show the option if it's already in that state
  }

  return (
    <DropdownMenuItem onSelect={handleSelect}>
      {children}
    </DropdownMenuItem>
  );
}
