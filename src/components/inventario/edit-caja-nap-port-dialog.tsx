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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit } from 'lucide-react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { CajaNapPort } from '@/lib/types';

const portSchema = z.object({
  serviceName: z.string().optional(),
  status: z.nativeEnum(['Libre', 'Ocupado', 'Reservado', 'Dañado']),
  outputPower: z.coerce.number().optional(),
});

type EditCajaNapPortDialogProps = {
  port: CajaNapPort;
  cajaNapId: string;
};

export function EditCajaNapPortDialog({ port, cajaNapId }: EditCajaNapPortDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof portSchema>>({
    resolver: zodResolver(portSchema),
  });
  
  useEffect(() => {
    if (port) {
        form.reset({
            serviceName: port.serviceName || '',
            status: port.status || 'Libre',
            outputPower: port.outputPower,
        });
    }
  }, [port, form]);

  const serviceName = form.watch('serviceName');

  useEffect(() => {
    const currentStatus = form.getValues('status');
    if (currentStatus === 'Libre' || currentStatus === 'Ocupado') {
      const isOcupado = !!serviceName;
      form.setValue('status', isOcupado ? 'Ocupado' : 'Libre', { shouldDirty: true });
    }
  }, [serviceName, form]);

  function onSubmit(values: z.infer<typeof portSchema>) {
    if (!firestore) return;

    const portRef = doc(firestore, 'cajas_nap', cajaNapId, 'ports', port.id);

    const updatedData = {
      serviceName: values.serviceName || '',
      status: values.status,
      outputPower: values.outputPower && !isNaN(values.outputPower) ? values.outputPower : null,
      // Clear out old fields
      destination: '',
      destinationLabel: '',
      fiberId: '',
      fiberTrunkId: '',
      fiberThreadNumber: null,
    };

    updateDocumentNonBlocking(portRef, updatedData);

    toast({
      title: 'Puerto actualizado',
      description: `El puerto ${port.portNumber} ha sido actualizado.`,
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
          <DialogTitle>Editar Puerto {port.portNumber}</DialogTitle>
          <DialogDescription>
            Asigna un servicio, estado y potencia a este puerto de cliente.
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
                  <FormLabel>Nombre del Servicio / Cliente</FormLabel>
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
              name="outputPower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potencia de Salida (dBm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="ej. -21.5" {...field} value={field.value ?? ''} />
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

    