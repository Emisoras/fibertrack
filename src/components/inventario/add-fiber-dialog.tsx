'use client';

import { useState } from 'react';
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
import { PlusCircle } from 'lucide-react';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/lib/types';

const fiberSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  origin: z.string().min(1, 'El origen es requerido.'),
  destination: z.string().min(1, 'El destino es requerido.'),
  distance: z.coerce.number().min(1, 'La distancia debe ser mayor a 0.'),
  threadCount: z.string().min(1, 'La cantidad de hilos es requerida.'),
  type: z.string().min(1, 'El tipo es requerido.'),
});

type AddFiberDialogProps = {
  allElements: InventoryItem[];
};

export function AddFiberDialog({ allElements }: AddFiberDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof fiberSchema>>({
    resolver: zodResolver(fiberSchema),
    defaultValues: {
      name: '',
      origin: '',
      destination: '',
      distance: 0,
      threadCount: '12',
      type: 'secundaria',
    },
  });

  async function onSubmit(values: z.infer<typeof fiberSchema>) {
    if (!firestore) return;

    const [originType, originId] = values.origin.split('__');
    const [destinationType, destinationId] = values.destination.split('__');

    const newFiber = {
      name: values.name,
      originId,
      originType,
      destinationId,
      destinationType,
      distance: values.distance,
      threadCount: parseInt(values.threadCount, 10),
      type: values.type,
      estado: 'Activo',
      fechaCreacion: new Date().toISOString(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'fibers'), newFiber);
      toast({
        title: 'Tramo de fibra añadido',
        description: `El tramo "${values.name}" ha sido añadido a la red.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo añadir el tramo de fibra.',
      });
    }
  }

  const elementOptions = allElements.map((el) => ({
    value: `${el.tipo}__${el.id}`,
    label: `[${el.tipo}] ${el.name}`,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Fibra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Tramo de Fibra</DialogTitle>
          <DialogDescription>
            Completa la información del nuevo segmento de fibra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Tramo</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Troncal Principal Centro" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar origen..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {elementOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar destino..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {elementOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
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
                    <Input type="number" placeholder="ej. 1500" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar hilos..." />
                      </SelectTrigger>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
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
            <DialogFooter>
              <Button type="submit">Guardar Tramo</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    