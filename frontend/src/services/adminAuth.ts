/**
 * Admin sign-in request.
 *
 * NOTE: The backend does not have this endpoint yet. Until
 * POST /api/v1/admin/login exists (and Vite proxies /api to FastAPI),
 * every attempt returns "unavailable" and the form shows that message.
 */
export type AdminCredentials = {
  username: string;
  password: string;
};

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid-credentials" | "unavailable" };

export const ADMIN_LOGIN_ENDPOINT = "/api/v1/admin/login";

export async function signInAdmin(
  credentials: AdminCredentials,
): Promise<SignInResult> {
  try {
    const response = await fetch(ADMIN_LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });
    if (response.ok) return { ok: true };
    if (response.status === 401)
      return { ok: false, reason: "invalid-credentials" };
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
