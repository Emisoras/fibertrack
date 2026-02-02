
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  HardDrive,
  Network,
  Box,
  Spline,
  Waypoints,
  FileText,
  GitBranch,
  Split,
  ClipboardList,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useUser } from "@/firebase";

const UserProfileButton = dynamic(
  () => import("./user-profile-button").then((mod) => mod.UserProfileButton),
  { ssr: false }
);

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    label: "Inventario",
    icon: HardDrive,
    subItems: [
      { href: "/dashboard/inventario/odf", icon: Network, label: "ODFs" },
      {
        href: "/dashboard/inventario/cajas-nap",
        icon: Box,
        label: "Cajas NAP",
      },
      { href: "/dashboard/inventario/mufas", icon: Spline, label: "Muflas" },
      {
        href: "/dashboard/inventario/splitters",
        icon: Split,
        label: "Splitters",
      },
      {
        href: "/dashboard/inventario/fibras",
        icon: GitBranch,
        label: "Fibras",
      },
    ],
  },
  { href: "/dashboard/trazabilidad", icon: Waypoints, label: "Trazabilidad" },
  { href: "/dashboard/reportes", icon: FileText, label: "Reportes" },
  { href: "/dashboard/auditoria", icon: ClipboardList, label: "Auditoría" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { role } = useUser();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-3 p-2">
          <h1 className="font-headline text-2xl font-bold">
            <span className="text-sidebar-foreground">Fiber</span>
            <span className="text-cyan-400">Track</span>
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item, index) =>
            item.subItems ? (
              <SidebarGroup key={index}>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </SidebarGroupLabel>
                {item.subItems.map((subItem) => (
                  <SidebarMenuItem key={subItem.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(subItem.href)}
                      className="gap-2"
                    >
                      <Link href={subItem.href}>
                        <subItem.icon />
                        <span>{subItem.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarGroup>
            ) : (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  className="gap-2"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
           {role === 'Admin' && (
             <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Administración
                </SidebarGroupLabel>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/dashboard/admin/users')}
                    className="gap-2"
                  >
                    <Link href="/dashboard/admin/users">
                      <span>Gestionar Usuarios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <UserProfileButton />
      </SidebarFooter>
    </Sidebar>
  );
}
