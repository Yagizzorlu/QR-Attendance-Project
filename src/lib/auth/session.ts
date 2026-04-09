import jwt from "jsonwebtoken";

export type SessionPayload = {
  adminId: string;
  email: string;
};

function getSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set.");
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}
