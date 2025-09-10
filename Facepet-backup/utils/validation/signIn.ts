import { z } from 'zod';

// Define validation schema with zod

export const signInSchema = z.object({
  emailAddress: z.string().email('Invalid email address'),
  password: z.string()
});

export type SignInSchema = z.infer<typeof signInSchema>;
