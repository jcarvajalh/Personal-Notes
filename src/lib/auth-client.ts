"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

// Mismo origen que la app; baseURL se infiere del navegador.
export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      // Si el login requiere 2FA, redirige a la pantalla de verificación.
      onTwoFactorRedirect() {
        // Callback fuera del árbol de React (config del cliente): no hay router.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login/2fa";
      },
    }),
    passkeyClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
