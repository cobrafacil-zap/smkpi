"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { AuthHeader, AuthMessage, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";

export default function EntrarPage() {
  const router = useRouter();
  const { signInWithPassword } = useStore();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signInWithPassword(email.trim(), password, remember);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    toast("Bem-vinda de volta! 👋");
    router.push("/");
  };

  return (
    <AuthShell>
      <AuthHeader
        title="Entrar no SMKPI"
        subtitle="Acompanhe suas metas, hábitos e evolução de onde estiver."
      />

      <form onSubmit={submit} className="space-y-4">
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <Field label="E-mail" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </Field>

        <Field label="Senha" htmlFor="login-password">
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-faint transition-colors hover:text-ink"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-line text-iris accent-[var(--iris)]"
            />
            Manter conectado
          </label>
          <Link
            href="/esqueci-senha"
            className="text-[13px] font-semibold text-iris hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          leadingIcon={<LogIn className="h-4 w-4" />}
        >
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-faint">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="font-semibold text-iris hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </AuthShell>
  );
}
