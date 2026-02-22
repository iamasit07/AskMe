import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be less than 100 characters")
    .trim(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be less than 100 characters")
    .trim(),
});

export const createChatPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim()
    .optional()
    .default("New Chat"),
});

export const updateChatPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  role: z.enum(["user", "assistant", "tool"]).default("user"),
});

export const streamChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "tool"]),
        content: z.string(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .min(1, "At least one message is required"),
});

export const mongoIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

// Type exports for use in controllers
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateChatPageInput = z.infer<typeof createChatPageSchema>;
export type UpdateChatPageInput = z.infer<typeof updateChatPageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type StreamChatInput = z.infer<typeof streamChatSchema>;
