import "server-only";

/**
 * Super admin sign-in. Works with no environment variables (e.g. a plain Vercel deploy): the defaults below are
 * the email and a salted scrypt hash of the password — never the password itself. Setting ADMIN_EMAIL /
 * ADMIN_PASSWORD_HASH overrides them, and a password changed in Settings (stored hashed) wins over both.
 */
export const adminEmail = (process.env.ADMIN_EMAIL || "kandari.super@gmail.com").trim().toLowerCase();

export const adminPasswordHash =
  process.env.ADMIN_PASSWORD_HASH || "scrypt:d6a9a397d1acaea60692b974d8da926d:a18b552ae0d311d8a5e9a3e9b4f3160f011ba2a504d8b702244bb99c17d97e14";
