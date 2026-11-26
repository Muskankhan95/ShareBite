import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@/types/user";
import { ENV } from "@/lib/config/env";

const JWT_SECRET = ENV.JWT.SECRET;
const key = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Signs a JWT token with user identity and role.
 * Valid for 7 days.
 */
export async function signJWT(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

/**
 * Verifies and decodes a JWT token.
 * Returns payload if valid, null if expired or invalid.
 */
export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}
