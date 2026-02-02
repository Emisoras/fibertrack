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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import type { Mufla } from '@/lib/types';

const baseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  address: z.string().min(1, 'La dirección es requerida.'),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

const capacitySchema = baseSchema.extend({
  capacity: z.coerce.number().min(1, 'La capacidad debe ser mayor a 0.'),
});

const cajaNapSchema = capacitySchema.extend({
    functionType: z.string().min(1, "Debe seleccionar una función."),
});

const splitterSchema = baseSchema.extend({
  splittingRatio: z.string().min(1, "Debe seleccionar una relación de división"),
  muflaId: z.string().min(1, "Debe seleccionar una mufla de origen."),
});

const formSchemas: { [key: string]: z.ZodObject<any, any> } = {
  odf: capacitySchema,
  mufas: capacitySchema,
  'cajas-nap': cajaNapSchema,
  splitters: splitterSchema,
};

const tipoMapping: { [key: string]: string } = {
    odf: 'Odf',
    mufas: 'Mufla',
    'cajas-nap': 'CajaNap',
    splitters: 'Splitter'
}

type AddElementDialogProps = {
  elemento: string;
  collectionName: string;
};

export function AddElementDialog({ elemento, collectionName }: AddElementDialogProps) {
  const [open, setOpen] = useState(false);
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const isSplitter = elemento === 'splitters';
  const isCajaNap = elemento === 'cajas-nap';

  const mufasRef = useMemoFirebase(
    () => (firestore && isSplitter ? collection(firestore, 'muflas') : null),
    [firestore, isSplitter]
  );
  const { data: mufas } = useCollection<Mufla>(mufasRef);

  const formSchema = formSchemas[elemento];
  if (!formSchema) return null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      capacity: 0,
      latitude: 0,
      longitude: 0,
      splittingRatio: '1:8',
      muflaId: '',
      functionType: 'Terminal',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    const collectionRef = collection(firestore, collectionName);
    
    let capacity = 0;
    const newElement: any = {
        name: values.name,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        fechaCreacion: new Date().toISOString(),
        estado: 'Activo',
        tipo: tipoMapping[elemento],
        mapPosition: {
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
        }
    };

    if (isSplitter) {
        const splitterValues = values as z.infer<typeof splitterSchema>;
        capacity = parseInt(splitterValues.splittingRatio.split(':')[1], 10);
        newElement.splittingRatio = splitterValues.splittingRatio;
        newElement.capacity = capacity;
        newElement.muflaId = splitterValues.muflaId;
    } else if (isCajaNap) {
        const cajaNapValues = values as z.infer<typeof cajaNapSchema>;
        capacity = cajaNapValues.capacity;
        newElement.capacity = capacity;
        newElement.functionType = cajaNapValues.functionType;
    }
     else {
        const capacityValues = values as z.infer<typeof capacitySchema>;
        capacity = capacityValues.capacity;
        newElement.capacity = capacity;
    }

    try {
        const docRef = await addDocumentNonBlocking(collectionRef, newElement);

        const logData = {
            timestamp: new Date().toISOString(),
            user: user.email || user.uid,
            action: 'CREATE_ELEMENT',
            elementId: docRef.id,
            elementName: newElement.name,
            elementType: newElement.tipo,
            details: `Nuevo elemento '${newElement.name}' (${newElement.tipo}) creado.`
        };
        addDocumentNonBlocking(collection(firestore, 'logs'), logData);


        if (docRef && (collectionName === 'odfs' || collectionName === 'splitters' || collectionName === 'cajas_nap')) {
            const batch = writeBatch(firestore);
            
            if (collectionName === 'odfs') {
                const fiberColors = [
                    'Azul', 'Naranja', 'Verde', 'Marrón', 'Gris', 'Blanco',
                    'Rojo', 'Negro', 'Amarillo', 'Violeta', 'Rosa', 'Agua'
                ];
                const positionsCollectionRef = collection(firestore, 'odfs', docRef.id, 'positions');
                for (let i = 0; i < capacity; i++) {
                    const positionDocRef = doc(positionsCollectionRef);
                    batch.set(positionDocRef, {
                        positionNumber: i + 1,
                        color: fiberColors[i % 12],
                        status: 'Libre'
                    });
                }
            } else if (collectionName === 'splitters') {
                const outputsCollectionRef = collection(firestore, 'splitters', docRef.id, 'outputs');
                for (let i = 0; i < capacity; i++) {
                    const outputDocRef = doc(outputsCollectionRef);
                    batch.set(outputDocRef, {
                        outputNumber: i + 1,
                        status: 'Libre'
                    });
                }
            } else if (collectionName === 'cajas_nap') {
                const portsCollectionRef = collection(firestore, 'cajas_nap', docRef.id, 'ports');
                 for (let i = 0; i < capacity; i++) {
                    const portDocRef = doc(portsCollectionRef);
                    batch.set(portDocRef, {
                        portNumber: i + 1,
                        status: 'Libre'
                    });
                }
            }
            await batch.commit();
        }

        toast({
            title: "Elemento añadido",
            description: `El elemento "${values.name}" ha sido añadido a la base de datos.`,
        });
        
        form.reset();
        setOpen(false);

    } catch (error) {
        console.error("Error adding document and sub-collections: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo añadir el elemento.",
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir {elemento.replace('-', ' ')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo {elemento.replace('-', ' ')}</DialogTitle>
          <DialogDescription>
            Completa la información para añadir un nuevo elemento a la red.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            
            {isSplitter ? (
                <>
                    <FormField
                        control={form.control}
                        name="splittingRatio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Relación de Divisón</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar relación..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1:8">1:8</SelectItem>
                                        <SelectItem value="1:16">1:16</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="muflaId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ubicado en Mufla</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar mufla..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {mufas?.map((mufla) => (
                                            <SelectItem key={mufla.id} value={mufla.id}>{mufla.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
            ) : (
                <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Capacidad</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder={isCajaNap ? "ej. 16" : "ej. 144"} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

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
              <Button type="submit">Guardar Elemento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
