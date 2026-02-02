'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

type ChartLayoutProps = {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    backHref: string;
}

export function ChartLayout({ children, title, subtitle, backHref }: ChartLayoutProps) {
    const handlePrint = () => {
        window.print();
    }
    return (
        <main className="p-4 sm:p-8 print:p-0">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Button asChild variant="ghost">
                        <Link href={backHref}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la página del elemento
                        </Link>
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir / Guardar PDF
                    </Button>
                </div>
                <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-8 print:shadow-none print:p-2 print:border-none print:rounded-none">
                    <div className="print-content">
                        <header className="text-center mb-10">
                            <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary">{title}</h1>
                            <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
                        </header>
                        {children}
                         <footer className="text-center mt-10 pt-4 border-t print:block hidden">
                            <p className="text-xs text-muted-foreground">Reporte generado por FiberTrack</p>
                        </footer>
                    </div>
                </div>
            </div>
        </main>
    )
}
