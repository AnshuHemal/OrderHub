"use server";

export async function checkEmailExists(
  email: string,
): Promise<{ exists: boolean; error?: string }> {
  // Bypassed: database access is handled by NestJS backend rather than direct Prisma in Next.js
  return { exists: true };
}
