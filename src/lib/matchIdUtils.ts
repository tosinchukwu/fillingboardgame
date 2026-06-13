/**
 * Match ID utility functions for numeric-only match ID handling
 */

/**
 * Determine match type (casual or official) based on public/private setting
 * @param isCasual - Whether this is a casual match (private)
 * @returns 'casual' or 'official'
 */
export function getMatchType(isCasual: boolean): 'casual' | 'official' {
  return isCasual ? 'casual' : 'official';
}

/**
 * Format numeric match ID for display
 * @param numericId - The numeric match ID (e.g., "1748456789")
 * @returns Formatted ID string
 */
export function formatMatchId(numericId: string): string {
  return numericId.toUpperCase();
}

/**
 * Parse numeric match ID from user input
 * @param input - User input (may have spaces or formatting)
 * @returns Cleaned numeric ID
 */
export function parseMatchId(input: string): string {
  return input.replace(/\s+/g, '').toLowerCase();
}

/**
 * Validate match ID format (numeric digits, any length)
 * Accepts numeric match IDs like "1748456789"
 * @param id - Match ID to validate
 * @returns true if valid numeric match ID
 */
export function isValidMatchId(id: string): boolean {
  const cleanId = parseMatchId(id);
  // Accept numeric IDs: digits only, at least 1 digit
  return /^\d+$/.test(cleanId) && cleanId.length > 0;
}
