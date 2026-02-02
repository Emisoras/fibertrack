'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function SignupPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsSubmitting(true);
    createUserWithEmailAndPassword(auth, values.email, values.password)
      .then(() => {
        // The onAuthStateChanged listener in provider.tsx will create the user profile
        // with 'Inactivo' status, and then the dashboard layout will sign them out.
        // We just need to show the success message.
        setShowApprovalMessage(true);
      })
      .catch((error) => {
        let message = 'Ocurrió un error al registrar la cuenta.';
        switch (error.code) {
          case 'auth/email-already-in-use':
            message = 'Este correo electrónico ya está registrado.';
            break;
          case 'auth/invalid-email':
            message = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/weak-password':
            message = 'La contraseña es demasiado débil.';
            break;
          default:
            message = `Ocurrió un error inesperado. (${error.code})`;
        }
        toast({
          variant: 'destructive',
          title: 'Error de registro',
          description: message,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  useEffect(() => {
    // This redirect is for already-active users who land on the signup page.
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (showApprovalMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>¡Registro Exitoso!</CardTitle>
            <CardDescription>Tu cuenta está pendiente de aprobación.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Un administrador revisará tu solicitud. Podrás iniciar sesión cuando tu cuenta sea activada.
            </p>
            <Button asChild className="w-full mt-6">
              <Link href="/login">Volver a Inicio de Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
                <h1 className="font-headline text-3xl font-bold">
                    <span className="text-foreground">Fiber</span>
                    <span className="text-cyan-400">Track</span>
                </h1>
            </div>
          <CardTitle>Crear una Cuenta</CardTitle>
          <CardDescription>Regístrate para empezar a gestionar tu red.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Crear Cuenta
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
