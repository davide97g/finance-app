/**
 * Utility functions for profile management
 */

/**
 * Generate initials from a full name or email
 * - For names: Takes first letter of first name and first letter of last name
 * - For emails: Takes first letter before @ and first letter after @
 * - Dots are treated as word separators
 *
 * @param fullName - User's full name (e.g., "John Doe" or "john.doe")
 * @param email - User's email as fallback (e.g., "john.doe@example.com")
 * @returns Two-letter initials in uppercase
 */
export const generateInitials = (
  fullName?: string | null,
  email?: string | null
): string => {
  // Try full name first
  if (fullName && fullName.trim()) {
    const parts = fullName
      .trim()
      .split(/[\s.]+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      // Take first letter of first part and first letter of last part
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      // Single word with at least 2 characters - take first two letters
      return parts[0].substring(0, 2).toUpperCase();
    } else if (parts[0].length === 1) {
      // Single character - use it twice
      return (parts[0] + parts[0]).toUpperCase();
    }
  }

  // Fallback to email
  if (email && email.trim()) {
    const emailParts = email.split("@");
    if (emailParts.length === 2) {
      const localPart = emailParts[0];
      const domainPart = emailParts[1];

      // Split local part by dots
      const localParts = localPart.split(".").filter(Boolean);

      if (localParts.length >= 2) {
        // Take first letter of first part and first letter of last part
        return (
          localParts[0][0] + localParts[localParts.length - 1][0]
        ).toUpperCase();
      } else if (localParts.length === 1 && localParts[0].length >= 2) {
        // Single part, take first two letters
        return localParts[0].substring(0, 2).toUpperCase();
      } else if (localParts[0].length === 1) {
        // Single character, use domain first letter
        return (localParts[0] + domainPart[0]).toUpperCase();
      }
    }
  }

  // Ultimate fallback
  return "??";
};
