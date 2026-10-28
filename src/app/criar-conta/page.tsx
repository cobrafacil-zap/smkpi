"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { AuthHeader, AuthMessage, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";

export default function CriarContaPage() {
  const router = useRouter();
  const { signUp, updateSettings } = useStore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa de pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signUp(email.trim(), password, name.trim() || undefined);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (name.trim()) updateSettings({ displayName: name.trim() });
    setDone(true);
    toast("Conta criada! 🎉");
    setTimeout(() => router.push("/"), 1200);
  };

  if (done) {
    return (
      <AuthShell>
        <div className="py-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-jade-soft text-jade-dark">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Conta criada!</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-faint">
            Sua conta está ativa e seus dados já começaram a ser salvos na nuvem.
          </p>
          <Link href="/">
            <Button className="mt-5" fullWidth>
              Começar agora
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader
        title="Criar sua conta"
        subtitle="Leva menos de um minuto. Seus dados ficam salvos com segurança na nuvem."
      />

      <form onSubmit={submit} className="space-y-4">
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <Field label="Seu nome" optional htmlFor="signup-name">
          <Input
            id="signup-name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como quer ser chamado(a)"
          />
        </Field>

        <Field label="E-mail" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </Field>

        <Field
          label="Senha"
          htmlFor="signup-password"
          hint="mínimo 6 caracteres"
        >
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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

        <Field label="Confirmar senha" htmlFor="signup-confirm">
          <Input
            id="signup-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          leadingIcon={<UserPlus className="h-4 w-4" />}
        >
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-faint">
        Já tem uma conta?{" "}
        <Link href="/entrar" className="font-semibold text-iris hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
