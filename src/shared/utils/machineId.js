import { machineIdSync } from 'node-machine-id';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Get consistent machine ID using node-machine-id with salt
 * This ensures the same physical machine gets the same ID across runs
 *
 * @param {string} salt - Optional salt to use (defaults to environment variable or file)
 * @returns {Promise<string>} Machine ID (16-character base32)
 */
export async function getConsistentMachineId(salt = null) {
  // Try to get salt from environment
  let saltValue = salt || process.env.MACHINE_ID_SALT;

  // If not provided, try to load from file or generate
  if (!saltValue) {
    const saltFile = path.join(process.env.HOME || process.cwd(), '.9router', 'machine-salt');

    try {
      if (fs.existsSync(saltFile)) {
        saltValue = fs.readFileSync(saltFile, 'utf8').trim();
        console.log('✓ Loaded machine ID salt from file');
      } else {
        // Generate new salt and persist
        saltValue = randomBytes(32).toString('base64');
        fs.mkdirSync(path.dirname(saltFile), { recursive: true, mode: 0o700 });
        fs.writeFileSync(saltFile, saltValue, { mode: 0o600 });
        console.log('✓ Generated and saved new machine ID salt');
      }
    } catch (error) {
      // Fall back to env var requirement
      console.error('❌ Failed to load/generate machine ID salt:', error.message);
      throw new Error(
        'FATAL: MACHINE_ID_SALT environment variable is required, or allow file creation at ~/.9router/machine-salt'
      );
    }
  }

  // Validate salt
  if (!saltValue || saltValue.length < 16) {
    throw new Error('FATAL: Machine ID salt must be at least 16 characters long');
  }
  try {
    const rawMachineId = machineIdSync();
    // Create consistent ID using salt
    const crypto = await import('crypto');
    const hashedMachineId = crypto.createHash('sha256').update(rawMachineId + saltValue).digest('hex');
    // Return only first 16 characters for brevity
    return hashedMachineId.substring(0, 16);
  } catch (error) {
    console.log('Error getting machine ID:', error);
    // Fallback to random ID if node-machine-id fails
    return crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }
}

/**
 * Get raw machine ID without hashing (for debugging purposes)
 * @returns {Promise<string>} Raw machine ID
 */
export async function getRawMachineId() {
  // For server-side, use raw node-machine-id
  try {
    return machineIdSync();
  } catch (error) {
    console.log('Error getting raw machine ID:', error);
    // Fallback to random ID if node-machine-id fails
    return crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }
}

/**
 * Check if we're running in browser or server environment
 * @returns {boolean} True if in browser, false if in server
 */
export function isBrowser() {
  return typeof window !== 'undefined';
}
