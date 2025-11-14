import { jwtDecode } from "jwt-decode";

/**
 * Decodes a JWT token and returns the payload
 * @param {string} token - The encoded JWT token
 * @returns {Object} The decoded JWT payload
 * @throws {Error} If the token is invalid
 */
export const decodeJWT = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    throw new Error("Invalid JWT token");
  }
};

/**
 * Decodes a JWT token header
 * @param {string} token - The encoded JWT token
 * @returns {Object} The decoded JWT header
 * @throws {Error} If the token is invalid
 */
export const decodeJWTHeader = (token) => {
  try {
    return jwtDecode(token, { header: true });
  } catch (error) {
    console.error("Failed to decode JWT header:", error);
    throw new Error("Invalid JWT token");
  }
};

/**
 * Extracts specific claims from a JWT token
 * @param {string} token - The encoded JWT token
 * @param {string} claim - The claim key to extract (e.g., 'exp', 'iat', 'sub')
 * @returns {any} The value of the specified claim
 */
export const getJWTClaim = (token, claim) => {
  const decoded = decodeJWT(token);
  return decoded[claim];
};

/**
 * Checks if a JWT token is expired
 * @param {string} token - The encoded JWT token
 * @returns {boolean} True if the token is expired, false otherwise
 */
export const isJWTExpired = (token) => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded.exp) {
      return false; // If no expiration claim, consider it as not expired
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // If decoding fails, consider it as expired
  }
};
