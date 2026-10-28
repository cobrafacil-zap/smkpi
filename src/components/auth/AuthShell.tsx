"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="surface-grid flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2.5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-iris-gradient text-white shadow-card">
          <span className="font-display text-lg font-bold">S</span>
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight text-ink">SMKPI</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Metas & progresso
          </p>
        </div>
      </Link>

      <div
        className={cn(
          "w-full rounded-card border border-line bg-surface p-6 shadow-float sm:p-8",
          wide ? "max-w-lg" : "max-w-md",
        )}
      >
        {children}
      </div>

      <p className="mt-6 text-[12px] text-ink-faint">
        Suas metas, hábitos e progresso salvos com segurança na nuvem.
      </p>
    </div>
  );
}

export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-faint">{subtitle}</p>
    </div>
  );
}

export function AuthMessage({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tones = {
    success: "border-jade/30 bg-jade-soft text-jade-dark",
    error: "border-rose/30 bg-rose-soft text-rose-dark",
    info: "border-iris/30 bg-iris-soft text-iris-dark",
  };
  return (
    <p
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-[13px] font-medium leading-relaxed animate-fade-in",
        tones[tone],
      )}
    >
      {children}
    </p>
  );
}
