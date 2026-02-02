import { Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <LoaderCircle className="h-10 w-10 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
