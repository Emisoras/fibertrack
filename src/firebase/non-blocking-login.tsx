'use client';
import {
  Auth, // Import Auth type for type hinting
  signOut,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    toast({
      variant: 'destructive',
      title: 'Error de inicio de sesión anónimo',
      description: 'No se pudo iniciar sesión anónimamente.',
    });
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(
    (error) => {
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
          message =
            `Ocurrió un error inesperado. Por favor, inténtalo de nuevo. (${error.code})`;
      }
      toast({
        variant: 'destructive',
        title: 'Error de registro',
        description: message,
      });
    }
  );
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string
): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    let message = 'Ocurrió un error al iniciar sesión.';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'El correo electrónico o la contraseña son incorrectos.';
        break;
      case 'auth/invalid-email':
        message = 'El formato del correo electrónico no es válido.';
        break;
      case 'auth/user-disabled':
        message = 'Esta cuenta de usuario ha sido desactivada.';
        break;
      default:
        message = `Ocurrió un error inesperado. Por favor, inténtalo de nuevo. (${error.code})`;
    }
    toast({
      variant: 'destructive',
      title: 'Error de inicio de sesión',
      description: message,
    });
  });
}

/** Signs out the current user (non-blocking). */
export function signOutUser(authInstance: Auth): void {
  signOut(authInstance);
}
