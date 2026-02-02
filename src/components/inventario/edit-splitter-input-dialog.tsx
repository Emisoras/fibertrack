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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Splitter, Fiber } from '@/lib/types';

const inputSchema = z.object({
  inFiberId: z.string().optional(),
  inFiberThread: z.string().optional(), // Use string because select returns string
});

type EditSplitterInputDialogProps = {
  splitter: Splitter;
  fibers: Fiber[];
};

export function EditSplitterInputDialog({ splitter, fibers }: EditSplitterInputDialogProps) {
    const [open, setOpen] = useState(false);
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof inputSchema>>({
        resolver: zodResolver(inputSchema),
    });

    useEffect(() => {
        if (splitter) {
            form.reset({
                inFiberId: splitter.inFiberId || '',
                inFiberThread: splitter.inFiberThread ? String(splitter.inFiberThread) : '',
            });
        }
    }, [splitter, form]);

    function onSubmit(values: z.infer<typeof inputSchema>) {
        if (!firestore) return;
        
        const docRef = doc(firestore, 'splitters', splitter.id);
        
        const updateData = {
          inFiberId: values.inFiberId || '',
          inFiberThread: values.inFiberThread ? parseInt(values.inFiberThread, 10) : null,
        }

        updateDocumentNonBlocking(docRef, updateData);

        toast({
            title: "Entrada del splitter actualizada",
            description: `La entrada del splitter ${splitter.name} ha sido actualizada.`,
        });
        setOpen(false);
    }
    
    const inFiberId = form.watch('inFiberId');

    const inThreads = useMemo(() => {
        const selectedFiber = fibers.find(f => f.id === inFiberId);
        return selectedFiber ? Array.from({ length: selectedFiber.threadCount }, (_, i) => i + 1) : [];
    }, [inFiberId, fibers]);

    useEffect(() => {
        // Reset thread if fiber changes
        if (inFiberId !== splitter.inFiberId) {
            form.setValue('inFiberThread', '');
        }
    }, [inFiberId, form, splitter.inFiberId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Entrada
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Entrada del Splitter</DialogTitle>
                    <DialogDescription>
                        Selecciona el tramo de fibra y el hilo de entrada para este splitter.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="inFiberId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tramo de Fibra Entrante</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} value={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar tramo..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
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
                            <FormLabel>Hilo Entrante</FormLabel>
                             <Select onValueChange={(val) => field.onChange(val === 'none' ? '' : val)} value={field.value} disabled={!inFiberId}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar hilo..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {inThreads.map(t => <SelectItem key={t} value={t.toString()}>Hilo {t}</SelectItem>)}
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
