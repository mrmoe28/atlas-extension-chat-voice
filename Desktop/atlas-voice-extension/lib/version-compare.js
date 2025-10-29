/**
 * Semantic version comparison utility
 * Compares two semver versions (e.g., "0.2.0", "1.0.0")
 */

/**
 * Compare two semver versions
 * @param {string} v1 - First version (e.g., "0.2.0" or "v0.2.0")
 * @param {string} v2 - Second version (e.g., "0.3.0" or "v0.3.0")
 * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1, v2) {
  // Remove 'v' prefix if present
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');

  const parts1 = clean1.split('.').map(Number);
  const parts2 = clean2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Check if v1 is greater than v2
 */
export function isNewerVersion(v1, v2) {
  return compareVersions(v1, v2) > 0;
}

/**
 * Check if versions are equal
 */
export function isSameVersion(v1, v2) {
  return compareVersions(v1, v2) === 0;
}

/**
 * Validate semver format
 */
export function isValidVersion(version) {
  const cleaned = version.replace(/^v/, '');
  return /^\d+\.\d+\.\d+$/.test(cleaned);
}
