"use client";

import { createAuthClient } from "better-auth/react";

// Mismo origen que la app; baseURL se infiere del navegador.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
