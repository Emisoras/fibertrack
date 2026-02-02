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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Fiber, InventoryItem } from '@/lib/types';

const fiberSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  origin: z.string().min(1, 'El origen es requerido.'),
  destination: z.string().min(1, 'El destino es requerido.'),
  distance: z.coerce.number().min(1, 'La distancia debe ser mayor a 0.'),
  threadCount: z.string().min(1, 'La cantidad de hilos es requerida.'),
  type: z.string().min(1, 'El tipo es requerido.'),
  estado: z.string().min(1, 'El estado es requerido.'),
});

type EditFiberDialogProps = {
  fiber: Fiber;
  allElements: InventoryItem[];
  children: React.ReactNode;
};

export function EditFiberDialog({ fiber, allElements, children }: EditFiberDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof fiberSchema>>({
    resolver: zodResolver(fiberSchema),
  });

  useEffect(() => {
    if (fiber) {
        form.reset({
            name: fiber.name,
            origin: `${fiber.originType}__${fiber.originId}`,
            destination: `${fiber.destinationType}__${fiber.destinationId}`,
            distance: fiber.distance,
            threadCount: fiber.threadCount.toString(),
            type: fiber.type,
            estado: fiber.estado,
        });
    }
  }, [fiber, form]);

  function onSubmit(values: z.infer<typeof fiberSchema>) {
    if (!firestore || !user) return;

    if (fiber.estado !== values.estado) {
        const logData = {
            timestamp: new Date().toISOString(),
            user: user.email || user.uid,
            action: 'UPDATE_STATUS',
            elementId: fiber.id,
            elementName: values.name,
            elementType: 'Fiber',
            details: `Estado de la fibra cambiado de '${fiber.estado}' a '${values.estado}'.`
        };
        addDocumentNonBlocking(collection(firestore, 'logs'), logData);
    }

    const [originType, originId] = values.origin.split('__');
    const [destinationType, destinationId] = values.destination.split('__');

    const updatedFiber = {
      name: values.name,
      originId,
      originType,
      destinationId,
      destinationType,
      distance: values.distance,
      threadCount: parseInt(values.threadCount, 10),
      type: values.type,
      estado: values.estado,
    };
    
    const docRef = doc(firestore, 'fibers', fiber.id);
    updateDocumentNonBlocking(docRef, updatedFiber);

    toast({
      title: 'Tramo de fibra actualizado',
      description: `El tramo "${values.name}" ha sido actualizado.`,
    });
    setOpen(false);
  }
  
  const elementOptions = allElements.map((el) => ({
    value: `${el.tipo}__${el.id}`,
    label: `[${el.tipo}] ${(el as any).name || (el as any).nombre}`,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Tramo de Fibra</DialogTitle>
          <DialogDescription>
            Actualiza la información del segmento de fibra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Tramo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {elementOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {elementOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distancia (metros)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="threadCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de Hilos</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[12, 24, 48, 96, 144, 288].map(hilo => (
                        <SelectItem key={hilo} value={hilo.toString()}>{hilo} Hilos</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Fibra</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="troncal">Troncal</SelectItem>
                        <SelectItem value="secundaria">Secundaria</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
