"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient, useSession } from "@/lib/auth-client";

export function SecuritySettings() {
  const { data: session } = useSession();
  const enabled = Boolean(session?.user?.twoFactorEnabled);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="flex gap-3">
          <ShieldCheck className="text-brand mt-0.5 size-5" />
          <div>
            <h3 className="text-sm font-medium">Verificación en dos pasos (2FA)</h3>
            <p className="text-muted-foreground text-sm">
              {enabled
                ? "Activa. Pedimos un código TOTP al iniciar sesión."
                : "Añade un código temporal (TOTP) además de tu contraseña."}
            </p>
          </div>
        </div>
        {enabled ? <DisableTwoFactor /> : <EnableTwoFactor />}
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="flex gap-3">
          <Fingerprint className="text-brand mt-0.5 size-5" />
          <div>
            <h3 className="text-sm font-medium">Passkeys</h3>
            <p className="text-muted-foreground text-sm">
              Inicia sesión con huella, Face ID o Windows Hello.
            </p>
          </div>
        </div>
        <AddPasskey />
      </div>
    </div>
  );
}

function EnableTwoFactor() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"password" | "verify">("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("password");
    setPassword("");
    setCode("");
    setQr(null);
    setBackupCodes([]);
  };

  const start = async () => {
    setLoading(true);
    const { data, error } = await authClient.twoFactor.enable({ password });
    setLoading(false);
    if (error || !data) {
      toast.error(error?.message ?? "No se pudo activar. ¿Contraseña correcta?");
      return;
    }
    if (data.method !== "totp") {
      toast.error("El método TOTP no está disponible.");
      return;
    }
    setBackupCodes(data.backupCodes ?? []);
    setQr(await QRCode.toDataURL(data.totpURI));
    setStep("verify");
  };

  const verify = async () => {
    setLoading(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setLoading(false);
    if (error) {
      toast.error("Código incorrecto.");
      return;
    }
    toast.success("Verificación en dos pasos activada.");
    setOpen(false);
    reset();
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        Activar
      </Button>
      <DialogContent>
        {step === "password" ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirma tu contraseña</DialogTitle>
              <DialogDescription>Necesario para activar el 2FA.</DialogDescription>
            </DialogHeader>
            <Input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              onKeyDown={(e) => e.key === "Enter" && password && start()}
            />
            <DialogFooter>
              <Button onClick={start} disabled={!password || loading}>
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Escanea el código</DialogTitle>
              <DialogDescription>
                Usa tu app de autenticación y luego introduce el código generado.
              </DialogDescription>
            </DialogHeader>
            {qr && (
              <Image
                src={qr}
                alt="Código QR TOTP"
                width={176}
                height={176}
                className="mx-auto rounded-md bg-white p-2"
                unoptimized
              />
            )}
            {backupCodes.length > 0 && (
              <div className="bg-muted/40 rounded-md border p-3">
                <p className="mb-1 text-xs font-medium">Códigos de recuperación (guárdalos):</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                  {backupCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            )}
            <Input
              autoFocus
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              onKeyDown={(e) => e.key === "Enter" && code && verify()}
            />
            <DialogFooter>
              <Button onClick={verify} disabled={!code || loading}>
                Verificar y activar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisableTwoFactor() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const disable = async () => {
    setLoading(true);
    const { error } = await authClient.twoFactor.disable({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "No se pudo desactivar.");
      return;
    }
    toast.success("2FA desactivado.");
    setOpen(false);
    setPassword("");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Desactivar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desactivar 2FA</DialogTitle>
          <DialogDescription>Confirma tu contraseña para continuar.</DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          onKeyDown={(e) => e.key === "Enter" && password && disable()}
        />
        <DialogFooter>
          <Button variant="destructive" onClick={disable} disabled={!password || loading}>
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddPasskey() {
  const [loading, setLoading] = useState(false);

  const add = async () => {
    setLoading(true);
    const res = await authClient.passkey.addPasskey({ name: "Mi dispositivo" });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error.message ?? "No se pudo registrar la passkey.");
      return;
    }
    toast.success("Passkey registrada.");
  };

  return (
    <Button size="sm" variant="outline" onClick={add} disabled={loading}>
      Añadir passkey
    </Button>
  );
}
