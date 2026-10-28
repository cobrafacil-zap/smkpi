"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, MobileDrawer } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

/** Rotas de conta (login/cadastro/recuperação) ficam fora do shell do app. */
const AUTH_ROUTES = ["/entrar", "/criar-conta", "/esqueci-senha", "/redefinir-senha"];

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  if (AUTH_ROUTES.some((r) => pathname?.startsWith(r))) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[264px]">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-14 lg:pt-7">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
