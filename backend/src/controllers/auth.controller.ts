import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
} from "../lib/jwt.js";
import { AppError } from "../middleware/errorHandler.middleware.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


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
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
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

    if (!user.password || !await bcrypt.compare(password, user.password)) {
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
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
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
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
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
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      throw new AppError("Google credential is required", 400);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new AppError("Google Client ID not configured on server", 500);
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("Invalid Google token", 400);
    }

    const { email, name, picture, sub: googleId } = payload;
    if (!email) {
      throw new AppError("Email is not available from Google", 400);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          googleId,
          avatar: picture || null,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    res.cookie("authToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       throw new AppError("Unauthorized", 401);
    }
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    // Explicit image-only check (in addition to multer's fileFilter)
    if (!req.file.mimetype.startsWith("image/")) {
      throw new AppError("Not an image! Please upload only images.", 400);
    }

    // Explicit 5MB size check (in addition to multer's limits)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (req.file.size > MAX_SIZE) {
      throw new AppError("File too large. Maximum size is 5MB.", 400);
    }

    // Convert buffer to base64 data URI
    const base64 = req.file.buffer.toString("base64");
    const avatarDataUri = `data:${req.file.mimetype};base64,${base64}`;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarDataUri }
    });
    
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  } catch(error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       throw new AppError("Unauthorized", 401);
    }
    
    const { name } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name || null }
    });
    
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  } catch(error) {
    next(error);
  }
};
