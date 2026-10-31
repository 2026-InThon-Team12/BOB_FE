/** Stable retry fingerprint (not a credential or security hash). */
export function requestDigest(text: string): string {
  const words = [2166136261, 2246822519, 3266489917, 668265263];
  for (let i = 0; i < text.length; i++) for (let j = 0; j < words.length; j++) {
    words[j] = Math.imul(words[j] ^ (text.charCodeAt(i) + j), 16777619);
  }
  return words.map((w) => (w >>> 0).toString(16).padStart(8, '0')).join('');
}
