import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
} from "../lib/jwt.js";
import { AppError } from "../middleware/errorHandler.middleware.js";

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/",
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth", // Refresh token only sent to auth endpoints
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("[AUTH] Signup attempt for:", req.body.email);
    const { email, password, name } = req.body;

    if (!email || typeof email !== "string") {
      throw new AppError("Email is required", 400);
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name?.trim() || null,
      },
    });

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    res.cookie("authToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    console.log("[AUTH] Signup successful for:", user.email);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(
      "[AUTH] Signup failed:",
      error instanceof Error ? error.message : error,
    );
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("[AUTH] Login attempt for:", req.body.email);
    const { email, password } = req.body;

    if (!email || typeof email !== "string") {
      throw new AppError("Email is required", 400);
    }

    if (!password || typeof password !== "string") {
      throw new AppError("Password is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    res.cookie("authToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    console.log("[AUTH] Login successful for:", user.email);
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(
      "[AUTH] Login failed:",
      error instanceof Error ? error.message : error,
    );
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/api/auth",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token not found", 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    res.cookie("authToken", newAccessToken, ACCESS_COOKIE_OPTIONS);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
