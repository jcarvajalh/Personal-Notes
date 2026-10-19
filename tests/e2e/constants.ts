export const OWNER_EMAIL = (process.env.OWNER_EMAIL ?? "").trim();
// Contraseña del propietario en la rama dev. Debe definirse en .env.local como
// E2E_OWNER_PASSWORD (la cuenta dueña ya existe en esa rama).
export const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "";
export const AUTH_STATE = "tests/e2e/.auth/state.json";
