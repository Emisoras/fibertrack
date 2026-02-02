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
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { MuflaSplice, Fiber } from '@/lib/types';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const spliceSchema = z.object({
  trayNumber: z.coerce.number().min(1, 'La bandeja es requerida.'),
  spliceNumber: z.coerce.number().min(1, 'El número de empalme es requerido.'),
  inFiberId: z.string().min(1, 'La fibra entrante es requerida.'),
  inFiberThread: z.coerce.number().min(1, 'El hilo entrante es requerido.'),
  outFiberId: z.string().min(1, 'La fibra saliente es requerida.'),
  outFiberThread: z.coerce.number().min(1, 'El hilo saliente es requerido.'),
  notes: z.string().optional(),
});

type EditCajaNapSpliceDialogProps = {
  splice: MuflaSplice;
  fibers: Fiber[];
  cajaNapId: string;
};

export function EditCajaNapSpliceDialog({ splice, fibers, cajaNapId }: EditCajaNapSpliceDialogProps) {
    const [open, setOpen] = useState(false);
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof spliceSchema>>({
        resolver: zodResolver(spliceSchema),
    });

    useEffect(() => {
        if (splice) {
            form.reset({
                trayNumber: splice.trayNumber,
                spliceNumber: splice.spliceNumber,
                inFiberId: splice.inFiberId,
                inFiberThread: splice.inFiberThread,
                outFiberId: splice.outFiberId,
                outFiberThread: splice.outFiberThread,
                notes: splice.notes || '',
            });
        }
    }, [splice, form]);

    function onSubmit(values: z.infer<typeof spliceSchema>) {
        if (!firestore) return;
        const docRef = doc(firestore, 'cajas_nap', cajaNapId, 'splices', splice.id);
        
        updateDocumentNonBlocking(docRef, values);

        toast({
            title: "Empalme actualizado",
            description: `El empalme ha sido actualizado.`,
        });
        setOpen(false);
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
        if (inFiberId !== splice.inFiberId) {
            form.setValue('inFiberThread', 0);
        }
    }, [inFiberId, form, splice.inFiberId]);

    useEffect(() => {
        if (outFiberId !== splice.outFiberId) {
            form.setValue('outFiberThread', 0);
        }
    }, [outFiberId, form, splice.outFiberId]);


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Editar
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Editar Empalme</DialogTitle>
                    <DialogDescription>
                        Modifica la conexión entre dos hilos de fibra.
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
                                    <Input type="number" {...field} />
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
                                    <Input type="number" {...field} />
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Button type="submit">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
