/**
 * Admin Configuration & Whitelist (Server-Side Only)
 * Grants administrator privileges based strictly on environment configuration.
 * Never hardcode personal emails or identities in source code.
 */

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return Array.from(new Set(envEmails));
}

export function isUserAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const admins = getAdminEmails();
  return admins.includes(normalized);
}

