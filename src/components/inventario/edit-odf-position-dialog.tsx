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
import { Input } from '@/components/ui/input';
import { Edit } from 'lucide-react';
import {
  useFirebase,
  updateDocumentNonBlocking,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { OdfPosition, Mufla, CajaNap, Fiber } from '@/lib/types';

const positionSchema = z.object({
  serviceName: z.string().optional(),
  status: z.nativeEnum(['Libre', 'Ocupado', 'Reservado', 'Dañado']),
  destination: z.string().optional(),
  fiberTrunkId: z.string().optional(),
  fiberThreadNumber: z.string().optional(),
});

type EditOdfPositionDialogProps = {
  position: OdfPosition;
  odfId: string;
};

export function EditOdfPositionDialog({ position, odfId }: EditOdfPositionDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const muflasRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'muflas') : null),
    [firestore]
  );
  const { data: muflas } = useCollection<Mufla>(muflasRef);

  const cajasNapRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'cajas_nap') : null),
    [firestore]
  );
  const { data: cajasNap } = useCollection<CajaNap>(cajasNapRef);

  const fibersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'fibers') : null),
    [firestore]
  );
  const { data: fibers } = useCollection<Fiber>(fibersRef);

  const possibleDestinations = useMemo(() => {
    const m =
      muflas?.map((item) => ({
        value: item.id,
        label: `[Mufa] ${item.name || (item as any).nombre}`,
      })) || [];
    const c =
      cajasNap?.map((item) => ({
        value: item.id,
        label: `[Caja NAP] ${item.name || (item as any).nombre}`,
      })) || [];
    return [...m, ...c];
  }, [muflas, cajasNap]);

  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
  });

  useEffect(() => {
    if (position) {
      form.reset({
        serviceName: position.serviceName || '',
        status: position.status || 'Libre',
        destination: position.destination || '',
        fiberTrunkId: position.fiberTrunkId || '',
        fiberThreadNumber: position.fiberThreadNumber ? String(position.fiberThreadNumber) : '',
      });
    }
  }, [position, form]);

  
  const serviceName = form.watch('serviceName');
  const destination = form.watch('destination');
  const fiberThreadNumber = form.watch('fiberThreadNumber');

  useEffect(() => {
    const currentStatus = form.getValues('status');
    // Automatically update status between 'Libre' and 'Ocupado'
    // if the user hasn't manually set it to 'Reservado' or 'Dañado'.
    if (currentStatus === 'Libre' || currentStatus === 'Ocupado') {
      const isOcupado = !!(serviceName || destination || fiberThreadNumber);
      form.setValue('status', isOcupado ? 'Ocupado' : 'Libre', { shouldDirty: true });
    }
  }, [serviceName, destination, fiberThreadNumber, form]);


  const selectedFiberTrunkId = form.watch('fiberTrunkId');

  const threadsForSelectedFiber = useMemo(() => {
    if (!selectedFiberTrunkId || !fibers) {
      return [];
    }
    const selectedFiber = fibers.find((f) => f.id === selectedFiberTrunkId);
    return selectedFiber ? Array.from({ length: selectedFiber.threadCount }, (_, i) => i + 1) : [];
  }, [selectedFiberTrunkId, fibers]);

  useEffect(() => {
    if (selectedFiberTrunkId) {
        const currentThread = form.getValues('fiberThreadNumber');
        if (currentThread) {
            const selectedFiber = fibers?.find(f => f.id === selectedFiberTrunkId);
            if (selectedFiber && parseInt(currentThread, 10) > selectedFiber.threadCount) {
                form.setValue('fiberThreadNumber', '');
            }
        }
    }
  }, [selectedFiberTrunkId, fibers, form]);

  function onSubmit(values: z.infer<typeof positionSchema>) {
    if (!firestore) return;

    const positionRef = doc(firestore, 'odfs', odfId, 'positions', position.id);
    
    const destinationLabel =
      possibleDestinations.find((d) => d.value === values.destination)?.label ||
      values.destination;

    const fiberTrunkId = values.fiberTrunkId || '';
    const fiberThreadNumberValue = values.fiberThreadNumber ? parseInt(values.fiberThreadNumber, 10) : undefined;
    const selectedFiber = fibers?.find(f => f.id === fiberTrunkId);
    const fiberId = selectedFiber && fiberThreadNumberValue ? `${selectedFiber.name}-H${fiberThreadNumberValue}` : '';

    const updatedData = {
      serviceName: values.serviceName || '',
      destination: values.destination || '',
      destinationLabel: destinationLabel || '',
      fiberTrunkId,
      fiberThreadNumber: fiberThreadNumberValue,
      fiberId,
      status: values.status,
    };

    updateDocumentNonBlocking(positionRef, updatedData);

    toast({
      title: 'Posición actualizada',
      description: `La posición ${position.positionNumber} ha sido actualizada.`,
    });

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Edit className="mr-2 h-3 w-3" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Posición {position.positionNumber}</DialogTitle>
          <DialogDescription>
            Asigna un servicio, destino y fibra a esta posición.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6"
          >
            <FormField
              control={form.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Servicio</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Cliente Corp. XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado del Puerto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un estado..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Libre">Libre</SelectItem>
                      <SelectItem value="Ocupado">Ocupado (En Servicio)</SelectItem>
                      <SelectItem value="Reservado">Reservado</SelectItem>
                      <SelectItem value="Dañado">Dañado</SelectItem>
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
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un destino..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {possibleDestinations.map((dest) => (
                        <SelectItem key={dest.value} value={dest.value}>
                          {dest.label}
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
              name="fiberTrunkId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tramo de Fibra</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? '' : value);
                      form.setValue('fiberThreadNumber', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un tramo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {fibers?.map((fiber) => (
                        <SelectItem key={fiber.id} value={fiber.id}>
                          {fiber.name}
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
              name="fiberThreadNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hilo de Fibra</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value}
                    disabled={!selectedFiberTrunkId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un hilo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {threadsForSelectedFiber.map((thread) => (
                        <SelectItem key={thread} value={String(thread)}>
                          Hilo {thread}
                        </SelectItem>
                      ))}
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
