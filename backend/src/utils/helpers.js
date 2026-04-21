import crypto from 'crypto';

/**
 * Generate a masked API key
 * Returns both the full key and the masked version
 */
export function generateApiKey(prefix = 'sk_live') {
  const key = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
  return key;
}

export function maskApiKey(key) {
  if (!key || key.length < 10) return key;
  const prefix = key.substring(0, key.indexOf('_') + 5);
  return `${prefix}${'•'.repeat(24)}`;
}

/**
 * Convert seconds to mm:ss format
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse mm:ss to seconds
 */
export function parseDuration(duration) {
  const parts = duration.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}
