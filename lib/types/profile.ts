import { z } from "zod";
export const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional().nullable(),
  lastName: z.string().trim().min(1).max(80).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  // optional: name (Better Auth field)
  name: z.string().trim().min(1).max(160).optional().nullable(),
});
