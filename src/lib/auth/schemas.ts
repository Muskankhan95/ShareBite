import { z } from "zod";

/** Roles a visitor is allowed to self-register as. Admin is never self-assignable. */
export const signupRoles = ["donor", "ngo", "volunteer"] as const;
export type SignupRole = (typeof signupRoles)[number];

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(255, "Email must be under 255 characters");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be under 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .regex(/^[+0-9 ()-]+$/, "Phone number contains invalid characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(100),
    email,
    phone,
    password,
    confirmPassword: z.string(),
    role: z.enum(signupRoles),
    organizationName: z.string().trim().max(150).optional().or(z.literal("")),
    organizationAddress: z.string().trim().max(300).optional().or(z.literal("")),
    organizationContactPerson: z.string().trim().max(100).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .superRefine((v, ctx) => {
    if (v.role === "ngo") {
      if (!v.organizationName) {
        ctx.addIssue({ code: "custom", path: ["organizationName"], message: "Organization name is required" });
      }
      if (!v.organizationAddress) {
        ctx.addIssue({ code: "custom", path: ["organizationAddress"], message: "Organization address is required" });
      }
      if (!v.organizationContactPerson) {
        ctx.addIssue({
          code: "custom",
          path: ["organizationContactPerson"],
          message: "Contact person is required",
        });
      }
    }
    if (v.role === "volunteer" && !v.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Address / location is required" });
    }
  });

export type RegisterValues = z.infer<typeof registerSchema>;
