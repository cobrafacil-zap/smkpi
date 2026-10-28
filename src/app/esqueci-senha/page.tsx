"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck, Send } from "lucide-react";
import { AuthHeader, AuthMessage, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useStore } from "@/lib/data/store";

export default function EsqueciSenhaPage() {
  const { resetPassword } = useStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe o e-mail da sua conta.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPassword(email.trim());
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell>
      <AuthHeader
        title="Recuperar minha senha"
        subtitle="Informe seu e-mail e enviamos um link para você criar uma nova senha."
      />

      {sent ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-iris-soft text-iris-dark">
            <MailCheck className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold text-ink">
            Confira seu e-mail
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-faint">
            Se existir uma conta com <strong className="text-ink">{email}</strong>, você
            receberá um link para redefinir a senha. O link expira em algumas horas.
          </p>
          <div className="mt-5 rounded-xl border border-dashed border-line px-4 py-3 text-left">
            <p className="text-[12px] font-semibold text-ink-soft">Não chegou?</p>
            <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-ink-faint">
              <li>• Verifique a caixa de spam / lixo eletrônico.</li>
              <li>• Confirme se digitou o e-mail certo.</li>
              <li>• Peça um novo link abaixo.</li>
            </ul>
          </div>
          <Button
            variant="outline"
            fullWidth
            className="mt-4"
            onClick={() => {
              setSent(false);
            }}
          >
            Enviar outro link
          </Button>
          <Link href="/entrar" className="mt-4 inline-block text-[13px] font-semibold text-iris hover:underline">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

          <Field label="E-mail da conta" htmlFor="forgot-email">
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </Field>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            leadingIcon={<Send className="h-4 w-4" />}
          >
            Enviar link de recuperação
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-[13px] text-ink-faint">
        Lembrou a senha?{" "}
        <Link href="/entrar" className="font-semibold text-iris hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
