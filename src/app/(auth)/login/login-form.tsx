"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Fingerprint } from "lucide-react";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await signIn.email({ email, password });

    if (signInError) {
      // AU-002: mensaje de error genérico.
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // AU-006: si el usuario tiene 2FA, el cliente redirige a /login/2fa.
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handlePasskey() {
    setError(null);
    const res = await signIn.passkey();
    if (res?.error) {
      setError("No se pudo iniciar sesión con la passkey.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Entrando…" : "Iniciar sesión"}
      </Button>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />o<span className="bg-border h-px flex-1" />
      </div>

      <Button type="button" variant="outline" onClick={handlePasskey}>
        <Fingerprint className="size-4" />
        Entrar con passkey
      </Button>
    </form>
  );
}
