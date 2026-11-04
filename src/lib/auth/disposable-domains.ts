/**
 * High-frequency disposable / temporary email domains blocklist.
 * Prevents automated account churn and abuse of the free generation quota.
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Top temporary email providers observed in abuse logs
  "boffweb.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "mailinator.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "fakemailgenerator.com",
  "mohmal.com",
  "mytemp.email",
  "inboxkitten.com",
  "generator.email",
  "crazymailing.com",
  "emailondeck.com",
  "tempail.com",
  "burnermail.io",
  "minuteinbox.com",
  "dropmail.me",
  "nada.ltd",
  "getnada.com",
  "tmail.ws",
  "mailsac.com",
  "crazymail.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "tinemail.com",
]);

/**
 * Checks if an email uses a known disposable email domain.
 * @param email - Target email string
 * @returns true if domain is known disposable, false otherwise
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.trim().split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

