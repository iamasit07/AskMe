import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "123456";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "24h";

export interface jwtPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: jwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): jwtPayload {
  return jwt.verify(token, JWT_SECRET) as jwtPayload;
}
