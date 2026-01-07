/**
 * Utility functions for generating Revolut payment links.
 */

export interface RevolutLinks {
  web: string;
  app: string;
}

/**
 * Generates both web and app Revolut payment links with pre-filled amount and note.
 *
 * @param username - Revolut username (e.g., "daviden2cg")
 * @param amount - Amount in euros (will be converted to cents for the URL)
 * @param description - Payment note/description
 * @returns Object containing both web and app links
 *
 * @example
 * generateRevolutLinks("daviden2cg", 16.70, "cinema")
 * // Returns: { web: "https://revolut.me/daviden2cg?amount=1670&currency=EUR&note=cinema", app: "revolut://pay?username=daviden2cg&amount=1670&currency=EUR&note=cinema" }
 */
export const generateRevolutLinks = (
  username: string,
  amount: number,
  description: string
): RevolutLinks => {
  // Convert amount to cents (smallest currency unit)
  // Revolut expects amount in cents, e.g., €16.70 = 1670 cents
  const amountInCents = Math.round(amount * 100);

  // Encode description for URL
  const encodedDescription = encodeURIComponent(description);

  // Generate deep link (opens Revolut app if installed)
  const appLink = `revolut://pay?username=${username}&amount=${amountInCents}&currency=EUR&note=${encodedDescription}`;

  // Generate web link (fallback option)
  const webLink = `https://revolut.me/${username}?amount=${amountInCents}&currency=EUR&note=${encodedDescription}`;

  return {
    web: webLink,
    app: appLink,
  };
};

/**
 * Generates a Revolut payment link with pre-filled amount and note.
 * @deprecated Use generateRevolutLinks instead to get both web and app links
 *
 * @param username - Revolut username (e.g., "daviden2cg")
 * @param amount - Amount in euros (will be converted to cents for the URL)
 * @param description - Payment note/description
 * @returns Revolut web link URL
 */
export const generateRevolutLink = (
  username: string,
  amount: number,
  description: string
): string => {
  const links = generateRevolutLinks(username, amount, description);
  return links.web;
};

/**
 * Generates a web-based Revolut link (fallback option).
 * @deprecated Use generateRevolutLinks instead
 *
 * @param username - Revolut username
 * @param amount - Amount in euros (will be converted to cents for the URL)
 * @param description - Payment note/description
 * @returns Revolut web URL
 */
export const generateRevolutWebLink = (
  username: string,
  amount: number,
  description: string
): string => {
  const links = generateRevolutLinks(username, amount, description);
  return links.web;
};

/**
 * Calculates the amount per person when splitting an expense.
 *
 * @param totalAmount - Total amount to split
 * @param numberOfPeople - Number of people to split between
 * @returns Amount per person (rounded to 2 decimal places)
 *
 * @throws Error if numberOfPeople is less than 1
 */
export const calculateAmountPerPerson = (
  totalAmount: number,
  numberOfPeople: number
): number => {
  if (numberOfPeople < 1) {
    throw new Error("Number of people must be at least 1");
  }

  if (totalAmount < 0) {
    throw new Error("Total amount cannot be negative");
  }

  // Round to 2 decimal places
  return Math.round((totalAmount / numberOfPeople) * 100) / 100;
};
