'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Fiber } from '@/lib/types';

const spliceSchema = z.object({
  trayNumber: z.coerce.number().min(1, 'La bandeja es requerida.'),
  spliceNumber: z.coerce.number().min(1, 'El número de empalme es requerido.'),
  inFiberId: z.string().min(1, 'La fibra entrante es requerida.'),
  inFiberThread: z.coerce.number().min(1, 'El hilo entrante es requerido.'),
  outFiberId: z.string().min(1, 'La fibra saliente es requerida.'),
  outFiberThread: z.coerce.number().min(1, 'El hilo saliente es requerido.'),
  notes: z.string().optional(),
});

type AddCajaNapSpliceDialogProps = {
  fibers: Fiber[];
  cajaNapId: string;
};

export function AddCajaNapSpliceDialog({ fibers, cajaNapId }: AddCajaNapSpliceDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof spliceSchema>>({
    resolver: zodResolver(spliceSchema),
    defaultValues: {
      trayNumber: 1,
      spliceNumber: 1,
      notes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof spliceSchema>) {
    if (!firestore) return;

    const collectionRef = collection(firestore, 'cajas_nap', cajaNapId, 'splices');
    
    try {
        await addDocumentNonBlocking(collectionRef, values);
        toast({
            title: "Empalme añadido",
            description: `El empalme ha sido añadido a la caja NAP.`,
        });
        form.reset();
        setOpen(false);
    } catch (error) {
        console.error("Error adding splice: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo añadir el empalme.",
        });
    }
  }

  const inFiberId = form.watch('inFiberId');
  const outFiberId = form.watch('outFiberId');

  const inThreads = useMemo(() => {
    const selectedFiber = fibers.find(f => f.id === inFiberId);
    return selectedFiber ? Array.from({ length: selectedFiber.threadCount }, (_, i) => i + 1) : [];
  }, [inFiberId, fibers]);

  const outThreads = useMemo(() => {
    const selectedFiber = fibers.find(f => f.id === outFiberId);
    return selectedFiber ? Array.from({ length: selectedFiber.threadCount }, (_, i) => i + 1) : [];
  }, [outFiberId, fibers]);

  useEffect(() => {
    form.setValue('inFiberThread', 0);
  }, [inFiberId, form]);

  useEffect(() => {
    form.setValue('outFiberThread', 0);
  }, [outFiberId, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Empalme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Empalme</DialogTitle>
          <DialogDescription>
            Define la conexión entre dos hilos de fibra en la caja NAP.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="trayNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel># de Bandeja</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="ej. 1" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="spliceNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel># de Empalme</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="ej. 1" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-4 border-r pr-8">
                    <h4 className="font-medium text-center">Fibra Entrante</h4>
                    <FormField
                        control={form.control}
                        name="inFiberId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tramo de Fibra</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar tramo..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {fibers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="inFiberThread"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Hilo</FormLabel>
                             <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()} disabled={!inFiberId}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar hilo..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {inThreads.map(t => <SelectItem key={t} value={t.toString()}>Hilo {t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="space-y-4">
                    <h4 className="font-medium text-center">Fibra Saliente</h4>
                     <FormField
                        control={form.control}
                        name="outFiberId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tramo de Fibra</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar tramo..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {fibers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="outFiberThread"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Hilo</FormLabel>
                             <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()} disabled={!outFiberId}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar hilo..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {outThreads.map(t => <SelectItem key={t} value={t.toString()}>Hilo {t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anotaciones sobre el empalme..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Guardar Empalme</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
