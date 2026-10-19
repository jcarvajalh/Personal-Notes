import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";

// AU-002/AU-003: endpoints de Better Auth (sign-in, sign-up, sign-out, sesión).
export const { GET, POST } = toNextJsHandler(auth);
