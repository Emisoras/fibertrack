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
import { useFirebase } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { MuflaSplice, Fiber, Splitter } from '@/lib/types';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

const spliceSchema = z.object({
  trayNumber: z.coerce.number().min(1, 'La bandeja es requerida.'),
  spliceNumber: z.coerce.number().min(1, 'El número de empalme es requerido.'),
  inFiberId: z.string().min(1, 'La fibra entrante es requerida.'),
  inFiberThread: z.coerce.number().min(1, 'El hilo entrante es requerido.'),
  notes: z.string().optional(),
  destinationType: z.enum(['fiber', 'splitter']),
  outFiberId: z.string().optional(),
  outFiberThread: z.coerce.number().optional(),
  destinationSplitterId: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.destinationType === 'fiber') {
        if (!data.outFiberId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fibra saliente es requerida.", path: ['outFiberId'] });
        }
        if (!data.outFiberThread) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El hilo saliente es requerido.", path: ['outFiberThread'] });
        }
    } else if (data.destinationType === 'splitter') {
        if (!data.destinationSplitterId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El splitter de destino es requerido.", path: ['destinationSplitterId'] });
        }
    }
});

type EditMuflaSpliceDialogProps = {
  splice: MuflaSplice;
  fibers: Fiber[];
  muflaId: string;
  splitters: Splitter[];
};

export function EditMuflaSpliceDialog({ splice, fibers, muflaId, splitters }: EditMuflaSpliceDialogProps) {
    const [open, setOpen] = useState(false);
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof spliceSchema>>({
        resolver: zodResolver(spliceSchema),
    });

    useEffect(() => {
        if (splice) {
            const isSplitterDest = splitters.some(s => s.id === splice.outFiberId);
            const destType = isSplitterDest ? 'splitter' : 'fiber';
            
            form.reset({
                trayNumber: splice.trayNumber,
                spliceNumber: splice.spliceNumber,
                inFiberId: splice.inFiberId,
                inFiberThread: splice.inFiberThread,
                notes: splice.notes?.split('Conectado a la entrada del splitter:')[0].trim() || splice.notes,
                destinationType: destType,
                outFiberId: destType === 'fiber' ? splice.outFiberId : undefined,
                outFiberThread: destType === 'fiber' ? splice.outFiberThread : undefined,
                destinationSplitterId: destType === 'splitter' ? splice.outFiberId : undefined,
            });
        }
    }, [splice, form, splitters]);

    async function onSubmit(values: z.infer<typeof spliceSchema>) {
        if (!firestore) return;
        
        const batch = writeBatch(firestore);
        const spliceRef = doc(firestore, 'muflas', muflaId, 'splices', splice.id);

        const spliceData: any = {
            trayNumber: values.trayNumber,
            spliceNumber: values.spliceNumber,
            inFiberId: values.inFiberId,
            inFiberThread: values.inFiberThread,
        };

        // If the original destination was a splitter, we need to clear its input first
        const isOriginalDestSplitter = splitters.some(s => s.id === splice.outFiberId);
        if (isOriginalDestSplitter && (values.destinationType !== 'splitter' || values.destinationSplitterId !== splice.outFiberId)) {
            const originalSplitterRef = doc(firestore, 'splitters', splice.outFiberId);
            batch.update(originalSplitterRef, { inFiberId: null, inFiberThread: null });
        }


        if (values.destinationType === 'fiber') {
            spliceData.outFiberId = values.outFiberId;
            spliceData.outFiberThread = values.outFiberThread;
            spliceData.notes = values.notes;
        } else { // destination is splitter
            const splitterId = values.destinationSplitterId!;
            const splitter = splitters.find(s => s.id === splitterId);
            
            spliceData.outFiberId = splitterId;
            spliceData.outFiberThread = 1; // Convention for splitter input
            spliceData.notes = `${values.notes || ''} 
Conectado a la entrada del splitter: ${splitter?.name}`.trim();

            const splitterRef = doc(firestore, 'splitters', splitterId);
            batch.update(splitterRef, {
                inFiberId: values.inFiberId,
                inFiberThread: values.inFiberThread
            });
        }
        
        batch.update(spliceRef, spliceData);

        try {
            await batch.commit();
            toast({
                title: "Empalme actualizado",
                description: `El empalme ha sido actualizado.`,
            });
            setOpen(false);
        } catch (error) {
            console.error("Error updating splice: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar el empalme.",
            });
        }
    }
    
    const inFiberId = form.watch('inFiberId');
    const outFiberId = form.watch('outFiberId');
    const destinationType = form.watch('destinationType');

    const inThreads = useMemo(() => {
        const selectedFiber = fibers.find(f => f.id === inFiberId);
        return selectedFiber ? Array.from({ length: selectedFiber.threadCount }, (_, i) => i + 1) : [];
    }, [inFiberId, fibers]);

    const outThreads = useMemo(() => {
        const selectedFiber = fibers.find(f => f.id === outFiberId);
        return selectedFiber ? Array.from({ length: selectedFiber.threadCount }, (_, i) => i + 1) : [];
    }, [outFiberId, fibers]);

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
                            <h4 className="font-medium text-center">Destino del Empalme</h4>
                            <FormField
                                control={form.control}
                                name="destinationType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex space-x-4"
                                        >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="fiber" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Fibra</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="splitter" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Splitter</FormLabel>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {destinationType === 'fiber' && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="outFiberId"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Tramo de Fibra Saliente</FormLabel>
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
                                            <FormLabel>Hilo Saliente</FormLabel>
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
                                </>
                            )}
                            {destinationType === 'splitter' && (
                                <FormField
                                    control={form.control}
                                    name="destinationSplitterId"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Splitter de Destino</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar splitter..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            {splitters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
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