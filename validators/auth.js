import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email("Invalid Email Address"),
  password: z.string().min(5, "Min 5 Characters required"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(5, "Min 5 Characters require"),
});
