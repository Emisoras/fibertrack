"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "./global-search";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import React, { useMemo } from "react";
import { NotificationsDisplay } from "./notifications-display";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
    const { firestore } = useFirebase();

    // This query is just to get the count for the badge.
    // The actual notifications are fetched inside NotificationsDisplay.
    const fiberCutsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'fibers'), where('estado', '==', 'Corte')) : null,
        [firestore]
    );

    const { data: fiberCuts } = useCollection(fiberCutsQuery);
    const notificationCount = useMemo(() => (fiberCuts?.length || 0), [fiberCuts]);

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <GlobalSearch />
      </div>
      <ThemeToggle />
      <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                        {notificationCount}
                    </span>
                )}
                <span className="sr-only">Ver notificaciones</span>
            </Button>
        </PopoverTrigger>
        <NotificationsDisplay />
      </Popover>
    </header>
  );
}
