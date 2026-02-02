'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const elementSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  address: z.string().min(1, 'La dirección es requerida.'),
  capacity: z.coerce.number().min(1, 'La capacidad debe ser mayor a 0.'),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  estado: z.string().min(1, 'El estado es requerido.'),
  functionType: z.string().optional(),
});

type EditElementDialogProps = {
  item: InventoryItem;
  collectionName: string;
  children: React.ReactNode;
};

export function EditElementDialog({ item, collectionName, children }: EditElementDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const isCajaNap = item.tipo === 'CajaNap';

  const form = useForm<z.infer<typeof elementSchema>>({
    resolver: zodResolver(elementSchema),
  });

  useEffect(() => {
    if (item) {
        const compatibleItem: any = {
            ...item,
            name: (item as any).name || (item as any).nombre,
            address: (item as any).address || (item as any).ubicacion?.direccion,
            latitude: (item as any).latitude || (item as any).ubicacion?.lat,
            longitude: (item as any).longitude || (item as any).ubicacion?.lng,
            estado: (item as any).estado || 'Activo',
            functionType: (item as any).functionType || 'Terminal',
        }
        form.reset(compatibleItem);
    }
  }, [item, form]);


  function onSubmit(values: z.infer<typeof elementSchema>) {
    if (!firestore || !collectionName) return;

    const docRef = doc(firestore, collectionName, item.id);

    const updatedData: any = {
        name: values.name,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        estado: values.estado,
    };
    
    if (isCajaNap) {
      updatedData.functionType = values.functionType;
    }
    
    // Capacity remains non-editable through this dialog due to complex side-effects.
    updateDocumentNonBlocking(docRef, updatedData);

    toast({
        title: "Elemento actualizado",
        description: `El elemento "${values.name}" ha sido actualizado.`,
    });
    
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar {item.tipo}</DialogTitle>
          <DialogDescription>
            Actualiza la información del elemento de red.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. ODF Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Calle Falsa 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Corte">Corte</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isCajaNap && (
                <FormField
                    control={form.control}
                    name="functionType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Función de la Caja</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar función..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Terminal">Terminal (Cliente)</SelectItem>
                                    <SelectItem value="De Paso">De Paso (Empalme)</SelectItem>
                                    <SelectItem value="Terminal (Cliente) + De Paso">Terminal (Cliente) + De Paso</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad (solo lectura)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ej. 144" {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="ej. 4.60971" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="ej. -74.08175" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
