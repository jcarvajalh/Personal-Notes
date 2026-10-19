"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { SecuritySettings } from "@/components/settings/security-settings";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const options = [
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
    { value: "system", label: "Sistema" },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-(--content-max-width) px-12 py-16">
      <h1 className="font-heading mb-8 text-3xl font-semibold tracking-tight">Ajustes</h1>

      <section className="mb-10">
        <h2 className="mb-1 text-base font-medium">Apariencia</h2>
        <p className="text-muted-foreground mb-3 text-sm">Tema de la interfaz (SE-001).</p>
        <div className="flex gap-2">
          {options.map((o) => (
            <Button
              key={o.value}
              variant={mounted && theme === o.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium">Seguridad (SE-006)</h2>
        <SecuritySettings />
      </section>
    </div>
  );
}
