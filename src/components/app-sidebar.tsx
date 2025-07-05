"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { Image as ImageIcon, LayoutDashboard, Settings, Bot, Users } from "lucide-react";

const menuItems = [
  { href: "/", label: "Edición de imagen", icon: ImageIcon },
  { href: "/seccion/2", label: "Sección 2", icon: LayoutDashboard },
  { href: "/seccion/3", label: "Sección 3", icon: Bot },
  { href: "/seccion/4", label: "Sección 4", icon: Users },
  { href: "/seccion/5", label: "Sección 5", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-between">
          <h1 className="font-headline text-2xl font-bold text-primary">App Pro</h1>
          <SidebarTrigger className="md:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
