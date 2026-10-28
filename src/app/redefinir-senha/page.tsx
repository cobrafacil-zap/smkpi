"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { AuthHeader, AuthMessage, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { getSupabase } from "@/lib/data/backend";
import { useStore } from "@/lib/data/store";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { updatePassword } = useStore();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setChecking(false);
      return;
    }
    // o link de recuperação traz os tokens no hash da URL
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const result = await updatePassword(password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
    toast("Senha alterada! 🔐");
    setTimeout(() => router.push("/"), 1500);
  };

  if (checking) {
    return (
      <AuthShell>
        <div className="py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-iris" />
          <p className="mt-4 text-[13px] text-ink-faint">Verificando seu link de recuperação…</p>
        </div>
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell>
        <div className="py-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-soft text-rose-dark">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">
            Link inválido ou expirado
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-faint">
            Por segurança, os links de recuperação funcionam apenas uma vez e expiram após
            algumas horas. Peça um novo link.
          </p>
          <Link href="/esqueci-senha">
            <Button className="mt-5" fullWidth>
              Solicitar novo link
            </Button>
          </Link>
          <Link
            href="/entrar"
            className="mt-4 inline-block text-[13px] font-semibold text-iris hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div className="py-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-jade-soft text-jade-dark">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Senha alterada!</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-faint">
            Sua nova senha já está valendo. Levando você de volta ao painel…
          </p>
          <Link href="/">
            <Button className="mt-5" fullWidth>
              Ir para o painel
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader
        title="Criar nova senha"
        subtitle="Escolha uma senha forte que você consiga lembrar."
      />

      <form onSubmit={submit} className="space-y-4">
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <Field label="Nova senha" htmlFor="reset-password" hint="mínimo 6 caracteres">
          <div className="relative">
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
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

        <Field label="Confirmar nova senha" htmlFor="reset-confirm">
          <Input
            id="reset-confirm"
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
          leadingIcon={<KeyRound className="h-4 w-4" />}
        >
          Salvar nova senha
        </Button>
      </form>
    </AuthShell>
  );
}
