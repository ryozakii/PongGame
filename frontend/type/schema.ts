import { z } from "zod"

// Define the schema
export const SignUpSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  re_password: z.string().min(6, "Confirm password must be at least 6 characters long"),
}).refine((data) => data.password === data.re_password, {
  message: "Passwords do not match",
  path: ["re_password"], // Target field to show the error
})

// Zod schema for validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});