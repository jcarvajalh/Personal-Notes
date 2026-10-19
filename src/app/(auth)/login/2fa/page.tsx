"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code });
    setLoading(false);
    if (res.error) {
      setError(useBackup ? "Código de recuperación inválido." : "Código incorrecto.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Verificación en dos pasos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {useBackup
            ? "Introduce uno de tus códigos de recuperación."
            : "Introduce el código de 6 dígitos de tu app de autenticación."}
        </p>
      </div>

      <form onSubmit={verify} className="flex flex-col gap-4">
        <Input
          autoFocus
          inputMode={useBackup ? "text" : "numeric"}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={useBackup ? "Código de recuperación" : "123456"}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={!code || loading}>
          {loading ? "Verificando…" : "Verificar"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setUseBackup((v) => !v);
          setCode("");
          setError(null);
        }}
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
      >
        {useBackup ? "Usar la app de autenticación" : "Usar un código de recuperación"}
      </button>
    </main>
  );
}
