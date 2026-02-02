'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirebase, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem } from '@/lib/types';
import { DropdownMenuItem } from '../ui/dropdown-menu';
import { deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type DeleteElementDialogProps = {
  item: InventoryItem;
  collectionName: string;
};

export function DeleteElementDialog({ item, collectionName }: DeleteElementDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const itemName = (item as any).name || (item as any).nombre;


  function handleDelete() {
    if (!firestore || !collectionName || !user) return;

    // First, close the dialog to let the exit animation complete.
    setOpen(false);

    // Use a short timeout to ensure the dialog has time to unmount
    // before the Firestore update triggers a re-render of the parent component.
    // This prevents the "stuck overlay" issue.
    setTimeout(() => {
      const docRef = doc(firestore, collectionName, item.id);
      
      const logData = {
        timestamp: new Date().toISOString(),
        user: user.email || user.uid,
        action: 'DELETE_ELEMENT',
        elementId: item.id,
        elementName: itemName,
        elementType: item.tipo,
        details: `Elemento '${itemName}' (${item.tipo}) fue eliminado.`
      };
      addDocumentNonBlocking(collection(firestore, 'logs'), logData);

      // Note: This does not delete subcollections like 'positions' for ODFs on the client.
      // That requires a more complex setup, like a Firebase Cloud Function, to do reliably.
      deleteDocumentNonBlocking(docRef);

      toast({
          title: "Elemento eliminado",
          description: `El elemento "${itemName}" ha sido eliminado.`,
      });
    }, 200); // 200ms should be safe for most animations
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-red-500"
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          Eliminar
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento "{itemName}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sí, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
