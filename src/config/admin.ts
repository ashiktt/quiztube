/**
 * Admin Configuration & Whitelist
 * Grants immediate QuizTube Pro and administrator privileges
 */

export const DEFAULT_ADMIN_EMAILS = [
  'akm007ab@gmail.com',
];

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const all = [...DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase()), ...envEmails];
  return Array.from(new Set(all));
}

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
}
