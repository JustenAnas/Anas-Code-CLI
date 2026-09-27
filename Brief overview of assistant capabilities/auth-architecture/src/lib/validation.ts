import { z } from "zod";

export const signupSchema = z.object({ name: z.string().trim().min(1).max(80), email: z.string().email().max(254), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });
export const emailSchema = z.object({ email: z.string().email().max(254) });
export const otpSchema = emailSchema.extend({ otp: z.string().regex(/^\d{6}$/) });
export const resetSchema = z.object({ password: z.string().min(8).max(128) });
export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const badRequest = (message = "Invalid request") => json({ error: message }, 400);
