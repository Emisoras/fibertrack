'use client';

import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useUser, useAuth, signOutUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();
  const { user, isUserLoading, isRoleLoading, status } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isRoleLoading) {
      if (!user) {
        router.replace('/login');
      } else if (status === 'Inactivo') {
        // Sign out the user and redirect to login with a reason
        signOutUser(auth);
        router.replace('/login?reason=inactive');
      }
    }
  }, [user, isUserLoading, isRoleLoading, status, router, auth]);

  // Keep showing loader until user is verified and active
  if (isUserLoading || isRoleLoading || !user || status !== 'Activo') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
      <SidebarProvider>
        <AppSidebar />
        <div className="peer-data-[state=collapsed]:peer-data-[collapsible=icon]:pl-12 peer-data-[state=expanded]:peer-data-[collapsible=icon]:pl-[16rem] transition-all duration-200 ease-linear flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
          <footer className="p-4 text-center text-xs text-muted-foreground border-t">
            Copyright &copy; {currentYear}. Todos los derechos reservados. Diseñado por C &amp; J Soluciones en Ingeniería.
          </footer>
        </div>
      </SidebarProvider>
  );
}
