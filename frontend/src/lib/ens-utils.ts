/**
 * Simple ENS subdomain generation from username
 */

/**
 * Generate ENS subdomain from username and business domain
 * @param username - The user's username from their profile
 * @param businessDomain - The business ENS domain (e.g., "joescoffee.eth")
 * @returns Full ENS name (e.g., "sarah.joescoffee.eth")
 */
export function generateENSSubdomain(username: string, businessDomain: string): string {
  // Username should already be sanitized when stored in the database
  // Just combine with business domain
  return `${username}.${businessDomain}`
}
