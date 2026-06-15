import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "stackshack_nutrition_secret_2026_secure"
);
const SESSION_COOKIE_NAME = "stackshack_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export async function encrypt(payload: SessionUser) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function decrypt(input: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(input, SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionUser;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await encrypt(user);
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getGuestIdCookie(): string {
  // We can generate or retrieve a unique guest cart ID stored in a cookie
  // Since we need to call it inside server context:
  let guestId = "";
  try {
    const cookieStore = cookies() as any; // Next.js cookies can be accessed synchronously in middleware or some places
    // In server actions/page, we can fetch synchronously
    // But since Next.js cookies returns Promise in App Router, we'll write an async helper for it.
  } catch(e) {}
  return guestId;
}

export async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get("stackshack_guest_id")?.value;
  if (!guestId) {
    guestId = "guest-" + Math.random().toString(36).substring(2, 15);
    cookieStore.set({
      name: "stackshack_guest_id",
      value: guestId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  return guestId;
}
